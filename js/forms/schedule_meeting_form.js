const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_schedule_meeting_form(projectId = '', projectTitle = '') {
    const projectBadge = projectTitle 
        ? `<span class="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-mono">${escapeHtml(projectTitle)}</span>` 
        : '';

    // Set default datetime to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const defaultDateStr = tomorrow.toISOString().slice(0, 16);

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-secondary overflow-hidden shadow-2xl max-w-xl w-full mx-auto animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container sticky top-0 z-10 backdrop-blur-md">
            <div class="flex items-center gap-sm">
                <div class="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                    <span class="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <div>
                    <h3 class="font-bold text-lg text-on-surface flex items-center gap-xs">
                        Schedule Meeting
                        ${projectBadge}
                    </h3>
                    <p class="text-xs text-on-surface-variant font-label-sm">Request a sync or consultation with the project owner</p>
                </div>
            </div>
            <button type="button" data-close-modal class="text-on-surface-variant hover:text-error hover:bg-white/5 transition-colors p-1.5 rounded-lg">
                <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
        </div>
        
        <!-- Modal Body / Form -->
        <div class="p-xl">
            <form id="scheduleMeetingForm" class="space-y-md" data-project-id="${projectId}" onsubmit="return window.handleScheduleMeeting(event)">
                <!-- Topic / Title -->
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1" for="meeting-topic">
                        Meeting Topic / Purpose <span class="text-error">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="meeting-topic" 
                        name="topic" 
                        required 
                        placeholder="e.g. Architecture discussion, Onboarding sync, Code contribution review"
                        class="w-full px-md py-sm bg-surface-container rounded-lg border border-white/10 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-secondary transition-colors text-sm font-medium"
                    >
                </div>

                <!-- Preferred Date & Time -->
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1" for="meeting-date">
                        Preferred Date & Time <span class="text-error">*</span>
                    </label>
                    <input 
                        type="datetime-local" 
                        id="meeting-date" 
                        name="preferredDate" 
                        value="${defaultDateStr}"
                        required
                        class="w-full px-md py-sm bg-surface-container rounded-lg border border-white/10 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-secondary transition-colors text-sm font-medium"
                    >
                </div>

                <!-- Agenda / Details -->
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1" for="meeting-message">
                        Agenda & Details (Optional)
                    </label>
                    <textarea 
                        id="meeting-message" 
                        name="message" 
                        rows="3" 
                        placeholder="Briefly describe what you'd like to discuss or collaborate on..."
                        class="w-full px-md py-sm bg-surface-container rounded-lg border border-white/10 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-secondary transition-colors text-sm resize-none"
                    ></textarea>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end gap-sm pt-sm border-t border-white/5">
                    <button 
                        type="button" 
                        data-close-modal 
                        class="px-md py-sm bg-surface-variant rounded-lg text-sm text-on-surface hover:bg-outline-variant transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        id="btn-submit-meeting"
                        class="px-lg py-sm bg-secondary text-on-secondary rounded-lg text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-xs"
                    >
                        <span class="material-symbols-outlined text-[18px]">send</span>
                        Send Meeting Request
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.handleScheduleMeeting = async function(e) {
    e.preventDefault();
    const form = e.target;
    const projectId = form.getAttribute('data-project-id');
    if (!projectId) {
        window.UI.showToast('Invalid project selected', 'error');
        return false;
    }

    const topic = form.querySelector('[name="topic"]')?.value?.trim();
    const preferredDate = form.querySelector('[name="preferredDate"]')?.value;
    const details = form.querySelector('[name="message"]')?.value?.trim();

    if (!topic) {
        window.UI.showToast('Please enter a meeting topic', 'error');
        return false;
    }

    const submitBtn = form.querySelector('#btn-submit-meeting');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Sending...';
    }

    try {
        const fullMessage = details ? `${topic} — ${details}` : topic;
        const res = await window.apiFetch(`/api/projects/${projectId}/meetings`, {
            method: 'POST',
            body: JSON.stringify({
                topic,
                preferredDate: preferredDate ? new Date(preferredDate).toISOString() : null,
                message: fullMessage
            })
        });

        const result = await res.json();
        if (res.ok) {
            window.UI.closeModal();
            window.UI.showToast('Meeting request submitted to project owner!', 'success');
            // Refresh meeting status on current view if available
            if (window.refreshProjectDetailsMeetings) {
                window.refreshProjectDetailsMeetings();
            }
        } else {
            window.UI.showToast(result.error || 'Failed to submit meeting request', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">send</span> Send Meeting Request';
            }
        }
    } catch (err) {
        console.error('Error submitting meeting request:', err);
        window.UI.showToast(err.message || 'Error connecting to backend server', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">send</span> Send Meeting Request';
        }
    }

    return false;
};
