export function render_settings() {
    const currentUserStr = localStorage.getItem('currentUser');
    let user = { name: '', username: '', title: '', bio: '', location: '', education: '', experience: '', skills: [], interests: [], socialLinks: {}, teams: [] };
    if (currentUserStr) {
        try {
            user = { ...user, ...JSON.parse(currentUserStr) };
        } catch (e) {}
    }

    const skillsList = Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || '');
    const interestsList = Array.isArray(user.interests) ? user.interests.join(', ') : (user.interests || '');
    const social = user.socialLinks || {};
    const github = user.github || social.github || '';
    const twitter = user.twitter || social.twitter || '';
    const linkedin = user.linkedin || social.linkedin || '';
    const website = user.website || social.website || '';
    const teams = Array.isArray(user.teams) ? user.teams : [];

    const teamsHtml = teams.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-md" id="settings-teams-container">
            ${teams.map(t => `
                <div class="p-md rounded-xl bg-surface-container border border-white/5 flex flex-col justify-between hover:border-primary/20 transition-all">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <h5 class="font-bold text-sm text-on-surface truncate">${t.teamName}</h5>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${t.role === 'Team Lead' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/15 text-secondary border border-secondary/30'}">
                                ${t.role}
                            </span>
                        </div>
                        <p class="text-xs text-on-surface-variant line-clamp-2 mb-3">${t.description || 'Collaborative development team'}</p>
                    </div>
                    <div>
                        ${Array.isArray(t.skills) && t.skills.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mb-2">
                                ${t.skills.slice(0, 3).map(s => `<span class="px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant text-[10px]">${s}</span>`).join('')}
                                ${t.skills.length > 3 ? `<span class="px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant text-[10px]">+${t.skills.length - 3}</span>` : ''}
                            </div>
                        ` : ''}
                        <div class="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-white/5">
                            <span>⭐ ${t.rating || 4.8}</span>
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">group</span> ${t.membersCount || 1} members</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>`
        : `<div class="p-lg rounded-xl bg-surface-container border border-white/5 text-center flex flex-col items-center justify-center py-8" id="settings-teams-container">
            <span class="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-2">group_off</span>
            <p class="text-sm font-bold text-on-surface mb-1">No Team Memberships</p>
            <p class="text-xs text-on-surface-variant max-w-sm">You are not currently part of any team. Explore community teams or join projects to start collaborating.</p>
        </div>`;

    return `
    <main class="w-full max-w-[1000px] mx-auto p-lg md:p-xl flex flex-col min-h-[85vh] animate-fade-in-up mt-4">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl pb-lg border-b border-white/5">
            <div>
                <div class="flex items-center gap-xs text-xs font-label-sm text-primary uppercase tracking-wider mb-xs">
                    <a href="#home" class="hover:underline">Home</a>
                    <span>/</span>
                    <span>Edit Profile & Settings</span>
                </div>
                <h1 class="font-display text-[32px] md:text-[40px] font-bold text-on-surface tracking-tight flex items-center gap-sm">
                    <span class="material-symbols-outlined text-primary text-[36px]">edit_document</span>
                    Edit Profile
                </h1>
                <p class="text-on-surface-variant text-sm mt-1">Manage and update your developer identity, expertise, background, and links.</p>
            </div>
        </div>

        <!-- Main Form Container -->
        <div class="glass-panel p-lg md:p-xl rounded-2xl border border-white/10 bg-surface-container-low/70 backdrop-blur-md shadow-2xl">
            <form id="editProfileForm" class="space-y-xl">
                
                <!-- Section 1: Core Identity & Developer Role -->
                <div class="space-y-md">
                    <h3 class="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-2">
                        <span class="material-symbols-outlined text-[18px]">badge</span>
                        Identity & Role
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Full Name <span class="text-primary">*</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person</span>
                                <input type="text" name="name" id="settings-input-name" value="${user.name || ''}" placeholder="e.g. Alex Rivera" required class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Username <span class="text-primary">*</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">alternate_email</span>
                                <input type="text" name="username" id="settings-input-username" value="${user.username || ''}" placeholder="e.g. alexrivera" required class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Developer Role / Title</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">work</span>
                                <input type="text" name="title" id="settings-input-title" value="${user.title || user.role || ''}" placeholder="e.g. Senior Systems Engineer" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Location</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">location_on</span>
                                <input type="text" name="location" id="settings-input-location" value="${user.location || ''}" placeholder="e.g. San Francisco, CA" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Bio & Description -->
                <div class="space-y-xs">
                    <h3 class="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-2">
                        <span class="material-symbols-outlined text-[18px]">description</span>
                        Bio & About
                    </h3>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant uppercase tracking-wider pt-2">Bio</label>
                    <textarea name="bio" id="settings-input-bio" rows="4" placeholder="Tell the community about what you build, your engineering focus, and open source contributions..." class="w-full bg-surface-container border border-white/10 rounded-xl p-md text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none">${user.bio || ''}</textarea>
                </div>

                <!-- Section 3: Skills & Interests -->
                <div class="space-y-md">
                    <h3 class="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-2">
                        <span class="material-symbols-outlined text-[18px]">psychology</span>
                        Expertise & Interests
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Skills <span class="text-[11px] text-on-surface-variant font-normal">(comma-separated)</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">code</span>
                                <input type="text" name="skills" id="settings-input-skills" value="${skillsList}" placeholder="Rust, TypeScript, React, Docker, GraphQL" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Interests <span class="text-[11px] text-on-surface-variant font-normal">(comma-separated)</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">interests</span>
                                <input type="text" name="interests" id="settings-input-interests" value="${interestsList}" placeholder="AI/ML, Web3, Distributed Systems, Compilers" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 4: Education & Experience -->
                <div class="space-y-md">
                    <h3 class="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-2">
                        <span class="material-symbols-outlined text-[18px]">school</span>
                        Education & Experience
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Education</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">school</span>
                                <input type="text" name="education" id="settings-input-education" value="${user.education || ''}" placeholder="e.g. B.S. in Computer Science" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Experience</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">history_edu</span>
                                <input type="text" name="experience" id="settings-input-experience" value="${user.experience || ''}" placeholder="e.g. 5+ years building scalable cloud services" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 5: Social Links & Portfolio -->
                <div class="space-y-md">
                    <h3 class="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-2">
                        <span class="material-symbols-outlined text-[18px]">share</span>
                        Social Links & Portfolio
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">GitHub</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">terminal</span>
                                <input type="url" name="github" id="settings-input-github" value="${github}" placeholder="https://github.com/username" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Twitter / X</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">tag</span>
                                <input type="url" name="twitter" id="settings-input-twitter" value="${twitter}" placeholder="https://x.com/username" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">LinkedIn</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">account_box</span>
                                <input type="url" name="linkedin" id="settings-input-linkedin" value="${linkedin}" placeholder="https://linkedin.com/in/username" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Website / Portfolio</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">language</span>
                                <input type="url" name="website" id="settings-input-website" value="${website}" placeholder="https://yourportfolio.dev" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 6: Teams & Guilds (Read-only) -->
                <div class="space-y-sm pt-2">
                    <div class="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 class="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-xs">
                            <span class="material-symbols-outlined text-[18px]">groups</span>
                            Teams & Guilds
                        </h3>
                        <span class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider bg-surface-variant/40 px-2.5 py-1 rounded border border-white/5">
                            Read-Only Membership
                        </span>
                    </div>
                    <p class="text-xs text-on-surface-variant">Teams you currently belong to or lead in CodeCollab.</p>
                    ${teamsHtml}
                </div>

                <!-- Form Action Buttons -->
                <div class="flex items-center justify-end gap-md pt-lg border-t border-white/5">
                    <button type="button" onclick="window.history.back()" class="px-lg py-sm rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" class="px-xl py-sm bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-xs cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">save</span> Save Changes
                    </button>
                </div>
            </form>
        </div>
    </main>
    `;
}

