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
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In‑memory store for valid refresh tokens
const refreshTokenStore = new Map();

const app = express();
const PORT = process.env.PORT || 3000;
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
const getStatsPath = () => path.join(DATA_DIR, 'stats.json');

// Sync existing users from users.json into PostgreSQL Prisma User table on startup
async function syncUsersToPrisma() {
  try {
    const filePath = getFilePath('users');
    let users = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      users = JSON.parse(data);
    } catch {}

    for (const u of users) {
      if (!u.id || !u.email) continue;
      const strId = String(u.id);
      const existing = await prisma.user.findUnique({
        where: { id: strId },
        include: { profile: true }
      });

      if (!existing) {
        const emailExisting = await prisma.user.findUnique({
          where: { email: u.email }
        });
        if (!emailExisting) {
          await prisma.user.create({
            data: {
              id: strId,
              email: u.email,
              passwordHash: u.password || null,
              isVerified: true,
              status: 'active',
              profile: {
                create: {
                  firstName: u.name || u.email.split('@')[0],
                  lastName: '',
                  avatarUrl: u.avatarUrl || ''
                }
              }
            }
          });
        } else {
          await prisma.userProfile.upsert({
            where: { userId: emailExisting.id },
            update: {
              firstName: u.name || u.email.split('@')[0],
              avatarUrl: u.avatarUrl || ''
            },
            create: {
              userId: emailExisting.id,
              firstName: u.name || u.email.split('@')[0],
              lastName: '',
              avatarUrl: u.avatarUrl || ''
            }
          });
        }
      } else if (!existing.profile) {
        await prisma.userProfile.create({
          data: {
            userId: existing.id,
            firstName: u.name || u.email.split('@')[0],
            lastName: '',
            avatarUrl: u.avatarUrl || ''
          }
        });
      }
    }
    console.log('✅ Users synchronized to PostgreSQL via Prisma');
  } catch (err) {
    console.error('Error syncing users to Prisma:', err);
  }
}

syncUsersToPrisma();

// Load stats, create if missing
async function loadStats() {
  const statsPath = getStatsPath();
  try {
    const data = await fs.readFile(statsPath, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      cumulativeLogins: Number(parsed.cumulativeLogins) || 0,
      cumulativeVisits: Number(parsed.cumulativeVisits) || 0,
      cumulativeIssues: Number(parsed.cumulativeIssues) || 0,
      totalLOC: Number(parsed.totalLOC) || 0
    };
  } catch {
    const init = { cumulativeLogins: 0, cumulativeVisits: 0, cumulativeIssues: 0, totalLOC: 0 };
    await fs.writeFile(statsPath, JSON.stringify(init, null, 2));
    return init;
  }
}

async function saveStats(stats) {
  const statsPath = getStatsPath();
  await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
}

function formatLOC(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M+';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K+';
  return (num / 1e3).toFixed(1) + 'K+';
}

function formatStatNumber(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M+';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K+';
  return String(num);
}

// Compute LOC recursively across the codebase
async function computeDirLOC(dir) {
  let total = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'codecollab data', '.gemini', 'temp_screens'].includes(entry.name)) {
          total += await computeDirLOC(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html', '.prisma'].includes(ext) && !entry.name.includes('package-lock')) {
          const content = await fs.readFile(fullPath, 'utf-8');
          total += content.split(/\r?\n/).filter(l => l.trim().length > 0).length;
        }
      }
    }
  } catch {}
  return total;
}

async function computeLOC() {
  const total = await computeDirLOC(__dirname);
  const stats = await loadStats();
  stats.totalLOC = total;
  await saveStats(stats);
  return total;
}

computeLOC();

