/*
 * CodeCollab Centralized Frontend Session Manager (Phase 11)
 * ---------------------------------------------------------
 * Safely reads, writes, and updates session state in localStorage.
 * Handles missing/malformed JSON, token rotation, and non-destructive profile merges.
 */

(function () {
    const STORAGE_KEY = 'currentUser';

    function sanitizeForStorage(data) {
        if (!data || typeof data !== 'object') return null;
        const copy = { ...data };
        // Sensitive rotating refresh tokens and credentials are held exclusively in HttpOnly cookies
        delete copy.refreshToken;
        delete copy.password;
        delete copy.passwordHash;
        if (copy.user && typeof copy.user === 'object') {
            copy.user = { ...copy.user };
            delete copy.user.refreshToken;
            delete copy.user.password;
            delete copy.user.passwordHash;
        }
        return copy;
    }

    function getSession() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (e) {
            console.warn('[Session] Failed to parse session data from localStorage, resetting corrupted state.', e);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }

    function setSession(sessionData) {
        try {
            if (!sessionData || typeof sessionData !== 'object') {
                clearSession();
                return;
            }
            const sanitized = sanitizeForStorage(sessionData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        } catch (e) {
            console.error('[Session] Failed to persist session data:', e);
        }
    }

    function clearSession() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('[Session] Error clearing session:', e);
        }
    }

    function isAuthenticated() {
        const sess = getSession();
        return Boolean(sess && (sess.id || sess.user?.id || sess.token || sess.accessToken));
    }

    function getAuthToken() {
        const sess = getSession();
        return sess?.token || sess?.accessToken || null;
    }

    function getRefreshToken() {
        // Refresh token is strictly managed via HttpOnly cookies
        return null;
    }

    function updateTokens(newAccessToken, newRefreshToken = null) {
        const sess = getSession() || {};
        sess.token = newAccessToken;
        // Do not store newRefreshToken in localStorage
        setSession(sess);
    }

    function updateProfileInSession(partialProfile) {
        const sess = getSession();
        if (!sess) return null;

        // Preserve credentials and token pair while merging profile updates
        const preservedToken = sess.token;

        const currentProfile = sess.user || sess.profile || sess;
        const updatedProfile = {
            ...currentProfile,
            ...partialProfile
        };

        const updatedSession = {
            ...sess,
            ...partialProfile,
            user: updatedProfile,
            profile: updatedProfile,
            token: preservedToken
        };

        setSession(updatedSession);
        return updatedSession;
    }

    window.Session = {
        getSession,
        setSession,
        clearSession,
        isAuthenticated,
        getAuthToken,
        getRefreshToken,
        updateTokens,
        updateProfileInSession
    };
})();
