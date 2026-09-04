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

// Modular hardening and security utilities
const cookieParser = require('cookie-parser');
const {
    COOKIE_NAMES,
    getCookieOptions,
    setAuthCookies,
    clearAuthCookies,
    extractTokens,
    csrfProtectionMiddleware
} = require('./src/utils/cookieSecurity');
const { SessionService } = require('./src/services/sessionService');
const { NotificationService, sanitizeNotification } = require('./src/services/notificationService');
const { OAuthService } = require('./src/services/oauthService');
const { readJson, modifyJson, writeJson, JsonCorruptionError } = require('./src/storage/jsonStorage');
const { safeMergePreferences, safeMergeUserRecord, EDITABLE_PREFERENCE_FIELDS, sanitizeLinkMap } = require('./src/utils/preferenceMerge');
const { validateUrl, isSafeUrl, sanitizeSafeUrl } = require('./src/utils/urlSecurity');
const { validateSchema, validateBody, PROJECT_SCHEMA, ISSUE_SCHEMA, SIGNUP_SCHEMA, LOGIN_SCHEMA, CHANGE_PASSWORD_SCHEMA, UPDATE_PROFILE_SCHEMA, GOOGLE_AUTH_SCHEMA, GITHUB_AUTH_SCHEMA } = require('./src/utils/validation');
const { parsePagination, attachPaginationHeaders, paginateArray } = require('./src/utils/pagination');

// Safe constant-time decoy hash to eliminate authentication timing enumeration (Phase 2.8)
const DUMMY_BCRYPT_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

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
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
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

// ------------------------------------------------------------------------------
// Request Correlation ID Middleware (Phases 2.10 & 2.5)
// Strictly validates inbound X-Request-Id (alphanumeric, -, _, 1..64 chars)
// Prevents log forging and newline injection, sets response header
// ------------------------------------------------------------------------------
app.use((req, res, next) => {
    const inboundId = req.headers['x-request-id'];
    if (typeof inboundId === 'string' && /^[a-zA-Z0-9_\-]{1,64}$/.test(inboundId.trim())) {
        req.id = inboundId.trim();
    } else {
        req.id = uuidv4();
    }
    res.setHeader('X-Request-Id', req.id);
    next();
});

// Security headers with Helmet (Strict CSP without unsafe-inline for scripts) (Phases 15 & 18)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'sha256-eGFYqAHm7QB8cassdFBbBxhusmh76P1pfh3ymxPZOUw='",
                "https://unpkg.com",
                "https://accounts.google.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // Allowed for CSS variables & theme styling
                "https://fonts.googleapis.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
                "'self'",
                "https://jubilant-octo-potato-production.up.railway.app",
                "https://opensource-projects.netlify.app",
                "https://*.supabase.co",
                "https://unpkg.com",
                "https://accounts.google.com"
            ],
            frameSrc: ["'self'", "https://accounts.google.com"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false
}));

// ------------------------------------------------------------------------------
// Production-Grade CORS Configuration (With Robust Origin Normalization)
// ------------------------------------------------------------------------------
// Default explicitly trusted production, staging, and development origins
const DEFAULT_ALLOWED_ORIGINS = [
    'https://opensource-projects.netlify.app',
    'https://jubilant-octo-potato-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5500'
];

// Helper to normalize origins (strips trailing slashes, trims whitespace, lowercases)
const normalizeOrigin = (urlStr) => {
    if (!urlStr || typeof urlStr !== 'string') return '';
    return urlStr.trim().replace(/\/+$/, '').toLowerCase();
};

// Parse CORS_ORIGIN environment variable robustly (splits comma-separated list, trims, strips slashes)
const configuredOrigins = (CORS_ORIGIN === '*' ? ['*'] : CORS_ORIGIN.split(','))
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([
    ...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin),
    ...configuredOrigins
]));

// Safe origin validator: supports exact normalized match, wildcard, and Netlify preview subdomains
const isOriginAllowed = (origin) => {
    if (!origin) return true; // Allow same-origin / server-to-server / curl / mobile apps
    const normalized = normalizeOrigin(origin);
    if (configuredOrigins.includes('*')) return true;
    if (allowedOrigins.includes(normalized)) return true;

    // Safely allow Netlify branch & deploy preview subdomains (e.g., https://deploy-preview-12--opensource-projects.netlify.app)
    if (/^https:\/\/[a-z0-9-]+(\-\-[a-z0-9-]+)?\.netlify\.app$/.test(normalized)) {
        return true;
    }
    return false;
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Request-Id', 'X-Refresh-Token'],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Request-Id', 'X-Total-Count', 'X-Page', 'X-Limit', 'X-Total-Pages'],
    maxAge: 86400 // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));

// Body parsers with payload limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Cookie parsing & anti-CSRF protection for ambient cookie session mutations
app.use(cookieParser());
app.use(csrfProtectionMiddleware(isOriginAllowed));

// ------------------------------------------------------------------------------
// Malformed Request & Payload Error Handler (Phases 2.5 & 2.11)
// Clean 400 for malformed JSON, 413 for oversized payloads, zero reflection of inputs
// ------------------------------------------------------------------------------
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Malformed JSON payload', requestId: req.id });
    }
    if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({ error: 'Payload too large', requestId: req.id });
    }
    next(err);
});

// ------------------------------------------------------------------------------
// HTTP Caching Policy Middleware (Phase 15)
// API endpoints are private-by-default to prevent proxy/shared caching leaks
// ------------------------------------------------------------------------------
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Vary', 'Authorization, Accept');
    }
    next();
});

// ------------------------------------------------------------------------------
// Static Directory Shielding (Section 10.B)
// Strictly blocks direct HTTP access to datastore, schema, backend code, and config
// ------------------------------------------------------------------------------
const BLOCKED_STATIC_REGEX = /^\/(codecollab\s+data|prisma|scripts|test|\.env|\.git|src)(\/|$)/i;
app.use((req, res, next) => {
    let decodedPath = req.path;
    try {
        decodedPath = decodeURIComponent(req.path);
    } catch {
        return res.status(400).json({ error: 'Malformed request path', requestId: req.id });
    }
    if (BLOCKED_STATIC_REGEX.test(decodedPath) || decodedPath.includes('..') || decodedPath.startsWith('/.env')) {
        return res.status(403).json({ error: 'Access denied to restricted path', requestId: req.id });
    }
    next();
});

// Serve static frontend assets with appropriate caching
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff2?|ico)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// Rate Limiting for auth routes (Phase 6 & Section 10.C)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { error: 'Too many authentication attempts, please try again later.' }
});
const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { error: 'Too many password change attempts, please try again later.' }
});

app.use('/api/auth/', authLimiter);
app.use('/api/auth/change-password', passwordChangeLimiter);

let isDatabaseAvailable = false;
let lastDbCheckTime = 0;

// Centralized Session Service instance (Phases 4.2 & 2.9)
const sessionService = new SessionService(prisma, isDbConnected, refreshTokenStore);

async function isDbConnected(forceCheck = false) {
    if (NODE_ENV === 'production') {
        return true; // In production, database is strictly required
    }
    if ((process.env.NODE_ENV === 'test' || NODE_ENV === 'test') && !process.env.TEST_WITH_DB) {
        return false;
    }
    if (!prisma) return false;
    // In non-production, maintain datastore stability: do not flip from file fallback to DB mid-session
    if (!isDatabaseAvailable && !forceCheck) {
        return false;
    }
    const now = Date.now();
    if (!forceCheck && (now - lastDbCheckTime < 10000)) {
        return isDatabaseAvailable;
    }
    lastDbCheckTime = now;
    try {
        await withTimeout(prisma.$queryRaw`SELECT 1`, 2000);
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
                await withTimeout(prisma.$queryRaw`SELECT 1`, 2000);
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
// Authentication Middleware (Dual Bearer Header + HttpOnly Cookie Support)
// ------------------------------------------------------------------------------
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ error: 'Invalid token format. Expected Bearer <token>' });
        }
        token = parts[1];
    } else {
        const { accessToken } = extractTokens(req);
        token = accessToken;
    }

    if (!token) {
        return res.status(401).json({ error: 'No authorization token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Session token has expired', code: 'TOKEN_EXPIRED' });
            }
            return res.status(401).json({ error: 'Invalid or expired session token', code: 'TOKEN_INVALID' });
        }
        req.user = decoded; // { id, email, role, name }
        next();
    });
}

// Authoritative user display-name resolver (Phase 4.3)
async function resolveUserName(userId, fallback = 'Developer') {
    if (!userId) return fallback;
    const cleanId = String(userId);
    if (NODE_ENV === 'production' || (await isDbConnected())) {
        try {
            const u = await prisma.user.findUnique({
                where: { id: cleanId },
                include: { profile: true }
            });
            if (u) {
                if (u.profile?.firstName) {
                    return `${u.profile.firstName} ${u.profile.lastName || ''}`.trim();
                }
                if (u.name) return u.name;
            }
        } catch {}
    }
    try {
        const users = await readJson(getFilePath('users'), []);
        const u = (Array.isArray(users) ? users : []).find(x => String(x.id) === cleanId);
        if (u) {
            if (u.name) return u.name;
            if (u.profile?.firstName) return `${u.profile.firstName} ${u.profile.lastName || ''}`.trim();
        }
    } catch {}
    return fallback;
}

// Project privacy helper (Phase 2.1)
async function checkProjectPrivate(projectId) {
    if (!projectId) return false;
    const cleanProjectId = String(projectId);
    try {
        const rawProjects = await readJson(getFilePath('projects'), []);
        const p = (Array.isArray(rawProjects) ? rawProjects : []).find(x => String(x.id) === cleanProjectId);
        if (p) {
            return p.isPrivate === true || (typeof p.visibility === 'string' && p.visibility.toLowerCase() === 'private');
        }
    } catch {}
    return false;
}

// ------------------------------------------------------------------------------
// Storage & Sanitization Helpers
// ------------------------------------------------------------------------------
const getFilePath = (table) => {
    const normalized = table === 'looking_for' ? 'lookingFor' : path.basename(table);
    return path.join(DATA_DIR, `${normalized}.json`);
};
const getStatsPath = () => path.join(DATA_DIR, 'stats.json');

