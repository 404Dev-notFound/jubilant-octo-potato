/*
 * ==============================================================================
 * CodeCollab — Contact Administrator Modal Component
 * ==============================================================================
 * Official Support Channel: scriptedbydev@gmail.com
 * Reusable modal supporting Password Recovery, Permission Escalation, and General Inquiries.
 */

export function render_contact_admin_modal({ context = 'general', title = null, message = null } = {}) {
    const adminEmail = 'scriptedbydev@gmail.com';
    
    let heading = 'Contact Administrator';
    let icon = 'admin_panel_settings';
    let subject = 'CodeCollab Support Request';
    let defaultMessage = 'Need assistance with your account, project permissions, or platform inquiries? Reach out directly to our lead administrator.';
    let bodyTemplate = `Hello Dev,\n\nI need assistance regarding CodeCollab:\n[Please provide details about your inquiry]\n\nThank you!`;

    if (context === 'forgot-password' || context === 'password-reset') {
        heading = 'Password Recovery Support';
        icon = 'lock_reset';
        subject = 'CodeCollab - Password Reset Request';
        defaultMessage = 'For security and account protection, password recovery is handled directly by our lead administrator. Please email us from your registered address to verify ownership and receive reset instructions.';
        bodyTemplate = `Hello Dev,\n\nI am requesting a password reset for my CodeCollab account.\n\nRegistered Email: [Your Email]\nAccount Username: [Your Name]\n\nThank you!`;
    } else if (context === 'permission' || context === 'access-denied') {
        heading = 'Permission & Access Assistance';
        icon = 'security';
        subject = 'CodeCollab - Permission & Access Request';
        defaultMessage = 'You encountered a restricted resource or permission boundary. If you believe this is an error or require elevated privileges, contact the administrator.';
        bodyTemplate = `Hello Dev,\n\nI am requesting permission access for CodeCollab.\n\nDetails:\n[Describe the project or action you need access to]\n\nThank you!`;
    }

    const displayTitle = title || heading;
    const displayMessage = message || defaultMessage;
    const mailtoHref = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-primary overflow-hidden shadow-2xl max-w-lg w-full mx-auto animate-fade-in-up">
        <!-- Header -->
        <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container relative">
            <h3 class="font-bold text-xl text-on-surface flex items-center gap-xs">
                <span class="material-symbols-outlined text-primary">${icon}</span>
                ${displayTitle}
            </h3>
            <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 absolute right-4 top-4" title="Close">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>

        <!-- Body Content -->
        <div class="p-xl space-y-md">
            <div class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full w-fit text-xs font-semibold text-primary">
                <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                Official Support Channel
            </div>

            <p class="text-on-surface-variant text-sm leading-relaxed">
                ${displayMessage}
            </p>

            <!-- Admin Email Card -->
            <div class="p-md rounded-xl bg-surface-container-high border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
                <div class="flex items-center gap-sm">
                    <div class="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shrink-0">
                        <span class="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <div>
                        <div class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Lead Administrator</div>
                        <div class="text-sm font-bold text-on-surface select-all">${adminEmail}</div>
                    </div>
                </div>
                <button type="button" onclick="navigator.clipboard.writeText('${adminEmail}').then(() => window.UI?.showToast('Copied ${adminEmail} to clipboard!', 'success')).catch(() => {})" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 text-on-surface shrink-0">
                    <span class="material-symbols-outlined text-[14px]">content_copy</span> Copy
                </button>
            </div>

            <!-- Action Buttons -->
            <div class="pt-sm flex flex-col sm:flex-row gap-sm">
                <a href="${mailtoHref}" target="_blank" rel="noopener noreferrer" class="flex-1 py-md bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-xs text-center">
                    <span class="material-symbols-outlined text-sm">outgoing_mail</span>
                    Contact Admin via Email
                </a>
                <button type="button" data-close-modal class="px-lg py-md bg-surface-variant hover:bg-outline-variant text-on-surface rounded-xl text-sm font-semibold transition-colors">
                    Close
                </button>
            </div>
        </div>
    </div>
    `;
}
