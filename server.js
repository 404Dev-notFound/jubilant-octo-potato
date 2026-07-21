const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// ==============================================
// DSA CONCEPT 1: Least Recently Used (LRU) Cache
// ==============================================
class Node {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}

class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.map = new Map();
        
        // Dummy head and tail
        this.head = new Node(null, null);
        this.tail = new Node(null, null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
    
    _remove(node) {
        const prev = node.prev;
        const next = node.next;
        prev.next = next;
        next.prev = prev;
    }
    
    _add(node) {
        // Add right after head
        const next = this.head.next;
        this.head.next = node;
        node.prev = this.head;
        node.next = next;
        next.prev = node;
    }
    
    get(key) {
        if (this.map.has(key)) {
            const node = this.map.get(key);
            this._remove(node);
            this._add(node);
            return node.value;
        }
        return null;
    }
    
    put(key, value) {
        if (this.map.has(key)) {
            this._remove(this.map.get(key));
        }
        const node = new Node(key, value);
        this._add(node);
        this.map.set(key, node);
        
        if (this.map.size > this.capacity) {
            const lru = this.tail.prev;
            this._remove(lru);
            this.map.delete(lru.key);
        }
    }
}

const projectCache = new LRUCache(10); // Cache size of 10

// ==============================================
// DSA CONCEPT 2: Trie (Prefix Tree) for Search
// ==============================================
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.projectIds = []; // Store references to matching projects
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }
    
    insert(word, projectId) {
        let node = this.root;
        for (let char of word.toLowerCase()) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
            // Add ID to all prefix nodes to allow partial searching
            if (!node.projectIds.includes(projectId)) {
                node.projectIds.push(projectId);
            }
        }
        node.isEndOfWord = true;
    }
    
    searchPrefix(prefix) {
        let node = this.root;
        for (let char of prefix.toLowerCase()) {
            if (!node.children[char]) return [];
            node = node.children[char];
        }
        return node.projectIds;
    }
}

const searchTrie = new Trie();

// Rebuild Trie on startup
async function buildTrie() {
    const projects = await prisma.project.findMany();
    for (const p of projects) {
        // Insert title words
        const words = p.title.split(' ');
        for (const w of words) {
            searchTrie.insert(w, p.id);
        }
    }
    console.log("Trie Search Engine initialized.");
}

// ==============================================
// Python Integration
// ==============================================
function runPythonAnalytics(projects) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['analytics.py']);
        let resultData = '';
        
        pythonProcess.stdout.on('data', (data) => {
            resultData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}`));
            } else {
                try {
                    resolve(JSON.parse(resultData));
                } catch (e) {
                    reject(e);
                }
            }
        });
        
        pythonProcess.stdin.write(JSON.stringify(projects));
        pythonProcess.stdin.end();
    });
}

// ==============================================
// API Routes
// ==============================================
app.get('/api/projects', async (req, res) => {
    const { query } = req.query;
    const cacheKey = query ? `search_${query}` : 'all_projects';
    
    // Check Cache
    const cachedData = projectCache.get(cacheKey);
    if (cachedData) {
        console.log(`[Cache Hit] Serving ${cacheKey} from LRU Cache`);
        return res.json(cachedData);
    }
    
    try {
        console.log(`[Cache Miss] Fetching ${cacheKey} from Database`);
        let dbProjects = [];
        
        if (query) {
            // Use Trie Search for fast lookup
            const matchedIds = searchTrie.searchPrefix(query);
            if (matchedIds.length > 0) {
                dbProjects = await prisma.project.findMany({
                    where: { id: { in: matchedIds } }
                });
            }
        } else {
            dbProjects = await prisma.project.findMany({
                orderBy: { isPinned: 'desc' }
            });
        }
        
        // Enhance with Python Analytics
        let finalProjects = dbProjects;
        try {
            finalProjects = await runPythonAnalytics(dbProjects);
        } catch (pyErr) {
            console.error("Failed to run Python analytics, returning raw DB records:", pyErr);
        }
        
        // Cache the result
        projectCache.put(cacheKey, finalProjects);
        
        res.json(finalProjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const data = req.body;
        const project = await prisma.project.create({
            data: {
                title: data.title,
                category: data.category,
                techStack: data.techStack.split(',').map(s => s.trim()),
                image: data.image,
                description: data.description,
                githubUrl: data.githubUrl,
                difficulty: data.difficulty || 'Beginner'
            }
        });
        
        // Invalidate 'all_projects' cache
        projectCache.put('all_projects', null);
        
        // Add to Trie
        const words = project.title.split(' ');
        for (const w of words) {
            searchTrie.insert(w, project.id);
        }
        
        res.status(201).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
    buildTrie(); // initialize search index
});
