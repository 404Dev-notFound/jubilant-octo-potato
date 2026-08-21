export function render_ai_workspace() {
    const AI_WORKSPACE_AVAILABLE = false;
    
    if (!AI_WORKSPACE_AVAILABLE) {
        return `
        <main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col h-[calc(100vh-70px)] pt-4 justify-center items-center">
            
            <div class="glass-panel rounded-2xl flex flex-col items-center justify-center p-2xl w-full max-w-6xl min-h-[60vh] border border-tertiary/20 text-center relative overflow-hidden shadow-2xl shadow-black/50">
                <!-- Background glow effect -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tertiary/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div class="relative z-10 flex flex-col items-center w-full max-w-4xl">
                    <div class="flex items-center gap-md mb-2xl">
                        <h1 class="font-display text-[48px] text-tertiary flex items-center gap-sm font-bold">
                            <span class="material-symbols-outlined text-[56px]">smart_toy</span> AI Workspace
                        </h1>
                        <span class="px-md py-1 bg-tertiary/10 text-tertiary border border-tertiary/30 rounded-full text-sm font-bold tracking-widest shadow-[0_0_15px_rgba(var(--tertiary),0.2)]">COMING SOON</span>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-lg w-full mt-lg">
                        <div class="bg-surface-container/50 border border-white/5 p-lg rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 hover:border-tertiary/30 hover:bg-surface-variant/30">
                            <span class="material-symbols-outlined text-tertiary mb-md text-[36px]">auto_fix_high</span>
                            <h4 class="font-bold text-sm tracking-wide">AI Coding Assistance</h4>
                        </div>
                        <div class="bg-surface-container/50 border border-white/5 p-lg rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 hover:border-tertiary/30 hover:bg-surface-variant/30">
                            <span class="material-symbols-outlined text-tertiary mb-md text-[36px]">account_tree</span>
                            <h4 class="font-bold text-sm tracking-wide">Project Context</h4>
                        </div>
                        <div class="bg-surface-container/50 border border-white/5 p-lg rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 hover:border-tertiary/30 hover:bg-surface-variant/30">
                            <span class="material-symbols-outlined text-tertiary mb-md text-[36px]">psychology</span>
                            <h4 class="font-bold text-sm tracking-wide">Code Understanding</h4>
                        </div>
                        <div class="bg-surface-container/50 border border-white/5 p-lg rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 hover:border-tertiary/30 hover:bg-surface-variant/30">
                            <span class="material-symbols-outlined text-tertiary mb-md text-[36px]">speed</span>
                            <h4 class="font-bold text-sm tracking-wide">Developer Productivity</h4>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        `;
    }

    // Existing implementation preserved below
    return `<main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col h-[calc(100vh-70px)] pt-4">
    <div class="flex items-center justify-between mb-lg flex-shrink-0">
        <div>
            <h1 class="font-display text-headline-lg text-tertiary mb-xs flex items-center gap-sm">
                <span class="material-symbols-outlined text-[32px]">smart_toy</span> AI Workspace
            </h1>
            <p class="text-on-surface-variant font-label-sm tracking-widest uppercase">Intelligent Code Assistance</p>
        </div>
    </div>
    
    <div class="flex gap-lg flex-1 min-h-0">
        <!-- Sidebar Tools List -->
        <div class="w-64 flex-shrink-0 flex flex-col gap-sm overflow-y-auto no-scrollbar pb-lg pr-sm">
            <button class="w-full text-left p-sm rounded-lg bg-surface-container border border-tertiary/50 text-tertiary flex items-center gap-sm">
                <span class="material-symbols-outlined">plagiarism</span> Code Review
            </button>
            <button class="w-full text-left p-sm rounded-lg hover:bg-surface-variant border border-transparent text-on-surface-variant hover:text-on-surface flex items-center gap-sm transition-colors">
                <span class="material-symbols-outlined">menu_book</span> Docs Generator
            </button>
            <button class="w-full text-left p-sm rounded-lg hover:bg-surface-variant border border-transparent text-on-surface-variant hover:text-on-surface flex items-center gap-sm transition-colors">
                <span class="material-symbols-outlined">pest_control</span> Bug Detection
            </button>
            <button class="w-full text-left p-sm rounded-lg hover:bg-surface-variant border border-transparent text-on-surface-variant hover:text-on-surface flex items-center gap-sm transition-colors">
                <span class="material-symbols-outlined">auto_fix_high</span> Refactoring
            </button>
            <button class="w-full text-left p-sm rounded-lg hover:bg-surface-variant border border-transparent text-on-surface-variant hover:text-on-surface flex items-center gap-sm transition-colors">
                <span class="material-symbols-outlined">group_add</span> Match Contributor
            </button>
            <button class="w-full text-left p-sm rounded-lg hover:bg-surface-variant border border-transparent text-on-surface-variant hover:text-on-surface flex items-center gap-sm transition-colors">
                <span class="material-symbols-outlined">forum</span> AI Chat
            </button>
        </div>
        
        <!-- Main Tool Area -->
        <div class="flex-1 glass-panel rounded-xl flex flex-col overflow-hidden border border-tertiary/20">
            <div class="p-md bg-surface-container border-b border-white/5 flex justify-between items-center">
                <h3 class="font-bold flex items-center gap-xs text-tertiary"><span class="material-symbols-outlined">plagiarism</span> AI Code Review</h3>
                <div class="flex gap-xs">
                    <button class="px-sm py-1 bg-surface-variant rounded text-xs hover:bg-outline-variant transition-colors">Clear</button>
                    <button class="px-sm py-1 bg-tertiary text-on-primary rounded text-xs font-bold shadow-lg shadow-tertiary/20">Analyze</button>
                </div>
            </div>
            
            <div class="flex-1 p-md flex flex-col md:flex-row gap-md overflow-hidden">
                <!-- Editor -->
                <div class="flex-1 flex flex-col">
                    <div class="text-xs text-on-surface-variant mb-xs font-bold">PASTE CODE OR LINK GITHUB PR</div>
                    <textarea class="flex-1 w-full bg-[#0d1117] border border-white/10 rounded-lg p-md font-mono text-sm text-on-surface outline-none focus:border-tertiary/50 resize-none transition-colors" spellcheck="false" placeholder="def memory_intensive_task(data):
    result = []
    for d in data:
        result.append(d ** 2)
    return result"></textarea>
                </div>
                
                <!-- Results Panel -->
                <div class="flex-1 bg-surface-container rounded-lg border border-white/5 p-md overflow-y-auto no-scrollbar relative flex flex-col">
                    <div class="text-xs text-on-surface-variant mb-md font-bold border-b border-outline-variant pb-xs">ANALYSIS RESULTS</div>
                    
                    <div class="flex-1 flex flex-col items-center justify-center opacity-50" id="ai-empty-state">
                        <span class="material-symbols-outlined text-[48px] mb-sm">manage_search</span>
                        <p class="text-sm">Click Analyze to start AI code review</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>`;
}
