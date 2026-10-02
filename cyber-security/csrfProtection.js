/*
 * ==============================================================================
 * CodeCollab Cyber-Security: CSRF Protection Module
 * ==============================================================================
 * Anti-CSRF Middleware for state-changing requests using cookie authentication.
 * Verifies custom headers (e.g. X-Requested-With, X-Request-Id, X-CSRF-Token)
 * or origin legitimacy to block drive-by cross-site form posts.
 */

const { extractTokens } = require('./cookieSecurity');

/**
 * Creates CSRF protection middleware given an origin validation function.
 *
 * @param {Function} isOriginAllowed - Function returning boolean whether origin is trusted
 * @returns {Function} Express middleware
 */
function csrfProtectionMiddleware(isOriginAllowed) {
    return function (req, res, next) {
        const method = (req.method || 'GET').toUpperCase();
        // Safe idempotent methods do not mutate state
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            return next();
        }

        // Public auth entrypoints do not rely on existing session authorization
        if (req.path === '/api/auth/login' || req.path === '/api/auth/signup') {
            return next();
        }

        const { isFromCookie } = extractTokens(req);
        // Only enforce CSRF checks if authentication was derived purely from ambient cookies
        if (!isFromCookie) {
            return next();
        }

        const customHeader = req.headers['x-requested-with'] || req.headers['x-request-id'] || req.headers['x-csrf-token'];
        const origin = req.headers['origin'] || req.headers['referer'];

        // Custom headers cannot be set by standard cross-site HTML forms
        if (customHeader) {
            return next();
        }

        // Validate origin if provided
        if (origin && typeof isOriginAllowed === 'function' && isOriginAllowed(origin)) {
            return next();
        }

        // Block untrusted cross-site state mutation
        return res.status(403).json({
            error: 'Forbidden: CSRF verification failed for cookie-authenticated request',
            code: 'CSRF_FAILED',
            requestId: req.id || undefined
        });
    };
}

module.exports = {
    csrfProtectionMiddleware
};
