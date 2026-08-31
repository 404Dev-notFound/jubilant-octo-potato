const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_leaderboard() {
    return `
<main class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span class="material-symbols-outlined text-[14px]">leaderboard</span>
                Community Standings
            </div>
            <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Developer & Guild Rankings</h1>
            <p class="text-on-surface-variant text-sm md:text-base mt-1 max-w-2xl">
                Recognizing top contributors, maintainers, and guilds building high-impact open source software on CodeCollab.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <a href="#community" class="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">how_to_reg</span> Join Community
            </a>
        </div>
    </div>

    <!-- Leaderboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Top Developers Column (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
            <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div class="flex items-center justify-between pb-4 border-b border-white/5">
                    <h3 class="font-bold text-lg text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">military_tech</span> Top Contributors
                    </h3>
                    <span class="text-xs font-mono text-on-surface-variant">Ranked by Community Upvotes & Activity</span>
                </div>

                <div id="leaderboard-developers-list" class="space-y-3">
                    <div class="animate-pulse bg-surface-container-low h-16 rounded-xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-16 rounded-xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-16 rounded-xl border border-white/5"></div>
                </div>
            </div>
        </div>

        <!-- Guilds Column (1 col) -->
        <div class="space-y-6">
            <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div class="flex items-center justify-between pb-4 border-b border-white/5">
                    <h3 class="font-bold text-lg text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary">groups</span> Top Guilds
                    </h3>
                </div>

                <div id="leaderboard-guilds-list" class="space-y-3">
                    <div class="animate-pulse bg-surface-container-low h-16 rounded-xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-16 rounded-xl border border-white/5"></div>
                </div>
            </div>
        </div>
    </div>
</main>
`;
}

export async function initLeaderboard() {
    const devContainer = document.getElementById('leaderboard-developers-list');
    const guildContainer = document.getElementById('leaderboard-guilds-list');

    // Fetch Developers
    if (devContainer) {
        try {
            const res = await window.apiFetch('/api/users');
            if (res.ok) {
                const users = await res.json();
                const sorted = users.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

                if (sorted.length === 0) {
                    devContainer.innerHTML = `<div class="p-6 text-center text-xs text-on-surface-variant">No developers registered yet.</div>`;
                } else {
                    devContainer.innerHTML = sorted.map((u, index) => {
                        const rank = index + 1;
                        const rankBadge = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));
                        const initial = (u.name ? u.name.charAt(0) : 'U').toUpperCase();

                        return `
                        <div class="p-4 bg-surface-container-low/80 hover:bg-surface-container rounded-xl border border-white/5 flex items-center justify-between gap-4 transition-all group">
                            <div class="flex items-center gap-3.5 min-w-0">
                                <div class="w-8 text-center font-mono font-bold text-sm text-on-surface-variant">${rankBadge}</div>
                                <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                                    ${initial}
                                </div>
                                <div class="min-w-0">
                                    <div class="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">${escapeHtml(u.name || 'Developer')}</div>
                                    <div class="text-xs text-on-surface-variant truncate">${escapeHtml(u.title || 'Software Engineer')}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 shrink-0">
                                <span class="px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-mono font-bold flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[14px]">thumb_up</span> ${u.upvotes || 0}
                                </span>
                            </div>
                        </div>`;
                    }).join('');
                }
            }
        } catch (e) {
            console.warn('Error loading leaderboard developers:', e);
            if (devContainer) devContainer.innerHTML = `<div class="p-4 text-xs text-error">Failed to load developer standings.</div>`;
        }
    }

    // Fetch Guilds
    if (guildContainer) {
        try {
            const res = await window.apiFetch('/api/teams');
            if (res.ok) {
                const teams = await res.json();
                const sortedTeams = teams.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

                if (sortedTeams.length === 0) {
                    guildContainer.innerHTML = `<div class="p-6 text-center text-xs text-on-surface-variant">No active guilds yet.</div>`;
                } else {
                    guildContainer.innerHTML = sortedTeams.map((t, index) => {
                        const rank = index + 1;
                        return `
                        <div class="p-4 bg-surface-container-low/80 hover:bg-surface-container rounded-xl border border-white/5 flex items-center justify-between gap-3 transition-all">
                            <div class="flex items-center gap-3 min-w-0">
                                <span class="font-mono text-xs font-bold text-secondary">#${rank}</span>
                                <div class="min-w-0">
                                    <div class="font-bold text-xs text-on-surface truncate">${escapeHtml(t.teamName || 'Guild')}</div>
                                    <div class="text-[11px] text-on-surface-variant truncate">${t.membersCount || 1} members</div>
                                </div>
                            </div>
                            <span class="text-xs font-mono font-bold text-secondary">★ ${t.rating || '4.9'}</span>
                        </div>`;
                    }).join('');
                }
            }
        } catch (e) {
            console.warn('Error loading leaderboard guilds:', e);
            if (guildContainer) guildContainer.innerHTML = `<div class="p-4 text-xs text-error">Failed to load guild standings.</div>`;
        }
    }
}
