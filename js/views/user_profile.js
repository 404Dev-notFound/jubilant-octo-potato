const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_user_profile() {
    const curStr = localStorage.getItem('currentUser');
    let user = { name: 'Developer', username: 'developer', bio: 'Full-stack engineer passionate about open source and AI.', location: 'San Francisco, CA', skills: ['JavaScript', 'TypeScript', 'Rust', 'React'], socialLinks: {} };
    if (curStr) {
        try { user = { ...user, ...JSON.parse(curStr) }; } catch (e) {}
    }

    const skills = Array.isArray(user.skills) ? user.skills : [];
    const initial = (user.name ? user.name.charAt(0) : 'U').toUpperCase();

    return `
<main class="relative w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col min-h-screen pt-4 animate-fade-in-up text-on-surface">
    <!-- Banner -->
    <div class="w-full h-[200px] rounded-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-tertiary/20 border border-white/5 relative mb-24 overflow-visible shadow-2xl">
        <div class="absolute -top-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Avatar -->
        <div class="absolute -bottom-16 left-8">
            <div id="profile-page-avatar" class="w-32 h-32 rounded-3xl border-4 border-surface bg-surface-container-high flex items-center justify-center overflow-hidden font-display text-4xl text-primary font-bold uppercase shadow-2xl">
                ${initial}
            </div>
        </div>

        <!-- Profile Action Header -->
        <div id="profile-action-container" class="absolute -bottom-12 right-8 flex items-center gap-3">
            <button id="profile-edit-btn" data-form="edit_profile_form" class="px-4 py-2 bg-surface-container rounded-xl border border-white/10 hover:bg-surface-variant transition-colors flex items-center gap-2 cursor-pointer text-xs md:text-sm font-bold text-on-surface shadow-md">
                <span class="material-symbols-outlined text-[18px]">edit</span> EDIT PROFILE
            </button>
        </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Sidebar Info -->
        <div class="space-y-6">
            <div>
                <h1 id="profile-page-name" class="font-display font-bold text-2xl md:text-3xl text-on-surface flex items-center gap-2">
                    ${user.name || 'Developer'}
                </h1>
                <p id="profile-page-username" class="text-on-surface-variant text-sm font-mono mt-0.5">@${user.username || 'developer'}</p>
                <div class="flex items-center gap-2 mt-2">
                    <span id="profile-page-title" class="inline-block px-3 py-1 rounded-xl bg-secondary/15 text-secondary border border-secondary/25 text-xs font-bold">
                        ${user.title || user.role || 'Developer'}
                    </span>
                    <span id="profile-page-availability" class="inline-block px-2.5 py-1 rounded-xl bg-tertiary/15 text-tertiary border border-tertiary/25 text-xs font-semibold">
                        ${user.availability || 'Available Now'}
                    </span>
                </div>
            </div>

            <p id="profile-page-bio" class="text-sm text-on-surface-variant leading-relaxed">
                ${user.bio || 'Building open source tools and software.'}
            </p>

            <div class="space-y-2 text-xs md:text-sm text-on-surface-variant">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-primary">location_on</span>
                    <span id="profile-page-location">${user.location || 'Remote'}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-secondary">link</span>
                    <a id="profile-page-website" href="${user.website || user.socialLinks?.website || '#'}" target="_blank" class="text-primary hover:underline truncate">${user.website || user.socialLinks?.website || 'codecollab.dev'}</a>
                </div>
            </div>
            
            <div class="h-[1px] bg-white/5 w-full"></div>
            
            <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Skills & Expertise</h3>
                <div id="profile-page-skills" class="flex flex-wrap gap-1.5">
                    ${skills.length > 0 ? skills.map(s => `<span class="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-xl text-xs border border-white/5 font-medium">${s}</span>`).join('') : '<span class="text-xs text-on-surface-variant">No skills listed yet</span>'}
                </div>
            </div>
            
            <div class="h-[1px] bg-white/5 w-full"></div>
            
            <div class="grid grid-cols-3 gap-2 text-center p-4 bg-surface-container-low/60 rounded-2xl border border-white/5">
                <div>
                    <div id="profile-followers-count" class="font-bold text-lg text-on-surface">${user.followers?.length || 0}</div>
                    <div class="text-[11px] text-on-surface-variant">Followers</div>
                </div>
                <div>
                    <div id="profile-upvotes-count" class="font-bold text-lg text-secondary">${user.upvotes || 0}</div>
                    <div class="text-[11px] text-on-surface-variant">Upvotes</div>
                </div>
                <div>
                    <div id="profile-rating-val" class="font-bold text-lg text-tertiary">${user.rating || '5.0'}</div>
                    <div class="text-[11px] text-on-surface-variant">Rating</div>
                </div>
            </div>
        </div>
        
        <!-- Main Area -->
        <div class="md:col-span-2 space-y-8">
            <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 class="font-bold text-lg text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">monitoring</span> Contribution Activity
                </h3>
                <div class="w-full h-28 bg-surface-container/60 rounded-xl border border-white/5 flex items-center justify-center text-on-surface-variant text-sm gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
                    <span>Active Contributor on CodeCollab</span>
                </div>
            </div>
            
            <div>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-lg text-on-surface">Projects & Contributions</h3>
                    <a href="#explore" class="text-primary text-xs font-bold hover:underline">Explore All Projects →</a>
                </div>
                
                <div id="profile-projects-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="animate-pulse bg-surface-container-low h-40 rounded-2xl border border-white/5"></div>
                    <div class="animate-pulse bg-surface-container-low h-40 rounded-2xl border border-white/5"></div>
                </div>
            </div>
        </div>
    </div>
</main>
`;
}

