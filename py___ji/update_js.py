import os

base_dir = 'codecollab_v2/js'

data_js = """
// Comprehensive Mock Database for CODECOLLAB SPA
window.CodeCollabDB = {
    user: {
        id: "u_1", username: "dev_ninja", name: "Alex Developer",
        avatar: "U", role: "Pro Member",
        bio: "Full-stack engineer passionate about open source and AI.",
        location: "San Francisco, CA", website: "codecollab.dev/alex",
        skills: ["Python", "JavaScript", "C++", "React", "Docker", "Machine Learning"],
        stats: { followers: 128, following: 45, repositories: 24, stars: 342, contributions: 1450, streak: 12 },
        organizations: [{ name: "OpenAI", logo: "O" }, { name: "Vercel", logo: "V" }],
        achievements: ["Early Adopter", "Bug Hunter", "Mentor"]
    },
    projects: [
        { id: "p_1", title: "NeonDB", desc: "High-performance distributed key-value store.", lang: "C++", stars: 1205, issues: 14, contribs: 8, diff: "Advanced", org: "Database Corp", ai_rec: true },
        { id: "p_2", title: "AuraUI", desc: "Glassmorphism UI component library.", lang: "JavaScript", stars: 840, issues: 5, contribs: 12, diff: "Beginner", org: "DesignCo", ai_rec: false },
        { id: "p_3", title: "NexusML", desc: "ML framework optimized for edge.", lang: "Python", stars: 3200, issues: 42, contribs: 35, diff: "Intermediate", org: "AI Labs", ai_rec: true },
        { id: "p_4", title: "SkyMind", desc: "Autonomous AI agent framework.", lang: "Python", stars: 5400, issues: 120, contribs: 80, diff: "Advanced", org: "SkyCorp", ai_rec: true }
    ],
    issues: [
        { id: "i_1", title: "Memory leak in query parser", status: "todo", priority: "high", project: "NeonDB", assignee: "U" },
        { id: "i_2", title: "Add dark mode support", status: "in-progress", priority: "medium", project: "AuraUI", assignee: "A" },
        { id: "i_3", title: "Update README docs", status: "done", priority: "low", project: "NexusML", assignee: "U" }
    ],
    prs: [
        { id: "pr_1", title: "Implement zero-copy network stack", status: "open", author: "alexdev", time: "2 days ago", tag: "enhancement", ci: "pass" },
        { id: "pr_2", title: "Fix edge case in auth flow", status: "merged", author: "johndoe", time: "5 days ago", tag: "bug", ci: "pass" }
    ],
    events: [
        { title: "Global Open Source Hackathon 2026", date: "August 15-20", participants: 15420, type: "Hackathon" },
        { title: "Intro to AI Agents", date: "July 25", participants: 3200, type: "Webinar" }
    ],
    leaderboard: [
        { rank: 1, name: "Sarah Code", score: 15420, badge: "🥇" },
        { rank: 2, name: "Alex Developer", score: 14200, badge: "🥈" },
        { rank: 3, name: "Mike Script", score: 13800, badge: "🥉" }
    ]
};
"""

components_js = """
// Reusable UI Components and Utilities
window.UI = {
    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        let icon = 'info', colorClass = 'text-primary border-primary/50 bg-primary/10';
        if (type === 'success') { icon = 'check_circle'; colorClass = 'text-tertiary border-tertiary/50 bg-tertiary/10'; } 
        else if (type === 'error') { icon = 'error'; colorClass = 'text-error border-error/50 bg-error/10'; }
        toast.className = `glass-panel px-md py-sm rounded-lg flex items-center gap-sm transform transition-all duration-300 translate-x-[120%] ${colorClass}`;
        toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span><span class="font-label-md">${message}</span>`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove('translate-x-[120%]'));
        setTimeout(() => { toast.classList.add('translate-x-[120%]'); setTimeout(() => toast.remove(), 300); }, 3000);
    },
    
    openModal: (contentHTML) => {
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!container || !content) return;
        content.innerHTML = contentHTML;
        container.classList.remove('pointer-events-none', 'opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    },

    closeModal: () => {
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!container) return;
        container.classList.add('pointer-events-none', 'opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => content.innerHTML = '', 300);
    },
    
    createSkeleton: (width='w-full', height='h-24') => {
        return `<div class="${width} ${height} rounded-xl bg-surface-container-high animate-pulse border border-white/5"></div>`;
    }
};

// Global Listeners for Modal
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') || e.target.closest('[data-close-modal]')) {
        window.UI.closeModal();
    }
});
"""

