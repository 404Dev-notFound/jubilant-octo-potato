export function render_privacy() {
    return `
<main class="w-full max-w-[1000px] mx-auto px-4 md:px-8 py-12 animate-fade-in text-on-surface">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-mono font-bold uppercase tracking-widest mb-3">
            <span class="material-symbols-outlined text-[14px]">shield</span>
            Privacy Policy
        </div>
        <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Privacy Policy</h1>
        <p class="text-on-surface-variant text-sm mt-2">Last Updated: January 1, 2026 · Built with Zero-Email Exposure Architecture</p>
    </div>

    <!-- Content Sections -->
    <div class="glass-panel p-6 md:p-10 rounded-2xl border border-white/5 space-y-8 leading-relaxed text-sm md:text-base text-on-surface-variant">
        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[22px]">security</span>
                1. Zero-Exposure Principle
            </h2>
            <p>
                At CodeCollab, developer privacy is a core architectural requirement. We guarantee that your personal contact details (such as phone numbers and private email addresses) are never exposed via public developer endpoints, search indices, or public API queries.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">database</span>
                2. Data Collection & Persistence
            </h2>
            <p>
                We only store data required to power open-source collaboration: your chosen display name, username, bio, professional skills, links to public repositories, and participation in teams or projects.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-tertiary text-[22px]">lock</span>
                3. Authentication & Tokens
            </h2>
            <p>
                Passwords are cryptographically hashed using standard blowfish/bcrypt algorithms with high work factors. JWT session tokens and refresh tokens are securely stored in your local browser session and transmitted via TLS encryption.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[22px]">delete_forever</span>
                4. Data Control & Deletion
            </h2>
            <p>
                You retain full control over your projects, issues, looking-for posts, and profile attributes. Deleting a project automatically cascades to clean associated issues, meeting requests, and member rosters.
            </p>
        </section>

        <section class="space-y-3">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">mail</span>
                5. Contacting Privacy Administrator
            </h2>
            <p>
                If you have questions regarding data handling or wish to request data export or deletion, contact our lead administrator at <strong class="text-on-surface">scriptedbydev@gmail.com</strong>.
            </p>
        </section>

        <div class="pt-6 border-t border-white/5 flex items-center justify-between">
            <button onclick="window.history.back()" class="px-5 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all">
                Go Back
            </button>
            <a href="#home" class="px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold shadow-lg shadow-secondary/20 hover:scale-105 transition-all">
                Return to Platform
            </a>
        </div>
    </div>
</main>
`;
}
