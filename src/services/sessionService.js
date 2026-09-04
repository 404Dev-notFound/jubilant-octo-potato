/*
 * CodeCollab Session Management Service
 * ----------------------------------------------------------------------
 * Provides session lifecycle management, token rotation, individual session
 * revocation, logout-all, and scoped user isolation across Prisma & file storage.
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readJson, modifyJson } = require('../storage/jsonStorage');

const SESSIONS_FILE = path.join(__dirname, '..', '..', 'codecollab data', 'sessions.json');

class SessionService {
    constructor(prismaClient, isDbConnectedFn, inMemoryStore) {
        this.prisma = prismaClient;
        this.isDbConnected = isDbConnectedFn;
        this.inMemoryStore = inMemoryStore; // Map: refreshToken -> userId
    }

    async createSession({ userId, refreshToken, ipAddress = null, userAgent = null, expiresInDays = 7 }) {
        const cleanUserId = String(userId);
        const cleanToken = String(refreshToken);
        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
        const sessionId = `sess_${Date.now()}_${uuidv4().substring(0, 8)}`;

        // Update in-memory quick-lookup
        if (this.inMemoryStore) {
            this.inMemoryStore.set(cleanToken, cleanUserId);
        }

        const sessionRecord = {
            id: sessionId,
            userId: cleanUserId,
            refreshToken: cleanToken,
            ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : '127.0.0.1',
            userAgent: userAgent ? String(userAgent).substring(0, 255) : 'Unknown Browser',
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString()
        };

        // Try Prisma DB first
        if (this.prisma && (await this.isDbConnected())) {
            try {
                await this.prisma.userSession.create({
                    data: {
                        id: sessionRecord.id,
                        userId: sessionRecord.userId,
                        refreshToken: sessionRecord.refreshToken,
                        ipAddress: sessionRecord.ipAddress,
                        userAgent: sessionRecord.userAgent,
                        expiresAt: new Date(sessionRecord.expiresAt),
                        createdAt: new Date(sessionRecord.createdAt)
                    }
                });
                return sessionRecord;
            } catch (err) {
                // If DB write fails, fall back to file storage
                console.warn('[SessionService DB Warning]:', err.message);
            }
        }

        // Atomic file fallback
        await modifyJson(SESSIONS_FILE, (sessions = []) => {
            const list = Array.isArray(sessions) ? sessions : [];
            list.push(sessionRecord);
            return list;
        }, []);

        return sessionRecord;
    }

    async listSessions(userId, currentRefreshToken = null) {
        const cleanUserId = String(userId);
        const now = new Date();

        if (this.prisma && (await this.isDbConnected())) {
            try {
                const dbSessions = await this.prisma.userSession.findMany({
                    where: {
                        userId: cleanUserId,
                        expiresAt: { gt: now }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                return dbSessions.map(s => ({
                    id: s.id,
                    ipAddress: s.ipAddress,
                    userAgent: s.userAgent,
                    createdAt: s.createdAt,
                    expiresAt: s.expiresAt,
                    isCurrent: Boolean(currentRefreshToken && s.refreshToken === currentRefreshToken)
                }));
            } catch (err) {
                console.warn('[SessionService List DB Warning]:', err.message);
            }
        }

        // File fallback
        const rawSessions = await readJson(SESSIONS_FILE, []);
        const validSessions = (Array.isArray(rawSessions) ? rawSessions : [])
            .filter(s => String(s.userId) === cleanUserId && new Date(s.expiresAt) > now)
            .map(s => ({
                id: s.id,
                ipAddress: s.ipAddress,
                userAgent: s.userAgent,
                createdAt: s.createdAt,
                expiresAt: s.expiresAt,
                isCurrent: Boolean(currentRefreshToken && s.refreshToken === currentRefreshToken)
            }));

        return validSessions;
    }

    async revokeSession(userId, sessionId) {
        const cleanUserId = String(userId);
        const cleanSessionId = String(sessionId);

        let targetRefreshToken = null;

        if (this.prisma && (await this.isDbConnected())) {
            try {
                const existing = await this.prisma.userSession.findFirst({
                    where: { id: cleanSessionId, userId: cleanUserId }
                });
                if (existing) {
                    targetRefreshToken = existing.refreshToken;
                    await this.prisma.userSession.delete({
                        where: { id: cleanSessionId }
                    });
                }
            } catch (err) {
                console.warn('[SessionService Revoke DB Warning]:', err.message);
            }
        }

        // File fallback cleanup
        await modifyJson(SESSIONS_FILE, (sessions = []) => {
            const list = Array.isArray(sessions) ? sessions : [];
            const idx = list.findIndex(s => String(s.id) === cleanSessionId && String(s.userId) === cleanUserId);
            if (idx !== -1) {
                if (!targetRefreshToken) targetRefreshToken = list[idx].refreshToken;
                list.splice(idx, 1);
            }
            return list;
        }, []);

        if (targetRefreshToken && this.inMemoryStore) {
            this.inMemoryStore.delete(targetRefreshToken);
        }

        return true;
    }

    async revokeByRefreshToken(refreshToken) {
        if (!refreshToken) return;
        const cleanToken = String(refreshToken);

        if (this.inMemoryStore) {
            this.inMemoryStore.delete(cleanToken);
        }

        if (this.prisma && (await this.isDbConnected())) {
            try {
                await this.prisma.userSession.deleteMany({
                    where: { refreshToken: cleanToken }
                });
            } catch {}
        }

        // File fallback
        await modifyJson(SESSIONS_FILE, (sessions = []) => {
            const list = Array.isArray(sessions) ? sessions : [];
            return list.filter(s => s.refreshToken !== cleanToken);
        }, []);
    }

    async revokeAllUserSessions(userId) {
        const cleanUserId = String(userId);

        // Find all refresh tokens for this user to clear in-memory store
        if (this.inMemoryStore) {
            for (const [token, uid] of this.inMemoryStore.entries()) {
                if (String(uid) === cleanUserId) {
                    this.inMemoryStore.delete(token);
                }
            }
        }

        if (this.prisma && (await this.isDbConnected())) {
            try {
                await this.prisma.userSession.deleteMany({
                    where: { userId: cleanUserId }
                });
            } catch {}
        }

        // File fallback
        await modifyJson(SESSIONS_FILE, (sessions = []) => {
            const list = Array.isArray(sessions) ? sessions : [];
            return list.filter(s => String(s.userId) !== cleanUserId);
        }, []);
    }

    async findUserIdByRefreshToken(refreshToken) {
        if (!refreshToken) return null;
        const cleanToken = String(refreshToken);

        // Check memory store
        if (this.inMemoryStore && this.inMemoryStore.has(cleanToken)) {
            return String(this.inMemoryStore.get(cleanToken));
        }

        const now = new Date();

        // Check Prisma
        if (this.prisma && (await this.isDbConnected())) {
            try {
                const session = await this.prisma.userSession.findUnique({
                    where: { refreshToken: cleanToken }
                });
                if (session && session.expiresAt > now) {
                    if (this.inMemoryStore) this.inMemoryStore.set(cleanToken, session.userId);
                    return String(session.userId);
                }
            } catch {}
        }

        // Check File
        try {
            const sessions = await readJson(SESSIONS_FILE, []);
            const session = sessions.find(s => s.refreshToken === cleanToken && new Date(s.expiresAt) > now);
            if (session) {
                if (this.inMemoryStore) this.inMemoryStore.set(cleanToken, session.userId);
                return String(session.userId);
            }
        } catch {}

        return null;
    }
}

module.exports = {
    SessionService
};