app_js = """
document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const nebulaBg = document.getElementById('nebula-bg');
    const viewCache = {};

    async function navigate() {
        let hash = window.location.hash.substring(1) || 'home';
        const viewName = hash.split('?')[0].toLowerCase();
        
        // Nebula Background Logic
        if (nebulaBg) {
            if (viewName === 'home') {
                nebulaBg.style.opacity = '1';
                nebulaBg.style.filter = 'blur(0px)';
            } else {
                nebulaBg.style.opacity = '0.3';
                nebulaBg.style.filter = 'blur(4px)';
            }
        }
        
        // Render Skeleton Loader before fetching
        appContent.innerHTML = `
            <main class="w-full max-w-[1400px] mx-auto p-xl min-h-[80vh] flex flex-col gap-lg mt-8">
                ${window.UI.createSkeleton('w-1/3', 'h-12')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
                    ${window.UI.createSkeleton('w-full', 'h-64')}
                    ${window.UI.createSkeleton('w-full', 'h-64')}
                    ${window.UI.createSkeleton('w-full', 'h-64')}
                </div>
            </main>
        `;

        try {
            let html = viewCache[viewName];
            if (!html) {
                const response = await fetch(`views/${viewName}.html`);
                if (!response.ok) throw new Error('View not found');
                html = await response.text();
                viewCache[viewName] = html;
            }
            // Small artificial delay to show skeleton and simulate real load
            setTimeout(() => {
                appContent.innerHTML = html;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Execute inline scripts if any
                appContent.querySelectorAll('script').forEach(script => {
                    const newScript = document.createElement('script');
                    if (script.src) newScript.src = script.src;
                    else newScript.textContent = script.textContent;
                    document.body.appendChild(newScript);
                });
            }, 300);
        } catch (error) {
            console.error(error);
            appContent.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-[60vh] text-error">
                    <span class="material-symbols-outlined text-[64px] mb-md">sentiment_dissatisfied</span>
                    <h2 class="text-headline-lg font-display mb-sm">Page Not Found</h2>
                    <p class="text-on-surface-variant mb-lg">The requested view '${viewName}' does not exist or has not been generated.</p>
                    <button onclick="window.location.hash='home'" class="px-xl py-sm bg-primary text-on-primary rounded-lg font-bold shadow-lg hover:bg-primary-container transition-colors">Return Home</button>
                </div>
            `;
        }
    }

    // Parallax Scrolling for Nebula Background
    window.addEventListener('scroll', () => {
        if (nebulaBg) {
            const scrolled = window.scrollY;
            nebulaBg.style.transform = `translateY(${scrolled * 0.4}px)`;
        }
    });

    // Global Link Interceptor & Action Handler
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
                e.preventDefault();
                window.location.hash = href.substring(1) || 'home';
            }
        }
        
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
            const action = actionBtn.getAttribute('data-action');
            if (action === 'toast') {
                window.UI.showToast(actionBtn.getAttribute('data-message') || 'Completed!', actionBtn.getAttribute('data-type') || 'success');
            } else if (action === 'modal') {
                // Generic Modal trigger
                const title = actionBtn.getAttribute('title') || 'Dialog';
                const html = `
                    <div class="glass-panel rounded-2xl border-t-4 border-t-primary overflow-hidden shadow-2xl">
                        <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container">
                            <h3 class="font-bold text-lg text-on-surface flex items-center gap-xs">
                                <span class="material-symbols-outlined text-primary">${actionBtn.querySelector('.material-symbols-outlined')?.textContent || 'info'}</span>
                                ${title}
                            </h3>
                            <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1"><span class="material-symbols-outlined">close</span></button>
                        </div>
                        <div class="p-xl text-center">
                            <span class="material-symbols-outlined text-[48px] text-primary mb-md animate-bounce">rocket_launch</span>
                            <h4 class="font-headline-sm mb-sm text-on-surface">Feature In Development</h4>
                            <p class="text-on-surface-variant text-sm max-w-md mx-auto">This interactive flow is connected to the frontend architecture and ready for backend integration!</p>
                        </div>
                        <div class="p-md border-t border-white/5 bg-surface-container flex justify-end gap-sm">
                            <button data-close-modal class="px-md py-sm bg-surface-variant rounded-lg text-sm hover:bg-outline-variant transition-colors">Cancel</button>
                            <button data-close-modal class="px-md py-sm bg-primary text-on-primary rounded-lg text-sm font-bold shadow-lg shadow-primary/20" onclick="window.UI.showToast('Action confirmed', 'success')">Confirm</button>
                        </div>
                    </div>
                `;
                window.UI.openModal(html);
            }
        }
    });

    window.addEventListener('hashchange', navigate);
    navigate();
});
"""

files = {
    "data.js": data_js,
    "components.js": components_js,
    "app.js": app_js
}

for name, content in files.items():
    with open(os.path.join(base_dir, name), 'w', encoding='utf-8') as f:
        f.write(content.strip())

print("JS files successfully updated!")
