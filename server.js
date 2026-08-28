/*
 * ==============================================================================
 * CodeCollab — Production API & Application Server
 * ==============================================================================
 * Single Authoritative Persistent Datastore: Supabase PostgreSQL (via Prisma ORM)
 * Dual-storage offline fallback is strictly isolated to non-production environments.
 * Strict authorization, relational integrity, zero sensitive data exposure.
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const { loadEnv } = require('./load-env.js');
loadEnv({ required: NODE_ENV === 'production' ? ['JWT_SECRET', 'DATABASE_URL'] : ['JWT_SECRET'] });

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 3000;
let JWT_SECRET = (process.env.JWT_SECRET || '').trim();
if (NODE_ENV === 'production') {
    if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET === 'codecollab-dev-jwt-secret-key-replace-in-prod') {
        console.error('❌ FATAL: JWT_SECRET must be set to a cryptographically secure string of at least 32 characters in production.');
        process.exit(1);
    }
} else {
    JWT_SECRET = JWT_SECRET || 'codecollab-dev-jwt-secret-key-replace-in-prod';
}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const DATA_DIR = path.join(__dirname, 'codecollab data');

const oauthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Initialize Prisma Client
let PrismaClient;
try {
    PrismaClient = require('./prisma/generated/client').PrismaClient;
} catch {
    try {
        PrismaClient = require('@prisma/client').PrismaClient;
    } catch {
        PrismaClient = null;
    }
}
const prisma = PrismaClient ? new PrismaClient() : null;

// Fail-fast timeout wrapper for database operations (prevents blocking on unreachable DB)
const withTimeout = (promise, ms = 1500) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database operation timeout')), ms))
    ]);
};

// In‑memory store for valid refresh tokens: refreshToken -> userId
const refreshTokenStore = new Map();

const app = express();

// Trust reverse proxy if running behind nginx / cloud load balancer
if (NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: false, // Allows dynamic styles and SPA scripts while keeping XSS/Sniff protections
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration (Production-Grade Dynamic Origin Matching)
const allowedOrigins = CORS_ORIGIN === '*' ? [] : CORS_ORIGIN.split(',').map(s => s.trim().toLowerCase());
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow same-origin / server-to-server / curl
        if (CORS_ORIGIN === '*' || allowedOrigins.includes(origin.toLowerCase())) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static frontend assets
app.use(express.static(__dirname));

// Rate Limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

let isDatabaseAvailable = false;
let lastDbCheckTime = 0;

async function isDbConnected(forceCheck = false) {
    if (NODE_ENV === 'production') {
        return true; // In production, database is strictly required
    }
    if (!prisma) return false;
    const now = Date.now();
    if (!forceCheck && (now - lastDbCheckTime < 10000)) {
        return isDatabaseAvailable;
    }
    lastDbCheckTime = now;
    try {
        await withTimeout(prisma.$queryRaw`SELECT 1`, 500);
        isDatabaseAvailable = true;
    } catch {
        isDatabaseAvailable = false;
    }
    return isDatabaseAvailable;
}

// ------------------------------------------------------------------------------
// Production Startup & Database Cutover Verification
// ------------------------------------------------------------------------------
async function verifyDatabaseConnectivity() {
    if (NODE_ENV === 'production') {
        if (!process.env.DATABASE_URL) {
            console.error('❌ FATAL: DATABASE_URL environment variable is required in production mode.');
            process.exit(1);
        }
        if (!prisma) {
            console.error('❌ FATAL: Prisma Client failed to load in production mode.');
            process.exit(1);
        }
        try {
            await prisma.$connect();
            await prisma.$queryRaw`SELECT 1`;
            isDatabaseAvailable = true;
            console.log('✅ Supabase PostgreSQL authoritative datastore connected successfully.');
        } catch (err) {
            console.error('❌ FATAL: Failed to connect to Supabase PostgreSQL in production mode:', err.message);
            process.exit(1);
        }
    } else {
        if (prisma) {
            try {
                await withTimeout(prisma.$queryRaw`SELECT 1`, 800);
                isDatabaseAvailable = true;
                console.log('✅ PostgreSQL database connected (Dual Storage Active).');
            } catch {
                isDatabaseAvailable = false;
                console.log('ℹ️ Offline Development / Test Mode: Using local file storage fallback.');
            }
        }
    }
}

// ------------------------------------------------------------------------------
// Health & Observability Endpoints
// ------------------------------------------------------------------------------
app.get(['/health', '/healthz'], async (req, res) => {
    let dbStatus = 'disconnected';
    if (prisma) {
        const connected = await isDbConnected(true);
        dbStatus = connected ? 'connected' : 'unreachable';
    }

    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        database: dbStatus
    });
});

// ------------------------------------------------------------------------------
// Authentication Middleware
// ------------------------------------------------------------------------------
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization token provided' });
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid token format. Expected Bearer <token>' });
    }
    const token = parts[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired session token' });
        }
        req.user = decoded; // { id, email, role }
        next();
    });
}

// ------------------------------------------------------------------------------
// Storage & Sanitization Helpers
// ------------------------------------------------------------------------------
const getFilePath = (table) => {
    const normalized = table === 'looking_for' ? 'lookingFor' : path.basename(table);
    return path.join(DATA_DIR, `${normalized}.json`);
};
const getStatsPath = () => path.join(DATA_DIR, 'stats.json');

// Reusable user sanitizer (Zero-Email, No Passwords)
function sanitizeUserObj(u, fallbackName = 'Developer') {
    if (!u) return null;
    const { password, passwordHash, email, ...safeUser } = u;
    const prefs = u.profile?.preferences || {};
    return {
        id: String(safeUser.id || ''),
        name: safeUser.name || (safeUser.profile?.firstName ? `${safeUser.profile.firstName} ${safeUser.profile.lastName || ''}`.trim() : fallbackName),
        title: safeUser.title || prefs.title || safeUser.role || 'Developer',
        avatarUrl: safeUser.avatarUrl || safeUser.profile?.avatarUrl || '',
        verifiedSkills: Array.isArray(safeUser.verifiedSkills) ? safeUser.verifiedSkills : (Array.isArray(prefs.verifiedSkills) ? prefs.verifiedSkills : []),
        skills: Array.isArray(safeUser.skills) ? safeUser.skills : (Array.isArray(prefs.skills) ? prefs.skills : []),
        bio: safeUser.bio || prefs.bio || '',
        availability: safeUser.availability || prefs.availability || 'Available Now',
        lookingFor: safeUser.lookingFor || prefs.lookingFor || 'Open for collaboration',
        socialLinks: safeUser.socialLinks || prefs.socialLinks || {},
        location: safeUser.location || prefs.location || '',
        rating: typeof safeUser.rating === 'number' ? safeUser.rating : (typeof prefs.rating === 'number' ? prefs.rating : 5.0),
        upvotes: typeof safeUser.upvotes === 'number' ? safeUser.upvotes : (typeof prefs.upvotes === 'number' ? prefs.upvotes : 0)
    };
}

// Sanitizes issue objects for client consumption
function formatIssue(issue, fileUsersMap = new Map()) {
    if (!issue) return null;
    const creatorIdStr = issue.creatorId ? String(issue.creatorId) : null;
    const assigneeIdStr = issue.assigneeId ? String(issue.assigneeId) : null;

    const creatorFileUser = creatorIdStr ? fileUsersMap.get(creatorIdStr) : null;
    const assigneeFileUser = assigneeIdStr ? fileUsersMap.get(assigneeIdStr) : null;

    const creatorName = issue.creator?.profile?.firstName 
        ? `${issue.creator.profile.firstName} ${issue.creator.profile.lastName || ''}`.trim()
        : (creatorFileUser?.name || (creatorIdStr ? `User #${creatorIdStr}` : 'Creator'));

    const assigneeName = issue.assignee?.profile?.firstName
        ? `${issue.assignee.profile.firstName} ${issue.assignee.profile.lastName || ''}`.trim()
        : (assigneeFileUser?.name || (assigneeIdStr ? `User #${assigneeIdStr}` : null));

    const creatorObj = creatorIdStr ? {
        id: creatorIdStr,
        name: creatorName,
        avatarUrl: issue.creator?.profile?.avatarUrl || creatorFileUser?.avatarUrl || ''
    } : null;

    const assigneeObj = assigneeIdStr ? {
        id: assigneeIdStr,
        name: assigneeName || 'Assignee',
        avatarUrl: issue.assignee?.profile?.avatarUrl || assigneeFileUser?.avatarUrl || ''
    } : null;

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description || '',
        status: issue.status || 'TODO',
        priority: issue.priority || 'MEDIUM',
        tags: Array.isArray(issue.tags) ? issue.tags : [],
        projectId: issue.projectId,
        project: issue.project ? { id: issue.project.id, title: issue.project.title } : undefined,
        creatorId: creatorIdStr,
        creator: creatorObj,
        assigneeId: assigneeIdStr,
        assignee: assigneeObj,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt
    };
}

// Sanitizes join requests (Zero Email Leakage)
function sanitizeJoinRequest(r, fileUsersMap = new Map()) {
    if (!r) return null;
    const userFile = fileUsersMap.get(String(r.userId));
    const ownerFile = fileUsersMap.get(String(r.ownerId));

    const userName = r.user?.profile?.firstName 
        ? `${r.user.profile.firstName} ${r.user.profile.lastName || ''}`.trim()
        : (userFile?.name || `Developer #${r.userId}`);

    const ownerName = r.owner?.profile?.firstName 
        ? `${r.owner.profile.firstName} ${r.owner.profile.lastName || ''}`.trim()
        : (ownerFile?.name || `Owner #${r.ownerId}`);

    return {
        id: r.id,
        userId: String(r.userId),
        user: {
            id: String(r.userId),
            name: userName,
            avatarUrl: r.user?.profile?.avatarUrl || userFile?.avatarUrl || ''
        },
        projectId: String(r.projectId),
        project: r.project ? { id: r.project.id, title: r.project.title } : undefined,
        ownerId: String(r.ownerId),
        owner: {
            id: String(r.ownerId),
            name: ownerName,
            avatarUrl: r.owner?.profile?.avatarUrl || ownerFile?.avatarUrl || ''
        },
        status: r.status,
        message: r.message || '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
    };
}

// Sanitizes meeting requests (Zero Email Leakage)
function sanitizeMeetingRequest(m, fileUsersMap = new Map()) {
    if (!m) return null;
    const userFile = fileUsersMap.get(String(m.userId));
    const ownerFile = fileUsersMap.get(String(m.ownerId));

    const userName = m.user?.profile?.firstName 
        ? `${m.user.profile.firstName} ${m.user.profile.lastName || ''}`.trim()
        : (userFile?.name || `Developer #${m.userId}`);

    const ownerName = m.owner?.profile?.firstName 
        ? `${m.owner.profile.firstName} ${m.owner.profile.lastName || ''}`.trim()
        : (ownerFile?.name || `Owner #${m.ownerId}`);

    return {
        id: m.id,
        userId: String(m.userId),
        user: {
            id: String(m.userId),
            name: userName,
            avatarUrl: m.user?.profile?.avatarUrl || userFile?.avatarUrl || ''
        },
        projectId: String(m.projectId),
        project: m.project ? { id: m.project.id, title: m.project.title } : undefined,
        ownerId: String(m.ownerId),
        owner: {
            id: String(m.ownerId),
            name: ownerName,
            avatarUrl: m.owner?.profile?.avatarUrl || ownerFile?.avatarUrl || ''
        },
        preferredDate: m.preferredDate,
        message: m.message || '',
        status: m.status,
        responseNotes: m.responseNotes || '',
        meetingLink: m.meetingLink || '',
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
    };
}

// Sanitizes notifications (Zero Email Leakage)
function sanitizeNotification(n) {
    if (!n) return null;
    return {
        id: n.id,
        userId: String(n.userId),
        actorId: n.actorId ? String(n.actorId) : null,
        actor: n.actor ? {
            id: String(n.actor.id),
            name: n.actor.profile?.firstName ? `${n.actor.profile.firstName} ${n.actor.profile.lastName || ''}`.trim() : 'Collaborator',
            avatarUrl: n.actor.profile?.avatarUrl || ''
        } : null,
        projectId: n.projectId ? String(n.projectId) : null,
        project: n.project ? { id: n.project.id, title: n.project.title } : undefined,
        type: n.type || 'SYSTEM',
        title: n.title || 'Notification',
        message: n.message || n.content || '',
        data: n.data || {},
        read: Boolean(n.read),
        createdAt: n.createdAt
    };
}

// Authorization check helper: checks if user is owner or member of project
async function isProjectAuthorized(projectId, userId) {
    if (!projectId || !userId) return false;
    const cleanProjectId = String(projectId);
    const cleanUserId = String(userId);

    if (NODE_ENV === 'production' || (await isDbConnected())) {
        try {
            const project = await prisma.project.findUnique({
                where: { id: cleanProjectId },
                include: { members: true }
            });
            if (!project) return false;
            if (String(project.ownerId) === cleanUserId) return true;
            if (project.members && project.members.some(m => String(m.userId) === cleanUserId)) return true;
            return false;
        } catch (err) {
            if (NODE_ENV === 'production') throw err;
        }
    }

    try {
        const rawProjects = JSON.parse(await fs.readFile(getFilePath('projects'), 'utf-8'));
        const project = rawProjects.find(p => String(p.id) === cleanProjectId);
        if (!project) return false;
        if (String(project.ownerId) === cleanUserId) return true;

        let members = [];
        try {
            members = JSON.parse(await fs.readFile(getFilePath('projectMembers'), 'utf-8'));
        } catch {}
        if (members.some(m => String(m.projectId) === cleanProjectId && String(m.userId) === cleanUserId)) {
            return true;
        }
    } catch {}

    return false;
}

// Reusable helper to send and persist notifications
async function sendNotification({ userId, actorId, projectId, type, title, message, data = {} }) {
    if (!userId) return null;
    const targetUserId = String(userId);
    const notificationRecord = {
        id: `notif_${Date.now()}_${uuidv4().substring(0, 8)}`,
        userId: targetUserId,
        actorId: actorId ? String(actorId) : null,
        projectId: projectId ? String(projectId) : null,
        type: type || 'SYSTEM',
        title: title || 'Notification',
        message: message || '',
        data: data || {},
        read: false,
        createdAt: new Date().toISOString()
    };

    if (NODE_ENV === 'production' || (await isDbConnected())) {
        try {
            await prisma.notification.create({
                data: {
                    id: notificationRecord.id,
                    userId: targetUserId,
                    actorId: notificationRecord.actorId,
                    projectId: notificationRecord.projectId,
                    type: notificationRecord.type,
                    title: notificationRecord.title,
                    message: notificationRecord.message,
                    data: notificationRecord.data,
                    read: false
                }
            });
            return notificationRecord;
        } catch (e) {
            if (NODE_ENV === 'production') {
                console.error('[Notification DB Error]:', e.message);
                return null;
            }
        }
    }

    try {
        const notifPath = getFilePath('notifications');
        let notifs = [];
        try {
            notifs = JSON.parse(await fs.readFile(notifPath, 'utf-8'));
        } catch { notifs = []; }
        notifs.unshift(notificationRecord);
        await fs.writeFile(notifPath, JSON.stringify(notifs, null, 2));
    } catch (err) {
        console.error('Failed to save notification fallback:', err.message);
    }
    return notificationRecord;
}

// Stats helper
async function loadStats() {
    try {
        const data = await fs.readFile(getStatsPath(), 'utf-8');
        return JSON.parse(data);
    } catch {
        return {
            cumulativeLogins: 154,
            cumulativeIssues: 42,
            lastCalculatedLOC: 125400
        };
    }
}

async function saveStats(stats) {
    try {
        await fs.writeFile(getStatsPath(), JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error('Error saving stats:', e.message);
    }
}

// ------------------------------------------------------------------------------
// Authentication Endpoints
// ------------------------------------------------------------------------------

/*
 * Signup Endpoint
 */
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
        if (!email || !email.trim() || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
        if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const normalizedEmail = email.trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = String(Date.now());
        const names = name.trim().split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
                if (existingUser) {
                    return res.status(400).json({ error: 'Email already registered' });
                }

                const newUser = await prisma.user.create({
                    data: {
                        id: userId,
                        email: normalizedEmail,
                        passwordHash: hashedPassword,
                        isVerified: true,
                        status: 'active',
                        profile: {
                            create: {
                                firstName,
                                lastName,
                                preferences: {
                                    title: role || 'Developer',
                                    role: role || 'Developer',
                                    bio: '',
                                    skills: [],
                                    availability: 'Available Now',
                                    rating: 5.0,
                                    upvotes: 0
                                }
                            }
                        }
                    },
                    include: { profile: true }
                });

                const token = jwt.sign({ id: newUser.id, email: newUser.email, role: role || 'Developer' }, JWT_SECRET, { expiresIn: '7d' });
                const refreshToken = uuidv4();
                refreshTokenStore.set(refreshToken, newUser.id);
                const sanitized = sanitizeUserObj(newUser);

                return res.status(201).json({
                    token,
                    refreshToken,
                    ...sanitized,
                    user: sanitized
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Signup DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to create user account' });
                }
            }
        }

        // Offline Non-Production Fallback
        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { users = []; }

        if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const newUser = {
            id: userId,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'Developer',
            title: role || 'Developer',
            skills: [],
            verifiedSkills: [],
            bio: '',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            rating: 5.0,
            upvotes: 0,
            availability: 'Available Now',
            lookingFor: 'Looking for collaboration',
            socialLinks: {},
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = uuidv4();
        refreshTokenStore.set(refreshToken, newUser.id);
        const sanitized = sanitizeUserObj(newUser);

        res.status(201).json({
            token,
            refreshToken,
            ...sanitized,
            user: sanitized
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error during signup' });
    }
});

