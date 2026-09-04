const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml)
    ? window.escapeHtml
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

/**
 * Obfuscates an IP address to prevent shoulder-surfing and sensitive location leakage.
 * Example: 192.168.1.100 -> 192.168.1.x
 */
export function coarseIp(ip) {
    if (!ip || typeof ip !== 'string') return 'Unknown IP';
    const trimmed = ip.trim();
    if (trimmed.includes('.')) {
        const parts = trimmed.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
        }
    }
    if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        return `${parts.slice(0, 3).join(':')}:xxxx`;
    }
    return 'Masked IP';
}

/**
 * Translates raw User-Agent strings into safe, human-readable device labels,
 * completely neutralizing reflected string injection into the DOM.
 */
export function describeClient(ua) {
    if (!ua || typeof ua !== 'string') return 'Unknown Device';
    const u = ua.toLowerCase();

    let browser = 'Browser';
    if (u.includes('edg/') || u.includes('edge/')) browser = 'Microsoft Edge';
    else if (u.includes('chrome/') || u.includes('crios/')) browser = 'Google Chrome';
    else if (u.includes('firefox/') || u.includes('fxios/')) browser = 'Mozilla Firefox';
    else if (u.includes('safari/') && !u.includes('chrome')) browser = 'Apple Safari';
    else if (u.includes('opera/') || u.includes('opr/')) browser = 'Opera';

    let os = 'Unknown OS';
    if (u.includes('iphone') || u.includes('ipad') || u.includes('ipod')) os = 'iOS';
    else if (u.includes('android')) os = 'Android';
    else if (u.includes('windows')) os = 'Windows';
    else if (u.includes('macintosh') || u.includes('mac os')) os = 'macOS';
    else if (u.includes('linux')) os = 'Linux';

    return `${browser} on ${os}`;
}

export function render_security() {
    return `
<main class="relative w-full max-w-[1000px] mx-auto p-4 md:p-8 flex flex-col min-h-screen pt-6 animate-fade-in-up text-on-surface">
    <!-- Header -->
    <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-1">
            <span class="material-symbols-outlined text-[16px]">shield</span>
            Security Center
        </div>
        <h1 class="font-display font-bold text-3xl md:text-4xl text-on-surface">
            Account & Session Security
        </h1>
        <p class="text-sm text-on-surface-variant mt-1">
            Manage your active authentication sessions, connected devices, and cryptographic credentials.
        </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Column: Active Sessions -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Active Sessions Card -->
            <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="font-bold text-lg text-on-surface flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[22px]">devices</span>
                            Active Sessions & Devices
                        </h2>
                        <p class="text-xs text-on-surface-variant mt-0.5">
                            Devices currently logged into your CodeCollab account.
                        </p>
                    </div>
                    <button id="revoke-all-sessions-btn" class="px-3 py-1.5 rounded-xl bg-error/15 text-error hover:bg-error hover:text-white border border-error/30 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-[16px]">logout</span>
                        Sign Out Everywhere
                    </button>
                </div>

                <div id="active-sessions-container" class="space-y-3 pt-2">
                    <div class="animate-pulse bg-surface-container-low h-16 rounded-xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-16 rounded-xl border border-white/5"></div>
                </div>
            </div>

            <!-- Change Password Card -->
            <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div>
                    <h2 class="font-bold text-lg text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary text-[22px]">lock_reset</span>
                        Update Password
                    </h2>
                    <p class="text-xs text-on-surface-variant mt-0.5">
                        Ensure your account uses a strong password of at least 6 characters.
                    </p>
                </div>

                <form id="changePasswordForm" class="space-y-4 pt-1">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Current Password</label>
                        <input type="password" name="currentPassword" required placeholder="••••••••" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">New Password</label>
                            <input type="password" name="newPassword" minlength="6" required placeholder="At least 6 characters" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Confirm New Password</label>
                            <input type="password" name="confirmPassword" minlength="6" required placeholder="Repeat new password" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors">
                        </div>
                    </div>

                    <div class="flex justify-end pt-2">
                        <button type="submit" class="px-5 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-transform flex items-center gap-2 cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">key</span>
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Sidebar Column: Security Status Overview -->
        <div class="space-y-6">
            <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 class="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
                    Security Protections
                </h3>

                <ul class="space-y-3 text-xs text-on-surface-variant">
                    <li class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-secondary text-[16px] mt-0.5">check_circle</span>
                        <span><strong>15-Minute Access Tokens:</strong> Short-lived JWTs limit unauthorized session window.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-secondary text-[16px] mt-0.5">check_circle</span>
                        <span><strong>Single-Flight Refresh:</strong> Automated token rotation without racing multiple requests.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-secondary text-[16px] mt-0.5">check_circle</span>
                        <span><strong>Coarse IP Shielding:</strong> Device IP addresses are masked to prevent physical privacy leaks.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-secondary text-[16px] mt-0.5">check_circle</span>
                        <span><strong>Strict CSP:</strong> Inline script execution is blocked to safeguard session integrity.</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</main>
`;
}

