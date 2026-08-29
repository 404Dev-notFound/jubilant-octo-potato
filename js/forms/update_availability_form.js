/*
 * Update Availability Form Component
 * Allows developers to update their live availability, collaboration preferences, and matchmaking status
 */

const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_update_availability_form(user = {}) {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : {};
    const name = user.name || currentUser.name || 'Developer';
    const initial = name ? name.charAt(0).toUpperCase() : 'U';

    const currentAvailability = user.availability || currentUser.availability || 'Available Now';
    const currentLookingFor = user.lookingFor || currentUser.lookingFor || 'Open for collaboration on open-source repos';
    const currentHours = user.hoursPerWeek || currentUser.hoursPerWeek || '10-20 hrs/wk';
    const currentType = user.collaborationType || currentUser.collaborationType || 'Fullstack';
    const currentTimezone = user.timezone || currentUser.timezone || 'UTC+5:30';

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-tertiary overflow-hidden shadow-2xl max-w-xl w-full mx-auto animate-fade-in-up max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-surface-container sticky top-0 z-20 backdrop-blur-md">
            <h3 class="font-bold text-xl text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-tertiary">schedule</span>
                Set Developer Availability
            </h3>
            <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-white/5">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
            <form id="updateAvailabilityForm" class="space-y-6">
                <!-- User Preview Badge -->
                <div class="p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-sm shadow-md">
                            ${initial}
                        </div>
                        <div>
                            <div class="text-[11px] font-bold uppercase tracking-wider text-tertiary">Community Profile</div>
                            <div class="text-sm font-bold text-on-surface">${name}</div>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        Matchmaking
                    </span>
                </div>

                <!-- Availability Status -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Availability Status <span class="text-tertiary">*</span>
                    </label>
                    <select name="availability" id="avail-status-select" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors cursor-pointer">
                        <option value="Available Now" ${currentAvailability.includes('Available') ? 'selected' : ''}>🟢 Available Now</option>
                        <option value="Part-time · 10-15 hrs/wk" ${currentAvailability.includes('Part-time') ? 'selected' : ''}>🟡 Part-time (10-15 hrs/wk)</option>
                        <option value="Weekends · Open for Collab" ${currentAvailability.includes('Weekends') ? 'selected' : ''}>🟣 Weekends Only</option>
                        <option value="Open for Collaboration" ${currentAvailability.includes('Open') ? 'selected' : ''}>🔵 Open for Collaboration</option>
                        <option value="Busy / Focused on Sprints" ${currentAvailability.includes('Busy') ? 'selected' : ''}>🔴 Busy (Limited Bandwidth)</option>
                    </select>
                </div>

                <!-- Weekly Hours & Preferred Role -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Hours per Week
                        </label>
                        <input type="text" name="hoursPerWeek" value="${currentHours}" placeholder="e.g. 10-15 hrs/wk" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                    </div>

                    <div>
                        <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                            Collaboration Role
                        </label>
                        <select name="collaborationType" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors cursor-pointer">
                            <option value="Fullstack Developer" ${currentType.includes('Fullstack') ? 'selected' : ''}>Fullstack Developer</option>
                            <option value="Frontend Specialist" ${currentType.includes('Frontend') ? 'selected' : ''}>Frontend Specialist</option>
                            <option value="Backend Specialist" ${currentType.includes('Backend') ? 'selected' : ''}>Backend Specialist</option>
                            <option value="AI / ML Engineer" ${currentType.includes('AI') || currentType.includes('ML') ? 'selected' : ''}>AI / ML Engineer</option>
                            <option value="DevOps & Cloud Architect" ${currentType.includes('DevOps') ? 'selected' : ''}>DevOps & Cloud Architect</option>
                            <option value="Systems & Rust Specialist" ${currentType.includes('Systems') || currentType.includes('Rust') ? 'selected' : ''}>Systems & Rust Specialist</option>
                        </select>
                    </div>
                </div>

                <!-- Looking For Text -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Looking For (Displayed on your developer card) <span class="text-tertiary">*</span>
                    </label>
                    <textarea name="lookingFor" rows="3" required placeholder="e.g. Open-source repos, Rust backend peers, React/Three.js creative projects..." class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors resize-none">${currentLookingFor}</textarea>
                </div>

                <!-- Timezone -->
                <div>
                    <label class="block text-xs font-bold font-label-sm text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Timezone / Working Hours
                    </label>
                    <input type="text" name="timezone" value="${currentTimezone}" placeholder="e.g. UTC+5:30, UTC-5 (EST), Remote / Flexible" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button type="button" data-close-modal class="px-5 py-2.5 bg-surface-container rounded-xl text-sm font-semibold hover:bg-surface-variant transition-colors text-on-surface">
                        Cancel
                    </button>
                    <button type="submit" id="submit-avail-btn" class="px-6 py-2.5 bg-tertiary text-on-tertiary rounded-xl text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-tertiary/25">
                        <span class="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Save Availability</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function initUpdateAvailabilityForm() {
    const form = document.getElementById('updateAvailabilityForm');
    const submitBtn = document.getElementById('submit-avail-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const availability = formData.get('availability')?.toString().trim();
        const lookingFor = formData.get('lookingFor')?.toString().trim();
        const hoursPerWeek = formData.get('hoursPerWeek')?.toString().trim();
        const collaborationType = formData.get('collaborationType')?.toString().trim();
        const timezone = formData.get('timezone')?.toString().trim();

        if (!availability) {
            if (window.UI?.showToast) window.UI.showToast('Please select your availability', 'error');
            return;
        }

        const payload = {
            availability,
            lookingFor: lookingFor || 'Open for collaboration',
            hoursPerWeek: hoursPerWeek || '10-20 hrs/wk',
            collaborationType: collaborationType || 'Fullstack',
            timezone: timezone || 'UTC'
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Saving...`;
        }

        try {
            const res = await window.apiFetch('/api/users/availability', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                
                // Update local storage currentUser if it exists
                const curStr = localStorage.getItem('currentUser');
                if (curStr) {
                    try {
                        const cur = JSON.parse(curStr);
                        cur.availability = availability;
                        cur.lookingFor = lookingFor;
                        localStorage.setItem('currentUser', JSON.stringify(cur));
                    } catch (e) {}
                }

                if (window.UI?.closeModal) window.UI.closeModal();
                if (window.UI?.showToast) window.UI.showToast('Availability updated successfully!', 'success');

                // Live refresh community view without reload
                if (typeof window.refreshCommunityData === 'function') {
                    await window.refreshCommunityData();
                }
            } else {
                const errData = await res.json();
                if (window.UI?.showToast) window.UI.showToast(errData.error || 'Failed to update availability', 'error');
            }
        } catch (err) {
            console.error('Error updating availability:', err);
            if (window.UI?.showToast) window.UI.showToast('Network error while updating availability', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span><span>Save Availability</span>`;
            }
        }
    });
}
