export function render_project_details() {
    return `
<main id="project-details-container" class="relative w-full max-w-[1200px] mx-auto p-xl flex flex-col min-h-screen pt-4">
    <div class="flex items-center justify-center p-12 text-on-surface-variant">
        <span class="material-symbols-outlined animate-spin text-3xl text-primary mr-2">progress_activity</span>
        <span>Loading project details...</span>
    </div>
</main>
`;
}

export async function initProjectDetails(projectId) {
    const container = document.getElementById('project-details-container');
    if (!container) return;

    try {
        let project = null;
        if (projectId) {
            const res = await (window.apiFetch ? window.apiFetch(`/api/projects/${projectId}`) : fetch(`/api/projects/${projectId}`));
            if (res.ok) {
                project = await res.json();
            }
        }

        // Fallback to first project if not specified or failed
        if (!project) {
            const resAll = await (window.apiFetch ? window.apiFetch('/api/projects') : fetch('/api/projects'));
            if (resAll.ok) {
                const projects = await resAll.json();
                project = projects.find(p => p.id === projectId) || projects[0];
            }
        }

        if (!project) {
            container.innerHTML = `
                <div class="glass-panel p-xl rounded-xl text-center">
                    <span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
                    <h2 class="text-xl font-bold text-on-surface mb-2">Project Not Found</h2>
                    <p class="text-on-surface-variant text-sm mb-4">The requested project could not be located.</p>
                    <a href="#explore" class="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm">Explore Projects</a>
                </div>
            `;
            return;
        }

        // Extract Owner Info
        const owner = project.owner;
        const ownerName = owner?.name || (project.ownerId ? `User #${project.ownerId}` : 'Project Owner');
        const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'O';

        // Extract Members Info
        const members = project.members || [];

        // Tech stack
        const techStack = Array.isArray(project.techStack) ? project.techStack : [];

        // Issues count
        const issuesCount = (project.issues && project.issues.length) || 0;

        container.innerHTML = `
        <!-- Header -->
        <div class="glass-panel p-lg rounded-xl mb-lg border-t-4 border-t-primary">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div class="flex flex-wrap items-center gap-sm mb-xs">
                        <span class="material-symbols-outlined text-[32px] text-primary">book</span>
                        <h1 class="font-display text-headline-lg text-on-surface font-bold">${project.title || 'Untitled Project'}</h1>
                        <span class="px-2.5 py-1 bg-surface-variant text-on-surface-variant rounded-md text-xs font-semibold">${project.category || 'Open Source'}</span>
                        <span class="px-2.5 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-md text-xs font-semibold">${project.difficulty || 'Beginner'}</span>
                        ${project.isPinned ? `<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase">Pinned</span>` : ''}
                    </div>
                    <p class="text-on-surface-variant max-w-2xl text-sm leading-relaxed">${project.description || 'No description provided for this project.'}</p>
                </div>
                <div class="flex gap-sm flex-wrap">
                    ${project.githubUrl ? `
                        <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="px-md py-sm bg-surface-container rounded-lg border border-white/10 hover:border-primary/50 transition-colors flex items-center gap-xs text-sm font-medium text-on-surface">
                            <span class="material-symbols-outlined text-[18px]">code</span> GitHub Repo
                        </a>
                    ` : ''}
                    <a href="#issues?projectId=${project.id}" class="px-md py-sm bg-primary text-on-primary rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-xs text-sm font-bold">
                        <span class="material-symbols-outlined text-[18px]">bug_report</span> View Issues (${issuesCount})
                    </a>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="flex gap-lg mt-lg border-b border-outline-variant text-sm">
                <button class="pb-xs text-primary border-b-2 border-primary font-bold transition-colors">Overview</button>
                <a href="#issues?projectId=${project.id}" class="pb-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">Issues <span class="bg-surface-variant px-1.5 py-0.5 rounded text-xs">${issuesCount}</span></a>
                <button onclick="window.location.hash='pull_requests'" class="pb-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">Pull Requests <span class="bg-surface-variant px-1.5 py-0.5 rounded text-xs">0</span></button>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-md">
                
                <!-- Project Owner Card -->
                <div class="glass-panel p-lg rounded-xl border border-secondary/20">
                    <h3 class="font-bold text-on-surface text-base mb-md flex items-center gap-xs border-b border-white/5 pb-sm">
                        <span class="material-symbols-outlined text-secondary text-[20px]">admin_panel_settings</span>
                        Project Owner
                    </h3>
                    <div class="flex items-center justify-between flex-wrap gap-3">
                        <div class="flex items-center gap-md">
                            <div class="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-lg shadow-md">
                                ${ownerInitial}
                            </div>
                            <div>
                                <h4 class="font-bold text-on-surface text-sm">${ownerName}</h4>
                            </div>
                        </div>
                        <span class="px-3 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-xs font-bold uppercase tracking-wider">
                            Owner
                        </span>
                    </div>
                </div>

                <!-- Team Members Card -->
                <div class="glass-panel p-lg rounded-xl border border-white/5">
                    <div class="flex justify-between items-center mb-md border-b border-white/5 pb-sm">
                        <h3 class="font-bold text-on-surface text-base flex items-center gap-xs">
                            <span class="material-symbols-outlined text-primary text-[20px]">group</span>
                            Project Members (${members.length})
                        </h3>
                    </div>
                    
                    ${members.length === 0 ? `
                        <div class="p-md bg-surface-container rounded-lg text-center text-xs text-on-surface-variant">
                            No additional team members currently assigned.
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${members.map(m => {
                                const mUser = m.user;
                                const mName = mUser?.name || `User #${m.userId}`;
                                const mInitial = mName.charAt(0).toUpperCase();
                                return `
                                    <div class="p-3 bg-surface-container/60 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <div class="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                ${mInitial}
                                            </div>
                                            <div class="min-w-0">
                                                <div class="font-bold text-on-surface text-xs truncate">${mName}</div>
                                                <div class="text-[10px] font-mono text-on-surface-variant">ID: ${m.userId}</div>
                                            </div>
                                        </div>
                                        <span class="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded text-[10px] font-bold uppercase flex-shrink-0">
                                            ${m.projectRole || 'Member'}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- README Section -->
                <div class="glass-panel p-lg rounded-xl">
                    <div class="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                        <h3 class="font-bold flex items-center gap-xs text-on-surface"><span class="material-symbols-outlined text-[18px]">menu_book</span> README.md</h3>
                    </div>
                    <div class="prose prose-invert max-w-none text-on-surface-variant text-sm space-y-3">
                        <h2 class="text-lg font-bold text-on-surface">${project.title}</h2>
                        <p class="leading-relaxed">${project.description || 'Welcome to this open source repository.'}</p>
                        
                        ${project.githubUrl ? `
                            <div class="mt-4">
                                <h4 class="font-bold text-on-surface text-xs uppercase tracking-wider mb-2">Clone Repository</h4>
                                <pre class="bg-surface-container-lowest p-md rounded-lg border border-white/5 text-xs font-mono overflow-x-auto"><code>git clone ${project.githubUrl}
cd ${project.title.toLowerCase().replace(/\\s+/g, '-')}</code></pre>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Sidebar -->
            <div class="space-y-md">
                <div class="glass-panel p-md rounded-xl">
                    <h3 class="font-bold text-on-surface mb-sm border-b border-outline-variant pb-xs text-sm">About</h3>
                    <p class="text-xs text-on-surface-variant mb-md leading-relaxed">${project.description || 'No description.'}</p>
                    <div class="space-y-2 text-xs text-on-surface-variant">
                        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">category</span> <span>${project.category}</span></div>
                        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">signal_cellular_alt</span> <span>${project.difficulty}</span></div>
                        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">scale</span> MIT License</div>
                        ${project.createdAt ? `<div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">calendar_today</span> Created ${new Date(project.createdAt).toLocaleDateString()}</div>` : ''}
                    </div>
                </div>
                
                ${techStack.length > 0 ? `
                <div class="glass-panel p-md rounded-xl">
                    <h3 class="font-bold text-on-surface mb-sm border-b border-outline-variant pb-xs text-sm">Tech Stack</h3>
                    <div class="flex flex-wrap gap-1.5">
                        ${techStack.map(t => `<span class="px-2 py-1 bg-surface-container border border-white/10 rounded-md text-xs font-medium text-on-surface">${t}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        `;
    } catch (err) {
        console.error('Error rendering project details:', err);
        container.innerHTML = `
            <div class="glass-panel p-xl rounded-xl text-center">
                <span class="material-symbols-outlined text-4xl text-error mb-2">warning</span>
                <h2 class="text-xl font-bold text-on-surface mb-2">Error Loading Project</h2>
                <p class="text-on-surface-variant text-sm mb-4">${err.message || 'An unexpected error occurred.'}</p>
                <a href="#explore" class="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm">Back to Explore</a>
            </div>
        `;
    }
}

