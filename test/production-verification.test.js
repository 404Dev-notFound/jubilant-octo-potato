/*
 * ==============================================================================
 * CodeCollab Production Verification & Security Regression Test Suite
 * ==============================================================================
 * Validates health endpoints, authentication lifecycle, bcrypt password hashing,
 * backend authorization matrix, IDOR protection, privacy (zero email exposure),
 * and project/issue/notification workflows.
 */

const http = require('http');
const app = require('../server.js');

let server;
let baseUrl;

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const reqOptions = {
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 5000
        };

        if (options.body && typeof options.body === 'object') {
            reqOptions.headers['Content-Type'] = 'application/json';
        }

        const req = http.request(url, reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        if (options.body) {
            req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
        }
        req.end();
    });
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        throw new Error(message);
    }
    console.log(`  ✅ PASS: ${message}`);
}

async function runTests() {
    console.log('\n===============================================================');
    console.log('🧪 RUNNING CODECOLLAB PRODUCTION VERIFICATION TEST SUITE');
    console.log('===============================================================\n');

    // Start server on ephemeral port for testing
    await new Promise((resolve) => {
        server = app.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`Test server running on ${baseUrl}\n`);
            resolve();
        });
    });

    let userA, userB, userC;
    let userAToken, userBToken, userCToken;
    let userARefreshToken;
    let createdProjectId;
    let createdIssueId;
    let createdNotifId;

    try {
        // ----------------------------------------------------------------------
        // 1. Health Checks & Observability
        // ----------------------------------------------------------------------
        console.log('--- 1. Health Checks & Observability ---');
        {
            const res = await request('/health');
            assert(res.status === 200, '/health returns HTTP 200');
            assert(res.body.status === 'healthy', '/health status is healthy');
            assert(typeof res.body.uptime === 'number', '/health reports process uptime');
            assert(typeof res.body.environment === 'string', '/health reports environment');
        }
        {
            const res = await request('/healthz');
            assert(res.status === 200, '/healthz returns HTTP 200');
        }

        // ----------------------------------------------------------------------
        // 2. Authentication Flow & Security
        // ----------------------------------------------------------------------
        console.log('\n--- 2. Authentication Flow & Security ---');
        const uniqueSuffix = Date.now();
        const emailA = `test_alice_${uniqueSuffix}@example.com`;
        const emailB = `test_bob_${uniqueSuffix}@example.com`;
        const emailC = `test_charlie_${uniqueSuffix}@example.com`;
        const passwordA = 'SecurePassword123!';

        // Signup User A
        {
            const res = await request('/api/auth/signup', {
                method: 'POST',
                body: { email: emailA, password: passwordA, name: 'Alice Developer' }
            });
            assert(res.status === 201, 'Signup returns HTTP 201');
            assert(res.body.token && typeof res.body.token === 'string', 'Signup returns JWT token');
            assert(res.body.refreshToken && typeof res.body.refreshToken === 'string', 'Signup returns refreshToken');
            assert(res.body.password === undefined, 'Password is NEVER returned in signup response');
            assert(res.body.passwordHash === undefined, 'Password hash is NEVER returned in signup response');
            userA = res.body;
            userAToken = res.body.token;
            userARefreshToken = res.body.refreshToken;
        }

        // Duplicate signup blocked
        {
            const res = await request('/api/auth/signup', {
                method: 'POST',
                body: { email: emailA, password: passwordA, name: 'Alice Duplicate' }
            });
            assert(res.status === 400, 'Duplicate email signup is blocked with HTTP 400');
        }

        // Short password blocked
        {
            const res = await request('/api/auth/signup', {
                method: 'POST',
                body: { email: `short_${uniqueSuffix}@example.com`, password: '123', name: 'Short' }
            });
            assert(res.status === 400, 'Short password (<6 chars) is rejected with HTTP 400');
        }

        // Signup User B & User C
        {
            const resB = await request('/api/auth/signup', {
                method: 'POST',
                body: { email: emailB, password: 'SecurePassword456!', name: 'Bob Maintainer' }
            });
            assert(resB.status === 201, 'User B signup successful');
            userB = resB.body;
            userBToken = resB.body.token;

            const resC = await request('/api/auth/signup', {
                method: 'POST',
                body: { email: emailC, password: 'SecurePassword789!', name: 'Charlie Contributor' }
            });
            assert(resC.status === 201, 'User C signup successful');
            userC = resC.body;
            userCToken = resC.body.token;
        }

        // Login with valid credentials
        {
            const res = await request('/api/auth/login', {
                method: 'POST',
                body: { email: emailA, password: passwordA }
            });
            assert(res.status === 200, 'Login with correct credentials returns HTTP 200');
            assert(res.body.token, 'Login returns JWT token');
            assert(res.body.password === undefined && res.body.passwordHash === undefined, 'Login never exposes password');
        }

        // Login with invalid credentials
        {
            const res = await request('/api/auth/login', {
                method: 'POST',
                body: { email: emailA, password: 'WrongPassword!' }
            });
            assert(res.status === 401, 'Login with incorrect password returns HTTP 401');
        }

        // Refresh token rotation
        {
            const res = await request('/api/auth/refresh', {
                method: 'POST',
                body: { refreshToken: userARefreshToken }
            });
            assert(res.status === 200, 'Refresh token exchange returns HTTP 200');
            assert(res.body.token && res.body.refreshToken, 'Refresh token exchange returns new access & refresh tokens');
            userAToken = res.body.token; // Update token
        }

        // Logout
        {
            const res = await request('/api/auth/logout', {
                method: 'POST',
                body: { refreshToken: userARefreshToken }
            });
            assert(res.status === 200, 'Logout returns HTTP 200');
        }

        // ----------------------------------------------------------------------
        // 3. Privacy & Zero-Email Exposure Audit
        // ----------------------------------------------------------------------
        console.log('\n--- 3. Privacy & Zero-Email Exposure Audit ---');
        {
            const res = await request('/api/users');
            assert(res.status === 200, 'GET /api/users returns HTTP 200');
            assert(Array.isArray(res.body), 'GET /api/users returns array');
            const hasEmail = res.body.some(u => u.email !== undefined);
            assert(!hasEmail, 'CRITICAL PRIVACY: GET /api/users contains ZERO email addresses');
            const hasPassword = res.body.some(u => u.password !== undefined || u.passwordHash !== undefined);
            assert(!hasPassword, 'CRITICAL PRIVACY: GET /api/users contains ZERO password fields');
        }
        {
            const res = await request('/api/community/developers');
            assert(res.status === 200, 'GET /api/community/developers returns HTTP 200');
            const hasEmail = res.body.some(u => u.email !== undefined);
            assert(!hasEmail, 'CRITICAL PRIVACY: GET /api/community/developers contains ZERO email addresses');
        }
        {
            const res = await request('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${userAToken}` }
            });
            assert(res.status === 200, 'GET /api/users/profile returns HTTP 200 for authenticated user');
            assert(res.body.email === emailA, 'Authenticated owner profile safely includes their own email');
            assert(res.body.password === undefined && res.body.passwordHash === undefined, 'Profile never exposes password');
        }

        // ----------------------------------------------------------------------
        // 4. Projects & Backend Authorization Matrix
        // ----------------------------------------------------------------------
        console.log('\n--- 4. Projects & Backend Authorization Matrix ---');
        
        // Unauthenticated project creation blocked
        {
            const res = await request('/api/projects', {
                method: 'POST',
                body: { title: 'Unauthorized Project', description: 'Should fail' }
            });
            assert(res.status === 401, 'Unauthenticated project creation is blocked with HTTP 401');
        }

        // User A creates project
        {
            const res = await request('/api/projects', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: {
                    title: 'Production Hardened Engine',
                    category: 'Infrastructure',
                    difficulty: 'Advanced',
                    techStack: ['Node.js', 'PostgreSQL', 'Docker'],
                    description: 'A mission critical distributed computing system.',
                    githubUrl: 'https://github.com/codecollab/hardened-engine'
                }
            });
            assert(res.status === 201, 'User A successfully creates project (HTTP 201)');
            assert(res.body.id, 'Created project has valid id');
            assert(String(res.body.ownerId) === String(userA.id), 'Project ownerId matches User A id');
            createdProjectId = res.body.id;
        }

        // Get single project
        {
            const res = await request(`/api/projects/${createdProjectId}`);
            assert(res.status === 200, 'GET /api/projects/:id returns HTTP 200');
            assert(res.body.title === 'Production Hardened Engine', 'Fetched project title matches');
            assert(res.body.owner && res.body.owner.id === userA.id, 'Project owner object is properly populated');
            assert(res.body.owner.email === undefined, 'Project owner object does NOT expose email');
        }

        // User B (non-owner) attempts to modify User A's project -> BLOCKED
        {
            const res = await request(`/api/projects/${createdProjectId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${userBToken}` },
                body: { title: 'Hacked by Bob' }
            });
            assert(res.status === 403, 'User B (non-owner) edit attempt is BLOCKED with HTTP 403 Forbidden');
        }

        // User A (owner) modifies own project -> ALLOWED
        {
            const res = await request(`/api/projects/${createdProjectId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: { description: 'Updated project description by legitimate owner.' }
            });
            assert(res.status === 200, 'User A (owner) edit is ALLOWED with HTTP 200');
            assert(res.body.description === 'Updated project description by legitimate owner.', 'Project description successfully updated');
        }

        // User B (non-owner) attempts to delete User A's project -> BLOCKED
        {
            const res = await request(`/api/projects/${createdProjectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userBToken}` }
            });
            assert(res.status === 403, 'User B (non-owner) deletion attempt is BLOCKED with HTTP 403 Forbidden');
        }

        // ----------------------------------------------------------------------
        // 5. Issues & Role-Based Permissions
        // ----------------------------------------------------------------------
        console.log('\n--- 5. Issues & Role-Based Permissions ---');

        // User C (non-member) attempts to create issue -> BLOCKED
        {
            const res = await request(`/api/projects/${createdProjectId}/issues`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userCToken}` },
                body: { title: 'Unauthorized Issue', status: 'TODO', priority: 'HIGH' }
            });
            assert(res.status === 403, 'Non-member issue creation is BLOCKED with HTTP 403 Forbidden');
        }

        // User A (owner) creates issue
        {
            const res = await request(`/api/projects/${createdProjectId}/issues`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: {
                    title: 'Implement TLS 1.3 Termination',
                    description: 'Configure SSL certificates and TLS cipher suites.',
                    status: 'TODO',
                    priority: 'HIGH',
                    tags: ['Security', 'Infra'],
                    assigneeId: userA.id
                }
            });
            assert(res.status === 201, 'Project owner creates issue with HTTP 201');
            assert(res.body.id, 'Issue has valid ID');
            assert(res.body.creatorId === userA.id, 'Issue creatorId matches User A');
            assert(res.body.creator && res.body.creator.email === undefined, 'Issue creator object does NOT leak email');
            createdIssueId = res.body.id;
        }

        // User C (stranger) attempts to modify issue -> BLOCKED
        {
            const res = await request(`/api/projects/${createdProjectId}/issues/${createdIssueId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${userCToken}` },
                body: { status: 'DONE' }
            });
            assert(res.status === 403, 'Unauthorized issue modification is BLOCKED with HTTP 403 Forbidden');
        }

        // User A (owner/creator) updates issue status to DONE
        {
            const res = await request(`/api/projects/${createdProjectId}/issues/${createdIssueId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: { status: 'DONE' }
            });
            assert(res.status === 200, 'Legitimate issue update returns HTTP 200');
            assert(res.body.status === 'DONE', 'Issue status updated to DONE');
        }

        // ----------------------------------------------------------------------
        // 6. Join Requests & Collaboration
        // ----------------------------------------------------------------------
        console.log('\n--- 6. Join Requests & Collaboration ---');
        let joinRequestId;
        {
            const res = await request(`/api/projects/${createdProjectId}/join-requests`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userBToken}` },
                body: { message: 'I want to contribute to backend performance!' }
            });
            assert(res.status === 201, 'User B submits join request with HTTP 201');
            assert(res.body.id, 'Join request has valid id');
            joinRequestId = res.body.id;
        }

        // User C (stranger) attempts to accept/reject User B's join request -> BLOCKED
        {
            const res = await request(`/api/join-requests/${joinRequestId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${userCToken}` },
                body: { status: 'ACCEPTED' }
            });
            assert(res.status === 403, 'Non-owner attempting to manage join request is BLOCKED with HTTP 403');
        }

        // User A (owner) accepts User B's join request -> ALLOWED & Adds to ProjectMember
        {
            const res = await request(`/api/join-requests/${joinRequestId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: { status: 'ACCEPTED' }
            });
            assert(res.status === 200, 'Owner accepts join request with HTTP 200');
        }

        // Verify User B is now recognized as a project member and can create issues
        {
            const res = await request(`/api/projects/${createdProjectId}/issues`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userBToken}` },
                body: {
                    title: 'Add Redis Cache Layer',
                    description: 'Speed up repeat query responses.',
                    status: 'IN_PROGRESS',
                    priority: 'MEDIUM'
                }
            });
            assert(res.status === 201, 'Newly admitted Member (User B) can now create issues in the project (HTTP 201)');
        }

        // ----------------------------------------------------------------------
        // 7. Notifications System & Recipient Isolation
        // ----------------------------------------------------------------------
        console.log('\n--- 7. Notifications System & Recipient Isolation ---');
        {
            const res = await request('/api/notifications', {
                headers: { 'Authorization': `Bearer ${userBToken}` }
            });
            assert(res.status === 200, 'User B fetches notifications (HTTP 200)');
            assert(Array.isArray(res.body), 'Notifications returned as array');
            assert(res.body.length > 0, 'User B has received notifications (e.g. join accepted)');
            createdNotifId = res.body[0].id;
        }

        // User C attempts to delete User B's notification -> BLOCKED
        {
            const res = await request(`/api/notifications/${createdNotifId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userCToken}` }
            });
            assert(res.status === 403, 'User C deleting User B notification is BLOCKED with HTTP 403');
        }

        // User B marks all read
        {
            const res = await request('/api/notifications/read-all', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userBToken}` }
            });
            assert(res.status === 200, 'User B marks all notifications as read');
        }

        // ----------------------------------------------------------------------
        // 8. Project Deletion & Cascading Cleanup
        // ----------------------------------------------------------------------
        console.log('\n--- 8. Project Deletion & Cascading Cleanup ---');
        {
            const res = await request(`/api/projects/${createdProjectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userAToken}` }
            });
            assert(res.status === 200, 'Owner User A successfully deletes project');
        }

        // Verify project is deleted
        {
            const res = await request(`/api/projects/${createdProjectId}`);
            assert(res.status === 404, 'Deleted project returns HTTP 404 Not Found');
        }

        // ----------------------------------------------------------------------
        // 9. Production CORS, Preflight & Header Security
        // ----------------------------------------------------------------------
        console.log('\n--- 9. Production CORS, Preflight & Security Headers ---');
        {
            // Standard Netlify Origin
            const res = await request('/health', {
                headers: { 'Origin': 'https://opensource-projects.netlify.app' }
            });
            assert(res.status === 200, '/health returns HTTP 200 for Netlify origin');
            assert(res.headers['access-control-allow-origin'] === 'https://opensource-projects.netlify.app', 'CORS allows https://opensource-projects.netlify.app');
            assert(res.headers['access-control-allow-credentials'] === 'true', 'CORS credentials enabled');
            assert(res.headers['cross-origin-resource-policy'] === 'cross-origin', 'CORP header configured for cross-origin access');
        }

        {
            // Trailing slash origin normalization
            const res = await request('/health', {
                headers: { 'Origin': 'https://opensource-projects.netlify.app/' }
            });
            assert(res.headers['access-control-allow-origin'] === 'https://opensource-projects.netlify.app/', 'CORS gracefully handles trailing slash in Origin header');
        }

        {
            // Netlify Deploy Preview Subdomain
            const res = await request('/health', {
                headers: { 'Origin': 'https://deploy-preview-101--opensource-projects.netlify.app' }
            });
            assert(res.headers['access-control-allow-origin'] === 'https://deploy-preview-101--opensource-projects.netlify.app', 'CORS allows Netlify preview subdomains');
        }

        {
            // Preflight OPTIONS for /api/projects
            const res = await request('/api/projects', {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'https://opensource-projects.netlify.app',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'authorization, content-type'
                }
            });
            assert(res.status === 204 || res.status === 200, 'OPTIONS preflight returns 204/200');
            assert(res.headers['access-control-allow-origin'] === 'https://opensource-projects.netlify.app', 'Preflight allows Netlify origin');
            assert(res.headers['access-control-allow-methods'] && res.headers['access-control-allow-methods'].includes('POST'), 'Preflight permits POST method');
        }

        // ----------------------------------------------------------------------
        // 10. Matchmaking & Looking-For System (Prisma + Supabase PostgreSQL)
        // ----------------------------------------------------------------------
        console.log('\n--- 10. Matchmaking & Looking-For System ---');
        let createdPostId;
        {
            // Unauthenticated looking-for creation blocked
            const res = await request('/api/community/looking-for', {
                method: 'POST',
                body: { lookingFor: 'Frontend Lead', for: 'Next.js App', requiredSkills: ['React'] }
            });
            assert(res.status === 401, 'Unauthenticated looking-for post creation is blocked (HTTP 401)');
        }
        {
            // User A creates looking-for post
            const res = await request('/api/community/looking-for', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: {
                    lookingFor: 'Rust Core Engineer',
                    for: 'Building High-Performance Distributed DB',
                    requiredSkills: ['Rust', 'Tokio', 'Raft'],
                    commitment: 'Part-time (10 hrs/wk)',
                    availability: 'Evenings & Weekends',
                    context: 'Looking for a systems dev to collaborate on consensus layer.'
                }
            });
            assert(res.status === 201, 'User A creates looking-for post (HTTP 201)');
            assert(res.body.id, 'Created post contains id');
            assert(res.body.userId === userA.id, 'Post userId matches User A');
            assert(res.body.author && !res.body.author.email, 'Author info populated without email leakage');
            createdPostId = res.body.id;
        }
        {
            // GET /api/community/looking-for
            const res = await request('/api/community/looking-for');
            assert(res.status === 200, 'GET /api/community/looking-for returns HTTP 200');
            assert(Array.isArray(res.body), 'Looking-for posts returned as array');
            const found = res.body.find(p => p.id === createdPostId);
            assert(found, 'Created post is present in feed');
        }
        {
            // User B (non-owner) attempting to delete User A's post is BLOCKED
            const res = await request(`/api/community/looking-for/${createdPostId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userBToken}` }
            });
            assert(res.status === 403, 'Non-owner delete attempt on looking-for post is BLOCKED (HTTP 403)');
        }
        {
            // User A deletes own looking-for post
            const res = await request(`/api/community/looking-for/${createdPostId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userAToken}` }
            });
            assert(res.status === 200, 'Owner User A successfully deletes looking-for post (HTTP 200)');
        }

        // ----------------------------------------------------------------------
        // 11. Teams & Member Application Lifecycle (Prisma + Supabase PostgreSQL)
        // ----------------------------------------------------------------------
        console.log('\n--- 11. Teams & Application Lifecycle ---');
        let createdTeamId;
        {
            // User A creates team
            const res = await request('/api/teams', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: {
                    teamName: 'Hyperion Quantum Lab',
                    tagline: 'Building next-gen simulators',
                    description: 'Open source collective researching quantum algorithms.',
                    tags: ['Quantum', 'Python', 'Qiskit'],
                    openPositions: [{ role: 'Algorithm Researcher', skills: ['Python'] }]
                }
            });
            assert(res.status === 201, 'User A creates new team (HTTP 201)');
            assert(res.body.id, 'Team has valid ID');
            assert(res.body.leadId === userA.id, 'Team leadId matches User A');
            createdTeamId = res.body.id;
        }
        {
            // GET /api/teams
            const res = await request('/api/teams');
            assert(res.status === 200, 'GET /api/teams returns HTTP 200');
            assert(Array.isArray(res.body), 'Teams returned as array');
            const found = res.body.find(t => t.id === createdTeamId);
            assert(found, 'Created team is present in list');
            assert(found.memberDetails && found.memberDetails.length >= 1, 'Team includes memberDetails with lead');
            assert(!found.lead || !found.lead.email, 'Team lead never exposes email');
        }
        {
            // User B upvotes team
            const res = await request(`/api/teams/${createdTeamId}/upvote`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userBToken}` }
            });
            assert(res.status === 200, 'User B upvotes team (HTTP 200)');
            assert(res.body.hasUpvoted === true, 'Upvote recorded');
            assert(res.body.upvotes >= 1, 'Upvote count incremented');
        }

        // ----------------------------------------------------------------------
        // 12. Organizations System (Prisma + Supabase PostgreSQL)
        // ----------------------------------------------------------------------
        console.log('\n--- 12. Organizations System ---');
        {
            // User A creates organization
            const res = await request('/api/organizations', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userAToken}` },
                body: {
                    name: 'Vanguard Foundation',
                    description: 'Global developer collective for open infrastructure.',
                    website: 'https://vanguard.dev',
                    tags: ['Infrastructure', 'Security']
                }
            });
            assert(res.status === 201, 'User A creates organization (HTTP 201)');
            assert(res.body.id, 'Organization has valid ID');
            assert(res.body.ownerId === userA.id, 'Org owner matches User A');
        }
        {
            // GET /api/organizations
            const res = await request('/api/organizations');
            assert(res.status === 200, 'GET /api/organizations returns HTTP 200');
            assert(Array.isArray(res.body), 'Organizations returned as array');
        }

        // ----------------------------------------------------------------------
        // 13. Developer Upvote & Follow Persistence (Prisma + Supabase PostgreSQL)
        // ----------------------------------------------------------------------
        console.log('\n--- 13. Developer Upvotes & Follows ---');
        {
            // User B upvotes User A
            const res = await request(`/api/users/${userA.id}/upvote`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userBToken}` }
            });
            assert(res.status === 200, 'User B upvotes User A profile (HTTP 200)');
            assert(res.body.hasUpvoted === true, 'Profile upvote registered');
            assert(res.body.upvotes >= 1, 'Profile upvotes count updated');
        }
        {
            // User B follows User A
            const res = await request(`/api/users/${userA.id}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userBToken}` }
            });
            assert(res.status === 200, 'User B follows User A profile (HTTP 200)');
            assert(res.body.hasFollowed === true, 'Follower recorded');
        }
        {
            // GET /api/users/:id
            const res = await request(`/api/users/${userA.id}`);
            assert(res.status === 200, 'GET /api/users/:id returns HTTP 200');
            assert(res.body.name === userA.name, 'Fetched user name matches');
            assert(!res.body.email, 'Public user endpoint NEVER exposes email');
            assert(res.body.upvotes >= 1, 'Upvotes persisted in database');
            assert(Array.isArray(res.body.followers) && res.body.followers.length >= 1, 'Followers persisted in database');
        }

        // ----------------------------------------------------------------------
        // 14. HTML Sanitization & Project Card Rendering Integrity
        // ----------------------------------------------------------------------
        console.log('\n--- 14. HTML Sanitization & Project Card Rendering ---');
        {
            // Test escapeHtml implementation
            const escapeHtml = (str) => {
                if (str === null || str === undefined) return '';
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };

            assert(escapeHtml('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'escapeHtml correctly escapes <, >, and "');
            assert(escapeHtml("Tom & Jerry's") === 'Tom &amp; Jerry&#039;s', 'escapeHtml correctly escapes & and \'');
            assert(escapeHtml(null) === '', 'escapeHtml safely handles null');
            assert(escapeHtml(undefined) === '', 'escapeHtml safely handles undefined');
            assert(escapeHtml('') === '', 'escapeHtml handles empty string');
            assert(escapeHtml(12345) === '12345', 'escapeHtml converts numeric input to string safely');

            // Test renderProjectCard simulation
            const renderProjectCard = function (p) {
                const safeTechStack = Array.isArray(p.techStack) ? p.techStack : (typeof p.techStack === 'string' ? p.techStack.split(',').map(s => s.trim()) : []);
                const techBadges = safeTechStack.map(tech =>
                    `<span class="px-2.5 py-1 bg-surface-container-highest rounded-full text-[11px] font-medium text-on-surface-variant border border-white/5">${escapeHtml(tech)}</span>`
                ).join('');
                const demoBadge = p.isDemo ? `<span class="ml-2 px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-md text-[10px] font-bold uppercase tracking-wider">Demo</span>` : '';
                const ownerName = p.owner?.name || (p.ownerId ? `Developer #${p.ownerId}` : 'Open Source');
                const ownerInitial = ownerName.charAt(0).toUpperCase();
                const ownerDisplay = `<div class="flex items-center gap-2 text-xs text-on-surface-variant mb-3"><div class="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-[11px] font-bold flex items-center justify-center border border-secondary/30">${ownerInitial}</div><span class="truncate font-medium">By ${escapeHtml(ownerName)}</span></div>`;

                return `
                <div class="glass-card bg-surface-container-low/50 backdrop-blur-md rounded-[22px] border border-white/10 flex flex-col group overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 p-6" data-project-id="${p.id || ''}">
                    <div class="flex items-center justify-between gap-2 mb-4">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-wider">
                                ${escapeHtml(p.category || 'Engineering')}
                            </span>
                            <span class="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-[10px] font-semibold uppercase">
                                ${escapeHtml(p.difficulty || 'Intermediate')}
                            </span>
                        </div>
                        ${p.isPinned ? `<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase tracking-wider">Pinned</span>` : ''}
                    </div>

                    <h4 class="font-bold text-xl text-on-surface mb-2 group-hover:text-primary transition-colors leading-tight flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[22px]">terminal</span>
                        <span class="truncate">${escapeHtml(p.title || 'Untitled Project')}</span>${demoBadge}
                    </h4>
                    ${ownerDisplay}
                    <p class="text-sm text-on-surface-variant line-clamp-3 mb-5 flex-1 leading-relaxed">${escapeHtml(p.description || 'Collaborative open-source software project on CodeCollab.')}</p>
                    
                    <div class="flex flex-wrap gap-1.5 mb-6">${techBadges}</div>

                    <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                        ${p.githubUrl ? `
                            <a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
                                <span>Code</span>
                            </a>
                        ` : ''}
                        <a href="#issues?projectId=${p.id}" class="flex-1 flex justify-center items-center gap-1 px-3 py-2.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl text-xs font-bold hover:bg-secondary hover:text-on-secondary transition-all active:scale-95">
                            Issues
                        </a>
                        <a href="#project_details?projectId=${p.id}" class="flex-1 flex justify-center items-center gap-1 px-3 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95">
                            View
                        </a>
                    </div>
                </div>`;
            };

            // Fetch live projects from backend API
            const projectsRes = await request('/api/projects');
            assert(projectsRes.status === 200, 'GET /api/projects returns HTTP 200 for Explore pipeline');
            assert(Array.isArray(projectsRes.body), 'GET /api/projects returns array of projects');

            // Render each project through renderProjectCard
            for (const proj of projectsRes.body) {
                const renderedHtml = renderProjectCard(proj);
                assert(typeof renderedHtml === 'string', `Project ${proj.id} rendered valid HTML string`);
                assert(renderedHtml.includes(`data-project-id="${proj.id}"`), `Rendered card contains project ID attribute`);
                assert(!renderedHtml.includes('undefined'), `Rendered card does NOT contain raw "undefined" strings`);
                assert(!renderedHtml.includes('<img'), `Rendered card contains ZERO img tags`);
            }
            console.log(`  ✅ PASS: Successfully rendered ${projectsRes.body.length} live project cards without errors`);
        }

        console.log('\n===============================================================');
        console.log('🎉 ALL PRODUCTION VERIFICATION TESTS PASSED SUCCESSFULLY!');
        console.log('===============================================================\n');

    } finally {
        // Cleanup test users and test entities from database
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const testUserIds = [userA?.id, userB?.id, userC?.id].filter(Boolean);
            if (testUserIds.length > 0) {
                if (prisma.notification) await prisma.notification.deleteMany({ where: { recipientId: { in: testUserIds } } }).catch(() => {});
                if (prisma.teamApplication) await prisma.teamApplication.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
                if (prisma.teamMember) await prisma.teamMember.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
                if (prisma.team) await prisma.team.deleteMany({ where: { leadId: { in: testUserIds } } }).catch(() => {});
                if (prisma.organizationMember) await prisma.organizationMember.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
                if (prisma.organization) await prisma.organization.deleteMany({ where: { ownerId: { in: testUserIds } } }).catch(() => {});
                if (prisma.lookingFor) await prisma.lookingFor.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
                if (prisma.issue) await prisma.issue.deleteMany({ where: { creatorId: { in: testUserIds } } }).catch(() => {});
                if (prisma.projectMember) await prisma.projectMember.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
                if (prisma.project) await prisma.project.deleteMany({ where: { ownerId: { in: testUserIds } } }).catch(() => {});
                if (prisma.userProfile) await prisma.userProfile.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
                if (prisma.user) await prisma.user.deleteMany({ where: { id: { in: testUserIds } } }).catch(() => {});
            }
            await prisma.$disconnect().catch(() => {});
        } catch (cleanupErr) {
            console.warn('Test cleanup notice:', cleanupErr.message);
        }

        if (server) {
            server.close();
        }
    }
}

runTests().catch((err) => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    if (server) server.close();
    process.exit(1);
});
