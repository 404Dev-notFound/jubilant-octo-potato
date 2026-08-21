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
let PrismaClient;
try {
    PrismaClient = require('./prisma/generated/client').PrismaClient;
} catch {
    PrismaClient = require('@prisma/client').PrismaClient;
}
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
                title: u.title || u.role || 'Developer',
                avatarUrl: u.avatarUrl || '',
                role: u.role || 'user',
                bio: u.bio || '',
                verifiedSkills: u.verifiedSkills || [],
                skills: u.skills || [],
                rating: u.rating || 4.8,
                upvotes: u.upvotes || 0,
                upvoters: u.upvoters || [],
                followers: u.followers || [],
                availability: u.availability || 'Available · Part-time',
                lookingFor: u.lookingFor || 'Open for collaboration',
                socialLinks: u.socialLinks || {},
                projects: u.projects || []
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

// Community Developers List (Enriched, Zero Email Exposure)
app.get('/api/community/developers', async (req, res) => {
    try {
        const filePath = getFilePath('users');
        let fileUsers = [];
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            fileUsers = JSON.parse(data);
        } catch { }

        const developers = fileUsers
            .filter(u => u.name && u.name.trim().length > 0)
            .map(u => ({
                id: String(u.id),
                name: u.name,
                title: u.title || 'Fullstack Developer',
                role: u.role || 'Developer',
                bio: u.bio || 'Passionate open-source developer building web applications and collaborating on modern tools.',
                avatarUrl: u.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
                verifiedSkills: Array.isArray(u.verifiedSkills) ? u.verifiedSkills : [],
                skills: Array.isArray(u.skills) ? u.skills : (u.verifiedSkills || ['React', 'JavaScript']),
                rating: u.rating || 4.8,
                upvotes: typeof u.upvotes === 'number' ? u.upvotes : (Array.isArray(u.upvoters) ? u.upvoters.length : 12),
                upvoters: Array.isArray(u.upvoters) ? u.upvoters : [],
                followers: Array.isArray(u.followers) ? u.followers : [],
                availability: u.availability || 'Available · Open for Collab',
                lookingFor: u.lookingFor || 'Looking for: Open-source project collaboration',
                socialLinks: u.socialLinks || { github: 'https://github.com' },
                projects: Array.isArray(u.projects) ? u.projects : ['CodeCollab']
            }));

        res.json(developers);
    } catch (error) {
        console.error('Error fetching community developers:', error);
        res.status(500).json({ error: 'Failed to fetch community developers' });
    }
});

// Developer Upvote Toggle
app.post('/api/users/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const targetUserId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const filePath = getFilePath('users');
        
        let users = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        const userIndex = users.findIndex(u => String(u.id) === targetUserId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Developer not found' });
        }

        const user = users[userIndex];
        user.upvoters = Array.isArray(user.upvoters) ? user.upvoters : [];
        user.upvotes = typeof user.upvotes === 'number' ? user.upvotes : user.upvoters.length;

        const hasUpvoted = user.upvoters.includes(currentUserId);
        if (hasUpvoted) {
            user.upvoters = user.upvoters.filter(id => id !== currentUserId);
            user.upvotes = Math.max(0, user.upvotes - 1);
        } else {
            user.upvoters.push(currentUserId);
            user.upvotes += 1;
        }

        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        res.json({
            id: targetUserId,
            upvotes: user.upvotes,
            upvoters: user.upvoters,
            hasUpvoted: !hasUpvoted
        });
    } catch (error) {
        console.error('Error upvoting developer:', error);
        res.status(500).json({ error: 'Failed to upvote developer' });
    }
});

// Developer Follow Toggle
app.post('/api/users/:id/follow', authMiddleware, async (req, res) => {
    try {
        const targetUserId = String(req.params.id);
        const currentUserId = String(req.user.id);
        const filePath = getFilePath('users');
        
        let users = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        const userIndex = users.findIndex(u => String(u.id) === targetUserId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Developer not found' });
        }

        const user = users[userIndex];
        user.followers = Array.isArray(user.followers) ? user.followers : [];

        const hasFollowed = user.followers.includes(currentUserId);
        if (hasFollowed) {
            user.followers = user.followers.filter(id => id !== currentUserId);
        } else {
            user.followers.push(currentUserId);
        }

        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        res.json({
            id: targetUserId,
            followersCount: user.followers.length,
            followers: user.followers,
            hasFollowed: !hasFollowed
        });
    } catch (error) {
        console.error('Error following developer:', error);
        res.status(500).json({ error: 'Failed to follow developer' });
    }
});

// Community Teams List (Enriched with Member and Project relations)
app.get('/api/teams', async (req, res) => {
    try {
        const teamsPath = getFilePath('teams');
        const usersPath = getFilePath('users');
        
        let teams = [];
        let users = [];
        try {
            teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8'));
        } catch { teams = []; }
        try {
            users = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
        } catch { users = []; }

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
                lead: lead,
                members: t.members || [],
                memberDetails: memberDetails,
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

// Create Team (Protected)
app.post('/api/teams', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const {
            teamName,
            description,
            skills,
            lookingFor,
            openPositions,
            availability,
            assignedProjects
        } = req.body;

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
            id: `team_${Date.now()}`,
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

        // Get author details for enrichment
        const usersPath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}
        const user = users.find(u => String(u.id) === currentUserId) || {
            id: currentUserId,
            name: req.user.name || 'Team Lead',
            avatarUrl: ''
        };

        const enrichedTeam = {
            ...newTeam,
            lead: {
                id: currentUserId,
                name: user.name || 'Team Lead',
                title: user.title || 'Developer',
                avatarUrl: user.avatarUrl || '',
                verifiedSkills: user.verifiedSkills || []
            },
            memberDetails: [{
                id: currentUserId,
                name: user.name || 'Team Lead',
                title: user.title || 'Team Lead',
                avatarUrl: user.avatarUrl || ''
            }]
        };

        res.status(201).json(enrichedTeam);
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Team Upvote Toggle
app.post('/api/teams/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const teamId = req.params.id;
        const currentUserId = String(req.user.id);
        const teamsPath = getFilePath('teams');

        let teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8'));
        const teamIndex = teams.findIndex(t => t.id === teamId);
        
        if (teamIndex === -1) {
            return res.status(404).json({ error: 'Team not found' });
        }

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
        }

        await fs.writeFile(teamsPath, JSON.stringify(teams, null, 2));

        res.json({
            id: teamId,
            upvotes: team.upvotes,
            upvoters: team.upvoters,
            hasUpvoted: !hasUpvoted
        });
    } catch (error) {
        console.error('Error upvoting team:', error);
        res.status(500).json({ error: 'Failed to upvote team' });
    }
});

