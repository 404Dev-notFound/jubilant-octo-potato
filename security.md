# CodeCollab Security Mechanisms

This document outlines the security mechanisms and practices currently implemented in the CodeCollab project. It reflects the exact state of the codebase.

## 1. Authentication and Login Security
- **What it protects:** Unauthorized access to user accounts and protected endpoints.
- **How it is implemented:** The application uses JSON Web Tokens (JWT) for authentication. When a user logs in (or signs up), a JWT is signed with a secret (`JWT_SECRET`) and returned. Google OAuth is also supported via `google-auth-library`.
- **Where it is implemented:** `/api/auth/login`, `/api/auth/signup`, `/api/auth/google` in `server.js`.
- **Limitations:** Tokens are stored on the client side.

## 2. Password Hashing
- **What it protects:** Plain-text passwords from being exposed if the database or data files are compromised.
- **How it is implemented:** Passwords are hashed using the `bcryptjs` library with a salt round of 10 before they are saved to either the `users.json` file or the PostgreSQL database.
- **Where it is implemented:** `/api/auth/signup` and `/api/auth/google` (creates a hashed random UUID placeholder password) in `server.js`.

## 3. Session and Token Management
- **What it protects:** Hijacking of long-lived sessions.
- **How it is implemented:** 
  - **Access Tokens:** JWTs are issued with an expiration time of 1 hour (`expiresIn: '1h'`).
  - **Refresh Tokens:** A separate refresh token is generated using `uuidv4()` and stored in an in-memory Map (`refreshTokenStore`) mapped to the user ID.
- **Where it is implemented:** `/api/auth/login`, `/api/auth/refresh` in `server.js`.
- **Limitations:** The refresh token store is in-memory. If the server restarts, all refresh tokens are lost and users must log in again. 

## 4. Logout and Session Invalidation
- **What it protects:** Active sessions left behind on shared devices.
- **How it is implemented:** A logout endpoint accepts the user's refresh token and removes it from the `refreshTokenStore` Map, invalidating it from being used to get new access tokens.
- **Where it is implemented:** `/api/auth/logout` in `server.js`.
- **Limitations:** Since JWTs are stateless, the active access token remains valid until its 1-hour expiration time expires.

## 5. Authorization and Role/Permission Checks (IDOR/BOLA Protection)
- **What it protects:** Users from accessing or modifying resources (like issues, projects) that belong to other users (Insecure Direct Object Reference).
- **How it is implemented:** 
  - A middleware `authMiddleware` validates the JWT and attaches the decoded `req.user` payload to the request.
  - Endpoints handling updates or deletions verify that the requester is the owner of the resource or an authorized project member. For example, deleting an issue checks if `isProjectAuthorized(existing.projectId, userId)` is true or if `existing.creatorId === userId`.
- **Where it is implemented:** `authMiddleware` and handlers like `handleDeleteIssue`, `handleUpdateIssue` in `server.js`.

## 6. SQL Injection Protection
- **What it protects:** The database against malicious SQL queries.
- **How it is implemented:** The application uses Prisma ORM (`@prisma/client`), which inherently uses parameterized queries, preventing standard SQL injection attacks.
- **Where it is implemented:** All database interactions using `prisma.<model>` in `server.js`.

## 7. Rate Limiting
- **What it protects:** The authentication endpoints against brute-force and credential stuffing attacks.
- **How it is implemented:** The `express-rate-limit` package is used to limit requests to `/api/auth/` routes. It is configured to allow a maximum of 100 requests per 15 minutes per IP.
- **Where it is implemented:** `authLimiter` middleware in `server.js`.

## 8. Cross-Origin Resource Sharing (CORS)
- **What it protects:** Prevents unauthorized domains from making API requests to the server.
- **How it is implemented:** The `cors` middleware is applied globally.
- **Where it is implemented:** `app.use(cors())` in `server.js`.
- **Limitations:** Currently, it uses the default configuration which allows all origins (`*`). For production, this should be restricted to specific trusted domains.

## 9. Security Headers
- **What it protects:** Mitigates various injection and clickjacking attacks.
- **How it is implemented:** The `helmet` middleware is used to set various HTTP security headers globally.
- **Where it is implemented:** `app.use(helmet({...}))` in `server.js`.
- **Limitations:** Content Security Policy (CSP) is explicitly disabled (`contentSecurityPolicy: false`) to avoid breaking existing inline scripts and styles.

## 10. Secrets and Credentials Management
- **What it protects:** API keys, database URLs, and cryptographic secrets from being hardcoded in the repository.
- **How it is implemented:** 
  - Secrets are loaded from a `.env` file using the `dotenv` library (via a custom `load-env.js` script).
  - The application strictly requires `JWT_SECRET` and `DATABASE_URL` to start.
  - A `.env.example` file is provided with dummy values as a template for developers.
  - The `.gitignore` file includes `.env` to prevent accidental commits of secrets to the Git repository.
- **Where it is implemented:** `load-env.js`, `server.js`, `.env.example`, `.gitignore`.

---

## Security Checklist

Below is a summary of standard security mechanisms, noting whether they are actually implemented in the CodeCollab codebase.

| Security Mechanism | Status | Notes |
| :--- | :--- | :--- |
| **Password Hashing** | ✅ Implemented | Uses `bcryptjs` (salt rounds: 10). |
| **JWT Authentication** | ✅ Implemented | 1-hour expiration with UUID refresh tokens. |
| **Role-Based/Ownership Auth** | ✅ Implemented | Verifies resource ownership (e.g., issue creator, project member). |
| **SQL Injection Protection** | ✅ Implemented | Uses Prisma ORM parameterized queries. |
| **Rate Limiting** | ✅ Implemented | Applied to `/api/auth/` routes (100 req/15m). |
| **Environment Variables** | ✅ Implemented | `.env` used and ignored by `.gitignore`. |
| **Security Headers** | ⚠️ Partial | `helmet` is used, but CSP is disabled. |
| **CORS** | ⚠️ Partial | `cors` is used but allows all origins by default. |
| **Input Validation/Sanitization** | ❌ Not Implemented | No explicit schema validation (e.g., Joi, express-validator) found on incoming request bodies. |
| **XSS Protection** | ❌ Not Implemented | No explicit XSS sanitization library used; CSP is disabled. |
| **CSRF Protection** | ❌ Not Implemented | No CSRF tokens (`csurf`) are currently generated or verified. |
| **Secure / HttpOnly Cookies** | ❌ Not Implemented | JWTs are returned in the JSON body, not in secure cookies. |
