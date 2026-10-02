/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Cryptographic & Hashing Utilities
 * ==============================================================================
 * Password hashing with bcrypt, timing-attack resistant password verification,
 * decoy dummy hashing for non-existent users, and cryptographically secure
 * random token generation.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { DUMMY_BCRYPT_HASH } = require('./authMiddleware');

const DEFAULT_SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password using bcrypt.
 *
 * @param {string} password - Plain text password
 * @param {number} [saltRounds=10]
 * @returns {Promise<string>}
 */
async function hashPassword(password, saltRounds = DEFAULT_SALT_ROUNDS) {
    if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
    }
    return bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 *
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Stored bcrypt hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hashedPassword) {
    if (!password || !hashedPassword) return false;
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch {
        return false;
    }
}

/**
 * Executes a timing-safe dummy bcrypt comparison to prevent user enumeration
 * via response timing differences when an email/user does not exist.
 *
 * @param {string} password - Inbound plain text password
 * @returns {Promise<boolean>} Always returns false
 */
async function compareDecoyPassword(password) {
    try {
        await bcrypt.compare(password || '', DUMMY_BCRYPT_HASH);
    } catch {}
    return false;
}

/**
 * Generates a cryptographically strong random hex token.
 *
 * @param {number} [bytes=32]
 * @returns {string} Hex encoded random string
 */
function generateCryptoToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Constant-time string equality check to prevent timing attacks on HMACs or secrets.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqualStrings(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
    DEFAULT_SALT_ROUNDS,
    hashPassword,
    comparePassword,
    compareDecoyPassword,
    generateCryptoToken,
    timingSafeEqualStrings
};
