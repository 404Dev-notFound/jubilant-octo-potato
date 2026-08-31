const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_team_collaboration() {
    return `
<main class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Guild Collaboration
            </div>
            <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Team Collaboration & Guilds</h1>
            <p class="text-on-surface-variant text-sm md:text-base mt-1 max-w-2xl">
                Collaborate with specialized developer squads, manage member rosters, and coordinate cross-repository sprints.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <button data-form="create_team_form" class="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer">
                <span class="material-symbols-outlined text-[16px]">add_circle</span> Form New Guild
            </button>
        </div>
    </div>

    <!-- Active Teams Grid -->
    <div id="team-collab-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
        <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
        <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
    </div>
</main>
`;
}

export async function initTeam_collaboration() {
    const container = document.getElementById('team-collab-grid');
    if (!container) return;

    try {
        const res = await window.apiFetch('/api/teams');
        if (!res.ok) throw new Error('Failed to fetch teams');
        const teams = await res.json();

        if (teams.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-16 text-center bg-surface-container-low/30 rounded-2xl border border-white/5 space-y-3">
                    <span class="material-symbols-outlined text-[48px] text-on-surface-variant">group_off</span>
                    <div class="text-base font-bold text-on-surface">No Teams Registered Yet</div>
                    <p class="text-xs text-on-surface-variant">Be the first to form an engineering guild on CodeCollab.</p>
                    <button data-form="create_team_form" class="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs">Create First Guild</button>
                </div>
            `;
            return;
        }

        container.innerHTML = teams.map(t => {
            const skills = Array.isArray(t.skills) ? t.skills : [];
            const skillsBadges = skills.slice(0, 4).map(s => `
                <span class="px-2 py-0.5 rounded-md bg-surface-container text-[11px] font-mono text-on-surface-variant border border-white/5">
                    ${escapeHtml(s)}
                </span>
            `).join('');

            return `
            <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/40 transition-all">
                <div>
                    <div class="flex items-start justify-between gap-3 mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center font-bold text-lg text-primary shrink-0">
                                <span class="material-symbols-outlined text-[24px]">diversity_3</span>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                                    ${escapeHtml(t.teamName || 'Engineering Guild')}
                                </h3>
                                <div class="text-xs text-on-surface-variant mt-0.5">
                                    Lead: <strong class="text-on-surface">${escapeHtml(t.leadName || 'Maintainer')}</strong>
                                </div>
                            </div>
                        </div>
                        <span class="px-2.5 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant border border-white/5">
                            ${t.membersCount || 1} members
                        </span>
                    </div>

                    <p class="text-xs text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">
                        ${escapeHtml(t.description || 'Open source engineering squad on CodeCollab.')}
                    </p>

                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${skillsBadges}
                    </div>
                </div>

                <div class="pt-4 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <span class="text-on-surface-variant font-mono">⭐ ${t.rating || '5.0'} Rating</span>
                    <button data-form="join_team_form" data-team-id="${t.id}" data-team-name="${escapeHtml(t.teamName)}" class="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/20">
                        Join Guild
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('Error fetching teams for collaboration view:', err);
        container.innerHTML = `<div class="col-span-full p-8 text-center text-xs text-error">Failed to load teams.</div>`;
    }
}
