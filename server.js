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
        
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            users = JSON.parse(data);
        } catch {
            // File doesn't exist yet
        }
        
        // Check if email already exists
        const { email, password, name } = req.body;
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Mail existed already' });
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            name,
            email,
            password, // Plain text for local dev as requested/assumed
            progress: 0,
            potion: 0
        };
        
        users.push(newUser);
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        
        // Remove password from response
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
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        // If file doesn't exist, no users exist yet
        res.status(401).json({ error: 'Invalid email or password' });
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
app.post('/api/:table', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Storing data in: ${DATA_DIR}`);
});
