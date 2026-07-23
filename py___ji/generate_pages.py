import os

views_dir = 'codecollab_v2/views'

pages = {
    "explore.html": """
<main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col min-h-screen pt-4">
    <div class="flex items-center justify-between mb-lg">
        <div>
            <h1 class="font-display text-headline-lg text-primary mb-xs">Explore Projects</h1>
            <p class="text-on-surface-variant font-label-sm tracking-widest uppercase">Discover & Contribute</p>
        </div>
    </div>
    <div class="flex flex-col md:flex-row gap-lg">
        <!-- Sidebar Filters -->
        <div class="w-full md:w-64 space-y-md">
            <div class="glass-panel p-md rounded-xl">
                <h3 class="font-label-md mb-md text-on-surface">FILTERS</h3>
                <div class="space-y-sm">
                    <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer hover:text-primary transition-colors"><input type="checkbox" class="rounded bg-surface-container border-outline"> Beginner Friendly</label>
                    <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer hover:text-primary transition-colors"><input type="checkbox" class="rounded bg-surface-container border-outline"> Open Issues</label>
                    <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer hover:text-primary transition-colors"><input type="checkbox" class="rounded bg-surface-container border-outline"> Mentorship</label>
                </div>
                <div class="h-[1px] bg-outline-variant w-full my-md"></div>
                <h3 class="font-label-md mb-md text-on-surface">LANGUAGES</h3>
                <div class="space-y-sm">
                    <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer"><input type="checkbox" checked class="rounded bg-surface-container border-outline text-primary"> JavaScript</label>
                    <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer"><input type="checkbox" checked class="rounded bg-surface-container border-outline text-primary"> Python</label>
                    <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer"><input type="checkbox" checked class="rounded bg-surface-container border-outline text-primary"> C++</label>
                </div>
            </div>
        </div>
        <!-- Projects Grid -->
        <div class="flex-1">
            <div class="relative mb-lg">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input type="text" placeholder="Search by name, technology, or label..." class="w-full bg-surface-container border border-white/10 rounded-xl pl-[48px] pr-md py-md text-on-surface outline-none focus:border-primary transition-colors text-lg">
                <button class="absolute right-2 top-1/2 -translate-y-1/2 px-md py-sm bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors">SEARCH</button>
            </div>
            <!-- Container filled by JS -->
            <div id="explore-projects-container" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md"></div>
        </div>
    </div>
</main>
""",

    "user_profile.html": """
<main class="relative w-full max-w-[1200px] mx-auto p-xl flex flex-col min-h-screen pt-4">
    <!-- Banner -->
    <div class="w-full h-[200px] rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-tertiary/20 border border-white/5 relative mb-24">
        <!-- Avatar -->
        <div class="absolute -bottom-16 left-8">
            <div class="w-32 h-32 rounded-full border-4 border-surface bg-surface-container-high flex items-center justify-center overflow-hidden">
                <span class="text-display text-primary">U</span>
            </div>
        </div>
        <div class="absolute -bottom-12 right-8 flex gap-sm">
            <button data-action="toast" data-message="Profile updated" class="px-md py-xs bg-surface-container rounded-lg border border-white/10 hover:bg-surface-variant transition-colors flex items-center gap-xs">
                <span class="material-symbols-outlined text-[18px]">edit</span> EDIT
            </button>
        </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <!-- Sidebar Info -->
        <div class="space-y-md">
            <div>
                <h1 class="font-headline-lg text-on-surface font-bold">Alex Developer</h1>
                <p class="text-on-surface-variant font-label-md">dev_ninja</p>
            </div>
            <p class="text-sm text-on-surface">Full-stack engineer passionate about open source and AI.</p>
            <div class="flex items-center gap-xs text-sm text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px]">location_on</span> San Francisco, CA
            </div>
            <div class="flex items-center gap-xs text-sm text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px]">link</span> <a href="#" class="text-primary hover:underline">codecollab.dev/alex</a>
            </div>
            
            <div class="h-[1px] bg-outline-variant w-full"></div>
            
            <div>
                <h3 class="font-label-md mb-xs text-on-surface">SKILLS</h3>
                <div class="flex flex-wrap gap-xs">
                    <span class="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-xs border border-white/5">Python</span>
                    <span class="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-xs border border-white/5">JavaScript</span>
                    <span class="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-xs border border-white/5">C++</span>
                    <span class="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-xs border border-white/5">React</span>
                </div>
            </div>
            
            <div class="h-[1px] bg-outline-variant w-full"></div>
            
            <div class="flex justify-between items-center text-center">
                <div>
                    <div class="font-bold text-lg text-on-surface">128</div>
                    <div class="text-xs text-on-surface-variant">Followers</div>
                </div>
                <div>
                    <div class="font-bold text-lg text-on-surface">45</div>
                    <div class="text-xs text-on-surface-variant">Following</div>
                </div>
                <div>
                    <div class="font-bold text-lg text-on-surface">24</div>
                    <div class="text-xs text-on-surface-variant">Stars</div>
                </div>
            </div>
        </div>
        
        <!-- Main Area -->
        <div class="md:col-span-2 space-y-lg">
            <div class="glass-panel p-lg rounded-xl">
                <h3 class="font-headline-md mb-md">Contribution Graph</h3>
                <div class="w-full h-[150px] bg-surface-container rounded-lg border border-white/5 flex items-center justify-center text-on-surface-variant">
                    [1,450 contributions in the last year]
                </div>
            </div>
            
            <div class="flex items-center justify-between mb-sm">
                <h3 class="font-headline-md">Pinned Projects</h3>
                <a href="#explore" class="text-primary text-sm hover:underline">Customize</a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-md" id="profile-pinned-projects">
                <!-- Dynamically filled or static mock -->
                <div class="glass-panel p-md rounded-xl border-l-2 border-l-primary cursor-pointer hover:bg-surface-variant transition-colors" onclick="window.location.hash='project_details'">
                    <div class="font-bold text-on-surface">NexusML</div>
                    <p class="text-xs text-on-surface-variant my-1">Machine learning framework optimized for edge devices.</p>
                    <div class="flex gap-2 mt-2">
                        <span class="w-3 h-3 rounded-full bg-tertiary"></span> <span class="text-xs text-on-surface-variant">Python</span>
                    </div>
                </div>
                <div class="glass-panel p-md rounded-xl border-l-2 border-l-secondary cursor-pointer hover:bg-surface-variant transition-colors" onclick="window.location.hash='project_details'">
                    <div class="font-bold text-on-surface">AuraUI</div>
                    <p class="text-xs text-on-surface-variant my-1">Glassmorphism UI component library.</p>
                    <div class="flex gap-2 mt-2">
                        <span class="w-3 h-3 rounded-full bg-secondary"></span> <span class="text-xs text-on-surface-variant">JavaScript</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
""",
    "issues.html": """
<main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col min-h-screen pt-4">
    <div class="flex items-center justify-between mb-lg">
        <div>
            <h1 class="font-display text-headline-lg text-primary mb-xs">Issues Kanban</h1>
            <p class="text-on-surface-variant font-label-sm tracking-widest uppercase">Project Tracking</p>
        </div>
        <button data-action="toast" data-message="Issue created!" class="px-md py-sm bg-primary text-on-primary rounded-lg font-bold shadow-lg hover:bg-primary-container transition-colors flex items-center gap-xs">
            <span class="material-symbols-outlined text-[18px]">add</span> NEW ISSUE
        </button>
    </div>
    
    <div class="flex gap-md h-full overflow-x-auto pb-4">
        <!-- To Do -->
        <div class="w-[350px] flex-shrink-0 flex flex-col gap-sm">
            <div class="flex items-center justify-between px-xs">
                <div class="font-bold text-on-surface flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-error"></span> TO DO</div>
                <span class="px-2 py-1 bg-surface-container rounded-full text-xs text-on-surface-variant">4</span>
            </div>
            <div class="glass-panel p-md rounded-xl hover:border-primary/50 transition-colors cursor-grab">
                <div class="flex justify-between items-start mb-2">
                    <span class="px-2 py-1 bg-error/10 text-error rounded text-[10px] font-bold">BUG</span>
                    <span class="text-on-surface-variant text-xs">#42</span>
                </div>
                <h4 class="font-bold text-on-surface mb-2">Memory leak in query parser</h4>
                <div class="flex items-center justify-between text-on-surface-variant mt-4">
                    <div class="w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs text-primary">U</div>
                    <span class="material-symbols-outlined text-[16px]">chat_bubble</span>
                </div>
            </div>
            <!-- Add Issue card -->
            <button class="w-full py-sm border border-dashed border-outline-variant text-outline rounded-xl hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-xs">
                <span class="material-symbols-outlined text-[18px]">add</span> Add Issue
            </button>
        </div>

        <!-- In Progress -->
        <div class="w-[350px] flex-shrink-0 flex flex-col gap-sm">
            <div class="flex items-center justify-between px-xs">
                <div class="font-bold text-on-surface flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-secondary"></span> IN PROGRESS</div>
                <span class="px-2 py-1 bg-surface-container rounded-full text-xs text-on-surface-variant">1</span>
            </div>
            <div class="glass-panel p-md rounded-xl hover:border-primary/50 transition-colors cursor-grab border-l-2 border-l-secondary">
                <div class="flex justify-between items-start mb-2">
                    <span class="px-2 py-1 bg-secondary/10 text-secondary rounded text-[10px] font-bold">FEATURE</span>
                    <span class="text-on-surface-variant text-xs">#45</span>
                </div>
                <h4 class="font-bold text-on-surface mb-2">Add dark mode support to Modals</h4>
                <div class="flex items-center justify-between text-on-surface-variant mt-4">
                    <div class="w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs text-primary">A</div>
                    <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">chat_bubble</span> 3</div>
                </div>
            </div>
        </div>

        <!-- Done -->
        <div class="w-[350px] flex-shrink-0 flex flex-col gap-sm">
            <div class="flex items-center justify-between px-xs">
                <div class="font-bold text-on-surface flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-tertiary"></span> DONE</div>
                <span class="px-2 py-1 bg-surface-container rounded-full text-xs text-on-surface-variant">12</span>
            </div>
            <div class="glass-panel p-md rounded-xl opacity-60">
                <div class="flex justify-between items-start mb-2">
                    <strike class="font-bold text-on-surface">Update README docs</strike>
                    <span class="text-tertiary text-xs">Closed</span>
                </div>
            </div>
        </div>
    </div>
</main>
"""
}

for filename, content in pages.items():
    with open(os.path.join(views_dir, filename), 'w', encoding='utf-8') as f:
        f.write(content)

print("Additional pages generated.")
