/*
 * ==============================================================================
 * CodeCollab Cyber-Security: CORS Configuration & Origin Validator
 * ==============================================================================
 * Production-grade Cross-Origin Resource Sharing (CORS) security configuration.
 * Provides strict origin normalization, explicit origin allowlisting,
 * regex matching for Netlify preview branches & local dev hosts,
 * preflight response caching (86400s), and secure credentials handling.
 */

const DEFAULT_ALLOWED_ORIGINS = [
    'https://opensource-projects.netlify.app',
    'https://jubilant-octo-potato-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8080'
];

/**
 * Normalizes an origin or URL string (trims, strips trailing slashes, lowercases).
 */
function normalizeOrigin(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return '';
    return urlStr.trim().replace(/\/+$/, '').toLowerCase();
}

/**
 * Parses and computes the list of allowed origins from environment and defaults.
 */
function getAllowedOrigins(customOriginsEnv = process.env.CORS_ORIGIN) {
    const rawEnv = (customOriginsEnv || '').trim();
    const configuredOrigins = (rawEnv === '*' ? ['*'] : rawEnv.split(','))
        .map(normalizeOrigin)
        .filter(Boolean);

    return Array.from(new Set([
        ...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin),
        ...configuredOrigins
    ]));
}

/**
 * Origin validation policy.
 * Supports exact match, wildcard '*', Netlify preview subdomains, and localhost.
 */
function isOriginAllowed(origin, customOriginsEnv = process.env.CORS_ORIGIN) {
    if (!origin) return true; // Allow same-origin / server-to-server / curl / mobile apps
    const normalized = normalizeOrigin(origin);

    const rawEnv = (customOriginsEnv || '').trim();
    if (rawEnv === '*') return true;

    const allowed = getAllowedOrigins(customOriginsEnv);
    if (allowed.includes(normalized)) return true;

    // Safely allow local development origins (http://localhost:8080, http://127.0.0.1:8080, etc.)
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
        return true;
    }

    // Safely allow Netlify branch & deploy preview subdomains (e.g. https://deploy-preview-12--opensource-projects.netlify.app)
    if (/^https:\/\/[a-z0-9-]+(\-\-[a-z0-9-]+)?\.netlify\.app$/.test(normalized)) {
        return true;
    }

    return false;
}

/**
 * Generates Express CORS middleware options.
 */
function getCorsOptions(customOriginsEnv = process.env.CORS_ORIGIN) {
    return {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin, customOriginsEnv)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
            'X-Request-Id',
            'X-Refresh-Token'
        ],
        exposedHeaders: [
            'Content-Range',
            'X-Content-Range',
            'X-Request-Id',
            'X-Total-Count',
            'X-Page',
            'X-Limit',
            'X-Total-Pages',
            'Server-Timing',
            'X-Response-Time'
        ],
        maxAge: 86400 // Cache preflight response for 24 hours
    };
}

module.exports = {
    DEFAULT_ALLOWED_ORIGINS,
    normalizeOrigin,
    getAllowedOrigins,
    isOriginAllowed,
    getCorsOptions
};
