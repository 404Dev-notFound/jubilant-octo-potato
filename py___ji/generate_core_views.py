import os

views_dir = 'codecollab_v2/views'

pages = {
    "home.html": """
<div class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col min-h-[80vh] items-center justify-center text-center mt-12">
    <div class="inline-block px-md py-xs rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-xs tracking-widest mb-lg animate-pulse">
        CODECOLLAB 2.0 IS LIVE
    </div>
    
    <h1 class="font-display text-[48px] md:text-[72px] lg:text-[84px] leading-tight font-extrabold text-on-surface tracking-tight mb-md" style="text-shadow: 0 0 40px rgba(0,255,136,0.2);">
        Looking someone who <br>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">can commit</span>
    </h1>
    
    <p class="text-on-surface-variant text-lg md:text-xl max-w-3xl mb-xl">
        Connect with developers, students, and open-source maintainers. Discover beginner-friendly issues, track your contributions, leverage intelligent AI code review, and build your digital legacy.
    </p>
    
    <div class="flex flex-col sm:flex-row gap-md justify-center w-full max-w-2xl">
        <button onclick="window.location.hash='explore'" class="px-xl py-md bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex justify-center items-center gap-xs">
            <span class="material-symbols-outlined">explore</span> Explore Projects
        </button>
        <button data-action="modal" title="Onboarding Flow" class="px-xl py-md bg-surface-container rounded-xl border border-white/10 hover:bg-surface-variant hover:border-primary/50 transition-all flex justify-center items-center gap-xs text-on-surface font-bold">
            <span class="material-symbols-outlined">rocket_launch</span> Start Contributing
        </button>
        <button onclick="window.location.hash='about'" class="px-xl py-md bg-transparent text-on-surface-variant hover:text-on-surface rounded-xl transition-colors flex justify-center items-center gap-xs font-bold">
            Learn More <span class="material-symbols-outlined">arrow_forward</span>
        </button>
    </div>
    
    <!-- Hero Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-lg mt-24 w-full max-w-4xl border-t border-white/5 pt-xl">
        <div><div class="text-headline-lg font-display text-primary font-bold">150k+</div><div class="text-sm text-on-surface-variant">Developers</div></div>
        <div><div class="text-headline-lg font-display text-secondary font-bold">42k+</div><div class="text-sm text-on-surface-variant">Projects</div></div>
        <div><div class="text-headline-lg font-display text-tertiary font-bold">1.2M+</div><div class="text-sm text-on-surface-variant">PRs Merged</div></div>
        <div><div class="text-headline-lg font-display text-error font-bold">100%</div><div class="text-sm text-on-surface-variant">Open Source</div></div>
    </div>
</div>
""",

    "dashboard.html": """
<main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col pt-4">
    <div class="flex items-center justify-between mb-lg">
        <div>
            <h1 class="font-display text-headline-lg text-primary mb-xs">Welcome back, Alex!</h1>
            <p class="text-on-surface-variant font-label-sm tracking-widest uppercase">Overview & Statistics</p>
        </div>
        <div class="flex gap-sm">
            <button data-action="toast" data-message="Syncing with GitHub..." class="px-md py-sm bg-surface-container rounded-lg font-bold hover:bg-surface-variant transition-colors flex items-center gap-xs border border-white/5">
                <span class="material-symbols-outlined text-[18px]">sync</span> SYNC GITHUB
            </button>
            <button onclick="window.location.hash='explore'" class="px-md py-sm bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-xs">
                <span class="material-symbols-outlined text-[18px]">add</span> NEW PROJECT
            </button>
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-primary hover:-translate-y-1 transition-transform">
            <div class="text-on-surface-variant font-label-sm mb-xs">TOTAL CONTRIBUTIONS</div>
            <div class="text-headline-lg font-bold text-on-surface">1,450</div>
            <div class="text-tertiary text-sm flex items-center mt-xs"><span class="material-symbols-outlined text-[16px] mr-1">trending_up</span> +12% this week</div>
        </div>
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-secondary hover:-translate-y-1 transition-transform">
            <div class="text-on-surface-variant font-label-sm mb-xs">ACTIVE ISSUES</div>
            <div class="text-headline-lg font-bold text-on-surface">14</div>
            <div class="text-on-surface-variant text-sm flex items-center mt-xs">Across 3 projects</div>
        </div>
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-tertiary hover:-translate-y-1 transition-transform">
            <div class="text-on-surface-variant font-label-sm mb-xs">CURRENT STREAK</div>
            <div class="text-headline-lg font-bold text-on-surface">12 <span class="text-lg">days</span></div>
            <div class="text-tertiary flex items-center mt-xs"><span class="material-symbols-outlined text-[16px] mr-1">local_fire_department</span> Keep it up!</div>
        </div>
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-error hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div class="absolute -right-4 -top-4 text-[100px] opacity-5"><span class="material-symbols-outlined">emoji_events</span></div>
            <div class="text-on-surface-variant font-label-sm mb-xs">GLOBAL RANK</div>
            <div class="text-headline-lg font-bold text-on-surface">Top 5%</div>
            <div class="text-on-surface-variant text-sm flex items-center mt-xs">1,204 positions up</div>
        </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-lg">
        <!-- Main Content Column -->
        <div class="xl:col-span-2 space-y-lg">
            <!-- Obsidian Inspired Activity Graph -->
            <div class="glass-panel p-lg rounded-xl">
                <div class="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                    <h3 class="font-bold flex items-center gap-xs"><span class="material-symbols-outlined text-primary">hub</span> Knowledge Graph</h3>
                    <button class="text-xs bg-surface-variant px-2 py-1 rounded">Last 30 Days</button>
                </div>
                <div class="w-full h-[250px] bg-surface-container-lowest rounded-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <!-- Fake Graph Nodes -->
                    <div class="absolute w-full h-full opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
                    <svg class="absolute inset-0 w-full h-full stroke-outline-variant opacity-30">
                        <line x1="50%" y1="50%" x2="30%" y2="30%" stroke-width="1"/>
                        <line x1="50%" y1="50%" x2="70%" y2="40%" stroke-width="1"/>
                        <line x1="50%" y1="50%" x2="40%" y2="80%" stroke-width="1"/>
                        <line x1="70%" y1="40%" x2="80%" y2="20%" stroke-width="1"/>
                    </svg>
                    <div class="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_#00ff88]"></div>
                    <div class="absolute left-[30%] top-[30%] w-3 h-3 bg-secondary rounded-full"></div>
                    <div class="absolute left-[70%] top-[40%] w-3 h-3 bg-tertiary rounded-full"></div>
                    <div class="absolute left-[40%] top-[80%] w-2 h-2 bg-error rounded-full"></div>
                    <div class="absolute left-[80%] top-[20%] w-2 h-2 bg-on-surface-variant rounded-full"></div>
                    <div class="absolute text-xs text-primary font-bold left-[50%] top-[54%] -translate-x-1/2">NeonDB</div>
                </div>
            </div>

            <!-- AI Suggestions -->
            <div class="glass-panel p-lg rounded-xl border border-tertiary/30 bg-gradient-to-br from-tertiary/5 to-transparent">
                <div class="flex items-center gap-sm mb-md">
                    <span class="material-symbols-outlined text-tertiary">psychology</span>
                    <h3 class="font-bold">AI Recommendations for You</h3>
                </div>
                <div class="space-y-sm">
                    <div class="flex items-start gap-md p-md bg-surface-container rounded-lg border border-white/5">
                        <div class="p-xs bg-primary/20 text-primary rounded-lg"><span class="material-symbols-outlined">bug_report</span></div>
                        <div class="flex-1">
                            <h4 class="font-bold text-sm">Good First Issue: Fix alignment in AuraUI Header</h4>
                            <p class="text-xs text-on-surface-variant mt-1">Based on your recent CSS contributions, this issue is a perfect match. Estimated time: 30m.</p>
                        </div>
                        <button onclick="window.location.hash='issues'" class="px-sm py-1 bg-surface-variant hover:bg-outline-variant text-xs rounded transition-colors">View</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar Column -->
        <div class="space-y-lg">
            <!-- Quick Actions -->
            <div class="glass-panel p-lg rounded-xl">
                <h3 class="font-bold mb-md text-on-surface">Quick Actions</h3>
                <div class="grid grid-cols-2 gap-sm">
                    <button onclick="window.location.hash='ai_workspace'" class="p-sm bg-surface-container hover:bg-surface-variant border border-white/5 rounded-lg flex flex-col items-center justify-center gap-xs transition-colors group">
                        <span class="material-symbols-outlined text-tertiary group-hover:scale-110 transition-transform">code_blocks</span>
                        <span class="text-xs">Code Review</span>
                    </button>
                    <button onclick="window.location.hash='project_details'" class="p-sm bg-surface-container hover:bg-surface-variant border border-white/5 rounded-lg flex flex-col items-center justify-center gap-xs transition-colors group">
                        <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add_task</span>
                        <span class="text-xs">New Issue</span>
                    </button>
                </div>
            </div>

            <!-- Assigned Issues -->
            <div class="glass-panel p-lg rounded-xl">
                <div class="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                    <h3 class="font-bold">Assigned to you</h3>
                    <span class="w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                </div>
                <div class="space-y-md">
                    <div class="flex items-start gap-sm group cursor-pointer" onclick="window.location.hash='issues'">
                        <span class="material-symbols-outlined text-error text-[18px] mt-0.5">adjust</span>
                        <div>
                            <div class="text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">Memory leak in query parser</div>
                            <div class="text-xs text-on-surface-variant mt-1">#14 • NeonDB • <span class="text-error font-bold">High</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
""",

    "ai_workspace.html": """
<main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col h-[calc(100vh-70px)] pt-4">
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
</main>
"""
}

for filename, content in pages.items():
    with open(os.path.join(views_dir, filename), 'w', encoding='utf-8') as f:
        f.write(content.strip())

print("Core views successfully generated.")
