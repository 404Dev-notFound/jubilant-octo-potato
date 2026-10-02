/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Preference Sanitizer & Profile Security
 * ==============================================================================
 * Protects user profile records against Mass Assignment (CWE-915).
 * Enforces strict field allowlisting, URI scheme safety on social links,
 * and zero leakage of sensitive credentials, emails, and phone numbers.
 */

const { isSafeUrl, sanitizeSafeUrl } = require('./urlSecurity');

const EDITABLE_PREFERENCE_FIELDS = [
    'title',
    'bio',
    'skills',
    'verifiedSkills',
    'availability',
    'lookingFor',
    'socialLinks',
    'location'
];

const ALLOWED_PROFILE_FIELDS = new Set([
    'firstName',
    'lastName',
    'name',
    'title',
    'bio',
    'avatarUrl',
    'skills',
    'verifiedSkills',
    'availability',
    'lookingFor',
    'socialLinks',
    'location',
    'education',
    'experience',
    'interests',
    'hoursPerWeek',
    'collaborationType',
    'timezone',
    'username',
    'theme'
]);

const PROTECTED_FIELDS = new Set([
    'id',
    'userId',
    'email',
    'password',
    'passwordHash',
    'role',
    'upvotes',
    'upvoters',
    'followers',
    'rating',
    'createdAt',
    'updatedAt',
    'phoneNumber',
    'mobileNumber',
    'potion',
    'progress',
    'isVerified'
]);

/**
 * Sanitizes an object mapping of social link keys to URLs, strictly
 * permitting only http:// and https:// schemes and dropping dangerous schemes.
 */
function sanitizeLinkMap(links) {
    if (typeof links !== 'object' || links === null || Array.isArray(links)) {
        return {};
    }
    const cleanMap = {};
    for (const [rawKey, rawVal] of Object.entries(links)) {
        if (typeof rawKey !== 'string' || typeof rawVal !== 'string') continue;
        const key = rawKey.trim();
        const val = rawVal.trim();
        if (key.length === 0 || key.length > 30 || val.length === 0 || val.length > 2048) continue;
        if (isSafeUrl(val, { allowedProtocols: ['http:', 'https:'] })) {
            cleanMap[key] = sanitizeSafeUrl(val);
        }
    }
    return cleanMap;
}

/**
 * Sanitize and validate incoming profile field values.
 */
function sanitizeFieldValue(key, value) {
    if (value === undefined) return undefined;

    switch (key) {
        case 'firstName':
        case 'lastName':
        case 'name':
        case 'title':
        case 'bio':
        case 'availability':
        case 'lookingFor':
        case 'location':
        case 'education':
        case 'experience':
        case 'hoursPerWeek':
        case 'collaborationType':
        case 'timezone':
        case 'username':
        case 'theme':
            return typeof value === 'string' ? value.trim() : '';

        case 'avatarUrl':
            return typeof value === 'string' ? sanitizeSafeUrl(value, '') : '';

        case 'skills':
        case 'verifiedSkills':
        case 'interests':
            if (!Array.isArray(value)) return [];
            return Array.from(new Set(
                value
                    .filter(item => typeof item === 'string' && item.trim().length > 0)
                    .map(item => item.trim().slice(0, 60))
            )).slice(0, 40); // bounded array of max 40 deduplicated items

        case 'socialLinks':
            return sanitizeLinkMap(value);

        default:
            return undefined;
    }
}

/**
 * Safely merge a user's preferences object, strictly preserving
 * existing social metrics and non-supplied fields.
 */
function safeMergePreferences(existingPrefs = {}, incomingUpdates = {}) {
    const current = (typeof existingPrefs === 'object' && existingPrefs !== null) ? { ...existingPrefs } : {};
    const updates = (typeof incomingUpdates === 'object' && incomingUpdates !== null) ? incomingUpdates : {};

    // 1. Preserve critical social and internal data
    const preservedSocial = {
        upvotes: typeof current.upvotes === 'number' ? current.upvotes : 0,
        upvoters: Array.isArray(current.upvoters) ? [...current.upvoters] : [],
        followers: Array.isArray(current.followers) ? [...current.followers] : []
    };

    const merged = { ...current };

    // 2. Apply only allowable fields that are explicitly provided in updates
    for (const key of ALLOWED_PROFILE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const sanitized = sanitizeFieldValue(key, updates[key]);
            if (sanitized !== undefined) {
                merged[key] = sanitized;
            }
        }
    }

    // 3. Guarantee protected fields cannot be overridden by incoming payload
    for (const protectedKey of PROTECTED_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(current, protectedKey)) {
            merged[protectedKey] = current[protectedKey];
        } else if (Object.prototype.hasOwnProperty.call(preservedSocial, protectedKey)) {
            merged[protectedKey] = preservedSocial[protectedKey];
        } else {
            delete merged[protectedKey];
        }
    }

    // Guarantee social metrics are always arrays/numbers
    merged.upvotes = preservedSocial.upvotes;
    merged.upvoters = preservedSocial.upvoters;
    merged.followers = preservedSocial.followers;

    return merged;
}