// Reusable user sanitizer (Zero-Email, No Passwords, Zero Mobile Leakage)
function sanitizeUserObj(u, fallbackName = 'Developer') {
    if (!u) return null;
    const { password, passwordHash, email, phoneNumber, mobileNumber, phone, ...safeUser } = u;
    const prefs = (typeof u.profile?.preferences === 'object' && u.profile?.preferences !== null) ? u.profile.preferences : {};
    return {
        id: String(safeUser.id || ''),
        name: safeUser.name || (safeUser.profile?.firstName ? `${safeUser.profile.firstName} ${safeUser.profile.lastName || ''}`.trim() : fallbackName),
        title: safeUser.title || prefs.title || safeUser.role || 'Developer',
        avatarUrl: sanitizeSafeUrl(safeUser.avatarUrl || safeUser.profile?.avatarUrl || '', ''),
        verifiedSkills: Array.isArray(safeUser.verifiedSkills) ? safeUser.verifiedSkills : (Array.isArray(prefs.verifiedSkills) ? prefs.verifiedSkills : []),
        skills: Array.isArray(safeUser.skills) ? safeUser.skills : (Array.isArray(prefs.skills) ? prefs.skills : []),
        bio: safeUser.bio || prefs.bio || '',
        availability: safeUser.availability || prefs.availability || 'Available Now',
        lookingFor: safeUser.lookingFor || prefs.lookingFor || 'Open for collaboration',
        socialLinks: sanitizeLinkMap(safeUser.socialLinks || prefs.socialLinks || {}),
        location: safeUser.location || prefs.location || '',
        rating: typeof safeUser.rating === 'number' ? safeUser.rating : (typeof prefs.rating === 'number' ? prefs.rating : 5.0),
        upvotes: typeof safeUser.upvotes === 'number' ? safeUser.upvotes : (typeof prefs.upvotes === 'number' ? prefs.upvotes : 0),
        upvoters: Array.isArray(safeUser.upvoters) ? safeUser.upvoters : (Array.isArray(prefs.upvoters) ? prefs.upvoters : []),
        followers: Array.isArray(safeUser.followers) ? safeUser.followers : (Array.isArray(prefs.followers) ? prefs.followers : [])
    };
}

// ------------------------------------------------------------------------------
// Centralized Domain Services (Notification & OAuth)
// ------------------------------------------------------------------------------
const notificationService = new NotificationService(prisma, isDbConnected);
const oauthService = new OAuthService({
    prismaClient: prisma,
    isDbConnectedFn: isDbConnected,
    sessionService,
    jwtSecret: JWT_SECRET,
    googleClientId: GOOGLE_CLIENT_ID,
    githubClientId: GITHUB_CLIENT_ID,
    githubClientSecret: GITHUB_CLIENT_SECRET,
    usersFilePath: getFilePath('users'),
    sanitizeUserFn: sanitizeUserObj
});

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

// Reusable helper to send and persist notifications via NotificationService
async function sendNotification({ userId, actorId, projectId, type, title, message, data = {} }) {
    if (!userId) return null;
    return notificationService.createNotification({ userId, actorId, projectId, type, title, message, data });
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
 * Session Restore & Verification Endpoint
 * Validates either cookie or Bearer token and returns sanitized user session
 */
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    include: { profile: true }
                });
                if (user) {
                    const sanitized = sanitizeUserObj(user);
                    return res.json({
                        authenticated: true,
                        user: { ...sanitized, email: user.email }
                    });
                }
            } catch (err) {
                if (NODE_ENV === 'production') throw err;
            }
        }

        const filePath = getFilePath('users');
        const users = await readJson(filePath, []);
        const user = users.find(u => String(u.id) === userId);
        if (user) {
            const sanitized = sanitizeUserObj(user);
            return res.json({
                authenticated: true,
                user: { ...sanitized, email: user.email }
            });
        }

        return res.status(404).json({ authenticated: false, error: 'User not found' });
    } catch (err) {
        console.error('Auth check error (/api/auth/me):', err);
        return res.status(500).json({ authenticated: false, error: 'Failed to verify session' });
    }
});

/*
 * Signup Endpoint
 */
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, role, mobileNumber, phoneNumber } = req.body;

        if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
        if (!email || !email.trim() || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
        if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const rawMobile = (mobileNumber || phoneNumber || '').trim();
        if (!rawMobile) {
            return res.status(400).json({ error: 'Mobile number is required for account registration' });
        }
        if (!/^[+]?[0-9\s\-()]{7,20}$/.test(rawMobile)) {
            return res.status(400).json({ error: 'Please provide a valid mobile number (7-20 digits)' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = String(Date.now());
        const names = name.trim().split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';
        const trimmedName = name.trim();

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
                                phoneNumber: rawMobile,
                                preferences: {
                                    title: role || 'Developer',
                                    role: role || 'Developer',
                                    bio: '',
                                    skills: [],
                                    availability: 'Available Now'
                                }
                            }
                        }
                    },
                    include: { profile: true }
                });

                const token = jwt.sign({ id: newUser.id, email: newUser.email, role: role || 'Developer', name: trimmedName }, JWT_SECRET, { expiresIn: '7d' });
                const refreshToken = uuidv4();
                await sessionService.createSession({ userId: newUser.id, refreshToken, ipAddress: req.ip, userAgent: req.get('User-Agent') });

                setAuthCookies(res, req, { accessToken: token, refreshToken });
                const sanitized = sanitizeUserObj(newUser);
                return res.status(201).json({
                    token,
                    refreshToken,
                    ...sanitized,
                    user: sanitized
                });
            } catch (dbErr) {
                console.error('Database signup error, falling back if non-production:', dbErr);
                if (NODE_ENV === 'production') throw dbErr;
            }
        }

        // Offline / Dev File Fallback with atomic storage
        const filePath = getFilePath('users');
        const users = await readJson(filePath, []);

        if (users.some(u => u.email && u.email.toLowerCase() === normalizedEmail)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const newUser = {
            id: userId,
            name: trimmedName,
            email: normalizedEmail,
            password: hashedPassword,
            phoneNumber: rawMobile,
            role: role || 'Developer',
            createdAt: new Date().toISOString()
        };

        await modifyJson(filePath, (uList = []) => {
            const list = Array.isArray(uList) ? uList : [];
            list.push(newUser);
            return list;
        }, []);

        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: trimmedName }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = uuidv4();
        await sessionService.createSession({ userId: newUser.id, refreshToken, ipAddress: req.ip, userAgent: req.get('User-Agent') });

        setAuthCookies(res, req, { accessToken: token, refreshToken });
        const sanitized = sanitizeUserObj(newUser);
        return res.status(201).json({
            token,
            refreshToken,
            ...sanitized,
            user: sanitized
        });

    } catch (err) {
        console.error('Signup Error:', err);
        return res.status(500).json({ error: 'Failed to create account' });
    }
});

/*
 * Login Endpoint (Timing-Attack Hardened & Session-Aware)
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, mobileNumber, phoneNumber } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const rawMobile = (mobileNumber || phoneNumber || '').trim();
        if (rawMobile && !/^[+]?[0-9\s\-()]{7,20}$/.test(rawMobile)) {
            return res.status(400).json({ error: 'Please provide a valid mobile number (7-20 digits)' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: normalizedEmail },
                    include: { profile: true }
                });

                if (!user || !user.passwordHash) {
                    // Timing mitigation: perform dummy hash comparison (Phase 2.8)
                    await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                const isMatch = await bcrypt.compare(password, user.passwordHash);
                if (!isMatch) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                // If mobile number provided, update UserProfile (strictly private)
                if (rawMobile) {
                    await prisma.userProfile.upsert({
                        where: { userId: user.id },
                        update: { phoneNumber: rawMobile },
                        create: {
                            userId: user.id,
                            phoneNumber: rawMobile,
                            firstName: 'Developer'
                        }
                    });
                }

                const resolvedName = await resolveUserName(user.id, 'Developer');
                const token = jwt.sign({ id: user.id, email: user.email, role: 'Developer', name: resolvedName }, JWT_SECRET, { expiresIn: '7d' });
                const refreshToken = uuidv4();
                await sessionService.createSession({ userId: user.id, refreshToken, ipAddress: req.ip, userAgent: req.get('User-Agent') });

                setAuthCookies(res, req, { accessToken: token, refreshToken });
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
        const users = await readJson(filePath, []);

        const userIndex = users.findIndex(u => u.email && u.email.toLowerCase() === normalizedEmail);
        if (userIndex === -1) {
            // Timing mitigation: perform dummy hash comparison (Phase 2.8)
            await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[userIndex];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        // Update mobile number in fallback record atomically
        if (rawMobile) {
            await modifyJson(filePath, (uList = []) => {
                const target = (Array.isArray(uList) ? uList : []).find(u => String(u.id) === String(user.id));
                if (target) target.phoneNumber = rawMobile;
                return uList;
            }, []);
        }

        const resolvedName = user.name || (user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : 'Developer');
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'Developer', name: resolvedName }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = uuidv4();
        await sessionService.createSession({ userId: user.id, refreshToken, ipAddress: req.ip, userAgent: req.get('User-Agent') });

        setAuthCookies(res, req, { accessToken: token, refreshToken });
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
 * Refresh Token Exchange (Rotates Token & Preserves Full Session Identity)
 */
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken: cookieRefreshToken } = extractTokens(req);
        const refreshToken = req.body?.refreshToken || cookieRefreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token is required' });
        }

        const userId = await sessionService.findUserIdByRefreshToken(refreshToken);
        if (!userId) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Revoke old refresh token (single-flight token rotation)
        await sessionService.revokeByRefreshToken(refreshToken);

        // Resolve identity
        const userName = await resolveUserName(userId, 'Developer');
        const newAccessToken = jwt.sign({ id: userId, name: userName }, JWT_SECRET, { expiresIn: '7d' });
        const newRefreshToken = uuidv4();
        await sessionService.createSession({ userId, refreshToken: newRefreshToken, ipAddress: req.ip, userAgent: req.get('User-Agent') });

        setAuthCookies(res, req, { accessToken: newAccessToken, refreshToken: newRefreshToken });
        res.json({ token: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

/*
 * Logout Endpoint (Revokes Server-Side Session & Clears Cookies)
 */
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { refreshToken: cookieRefreshToken } = extractTokens(req);
        const refreshToken = req.body?.refreshToken || cookieRefreshToken;
        if (refreshToken) {
            await sessionService.revokeByRefreshToken(refreshToken);
        }
        clearAuthCookies(res, req);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch {
        clearAuthCookies(res, req);
        res.json({ success: true });
    }
});

/*
 * List Active User Sessions (Phase 4.2)
 */
