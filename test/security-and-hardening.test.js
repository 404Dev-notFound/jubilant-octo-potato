/**
 * Security, Integrity & Reliability Hardening Test Suite
 * Tests Phase 2, 3, 4, 5, 7, 8, 11, 13, 19 fixes directly against server and utilities.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Utilities under test
const { safeMergePreferences, safeMergeUserRecord, EDITABLE_PREFERENCE_FIELDS, sanitizeLinkMap } = require('../src/utils/preferenceMerge');
const { validateUrl, isSafeUrl, sanitizeSafeUrl } = require('../src/utils/urlSecurity');
const { readJson, modifyJson, writeJson, JsonCorruptionError } = require('../src/storage/jsonStorage');
const { parsePagination, paginateArray, attachPaginationHeaders } = require('../src/utils/pagination');
const { validateSchema, ValidationError, PROJECT_SCHEMA, ISSUE_SCHEMA, CHANGE_PASSWORD_SCHEMA, UPDATE_PROFILE_SCHEMA } = require('../src/utils/validation');
const { verifyBuild } = require('../scripts/verify-build');

test('Phase 2.7 & Security: URL Validation & Sanitization', async (t) => {
    await t.test('accepts legitimate HTTPS and HTTP URLs', () => {
        assert.equal(isSafeUrl('https://github.com/404Dev-notFound/project'), true);
        assert.equal(isSafeUrl('http://localhost:3000'), true);
        assert.equal(isSafeUrl('https://example.com/demo?foo=bar#section'), true);
    });

    await t.test('rejects dangerous javascript: schemes and variations', () => {
        assert.equal(isSafeUrl('javascript:alert(1)'), false);
        assert.equal(isSafeUrl('JAVASCRIPT:alert(document.cookie)'), false);
        assert.equal(isSafeUrl('  javascript:alert(1)  '), false);
        assert.equal(isSafeUrl('java\0script:alert(1)'), false);
        assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
        assert.equal(isSafeUrl('vbscript:msgbox(1)'), false);
        assert.equal(isSafeUrl('file:///etc/passwd'), false);
    });

    await t.test('sanitizes unsafe URLs to empty string and normalizes safe URLs', () => {
        assert.equal(sanitizeSafeUrl('javascript:alert(1)'), '');
        assert.equal(sanitizeSafeUrl('https://valid.com/'), 'https://valid.com/');
    });
});

test('Phase 3.1 & Security: Profile Preferences Safe Merge (Protects Social Data)', async (t) => {
    await t.test('preserves followers, upvotes, and upvoters during preference updates', () => {
        const existingRecord = {
            id: 'user_123',
            name: 'Original Developer',
            email: 'dev@example.com',
            theme: 'dark',
            bio: 'Original bio',
            followers: ['user_456', 'user_789'],
            upvotes: 42,
            upvoters: ['user_456'],
            role: 'admin',
            internalId: 'secret_999'
        };

        const maliciousPayload = {
            bio: 'Updated bio by user',
            theme: 'light',
            followers: ['fake_hacker'],
            upvotes: 999999,
            upvoters: ['fake_hacker'],
            role: 'superadmin',
            internalId: 'overwritten'
        };

        const merged = safeMergeUserRecord(existingRecord, maliciousPayload);

        // Allowlisted fields should update
        assert.equal(merged.bio, 'Updated bio by user');
        assert.equal(merged.theme, 'light');

        // Protected social and permission fields MUST remain untouched
        assert.deepEqual(merged.followers, ['user_456', 'user_789']);
        assert.equal(merged.upvotes, 42);
        assert.deepEqual(merged.upvoters, ['user_456']);
        assert.equal(merged.role, 'admin');
    });
});

test('Phase 3.2: Atomic JSON Storage & Concurrency', async (t) => {
    const testFile = path.join(__dirname, 'temp_concurrency_test.json');

    // Clean up if existing
    try { fs.unlinkSync(testFile); } catch {}

    try {
        await writeJson(testFile, { count: 0 });

        // Simulate 20 concurrent increments
        const concurrentTasks = Array.from({ length: 20 }).map(() => {
            return modifyJson(testFile, (data) => {
                data.count += 1;
                return data;
            });
        });

        await Promise.all(concurrentTasks);

        const finalData = await readJson(testFile);
        assert.equal(finalData.count, 20, 'All 20 concurrent updates must serialize cleanly without race conditions');

        // Test corruption detection
        fs.writeFileSync(testFile, '{ broken_json: [}');
        await assert.rejects(
            async () => { await readJson(testFile); },
            JsonCorruptionError,
            'Corrupted JSON must explicitly throw JsonCorruptionError instead of silently returning empty object'
        );
    } finally {
        try { fs.unlinkSync(testFile); } catch {}
    }
});

test('Phase 5 & 2.6: Centralized Validation & Mass Assignment Defense', async (t) => {
    await t.test('rejects malicious or protected fields on project update', () => {
        const payloadWithProtectedFields = {
            title: 'Valid Project Title',
            description: 'A valid project description for testing',
            id: 'forced_malicious_id',
            ownerId: 'attacker_id',
            createdAt: '1970-01-01',
            isDeleted: false
        };

        const validated = validateSchema(payloadWithProtectedFields, PROJECT_SCHEMA, { isUpdate: true, stripUnknown: true });

        // id, ownerId, createdAt must NOT be present in sanitized value
        assert.equal(validated.id, undefined);
        assert.equal(validated.ownerId, undefined);
        assert.equal(validated.createdAt, undefined);
        assert.equal(validated.title, 'Valid Project Title');
    });

    await t.test('rejects invalid password change schemas', () => {
        const shortPassword = {
            currentPassword: 'validPassword123',
            newPassword: 'short'
        };
        assert.throws(
            () => validateSchema(shortPassword, CHANGE_PASSWORD_SCHEMA),
            ValidationError,
            'Should throw ValidationError for passwords shorter than 6 characters'
        );
    });
});

test('Phase 7: Centralized Pagination & Clamping', async (t) => {
    await t.test('clamps negative, zero, or oversized limits', () => {
        const p1 = parsePagination({ page: -5, limit: 1000 });
        assert.equal(p1.page, 1);
        assert.equal(p1.limit, 100, 'Limit must be clamped to MAX_LIMIT (100)');

        const p2 = parsePagination({ page: 'abc', limit: 'invalid' });
        assert.equal(p2.page, 1);
        assert.equal(p2.limit, 50, 'Invalid parameters must fallback to default limit (50)');
    });

    await t.test('slices arrays accurately with both signature variants', () => {
        const sampleList = Array.from({ length: 45 }, (_, i) => ({ id: i + 1 }));

        const p = parsePagination({ page: 2, limit: 10 });
        const result = paginateArray(sampleList, p);
        assert.equal(result.data.length, 10);
        assert.equal(result.data[0].id, 11);
        assert.equal(result.data[9].id, 20);

        // Direct scalar signature
        const resultScalars = paginateArray(sampleList, 3, 10);
        assert.equal(resultScalars.data.length, 10);
        assert.equal(resultScalars.data[0].id, 21);
    });
});

test('Phase 19: Build Verification Check', () => {
    const result = verifyBuild({ exitOnError: false, silent: true });
    assert.equal(result.isOk, true, 'Build verification must pass for production CSS and core assets');
    assert.equal(result.issues.length, 0);
});

test('Section 5.A, 6.A, 7.A: Profile Schema, Link Sanitization & Preference Allowlist', async (t) => {
    // 1. EDITABLE_PREFERENCE_FIELDS
    assert.deepEqual(
        EDITABLE_PREFERENCE_FIELDS.slice(0, 8),
        ['title', 'bio', 'skills', 'verifiedSkills', 'availability', 'lookingFor', 'socialLinks', 'location']
    );

    // 2. sanitizeLinkMap
    const maliciousLinks = {
        website: 'javascript:alert(document.cookie)',
        github: 'https://github.com/developer',
        twitter: 'data:text/html,<script>alert(1)</script>',
        linkedin: 'https://linkedin.com/in/developer',
        badScheme: 'file:///etc/passwd'
    };
    const cleanLinks = sanitizeLinkMap(maliciousLinks);
    assert.equal(cleanLinks.website, undefined, 'Dangerous javascript: link must be dropped');
    assert.equal(cleanLinks.twitter, undefined, 'Dangerous data: link must be dropped');
    assert.equal(cleanLinks.badScheme, undefined, 'Dangerous file: link must be dropped');
    assert.equal(cleanLinks.github, 'https://github.com/developer');
    assert.equal(cleanLinks.linkedin, 'https://linkedin.com/in/developer');

    // 3. UPDATE_PROFILE_SCHEMA
    const payload = {
        name: '  Valid Name  ',
        title: 'Senior Engineer',
        skills: 'JavaScript, TypeScript, React, Docker',
        avatarUrl: 'https://images.unsplash.com/photo-123',
        upvotes: 999999, // Protected field, should be stripped
        role: 'admin'     // Protected field, should be stripped
    };
    const validated = validateSchema(payload, UPDATE_PROFILE_SCHEMA, { isUpdate: true, stripUnknown: true });
    assert.equal(validated.name, 'Valid Name');
    assert.equal(validated.title, 'Senior Engineer');
    assert.deepEqual(validated.skills, ['JavaScript', 'TypeScript', 'React', 'Docker']);
    assert.equal(validated.upvotes, undefined, 'Protected upvotes must be stripped by schema validation');
    assert.equal(validated.role, undefined, 'Protected role must be stripped by schema validation');
});

test('Section 10.A & 10.B: Static Directory Shielding & Clickjacking CSP', async (t) => {
    const http = require('http');
    const app = require('../server.js');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    const makeReq = (urlPath) => {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port,
                path: urlPath,
                method: 'GET'
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
            });
            req.on('error', reject);
            req.end();
        });
    };

    try {
        const resData = await makeReq('/codecollab%20data/users.json');
        assert.equal(resData.status, 403, 'Direct access to datastore files must return 403 Forbidden');

        const resPrisma = await makeReq('/prisma/schema.prisma');
        assert.equal(resPrisma.status, 403, 'Direct access to schema must return 403 Forbidden');

        const resEnv = await makeReq('/.env');
        assert.equal(resEnv.status, 403, 'Direct access to .env must return 403 Forbidden');

        const resHealth = await makeReq('/health');
        assert.equal(resHealth.status, 200);
        const csp = resHealth.headers['content-security-policy'] || '';
        assert.match(csp, /frame-ancestors 'none'/, 'CSP must include frame-ancestors none for clickjacking defense');
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

test('Section 3.A: Authentication Middleware Token Differentiation', async (t) => {
    const http = require('http');
    const app = require('../server.js');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
        const makeReq = (headers) => {
            return new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: '127.0.0.1',
                    port,
                    path: '/api/users/profile',
                    method: 'GET',
                    headers
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                        catch { resolve({ status: res.statusCode, body: data }); }
                    });
                });
                req.on('error', reject);
                req.end();
            });
        };

        // Missing token
        const resNoToken = await makeReq({});
        assert.equal(resNoToken.status, 401);

        // Tampered token
        const resTampered = await makeReq({ 'Authorization': 'Bearer invalid.tampered.token' });
        assert.equal(resTampered.status, 401);
        assert.equal(resTampered.body.code, 'TOKEN_INVALID', 'Tampered token must return code TOKEN_INVALID');
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

test('Section 11.A: Coarse IP & User-Agent Masking', async (t) => {
    const { coarseIp, describeClient } = await import('../js/views/security.js');
    assert.equal(coarseIp('192.168.1.150'), '192.168.1.x');
    assert.equal(coarseIp('10.0.0.1'), '10.0.0.x');
    assert.equal(coarseIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), '2001:0db8:85a3:xxxx');

    assert.equal(describeClient('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'), 'Google Chrome on macOS');
    assert.equal(describeClient('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'), 'Mozilla Firefox on Windows');
    assert.equal(describeClient('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'), 'Apple Safari on iOS');
});

test('Phase 20: Cookie-Based Authentication, CSRF Defense & Session Restore', async (t) => {
    const http = require('http');
    const app = require('../server.js');
    const { getCookieOptions } = require('../src/utils/cookieSecurity');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    const makeRequest = (options, postData = null) => {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port,
                path: options.path,
                method: options.method || 'GET',
                headers: options.headers || {}
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    let parsed;
                    try { parsed = JSON.parse(data); } catch { parsed = data; }
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                });
            });
            req.on('error', reject);
            if (postData) {
                req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
            }
            req.end();
        });
    };

    try {
        await t.test('Cookie security configuration logic', () => {
            // Localhost / plain HTTP
            const localOpts = getCookieOptions({ headers: { origin: 'http://localhost:3000' } });
            assert.equal(localOpts.httpOnly, true);
            assert.equal(localOpts.path, '/');
            assert.equal(localOpts.sameSite, 'lax');
            assert.equal(localOpts.secure, false);

            // Cross-site / HTTPS / Production
            const prodOpts = getCookieOptions({
                secure: true,
                headers: { origin: 'https://opensource-projects.netlify.app' }
            });
            assert.equal(prodOpts.httpOnly, true);
            assert.equal(prodOpts.secure, true);
            assert.equal(prodOpts.sameSite, 'none');
        });

        const testEmail = `cookie_user_${Date.now()}@example.com`;
        let authCookieHeader = '';
        let accessTokenVal = '';

        await t.test('POST /api/auth/signup sets HttpOnly auth cookies', async () => {
            const res = await makeRequest({
                path: '/api/auth/signup',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, {
                name: 'Cookie Test Developer',
                email: testEmail,
                password: 'password123',
                mobileNumber: '+1234567890'
            });

            assert.equal(res.status, 201);
            assert.ok(res.body.token);

            const setCookies = res.headers['set-cookie'];
            assert.ok(Array.isArray(setCookies) && setCookies.length > 0, 'Set-Cookie headers must be issued');

            const hasAccessTokenCookie = setCookies.some(c => c.includes('cc_access_token=') && c.includes('HttpOnly'));
            const hasRefreshTokenCookie = setCookies.some(c => c.includes('cc_refresh_token=') && c.includes('HttpOnly'));
            assert.ok(hasAccessTokenCookie, 'cc_access_token must be set as HttpOnly');
            assert.ok(hasRefreshTokenCookie, 'cc_refresh_token must be set as HttpOnly');

            // Save cookies for authenticated requests
            authCookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');
            const tokenMatch = authCookieHeader.match(/cc_access_token=([^;]+)/);
            if (tokenMatch) accessTokenVal = tokenMatch[1];
        });

        await t.test('GET /api/auth/me restores session using ambient cookie', async () => {
            const res = await makeRequest({
                path: '/api/auth/me',
                method: 'GET',
                headers: { 'Cookie': authCookieHeader }
            });

            assert.equal(res.status, 200);
            assert.equal(res.body.authenticated, true);
            assert.equal(res.body.user.email, testEmail);
            assert.equal(res.body.user.name, 'Cookie Test Developer');
        });

        await t.test('Protected routes succeed with ambient cookie auth without Bearer header', async () => {
            const res = await makeRequest({
                path: '/api/users/profile',
                method: 'GET',
                headers: { 'Cookie': authCookieHeader }
            });

            assert.equal(res.status, 200);
            assert.equal(res.body.email, testEmail);
        });

        await t.test('CSRF protection blocks cookie-authenticated mutating requests without custom header or origin', async () => {
            const res = await makeRequest({
                path: '/api/users/profile',
                method: 'PUT',
                headers: {
                    'Cookie': authCookieHeader,
                    'Content-Type': 'application/json'
                    // Notice: No X-Requested-With, No X-Request-Id, No Origin
                }
            }, { bio: 'CSRF Attack Attempt' });

            assert.equal(res.status, 403, 'Cookie-authenticated PUT without custom header/origin must be rejected');
            assert.equal(res.body.code, 'CSRF_FAILED');
        });

        await t.test('CSRF protection allows cookie-authenticated mutating requests with X-Requested-With', async () => {
            const res = await makeRequest({
                path: '/api/users/profile',
                method: 'PUT',
                headers: {
                    'Cookie': authCookieHeader,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }, { bio: 'Legitimate Cookie Authenticated Update' });

            assert.equal(res.status, 200, 'Legitimate request with X-Requested-With must be permitted');
            assert.equal(res.body.profile.bio, 'Legitimate Cookie Authenticated Update');
        });

        await t.test('POST /api/auth/logout clears auth cookies with past expiration', async () => {
            const res = await makeRequest({
                path: '/api/auth/logout',
                method: 'POST',
                headers: {
                    'Cookie': authCookieHeader,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }, {});

            assert.equal(res.status, 200);
            const clearCookies = res.headers['set-cookie'];
            assert.ok(Array.isArray(clearCookies) && clearCookies.length > 0);
            const hasExpiredAccessToken = clearCookies.some(c => c.includes('cc_access_token=;') || c.includes('Expires=Thu, 01 Jan 1970'));
            assert.ok(hasExpiredAccessToken, 'cc_access_token cookie must be cleared on logout');
        });

        // ----------------------------------------------------------------------
        // Phase 21: Integration Layers Verification (Simple, API, Third-Party)
        // ----------------------------------------------------------------------
        await t.test('Phase 21: Simple Integration - NotificationService atomic operations & ownership isolation', async () => {
            const { NotificationService } = require('../src/services/notificationService');
            const notifService = new NotificationService(null, async () => false);

            const userA = `user_a_${Date.now()}`;
            const userB = `user_b_${Date.now()}`;

            // Create notification for User A
            const created = await notifService.createNotification({
                userId: userA,
                actorId: userB,
                type: 'COLLAB_INVITE',
                title: 'New Team Invitation',
                message: 'User B invited you to join Team Alpha'
            });

            assert.ok(created.id, 'Notification must receive generated ID');
            assert.equal(created.userId, userA);
            assert.equal(created.read, false);

            // User A lists notifications
            const userANotifs = await notifService.getUserNotifications(userA);
            assert.ok(userANotifs.some(n => n.id === created.id), 'User A notifications must include created item');

            // User B cannot see User A notifications (isolation)
            const userBNotifs = await notifService.getUserNotifications(userB);
            assert.ok(!userBNotifs.some(n => n.id === created.id), 'User B must not see User A notification');

            // User B cannot mark User A notification as read (authorization check)
            const unauthorizedMark = await notifService.markAsRead(created.id, userB);
            assert.equal(unauthorizedMark.status, 403, 'Non-owner mark as read must be 403');

            // User A marks as read
            const authorizedMark = await notifService.markAsRead(created.id, userA);
            assert.equal(authorizedMark.status, 200, 'Owner mark as read must be 200');
            assert.equal(authorizedMark.notification.read, true);

            // User A deletes notification
            const deleteRes = await notifService.deleteNotification(created.id, userA);
            assert.equal(deleteRes.status, 200);

            const remaining = await notifService.getUserNotifications(userA);
            assert.ok(!remaining.some(n => n.id === created.id), 'Deleted notification must no longer exist');
        });

        await t.test('Phase 21: API Integration - Notifications REST endpoints with cookie authentication', async () => {
            // First get unread count
            const unreadRes = await makeRequest({
                path: '/api/notifications/unread',
                method: 'GET',
                headers: { 'Cookie': authCookieHeader }
            });
            assert.equal(unreadRes.status, 200);
            assert.ok('count' in unreadRes.body);
            assert.ok(Array.isArray(unreadRes.body.notifications));

            // Mark all read
            const markAllRes = await makeRequest({
                path: '/api/notifications/read-all',
                method: 'POST',
                headers: {
                    'Cookie': authCookieHeader,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }, {});
            assert.equal(markAllRes.status, 200);
            assert.equal(markAllRes.body.success, true);
        });

        await t.test('Phase 21: Third-Party Integration - Google & GitHub OAuth validation and fail-fast resilience', async () => {
            // 1. Google OAuth: empty credential must fail schema validation (400)
            const emptyGoogleRes = await makeRequest({
                path: '/api/auth/google',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, {});
            assert.equal(emptyGoogleRes.status, 400, 'Empty Google credential must be rejected with 400');

            // 2. Google OAuth: invalid token fails gracefully (401 or 503) without leaking server internals
            const invalidGoogleRes = await makeRequest({
                path: '/api/auth/google',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { credential: 'invalid_dummy_google_jwt_token' });
            assert.ok([401, 503].includes(invalidGoogleRes.status), 'Invalid Google token must return 401 or 503');
            assert.ok(!JSON.stringify(invalidGoogleRes.body).includes('password'), 'Response must never leak secrets');

            // 3. GitHub OAuth URL endpoint responds with valid JSON
            const githubUrlRes = await makeRequest({
                path: '/api/auth/github/url',
                method: 'GET'
            });
            assert.ok([200, 503].includes(githubUrlRes.status), 'GitHub auth URL must return 200 (if configured) or 503');

            // 4. GitHub OAuth code exchange: missing code fails validation (400)
            const emptyGithubRes = await makeRequest({
                path: '/api/auth/github',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, {});
            assert.equal(emptyGithubRes.status, 400, 'Empty GitHub code must be rejected with 400');

            // 5. GitHub OAuth code exchange: invalid code fails gracefully (401 or 503)
            const invalidGithubRes = await makeRequest({
                path: '/api/auth/github',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { code: 'invalid_github_temp_code' });
            assert.ok([401, 502, 503, 504].includes(invalidGithubRes.status), 'Invalid GitHub code must fail gracefully');
            assert.ok(!JSON.stringify(invalidGithubRes.body).includes('password'), 'Response must never leak credentials');
        });
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

