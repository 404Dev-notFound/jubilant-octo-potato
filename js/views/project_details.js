export function render_project_details() {
    return `
<main id="project-details-container" class="relative w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen pt-4 space-y-6">
    <!-- Header Skeleton -->
    <div class="glass-panel p-6 sm:p-8 rounded-2xl border-t-4 border-t-primary/40 space-y-4 animate-pulse">
        <div class="flex flex-col md:flex-row justify-between items-start gap-4">
            <div class="space-y-2.5 w-full max-w-xl">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-surface-variant"></div>
                    <div class="w-48 h-8 rounded-lg bg-surface-variant"></div>
                    <div class="w-20 h-6 rounded-md bg-surface-variant"></div>
                </div>
                <div class="w-full h-4 rounded bg-surface-variant"></div>
                <div class="w-3/4 h-4 rounded bg-surface-variant"></div>
            </div>
            <div class="flex gap-2 flex-wrap">
                <div class="w-28 h-10 rounded-xl bg-surface-variant"></div>
                <div class="w-28 h-10 rounded-xl bg-surface-variant"></div>
            </div>
        </div>
        <div class="flex gap-4 pt-4 border-t border-white/5">
            <div class="w-20 h-6 rounded bg-surface-variant"></div>
            <div class="w-20 h-6 rounded bg-surface-variant"></div>
            <div class="w-24 h-6 rounded bg-surface-variant"></div>
        </div>
    </div>

    <!-- Body Skeleton -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <div class="glass-panel p-6 rounded-2xl space-y-4 animate-pulse">
                <div class="w-32 h-5 rounded bg-surface-variant"></div>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-surface-variant"></div>
                    <div class="space-y-2">
                        <div class="w-36 h-4 rounded bg-surface-variant"></div>
                        <div class="w-24 h-3 rounded bg-surface-variant"></div>
                    </div>
                </div>
            </div>
            <div class="glass-panel p-6 rounded-2xl space-y-4 animate-pulse">
                <div class="w-40 h-5 rounded bg-surface-variant"></div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="h-16 rounded-xl bg-surface-variant"></div>
                    <div class="h-16 rounded-xl bg-surface-variant"></div>
                </div>
            </div>
        </div>
        <div class="space-y-6">
            <div class="glass-panel p-6 rounded-2xl space-y-3 animate-pulse">
                <div class="w-24 h-4 rounded bg-surface-variant"></div>
                <div class="w-full h-16 rounded bg-surface-variant"></div>
            </div>
        </div>
    </div>
</main>
`;
}

