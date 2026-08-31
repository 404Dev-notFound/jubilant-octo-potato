export function render_documentation() {
    return `
<main class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 min-h-screen text-on-surface animate-fade-in-up">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span class="material-symbols-outlined text-[14px]">menu_book</span>
                Developer Documentation
            </div>
            <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">CodeCollab Platform Docs</h1>
            <p class="text-on-surface-variant text-sm md:text-base mt-1 max-w-2xl">
                Explore comprehensive guides, REST API contracts, architecture blueprints, and contribution workflows.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <a href="#explore" class="px-4 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
                <span class="material-symbols-outlined text-[16px]">folder</span> Explore Projects
            </a>
            <button data-form="contact_admin_modal" class="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">support_agent</span> Get Support
            </button>
        </div>
    </div>

    <!-- Docs Layout Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-1 space-y-6">
            <div class="glass-panel p-5 rounded-2xl border border-white/5 sticky top-24 space-y-6">
                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px]">rocket_launch</span> Getting Started
                    </h3>
                    <ul class="space-y-1.5 text-xs text-on-surface-variant">
                        <li><a href="#doc-intro" class="block p-2 rounded-lg bg-primary/10 text-primary font-bold transition-colors">Platform Overview</a></li>
                        <li><a href="#doc-auth" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Authentication & JWT</a></li>
                        <li><a href="#doc-projects" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Project Workflows</a></li>
                        <li><a href="#doc-kanban" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Kanban & Issues</a></li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px]">api</span> API Reference
                    </h3>
                    <ul class="space-y-1.5 text-xs text-on-surface-variant">
                        <li><a href="#doc-api-rest" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">REST Endpoints</a></li>
                        <li><a href="#doc-api-privacy" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Zero-Email Privacy</a></li>
                        <li><a href="#doc-api-rate" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Rate Limiting</a></li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-tertiary mb-3 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px]">diversity_3</span> Community & Teams
                    </h3>
                    <ul class="space-y-1.5 text-xs text-on-surface-variant">
                        <li><a href="#doc-matchmaking" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Developer Matchmaking</a></li>
                        <li><a href="#doc-guilds" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Guilds & Organizations</a></li>
                        <li><a href="#doc-meetings" class="block p-2 rounded-lg hover:bg-white/5 hover:text-on-surface transition-colors">Sync Meetings</a></li>
                    </ul>
                </div>
            </div>
        </aside>

        <!-- Main Documentation Body -->
        <div class="lg:col-span-3 space-y-10">
            <!-- Overview Section -->
            <section id="doc-intro" class="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 space-y-4">
                <h2 class="text-2xl font-bold font-display text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">terminal</span>
                    1. Platform Architecture Overview
                </h2>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                    CodeCollab is an open-source collaboration ecosystem designed to unite maintainers, contributors, and organizations. The platform features an ultra-responsive Vanilla JavaScript SPA with Tailwind styling and Three.js visual simulations, backed by an Express 5 and PostgreSQL/Prisma ORM data engine.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div class="p-4 bg-surface-container rounded-xl border border-white/5">
                        <div class="text-xs font-mono font-bold text-primary mb-1">Frontend</div>
                        <p class="text-xs text-on-surface-variant">Modular SPA with zero bundle build bottlenecks and instant hash routing.</p>
                    </div>
                    <div class="p-4 bg-surface-container rounded-xl border border-white/5">
                        <div class="text-xs font-mono font-bold text-secondary mb-1">Backend</div>
                        <p class="text-xs text-on-surface-variant">Express 5 REST API with multi-tier origin CORS and security headers.</p>
                    </div>
                    <div class="p-4 bg-surface-container rounded-xl border border-white/5">
                        <div class="text-xs font-mono font-bold text-tertiary mb-1">Datastore</div>
                        <p class="text-xs text-on-surface-variant">Supabase PostgreSQL with dual-storage offline test fallbacks.</p>
                    </div>
                </div>
            </section>

            <!-- Authentication Section -->
            <section id="doc-auth" class="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 space-y-4">
                <h2 class="text-2xl font-bold font-display text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary">security</span>
                    2. Authentication & Session Flow
                </h2>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                    Authentication utilizes stateless JSON Web Tokens (JWT) combined with rotating refresh tokens and bcrypt password hashing. All authenticated endpoints require a standard <code class="px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-xs">Authorization: Bearer &lt;token&gt;</code> header.
                </p>
                <div class="p-4 bg-[#0d1117] rounded-xl border border-white/10 font-mono text-xs text-on-surface overflow-x-auto">
                    <span class="text-secondary">// Example API Request</span><br>
                    fetch('/api/users/profile', {<br>
                    &nbsp;&nbsp;headers: {<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer ' + localStorage.getItem('token'),<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;'Content-Type': 'application/json'<br>
                    &nbsp;&nbsp;}<br>
                    });
                </div>
            </section>

            <!-- API Endpoints Section -->
            <section id="doc-api-rest" class="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 space-y-4">
                <h2 class="text-2xl font-bold font-display text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-tertiary">api</span>
                    3. Key REST API Endpoints
                </h2>
                <div class="space-y-3 text-xs">
                    <div class="p-3 bg-surface-container rounded-xl border border-white/5 flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">GET</span>
                            <span class="font-mono text-on-surface">/api/projects</span>
                        </div>
                        <span class="text-on-surface-variant">Fetch public collaborative repositories</span>
                    </div>
                    <div class="p-3 bg-surface-container rounded-xl border border-white/5 flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">POST</span>
                            <span class="font-mono text-on-surface">/api/projects/:id/issues</span>
                        </div>
                        <span class="text-on-surface-variant">Create a Kanban task (Project members only)</span>
                    </div>
                    <div class="p-3 bg-surface-container rounded-xl border border-white/5 flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono font-bold">GET</span>
                            <span class="font-mono text-on-surface">/api/community/developers</span>
                        </div>
                        <span class="text-on-surface-variant">Matchmaking directory with zero private email leakage</span>
                    </div>
                </div>
            </section>
        </div>
    </div>
</main>
`;
}
