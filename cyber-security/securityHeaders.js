/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Security Headers & Performance Middleware
 * ==============================================================================
 * Implements strict Content Security Policy (CSP), Clickjacking defense,
 * Cross-Origin Resource Policy (CORP), static filesystem shielding,
 * intelligent HTTP caching policies (private vs ETag conditional validation),
 * high-performance native zlib response compression, and Server-Timing observability.
 */

const helmet = require('helmet');
const zlib = require('zlib');

/**
 * Generates Helmet middleware with production security policies.
 */
function createHelmetMiddleware() {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'sha256-eGFYqAHm7QB8cassdFBbBxhusmh76P1pfh3ymxPZOUw='",
                    "https://unpkg.com",
                    "https://accounts.google.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for CSS custom properties and dynamic theme engine
                    "https://fonts.googleapis.com"
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: [
                    "'self'",
                    "https://jubilant-octo-potato-production.up.railway.app",
                    "https://opensource-projects.netlify.app",
                    "https://*.supabase.co",
                    "https://unpkg.com",
                    "https://accounts.google.com",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:8080",
                    "http://127.0.0.1:8080"
                ],
                frameSrc: ["'self'", "https://accounts.google.com"],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: false
    });
}

/**
 * Static Directory Shielding Middleware
 * Strictly blocks direct HTTP access to datastore, schema, backend code, and config.
 */
const BLOCKED_STATIC_REGEX = /^\/(codecollab\s+data|prisma|scripts|test|\.env|\.git|src)(\/|$)/i;

function staticShieldMiddleware(req, res, next) {
    let decodedPath = req.path;
    try {
        decodedPath = decodeURIComponent(req.path);
    } catch {
        return res.status(400).json({ error: 'Malformed request path', requestId: req.id });
    }

    if (BLOCKED_STATIC_REGEX.test(decodedPath) || decodedPath.includes('..') || decodedPath.startsWith('/.env')) {
        return res.status(403).json({ error: 'Access denied to restricted path', requestId: req.id });
    }
    next();
}

/**
 * High-precision Server-Timing & X-Response-Time middleware for DevTools network profiling.
 */
function responseTimingMiddleware(req, res, next) {
    const startTime = process.hrtime.bigint();

    const originalWriteHead = res.writeHead;
    res.writeHead = function (...args) {
        const elapsedNs = process.hrtime.bigint() - startTime;
        const elapsedMs = Number(elapsedNs) / 1e6;
        const formattedMs = elapsedMs.toFixed(2);

        if (!res.headersSent) {
            res.setHeader('Server-Timing', `total;dur=${formattedMs};desc="Total Roundtrip"`);
            res.setHeader('X-Response-Time', `${formattedMs}ms`);
        }
        return originalWriteHead.apply(this, args);
    };

    next();
}

/**
 * Intelligent HTTP Caching Policy Middleware
 * - Sensitive endpoints (auth, profile, notifications, mutations) receive strict no-store.
 * - Public catalog endpoints (projects, teams, stats, community) allow conditional ETag revalidation (304).
 */
const SENSITIVE_PATH_PATTERNS = [
    /^\/api\/auth(\/|$)/i,
    /^\/api\/users\/profile(\/|$)/i,
    /^\/api\/notifications(\/|$)/i,
    /^\/api\/join-requests(\/|$)/i,
    /^\/api\/meetings(\/|$)/i
];

function apiCachingPolicyMiddleware(req, res, next) {
    if (!req.path.startsWith('/api/')) {
        return next();
    }

    const method = (req.method || 'GET').toUpperCase();
    const isSensitive = method !== 'GET' || SENSITIVE_PATH_PATTERNS.some(p => p.test(req.path));

    if (isSensitive) {
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Vary', 'Authorization, Accept');
    } else {
        // Public catalog data: allow conditional caching with ETags
        res.setHeader('Cache-Control', 'public, no-cache');
        res.setHeader('Vary', 'Accept, Accept-Encoding');
    }

    next();
}

/**
 * Lightweight native zlib response compression middleware.
 * Compresses JSON and text payloads > 1024 bytes using Gzip when client accepts it.
 */
function responseCompressionMiddleware(req, res, next) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('gzip')) {
        return next();
    }

    const originalSend = res.send;
    res.send = function (body) {
        if (!body || typeof body === 'number' || res.headersSent) {
            return originalSend.call(this, body);
        }

        let buffer;
        let isJson = false;

        if (Buffer.isBuffer(body)) {
            buffer = body;
        } else if (typeof body === 'string') {
            buffer = Buffer.from(body);
        } else if (typeof body === 'object') {
            try {
                const jsonStr = JSON.stringify(body);
                buffer = Buffer.from(jsonStr);
                isJson = true;
            } catch {
                return originalSend.call(this, body);
            }
        } else {
            return originalSend.call(this, body);
        }

        // Only compress payloads above 1KB threshold
        if (buffer.length < 1024) {
            if (isJson && !res.getHeader('content-type')) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            return originalSend.call(this, body);
        }

        try {
            const compressed = zlib.gzipSync(buffer);
            res.setHeader('Content-Encoding', 'gzip');
            res.removeHeader('Content-Length');
            res.setHeader('Vary', 'Accept-Encoding');
            if (isJson && !res.getHeader('content-type')) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            return originalSend.call(this, compressed);
        } catch {
            return originalSend.call(this, body);
        }
    };

    next();
}

module.exports = {
    createHelmetMiddleware,
    staticShieldMiddleware,
    responseTimingMiddleware,
    apiCachingPolicyMiddleware,
    responseCompressionMiddleware,
    BLOCKED_STATIC_REGEX
};
