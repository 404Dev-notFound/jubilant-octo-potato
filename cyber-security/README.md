# CodeCollab Cyber-Security Architecture & Hardening Guide

## 1. Executive Summary & Architecture Overview

The `cyber-security/` package serves as the centralized, modular security foundation for the entire CodeCollab application. It consolidates all authentication, authorization, session management, HTTP headers, request validation, rate limiting, cryptographic hashing, and security logging into unified, decoupled, auditable components.

```
cyber-security/
├── index.js                  # Central barrel facade exporting all security mechanisms
├── cookieSecurity.js         # Production-ready HttpOnly, Secure, SameSite cookie manager
├── csrfProtection.js         # Anti-CSRF verification middleware for state-mutating requests
├── corsConfig.js             # Production CORS configuration and strict origin normalizer
├── securityHeaders.js        # Helmet CSP, Clickjacking defense, CORP, and static shielding
├── authMiddleware.js         # Dual Bearer / HttpOnly session authentication middleware
├── authorization.js          # Resource ownership, private project boundaries & IDOR defense
├── inputValidation.js        # Strict schema validator, field allowlisting, and sanitizeBody
├── urlSecurity.js            # WHATWG URL sanitizer & XSS protection against dangerous URI schemes
├── preferenceSanitizer.js    # User profile preference merge & mass-assignment defense (CWE-915)
├── cryptoUtils.js            # Bcrypt password hashing, timing-safe equality & decoy comparisons
├── rateLimiter.js            # Tiered rate limiters (API, auth entry points, password changes)
├── securityLogger.js         # X-Request-Id correlation, payload error handler, credential scrubbing
├── tests/
│   └── security-suite.test.js # Comprehensive security test suite
└── README.md                 # Security architecture documentation and threat model
```

---

## 2. Core Security Pillars & Defenses

### 2.1 Authentication & Session Security (`authMiddleware.js`, `cookieSecurity.js`)
* **Transport Modes**: Supports standard `Authorization: Bearer <token>` headers (for mobile/CLI/external APIs) and ambient `cc_access_token` cookies.
* **Cookie Attributes**:
  * **Production HTTPS**: `HttpOnly=true`, `Secure=true`, `SameSite=None`, `Path=/`, 7-day expiration.
  * **Local Development**: `HttpOnly=true`, `Secure=false`, `SameSite=Lax`, `Path=/`.
  * **Zero Client Access**: `document.cookie` cannot read tokens; sensitive credentials and JWTs are never written to `localStorage` or `sessionStorage`.
* **Guest Invocations**: `optionalAuthMiddleware` allows public project/issue queries to resolve with `req.user = null` without throwing `401 Unauthorized`.

### 2.2 CSRF & Origin Validation (`csrfProtection.js`, `corsConfig.js`)
* **CSRF Mitigation**: For cookie-authenticated mutations (`POST`, `PUT`, `PATCH`, `DELETE`), custom headers (`X-Requested-With`, `X-Request-Id`, `X-CSRF-Token`) or trusted Origin/Referer headers are strictly enforced. Standard HTML form drive-by submissions are rejected with `403 Forbidden` (`CSRF_FAILED`).
* **Origin Normalization**: Trims whitespace, trailing slashes, and lowercases origins before matching against allowed domains (`https://opensource-projects.netlify.app`, Railway production backend, Netlify deploy preview branches, and localhost).

### 2.3 HTTP Security Headers & Static Shielding (`securityHeaders.js`)
* **Content Security Policy (CSP)**:
  * Strict script whitelist: `'self'`, sha256 inline script whitelist, `https://unpkg.com`, `https://accounts.google.com`.
  * `objectSrc: ["'none'"]` and `frameAncestors: ["'none'"]` prevent frame injection and UI redressing (Clickjacking).
* **Static Directory Shielding**:
  * Directly blocks access to `.env`, `.git`, `prisma/`, `scripts/`, `src/`, `test/`, and `codecollab data/` with `403 Forbidden`.

### 2.4 Input Validation & Sanitization (`inputValidation.js`, `urlSecurity.js`)
* **Schema Enforcement**: All API bodies are strictly validated against declarative schemas (`PROJECT_SCHEMA`, `ISSUE_SCHEMA`, `SIGNUP_SCHEMA`, etc.). Unexpected or unknown fields are dropped.
* **URL Sanitization**: User-supplied URLs (avatars, GitHub repos, external websites) are decoded, stripped of null-bytes and tabs, and validated against allowed protocols (`http:`, `https:`). Any attempt to inject `javascript:`, `data:`, `vbscript:`, or `blob:` is rejected.

### 2.5 Mass-Assignment & Data Privacy (`preferenceSanitizer.js`)
* **Zero Leakage**: All user serialization functions (`sanitizeUserObj`) strip `password`, `passwordHash`, `email`, `phoneNumber`, and `mobileNumber` before sending responses to clients.
* **Mass-Assignment Defense**: Critical system properties (`id`, `userId`, `role`, `createdAt`, `upvotes`, `followers`) are guarded from user updates.

### 2.6 Cryptographic Integrity & Anti-Timing Defenses (`cryptoUtils.js`)
* **Password Hashing**: Bcrypt with 10 salt rounds.
* **Decoy Dummy Hashing**: When an unauthenticated user submits an invalid email, a constant-time decoy comparison (`DUMMY_BCRYPT_HASH`) is computed to eliminate timing side-channel enumeration attacks.

### 2.7 Observability & Correlation (`securityLogger.js`)
* **Request Correlation**: Enforces valid `X-Request-Id` format (alphanumeric, `-`, `_`, 1..64 chars) or generates standard UUIDv4.
* **Credential Scrubbing**: Intercepts error logs and sanitizes database connection passwords (`postgresql://user:***@host...`) and Bearer tokens before writing to console/disk.

---

## 3. Verification & Testing

Run the security architecture test suite anytime:
```bash
node cyber-security/tests/security-suite.test.js
```
Or run the full application test suite:
```bash
npm test
```
