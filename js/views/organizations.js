/*
 * Organizations View for CodeCollab
 * Explore developer organizations, guilds, and collective labs.
 */

export function render_organizations() {
    return `
<main class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-widest mb-3">
                <span class="w-2 h-2 rounded-full bg-secondary"></span>
                Ecosystem Alliances
            </div>
            <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">
                Developer Organizations & Guilds
            </h1>
            <p class="text-on-surface-variant text-base mt-2 max-w-2xl">
                Join verified organizations, collaborate across shared repositories, and build institutional open-source products.
            </p>
        </div>

        <button data-form="create_org_form" class="px-5 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-secondary/25 flex items-center gap-2 text-sm">
            <span class="material-symbols-outlined text-[18px]">domain_add</span> Create Organization
        </button>
    </div>

    <!-- Organizations Grid Container -->
    <div id="orgs-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Skeleton Slices -->
        <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
        <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
        <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
    </div>
</main>
`;
}

export async function initOrganizations() {
    const container = document.getElementById('orgs-grid-container');
    if (!container) return;

    try {
        const res = await window.apiFetch('/api/organizations');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const orgs = await res.json();

        if (orgs.length === 0) {
            container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-surface-container-low/30 rounded-3xl border border-white/5 space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
                    <span class="material-symbols-outlined text-[32px]">corporate_fare</span>
                </div>
                <div class="text-lg font-bold text-on-surface">No Organizations Registered Yet</div>
                <p class="text-xs md:text-sm text-on-surface-variant max-w-md mx-auto">
                    Be the first to build a guild or collective on CodeCollab.
                </p>
                <button data-form="create_org_form" class="px-5 py-2.5 bg-secondary text-on-secondary text-xs font-bold rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 transition-all">
                    Create First Organization
                </button>
            </div>`;
            return;
        }

        container.innerHTML = orgs.map(org => {
            const owner = org.owner || {};
            const tagsBadges = (org.tags || []).map(t => `
                <span class="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-lg text-xs font-medium border border-white/5">
                    ${t}
                </span>
            `).join('');

            return `
            <div class="magic-bento-card rounded-2xl p-6 flex flex-col justify-between group hover:border-secondary/30 transition-all cursor-pointer">
                <div>
                    <!-- Top Bar -->
                    <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3.5">
                            <div class="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center font-bold text-lg text-secondary overflow-hidden shrink-0">
                                ${org.logo ? `<img src="${org.logo}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                                <span class="material-symbols-outlined text-[24px]" style="${org.logo ? 'display:none;' : ''}">domain</span>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-on-surface group-hover:text-secondary transition-colors">
                                    ${org.name}
                                </h3>
                                <div class="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                                    <span>Owner: <strong class="text-on-surface">${owner.name || 'Maintainer'}</strong></span>
                                </div>
                            </div>
                        </div>

                        <span class="px-2.5 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant border border-white/5">
                            ${org.membersCount || 1} members
                        </span>
                    </div>

                    <!-- Description -->
                    <p class="text-xs md:text-sm text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">
                        ${org.description || 'Open source engineering alliance on CodeCollab.'}
                    </p>

                    <!-- Tags -->
                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${tagsBadges}
                    </div>
                </div>

                <!-- Footer & Actions -->
                <div class="pt-4 border-t border-white/5 flex items-center justify-between gap-2 mt-2 text-xs">
                    <div class="flex items-center gap-2">
                        ${org.website ? `<a href="${org.website}" target="_blank" class="p-2 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary transition-colors border border-white/5" title="Website"><span class="material-symbols-outlined text-[16px]">language</span></a>` : ''}
                        ${org.githubUrl ? `<a href="${org.githubUrl}" target="_blank" class="p-2 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary transition-colors border border-white/5" title="GitHub"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg></a>` : ''}
                    </div>

                    <button class="px-3.5 py-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-on-secondary rounded-xl font-bold transition-all flex items-center gap-1">
                        View Guild
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('Error fetching organizations:', err);
        container.innerHTML = `
        <div class="col-span-full py-12 text-center bg-surface-container-low/30 rounded-2xl border border-white/5 space-y-3">
            <span class="material-symbols-outlined text-[48px] text-error">error</span>
            <div class="text-base font-bold text-on-surface">Failed to load organizations</div>
            <p class="text-xs text-on-surface-variant">${err.message || 'Please check your connection and try again.'}</p>
        </div>`;
    }
}