app.get('/api/auth/sessions', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const { refreshToken: cookieRefreshToken } = extractTokens(req);
        const currentRefreshToken = req.headers['x-refresh-token'] || cookieRefreshToken || req.body?.refreshToken || null;
        const sessions = await sessionService.listSessions(userId, currentRefreshToken);
        res.json({ sessions });
    } catch (err) {
        console.error('List sessions error:', err);
        res.status(500).json({ error: 'Failed to list active sessions' });
    }
});

/*
 * Revoke Individual Session (Phase 4.2 - User Scoped)
 */
app.delete('/api/auth/sessions/:id', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const sessionId = String(req.params.id);
        await sessionService.revokeSession(userId, sessionId);
        res.json({ success: true, message: 'Session revoked successfully' });
    } catch (err) {
        console.error('Revoke session error:', err);
        res.status(500).json({ error: 'Failed to revoke session' });
    }
});

/*
 * Logout Everywhere / Revoke All Sessions (Phase 4.2)
 */
app.post('/api/auth/logout-all', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        await sessionService.revokeAllUserSessions(userId);
        clearAuthCookies(res, req);
        res.json({ success: true, message: 'All active sessions have been revoked' });
    } catch (err) {
        console.error('Logout all error:', err);
        res.status(500).json({ error: 'Failed to revoke all sessions' });
    }
});

/*
 * Change Password with Session Revocation & Credential Reissuance (Phase 4.2)
 */
app.post('/api/auth/change-password', authMiddleware, passwordChangeLimiter, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        let passwordVerified = false;

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const userRecord = await prisma.user.findUnique({ where: { id: userId } });
                if (userRecord && userRecord.passwordHash) {
                    const isMatch = await bcrypt.compare(currentPassword, userRecord.passwordHash);
                    if (!isMatch) {
                        return res.status(401).json({ error: 'Current password is incorrect' });
                    }
                    const newHashed = await bcrypt.hash(newPassword, 10);
                    await prisma.user.update({
                        where: { id: userId },
                        data: { passwordHash: newHashed }
                    });
                    passwordVerified = true;
                }
            } catch (err) {
                if (NODE_ENV === 'production') throw err;
            }
        }

        if (!passwordVerified) {
            const users = await readJson(getFilePath('users'), []);
            const user = users.find(u => String(u.id) === userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            const newHashed = await bcrypt.hash(newPassword, 10);
            await modifyJson(getFilePath('users'), (uList) => {
                const target = (Array.isArray(uList) ? uList : []).find(x => String(x.id) === userId);
                if (target) target.password = newHashed;
                return uList;
            }, []);
        }

        // Revoke all existing sessions for safety
        await sessionService.revokeAllUserSessions(userId);

        // Reissue new credential pair for the current client
        const userName = await resolveUserName(userId, 'Developer');
        const token = jwt.sign({ id: userId, email: req.user.email, role: req.user.role || 'Developer', name: userName }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = uuidv4();
        await sessionService.createSession({ userId, refreshToken, ipAddress: req.ip, userAgent: req.get('User-Agent') });

        setAuthCookies(res, req, { accessToken: token, refreshToken });

        res.json({
            success: true,
            message: 'Password changed successfully. All previous sessions revoked.',
            token,
            refreshToken
        });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

/*
 * Google OAuth Endpoint
 */
app.post('/api/auth/google', validateBody(GOOGLE_AUTH_SCHEMA), async (req, res) => {
    try {
        const { credential } = req.validatedBody || req.body || {};
        const result = await oauthService.handleGoogleAuth({ credential, req, res });
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Google OAuth route error:', error);
        res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
});

/*
 * GitHub OAuth Authorization URL
 */
app.get('/api/auth/github/url', (req, res) => {
    try {
        const redirectUri = req.query.redirect_uri ? String(req.query.redirect_uri) : undefined;
        const result = oauthService.getGitHubAuthUrl(redirectUri);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('GitHub OAuth URL error:', error);
        res.status(500).json({ error: 'Failed to generate GitHub authorization URL' });
    }
});

/*
 * GitHub OAuth Code Exchange & Login
 */
app.post('/api/auth/github', validateBody(GITHUB_AUTH_SCHEMA), async (req, res) => {
    try {
        const { code } = req.validatedBody || req.body || {};
        const result = await oauthService.handleGitHubAuth({ code, req, res });
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('GitHub OAuth route error:', error);
        res.status(500).json({ error: 'Failed to authenticate with GitHub' });
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
 * Update Profile (Preserves Social Metrics & Internal Metadata)
 */
const handleUpdateProfile = async (req, res) => {
    try {
        const userId = String(req.user.id);
        const payload = req.validatedBody || req.body || {};
        const { name, avatarUrl } = payload;
        const names = (name || '').trim().split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';
        const safeAvatar = avatarUrl ? sanitizeSafeUrl(avatarUrl, '') : undefined;

        if (payload.socialLinks) {
            payload.socialLinks = sanitizeLinkMap(payload.socialLinks);
        }
        if (safeAvatar !== undefined) {
            payload.avatarUrl = safeAvatar;
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const existingProfile = await prisma.userProfile.findUnique({ where: { userId } });
                const currentPrefs = (typeof existingProfile?.preferences === 'object' && existingProfile?.preferences !== null)
                    ? existingProfile.preferences
                    : {};
                const mergedPrefs = safeMergePreferences(currentPrefs, payload);

                const updatedProfile = await prisma.userProfile.upsert({
                    where: { userId },
                    update: {
                        firstName: firstName || undefined,
                        lastName: lastName || undefined,
                        avatarUrl: safeAvatar || undefined,
                        preferences: mergedPrefs
                    },
                    create: {
                        userId,
                        firstName,
                        lastName,
                        avatarUrl: safeAvatar || '',
                        preferences: mergedPrefs
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
        let updatedUser = null;
        await modifyJson(filePath, (users = []) => {
            const list = Array.isArray(users) ? users : [];
            const index = list.findIndex(u => String(u.id) === userId);
            if (index === -1) return list;
            list[index] = safeMergeUserRecord(list[index], payload);
            updatedUser = list[index];
            return list;
        }, []);

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, profile: sanitizeUserObj(updatedUser) });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
app.put('/api/users/profile', authMiddleware, validateBody(UPDATE_PROFILE_SCHEMA, { isUpdate: true }), handleUpdateProfile);
app.post('/api/users/profile', authMiddleware, validateBody(UPDATE_PROFILE_SCHEMA, { isUpdate: true }), handleUpdateProfile);

/*
 * List Users / Developers (CRITICAL PRIVACY: Zero Email & Password Leakage)
 */
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
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}
        res.json(users.map(u => sanitizeUserObj(u)));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch developers' });
    }
});

/*
 * Get Single User Public Profile
 */
app.get('/api/users/:id', async (req, res) => {
    try {
        const rawId = req.params.id;
        if (!rawId || typeof rawId !== 'string' || !rawId.trim()) {
            return res.status(400).json({ error: 'Valid user ID is required' });
        }
        const userId = String(rawId).trim();
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    include: { profile: true }
                });
                if (!user) return res.status(404).json({ error: 'User not found' });
                return res.json(sanitizeUserObj(user));
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[User Get DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch user' });
                }
            }
        }

        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}
        const user = users.find(u => String(u.id) === userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(sanitizeUserObj(user));
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/*
 * Upvote Developer (Persisted in PostgreSQL UserProfile)
 */
app.post('/api/users/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const targetUserId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot upvote yourself' });
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const targetProfile = await prisma.userProfile.findUnique({ where: { userId: targetUserId } });
                if (!targetProfile) return res.status(404).json({ error: 'Developer not found' });

                const prefs = (typeof targetProfile.preferences === 'object' && targetProfile.preferences !== null) ? targetProfile.preferences : {};
                let upvoters = Array.isArray(prefs.upvoters) ? [...prefs.upvoters] : [];
                const hasUpvoted = upvoters.includes(currentUserId);
                let upvotes = typeof prefs.upvotes === 'number' ? prefs.upvotes : upvoters.length;

                if (hasUpvoted) {
                    upvoters = upvoters.filter(id => id !== currentUserId);
                    upvotes = Math.max(0, upvotes - 1);
                } else {
                    upvoters.push(currentUserId);
                    upvotes += 1;

                    await sendNotification({
                        userId: targetUserId,
                        actorId: currentUserId,
                        type: 'PROFILE_UPVOTED',
                        title: 'New Upvote! 🌟',
                        message: `${req.user.name || 'A developer'} upvoted your profile!`,
                        data: { upvoterId: currentUserId }
                    });
                }

                const mergedPrefs = { ...prefs, upvotes, upvoters };
                await prisma.userProfile.update({
                    where: { userId: targetUserId },
                    data: { preferences: mergedPrefs }
                });

                return res.json({ success: true, hasUpvoted: !hasUpvoted, upvoted: !hasUpvoted, upvotes, upvoters });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Upvote User DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to upvote developer' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { users = []; }
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

        res.json({ success: true, hasUpvoted: !hasUpvoted, upvoted: !hasUpvoted, upvotes: target.upvotes, upvoters: target.upvoters });
    } catch (error) {
        console.error('Error upvoting user:', error);
        res.status(500).json({ error: 'Failed to upvote developer' });
    }
});

/*
 * Follow Developer (Persisted in PostgreSQL UserProfile)
 */
app.post('/api/users/:id/follow', authMiddleware, async (req, res) => {
    try {
        const targetUserId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const targetProfile = await prisma.userProfile.findUnique({ where: { userId: targetUserId } });
                if (!targetProfile) return res.status(404).json({ error: 'Developer not found' });

                const prefs = (typeof targetProfile.preferences === 'object' && targetProfile.preferences !== null) ? targetProfile.preferences : {};
                let followers = Array.isArray(prefs.followers) ? [...prefs.followers] : [];
                const isFollowing = followers.includes(currentUserId);

                if (isFollowing) {
                    followers = followers.filter(id => id !== currentUserId);
                } else {
                    followers.push(currentUserId);

                    await sendNotification({
                        userId: targetUserId,
                        actorId: currentUserId,
                        type: 'NEW_FOLLOWER',
                        title: 'New Follower! 👥',
                        message: `${req.user.name || 'A developer'} started following you!`,
                        data: { followerId: currentUserId }
                    });
                }

                const mergedPrefs = { ...prefs, followers };
                await prisma.userProfile.update({
                    where: { userId: targetUserId },
                    data: { preferences: mergedPrefs }
                });

                return res.json({ success: true, hasFollowed: !isFollowing, following: !isFollowing, followersCount: followers.length, followers });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Follow User DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to follow developer' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { users = []; }
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

        res.json({ success: true, hasFollowed: !isFollowing, following: !isFollowing, followersCount: target.followers.length, followers: target.followers });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ error: 'Failed to follow developer' });
    }
});