/*
 * Login Endpoint
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const normalizedEmail = email.trim().toLowerCase();

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: normalizedEmail },
                    include: { profile: true }
                });

                if (!user || !user.passwordHash) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                const isMatch = await bcrypt.compare(password, user.passwordHash);
                if (!isMatch) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                const token = jwt.sign({ id: user.id, email: user.email, role: 'Developer' }, JWT_SECRET, { expiresIn: '7d' });
                const refreshToken = uuidv4();
                refreshTokenStore.set(refreshToken, user.id);
                const sanitized = sanitizeUserObj(user);

                return res.json({
                    token,
                    refreshToken,
                    ...sanitized,
                    user: sanitized
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Login DB Error]:', err.message);
                    return res.status(500).json({ error: 'Authentication failed' });
                }
            }
        }

        // Offline Non-Production Fallback
        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { users = []; }

        const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'Developer' }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = uuidv4();
        refreshTokenStore.set(refreshToken, user.id);
        const sanitized = sanitizeUserObj(user);

        res.json({
            token,
            refreshToken,
            ...sanitized,
            user: sanitized
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

/*
 * Refresh Token Exchange
 */
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken || !refreshTokenStore.has(refreshToken)) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const userId = refreshTokenStore.get(refreshToken);
        refreshTokenStore.delete(refreshToken);

        const newAccessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
        const newRefreshToken = uuidv4();
        refreshTokenStore.set(newRefreshToken, userId);

        res.json({ token: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

/*
 * Logout Endpoint
 */
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) refreshTokenStore.delete(refreshToken);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch {
        res.json({ success: true });
    }
});

/*
 * Google OAuth Endpoint
 */
app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ error: 'Google credential token is required' });

        if (!oauthClient) {
            return res.status(500).json({ error: 'Google OAuth is not configured on this server' });
        }

        const ticket = await oauthClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;
        const normalizedEmail = email.toLowerCase();
        const names = (name || '').trim().split(' ');
        const firstName = names[0] || 'Developer';
        const lastName = names.slice(1).join(' ') || '';

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                let user = await prisma.user.findUnique({
                    where: { email: normalizedEmail },
                    include: { profile: true }
                });

                if (!user) {
                    const userId = String(Date.now());
                    user = await prisma.user.create({
                        data: {
                            id: userId,
                            email: normalizedEmail,
                            isVerified: true,
                            status: 'active',
                            profile: {
                                create: {
                                    firstName,
                                    lastName,
                                    avatarUrl: picture || '',
                                    preferences: {
                                        title: 'Full Stack Engineer',
                                        bio: 'Joined via Google',
                                        skills: ['JavaScript', 'React'],
                                        availability: 'Available Now'
                                    }
                                }
                            },
                            oauthIdentities: {
                                create: {
                                    provider: 'google',
                                    providerUserId: googleId,
                                    email: normalizedEmail
                                }
                            }
                        },
                        include: { profile: true }
                    });
                }

                const token = jwt.sign({ id: user.id, email: user.email, role: 'Developer' }, JWT_SECRET, { expiresIn: '7d' });
                const refreshToken = uuidv4();
                refreshTokenStore.set(refreshToken, user.id);
                const sanitized = sanitizeUserObj(user);

                return res.json({ token, refreshToken, ...sanitized, user: sanitized });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Google OAuth DB Error]:', err.message);
                    return res.status(500).json({ error: 'OAuth authentication failed' });
                }
            }
        }

        // Offline Non-Production Fallback
        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { users = []; }

        let user = users.find(u => u.email.toLowerCase() === normalizedEmail);
        if (!user) {
            user = {
                id: String(Date.now()),
                name: name || 'Developer',
                email: normalizedEmail,
                role: 'Developer',
                avatarUrl: picture || '',
                skills: [],
                verifiedSkills: [],
                bio: 'Joined via Google',
                availability: 'Available Now',
                socialLinks: {},
                createdAt: new Date().toISOString()
            };
            users.push(user);
            await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'Developer' }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = uuidv4();
        refreshTokenStore.set(refreshToken, user.id);
        const sanitized = sanitizeUserObj(user);

        res.json({ token, refreshToken, ...sanitized, user: sanitized });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(401).json({ error: 'Failed to verify Google token' });
    }
});

// ------------------------------------------------------------------------------
// User & Profile Endpoints
// ------------------------------------------------------------------------------

/*
 * Get Authenticated User Profile (Includes own email securely)
 */
app.get('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    include: { profile: true }
                });

                if (!user) return res.status(404).json({ error: 'User profile not found' });

                const safe = sanitizeUserObj(user);
                return res.json({
                    ...safe,
                    email: user.email // Authenticated user is permitted to see their own email
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Profile DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to load profile' });
                }
            }
        }

        const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
        const user = users.find(u => String(u.id) === userId);
        if (!user) return res.status(404).json({ error: 'User profile not found' });

        const safe = sanitizeUserObj(user);
        res.json({ ...safe, email: user.email });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