// Team Join Request Handler (Dispatches Notification to Team Lead)
app.post('/api/teams/:id/join', authMiddleware, async (req, res) => {
    try {
        const teamId = req.params.id;
        const currentUserId = String(req.user.id);
        const { message, position } = req.body;
        const teamsPath = getFilePath('teams');
        const usersPath = getFilePath('users');

        let teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8'));
        const team = teams.find(t => t.id === teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (String(team.leadId) === currentUserId) {
            return res.status(400).json({ error: 'You are already the leader of this team' });
        }

        if (Array.isArray(team.members) && team.members.includes(currentUserId)) {
            return res.status(400).json({ error: 'You are already a member of this team' });
        }

        // Check for existing pending request to prevent duplicates
        try {
            const existingNotif = await prisma.notification.findFirst({
                where: {
                    userId: String(team.leadId),
                    actorId: currentUserId,
                    type: 'TEAM_JOIN_REQUEST',
                    read: false
                }
            });
            if (existingNotif && existingNotif.data && typeof existingNotif.data === 'object' && existingNotif.data.teamId === teamId) {
                return res.status(400).json({ error: 'You already have a pending join request for this team' });
            }
        } catch (e) {}

        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}
        const requester = users.find(u => String(u.id) === currentUserId);
        const requesterName = requester?.name || 'A developer';

        // Dispatch notification to team leader via Prisma
        try {
            const leadExists = await prisma.user.findUnique({ where: { id: String(team.leadId) } });
            if (!leadExists) {
                const leadFileUser = users.find(u => String(u.id) === String(team.leadId));
                if (leadFileUser) {
                    await prisma.user.create({
                        data: {
                            id: String(team.leadId),
                            email: leadFileUser.email || `lead_${team.leadId}@example.com`,
                            isVerified: true,
                            status: 'active',
                            profile: {
                                create: {
                                    firstName: leadFileUser.name || 'Team Lead',
                                    lastName: '',
                                    avatarUrl: leadFileUser.avatarUrl || ''
                                }
                            }
                        }
                    });
                }
            }

            // Also ensure requester exists in Prisma
            const reqExists = await prisma.user.findUnique({ where: { id: currentUserId } });
            if (!reqExists) {
                await prisma.user.create({
                    data: {
                        id: currentUserId,
                        email: requester?.email || req.user.email || `user_${currentUserId}@example.com`,
                        isVerified: true,
                        status: 'active',
                        profile: {
                            create: {
                                firstName: requesterName,
                                lastName: '',
                                avatarUrl: requester?.avatarUrl || ''
                            }
                        }
                    }
                });
            }

            await prisma.notification.create({
                data: {
                    userId: String(team.leadId),
                    actorId: currentUserId,
                    type: 'TEAM_JOIN_REQUEST',
                    title: 'Team Join Request',
                    message: `${requesterName} requested to join "${team.teamName}"${position ? ` for position: ${position}` : ''}`,
                    data: {
                        teamId: team.id,
                        teamName: team.teamName,
                        requesterId: currentUserId,
                        requesterName,
                        position: position || 'Developer',
                        message: (message || '').trim()
                    }
                }
            });
        } catch (notifErr) {
            console.error('Error saving team notification to Prisma:', notifErr);
        }

        res.status(200).json({
            success: true,
            message: `Join request sent to ${team.teamName} team lead!`
        });
    } catch (error) {
        console.error('Error submitting team join request:', error);
        res.status(500).json({ error: 'Failed to submit team join request' });
    }
});

// Team Lead Responds to Join Request (Accept / Reject)
app.post('/api/teams/:id/respond', authMiddleware, async (req, res) => {
    try {
        const teamId = req.params.id;
        const currentUserId = String(req.user.id);
        const { requesterId, action } = req.body; // action: 'ACCEPT' or 'REJECT'
        const teamsPath = getFilePath('teams');
        const usersPath = getFilePath('users');

        if (!['ACCEPT', 'REJECT'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be ACCEPT or REJECT.' });
        }

        let teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8'));
        const teamIndex = teams.findIndex(t => t.id === teamId);
        if (teamIndex === -1) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const team = teams[teamIndex];
        if (String(team.leadId) !== currentUserId) {
            return res.status(403).json({ error: 'Only the team leader can manage join requests' });
        }

        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}
        const requester = users.find(u => String(u.id) === String(requesterId));

        if (action === 'ACCEPT') {
            team.members = Array.isArray(team.members) ? team.members : [];
            if (!team.members.includes(String(requesterId))) {
                team.members.push(String(requesterId));
                team.updatedAt = new Date().toISOString();
                await fs.writeFile(teamsPath, JSON.stringify(teams, null, 2));
            }

            // Notify requester
            try {
                await prisma.notification.create({
                    data: {
                        userId: String(requesterId),
                        actorId: currentUserId,
                        type: 'TEAM_JOIN_ACCEPTED',
                        title: 'Team Request Accepted! 🎉',
                        message: `You were accepted into team "${team.teamName}"!`,
                        data: {
                            teamId: team.id,
                            teamName: team.teamName
                        }
                    }
                });
            } catch (e) {}
        } else {
            // Notify requester of decline
            try {
                await prisma.notification.create({
                    data: {
                        userId: String(requesterId),
                        actorId: currentUserId,
                        type: 'TEAM_JOIN_REJECTED',
                        title: 'Team Request Update',
                        message: `Your request to join "${team.teamName}" was declined.`,
                        data: {
                            teamId: team.id,
                            teamName: team.teamName
                        }
                    }
                });
            } catch (e) {}
        }

        res.json({ success: true, action, team });
    } catch (error) {
        console.error('Error responding to team join request:', error);
        res.status(500).json({ error: 'Failed to process team join request response' });
    }
});

// Community Looking-For Matchmaking Posts (GET)
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
            name: u.name,
            title: u.title || 'Developer',
            avatarUrl: u.avatarUrl || '',
            verifiedSkills: u.verifiedSkills || [],
            socialLinks: u.socialLinks || {}
        }));

        const enrichedPosts = posts.map(p => {
            const author = userMap.get(String(p.userId)) || { id: String(p.userId), name: 'Developer', avatarUrl: '' };
            return {
                ...p,
                author
            };
        });

        res.json(enrichedPosts);
    } catch (error) {
        console.error('Error fetching lookingFor posts:', error);
        res.status(500).json({ error: 'Failed to fetch lookingFor posts' });
    }
});

// Create Looking-For Matchmaking Request (POST)
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
            id: `match_${Date.now()}`,
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

        // Enrich with user info
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

