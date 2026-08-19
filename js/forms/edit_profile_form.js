export function render_edit_profile_form(user = {}) {
    const name = user.name || '';
    const username = user.username || '';
    const title = user.title || user.role || '';
    const bio = user.bio || '';
    const location = user.location || '';
    const education = user.education || '';
    const experience = user.experience || '';
    
    // Skills & Interests
    const skillsList = Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || '');
    const interestsList = Array.isArray(user.interests) ? user.interests.join(', ') : (user.interests || '');
    
    // Social Links
    const social = user.socialLinks || {};
    const github = user.github || social.github || '';
    const twitter = user.twitter || social.twitter || '';
    const linkedin = user.linkedin || social.linkedin || '';
    const website = user.website || social.website || '';
    
    // Teams (Read-only from DB)
    const teams = Array.isArray(user.teams) ? user.teams : [];

    const teamsHtml = teams.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-md">
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
        : `<div class="p-lg rounded-xl bg-surface-container border border-white/5 text-center flex flex-col items-center justify-center py-8">
            <span class="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-2">group_off</span>
            <p class="text-sm font-bold text-on-surface mb-1">No Team Memberships</p>
            <p class="text-xs text-on-surface-variant max-w-sm">You are not currently part of any team. Explore community teams or join projects to start collaborating.</p>
        </div>`;

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-primary overflow-hidden shadow-2xl max-w-3xl w-full mx-auto animate-fade-in-up max-h-[90vh] flex flex-col">
        <!-- Sticky Modal Header -->
        <div class="flex justify-between items-center px-lg py-md border-b border-white/5 bg-surface-container sticky top-0 z-20 backdrop-blur-md">
            <h3 class="font-bold text-xl text-on-surface flex items-center gap-xs">
                <span class="material-symbols-outlined text-primary">edit_square</span>
                Edit Profile
            </h3>
            <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-white/5">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        
        <!-- Scrollable Form Body -->
        <div class="p-lg md:p-xl overflow-y-auto flex-1 custom-scrollbar">
            <form id="editProfileForm" class="space-y-lg">
                
                <!-- Section: Core Identity -->
                <div class="space-y-md">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-1">
                        <span class="material-symbols-outlined text-[16px]">badge</span>
                        Identity & Role
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Full Name <span class="text-primary">*</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person</span>
                                <input type="text" name="name" value="${name}" placeholder="e.g. Alex Rivera" required class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Username <span class="text-primary">*</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">alternate_email</span>
                                <input type="text" name="username" value="${username}" placeholder="e.g. alexrivera" required class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Developer Role / Title</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">work</span>
                                <input type="text" name="title" value="${title}" placeholder="e.g. Senior Fullstack Engineer" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Location</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">location_on</span>
                                <input type="text" name="location" value="${location}" placeholder="e.g. San Francisco, CA" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Bio -->
                <div class="space-y-xs">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-1">
                        <span class="material-symbols-outlined text-[16px]">description</span>
                        Bio & About
                    </h4>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant uppercase tracking-wider">Bio</label>
                    <textarea name="bio" rows="3" placeholder="Tell the community about what you build, your passions, and open source projects..." class="w-full bg-surface-container border border-white/10 rounded-xl p-md text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none">${bio}</textarea>
                </div>

                <!-- Section: Skills & Interests -->
                <div class="space-y-md">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-1">
                        <span class="material-symbols-outlined text-[16px]">psychology</span>
                        Expertise & Interests
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Skills <span class="text-[11px] text-on-surface-variant font-normal">(comma-separated)</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">code</span>
                                <input type="text" name="skills" value="${skillsList}" placeholder="Rust, TypeScript, React, Docker, GraphQL" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Interests <span class="text-[11px] text-on-surface-variant font-normal">(comma-separated)</span></label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">interests</span>
                                <input type="text" name="interests" value="${interestsList}" placeholder="AI/ML, Web3, Distributed Systems, Open Source" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Education & Experience -->
                <div class="space-y-md">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-1">
                        <span class="material-symbols-outlined text-[16px]">school</span>
                        Education & Experience
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Education</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">school</span>
                                <input type="text" name="education" value="${education}" placeholder="e.g. B.S. in Computer Science" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Experience</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">history_edu</span>
                                <input type="text" name="experience" value="${experience}" placeholder="e.g. 5+ years building distributed applications" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Social Links & Portfolio -->
                <div class="space-y-md">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-xs border-b border-white/5 pb-1">
                        <span class="material-symbols-outlined text-[16px]">share</span>
                        Social Links & Portfolio
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">GitHub</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">terminal</span>
                                <input type="url" name="github" value="${github}" placeholder="https://github.com/username" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Twitter / X</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">tag</span>
                                <input type="url" name="twitter" value="${twitter}" placeholder="https://x.com/username" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">LinkedIn</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">account_box</span>
                                <input type="url" name="linkedin" value="${linkedin}" placeholder="https://linkedin.com/in/username" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">Website / Portfolio</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">language</span>
                                <input type="url" name="website" value="${website}" placeholder="https://yourportfolio.dev" class="w-full bg-surface-container border border-white/10 rounded-xl pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Teams (Read-only) -->
                <div class="space-y-sm pt-2">
                    <div class="flex items-center justify-between border-b border-white/5 pb-1">
                        <h4 class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-xs">
                            <span class="material-symbols-outlined text-[16px]">groups</span>
                            Teams & Guilds
                        </h4>
                        <span class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider bg-surface-variant/40 px-2 py-0.5 rounded border border-white/5">
                            Read-Only Membership
                        </span>
                    </div>
                    <p class="text-xs text-on-surface-variant">Teams you currently belong to or lead in CodeCollab.</p>
                    ${teamsHtml}
                </div>

                <!-- Sticky Modal Actions Footer -->
                <div class="flex items-center justify-end gap-sm pt-lg border-t border-white/5 sticky bottom-0 bg-surface-container-low/95 backdrop-blur-md -mx-lg -mb-lg p-lg">
                    <button type="button" data-close-modal class="px-lg py-sm rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" class="px-xl py-sm bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-xs cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">check</span> Save Changes
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function initEditProfileForm() {
    // Form initialization if any dynamic client hooks are needed
}
