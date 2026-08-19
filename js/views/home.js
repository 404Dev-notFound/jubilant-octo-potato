export function render_home() {
    return `<div class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col min-h-[80vh] items-center justify-center text-center mt-12">
    <div class="inline-block px-md py-xs rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-xs tracking-widest mb-lg animate-pulse">
        CODECOLLAB 2.0 IS LIVE
    </div>
    
    <h1 class="text-[48px] md:text-[72px] lg:text-[84px] leading-tight font-extrabold text-on-surface tracking-tight mb-md" style="font-family: 'Orpheus', 'Orpheus Pro', serif; text-shadow: 0 0 40px rgba(0,255,136,0.2);">
        Looking for someone who <br>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">can commit</span>
    </h1>
    
    <p class="font-['Oleo_Script'] font-bold text-transparent text-lg md:text-xl max-w-3xl mb-xl tracking-wide" style="-webkit-text-stroke: 1px #ffffff; text-stroke: 1px #ffffff; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));">
        Find your next project, meet developers who share your passion, and build something that matters. Join teams, solve real-world issues, contribute your skills, and grow from every collaboration — from your first contribution to your next big open-source project.
    </p>
    
    <div class="flex flex-col sm:flex-row gap-md justify-center w-full max-w-2xl">
        <button onclick="window.location.hash='explore'" class="glass-glow-btn glass-glow-btn-primary">
            <span class="glass-glow-inner">
                <span class="material-symbols-outlined text-[20px]">explore</span> Explore Projects
            </span>
        </button>
        <button data-form="sign_up_form" title="Sign Up" class="glass-glow-btn glass-glow-btn-secondary">
            <span class="glass-glow-inner">
                <span class="material-symbols-outlined text-[20px]">rocket_launch</span> Start Contributing
            </span>
        </button>
        <button onclick="window.location.hash='about'" class="px-xl py-md bg-transparent text-on-surface-variant hover:text-on-surface rounded-xl transition-colors flex justify-center items-center gap-xs font-bold">
            Learn More <span class="material-symbols-outlined">arrow_forward</span>
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
    try {
        const res = await (window.apiFetch ? window.apiFetch('/api/stats') : fetch('http://localhost:3000/api/stats'));
        if (res.ok) {
            const data = await res.json();
            const devEl = document.getElementById('stat-developers');
            const projEl = document.getElementById('stat-projects');
            const prsEl = document.getElementById('stat-prs');
            const osEl = document.getElementById('stat-opensource');
            const issuesEl = document.getElementById('stat-issues');

            if (devEl && data.developers !== undefined) devEl.textContent = data.developers;
            if (projEl && data.projects !== undefined) projEl.textContent = data.projects;
            if (prsEl && (data.prsMerged !== undefined || data.loc !== undefined)) prsEl.textContent = data.prsMerged || data.loc;
            if (osEl && data.openSource !== undefined) osEl.textContent = data.openSource;
            if (issuesEl && data.issues !== undefined) issuesEl.textContent = data.issues;
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}
