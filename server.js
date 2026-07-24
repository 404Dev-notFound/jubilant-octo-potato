const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'codecollab data');

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get file path
const getFilePath = (table) => path.join(DATA_DIR, `${table}.json`);

// Read data
app.post('/api/auth/signup', async (req, res) => {
    try {
        const filePath = getFilePath('users');
        let users = [];
        // Load existing users if file exists
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            users = JSON.parse(data);
        } catch {}

        const { email, password, name } = req.body;
        // Prevent duplicate email registrations
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Mail existed already' });
        }

        // Hash password using bcryptjs (async)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            name,
            email,
            password: hashedPassword,
            progress: 0,
            potion: 0
        };
        users.push(newUser);
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
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
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate JWT (expires in 7 days)
        const token = jwt.sign({ id: user.id }, 'your-secret-key', { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Read data
app.get('/api/:table', async (req, res) => {
    try {
        const filePath = getFilePath(req.params.table);
        
        try {
            await fs.access(filePath);
        } catch {
            return res.json([]); // Return empty array if file doesn't exist
        }
        
        const data = await fs.readFile(filePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error(`Error reading ${req.params.table}:`, error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Write data
// Middleware to verify JWT for protected routes
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1]; // Expect format 'Bearer <token>'
    const jwt = require('jsonwebtoken');
    try {
        const payload = jwt.verify(token, 'your-secret-key');
        req.user = payload; // attach payload (e.g., { id }) to request
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

app.post('/api/:table', async (req, res) => {
    try {
        // Protect sensitive tables like 'projects'
        const protectedTables = ['projects', 'organizations'];
        if (protectedTables.includes(req.params.table)) {
            // Run token verification manually
            const authHeader = req.headers['authorization'];
            if (!authHeader) return res.status(401).json({ error: 'No token provided' });
            const token = authHeader.split(' ')[1];
            const jwt = require('jsonwebtoken');
            try { jwt.verify(token, 'your-secret-key'); } catch { return res.status(403).json({ error: 'Invalid token' }); }
        }
        const filePath = getFilePath(req.params.table);
        let records = [];
        try {
            const existingData = await fs.readFile(filePath, 'utf-8');
            records = JSON.parse(existingData);
        } catch {}
        const newRecord = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...req.body };
        records.push(newRecord);
        await fs.writeFile(filePath, JSON.stringify(records, null, 2));
        res.status(201).json(newRecord);
    } catch (error) {
        console.error(`Error writing ${req.params.table}:`, error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Storing data in: ${DATA_DIR}`);
});
