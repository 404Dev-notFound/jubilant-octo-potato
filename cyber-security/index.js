/*
 * ==============================================================================
 * CodeCollab Cyber-Security Architecture: Unified Security Facade
 * ==============================================================================
 * Central export interface organizing all security domains into a modular,
 * production-ready, auditable cybersecurity layer.
 */

const cookieSecurity = require('./cookieSecurity');
const csrfProtection = require('./csrfProtection');
const corsConfig = require('./corsConfig');
const securityHeaders = require('./securityHeaders');
const authMiddleware = require('./authMiddleware');
const authorization = require('./authorization');
const inputValidation = require('./inputValidation');
const urlSecurity = require('./urlSecurity');
const preferenceSanitizer = require('./preferenceSanitizer');
const cryptoUtils = require('./cryptoUtils');
const rateLimiter = require('./rateLimiter');
const securityLogger = require('./securityLogger');

module.exports = {
    // Cookie & Session Security
    ...cookieSecurity,

    // CSRF Protection
    ...csrfProtection,

    // CORS & Origin Hardening
    ...corsConfig,

    // Security Headers & Static Directory Shielding
    ...securityHeaders,

    // Authentication Middleware
    ...authMiddleware,

    // Resource Authorization & IDOR Protection
    ...authorization,

    // Input Validation & Schemas
    ...inputValidation,

    // URL Security & XSS Defense
    ...urlSecurity,

    // Preference Sanitization & Mass Assignment Defense
    ...preferenceSanitizer,

    // Cryptographic & Hashing Utilities
    ...cryptoUtils,

    // Rate Limiting & DoS Defense
    ...rateLimiter,

    // Security Logging & Audit Trail
    ...securityLogger,

    // Direct access to submodules for namespaced usage if preferred
    modules: {
        cookieSecurity,
        csrfProtection,
        corsConfig,
        securityHeaders,
        authMiddleware,
        authorization,
        inputValidation,
        urlSecurity,
        preferenceSanitizer,
        cryptoUtils,
        rateLimiter,
        securityLogger
    }
};
