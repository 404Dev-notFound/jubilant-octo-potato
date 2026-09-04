/*
 * CodeCollab Centralized API Validation System
 * ----------------------------------------------------------------------
 * Provides schema validation, field allowlisting, string trimming,
 * bounded arrays, enum validation, URL validation, and mass assignment protection.
 */

const { validateUrl } = require('./urlSecurity');

class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Validates a single field against a rule specification.
 */
function validateField(key, value, rule, isUpdate = false) {
    // Missing value check
    if (value === undefined || value === null) {
        if (rule.required && !isUpdate) {
            throw new ValidationError(`${rule.label || key} is required`, key);
        }
        return rule.default !== undefined ? rule.default : undefined;
    }

    switch (rule.type) {
        case 'string': {
            if (typeof value !== 'string') {
                throw new ValidationError(`${rule.label || key} must be a string`, key);
            }
            const trimmed = rule.trim !== false ? value.trim() : value;
            if (rule.required && !trimmed && !isUpdate) {
                throw new ValidationError(`${rule.label || key} cannot be empty`, key);
            }
            if (rule.minLength && trimmed.length < rule.minLength) {
                throw new ValidationError(`${rule.label || key} must be at least ${rule.minLength} characters`, key);
            }
            if (rule.maxLength && trimmed.length > rule.maxLength) {
                throw new ValidationError(`${rule.label || key} cannot exceed ${rule.maxLength} characters`, key);
            }
            if (rule.pattern && !rule.pattern.test(trimmed)) {
                throw new ValidationError(`${rule.label || key} has an invalid format`, key);
            }
            return trimmed;
        }

        case 'email': {
            if (typeof value !== 'string') {
                throw new ValidationError('Email must be a string', key);
            }
            const email = value.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new ValidationError('Please provide a valid email address', key);
            }
            if (email.length > 254) {
                throw new ValidationError('Email address is too long', key);
            }
            return email;
        }

        case 'password': {
            if (typeof value !== 'string') {
                throw new ValidationError('Password must be a string', key);
            }
            if (value.length < 6) {
                throw new ValidationError('Password must be at least 6 characters long', key);
            }
            if (value.length > 128) {
                throw new ValidationError('Password cannot exceed 128 characters', key);
            }
            return value;
        }

        case 'number': {
            const num = Number(value);
            if (isNaN(num)) {
                throw new ValidationError(`${rule.label || key} must be a valid number`, key);
            }
            if (rule.integer && !Number.isInteger(num)) {
                throw new ValidationError(`${rule.label || key} must be an integer`, key);
            }
            if (rule.min !== undefined && num < rule.min) {
                throw new ValidationError(`${rule.label || key} must be at least ${rule.min}`, key);
            }
            if (rule.max !== undefined && num > rule.max) {
                throw new ValidationError(`${rule.label || key} cannot exceed ${rule.max}`, key);
            }
            return num;
        }

        case 'boolean': {
            if (typeof value === 'boolean') return value;
            if (value === 'true' || value === '1' || value === 1) return true;
            if (value === 'false' || value === '0' || value === 0) return false;
            return Boolean(value);
        }

        case 'enum': {
            const strVal = String(value).trim();
            const normalized = rule.caseInsensitive
                ? rule.values.find(v => v.toLowerCase() === strVal.toLowerCase())
                : (rule.values.includes(strVal) ? strVal : null);

            if (!normalized) {
                throw new ValidationError(
                    `Invalid ${rule.label || key}. Allowed: ${rule.values.join(', ')}`,
                    key
                );
            }
            return normalized;
        }

        case 'url': {
            const urlResult = validateUrl(value, {
                allowEmpty: rule.required ? false : true,
                allowedProtocols: rule.protocols || ['http:', 'https:']
            });
            if (!urlResult.valid) {
                throw new ValidationError(urlResult.error || `Invalid URL for ${rule.label || key}`, key);
            }
            return urlResult.url;
        }

        case 'array': {
            if (!Array.isArray(value)) {
                if (typeof value === 'string' && rule.splitComma) {
                    value = value.split(',').map(s => s.trim()).filter(Boolean);
                } else {
                    throw new ValidationError(`${rule.label || key} must be an array`, key);
                }
            }
            let arr = value;
            if (rule.maxItems && arr.length > rule.maxItems) {
                arr = arr.slice(0, rule.maxItems);
            }
            if (rule.itemType === 'string') {
                arr = arr
                    .filter(item => item !== null && item !== undefined)
                    .map(item => String(item).trim())
                    .filter(item => item.length > 0 && (!rule.itemMaxLength || item.length <= rule.itemMaxLength));
            }
            return arr;
        }

        case 'object': {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                throw new ValidationError(`${rule.label || key} must be an object`, key);
            }
            return value;
        }

        default:
            return value;
    }
}

/**
 * Validate and sanitize a payload against a schema definition.
 */
function validateSchema(payload, schema, options = {}) {
    const { isUpdate = false, stripUnknown = true } = options;

    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        throw new ValidationError('Request payload must be a valid JSON object');
    }

    const validated = {};

    // Validate declared fields
    for (const [key, rule] of Object.entries(schema)) {
        const rawValue = payload[key];
        const val = validateField(key, rawValue, rule, isUpdate);
        if (val !== undefined) {
            validated[key] = val;
        }
    }

    // Check for unexpected/protected fields if not stripping unknown
    if (!stripUnknown) {
        for (const key of Object.keys(payload)) {
            if (!schema[key]) {
                throw new ValidationError(`Unknown field '${key}' is not permitted`, key);
            }
        }
    }

    return validated;
}

// ------------------------------------------------------------------------------
// Predefined Shared Schemas
// ------------------------------------------------------------------------------

