/*
 * Explore View for CodeCollab
 * Discover open-source projects, search by language / tech stack, and filter by difficulty.
 */

export function render_explore() {
    return `
<main class="relative w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col min-h-screen pt-4 animate-fade-in-up">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                Open Repositories
            </div>
            <h1 class="font-display text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight">Explore Projects</h1>
            <p class="text-on-surface-variant text-sm md:text-base mt-1">Discover vetted open-source projects, find beginner-friendly issues, and start contributing.</p>
        </div>
        <button data-form="add_project_form" class="px-5 py-3 bg-primary text-on-primary rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/25 flex items-center gap-2 text-sm">
            <span class="material-symbols-outlined text-[18px]">add_circle</span> Add Project
        </button>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-72 space-y-6 shrink-0">
            <div class="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                <!-- Search Input -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Search</label>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                        <input id="explore-search-input" type="text" placeholder="Search title or tech..." class="w-full bg-surface-container border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                    </div>
                </div>

                <div class="h-[1px] bg-white/5 w-full"></div>

                <!-- Difficulty Filter -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Difficulty</label>
                    <select id="explore-difficulty-filter" class="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary cursor-pointer">
                        <option value="all">All Difficulties</option>
                        <option value="beginner">Beginner Friendly</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced / Systems</option>
                    </select>
                </div>

                <!-- Category Filter -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Category</label>
                    <select id="explore-category-filter" class="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary cursor-pointer">
                        <option value="all">All Categories</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="ai">AI / Machine Learning</option>
                        <option value="devtools">Developer Tools</option>
                        <option value="web">Web & Fullstack</option>
                        <option value="systems">Systems & Rust</option>
                    </select>
                </div>

                <div class="h-[1px] bg-white/5 w-full"></div>

                <!-- Popular Tech Stack Quick Filters -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">Tech Stacks</label>
                    <div id="explore-tech-chips" class="flex flex-wrap gap-1.5">
                        <button data-tech="all" class="explore-tech-chip px-2.5 py-1 bg-primary text-on-primary rounded-lg text-xs font-semibold transition-all">All</button>
                        <button data-tech="rust" class="explore-tech-chip px-2.5 py-1 bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-semibold transition-all">Rust</button>
                        <button data-tech="python" class="explore-tech-chip px-2.5 py-1 bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-semibold transition-all">Python</button>
                        <button data-tech="typescript" class="explore-tech-chip px-2.5 py-1 bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-semibold transition-all">TypeScript</button>
                        <button data-tech="react" class="explore-tech-chip px-2.5 py-1 bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-semibold transition-all">React</button>
                        <button data-tech="docker" class="explore-tech-chip px-2.5 py-1 bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-semibold transition-all">Docker</button>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Projects Grid Container -->
        <div class="flex-1">
            <div id="explore-projects-container" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <!-- Skeleton loader -->
                <div class="animate-pulse bg-surface-container-low h-80 rounded-2xl border border-white/5"></div>
                <div class="animate-pulse bg-surface-container-low h-80 rounded-2xl border border-white/5"></div>
                <div class="animate-pulse bg-surface-container-low h-80 rounded-2xl border border-white/5"></div>
            </div>
        </div>
    </div>
</main>
`;
}

export async function initExplore() {
    const container = document.getElementById('explore-projects-container');
    const searchInput = document.getElementById('explore-search-input');
    const difficultyFilter = document.getElementById('explore-difficulty-filter');
    const categoryFilter = document.getElementById('explore-category-filter');
    const techChips = document.querySelectorAll('.explore-tech-chip');

    let allProjects = [];
    let activeTech = 'all';

    function renderFiltered() {
        if (!container) return;
        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const diff = difficultyFilter ? difficultyFilter.value.toLowerCase() : 'all';
        const cat = categoryFilter ? categoryFilter.value.toLowerCase() : 'all';

        const filtered = allProjects.filter(p => {
            const titleMatch = (p.title || '').toLowerCase().includes(q);
            const descMatch = (p.description || '').toLowerCase().includes(q);
            const techList = Array.isArray(p.techStack) ? p.techStack.map(t => String(t).toLowerCase()) : [];
            const techMatch = q ? techList.some(t => t.includes(q)) : true;
            const searchPass = !q || titleMatch || descMatch || techMatch;

            const diffPass = diff === 'all' || (p.difficulty || '').toLowerCase().includes(diff);
            const catPass = cat === 'all' || (p.category || '').toLowerCase().includes(cat);
            const techChipPass = activeTech === 'all' || techList.includes(activeTech.toLowerCase());

            return searchPass && diffPass && catPass && techChipPass;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-surface-container-low/30 rounded-2xl border border-white/5 space-y-3">
                <span class="material-symbols-outlined text-[48px] text-on-surface-variant">folder_off</span>
                <div class="text-base font-bold text-on-surface">No projects matched your criteria</div>
                <p class="text-xs text-on-surface-variant">Try tweaking your search term, difficulty, or technology filters.</p>
            </div>`;
            return;
        }

        container.innerHTML = filtered.map(p => window.renderProjectCard(p)).join('');
    }

    try {
        const res = await window.apiFetch('/api/projects');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allProjects = await res.json();
        renderFiltered();
    } catch (err) {
        console.error('Error fetching explore projects:', err);
        if (container) {
            container.innerHTML = `
            <div class="col-span-full py-12 text-center bg-surface-container-low/30 rounded-2xl border border-white/5 space-y-3">
                <span class="material-symbols-outlined text-[48px] text-error">error</span>
                <div class="text-base font-bold text-on-surface">Failed to load projects</div>
                <p class="text-xs text-on-surface-variant">${err.message || 'Please check your connection and try again.'}</p>
                <button onclick="window.location.reload()" class="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-md">Retry</button>
            </div>`;
        }
    }

    // Bind event listeners
    if (searchInput) searchInput.addEventListener('input', renderFiltered);
    if (difficultyFilter) difficultyFilter.addEventListener('change', renderFiltered);
    if (categoryFilter) categoryFilter.addEventListener('change', renderFiltered);

    techChips.forEach(chip => {
        chip.addEventListener('click', () => {
            techChips.forEach(c => {
                c.classList.remove('bg-primary', 'text-on-primary');
                c.classList.add('bg-surface-container', 'text-on-surface-variant');
            });
            chip.classList.remove('bg-surface-container', 'text-on-surface-variant');
            chip.classList.add('bg-primary', 'text-on-primary');
            activeTech = chip.dataset.tech || 'all';
            renderFiltered();
        });
    });
}
