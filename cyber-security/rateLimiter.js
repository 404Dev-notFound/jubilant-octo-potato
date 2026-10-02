/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Rate Limiting & DoS Defense
 * ==============================================================================
 * Multi-tier rate limiting policies:
 * - General API: protects against scraping and flooding
 * - Authentication: protects against brute-force password guessing
 * - Password changes: strict defense against credential spraying
 */

const rateLimit = require('express-rate-limit');

/**
 * Factory for creating configured rate limiters with standard headers.
 */
function createRateLimiter({ windowMs, max, message, skipInTest = true }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => skipInTest && process.env.NODE_ENV === 'test',
        message: {
            error: message || 'Too many requests, please try again later.',
            retryAfterSeconds: Math.ceil(windowMs / 1000)
        }
    });
}

// 1. General API tier: 500 requests per 15 minutes
const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests, please try again later.'
});

// 2. Authentication entry points: 100 attempts per 15 minutes
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many authentication attempts, please try again later.'
});

// 3. Password changes: 15 attempts per 15 minutes
const passwordChangeLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: 'Too many password change attempts, please try again later.'
});

module.exports = {
    createRateLimiter,
    apiLimiter,
    authLimiter,
    passwordChangeLimiter
};