export async function initProjectDetails(projectId) {
    const container = document.getElementById('project-details-container');
    if (!container) return;

    // Parse target project ID from argument or hash query params
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const targetId = projectId || hashParams.get('projectId') || hashParams.get('id');

    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    try {
        let project = null;

        if (targetId) {
            try {
                const res = await (window.apiFetch ? window.apiFetch(`/api/projects/${targetId}`) : fetch(`/api/projects/${targetId}`));
                if (res.ok) {
                    project = await res.json();
                }
            } catch (err) {
                console.warn(`Could not load project by ID (${targetId}):`, err.message);
            }
        }

        // If no ID specified or not found, safely fallback to first available project
        if (!project) {
            try {
                const resAll = await (window.apiFetch ? window.apiFetch('/api/projects') : fetch('/api/projects'));
                if (resAll.ok) {
                    const projects = await resAll.json();
                    if (Array.isArray(projects) && projects.length > 0) {
                        project = (targetId ? projects.find(p => String(p.id) === String(targetId)) : null) || projects[0];
                    }
                }
            } catch (err) {
                console.warn('Could not load project catalog:', err.message);
            }
        }

        if (!project) {
            container.innerHTML = `
                <div class="glass-panel p-8 sm:p-12 rounded-2xl text-center max-w-lg mx-auto mt-12 border border-white/10 space-y-4">
                    <span class="material-symbols-outlined text-5xl text-error">folder_off</span>
                    <h2 class="text-2xl font-bold text-on-surface">Project Not Found</h2>
                    <p class="text-on-surface-variant text-sm leading-relaxed">The project you are looking for does not exist or has been relocated.</p>
                    <div class="pt-2">
                        <a href="#explore" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all">
                            <span class="material-symbols-outlined text-[18px]">explore</span> Explore Other Projects
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        // Keep active project details accessible for modal actions
        window.currentActiveProjectId = project.id;
        window.currentActiveProjectTitle = project.title || 'Untitled Project';

        // Fetch join request & meeting states for current logged in user
        let myJoinRequest = null;
        let myMeetings = [];
        if (currentUser) {
            try {
                const [jrRes, meetRes] = await Promise.all([
                    window.apiFetch ? window.apiFetch(`/api/projects/${project.id}/join-requests/my`).catch(() => null) : null,
                    window.apiFetch ? window.apiFetch(`/api/projects/${project.id}/meetings/my`).catch(() => null) : null
                ]);
                if (jrRes && jrRes.ok) myJoinRequest = await jrRes.json();
                if (meetRes && meetRes.ok) myMeetings = await meetRes.json();
            } catch (fetchErr) {
                console.warn('Notice: Non-critical meeting/join-request sync error:', fetchErr.message);
            }
        }

        // Owner Info (Initials badge, Zero email exposure)
        const owner = project.owner;
        const ownerName = owner?.name || (project.ownerId ? `Developer #${project.ownerId}` : 'Project Owner');
        const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'O';

        // Members & Roles
        const members = Array.isArray(project.members) ? project.members : [];
        const isOwner = currentUser && project.ownerId && String(project.ownerId) === String(currentUser.id);
        const isMember = currentUser && members.some(m => String(m.userId) === String(currentUser.id));

        // Tech stack & issues count
        const techStack = Array.isArray(project.techStack) ? project.techStack : (typeof project.techStack === 'string' ? project.techStack.split(',').map(s => s.trim()) : []);
        const issuesCount = Array.isArray(project.issues) ? project.issues.length : 0;

        // Join Action Button State
        let joinBtnHtml = '';
        if (!currentUser) {
            joinBtnHtml = `
                <button onclick="window.UI.showToast('Please log in to collaborate on this project', 'info')" class="px-4 py-2.5 bg-primary text-on-primary rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold">
                    <span class="material-symbols-outlined text-[16px]">person_add</span> Join Project
                </button>
            `;
        } else if (isOwner) {
            joinBtnHtml = `
                <div class="px-3.5 py-2 bg-secondary/15 text-secondary border border-secondary/30 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                    <span class="material-symbols-outlined text-[16px]">verified_user</span> Project Owner
                </div>
            `;
        } else if (isMember) {
            joinBtnHtml = `
                <div class="px-3.5 py-2 bg-tertiary/15 text-tertiary border border-tertiary/30 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                    <span class="material-symbols-outlined text-[16px]">check_circle</span> Joined Member
                </div>
            `;
        } else if (myJoinRequest && myJoinRequest.status === 'PENDING') {
            joinBtnHtml = `
                <div class="px-3.5 py-2 bg-surface-variant text-on-surface-variant border border-white/10 rounded-xl flex items-center gap-1.5 text-xs font-medium">
                    <span class="material-symbols-outlined text-[16px] text-tertiary animate-spin">progress_activity</span> Request Pending
                </div>
            `;
        } else if (myJoinRequest && myJoinRequest.status === 'ACCEPTED') {
            joinBtnHtml = `
                <div class="px-3.5 py-2 bg-tertiary/15 text-tertiary border border-tertiary/30 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                    <span class="material-symbols-outlined text-[16px]">check_circle</span> Accepted Member
                </div>
            `;
        } else {
            joinBtnHtml = `
                <button id="btn-action-join-project" class="px-4 py-2.5 bg-primary text-on-primary rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold">
                    <span class="material-symbols-outlined text-[16px]">person_add</span> Join Project
                </button>
            `;
        }

        const scheduleMeetingBtnHtml = `
            <button id="btn-action-schedule-meeting" class="px-4 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface border border-white/10 hover:border-secondary/40 transition-all rounded-xl flex items-center gap-1.5 text-xs font-medium">
                <span class="material-symbols-outlined text-[16px] text-secondary">calendar_month</span> Schedule Meeting
            </button>
        `;

        container.innerHTML = `
        <!-- Main Project Header -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border-t-4 border-t-primary shadow-xl">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                <div class="space-y-2">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="material-symbols-outlined text-[28px] text-primary">terminal</span>
                        <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-on-surface">${escapeHtml(project.title || 'Untitled Project')}</h1>
                        <span class="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-wider">${escapeHtml(project.category || 'Open Source')}</span>
                        <span class="px-2.5 py-1 bg-secondary/15 text-secondary border border-secondary/25 rounded-lg text-xs font-semibold uppercase">${escapeHtml(project.difficulty || 'Intermediate')}</span>
                        ${project.isPinned ? `<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase tracking-wider">Pinned</span>` : ''}
                    </div>
                    <p class="text-on-surface-variant max-w-3xl text-sm leading-relaxed">${escapeHtml(project.description || 'Collaborative open source project on CodeCollab.')}</p>
                </div>
                <div class="flex gap-2 flex-wrap items-center">
                    ${project.githubUrl ? `
                        <a href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 bg-surface-container rounded-xl border border-white/10 hover:border-primary/50 transition-colors flex items-center gap-1.5 text-xs font-medium text-on-surface">
                            <span class="material-symbols-outlined text-[16px]">code</span> GitHub Repo
                        </a>
                    ` : ''}
                    ${joinBtnHtml}
                    ${scheduleMeetingBtnHtml}
                    <a href="#issues?projectId=${project.id}" class="px-4 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface border border-white/10 hover:border-primary/50 transition-colors flex items-center gap-1.5 text-xs font-medium rounded-xl">
                        <span class="material-symbols-outlined text-[16px] text-primary">view_kanban</span> Issues (${issuesCount})
                    </a>
                </div>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="flex gap-6 mt-6 border-t border-white/5 pt-4 text-xs font-bold uppercase tracking-wider">
                <button class="pb-1 text-primary border-b-2 border-primary font-bold">Overview</button>
                <a href="#issues?projectId=${project.id}" class="pb-1 text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">
                    Issues <span class="bg-surface-container px-1.5 py-0.5 rounded text-[10px]">${issuesCount}</span>
                </a>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Owner, Members, README -->
            <div class="lg:col-span-2 space-y-6">
                
                <!-- Project Owner Card -->
                <div class="glass-panel p-6 rounded-2xl border border-secondary/20 bg-secondary/5">
                    <h3 class="font-bold text-on-surface text-sm mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                        <span class="material-symbols-outlined text-secondary text-[18px]">admin_panel_settings</span>
                        Project Lead & Maintainer
                    </h3>
                    <div class="flex items-center justify-between flex-wrap gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center font-bold text-base border border-secondary/30 shadow-md flex-shrink-0">
                                ${ownerInitial}
                            </div>
                            <div>
                                <h4 class="font-bold text-on-surface text-sm">${escapeHtml(ownerName)}</h4>
                                <div class="text-xs text-on-surface-variant">Project Creator & Administrator</div>
                            </div>
                        </div>
                        <span class="px-3 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Owner
                        </span>
                    </div>
                </div>

                <!-- Team Members Card -->
                <div class="glass-panel p-6 rounded-2xl border border-white/5">
                    <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                        <h3 class="font-bold text-on-surface text-sm flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[18px]">group</span>
                            Project Collaborators (${members.length})
                        </h3>
                    </div>
                    
                    ${members.length === 0 ? `
                        <div class="p-6 bg-surface-container/40 rounded-xl text-center text-xs text-on-surface-variant">
                            No additional team members currently assigned. Submit a join request to collaborate!
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${members.map(m => {
                                const mUser = m.user;
                                const mName = mUser?.name || (m.userId ? `Collaborator #${m.userId}` : 'Contributor');
                                const mInitial = mName.charAt(0).toUpperCase();
                                return `
                                    <div class="p-3 bg-surface-container/60 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <div class="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 border border-primary/20">
                                                ${mInitial}
                                            </div>
                                            <div class="min-w-0">
                                                <div class="font-bold text-on-surface text-xs truncate">${escapeHtml(mName)}</div>
                                                <div class="text-[10px] text-on-surface-variant flex items-center gap-1">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active Collaborator
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
                <div class="glass-panel p-6 rounded-2xl border border-secondary/20 bg-secondary/5">
                    <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                        <h3 class="font-bold text-on-surface text-sm flex items-center gap-2">
                            <span class="material-symbols-outlined text-secondary text-[18px]">event_available</span>
                            Your Scheduled Meetings (${myMeetings.length})
                        </h3>
                    </div>
                    <div class="space-y-3">
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
                                <div class="p-3.5 bg-surface-container rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div class="space-y-1">
                                        <div class="font-bold text-on-surface flex items-center gap-2">
                                            <span>${escapeHtml(m.message || 'Developer Sync')}</span>
                                            ${statusBadge}
                                        </div>
                                        <div class="text-on-surface-variant flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[14px]">schedule</span> ${formattedDate}
                                        </div>
                                        ${m.responseNotes ? `<div class="text-tertiary bg-tertiary/10 p-2 rounded mt-1"><strong>Owner note:</strong> ${escapeHtml(m.responseNotes)}</div>` : ''}
                                        ${m.meetingLink ? `<div class="mt-1"><a href="${escapeHtml(m.meetingLink)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">link</span> Join Meeting</a></div>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- README Section -->
                <div class="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
                    <div class="flex justify-between items-center border-b border-white/5 pb-3">
                        <h3 class="font-bold flex items-center gap-2 text-on-surface text-sm">
                            <span class="material-symbols-outlined text-[18px] text-primary">menu_book</span> README.md
                        </h3>
                    </div>
                    <div class="prose prose-invert max-w-none text-on-surface-variant text-sm space-y-3">
                        <h2 class="text-lg font-bold text-on-surface">${escapeHtml(project.title)}</h2>
                        <p class="leading-relaxed">${escapeHtml(project.description || 'Welcome to this open source repository.')}</p>
                        
                        ${project.githubUrl ? `
                            <div class="mt-4 pt-4 border-t border-white/5">
                                <h4 class="font-bold text-on-surface text-xs uppercase tracking-wider mb-2">Clone Repository</h4>
                                <pre class="bg-surface-container-lowest p-4 rounded-xl border border-white/5 text-xs font-mono overflow-x-auto text-primary"><code>git clone ${escapeHtml(project.githubUrl)}
cd ${escapeHtml((project.title || 'project').toLowerCase().replace(/\\s+/g, '-'))}</code></pre>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Right Column: Sidebar Meta -->
            <div class="space-y-6">
                <div class="glass-panel p-6 rounded-2xl space-y-4">
                    <h3 class="font-bold text-on-surface text-sm border-b border-white/5 pb-2">Project Metadata</h3>
                    <div class="space-y-2.5 text-xs text-on-surface-variant">
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">category</span> Category</span>
                            <span class="font-bold text-on-surface">${escapeHtml(project.category || 'General')}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">signal_cellular_alt</span> Difficulty</span>
                            <span class="font-bold text-on-surface">${escapeHtml(project.difficulty || 'Intermediate')}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">scale</span> License</span>
                            <span class="font-bold text-on-surface">MIT License</span>
                        </div>
                        ${project.createdAt ? `
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">calendar_today</span> Created</span>
                            <span class="font-bold text-on-surface">${new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                ${techStack.length > 0 ? `
                <div class="glass-panel p-6 rounded-2xl space-y-3">
                    <h3 class="font-bold text-on-surface text-sm border-b border-white/5 pb-2">Technologies</h3>
                    <div class="flex flex-wrap gap-1.5">
                        ${techStack.map(t => `<span class="px-2.5 py-1 bg-surface-container border border-white/10 rounded-lg text-xs font-medium text-on-surface">${escapeHtml(t)}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        `;

        // Bind interactive buttons
        const joinBtn = document.getElementById('btn-action-join-project');
        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                if (!currentUser) {
                    window.UI.showToast('Please log in to join this project', 'info');
                    return;
                }
                joinBtn.disabled = true;
                joinBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Sending...';

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
                        joinBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">person_add</span> Join Project';
                    }
                } catch (err) {
                    console.error('Error submitting join request:', err);
                    window.UI.showToast(err.message || 'Error connecting to backend server', 'error');
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">person_add</span> Join Project';
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
            <div class="glass-panel p-8 sm:p-12 rounded-2xl text-center max-w-lg mx-auto mt-12 border border-white/10 space-y-4">
                <span class="material-symbols-outlined text-5xl text-error">warning</span>
                <h2 class="text-2xl font-bold text-on-surface">Error Loading Project</h2>
                <p class="text-on-surface-variant text-sm leading-relaxed">${err.message || 'An unexpected error occurred while loading this project.'}</p>
                <div class="pt-2">
                    <a href="#explore" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md">
                        Back to Explore
                    </a>
                </div>
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