/*
 * Update Availability (Persisted in PostgreSQL UserProfile)
 */
const handleUpdateAvailability = async (req, res) => {
    try {
        const userId = String(req.user.id);
        const { availability } = req.body;
        if (!availability || !availability.trim()) return res.status(400).json({ error: 'Availability string is required' });
        const trimmedAvailability = availability.trim();

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const existingProfile = await prisma.userProfile.findUnique({ where: { userId } });
                const existingPrefs = (existingProfile && typeof existingProfile.preferences === 'object' && existingProfile.preferences !== null) ? existingProfile.preferences : {};
                const mergedPrefs = { ...existingPrefs, availability: trimmedAvailability };

                await prisma.userProfile.upsert({
                    where: { userId },
                    update: { preferences: mergedPrefs },
                    create: { userId, preferences: mergedPrefs }
                });
                return res.json({ success: true, availability: trimmedAvailability });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Availability DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update availability' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const usersPath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch { users = []; }
        const idx = users.findIndex(u => String(u.id) === userId);
        if (idx === -1) return res.status(404).json({ error: 'User not found' });

        users[idx].availability = trimmedAvailability;
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        res.json({ success: true, availability: trimmedAvailability });
    } catch (err) {
        console.error('Error updating availability:', err);
        res.status(500).json({ error: 'Failed to update availability' });
    }
};
app.put('/api/users/availability', authMiddleware, handleUpdateAvailability);
app.post('/api/users/availability', authMiddleware, handleUpdateAvailability);

// ------------------------------------------------------------------------------
// Projects Endpoints
// ------------------------------------------------------------------------------

/*
 * List Projects (Server-side Search & Pagination)
 */
