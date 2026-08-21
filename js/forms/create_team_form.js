/*
 * Create Team Form Component
 * Enables developers to scaffold and lead new open-source teams & guilds
 */

export function render_create_team_form() {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const leadName = currentUser ? (currentUser.name || 'Developer') : 'Authenticated User';
    const leadInitial = leadName ? leadName.charAt(0).toUpperCase() : 'U';

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-primary overflow-hidden shadow-2xl max-w-2xl w-full mx-auto animate-fade-in-up max-h-[90vh] flex flex-col">
        <!-- Sticky Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-surface-container sticky top-0 z-20 backdrop-blur-md">
            <h3 class="font-bold text-xl text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">groups</span>
                Create New Team / Guild
            </h3>
            <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-white/5">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
            <form id="createTeamForm" class="space-y-6">
                <!-- Creator Identity Banner -->
                <div class="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-md">
                            ${leadInitial}
                        </div>
                        <div>
                            <div class="text-[11px] font-bold uppercase tracking-wider text-primary">Team Founder & Lead</div>
                            <div class="text-sm font-bold text-on-surface">${leadName}</div>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        Creator
                    </span>
                </div>

                <!-- Team Name -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Team / Guild Name <span class="text-primary">*</span>
                    </label>
                    <input type="text" name="teamName" id="team-name-input" required placeholder="e.g. Rustacean Core Guild, Nebula AI Lab" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                </div>

                <!-- Description -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Description & Mission <span class="text-primary">*</span>
                    </label>
                    <textarea name="description" id="team-description-input" rows="3" required placeholder="Describe your team's mission, projects, and goals..." class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none"></textarea>
                </div>

                <!-- Technologies & Skills -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Technologies & Skills (comma separated) <span class="text-primary">*</span>
                    </label>
                    <input type="text" name="skills" id="team-skills-input" required placeholder="e.g. Rust, Tokio, WebAssembly, Docker, React" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                    
                    <!-- Quick Suggestions -->
                    <div class="flex flex-wrap gap-1.5 mt-2">
                        <span class="text-[11px] text-on-surface-variant self-center mr-1">Quick Add:</span>
                        <button type="button" onclick="window.appendTeamSkill('React')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-xs transition-colors">+React</button>
                        <button type="button" onclick="window.appendTeamSkill('TypeScript')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-xs transition-colors">+TypeScript</button>
                        <button type="button" onclick="window.appendTeamSkill('Rust')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-xs transition-colors">+Rust</button>
                        <button type="button" onclick="window.appendTeamSkill('Python')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-xs transition-colors">+Python</button>
                        <button type="button" onclick="window.appendTeamSkill('Go')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-xs transition-colors">+Go</button>
                        <button type="button" onclick="window.appendTeamSkill('Three.js')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-xs transition-colors">+Three.js</button>
                        <button type="button" onclick="window.appendTeamSkill('Kubernetes')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-primary/20 hover:text-primary rounded-lg text-xs transition-colors">+Kubernetes</button>
                    </div>
                </div>

                <!-- Looking For & Open Positions -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Looking For (Role Summary) <span class="text-primary">*</span>
                        </label>
                        <input type="text" name="lookingFor" id="team-lookingfor-input" required placeholder="e.g. Senior Rust Backend Specialist" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                    </div>

                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Open Positions (comma separated)
                        </label>
                        <input type="text" name="openPositions" id="team-positions-input" placeholder="e.g. Frontend Dev, Systems Engineer" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                    </div>
                </div>

                <!-- Availability & Projects -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Availability & Schedule
                        </label>
                        <select name="availability" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors cursor-pointer">
                            <option value="Active · 10-15 hrs/wk">Active · 10-15 hrs/wk</option>
                            <option value="Active · Recruiting">Active · Recruiting</option>
                            <option value="Part-time · Open">Part-time · Open</option>
                            <option value="Weekends · Hackathons">Weekends · Hackathons</option>
                            <option value="Full-time · Sprints">Full-time · Sprints</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Assigned Projects (comma separated)
                        </label>
                        <input type="text" name="assignedProjects" placeholder="e.g. CodeCollab Core, AST Visualizer" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button type="button" data-close-modal class="px-5 py-2.5 bg-surface-container rounded-xl text-sm font-semibold hover:bg-surface-variant transition-colors text-on-surface">
                        Cancel
                    </button>
                    <button type="submit" id="submit-team-btn" class="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-primary/25">
                        <span class="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Create Team</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function initCreateTeamForm() {
    window.appendTeamSkill = function(skill) {
        const input = document.getElementById('team-skills-input');
        if (!input) return;
        const current = input.value.split(',').map(s => s.trim()).filter(Boolean);
        if (!current.includes(skill)) {
            current.push(skill);
            input.value = current.join(', ');
        }
    };

    const form = document.getElementById('createTeamForm');
    const submitBtn = document.getElementById('submit-team-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const teamName = formData.get('teamName')?.toString().trim();
        const description = formData.get('description')?.toString().trim();
        const skillsRaw = formData.get('skills')?.toString() || '';
        const lookingFor = formData.get('lookingFor')?.toString().trim();
        const openPositionsRaw = formData.get('openPositions')?.toString() || '';
        const availability = formData.get('availability')?.toString().trim();
        const projectsRaw = formData.get('assignedProjects')?.toString() || '';

        if (!teamName) {
            if (window.UI?.showToast) window.UI.showToast('Please enter a team name', 'error');
            return;
        }

        const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
        const openPositions = openPositionsRaw.split(',').map(s => s.trim()).filter(Boolean);
        const assignedProjects = projectsRaw.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
            teamName,
            description,
            skills,
            lookingFor: lookingFor || 'Looking for passionate developers',
            openPositions: openPositions.length > 0 ? openPositions : ['Collaborator'],
            availability: availability || 'Active · Open for Collaboration',
            assignedProjects
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Creating...`;
        }

        try {
            const res = await window.apiFetch('/api/teams', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const newTeam = await res.json();
                if (window.UI?.closeModal) window.UI.closeModal();
                if (window.UI?.showToast) window.UI.showToast(`Team "${newTeam.teamName}" created successfully!`, 'success');
                
                // Live refresh community view without reload
                if (typeof window.refreshCommunityData === 'function') {
                    await window.refreshCommunityData();
                }
            } else {
                const errData = await res.json();
                if (window.UI?.showToast) window.UI.showToast(errData.error || 'Failed to create team', 'error');
            }
        } catch (err) {
            console.error('Error creating team:', err);
            if (window.UI?.showToast) window.UI.showToast('Network error while creating team', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">add_circle</span><span>Create Team</span>`;
            }
        }
    });
}