// Read data
/*
 * User signup endpoint.
 * Creates a new user in PostgreSQL Prisma & users.json, hashes the password,
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
          name: name || email.split('@')[0],
          email,
          password: hashedPassword,
          role: 'user',
          progress: 0,
          potion: 0
        };

        // Write to PostgreSQL via Prisma
        try {
          await prisma.user.create({
            data: {
              id: newUser.id,
              email: newUser.email,
              passwordHash: hashedPassword,
              isVerified: true,
              status: 'active',
              profile: {
                create: {
                  firstName: newUser.name,
                  lastName: '',
                  avatarUrl: ''
                }
              }
            }
          });
        } catch (dbErr) {
          console.error('Error saving user to Prisma User table:', dbErr);
        }

        users.push(newUser);
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        // Increment developer counter
        const stats = await loadStats();
        stats.cumulativeLogins += 1;
        await saveStats(stats);

        // Generate tokens for immediate login after signup
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role || 'user' }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = uuidv4();
        refreshTokenStore.set(refreshToken, newUser.id);

        const { password: _, email: __, ...userWithoutPassword } = newUser;
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

            // Ensure user exists in Prisma
            try {
              const prismaUser = await prisma.user.findUnique({ where: { id: String(user.id) } });
              if (!prismaUser) {
                await prisma.user.create({
                  data: {
                    id: String(user.id),
                    email: user.email,
                    passwordHash: user.password,
                    isVerified: true,
                    status: 'active',
                    profile: {
                      create: {
                        firstName: user.name || user.email.split('@')[0],
                        lastName: '',
                        avatarUrl: user.avatarUrl || ''
                      }
                    }
                  }
                });
              }
            } catch (e) {
              console.error('Error ensuring Prisma user on login:', e);
            }

            // Increment developer count on login
            const stats = await loadStats();
            stats.cumulativeLogins += 1;
            await saveStats(stats);

            const { password: _, email: __, ...userWithoutPassword } = user;
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

// Helper to format issue with proper relations and no email exposure
function formatIssue(issue, fileUsersMap = new Map()) {
    const creatorFileUser = issue.creatorId ? fileUsersMap.get(String(issue.creatorId)) : null;
    const creatorName = issue.creator?.profile?.firstName 
        ? `${issue.creator.profile.firstName} ${issue.creator.profile.lastName || ''}`.trim()
        : (creatorFileUser?.name || `User #${issue.creatorId}`);
    
    const creatorObj = issue.creatorId ? {
        id: issue.creatorId,
        name: creatorName || `User #${issue.creatorId}`,
        avatarUrl: issue.creator?.profile?.avatarUrl || creatorFileUser?.avatarUrl || ''
    } : null;

    const assigneeFileUser = issue.assigneeId ? fileUsersMap.get(String(issue.assigneeId)) : null;
    const assigneeName = issue.assignee?.profile?.firstName 
        ? `${issue.assignee.profile.firstName} ${issue.assignee.profile.lastName || ''}`.trim()
        : (assigneeFileUser?.name || (issue.assigneeId ? `User #${issue.assigneeId}` : null));
    
    const assigneeObj = issue.assigneeId ? {
        id: issue.assigneeId,
        name: assigneeName || `User #${issue.assigneeId}`,
        avatarUrl: issue.assignee?.profile?.avatarUrl || assigneeFileUser?.avatarUrl || ''
    } : null;

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description || '',
        status: issue.status,
        priority: issue.priority,
        tags: issue.tags || [],
        projectId: issue.projectId,
        project: issue.project ? { id: issue.project.id, title: issue.project.title } : undefined,
        creatorId: issue.creatorId,
        creator: creatorObj,
        assigneeId: issue.assigneeId,
        assignee: assigneeObj,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt
    };
}

// Specific projects endpoint with full owner, members, and issues relations (no email exposure)
app.get('/api/projects', async (req, res) => {
    try {
        // Fetch projects from Prisma database with relational owner, members, and issues
        const projects = await prisma.project.findMany({
            include: {
                owner: {
                    include: { profile: true }
                },
                members: {
                    include: {
                        user: {
                            include: { profile: true }
                        }
                    }
                },
                issues: {
                    include: {
                        creator: { include: { profile: true } },
                        assignee: { include: { profile: true } }
                    }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        // Load users.json for name/avatar fallback
        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const sanitized = projects.map(p => {
            const ownerFileUser = p.ownerId ? fileUsersMap.get(String(p.ownerId)) : null;
            const ownerName = p.owner?.profile?.firstName 
                ? `${p.owner.profile.firstName} ${p.owner.profile.lastName || ''}`.trim()
                : (ownerFileUser?.name || (p.ownerId ? `User #${p.ownerId}` : 'Project Owner'));

            const ownerObj = p.ownerId ? {
                id: p.ownerId,
                name: ownerName || 'Project Owner',
                avatarUrl: p.owner?.profile?.avatarUrl || ownerFileUser?.avatarUrl || ''
            } : null;

            const formattedMembers = (p.members || []).map(m => {
                const memberFileUser = fileUsersMap.get(String(m.userId));
                const memberName = m.user?.profile?.firstName 
                    ? `${m.user.profile.firstName} ${m.user.profile.lastName || ''}`.trim()
                    : (memberFileUser?.name || `User #${m.userId}`);
                return {
                    projectId: m.projectId,
                    userId: m.userId,
                    projectRole: m.projectRole || 'editor',
                    joinedAt: m.joinedAt,
                    user: {
                        id: m.userId,
                        name: memberName,
                        avatarUrl: m.user?.profile?.avatarUrl || memberFileUser?.avatarUrl || ''
                    }
                };
            });

            const formattedIssues = (p.issues || []).map(iss => formatIssue(iss, fileUsersMap));

            return {
                id: p.id,
                title: p.title,
                category: p.category ?? 'Other',
                difficulty: p.difficulty ?? 'Beginner',
                techStack: p.techStack ?? [],
                complexityScore: p.complexityScore ?? 0,
                isPinned: p.isPinned ?? false,
                isDemo: p.isDemo ?? false,
                image: p.image ?? '',
                description: p.description ?? '',
                githubUrl: p.githubUrl ?? '',
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                ownerId: p.ownerId,
                owner: ownerObj,
                members: formattedMembers,
                issues: formattedIssues
            };
        });

        res.json(sanitized);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Single project endpoint with relational owner, members, and issues (no email exposure)
app.get('/api/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                owner: {
                    include: { profile: true }
                },
                members: {
                    include: {
                        user: {
                            include: { profile: true }
                        }
                    }
                },
                issues: {
                    include: {
                        creator: { include: { profile: true } },
                        assignee: { include: { profile: true } }
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const ownerFileUser = project.ownerId ? fileUsersMap.get(String(project.ownerId)) : null;
        const ownerName = project.owner?.profile?.firstName 
            ? `${project.owner.profile.firstName} ${project.owner.profile.lastName || ''}`.trim()
            : (ownerFileUser?.name || (project.ownerId ? `User #${project.ownerId}` : 'Project Owner'));

        const ownerObj = project.ownerId ? {
            id: project.ownerId,
            name: ownerName || 'Project Owner',
            avatarUrl: project.owner?.profile?.avatarUrl || ownerFileUser?.avatarUrl || ''
        } : null;

        const formattedMembers = (project.members || []).map(m => {
            const memberFileUser = fileUsersMap.get(String(m.userId));
            const memberName = m.user?.profile?.firstName 
                ? `${m.user.profile.firstName} ${m.user.profile.lastName || ''}`.trim()
                : (memberFileUser?.name || `User #${m.userId}`);
            return {
                projectId: m.projectId,
                userId: m.userId,
                projectRole: m.projectRole || 'editor',
                joinedAt: m.joinedAt,
                user: {
                    id: m.userId,
                    name: memberName,
                    avatarUrl: m.user?.profile?.avatarUrl || memberFileUser?.avatarUrl || ''
                }
            };
        });

        const formattedIssues = (project.issues || []).map(iss => formatIssue(iss, fileUsersMap));

        res.json({
            ...project,
            techStack: project.techStack ?? [],
            category: project.category ?? 'Other',
            difficulty: project.difficulty ?? 'Beginner',
            owner: ownerObj,
            members: formattedMembers,
            issues: formattedIssues
        });
    } catch (error) {
        console.error('Error fetching single project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// All project members endpoint (no email exposure)
app.get('/api/projectMembers', async (req, res) => {
    try {
        const members = await prisma.projectMember.findMany({
            include: {
                user: {
                    include: { profile: true }
                }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const sanitized = members.map(m => {
            const fileUser = fileUsersMap.get(String(m.userId));
            const name = m.user?.profile?.firstName 
                ? `${m.user.profile.firstName} ${m.user.profile.lastName || ''}`.trim()
                : (fileUser?.name || `User #${m.userId}`);
            return {
                projectId: m.projectId,
                userId: m.userId,
                projectRole: m.projectRole || 'editor',
                joinedAt: m.joinedAt,
                user: {
                    id: m.userId,
                    name: name,
                    avatarUrl: m.user?.profile?.avatarUrl || fileUser?.avatarUrl || ''
                }
            };
        });

        res.json(sanitized);
    } catch (error) {
        console.error('Error fetching project members:', error);
        res.status(500).json({ error: 'Failed to fetch project members' });
    }
});

// Sanitized users list endpoint for Assignee picker, member picker, and profiles (no email exposure)
app.get('/api/users', async (req, res) => {
    try {
        const filePath = getFilePath('users');
        let fileUsers = [];
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            fileUsers = JSON.parse(data);
        } catch { }

        let dbUsers = [];
        try {
            dbUsers = await prisma.user.findMany({
                include: { profile: true }
            });
        } catch (e) {
            console.error('Error querying db users:', e);
        }

        const userMap = new Map();
        fileUsers.forEach(u => {
            userMap.set(String(u.id), {
                id: String(u.id),
                name: u.name || `User #${u.id}`,
                avatarUrl: u.avatarUrl || '',
                role: u.role || 'user'
            });
        });

        dbUsers.forEach(u => {
            const name = u.profile?.firstName 
                ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim()
                : (userMap.get(u.id)?.name || `User #${u.id}`);
            const existing = userMap.get(u.id) || {};
            userMap.set(u.id, {
                ...existing,
                id: u.id,
                name: existing.name || name,
                avatarUrl: u.profile?.avatarUrl || existing.avatarUrl || '',
                role: existing.role || 'user'
            });
        });

        res.json(Array.from(userMap.values()));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const stats = await loadStats();
        // Increment developer visits count on stats load
        stats.cumulativeVisits += 1;
        await saveStats(stats);

        const projectCount = await prisma.project.count();
        const developersCount = stats.cumulativeLogins + stats.cumulativeVisits;
        const formattedLOC = formatLOC(stats.totalLOC);

        res.json({
            developers: developersCount >= 1000 ? formatStatNumber(developersCount) : String(developersCount),
            projects: projectCount >= 1000 ? formatStatNumber(projectCount) : String(projectCount),
            prsMerged: formattedLOC,
            loc: formattedLOC,
            openSource: '100%',
            issues: stats.cumulativeIssues >= 1000 ? formatStatNumber(stats.cumulativeIssues) : String(stats.cumulativeIssues),
            raw: {
                developers: developersCount,
                projects: projectCount,
                issues: stats.cumulativeIssues,
                totalLOC: stats.totalLOC
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
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

// Issue endpoints - Protected with JWT Authentication
app.get('/api/issues', authMiddleware, async (req, res) => {
    try {
        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const issues = await prisma.issue.findMany({
            include: {
                creator: { include: { profile: true } },
                assignee: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(issues.map(iss => formatIssue(iss, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching all issues:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

app.get('/api/projects/:projectId/issues', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const issues = await prisma.issue.findMany({
            where: {
                projectId: projectId
            },
            include: {
                creator: { include: { profile: true } },
                assignee: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(issues.map(iss => formatIssue(iss, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching issues for project:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

app.post('/api/projects/:projectId/issues', authMiddleware, async (req, res) => {
    try {
        const { title, description, status, priority, tags, assigneeId } = req.body;
        const projectId = req.params.projectId;
        
        // SECURITY ENFORCEMENT: creatorId strictly comes from decoded JWT req.user.id
        const creatorId = String(req.user.id);

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

        // Ensure creator exists in PostgreSQL User table
        try {
            const creatorExists = await prisma.user.findUnique({ where: { id: creatorId } });
            if (!creatorExists) {
                let fileUsers = [];
                try { fileUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
                const u = fileUsers.find(x => String(x.id) === creatorId);
                await prisma.user.create({
                    data: {
                        id: creatorId,
                        email: u?.email || req.user.email || `user_${creatorId}@example.com`,
                        passwordHash: u?.password || null,
                        isVerified: true,
                        status: 'active',
                        profile: {
                            create: {
                                firstName: u?.name || 'Developer',
                                lastName: '',
                                avatarUrl: u?.avatarUrl || ''
                            }
                        }
                    }
                });
            }
        } catch (uErr) {
            console.error('Error ensuring creator user in Prisma:', uErr);
        }

        // Validate and ensure assignee if specified
        let validAssigneeId = null;
        if (assigneeId && String(assigneeId).trim() && String(assigneeId).trim() !== 'null') {
            const cleanAssigneeId = String(assigneeId).trim();
            const assigneeExists = await prisma.user.findUnique({ where: { id: cleanAssigneeId } });
            if (assigneeExists) {
                validAssigneeId = cleanAssigneeId;
            } else {
                let fileUsers = [];
                try { fileUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
                const u = fileUsers.find(x => String(x.id) === cleanAssigneeId);
                if (u) {
                    try {
                        await prisma.user.create({
                            data: {
                                id: cleanAssigneeId,
                                email: u.email || `user_${cleanAssigneeId}@example.com`,
                                passwordHash: u.password || null,
                                isVerified: true,
                                status: 'active',
                                profile: {
                                    create: {
                                        firstName: u.name || 'Developer',
                                        lastName: '',
                                        avatarUrl: u.avatarUrl || ''
                                    }
                                }
                            }
                        });
                        validAssigneeId = cleanAssigneeId;
                    } catch (e) {
                        validAssigneeId = null;
                    }
                }
            }
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
                assigneeId: validAssigneeId,
                creatorId: creatorId,
                projectId: projectId
            },
            include: {
                creator: { include: { profile: true } },
                assignee: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });
        
        // Increment cumulative issues counter
        const stats = await loadStats();
        stats.cumulativeIssues += 1;
        await saveStats(stats);

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        console.log(`[Issue Created] ID: ${issue.id}, Project: ${projectId}, Creator: ${creatorId}, Status: ${issue.status}`);
        res.status(201).json(formatIssue(issue, fileUsersMap));
    } catch (error) {
        console.error('Error creating issue in Prisma:', error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

// Update issue handler
async function handleUpdateIssue(req, res) {
    try {
        const { status, priority, description, assigneeId, tags, title } = req.body;
        const issueId = req.params.issueId;

        const existing = await prisma.issue.findUnique({
            where: { id: issueId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        // If route specified projectId, verify match
        if (req.params.projectId && existing.projectId !== req.params.projectId) {
            return res.status(400).json({ error: 'Issue does not belong to the specified project' });
        }
        
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
        if (tags !== undefined) {
            updateData.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (title !== undefined && title.trim()) updateData.title = title.trim();

        // Handle assignee update with foreign key validation
        if (assigneeId !== undefined) {
            if (!assigneeId || assigneeId === 'null' || assigneeId === '') {
                updateData.assigneeId = null;
            } else {
                const cleanAssigneeId = String(assigneeId).trim();
                const userExists = await prisma.user.findUnique({ where: { id: cleanAssigneeId } });
                if (userExists) {
                    updateData.assigneeId = cleanAssigneeId;
                } else {
                    updateData.assigneeId = null;
                }
            }
        }

        // PRESERVE creatorId and projectId strictly
        delete updateData.creatorId;
        delete updateData.projectId;

        const updatedIssue = await prisma.issue.update({
            where: { id: issueId },
            data: updateData,
            include: {
                creator: { include: { profile: true } },
                assignee: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(formatIssue(updatedIssue, fileUsersMap));
    } catch (error) {
        console.error('Error updating issue in Prisma:', error);
        res.status(500).json({ error: 'Failed to update issue' });
    }
}

app.patch('/api/projects/:projectId/issues/:issueId', authMiddleware, handleUpdateIssue);
app.patch('/api/issues/:issueId', authMiddleware, handleUpdateIssue);

// Delete issue handler
async function handleDeleteIssue(req, res) {
    try {
        const issueId = req.params.issueId;
        const existing = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!existing) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        if (req.params.projectId && existing.projectId !== req.params.projectId) {
            return res.status(400).json({ error: 'Issue does not belong to the specified project' });
        }

        await prisma.issue.delete({
            where: { id: issueId }
        });
        res.json({ success: true, message: 'Issue deleted successfully' });
    } catch (error) {
        console.error('Error deleting issue in Prisma:', error);
        res.status(500).json({ error: 'Failed to delete issue' });
    }
}

app.delete('/api/projects/:projectId/issues/:issueId', authMiddleware, handleDeleteIssue);
app.delete('/api/issues/:issueId', authMiddleware, handleDeleteIssue);

// Write project data to Prisma PostgreSQL with ownerId and member linkage (protected)
app.post('/api/projects', authMiddleware, async (req, res) => {
    try {
        const { title, category, difficulty, techStack, image, description, githubUrl, isPinned, isDemo, memberIds, members } = req.body;
        
        let techStackArray = techStack;
        if (typeof techStack === 'string') {
            techStackArray = techStack.split(',').map(s => s.trim()).filter(Boolean);
        }

        // Authenticated user ID is ownerId
        const ownerId = String(req.user.id);

        // Ensure owner exists in PostgreSQL User table
        try {
            const ownerExists = await prisma.user.findUnique({ where: { id: ownerId } });
            if (!ownerExists) {
                await prisma.user.create({
                    data: {
                        id: ownerId,
                        email: req.user.email || `user_${ownerId}@example.com`,
                        isVerified: true,
                        status: 'active',
                        profile: {
                            create: {
                                firstName: req.user.email ? req.user.email.split('@')[0] : 'User',
                                lastName: '',
                                avatarUrl: ''
                            }
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Error verifying owner user in Prisma:', e);
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
                ownerId: ownerId
            }
        });

        // Process member assignments if any
        let rawMemberIds = [];
        if (Array.isArray(memberIds)) {
            rawMemberIds = memberIds;
        } else if (Array.isArray(members)) {
            rawMemberIds = members.map(m => typeof m === 'object' ? (m.userId || m.id) : m);
        } else if (typeof memberIds === 'string' && memberIds.trim()) {
            rawMemberIds = memberIds.split(',').map(s => s.trim()).filter(Boolean);
        }

        // Filter unique members (excluding owner)
        const uniqueMemberIds = [...new Set(rawMemberIds.map(String))].filter(id => id && id !== ownerId);

        for (const mId of uniqueMemberIds) {
            try {
                // Ensure member exists in PostgreSQL User table
                const mUser = await prisma.user.findUnique({ where: { id: mId } });
                if (mUser) {
                    await prisma.projectMember.create({
                        data: {
                            projectId: project.id,
                            userId: mId,
                            projectRole: 'editor'
                        }
                    });
                }
            } catch (memberErr) {
                console.error(`Error adding project member ${mId}:`, memberErr);
            }
        }

        // Fetch full project with relations to return
        const fullProject = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                owner: { include: { profile: true } },
                members: { include: { user: { include: { profile: true } } } },
                issues: true
            }
        });

        // Format owner and members
        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        const ownerFileUser = fullProject.ownerId ? fileUsersMap.get(String(fullProject.ownerId)) : null;
        const ownerName = fullProject.owner?.profile?.firstName 
            ? `${fullProject.owner.profile.firstName} ${fullProject.owner.profile.lastName || ''}`.trim()
            : (ownerFileUser?.name || (fullProject.ownerId ? `User #${fullProject.ownerId}` : 'Project Owner'));

        const formattedOwner = fullProject.ownerId ? {
            id: fullProject.ownerId,
            name: ownerName || 'Project Owner',
            avatarUrl: fullProject.owner?.profile?.avatarUrl || ownerFileUser?.avatarUrl || ''
        } : null;

        const formattedMembers = (fullProject.members || []).map(m => {
            const memberFileUser = fileUsersMap.get(String(m.userId));
            const memberName = m.user?.profile?.firstName 
                ? `${m.user.profile.firstName} ${m.user.profile.lastName || ''}`.trim()
                : (memberFileUser?.name || `User #${m.userId}`);
            return {
                projectId: m.projectId,
                userId: m.userId,
                projectRole: m.projectRole || 'editor',
                joinedAt: m.joinedAt,
                user: {
                    id: m.userId,
                    name: memberName,
                    avatarUrl: m.user?.profile?.avatarUrl || memberFileUser?.avatarUrl || ''
                }
            };
        });

        res.status(201).json({
            ...fullProject,
            techStack: fullProject.techStack ?? [],
            category: fullProject.category ?? 'Other',
            difficulty: fullProject.difficulty ?? 'Beginner',
            owner: formattedOwner,
            members: formattedMembers
        });
    } catch (error) {
        console.error('Error writing project to Prisma:', error);
        res.status(500).json({ error: 'Failed to save data' });
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

            try {
                await prisma.user.create({
                    data: {
                        id: user.id,
                        email: user.email,
                        passwordHash: hashedPassword,
                        isVerified: true,
                        status: 'active',
                        profile: {
                            create: {
                                firstName: name,
                                lastName: '',
                                avatarUrl: payload.picture || ''
                            }
                        }
                    }
                });
            } catch (e) {
                console.error('Error creating Google user in Prisma:', e);
            }
        }
        // Increment developers count on Google sign-in
        const stats = await loadStats();
        stats.cumulativeLogins += 1;
        await saveStats(stats);

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = uuidv4();
        refreshTokenStore.set(refreshToken, user.id);
        const { password: _, email: __, ...userWithoutPassword } = user;
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
