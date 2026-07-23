export function render_project_details() {
    return `
<main class="relative w-full max-w-[1200px] mx-auto p-xl flex flex-col min-h-screen pt-4">
    <!-- Header -->
    <div class="glass-panel p-lg rounded-xl mb-lg border-t-4 border-t-primary">
        <div class="flex justify-between items-start">
            <div>
                <div class="flex items-center gap-sm mb-xs">
                    <span class="material-symbols-outlined text-[32px] text-primary">book</span>
                    <h1 class="font-display text-headline-lg text-on-surface">NeonDB</h1>
                    <span class="px-2 py-1 bg-surface-variant text-on-surface-variant rounded text-xs">Public</span>
                </div>
                <p class="text-on-surface-variant max-w-2xl">High-performance distributed key-value store written in C++. Designed for edge computing and ultra-low latency.</p>
            </div>
            <div class="flex gap-sm">
                <button data-action="toast" data-message="Watching project" class="px-md py-sm bg-surface-container rounded-lg border border-white/5 hover:bg-surface-variant transition-colors flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[18px]">visibility</span> Watch <span class="ml-1 bg-surface-variant px-1 rounded text-xs">142</span>
                </button>
                <button data-action="toast" data-message="Project starred!" class="px-md py-sm bg-surface-container rounded-lg border border-white/5 hover:bg-surface-variant transition-colors flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[18px]">star</span> Star <span class="ml-1 bg-surface-variant px-1 rounded text-xs">1.2k</span>
                </button>
                <button data-action="toast" data-message="Forking repository..." class="px-md py-sm bg-primary text-on-primary shadow-lg shadow-primary/20 rounded-lg hover:scale-105 transition-transform flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[18px]">fork_right</span> Fork <span class="ml-1 bg-primary-container text-primary px-1 rounded text-xs">320</span>
                </button>
            </div>
        </div>
        
        <!-- Tabs -->
        <div class="flex gap-lg mt-lg border-b border-outline-variant">
            <button class="pb-xs text-primary border-b-2 border-primary font-bold transition-colors">Overview</button>
            <button onclick="window.location.hash='issues'" class="pb-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">Issues <span class="bg-surface-variant px-1 rounded text-xs">14</span></button>
            <button onclick="window.location.hash='pull_requests'" class="pb-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">Pull Requests <span class="bg-surface-variant px-1 rounded text-xs">3</span></button>
            <button onclick="window.location.hash='documentation'" class="pb-xs text-on-surface-variant hover:text-on-surface transition-colors">Documentation</button>
        </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-md">
            <div class="glass-panel p-lg rounded-xl">
                <div class="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                    <h3 class="font-bold flex items-center gap-xs"><span class="material-symbols-outlined text-[18px]">menu_book</span> README.md</h3>
                </div>
                <div class="prose prose-invert max-w-none text-on-surface-variant">
                    <h1 class="text-on-surface">NeonDB</h1>
                    <p>NeonDB is a next-generation distributed key-value store optimized for modern SSDs and NVMe drives.</p>
                    <h2 class="text-on-surface">Features</h2>
                    <ul>
                        <li>Lock-free architecture</li>
                        <li>Raft consensus out of the box</li>
                        <li>Zero-copy network stack</li>
                    </ul>
                    <pre class="bg-surface-container-lowest p-md rounded-lg border border-white/5 text-sm mt-md"><code>git clone https://github.com/codecollab/neondb.git
cd neondb
mkdir build && cd build
cmake ..
make -j8</code></pre>
                </div>
            </div>
        </div>
        
        <!-- Sidebar -->
        <div class="space-y-md">
            <div class="glass-panel p-md rounded-xl">
                <h3 class="font-bold text-on-surface mb-sm border-b border-outline-variant pb-xs">About</h3>
                <p class="text-sm text-on-surface-variant mb-md">High-performance distributed key-value store written in C++.</p>
                <div class="space-y-2 text-sm text-on-surface-variant">
                    <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">public</span> <a href="#" class="text-primary hover:underline">neondb.io</a></div>
                    <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">menu_book</span> <a href="#" class="text-primary hover:underline">Read the Docs</a></div>
                    <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">scale</span> MIT License</div>
                </div>
            </div>
            
            <div class="glass-panel p-md rounded-xl">
                <h3 class="font-bold text-on-surface mb-sm border-b border-outline-variant pb-xs">Languages</h3>
                <div class="w-full h-2 rounded-full flex mb-2">
                    <div class="bg-primary h-full w-[85%] rounded-l-full"></div>
                    <div class="bg-secondary h-full w-[10%]"></div>
                    <div class="bg-tertiary h-full w-[5%] rounded-r-full"></div>
                </div>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between text-on-surface-variant"><span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary"></span> C++</span> <span>85.0%</span></div>
                    <div class="flex justify-between text-on-surface-variant"><span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-secondary"></span> CMake</span> <span>10.0%</span></div>
                    <div class="flex justify-between text-on-surface-variant"><span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-tertiary"></span> Python</span> <span>5.0%</span></div>
                </div>
            </div>
        </div>
    </div>
</main>
`;
}