const PROJECT_SCHEMA = {
    title: { type: 'string', required: true, minLength: 2, maxLength: 100, label: 'Project title' },
    category: { type: 'string', required: false, maxLength: 50, default: 'Engineering' },
    difficulty: { type: 'string', required: false, maxLength: 30, default: 'Intermediate' },
    techStack: { type: 'array', splitComma: true, itemType: 'string', maxItems: 30, itemMaxLength: 50 },
    image: { type: 'url', required: false, default: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80' },
    description: { type: 'string', required: false, maxLength: 2000, default: '' },
    readme: { type: 'string', required: false, maxLength: 50000 },
    githubUrl: { type: 'url', required: false, default: '' },
    isPinned: { type: 'boolean', default: false },
    isDemo: { type: 'boolean', default: false },
    isPrivate: { type: 'boolean', default: false },
    visibility: { type: 'enum', values: ['Public', 'Private'], caseInsensitive: true, default: 'Public' },
    progress: { type: 'number', integer: true, min: 0, max: 100, default: 0 }
};

const ISSUE_SCHEMA = {
    title: { type: 'string', required: true, minLength: 1, maxLength: 200, label: 'Issue title' },
    description: { type: 'string', required: false, maxLength: 10000, default: '' },
    status: { type: 'enum', values: ['TODO', 'IN_PROGRESS', 'DONE'], caseInsensitive: true, default: 'TODO' },
    priority: { type: 'enum', values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], caseInsensitive: true, default: 'MEDIUM' },
    tags: { type: 'array', splitComma: true, itemType: 'string', maxItems: 20, itemMaxLength: 30 },
    assigneeId: { type: 'string', required: false }
};

const SIGNUP_SCHEMA = {
    name: { type: 'string', required: true, minLength: 2, maxLength: 70, label: 'Full name' },
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    mobileNumber: { type: 'string', required: true, minLength: 7, maxLength: 20, pattern: /^[+]?[0-9\s\-()]{7,20}$/, label: 'Mobile number' },
    phoneNumber: { type: 'string', required: false, minLength: 7, maxLength: 20, pattern: /^[+]?[0-9\s\-()]{7,20}$/ },
    role: { type: 'string', required: false, maxLength: 50, default: 'Developer' }
};

const LOGIN_SCHEMA = {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 1 },
    mobileNumber: { type: 'string', required: false, minLength: 7, maxLength: 20, pattern: /^[+]?[0-9\s\-()]{7,20}$/ },
    phoneNumber: { type: 'string', required: false, minLength: 7, maxLength: 20, pattern: /^[+]?[0-9\s\-()]{7,20}$/ }
};

const CHANGE_PASSWORD_SCHEMA = {
    currentPassword: { type: 'string', required: true, minLength: 1, label: 'Current password' },
    newPassword: { type: 'password', required: true, label: 'New password' }
};

const UPDATE_PROFILE_SCHEMA = {
    name: { type: 'string', required: false, minLength: 2, maxLength: 80, label: 'Full name' },
    username: { type: 'string', required: false, maxLength: 60, label: 'Username' },
    title: { type: 'string', required: false, maxLength: 120, label: 'Title' },
    bio: { type: 'string', required: false, maxLength: 2000, label: 'Bio' },
    location: { type: 'string', required: false, maxLength: 120, label: 'Location' },
    availability: { type: 'string', required: false, maxLength: 80, label: 'Availability' },
    lookingFor: { type: 'string', required: false, maxLength: 200, label: 'Looking for' },
    avatarUrl: { type: 'url', required: false, maxLength: 2048, label: 'Avatar URL' },
    skills: { type: 'array', splitComma: true, itemType: 'string', maxItems: 40, itemMaxLength: 60 },
    verifiedSkills: { type: 'array', splitComma: true, itemType: 'string', maxItems: 40, itemMaxLength: 60 },
    interests: { type: 'array', splitComma: true, itemType: 'string', maxItems: 40, itemMaxLength: 60 },
    education: { type: 'string', required: false, maxLength: 200, label: 'Education' },
    experience: { type: 'string', required: false, maxLength: 200, label: 'Experience' },
    socialLinks: { type: 'object', required: false, label: 'Social links' },
    website: { type: 'string', required: false, maxLength: 500, label: 'Website' },
    github: { type: 'string', required: false, maxLength: 500, label: 'GitHub' },
    twitter: { type: 'string', required: false, maxLength: 500, label: 'Twitter' },
    linkedin: { type: 'string', required: false, maxLength: 500, label: 'LinkedIn' }
};

const GOOGLE_AUTH_SCHEMA = {
    credential: { type: 'string', required: true, minLength: 10, label: 'Google credential token' }
};

const GITHUB_AUTH_SCHEMA = {
    code: { type: 'string', required: true, minLength: 1, maxLength: 255, label: 'GitHub authorization code' }
};

/**
 * Express middleware generator for request body validation.
 */
function validateBody(schema, options = {}) {
    return (req, res, next) => {
        try {
            req.validatedBody = validateSchema(req.body || {}, schema, options);
            next();
        } catch (err) {
            if (err instanceof ValidationError) {
                return res.status(400).json({
                    error: err.message,
                    field: err.field || undefined,
                    requestId: req.id || undefined
                });
            }
            next(err);
        }
    };
}

module.exports = {
    ValidationError,
    validateField,
    validateSchema,
    validateBody,
    PROJECT_SCHEMA,
    ISSUE_SCHEMA,
    SIGNUP_SCHEMA,
    LOGIN_SCHEMA,
    CHANGE_PASSWORD_SCHEMA,
    UPDATE_PROFILE_SCHEMA,
    GOOGLE_AUTH_SCHEMA,
    GITHUB_AUTH_SCHEMA
};

