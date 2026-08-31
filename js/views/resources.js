export function render_resources() {
    return `
<main class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span class="material-symbols-outlined text-[14px]">library_books</span>
                Tooling & Starter Kits
            </div>
            <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Developer Resources</h1>
            <p class="text-on-surface-variant text-sm md:text-base mt-1 max-w-2xl">
                Open-source boilerplates, API templates, architecture blueprints, and design system primitives.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <a href="#add_project" class="px-5 py-2.5 bg-tertiary text-on-tertiary rounded-xl text-xs font-bold shadow-lg shadow-tertiary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">add_box</span> Add Your Template
            </a>
        </div>
    </div>

    <!-- Templates & Boilerplates Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <span class="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">TypeScript / React</span>
                    <span class="text-xs text-on-surface-variant font-mono">MIT</span>
                </div>
                <h3 class="text-base font-bold text-on-surface mb-2">Modern SPA Starter Kit</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed mb-4">Production-ready template with Tailwind CSS, Three.js cosmic canvas backdrop, and modular hash routing.</p>
            </div>
            <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span class="text-on-surface-variant font-mono">1.4k Stars</span>
                <button onclick="navigator.clipboard.writeText('https://github.com/404Dev-notFound/jubilant-octo-potato').then(() => window.UI?.showToast('Repository clone URL copied!', 'success'))" class="px-3 py-1.5 bg-surface-container rounded-lg font-bold text-primary hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">content_copy</span> Clone
                </button>
            </div>
        </div>

        <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <span class="px-2.5 py-1 rounded-md bg-secondary/10 text-secondary font-mono text-xs font-bold">Rust / WASM</span>
                    <span class="text-xs text-on-surface-variant font-mono">Apache 2.0</span>
                </div>
                <h3 class="text-base font-bold text-on-surface mb-2">High-Throughput Microservice Boilerplate</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed mb-4">Async Actix/Tokio backend scaffolding with zero-copy JSON parsing and Postgres connection pooling.</p>
            </div>
            <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span class="text-on-surface-variant font-mono">890 Stars</span>
                <button onclick="navigator.clipboard.writeText('https://github.com/404Dev-notFound/jubilant-octo-potato').then(() => window.UI?.showToast('Repository clone URL copied!', 'success'))" class="px-3 py-1.5 bg-surface-container rounded-lg font-bold text-secondary hover:bg-secondary hover:text-on-secondary transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">content_copy</span> Clone
                </button>
            </div>
        </div>

        <div class="magic-bento-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <span class="px-2.5 py-1 rounded-md bg-tertiary/10 text-tertiary font-mono text-xs font-bold">Python / FastAPI</span>
                    <span class="text-xs text-on-surface-variant font-mono">MIT</span>
                </div>
                <h3 class="text-base font-bold text-on-surface mb-2">AI Agent & LLM Orchestrator Template</h3>
                <p class="text-xs text-on-surface-variant leading-relaxed mb-4">Scaffold for multi-agent reasoning, semantic embeddings indexing, and streaming WebSocket output.</p>
            </div>
            <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span class="text-on-surface-variant font-mono">2.1k Stars</span>
                <button onclick="navigator.clipboard.writeText('https://github.com/404Dev-notFound/jubilant-octo-potato').then(() => window.UI?.showToast('Repository clone URL copied!', 'success'))" class="px-3 py-1.5 bg-surface-container rounded-lg font-bold text-tertiary hover:bg-tertiary hover:text-on-tertiary transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">content_copy</span> Clone
                </button>
            </div>
        </div>
    </div>
</main>
`;
}
