export function render_welcome() {
    return `
<main class="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-12 min-h-screen text-on-surface animate-fade-in-up flex flex-col items-center justify-center text-center">
    <!-- Badge -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-widest mb-6">
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        Welcome to the Ecosystem
    </div>

    <!-- Main Title -->
    <h1 class="text-4xl md:text-6xl font-display font-black text-on-surface tracking-tight max-w-3xl leading-tight">
        Build, Collaborate & Scale <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">Open Source</span>
    </h1>
    <p class="text-base md:text-lg text-on-surface-variant max-w-2xl mt-4 mb-10 leading-relaxed">
        CodeCollab is the unified platform for finding project collaborators, managing Kanban tasks, creating developer guilds, and shipping great software together.
    </p>

    <!-- Quick Action Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-12 text-left">
        <div onclick="window.location.hash='explore'" class="magic-bento-card p-6 rounded-2xl cursor-pointer hover:border-primary/40 transition-all flex flex-col justify-between group">
            <div>
                <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">folder_open</span>
                </div>
                <h3 class="font-bold text-base text-on-surface mb-1">Explore Projects</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed">Discover active repositories looking for developers and first PRs.</p>
            </div>
            <div class="pt-4 text-xs font-bold text-primary flex items-center gap-1">
                <span>Browse</span> <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
        </div>

        <div onclick="window.location.hash='community'" class="magic-bento-card p-6 rounded-2xl cursor-pointer hover:border-secondary/40 transition-all flex flex-col justify-between group">
            <div>
                <div class="w-12 h-12 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">handshake</span>
                </div>
                <h3 class="font-bold text-base text-on-surface mb-1">Find Collaborators</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed">Post open matchmaking requests or join specialized engineering guilds.</p>
            </div>
            <div class="pt-4 text-xs font-bold text-secondary flex items-center gap-1">
                <span>Matchmake</span> <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
        </div>

        <div onclick="window.location.hash='add_project'" class="magic-bento-card p-6 rounded-2xl cursor-pointer hover:border-tertiary/40 transition-all flex flex-col justify-between group">
            <div>
                <div class="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary border border-tertiary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">add_box</span>
                </div>
                <h3 class="font-bold text-base text-on-surface mb-1">Publish Repository</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed">Scaffold your project, invite team members, and manage Kanban issues.</p>
            </div>
            <div class="pt-4 text-xs font-bold text-tertiary flex items-center gap-1">
                <span>Publish</span> <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
        </div>

        <div onclick="window.location.hash='documentation'" class="magic-bento-card p-6 rounded-2xl cursor-pointer hover:border-white/30 transition-all flex flex-col justify-between group">
            <div>
                <div class="w-12 h-12 rounded-xl bg-white/10 text-on-surface border border-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">menu_book</span>
                </div>
                <h3 class="font-bold text-base text-on-surface mb-1">Read Docs</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed">Learn about REST endpoints, zero-leakage privacy, and authentication.</p>
            </div>
            <div class="pt-4 text-xs font-bold text-on-surface flex items-center gap-1">
                <span>Read</span> <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
        </div>
    </div>
</main>
`;
}
