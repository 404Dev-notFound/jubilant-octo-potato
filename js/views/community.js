/*
 * Community View for CodeCollab
 * Matchmaking platform for developers to find coding mates, discover teams,
 * follow peers, and collaborate on open-source projects.
 */

export function render_community() {
    return `
    <main class="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-6 pb-24 text-on-surface">
        
        <!-- Hero Header -->
        <section class="relative rounded-3xl p-6 md:p-10 mb-8 overflow-hidden bg-gradient-to-br from-surface-container-high/80 via-surface-container/60 to-surface-container-lowest/90 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div class="absolute -right-20 -top-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-20 -bottom-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div class="max-w-3xl">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-3">
                        <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                        Developer Matchmaking & Teams
                    </div>
                    <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight leading-tight">
                        Find Coding Mates, Discover Teams, <br class="hidden sm:inline">
                        <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">and Grow Together</span>
                    </h1>
                    <p class="text-on-surface-variant text-base md:text-lg mt-3 max-w-2xl leading-relaxed">
                        Connect with verified developers, discover teams actively looking for talent, explore open roles, and form unstoppable open-source alliances.
                    </p>
                </div>
                
                <!-- Quick Stats Badge Cloud -->
                <div class="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                    <div class="flex items-center gap-3 px-4 py-2.5 bg-surface-container/80 border border-white/5 rounded-2xl">
                        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <span class="material-symbols-outlined text-[20px]">groups</span>
                        </div>
                        <div>
                            <div id="stat-community-teams" class="text-xl font-bold text-on-surface">4+</div>
                            <div class="text-xs text-on-surface-variant font-medium">Active Teams</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 px-4 py-2.5 bg-surface-container/80 border border-white/5 rounded-2xl">
                        <div class="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                            <span class="material-symbols-outlined text-[20px]">person_search</span>
                        </div>
                        <div>
                            <div id="stat-community-devs" class="text-xl font-bold text-on-surface">150+</div>
                            <div class="text-xs text-on-surface-variant font-medium">Coding Mates</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Search Bar inside Hero -->
            <div class="relative mt-8 max-w-3xl">
                <div class="relative flex items-center bg-surface-container-lowest/90 border border-white/10 rounded-2xl p-2 shadow-inner focus-within:border-primary/50 transition-all">
                    <span class="material-symbols-outlined pl-3 pr-2 text-on-surface-variant text-[22px]">search</span>
                    <input id="community-search-input" type="text" placeholder="Search by name, skill (e.g. React, Rust, Python), team, or role..." class="w-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/60 text-sm md:text-base py-2">
                    <button id="community-clear-search" class="hidden text-xs px-2.5 py-1 text-on-surface-variant hover:text-on-surface bg-white/5 rounded-lg mr-2 transition-colors">Clear</button>
                    <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-xl border border-white/5 text-xs text-on-surface-variant font-mono">
                        <span>⌘</span><span>K</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Navigation Tabs & Filter Bar -->
        <section class="mb-8 space-y-4">
            <!-- Tabs -->
            <div class="flex items-center justify-between border-b border-white/10 pb-2 overflow-x-auto no-scrollbar gap-4">
                <div class="flex items-center gap-2 shrink-0" id="community-tabs">
                    <button data-tab="all" class="community-tab-btn px-4 py-2 rounded-xl text-sm font-bold transition-all bg-primary text-on-primary shadow-lg shadow-primary/20 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">explore</span> All Hub
                    </button>
                    <button data-tab="teams" class="community-tab-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">groups</span> Teams & Guilds
                        <span id="tab-count-teams" class="px-2 py-0.5 text-xs rounded-full bg-surface-container-highest text-on-surface-variant">4</span>
                    </button>
                    <button data-tab="developers" class="community-tab-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">person</span> Developers
                        <span id="tab-count-devs" class="px-2 py-0.5 text-xs rounded-full bg-surface-container-highest text-on-surface-variant">7</span>
                    </button>
                    <button data-tab="looking-for" class="community-tab-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">handshake</span> Looking for Mates
                        <span id="tab-count-match" class="px-2 py-0.5 text-xs rounded-full bg-surface-container-highest text-on-surface-variant">4</span>
                    </button>
                </div>

                <!-- Action Shortcut -->
                <div class="shrink-0 flex items-center gap-2">
                    <button id="btn-post-looking-for" class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-white/10 rounded-xl text-xs font-bold transition-all hover:scale-105">
                        <span class="material-symbols-outlined text-[16px] text-tertiary">add_circle</span> Post Looking-For
                    </button>
                </div>
            </div>

            <!-- Compact Filter Controls -->
            <div class="bg-surface-container-low/60 border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                <div class="flex flex-wrap items-center gap-3">
                    <!-- Looking For filter -->
                    <div class="flex items-center gap-2">
                        <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Looking For:</label>
                        <select id="filter-looking-for" class="bg-surface-container border border-white/10 rounded-xl px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary/50 cursor-pointer">
                            <option value="all">All Roles</option>
                            <option value="frontend">Frontend Dev</option>
                            <option value="backend">Backend Dev</option>
                            <option value="fullstack">Fullstack Dev</option>
                            <option value="ai">AI / ML Engineer</option>
                            <option value="devops">DevOps / Cloud</option>
                            <option value="rust">Rust Specialist</option>
                        </select>
                    </div>

                    <!-- Skills filter -->
                    <div class="flex items-center gap-2">
                        <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Skill:</label>
                        <select id="filter-skills" class="bg-surface-container border border-white/10 rounded-xl px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary/50 cursor-pointer">
                            <option value="all">All Technologies</option>
                            <option value="react">React</option>
                            <option value="typescript">TypeScript</option>
                            <option value="rust">Rust</option>
                            <option value="python">Python</option>
                            <option value="go">Go</option>
                            <option value="three.js">Three.js</option>
                            <option value="kubernetes">Kubernetes</option>
                            <option value="fastapi">FastAPI</option>
                        </select>
                    </div>

                    <!-- Availability filter -->
                    <div class="flex items-center gap-2">
                        <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Availability:</label>
                        <select id="filter-availability" class="bg-surface-container border border-white/10 rounded-xl px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary/50 cursor-pointer">
                            <option value="all">All Statuses</option>
                            <option value="available">Available Now</option>
                            <option value="part-time">Part-time</option>
                            <option value="weekends">Weekends</option>
                            <option value="collab">Open for Collab</option>
                        </select>
                    </div>

                    <!-- Verified Skills Toggle -->
                    <button id="toggle-verified-only" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold transition-all bg-surface-container text-on-surface-variant hover:border-tertiary/50">
                        <span class="material-symbols-outlined text-[16px] text-tertiary">verified</span>
                        <span>Verified Skills Only</span>
                    </button>
                </div>

                <!-- Sort Control -->
                <div class="flex items-center gap-2 ml-auto">
                    <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">swap_vert</span> Sort:
                    </label>
                    <select id="sort-by-select" class="bg-surface-container border border-white/10 rounded-xl px-3 py-1.5 text-xs text-on-surface font-semibold outline-none focus:border-primary/50 cursor-pointer">
                        <option value="upvoted">🔥 Most Upvoted</option>
                        <option value="relevant">🎯 Most Relevant</option>
                        <option value="active">⚡ Most Active</option>
                        <option value="newest">✨ Newest</option>
                    </select>
                </div>
            </div>
        </section>

        <!-- Community Content Sections Container -->
        <div id="community-sections-container" class="space-y-12">
            
            <!-- SECTION 1: TEAMS & GUILDS -->
            <section id="section-teams" class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold font-display text-on-surface flex items-center gap-2.5">
                            <span class="w-3 h-3 rounded-full bg-primary"></span>
                            Discoverable Teams & Guilds
                        </h2>
                        <p class="text-sm text-on-surface-variant mt-0.5">Explore active teams building impactful open-source projects and looking for collaborators.</p>
                    </div>
                    <button data-action="filter-tab" data-target="teams" class="text-xs text-primary hover:underline font-semibold">View All Teams →</button>
                </div>

                <div id="teams-grid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Teams cards will be injected here -->
                    <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
                </div>
            </section>

            <!-- SECTION 2: LOOKING FOR A CODING MATE (Matchmaking Feed) -->
            <section id="section-looking-for" class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold font-display text-on-surface flex items-center gap-2.5">
                            <span class="w-3 h-3 rounded-full bg-tertiary"></span>
                            Looking for a Coding Mate
                        </h2>
                        <p class="text-sm text-on-surface-variant mt-0.5">Direct matchmaking requests from developers actively seeking partners for specific repos & sprints.</p>
                    </div>
                    <button data-action="filter-tab" data-target="looking-for" class="text-xs text-tertiary hover:underline font-semibold">View All Match Requests →</button>
                </div>

                <div id="looking-for-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Matchmaking cards will be injected here -->
                    <div class="animate-pulse bg-surface-container-low h-48 rounded-2xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-48 rounded-2xl border border-white/5"></div>
                </div>
            </section>

            <!-- SECTION 3: DEVELOPERS & CODING MATES -->
            <section id="section-developers" class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold font-display text-on-surface flex items-center gap-2.5">
                            <span class="w-3 h-3 rounded-full bg-secondary"></span>
                            Developers & Coding Mates
                        </h2>
                        <p class="text-sm text-on-surface-variant mt-0.5">Discover verified engineers, follow inspiring builders, and expand your coding circle.</p>
                    </div>
                    <button data-action="filter-tab" data-target="developers" class="text-xs text-secondary hover:underline font-semibold">View All Developers →</button>
                </div>

                <div id="developers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Developer cards will be injected here -->
                    <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-64 rounded-2xl border border-white/5"></div>
                </div>
            </section>

        </div>

        <!-- Empty Results State (Hidden by default) -->
        <div id="community-empty-state" class="hidden py-16 text-center bg-surface-container-low/40 rounded-3xl border border-white/5 my-8">
            <span class="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-3 block">search_off</span>
            <h3 class="text-xl font-bold text-on-surface">No matching results found</h3>
            <p class="text-sm text-on-surface-variant max-w-md mx-auto mt-1">Try adjusting your search terms, removing filters, or toggling off the Verified Skills constraint.</p>
            <button id="btn-reset-filters" class="mt-4 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:scale-105 transition-transform">Reset All Filters</button>
        </div>

    </main>

    <!-- JOIN TEAM MODAL -->
    <div id="join-team-modal" class="hidden fixed inset-0 z-50 items-center justify-center bg-black/70 backdrop-blur-md p-4" style="display: none;">
        <div class="bg-surface-container-high border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button id="close-join-modal" type="button" class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-white/5 transition-colors">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                    <span class="material-symbols-outlined">group_add</span>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-on-surface" id="join-modal-team-name">Join Team</h3>
                    <p class="text-xs text-on-surface-variant">Request will be sent directly to the team leader</p>
                </div>
            </div>
            
            <form id="join-team-form" class="space-y-4">
                <input type="hidden" id="join-modal-team-id" value="">
                
                <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Target Position / Role</label>
                    <input id="join-modal-position" type="text" placeholder="e.g. Frontend Developer, Rust Backend Specialist" class="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-3.5 py-2 text-sm text-on-surface outline-none focus:border-primary/50" required>
                </div>
                
                <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Message to Team Lead</label>
                    <textarea id="join-modal-message" rows="4" placeholder="Introduce yourself, your primary skills, and why you would love to collaborate on their projects..." class="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-3.5 py-2 text-sm text-on-surface outline-none focus:border-primary/50 resize-none" required></textarea>
                </div>
                
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="cancel-join-btn" class="px-4 py-2 bg-surface-container rounded-xl text-sm font-semibold hover:bg-surface-variant transition-colors">Cancel</button>
                    <button type="submit" id="submit-join-btn" class="px-5 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:scale-105 transition-transform flex items-center gap-1.5 shadow-lg shadow-primary/25">
                        <span class="material-symbols-outlined text-[18px]">send</span> Send Request
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

// ----------------------------------------------------------------------------
// Community Interactive Controller
// ----------------------------------------------------------------------------

export async function initCommunity() {
    let teamsData = [];
    let developersData = [];
    let lookingForData = [];
    let currentTab = 'all';
    let verifiedOnly = false;
    let expandedTeamIds = new Set();
    let expandedDevIds = new Set();

    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const currentUserId = currentUser ? String(currentUser.id) : null;

    // Load Data from API
    async function loadCommunityData() {
        try {
            const [teamsRes, devsRes, matchRes] = await Promise.all([
                window.apiFetch ? window.apiFetch('/api/teams') : fetch('http://localhost:3000/api/teams'),
                window.apiFetch ? window.apiFetch('/api/community/developers') : fetch('http://localhost:3000/api/community/developers'),
                window.apiFetch ? window.apiFetch('/api/community/looking-for') : fetch('http://localhost:3000/api/community/looking-for')
            ]);

            if (teamsRes.ok) teamsData = await teamsRes.json();
            if (devsRes.ok) developersData = await devsRes.json();
            if (matchRes.ok) lookingForData = await matchRes.json();

            // Update Counts in UI
            const teamsCountEl = document.getElementById('stat-community-teams');
            const devsCountEl = document.getElementById('stat-community-devs');
            const tabTeamsCount = document.getElementById('tab-count-teams');
            const tabDevsCount = document.getElementById('tab-count-devs');
            const tabMatchCount = document.getElementById('tab-count-match');

            if (teamsCountEl) teamsCountEl.textContent = `${teamsData.length}+`;
            if (devsCountEl) devsCountEl.textContent = `${developersData.length}+`;
            if (tabTeamsCount) tabTeamsCount.textContent = teamsData.length;
            if (tabDevsCount) tabDevsCount.textContent = developersData.length;
            if (tabMatchCount) tabMatchCount.textContent = lookingForData.length;

            renderAllSections();
        } catch (err) {
            console.error('Failed to load community data:', err);
        }
    }

    // Helper to render verified skill badge
    function renderVerifiedSkillBadge(skill, isVerified = false) {
        if (isVerified) {
            return `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-tertiary/10 text-tertiary border border-tertiary/30 shadow-[0_0_12px_rgba(72,221,188,0.15)]">
                <span class="material-symbols-outlined text-[13px] text-tertiary font-bold">verified</span>
                ${skill}
            </span>`;
        }
        return `
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container-highest text-on-surface-variant border border-white/5">
            ${skill}
        </span>`;
    }

    // Render Teams
    function renderTeams(filteredTeams) {
        const container = document.getElementById('teams-grid');
        if (!container) return;

        if (filteredTeams.length === 0) {
            container.innerHTML = `<div class="col-span-full py-8 text-center text-on-surface-variant text-sm bg-surface-container-low/30 rounded-2xl border border-white/5">No teams match your active filters.</div>`;
            return;
        }

        container.innerHTML = filteredTeams.map(team => {
            const isExpanded = expandedTeamIds.has(team.id);
            const hasUpvoted = Array.isArray(team.upvoters) && currentUserId && team.upvoters.includes(currentUserId);
            const isLead = currentUserId && String(team.leadId) === currentUserId;
            const isMember = currentUserId && Array.isArray(team.members) && team.members.includes(currentUserId);

            const skillsBadges = (team.skills || []).map(s => renderVerifiedSkillBadge(s, true)).join('');
            
            const memberAvatars = (team.memberDetails || []).map(m => `
                <div class="w-8 h-8 rounded-full border-2 border-surface-container-high overflow-hidden bg-primary/20 flex items-center justify-center font-bold text-xs text-primary" title="${m.name || 'Member'}">
                    ${m.avatarUrl ? `<img src="${m.avatarUrl}" class="w-full h-full object-cover">` : (m.name ? m.name.charAt(0).toUpperCase() : 'M')}
                </div>
            `).join('');

            const projectTags = (team.assignedProjects || []).map(p => `
                <span class="px-2 py-0.5 text-[11px] font-mono bg-surface-container rounded-md text-on-surface-variant border border-white/5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-primary">folder</span> ${p}
                </span>
            `).join('');

            const openPositionsList = (team.openPositions || []).map(pos => `
                <div class="flex items-center justify-between px-3 py-2 bg-surface-container-highest/60 rounded-xl border border-white/5 text-xs">
                    <span class="font-semibold text-on-surface flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> ${pos}
                    </span>
                    ${(!isLead && !isMember) ? `
                    <button data-action="join-team-pos" data-team-id="${team.id}" data-team-name="${team.teamName}" data-position="${pos}" class="px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary rounded-lg font-bold transition-all text-[11px]">
                        Apply
                    </button>` : ''}
                </div>
            `).join('');

            return `
            <div class="glass-card bg-surface-container-low/70 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-2xl flex flex-col group" id="team-card-${team.id}">
                <!-- Header / Top Bar -->
                <div class="p-6 pb-4 flex flex-col flex-1">
                    <div class="flex items-start justify-between gap-4 mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-tertiary/20 border border-white/10 flex items-center justify-center font-bold text-lg text-primary shadow-inner">
                                <span class="material-symbols-outlined text-[26px]">groups</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                                    ${team.teamName}
                                </h3>
                                <div class="flex items-center gap-2 text-xs text-on-surface-variant">
                                    <span>Lead: <strong class="text-on-surface">${team.lead?.name || 'Lead'}</strong></span>
                                    <span>•</span>
                                    <span class="text-tertiary flex items-center gap-0.5">
                                        <span class="material-symbols-outlined text-[13px]">star</span> ${team.rating || '4.9'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Upvote Button -->
                        <button data-action="upvote-team" data-team-id="${team.id}" class="upvote-btn px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${hasUpvoted ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-surface-container text-on-surface-variant border-white/10 hover:border-primary/40 hover:text-primary'}">
                            <span class="material-symbols-outlined text-[16px]">${hasUpvoted ? 'thumb_up' : 'thumb_up_off_alt'}</span>
                            <span>${team.upvotes || 0}</span>
                        </button>
                    </div>

                    <!-- Description -->
                    <p class="text-xs md:text-sm text-on-surface-variant mb-4 leading-relaxed line-clamp-2">
                        ${team.description}
                    </p>

                    <!-- Tech Stack Chips -->
                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${skillsBadges}
                    </div>

                    <!-- Highlight Badges: Looking For & Availability -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <div class="px-3 py-2 rounded-xl bg-surface-container border border-white/5 flex items-center gap-2 text-xs">
                            <span class="material-symbols-outlined text-[16px] text-secondary">search</span>
                            <div class="truncate">
                                <span class="text-on-surface-variant text-[10px] block uppercase font-bold tracking-wider">Looking For</span>
                                <span class="font-semibold text-on-surface truncate block" title="${team.lookingFor}">${team.lookingFor}</span>
                            </div>
                        </div>
                        <div class="px-3 py-2 rounded-xl bg-surface-container border border-white/5 flex items-center gap-2 text-xs">
                            <span class="material-symbols-outlined text-[16px] text-tertiary">schedule</span>
                            <div class="truncate">
                                <span class="text-on-surface-variant text-[10px] block uppercase font-bold tracking-wider">Availability</span>
                                <span class="font-semibold text-on-surface truncate block">${team.availability}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Member Stack & Projects Preview -->
                    <div class="flex items-center justify-between pt-3 border-t border-white/5 mt-auto text-xs">
                        <div class="flex items-center gap-2">
                            <div class="flex -space-x-2 overflow-hidden">
                                ${memberAvatars}
                            </div>
                            <span class="text-on-surface-variant font-medium text-xs">${team.members?.length || 0} members</span>
                        </div>
                        
                        <div class="flex items-center gap-1.5">
                            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
                                ${(team.openPositions || []).length} Open Roles
                            </span>
                        </div>
                    </div>
                </div>

                <!-- EXPANDED IN-PLACE DETAILS CONTAINER -->
                <div class="team-expanded-details transition-all duration-500 ease-in-out border-t border-white/10 bg-surface-container-lowest/80 ${isExpanded ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 p-0 overflow-hidden'}">
                    <div class="space-y-4">
                        <!-- Full Description -->
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-primary mb-1">About the Guild</h4>
                            <p class="text-xs md:text-sm text-on-surface-variant leading-relaxed">${team.description}</p>
                        </div>

                        <!-- Active Projects -->
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-secondary mb-2">Team Projects</h4>
                            <div class="flex flex-wrap gap-2">
                                ${projectTags || '<span class="text-xs text-on-surface-variant">No public projects assigned.</span>'}
                            </div>
                        </div>

                        <!-- Open Positions Application -->
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-tertiary mb-2">Open Positions & Opportunities</h4>
                            <div class="space-y-2">
                                ${openPositionsList || '<span class="text-xs text-on-surface-variant">Currently no open positions.</span>'}
                            </div>
                        </div>

                        <!-- Members Roster -->
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Team Roster</h4>
                            <div class="grid grid-cols-2 gap-2">
                                ${(team.memberDetails || []).map(m => `
                                    <div class="flex items-center gap-2 p-2 bg-surface-container rounded-xl border border-white/5">
                                        <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary overflow-hidden">
                                            ${m.avatarUrl ? `<img src="${m.avatarUrl}" class="w-full h-full object-cover">` : (m.name ? m.name.charAt(0).toUpperCase() : 'M')}
                                        </div>
                                        <div class="truncate">
                                            <span class="text-xs font-semibold text-on-surface block truncate">${m.name}</span>
                                            <span class="text-[10px] text-on-surface-variant block truncate">${m.title || 'Member'}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Card Action Bar -->
                <div class="px-6 py-3.5 bg-surface-container/60 border-t border-white/5 flex items-center justify-between gap-3">
                    <button data-action="toggle-expand-team" data-team-id="${team.id}" class="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                        <span>${isExpanded ? 'Collapse Details' : 'View Full Guild'}</span>
                        <span class="material-symbols-outlined text-[16px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}">expand_more</span>
                    </button>

                    ${isLead ? `
                    <span class="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold">You Lead this Team</span>
                    ` : isMember ? `
                    <span class="px-3 py-1 bg-tertiary/10 text-tertiary border border-tertiary/20 rounded-xl text-xs font-bold">Team Member</span>
                    ` : `
                    <button data-action="join-team-btn" data-team-id="${team.id}" data-team-name="${team.teamName}" class="px-4 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-primary/20 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">group_add</span> Join Team
                    </button>
                    `}
                </div>
            </div>`;
        }).join('');
    }

    // Render Looking For Matchmaking Feed
    function renderLookingFor(filteredPosts) {
        const container = document.getElementById('looking-for-grid');
        if (!container) return;

        if (filteredPosts.length === 0) {
            container.innerHTML = `<div class="col-span-full py-8 text-center text-on-surface-variant text-sm bg-surface-container-low/30 rounded-2xl border border-white/5">No coding mate requests match your search.</div>`;
            return;
        }

        container.innerHTML = filteredPosts.map(post => {
            const author = post.author || {};
            const skillsBadges = (post.requiredSkills || []).map(s => `
                <span class="px-2.5 py-1 text-xs font-mono rounded-lg bg-surface-container text-primary border border-primary/20">
                    ${s}
                </span>
            `).join('');

            return `
            <div class="glass-card bg-gradient-to-br from-surface-container-low/80 via-surface-container/50 to-surface-container-lowest/80 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-tertiary/40 hover:shadow-xl flex flex-col justify-between group relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div>
                    <!-- Matchmaking Goal -->
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20 text-xs font-bold uppercase tracking-wider">
                            <span class="material-symbols-outlined text-[14px]">bolt</span> Looking for Mate
                        </div>
                        <span class="text-[11px] text-on-surface-variant font-mono">${post.commitment || 'Part-time'}</span>
                    </div>

                    <!-- Highlighted Criteria Blocks -->
                    <div class="space-y-2 mb-4">
                        <div class="text-base font-bold text-on-surface group-hover:text-tertiary transition-colors">
                            <span class="text-tertiary font-extrabold">Looking for:</span> ${post.lookingFor}
                        </div>
                        <div class="text-xs font-semibold text-on-surface-variant">
                            <strong class="text-on-surface">For:</strong> ${post.for}
                        </div>
                        <div class="text-xs text-on-surface-variant/90 leading-relaxed bg-surface-container-lowest/60 p-3 rounded-xl border border-white/5">
                            ${post.context}
                        </div>
                    </div>

                    <!-- Required Skills -->
                    <div class="mb-4">
                        <div class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Required Skills:</div>
                        <div class="flex flex-wrap gap-1.5">
                            ${skillsBadges}
                        </div>
                    </div>
                </div>

                <!-- Author Footer & Action -->
                <div class="pt-4 border-t border-white/5 flex items-center justify-between gap-3 mt-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-secondary/20 overflow-hidden border border-white/10 flex items-center justify-center font-bold text-sm text-secondary">
                            ${author.avatarUrl ? `<img src="${author.avatarUrl}" class="w-full h-full object-cover">` : (author.name ? author.name.charAt(0).toUpperCase() : 'D')}
                        </div>
                        <div>
                            <div class="text-xs font-bold text-on-surface flex items-center gap-1">
                                ${author.name || 'Developer'}
                                ${(author.verifiedSkills || []).length > 0 ? `<span class="material-symbols-outlined text-[13px] text-tertiary font-bold" title="Verified Developer">verified</span>` : ''}
                            </div>
                            <div class="text-[10px] text-on-surface-variant">${post.availability || 'Available'}</div>
                        </div>
                    </div>

                    <button data-action="connect-mate" data-user-id="${post.userId}" data-user-name="${author.name || 'Developer'}" data-topic="${post.for}" class="px-3.5 py-1.5 bg-tertiary text-on-tertiary font-bold text-xs rounded-xl hover:scale-105 transition-transform flex items-center gap-1 shadow-md shadow-tertiary/20">
                        <span class="material-symbols-outlined text-[15px]">send</span> Connect
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    // Render Developers / Coding Mates
    function renderDevelopers(filteredDevs) {
        const container = document.getElementById('developers-grid');
        if (!container) return;

        if (filteredDevs.length === 0) {
            container.innerHTML = `<div class="col-span-full py-8 text-center text-on-surface-variant text-sm bg-surface-container-low/30 rounded-2xl border border-white/5">No developers match your active filters.</div>`;
            return;
        }

        container.innerHTML = filteredDevs.map(dev => {
            const isExpanded = expandedDevIds.has(dev.id);
            const hasUpvoted = Array.isArray(dev.upvoters) && currentUserId && dev.upvoters.includes(currentUserId);
            const hasFollowed = Array.isArray(dev.followers) && currentUserId && dev.followers.includes(currentUserId);
            const isSelf = currentUserId && String(dev.id) === currentUserId;

            // Split verified vs standard skills
            const verifiedList = Array.isArray(dev.verifiedSkills) ? dev.verifiedSkills : [];
            const allSkills = Array.isArray(dev.skills) ? dev.skills : verifiedList;
            
            const skillsBadges = allSkills.map(s => {
                const isV = verifiedList.includes(s);
                return renderVerifiedSkillBadge(s, isV);
            }).join('');

            const socialLinks = dev.socialLinks || {};
            const socialIcons = `
                <div class="flex items-center gap-2">
                    ${socialLinks.github ? `<a href="${socialLinks.github}" target="_blank" class="p-1.5 bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="GitHub"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg></a>` : ''}
                    ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}" target="_blank" class="p-1.5 bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="LinkedIn"><span class="material-symbols-outlined text-[16px]">business_center</span></a>` : ''}
                    ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" target="_blank" class="p-1.5 bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Twitter/X"><span class="material-symbols-outlined text-[16px]">tag</span></a>` : ''}
                    ${socialLinks.website ? `<a href="${socialLinks.website}" target="_blank" class="p-1.5 bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Portfolio"><span class="material-symbols-outlined text-[16px]">language</span></a>` : ''}
                </div>`;

            return `
            <div class="glass-card bg-surface-container-low/70 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-secondary/40 hover:shadow-2xl flex flex-col group" id="dev-card-${dev.id}">
                <!-- Top Card Info -->
                <div class="p-6 pb-4 flex flex-col flex-1">
                    <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3.5">
                            <div class="relative">
                                <div class="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-surface-container flex items-center justify-center font-bold text-lg text-secondary">
                                    ${dev.avatarUrl ? `<img src="${dev.avatarUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">` : (dev.name ? dev.name.charAt(0).toUpperCase() : 'D')}
                                </div>
                                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-tertiary border-2 border-surface-container-lowest" title="Active"></span>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-on-surface group-hover:text-secondary transition-colors flex items-center gap-1.5">
                                    ${dev.name}
                                    ${verifiedList.length > 0 ? `<span class="material-symbols-outlined text-[16px] text-tertiary" title="Verified Skills Available">verified</span>` : ''}
                                </h3>
                                <div class="text-xs text-on-surface-variant font-medium">${dev.title || 'Developer'}</div>
                                <div class="text-[11px] text-tertiary flex items-center gap-1 mt-0.5">
                                    <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> ${dev.availability}
                                </div>
                            </div>
                        </div>

                        <!-- Upvote Pill -->
                        <button data-action="upvote-dev" data-user-id="${dev.id}" class="upvote-btn px-2.5 py-1 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${hasUpvoted ? 'bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20 scale-105' : 'bg-surface-container text-on-surface-variant border-white/10 hover:border-secondary/40 hover:text-secondary'}">
                            <span class="material-symbols-outlined text-[15px]">${hasUpvoted ? 'favorite' : 'favorite_border'}</span>
                            <span>${dev.upvotes || 0}</span>
                        </button>
                    </div>

                    <!-- Short Bio -->
                    <p class="text-xs text-on-surface-variant mb-4 leading-relaxed line-clamp-2">
                        ${dev.bio}
                    </p>

                    <!-- Looking For Badge -->
                    <div class="p-2.5 rounded-xl bg-surface-container/70 border border-white/5 text-xs mb-4">
                        <span class="text-[10px] uppercase tracking-wider font-bold text-secondary block">Looking For</span>
                        <span class="text-on-surface font-semibold truncate block">${dev.lookingFor}</span>
                    </div>

                    <!-- Skills Badges -->
                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${skillsBadges}
                    </div>
                </div>

                <!-- EXPANDED IN-PLACE PROFILE CONTAINER -->
                <div class="dev-expanded-details transition-all duration-500 ease-in-out border-t border-white/10 bg-surface-container-lowest/80 ${isExpanded ? 'max-h-[800px] opacity-100 p-6' : 'max-h-0 opacity-0 p-0 overflow-hidden'}">
                    <div class="space-y-4 text-xs">
                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Full Biography</h4>
                            <p class="text-xs text-on-surface-variant leading-relaxed">${dev.bio}</p>
                        </div>

                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-primary mb-2">Projects & Contributions</h4>
                            <div class="flex flex-wrap gap-1.5">
                                ${(dev.projects || []).map(p => `
                                    <span class="px-2.5 py-1 bg-surface-container rounded-lg text-on-surface border border-white/5 flex items-center gap-1 font-mono text-[11px]">
                                        <span class="material-symbols-outlined text-[13px] text-primary">code</span> ${p}
                                    </span>
                                `).join('') || '<span class="text-on-surface-variant">Active in community repositories.</span>'}
                            </div>
                        </div>

                        <div>
                            <h4 class="text-xs font-bold uppercase tracking-wider text-tertiary mb-1">Social & Code Profiles</h4>
                            ${socialIcons}
                        </div>
                    </div>
                </div>

                <!-- Card Footer Bar -->
                <div class="px-6 py-3.5 bg-surface-container/60 border-t border-white/5 flex items-center justify-between gap-3">
                    <button data-action="toggle-expand-dev" data-user-id="${dev.id}" class="text-xs font-semibold text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1">
                        <span>${isExpanded ? 'Collapse' : 'Expand Profile'}</span>
                        <span class="material-symbols-outlined text-[16px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}">expand_more</span>
                    </button>

                    <div class="flex items-center gap-2">
                        ${!isSelf ? `
                        <button data-action="follow-dev" data-user-id="${dev.id}" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${hasFollowed ? 'bg-white/10 text-on-surface border-white/20' : 'bg-surface-container text-on-surface border-white/10 hover:bg-surface-variant'}">
                            ${hasFollowed ? 'Following' : '+ Follow'}
                        </button>
                        <button data-action="connect-dev" data-user-id="${dev.id}" data-user-name="${dev.name}" class="px-3 py-1.5 bg-secondary text-on-secondary hover:bg-secondary-fixed-dim rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-secondary/20 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">chat</span> Chat
                        </button>
                        ` : `
                        <span class="px-3 py-1 bg-surface-container text-on-surface-variant rounded-xl text-xs font-semibold">Your Profile</span>
                        `}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // Master Filter & Sort function
    function filterAndSortData() {
        const searchQuery = (document.getElementById('community-search-input')?.value || '').toLowerCase().trim();
        const lookingForFilter = document.getElementById('filter-looking-for')?.value || 'all';
        const skillFilter = document.getElementById('filter-skills')?.value || 'all';
        const availabilityFilter = document.getElementById('filter-availability')?.value || 'all';
        const sortBy = document.getElementById('sort-by-select')?.value || 'upvoted';

        // Filter Teams
        let filteredTeams = teamsData.filter(team => {
            if (searchQuery) {
                const matchName = (team.teamName || '').toLowerCase().includes(searchQuery);
                const matchDesc = (team.description || '').toLowerCase().includes(searchQuery);
                const matchSkills = (team.skills || []).some(s => s.toLowerCase().includes(searchQuery));
                const matchLead = (team.lead?.name || '').toLowerCase().includes(searchQuery);
                if (!matchName && !matchDesc && !matchSkills && !matchLead) return false;
            }

            if (lookingForFilter !== 'all') {
                const lookingText = (team.lookingFor || '').toLowerCase();
                const posText = (team.openPositions || []).join(' ').toLowerCase();
                if (!lookingText.includes(lookingForFilter) && !posText.includes(lookingForFilter)) return false;
            }

            if (skillFilter !== 'all') {
                const hasSkill = (team.skills || []).some(s => s.toLowerCase().includes(skillFilter));
                if (!hasSkill) return false;
            }

            if (availabilityFilter !== 'all') {
                const availText = (team.availability || '').toLowerCase();
                if (!availText.includes(availabilityFilter)) return false;
            }

            return true;
        });

        // Filter Developers
        let filteredDevs = developersData.filter(dev => {
            if (searchQuery) {
                const matchName = (dev.name || '').toLowerCase().includes(searchQuery);
                const matchBio = (dev.bio || '').toLowerCase().includes(searchQuery);
                const matchSkills = (dev.skills || []).concat(dev.verifiedSkills || []).some(s => s.toLowerCase().includes(searchQuery));
                const matchTitle = (dev.title || '').toLowerCase().includes(searchQuery);
                if (!matchName && !matchBio && !matchSkills && !matchTitle) return false;
            }

            if (verifiedOnly) {
                if (!Array.isArray(dev.verifiedSkills) || dev.verifiedSkills.length === 0) return false;
            }

            if (lookingForFilter !== 'all') {
                const lookingText = (dev.lookingFor || '').toLowerCase();
                const titleText = (dev.title || '').toLowerCase();
                if (!lookingText.includes(lookingForFilter) && !titleText.includes(lookingForFilter)) return false;
            }

            if (skillFilter !== 'all') {
                const allSkills = (dev.skills || []).concat(dev.verifiedSkills || []);
                const hasSkill = allSkills.some(s => s.toLowerCase().includes(skillFilter));
                if (!hasSkill) return false;
            }

            if (availabilityFilter !== 'all') {
                const availText = (dev.availability || '').toLowerCase();
                if (!availText.includes(availabilityFilter)) return false;
            }

            return true;
        });

        // Filter Looking For Matchmaking
        let filteredMatch = lookingForData.filter(post => {
            if (searchQuery) {
                const matchLooking = (post.lookingFor || '').toLowerCase().includes(searchQuery);
                const matchFor = (post.for || '').toLowerCase().includes(searchQuery);
                const matchSkills = (post.requiredSkills || []).some(s => s.toLowerCase().includes(searchQuery));
                const matchContext = (post.context || '').toLowerCase().includes(searchQuery);
                if (!matchLooking && !matchFor && !matchSkills && !matchContext) return false;
            }

            if (lookingForFilter !== 'all') {
                const lookingText = (post.lookingFor || '').toLowerCase();
                if (!lookingText.includes(lookingForFilter)) return false;
            }

            if (skillFilter !== 'all') {
                const hasSkill = (post.requiredSkills || []).some(s => s.toLowerCase().includes(skillFilter));
                if (!hasSkill) return false;
            }

            if (availabilityFilter !== 'all') {
                const availText = (post.availability || '').toLowerCase();
                if (!availText.includes(availabilityFilter)) return false;
            }

            return true;
        });

        // Sort Data
        if (sortBy === 'upvoted') {
            filteredTeams.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
            filteredDevs.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        } else if (sortBy === 'newest') {
            filteredTeams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            filteredDevs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        return { filteredTeams, filteredDevs, filteredMatch };
    }

    // Render all based on active tab and filters
    function renderAllSections() {
        const { filteredTeams, filteredDevs, filteredMatch } = filterAndSortData();

        const sectionTeams = document.getElementById('section-teams');
        const sectionDevs = document.getElementById('section-developers');
        const sectionMatch = document.getElementById('section-looking-for');
        const emptyState = document.getElementById('community-empty-state');

        // Tab visibility toggle
        if (currentTab === 'all') {
            if (sectionTeams) sectionTeams.classList.remove('hidden');
            if (sectionDevs) sectionDevs.classList.remove('hidden');
            if (sectionMatch) sectionMatch.classList.remove('hidden');
        } else if (currentTab === 'teams') {
            if (sectionTeams) sectionTeams.classList.remove('hidden');
            if (sectionDevs) sectionDevs.classList.add('hidden');
            if (sectionMatch) sectionMatch.classList.add('hidden');
        } else if (currentTab === 'developers') {
            if (sectionTeams) sectionTeams.classList.add('hidden');
            if (sectionDevs) sectionDevs.classList.remove('hidden');
            if (sectionMatch) sectionMatch.classList.add('hidden');
        } else if (currentTab === 'looking-for') {
            if (sectionTeams) sectionTeams.classList.add('hidden');
            if (sectionDevs) sectionDevs.classList.add('hidden');
            if (sectionMatch) sectionMatch.classList.remove('hidden');
        }

        renderTeams(filteredTeams);
        renderDevelopers(filteredDevs);
        renderLookingFor(filteredMatch);

        const totalResults = filteredTeams.length + filteredDevs.length + filteredMatch.length;
        if (emptyState) {
            if (totalResults === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        }
    }

    // Setup Event Listeners
    function setupEventListeners() {
        const searchInput = document.getElementById('community-search-input');
        const clearSearchBtn = document.getElementById('community-clear-search');
        const filterLookingFor = document.getElementById('filter-looking-for');
        const filterSkills = document.getElementById('filter-skills');
        const filterAvailability = document.getElementById('filter-availability');
        const sortBySelect = document.getElementById('sort-by-select');
        const toggleVerifiedBtn = document.getElementById('toggle-verified-only');
        const resetFiltersBtn = document.getElementById('btn-reset-filters');
        const joinModal = document.getElementById('join-team-modal');
        const closeJoinModal = document.getElementById('close-join-modal');
        const cancelJoinBtn = document.getElementById('cancel-join-btn');
        const joinForm = document.getElementById('join-team-form');

        // Search Input
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (clearSearchBtn) {
                    clearSearchBtn.classList.toggle('hidden', !e.target.value);
                }
                renderAllSections();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                clearSearchBtn.classList.add('hidden');
                renderAllSections();
            });
        }

        // Filters Change
        [filterLookingFor, filterSkills, filterAvailability, sortBySelect].forEach(el => {
            if (el) el.addEventListener('change', renderAllSections);
        });

        // Verified Skills Toggle Pill
        if (toggleVerifiedBtn) {
            toggleVerifiedBtn.addEventListener('click', () => {
                verifiedOnly = !verifiedOnly;
                if (verifiedOnly) {
                    toggleVerifiedBtn.classList.add('bg-tertiary/20', 'text-tertiary', 'border-tertiary/50');
                    toggleVerifiedBtn.classList.remove('bg-surface-container', 'text-on-surface-variant');
                } else {
                    toggleVerifiedBtn.classList.remove('bg-tertiary/20', 'text-tertiary', 'border-tertiary/50');
                    toggleVerifiedBtn.classList.add('bg-surface-container', 'text-on-surface-variant');
                }
                renderAllSections();
            });
        }

        // Reset Filters Button
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (filterLookingFor) filterLookingFor.value = 'all';
                if (filterSkills) filterSkills.value = 'all';
                if (filterAvailability) filterAvailability.value = 'all';
                if (sortBySelect) sortBySelect.value = 'upvoted';
                verifiedOnly = false;
                if (toggleVerifiedBtn) {
                    toggleVerifiedBtn.classList.remove('bg-tertiary/20', 'text-tertiary', 'border-tertiary/50');
                    toggleVerifiedBtn.classList.add('bg-surface-container', 'text-on-surface-variant');
                }
                renderAllSections();
            });
        }

        // Tabs
        const tabBtns = document.querySelectorAll('.community-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                currentTab = targetTab;

                tabBtns.forEach(b => {
                    b.classList.remove('bg-primary', 'text-on-primary', 'shadow-lg', 'shadow-primary/20');
                    b.classList.add('text-on-surface-variant', 'hover:text-on-surface', 'hover:bg-white/5');
                });

                btn.classList.add('bg-primary', 'text-on-primary', 'shadow-lg', 'shadow-primary/20');
                btn.classList.remove('text-on-surface-variant', 'hover:text-on-surface', 'hover:bg-white/5');

                renderAllSections();
            });
        });

        // Quick Links to Tabs
        document.addEventListener('click', (e) => {
            const filterLink = e.target.closest('[data-action="filter-tab"]');
            if (filterLink) {
                const target = filterLink.dataset.target;
                const tabButton = document.querySelector(`.community-tab-btn[data-tab="${target}"]`);
                if (tabButton) tabButton.click();
            }
        });

        // Delegate Dynamic Card Actions (Upvotes, Expansions, Follow, Modals)
        document.addEventListener('click', async (e) => {
            // 1. Toggle Expand Team
            const expandTeamBtn = e.target.closest('[data-action="toggle-expand-team"]');
            if (expandTeamBtn) {
                const teamId = expandTeamBtn.dataset.teamId;
                if (expandedTeamIds.has(teamId)) {
                    expandedTeamIds.delete(teamId);
                } else {
                    expandedTeamIds.add(teamId);
                }
                const { filteredTeams } = filterAndSortData();
                renderTeams(filteredTeams);
                return;
            }

            // 2. Toggle Expand Developer
            const expandDevBtn = e.target.closest('[data-action="toggle-expand-dev"]');
            if (expandDevBtn) {
                const devId = expandDevBtn.dataset.userId;
                if (expandedDevIds.has(devId)) {
                    expandedDevIds.delete(devId);
                } else {
                    expandedDevIds.add(devId);
                }
                const { filteredDevs } = filterAndSortData();
                renderDevelopers(filteredDevs);
                return;
            }

            // 3. Upvote Team
            const upvoteTeamBtn = e.target.closest('[data-action="upvote-team"]');
            if (upvoteTeamBtn) {
                if (!currentUserId) {
                    if (window.UI?.showToast) window.UI.showToast('Please log in to upvote teams', 'info');
                    return;
                }
                const teamId = upvoteTeamBtn.dataset.teamId;
                try {
                    const res = await (window.apiFetch ? window.apiFetch(`/api/teams/${teamId}/upvote`, { method: 'POST' }) : fetch(`http://localhost:3000/api/teams/${teamId}/upvote`, { method: 'POST' }));
                    if (res.ok) {
                        const data = await res.json();
                        const team = teamsData.find(t => t.id === teamId);
                        if (team) {
                            team.upvotes = data.upvotes;
                            team.upvoters = data.upvoters;
                        }
                        const { filteredTeams } = filterAndSortData();
                        renderTeams(filteredTeams);
                        if (window.UI?.showToast) window.UI.showToast(data.hasUpvoted ? 'Upvoted team!' : 'Upvote removed', 'success');
                    }
                } catch (err) {
                    console.error('Failed to upvote team:', err);
                }
                return;
            }

            // 4. Upvote Developer
            const upvoteDevBtn = e.target.closest('[data-action="upvote-dev"]');
            if (upvoteDevBtn) {
                if (!currentUserId) {
                    if (window.UI?.showToast) window.UI.showToast('Please log in to upvote developers', 'info');
                    return;
                }
                const devId = upvoteDevBtn.dataset.userId;
                try {
                    const res = await (window.apiFetch ? window.apiFetch(`/api/users/${devId}/upvote`, { method: 'POST' }) : fetch(`http://localhost:3000/api/users/${devId}/upvote`, { method: 'POST' }));
                    if (res.ok) {
                        const data = await res.json();
                        const dev = developersData.find(d => d.id === devId);
                        if (dev) {
                            dev.upvotes = data.upvotes;
                            dev.upvoters = data.upvoters;
                        }
                        const { filteredDevs } = filterAndSortData();
                        renderDevelopers(filteredDevs);
                        if (window.UI?.showToast) window.UI.showToast(data.hasUpvoted ? 'Upvoted developer profile!' : 'Upvote removed', 'success');
                    }
                } catch (err) {
                    console.error('Failed to upvote dev:', err);
                }
                return;
            }

            // 5. Follow Developer
            const followDevBtn = e.target.closest('[data-action="follow-dev"]');
            if (followDevBtn) {
                if (!currentUserId) {
                    if (window.UI?.showToast) window.UI.showToast('Please log in to follow developers', 'info');
                    return;
                }
                const devId = followDevBtn.dataset.userId;
                try {
                    const res = await (window.apiFetch ? window.apiFetch(`/api/users/${devId}/follow`, { method: 'POST' }) : fetch(`http://localhost:3000/api/users/${devId}/follow`, { method: 'POST' }));
                    if (res.ok) {
                        const data = await res.json();
                        const dev = developersData.find(d => d.id === devId);
                        if (dev) {
                            dev.followers = data.followers;
                        }
                        const { filteredDevs } = filterAndSortData();
                        renderDevelopers(filteredDevs);
                        if (window.UI?.showToast) window.UI.showToast(data.hasFollowed ? `Now following ${dev?.name || 'developer'}!` : 'Unfollowed developer', 'info');
                    }
                } catch (err) {
                    console.error('Failed to follow dev:', err);
                }
                return;
            }

            // 6. Open Join Team Modal
            const joinTeamBtn = e.target.closest('[data-action="join-team-btn"]') || e.target.closest('[data-action="join-team-pos"]');
            if (joinTeamBtn) {
                if (!currentUserId) {
                    if (window.UI?.showToast) window.UI.showToast('Please log in to join a team', 'info');
                    return;
                }
                const teamId = joinTeamBtn.dataset.teamId;
                const teamName = joinTeamBtn.dataset.teamName || 'Team';
                const position = joinTeamBtn.dataset.position || '';

                const teamNameEl = document.getElementById('join-modal-team-name');
                const teamIdEl = document.getElementById('join-modal-team-id');
                const positionEl = document.getElementById('join-modal-position');

                if (teamNameEl) teamNameEl.textContent = `Join ${teamName}`;
                if (teamIdEl) teamIdEl.value = teamId;
                if (positionEl) positionEl.value = position;

                if (joinModal) {
                    joinModal.style.display = 'flex';
                    joinModal.classList.remove('hidden');
                    joinModal.classList.add('flex');
                }
                return;
            }

            // 7. Connect with Mate / Chat
            const connectMateBtn = e.target.closest('[data-action="connect-mate"]') || e.target.closest('[data-action="connect-dev"]');
            if (connectMateBtn) {
                const targetName = connectMateBtn.dataset.userName || 'Developer';
                if (window.UI?.showToast) {
                    window.UI.showToast(`Direct message channel ready for ${targetName}!`, 'info');
                }
                return;
            }
        });

        // Close Join Modal Handlers
        if (closeJoinModal) {
            closeJoinModal.addEventListener('click', () => {
                if (joinModal) {
                    joinModal.style.display = 'none';
                    joinModal.classList.add('hidden');
                    joinModal.classList.remove('flex');
                }
            });
        }

        if (cancelJoinBtn) {
            cancelJoinBtn.addEventListener('click', () => {
                if (joinModal) {
                    joinModal.style.display = 'none';
                    joinModal.classList.add('hidden');
                    joinModal.classList.remove('flex');
                }
            });
        }

        if (joinModal) {
            joinModal.addEventListener('click', (e) => {
                if (e.target === joinModal) {
                    joinModal.style.display = 'none';
                    joinModal.classList.add('hidden');
                    joinModal.classList.remove('flex');
                }
            });
        }

        // Submit Join Team Form
        if (joinForm) {
            joinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const teamId = document.getElementById('join-modal-team-id')?.value;
                const position = document.getElementById('join-modal-position')?.value;
                const message = document.getElementById('join-modal-message')?.value;

                try {
                    const res = await (window.apiFetch ? window.apiFetch(`/api/teams/${teamId}/join`, {
                        method: 'POST',
                        body: JSON.stringify({ position, message })
                    }) : fetch(`http://localhost:3000/api/teams/${teamId}/join`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ position, message })
                    }));

                    if (res.ok) {
                        const data = await res.json();
                        if (joinModal) {
                            joinModal.style.display = 'none';
                            joinModal.classList.add('hidden');
                            joinModal.classList.remove('flex');
                        }
                        if (window.UI?.showToast) {
                            window.UI.showToast(data.message || 'Join request sent to team leader!', 'success');
                        }
                    } else {
                        const errData = await res.json();
                        if (window.UI?.showToast) {
                            window.UI.showToast(errData.error || 'Failed to submit request', 'error');
                        }
                    }
                } catch (err) {
                    console.error('Error submitting join request:', err);
                    if (window.UI?.showToast) {
                        window.UI.showToast('Network error while sending request', 'error');
                    }
                }
            });
        }
    }

    // Initialize
    await loadCommunityData();
    setupEventListeners();
}
