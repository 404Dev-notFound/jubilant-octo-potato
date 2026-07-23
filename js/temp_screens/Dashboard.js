export function render_Dashboard() {
    return `
 TopNavBar 
<header class="fixed top-0 w-full z-50 flex justify-between items-center px-lg h-16 bg-surface/70 backdrop-blur-md border-b border-outline-variant/30">
<div class="flex items-center gap-lg">
<span class="font-display text-headline-md font-bold text-primary-container tracking-tight">CODECOLLAB</span>
<nav class="hidden md:flex items-center gap-md">
<a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors duration-200" href="#">Explore</a>
<a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors duration-200" href="#">Community</a>
<a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors duration-200" href="/workspace">Workspace</a>
<a class="text-primary-container font-bold border-b-2 border-primary-container pb-1 font-label-md text-label-md" href="#">Dashboard</a>
<a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors duration-200" href="#">About</a>
</nav>
</div>
<div class="flex items-center gap-md">
<div class="relative hidden lg:block">
<input class="bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-xs text-body-sm w-64 focus:outline-none focus:border-primary-container transition-all text-on-surface" placeholder="Search projects..." type="text"/>
<span class="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant" style="font-size: 18px;">search</span>
</div>
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary-container transition-colors">notifications</button>
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary-container transition-colors">smart_toy</button>
<a href="/profile">
<img class="w-8 h-8 rounded-full border border-primary-container/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnallIS-gGSkNZmD4S4NQnXdSVsFtjjpSaUoOcwV2gIIKONQuz36vwo965_w-cv6-4BXsE-cAZ0wx0-fNB5JLlhbPD02Qr6eO-_-NGfY6_GnEdi78wCKKFphXZNq1I2PKJZyqTC2quvwbnFkQoNLjq6027lmnwax6zbaAD3wNDXyoyAmDsO99s0lnOM5HPKBiJV_486e06J0qPZLickfLUBon2zpCc3sO3U7Xf8YT7T25ARZ77nu5nYQ"/>
</a>
</div>
</header>
 SideNavBar 
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] hidden md:flex flex-col p-md gap-xs w-64 bg-surface-container-low border-r border-outline-variant/20 z-40">
<div class="mb-lg">
<div class="flex items-center gap-sm p-xs">
<div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-on-primary-container">code_blocks</span>
</div>
<div>
<h3 class="font-headline-md text-on-surface text-[16px] leading-tight">Current Workspace</h3>
<p class="text-on-surface-variant font-body-sm text-[12px]">v2.4.0-stable</p>
</div>
</div>
<button class="w-full mt-md bg-primary-container text-on-primary-container py-xs px-md rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:opacity-90 transition-all shadow-md">
<span class="material-symbols-outlined text-[18px]">add</span> New Branch
        </button>
</div>
<nav class="flex-grow space-y-1">
<a class="flex items-center gap-md p-sm bg-primary-container/10 text-primary-container rounded-lg font-label-md text-label-md transition-all" href="#">
<span class="material-symbols-outlined">dashboard</span> Overview
        </a>
<a class="flex items-center gap-md p-sm text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-label-md text-label-md transition-all" href="#">
<span class="material-symbols-outlined">code_blocks</span> Repository
        </a>
<a class="flex items-center gap-md p-sm text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-label-md text-label-md transition-all" href="#">
<span class="material-symbols-outlined">merge_type</span> Pull Requests
            <span class="ml-auto bg-primary-container/20 text-primary-container text-[10px] px-1.5 rounded-full">4</span>
</a>
<a class="flex items-center gap-md p-sm text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-label-md text-label-md transition-all" href="#">
<span class="material-symbols-outlined">bug_report</span> Issues
        </a>
<a class="flex items-center gap-md p-sm text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-label-md text-label-md transition-all" href="/settings">
<span class="material-symbols-outlined">settings</span> Settings
        </a>
</nav>
<div class="mt-auto border-t border-outline-variant/20 pt-md">
<a class="flex items-center gap-md p-sm text-on-surface-variant hover:text-primary-container transition-all font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">menu_book</span> Documentation
        </a>
<a class="flex items-center gap-md p-sm text-on-surface-variant hover:text-primary-container transition-all font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">help</span> Support
        </a>
</div>
</aside>
 Main Canvas 
<main class="md:ml-64 pt-24 pb-12 px-md md:px-lg max-w-container-max mx-auto">
<header class="mb-xl">
<div class="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<p class="text-primary-container font-label-md text-label-md mb-xs uppercase">Dashboard Overview</p>
<h1 class="font-display text-headline-lg text-on-surface">Welcome back, Alex Rivera</h1>
</div>
<div class="flex gap-sm">
<div class="flex -space-x-2">
<img class="w-8 h-8 rounded-full border-2 border-background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvi05dW_T-yO9u3ifOV5a5RqHuSZwGIp65lgW_3vpDvwFr7nD16T2fNwQ9qxeyK3XgstAyNDO8QgtbN2vcJHluvtwDuAaK3fBI8okPcpWUpEZaj6hZQZ8RTy5JrEfbyadukmQgCuy_HvwkEJnKW2cLEOu6MdHi0h38rWetSSbjL63QxHnpVjmmDwzHJgyUb3q4llXFZ4mUcItJ9809HNgb44ejfFdXl05ndE2l9ZwtcuZnXL3_tJdAnQ"/>
<img class="w-8 h-8 rounded-full border-2 border-background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCf7zjuX_vfqFejQm7Ic9gqPo2gOXMrZAZDuDFCFU-7N414t7gGtojuhvSF27wO7vIj92Df4URYa25n9PFjIr43dCgS6kCDiYfCXpBdHGdh69rmSJC48OJ_ZzMLVxIBEc_2vRecRR3qxUiCx7d2G-nvJD8gFp58bJt66DDLAMgGmoyVpnpxYSoMke7gnsl5fb4ZUB1Y6mNzhyUkXYRqAYBzg6BQSr0mqCJCSaSTjxLrUm7Ha_XPqFN8qQ"/>
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold border-2 border-background text-on-surface-variant">+12</div>
</div>
<span class="text-on-surface-variant font-body-sm flex items-center gap-xs">
<span class="w-2 h-2 rounded-full bg-tertiary"></span> 4 Active in Space
                </span>
</div>
</div>
</header>
<div class="grid grid-cols-1 md:grid-cols-12 gap-gutter">
<!-- Stats Grid Left -->
<div class="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter">
<!-- Project Ecosystem -->
<div class="md:col-span-2 glass rounded-xl p-lg h-80 relative overflow-hidden group border border-outline-variant/10">
<div class="relative z-10">
<div class="flex justify-between items-center mb-md">
<h3 class="font-headline-md text-on-surface flex items-center gap-xs">
<span class="material-symbols-outlined text-primary-container">hub</span> Project Ecosystem
                        </h3>
<button class="text-on-surface-variant hover:text-primary-container material-symbols-outlined">fullscreen</button>
</div>
<p class="text-on-surface-variant font-body-sm max-w-xs">Visualizing dependencies and active code paths across your repository mesh.</p>
</div>
<!-- Decorative Graph Visual -->
<div class="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
<div class="node top-1/4 left-1/3"></div>
<div class="node top-2/3 left-1/4"></div>
<div class="node top-1/2 left-1/2"></div>
<div class="node top-1/3 left-3/4"></div>
<div class="node top-3/4 left-2/3"></div>
<div class="line w-40 top-1/4 left-1/3" style="transform: rotate(45deg);"></div>
<div class="line w-52 top-1/2 left-1/2" style="transform: rotate(-120deg);"></div>
<div class="line w-32 top-1/3 left-3/4" style="transform: rotate(150deg);"></div>
<div class="line w-60 top-3/4 left-2/3" style="transform: rotate(-20deg);"></div>
</div>
</div>
<!-- Contribution Heatmap -->
<div class="glass rounded-xl p-md flex flex-col justify-between border border-outline-variant/10">
<div>
<h4 class="font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider">Contribution Streak</h4>
<div class="flex flex-wrap gap-[4px] contribution-map">
<script>
                            document.addEventListener('DOMContentLoaded', () => {
                                const map = document.querySelector('.contribution-map');
                                if (map) {
                                    for(let i=0; i<42; i++) {
                                        const cell = document.createElement('div');
                                        const intensity = Math.floor(Math.random() * 4);
                                        cell.className = \`heat-cell heat-\${intensity}\`;
                                        map.appendChild(cell);
                                    }
                                }
                            });
                        </script>
</div>
</div>
<div class="mt-md flex justify-between items-end">
<div>
<p class="font-display text-[24px] font-bold text-on-surface">14 Days</p>
<p class="font-body-sm text-on-surface-variant">Current Streak</p>
</div>
<span class="text-tertiary font-label-sm">+12% vs last month</span>
</div>
</div>
<!-- GitHub Stats -->
<div class="glass rounded-xl p-md grid grid-cols-2 gap-sm border border-outline-variant/10">
<div class="p-sm bg-surface-container rounded-lg border border-outline-variant/10">
<span class="material-symbols-outlined text-primary-container mb-xs">star</span>
<p class="font-display text-headline-md text-on-surface">1.2k</p>
<p class="font-label-sm text-on-surface-variant">Total Stars</p>
</div>
<div class="p-sm bg-surface-container rounded-lg border border-outline-variant/10">
<span class="material-symbols-outlined text-tertiary mb-xs">history</span>
<p class="font-display text-headline-md text-on-surface">432</p>
<p class="font-label-sm text-on-surface-variant">Commits</p>
</div>
<div class="col-span-2 p-sm bg-surface-container rounded-lg border border-outline-variant/10 flex items-center justify-between">
<div>
<p class="font-label-sm text-on-surface-variant">Active Pull Requests</p>
<p class="font-headline-md text-on-surface">8 Pending</p>
</div>
<span class="material-symbols-outlined text-secondary">merge_type</span>
</div>
</div>
<!-- AI Suggestions -->
<div class="md:col-span-2 glass rounded-xl p-lg border border-outline-variant/10">
<div class="flex items-center gap-sm mb-lg">
<div class="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
<span class="material-symbols-outlined text-primary-container" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
</div>
<div>
<h3 class="font-headline-md text-on-surface">Copilot Insights</h3>
<p class="font-body-sm text-on-surface-variant">Based on your activity in <span class="text-primary-container">React &amp; TypeScript</span></p>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-md">
<div class="flex gap-md group cursor-pointer p-sm rounded-lg hover:bg-surface-variant/30 transition-all">
<div class="w-12 h-12 shrink-0 rounded bg-surface-container flex items-center justify-center group-hover:bg-primary-container/10 transition-all">
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container">folder_open</span>
</div>
<div>
<p class="font-label-md text-on-surface group-hover:text-primary-container transition-colors">Project: NeuralFlow UI</p>
<p class="font-body-sm text-on-surface-variant">You might like this repository's component architecture.</p>
</div>
</div>
<div class="flex gap-md group cursor-pointer p-sm rounded-lg hover:bg-surface-variant/30 transition-all">
<div class="w-12 h-12 shrink-0 rounded bg-surface-container flex items-center justify-center group-hover:bg-tertiary/10 transition-all">
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary">bug_report</span>
</div>
<div>
<p class="font-label-md text-on-surface group-hover:text-tertiary transition-colors">Issue #104 in 'OpenDev'</p>
<p class="font-body-sm text-on-surface-variant">This bug matches your skill in GraphQL optimizations.</p>
</div>
</div>
</div>
</div>
</div>
<!-- Side Feed Right -->
<div class="md:col-span-4 space-y-gutter">
<!-- Live Activity -->
<div class="glass rounded-xl p-lg border border-outline-variant/10">
<div class="flex justify-between items-center mb-md">
<h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Live Activity</h3>
<span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
</div>
<div class="space-y-md">
<div class="flex gap-sm items-start">
<img class="w-8 h-8 rounded-full shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9a5gOkAqJRFV21acfPMe1c7toXBxnHyR_4M6J87gYxa1A2K4JL6MJq05fgN_QQpmrPdFFXcOHnfrimhTJ-1OoGF7bIoYVgBOrG-1tkO2XRPZS9-XaHx2XR8C4eaUPDyiMD7kS3dxV_I5tlz-lXgcO26mKEIkHvc0rVVVTye2f0FiDH5bcZAaogLRfnk77NgymRJPYss7ZGt4VKiwDxfODb5vqyt5l4L4hw7-iQ0Am7NhwPPP21f5XWg"/>
<div class="text-body-sm">
<span class="font-bold text-on-surface">Sarah K.</span> approved your PR in <span class="text-primary-container font-label-sm">core-engine</span>
<p class="text-[12px] text-on-surface-variant mt-1">2m ago</p>
</div>
</div>
<div class="flex gap-sm items-start">
<div class="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-secondary text-[16px]">merge</span>
</div>
<div class="text-body-sm">
<span class="font-bold text-on-surface">Build Succeeded:</span> branch <span class="text-secondary font-label-sm">feat/auth-v3</span>
<p class="text-[12px] text-on-surface-variant mt-1">15m ago</p>
</div>
</div>
<div class="flex gap-sm items-start">
<img class="w-8 h-8 rounded-full shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj_te7SoH89XqML-9m859QZ2NPW2DFz4t78YgKJYxdnqP0nXdUHxCK4we7J6XvzGJJpGkgLoxYCJFRVbmFv7mroX7Tv_DWsEyjsIu5-G0tZjUhnSADmlrgLZAm03-1rJqw3b1qfn2blZ322LIPeuEUsfnXR7fAHgittIq6Dd12c9Xdpi299hodIRvbE9I9UjOX9cS0XX-BgMLCHVTj_K48Eg2CVyZUX_Wwf36JCxl6mblcYGORL8ji6Q"/>
<div class="text-body-sm">
<span class="font-bold text-on-surface">Marc L.</span> commented on <span class="text-primary-container font-label-sm">Issue #88</span>
<p class="text-[12px] text-on-surface-variant mt-1">1h ago</p>
</div>
</div>
</div>
<button class="w-full mt-lg py-xs text-on-surface-variant hover:text-on-surface font-label-sm border border-dashed border-outline-variant/30 rounded-lg hover:border-primary-container/40 transition-all">
                    View All History
                </button>
</div>
<!-- Pinned Repos -->
<div class="glass rounded-xl p-lg border border-outline-variant/10">
<h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-md">Pinned Repositories</h3>
<div class="space-y-sm">
<div class="p-md rounded-lg bg-surface-container border border-outline-variant/10 hover:bg-surface-variant/30 transition-all cursor-pointer group">
<div class="flex justify-between items-start mb-xs">
<span class="font-label-md text-on-surface group-hover:text-primary-container transition-colors">codecollab / engine-v2</span>
<span class="material-symbols-outlined text-primary-container text-[18px]" style="font-variation-settings: 'FILL' 1;">push_pin</span>
</div>
<div class="flex gap-sm mt-md">
<span class="flex items-center gap-[4px] text-[10px] text-on-surface-variant">
<span class="w-2 h-2 rounded-full bg-[#f1e05a]"></span> JavaScript
                            </span>
<span class="flex items-center gap-[4px] text-[10px] text-on-surface-variant">
<span class="material-symbols-outlined text-[12px]">star</span> 84
                            </span>
</div>
</div>
<div class="p-md rounded-lg bg-surface-container border border-outline-variant/10 hover:bg-surface-variant/30 transition-all cursor-pointer group">
<div class="flex justify-between items-start mb-xs">
<span class="font-label-md text-on-surface group-hover:text-primary-container transition-colors">alex-riv / design-tokens</span>
<span class="material-symbols-outlined text-on-surface-variant text-[18px]">push_pin</span>
</div>
<div class="flex gap-sm mt-md">
<span class="flex items-center gap-[4px] text-[10px] text-on-surface-variant">
<span class="w-2 h-2 rounded-full bg-[#3178c6]"></span> TypeScript
                            </span>
<span class="flex items-center gap-[4px] text-[10px] text-on-surface-variant">
<span class="material-symbols-outlined text-[12px]">star</span> 12
                            </span>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
 Footer 
<footer class="w-full py-xl px-lg border-t border-outline-variant/10 bg-surface-container-lowest mt-xl">
<div class="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-4 gap-lg">
<div class="col-span-1 md:col-span-1">
<span class="font-display text-headline-sm text-on-surface font-bold">CODECOLLAB</span>
<p class="mt-md font-body-sm text-on-surface-variant">© 2024 CODECOLLAB. Engineered for performance.</p>
</div>
<div>
<h4 class="font-label-md text-on-surface mb-md">Product</h4>
<ul class="space-y-xs font-body-sm text-on-surface-variant">
<li><a class="hover:text-primary-container transition-all" href="#">Documentation</a></li>
<li><a class="hover:text-primary-container transition-all" href="#">Resources</a></li>
<li><a class="hover:text-primary-container transition-all" href="#">GitHub</a></li>
</ul>
</div>
<div>
<h4 class="font-label-md text-on-surface mb-md">Community</h4>
<ul class="space-y-xs font-body-sm text-on-surface-variant">
<li><a class="hover:text-primary-container transition-all" href="#">Discord</a></li>
<li><a class="hover:text-primary-container transition-all" href="#">LinkedIn</a></li>
<li><a class="hover:text-primary-container transition-all" href="#">X (Twitter)</a></li>
</ul>
</div>
<div>
<h4 class="font-label-md text-on-surface mb-md">Legal</h4>
<ul class="space-y-xs font-body-sm text-on-surface-variant">
<li><a class="hover:text-primary-container transition-all" href="#">Privacy</a></li>
<li><a class="hover:text-primary-container transition-all" href="#">Terms</a></li>
</ul>
</div>
</div>
</footer>
<script>
    // Atmospheric interaction: subtle movement of graph nodes
    document.addEventListener('mousemove', (e) => {
        const nodes = document.querySelectorAll('.node');
        const lines = document.querySelectorAll('.line');
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;

        nodes.forEach((node, i) => {
            const shift = (i + 1) * 5;
            node.style.transform = \`translate(\${x * shift}px, \${y * shift}px)\`;
        });
        
        lines.forEach((line, i) => {
            const shift = (i + 1) * 2;
            const currentTransform = line.style.transform || '';
            const baseRotate = currentTransform.includes('rotate') ? currentTransform.split('rotate(')[1].split(')')[0] : '0deg';
            line.style.transform = \`rotate(\${baseRotate}) translate(\${x * shift}px, \${y * shift}px)\`;
        });
    });
</script>
`;
}