export async function initSecurity() {
    const session = (window.Session && window.Session.getSession) ? window.Session.getSession() : null;
    if (!session || !session.token) {
        window.UI.showToast('Please sign in to access the Security Center', 'error');
        window.location.hash = 'home';
        return;
    }

    const container = document.getElementById('active-sessions-container');
    const revokeAllBtn = document.getElementById('revoke-all-sessions-btn');
    const changePasswordForm = document.getElementById('changePasswordForm');

    // 1. Fetch and render active sessions
    async function loadSessions() {
        if (!container) return;
        try {
            const res = await window.apiFetch('/api/auth/sessions');
            if (!res.ok) {
                container.innerHTML = `<div class="p-4 rounded-xl bg-surface-container text-xs text-on-surface-variant text-center">Unable to load active sessions.</div>`;
                return;
            }
            const data = await res.json();
            const sessions = Array.isArray(data.sessions) ? data.sessions : [];

            if (sessions.length === 0) {
                container.innerHTML = `<div class="p-4 rounded-xl bg-surface-container text-xs text-on-surface-variant text-center">No active sessions found.</div>`;
                return;
            }

            container.innerHTML = sessions.map(s => {
                const isCurrent = Boolean(s.isCurrent);
                const clientDesc = describeClient(s.userAgent);
                const maskedIp = coarseIp(s.ipAddress);
                const createdDate = s.createdAt ? new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

                return `
                <div class="p-4 rounded-xl bg-surface-container border border-white/5 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl ${isCurrent ? 'bg-primary/20 text-primary' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[20px]">${isCurrent ? 'laptop_chromebook' : 'devices_other'}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-on-surface truncate">${escapeHtml(clientDesc)}</span>
                                ${isCurrent ? '<span class="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold tracking-wider uppercase border border-primary/30">Current</span>' : ''}
                            </div>
                            <div class="text-xs text-on-surface-variant font-mono mt-0.5">
                                IP: ${escapeHtml(maskedIp)} • Signed in: ${escapeHtml(createdDate)}
                            </div>
                        </div>
                    </div>

                    <div>
                        ${isCurrent ? '' : `
                        <button data-revoke-id="${escapeHtml(s.id)}" class="revoke-session-btn px-3 py-1.5 rounded-lg bg-surface-variant hover:bg-error/20 hover:text-error text-xs font-bold text-on-surface-variant transition-colors flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">close</span>
                            Revoke
                        </button>
                        `}
                    </div>
                </div>
                `;
            }).join('');

            // Attach event listeners to individual revoke buttons
            container.querySelectorAll('.revoke-session-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = btn.getAttribute('data-revoke-id');
                    if (!id) return;
                    btn.disabled = true;
                    try {
                        const delRes = await window.apiFetch(`/api/auth/sessions/${encodeURIComponent(id)}`, {
                            method: 'DELETE'
                        });
                        if (delRes.ok) {
                            window.UI.showToast('Session revoked successfully', 'success');
                            loadSessions();
                        } else {
                            window.UI.showToast('Failed to revoke session', 'error');
                            btn.disabled = false;
                        }
                    } catch (err) {
                        window.UI.showToast('Error revoking session', 'error');
                        btn.disabled = false;
                    }
                });
            });
        } catch (err) {
            console.error('Error loading sessions:', err);
            container.innerHTML = `<div class="p-4 rounded-xl bg-surface-container text-xs text-error text-center">Failed to load sessions.</div>`;
        }
    }

    await loadSessions();

    // 2. Revoke all sessions handler
    if (revokeAllBtn) {
        revokeAllBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to sign out all other devices?')) return;
            try {
                const res = await window.apiFetch('/api/auth/logout-all', { method: 'POST' });
                if (res.ok) {
                    window.UI.showToast('All other sessions revoked successfully', 'success');
                    loadSessions();
                } else {
                    window.UI.showToast('Failed to revoke sessions', 'error');
                }
            } catch (err) {
                window.UI.showToast('Error revoking sessions', 'error');
            }
        });
    }

    // 3. Password change form handler
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(changePasswordForm);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            if (newPassword !== confirmPassword) {
                window.UI.showToast('New passwords do not match', 'error');
                return;
            }

            try {
                const res = await window.apiFetch('/api/auth/change-password', {
                    method: 'POST',
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    changePasswordForm.reset();
                    if (data.token && window.Session && window.Session.updateTokens) {
                        window.Session.updateTokens(data.token, data.refreshToken);
                    }
                    window.UI.showToast('Password updated successfully! All other devices signed out.', 'success');
                    loadSessions();
                } else {
                    window.UI.showToast(data.error || 'Failed to update password', 'error');
                }
            } catch (err) {
                window.UI.showToast('Network error while updating password', 'error');
            }
        });
    }
}
