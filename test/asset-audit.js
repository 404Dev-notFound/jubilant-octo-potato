const http = require('http');

function fetch(url, options = {}) {
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
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function testStaticAssets() {
    console.log('--- Testing Root and Static Assets ---');
    const urls = [
        'http://localhost:3000/',
        'http://localhost:3000/favicon.ico',
        'http://localhost:3000/favicon.svg',
        'http://localhost:3000/css/tailwind.prod.css',
        'http://localhost:3000/css/design-system.css',
        'http://localhost:3000/css/styles.css',
        'http://localhost:3000/js/env.js',
        'http://localhost:3000/js/components.js',
        'http://localhost:3000/js/components/onboarding_guidance.js',
        'http://localhost:3000/js/app.js',
        'http://localhost:3000/js/session.js',
        'http://localhost:3000/js/command_palette.js',
        'http://localhost:3000/js/nebula.js',
        'http://localhost:3000/health',
        'http://localhost:3000/api/health'
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url);
            console.log(`${res.status} | ${url}`);
        } catch (err) {
            console.error(`ERROR | ${url}:`, err.message);
        }
    }
}

testStaticAssets();