export async function initUserProfile(targetUserId = null) {
    const currentUserStr = localStorage.getItem('currentUser');
    let currentUser = null;
    try { if (currentUserStr) currentUser = JSON.parse(currentUserStr); } catch (e) {}

    const isSelf = !targetUserId || (currentUser && String(currentUser.id) === String(targetUserId));
    const endpoint = isSelf ? '/api/users/profile' : `/api/users/${targetUserId}`;

    try {
        const res = await window.apiFetch(endpoint);
        if (!res.ok) return;
        const profile = await res.json();

        // Update elements
        const nameEl = document.getElementById('profile-page-name');
        if (nameEl) nameEl.textContent = profile.name || 'Developer';

        const usernameEl = document.getElementById('profile-page-username');
        if (usernameEl) usernameEl.textContent = `@${profile.username || (profile.name || 'dev').toLowerCase().replace(/\s+/g, '_')}`;

        const titleEl = document.getElementById('profile-page-title');
        if (titleEl) titleEl.textContent = profile.title || profile.role || 'Contributor';

        const availEl = document.getElementById('profile-page-availability');
        if (availEl) availEl.textContent = profile.availability || 'Available Now';

        const bioEl = document.getElementById('profile-page-bio');
        if (bioEl) bioEl.textContent = profile.bio || 'Building open source tools and scalable software.';

        const locEl = document.getElementById('profile-page-location');
        if (locEl) locEl.textContent = profile.location || 'Remote';

        const webEl = document.getElementById('profile-page-website');
        if (webEl) {
            webEl.textContent = profile.website || profile.socialLinks?.website || 'codecollab.dev';
            webEl.href = profile.website || profile.socialLinks?.website || '#';
        }

        const skillsEl = document.getElementById('profile-page-skills');
        if (skillsEl && Array.isArray(profile.skills)) {
            skillsEl.innerHTML = profile.skills.map(s => `<span class="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-xl text-xs border border-white/5 font-medium">${s}</span>`).join('');
        }
        const avatarEl = document.getElementById('profile-page-avatar');
        if (avatarEl) {
            const initial = (profile.name ? profile.name.charAt(0) : 'U').toUpperCase();
            avatarEl.innerHTML = initial;
        }

        const followersEl = document.getElementById('profile-followers-count');
        if (followersEl) followersEl.textContent = Array.isArray(profile.followers) ? profile.followers.length : (profile.followers || 0);

        const upvotesEl = document.getElementById('profile-upvotes-count');
        if (upvotesEl) upvotesEl.textContent = profile.upvotes || 0;

        const ratingEl = document.getElementById('profile-rating-val');
        if (ratingEl) ratingEl.textContent = profile.rating || '5.0';

        // Action header (Edit for self vs Upvote/Connect for other)
        const actionContainer = document.getElementById('profile-action-container');
        if (actionContainer) {
            if (isSelf) {
                actionContainer.innerHTML = `
                <button id="profile-edit-btn" data-form="edit_profile_form" class="px-4 py-2 bg-surface-container rounded-xl border border-white/10 hover:bg-surface-variant transition-colors flex items-center gap-2 cursor-pointer text-xs md:text-sm font-bold text-on-surface shadow-md">
                    <span class="material-symbols-outlined text-[18px]">edit</span> EDIT PROFILE
                </button>`;
            } else {
                actionContainer.innerHTML = `
                <div class="flex items-center gap-2">
                    <button id="profile-upvote-btn" class="px-4 py-2 bg-secondary/15 text-secondary rounded-xl border border-secondary/30 hover:bg-secondary hover:text-on-secondary transition-all flex items-center gap-2 text-xs md:text-sm font-bold shadow-md active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">thumb_up</span> Upvote (<span id="profile-btn-upvotes">${profile.upvotes || 0}</span>)
                    </button>
                    <button id="profile-follow-btn" class="px-4 py-2 bg-primary text-on-primary rounded-xl hover:scale-105 transition-transform flex items-center gap-2 text-xs md:text-sm font-bold shadow-md shadow-primary/20">
                        <span class="material-symbols-outlined text-[18px]">person_add</span> Follow
                    </button>
                </div>`;
            }
        }

        // Fetch User's collaborative projects
        const projContainer = document.getElementById('profile-projects-list');
        if (projContainer) {
            try {
                const pRes = await window.apiFetch('/api/projects');
                if (pRes.ok) {
                    const allProjects = await pRes.json();
                    const userProjects = allProjects.filter(p => String(p.ownerId) === String(targetUserId) || (Array.isArray(p.members) && p.members.some(m => String(m.userId) === String(targetUserId))));
                    
                    if (userProjects.length === 0) {
                        projContainer.innerHTML = `<div class="p-6 text-center text-on-surface-variant text-xs bg-surface-container/50 rounded-xl border border-white/5">No public projects associated with this developer yet.</div>`;
                    } else {
                        projContainer.innerHTML = userProjects.map(p => `
                        <div class="glass-panel p-4 rounded-xl border-l-4 border-l-primary cursor-pointer hover:bg-surface-variant transition-colors" onclick="window.location.hash='project_details?projectId=${p.id}'">
                            <div class="font-bold text-sm text-on-surface">${escapeHtml(p.title || 'Untitled Project')}</div>
                            <p class="text-xs text-on-surface-variant line-clamp-2 my-1">${escapeHtml(p.description || '')}</p>
                            <div class="flex flex-wrap gap-1 mt-2">
                                ${(Array.isArray(p.techStack) ? p.techStack : []).slice(0, 3).map(t => `<span class="px-2 py-0.5 rounded-md bg-surface-container text-[10px] text-on-surface-variant">${escapeHtml(t)}</span>`).join('')}
                            </div>
                        </div>`).join('');
                    }
                }
            } catch (err) {
                console.warn('Error loading user projects:', err);
            }
        }
    } catch (e) {
        console.warn('Error hydrating user profile view:', e);
    }
}
