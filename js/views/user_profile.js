export function render_user_profile() {
    const curStr = localStorage.getItem('currentUser');
    let user = { name: 'Developer', username: 'developer', bio: 'Full-stack engineer passionate about open source and AI.', location: 'San Francisco, CA', skills: ['JavaScript', 'TypeScript', 'Rust', 'React'], socialLinks: {} };
    if (curStr) {
        try { user = { ...user, ...JSON.parse(curStr) }; } catch (e) {}
    }

    const skills = Array.isArray(user.skills) ? user.skills : [];
    const initial = (user.name ? user.name.charAt(0) : 'U').toUpperCase();

    return `
<main class="relative w-full max-w-[1200px] mx-auto p-xl flex flex-col min-h-screen pt-4 animate-fade-in-up">
    <!-- Banner -->
    <div class="w-full h-[200px] rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-tertiary/20 border border-white/5 relative mb-24">
        <!-- Avatar -->
        <div class="absolute -bottom-16 left-8">
            <div id="profile-page-avatar" class="w-32 h-32 rounded-full border-4 border-surface bg-surface-container-high flex items-center justify-center overflow-hidden font-display text-4xl text-primary font-bold uppercase shadow-2xl">
                ${initial}
            </div>
        </div>
        <div class="absolute -bottom-12 right-8 flex gap-sm">
            <button data-form="edit_profile_form" class="px-md py-xs bg-surface-container rounded-lg border border-white/10 hover:bg-surface-variant transition-colors flex items-center gap-xs cursor-pointer text-sm font-bold text-on-surface">
                <span class="material-symbols-outlined text-[18px]">edit</span> EDIT PROFILE
            </button>
        </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <!-- Sidebar Info -->
        <div class="space-y-md">
            <div>
                <h1 id="profile-page-name" class="font-headline-lg text-on-surface font-bold text-2xl">${user.name || 'Developer'}</h1>
                <p id="profile-page-username" class="text-on-surface-variant font-label-md">@${user.username || 'developer'}</p>
                <span id="profile-page-title" class="inline-block mt-1 px-2 py-0.5 rounded-md bg-secondary/15 text-secondary border border-secondary/20 text-xs font-bold">
                    ${user.title || user.role || 'Contributor'}
                </span>
            </div>
            <p id="profile-page-bio" class="text-sm text-on-surface">${user.bio || 'Building open source tools and software.'}</p>
            <div class="flex items-center gap-xs text-sm text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px]">location_on</span>
                <span id="profile-page-location">${user.location || 'Remote'}</span>
            </div>
            <div class="flex items-center gap-xs text-sm text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px]">link</span>
                <a id="profile-page-website" href="${user.website || user.socialLinks?.website || '#'}" target="_blank" class="text-primary hover:underline">${user.website || user.socialLinks?.website || 'codecollab.dev'}</a>
            </div>
            
            <div class="h-[1px] bg-outline-variant w-full"></div>
            
            <div>
                <h3 class="font-label-md mb-xs text-on-surface font-bold text-xs uppercase tracking-wider">SKILLS</h3>
                <div id="profile-page-skills" class="flex flex-wrap gap-xs">
                    ${skills.length > 0 ? skills.map(s => `<span class="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-xs border border-white/5 font-medium">${s}</span>`).join('') : '<span class="text-xs text-on-surface-variant">No skills listed yet</span>'}
                </div>
            </div>
            
            <div class="h-[1px] bg-outline-variant w-full"></div>
            
            <div class="flex justify-between items-center text-center">
                <div>
                    <div class="font-bold text-lg text-on-surface">${user.followers?.length || 128}</div>
                    <div class="text-xs text-on-surface-variant">Followers</div>
                </div>
                <div>
                    <div class="font-bold text-lg text-on-surface">45</div>
                    <div class="text-xs text-on-surface-variant">Following</div>
                </div>
                <div>
                    <div class="font-bold text-lg text-on-surface">${user.upvotes || 24}</div>
                    <div class="text-xs text-on-surface-variant">Upvotes</div>
                </div>
            </div>
        </div>
        
        <!-- Main Area -->
        <div class="md:col-span-2 space-y-lg">
            <div class="glass-panel p-lg rounded-xl border border-white/5">
                <h3 class="font-headline-md mb-md font-bold text-lg">Contribution Activity</h3>
                <div class="w-full h-[120px] bg-surface-container rounded-lg border border-white/5 flex items-center justify-center text-on-surface-variant text-sm">
                    <span class="material-symbols-outlined mr-2 text-primary">monitoring</span> Active Open Source Contributor
                </div>
            </div>
            
            <div class="flex items-center justify-between mb-sm">
                <h3 class="font-headline-md font-bold text-lg">Projects & Contributions</h3>
                <a href="#explore" class="text-primary text-sm hover:underline font-bold">Explore More</a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-md" id="profile-pinned-projects">
                <div class="glass-panel p-md rounded-xl border-l-2 border-l-primary cursor-pointer hover:bg-surface-variant transition-colors" onclick="window.location.hash='project_details'">
                    <div class="font-bold text-on-surface">NexusML</div>
                    <p class="text-xs text-on-surface-variant my-1">Machine learning framework optimized for edge devices.</p>
                    <div class="flex gap-2 mt-2">
                        <span class="w-3 h-3 rounded-full bg-tertiary"></span> <span class="text-xs text-on-surface-variant">Python</span>
                    </div>
                </div>
                <div class="glass-panel p-md rounded-xl border-l-2 border-l-secondary cursor-pointer hover:bg-surface-variant transition-colors" onclick="window.location.hash='project_details'">
                    <div class="font-bold text-on-surface">AuraUI</div>
                    <p class="text-xs text-on-surface-variant my-1">Glassmorphism UI component library.</p>
                    <div class="flex gap-2 mt-2">
                        <span class="w-3 h-3 rounded-full bg-secondary"></span> <span class="text-xs text-on-surface-variant">JavaScript</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
`;
}

export async function initUserProfile() {
    try {
        const res = await window.apiFetch('/api/users/profile');
        if (!res.ok) return;
        const profile = await res.json();

        const nameEl = document.getElementById('profile-page-name');
        if (nameEl) nameEl.textContent = profile.name || 'Developer';

        const usernameEl = document.getElementById('profile-page-username');
        if (usernameEl) usernameEl.textContent = `@${profile.username || 'developer'}`;

        const titleEl = document.getElementById('profile-page-title');
        if (titleEl) titleEl.textContent = profile.title || 'Contributor';

        const bioEl = document.getElementById('profile-page-bio');
        if (bioEl) bioEl.textContent = profile.bio || 'Building open source tools.';

        const locEl = document.getElementById('profile-page-location');
        if (locEl) locEl.textContent = profile.location || 'Remote';

        const webEl = document.getElementById('profile-page-website');
        if (webEl) {
            webEl.textContent = profile.website || profile.socialLinks?.website || 'codecollab.dev';
            webEl.href = profile.website || profile.socialLinks?.website || '#';
        }

        const skillsEl = document.getElementById('profile-page-skills');
        if (skillsEl && Array.isArray(profile.skills)) {
            skillsEl.innerHTML = profile.skills.map(s => `<span class="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-xs border border-white/5 font-medium">${s}</span>`).join('');
        }
    } catch (e) {
        console.warn('Error hydrating user profile view:', e);
    }
}
