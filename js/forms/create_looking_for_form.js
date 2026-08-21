/*
 * Create Looking-For Matchmaking Request Form
 * Lets developers post open coding-mate requests for repos, hackathons, and projects
 */

export function render_create_looking_for_form() {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const authorName = currentUser ? (currentUser.name || 'Developer') : 'Developer';
    const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : 'U';

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-tertiary overflow-hidden shadow-2xl max-w-2xl w-full mx-auto animate-fade-in-up max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-surface-container sticky top-0 z-20 backdrop-blur-md">
            <h3 class="font-bold text-xl text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-tertiary">handshake</span>
                Post a Coding-Mate Request
            </h3>
            <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-white/5">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
            <form id="createLookingForForm" class="space-y-6">
                <!-- Author Banner -->
                <div class="p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-sm shadow-md">
                            ${authorInitial}
                        </div>
                        <div>
                            <div class="text-[11px] font-bold uppercase tracking-wider text-tertiary">Matchmaking Request Author</div>
                            <div class="text-sm font-bold text-on-surface">${authorName}</div>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        Looking For Mate
                    </span>
                </div>

                <!-- Looking For (Role) -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Looking For (Target Role / Specialist) <span class="text-tertiary">*</span>
                    </label>
                    <input type="text" name="lookingFor" id="match-lookingfor-input" required placeholder="e.g. React & WebSockets Frontend Specialist, Rust / WASM Optimizer" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                </div>

                <!-- For (Project / Initiative Name) -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        For Project / Repository / Initiative <span class="text-tertiary">*</span>
                    </label>
                    <input type="text" name="for" id="match-for-input" required placeholder="e.g. Real-time Collaborative Code Canvas, AST Security Linter" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                </div>

                <!-- Required Skills -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Required Technologies / Skills (comma separated) <span class="text-tertiary">*</span>
                    </label>
                    <input type="text" name="requiredSkills" id="match-skills-input" required placeholder="e.g. React, TypeScript, WebSockets, Canvas API" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                    
                    <div class="flex flex-wrap gap-1.5 mt-2">
                        <span class="text-[11px] text-on-surface-variant self-center mr-1">Quick Add:</span>
                        <button type="button" onclick="window.appendMatchSkill('React')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-tertiary/20 hover:text-tertiary rounded-lg text-xs transition-colors">+React</button>
                        <button type="button" onclick="window.appendMatchSkill('TypeScript')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-tertiary/20 hover:text-tertiary rounded-lg text-xs transition-colors">+TypeScript</button>
                        <button type="button" onclick="window.appendMatchSkill('Rust')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-tertiary/20 hover:text-tertiary rounded-lg text-xs transition-colors">+Rust</button>
                        <button type="button" onclick="window.appendMatchSkill('WebSockets')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-tertiary/20 hover:text-tertiary rounded-lg text-xs transition-colors">+WebSockets</button>
                        <button type="button" onclick="window.appendMatchSkill('Python')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-tertiary/20 hover:text-tertiary rounded-lg text-xs transition-colors">+Python</button>
                        <button type="button" onclick="window.appendMatchSkill('FastAPI')" class="px-2 py-0.5 bg-surface-container-highest hover:bg-tertiary/20 hover:text-tertiary rounded-lg text-xs transition-colors">+FastAPI</button>
                    </div>
                </div>

                <!-- Commitment & Availability -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Commitment Level
                        </label>
                        <select name="commitment" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors cursor-pointer">
                            <option value="Part-time (8-10 hrs/wk)">Part-time (8-10 hrs/wk)</option>
                            <option value="Weekend Hackathon / Sprint">Weekend Hackathon / Sprint</option>
                            <option value="Flexible (5-8 hrs/wk)">Flexible (5-8 hrs/wk)</option>
                            <option value="Active Sprints (15+ hrs/wk)">Active Sprints (15+ hrs/wk)</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Availability & Timezone
                        </label>
                        <input type="text" name="availability" placeholder="e.g. Available Now · UTC+5:30 / UTC-5" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                    </div>
                </div>

                <!-- Context & Collaboration Details -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Context & Collaboration Details <span class="text-tertiary">*</span>
                    </label>
                    <textarea name="context" id="match-context-input" rows="4" required placeholder="Detail what you are building, the architecture, and what you want to achieve with your collaborator..." class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors resize-none"></textarea>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button type="button" data-close-modal class="px-5 py-2.5 bg-surface-container rounded-xl text-sm font-semibold hover:bg-surface-variant transition-colors text-on-surface">
                        Cancel
                    </button>
                    <button type="submit" id="submit-match-btn" class="px-6 py-2.5 bg-tertiary text-on-tertiary rounded-xl text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-tertiary/25">
                        <span class="material-symbols-outlined text-[18px]">send</span>
                        <span>Publish Request</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function initCreateLookingForForm() {
    window.appendMatchSkill = function(skill) {
        const input = document.getElementById('match-skills-input');
        if (!input) return;
        const current = input.value.split(',').map(s => s.trim()).filter(Boolean);
        if (!current.includes(skill)) {
            current.push(skill);
            input.value = current.join(', ');
        }
    };

    const form = document.getElementById('createLookingForForm');
    const submitBtn = document.getElementById('submit-match-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const lookingFor = formData.get('lookingFor')?.toString().trim();
        const forGoal = formData.get('for')?.toString().trim();
        const skillsRaw = formData.get('requiredSkills')?.toString() || '';
        const commitment = formData.get('commitment')?.toString().trim();
        const availability = formData.get('availability')?.toString().trim();
        const context = formData.get('context')?.toString().trim();

        if (!lookingFor || !forGoal) {
            if (window.UI?.showToast) window.UI.showToast('Please fill in required fields', 'error');
            return;
        }

        const requiredSkills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
            lookingFor,
            for: forGoal,
            requiredSkills,
            commitment: commitment || 'Part-time (8-10 hrs/wk)',
            availability: availability || 'Available Now',
            context: context || ''
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Publishing...`;
        }

        try {
            const res = await window.apiFetch('/api/community/looking-for', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                if (window.UI?.closeModal) window.UI.closeModal();
                if (window.UI?.showToast) window.UI.showToast('Matchmaking request posted successfully!', 'success');

                // Live refresh community view without reload
                if (typeof window.refreshCommunityData === 'function') {
                    await window.refreshCommunityData();
                }
            } else {
                const errData = await res.json();
                if (window.UI?.showToast) window.UI.showToast(errData.error || 'Failed to post request', 'error');
            }
        } catch (err) {
            console.error('Error posting matchmaking request:', err);
            if (window.UI?.showToast) window.UI.showToast('Network error while posting request', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">send</span><span>Publish Request</span>`;
            }
        }
    });
}
