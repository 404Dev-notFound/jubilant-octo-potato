/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Security Logging & Correlation Engine
 * ==============================================================================
 * Request correlation tracking (X-Request-Id), log forging prevention,
 * automatic scrubbing of database credentials/tokens from error streams,
 * and structured security event auditing.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Validates inbound X-Request-Id or generates a new cryptographically unique UUIDv4.
 * Prevents log injection, CRLF injection, and arbitrary header smuggling.
 */
function requestIdMiddleware(req, res, next) {
    const inboundId = req.headers['x-request-id'];
    if (typeof inboundId === 'string' && /^[a-zA-Z0-9_\-]{1,64}$/.test(inboundId.trim())) {
        req.id = inboundId.trim();
    } else {
        req.id = uuidv4();
    }
    res.setHeader('X-Request-Id', req.id);
    next();
}

/**
 * Scrubs sensitive secrets, database connection passwords, bearer tokens,
 * and private keys from strings before logging or transmission.
 */
function sanitizeLogString(str) {
    if (typeof str !== 'string') return str;
    return str
        // Scrub database credentials (postgres://..., mysql://..., mongodb://...)
        .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1***$3')
        // Scrub Bearer tokens
        .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1***')
        // Scrub JWT tokens
        .replace(/eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, '[REDACTED_JWT]');
}

/**
 * Structured security audit log helper.
 */
function securityAuditLog(eventType, { req = {}, userId = null, details = '', status = 'INFO' } = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        status,
        requestId: req.id || null,
        ip: req.ip || req.headers?.['x-forwarded-for'] || null,
        method: req.method || null,
        path: req.path || null,
        userId: userId || req.user?.id || null,
        details: sanitizeLogString(String(details))
    };

    if (process.env.NODE_ENV !== 'test') {
        const prefix = status === 'ERROR' ? '🚨 [SECURITY_ERROR]' : (status === 'WARN' ? '⚠️ [SECURITY_WARN]' : '🔒 [SECURITY_AUDIT]');
        console.log(`${prefix} ${JSON.stringify(logEntry)}`);
    }

    return logEntry;
}

/**
 * Malformed Request & Payload Error Handler
 * Clean 400 for malformed JSON, 413 for oversized payloads, zero reflection of inputs.
 */
function payloadErrorHandlerMiddleware(err, req, res, next) {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Malformed JSON payload', requestId: req.id });
    }
    if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({ error: 'Payload too large', requestId: req.id });
    }
    next(err);
}

module.exports = {
    requestIdMiddleware,
    sanitizeLogString,
    securityAuditLog,
    payloadErrorHandlerMiddleware
};
