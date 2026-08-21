/*
 * Join Team Modal Form Component
 * Allows developers to send a formal join request or position application to a team lead
 */

export function render_join_team_form(options = {}) {
    const teamId = options.teamId || '';
    const teamName = options.teamName || 'Team';
    const position = options.position || '';
    const leadName = options.leadName || 'Team Lead';

    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const applicantName = currentUser ? (currentUser.name || 'Developer') : 'Developer';

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-primary overflow-hidden shadow-2xl max-w-lg w-full mx-auto animate-fade-in-up flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-surface-container sticky top-0 z-20 backdrop-blur-md">
            <h3 class="font-bold text-xl text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">group_add</span>
                Join ${teamName}
            </h3>
            <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-white/5">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 md:p-8 space-y-5">
            <!-- Team & Lead Context Banner -->
            <div class="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                <div>
                    <div class="text-[11px] font-bold uppercase tracking-wider text-primary">Target Team</div>
                    <div class="text-sm font-bold text-on-surface">${teamName}</div>
                    <div class="text-xs text-on-surface-variant mt-0.5">Team Lead: <span class="text-on-surface font-semibold">${leadName}</span></div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                    <span class="material-symbols-outlined text-[22px]">diversity_3</span>
                </div>
            </div>

            <form id="joinTeamModalForm" class="space-y-4">
                <input type="hidden" name="teamId" value="${teamId}">

                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Target Position / Role <span class="text-primary">*</span>
                    </label>
                    <input type="text" name="position" value="${position}" required placeholder="e.g. Frontend Developer, Rust Backend Specialist" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                </div>

                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Message & Introduction <span class="text-primary">*</span>
                    </label>
                    <textarea name="message" rows="4" required placeholder="Introduce yourself, your primary skills, relevant projects, and why you would love to collaborate..." class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none"></textarea>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                    <button type="button" data-close-modal class="px-5 py-2 bg-surface-container rounded-xl text-sm font-semibold hover:bg-surface-variant transition-colors text-on-surface">
                        Cancel
                    </button>
                    <button type="submit" id="submit-join-modal-btn" class="px-5 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:scale-105 transition-transform flex items-center gap-1.5 shadow-lg shadow-primary/25">
                        <span class="material-symbols-outlined text-[18px]">send</span>
                        <span>Send Application</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function initJoinTeamForm(options = {}) {
    const form = document.getElementById('joinTeamModalForm');
    const submitBtn = document.getElementById('submit-join-modal-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const teamId = formData.get('teamId')?.toString() || options.teamId;
        const position = formData.get('position')?.toString().trim();
        const message = formData.get('message')?.toString().trim();

        if (!teamId) {
            if (window.UI?.showToast) window.UI.showToast('Invalid team ID', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Sending...`;
        }

        try {
            const res = await window.apiFetch(`/api/teams/${teamId}/join`, {
                method: 'POST',
                body: JSON.stringify({ position, message })
            });

            if (res.ok) {
                const data = await res.json();
                if (window.UI?.closeModal) window.UI.closeModal();
                if (window.UI?.showToast) window.UI.showToast(data.message || 'Join request sent to team lead!', 'success');
            } else {
                const errData = await res.json();
                if (window.UI?.showToast) window.UI.showToast(errData.error || 'Failed to submit join request', 'error');
            }
        } catch (err) {
            console.error('Error submitting join request:', err);
            if (window.UI?.showToast) window.UI.showToast('Network error while submitting request', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">send</span><span>Send Application</span>`;
            }
        }
    });
}
