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

    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

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
                project = (projectId ? projects.find(p => p.id === projectId) : null) || projects[0];
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

        // Store active project info globally for modal forms
        window.currentActiveProjectId = project.id;
        window.currentActiveProjectTitle = project.title;

        // Fetch current user's join request & meetings for this project if logged in
        let myJoinRequest = null;
        let myMeetings = [];
        if (currentUser) {
            try {
                const [jrRes, meetRes] = await Promise.all([
                    window.apiFetch(`/api/projects/${project.id}/join-requests/my`).catch(() => null),
                    window.apiFetch(`/api/projects/${project.id}/meetings/my`).catch(() => null)
                ]);
                if (jrRes && jrRes.ok) myJoinRequest = await jrRes.json();
                if (meetRes && meetRes.ok) myMeetings = await meetRes.json();
            } catch (fetchErr) {
                console.warn('Could not fetch join request or meeting details:', fetchErr);
            }
        }

        // Extract Owner Info (Zero raw ID, Zero email)
        const owner = project.owner;
        const ownerName = owner?.name || 'Project Owner';
        const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'O';

        // Extract Members Info
        const members = project.members || [];
        const isOwner = currentUser && project.ownerId && String(project.ownerId) === String(currentUser.id);
        const isMember = currentUser && members.some(m => String(m.userId) === String(currentUser.id));

        // Tech stack
        const techStack = Array.isArray(project.techStack) ? project.techStack : [];

        // Issues count
        const issuesCount = (project.issues && project.issues.length) || 0;

        // Render Action Buttons (Join Project & Schedule Meeting)
        let joinBtnHtml = '';
        if (!currentUser) {
            joinBtnHtml = `
                <button onclick="window.UI.showToast('Please log in to join this project', 'info')" class="px-md py-sm bg-primary text-on-primary rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-xs text-sm font-bold">
                    <span class="material-symbols-outlined text-[18px]">person_add</span> Join Project
                </button>
            `;
        } else if (isOwner) {
            joinBtnHtml = `
                <div class="px-md py-sm bg-secondary/15 text-secondary border border-secondary/30 rounded-lg flex items-center gap-xs text-sm font-bold">
                    <span class="material-symbols-outlined text-[18px]">verified_user</span> Project Owner
                </div>
            `;
        } else if (isMember) {
            joinBtnHtml = `
                <div class="px-md py-sm bg-tertiary/15 text-tertiary border border-tertiary/30 rounded-lg flex items-center gap-xs text-sm font-bold">
                    <span class="material-symbols-outlined text-[18px]">check_circle</span> Joined Project
                </div>
            `;
        } else if (myJoinRequest && myJoinRequest.status === 'PENDING') {
            joinBtnHtml = `
                <div class="px-md py-sm bg-surface-variant text-on-surface-variant border border-white/10 rounded-lg flex items-center gap-xs text-sm font-medium">
                    <span class="material-symbols-outlined text-[18px] text-tertiary animate-spin">progress_activity</span> Request Pending
                </div>
            `;
        } else if (myJoinRequest && myJoinRequest.status === 'ACCEPTED') {
            joinBtnHtml = `
                <div class="px-md py-sm bg-tertiary/15 text-tertiary border border-tertiary/30 rounded-lg flex items-center gap-xs text-sm font-bold">
                    <span class="material-symbols-outlined text-[18px]">check_circle</span> Accepted Member
                </div>
            `;
        } else {
            joinBtnHtml = `
                <button id="btn-action-join-project" class="px-md py-sm bg-primary text-on-primary rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-xs text-sm font-bold">
                    <span class="material-symbols-outlined text-[18px]">person_add</span> Join Project
                </button>
            `;
        }

        const scheduleMeetingBtnHtml = `
            <button id="btn-action-schedule-meeting" class="px-md py-sm bg-surface-container hover:bg-surface-variant text-on-surface border border-white/10 hover:border-secondary/50 transition-all rounded-lg flex items-center gap-xs text-sm font-medium">
                <span class="material-symbols-outlined text-[18px] text-secondary">calendar_month</span> Schedule Meeting
            </button>
        `;

        container.innerHTML = `
        <!-- Header -->
        <div class="glass-panel p-lg rounded-xl mb-lg border-t-4 border-t-primary">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div class="flex flex-wrap items-center gap-sm mb-xs">
                        <span class="material-symbols-outlined text-[32px] text-primary">book</span>
                        <h1 class="font-display text-headline-lg text-on-surface font-bold">${escapeHtml(project.title || 'Untitled Project')}</h1>
                        <span class="px-2.5 py-1 bg-surface-variant text-on-surface-variant rounded-md text-xs font-semibold">${escapeHtml(project.category || 'Open Source')}</span>
                        <span class="px-2.5 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-md text-xs font-semibold">${escapeHtml(project.difficulty || 'Beginner')}</span>
                        ${project.isPinned ? `<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase">Pinned</span>` : ''}
                    </div>
                    <p class="text-on-surface-variant max-w-2xl text-sm leading-relaxed">${escapeHtml(project.description || 'No description provided for this project.')}</p>
                </div>
                <div class="flex gap-sm flex-wrap items-center">
                    ${project.githubUrl ? `
                        <a href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="px-md py-sm bg-surface-container rounded-lg border border-white/10 hover:border-primary/50 transition-colors flex items-center gap-xs text-sm font-medium text-on-surface">
                            <span class="material-symbols-outlined text-[18px]">code</span> GitHub Repo
                        </a>
                    ` : ''}
                    ${joinBtnHtml}
                    ${scheduleMeetingBtnHtml}
                    <a href="#issues?projectId=${project.id}" class="px-md py-sm bg-surface-container hover:bg-surface-variant text-on-surface border border-white/10 hover:border-primary/50 transition-colors flex items-center gap-xs text-sm font-medium">
                        <span class="material-symbols-outlined text-[18px] text-primary">bug_report</span> Issues (${issuesCount})
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
                            <div class="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center font-bold text-lg shadow-md overflow-hidden border border-secondary/30">
                                ${owner?.avatarUrl ? `<img src="${owner.avatarUrl}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><span style="display:none;" class="w-full h-full flex items-center justify-center font-bold text-lg text-secondary">${ownerInitial}</span>` : ownerInitial}
                            </div>
                            <div>
                                <h4 class="font-bold text-on-surface text-sm">${escapeHtml(ownerName)}</h4>
                                <div class="text-xs text-on-surface-variant mt-0.5">Project Administrator</div>
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
                                const mName = mUser?.name || 'Contributor';
                                const mInitial = mName.charAt(0).toUpperCase();
                                return `
                                    <div class="p-3 bg-surface-container/60 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <div class="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden border border-white/5">
                                                ${mUser?.avatarUrl ? `<img src="${mUser.avatarUrl}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><span style="display:none;" class="w-full h-full flex items-center justify-center font-bold text-xs text-primary">${mInitial}</span>` : mInitial}
                                            </div>
                                            <div class="min-w-0">
                                                <div class="font-bold text-on-surface text-xs truncate">${escapeHtml(mName)}</div>
                                                <div class="text-[10px] text-on-surface-variant flex items-center gap-1">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active Contributor
                                                </div>
                                            </div>
                                        </div>
                                        <span class="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded text-[10px] font-bold uppercase flex-shrink-0">
                                            ${escapeHtml(m.projectRole || 'Member')}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                ${myMeetings.length > 0 ? `
                <!-- Scheduled Meetings for this Project -->
                <div class="glass-panel p-lg rounded-xl border border-secondary/20 bg-secondary/5">
                    <div class="flex justify-between items-center mb-md border-b border-white/5 pb-sm">
                        <h3 class="font-bold text-on-surface text-base flex items-center gap-xs">
                            <span class="material-symbols-outlined text-secondary text-[20px]">event_available</span>
                            Your Meetings for this Project (${myMeetings.length})
                        </h3>
                    </div>
                    <div class="space-y-sm">
                        ${myMeetings.map(m => {
                            let statusBadge = '';
                            if (m.status === 'ACCEPTED') {
                                statusBadge = '<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase">Accepted</span>';
                            } else if (m.status === 'REJECTED') {
                                statusBadge = '<span class="px-2 py-0.5 bg-error/20 text-error border border-error/30 rounded text-[10px] font-bold uppercase">Declined</span>';
                            } else {
                                statusBadge = '<span class="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded text-[10px] font-bold uppercase">Pending</span>';
                            }

                            const formattedDate = m.preferredDate ? new Date(m.preferredDate).toLocaleString() : 'Date TBD';

                            return `
                                <div class="p-3 bg-surface-container rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div class="space-y-1">
                                        <div class="font-bold text-on-surface flex items-center gap-2">
                                            <span>${escapeHtml(m.message || 'Discussion Sync')}</span>
                                            ${statusBadge}
                                        </div>
                                        <div class="text-on-surface-variant flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[14px]">schedule</span> ${formattedDate}
                                        </div>
                                        ${m.responseNotes ? `<div class="text-tertiary bg-tertiary/10 p-2 rounded mt-1"><strong>Owner note:</strong> ${escapeHtml(m.responseNotes)}</div>` : ''}
                                        ${m.meetingLink ? `<div class="mt-1"><a href="${escapeHtml(m.meetingLink)}" target="_blank" class="text-primary hover:underline font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">link</span> Join Meeting</a></div>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- README Section -->
                <div class="glass-panel p-lg rounded-xl">
                    <div class="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                        <h3 class="font-bold flex items-center gap-xs text-on-surface"><span class="material-symbols-outlined text-[18px]">menu_book</span> README.md</h3>
                    </div>
                    <div class="prose prose-invert max-w-none text-on-surface-variant text-sm space-y-3">
                        <h2 class="text-lg font-bold text-on-surface">${escapeHtml(project.title)}</h2>
                        <p class="leading-relaxed">${escapeHtml(project.description || 'Welcome to this open source repository.')}</p>
                        
                        ${project.githubUrl ? `
                            <div class="mt-4">
                                <h4 class="font-bold text-on-surface text-xs uppercase tracking-wider mb-2">Clone Repository</h4>
                                <pre class="bg-surface-container-lowest p-md rounded-lg border border-white/5 text-xs font-mono overflow-x-auto"><code>git clone ${escapeHtml(project.githubUrl)}
cd ${escapeHtml(project.title.toLowerCase().replace(/\\s+/g, '-'))}</code></pre>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Sidebar -->
            <div class="space-y-md">
                <div class="glass-panel p-md rounded-xl">
                    <h3 class="font-bold text-on-surface mb-sm border-b border-outline-variant pb-xs text-sm">About</h3>
                    <p class="text-xs text-on-surface-variant mb-md leading-relaxed">${escapeHtml(project.description || 'No description.')}</p>
                    <div class="space-y-2 text-xs text-on-surface-variant">
                        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">category</span> <span>${escapeHtml(project.category)}</span></div>
                        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">signal_cellular_alt</span> <span>${escapeHtml(project.difficulty)}</span></div>
                        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">scale</span> MIT License</div>
                        ${project.createdAt ? `<div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">calendar_today</span> Created ${new Date(project.createdAt).toLocaleDateString()}</div>` : ''}
                    </div>
                </div>
                
                ${techStack.length > 0 ? `
                <div class="glass-panel p-md rounded-xl">
                    <h3 class="font-bold text-on-surface mb-sm border-b border-outline-variant pb-xs text-sm">Tech Stack</h3>
                    <div class="flex flex-wrap gap-1.5">
                        ${techStack.map(t => `<span class="px-2 py-1 bg-surface-container border border-white/10 rounded-md text-xs font-medium text-on-surface">${escapeHtml(t)}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        `;

        // Attach event listeners for Join Project and Schedule Meeting
        const joinBtn = document.getElementById('btn-action-join-project');
        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                if (!currentUser) {
                    window.UI.showToast('Please log in to join this project', 'info');
                    return;
                }
                joinBtn.disabled = true;
                joinBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Sending Request...';

                try {
                    const res = await window.apiFetch(`/api/projects/${project.id}/join-requests`, {
                        method: 'POST',
                        body: JSON.stringify({ message: `I would like to collaborate on ${project.title}` })
                    });
                    const resData = await res.json();
                    if (res.ok) {
                        window.UI.showToast('Join request sent to project owner!', 'success');
                        initProjectDetails(project.id);
                    } else {
                        window.UI.showToast(resData.error || 'Failed to submit join request', 'error');
                        joinBtn.disabled = false;
                        joinBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">person_add</span> Join Project';
                    }
                } catch (err) {
                    console.error('Error submitting join request:', err);
                    window.UI.showToast(err.message || 'Error connecting to backend server', 'error');
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">person_add</span> Join Project';
                }
            });
        }

        const meetingBtn = document.getElementById('btn-action-schedule-meeting');
        if (meetingBtn) {
            meetingBtn.addEventListener('click', async () => {
                if (!currentUser) {
                    window.UI.showToast('Please log in to schedule a meeting', 'info');
                    return;
                }
                try {
                    const module = await import('../forms/schedule_meeting_form.js');
                    if (module.render_schedule_meeting_form) {
                        const modalHtml = module.render_schedule_meeting_form(project.id, project.title);
                        window.UI.openModal(modalHtml);
                    }
                } catch (err) {
                    console.error('Failed to load schedule meeting modal:', err);
                    window.UI.showToast('Failed to open meeting form', 'error');
                }
            });
        }

        window.refreshProjectDetailsMeetings = () => {
            initProjectDetails(project.id);
        };

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

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


