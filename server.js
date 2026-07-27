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

// JWT verification middleware for protected routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = decoded; // { id, email }
    next();
  });
}

// Helper function to get file path
const getFilePath = (table) => path.join(DATA_DIR, `${table}.json`);

// Read data
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
app.post('/api/auth/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken && refreshTokenStore.has(refreshToken)) {
        refreshTokenStore.delete(refreshToken);
    }
    // Client should also clear stored tokens
    res.json({ success: true });
});

// Google Sign‑In / Sign‑Up
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
