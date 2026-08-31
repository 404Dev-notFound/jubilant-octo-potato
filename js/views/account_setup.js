export function render_account_setup() {
    const currentUserStr = localStorage.getItem('currentUser');
    let user = { name: '', title: '', bio: '', skills: [], location: '' };
    if (currentUserStr) {
        try { user = { ...user, ...JSON.parse(currentUserStr) }; } catch (e) {}
    }
    const skillsList = Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || '');

    return `
<main class="w-full max-w-[900px] mx-auto px-4 md:px-8 py-10 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="mb-8 text-center max-w-lg mx-auto">
        <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-[28px]">manage_accounts</span>
        </div>
        <h1 class="text-3xl font-display font-extrabold text-on-surface tracking-tight">Setup Your Developer Profile</h1>
        <p class="text-xs md:text-sm text-on-surface-variant mt-1">Configure your open-source identity to connect with peer developers, guilds, and repos.</p>
    </div>

    <!-- Onboarding Form Container -->
    <div class="glass-panel p-6 md:p-10 rounded-2xl border border-white/10 bg-surface-container-low/70 backdrop-blur-md shadow-2xl">
        <form id="editProfileForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Display Name <span class="text-primary">*</span></label>
                    <input type="text" name="name" value="${user.name || ''}" placeholder="e.g. Alex Rivera" required class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Role / Headline <span class="text-primary">*</span></label>
                    <input type="text" name="title" value="${user.title || ''}" placeholder="e.g. Senior Fullstack Engineer" required class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Bio & Focus</label>
                <textarea name="bio" rows="3" placeholder="Tell other developers about what you build and the projects you're excited to contribute to..." class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none">${user.bio || ''}</textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Primary Skills (comma-separated) <span class="text-primary">*</span></label>
                    <input type="text" name="skills" value="${skillsList}" placeholder="Rust, TypeScript, React, Docker, Python" required class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Location / Timezone</label>
                    <input type="text" name="location" value="${user.location || ''}" placeholder="e.g. San Francisco, CA · UTC-7" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                </div>
            </div>

            <div class="pt-6 border-t border-white/5 flex items-center justify-between">
                <button type="button" onclick="window.location.hash='dashboard'" class="px-5 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all">
                    Skip for Now
                </button>
                <button type="submit" class="px-8 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform flex items-center gap-2">
                    <span>Complete Setup</span>
                    <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
            </div>
        </form>
    </div>
</main>
`;
}