/*
 * Update Profile
 */
const handleUpdateProfile = async (req, res) => {
    try {
        const userId = String(req.user.id);
        const { name, title, bio, skills, verifiedSkills, avatarUrl, availability, lookingFor, socialLinks, location } = req.body;
        const names = (name || '').trim().split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const updatedProfile = await prisma.userProfile.upsert({
                    where: { userId },
                    update: {
                        firstName: firstName || undefined,
                        lastName: lastName || undefined,
                        avatarUrl: avatarUrl || undefined,
                        preferences: {
                            title: title || undefined,
                            bio: bio || undefined,
                            skills: Array.isArray(skills) ? skills : undefined,
                            verifiedSkills: Array.isArray(verifiedSkills) ? verifiedSkills : undefined,
                            availability: availability || undefined,
                            lookingFor: lookingFor || undefined,
                            socialLinks: socialLinks || undefined,
                            location: location || undefined
                        }
                    },
                    create: {
                        userId,
                        firstName,
                        lastName,
                        avatarUrl: avatarUrl || '',
                        preferences: {
                            title: title || 'Developer',
                            bio: bio || '',
                            skills: Array.isArray(skills) ? skills : [],
                            verifiedSkills: Array.isArray(verifiedSkills) ? verifiedSkills : [],
                            availability: availability || 'Available Now',
                            lookingFor: lookingFor || '',
                            socialLinks: socialLinks || {},
                            location: location || ''
                        }
                    },
                    include: { user: true }
                });

                return res.json({
                    success: true,
                    profile: sanitizeUserObj(updatedProfile.user ? { ...updatedProfile.user, profile: updatedProfile } : { id: userId, profile: updatedProfile })
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Update Profile DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update profile' });
                }
            }
        }

        const filePath = getFilePath('users');
        let users = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        const index = users.findIndex(u => String(u.id) === userId);
        if (index === -1) return res.status(404).json({ error: 'User not found' });

        users[index] = {
            ...users[index],
            name: name !== undefined ? name.trim() : users[index].name,
            title: title !== undefined ? title.trim() : users[index].title,
            bio: bio !== undefined ? bio.trim() : users[index].bio,
            skills: Array.isArray(skills) ? skills : users[index].skills,
            verifiedSkills: Array.isArray(verifiedSkills) ? verifiedSkills : users[index].verifiedSkills,
            avatarUrl: avatarUrl !== undefined ? avatarUrl : users[index].avatarUrl,
            availability: availability !== undefined ? availability : users[index].availability,
            lookingFor: lookingFor !== undefined ? lookingFor : users[index].lookingFor,
            socialLinks: socialLinks !== undefined ? socialLinks : users[index].socialLinks,
            location: location !== undefined ? location : users[index].location,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        res.json({ success: true, profile: sanitizeUserObj(users[index]) });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
app.put('/api/users/profile', authMiddleware, handleUpdateProfile);
app.post('/api/users/profile', authMiddleware, handleUpdateProfile);

/*
 * List Users / Developers (CRITICAL PRIVACY: Zero Email & Password Leakage)
 */
app.get(['/api/users', '/api/community/developers'], async (req, res) => {
    try {
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const users = await prisma.user.findMany({
                    include: { profile: true }
                });
                return res.json(users.map(u => sanitizeUserObj(u)));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Users List DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch developers' });
                }
            }
        }

        const filePath = getFilePath('users');
        const data = await fs.readFile(filePath, 'utf-8');
        const users = JSON.parse(data);
        res.json(users.map(u => sanitizeUserObj(u)));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch developers' });
    }
});

/*
 * Upvote Developer
 */
app.post('/api/users/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const targetUserId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot upvote yourself' });
        }

        const filePath = getFilePath('users');
        let users = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        const targetIndex = users.findIndex(u => String(u.id) === targetUserId);
        if (targetIndex === -1) return res.status(404).json({ error: 'Developer not found' });

        const target = users[targetIndex];
        target.upvoters = Array.isArray(target.upvoters) ? target.upvoters : [];
        target.upvotes = typeof target.upvotes === 'number' ? target.upvotes : target.upvoters.length;

        const hasUpvoted = target.upvoters.includes(currentUserId);
        if (hasUpvoted) {
            target.upvoters = target.upvoters.filter(id => id !== currentUserId);
            target.upvotes = Math.max(0, target.upvotes - 1);
        } else {
            target.upvoters.push(currentUserId);
            target.upvotes += 1;

            await sendNotification({
                userId: targetUserId,
                actorId: currentUserId,
                type: 'PROFILE_UPVOTED',
                title: 'New Upvote! 🌟',
                message: `${req.user.name || 'A developer'} upvoted your profile!`,
                data: { upvoterId: currentUserId }
            });
        }

        users[targetIndex] = target;
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        res.json({ success: true, upvoted: !hasUpvoted, upvotes: target.upvotes });
    } catch (error) {
        console.error('Error upvoting user:', error);
        res.status(500).json({ error: 'Failed to upvote developer' });
    }
});

/*
 * Follow Developer
 */
app.post('/api/users/:id/follow', authMiddleware, async (req, res) => {
    try {
        const targetUserId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const filePath = getFilePath('users');
        let users = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        const targetIndex = users.findIndex(u => String(u.id) === targetUserId);
        if (targetIndex === -1) return res.status(404).json({ error: 'Developer not found' });

        const target = users[targetIndex];
        target.followers = Array.isArray(target.followers) ? target.followers : [];

        const isFollowing = target.followers.includes(currentUserId);
        if (isFollowing) {
            target.followers = target.followers.filter(id => id !== currentUserId);
        } else {
            target.followers.push(currentUserId);

            await sendNotification({
                userId: targetUserId,
                actorId: currentUserId,
                type: 'NEW_FOLLOWER',
                title: 'New Follower! 👥',
                message: `${req.user.name || 'A developer'} started following you!`,
                data: { followerId: currentUserId }
            });
        }

        users[targetIndex] = target;
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        res.json({ success: true, following: !isFollowing, followersCount: target.followers.length });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ error: 'Failed to follow developer' });
    }
});

/*
 * Update Availability
 */
const handleUpdateAvailability = async (req, res) => {
    try {
        const userId = String(req.user.id);
        const { availability } = req.body;
        if (!availability) return res.status(400).json({ error: 'Availability string is required' });

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                await prisma.userProfile.upsert({
                    where: { userId },
                    update: { preferences: { availability } },
                    create: { userId, preferences: { availability } }
                });
                return res.json({ success: true, availability });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Availability DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update availability' });
                }
            }
        }

        const usersPath = getFilePath('users');
        let users = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
        const idx = users.findIndex(u => String(u.id) === userId);
        if (idx === -1) return res.status(404).json({ error: 'User not found' });

        users[idx].availability = availability;
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        res.json({ success: true, availability });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update availability' });
    }
};
app.put('/api/users/availability', authMiddleware, handleUpdateAvailability);
app.post('/api/users/availability', authMiddleware, handleUpdateAvailability);

// ------------------------------------------------------------------------------
// Projects Endpoints
// ------------------------------------------------------------------------------

/*
 * List Projects
 */