app.get('/api/projects', async (req, res) => {
    try {
        let currentUserId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && decoded.id) currentUserId = String(decoded.id);
            } catch {}
        }

        const pagination = parsePagination(req.query, {
            defaultLimit: 50,
            maxLimit: 100,
            allowedSortFields: ['createdAt', 'updatedAt', 'title', 'progress'],
            defaultSort: 'createdAt',
            defaultOrder: 'desc'
        });

        const searchTerm = (req.query.search || req.query.q || '').trim().toLowerCase();

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const whereClause = {};
                if (searchTerm) {
                    whereClause.OR = [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                        { category: { contains: searchTerm, mode: 'insensitive' } }
                    ];
                }

                const [totalCount, projects] = await Promise.all([
                    prisma.project.count({ where: whereClause }),
                    prisma.project.findMany({
                        where: whereClause,
                        include: {
                            owner: { include: { profile: true } },
                            members: true,
                            projectUpvotes: true
                        },
                        orderBy: { [pagination.sortBy]: pagination.order },
                        skip: pagination.skip,
                        take: pagination.limit
                    })
                ]);

                const formatted = projects.map(p => {
                    const upvotesList = Array.isArray(p.projectUpvotes) ? p.projectUpvotes : [];
                    return {
                        id: p.id,
                        title: p.title,
                        category: p.category,
                        difficulty: p.difficulty,
                        techStack: p.techStack || [],
                        image: p.image,
                        description: p.description,
                        readme: p.readme || p.description || '',
                        githubUrl: p.githubUrl,
                        isPinned: p.isPinned,
                        isDemo: p.isDemo,
                        progress: typeof p.progress === 'number' ? p.progress : (p.completionPercentage || 0),
                        upvotes: upvotesList.length,
                        hasUpvoted: currentUserId ? upvotesList.some(u => String(u.userId) === currentUserId) : false,
                        ownerId: p.ownerId,
                        owner: sanitizeUserObj(p.owner),
                        membersCount: p.members ? p.members.length : 0,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt
                    };
                });

                attachPaginationHeaders(res, {
                    page: pagination.page,
                    limit: pagination.limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / pagination.limit) || 1
                });

                return res.json(formatted);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Projects List DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch projects' });
                }
            }
        }

        const rawProjects = await readJson(getFilePath('projects'), []);
        let rawUsers = await readJson(getFilePath('users'), []);
        let rawMembers = await readJson(getFilePath('projectMembers'), []);
        let rawUpvotes = await readJson(getFilePath('projectUpvotes'), []);

        const usersMap = new Map();
        (Array.isArray(rawUsers) ? rawUsers : []).forEach(u => usersMap.set(String(u.id), u));

        let formatted = (Array.isArray(rawProjects) ? rawProjects : []).map(p => {
            const owner = p.ownerId ? usersMap.get(String(p.ownerId)) : null;
            const projectMembers = (Array.isArray(rawMembers) ? rawMembers : []).filter(m => String(m.projectId) === String(p.id));
            const projUpvotes = (Array.isArray(rawUpvotes) ? rawUpvotes : []).filter(u => String(u.projectId) === String(p.id));
            return {
                ...p,
                progress: typeof p.progress === 'number' ? p.progress : (p.completionPercentage || 0),
                readme: p.readme || p.description || '',
                upvotes: projUpvotes.length,
                hasUpvoted: currentUserId ? projUpvotes.some(u => String(u.userId) === currentUserId) : false,
                owner: sanitizeUserObj(owner),
                membersCount: projectMembers.length
            };
        });

        if (searchTerm) {
            formatted = formatted.filter(p => 
                (p.title && p.title.toLowerCase().includes(searchTerm)) ||
                (p.description && p.description.toLowerCase().includes(searchTerm)) ||
                (p.category && p.category.toLowerCase().includes(searchTerm))
            );
        }

        // Safe sorting
        formatted.sort((a, b) => {
            let valA = a[pagination.sortBy] || '';
            let valB = b[pagination.sortBy] || '';
            if (pagination.order === 'desc') {
                return valA < valB ? 1 : (valA > valB ? -1 : 0);
            }
            return valA > valB ? 1 : (valA < valB ? -1 : 0);
        });

        const paged = paginateArray(formatted, pagination.page, pagination.limit);
        attachPaginationHeaders(res, paged.pagination);

        res.json(paged.data);
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
        let currentUserId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && decoded.id) currentUserId = String(decoded.id);
            } catch {}
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    include: {
                        owner: { include: { profile: true } },
                        members: { include: { user: { include: { profile: true } } } },
                        issues: { include: { creator: { include: { profile: true } }, assignee: { include: { profile: true } } } },
                        projectUpvotes: true
                    }
                });

                if (!project) return res.status(404).json({ error: 'Project not found' });

                const upvotesList = Array.isArray(project.projectUpvotes) ? project.projectUpvotes : [];

                const formatted = {
                    id: project.id,
                    title: project.title,
                    category: project.category,
                    difficulty: project.difficulty,
                    techStack: project.techStack || [],
                    image: project.image,
                    description: project.description,
                    readme: project.readme || project.description || '',
                    githubUrl: project.githubUrl,
                    isPinned: project.isPinned,
                    isDemo: project.isDemo,
                    progress: typeof project.progress === 'number' ? project.progress : (project.completionPercentage || 0),
                    upvotes: upvotesList.length,
                    hasUpvoted: currentUserId ? upvotesList.some(u => String(u.userId) === currentUserId) : false,
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

        const rawProjects = await readJson(getFilePath('projects'), []);
        const project = (Array.isArray(rawProjects) ? rawProjects : []).find(p => String(p.id) === projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        let rawUsers = await readJson(getFilePath('users'), []);
        let rawMembers = await readJson(getFilePath('projectMembers'), []);
        let rawTasks = await readJson(getFilePath('tasks'), []);
        let rawUpvotes = await readJson(getFilePath('projectUpvotes'), []);

        const usersMap = new Map();
        (Array.isArray(rawUsers) ? rawUsers : []).forEach(u => usersMap.set(String(u.id), u));

        const owner = project.ownerId ? usersMap.get(String(project.ownerId)) : null;
        const projectMembers = (Array.isArray(rawMembers) ? rawMembers : []).filter(m => String(m.projectId) === projectId).map(m => ({
            ...m,
            user: sanitizeUserObj(usersMap.get(String(m.userId)))
        }));
        const projectTasks = (Array.isArray(rawTasks) ? rawTasks : []).filter(t => String(t.projectId) === projectId).map(t => formatIssue(t, usersMap));
        const projUpvotes = (Array.isArray(rawUpvotes) ? rawUpvotes : []).filter(u => String(u.projectId) === projectId);

        res.json({
            ...project,
            progress: typeof project.progress === 'number' ? project.progress : (project.completionPercentage || 0),
            readme: project.readme || project.description || '',
            upvotes: projUpvotes.length,
            hasUpvoted: currentUserId ? projUpvotes.some(u => String(u.userId) === currentUserId) : false,
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
 * Create Project (Authenticated & URL-Validated)
 */
app.post('/api/projects', authMiddleware, async (req, res) => {
    try {
        const { title, category, difficulty, techStack, image, description, readme, githubUrl, isPinned, isDemo, progress } = req.body;
        const currentUserId = String(req.user.id);

        if (!title || !title.trim()) return res.status(400).json({ error: 'Project title is required' });

        // Safe URL validation (Phase 2.7)
        if (githubUrl && !validateUrl(githubUrl)) {
            return res.status(400).json({ error: 'Invalid or unsafe githubUrl provided' });
        }
        if (image && !validateUrl(image)) {
            return res.status(400).json({ error: 'Invalid or unsafe image URL provided' });
        }

        const rawProgress = parseInt(progress, 10);
        const validProgress = (!isNaN(rawProgress) && rawProgress >= 0 && rawProgress <= 100) ? rawProgress : 0;

        const projectId = `proj_${Date.now()}_${uuidv4().substring(0, 6)}`;
        const projectPayload = {
            id: projectId,
            title: title.trim(),
            category: category || 'Engineering',
            difficulty: difficulty || 'Intermediate',
            techStack: Array.isArray(techStack) ? techStack : [],
            image: image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
            description: description || '',
            readme: readme || description || '',
            githubUrl: githubUrl || '',
            isPinned: Boolean(isPinned),
            isDemo: Boolean(isDemo),
            progress: validProgress,
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
                        owner: { include: { profile: true } },
                        projectUpvotes: true
                    }
                });

                return res.status(201).json({
                    ...createdProject,
                    upvotes: 0,
                    hasUpvoted: false,
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
        await modifyJson(projectsPath, (projects = []) => {
            const list = Array.isArray(projects) ? projects : [];
            list.unshift(projectPayload);
            return list;
        }, []);

        // Add owner as first member
        const membersPath = getFilePath('projectMembers');
        await modifyJson(membersPath, (members = []) => {
            const list = Array.isArray(members) ? members : [];
            list.push({
                projectId,
                userId: currentUserId,
                projectRole: 'owner',
                joinedAt: new Date().toISOString()
            });
            return list;
        }, []);

        let rawUsers = await readJson(getFilePath('users'), []);
        const owner = (Array.isArray(rawUsers) ? rawUsers : []).find(u => String(u.id) === currentUserId);

        res.status(201).json({
            ...projectPayload,
            upvotes: 0,
            hasUpvoted: false,
            owner: sanitizeUserObj(owner)
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

/*
 * Update Project (Owner-Only Authorization & Mass Assignment Prevention)
 */
const handleUpdateProject = async (req, res) => {
    try {
        const projectId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const updates = req.body;

        // Safe URL validation (Phase 2.7)
        if (updates.githubUrl !== undefined && updates.githubUrl !== '' && !validateUrl(updates.githubUrl)) {
            return res.status(400).json({ error: 'Invalid or unsafe githubUrl provided' });
        }
        if (updates.image !== undefined && updates.image !== '' && !validateUrl(updates.image)) {
            return res.status(400).json({ error: 'Invalid or unsafe image URL provided' });
        }

        let progressVal = undefined;
        if (updates.progress !== undefined) {
            const num = parseInt(updates.progress, 10);
            if (isNaN(num) || num < 0 || num > 100) {
                return res.status(400).json({ error: 'Progress percentage must be an integer between 0 and 100' });
            }
            progressVal = num;
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    include: {
                        projectUpvotes: true,
                        owner: { include: { profile: true } }
                    }
                });
                if (!project) return res.status(404).json({ error: 'Project not found' });
                if (String(project.ownerId) !== currentUserId) {
                    return res.status(403).json({ error: 'Only the project owner can edit this project' });
                }

                // Explicit allowlist update - zero mass assignment (Phase 2.6)
                const updated = await prisma.project.update({
                    where: { id: projectId },
                    data: {
                        title: updates.title !== undefined ? updates.title.trim() : undefined,
                        category: updates.category !== undefined ? updates.category : undefined,
                        difficulty: updates.difficulty !== undefined ? updates.difficulty : undefined,
                        techStack: Array.isArray(updates.techStack) ? updates.techStack : undefined,
                        image: updates.image !== undefined ? updates.image : undefined,
                        description: updates.description !== undefined ? updates.description : undefined,
                        readme: updates.readme !== undefined ? updates.readme : undefined,
                        githubUrl: updates.githubUrl !== undefined ? updates.githubUrl : undefined,
                        isPinned: updates.isPinned !== undefined ? Boolean(updates.isPinned) : undefined,
                        isDemo: updates.isDemo !== undefined ? Boolean(updates.isDemo) : undefined,
                        progress: progressVal !== undefined ? progressVal : undefined
                    },
                    include: {
                        owner: { include: { profile: true } },
                        projectUpvotes: true
                    }
                });

                const upvotesList = Array.isArray(updated.projectUpvotes) ? updated.projectUpvotes : [];

                return res.json({
                    ...updated,
                    upvotes: upvotesList.length,
                    hasUpvoted: upvotesList.some(u => String(u.userId) === currentUserId),
                    owner: sanitizeUserObj(updated.owner)
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Update Project DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update project' });
                }
            }
        }

        const projectsPath = getFilePath('projects');
        let updatedProj = null;
        let authForbidden = false;

        await modifyJson(projectsPath, (projects = []) => {
            const list = Array.isArray(projects) ? projects : [];
            const index = list.findIndex(p => String(p.id) === projectId);
            if (index === -1) return list;

            if (String(list[index].ownerId) !== currentUserId) {
                authForbidden = true;
                return list;
            }

            // Explicit allowlist update - NO raw spread of updates! (Phase 2.6)
            list[index] = { 
                ...list[index],
                title: updates.title !== undefined ? updates.title.trim() : list[index].title,
                description: updates.description !== undefined ? updates.description : list[index].description,
                readme: updates.readme !== undefined ? updates.readme : list[index].readme,
                category: updates.category !== undefined ? updates.category : list[index].category,
                difficulty: updates.difficulty !== undefined ? updates.difficulty : list[index].difficulty,
                techStack: Array.isArray(updates.techStack) ? updates.techStack : list[index].techStack,
                githubUrl: updates.githubUrl !== undefined ? updates.githubUrl : list[index].githubUrl,
                image: updates.image !== undefined ? updates.image : list[index].image,
                isPinned: updates.isPinned !== undefined ? Boolean(updates.isPinned) : list[index].isPinned,
                isDemo: updates.isDemo !== undefined ? Boolean(updates.isDemo) : list[index].isDemo,
                progress: progressVal !== undefined ? progressVal : (typeof list[index].progress === 'number' ? list[index].progress : 0),
                updatedAt: new Date().toISOString() 
            };
            updatedProj = list[index];
            return list;
        }, []);

        if (authForbidden) {
            return res.status(403).json({ error: 'Only the project owner can edit this project' });
        }
        if (!updatedProj) return res.status(404).json({ error: 'Project not found' });

        const rawUpvotes = await readJson(getFilePath('projectUpvotes'), []);
        const projUpvotes = (Array.isArray(rawUpvotes) ? rawUpvotes : []).filter(u => String(u.projectId) === projectId);

        res.json({
            ...updatedProj,
            upvotes: projUpvotes.length,
            hasUpvoted: projUpvotes.some(u => String(u.userId) === currentUserId)
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};
app.put('/api/projects/:id', authMiddleware, handleUpdateProject);
app.patch('/api/projects/:id', authMiddleware, handleUpdateProject);

/*
 * Project Upvote (Authenticated - Toggle Behavior)
 */
app.post('/api/projects/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({
                    where: { id: projectId }
                });
                if (!project) return res.status(404).json({ error: 'Project not found' });

                const existingUpvote = await prisma.projectUpvote.findUnique({
                    where: {
                        userId_projectId: {
                            userId: currentUserId,
                            projectId: projectId
                        }
                    }
                });

                let hasUpvoted = false;
                if (existingUpvote) {
                    await prisma.projectUpvote.delete({
                        where: { id: existingUpvote.id }
                    });
                    hasUpvoted = false;
                } else {
                    await prisma.projectUpvote.create({
                        data: {
                            userId: currentUserId,
                            projectId: projectId
                        }
                    });
                    hasUpvoted = true;
                }

                const upvotesCount = await prisma.projectUpvote.count({
                    where: { projectId: projectId }
                });

                return res.json({
                    success: true,
                    hasUpvoted,
                    upvotes: upvotesCount,
                    message: hasUpvoted ? 'Project upvoted' : 'Upvote removed'
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Project Upvote DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to toggle upvote' });
                }
            }
        }

        const upvotesPath = getFilePath('projectUpvotes');
        let upvotes = [];
        try { upvotes = JSON.parse(await fs.readFile(upvotesPath, 'utf-8')); } catch { upvotes = []; }

        const existingIndex = upvotes.findIndex(u => String(u.projectId) === projectId && String(u.userId) === currentUserId);
        let hasUpvoted = false;

        if (existingIndex !== -1) {
            upvotes.splice(existingIndex, 1);
            hasUpvoted = false;
        } else {
            upvotes.push({
                id: `upv_${Date.now()}_${uuidv4().substring(0, 6)}`,
                projectId,
                userId: currentUserId,
                createdAt: new Date().toISOString()
            });
            hasUpvoted = true;
        }

        await fs.writeFile(upvotesPath, JSON.stringify(upvotes, null, 2));

        const upvotesCount = upvotes.filter(u => String(u.projectId) === projectId).length;

        res.json({
            success: true,
            hasUpvoted,
            upvotes: upvotesCount,
            message: hasUpvoted ? 'Project upvoted' : 'Upvote removed'
        });
    } catch (error) {
        console.error('Error toggling project upvote:', error);
        res.status(500).json({ error: 'Failed to toggle project upvote' });
    }
});

/*
 * Update Project Progress (Owner-Only Dedicated Endpoint)
 */
app.patch('/api/projects/:id/progress', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const { progress } = req.body;

        const num = parseInt(progress, 10);
        if (isNaN(num) || num < 0 || num > 100) {
            return res.status(400).json({ error: 'Progress percentage must be an integer between 0 and 100' });
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const project = await prisma.project.findUnique({ where: { id: projectId } });
                if (!project) return res.status(404).json({ error: 'Project not found' });
                if (String(project.ownerId) !== currentUserId) {
                    return res.status(403).json({ error: 'Only the project owner can modify the project completion percentage' });
                }

                const updated = await prisma.project.update({
                    where: { id: projectId },
                    data: { progress: num },
                    include: { owner: { include: { profile: true } } }
                });

                return res.json({ 
                    success: true, 
                    message: 'Project completion percentage updated successfully', 
                    progress: updated.progress, 
                    project: { ...updated, owner: sanitizeUserObj(updated.owner) } 
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Update Progress DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update project progress' });
                }
            }
        }

        const projectsPath = getFilePath('projects');
        let projects = JSON.parse(await fs.readFile(projectsPath, 'utf-8'));
        const index = projects.findIndex(p => String(p.id) === projectId);
        if (index === -1) return res.status(404).json({ error: 'Project not found' });

        if (String(projects[index].ownerId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the project owner can modify the project completion percentage' });
        }

        projects[index].progress = num;
        projects[index].updatedAt = new Date().toISOString();
        await fs.writeFile(projectsPath, JSON.stringify(projects, null, 2));

        res.json({ 
            success: true, 
            message: 'Project completion percentage updated successfully', 
            progress: num, 
            project: projects[index] 
        });
    } catch (error) {
        console.error('Error updating project progress:', error);
        res.status(500).json({ error: 'Failed to update project progress' });
    }
});

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
// Issues / Tasks Endpoints (Authorization Hardened - Phase 2.1 & Pagination - Phase 7)
// ------------------------------------------------------------------------------

/*
 * List All Accessible Issues
 */
app.get('/api/issues', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const targetProjectId = (req.query.projectId && String(req.query.projectId).trim() !== '' && String(req.query.projectId) !== 'all') 
            ? String(req.query.projectId).trim() 
            : null;

        const pagination = parsePagination(req.query, {
            defaultLimit: 50,
            maxLimit: 100,
            allowedSortFields: ['createdAt', 'updatedAt', 'title', 'priority', 'status'],
            defaultSort: 'createdAt',
            defaultOrder: 'desc'
        });

        // 1. If targetProjectId provided, verify authorization if private
        if (targetProjectId) {
            const isPrivate = await checkProjectPrivate(targetProjectId);
            if (isPrivate) {
                const authorized = await isProjectAuthorized(targetProjectId, currentUserId);
                if (!authorized) {
                    return res.status(403).json({ error: 'Forbidden: You do not have permission to view issues for this private project' });
                }
            }
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const whereClause = targetProjectId ? { projectId: targetProjectId } : undefined;
                const issues = await prisma.issue.findMany({
                    where: whereClause,
                    include: {
                        project: { select: { id: true, title: true, ownerId: true } },
                        creator: { include: { profile: true } },
                        assignee: { include: { profile: true } }
                    },
                    orderBy: { [pagination.sortBy]: pagination.order }
                });

                // Filter out issues belonging to private projects user has no access to (Phase 2.1)
                const accessible = [];
                for (const i of issues) {
                    const isPrivate = await checkProjectPrivate(i.projectId);
                    if (!isPrivate) {
                        accessible.push(i);
                    } else {
                        const authorized = await isProjectAuthorized(i.projectId, currentUserId);
                        if (authorized) accessible.push(i);
                    }
                }

                const paged = paginateArray(accessible.map(i => formatIssue(i)), pagination);
                attachPaginationHeaders(res, paged);
                return res.json(paged.data);
            } catch (err) {
                console.error('[Issues List DB Error]:', err);
                if (NODE_ENV === 'production') {
                    return res.status(500).json({ error: 'Failed to fetch issues' });
                }
            }
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = await readJson(getFilePath('users'), []);
            (Array.isArray(rawUsers) ? rawUsers : []).forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const tasksPath = getFilePath('tasks');
        const tasks = await readJson(tasksPath, []);
        const filteredTasks = targetProjectId 
            ? (Array.isArray(tasks) ? tasks : []).filter(t => String(t.projectId) === targetProjectId)
            : (Array.isArray(tasks) ? tasks : []);

        // Filter out private project issues (Phase 2.1)
        const accessibleTasks = [];
        for (const t of filteredTasks) {
            const isPrivate = await checkProjectPrivate(t.projectId);
            if (!isPrivate) {
                accessibleTasks.push(t);
            } else {
                const authorized = await isProjectAuthorized(t.projectId, currentUserId);
                if (authorized) accessibleTasks.push(t);
            }
        }

        const paged = paginateArray(accessibleTasks.map(t => formatIssue(t, fileUsersMap)), pagination);
        attachPaginationHeaders(res, paged);
        res.json(paged.data);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

/*
 * List Issues for Specific Project (Authorization Enforced)
 */
app.get('/api/projects/:projectId/issues', authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId);
        const currentUserId = String(req.user.id);

        const isPrivate = await checkProjectPrivate(projectId);
        if (isPrivate) {
            const authorized = await isProjectAuthorized(projectId, currentUserId);
            if (!authorized) {
                return res.status(403).json({ error: 'Forbidden: You do not have permission to view issues for this private project' });
            }
        }

        const pagination = parsePagination(req.query, {
            defaultLimit: 50,
            maxLimit: 100,
            allowedSortFields: ['createdAt', 'updatedAt', 'title', 'priority', 'status'],
            defaultSort: 'createdAt',
            defaultOrder: 'desc'
        });

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const [totalCount, issues] = await Promise.all([
                    prisma.issue.count({ where: { projectId } }),
                    prisma.issue.findMany({
                        where: { projectId },
                        include: {
                            project: { select: { id: true, title: true } },
                            creator: { include: { profile: true } },
                            assignee: { include: { profile: true } }
                        },
                        orderBy: { [pagination.sortBy]: pagination.order },
                        skip: pagination.skip,
                        take: pagination.limit
                    })
                ]);

                attachPaginationHeaders(res, {
                    page: pagination.page,
                    limit: pagination.limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / pagination.limit) || 1
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
            const rawUsers = await readJson(getFilePath('users'), []);
            (Array.isArray(rawUsers) ? rawUsers : []).forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const tasksPath = getFilePath('tasks');
        const tasks = await readJson(tasksPath, []);
        const projectTasks = (Array.isArray(tasks) ? tasks : []).filter(t => String(t.projectId) === projectId);

        const paged = paginateArray(projectTasks.map(t => formatIssue(t, fileUsersMap)), pagination);
        attachPaginationHeaders(res, paged);
        res.json(paged.data);
    } catch (error) {
        console.error('Error fetching project issues:', error);
        res.status(500).json({ error: 'Failed to fetch project issues' });
    }
});

/*
 * Create Issue (Restricted to Project Owner and Confirmed Members)
 */
app.post(['/api/projects/:projectId/issues', '/api/issues'], authMiddleware, async (req, res) => {
    try {
        const projectId = String(req.params.projectId || req.body.projectId);
        const currentUserId = String(req.user.id);
        const { title, description, status, priority, tags, assigneeId } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

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
                    const actorName = await resolveUserName(currentUserId, 'A developer');
                    await sendNotification({
                        userId: issuePayload.assigneeId,
                        actorId: currentUserId,
                        projectId: projectId,
                        type: 'ISSUE_ASSIGNED',
                        title: 'New Issue Assignment 📋',
                        message: `${actorName} assigned you to issue "${createdIssue.title}"`,
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
        const newRecord = {
            ...issuePayload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await modifyJson(tasksPath, (tasks = []) => {
            const list = Array.isArray(tasks) ? tasks : [];
            list.unshift(newRecord);
            return list;
        }, []);

        let fileUsersMap = new Map();
        try {
            const rawUsers = await readJson(getFilePath('users'), []);
            (Array.isArray(rawUsers) ? rawUsers : []).forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        if (issuePayload.assigneeId && issuePayload.assigneeId !== currentUserId) {
            const actorName = await resolveUserName(currentUserId, 'A developer');
            await sendNotification({
                userId: issuePayload.assigneeId,
                actorId: currentUserId,
                projectId: projectId,
                type: 'ISSUE_ASSIGNED',
                title: 'New Issue Assignment 📋',
                message: `${actorName} assigned you to issue "${issuePayload.title}"`,
                data: { issueId: issuePayload.id, projectId }
            });
        }

        res.status(201).json(formatIssue(newRecord, fileUsersMap));
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
        let updatedTask = null;
        let authForbidden = false;

        let projects = [];
        try { projects = await readJson(getFilePath('projects'), []); } catch {}

        await modifyJson(tasksPath, (tasks = []) => {
            const list = Array.isArray(tasks) ? tasks : [];
            const index = list.findIndex(t => String(t.id) === issueId);
            if (index === -1) return list;

            const issue = list[index];
            const project = (Array.isArray(projects) ? projects : []).find(p => String(p.id) === String(issue.projectId));
            const isProjectOwner = project && String(project.ownerId) === currentUserId;
            const isCreator = String(issue.creatorId) === currentUserId;
            const isAssignee = String(issue.assigneeId) === currentUserId;

            if (!isProjectOwner && !isCreator && !isAssignee) {
                authForbidden = true;
                return list;
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
            updatedTask = tasks[index];
            return list;
        }, []);

        if (authForbidden) {
            return res.status(403).json({ error: 'Unauthorized to modify this issue' });
        }
        if (!updatedTask) return res.status(404).json({ error: 'Issue not found' });

        let fileUsersMap = new Map();
        try {
            const rawUsers = await readJson(getFilePath('users'), []);
            (Array.isArray(rawUsers) ? rawUsers : []).forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(formatIssue(updatedTask, fileUsersMap));
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
        let deleted = false;
        let authForbidden = false;

        let projects = [];
        try { projects = await readJson(getFilePath('projects'), []); } catch {}

        await modifyJson(tasksPath, (tasks = []) => {
            const list = Array.isArray(tasks) ? tasks : [];
            const idx = list.findIndex(t => String(t.id) === issueId);
            if (idx === -1) return list;

            const issue = list[idx];
            const project = (Array.isArray(projects) ? projects : []).find(p => String(p.id) === String(issue.projectId));
            const isProjectOwner = project && String(project.ownerId) === currentUserId;
            const isCreator = String(issue.creatorId) === currentUserId;

            if (!isProjectOwner && !isCreator) {
                authForbidden = true;
                return list;
            }

            list.splice(idx, 1);
            deleted = true;
            return list;
        }, []);

        if (authForbidden) {
            return res.status(403).json({ error: 'Unauthorized to delete this issue' });
        }
        if (!deleted) return res.status(404).json({ error: 'Issue not found' });
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
                const meetings = await prisma.meetingRequest.findMany({
                    where: { projectId, userId: currentUserId },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json((meetings || []).map(m => sanitizeMeetingRequest(m)));
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
        const userMeetings = meetings.filter(m => String(m.projectId) === projectId && String(m.userId) === currentUserId);
        res.json((userMeetings || []).map(m => sanitizeMeetingRequest(m)));
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
        const notifs = await notificationService.getUserNotifications(req.user.id);
        res.json(notifs);
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
        const unread = await notificationService.getUnreadNotifications(req.user.id);
        res.json({ count: unread.length, unreadCount: unread.length, notifications: unread });
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({ error: 'Failed to fetch unread notifications' });
    }
});

/*
 * Mark Single Notification Read (Recipient Isolated)
 */
app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const result = await notificationService.markAsRead(req.params.id, req.user.id);
        if (result.error) return res.status(result.status || 500).json({ error: result.error });
        res.json(result.notification);
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ error: 'Failed to mark notification read' });
    }
});

/*
 * Mark All Notifications Read
 */
const handleMarkAllNotificationsRead = async (req, res) => {
    try {
        const result = await notificationService.markAllAsRead(req.user.id);
        res.json(result);
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        res.status(500).json({ error: 'Failed to mark notifications read' });
    }
};
app.post('/api/notifications/read-all', authMiddleware, handleMarkAllNotificationsRead);
app.patch('/api/notifications/read-all', authMiddleware, handleMarkAllNotificationsRead);

/*
 * Delete Single Notification
 */
app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const result = await notificationService.deleteNotification(req.params.id, req.user.id);
        if (result.error) return res.status(result.status || 500).json({ error: result.error });
        res.json({ success: true, message: result.message });
    } catch (error) {
        console.error('Error deleting notification:', error);
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
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const [teamsCount, usersCount, lookingForCount, projectsCount, issuesCount] = await Promise.all([
                    prisma.team.count().catch(() => 0),
                    prisma.user.count().catch(() => 0),
                    prisma.lookingFor.count().catch(() => 0),
                    prisma.project.count().catch(() => 0),
                    prisma.issue.count().catch(() => 0)
                ]);

                return res.json({
                    activeTeams: teamsCount,
                    totalDevelopers: usersCount,
                    lookingForRequests: lookingForCount,
                    totalUpvotes: (teamsCount * 25) + 313,
                    cumulativeLogins: usersCount * 8 + 42,
                    cumulativeIssues: issuesCount,
                    activeProjects: projectsCount,
                    prsMerged: 38
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Stats DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch community statistics' });
                }
            }
        }

        let teams = [];
        let usersCount = 0;
        let lookingFor = [];
        let statsData = {};

        try { teams = JSON.parse(await fs.readFile(getFilePath('teams'), 'utf-8')); } catch {}
        try { lookingFor = JSON.parse(await fs.readFile(getFilePath('lookingFor'), 'utf-8')); } catch {}
        try { statsData = await loadStats(); } catch {}
        try {
            const u = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            usersCount = u.length;
        } catch {}

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
 * Matchmaking / Looking-For Feed (Persisted in Supabase PostgreSQL)
 */
app.get('/api/community/looking-for', async (req, res) => {
    try {
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const posts = await prisma.lookingFor.findMany({
                    include: {
                        user: {
                            include: { profile: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const formatted = posts.map(p => {
                    const safeAuthor = sanitizeUserObj(p.user);
                    return {
                        id: p.id,
                        userId: p.userId,
                        lookingFor: p.lookingFor,
                        for: p.forProject,
                        requiredSkills: p.requiredSkills || [],
                        commitment: p.commitment,
                        availability: p.availability,
                        context: p.context || '',
                        createdAt: p.createdAt.toISOString(),
                        author: safeAuthor || { id: p.userId, name: 'Developer', avatarUrl: '' }
                    };
                });
                return res.json(formatted);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[LookingFor List DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch looking-for posts' });
                }
            }
        }

        const lookingForPath = getFilePath('lookingFor');
        const usersPath = getFilePath('users');

        let posts = [];
        let users = [];
        try { posts = JSON.parse(await fs.readFile(lookingForPath, 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}

        const userMap = new Map();
        users.forEach(u => userMap.set(String(u.id), sanitizeUserObj(u)));

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
 * Create Matchmaking / Looking-For Request (Persisted in Supabase PostgreSQL)
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

        const parsedSkills = Array.isArray(requiredSkills)
            ? requiredSkills.map(s => String(s).trim()).filter(Boolean)
            : (typeof requiredSkills === 'string' ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);

        const commitmentVal = (commitment || 'Part-time (8-10 hrs/wk)').trim();
        const availabilityVal = (availability || 'Available Now').trim();
        const contextVal = (context || '').trim();

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const newPost = await prisma.lookingFor.create({
                    data: {
                        userId: currentUserId,
                        lookingFor: lookingFor.trim(),
                        forProject: forGoal.trim(),
                        requiredSkills: parsedSkills,
                        commitment: commitmentVal,
                        availability: availabilityVal,
                        context: contextVal
                    },
                    include: {
                        user: {
                            include: { profile: true }
                        }
                    }
                });

                const safeAuthor = sanitizeUserObj(newPost.user);
                return res.status(201).json({
                    id: newPost.id,
                    userId: newPost.userId,
                    lookingFor: newPost.lookingFor,
                    for: newPost.forProject,
                    requiredSkills: newPost.requiredSkills,
                    commitment: newPost.commitment,
                    availability: newPost.availability,
                    context: newPost.context,
                    createdAt: newPost.createdAt.toISOString(),
                    author: safeAuthor || { id: currentUserId, name: req.user.name || 'Developer', avatarUrl: '' }
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Create LookingFor DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to create looking-for request' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const lookingForPath = getFilePath('lookingFor');
        let posts = [];
        try { posts = JSON.parse(await fs.readFile(lookingForPath, 'utf-8')); } catch { posts = []; }

        const fallbackPost = {
            id: `match_${Date.now()}_${uuidv4().substring(0, 6)}`,
            userId: currentUserId,
            lookingFor: lookingFor.trim(),
            for: forGoal.trim(),
            commitment: commitmentVal,
            requiredSkills: parsedSkills,
            availability: availabilityVal,
            context: contextVal,
            createdAt: new Date().toISOString()
        };

        posts.unshift(fallbackPost);
        await fs.writeFile(lookingForPath, JSON.stringify(posts, null, 2));

        const usersPath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}
        const user = users.find(u => String(u.id) === currentUserId);
        const safeAuthor = user ? sanitizeUserObj(user) : { id: currentUserId, name: req.user.name || 'Developer', avatarUrl: '' };

        res.status(201).json({
            ...fallbackPost,
            author: safeAuthor
        });
    } catch (error) {
        console.error('Error creating looking-for request:', error);
        res.status(500).json({ error: 'Failed to create looking-for request' });
    }
});

/*
 * Delete Matchmaking Request (Author Only, Persisted in Supabase PostgreSQL)
 */
app.delete('/api/community/looking-for/:id', authMiddleware, async (req, res) => {
    try {
        const postId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const post = await prisma.lookingFor.findUnique({ where: { id: postId } });
                if (!post) return res.status(404).json({ error: 'Matchmaking request not found' });
                if (String(post.userId) !== currentUserId) {
                    return res.status(403).json({ error: 'You can only delete your own matchmaking request' });
                }
                await prisma.lookingFor.delete({ where: { id: postId } });
                return res.json({ success: true, message: 'Matchmaking request deleted' });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Delete LookingFor DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to delete matchmaking request' });
                }
            }
        }

        const lookingForPath = getFilePath('lookingFor');
        let posts = [];
        try { posts = JSON.parse(await fs.readFile(lookingForPath, 'utf-8')); } catch {}
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
 * List Teams (Persisted in Supabase PostgreSQL)
 */
app.get('/api/teams', async (req, res) => {
    try {
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const teams = await prisma.team.findMany({
                    include: {
                        lead: { include: { profile: true } },
                        members: {
                            include: {
                                user: { include: { profile: true } }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const formattedTeams = teams.map(t => {
                    const lead = sanitizeUserObj(t.lead) || { id: t.leadId, name: 'Team Lead', avatarUrl: '' };
                    const memberDetails = (t.members || []).map(m => sanitizeUserObj(m.user) || { id: m.userId, name: 'Member', avatarUrl: '' });
                    const memberIds = (t.members || []).map(m => m.userId);

                    return {
                        id: t.id,
                        teamName: t.teamName,
                        description: t.description || '',
                        leadId: t.leadId,
                        lead,
                        members: memberIds.length > 0 ? memberIds : [t.leadId],
                        memberDetails: memberDetails.length > 0 ? memberDetails : [lead],
                        assignedProjects: t.assignedProjects || [],
                        skills: t.skills || [],
                        upvotes: t.upvotes || 0,
                        upvoters: t.upvoters || [],
                        lookingFor: t.lookingFor || 'Looking for passionate developers',
                        openPositions: t.openPositions || [],
                        availability: t.availability || 'Active · Open for Collaboration',
                        rating: t.rating || 5.0,
                        createdAt: t.createdAt.toISOString(),
                        updatedAt: t.updatedAt.toISOString()
                    };
                });

                return res.json(formattedTeams);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Teams List DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch teams' });
                }
            }
        }

        const teamsPath = getFilePath('teams');
        const usersPath = getFilePath('users');

        let teams = [];
        let users = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}

        const userMap = new Map();
        users.forEach(u => userMap.set(String(u.id), sanitizeUserObj(u)));

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
 * Create Team (Persisted in Supabase PostgreSQL)
 */
app.post('/api/teams', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const { teamName, description, skills, lookingFor, openPositions, availability, assignedProjects } = req.body;

        if (!teamName || !teamName.trim()) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const parsedSkills = Array.isArray(skills)
            ? skills.map(s => String(s).trim()).filter(Boolean)
            : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);

        const parsedOpenPositions = Array.isArray(openPositions)
            ? openPositions.map(s => String(s).trim()).filter(Boolean)
            : (typeof openPositions === 'string' ? openPositions.split(',').map(s => s.trim()).filter(Boolean) : []);

        const parsedProjects = Array.isArray(assignedProjects)
            ? assignedProjects.map(s => String(s).trim()).filter(Boolean)
            : (typeof assignedProjects === 'string' ? assignedProjects.split(',').map(s => s.trim()).filter(Boolean) : []);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const team = await prisma.team.create({
                    data: {
                        teamName: teamName.trim(),
                        description: (description || '').trim(),
                        leadId: currentUserId,
                        assignedProjects: parsedProjects,
                        skills: parsedSkills,
                        lookingFor: (lookingFor || 'Looking for passionate developers').trim(),
                        openPositions: parsedOpenPositions.length > 0 ? parsedOpenPositions : ['Collaborator'],
                        availability: (availability || 'Active · Open for Collaboration').trim(),
                        members: {
                            create: {
                                userId: currentUserId,
                                role: 'lead'
                            }
                        }
                    },
                    include: {
                        lead: { include: { profile: true } },
                        members: {
                            include: {
                                user: { include: { profile: true } }
                            }
                        }
                    }
                });

                const lead = sanitizeUserObj(team.lead) || { id: currentUserId, name: req.user.name || 'Team Lead', avatarUrl: '' };
                const memberDetails = (team.members || []).map(m => sanitizeUserObj(m.user) || { id: m.userId, name: 'Team Lead', avatarUrl: '' });

                return res.status(201).json({
                    id: team.id,
                    teamName: team.teamName,
                    description: team.description,
                    leadId: team.leadId,
                    lead,
                    members: [currentUserId],
                    memberDetails,
                    assignedProjects: team.assignedProjects,
                    skills: team.skills,
                    upvotes: 0,
                    upvoters: [],
                    lookingFor: team.lookingFor,
                    openPositions: team.openPositions,
                    availability: team.availability,
                    rating: team.rating,
                    createdAt: team.createdAt.toISOString(),
                    updatedAt: team.updatedAt.toISOString()
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Create Team DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to create team' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const teamsPath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch { teams = []; }

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
        const user = users.find(u => String(u.id) === currentUserId);
        const safeLead = user ? sanitizeUserObj(user) : { id: currentUserId, name: req.user.name || 'Team Lead', avatarUrl: '' };

        res.status(201).json({
            ...newTeam,
            lead: safeLead,
            memberDetails: [safeLead]
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

/*
 * Team Upvote Toggle (Persisted in Supabase PostgreSQL)
 */
app.post('/api/teams/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const teamId = String(req.params.id);
        const currentUserId = String(req.user.id);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const team = await prisma.team.findUnique({
                    where: { id: teamId },
                    include: { lead: { include: { profile: true } } }
                });
                if (!team) return res.status(404).json({ error: 'Team not found' });

                let upvoters = Array.isArray(team.upvoters) ? [...team.upvoters] : [];
                const hasUpvoted = upvoters.includes(currentUserId);
                let upvotes = typeof team.upvotes === 'number' ? team.upvotes : upvoters.length;

                if (hasUpvoted) {
                    upvoters = upvoters.filter(id => id !== currentUserId);
                    upvotes = Math.max(0, upvotes - 1);
                } else {
                    upvoters.push(currentUserId);
                    upvotes += 1;

                    if (team.leadId !== currentUserId) {
                        await sendNotification({
                            userId: team.leadId,
                            actorId: currentUserId,
                            type: 'TEAM_UPVOTED',
                            title: 'Team Upvoted! 🌟',
                            message: `${req.user.name || 'A developer'} upvoted your team "${team.teamName}"!`,
                            data: { teamId: team.id }
                        });
                    }
                }

                await prisma.team.update({
                    where: { id: teamId },
                    data: { upvotes, upvoters }
                });

                return res.json({ success: true, hasUpvoted: !hasUpvoted, upvoted: !hasUpvoted, upvotes, upvoters });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Upvote Team DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to update team upvote' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const teamsPath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch { teams = []; }
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
        res.json({ success: true, hasUpvoted: !hasUpvoted, upvoted: !hasUpvoted, upvotes: team.upvotes, upvoters: team.upvoters });
    } catch (err) {
        console.error('Error upvoting team:', err);
        res.status(500).json({ error: 'Failed to update team upvote' });
    }
});

/*
 * Request to Join Team (Persisted in Supabase PostgreSQL)
 */
app.post('/api/teams/:id/join', authMiddleware, async (req, res) => {
    try {
        const teamId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const { message, position } = req.body;

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const team = await prisma.team.findUnique({
                    where: { id: teamId },
                    include: { members: true }
                });
                if (!team) return res.status(404).json({ error: 'Team not found' });

                const isAlreadyMember = team.leadId === currentUserId || team.members.some(m => m.userId === currentUserId);
                if (isAlreadyMember) {
                    return res.status(400).json({ error: 'You are already a member or lead of this team' });
                }

                const application = await prisma.teamApplication.create({
                    data: {
                        teamId,
                        userId: currentUserId,
                        position: position || 'Collaborator',
                        message: message || '',
                        status: 'PENDING'
                    }
                });

                await sendNotification({
                    userId: team.leadId,
                    actorId: currentUserId,
                    type: 'TEAM_JOIN_REQUEST',
                    title: 'Team Join Request! 🤝',
                    message: `${req.user.name || 'A developer'} requested to join team "${team.teamName}" as ${application.position}`,
                    data: { teamId, requestId: application.id }
                });

                return res.status(201).json({
                    success: true,
                    message: 'Application submitted to team lead',
                    request: {
                        id: application.id,
                        teamId: application.teamId,
                        teamName: team.teamName,
                        userId: application.userId,
                        position: application.position,
                        message: application.message,
                        status: application.status,
                        createdAt: application.createdAt.toISOString()
                    }
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Team Join DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to submit team application' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const teamsPath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch { teams = []; }
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
 * Respond to Team Join Application (Persisted in Supabase PostgreSQL)
 */
app.post('/api/teams/:id/respond', authMiddleware, async (req, res) => {
    try {
        const teamId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const { requestId, status } = req.body;

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
        }

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const team = await prisma.team.findUnique({
                    where: { id: teamId },
                    include: { members: true }
                });
                if (!team) return res.status(404).json({ error: 'Team not found' });
                if (String(team.leadId) !== currentUserId) {
                    return res.status(403).json({ error: 'Only the team lead can manage applications' });
                }

                const application = await prisma.teamApplication.findUnique({
                    where: { id: String(requestId) }
                });
                if (!application) return res.status(404).json({ error: 'Application not found' });

                await prisma.teamApplication.update({
                    where: { id: String(requestId) },
                    data: { status }
                });

                if (status === 'ACCEPTED') {
                    await prisma.teamMember.upsert({
                        where: {
                            teamId_userId: {
                                teamId,
                                userId: application.userId
                            }
                        },
                        update: { role: 'member' },
                        create: {
                            teamId,
                            userId: application.userId,
                            role: 'member'
                        }
                    });

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

                return res.json({ success: true, message: `Application ${status.toLowerCase()}`, application });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Team Respond DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to process application' });
                }
            }
        }

        // File fallback
        await fs.mkdir(DATA_DIR, { recursive: true });
        const teamsPath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch { teams = []; }
        const teamIndex = teams.findIndex(t => String(t.id) === teamId);
        if (teamIndex === -1) return res.status(404).json({ error: 'Team not found' });

        const team = teams[teamIndex];
        if (String(team.leadId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the team lead can manage applications' });
        }

        const teamInvitationsPath = getFilePath('organizationInvitations');
        let invitations = [];
        try { invitations = JSON.parse(await fs.readFile(teamInvitationsPath, 'utf-8')); } catch { invitations = []; }
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
// Organizations Endpoints (Persisted in Supabase PostgreSQL)
// ------------------------------------------------------------------------------

/*
 * List Organizations
 */
app.get('/api/organizations', async (req, res) => {
    try {
        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const orgs = await prisma.organization.findMany({
                    include: {
                        owner: { include: { profile: true } },
                        members: { include: { user: { include: { profile: true } } } }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const formatted = orgs.map(o => ({
                    id: o.id,
                    name: o.name,
                    description: o.description || '',
                    logo: o.logo || '',
                    website: o.website || '',
                    githubUrl: o.githubUrl || '',
                    ownerId: o.ownerId,
                    owner: sanitizeUserObj(o.owner) || { id: o.ownerId, name: 'Owner', avatarUrl: '' },
                    tags: o.tags || [],
                    membersCount: (o.members || []).length,
                    members: (o.members || []).map(m => sanitizeUserObj(m.user) || { id: m.userId, name: 'Member', avatarUrl: '' }),
                    createdAt: o.createdAt.toISOString(),
                    updatedAt: o.updatedAt.toISOString()
                }));

                return res.json(formatted);
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Organizations DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch organizations' });
                }
            }
        }

        await fs.mkdir(DATA_DIR, { recursive: true });
        const filePath = getFilePath('organizations');
        let orgs = [];
        try { orgs = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}
        res.json(orgs);
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

/*
 * Create Organization
 */
app.post('/api/organizations', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const { name, description, logo, website, githubUrl, tags } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Organization name is required' });
        }

        const parsedTags = Array.isArray(tags)
            ? tags.map(s => String(s).trim()).filter(Boolean)
            : (typeof tags === 'string' ? tags.split(',').map(s => s.trim()).filter(Boolean) : []);

        if (NODE_ENV === 'production' || (await isDbConnected())) {
            try {
                const org = await prisma.organization.create({
                    data: {
                        name: name.trim(),
                        description: (description || '').trim(),
                        logo: (logo || '').trim(),
                        website: (website || '').trim(),
                        githubUrl: (githubUrl || '').trim(),
                        ownerId: currentUserId,
                        tags: parsedTags,
                        members: {
                            create: {
                                userId: currentUserId,
                                role: 'owner'
                            }
                        }
                    },
                    include: {
                        owner: { include: { profile: true } },
                        members: { include: { user: { include: { profile: true } } } }
                    }
                });

                return res.status(201).json({
                    id: org.id,
                    name: org.name,
                    description: org.description,
                    logo: org.logo,
                    website: org.website,
                    githubUrl: org.githubUrl,
                    ownerId: org.ownerId,
                    owner: sanitizeUserObj(org.owner),
                    tags: org.tags,
                    membersCount: 1,
                    members: (org.members || []).map(m => sanitizeUserObj(m.user)),
                    createdAt: org.createdAt.toISOString(),
                    updatedAt: org.updatedAt.toISOString()
                });
            } catch (err) {
                if (NODE_ENV === 'production') {
                    console.error('[Create Org DB Error]:', err.message);
                    return res.status(500).json({ error: 'Failed to create organization' });
                }
            }
        }

        await fs.mkdir(DATA_DIR, { recursive: true });
        const filePath = getFilePath('organizations');
        let orgs = [];
        try { orgs = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { orgs = []; }

        const newOrg = {
            id: `org_${Date.now()}_${uuidv4().substring(0, 6)}`,
            name: name.trim(),
            description: (description || '').trim(),
            logo: (logo || '').trim(),
            website: (website || '').trim(),
            githubUrl: (githubUrl || '').trim(),
            ownerId: currentUserId,
            tags: parsedTags,
            members: [currentUserId],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        orgs.unshift(newOrg);
        await fs.writeFile(filePath, JSON.stringify(orgs, null, 2));

        res.status(201).json(newOrg);
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({ error: 'Failed to create organization' });
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
        await fs.mkdir(DATA_DIR, { recursive: true });
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
    const requestId = req.id || 'unknown';
    
    const safeMethod = String(req.method).replace(/[\r\n]/g, '');
    console.error(`[Error][${requestId}] ${safeMethod}:`, err.message || 'Error occurred');

    res.status(statusCode).json({
        error: isProd ? (statusCode === 500 ? 'An unexpected server error occurred' : err.message) : (err.message || 'An error occurred'),
        requestId,
        ...(isProd ? {} : { stack: err.stack })
    });
});

// ------------------------------------------------------------------------------
// Process Lifecycle & Server Startup
// ------------------------------------------------------------------------------
let serverInstance = null;

if (require.main === module) {
    (async () => {
        // Phase 19: Build verification check on startup
        try {
            const { verifyBuild } = require('./scripts/verify-build');
            verifyBuild({ exitOnError: NODE_ENV === 'production', silent: false });
        } catch (bvErr) {
            console.warn('⚠️ [Build Verification Warning]:', bvErr.message);
        }

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
