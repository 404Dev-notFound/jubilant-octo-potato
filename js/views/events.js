export function render_events() {
    return `
<main class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                Community Gatherings
            </div>
            <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Events & Hackathons</h1>
            <p class="text-on-surface-variant text-sm md:text-base mt-1 max-w-2xl">
                Compete in open-source hackathons, attend technical webinars, and build products with global engineering teams.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <button data-form="create_team_form" class="px-5 py-2.5 bg-tertiary text-on-tertiary rounded-xl text-xs font-bold shadow-lg shadow-tertiary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">groups</span> Form a Team
            </button>
        </div>
    </div>

    <!-- Featured Hackathon Banner -->
    <div class="glass-panel p-8 md:p-10 rounded-3xl border border-tertiary/30 bg-gradient-to-br from-tertiary/10 via-surface-container-low to-surface mb-10 relative overflow-hidden shadow-2xl">
        <div class="absolute top-0 right-0 w-96 h-96 bg-tertiary/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10 max-w-2xl space-y-4">
            <span class="px-3 py-1 bg-tertiary/20 text-tertiary border border-tertiary/40 rounded-full text-xs font-bold uppercase tracking-wider">
                Flagship Event · Live Registration
            </span>
            <h2 class="text-3xl md:text-4xl font-display font-black text-on-surface">CodeCollab Global Open Source Hackathon 2026</h2>
            <p class="text-sm text-on-surface-variant leading-relaxed">
                48 hours of collaborative sprint building next-generation developer tooling, AI integrations, and WebAssembly systems. Over $25,000 in ecosystem grants and bounties.
            </p>
            <div class="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono">
                <div class="flex items-center gap-2 text-on-surface">
                    <span class="material-symbols-outlined text-tertiary">calendar_today</span>
                    <span>March 20–22, 2026</span>
                </div>
                <div class="flex items-center gap-2 text-on-surface">
                    <span class="material-symbols-outlined text-primary">public</span>
                    <span>Global · Online & Remote</span>
                </div>
                <div class="flex items-center gap-2 text-on-surface">
                    <span class="material-symbols-outlined text-secondary">payments</span>
                    <span>$25,000 Prize Pool</span>
                </div>
            </div>
            <div class="pt-4 flex items-center gap-3">
                <button onclick="window.UI?.showToast('Registration submitted for Global Hackathon!', 'success')" class="px-6 py-3 bg-tertiary text-on-tertiary font-bold rounded-xl text-sm shadow-lg shadow-tertiary/30 hover:scale-105 transition-transform flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">how_to_reg</span> Register for Hackathon
                </button>
                <a href="#community" class="px-5 py-3 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-sm font-semibold transition-colors">
                    Find Teammates
                </a>
            </div>
        </div>
    </div>

    <!-- Upcoming Events Grid -->
    <div class="space-y-6">
        <h3 class="text-xl font-bold font-display text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">event_upcoming</span> Upcoming Community Meetups
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-3">
                        <span>Webinar</span>
                        <span class="text-primary font-bold">In 3 Days</span>
                    </div>
                    <h4 class="font-bold text-base text-on-surface mb-2">Building Zero-Copy AST Linters with Rust</h4>
                    <p class="text-xs text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">Deep-dive workshop with core maintainers exploring tokenization, parallel parsing, and memory optimization.</p>
                </div>
                <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span class="text-on-surface-variant">Host: Alex Rivera</span>
                    <button onclick="window.UI?.showToast('Added to calendar!', 'info')" class="text-primary font-bold hover:underline">Add to Calendar</button>
                </div>
            </div>

            <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-3">
                        <span>Sprint</span>
                        <span class="text-secondary font-bold">Next Weekend</span>
                    </div>
                    <h4 class="font-bold text-base text-on-surface mb-2">CodeCollab First PR Weekend Sprint</h4>
                    <p class="text-xs text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">Guided sprint for developers submitting their first pull requests to verified CodeCollab open-source projects.</p>
                </div>
                <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span class="text-on-surface-variant">Host: Community Leads</span>
                    <button onclick="window.UI?.showToast('Added to calendar!', 'info')" class="text-secondary font-bold hover:underline">Add to Calendar</button>
                </div>
            </div>

            <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-3">
                        <span>Panel</span>
                        <span class="text-tertiary font-bold">April 5, 2026</span>
                    </div>
                    <h4 class="font-bold text-base text-on-surface mb-2">The Future of AI-Assisted Open Source</h4>
                    <p class="text-xs text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">Panel conversation with founders and engineers discussing AI code review automation and developer matchmaking.</p>
                </div>
                <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span class="text-on-surface-variant">Host: CodeCollab Team</span>
                    <button onclick="window.UI?.showToast('Added to calendar!', 'info')" class="text-tertiary font-bold hover:underline">Add to Calendar</button>
                </div>
            </div>
        </div>
    </div>
</main>
`;
}
