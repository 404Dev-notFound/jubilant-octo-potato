import os

views_dir = 'codecollab_v2/views'

pages = {
    "login.html": """
<div class="flex items-center justify-center min-h-[80vh]">
    <div class="glass-panel p-xl rounded-2xl w-full max-w-md border-t-4 border-t-primary shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10"></div>
        <div class="text-center mb-lg">
            <span class="material-symbols-outlined text-[48px] text-primary mb-sm">terminal</span>
            <h2 class="font-display text-headline-md font-bold">Welcome Back</h2>
            <p class="text-on-surface-variant text-sm mt-1">Sign in to continue to CodeCollab</p>
        </div>
        
        <form class="space-y-md">
            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">EMAIL ADDRESS</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">mail</span>
                    <input type="email" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors" placeholder="you@example.com" required>
                </div>
            </div>
            <div>
                <div class="flex justify-between items-end mb-xs">
                    <label class="block text-xs font-bold text-on-surface-variant">PASSWORD</label>
                    <a href="#" class="text-xs text-primary hover:underline">Forgot?</a>
                </div>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">lock</span>
                    <input type="password" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors" placeholder="••••••••" required>
                </div>
            </div>
            
            <button type="submit" data-action="toast" data-message="Successfully logged in!" class="w-full py-sm bg-primary text-on-primary font-bold rounded-lg shadow-lg hover:bg-primary-container transition-colors">SIGN IN</button>
        </form>
        
        <div class="mt-lg flex items-center gap-sm">
            <div class="h-[1px] bg-white/10 flex-1"></div>
            <span class="text-xs text-on-surface-variant uppercase tracking-wider">Or continue with</span>
            <div class="h-[1px] bg-white/10 flex-1"></div>
        </div>
        
        <div class="mt-md grid grid-cols-2 gap-sm">
            <button class="py-sm bg-surface-container border border-white/5 hover:bg-surface-variant rounded-lg flex items-center justify-center gap-xs text-sm transition-colors">
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" class="w-4 h-4 filter invert opacity-80" alt="GitHub"> GitHub
            </button>
            <button class="py-sm bg-surface-container border border-white/5 hover:bg-surface-variant rounded-lg flex items-center justify-center gap-xs text-sm transition-colors">
                <span class="text-blue-500 font-bold">G</span> Google
            </button>
        </div>
        
        <p class="text-center text-sm text-on-surface-variant mt-lg">
            Don't have an account? <a href="#sign_up" class="text-primary hover:underline">Sign up</a>
        </p>
    </div>
</div>
""",
    
    "about.html": """
<main class="relative w-full max-w-[1000px] mx-auto p-xl flex flex-col pt-12 text-center">
    <h1 class="font-display text-[48px] font-bold text-on-surface mb-sm">Empowering the <span class="text-primary">Open Source</span> Future</h1>
    <p class="text-lg text-on-surface-variant max-w-2xl mx-auto mb-xl">CodeCollab is built for developers, by developers. Our mission is to seamlessly connect students, maintainers, and organizations to build incredible software together.</p>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-lg text-left mt-lg">
        <div class="glass-panel p-lg rounded-xl">
            <span class="material-symbols-outlined text-[32px] text-primary mb-md">groups</span>
            <h3 class="font-bold text-lg mb-sm">Community First</h3>
            <p class="text-sm text-on-surface-variant">We prioritize healthy interactions, mentorship, and growing the next generation of engineers through active open source contribution.</p>
        </div>
        <div class="glass-panel p-lg rounded-xl">
            <span class="material-symbols-outlined text-[32px] text-secondary mb-md">smart_toy</span>
            <h3 class="font-bold text-lg mb-sm">AI Accelerated</h3>
            <p class="text-sm text-on-surface-variant">Integrating state-of-the-art AI to automate code reviews, generate documentation, and match you with the perfect issues.</p>
        </div>
        <div class="glass-panel p-lg rounded-xl">
            <span class="material-symbols-outlined text-[32px] text-tertiary mb-md">rocket_launch</span>
            <h3 class="font-bold text-lg mb-sm">Built for Speed</h3>
            <p class="text-sm text-on-surface-variant">A blazingly fast SPA architecture designed to handle thousands of concurrent collaborations without breaking a sweat.</p>
        </div>
    </div>
</main>
"""
}

# Generate remaining placeholders for completeness to prevent 404s
remaining_pages = ['sign_up', 'welcome', 'account_setup', 'community', 'organizations', 
                  'learning_center', 'resources', 'events', 'leaderboard', 'team_collaboration', 
                  'notifications', 'settings', 'documentation', 'contact']

for p in remaining_pages:
    title = p.replace('_', ' ').title()
    pages[f"{p}.html"] = f"""
<main class="w-full max-w-[1200px] mx-auto p-xl flex flex-col pt-12 items-center text-center">
    <span class="material-symbols-outlined text-[64px] text-primary/50 mb-md">construction</span>
    <h1 class="font-display text-headline-lg font-bold text-on-surface mb-sm">{title}</h1>
    <p class="text-on-surface-variant max-w-md">This module is part of the CODECOLLAB ecosystem and is fully connected to our routing system. The detailed layout is currently under construction.</p>
    <button onclick="window.history.back()" class="mt-lg px-md py-sm bg-surface-variant hover:bg-outline-variant rounded transition-colors text-sm">Go Back</button>
</main>
"""

for filename, content in pages.items():
    with open(os.path.join(views_dir, filename), 'w', encoding='utf-8') as f:
        f.write(content.strip())

print("System views successfully generated.")