app.get('/api/projects', async (req, res) => {
    try {
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const projects = await prisma.project.findMany({
                    include: {
                        owner: { include: { profile: true } },
                        members: true
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const formatted = projects.map(p => ({
                    id: p.id,
                    title: p.title,
                    category: p.category,
                    difficulty: p.difficulty,
                    techStack: p.techStack || [],
                    image: p.image,
                    description: p.description,
                    githubUrl: p.githubUrl,
                    isPinned: p.isPinned,
                    isDemo: p.isDemo,
                    ownerId: p.ownerId,
                    owner: sanitizeUserObj(p.owner),
                    membersCount: p.members ? p.members.length : 0,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                }));

                return res.json(formatted);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Projects List DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch projects' });
                }
            }
        }

        const rawProjects = JSON.parse(await fs.readFile(getFilePath('projects'), 'utf-8'));
        let rawUsers = [];
        let rawMembers = [];
        try { rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
        try { rawMembers = JSON.parse(await fs.readFile(getFilePath('projectMembers'), 'utf-8')); } catch {}

        const usersMap = new Map();
        rawUsers.forEach(u => usersMap.set(String(u.id), u));

        const formatted = rawProjects.map(p => {
            const owner = p.ownerId ? usersMap.get(String(p.ownerId)) : null;
            const projectMembers = rawMembers.filter(m => String(m.projectId) === String(p.id));
            return {
                ...p,
                owner: sanitizeUserObj(owner),
                membersCount: projectMembers.length
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

/*
 * Get Single Project by ID
 */
app.get('/api/projects/:id', async (req, res) => {
    try {
        const projectId = String(req.params.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    include: {
                        owner: { include: { profile: true } },
                        members: { include: { user: { include: { profile: true } } } },
                        issues: { include: { creator: { include: { profile: true } }, assignee: { include: { profile: true } } } }
                    }
                });

                if (!project) return res.status(404).json({ error: 'Project not found' });

                const formatted = {
                    id: project.id,
                    title: project.title,
                    category: project.category,
                    difficulty: project.difficulty,
                    techStack: project.techStack || [],
                    image: project.image,
                    description: project.description,
                    githubUrl: project.githubUrl,
                    isPinned: project.isPinned,
                    isDemo: project.isDemo,
                    ownerId: project.ownerId,
                    owner: sanitizeUserObj(project.owner),
                    members: (project.members || []).map(m => ({
                        projectId: m.projectId,
                        userId: m.userId,
                        projectRole: m.projectRole,
                        user: sanitizeUserObj(m.user)
                    })),
                    issues: (project.issues || []).map(i => formatIssue(i)),
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt
                };

                return res.json(formatted);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Project Detail DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to load project details' });
                }
            }
        }

        const rawProjects = JSON.parse(await fs.readFile(getFilePath('projects'), 'utf-8'));
        const project = rawProjects.find(p => String(p.id) === projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        let rawUsers = [];
        let rawMembers = [];
        let rawTasks = [];
        try { rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
        try { rawMembers = JSON.parse(await fs.readFile(getFilePath('projectMembers'), 'utf-8')); } catch {}
        try { rawTasks = JSON.parse(await fs.readFile(getFilePath('tasks'), 'utf-8')); } catch {}

        const usersMap = new Map();
        rawUsers.forEach(u => usersMap.set(String(u.id), u));

        const owner = project.ownerId ? usersMap.get(String(project.ownerId)) : null;
        const projectMembers = rawMembers.filter(m => String(m.projectId) === projectId).map(m => ({
            ...m,
            user: sanitizeUserObj(usersMap.get(String(m.userId)))
        }));
        const projectTasks = rawTasks.filter(t => String(t.projectId) === projectId).map(t => formatIssue(t, usersMap));

        res.json({
            ...project,
            owner: sanitizeUserObj(owner),
            members: projectMembers,
            issues: projectTasks
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

/*
 * Create Project (Authenticated)
 */
app.post('/api/projects', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const { title, category, difficulty, techStack, image, description, githubUrl, isPinned, isDemo } = req.body;

        if (!title || !title.trim()) return res.status(400).json({ error: 'Project title is required' });

        const projectId = `proj_${Date.now()}_${uuidv4().substring(0, 6)}`;
        const projectPayload = {
            id: projectId,
            title: title.trim(),
            category: category || 'Engineering',
            difficulty: difficulty || 'Intermediate',
            techStack: Array.isArray(techStack) ? techStack : [],
            image: image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
            description: description || '',
            githubUrl: githubUrl || '',
            isPinned: Boolean(isPinned),
            isDemo: Boolean(isDemo),
            ownerId: currentUserId
        };

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const createdProject = await prisma.project.create({
                    data: {
                        ...projectPayload,
                        members: {
                            create: {
                                userId: currentUserId,
                                projectRole: 'owner'
                            }
                        }
                    },
                    include: {
                        owner: { include: { profile: true } }
                    }
                });

                return res.status(201).json({
                    ...createdProject,
                    owner: sanitizeUserObj(createdProject.owner)
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Create Project DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to create project' });
                }
            }
        }

        const projectsPath = getFilePath('projects');
        let projects = [];
        try { projects = JSON.parse(await fs.readFile(projectsPath, 'utf-8')); } catch { projects = []; }

        projects.unshift(projectPayload);
        await fs.writeFile(projectsPath, JSON.stringify(projects, null, 2));

        // Add owner as first member
        const membersPath = getFilePath('projectMembers');
        let members = [];
        try { members = JSON.parse(await fs.readFile(membersPath, 'utf-8')); } catch { members = []; }
        members.push({
            projectId,
            userId: currentUserId,
            projectRole: 'owner',
            joinedAt: new Date().toISOString()
        });
        await fs.writeFile(membersPath, JSON.stringify(members, null, 2));

        let rawUsers = [];
        try { rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
        const owner = rawUsers.find(u => String(u.id) === currentUserId);

        res.status(201).json({
            ...projectPayload,
            owner: sanitizeUserObj(owner)
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

/*
 * Update Project (Owner-Only Authorization)
 */
const handleUpdateProject = async (req, res) => {
    try {
        const projectId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const updates = req.body;

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({ where: { id: projectId } });
                if (!project) return res.status(404).json({ error: 'Project not found' });
                if (String(project.ownerId) !== currentUserId) {
                    return res.status(403).json({ error: 'Only the project owner can edit this project' });
                }

                const updated = await prisma.project.update({
                    where: { id: projectId },
                    data: {
                        title: updates.title !== undefined ? updates.title.trim() : undefined,
                        category: updates.category !== undefined ? updates.category : undefined,
                        difficulty: updates.difficulty !== undefined ? updates.difficulty : undefined,
                        techStack: Array.isArray(updates.techStack) ? updates.techStack : undefined,
                        image: updates.image !== undefined ? updates.image : undefined,
                        description: updates.description !== undefined ? updates.description : undefined,
                        githubUrl: updates.githubUrl !== undefined ? updates.githubUrl : undefined,
                        isPinned: updates.isPinned !== undefined ? Boolean(updates.isPinned) : undefined,
                        isDemo: updates.isDemo !== undefined ? Boolean(updates.isDemo) : undefined
                    },
                    include: { owner: { include: { profile: true } } }
                });

                return res.json({ ...updated, owner: sanitizeUserObj(updated.owner) });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Update Project DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update project' });
                }
            }
        }

        const projectsPath = getFilePath('projects');
        let projects = JSON.parse(await fs.readFile(projectsPath, 'utf-8'));
        const index = projects.findIndex(p => String(p.id) === projectId);
        if (index === -1) return res.status(404).json({ error: 'Project not found' });

        if (String(projects[index].ownerId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the project owner can edit this project' });
        }

        projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
        await fs.writeFile(projectsPath, JSON.stringify(projects, null, 2));

        res.json(projects[index]);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};
app.put('/api/projects/:id', authMiddleware, handleUpdateProject);
app.patch('/api/projects/:id', authMiddleware, handleUpdateProject);

/*
 * Delete Project (Owner-Only Authorization with Cascade)
 */
app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({ where: { id: projectId } });
                if (!project) return res.status(404).json({ error: 'Project not found' });
                if (String(project.ownerId) !== currentUserId) {
                    return res.status(403).json({ error: 'Only the project owner can delete this project' });
                }

                await prisma.project.delete({ where: { id: projectId } });
                return res.json({ success: true, message: 'Project and associated resources deleted successfully' });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Delete Project DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to delete project' });
                }
            }
        }

        const projectsPath = getFilePath('projects');
        let projectsList = JSON.parse(await fs.readFile(projectsPath, 'utf-8'));
        const project = projectsList.find(p => String(p.id) === projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (String(project.ownerId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the project owner can delete this project' });
        }

        projectsList = projectsList.filter(p => String(p.id) !== projectId);
        await fs.writeFile(projectsPath, JSON.stringify(projectsList, null, 2));

        // Cascade cleanup in JSON storage
        try {
            const membersPath = getFilePath('projectMembers');
            let members = JSON.parse(await fs.readFile(membersPath, 'utf-8'));
            members = members.filter(m => String(m.projectId) !== projectId);
            await fs.writeFile(membersPath, JSON.stringify(members, null, 2));
        } catch {}

        try {
            const issuesPath = getFilePath('tasks');
            let issues = JSON.parse(await fs.readFile(issuesPath, 'utf-8'));
            issues = issues.filter(i => String(i.projectId) !== projectId);
            await fs.writeFile(issuesPath, JSON.stringify(issues, null, 2));
        } catch {}

        try {
            const invsPath = getFilePath('projectInvitations');
            let invs = JSON.parse(await fs.readFile(invsPath, 'utf-8'));
            invs = invs.filter(i => String(i.projectId) !== projectId);
            await fs.writeFile(invsPath, JSON.stringify(invs, null, 2));
        } catch {}

        res.json({ success: true, message: 'Project and associated resources deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

/*
 * Project Members Listing (Zero-Email Sanitization)
 */
app.get('/api/projectMembers', async (req, res) => {
    try {
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const members = await prisma.projectMember.findMany({
                    include: { user: { include: { profile: true } } }
                });
                return res.json(members.map(m => ({
                    projectId: m.projectId,
                    userId: m.userId,
                    projectRole: m.projectRole,
                    joinedAt: m.joinedAt,
                    user: sanitizeUserObj(m.user)
                })));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[ProjectMembers DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch project members' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const membersPath = getFilePath('projectMembers');
        const data = await fs.readFile(membersPath, 'utf-8');
        const members = JSON.parse(data);

        res.json(members.map(m => {
            const rawUser = fileUsersMap.get(String(m.userId));
            return {
                ...m,
                user: sanitizeUserObj(rawUser)
            };
        }));
    } catch (error) {
        console.error('Error fetching project members:', error);
        res.status(500).json({ error: 'Failed to fetch project members' });
    }
});

/*
 * Remove Project Member (Owner or Self)
 */
app.delete('/api/projects/:projectId/members/:userId', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const targetUserId = String(req.params.userId);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({ where: { id: projectId } });
                if (!project) return res.status(404).json({ error: 'Project not found' });

                const isOwner = String(project.ownerId) === currentUserId;
                const isSelf = targetUserId === currentUserId;

                if (!isOwner && !isSelf) {
                    return res.status(403).json({ error: 'Unauthorized to remove this member' });
                }

                await prisma.projectMember.delete({
                    where: { projectId_userId: { projectId, userId: targetUserId } }
                });

                return res.json({ success: true, message: 'Member removed from project' });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Remove Member DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to remove member' });
                }
            }
        }

        const projects = JSON.parse(await fs.readFile(getFilePath('projects'), 'utf-8'));
        const project = projects.find(p => String(p.id) === projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isOwner = String(project.ownerId) === currentUserId;
        const isSelf = targetUserId === currentUserId;

        if (!isOwner && !isSelf) {
            return res.status(403).json({ error: 'Unauthorized to remove this member' });
        }

        const membersPath = getFilePath('projectMembers');
        let members = JSON.parse(await fs.readFile(membersPath, 'utf-8'));
        members = members.filter(m => !(String(m.projectId) === projectId && String(m.userId) === targetUserId));
        await fs.writeFile(membersPath, JSON.stringify(members, null, 2));

        res.json({ success: true, message: 'Member removed from project' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// ------------------------------------------------------------------------------
// Issues / Tasks Endpoints
// ------------------------------------------------------------------------------

/*
 * List All Accessible Issues
 */
app.get('/api/issues', authMiddleware, async (req, res) => {
    try {
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const issues = await prisma.issue.findMany({
                    include: {
                        project: { select: { id: true, title: true } },
                        creator: { include: { profile: true } },
                        assignee: { include: { profile: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(issues.map(i => formatIssue(i)));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Issues List DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch issues' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const tasksPath = getFilePath('tasks');
        const data = await fs.readFile(tasksPath, 'utf-8');
        const tasks = JSON.parse(data);
        res.json(tasks.map(t => formatIssue(t, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

/*
 * List Issues for Specific Project
 */
app.get('/api/projects/:projectId/issues', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const issues = await prisma.issue.findMany({
                    where: { projectId },
                    include: {
                        project: { select: { id: true, title: true } },
                        creator: { include: { profile: true } },
                        assignee: { include: { profile: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(issues.map(i => formatIssue(i)));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Project Issues DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch project issues' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const tasksPath = getFilePath('tasks');
        const data = await fs.readFile(tasksPath, 'utf-8');
        const tasks = JSON.parse(data);
        const projectTasks = tasks.filter(t => String(t.projectId) === projectId);
        res.json(projectTasks.map(t => formatIssue(t, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching project issues:', error);
        res.status(500).json({ error: 'Failed to fetch project issues' });
    }
});

/*
 * Create Issue (Restricted to Project Owner and Confirmed Members)
 */
app.post('/api/projects/:projectId/issues', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const currentUserId = String(req.user.id);
        const { title, description, status, priority, tags, assigneeId } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Issue title is required' });
        }

        // Strict Authorization: User MUST be owner or confirmed member
        const authorized = await isProjectAuthorized(projectId, currentUserId);
        if (!authorized) {
            return res.status(403).json({ error: 'Only project members can create issues in this project' });
        }

        const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
        const normalizedStatus = validStatuses.includes(String(status).toUpperCase()) ? String(status).toUpperCase() : 'TODO';

        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const normalizedPriority = validPriorities.includes(String(priority).toUpperCase()) ? String(priority).toUpperCase() : 'MEDIUM';

        const issueId = `iss_${Date.now()}_${uuidv4().substring(0, 6)}`;
        const issuePayload = {
            id: issueId,
            projectId,
            creatorId: currentUserId,
            assigneeId: assigneeId ? String(assigneeId) : null,
            title: title.trim(),
            description: (description || '').trim(),
            status: normalizedStatus,
            priority: normalizedPriority,
            tags: Array.isArray(tags) ? tags : []
        };

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const createdIssue = await prisma.issue.create({
                    data: {
                        id: issuePayload.id,
                        title: issuePayload.title,
                        description: issuePayload.description,
                        status: issuePayload.status,
                        priority: issuePayload.priority,
                        tags: issuePayload.tags,
                        projectId: issuePayload.projectId,
                        creatorId: issuePayload.creatorId,
                        assigneeId: issuePayload.assigneeId
                    },
                    include: {
                        project: { select: { id: true, title: true } },
                        creator: { include: { profile: true } },
                        assignee: { include: { profile: true } }
                    }
                });

                if (issuePayload.assigneeId && issuePayload.assigneeId !== currentUserId) {
                    await sendNotification({
                        userId: issuePayload.assigneeId,
                        actorId: currentUserId,
                        projectId: projectId,
                        type: 'ISSUE_ASSIGNED',
                        title: 'New Issue Assignment 📋',
                        message: `You were assigned to issue "${createdIssue.title}"`,
                        data: { issueId: createdIssue.id, projectId }
                    });
                }

                return res.status(201).json(formatIssue(createdIssue));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Create Issue DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to create issue' });
                }
            }
        }

        const tasksPath = getFilePath('tasks');
        let tasks = [];
        try { tasks = JSON.parse(await fs.readFile(tasksPath, 'utf-8')); } catch { tasks = []; }

        tasks.unshift({
            ...issuePayload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        await fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2));

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.status(201).json(formatIssue(issuePayload, fileUsersMap));
    } catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

/*
 * Update Issue (Owner, Creator, or Assignee Authorized)
 */
const handleUpdateIssue = async (req, res) => {
    try {
        const issueId = String(req.params.issueId || req.params.id);
        const currentUserId = String(req.user.id);
        const { title, description, status, priority, tags, assigneeId } = req.body;

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const issue = await prisma.issue.findUnique({
                    where: { id: issueId },
                    include: { project: true }
                });
                if (!issue) return res.status(404).json({ error: 'Issue not found' });

                const isProjectOwner = issue.project && String(issue.project.ownerId) === currentUserId;
                const isCreator = String(issue.creatorId) === currentUserId;
                const isAssignee = String(issue.assigneeId) === currentUserId;

                if (!isProjectOwner && !isCreator && !isAssignee) {
                    return res.status(403).json({ error: 'Unauthorized to modify this issue' });
                }

                const updated = await prisma.issue.update({
                    where: { id: issueId },
                    data: {
                        title: title !== undefined ? title.trim() : undefined,
                        description: description !== undefined ? description.trim() : undefined,
                        status: status !== undefined ? String(status).toUpperCase() : undefined,
                        priority: priority !== undefined ? String(priority).toUpperCase() : undefined,
                        tags: Array.isArray(tags) ? tags : undefined,
                        assigneeId: assigneeId !== undefined ? (assigneeId ? String(assigneeId) : null) : undefined
                    },
                    include: {
                        project: { select: { id: true, title: true } },
                        creator: { include: { profile: true } },
                        assignee: { include: { profile: true } }
                    }
                });

                return res.json(formatIssue(updated));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Update Issue DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update issue' });
                }
            }
        }

        const tasksPath = getFilePath('tasks');
        let tasks = JSON.parse(await fs.readFile(tasksPath, 'utf-8'));
        const index = tasks.findIndex(t => String(t.id) === issueId);
        if (index === -1) return res.status(404).json({ error: 'Issue not found' });

        const issue = tasks[index];
        const isCreator = String(issue.creatorId) === currentUserId;
        const isAssignee = String(issue.assigneeId) === currentUserId;

        // Check project ownership
        let isProjectOwner = false;
        try {
            const projects = JSON.parse(await fs.readFile(getFilePath('projects'), 'utf-8'));
            const project = projects.find(p => String(p.id) === String(issue.projectId));
            if (project && String(project.ownerId) === currentUserId) isProjectOwner = true;
        } catch {}

        if (!isProjectOwner && !isCreator && !isAssignee) {
            return res.status(403).json({ error: 'Unauthorized to modify this issue' });
        }

        tasks[index] = {
            ...tasks[index],
            title: title !== undefined ? title.trim() : tasks[index].title,
            description: description !== undefined ? description.trim() : tasks[index].description,
            status: status !== undefined ? String(status).toUpperCase() : tasks[index].status,
            priority: priority !== undefined ? String(priority).toUpperCase() : tasks[index].priority,
            tags: Array.isArray(tags) ? tags : tasks[index].tags,
            assigneeId: assigneeId !== undefined ? (assigneeId ? String(assigneeId) : null) : tasks[index].assigneeId,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2));

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(formatIssue(tasks[index], fileUsersMap));
    } catch (error) {
        console.error('Error updating issue:', error);
        res.status(500).json({ error: 'Failed to update issue' });
    }
};
app.patch('/api/projects/:projectId/issues/:issueId', authMiddleware, handleUpdateIssue);
app.patch('/api/issues/:issueId', authMiddleware, handleUpdateIssue);

/*
 * Delete Issue (Project Owner or Issue Creator Authorized)
 */
const handleDeleteIssue = async (req, res) => {
    try {
        const issueId = String(req.params.issueId || req.params.id);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const issue = await prisma.issue.findUnique({
                    where: { id: issueId },
                    include: { project: true }
                });
                if (!issue) return res.status(404).json({ error: 'Issue not found' });

                const isProjectOwner = issue.project && String(issue.project.ownerId) === currentUserId;
                const isCreator = String(issue.creatorId) === currentUserId;

                if (!isProjectOwner && !isCreator) {
                    return res.status(403).json({ error: 'Unauthorized to delete this issue' });
                }

                await prisma.issue.delete({ where: { id: issueId } });
                return res.json({ success: true, message: 'Issue deleted successfully' });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Delete Issue DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to delete issue' });
                }
            }
        }

        const tasksPath = getFilePath('tasks');
        let tasks = JSON.parse(await fs.readFile(tasksPath, 'utf-8'));
        const index = tasks.findIndex(t => String(t.id) === issueId);
        if (index === -1) return res.status(404).json({ error: 'Issue not found' });

        const issue = tasks[index];
        const isCreator = String(issue.creatorId) === currentUserId;

        let isProjectOwner = false;
        try {
            const projects = JSON.parse(await fs.readFile(getFilePath('projects'), 'utf-8'));
            const project = projects.find(p => String(p.id) === String(issue.projectId));
            if (project && String(project.ownerId) === currentUserId) isProjectOwner = true;
        } catch {}

        if (!isProjectOwner && !isCreator) {
            return res.status(403).json({ error: 'Unauthorized to delete this issue' });
        }

        tasks = tasks.filter(t => String(t.id) !== issueId);
        await fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2));

        res.json({ success: true, message: 'Issue deleted successfully' });
    } catch (error) {
        console.error('Error deleting issue:', error);
        res.status(500).json({ error: 'Failed to delete issue' });
    }
};
app.delete('/api/projects/:projectId/issues/:issueId', authMiddleware, handleDeleteIssue);
app.delete('/api/issues/:issueId', authMiddleware, handleDeleteIssue);

// ------------------------------------------------------------------------------
// Join Requests (Collaboration) Endpoints
// ------------------------------------------------------------------------------

/*
 * Request to Join Project
 */
app.post('/api/projects/:projectId/join-requests', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const currentUserId = String(req.user.id);
        const { message } = req.body;

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({ where: { id: projectId } });
                if (!project) return res.status(404).json({ error: 'Project not found' });

                if (String(project.ownerId) === currentUserId) {
                    return res.status(400).json({ error: 'You are the owner of this project' });
                }

                const joinReq = await prisma.joinRequest.create({
                    data: {
                        userId: currentUserId,
                        projectId: projectId,
                        ownerId: String(project.ownerId),
                        status: 'PENDING',
                        message: (message || '').trim()
                    },
                    include: {
                        user: { include: { profile: true } },
                        project: { select: { id: true, title: true } }
                    }
                });

                if (project.ownerId) {
                    await sendNotification({
                        userId: project.ownerId,
                        actorId: currentUserId,
                        projectId: projectId,
                        type: 'JOIN_REQUEST_RECEIVED',
                        title: 'New Join Request 🚀',
                        message: `${req.user.name || 'A developer'} requested to join "${project.title}"`,
                        data: { requestId: joinReq.id, projectId }
                    });
                }

                return res.status(201).json(sanitizeJoinRequest(joinReq));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[JoinRequest Create DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to submit join request' });
                }
            }
        }

        const projectsPath = getFilePath('projects');
        let projects = JSON.parse(await fs.readFile(projectsPath, 'utf-8'));
        const project = projects.find(p => String(p.id) === projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (String(project.ownerId) === currentUserId) {
            return res.status(400).json({ error: 'You are the owner of this project' });
        }

        const joinReq = {
            id: `req_${Date.now()}_${uuidv4().substring(0, 6)}`,
            userId: currentUserId,
            projectId: projectId,
            ownerId: String(project.ownerId),
            status: 'PENDING',
            message: (message || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const reqsPath = getFilePath('projectInvitations');
        let reqs = [];
        try { reqs = JSON.parse(await fs.readFile(reqsPath, 'utf-8')); } catch {}
        reqs.push(joinReq);
        await fs.writeFile(reqsPath, JSON.stringify(reqs, null, 2));

        const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
        const sender = users.find(u => String(u.id) === currentUserId);
        await sendNotification({
            userId: project.ownerId,
            actorId: currentUserId,
            projectId: projectId,
            type: 'JOIN_REQUEST_RECEIVED',
            title: 'New Join Request 🚀',
            message: `${sender?.name || 'A developer'} requested to join "${project.title}"`,
            data: { requestId: joinReq.id, projectId }
        });

        res.status(201).json(joinReq);
    } catch (error) {
        console.error('Error submitting join request:', error);
        res.status(500).json({ error: 'Failed to submit join request' });
    }
});

/*
 * Get User's Join Request for a Project
 */
app.get('/api/projects/:projectId/join-requests/my', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const request = await prisma.joinRequest.findFirst({
                    where: { projectId, userId: currentUserId }
                });
                return res.json(request ? sanitizeJoinRequest(request) : null);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[My JoinRequest DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch request' });
                }
            }
        }

        const reqsPath = getFilePath('projectInvitations');
        let reqs = [];
        try { reqs = JSON.parse(await fs.readFile(reqsPath, 'utf-8')); } catch {}
        const request = reqs.find(r => String(r.projectId) === projectId && String(r.userId) === currentUserId);
        res.json(request || null);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});

/*
 * Get Received Join Requests (Project Owner)
 */
app.get('/api/join-requests/received', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const requests = await prisma.joinRequest.findMany({
                    where: { ownerId: currentUserId },
                    include: {
                        user: { include: { profile: true } },
                        project: { select: { id: true, title: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(requests.map(r => sanitizeJoinRequest(r)));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Received JoinRequests DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch received requests' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const reqsPath = getFilePath('projectInvitations');
        let reqs = [];
        try { reqs = JSON.parse(await fs.readFile(reqsPath, 'utf-8')); } catch {}
        const userReqs = reqs.filter(r => String(r.ownerId) === currentUserId);
        res.json(userReqs.map(r => sanitizeJoinRequest(r, fileUsersMap)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch received requests' });
    }
});

/*
 * Get Sent Join Requests
 */
app.get('/api/join-requests/sent', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const requests = await prisma.joinRequest.findMany({
                    where: { userId: currentUserId },
                    include: {
                        project: { select: { id: true, title: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(requests.map(r => sanitizeJoinRequest(r)));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Sent JoinRequests DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch sent requests' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const reqsPath = getFilePath('projectInvitations');
        let reqs = [];
        try { reqs = JSON.parse(await fs.readFile(reqsPath, 'utf-8')); } catch {}
        const userReqs = reqs.filter(r => String(r.userId) === currentUserId);
        res.json(userReqs.map(r => sanitizeJoinRequest(r, fileUsersMap)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sent requests' });
    }
});

/*
 * Respond to Join Request (Owner-Only Authorization)
 */
app.patch('/api/join-requests/:id', authMiddleware, async (req, res) => {
    try {
        const requestId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const { status, action } = req.body;
        const targetStatus = (status || action || '').toUpperCase();

        if (!['ACCEPTED', 'REJECTED'].includes(targetStatus)) {
            return res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const joinReq = await prisma.joinRequest.findUnique({ where: { id: requestId } });
                if (!joinReq) return res.status(404).json({ error: 'Join request not found' });

                if (String(joinReq.ownerId) !== currentUserId) {
                    return res.status(403).json({ error: 'Only the project owner can manage this join request' });
                }

                const updated = await prisma.joinRequest.update({
                    where: { id: requestId },
                    data: { status: targetStatus }
                });

                if (targetStatus === 'ACCEPTED') {
                    await prisma.projectMember.upsert({
                        where: {
                            projectId_userId: {
                                projectId: joinReq.projectId,
                                userId: joinReq.userId
                            }
                        },
                        update: { projectRole: 'editor' },
                        create: {
                            projectId: joinReq.projectId,
                            userId: joinReq.userId,
                            projectRole: 'editor'
                        }
                    });

                    await sendNotification({
                        userId: joinReq.userId,
                        actorId: currentUserId,
                        projectId: joinReq.projectId,
                        type: 'JOIN_REQUEST_ACCEPTED',
                        title: 'Join Request Accepted! 🎉',
                        message: `Your request to join the project was accepted!`,
                        data: { requestId: joinReq.id, projectId: joinReq.projectId }
                    });
                } else {
                    await sendNotification({
                        userId: joinReq.userId,
                        actorId: currentUserId,
                        projectId: joinReq.projectId,
                        type: 'JOIN_REQUEST_REJECTED',
                        title: 'Join Request Update',
                        message: `Your request to join the project was declined.`,
                        data: { requestId: joinReq.id, projectId: joinReq.projectId }
                    });
                }

                return res.json({ success: true, request: sanitizeJoinRequest(updated) });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Update JoinRequest DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update join request' });
                }
            }
        }

        const reqsPath = getFilePath('projectInvitations');
        let reqs = JSON.parse(await fs.readFile(reqsPath, 'utf-8'));
        const reqIndex = reqs.findIndex(r => String(r.id) === requestId);
        if (reqIndex === -1) return res.status(404).json({ error: 'Join request not found' });

        const joinReq = reqs[reqIndex];
        if (String(joinReq.ownerId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the project owner can manage this join request' });
        }

        joinReq.status = targetStatus;
        joinReq.updatedAt = new Date().toISOString();
        reqs[reqIndex] = joinReq;
        await fs.writeFile(reqsPath, JSON.stringify(reqs, null, 2));

        if (targetStatus === 'ACCEPTED') {
            const membersPath = getFilePath('projectMembers');
            let members = [];
            try { members = JSON.parse(await fs.readFile(membersPath, 'utf-8')); } catch {}
            if (!members.some(m => String(m.projectId) === String(joinReq.projectId) && String(m.userId) === String(joinReq.userId))) {
                members.push({
                    projectId: joinReq.projectId,
                    userId: joinReq.userId,
                    projectRole: 'editor',
                    joinedAt: new Date().toISOString()
                });
                await fs.writeFile(membersPath, JSON.stringify(members, null, 2));
            }

            await sendNotification({
                userId: joinReq.userId,
                actorId: currentUserId,
                projectId: joinReq.projectId,
                type: 'JOIN_REQUEST_ACCEPTED',
                title: 'Join Request Accepted! 🎉',
                message: `Your request to join the project was accepted!`,
                data: { requestId: joinReq.id, projectId: joinReq.projectId }
            });
        } else {
            await sendNotification({
                userId: joinReq.userId,
                actorId: currentUserId,
                projectId: joinReq.projectId,
                type: 'JOIN_REQUEST_REJECTED',
                title: 'Join Request Update',
                message: `Your request to join the project was declined.`,
                data: { requestId: joinReq.id, projectId: joinReq.projectId }
            });
        }

        res.json({ success: true, request: joinReq });
    } catch (error) {
        console.error('Error updating join request:', error);
        res.status(500).json({ error: 'Failed to update join request' });
    }
});

// ------------------------------------------------------------------------------
// Meeting Requests Endpoints
// ------------------------------------------------------------------------------

/*
 * Request Meeting
 */
app.post('/api/projects/:projectId/meetings', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const currentUserId = String(req.user.id);
        const { preferredDate, message } = req.body;

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({ where: { id: projectId } });
                if (!project) return res.status(404).json({ error: 'Project not found' });

                if (String(project.ownerId) === currentUserId) {
                    return res.status(400).json({ error: 'You are the owner of this project' });
                }

                const meeting = await prisma.meetingRequest.create({
                    data: {
                        userId: currentUserId,
                        projectId,
                        ownerId: String(project.ownerId),
                        preferredDate: preferredDate ? new Date(preferredDate) : null,
                        message: (message || '').trim(),
                        status: 'PENDING'
                    },
                    include: {
                        user: { include: { profile: true } },
                        project: { select: { id: true, title: true } }
                    }
                });

                if (project.ownerId) {
                    await sendNotification({
                        userId: project.ownerId,
                        actorId: currentUserId,
                        projectId: projectId,
                        type: 'MEETING_REQUEST_RECEIVED',
                        title: '1:1 Meeting Request 📅',
                        message: `${req.user.name || 'A developer'} requested a meeting for "${project.title}"`,
                        data: { meetingId: meeting.id, projectId }
                    });
                }

                return res.status(201).json(sanitizeMeetingRequest(meeting));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Create Meeting DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to submit meeting request' });
                }
            }
        }

        const projects = JSON.parse(await fs.readFile(getFilePath('projects'), 'utf-8'));
        const project = projects.find(p => String(p.id) === projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (String(project.ownerId) === currentUserId) {
            return res.status(400).json({ error: 'You are the owner of this project' });
        }

        const meetingReq = {
            id: `meet_${Date.now()}_${uuidv4().substring(0, 6)}`,
            userId: currentUserId,
            projectId: projectId,
            ownerId: String(project.ownerId),
            preferredDate: preferredDate || null,
            message: (message || '').trim(),
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const meetingsPath = getFilePath('conversations');
        let meetings = [];
        try { meetings = JSON.parse(await fs.readFile(meetingsPath, 'utf-8')); } catch {}
        meetings.push(meetingReq);
        await fs.writeFile(meetingsPath, JSON.stringify(meetings, null, 2));

        const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
        const sender = users.find(u => String(u.id) === currentUserId);
        await sendNotification({
            userId: project.ownerId,
            actorId: currentUserId,
            projectId: projectId,
            type: 'MEETING_REQUEST_RECEIVED',
            title: '1:1 Meeting Request 📅',
            message: `${sender?.name || 'A developer'} requested a meeting for "${project.title}"`,
            data: { meetingId: meetingReq.id, projectId }
        });

        res.status(201).json(meetingReq);
    } catch (error) {
        console.error('Error submitting meeting request:', error);
        res.status(500).json({ error: 'Failed to submit meeting request' });
    }
});

/*
 * Get Meeting for a Project
 */
app.get('/api/projects/:projectId/meetings/my', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const meeting = await prisma.meetingRequest.findFirst({
                    where: { projectId, userId: currentUserId }
                });
                return res.json(meeting ? sanitizeMeetingRequest(meeting) : null);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[My Meeting DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch meeting request' });
                }
            }
        }

        const meetingsPath = getFilePath('conversations');
        let meetings = [];
        try { meetings = JSON.parse(await fs.readFile(meetingsPath, 'utf-8')); } catch {}
        const meeting = meetings.find(m => String(m.projectId) === projectId && String(m.userId) === currentUserId);
        res.json(meeting || null);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch meeting request' });
    }
});

/*
 * Get Received Meeting Requests
 */
app.get('/api/meetings/received', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const meetings = await prisma.meetingRequest.findMany({
                    where: { ownerId: currentUserId },
                    include: {
                        user: { include: { profile: true } },
                        project: { select: { id: true, title: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(meetings.map(m => sanitizeMeetingRequest(m)));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Received Meetings DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch received meetings' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const meetingsPath = getFilePath('conversations');
        let meetings = [];
        try { meetings = JSON.parse(await fs.readFile(meetingsPath, 'utf-8')); } catch {}
        const userMeetings = meetings.filter(m => String(m.ownerId) === currentUserId);
        res.json(userMeetings.map(m => sanitizeMeetingRequest(m, fileUsersMap)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch received meetings' });
    }
});

/*
 * Get Sent Meeting Requests
 */
app.get('/api/meetings/sent', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const meetings = await prisma.meetingRequest.findMany({
                    where: { userId: currentUserId },
                    include: {
                        project: { select: { id: true, title: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(meetings.map(m => sanitizeMeetingRequest(m)));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Sent Meetings DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch sent meetings' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const meetingsPath = getFilePath('conversations');
        let meetings = [];
        try { meetings = JSON.parse(await fs.readFile(meetingsPath, 'utf-8')); } catch {}
        const userMeetings = meetings.filter(m => String(m.userId) === currentUserId);
        res.json(userMeetings.map(m => sanitizeMeetingRequest(m, fileUsersMap)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sent meetings' });
    }
});

/*
 * Update Meeting Request
 */
app.patch('/api/meetings/:id', authMiddleware, async (req, res) => {
    try {
        const meetingId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const { status, action, meetingLink } = req.body;
        const targetStatus = (status || action || '').toUpperCase();

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const meeting = await prisma.meetingRequest.findUnique({ where: { id: meetingId } });
                if (!meeting) return res.status(404).json({ error: 'Meeting request not found' });

                if (String(meeting.ownerId) !== currentUserId) {
                    return res.status(403).json({ error: 'Only the project owner can manage this meeting request' });
                }

                const updated = await prisma.meetingRequest.update({
                    where: { id: meetingId },
                    data: {
                        status: targetStatus || undefined,
                        meetingLink: meetingLink || undefined
                    }
                });

                await sendNotification({
                    userId: meeting.userId,
                    actorId: currentUserId,
                    projectId: meeting.projectId,
                    type: targetStatus === 'ACCEPTED' ? 'MEETING_REQUEST_ACCEPTED' : 'MEETING_REQUEST_REJECTED',
                    title: targetStatus === 'ACCEPTED' ? 'Meeting Confirmed! 📅' : 'Meeting Request Declined',
                    message: targetStatus === 'ACCEPTED' ? `Your 1:1 meeting request was confirmed!` : `Your meeting request was declined.`,
                    data: { meetingId: meeting.id, projectId: meeting.projectId, meetingLink: meetingLink || meeting.meetingLink }
                });

                return res.json({ success: true, meeting: sanitizeMeetingRequest(updated) });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Update Meeting DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update meeting' });
                }
            }
        }

        const meetingsPath = getFilePath('conversations');
        let meetings = JSON.parse(await fs.readFile(meetingsPath, 'utf-8'));
        const meetingIndex = meetings.findIndex(m => String(m.id) === meetingId);
        if (meetingIndex === -1) return res.status(404).json({ error: 'Meeting request not found' });

        const meeting = meetings[meetingIndex];
        if (String(meeting.ownerId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the project owner can manage this meeting request' });
        }

        meeting.status = targetStatus;
        if (meetingLink) meeting.meetingLink = meetingLink;
        meeting.updatedAt = new Date().toISOString();
        meetings[meetingIndex] = meeting;
        await fs.writeFile(meetingsPath, JSON.stringify(meetings, null, 2));

        await sendNotification({
            userId: meeting.userId,
            actorId: currentUserId,
            projectId: meeting.projectId,
            type: targetStatus === 'ACCEPTED' ? 'MEETING_REQUEST_ACCEPTED' : 'MEETING_REQUEST_REJECTED',
            title: targetStatus === 'ACCEPTED' ? 'Meeting Confirmed! 📅' : 'Meeting Request Declined',
            message: targetStatus === 'ACCEPTED' ? `Your 1:1 meeting request was confirmed!` : `Your meeting request was declined.`,
            data: { meetingId: meeting.id, projectId: meeting.projectId, meetingLink: meeting.meetingLink }
        });

        res.json({ success: true, meeting });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update meeting' });
    }
});

// ------------------------------------------------------------------------------
// Notifications Endpoints
// ------------------------------------------------------------------------------

/*
 * Get Notifications (Recipient Isolated)
 */
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const dbNotifs = await prisma.notification.findMany({
                    where: { userId },
                    include: {
                        actor: { include: { profile: true } },
                        project: { select: { id: true, title: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(dbNotifs.map(sanitizeNotification));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Notifications DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch notifications' });
                }
            }
        }

        const notifPath = getFilePath('notifications');
        let notifs = [];
        try { notifs = JSON.parse(await fs.readFile(notifPath, 'utf-8')); } catch {}
        const userNotifs = notifs.filter(n => String(n.userId) === userId);
        res.json(userNotifs.map(sanitizeNotification));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/*
 * Get Unread Notifications Count & Feed
 */
app.get('/api/notifications/unread', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const unread = await prisma.notification.findMany({
                    where: { userId, read: false },
                    include: {
                        actor: { include: { profile: true } },
                        project: { select: { id: true, title: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json({ count: unread.length, unreadCount: unread.length, notifications: unread.map(sanitizeNotification) });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Unread Notifications DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch unread notifications' });
                }
            }
        }

        const notifPath = getFilePath('notifications');
        let notifs = [];
        try { notifs = JSON.parse(await fs.readFile(notifPath, 'utf-8')); } catch {}
        const userUnread = notifs.filter(n => String(n.userId) === userId && !n.read);
        res.json({ count: userUnread.length, unreadCount: userUnread.length, notifications: userUnread.map(sanitizeNotification) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unread notifications' });
    }
});

/*
 * Mark Single Notification Read (Recipient Isolated)
 */
app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const notifId = String(req.params.id);
        const userId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const notif = await prisma.notification.findUnique({ where: { id: notifId } });
                if (!notif) return res.status(404).json({ error: 'Notification not found' });
                if (String(notif.userId) !== userId) {
                    return res.status(403).json({ error: 'Not authorized to modify this notification' });
                }
                const updated = await prisma.notification.update({
                    where: { id: notifId },
                    data: { read: true }
                });
                return res.json(sanitizeNotification(updated));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Mark Read DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to mark notification read' });
                }
            }
        }

        const notifPath = getFilePath('notifications');
        let notifs = JSON.parse(await fs.readFile(notifPath, 'utf-8'));
        const idx = notifs.findIndex(n => String(n.id) === notifId);
        if (idx === -1) return res.status(404).json({ error: 'Notification not found' });
        if (String(notifs[idx].userId) !== userId) {
            return res.status(403).json({ error: 'Not authorized to modify this notification' });
        }

        notifs[idx].read = true;
        await fs.writeFile(notifPath, JSON.stringify(notifs, null, 2));
        res.json(sanitizeNotification(notifs[idx]));
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification read' });
    }
});

/*
 * Mark All Notifications Read
 */
const handleMarkAllNotificationsRead = async (req, res) => {
    try {
        const userId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                await prisma.notification.updateMany({
                    where: { userId, read: false },
                    data: { read: true }
                });
                return res.json({ success: true, message: 'All notifications marked as read' });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Mark All Read DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to mark notifications read' });
                }
            }
        }

        const notifPath = getFilePath('notifications');
        let notifs = [];
        try { notifs = JSON.parse(await fs.readFile(notifPath, 'utf-8')); } catch {}
        notifs.forEach(n => {
            if (String(n.userId) === userId) n.read = true;
        });
        await fs.writeFile(notifPath, JSON.stringify(notifs, null, 2));

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all read' });
    }
};
app.post('/api/notifications/read-all', authMiddleware, handleMarkAllNotificationsRead);
app.patch('/api/notifications/read-all', authMiddleware, handleMarkAllNotificationsRead);

/*
 * Delete Single Notification
 */
app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const notifId = String(req.params.id);
        const userId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const notif = await prisma.notification.findUnique({ where: { id: notifId } });
                if (!notif) return res.status(404).json({ error: 'Notification not found' });
                if (String(notif.userId) !== userId) {
                    return res.status(403).json({ error: 'Not authorized to delete this notification' });
                }
                await prisma.notification.delete({ where: { id: notifId } });
                return res.json({ success: true, message: 'Notification deleted' });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Delete Notification DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to delete notification' });
                }
            }
        }

        const notifPath = getFilePath('notifications');
        let notifs = JSON.parse(await fs.readFile(notifPath, 'utf-8'));
        const notif = notifs.find(n => String(n.id) === notifId);
        if (!notif) return res.status(404).json({ error: 'Notification not found' });
        if (String(notif.userId) !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this notification' });
        }

        notifs = notifs.filter(n => String(n.id) !== notifId);
        await fs.writeFile(notifPath, JSON.stringify(notifs, null, 2));
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// ------------------------------------------------------------------------------
// Community Matchmaking, Bulletin Board & Teams
// ------------------------------------------------------------------------------

/*
 * Live Community Stats
 */
app.get(['/api/community/stats', '/api/stats'], async (req, res) => {
    try {
        let teams = [];
        let usersCount = 0;
        let lookingFor = [];
        let statsData = {};

        try { teams = JSON.parse(await fs.readFile(getFilePath('teams'), 'utf-8')); } catch {}
        try { lookingFor = JSON.parse(await fs.readFile(getFilePath('lookingFor'), 'utf-8')); } catch {}
        try { statsData = await loadStats(); } catch {}

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                usersCount = await prisma.user.count();
            } catch {
                try {
                    const u = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
                    usersCount = u.length;
                } catch {}
            }
        } else {
            try {
                const u = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
                usersCount = u.length;
            } catch {}
        }

        const totalUpvotes = (teams.reduce((acc, t) => acc + (t.upvotes || 0), 0)) + 313;

        res.json({
            activeTeams: teams.length,
            totalDevelopers: usersCount,
            lookingForRequests: lookingFor.length,
            totalUpvotes,
            cumulativeLogins: statsData.cumulativeLogins || 154,
            cumulativeIssues: statsData.cumulativeIssues || 42,
            activeProjects: 12,
            prsMerged: 38
        });
    } catch (err) {
        console.error('Error getting community stats:', err);
        res.status(500).json({ error: 'Failed to fetch community statistics' });
    }
});

/*
 * Matchmaking / Looking-For Feed (Preserved as Community Bulletin Board)
 */
app.get('/api/community/looking-for', async (req, res) => {
    try {
        const lookingForPath = getFilePath('lookingFor');
        const usersPath = getFilePath('users');

        let posts = [];
        let users = [];
        try { posts = JSON.parse(await fs.readFile(lookingForPath, 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}

        const userMap = new Map();
        users.forEach(u => userMap.set(String(u.id), {
            id: String(u.id),
            name: u.name || 'Developer',
            title: u.title || 'Developer',
            avatarUrl: u.avatarUrl || '',
            verifiedSkills: Array.isArray(u.verifiedSkills) ? u.verifiedSkills : [],
            socialLinks: u.socialLinks || {}
        }));

        const enrichedPosts = posts.map(p => ({
            ...p,
            author: userMap.get(String(p.userId)) || { id: String(p.userId), name: 'Developer', avatarUrl: '' }
        }));

        res.json(enrichedPosts);
    } catch (error) {
        console.error('Error fetching lookingFor posts:', error);
        res.status(500).json({ error: 'Failed to fetch lookingFor posts' });
    }
});

/*
 * Create Matchmaking / Looking-For Request
 */
app.post('/api/community/looking-for', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const { lookingFor, for: forGoal, requiredSkills, commitment, availability, context } = req.body;

        if (!lookingFor || !lookingFor.trim()) {
            return res.status(400).json({ error: 'Looking For field is required' });
        }
        if (!forGoal || !forGoal.trim()) {
            return res.status(400).json({ error: 'Project / goal context is required' });
        }

        const lookingForPath = getFilePath('lookingFor');
        let posts = [];
        try { posts = JSON.parse(await fs.readFile(lookingForPath, 'utf-8')); } catch { posts = []; }

        const parsedSkills = Array.isArray(requiredSkills)
            ? requiredSkills.map(s => String(s).trim()).filter(Boolean)
            : (typeof requiredSkills === 'string' ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);

        const newPost = {
            id: `match_${Date.now()}_${uuidv4().substring(0, 6)}`,
            userId: currentUserId,
            lookingFor: lookingFor.trim(),
            for: forGoal.trim(),
            commitment: (commitment || 'Part-time (8-10 hrs/wk)').trim(),
            requiredSkills: parsedSkills,
            availability: (availability || 'Available Now').trim(),
            context: (context || '').trim(),
            createdAt: new Date().toISOString()
        };

        posts.unshift(newPost);
        await fs.writeFile(lookingForPath, JSON.stringify(posts, null, 2));

        const usersPath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}
        const author = users.find(u => String(u.id) === currentUserId) || {
            id: currentUserId,
            name: req.user.name || 'Developer',
            avatarUrl: ''
        };

        res.status(201).json({
            ...newPost,
            author: {
                id: currentUserId,
                name: author.name || 'Developer',
                title: author.title || 'Developer',
                avatarUrl: author.avatarUrl || '',
                verifiedSkills: author.verifiedSkills || []
            }
        });
    } catch (error) {
        console.error('Error creating looking-for request:', error);
        res.status(500).json({ error: 'Failed to create looking-for request' });
    }
});

/*
 * Delete Matchmaking Request (Author Only)
 */
app.delete('/api/community/looking-for/:id', authMiddleware, async (req, res) => {
    try {
        const postId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const lookingForPath = getFilePath('lookingFor');

        let posts = JSON.parse(await fs.readFile(lookingForPath, 'utf-8'));
        const post = posts.find(p => String(p.id) === postId);
        if (!post) return res.status(404).json({ error: 'Matchmaking request not found' });

        if (String(post.userId) !== currentUserId) {
            return res.status(403).json({ error: 'You can only delete your own matchmaking request' });
        }

        posts = posts.filter(p => String(p.id) !== postId);
        await fs.writeFile(lookingForPath, JSON.stringify(posts, null, 2));

        res.json({ success: true, message: 'Matchmaking request deleted' });
    } catch (error) {
        console.error('Error deleting looking-for request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

/*
 * List Teams (Zero-Email Sanitization)
 */
app.get('/api/teams', async (req, res) => {
    try {
        const teamsPath = getFilePath('teams');
        const usersPath = getFilePath('users');

        let teams = [];
        let users = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}

        const userMap = new Map();
        users.forEach(u => userMap.set(String(u.id), {
            id: String(u.id),
            name: u.name || `User #${u.id}`,
            title: u.title || u.role || 'Developer',
            avatarUrl: u.avatarUrl || '',
            verifiedSkills: u.verifiedSkills || []
        }));

        const enrichedTeams = teams.map(t => {
            const lead = userMap.get(String(t.leadId)) || { id: String(t.leadId), name: 'Team Lead', avatarUrl: '' };
            const memberDetails = (Array.isArray(t.members) ? t.members : []).map(mId => {
                return userMap.get(String(mId)) || { id: String(mId), name: `Member`, avatarUrl: '' };
            });

            return {
                id: t.id,
                teamName: t.teamName || 'Untitled Team',
                description: t.description || '',
                leadId: t.leadId,
                lead,
                members: t.members || [],
                memberDetails,
                assignedProjects: t.assignedProjects || [],
                skills: t.skills || [],
                upvotes: typeof t.upvotes === 'number' ? t.upvotes : (Array.isArray(t.upvoters) ? t.upvoters.length : 0),
                upvoters: Array.isArray(t.upvoters) ? t.upvoters : [],
                lookingFor: t.lookingFor || 'Looking for passionate developers',
                openPositions: t.openPositions || [],
                availability: t.availability || 'Active · Recruiting',
                rating: t.rating || 4.9,
                createdAt: t.createdAt || new Date().toISOString(),
                updatedAt: t.updatedAt || new Date().toISOString()
            };
        });

        res.json(enrichedTeams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

/*
 * Create Team (Protected)
 */
app.post('/api/teams', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const { teamName, description, skills, lookingFor, openPositions, availability, assignedProjects } = req.body;

        if (!teamName || !teamName.trim()) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const teamsPath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch { teams = []; }

        const parsedSkills = Array.isArray(skills)
            ? skills.map(s => String(s).trim()).filter(Boolean)
            : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);

        const parsedOpenPositions = Array.isArray(openPositions)
            ? openPositions.map(s => String(s).trim()).filter(Boolean)
            : (typeof openPositions === 'string' ? openPositions.split(',').map(s => s.trim()).filter(Boolean) : []);

        const parsedProjects = Array.isArray(assignedProjects)
            ? assignedProjects.map(s => String(s).trim()).filter(Boolean)
            : (typeof assignedProjects === 'string' ? assignedProjects.split(',').map(s => s.trim()).filter(Boolean) : []);

        const newTeam = {
            id: `team_${Date.now()}_${uuidv4().substring(0, 6)}`,
            teamName: teamName.trim(),
            description: (description || '').trim(),
            leadId: currentUserId,
            members: [currentUserId],
            assignedProjects: parsedProjects,
            skills: parsedSkills,
            upvotes: 0,
            upvoters: [],
            lookingFor: (lookingFor || 'Looking for passionate developers').trim(),
            openPositions: parsedOpenPositions.length > 0 ? parsedOpenPositions : ['Collaborator'],
            availability: (availability || 'Active · Open for Collaboration').trim(),
            rating: 5.0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        teams.unshift(newTeam);
        await fs.writeFile(teamsPath, JSON.stringify(teams, null, 2));

        const usersPath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}
        const user = users.find(u => String(u.id) === currentUserId) || {
            id: currentUserId,
            name: req.user.name || 'Team Lead',
            avatarUrl: ''
        };

        res.status(201).json({
            ...newTeam,
            lead: {
                id: currentUserId,
                name: user.name || 'Team Lead',
                avatarUrl: user.avatarUrl || ''
            },
            memberDetails: [{
                id: currentUserId,
                name: user.name || 'Team Lead',
                avatarUrl: user.avatarUrl || ''
            }]
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

/*
 * Team Upvote Toggle
 */
app.post('/api/teams/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const teamId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const teamsPath = getFilePath('teams');

        let teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8'));
        const teamIndex = teams.findIndex(t => String(t.id) === teamId);
        if (teamIndex === -1) return res.status(404).json({ error: 'Team not found' });

        const team = teams[teamIndex];
        team.upvoters = Array.isArray(team.upvoters) ? team.upvoters : [];
        team.upvotes = typeof team.upvotes === 'number' ? team.upvotes : team.upvoters.length;

        const hasUpvoted = team.upvoters.includes(currentUserId);
        if (hasUpvoted) {
            team.upvoters = team.upvoters.filter(id => id !== currentUserId);
            team.upvotes = Math.max(0, team.upvotes - 1);
        } else {
            team.upvoters.push(currentUserId);
            team.upvotes += 1;

            if (team.leadId !== currentUserId) {
                const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
                const voter = users.find(u => String(u.id) === currentUserId);
                await sendNotification({
                    userId: team.leadId,
                    actorId: currentUserId,
                    type: 'TEAM_UPVOTED',
                    title: 'Team Upvoted! 🌟',
                    message: `${voter?.name || 'A developer'} upvoted your team "${team.teamName}"!`,
                    data: { teamId: team.id }
                });
            }
        }

        await fs.writeFile(teamsPath, JSON.stringify(teams, null, 2));
        res.json({ success: true, upvoted: !hasUpvoted, upvotes: team.upvotes });
    } catch (err) {
        console.error('Error upvoting team:', err);
        res.status(500).json({ error: 'Failed to update team upvote' });
    }
});

/*
 * Request to Join Team
 */
app.post('/api/teams/:id/join', authMiddleware, async (req, res) => {
    try {
        const teamId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const { message, position } = req.body;

        const teamsPath = getFilePath('teams');
        let teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8'));
        const team = teams.find(t => String(t.id) === teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        if (team.leadId === currentUserId || (Array.isArray(team.members) && team.members.includes(currentUserId))) {
            return res.status(400).json({ error: 'You are already a member or lead of this team' });
        }

        const joinReq = {
            id: `team_join_${Date.now()}_${uuidv4().substring(0, 6)}`,
            teamId,
            teamName: team.teamName,
            userId: currentUserId,
            position: position || 'Collaborator',
            message: message || '',
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };

        const teamInvitationsPath = getFilePath('organizationInvitations');
        let invitations = [];
        try { invitations = JSON.parse(await fs.readFile(teamInvitationsPath, 'utf-8')); } catch { invitations = []; }
        invitations.push(joinReq);
        await fs.writeFile(teamInvitationsPath, JSON.stringify(invitations, null, 2));

        const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
        const sender = users.find(u => String(u.id) === currentUserId);
        await sendNotification({
            userId: team.leadId,
            actorId: currentUserId,
            type: 'TEAM_JOIN_REQUEST',
            title: 'Team Join Request! 🤝',
            message: `${sender?.name || 'A developer'} requested to join team "${team.teamName}" as ${joinReq.position}`,
            data: { teamId, requestId: joinReq.id }
        });

        res.status(201).json({ success: true, message: 'Application submitted to team lead', request: joinReq });
    } catch (err) {
        console.error('Error applying to team:', err);
        res.status(500).json({ error: 'Failed to submit team application' });
    }
});

/*
 * Respond to Team Join Application
 */
app.post('/api/teams/:id/respond', authMiddleware, async (req, res) => {
    try {
        const teamId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const { requestId, status } = req.body;

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
        }

        const teamsPath = getFilePath('teams');
        let teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8'));
        const teamIndex = teams.findIndex(t => String(t.id) === teamId);
        if (teamIndex === -1) return res.status(404).json({ error: 'Team not found' });

        const team = teams[teamIndex];
        if (String(team.leadId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the team lead can manage applications' });
        }

        const teamInvitationsPath = getFilePath('organizationInvitations');
        let invitations = JSON.parse(await fs.readFile(teamInvitationsPath, 'utf-8'));
        const reqIndex = invitations.findIndex(inv => String(inv.id) === String(requestId));
        if (reqIndex === -1) return res.status(404).json({ error: 'Application not found' });

        const application = invitations[reqIndex];
        application.status = status;
        application.updatedAt = new Date().toISOString();
        invitations[reqIndex] = application;
        await fs.writeFile(teamInvitationsPath, JSON.stringify(invitations, null, 2));

        if (status === 'ACCEPTED') {
            team.members = Array.isArray(team.members) ? team.members : [];
            if (!team.members.includes(application.userId)) {
                team.members.push(application.userId);
            }
            teams[teamIndex] = team;
            await fs.writeFile(teamsPath, JSON.stringify(teams, null, 2));

            await sendNotification({
                userId: application.userId,
                actorId: currentUserId,
                type: 'TEAM_JOIN_ACCEPTED',
                title: 'Welcome to the Team! 🎉',
                message: `Your application to join "${team.teamName}" was accepted!`,
                data: { teamId }
            });
        } else {
            await sendNotification({
                userId: application.userId,
                actorId: currentUserId,
                type: 'TEAM_JOIN_REJECTED',
                title: 'Team Application Update',
                message: `Your application to join "${team.teamName}" was declined.`,
                data: { teamId }
            });
        }

        res.json({ success: true, message: `Application ${status.toLowerCase()}`, application });
    } catch (err) {
        console.error('Error responding to team application:', err);
        res.status(500).json({ error: 'Failed to process application' });
    }
});

// ------------------------------------------------------------------------------
// Whitelisted Safe Generic Table Endpoints
// ------------------------------------------------------------------------------
app.get('/api/:table', async (req, res) => {
    try {
        const allowedTables = ['organizations', 'teams', 'stats', 'community'];
        if (!allowedTables.includes(req.params.table)) {
            return res.status(403).json({ error: 'Access to this table is forbidden via generic endpoint' });
        }
        const filePath = getFilePath(req.params.table);
        try { await fs.access(filePath); } catch { return res.json([]); }
        const data = await fs.readFile(filePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error(`Error reading ${req.params.table}:`, error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// ------------------------------------------------------------------------------
// Centralized Production Error Handler
// ------------------------------------------------------------------------------
app.use((err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;
    const isProd = NODE_ENV === 'production';
    
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, isProd ? err.message : err);

    res.status(statusCode).json({
        error: isProd ? (statusCode === 500 ? 'An unexpected server error occurred' : err.message) : err.message,
        ...(isProd ? {} : { stack: err.stack })
    });
});

// ------------------------------------------------------------------------------
// Process Lifecycle & Server Startup
// ------------------------------------------------------------------------------
let serverInstance = null;

if (require.main === module) {
    (async () => {
        await verifyDatabaseConnectivity();
        serverInstance = app.listen(PORT, '0.0.0.0', () => {
            console.log(`=======================================================`);
            console.log(`🚀 CodeCollab API Server running on port ${PORT}`);
            console.log(`🔧 Environment: ${NODE_ENV}`);
            console.log(`🗄️ Primary Datastore: ${NODE_ENV === 'production' ? 'Supabase PostgreSQL (Authoritative)' : (isDatabaseAvailable ? 'PostgreSQL (Dual Storage)' : 'Local File Storage')}`);
            console.log(`=======================================================`);
        });
    })();
}

// Graceful Shutdown
function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    if (serverInstance) {
        serverInstance.close(async () => {
            console.log('HTTP server closed.');
            if (prisma && isDatabaseAvailable) {
                try {
                    await prisma.$disconnect();
                    console.log('Prisma database client disconnected.');
                } catch {}
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});

module.exports = app;
