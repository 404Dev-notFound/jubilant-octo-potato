const http = require('http');

function check(url) {
    return new Promise((resolve) => {
        const parsed = new URL(url);
        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, headers: res.headers });
            });
        });
        req.on('error', (e) => resolve({ status: 'ERR', error: e.message }));
        req.end();
    });
}

async function testPort8080() {
    console.log('Testing Port 8080 (Dev Frontend Server)...');
    const urls = [
        'http://localhost:8080/',
        'http://localhost:8080/favicon.ico',
        'http://localhost:8080/favicon.svg',
        'http://localhost:8080/css/tailwind.prod.css',
        'http://localhost:8080/js/app.js',
        'http://localhost:8080/views/home.js',
        'http://localhost:8080/health',
        'http://localhost:8080/api/projects'
    ];

    let allPass = true;
    for (const u of urls) {
        const r = await check(u);
        const ok = r.status === 200;
        if (!ok) allPass = false;
        console.log(`[${ok ? 'PASS' : 'FAIL'}] ${r.status} | ${u}`);
    }
    console.log(`Port 8080 Verification: ${allPass ? 'ALL PASSED' : 'SOME FAILED'}`);
    process.exit(allPass ? 0 : 1);
}

testPort8080();
