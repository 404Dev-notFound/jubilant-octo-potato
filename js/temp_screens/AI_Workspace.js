export function render_AI_Workspace() {
    return `
 Header (TopNavBar) 
<header class="fixed top-0 w-full z-50 flex justify-between items-center px-lg h-16 bg-background/70 dark:bg-background/70 backdrop-blur-md border-b border-white/10 shadow-sm">
<div class="flex items-center gap-md">
<h1 class="font-display text-headline-md font-bold text-primary dark:text-primary tracking-tight">CODECOLLAB</h1>
<nav class="hidden md:flex gap-md ml-lg">
<a class="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors" href="#">Explore</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors" href="#">Community</a>
<a class="font-label-md text-label-md text-primary dark:text-primary font-bold border-b-2 border-primary pb-1" href="#">Workspace</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors" href="/dashboard">Dashboard</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors" href="#">About</a>
</nav>
</div>
<div class="flex items-center gap-sm">
<button class="p-xs text-on-surface-variant hover:bg-white/5 rounded-lg transition-all">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="p-xs text-on-surface-variant hover:bg-white/5 rounded-lg transition-all">
<span class="material-symbols-outlined" data-icon="smart_toy">smart_toy</span>
</button>
<div class="w-8 h-8 rounded-full overflow-hidden border border-primary/20 ml-xs">
<img class="w-full h-full object-cover" data-alt="A professional studio portrait of a high-tech software engineer in a dark workspace, illuminated by blue and violet screen glows. The aesthetic is clean, cinematic, and professional, echoing the premium developer tool visual style with high-end digital photography and shallow depth of field." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDf-MiWoXMwEQZwdPQz0KlhbUV4kcxeylaNKKW34m7vF1NV9RTNUguLJj88MNaTZOE5N7mg7XlgAK10sAGEANOxCMTeEiD1s-4Q3c7XCZcki6r88Rm2-3DPz3mo-pEXkrP2iM5nXNCFinT6piZZycRafQ9riFR7zZYCIL3vXHWKWEinD0mUwr9MwzSzebYuqGSs2iJiu9CGNJf9IRbg-ZiFMpyVBzExujmASlbkdZm-e3tOM7VbrAih4g"/>
</div>
</div>
</header>
 Sidebar (SideNavBar) 
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-low border-r border-white/5 flex flex-col p-md gap-xs">
<div class="mb-lg px-xs">
<div class="flex items-center gap-sm mb-xs">
<div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
<span class="material-symbols-outlined" data-icon="code_blocks">code_blocks</span>
</div>
<div>
<p class="font-headline-md text-on-surface text-body-sm font-bold">Current Workspace</p>
<p class="font-label-md text-[10px] text-on-surface-variant opacity-60">v2.4.0-stable</p>
</div>
</div>
<button class="w-full mt-md bg-primary-container text-on-primary-container py-2 rounded-lg font-label-md hover:brightness-110 transition-all flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-[18px]" data-icon="add">add</span>
                New Branch
            </button>
</div>
<nav class="flex-1 flex flex-col gap-1">
<a class="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-all" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="font-label-md">Overview</span>
</a>
<a class="flex items-center gap-3 px-sm py-2 bg-primary-container text-on-primary-container rounded-lg translate-x-1" href="#">
<span class="material-symbols-outlined" data-icon="code_blocks">code_blocks</span>
<span class="font-label-md">Repository</span>
</a>
<a class="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-all" href="#">
<span class="material-symbols-outlined" data-icon="merge_type">merge_type</span>
<span class="font-label-md">Pull Requests</span>
</a>
<a class="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-all" href="#">
<span class="material-symbols-outlined" data-icon="bug_report">bug_report</span>
<span class="font-label-md">Issues</span>
</a>
<a class="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-all" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-label-md">Settings</span>
</a>
</nav>
<div class="mt-auto pt-md border-t border-white/5 flex flex-col gap-1">
<a class="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-all" href="#">
<span class="material-symbols-outlined" data-icon="menu_book">menu_book</span>
<span class="font-label-md">Documentation</span>
</a>
<a class="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-all" href="#">
<span class="material-symbols-outlined" data-icon="help">help</span>
<span class="font-label-md">Support</span>
</a>
</div>
</aside>
 Main Workspace Area 
<main class="ml-64 mt-16 p-lg min-h-screen">
<div class="max-w-[1600px] mx-auto grid grid-cols-12 gap-lg h-full">
<!-- Center Content: AI Features & Editor -->
<div class="col-span-12 lg:col-span-9 flex flex-col gap-lg">
<!-- AI Feature Grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-md">
<!-- Feature Cards -->
<button class="glass-panel group p-md rounded-xl text-left hover:border-primary/40 transition-all duration-300">
<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="fact_check">fact_check</span>
</div>
<h3 class="font-headline-md text-body-md font-bold mb-1">Code Review</h3>
<p class="text-on-surface-variant text-body-sm">Automated analysis for best practices and logic flaws.</p>
</button>
<button class="glass-panel group p-md rounded-xl text-left hover:border-primary/40 transition-all duration-300">
<div class="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="description">description</span>
</div>
<h3 class="font-headline-md text-body-md font-bold mb-1">Docs Generator</h3>
<p class="text-on-surface-variant text-body-sm">Generate JSDoc, Markdown, or technical guides instantly.</p>
</button>
<button class="glass-panel group p-md rounded-xl text-left hover:border-primary/40 transition-all duration-300">
<div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="psychology">psychology</span>
</div>
<h3 class="font-headline-md text-body-md font-bold mb-1">Code Explanation</h3>
<p class="text-on-surface-variant text-body-sm">Deep semantic breakdown of complex logic blocks.</p>
</button>
<button class="glass-panel group p-md rounded-xl text-left hover:border-primary/40 transition-all duration-300">
<div class="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="pest_control">pest_control</span>
</div>
<h3 class="font-headline-md text-body-md font-bold mb-1">Bug Detection</h3>
<p class="text-on-surface-variant text-body-sm">Predictive scanning for race conditions and vulnerabilities.</p>
</button>
<button class="glass-panel group p-md rounded-xl text-left hover:border-primary/40 transition-all duration-300">
<div class="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="auto_fix_high">auto_fix_high</span>
</div>
<h3 class="font-headline-md text-body-md font-bold mb-1">Refactoring</h3>
<p class="text-on-surface-variant text-body-sm">Optimizing for performance and readability automatically.</p>
</button>
<button class="glass-panel group p-md rounded-xl text-left hover:border-primary/40 transition-all duration-300">
<div class="w-10 h-10 rounded-lg bg-on-secondary-container/10 flex items-center justify-center text-on-secondary-container mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="groups">groups</span>
</div>
<h3 class="font-headline-md text-body-md font-bold mb-1">Contributor Matching</h3>
<p class="text-on-surface-variant text-body-sm">Find the right team members based on commit history.</p>
</button>
</div>
<!-- Workspace Area -->
<div class="flex-1 flex flex-col min-h-[500px]">
<div class="glass-panel rounded-xl overflow-hidden flex flex-col flex-1 border-primary/20">
<!-- Toolbar -->
<div class="bg-surface-container-high px-md py-xs border-b border-white/5 flex items-center justify-between">
<div class="flex items-center gap-md">
<div class="flex gap-1.5">
<div class="w-3 h-3 rounded-full bg-red-500/50"></div>
<div class="w-3 h-3 rounded-full bg-yellow-500/50"></div>
<div class="w-3 h-3 rounded-full bg-green-500/50"></div>
</div>
<span class="font-label-sm text-on-surface-variant opacity-60">workspace_main.py</span>
</div>
<div class="flex gap-sm">
<button class="flex items-center gap-1 font-label-sm text-on-surface-variant hover:text-on-surface transition-colors">
<span class="material-symbols-outlined text-[16px]" data-icon="upload_file">upload_file</span>
                                    Upload
                                </button>
<button class="flex items-center gap-1 px-3 py-1 bg-primary text-on-primary rounded font-label-md hover:bg-primary/90 transition-all active-glow">
<span class="material-symbols-outlined text-[16px]" data-icon="play_arrow">play_arrow</span>
                                    Analyze
                                </button>
</div>
</div>
<!-- Editor Body -->
<div class="flex-1 flex font-label-md relative overflow-hidden bg-surface-container-lowest">
<div class="w-12 bg-surface-container text-right pr-3 py-4 text-on-surface-variant/30 select-none border-r border-white/5">
                                1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8<br/>9<br/>10<br/>11<br/>12
                            </div>
<textarea class="flex-1 bg-transparent p-4 outline-none text-on-surface-variant resize-none font-label-md placeholder:text-on-surface-variant/20" placeholder="// Paste your code here to start the AI collaboration journey..."></textarea>
<!-- Ambient Decorative Element -->
<div class="absolute bottom-4 right-4 pointer-events-none opacity-20">
</div>
</div>
</div>
</div>
<!-- Results Panel -->
<div class="glass-panel rounded-xl p-md border-primary-container/20">
<div class="flex items-center gap-sm mb-md">
<span class="material-symbols-outlined text-primary" data-icon="auto_awesome">auto_awesome</span>
<h2 class="font-headline-md text-headline-md text-primary tracking-tight">AI Insights</h2>
</div>
<div class="space-y-md">
<div class="bg-surface-container-high/50 p-md rounded-lg border border-white/5">
<div class="flex justify-between items-start mb-sm">
<span class="font-label-sm px-2 py-0.5 bg-primary/10 text-primary rounded">Refactoring Suggestion</span>
<button class="text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined text-[18px]" data-icon="content_copy">content_copy</span></button>
</div>
<pre class="font-label-md text-on-surface-variant text-sm overflow-x-auto p-xs scrollbar-hide"><span class="text-primary">def</span> <span class="text-secondary">optimized_fetch</span>(url):
    <span class="text-on-surface-variant/40"># AI optimized for async operations</span>
    <span class="text-primary">async with</span> aiohttp.ClientSession() <span class="text-primary">as</span> session:
        <span class="text-primary">async with</span> session.get(url) <span class="text-primary">as</span> response:
            <span class="text-primary">return await</span> response.json()</pre>
</div>
<div class="flex items-center gap-xs text-body-sm text-tertiary">
<span class="material-symbols-outlined text-[16px]" data-icon="bolt">bolt</span>
                            Performance improved by 42% with these changes.
                        </div>
</div>
</div>
</div>
<!-- Right Sidebar: History -->
<div class="col-span-12 lg:col-span-3">
<div class="glass-panel rounded-xl p-md sticky top-24 max-h-[calc(100vh-120px)] flex flex-col border-white/5">
<div class="flex items-center justify-between mb-lg">
<h2 class="font-headline-md text-body-md font-bold">Session History</h2>
<span class="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface" data-icon="history">history</span>
</div>
<div class="space-y-sm overflow-y-auto scrollbar-hide">
<!-- History Item -->
<button class="w-full text-left p-sm rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
<p class="font-label-md text-on-surface truncate mb-1 group-hover:text-primary transition-colors">API Endpoint Refactor</p>
<div class="flex justify-between items-center text-[11px] text-on-surface-variant opacity-60">
<span>2 hours ago</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]" data-icon="description">description</span> 1.2k LOC</span>
</div>
</button>
<button class="w-full text-left p-sm rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
<p class="font-label-md text-on-surface truncate mb-1 group-hover:text-primary transition-colors">Database Schema Leak Test</p>
<div class="flex justify-between items-center text-[11px] text-on-surface-variant opacity-60">
<span>Yesterday</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]" data-icon="bug_report">bug_report</span> 4 Bugs</span>
</div>
</button>
<button class="w-full text-left p-sm rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
<p class="font-label-md text-on-surface truncate mb-1 group-hover:text-primary transition-colors">Documentation: Auth Module</p>
<div class="flex justify-between items-center text-[11px] text-on-surface-variant opacity-60">
<span>3 days ago</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]" data-icon="menu_book">menu_book</span> PDF/MD</span>
</div>
</button>
<button class="w-full text-left p-sm rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
<p class="font-label-md text-on-surface truncate mb-1 group-hover:text-primary transition-colors">Legacy Code Cleanup</p>
<div class="flex justify-between items-center text-[11px] text-on-surface-variant opacity-60">
<span>Oct 24, 2024</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]" data-icon="auto_fix_high">auto_fix_high</span> Resolved</span>
</div>
</button>
</div>
<div class="mt-lg pt-md border-t border-white/5">
<div class="rounded-lg bg-surface-container p-sm">
<div class="flex items-center gap-sm mb-xs">
<span class="material-symbols-outlined text-primary-fixed-dim" data-icon="cloud_done">cloud_done</span>
<span class="font-label-sm text-on-surface-variant">Syncing Active</span>
</div>
<div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
<div class="bg-primary h-full w-[85%] animate-pulse-slow"></div>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
 Footer 
<footer class="w-full py-xl px-lg grid grid-cols-1 md:grid-cols-4 gap-lg max-w-container-max mx-auto border-t border-white/5 mt-xl">
<div class="flex flex-col gap-sm">
<h4 class="font-display text-headline-sm text-on-surface font-bold">CODECOLLAB</h4>
<p class="font-body-sm text-body-sm text-on-surface-variant opacity-60">© 2024 CODECOLLAB. Engineered for performance.</p>
</div>
<div class="flex flex-col gap-xs">
<h5 class="font-label-md text-primary mb-xs">Product</h5>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Resources</a>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Documentation</a>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Community</a>
</div>
<div class="flex flex-col gap-xs">
<h5 class="font-label-md text-primary mb-xs">Connect</h5>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">GitHub</a>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Discord</a>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">LinkedIn</a>
</div>
<div class="flex flex-col gap-xs">
<h5 class="font-label-md text-primary mb-xs">Legal</h5>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Privacy</a>
<a class="font-label-sm text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Terms</a>
</div>
</footer>
 Micro-interactions Script 
<script>
        // Simple ripple-like effect on feature cards
        document.querySelectorAll('.glass-panel').forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', \`\${x}px\`);
                card.style.setProperty('--mouse-y', \`\${y}px\`);
            });
        });

        // Simulating some "AI activity" in console
        console.log("%c[CODECOLLAB]%c AI Assistant initialized. Monitoring workspace for optimizations...", "color: #aec6ff; font-weight: bold;", "color: #8b90a0;");
    </script>
`;
}
