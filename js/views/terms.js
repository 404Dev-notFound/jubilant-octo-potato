export function render_terms() {
    return `
<main class="w-full max-w-[1000px] mx-auto px-4 md:px-8 py-12 animate-fade-in text-on-surface">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-widest mb-3">
            <span class="material-symbols-outlined text-[14px]">gavel</span>
            Legal Terms
        </div>
        <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Terms of Service</h1>
        <p class="text-on-surface-variant text-sm mt-2">Effective Date: January 1, 2026 · Version 2.0</p>
    </div>

    <!-- Content Sections -->
    <div class="glass-panel p-6 md:p-10 rounded-2xl border border-white/5 space-y-8 leading-relaxed text-sm md:text-base text-on-surface-variant">
        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">verified_user</span>
                1. Acceptance of Terms
            </h2>
            <p>
                By accessing or using the CodeCollab platform, services, or APIs, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access or use our platform.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[22px]">code</span>
                2. Open Source Collaboration & Code of Conduct
            </h2>
            <p>
                CodeCollab is dedicated to providing a secure, productive, and inclusive ecosystem for developers worldwide. Users agree to respect copyright, intellectual property licenses (e.g., MIT, Apache 2.0, GPL), and interact constructively in issues, matchmaking, and team discussions.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-tertiary text-[22px]">lock</span>
                3. Account Security & Privacy Protection
            </h2>
            <p>
                You are responsible for maintaining the confidentiality of your account credentials. CodeCollab enforces strict data isolation; sensitive fields like contact phone numbers and personal emails are never exposed publicly on the developer registry.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">handshake</span>
                4. Matchmaking & Community Responsibilities
            </h2>
            <p>
                Team leads, organization owners, and individual contributors agree to treat commitments with professionalism. All communications must comply with standard anti-harassment community guidelines.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[22px]">support_agent</span>
                5. Contact & Support
            </h2>
            <p>
                For legal inquiries, account recovery, or administrative queries, contact our lead administrator at <strong class="text-on-surface">scriptedbydev@gmail.com</strong>.
            </p>
        </section>

        <div class="pt-6 border-t border-white/5 flex items-center justify-between">
            <button onclick="window.history.back()" class="px-5 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all">
                Go Back
            </button>
            <a href="#home" class="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                Return to Platform
            </a>
        </div>
    </div>
</main>
`;
}
