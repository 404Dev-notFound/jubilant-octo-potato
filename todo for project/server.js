/*
 * Server entry point for the CodeCollab application.
 * Handles authentication, CRUD operations, and token refresh.
 */
const { loadEnv } = require('./load-env.js');
loadEnv();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); // Google OAuth
const { v4: uuidv4 } = require('uuid'); // Refresh token generator
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const fs = require('fs/promises');
const path = require('path');
// In‑memory store for valid refresh tokens
const refreshTokenStore = new Map();

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'codecollab data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// JWT verification middleware for protected routes
/*
 * JWT verification middleware for protected routes.
 * Extracts the token from the Authorization header, verifies it,
 * and attaches the decoded user payload to the request object.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('authMiddleware hit:', req.path, 'header:', authHeader);
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('jwt verify error:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded; // { id, email }
    next();
  });
}

// Helper function to get file path
/* Helper to construct absolute paths for JSON data tables */
const getFilePath = (table) => path.join(DATA_DIR, `${table}.json`);

// Read data
/*
 * User signup endpoint.
 * Creates a new user, hashes the password, stores the record,
 * and returns JWT + refresh token for immediate login.
 */
app.post('/api/auth/signup', async (req, res) => {
      try {
        const filePath = getFilePath('users');
        let users = [];

        try {
          const data = await fs.readFile(filePath, 'utf-8');
          users = JSON.parse(data);
        } catch { /* file may not exist yet */ }

        const { email, password, name } = req.body;
        if (users.find(u => u.email === email)) {
          return res.status(400).json({ error: 'Mail existed already' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          name,
          email,
          password: hashedPassword,
          role: 'user',
          progress: 0,
          potion: 0
        };

        users.push(newUser);
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        // Generate tokens for immediate login after signup
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role || 'user' }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = uuidv4();
        refreshTokenStore.set(refreshToken, newUser.id);

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ ...userWithoutPassword, token, refreshToken });
      } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to sign up' });
      }
    });

    /*
 * User login endpoint.
 * Validates credentials, issues JWT and refresh token.
 */
