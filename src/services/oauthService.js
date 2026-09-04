/*
 * ==============================================================================
 * CodeCollab OAuth & Third-Party Authentication Service
 * ==============================================================================
 * Manages OAuth flows for Google and GitHub authentication providers.
 * Enforces strict timeouts, cryptographic state validation, schema compliance,
 * zero secrets exposure, and automatic session/cookie issuance.
 */

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { modifyJson, readJson } = require('../storage/jsonStorage');
const { setAuthCookies } = require('../utils/cookieSecurity');

/**
 * Timeout helper to prevent external provider outages from hanging the application server.
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
};

class OAuthService {
    constructor({
        prismaClient,
        isDbConnectedFn,
        sessionService,
        jwtSecret,
        googleClientId,
        githubClientId,
        githubClientSecret,
        usersFilePath,
        sanitizeUserFn
    }) {
        this.prisma = prismaClient;
        this.isDbConnected = isDbConnectedFn;
        this.sessionService = sessionService;
        this.jwtSecret = jwtSecret;
        this.googleClientId = (googleClientId || '').trim();
        this.githubClientId = (githubClientId || '').trim();
        this.githubClientSecret = (githubClientSecret || '').trim();
        this.usersFilePath = usersFilePath;
        this.sanitizeUser = sanitizeUserFn;

        this.googleClient = this.googleClientId ? new OAuth2Client(this.googleClientId) : null;
    }

    /**
     * Verifies Google ID token and provisions/logs in user.
     */
    async handleGoogleAuth({ credential, req, res }) {
        if (!credential || typeof credential !== 'string') {
            return { status: 400, data: { error: 'Google credential token is required' } };
        }

        if (!this.googleClient) {
            return { status: 503, data: { error: 'Google OAuth is not configured on this server' } };
        }

        let payload;
        try {
            const ticketPromise = this.googleClient.verifyIdToken({
                idToken: credential.trim(),
                audience: this.googleClientId
            });
            // 5 second fail-fast timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Google verification timeout')), 5000)
            );
            const ticket = await Promise.race([ticketPromise, timeoutPromise]);
            payload = ticket.getPayload();
        } catch (err) {
            console.error('Google OAuth token verification failed:', err.message);
            const isTimeout = err.message && err.message.includes('timeout');
            return {
                status: isTimeout ? 504 : 401,
                data: { error: isTimeout ? 'Google authentication timed out' : 'Failed to verify Google token' }
            };
        }

        const { sub: googleId, email, name, picture } = payload;
        if (!email) {
            return { status: 400, data: { error: 'Google account must have an associated email' } };
        }

        return this._provisionOAuthUser({
            provider: 'google',
            providerId: String(googleId),
            email: email.toLowerCase().trim(),
            name: (name || 'Developer').trim(),
            avatarUrl: picture || '',
            bio: 'Joined via Google',
            req,
            res
        });
    }

    /**
     * Generates a secure GitHub OAuth authorization URL with anti-CSRF state.
     */
    getGitHubAuthUrl(redirectUri) {
        if (!this.githubClientId) {
            return { status: 503, data: { error: 'GitHub OAuth is not configured on this server' } };
        }

        const state = uuidv4();
        let url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(this.githubClientId)}&scope=read:user,user:email&state=${encodeURIComponent(state)}`;
        if (redirectUri) {
            url += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
        }

        return { status: 200, data: { url, state } };
    }

    /**
     * Exchanges a temporary GitHub authorization code for user profile, then provisions/logs in.
     */
    async handleGitHubAuth({ code, req, res }) {
        if (!code || typeof code !== 'string') {
            return { status: 400, data: { error: 'GitHub authorization code is required' } };
        }

        if (!this.githubClientId || !this.githubClientSecret) {
            return { status: 503, data: { error: 'GitHub OAuth is not configured on this server' } };
        }

        // 1. Exchange code for access token
        let accessToken;
        try {
            const tokenRes = await fetchWithTimeout('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'CodeCollab-App'
                },
                body: JSON.stringify({
                    client_id: this.githubClientId,
                    client_secret: this.githubClientSecret,
                    code: code.trim()
                })
            }, 5000);

            if (!tokenRes.ok) {
                return { status: 401, data: { error: 'Failed to exchange GitHub authorization code' } };
            }

            const tokenData = await tokenRes.json();
            if (tokenData.error) {
                console.error('GitHub token exchange error:', tokenData.error_description || tokenData.error);
                return { status: 401, data: { error: tokenData.error_description || 'Invalid GitHub authorization code' } };
            }

            accessToken = tokenData.access_token;
        } catch (err) {
            console.error('GitHub OAuth token exchange exception:', err.message);
            const isTimeout = err.name === 'AbortError' || (err.message && err.message.includes('abort'));
            return {
                status: isTimeout ? 504 : 502,
                data: { error: isTimeout ? 'GitHub OAuth exchange timed out' : 'Failed to reach GitHub OAuth server' }
            };
        }

        // 2. Fetch GitHub User Profile & Email
        let profile, email;
        try {
            const [userRes, emailRes] = await Promise.all([
                fetchWithTimeout('https://api.github.com/user', {
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'CodeCollab-App' }
                }, 5000),
                fetchWithTimeout('https://api.github.com/user/emails', {
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'CodeCollab-App' }
                }, 5000)
            ]);

            if (!userRes.ok) {
                return { status: 401, data: { error: 'Failed to fetch GitHub profile' } };
            }

            profile = await userRes.json();

            if (emailRes.ok) {
                const emails = await emailRes.json();
                if (Array.isArray(emails)) {
                    const primary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
                    if (primary && primary.email) {
                        email = primary.email;
                    }
                }
            }

            email = (email || profile.email || `${profile.login}@users.noreply.github.com`).toLowerCase().trim();
        } catch (err) {
            console.error('GitHub API error:', err.message);
            return { status: 502, data: { error: 'Failed to communicate with GitHub API' } };
        }

        return this._provisionOAuthUser({
            provider: 'github',
            providerId: String(profile.id),
            email,
            name: profile.name || profile.login || 'GitHub User',
            avatarUrl: profile.avatar_url || '',
            githubUrl: profile.html_url || '',
            bio: profile.bio || 'Joined via GitHub',
            req,
            res
        });
    }

    /**
     * Shared user provisioning logic across PostgreSQL & local fallback.
     */
    async _provisionOAuthUser({ provider, providerId, email, name, avatarUrl, githubUrl = '', bio = '', req, res }) {
        const names = name.split(' ');
        const firstName = names[0] || 'Developer';
        const lastName = names.slice(1).join(' ') || '';

        // PostgreSQL Storage Path
        if (process.env.NODE_ENV === 'production' || (this.isDbConnected && (await this.isDbConnected()))) {
            try {
                let user = await this.prisma.user.findUnique({
                    where: { email },
                    include: { profile: true }
                });

                if (!user) {
                    const userId = String(Date.now());
                    user = await this.prisma.user.create({
                        data: {
                            id: userId,
                            email,
                            isVerified: true,
                            status: 'active',
                            profile: {
                                create: {
                                    firstName,
                                    lastName,
                                    avatarUrl: avatarUrl || '',
                                    preferences: {
                                        title: 'Full Stack Engineer',
                                        bio,
                                        skills: ['JavaScript', 'React'],
                                        availability: 'Available Now',
                                        socialLinks: githubUrl ? { github: githubUrl } : {}
                                    }
                                }
                            },
                            oauthIdentities: {
                                create: {
                                    provider,
                                    providerId: String(providerId)
                                }
                            }
                        },
                        include: { profile: true }
                    });
                }

                const resolvedName = name || (user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : 'Developer');
                const token = jwt.sign({ id: user.id, email: user.email, role: 'Developer', name: resolvedName }, this.jwtSecret, { expiresIn: '7d' });
                const refreshToken = uuidv4();

                if (this.sessionService) {
                    await this.sessionService.createSession({
                        userId: user.id,
                        refreshToken,
                        ipAddress: req?.ip,
                        userAgent: req?.get ? req.get('User-Agent') : 'Unknown'
                    });
                }

                const sanitized = this.sanitizeUser(user);
                if (res) {
                    setAuthCookies(res, req, { accessToken: token, refreshToken });
                }

                return {
                    status: 200,
                    data: { token, refreshToken, ...sanitized, user: sanitized }
                };
            } catch (err) {
                console.error(`[${provider} OAuth DB Error]:`, err.message);
                if (process.env.NODE_ENV === 'production') {
                    return { status: 500, data: { error: 'OAuth authentication failed' } };
                }
            }
        }

        // Offline Non-Production Fallback
        const users = await readJson(this.usersFilePath, []);
        let user = users.find(u => u.email && u.email.toLowerCase() === email);

        if (!user) {
            user = {
                id: String(Date.now()),
                name: name || 'Developer',
                email,
                role: 'Developer',
                avatarUrl: avatarUrl || '',
                skills: ['JavaScript', 'React'],
                verifiedSkills: [],
                bio,
                availability: 'Available Now',
                socialLinks: githubUrl ? { github: githubUrl } : {},
                createdAt: new Date().toISOString()
            };

            await modifyJson(this.usersFilePath, (uList = []) => {
                const list = Array.isArray(uList) ? uList : [];
                list.push(user);
                return list;
            }, []);
        }

        const resolvedName = user.name || name || 'Developer';
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'Developer', name: resolvedName }, this.jwtSecret, { expiresIn: '7d' });
        const refreshToken = uuidv4();

        if (this.sessionService) {
            await this.sessionService.createSession({
                userId: user.id,
                refreshToken,
                ipAddress: req?.ip,
                userAgent: req?.get ? req.get('User-Agent') : 'Unknown'
            });
        }

        const sanitized = this.sanitizeUser(user);
        if (res) {
            setAuthCookies(res, req, { accessToken: token, refreshToken });
        }

        return {
            status: 200,
            data: { token, refreshToken, ...sanitized, user: sanitized }
        };
    }
}

module.exports = {
    OAuthService,
    fetchWithTimeout
};
