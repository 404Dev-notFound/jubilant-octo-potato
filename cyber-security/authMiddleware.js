/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Authentication Middleware
 * ==============================================================================
 * Dual-transport authentication middleware supporting both standard
 * `Authorization: Bearer <token>` HTTP headers and `cc_access_token` HttpOnly cookies.
 * Provides both strict mandatory authentication and guest-friendly optional authentication.
 */

const jwt = require('jsonwebtoken');
const { extractTokens } = require('./cookieSecurity');

// Safe constant-time decoy hash to eliminate authentication timing enumeration
const DUMMY_BCRYPT_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

/**
 * Creates strict authentication middleware requiring valid JWT session.
 *
 * @param {string} jwtSecret - Secret key for token verification
 * @returns {Function} Express middleware
 */
function createAuthMiddleware(jwtSecret) {
    return function authMiddleware(req, res, next) {
        const authHeader = req.headers['authorization'];
        let token = null;

        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                return res.status(401).json({
                    error: 'Invalid token format. Expected Bearer <token>',
                    requestId: req.id || undefined
                });
            }
            token = parts[1];
        } else {
            const { accessToken } = extractTokens(req);
            token = accessToken;
        }

        if (!token) {
            return res.status(401).json({
                error: 'No authorization token provided',
                requestId: req.id || undefined
            });
        }

        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Session token has expired',
                        code: 'TOKEN_EXPIRED',
                        requestId: req.id || undefined
                    });
                }
                return res.status(401).json({
                    error: 'Invalid or expired session token',
                    code: 'TOKEN_INVALID',
                    requestId: req.id || undefined
                });
            }
            req.user = decoded; // { id, email, role, name }
            next();
        });
    };
}

/**
 * Creates optional authentication middleware.
 * Attaches decoded session user if valid token/cookie is present,
 * but allows unauthenticated guest requests to proceed cleanly with req.user = null.
 *
 * @param {string} jwtSecret - Secret key for token verification
 * @returns {Function} Express middleware
 */
function createOptionalAuthMiddleware(jwtSecret) {
    return function optionalAuthMiddleware(req, res, next) {
        const authHeader = req.headers['authorization'];
        let token = null;

        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        } else {
            const { accessToken } = extractTokens(req);
            token = accessToken;
        }

        if (!token) {
            req.user = null;
            return next();
        }

        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (!err && decoded) {
                req.user = decoded;
            } else {
                req.user = null;
            }
            next();
        });
    };
}

module.exports = {
    createAuthMiddleware,
    createOptionalAuthMiddleware,
    DUMMY_BCRYPT_HASH
};
