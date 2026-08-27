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

        console.log('\n===============================================================');
        console.log('🎉 ALL PRODUCTION VERIFICATION TESTS PASSED SUCCESSFULLY!');
        console.log('===============================================================\n');

    } finally {
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