/**
 * Safely merge a full user document in file storage, preserving credentials and social data.
 */
function safeMergeUserRecord(existingUser = {}, incomingUpdates = {}) {
    if (!existingUser) return null;

    const base = { ...existingUser };
    const updates = (typeof incomingUpdates === 'object' && incomingUpdates !== null) ? incomingUpdates : {};

    // Disallow overriding critical root fields
    const protectedRootFields = ['id', 'email', 'password', 'passwordHash', 'role', 'createdAt'];
    for (const f of protectedRootFields) {
        if (base[f] !== undefined) updates[f] = base[f];
    }

    // If name is supplied, update root name and split into firstName/lastName
    if (typeof updates.name === 'string' && updates.name.trim()) {
        base.name = updates.name.trim();
        const parts = base.name.split(' ');
        updates.firstName = parts[0] || '';
        updates.lastName = parts.slice(1).join(' ') || '';
    }

    // Merge root profile/preferences
    const currentPrefs = base.profile?.preferences || base.preferences || {};
    const mergedPrefs = safeMergePreferences(currentPrefs, updates);

    // Apply allowed direct fields to root record for backward compatibility
    for (const key of ALLOWED_PROFILE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const val = sanitizeFieldValue(key, updates[key]);
            if (val !== undefined) {
                base[key] = val;
            }
        }
    }

    // Preserve root social metrics
    base.upvotes = typeof base.upvotes === 'number' ? base.upvotes : mergedPrefs.upvotes;
    base.upvoters = Array.isArray(base.upvoters) ? base.upvoters : mergedPrefs.upvoters;
    base.followers = Array.isArray(base.followers) ? base.followers : mergedPrefs.followers;

    // Keep preferences in sync
    base.preferences = mergedPrefs;
    if (base.profile) {
        base.profile.preferences = mergedPrefs;
        if (updates.firstName !== undefined) base.profile.firstName = updates.firstName;
        if (updates.lastName !== undefined) base.profile.lastName = updates.lastName;
        if (updates.avatarUrl !== undefined) base.profile.avatarUrl = updates.avatarUrl;
    }

    base.updatedAt = new Date().toISOString();
    return base;
}

/**
 * Reusable user serializer & sanitizer (Zero-Email, No Passwords, Zero Mobile Leakage).
 * Strips all authentication and private contact fields before client response.
 */
function sanitizeUserObj(u, fallbackName = 'Developer') {
    if (!u) return null;
    const { password, passwordHash, email, phoneNumber, mobileNumber, phone, ...safeUser } = u;
    const prefs = (typeof u.profile?.preferences === 'object' && u.profile?.preferences !== null) ? u.profile.preferences : {};
    return {
        id: String(safeUser.id || ''),
        name: safeUser.name || (safeUser.profile?.firstName ? `${safeUser.profile.firstName} ${safeUser.profile.lastName || ''}`.trim() : fallbackName),
        title: safeUser.title || prefs.title || safeUser.role || 'Developer',
        avatarUrl: sanitizeSafeUrl(safeUser.avatarUrl || safeUser.profile?.avatarUrl || '', ''),
        verifiedSkills: Array.isArray(safeUser.verifiedSkills) ? safeUser.verifiedSkills : (Array.isArray(prefs.verifiedSkills) ? prefs.verifiedSkills : []),
        skills: Array.isArray(safeUser.skills) ? safeUser.skills : (Array.isArray(prefs.skills) ? prefs.skills : []),
        bio: safeUser.bio || prefs.bio || '',
        availability: safeUser.availability || prefs.availability || 'Available Now',
        lookingFor: safeUser.lookingFor || prefs.lookingFor || 'Open for collaboration',
        socialLinks: sanitizeLinkMap(safeUser.socialLinks || prefs.socialLinks || {}),
        location: safeUser.location || prefs.location || '',
        rating: typeof safeUser.rating === 'number' ? safeUser.rating : (typeof prefs.rating === 'number' ? prefs.rating : 5.0),
        upvotes: typeof safeUser.upvotes === 'number' ? safeUser.upvotes : (typeof prefs.upvotes === 'number' ? prefs.upvotes : 0),
        upvoters: Array.isArray(safeUser.upvoters) ? safeUser.upvoters : (Array.isArray(prefs.upvoters) ? prefs.upvoters : []),
        followers: Array.isArray(safeUser.followers) ? safeUser.followers : (Array.isArray(prefs.followers) ? prefs.followers : [])
    };
}

module.exports = {
    ALLOWED_PROFILE_FIELDS,
    EDITABLE_PREFERENCE_FIELDS,
    PROTECTED_FIELDS,
    sanitizeLinkMap,
    sanitizeFieldValue,
    safeMergePreferences,
    safeMergeUserRecord,
    sanitizeUserObj
};
