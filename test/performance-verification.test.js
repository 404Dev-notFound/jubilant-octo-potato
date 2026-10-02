/*
 * ==============================================================================
 * CodeCollab Performance & Full-Stack Optimization Verification Test Suite
 * ==============================================================================
 * Validates:
 * 1. Server-Timing and X-Response-Time headers in API responses
 * 2. High-performance native zlib gzip compression for JSON payloads > 1KB
 * 3. ETag generation and 304 Not Modified conditional caching
 * 4. Client-side caching isolation (sensitive endpoints never cached)
 */

const assert = require('assert');
const http = require('http');

function get(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path,
            method: 'GET',
            headers
        }, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(chunks)
                });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    console.log('\n⚡ Running Performance & Full-Stack Optimization Tests...\n');

    // 1. Server-Timing & X-Response-Time Header Verification
    console.log('[1/4] Server-Timing & X-Response-Time Observability:');
    const res1 = await get('/api/stats');
    assert.strictEqual(res1.status, 200);
    assert.ok(res1.headers['server-timing'], 'Server-Timing header must be present');
    assert.ok(res1.headers['server-timing'].includes('total;dur='), 'Server-Timing should contain total;dur=');
    assert.ok(res1.headers['x-response-time'], 'X-Response-Time header must be present');
    console.log(`  ✅ [PASS] Server-Timing: ${res1.headers['server-timing']}`);
    console.log(`  ✅ [PASS] X-Response-Time: ${res1.headers['x-response-time']}`);

    // 2. Gzip Response Compression
    console.log('\n[2/4] Gzip Compression on Large Payloads (> 1KB):');
    const resGzip = await get('/api/projects', { 'Accept-Encoding': 'gzip' });
    assert.strictEqual(resGzip.status, 200);
    assert.strictEqual(resGzip.headers['content-encoding'], 'gzip', 'Large JSON feed must be gzip compressed');
    console.log(`  ✅ [PASS] Content-Encoding: gzip (Compressed bytes: ${resGzip.body.length})`);

    // 3. ETag Generation and 304 Not Modified Validation
    console.log('\n[3/4] ETag & Conditional 304 Not Modified Caching:');
    const etag = res1.headers['etag'];
    assert.ok(etag, 'ETag must be returned for public API endpoint');
    console.log(`  ✅ [PASS] ETag returned: ${etag}`);

    const res304 = await get('/api/stats', { 'If-None-Match': etag });
    assert.strictEqual(res304.status, 304, 'Server should respond with 304 Not Modified when ETag matches');
    assert.strictEqual(res304.body.length, 0, '304 response body must be 0 bytes for maximum bandwidth savings');
    console.log(`  ✅ [PASS] 304 Not Modified received (0 body payload)`);

    // 4. Cache-Control Header Isolation
    console.log('\n[4/4] Cache-Control Strict Security vs Public Performance:');
    assert.ok(res1.headers['cache-control'].includes('public'), 'Public catalog endpoint should have public Cache-Control');

    const resAuth = await get('/api/auth/me');
    assert.strictEqual(resAuth.status, 401);
    assert.ok(resAuth.headers['cache-control'].includes('no-store'), 'Auth endpoint must have private no-store Cache-Control');
    console.log(`  ✅ [PASS] Public endpoint Cache-Control: ${res1.headers['cache-control']}`);
    console.log(`  ✅ [PASS] Auth endpoint Cache-Control: ${resAuth.headers['cache-control']}`);

    console.log('\n======================================================');
    console.log('🎉 All Performance & Optimization Checks Passed!');
    console.log('======================================================\n');
}

run().catch(err => {
    console.error('Performance verification failed:', err);
    process.exit(1);
});
