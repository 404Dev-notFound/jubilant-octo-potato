export function render_contact() {
    const adminEmail = 'scriptedbydev@gmail.com';
    return `
    <main class="w-full max-w-[1200px] mx-auto p-lg md:p-xl flex flex-col pt-8 animate-fade-in-up">
        <!-- Header -->
        <div class="text-center max-w-2xl mx-auto mb-xl">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary mb-md">
                <span class="material-symbols-outlined text-[16px]">support_agent</span>
                CODECOLLAB SUPPORT & HELP CENTER
            </div>
            <h1 class="font-display text-headline-lg font-bold text-on-surface mb-sm">How Can We Help You?</h1>
            <p class="text-on-surface-variant text-sm md:text-base leading-relaxed">
                Connect with our team and lead administrator directly for technical support, account recovery, organization partnerships, or platform inquiries.
            </p>
        </div>

        <!-- Featured Contact Admin Card -->
        <div class="glass-panel rounded-2xl border-t-4 border-t-primary p-lg md:p-xl shadow-2xl relative overflow-hidden mb-xl">
            <div class="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-lg">
                <div class="space-y-sm max-w-xl">
                    <div class="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                        Official Administrator Contact
                    </div>
                    <h2 class="text-2xl font-bold text-on-surface font-display">Direct Line to Lead Admin</h2>
                    <p class="text-sm text-on-surface-variant leading-relaxed">
                        For critical security reports, password assistance, organization onboarding, or API access escalation, reach out directly to Dev.
                    </p>
                    <div class="inline-flex items-center gap-sm bg-surface-container-high px-md py-sm rounded-xl border border-white/10 mt-xs">
                        <span class="material-symbols-outlined text-primary text-[20px]">mail</span>
                        <span class="text-sm font-mono font-bold text-on-surface select-all">${adminEmail}</span>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row lg:flex-col gap-sm w-full lg:w-auto shrink-0">
                    <button type="button" data-contact-admin="general" class="px-xl py-md bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-xs">
                        <span class="material-symbols-outlined text-sm">outgoing_mail</span>
                        Open Contact Admin Modal
                    </button>
                    <a href="mailto:${adminEmail}?subject=CodeCollab%20General%20Inquiry" class="px-xl py-md bg-surface-variant hover:bg-outline-variant text-on-surface rounded-xl font-bold text-sm transition-colors text-center flex items-center justify-center gap-xs">
                        <span class="material-symbols-outlined text-sm">mail</span>
                        Direct Email Client
                    </a>
                </div>
            </div>
        </div>

        <!-- Support Category Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
            <!-- Card 1: Password & Account Recovery -->
            <div class="glass-card bg-surface-container-low/50 backdrop-blur-md rounded-2xl border border-white/10 p-lg flex flex-col justify-between hover:border-primary/40 transition-all group">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-[24px]">lock_reset</span>
                    </div>
                    <h3 class="font-bold text-lg text-on-surface mb-xs">Account & Password Recovery</h3>
                    <p class="text-xs text-on-surface-variant leading-relaxed mb-md">
                        Forgot your credentials or need account verification assistance? Our administrator verifies account ownership securely.
                    </p>
                </div>
                <button type="button" data-contact-admin="forgot-password" class="w-full py-sm bg-surface-container-high hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">support_agent</span> Password Help
                </button>
            </div>

            <!-- Card 2: Permissions & Project Management -->
            <div class="glass-card bg-surface-container-low/50 backdrop-blur-md rounded-2xl border border-white/10 p-lg flex flex-col justify-between hover:border-secondary/40 transition-all group">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-[24px]">security</span>
                    </div>
                    <h3 class="font-bold text-lg text-on-surface mb-xs">Permissions & Organizations</h3>
                    <p class="text-xs text-on-surface-variant leading-relaxed mb-md">
                        Need organization admin permissions, project ownership transfer, or elevated collaborator roles? Request elevation here.
                    </p>
                </div>
                <button type="button" data-contact-admin="permission" class="w-full py-sm bg-surface-container-high hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">vpn_key</span> Request Access
                </button>
            </div>

            <!-- Card 3: Bug Reports & Feedback -->
            <div class="glass-card bg-surface-container-low/50 backdrop-blur-md rounded-2xl border border-white/10 p-lg flex flex-col justify-between hover:border-tertiary/40 transition-all group">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-[24px]">bug_report</span>
                    </div>
                    <h3 class="font-bold text-lg text-on-surface mb-xs">Bug Reports & Feedback</h3>
                    <p class="text-xs text-on-surface-variant leading-relaxed mb-md">
                        Found an anomaly, security vulnerability, or UI suggestion? Submit detailed feedback directly to the development lead.
                    </p>
                </div>
                <button type="button" data-contact-admin="general" data-title="Submit Bug Report or Feedback" class="w-full py-sm bg-surface-container-high hover:bg-tertiary/20 text-tertiary border border-tertiary/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">feedback</span> Send Feedback
                </button>
            </div>
        </div>

        <!-- FAQ Section -->
        <div class="glass-panel rounded-2xl p-lg md:p-xl border border-white/5 space-y-md">
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-xs">
                <span class="material-symbols-outlined text-primary">help_outline</span>
                Frequently Asked Questions
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-md text-sm">
                <div class="p-md rounded-xl bg-surface-container border border-white/5">
                    <div class="font-bold text-on-surface mb-1">What is the official response time?</div>
                    <div class="text-xs text-on-surface-variant leading-relaxed">Administrator inquiries sent to <code class="text-primary">${adminEmail}</code> are typically answered within 24 to 48 hours.</div>
                </div>
                <div class="p-md rounded-xl bg-surface-container border border-white/5">
                    <div class="font-bold text-on-surface mb-1">How do I verify account ownership?</div>
                    <div class="text-xs text-on-surface-variant leading-relaxed">Always send requests from the email associated with your CodeCollab account so we can verify identity securely.</div>
                </div>
            </div>
        </div>
    </main>
    `;
}