// Delete Looking-For Matchmaking Request (DELETE)
app.delete('/api/community/looking-for/:id', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        const currentUserId = String(req.user.id);
        const lookingForPath = getFilePath('lookingFor');

        let posts = JSON.parse(await fs.readFile(lookingForPath, 'utf-8'));
        const post = posts.find(p => p.id === postId);

        if (!post) {
            return res.status(404).json({ error: 'Matchmaking request not found' });
        }

        if (String(post.userId) !== currentUserId) {
            return res.status(403).json({ error: 'You can only delete your own matchmaking request' });
        }

        posts = posts.filter(p => p.id !== postId);
        await fs.writeFile(lookingForPath, JSON.stringify(posts, null, 2));

        res.json({ success: true, message: 'Matchmaking request deleted' });
    } catch (error) {
        console.error('Error deleting looking-for request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

// Update Developer Availability & Collaboration Profile (PUT & POST alias)
app.put('/api/users/availability', authMiddleware, async (req, res) => {
    try {
        const currentUserId = String(req.user.id);
        const { availability, lookingFor, hoursPerWeek, collaborationType, timezone } = req.body;
        const usersPath = getFilePath('users');

        let users = [];
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch { users = []; }

        let userIndex = users.findIndex(u => String(u.id) === currentUserId);
        if (userIndex === -1) {
            const newUser = {
                id: currentUserId,
                name: req.user.name || (req.user.email ? req.user.email.split('@')[0] : `User_${currentUserId}`),
                email: req.user.email,
                availability: availability || 'Available Now',
                lookingFor: lookingFor || 'Open for collaboration',
                timezone: timezone || 'UTC',
                hoursPerWeek: hoursPerWeek || '10-20 hrs/wk',
                collaborationType: collaborationType || 'Fullstack',
                updatedAt: new Date().toISOString()
            };
            users.push(newUser);
            userIndex = users.length - 1;
        } else {
            const user = users[userIndex];
            if (availability !== undefined) user.availability = String(availability).trim();
            if (lookingFor !== undefined) user.lookingFor = String(lookingFor).trim();
            if (hoursPerWeek !== undefined) user.hoursPerWeek = String(hoursPerWeek).trim();
            if (collaborationType !== undefined) user.collaborationType = String(collaborationType).trim();
            if (timezone !== undefined) user.timezone = String(timezone).trim();
            user.updatedAt = new Date().toISOString();
        }

        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        // Sync to Postgres Prisma UserProfile preferences
        try {
            const userExists = await prisma.user.findUnique({ where: { id: currentUserId }, include: { profile: true } });
            if (userExists) {
                const currentPrefs = userExists.profile?.preferences || {};
                await prisma.userProfile.upsert({
                    where: { userId: currentUserId },
                    update: {
                        preferences: {
                            ...currentPrefs,
                            availability: users[userIndex].availability,
                            lookingFor: users[userIndex].lookingFor,
                            hoursPerWeek: users[userIndex].hoursPerWeek,
                            collaborationType: users[userIndex].collaborationType,
                            timezone: users[userIndex].timezone
                        }
                    },
                    create: {
                        userId: currentUserId,
                        firstName: users[userIndex].name,
                        lastName: '',
                        avatarUrl: users[userIndex].avatarUrl || '',
                        preferences: {
                            availability: users[userIndex].availability,
                            lookingFor: users[userIndex].lookingFor,
                            hoursPerWeek: users[userIndex].hoursPerWeek,
                            collaborationType: users[userIndex].collaborationType,
                            timezone: users[userIndex].timezone
                        }
                    }
                });
            }
        } catch (dbErr) {
            console.error('Error syncing availability to Prisma:', dbErr);
        }

        const { password: _, email: __, ...sanitized } = users[userIndex];
        res.json({
            success: true,
            user: sanitized
        });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

app.post('/api/users/availability', authMiddleware, async (req, res, next) => {
    req.method = 'PUT';
    app._router.handle(req, res, next);
});

// Community Statistics Endpoint (GET)
app.get('/api/community/stats', async (req, res) => {
    try {
        const teamsPath = getFilePath('teams');
        const usersPath = getFilePath('users');
        const lookingForPath = getFilePath('lookingFor');

        let teams = [], users = [], lookingFor = [];
        try { teams = JSON.parse(await fs.readFile(teamsPath, 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(usersPath, 'utf-8')); } catch {}
        try { lookingFor = JSON.parse(await fs.readFile(lookingForPath, 'utf-8')); } catch {}

        const totalDevs = users.filter(u => u.name && u.name.trim().length > 0).length;
        let totalUpvotes = 0;
        teams.forEach(t => totalUpvotes += (typeof t.upvotes === 'number' ? t.upvotes : (Array.isArray(t.upvoters) ? t.upvoters.length : 0)));
        users.forEach(u => totalUpvotes += (typeof u.upvotes === 'number' ? u.upvotes : (Array.isArray(u.upvoters) ? u.upvoters.length : 0)));

        res.json({
            activeTeams: teams.length,
            totalDevelopers: totalDevs,
            lookingForRequests: lookingFor.length,
            totalUpvotes: totalUpvotes
        });
    } catch (error) {
        console.error('Error fetching community stats:', error);
        res.status(500).json({ error: 'Failed to fetch community statistics' });
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

// ----------------------------------------------------------------------------
// Join Request, Meeting Request, and Notification Helpers (Zero-Email, Clean Relations)
// ----------------------------------------------------------------------------

function sanitizeUserObj(u, fallbackName = 'Developer') {
    if (!u) return null;
    const name = u.profile?.firstName 
        ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim()
        : (u.name || fallbackName);
    return {
        id: u.id,
        name: name || fallbackName,
        avatarUrl: u.profile?.avatarUrl || u.avatarUrl || ''
    };
}

function sanitizeJoinRequest(r, fileUsersMap = new Map()) {
    if (!r) return null;
    const userFallback = r.userId ? fileUsersMap.get(String(r.userId)) : null;
    const userObj = r.user ? sanitizeUserObj(r.user, userFallback?.name) : (userFallback ? { id: String(r.userId), name: userFallback.name, avatarUrl: userFallback.avatarUrl || '' } : { id: String(r.userId), name: `Developer` });
    
    const ownerFallback = r.ownerId ? fileUsersMap.get(String(r.ownerId)) : null;
    const ownerObj = r.owner ? sanitizeUserObj(r.owner, ownerFallback?.name) : (ownerFallback ? { id: String(r.ownerId), name: ownerFallback.name, avatarUrl: ownerFallback.avatarUrl || '' } : { id: String(r.ownerId), name: `Project Owner` });

    return {
        id: r.id,
        status: r.status,
        message: r.message || '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        projectId: r.projectId,
        project: r.project ? { id: r.project.id, title: r.project.title } : undefined,
        userId: r.userId,
        user: userObj,
        ownerId: r.ownerId,
        owner: ownerObj
    };
}

function sanitizeMeetingRequest(m, fileUsersMap = new Map()) {
    if (!m) return null;
    const userFallback = m.userId ? fileUsersMap.get(String(m.userId)) : null;
    const userObj = m.user ? sanitizeUserObj(m.user, userFallback?.name) : (userFallback ? { id: String(m.userId), name: userFallback.name, avatarUrl: userFallback.avatarUrl || '' } : { id: String(m.userId), name: `Developer` });
    
    const ownerFallback = m.ownerId ? fileUsersMap.get(String(m.ownerId)) : null;
    const ownerObj = m.owner ? sanitizeUserObj(m.owner, ownerFallback?.name) : (ownerFallback ? { id: String(m.ownerId), name: ownerFallback.name, avatarUrl: ownerFallback.avatarUrl || '' } : { id: String(m.ownerId), name: `Project Owner` });

    return {
        id: m.id,
        status: m.status,
        preferredDate: m.preferredDate,
        message: m.message || '',
        responseNotes: m.responseNotes || '',
        meetingLink: m.meetingLink || '',
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        projectId: m.projectId,
        project: m.project ? { id: m.project.id, title: m.project.title } : undefined,
        userId: m.userId,
        user: userObj,
        ownerId: m.ownerId,
        owner: ownerObj
    };
}

function sanitizeNotification(n) {
    if (!n) return null;
    const actorObj = n.actor ? sanitizeUserObj(n.actor) : null;
    return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data || {},
        read: n.read,
        createdAt: n.createdAt,
        projectId: n.projectId,
        actor: actorObj
    };
}

// ----------------------------------------------------------------------------
// Join Request Endpoints
// ----------------------------------------------------------------------------

// Create join request for a project
app.post('/api/projects/:projectId/join-requests', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = String(req.user.id);
        const { message } = req.body;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { owner: { include: { profile: true } } }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.ownerId && String(project.ownerId) === userId) {
            return res.status(400).json({ error: 'You are the owner of this project' });
        }

        // Check if already a project member
        const existingMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId }
            }
        });
        if (existingMember) {
            return res.status(400).json({ error: 'You are already a member of this project' });
        }

        // Check for active (pending) join request
        const existingPending = await prisma.joinRequest.findFirst({
            where: {
                projectId,
                userId,
                status: 'PENDING'
            }
        });
        if (existingPending) {
            return res.status(400).json({ error: 'You already have an active pending join request for this project' });
        }

        // Ensure user exists in Postgres User table
        try {
            const userExists = await prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                let fileUsers = [];
                try { fileUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
                const u = fileUsers.find(x => String(x.id) === userId);
                await prisma.user.create({
                    data: {
                        id: userId,
                        email: u?.email || req.user.email || `user_${userId}@example.com`,
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
        } catch (uErr) {}

        const joinRequest = await prisma.joinRequest.create({
            data: {
                userId,
                projectId,
                ownerId: project.ownerId || userId,
                status: 'PENDING',
                message: message ? String(message).trim() : null
            },
            include: {
                user: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        // Notify project owner
        if (project.ownerId && String(project.ownerId) !== userId) {
            const requesterName = joinRequest.user?.profile?.firstName 
                ? `${joinRequest.user.profile.firstName} ${joinRequest.user.profile.lastName || ''}`.trim()
                : 'A developer';
            await prisma.notification.create({
                data: {
                    userId: project.ownerId,
                    actorId: userId,
                    projectId: projectId,
                    type: 'JOIN_REQUEST_RECEIVED',
                    title: 'New Join Request',
                    message: `${requesterName} requested to join "${project.title}"`,
                    data: {
                        requestId: joinRequest.id,
                        projectId: projectId,
                        projectTitle: project.title,
                        requesterName
                    }
                }
            });
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.status(201).json(sanitizeJoinRequest(joinRequest, fileUsersMap));
    } catch (error) {
        console.error('Error creating join request:', error);
        res.status(500).json({ error: 'Failed to submit join request' });
    }
});

// Get current user's join request for a project
app.get('/api/projects/:projectId/join-requests/my', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = String(req.user.id);

        const request = await prisma.joinRequest.findFirst({
            where: { projectId, userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(request ? sanitizeJoinRequest(request, fileUsersMap) : null);
    } catch (error) {
        console.error('Error fetching user join request for project:', error);
        res.status(500).json({ error: 'Failed to fetch join request status' });
    }
});

// Get received join requests (for project owner)
app.get('/api/join-requests/received', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const requests = await prisma.joinRequest.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(requests.map(r => sanitizeJoinRequest(r, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching received join requests:', error);
        res.status(500).json({ error: 'Failed to fetch received join requests' });
    }
});

// Get sent join requests (for requester)
app.get('/api/join-requests/sent', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const requests = await prisma.joinRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                owner: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(requests.map(r => sanitizeJoinRequest(r, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching sent join requests:', error);
        res.status(500).json({ error: 'Failed to fetch sent join requests' });
    }
});

// Respond to join request (ACCEPT or REJECT)
app.patch('/api/join-requests/:id', authMiddleware, async (req, res) => {
    try {
        const requestId = req.params.id;
        const currentUserId = String(req.user.id);
        const { status, action } = req.body;
        const targetStatus = status || action;

        if (!['ACCEPTED', 'REJECTED'].includes(targetStatus)) {
            return res.status(400).json({ error: 'Invalid status. Must be ACCEPTED or REJECTED.' });
        }

        const joinRequest = await prisma.joinRequest.findUnique({
            where: { id: requestId },
            include: {
                project: true,
                user: { include: { profile: true } },
                owner: { include: { profile: true } }
            }
        });

        if (!joinRequest) {
            return res.status(404).json({ error: 'Join request not found' });
        }

        // Authorization check: Only project owner can respond
        if (String(joinRequest.ownerId) !== currentUserId && String(joinRequest.project?.ownerId) !== currentUserId) {
            return res.status(403).json({ error: 'You are not authorized to manage this join request' });
        }

        const updated = await prisma.joinRequest.update({
            where: { id: requestId },
            data: { status: targetStatus },
            include: {
                user: { include: { profile: true } },
                owner: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        if (targetStatus === 'ACCEPTED') {
            // Add user to project members if not already there
            const existingMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId: joinRequest.projectId,
                        userId: joinRequest.userId
                    }
                }
            });
            if (!existingMember) {
                await prisma.projectMember.create({
                    data: {
                        projectId: joinRequest.projectId,
                        userId: joinRequest.userId,
                        projectRole: 'editor'
                    }
                });
            }

            // Send notification to the requester
            await prisma.notification.create({
                data: {
                    userId: joinRequest.userId,
                    actorId: currentUserId,
                    projectId: joinRequest.projectId,
                    type: 'JOIN_REQUEST_ACCEPTED',
                    title: 'Join Request Accepted',
                    message: `Your request to join "${joinRequest.project?.title || 'the project'}" was accepted!`,
                    data: {
                        requestId: joinRequest.id,
                        projectId: joinRequest.projectId,
                        projectTitle: joinRequest.project?.title
                    }
                }
            });
        } else if (targetStatus === 'REJECTED') {
            // Send notification to the requester
            await prisma.notification.create({
                data: {
                    userId: joinRequest.userId,
                    actorId: currentUserId,
                    projectId: joinRequest.projectId,
                    type: 'JOIN_REQUEST_REJECTED',
                    title: 'Join Request Declined',
                    message: `Your request to join "${joinRequest.project?.title || 'the project'}" was declined.`,
                    data: {
                        requestId: joinRequest.id,
                        projectId: joinRequest.projectId,
                        projectTitle: joinRequest.project?.title
                    }
                }
            });
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(sanitizeJoinRequest(updated, fileUsersMap));
    } catch (error) {
        console.error('Error updating join request:', error);
        res.status(500).json({ error: 'Failed to update join request' });
    }
});

// ----------------------------------------------------------------------------
// Meeting Request Endpoints
// ----------------------------------------------------------------------------

// Create meeting request for a project
app.post('/api/projects/:projectId/meetings', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = String(req.user.id);
        const { preferredDate, message, topic } = req.body;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { owner: { include: { profile: true } } }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.ownerId && String(project.ownerId) === userId) {
            return res.status(400).json({ error: 'You cannot schedule a meeting with yourself' });
        }

        // Ensure user exists in Postgres User table
        try {
            const userExists = await prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                let fileUsers = [];
                try { fileUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
                const u = fileUsers.find(x => String(x.id) === userId);
                await prisma.user.create({
                    data: {
                        id: userId,
                        email: u?.email || req.user.email || `user_${userId}@example.com`,
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
        } catch (uErr) {}

        const meeting = await prisma.meetingRequest.create({
            data: {
                userId,
                projectId,
                ownerId: project.ownerId || userId,
                preferredDate: preferredDate ? new Date(preferredDate) : null,
                message: (message || topic || '').trim(),
                status: 'PENDING'
            },
            include: {
                user: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        // Notify project owner
        if (project.ownerId && String(project.ownerId) !== userId) {
            const requesterName = meeting.user?.profile?.firstName 
                ? `${meeting.user.profile.firstName} ${meeting.user.profile.lastName || ''}`.trim()
                : 'A developer';
            await prisma.notification.create({
                data: {
                    userId: project.ownerId,
                    actorId: userId,
                    projectId: projectId,
                    type: 'MEETING_REQUEST_RECEIVED',
                    title: 'New Meeting Request',
                    message: `${requesterName} requested a meeting regarding "${project.title}"`,
                    data: {
                        meetingId: meeting.id,
                        projectId: projectId,
                        projectTitle: project.title,
                        requesterName,
                        preferredDate: meeting.preferredDate
                    }
                }
            });
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.status(201).json(sanitizeMeetingRequest(meeting, fileUsersMap));
    } catch (error) {
        console.error('Error creating meeting request:', error);
        res.status(500).json({ error: 'Failed to schedule meeting' });
    }
});

// Get user's meeting requests for a project
app.get('/api/projects/:projectId/meetings/my', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = String(req.user.id);

        const meetings = await prisma.meetingRequest.findMany({
            where: {
                projectId,
                OR: [
                    { userId },
                    { ownerId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                owner: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(meetings.map(m => sanitizeMeetingRequest(m, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching project meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meeting requests' });
    }
});

// Get received meeting requests (for project owner)
app.get('/api/meetings/received', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const meetings = await prisma.meetingRequest.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(meetings.map(m => sanitizeMeetingRequest(m, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching received meetings:', error);
        res.status(500).json({ error: 'Failed to fetch received meeting requests' });
    }
});

// Get sent meeting requests (for requester)
app.get('/api/meetings/sent', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const meetings = await prisma.meetingRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                owner: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(meetings.map(m => sanitizeMeetingRequest(m, fileUsersMap)));
    } catch (error) {
        console.error('Error fetching sent meetings:', error);
        res.status(500).json({ error: 'Failed to fetch sent meeting requests' });
    }
});

// Respond to / update meeting request
app.patch('/api/meetings/:id', authMiddleware, async (req, res) => {
    try {
        const meetingId = req.params.id;
        const currentUserId = String(req.user.id);
        const { status, responseNotes, meetingLink } = req.body;

        const meeting = await prisma.meetingRequest.findUnique({
            where: { id: meetingId },
            include: {
                project: true,
                user: { include: { profile: true } },
                owner: { include: { profile: true } }
            }
        });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting request not found' });
        }

        const isOwner = String(meeting.ownerId) === currentUserId || String(meeting.project?.ownerId) === currentUserId;
        const isRequester = String(meeting.userId) === currentUserId;

        if (!isOwner && !isRequester) {
            return res.status(403).json({ error: 'You are not authorized to update this meeting request' });
        }

        const updateData = {};
        if (status && ['ACCEPTED', 'REJECTED', 'PENDING'].includes(status)) {
            updateData.status = status;
        }
        if (responseNotes !== undefined) updateData.responseNotes = String(responseNotes).trim();
        if (meetingLink !== undefined) updateData.meetingLink = String(meetingLink).trim();

        const updated = await prisma.meetingRequest.update({
            where: { id: meetingId },
            data: updateData,
            include: {
                user: { include: { profile: true } },
                owner: { include: { profile: true } },
                project: { select: { id: true, title: true } }
            }
        });

        // If owner responded, notify the requester
        if (isOwner && status && status !== 'PENDING') {
            await prisma.notification.create({
                data: {
                    userId: meeting.userId,
                    actorId: currentUserId,
                    projectId: meeting.projectId,
                    type: status === 'ACCEPTED' ? 'MEETING_REQUEST_ACCEPTED' : 'MEETING_REQUEST_REJECTED',
                    title: status === 'ACCEPTED' ? 'Meeting Request Accepted' : 'Meeting Request Declined',
                    message: status === 'ACCEPTED'
                        ? `Your meeting request for "${meeting.project?.title || 'the project'}" was accepted!`
                        : `Your meeting request for "${meeting.project?.title || 'the project'}" was declined.`,
                    data: {
                        meetingId: meeting.id,
                        projectId: meeting.projectId,
                        projectTitle: meeting.project?.title,
                        responseNotes: updated.responseNotes,
                        meetingLink: updated.meetingLink
                    }
                }
            });
        }

        let fileUsersMap = new Map();
        try {
            const rawUsers = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            rawUsers.forEach(u => fileUsersMap.set(String(u.id), u));
        } catch {}

        res.json(sanitizeMeetingRequest(updated, fileUsersMap));
    } catch (error) {
        console.error('Error updating meeting request:', error);
        res.status(500).json({ error: 'Failed to update meeting request' });
    }
});

// ----------------------------------------------------------------------------
// Notification Endpoints
// ----------------------------------------------------------------------------

// Get notifications for authenticated user
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                actor: { include: { profile: true } }
            }
        });
        res.json(notifications.map(sanitizeNotification));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark single notification as read
app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = String(req.user.id);
        const existing = await prisma.notification.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true },
            include: { actor: { include: { profile: true } } }
        });
        res.json(sanitizeNotification(updated));
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
app.post('/api/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

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

// ==========================================
// COMMUNITY & MATCHMAKING API ENDPOINTS
// ==========================================

// 1. Community Live Stats
app.get('/api/community/stats', async (req, res) => {
    try {
        let teams = [];
        let users = [];
        let lookingFor = [];
        try { teams = JSON.parse(await fs.readFile(getFilePath('teams'), 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}
        try { lookingFor = JSON.parse(await fs.readFile(getFilePath('looking_for'), 'utf-8')); } catch {}

        const totalUpvotes = (teams.reduce((acc, t) => acc + (t.upvotes || 0), 0)) + 
                             (users.reduce((acc, u) => acc + (u.upvotes || 0), 0));

        res.json({
            activeTeams: teams.length,
            totalDevelopers: users.length,
            lookingForRequests: lookingFor.length,
            totalUpvotes
        });
    } catch (err) {
        console.error('Error getting community stats:', err);
        res.status(500).json({ error: 'Failed to fetch community statistics' });
    }
});

// 2. Discover Developers (Zero Email Exposure, Verified Skills)
app.get('/api/community/developers', async (req, res) => {
    try {
        let users = [];
        try { users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}

        // Map and sanitize users
        const developers = users.map(u => {
            const { password, passwordHash, email, ...safeUser } = u;
            return {
                id: safeUser.id,
                name: safeUser.name || 'Developer',
                username: safeUser.username || `dev_${safeUser.id}`,
                title: safeUser.title || safeUser.role || 'Software Engineer',
                bio: safeUser.bio || 'Passionate developer building and collaborating on open-source code.',
                avatarUrl: safeUser.avatarUrl || '',
                skills: Array.isArray(safeUser.skills) ? safeUser.skills : ['JavaScript', 'React'],
                verifiedSkills: Array.isArray(safeUser.verifiedSkills) ? safeUser.verifiedSkills : (safeUser.skills ? safeUser.skills.slice(0, 2) : ['React']),
                availability: safeUser.availability || 'Available Now',
                lookingFor: safeUser.lookingFor || 'Open for collaboration on exciting projects',
                hoursPerWeek: safeUser.hoursPerWeek || '10-20 hrs/wk',
                collaborationType: safeUser.collaborationType || 'Fullstack',
                timezone: safeUser.timezone || 'UTC',
                upvotes: typeof safeUser.upvotes === 'number' ? safeUser.upvotes : (Array.isArray(safeUser.upvoters) ? safeUser.upvoters.length : 0),
                upvoters: Array.isArray(safeUser.upvoters) ? safeUser.upvoters : [],
                followers: Array.isArray(safeUser.followers) ? safeUser.followers : [],
                socialLinks: safeUser.socialLinks || { github: safeUser.github || '', twitter: safeUser.twitter || '', linkedin: safeUser.linkedin || '', website: safeUser.website || '' },
                projects: Array.isArray(safeUser.projects) ? safeUser.projects : ['CodeCollab']
            };
        });

        res.json(developers);
    } catch (err) {
        console.error('Error fetching community developers:', err);
        res.status(500).json({ error: 'Failed to fetch developers' });
    }
});

// 3. Matchmaking / Looking-For Feed (Enriched with Author Profiles)
app.get('/api/community/looking-for', async (req, res) => {
    try {
        let lookingForList = [];
        let users = [];
        try { lookingForList = JSON.parse(await fs.readFile(getFilePath('looking_for'), 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}

        const usersMap = new Map(users.map(u => [String(u.id), u]));

        const enriched = lookingForList.map(item => {
            const author = usersMap.get(String(item.userId)) || {};
            return {
                ...item,
                author: {
                    id: author.id || item.userId,
                    name: author.name || 'Developer',
                    avatarUrl: author.avatarUrl || '',
                    title: author.title || author.role || 'Developer',
                    verifiedSkills: Array.isArray(author.verifiedSkills) ? author.verifiedSkills : [],
                    availability: author.availability || item.availability || 'Available Now'
                }
            };
        });

        // Sort newest first
        enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        res.json(enriched);
    } catch (err) {
        console.error('Error fetching looking-for feed:', err);
        res.status(500).json({ error: 'Failed to fetch matchmaking requests' });
    }
});

// 4. Create Looking-For Request (Protected)
app.post('/api/community/looking-for', authMiddleware, async (req, res) => {
    try {
        const { lookingFor, for: forGoal, requiredSkills, commitment, availability, context } = req.body;
        if (!lookingFor || !forGoal) {
            return res.status(400).json({ error: 'Looking for role and target project/goal are required' });
        }

        const filePath = getFilePath('looking_for');
        let list = [];
        try { list = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const newEntry = {
            id: Date.now().toString(),
            userId: req.user.id,
            lookingFor: lookingFor.trim(),
            for: forGoal.trim(),
            requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (typeof requiredSkills === 'string' ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
            commitment: commitment || 'Part-time (8-10 hrs/wk)',
            availability: availability || 'Available Now',
            context: context || '',
            createdAt: new Date().toISOString()
        };

        list.unshift(newEntry);
        await fs.writeFile(filePath, JSON.stringify(list, null, 2));

        // Get author details
        let author = {};
        try {
            const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            author = users.find(u => String(u.id) === String(req.user.id)) || {};
        } catch {}

        res.status(201).json({
            ...newEntry,
            author: {
                id: req.user.id,
                name: author.name || 'Developer',
                avatarUrl: author.avatarUrl || '',
                title: author.title || 'Developer',
                verifiedSkills: author.verifiedSkills || []
            }
        });
    } catch (err) {
        console.error('Error creating looking-for request:', err);
        res.status(500).json({ error: 'Failed to create matchmaking request' });
    }
});

// 5. Delete Looking-For Request (Protected)
app.delete('/api/community/looking-for/:id', authMiddleware, async (req, res) => {
    try {
        const filePath = getFilePath('looking_for');
        let list = [];
        try { list = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const targetIndex = list.findIndex(item => item.id === req.params.id);
        if (targetIndex === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (String(list[targetIndex].userId) !== String(req.user.id)) {
            return res.status(403).json({ error: 'Unauthorized to delete this request' });
        }

        list.splice(targetIndex, 1);
        await fs.writeFile(filePath, JSON.stringify(list, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting looking-for request:', err);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

// 6. Get Teams (Enriched with Member Profiles and Real Upvotes)
app.get('/api/teams', async (req, res) => {
    try {
        let teams = [];
        let users = [];
        try { teams = JSON.parse(await fs.readFile(getFilePath('teams'), 'utf-8')); } catch {}
        try { users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8')); } catch {}

        const usersMap = new Map(users.map(u => [String(u.id), u]));

        const enrichedTeams = teams.map(t => {
            const lead = usersMap.get(String(t.leadId)) || {};
            const memberIds = Array.isArray(t.members) ? t.members : (t.leadId ? [t.leadId] : []);
            const memberDetails = memberIds.map(mId => {
                const u = usersMap.get(String(mId)) || {};
                return {
                    id: u.id || mId,
                    name: u.name || `Dev #${mId}`,
                    avatarUrl: u.avatarUrl || '',
                    title: u.title || 'Team Member'
                };
            });

            return {
                id: t.id,
                teamName: t.teamName,
                description: t.description || 'Collaborative open-source team',
                leadId: t.leadId,
                lead: {
                    id: lead.id || t.leadId,
                    name: lead.name || 'Team Lead',
                    avatarUrl: lead.avatarUrl || '',
                    title: lead.title || 'Lead'
                },
                members: memberIds,
                memberDetails,
                skills: Array.isArray(t.skills) ? t.skills : ['JavaScript', 'TypeScript'],
                lookingFor: t.lookingFor || 'Looking for collaborators',
                openPositions: Array.isArray(t.openPositions) ? t.openPositions : ['Collaborator'],
                availability: t.availability || 'Active · Open for Collaboration',
                assignedProjects: Array.isArray(t.assignedProjects) ? t.assignedProjects : [],
                upvotes: typeof t.upvotes === 'number' ? t.upvotes : (Array.isArray(t.upvoters) ? t.upvoters.length : 0),
                upvoters: Array.isArray(t.upvoters) ? t.upvoters : [],
                rating: t.rating || '5.0',
                createdAt: t.createdAt || new Date().toISOString()
            };
        });

        res.json(enrichedTeams);
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// 7. Create New Team (Protected)
app.post('/api/teams', authMiddleware, async (req, res) => {
    try {
        const { teamName, description, skills, lookingFor, openPositions, availability, assignedProjects } = req.body;
        if (!teamName || !teamName.trim()) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const filePath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const newTeam = {
            id: Date.now().toString(),
            leadId: req.user.id,
            teamName: teamName.trim(),
            description: description ? description.trim() : '',
            skills: Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []),
            lookingFor: lookingFor ? lookingFor.trim() : 'Looking for collaborators',
            openPositions: Array.isArray(openPositions) ? openPositions : (typeof openPositions === 'string' ? openPositions.split(',').map(s => s.trim()).filter(Boolean) : ['Collaborator']),
            availability: availability || 'Active · Open for Collaboration',
            assignedProjects: Array.isArray(assignedProjects) ? assignedProjects : (typeof assignedProjects === 'string' ? assignedProjects.split(',').map(s => s.trim()).filter(Boolean) : []),
            members: [String(req.user.id)],
            upvotes: 0,
            upvoters: [],
            rating: '5.0',
            createdAt: new Date().toISOString()
        };

        teams.unshift(newTeam);
        await fs.writeFile(filePath, JSON.stringify(teams, null, 2));

        // Update creator user profile teams array
        try {
            const usersFilePath = getFilePath('users');
            let users = JSON.parse(await fs.readFile(usersFilePath, 'utf-8'));
            const userIdx = users.findIndex(u => String(u.id) === String(req.user.id));
            if (userIdx !== -1) {
                if (!Array.isArray(users[userIdx].teams)) users[userIdx].teams = [];
                users[userIdx].teams.push({
                    teamId: newTeam.id,
                    teamName: newTeam.teamName,
                    role: 'Team Lead',
                    description: newTeam.description,
                    skills: newTeam.skills,
                    rating: 5.0,
                    membersCount: 1
                });
                await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
            }
        } catch (uErr) {
            console.error('Error updating user teams array:', uErr);
        }

        res.status(201).json(newTeam);
    } catch (err) {
        console.error('Error creating team:', err);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// 8. Join Team / Apply to Open Position (Protected)
app.post('/api/teams/:id/join', authMiddleware, async (req, res) => {
    try {
        const teamId = req.params.id;
        const { position, message } = req.body;
        const applicantId = req.user.id;

        const teamsFilePath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(teamsFilePath, 'utf-8')); } catch {}

        const team = teams.find(t => t.id === teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (String(team.leadId) === String(applicantId)) {
            return res.status(400).json({ error: 'You are the lead of this team' });
        }

        if (Array.isArray(team.members) && team.members.map(String).includes(String(applicantId))) {
            return res.status(400).json({ error: 'You are already a member of this team' });
        }

        // Get applicant details
        let applicant = {};
        try {
            const users = JSON.parse(await fs.readFile(getFilePath('users'), 'utf-8'));
            applicant = users.find(u => String(u.id) === String(applicantId)) || {};
        } catch {}

        // Save join request
        const reqFilePath = getFilePath('join_requests');
        let joinReqs = [];
        try { joinReqs = JSON.parse(await fs.readFile(reqFilePath, 'utf-8')); } catch {}

        // Prevent duplicate pending requests
        const existingReq = joinReqs.find(r => r.teamId === teamId && String(r.userId) === String(applicantId) && r.status === 'pending');
        if (existingReq) {
            return res.status(400).json({ error: 'You already have a pending join request for this team' });
        }

        const newJoinReq = {
            id: Date.now().toString(),
            teamId,
            teamName: team.teamName,
            userId: applicantId,
            applicantName: applicant.name || 'Developer',
            leadId: team.leadId,
            position: position || 'Collaborator',
            message: message || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        joinReqs.push(newJoinReq);
        await fs.writeFile(reqFilePath, JSON.stringify(joinReqs, null, 2));

        // Dispatch Notification to Team Lead
        const notifFilePath = getFilePath('notifications');
        let notifs = [];
        try { notifs = JSON.parse(await fs.readFile(notifFilePath, 'utf-8')); } catch {}

        notifs.push({
            id: Date.now().toString(),
            userId: team.leadId,
            actorId: applicantId,
            type: 'TEAM_JOIN_REQUEST',
            title: 'New Team Application',
            message: `${applicant.name || 'A developer'} requested to join ${team.teamName} for "${position || 'Collaborator'}".`,
            data: { teamId, requestId: newJoinReq.id },
            read: false,
            createdAt: new Date().toISOString()
        });
        await fs.writeFile(notifFilePath, JSON.stringify(notifs, null, 2));

        res.json({ success: true, message: `Application submitted to ${team.teamName} lead!` });
    } catch (err) {
        console.error('Error applying to team:', err);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// 9. Respond to Team Join Request (Accept / Reject) (Protected)
app.post('/api/teams/:id/respond', authMiddleware, async (req, res) => {
    try {
        const teamId = req.params.id;
        const { requestId, applicantId, action } = req.body; // action: 'accept' | 'reject'
        const leadId = req.user.id;

        const teamsFilePath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(teamsFilePath, 'utf-8')); } catch {}

        const team = teams.find(t => t.id === teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (String(team.leadId) !== String(leadId)) return res.status(403).json({ error: 'Only the team lead can manage applications' });

        if (action === 'accept') {
            if (!Array.isArray(team.members)) team.members = [String(leadId)];
            if (!team.members.map(String).includes(String(applicantId))) {
                team.members.push(String(applicantId));
            }
            await fs.writeFile(teamsFilePath, JSON.stringify(teams, null, 2));

            // Update user profile teams list
            try {
                const usersFilePath = getFilePath('users');
                let users = JSON.parse(await fs.readFile(usersFilePath, 'utf-8'));
                const uIdx = users.findIndex(u => String(u.id) === String(applicantId));
                if (uIdx !== -1) {
                    if (!Array.isArray(users[uIdx].teams)) users[uIdx].teams = [];
                    users[uIdx].teams.push({
                        teamId: team.id,
                        teamName: team.teamName,
                        role: 'Member',
                        description: team.description,
                        skills: team.skills,
                        rating: 5.0,
                        membersCount: team.members.length
                    });
                    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
                }
            } catch (e) {}
        }

        // Update join request status if exists
        try {
            const reqFilePath = getFilePath('join_requests');
            let joinReqs = JSON.parse(await fs.readFile(reqFilePath, 'utf-8'));
            const reqItem = joinReqs.find(r => r.id === requestId || (r.teamId === teamId && String(r.userId) === String(applicantId)));
            if (reqItem) {
                reqItem.status = action === 'accept' ? 'accepted' : 'rejected';
                await fs.writeFile(reqFilePath, JSON.stringify(joinReqs, null, 2));
            }
        } catch (e) {}

        // Notify applicant
        try {
            const notifFilePath = getFilePath('notifications');
            let notifs = JSON.parse(await fs.readFile(notifFilePath, 'utf-8'));
            notifs.push({
                id: Date.now().toString(),
                userId: applicantId,
                actorId: leadId,
                type: action === 'accept' ? 'TEAM_JOIN_ACCEPTED' : 'TEAM_JOIN_REJECTED',
                title: action === 'accept' ? 'Application Accepted!' : 'Application Update',
                message: action === 'accept' ? `Congratulations! You have been accepted into ${team.teamName}.` : `Your request to join ${team.teamName} was not accepted at this time.`,
                data: { teamId },
                read: false,
                createdAt: new Date().toISOString()
            });
            await fs.writeFile(notifFilePath, JSON.stringify(notifs, null, 2));
        } catch (e) {}

        res.json({ success: true, team });
    } catch (err) {
        console.error('Error responding to join request:', err);
        res.status(500).json({ error: 'Failed to process response' });
    }
});

// 10. Upvote Team (Toggle) (Protected)
app.post('/api/teams/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const teamId = req.params.id;
        const userId = String(req.user.id);
        const filePath = getFilePath('teams');
        let teams = [];
        try { teams = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const team = teams.find(t => t.id === teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        if (!Array.isArray(team.upvoters)) team.upvoters = [];
        const idx = team.upvoters.map(String).indexOf(userId);
        let hasUpvoted = false;

        if (idx === -1) {
            team.upvoters.push(userId);
            hasUpvoted = true;
        } else {
            team.upvoters.splice(idx, 1);
            hasUpvoted = false;
        }

        team.upvotes = team.upvoters.length;
        await fs.writeFile(filePath, JSON.stringify(teams, null, 2));

        res.json({ upvotes: team.upvotes, upvoters: team.upvoters, hasUpvoted });
    } catch (err) {
        console.error('Error upvoting team:', err);
        res.status(500).json({ error: 'Failed to upvote team' });
    }
});

// 11. Upvote Developer Profile (Toggle) (Protected)
app.post('/api/users/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const voterId = String(req.user.id);
        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const user = users.find(u => String(u.id) === String(targetUserId));
        if (!user) return res.status(404).json({ error: 'Developer not found' });

        if (!Array.isArray(user.upvoters)) user.upvoters = [];
        const idx = user.upvoters.map(String).indexOf(voterId);
        let hasUpvoted = false;

        if (idx === -1) {
            user.upvoters.push(voterId);
            hasUpvoted = true;
        } else {
            user.upvoters.splice(idx, 1);
            hasUpvoted = false;
        }

        user.upvotes = user.upvoters.length;
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        res.json({ upvotes: user.upvotes, upvoters: user.upvoters, hasUpvoted });
    } catch (err) {
        console.error('Error upvoting developer:', err);
        res.status(500).json({ error: 'Failed to upvote developer' });
    }
});

// 12. Follow Developer (Toggle) (Protected)
app.post('/api/users/:id/follow', authMiddleware, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const followerId = String(req.user.id);
        if (targetUserId === followerId) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }

        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const user = users.find(u => String(u.id) === String(targetUserId));
        if (!user) return res.status(404).json({ error: 'Developer not found' });

        if (!Array.isArray(user.followers)) user.followers = [];
        const idx = user.followers.map(String).indexOf(followerId);
        let hasFollowed = false;

        if (idx === -1) {
            user.followers.push(followerId);
            hasFollowed = true;
        } else {
            user.followers.splice(idx, 1);
            hasFollowed = false;
        }

        await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        res.json({ followers: user.followers, hasFollowed });
    } catch (err) {
        console.error('Error following developer:', err);
        res.status(500).json({ error: 'Failed to follow developer' });
    }
});

// 13. Update Availability & Matchmaking Preferences (Protected)
app.put('/api/users/availability', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.user.id);
        const { availability, lookingFor, hoursPerWeek, collaborationType, timezone } = req.body;

        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const user = users.find(u => String(u.id) === userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (availability) user.availability = availability;
        if (lookingFor) user.lookingFor = lookingFor;
        if (hoursPerWeek) user.hoursPerWeek = hoursPerWeek;
        if (collaborationType) user.collaborationType = collaborationType;
        if (timezone) user.timezone = timezone;

        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        res.json({
            success: true,
            availability: user.availability,
            lookingFor: user.lookingFor,
            hoursPerWeek: user.hoursPerWeek,
            collaborationType: user.collaborationType,
            timezone: user.timezone
        });
    } catch (err) {
        console.error('Error updating availability:', err);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});
app.post('/api/users/availability', authMiddleware, async (req, res) => {
    // Alias to PUT /api/users/availability
    try {
        const userId = String(req.user.id);
        const { availability, lookingFor, hoursPerWeek, collaborationType, timezone } = req.body;

        const filePath = getFilePath('users');
        let users = [];
        try { users = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}

        const user = users.find(u => String(u.id) === userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (availability) user.availability = availability;
        if (lookingFor) user.lookingFor = lookingFor;
        if (hoursPerWeek) user.hoursPerWeek = hoursPerWeek;
        if (collaborationType) user.collaborationType = collaborationType;
        if (timezone) user.timezone = timezone;

        await fs.writeFile(filePath, JSON.stringify(users, null, 2));

        res.json({
            success: true,
            availability: user.availability,
            lookingFor: user.lookingFor,
            hoursPerWeek: user.hoursPerWeek,
            collaborationType: user.collaborationType,
            timezone: user.timezone
        });
    } catch (err) {
        console.error('Error updating availability:', err);
        res.status(500).json({ error: 'Failed to update availability' });
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

// Fallback generic data table route
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

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Storing data in: ${DATA_DIR}`);
    });
}

module.exports = app;
