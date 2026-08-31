export function render_learning_center() {
    return `
<main class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span class="material-symbols-outlined text-[14px]">school</span>
                Open Source Academy
            </div>
            <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Learning Center</h1>
            <p class="text-on-surface-variant text-sm md:text-base mt-1 max-w-2xl">
                Master open-source architecture, distributed workflows, and production coding practices.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <a href="#explore" class="px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold shadow-lg shadow-secondary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">code</span> Start Contributing
            </a>
        </div>
    </div>

    <!-- Featured Learning Tracks Bento -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/40 transition-all">
            <div>
                <div class="w-12 h-12 rounded-2xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-[24px]">account_tree</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Track 01</span>
                <h3 class="text-lg font-bold text-on-surface mt-2 mb-1 group-hover:text-primary transition-colors">Git & Contribution Mastery</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed mb-4">Master pull request reviews, rebasing strategies, semantic versioning, and merge conflict resolution.</p>
            </div>
            <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span class="text-on-surface-variant font-mono">6 Modules · Beginner</span>
                <button class="px-3 py-1.5 bg-surface-container rounded-lg font-bold text-primary hover:bg-primary hover:text-on-primary transition-colors">Start Track</button>
            </div>
        </div>

        <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between group hover:border-secondary/40 transition-all">
            <div>
                <div class="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary border border-secondary/30 flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-[24px]">memory</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">Track 02</span>
                <h3 class="text-lg font-bold text-on-surface mt-2 mb-1 group-hover:text-secondary transition-colors">High-Performance Systems</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed mb-4">Build zero-copy networking stacks, distributed caching layers, and WebAssembly extensions in Rust.</p>
            </div>
            <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span class="text-on-surface-variant font-mono">8 Modules · Advanced</span>
                <button class="px-3 py-1.5 bg-surface-container rounded-lg font-bold text-secondary hover:bg-secondary hover:text-on-secondary transition-colors">Start Track</button>
            </div>
        </div>

        <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between group hover:border-tertiary/40 transition-all">
            <div>
                <div class="w-12 h-12 rounded-2xl bg-tertiary/15 text-tertiary border border-tertiary/30 flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-[24px]">smart_toy</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-wider">Track 03</span>
                <h3 class="text-lg font-bold text-on-surface mt-2 mb-1 group-hover:text-tertiary transition-colors">AI & Fullstack Engineering</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed mb-4">Integrate modern LLM reasoning agents, embeddings search, and vector databases into web applications.</p>
            </div>
            <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span class="text-on-surface-variant font-mono">5 Modules · Intermediate</span>
                <button class="px-3 py-1.5 bg-surface-container rounded-lg font-bold text-tertiary hover:bg-tertiary hover:text-on-tertiary transition-colors">Start Track</button>
            </div>
        </div>
    </div>

    <!-- Interactive Articles Section -->
    <div class="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 space-y-6">
        <h2 class="text-xl font-bold font-display text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">article</span>
            Latest Engineering Deep-Dives
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-surface-container/60 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                <div class="text-xs text-primary font-mono mb-1">Architecture · 8 min read</div>
                <h4 class="font-bold text-sm text-on-surface mb-1">Zero-Leakage Privacy in Collaborative Web Platforms</h4>
                <p class="text-xs text-on-surface-variant line-clamp-2">How CodeCollab enforces data scrubbing and sanitization across all public developer APIs.</p>
            </div>
            <div class="p-4 bg-surface-container/60 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                <div class="text-xs text-secondary font-mono mb-1">Frontend · 6 min read</div>
                <h4 class="font-bold text-sm text-on-surface mb-1">Harmonic Particle Simulation with Three.js</h4>
                <p class="text-xs text-on-surface-variant line-clamp-2">Implementing mathematical sine wave fields in real-time WebGL canvas viewports.</p>
            </div>
        </div>
    </div>
</main>
`;
}
