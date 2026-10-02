/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Cookie Security Module
 * ==============================================================================
 * Production-ready HttpOnly, Secure, SameSite cookie management for access
 * and rotating refresh tokens.
 * Dual-environment support:
 * - Localhost development: SameSite=Lax, Secure=false
 * - Production / Cross-Site (Netlify + Railway): SameSite=None, Secure=true
 * Sensitive session tokens are never accessible via JavaScript document.cookie.
 */

const COOKIE_NAMES = {
    ACCESS_TOKEN: 'cc_access_token',
    REFRESH_TOKEN: 'cc_refresh_token',
    LEGACY_TOKEN: 'token'
};

/**
 * Computes appropriate cookie attributes based on environment, transport, and origin.
 */
function getCookieOptions(req = {}, overrides = {}) {
    const isProd = process.env.NODE_ENV === 'production';
    const isHttps = Boolean(
        req.secure ||
        req.headers?.['x-forwarded-proto'] === 'https' ||
        (typeof req.protocol === 'string' && req.protocol.toLowerCase() === 'https')
    );

    const origin = (req.headers?.origin || req.headers?.referer || '').toLowerCase();
    const host = (req.headers?.host || '').toLowerCase();
    const isLocalhost = Boolean(
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        host.includes('localhost') ||
        host.includes('127.0.0.1')
    );

    // On localhost or plain HTTP, Secure must be false and SameSite must be Lax (browsers drop SameSite=None over HTTP)
    // In production or cross-site HTTPS (Netlify + Railway), SameSite=None with Secure=true is required
    const secure = Boolean(!isLocalhost && (isProd || isHttps));
    const sameSite = secure ? 'none' : 'lax';

    return {
        httpOnly: true,
        secure,
        sameSite,
        path: '/',
        ...overrides
    };
}

/**
 * Sets HttpOnly access and refresh token cookies on the response.
 */
function setAuthCookies(res, req, { accessToken, refreshToken }) {
    if (!res || typeof res.cookie !== 'function') return;

    if (accessToken) {
        // Access token lifespan: 7 days
        const accessOpts = getCookieOptions(req, {
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessOpts);
        res.cookie(COOKIE_NAMES.LEGACY_TOKEN, accessToken, accessOpts);
    }

    if (refreshToken) {
        // Refresh token lifespan: 30 days
        const refreshOpts = getCookieOptions(req, {
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshOpts);
    }
}

/**
 * Clears all authentication cookies from the client with identical options.
 */
function clearAuthCookies(res, req) {
    if (!res || typeof res.clearCookie !== 'function') return;

    const clearOpts = getCookieOptions(req);
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, clearOpts);
    res.clearCookie(COOKIE_NAMES.LEGACY_TOKEN, clearOpts);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearOpts);
}

/**
 * Extracts access and refresh tokens from either cookies or HTTP headers/body.
 * Ensures 100% backwards compatibility with Bearer headers while prioritizing cookies.
 */
function extractTokens(req = {}) {
    const cookies = req.cookies || {};
    const accessTokenFromCookie = cookies[COOKIE_NAMES.ACCESS_TOKEN] || cookies[COOKIE_NAMES.LEGACY_TOKEN] || cookies.accessToken || null;
    const refreshTokenFromCookie = cookies[COOKIE_NAMES.REFRESH_TOKEN] || cookies.refreshToken || null;

    let accessTokenFromHeader = null;
    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            accessTokenFromHeader = parts[1].trim();
        }
    }

    const refreshTokenFromBody = req.body?.refreshToken ? String(req.body.refreshToken).trim() : null;

    return {
        accessToken: accessTokenFromHeader || accessTokenFromCookie,
        refreshToken: refreshTokenFromCookie || refreshTokenFromBody,
        isFromCookie: !accessTokenFromHeader && Boolean(accessTokenFromCookie)
    };
}

module.exports = {
    COOKIE_NAMES,
    getCookieOptions,
    setAuthCookies,
    clearAuthCookies,
    extractTokens,
    get csrfProtectionMiddleware() {
        return require('./csrfProtection').csrfProtectionMiddleware;
    }
};
