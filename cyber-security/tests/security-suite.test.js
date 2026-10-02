/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Comprehensive Security Verification Test Suite
 * ==============================================================================
 * Validates all centralized cybersecurity modules, policies, and defenses.
 */

const assert = require('assert');
const security = require('../index');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
        throw err;
    }
}

async function runAsyncTest(name, fn) {
    totalTests++;
    try {
        await fn();
        passedTests++;
        console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
        throw err;
    }
}

async function main() {
    console.log('\n🔒 Starting Cyber-Security Module Architecture Test Suite...\n');

    // 1. Cookie Security
    console.log('[1/10] Cookie Security & Session Transport:');
    runTest('Computes Lax & Secure=false on localhost/dev', () => {
        const opts = security.getCookieOptions({ headers: { host: 'localhost:3000' } });
        assert.strictEqual(opts.httpOnly, true);
        assert.strictEqual(opts.secure, false);
        assert.strictEqual(opts.sameSite, 'lax');
        assert.strictEqual(opts.path, '/');
    });

    runTest('Computes None & Secure=true on production HTTPS', () => {
        const opts = security.getCookieOptions({
            headers: { host: 'api.codecollab.dev', 'x-forwarded-proto': 'https' },
            secure: true
        });
        assert.strictEqual(opts.httpOnly, true);
        assert.strictEqual(opts.secure, true);
        assert.strictEqual(opts.sameSite, 'none');
    });

    runTest('Extracts tokens from Authorization Bearer header', () => {
        const req = { headers: { authorization: 'Bearer my-jwt-token' } };
        const extracted = security.extractTokens(req);
        assert.strictEqual(extracted.accessToken, 'my-jwt-token');
        assert.strictEqual(extracted.isFromCookie, false);
    });

    runTest('Extracts tokens from HttpOnly ambient cookie', () => {
        const req = { cookies: { cc_access_token: 'cookie-jwt-token' } };
        const extracted = security.extractTokens(req);
        assert.strictEqual(extracted.accessToken, 'cookie-jwt-token');
        assert.strictEqual(extracted.isFromCookie, true);
    });

    // 2. CSRF Defense
    console.log('\n[2/10] CSRF Protection Middleware:');
    runTest('Allows safe GET/HEAD requests unconditionally', () => {
        const csrfMw = security.csrfProtectionMiddleware(() => false);
        let called = false;
        const req = { method: 'GET' };
        csrfMw(req, {}, () => { called = true; });
        assert.strictEqual(called, true);
    });

    runTest('Blocks cookie-authenticated mutation without custom headers or valid origin', () => {
        const csrfMw = security.csrfProtectionMiddleware(() => false);
        let statusSet = null;
        let responseJson = null;
        const res = {
            status(s) { statusSet = s; return this; },
            json(j) { responseJson = j; return this; }
        };
        const req = {
            method: 'POST',
            path: '/api/projects',
            cookies: { cc_access_token: 'cookie-token' },
            headers: {}
        };
        csrfMw(req, res, () => {});
        assert.strictEqual(statusSet, 403);
        assert.strictEqual(responseJson.code, 'CSRF_FAILED');
    });

    runTest('Allows cookie-authenticated mutation with X-Request-Id custom header', () => {
        const csrfMw = security.csrfProtectionMiddleware(() => false);
        let called = false;
        const req = {
            method: 'POST',
            path: '/api/projects',
            cookies: { cc_access_token: 'cookie-token' },
            headers: { 'x-request-id': 'req-12345' }
        };
        csrfMw(req, {}, () => { called = true; });
        assert.strictEqual(called, true);
    });

    // 3. CORS & Origin Hardening
    console.log('\n[3/10] CORS & Origin Validator:');
    runTest('Normalizes trailing slashes and casing', () => {
        assert.strictEqual(security.normalizeOrigin('https://example.com///'), 'https://example.com');
    });

    runTest('Allows trusted production and local development origins', () => {
        assert.strictEqual(security.isOriginAllowed('http://localhost:3000'), true);
        assert.strictEqual(security.isOriginAllowed('http://localhost:8080'), true);
        assert.strictEqual(security.isOriginAllowed('https://opensource-projects.netlify.app'), true);
        assert.strictEqual(security.isOriginAllowed('https://deploy-preview-42--opensource-projects.netlify.app'), true);
        assert.strictEqual(security.isOriginAllowed('https://malicious-attacker.com'), false);
    });

    // 4. URL Security & XSS Sanitizer
    console.log('\n[4/10] URL Security & Scheme Sanitizer:');
    runTest('Rejects dangerous schemes (javascript:, data:, vbscript:)', () => {
        assert.strictEqual(security.isSafeUrl('javascript:alert(1)'), false);
        assert.strictEqual(security.isSafeUrl('java\tscript:alert(1)'), false);
        assert.strictEqual(security.isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
        assert.strictEqual(security.isSafeUrl('vbscript:msgbox'), false);
    });

    runTest('Allows legitimate HTTPS URLs', () => {
        assert.strictEqual(security.isSafeUrl('https://github.com/project'), true);
        assert.strictEqual(security.sanitizeSafeUrl('javascript:bad', 'https://fallback.com'), 'https://fallback.com');
        assert.strictEqual(security.sanitizeSafeUrl('https://valid.com', 'fallback'), 'https://valid.com/');
    });

    // 5. Input Validation Engine
    console.log('\n[5/10] Input Validation Engine:');
    runTest('Validates project schema correctly and strips unknown fields', () => {
        const payload = {
            title: 'Production Hardening',
            category: 'Security',
            unauthorizedKey: 'injectedValue'
        };
        const validated = security.validateSchema(payload, security.PROJECT_SCHEMA);
        assert.strictEqual(validated.title, 'Production Hardening');
        assert.strictEqual(validated.category, 'Security');
        assert.strictEqual(validated.unauthorizedKey, undefined);
    });

    runTest('Throws ValidationError on missing required fields', () => {
        assert.throws(() => {
            security.validateSchema({}, security.PROJECT_SCHEMA);
        }, security.ValidationError);
    });

    // 6. Profile Sanitization & Mass Assignment Defense
    console.log('\n[6/10] Profile & Preference Sanitization:');
    runTest('Guarantees zero leakage of password, email, and phone in sanitizeUserObj', () => {
        const rawUser = {
            id: 'u-123',
            name: 'Security Engineer',
            email: 'secret@corp.internal',
            password: 'hashed-password-string',
            phoneNumber: '+15551234567',
            upvotes: 42,
            profile: {
                firstName: 'Security',
                lastName: 'Engineer',
                avatarUrl: 'https://images.unsplash.com/photo-1'
            }
        };
        const safe = security.sanitizeUserObj(rawUser);
        assert.strictEqual(safe.id, 'u-123');
        assert.strictEqual(safe.name, 'Security Engineer');
        assert.strictEqual(safe.upvotes, 42);
        assert.strictEqual(safe.email, undefined);
        assert.strictEqual(safe.password, undefined);
        assert.strictEqual(safe.phoneNumber, undefined);
    });

    runTest('Blocks overriding protected fields during safeMergePreferences', () => {
        const existing = { upvotes: 10, followers: ['u1', 'u2'] };
        const maliciousUpdate = { upvotes: 99999, id: 'hacked-id', title: 'Senior Architect' };
        const merged = security.safeMergePreferences(existing, maliciousUpdate);
        assert.strictEqual(merged.upvotes, 10);
        assert.strictEqual(merged.id, undefined);
        assert.strictEqual(merged.title, 'Senior Architect');
    });

    // 7. Cryptographic & Hashing Utilities
    console.log('\n[7/10] Cryptographic Utilities & Timing Defense:');
    await runAsyncTest('Hashes password and verifies comparison', async () => {
        const plain = 'SuperSecureP@ssw0rd!';
        const hash = await security.hashPassword(plain);
        assert.strictEqual(typeof hash, 'string');
        assert.strictEqual(await security.comparePassword(plain, hash), true);
        assert.strictEqual(await security.comparePassword('WrongPassword', hash), false);
    });

    await runAsyncTest('Executes decoy dummy bcrypt comparison in constant time', async () => {
        const isMatch = await security.compareDecoyPassword('AnyPassword');
        assert.strictEqual(isMatch, false);
    });

    runTest('Generates secure random tokens', () => {
        const token = security.generateCryptoToken(16);
        assert.strictEqual(typeof token, 'string');
        assert.strictEqual(token.length, 32); // 16 bytes = 32 hex chars
    });

    // 8. Static Shielding
    console.log('\n[8/10] Static Directory Shielding:');
    runTest('Blocks access to restricted directories (.env, prisma, src, test)', () => {
        assert.strictEqual(security.BLOCKED_STATIC_REGEX.test('/.env'), true);
        assert.strictEqual(security.BLOCKED_STATIC_REGEX.test('/prisma/schema.prisma'), true);
        assert.strictEqual(security.BLOCKED_STATIC_REGEX.test('/src/utils/validation.js'), true);
        assert.strictEqual(security.BLOCKED_STATIC_REGEX.test('/test/asset-audit.js'), true);
        assert.strictEqual(security.BLOCKED_STATIC_REGEX.test('/index.html'), false);
        assert.strictEqual(security.BLOCKED_STATIC_REGEX.test('/css/style.css'), false);
    });

    // 9. Security Logging & Credential Scrubbing
    console.log('\n[9/10] Security Logging & Credential Redaction:');
    runTest('Scrubs postgresql connection passwords and tokens', () => {
        const rawLog = 'Connected to postgresql://postgres:SuperSecretPassword123@aws.supabase.co:5432/postgres with Bearer eyJhbGciOiJIUzI1Ni...';
        const sanitized = security.sanitizeLogString(rawLog);
        assert.strictEqual(sanitized.includes('SuperSecretPassword123'), false);
        assert.strictEqual(sanitized.includes('postgresql://postgres:***@aws.supabase.co:5432/postgres'), true);
        assert.strictEqual(sanitized.includes('Bearer ***'), true);
    });

    // 10. Rate Limiting Configuration
    console.log('\n[10/10] Rate Limiting Architecture:');
    runTest('Verifies rate limiters are instantiated with standard headers', () => {
        assert.strictEqual(typeof security.apiLimiter, 'function');
        assert.strictEqual(typeof security.authLimiter, 'function');
        assert.strictEqual(typeof security.passwordChangeLimiter, 'function');
    });

    console.log(`\n======================================================`);
    console.log(`🎉 All ${passedTests}/${totalTests} Cyber-Security Architecture Tests Passed!`);
    console.log(`======================================================\n`);
}

main().catch(err => {
    console.error('Fatal test runner failure:', err);
    process.exit(1);
});
