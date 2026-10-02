const http = require('http');

function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let json = null;
                try { json = JSON.parse(data); } catch (_) {}
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data,
                    json
                });
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runAudit() {
    console.log('====================================================');
    console.log('🔍 Comprehensive Security & Network Response Audit');
    console.log('====================================================');

    const BASE_URL = 'http://localhost:3000';
    const results = [];

    async function check(name, fn) {
        try {
            const res = await fn();
            results.push({ name, ...res });
            console.log(`[${res.pass ? 'PASS' : 'FAIL'}] ${name}: status=${res.status}, msg=${res.message || 'OK'}`);
        } catch (err) {
            results.push({ name, pass: false, status: 'ERROR', message: err.message });
            console.log(`[FAIL] ${name}: ERROR ${err.message}`);
        }
    }

    // 1. Static Assets & Root
    await check('Root Homepage (GET /)', async () => {
        const r = await request(`${BASE_URL}/`);
        return { pass: r.status === 200, status: r.status };
    });

    await check('Favicon ICO (GET /favicon.ico)', async () => {
        const r = await request(`${BASE_URL}/favicon.ico`);
        return { pass: r.status === 200, status: r.status };
    });

    await check('Favicon SVG (GET /favicon.svg)', async () => {
        const r = await request(`${BASE_URL}/favicon.svg`);
        return { pass: r.status === 200, status: r.status };
    });

    // 2. Security Headers & Information Leakage
    await check('Security Headers on API (GET /api/health)', async () => {
        const r = await request(`${BASE_URL}/api/health`);
        const h = r.headers;
        const hasNoPoweredBy = !h['x-powered-by'];
        const hasRequestId = !!h['x-request-id'];
        const hasCSP = !!h['content-security-policy'];
        const pass = r.status === 200 && hasNoPoweredBy && hasRequestId && hasCSP;
        return { pass, status: r.status, message: `x-powered-by=${h['x-powered-by'] || 'none'}, X-Request-Id=${h['x-request-id']}, CSP=${!!hasCSP}` };
    });

    // 3. Static Directory Shielding
    await check('Shielded Directory /codecollab data/ (GET /codecollab%20data/users.json)', async () => {
        const r = await request(`${BASE_URL}/codecollab%20data/users.json`);
        return { pass: r.status === 403, status: r.status };
    });

    await check('Shielded File /.env (GET /.env)', async () => {
        const r = await request(`${BASE_URL}/.env`);
        return { pass: r.status === 403, status: r.status };
    });

    await check('Shielded Directory /prisma/ (GET /prisma/schema.prisma)', async () => {
        const r = await request(`${BASE_URL}/prisma/schema.prisma`);
        return { pass: r.status === 403, status: r.status };
    });

    // 4. Undefined API Routes (Must be 404 JSON, not HTML)
    await check('Undefined API Route (GET /api/nonexistent-endpoint-xyz)', async () => {
        const r = await request(`${BASE_URL}/api/nonexistent-endpoint-xyz`);
        const isJson = r.headers['content-type'] && r.headers['content-type'].includes('application/json');
        return { pass: r.status === 404 && isJson, status: r.status, message: `content-type=${r.headers['content-type']}` };
    });

    // 5. Auth Flow Validations & Errors
    await check('Unauthenticated /api/auth/me (GET /api/auth/me)', async () => {
        const r = await request(`${BASE_URL}/api/auth/me`);
        return { pass: r.status === 401, status: r.status, message: r.json?.error };
    });

    await check('Login with missing body (POST /api/auth/login)', async () => {
        const r = await request(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {}
        });
        return { pass: r.status === 400, status: r.status, message: r.json?.error };
    });

    await check('Login with invalid credentials (POST /api/auth/login)', async () => {
        const r = await request(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { email: 'fakeuser@nonexistent.domain', password: 'WrongPassword123!' }
        });
        return { pass: r.status === 401, status: r.status, message: r.json?.error };
    });

    await check('Malformed JSON payload (POST /api/auth/login)', async () => {
        const r = await request(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{ broken json'
        });
        return { pass: r.status === 400, status: r.status, message: r.json?.error };
    });

    // 6. Resource Not Found Checks (404s)
    await check('Nonexistent User (GET /api/users/nonexistent_usr_9999999)', async () => {
        const r = await request(`${BASE_URL}/api/users/nonexistent_usr_9999999`);
        return { pass: r.status === 404, status: r.status, message: r.json?.error };
    });

    await check('Nonexistent Project (GET /api/projects/nonexistent_proj_9999999)', async () => {
        const r = await request(`${BASE_URL}/api/projects/nonexistent_proj_9999999`);
        return { pass: r.status === 404, status: r.status, message: r.json?.error };
    });

    // 7. Protected Route Authorization Checks (401/403)
    await check('Unauthenticated Project Creation (POST /api/projects)', async () => {
        const r = await request(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { title: 'Unauthorized Project' }
        });
        return { pass: r.status === 401, status: r.status, message: r.json?.error };
    });

    await check('Unauthenticated Notifications Access (GET /api/notifications)', async () => {
        const r = await request(`${BASE_URL}/api/notifications`);
        return { pass: r.status === 401, status: r.status, message: r.json?.error };
    });

    // 8. Public Data Endpoints (Must return 200 with authentic data)
    await check('Public Projects Feed (GET /api/projects)', async () => {
        const r = await request(`${BASE_URL}/api/projects`);
        const isArr = Array.isArray(r.json);
        return { pass: r.status === 200 && isArr && r.json.length > 0, status: r.status, message: `Count: ${r.json?.length}` };
    });

    await check('Public Developers Directory (GET /api/users)', async () => {
        const r = await request(`${BASE_URL}/api/users`);
        const isArr = Array.isArray(r.json);
        return { pass: r.status === 200 && isArr && r.json.length > 0, status: r.status, message: `Count: ${r.json?.length}` };
    });

    await check('Public Community Stats (GET /api/stats)', async () => {
        const r = await request(`${BASE_URL}/api/stats`);
        return { pass: r.status === 200 && !!r.json, status: r.status };
    });

    await check('Public Teams List (GET /api/teams)', async () => {
        const r = await request(`${BASE_URL}/api/teams`);
        const isArr = Array.isArray(r.json);
        return { pass: r.status === 200 && isArr && r.json.length > 0, status: r.status, message: `Count: ${r.json?.length}` };
    });

    await check('Public Looking-For Feed (GET /api/community/looking-for)', async () => {
        const r = await request(`${BASE_URL}/api/community/looking-for`);
        const isArr = Array.isArray(r.json);
        return { pass: r.status === 200 && isArr && r.json.length > 0, status: r.status, message: `Count: ${r.json?.length}` };
    });

    // 9. Issues Endpoint Guest Access & Filtering
    await check('Issues Endpoint Guest Access (GET /api/issues)', async () => {
        const r = await request(`${BASE_URL}/api/issues`);
        return { pass: r.status === 200, status: r.status, message: `status=${r.status} (${JSON.stringify(r.json)})` };
    });

    console.log('====================================================');
    const passed = results.filter(r => r.pass).length;
    console.log(`Audit Summary: ${passed} / ${results.length} checks passed`);
    console.log('====================================================');
}

runAudit();
