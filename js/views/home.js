export function render_home() {
    let isAuthenticated = false;
    try {
        isAuthenticated = !!localStorage.getItem('currentUser');
    } catch (e) {}

    const ctaButtonHtml = isAuthenticated
        ? `<!-- 2. Secondary CTA: Dashboard -->
        <button id="hero-cta-btn" onclick="window.location.hash='dashboard'" title="Dashboard" class="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-surface-container-high/80 hover:bg-surface-variant border border-white/10 hover:border-secondary/40 text-on-surface hover:text-secondary font-bold text-sm sm:text-base backdrop-blur-md shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer">
            <span class="material-symbols-outlined text-[20px] text-secondary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">dashboard</span>
            <span>Dashboard</span>
        </button>`
        : `<!-- 2. Secondary CTA: Sign Up -->
        <button id="hero-cta-btn" data-form="sign_up_form" title="Sign Up" class="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-surface-container-high/80 hover:bg-surface-variant border border-white/10 hover:border-secondary/40 text-on-surface hover:text-secondary font-bold text-sm sm:text-base backdrop-blur-md shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer">
            <span class="material-symbols-outlined text-[20px] text-secondary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">rocket_launch</span>
            <span>Sign Up</span>
        </button>`;

    return `<div class="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col min-h-[85vh] items-center justify-center text-center">
    <!-- Subtle Background Ambient Glow -->
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[650px] h-[320px] bg-gradient-to-tr from-primary/15 via-secondary/15 to-transparent rounded-full blur-[120px] pointer-events-none -z-10"></div>

    <!-- Live Status Badge -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/25 text-secondary text-xs font-semibold tracking-wider uppercase mb-8 shadow-[0_0_20px_rgba(219,184,255,0.12)] backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
        <span>CODECOLLAB 2.0 IS LIVE</span>
    </div>
    
    <!-- Hero Heading -->
    <h1 class="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-extrabold text-on-surface tracking-tight leading-[1.12] mb-6 max-w-5xl font-display">
        Looking for someone who <br class="hidden sm:inline" />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary drop-shadow-[0_0_35px_rgba(174,198,255,0.25)]">can commit</span>
    </h1>
    
    <!-- Hero Description -->
    <p class="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-normal antialiased">
        Find your next project, meet developers who share your passion, and build something that matters. Join teams, solve real-world issues, contribute your skills, and grow from every collaboration — from your first contribution to your next big open-source project.
    </p>
    
    <!-- Actions (3 CTAs with distinct visual hierarchy) -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-2xl mx-auto">
        <!-- 1. Primary CTA: Explore Projects -->
        <button onclick="window.location.hash='explore'" class="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0070f3] to-[#6807ba] text-white font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(0,112,243,0.35)] hover:shadow-[0_0_35px_rgba(104,7,186,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer">
            <span class="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-45">explore</span>
            <span>Explore Projects</span>
        </button>

        ${ctaButtonHtml}

        <!-- 3. Subtle/Text CTA: Learn More -->
        <button onclick="window.location.hash='about'" class="w-full sm:w-auto group inline-flex items-center justify-center gap-1.5 px-5 py-3.5 text-on-surface-variant hover:text-on-surface font-semibold text-sm sm:text-base rounded-xl transition-all duration-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer">
            <span>Learn More</span>
            <span class="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
        </button>
    </div>
    
    <!-- Hero Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-lg mt-24 w-full max-w-5xl border-t border-white/5 pt-xl">
        <div><div id="stat-developers" class="text-headline-lg font-display text-primary font-bold">0</div><div class="text-sm text-on-surface-variant">Developers</div></div>
        <div><div id="stat-projects" class="text-headline-lg font-display text-secondary font-bold">0</div><div class="text-sm text-on-surface-variant">Projects</div></div>
        <div><div id="stat-prs" class="text-headline-lg font-display text-tertiary font-bold">0K+</div><div class="text-sm text-on-surface-variant">PRs Merged</div></div>
        <div><div id="stat-opensource" class="text-headline-lg font-display text-error font-bold">100%</div><div class="text-sm text-on-surface-variant">Open Source</div></div>
        <div><div id="stat-issues" class="text-headline-lg font-display text-primary font-bold">0</div><div class="text-sm text-on-surface-variant">Issues</div></div>
    </div>
</div>`;
}

export async function initHome() {
    if (window.updateAuthUI) {
        window.updateAuthUI();
    }
    try {
        const res = await (window.apiFetch ? window.apiFetch('/api/stats') : fetch('/api/stats'));
        if (res.ok) {
            const data = await res.json();
            const devEl = document.getElementById('stat-developers');
            const projEl = document.getElementById('stat-projects');
            const prsEl = document.getElementById('stat-prs');
            const osEl = document.getElementById('stat-opensource');
            const issuesEl = document.getElementById('stat-issues');

            if (devEl) devEl.textContent = data.totalDevelopers ?? data.developers ?? 0;
            if (projEl) projEl.textContent = data.activeProjects ?? data.projects ?? 0;
            if (prsEl) prsEl.textContent = `${data.prsMerged ?? 38}+`;
            if (osEl) osEl.textContent = '100%';
            if (issuesEl) issuesEl.textContent = data.cumulativeIssues ?? data.issues ?? 0;
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}
