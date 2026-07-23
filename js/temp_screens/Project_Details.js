export function render_Project_Details() {
    return `
 Top Navigation Bar 
<nav class="fixed top-0 w-full z-50 flex justify-between items-center px-lg h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant shadow-sm">
<div class="flex items-center gap-lg">
<span class="font-display text-headline-md font-bold text-primary">CODECOLLAB</span>
<div class="hidden md:flex gap-md">
<a class="text-on-surface-variant hover:text-on-surface font-label-md transition-colors" href="#">Explore</a>
<a class="text-on-surface-variant hover:text-on-surface font-label-md transition-colors" href="#">Community</a>
<a class="text-primary font-bold border-b-2 border-primary pb-1 font-label-md" href="#">Workspace</a>
<a class="text-on-surface-variant hover:text-on-surface font-label-md transition-colors" href="#">Dashboard</a>
</div>
</div>
<div class="flex items-center gap-md">
<button class="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-highest p-2 rounded-full transition-all">notifications</button>
<button class="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-highest p-2 rounded-full transition-all">smart_toy</button>
<div class="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
<img alt="User profile" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl3x68eV3dECHQ35MotzAn30t7uEKM6sJ3py-fOU1tTfkZyd0j6VBQv4QZ1uTYJrrDWLwxGKXvZiesvKDYfR9QOncNUPdkjOZd4ZOf63keVfuwz1lqZWQuGNChOnshKZ1g1-_hFkoTj4GkKdBVnfe-azLnDZGKYQQn55am23aZ5Ju45YIys9dX95WsgmG59Wje11_4XoyWm2IdxBGxwgSbq4BAFkk23IUkfs8jmIg-zEYnL1fNlG_KHA"/>
</div>
</div>
</nav>
 Main Content Grid 
<main class="pt-24 pb-xl px-md md:px-lg max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-lg">
<!-- Left Column: Project Identity & README -->
<div class="lg:col-span-8 flex flex-col gap-lg">
<!-- Header Section -->
<header class="flex flex-col gap-md">
<div class="flex items-start justify-between">
<div class="flex flex-col gap-xs">
<div class="flex items-center gap-sm">
<h1 class="font-display text-headline-lg text-on-surface">VectorFlow Engine</h1>
<span class="px-xs py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm">v2.4.0</span>
</div>
<div class="flex items-center gap-sm text-on-surface-variant font-body-sm">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-[18px]">person</span>
<span>maintained by <span class="text-primary font-medium">alex_dev</span></span>
</div>
<span class="opacity-20">•</span>
<span>Updated 2 hours ago</span>
</div>
</div>
<div class="flex gap-xs">
<div class="flex flex-col items-center bg-surface-container-high border border-outline-variant px-md py-xs rounded-lg">
<span class="font-label-sm text-on-surface-variant uppercase">Stars</span>
<span class="font-headline-md text-primary">12.4k</span>
</div>
<div class="flex flex-col items-center bg-surface-container-high border border-outline-variant px-md py-xs rounded-lg">
<span class="font-label-sm text-on-surface-variant uppercase">Forks</span>
<span class="font-headline-md text-primary">1.8k</span>
</div>
</div>
</div>
<!-- Banner Image -->
<div class="w-full h-48 rounded-xl overflow-hidden bg-surface-container border border-outline-variant">
<div class="w-full h-full bg-cover bg-center opacity-60" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBQnbRIv50hLMtsjLaYCLOe9CiRAoWbV9123_LNqwkk1XWGYQoadgpHLYuWUWDi1fRlu0fqkNf-kzo8aP9VvsJ2xvOQiR2vjDyzJU_75kljBZ5DDeV96ViDeZ-3ZHRUIxpHiEslLv8vtr_NzszOOVDR_xbMkWPb5akpWf9fhpLlTWjrBgRTEPZeKRZr12Ug6LIT4l2-9BjKlILoM7z_s3hrma8jW2dFb-Da5BnND_AIjivEk1WcqMrMAg')"></div>
</div>
</header>
<!-- Markdown Content -->
<section class="bg-surface-container rounded-xl p-lg border border-outline-variant">
<div class="markdown-content">
<h2 class="text-primary flex items-center gap-2 mb-md">
<span class="material-symbols-outlined">description</span>
                        README.md
                    </h2>
<p class="text-on-surface mb-md">VectorFlow is a high-performance, distributed processing engine designed for real-time vector embeddings and large-scale semantic search operations. It leverages a custom JIT compiler for optimized GPU execution paths.</p>
<h2 class="text-on-surface font-headline-md mb-sm">Key Features</h2>
<ul class="list-disc list-inside space-y-sm text-on-surface font-body-md mb-md">
<li>Ultra-low latency vector quantization (under 2ms)</li>
<li>Seamless integration with PyTorch and TensorFlow</li>
<li>Distributed clustering using advanced RAFT consensus</li>
<li>Real-time visualization dashboard for node health</li>
</ul>
<h2 class="text-on-surface font-headline-md mb-sm">Quick Start</h2>
<div class="bg-surface-container-lowest p-md rounded-lg font-label-md border border-outline-variant text-secondary">
<code>\$ git clone https://github.com/codecollab/vector-flow.git<br/>
                        \$ cd vector-flow &amp;&amp; make install<br/>
                        \$ ./vectorflow --config ./configs/default.yaml</code>
</div>
</div>
</section>
<!-- Contributor Wall -->
<section class="flex flex-col gap-md">
<h3 class="font-headline-md text-on-surface flex items-center gap-2">
<span class="material-symbols-outlined">group</span>
                    Top Contributors
                </h3>
<div class="flex flex-wrap gap-md">
<div class="flex items-center gap-sm bg-surface-container-high border border-outline-variant pr-md pl-1 py-1 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer">
<img alt="Contributor" class="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoWKqoYE2Jlu_qRGPcKOMA99-4nZMLKttXnqx74j3i8gFD63ODStcYhTrDQqkEJ7iw0laWkxt5KljhWelYmWV5fbuq67Mr_-o8ytyB1mDAW3LtMbF5K3sYvCCawxBOSjJulIZS7jP87umV-shfQ9ipmVxNZDhRGiAw1Z6BNUuHHPMuGeCUibgig9CTxxggfec3xZm-FJoKg9Mg73lUQQcv6mfuwCL6RZfnGZjOZGT9vCUOrwtiNrNcvw"/>
<div class="flex flex-col">
<span class="font-label-md text-on-surface">sarah_codes</span>
<span class="text-[10px] uppercase text-on-surface-variant">Core Lead</span>
</div>
</div>
<div class="flex items-center gap-sm bg-surface-container-high border border-outline-variant pr-md pl-1 py-1 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer">
<img alt="Contributor" class="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqIwv0hy3Hwhlep1F0B9yedI7Zt1UE3s6jMfFcWVMjWEVl8DDM8Jy1q6MOBOT_SJeq6JF0kqVlBfZ1NXHJxUxwD1dnulMtgFumYUDjmKCj2qA3OvTAlaYshtJNjJUaJmCEdkR8aOJSbau8NHGjvnp3ZuAvAQiifTVrojGPUVUaf4ubPB-vC7tLVXJzyR_-jR5JjGMpsbQsqBnkyCjKQ-jOxpfDVp7vqwP927p040zcSgTwiIw50ESLtw"/>
<div class="flex flex-col">
<span class="font-label-md text-on-surface">kenji_u</span>
<span class="text-[10px] uppercase text-on-surface-variant">Contributor</span>
</div>
</div>
<div class="flex items-center gap-sm bg-surface-container-high border border-outline-variant pr-md pl-1 py-1 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer">
<img alt="Contributor" class="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe7lv5dnEhmZYFcm5ssNvuZ4TpVVY8zXlRJdG4Mahcuw2Vg94oM_4lbKwlfKaoquC_CYyxAwM4GPtW_wGVsT8CFDJjrUIc29obsKByCoJHCrxtjkHjqaAgLzl-U-Gw9QsAXS0vhUWUlxirh2qAXZ_D3BslO_JUy4wJn5FQ66cVfqFKFMITO6n2SaJaLRa8-PO05lqQG5s58L12hiMbDuvxXFMYS6U_8xNTRzqMOuOz1NGXiw_H-hrEKA"/>
<div class="flex flex-col">
<span class="font-label-md text-on-surface">marcus_v</span>
<span class="text-[10px] uppercase text-on-surface-variant">Maintenance</span>
</div>
</div>
<div class="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-primary font-label-md cursor-pointer hover:bg-primary-container hover:text-on-primary-container transition-colors">
                        +14
                    </div>
</div>
</section>
</div>
<!-- Right Column: Sidebar Actions & Stats -->
<aside class="lg:col-span-4 flex flex-col gap-lg">
<!-- Main Actions -->
<div class="bg-surface-container rounded-xl p-md flex flex-col gap-sm border border-outline-variant">
<button class="w-full py-md bg-primary-container text-on-primary-container font-headline-md rounded-lg flex items-center justify-center gap-sm hover:opacity-90 active:scale-[0.98] transition-all">
<span class="material-symbols-outlined">person_add</span>
                    Join Project
                </button>
<div class="grid grid-cols-2 gap-sm">
<button class="py-sm bg-surface-container-high border border-outline-variant flex flex-col items-center gap-1 hover:bg-surface-container-highest rounded-lg transition-all text-on-surface">
<span class="material-symbols-outlined">visibility</span>
<span class="font-label-sm">Watch</span>
</button>
<button class="py-sm bg-surface-container-high border border-outline-variant flex flex-col items-center gap-1 hover:bg-surface-container-highest rounded-lg transition-all text-on-surface">
<span class="material-symbols-outlined">fork_right</span>
<span class="font-label-sm">Fork</span>
</button>
</div>
<hr class="border-outline-variant my-xs"/>
<div class="flex flex-col gap-2">
<button class="w-full p-sm flex items-center justify-between text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined">bug_report</span>
<span class="font-body-md">Report Issue</span>
</div>
<span class="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
<button class="w-full p-sm flex items-center justify-between text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined">menu_book</span>
<span class="font-body-md">View Docs</span>
</div>
<span class="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
<button class="w-full p-sm flex items-center justify-between text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined">mail</span>
<span class="font-body-md">DM Maintainer</span>
</div>
<span class="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
<button class="w-full p-sm flex items-center justify-between text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined">share</span>
<span class="font-body-md">Share</span>
</div>
<span class="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</div>
</div>
<!-- Issue Tracker -->
<div class="bg-surface-container rounded-xl p-md flex flex-col gap-md border border-outline-variant">
<div class="flex items-center justify-between">
<h3 class="font-label-md uppercase tracking-wider text-on-surface-variant">Active Issues</h3>
<span class="text-primary font-label-sm cursor-pointer hover:underline">View All</span>
</div>
<div class="space-y-md">
<div class="flex flex-col gap-1 cursor-pointer group">
<span class="text-on-surface group-hover:text-primary transition-colors font-body-sm font-medium">Memory leak in GPU buffer pool during re-indexing</span>
<div class="flex items-center gap-sm">
<span class="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm">High</span>
<span class="text-on-surface-variant text-[11px]">#442 • opened 4h ago</span>
</div>
</div>
<div class="flex flex-col gap-1 cursor-pointer group">
<span class="text-on-surface group-hover:text-primary transition-colors font-body-sm font-medium">Missing Python 3.12 compatibility layer</span>
<div class="flex items-center gap-sm">
<span class="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-label-sm">Good First Issue</span>
<span class="text-on-surface-variant text-[11px]">#438 • opened 1d ago</span>
</div>
</div>
<div class="flex flex-col gap-1 cursor-pointer group">
<span class="text-on-surface group-hover:text-primary transition-colors font-body-sm font-medium">Optimize RAFT consensus heartbeats for high-latency nets</span>
<div class="flex items-center gap-sm">
<span class="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-label-sm">Intermediate</span>
<span class="text-on-surface-variant text-[11px]">#429 • opened 3d ago</span>
</div>
</div>
</div>
<button class="w-full mt-2 py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container-highest text-body-sm transition-all">Submit Pull Request</button>
</div>
<!-- Technical Environment -->
<div class="bg-surface-container rounded-xl p-md flex flex-col gap-sm border border-outline-variant">
<h3 class="font-label-md uppercase tracking-wider text-on-surface-variant">Tech Stack</h3>
<div class="flex flex-wrap gap-xs">
<span class="px-sm py-1 bg-surface-container-highest rounded text-on-surface font-label-sm">Rust</span>
<span class="px-sm py-1 bg-surface-container-highest rounded text-on-surface font-label-sm">CUDA</span>
<span class="px-sm py-1 bg-surface-container-highest rounded text-on-surface font-label-sm">gRPC</span>
<span class="px-sm py-1 bg-surface-container-highest rounded text-on-surface font-label-sm">Docker</span>
<span class="px-sm py-1 bg-surface-container-highest rounded text-on-surface font-label-sm">TensorFlow</span>
</div>
</div>
</aside>
</main>
 Footer 
<footer class="w-full py-xl px-lg bg-surface-container-lowest border-t border-outline-variant">
<div class="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-4 gap-lg">
<div class="col-span-1 md:col-span-1 flex flex-col gap-md">
<span class="font-display text-headline-sm text-on-surface">CODECOLLAB</span>
<p class="font-body-sm text-on-surface-variant">The high-performance workspace for the next generation of software engineers.</p>
</div>
<div class="flex flex-col gap-sm">
<h4 class="font-label-md text-on-surface">Platform</h4>
<div class="flex flex-col gap-xs">
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">Explore Projects</a>
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">Documentation</a>
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">Community Hub</a>
</div>
</div>
<div class="flex flex-col gap-sm">
<h4 class="font-label-md text-on-surface">Ecosystem</h4>
<div class="flex flex-col gap-xs">
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">GitHub Integration</a>
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">Discord Server</a>
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">Tech Blog</a>
</div>
</div>
<div class="flex flex-col gap-sm">
<h4 class="font-label-md text-on-surface">Legal</h4>
<div class="flex flex-col gap-xs">
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">Privacy Policy</a>
<a class="font-body-sm text-on-surface-variant hover:text-primary transition-all" href="#">Terms of Service</a>
</div>
</div>
</div>
<div class="max-w-container-max mx-auto mt-xl pt-lg border-t border-outline-variant flex flex-col md:flex-row justify-between gap-md">
<p class="font-label-sm text-on-surface-variant">© 2024 CODECOLLAB. Engineered for performance.</p>
<div class="flex gap-md">
<span class="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">public</span>
<span class="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">language</span>
</div>
</div>
</footer>
`;
}