export async function initSettings() {
    try {
        const res = await window.apiFetch('/api/users/profile');
        if (!res.ok) return;
        const profile = await res.json();

        // Update form fields if present
        const nameEl = document.getElementById('settings-input-name');
        if (nameEl) nameEl.value = profile.name || '';

        const usernameEl = document.getElementById('settings-input-username');
        if (usernameEl) usernameEl.value = profile.username || '';

        const titleEl = document.getElementById('settings-input-title');
        if (titleEl) titleEl.value = profile.title || '';

        const locEl = document.getElementById('settings-input-location');
        if (locEl) locEl.value = profile.location || '';

        const bioEl = document.getElementById('settings-input-bio');
        if (bioEl) bioEl.value = profile.bio || '';

        const skillsEl = document.getElementById('settings-input-skills');
        if (skillsEl) {
            skillsEl.value = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || '');
        }

        const interestsEl = document.getElementById('settings-input-interests');
        if (interestsEl) {
            interestsEl.value = Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || '');
        }

        const eduEl = document.getElementById('settings-input-education');
        if (eduEl) eduEl.value = profile.education || '';

        const expEl = document.getElementById('settings-input-experience');
        if (expEl) expEl.value = profile.experience || '';

        const soc = profile.socialLinks || {};
        const ghEl = document.getElementById('settings-input-github');
        if (ghEl) ghEl.value = profile.github || soc.github || '';

        const twEl = document.getElementById('settings-input-twitter');
        if (twEl) twEl.value = profile.twitter || soc.twitter || '';

        const liEl = document.getElementById('settings-input-linkedin');
        if (liEl) liEl.value = profile.linkedin || soc.linkedin || '';

        const webEl = document.getElementById('settings-input-website');
        if (webEl) webEl.value = profile.website || soc.website || '';
    } catch (e) {
        console.warn('Error hydrating settings with latest DB profile:', e);
    }
}