app.post('/api/auth/login', async (req, res) => {
        try {
            const filePath = getFilePath('users');
            const data = await fs.readFile(filePath, 'utf-8');
            const users = JSON.parse(data);

            const { email, password } = req.body;
            const user = users.find(u => u.email === email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const bcrypt = require('bcryptjs');
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const { password: _, ...userWithoutPassword } = user;
            // Generate access JWT (valid 1h) and refresh token
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = uuidv4();
            // Store refresh token in memory linked to user id
            refreshTokenStore.set(refreshToken, user.id);
            res.json({ ...userWithoutPassword, token, refreshToken });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    });

// Read data (public)

// Specific projects endpoint with sanitization
app.get('/api/projects', async (req, res) => {
    try {
        // Fetch projects from Prisma database
        const projects = await prisma.project.findMany();
        // Ensure all expected fields are present (fallbacks for legacy data)
        const sanitized = projects.map(p => ({
            ...p,
            techStack: p.techStack ?? [],
            category: p.category ?? 'Other',
            difficulty: p.difficulty ?? 'Beginner',
            complexityScore: p.complexityScore ?? 0,
            isDemo: p.isDemo ?? false,
            image: p.image ?? '',
            description: p.description ?? '',
            githubUrl: p.githubUrl ?? ''
        }));
        res.json(sanitized);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Sanitized users list endpoint for Assignee picker and profiles
app.get('/api/users', async (req, res) => {
    try {
        const filePath = getFilePath('users');
        let users = [];
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            users = JSON.parse(data);
        } catch { }
        
        // Strip sensitive password hashes
        const sanitized = users.map(u => {
            const { password, passwordHash, ...safeUser } = u;
            return safeUser;
        });
        res.json(sanitized);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/:table', async (req, res) => {
    try {
        const filePath = getFilePath(req.params.table);
        try { await fs.access(filePath); } catch { return res.json([]); }
        const data = await fs.readFile(filePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error(`Error reading ${req.params.table}:`, error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Write project data to Prisma PostgreSQL (protected)
app.post('/api/projects', authMiddleware, async (req, res) => {
    try {
        const { title, category, difficulty, techStack, image, description, githubUrl, isPinned, isDemo } = req.body;
        
        let techStackArray = techStack;
        if (typeof techStack === 'string') {
            techStackArray = techStack.split(',').map(s => s.trim());
        }

        const project = await prisma.project.create({
            data: {
                title: title || 'Untitled Project',
                category: category || 'Other',
                difficulty: difficulty || 'Beginner',
                techStack: techStackArray || [],
                image: image || '',
                description: description || '',
                githubUrl: githubUrl || '',
                isPinned: isPinned === 'on' || isPinned === true,
                isDemo: isDemo === 'on' || isDemo === true,
                // ownerId left null — users currently live in JSON files, not the Prisma User table
                ownerId: null
            }
        });
        
        res.status(201).json(project);
    } catch (error) {
        console.error('Error writing project to Prisma:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Issue endpoints - Protected with JWT Authentication
app.get('/api/projects/:projectId/issues', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const issues = await prisma.issue.findMany({
            where: {
                projectId: projectId
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

app.post('/api/projects/:projectId/issues', authMiddleware, async (req, res) => {
    try {
        const { title, description, status, priority, tags, assigneeId } = req.body;
        const projectId = req.params.projectId;
        
        // SECURITY ENFORCEMENT: creatorId strictly comes from decoded JWT req.user.id
        const creatorId = req.user.id;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Issue title is required' });
        }

        // Verify that the project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        let tagsArray = [];
        if (Array.isArray(tags)) {
            tagsArray = tags.map(t => String(t).trim()).filter(Boolean);
        } else if (typeof tags === 'string') {
            tagsArray = tags.split(',').map(s => s.trim()).filter(Boolean);
        }

        // Validate Status enum
        const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
        const issueStatus = validStatuses.includes(status) ? status : 'TODO';

        // Validate Priority enum
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const issuePriority = validPriorities.includes(priority) ? priority : 'MEDIUM';

        const issue = await prisma.issue.create({
            data: {
                title: title.trim(),
                description: description ? description.trim() : '',
                status: issueStatus,
                priority: issuePriority,
                tags: tagsArray,
                assigneeId: assigneeId ? String(assigneeId).trim() : null,
                creatorId,
                projectId
            }
        });
        
        console.log(`[Issue Created] ID: ${issue.id}, Project: ${projectId}, Creator: ${creatorId}, Status: ${issue.status}`);
        res.status(201).json(issue);
    } catch (error) {
        console.error('Error creating issue in Prisma:', error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

app.patch('/api/projects/:projectId/issues/:issueId', authMiddleware, async (req, res) => {
    try {
        const { status, priority, description, assigneeId, tags, title } = req.body;
        
        const updateData = {};
        if (status !== undefined) {
            const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
            if (validStatuses.includes(status)) updateData.status = status;
        }
        if (priority !== undefined) {
            const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
            if (validPriorities.includes(priority)) updateData.priority = priority;
        }
        if (description !== undefined) updateData.description = description.trim();
        if (assigneeId !== undefined) updateData.assigneeId = assigneeId ? String(assigneeId).trim() : null;
        if (tags !== undefined) {
            updateData.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (title !== undefined && title.trim()) updateData.title = title.trim();

        const issue = await prisma.issue.update({
            where: { id: req.params.issueId },
            data: updateData
        });
        res.json(issue);
    } catch (error) {
        console.error('Error updating issue in Prisma:', error);
        res.status(500).json({ error: 'Failed to update issue' });
    }
});

app.delete('/api/projects/:projectId/issues/:issueId', authMiddleware, async (req, res) => {
    try {
        await prisma.issue.delete({
            where: { id: req.params.issueId }
        });
        res.json({ success: true, message: 'Issue deleted successfully' });
    } catch (error) {
        console.error('Error deleting issue in Prisma:', error);
        res.status(500).json({ error: 'Failed to delete issue' });
    }
});

// Write data (protected)
app.post('/api/:table', authMiddleware, async (req, res) => {
    try {
        const filePath = getFilePath(req.params.table);
        let records = [];
        try {
            const existingData = await fs.readFile(filePath, 'utf-8');
            records = JSON.parse(existingData);
        } catch {
            // File doesn't exist yet, we'll start with empty array
        }
        
        // Add ID and timestamp
        const newRecord = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...req.body
        };
        
        records.push(newRecord);
        
        await fs.writeFile(filePath, JSON.stringify(records, null, 2));
        res.status(201).json(newRecord);
    } catch (error) {
        console.error(`Error writing ${req.params.table}:`, error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Refresh token endpoint
/*
 * Refresh token endpoint.
 * Exchanges a valid refresh token for a new access token and refresh token.
 */
app.post('/api/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokenStore.has(refreshToken)) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const userId = refreshTokenStore.get(refreshToken);
    // Locate user data to embed email claim
    const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const newAccessToken = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = uuidv4();
    refreshTokenStore.delete(refreshToken);
    refreshTokenStore.set(newRefreshToken, user.id);
    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
});

// Logout endpoint – invalidate refresh token
/*
 * Logout endpoint.
 * Invalidates the provided refresh token.
 */
app.post('/api/auth/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken && refreshTokenStore.has(refreshToken)) {
        refreshTokenStore.delete(refreshToken);
    }
    // Client should also clear stored tokens
    res.json({ success: true });
});

// Google Sign‑In / Sign‑Up
/*
 * Google OAuth endpoint.
 * Verifies Google ID token, finds or creates a user,
 * and returns JWT + refresh token.
 */
app.post('/api/auth/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });
    try {
        const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name || payload.email.split('@')[0];
        // Find or create user
        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { }
        let user = users.find(u => u.email === email);
        if (!user) {
            // Create new user with a placeholder password (random)
            const placeholder = uuidv4();
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(placeholder, 10);
            user = { id: Date.now().toString(), createdAt: new Date().toISOString(), name, email, password: hashedPassword, progress: 0, potion: 0 };
            users.push(user);
            await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = uuidv4();
        refreshTokenStore.set(refreshToken, user.id);
        const { password: _, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, token, refreshToken });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Storing data in: ${DATA_DIR}`);
});
