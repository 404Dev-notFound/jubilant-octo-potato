const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_dashboard() {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const userName = currentUser ? (currentUser.name || 'Developer') : 'Developer';

    return `<main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col pt-4">
    <!-- Header Section -->
    <div class="flex items-center justify-between mb-lg">
        <div>
            <h1 id="dashboard-welcome-heading" class="font-display text-headline-lg text-primary mb-xs">Welcome back, ${userName}!</h1>
            <p class="text-on-surface-variant font-label-sm tracking-widest uppercase">Overview & Statistics</p>
        </div>
    </div>

    <!-- Stats Grid (4 Cards) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        <!-- 1. Active Projects -->
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-primary hover:-translate-y-1 transition-transform">
            <div class="text-on-surface-variant font-label-sm mb-xs">ACTIVE PROJECTS</div>
            <div id="stat-active-projects" class="text-headline-lg font-bold text-on-surface">0</div>
            <div id="stat-projects-subtext" class="text-tertiary text-sm flex items-center mt-xs">
                <span class="material-symbols-outlined text-[16px] mr-1">folder_open</span> User workspaces
            </div>
        </div>

        <!-- 2. Active Issues -->
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-secondary hover:-translate-y-1 transition-transform">
            <div class="text-on-surface-variant font-label-sm mb-xs">ACTIVE ISSUES</div>
            <div id="stat-active-issues" class="text-headline-lg font-bold text-on-surface">0</div>
            <div id="stat-issues-subtext" class="text-on-surface-variant text-sm flex items-center mt-xs">
                Across 0 projects
            </div>
        </div>

        <!-- 3. Resolved Issues (Replaces Current Streak) -->
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-tertiary hover:-translate-y-1 transition-transform">
            <div class="text-on-surface-variant font-label-sm mb-xs">RESOLVED ISSUES</div>
            <div id="stat-resolved-issues" class="text-headline-lg font-bold text-on-surface">0</div>
            <div id="stat-resolved-subtext" class="text-tertiary text-sm flex items-center mt-xs">
                <span class="material-symbols-outlined text-[16px] mr-1">task_alt</span> Completed tasks
            </div>
        </div>

        <!-- 4. Global Rank (Percentile Only) -->
        <div class="glass-panel p-md rounded-xl border-t-2 border-t-error hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div class="absolute -right-4 -top-4 text-[100px] opacity-5">
                <span class="material-symbols-outlined">emoji_events</span>
            </div>
            <div class="text-on-surface-variant font-label-sm mb-xs">GLOBAL RANK</div>
            <div id="stat-global-rank" class="text-headline-lg font-bold text-on-surface">Top 50%</div>
            <div id="stat-rank-subtext" class="text-on-surface-variant text-sm flex items-center mt-xs">
                Based on activity & contributions
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-lg">
        <!-- Main Content Column -->
        <div class="xl:col-span-2 space-y-lg">
            <!-- Dynamic Knowledge Graph -->
            <div class="glass-panel p-lg rounded-xl">
                <div class="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                    <h3 class="font-bold flex items-center gap-xs">
                        <span class="material-symbols-outlined text-primary">hub</span> Knowledge Graph
                    </h3>
                    <span id="knowledge-graph-count" class="text-xs bg-surface-variant px-2.5 py-1 rounded text-on-surface-variant font-mono font-medium">0 Projects</span>
                </div>
                <div id="knowledge-graph-container" class="w-full h-[280px] bg-surface-container-lowest rounded-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <div class="absolute w-full h-full opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
                    <svg id="knowledge-graph-svg" class="absolute inset-0 w-full h-full pointer-events-none"></svg>
                    <div id="knowledge-graph-nodes" class="absolute inset-0 w-full h-full"></div>
                    <div id="knowledge-graph-empty" class="text-center p-md z-10 hidden">
                        <span class="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-xs block">account_tree</span>
                        <p class="text-sm text-on-surface-variant">No projects in your graph yet.</p>
                        <p class="text-xs text-on-surface-variant/70 mt-1">Create or join projects to visualize your connected workspace.</p>
                    </div>
                </div>
            </div>

            <!-- AI Suggestions -->
            <div class="glass-panel p-lg rounded-xl border border-tertiary/30 bg-gradient-to-br from-tertiary/5 to-transparent">
                <div class="flex items-center gap-sm mb-md">
                    <span class="material-symbols-outlined text-tertiary">psychology</span>
                    <h3 class="font-bold">AI Recommendations for You</h3>
                </div>
                <div id="dashboard-ai-recommendations" class="space-y-sm">
                    <div class="flex items-start gap-md p-md bg-surface-container rounded-lg border border-white/5">
                        <div class="p-xs bg-primary/20 text-primary rounded-lg">
                            <span class="material-symbols-outlined">auto_awesome</span>
                        </div>
                        <div class="flex-1">
                            <h4 id="ai-rec-title" class="font-bold text-sm">Explore Community Projects</h4>
                            <p id="ai-rec-desc" class="text-xs text-on-surface-variant mt-1">Discover new open-source repositories and tackle issues matching your tech stack.</p>
                        </div>
                        <button id="ai-rec-btn" onclick="window.location.hash='explore'" class="px-sm py-1 bg-surface-variant hover:bg-outline-variant text-xs rounded transition-colors">Explore</button>
                    </div>
                </div>
            </div>

            <!-- Requests & Notifications Hub -->
            <div class="glass-panel p-lg rounded-xl border border-white/5">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-md border-b border-outline-variant pb-sm">
                    <div class="flex items-center gap-xs">
                        <span class="material-symbols-outlined text-primary text-[22px]">notifications_active</span>
                        <h3 class="font-bold text-on-surface text-base">Requests & Notifications</h3>
                    </div>
                    <!-- Main Hub Tabs -->
                    <div class="flex gap-1 bg-surface-container p-1 rounded-lg text-xs" id="hub-tab-buttons">
                        <button id="tab-btn-join-requests" class="px-3 py-1.5 rounded-md font-bold transition-colors bg-primary text-on-primary flex items-center gap-1">
                            <span>Join Requests</span>
                            <span id="badge-join-requests-count" class="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] hidden">0</span>
                        </button>
                        <button id="tab-btn-meeting-requests" class="px-3 py-1.5 rounded-md font-medium text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">
                            <span>Meetings</span>
                            <span id="badge-meetings-count" class="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] hidden">0</span>
                        </button>
                        <button id="tab-btn-notifications" class="px-3 py-1.5 rounded-md font-medium text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">
                            <span>Notifications</span>
                            <span id="badge-notifications-count" class="px-1.5 py-0.2 bg-error text-white rounded-full text-[10px] hidden">0</span>
                        </button>
                    </div>
                </div>

                <!-- 1. Join Requests Tab Content -->
                <div id="hub-content-join-requests" class="space-y-md">
                    <div class="flex gap-2 text-xs border-b border-white/5 pb-2">
                        <button id="subtab-join-received" class="px-2.5 py-1 rounded bg-surface-variant text-on-surface font-bold">Received (Owner)</button>
                        <button id="subtab-join-sent" class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface">Sent by You</button>
                    </div>
                    <div id="join-requests-list" class="space-y-sm min-h-[100px]">
                        <div class="p-6 text-center text-xs text-on-surface-variant">
                            <span class="material-symbols-outlined text-[28px] opacity-40 mb-1 block">inbox</span>
                            No join requests at this time.
                        </div>
                    </div>
                </div>

                <!-- 2. Meeting Requests Tab Content -->
                <div id="hub-content-meeting-requests" class="space-y-md hidden">
                    <div class="flex gap-2 text-xs border-b border-white/5 pb-2">
                        <button id="subtab-meet-received" class="px-2.5 py-1 rounded bg-surface-variant text-on-surface font-bold">Received (Owner)</button>
                        <button id="subtab-meet-sent" class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface">Sent by You</button>
                    </div>
                    <div id="meeting-requests-list" class="space-y-sm min-h-[100px]">
                        <div class="p-6 text-center text-xs text-on-surface-variant">
                            <span class="material-symbols-outlined text-[28px] opacity-40 mb-1 block">event_busy</span>
                            No meeting requests at this time.
                        </div>
                    </div>
                </div>

                <!-- 3. Notifications Tab Content -->
                <div id="hub-content-notifications" class="space-y-md hidden">
                    <div class="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                        <span class="text-on-surface-variant">System and activity updates</span>
                        <button id="btn-read-all-notifications" class="text-xs text-primary hover:underline flex items-center gap-1 font-bold">
                            <span class="material-symbols-outlined text-[14px]">done_all</span> Mark all read
                        </button>
                    </div>
                    <div id="notifications-list" class="space-y-sm min-h-[100px]">
                        <div class="p-6 text-center text-xs text-on-surface-variant">
                            <span class="material-symbols-outlined text-[28px] opacity-40 mb-1 block">notifications_off</span>
                            No notifications yet.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar Column -->
        <div class="space-y-lg">
            <!-- Quick Actions -->
            <div class="glass-panel p-lg rounded-xl">
                <h3 class="font-bold mb-md text-on-surface">Quick Actions</h3>
                <div class="grid grid-cols-2 gap-sm">
                    <button onclick="window.location.hash='ai_workspace'" class="p-sm bg-surface-container hover:bg-surface-variant border border-white/5 rounded-lg flex flex-col items-center justify-center gap-xs transition-colors group">
                        <span class="material-symbols-outlined text-tertiary group-hover:scale-110 transition-transform">code_blocks</span>
                        <span class="text-xs">Code Review</span>
                    </button>
                    <button onclick="window.location.hash='project_details'" class="p-sm bg-surface-container hover:bg-surface-variant border border-white/5 rounded-lg flex flex-col items-center justify-center gap-xs transition-colors group">
                        <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add_task</span>
                        <span class="text-xs">Project Description</span>
                    </button>
                </div>
            </div>

            <!-- Assigned to you -->
            <div class="glass-panel p-lg rounded-xl">
                <div class="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                    <h3 class="font-bold">Assigned to you</h3>
                    <span id="assigned-issues-count" class="w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-[10px] font-bold font-mono">0</span>
                </div>
                <div id="assigned-issues-list" class="space-y-md">
                    <div class="p-4 text-center text-xs text-on-surface-variant">
                        <span class="material-symbols-outlined text-[24px] mb-1 opacity-50 block">check_circle</span>
                        No issues assigned to you.
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>`;
}

export async function initDashboard() {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    
    // Update Header Greeting
    const welcomeHeading = document.getElementById('dashboard-welcome-heading');
    if (welcomeHeading) {
        const userName = currentUser ? (currentUser.name || 'Developer') : 'Developer';
        welcomeHeading.textContent = `Welcome back, ${userName}!`;
    }

    if (!currentUser) {
        // Guest / Not logged in state: clean zero states
        const statActiveProjects = document.getElementById('stat-active-projects');
        if (statActiveProjects) statActiveProjects.textContent = '0';
        const statActiveIssues = document.getElementById('stat-active-issues');
        if (statActiveIssues) statActiveIssues.textContent = '0';
        const statResolvedIssues = document.getElementById('stat-resolved-issues');
        if (statResolvedIssues) statResolvedIssues.textContent = '0';
        const statGlobalRank = document.getElementById('stat-global-rank');
        if (statGlobalRank) statGlobalRank.textContent = 'Top 50%';
        renderDynamicKnowledgeGraph([], []);
        return;
    }

    try {
        // Fetch projects, issues, and project memberships concurrently
        const [projectsRes, issuesRes, membersRes] = await Promise.all([
            window.apiFetch('/api/projects').catch(() => null),
            window.apiFetch('/api/issues').catch(() => null),
            window.apiFetch('/api/projectMembers').catch(() => null)
        ]);

        const allProjects = (projectsRes && projectsRes.ok) ? await projectsRes.json() : [];
        const allIssues = (issuesRes && issuesRes.ok) ? await issuesRes.json() : [];
        const allMembers = (membersRes && membersRes.ok) ? await membersRes.json() : [];

        // Determine user's active projects
        const userProjectMap = new Map();
        const userProjectIds = new Set();

        // 1. Projects where user is owner / creator / member
        allProjects.forEach(p => {
            const isOwner = p.ownerId && String(p.ownerId) === String(currentUser.id);
            const isMember = (Array.isArray(allMembers) && allMembers.some(m => m.projectId === p.id && String(m.userId) === String(currentUser.id))) ||
                             (Array.isArray(p.members) && p.members.some(m => String(m.userId) === String(currentUser.id)));
            if (isOwner || isMember) {
                userProjectMap.set(p.id, p);
                userProjectIds.add(p.id);
            }
        });

        // 2. Projects where user has created or has been assigned issues
        allIssues.forEach(i => {
            if (String(i.creatorId) === String(currentUser.id) || String(i.assigneeId) === String(currentUser.id)) {
                userProjectIds.add(i.projectId);
                const proj = allProjects.find(p => p.id === i.projectId);
                if (proj && !userProjectMap.has(proj.id)) {
                    userProjectMap.set(proj.id, proj);
                }
            }
        });

        // If user created projects or has demo projects, include active projects
        const userProjects = Array.from(userProjectMap.values());

        // Issues relevant to user:
        // Issues assigned to user OR created by user OR belonging to user's projects
        const userIssues = allIssues.filter(i => 
            i.assigneeId === currentUser.id ||
            i.creatorId === currentUser.id ||
            userProjectIds.has(i.projectId)
        );

        // Active Issues (TODO or IN_PROGRESS)
        const activeIssues = userIssues.filter(i => i.status === 'TODO' || i.status === 'IN_PROGRESS');
        const activeProjectsCountForIssues = new Set(activeIssues.map(i => i.projectId)).size;

        // Resolved Issues (DONE)
        const resolvedIssues = userIssues.filter(i => i.status === 'DONE');

        // Assigned directly to user
        const assignedIssues = allIssues.filter(i => i.assigneeId === currentUser.id);

        // Update Stat Cards in DOM
        const statActiveProjects = document.getElementById('stat-active-projects');
        const statProjectsSubtext = document.getElementById('stat-projects-subtext');
        if (statActiveProjects) {
            statActiveProjects.textContent = userProjects.length.toLocaleString();
        }
        if (statProjectsSubtext) {
            statProjectsSubtext.innerHTML = `<span class="material-symbols-outlined text-[16px] mr-1">folder_open</span> ${userProjects.length === 1 ? '1 active workspace' : `${userProjects.length} active workspaces`}`;
        }

        const statActiveIssues = document.getElementById('stat-active-issues');
        const statIssuesSubtext = document.getElementById('stat-issues-subtext');
        if (statActiveIssues) {
            statActiveIssues.textContent = activeIssues.length.toLocaleString();
        }
        if (statIssuesSubtext) {
            statIssuesSubtext.textContent = `Across ${activeProjectsCountForIssues} ${activeProjectsCountForIssues === 1 ? 'project' : 'projects'}`;
        }

        const statResolvedIssues = document.getElementById('stat-resolved-issues');
        const statResolvedSubtext = document.getElementById('stat-resolved-subtext');
        if (statResolvedIssues) {
            statResolvedIssues.textContent = resolvedIssues.length.toLocaleString();
        }
        if (statResolvedSubtext) {
            if (resolvedIssues.length > 0) {
                statResolvedSubtext.innerHTML = `<span class="material-symbols-outlined text-[16px] mr-1">task_alt</span> ${resolvedIssues.length} completed ${resolvedIssues.length === 1 ? 'task' : 'tasks'}`;
            } else {
                statResolvedSubtext.innerHTML = `<span class="material-symbols-outlined text-[16px] mr-1">task_alt</span> No resolved issues yet`;
            }
        }

        // Global Percentile Calculation
        const userActivityScore = (userProjects.length * 3) + (userIssues.length * 2) + (resolvedIssues.length * 3) + (currentUser.progress || 0);
        let rankPercentile = 'Top 50%';
        if (userActivityScore >= 12) {
            rankPercentile = 'Top 5%';
        } else if (userActivityScore >= 6) {
            rankPercentile = 'Top 10%';
        } else if (userActivityScore >= 2) {
            rankPercentile = 'Top 25%';
        } else {
            rankPercentile = 'Top 50%';
        }

        const statGlobalRank = document.getElementById('stat-global-rank');
        if (statGlobalRank) {
            statGlobalRank.textContent = rankPercentile;
        }

        // Render "Assigned to you" List
        const assignedContainer = document.getElementById('assigned-issues-list');
        const assignedCountBadge = document.getElementById('assigned-issues-count');
        if (assignedCountBadge) {
            assignedCountBadge.textContent = assignedIssues.length.toString();
        }

        if (assignedContainer) {
            if (assignedIssues.length === 0) {
                assignedContainer.innerHTML = `
                    <div class="p-4 text-center text-xs text-on-surface-variant">
                        <span class="material-symbols-outlined text-[24px] mb-1 opacity-50 block">check_circle</span>
                        No issues assigned to you.
                    </div>
                `;
            } else {
                let assignedHtml = '';
                assignedIssues.forEach((issue, idx) => {
                    const project = allProjects.find(p => p.id === issue.projectId);
                    const projectName = project ? (project.title || 'Project') : 'Project';
                    
                    let priorityColor = 'text-tertiary';
                    if (issue.priority === 'URGENT' || issue.priority === 'HIGH') {
                        priorityColor = 'text-error';
                    } else if (issue.priority === 'LOW') {
                        priorityColor = 'text-on-surface-variant';
                    }

                    assignedHtml += `
                        <div class="flex items-start gap-sm group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors" onclick="window.location.hash='issues?projectId=${issue.projectId || ''}'">
                            <span class="material-symbols-outlined ${priorityColor} text-[18px] mt-0.5">adjust</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm text-on-surface group-hover:text-primary transition-colors truncate font-medium">${escapeHtml(issue.title)}</div>
                                <div class="text-xs text-on-surface-variant mt-1 truncate">#${idx + 1} • ${escapeHtml(projectName)} • <span class="${priorityColor} font-bold">${issue.priority || 'MEDIUM'}</span></div>
                            </div>
                        </div>
                    `;
                });
                assignedContainer.innerHTML = assignedHtml;
            }
        }

        // Render Knowledge Graph
        renderDynamicKnowledgeGraph(userProjects, allIssues);

        // Update AI Recommendations based on actual active issues
        const aiRecTitle = document.getElementById('ai-rec-title');
        const aiRecDesc = document.getElementById('ai-rec-desc');
        const aiRecBtn = document.getElementById('ai-rec-btn');
        if (aiRecTitle && aiRecDesc && aiRecBtn) {
            const firstActive = activeIssues.find(i => i.status === 'TODO') || activeIssues[0];
            if (firstActive) {
                const proj = allProjects.find(p => p.id === firstActive.projectId);
                const projName = proj ? proj.title : 'Active Project';
                aiRecTitle.textContent = `Recommended Issue: ${firstActive.title}`;
                aiRecDesc.textContent = `From ${projName} (${firstActive.priority} priority). Ready for development.`;
                aiRecBtn.textContent = 'View Issue';
                aiRecBtn.onclick = () => { window.location.hash = `issues?projectId=${firstActive.projectId}`; };
            } else if (userProjects.length > 0) {
                const targetProj = userProjects[0];
                aiRecTitle.textContent = `Workspace Ready: ${targetProj.title}`;
                aiRecDesc.textContent = `Keep momentum going by creating new tasks or tracking issues in ${targetProj.title}.`;
                aiRecBtn.textContent = 'Open Board';
                aiRecBtn.onclick = () => { window.location.hash = `issues?projectId=${targetProj.id}`; };
            }
        }

        // Initialize and load Requests & Notifications Hub
        await loadRequestsAndNotificationsHub(currentUser, allProjects);

    } catch (err) {
        console.error('Error loading dynamic dashboard data:', err);
    }
}

async function loadRequestsAndNotificationsHub(currentUser, allProjects) {
    if (!currentUser) return;

    try {
        const [jrRecRes, jrSentRes, meetRecRes, meetSentRes, notifRes] = await Promise.all([
            window.apiFetch('/api/join-requests/received').catch(() => null),
            window.apiFetch('/api/join-requests/sent').catch(() => null),
            window.apiFetch('/api/meetings/received').catch(() => null),
            window.apiFetch('/api/meetings/sent').catch(() => null),
            window.apiFetch('/api/notifications').catch(() => null)
        ]);

        const joinReceived = (jrRecRes && jrRecRes.ok) ? await jrRecRes.json() : [];
        const joinSent = (jrSentRes && jrSentRes.ok) ? await jrSentRes.json() : [];
        const meetReceived = (meetRecRes && meetRecRes.ok) ? await meetRecRes.json() : [];
        const meetSent = (meetSentRes && meetSentRes.ok) ? await meetSentRes.json() : [];
        const notifications = (notifRes && notifRes.ok) ? await notifRes.json() : [];

        // Tab count badges
        const pendingJoinCount = joinReceived.filter(r => r.status === 'PENDING').length;
        const pendingMeetCount = meetReceived.filter(m => m.status === 'PENDING').length;
        const unreadNotifCount = notifications.filter(n => !n.read).length;

        const badgeJoin = document.getElementById('badge-join-requests-count');
        if (badgeJoin) {
            if (pendingJoinCount > 0) {
                badgeJoin.textContent = pendingJoinCount;
                badgeJoin.classList.remove('hidden');
            } else {
                badgeJoin.classList.add('hidden');
            }
        }

        const badgeMeet = document.getElementById('badge-meetings-count');
        if (badgeMeet) {
            if (pendingMeetCount > 0) {
                badgeMeet.textContent = pendingMeetCount;
                badgeMeet.classList.remove('hidden');
            } else {
                badgeMeet.classList.add('hidden');
            }
        }

        const badgeNotif = document.getElementById('badge-notifications-count');
        if (badgeNotif) {
            if (unreadNotifCount > 0) {
                badgeNotif.textContent = unreadNotifCount;
                badgeNotif.classList.remove('hidden');
            } else {
                badgeNotif.classList.add('hidden');
            }
        }

        // Setup Main Tab Switching
        const tabBtnJoin = document.getElementById('tab-btn-join-requests');
        const tabBtnMeet = document.getElementById('tab-btn-meeting-requests');
        const tabBtnNotif = document.getElementById('tab-btn-notifications');

        const contentJoin = document.getElementById('hub-content-join-requests');
        const contentMeet = document.getElementById('hub-content-meeting-requests');
        const contentNotif = document.getElementById('hub-content-notifications');

        function switchTab(activeTab) {
            const tabs = [
                { btn: tabBtnJoin, content: contentJoin, id: 'join' },
                { btn: tabBtnMeet, content: contentMeet, id: 'meet' },
                { btn: tabBtnNotif, content: contentNotif, id: 'notif' }
            ];
            tabs.forEach(t => {
                if (!t.btn || !t.content) return;
                if (t.id === activeTab) {
                    t.btn.className = 'px-3 py-1.5 rounded-md font-bold transition-colors bg-primary text-on-primary flex items-center gap-1';
                    t.content.classList.remove('hidden');
                } else {
                    t.btn.className = 'px-3 py-1.5 rounded-md font-medium text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1';
                    t.content.classList.add('hidden');
                }
            });
        }

        if (tabBtnJoin) tabBtnJoin.onclick = () => switchTab('join');
        if (tabBtnMeet) tabBtnMeet.onclick = () => switchTab('meet');
        if (tabBtnNotif) tabBtnNotif.onclick = () => switchTab('notif');

        // Subtabs: Join Requests (Received vs Sent)
        let activeJoinSubtab = 'received';
        const subtabJoinReceived = document.getElementById('subtab-join-received');
        const subtabJoinSent = document.getElementById('subtab-join-sent');
        const joinList = document.getElementById('join-requests-list');

        function renderJoinRequests() {
            if (!joinList) return;
            const list = activeJoinSubtab === 'received' ? joinReceived : joinSent;

            if (subtabJoinReceived && subtabJoinSent) {
                if (activeJoinSubtab === 'received') {
                    subtabJoinReceived.className = 'px-2.5 py-1 rounded bg-surface-variant text-on-surface font-bold';
                    subtabJoinSent.className = 'px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface';
                } else {
                    subtabJoinReceived.className = 'px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface';
                    subtabJoinSent.className = 'px-2.5 py-1 rounded bg-surface-variant text-on-surface font-bold';
                }
            }

            if (list.length === 0) {
                joinList.innerHTML = `
                    <div class="p-6 text-center text-xs text-on-surface-variant">
                        <span class="material-symbols-outlined text-[28px] opacity-40 mb-1 block">inbox</span>
                        ${activeJoinSubtab === 'received' ? 'No join requests received for your projects.' : 'You have not sent any join requests.'}
                    </div>
                `;
                return;
            }

            let html = '';
            list.forEach(r => {
                const project = allProjects.find(p => p.id === r.projectId) || r.project;
                const projectTitle = project ? (project.title || 'Project') : 'Project';
                const requesterName = r.user?.name || 'Developer';
                const requesterInitial = requesterName.charAt(0).toUpperCase();
                const formattedDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';

                let statusBadge = '';
                if (r.status === 'ACCEPTED') {
                    statusBadge = '<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase">Accepted</span>';
                } else if (r.status === 'REJECTED') {
                    statusBadge = '<span class="px-2 py-0.5 bg-error/20 text-error border border-error/30 rounded text-[10px] font-bold uppercase">Declined</span>';
                } else {
                    statusBadge = '<span class="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold uppercase animate-pulse">Pending Review</span>';
                }

                let actionsHtml = '';
                if (activeJoinSubtab === 'received' && r.status === 'PENDING') {
                    actionsHtml = `
                        <div class="flex items-center gap-2 mt-2 sm:mt-0">
                            <button data-action-accept-join="${r.id}" class="px-3 py-1 bg-tertiary text-on-tertiary rounded-lg text-xs font-bold shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">check</span> Accept
                            </button>
                            <button data-action-reject-join="${r.id}" class="px-3 py-1 bg-surface-variant hover:bg-error/20 hover:text-error text-on-surface-variant rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">close</span> Decline
                            </button>
                        </div>
                    `;
                }

                html += `
                    <div class="p-3 bg-surface-container/70 border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div class="flex items-start sm:items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                ${requesterInitial}
                            </div>
                            <div class="min-w-0 space-y-0.5">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-bold text-on-surface text-sm">${escapeHtml(requesterName)}</span>
                                    <span class="text-xs text-on-surface-variant">requested to join</span>
                                    <a href="#project_details?projectId=${r.projectId}" class="text-primary hover:underline font-bold text-xs truncate max-w-[200px]">${escapeHtml(projectTitle)}</a>
                                </div>
                                <div class="text-[11px] text-on-surface-variant flex items-center gap-2">
                                    <span>${formattedDate}</span>
                                    ${r.message ? `<span>• "${escapeHtml(r.message)}"</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 self-end sm:self-center">
                            ${statusBadge}
                            ${actionsHtml}
                        </div>
                    </div>
                `;
            });

            joinList.innerHTML = html;

            // Attach Accept & Reject Handlers
            joinList.querySelectorAll('[data-action-accept-join]').forEach(btn => {
                btn.onclick = async () => {
                    const reqId = btn.getAttribute('data-action-accept-join');
                    btn.disabled = true;
                    try {
                        const res = await window.apiFetch(`/api/join-requests/${reqId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: 'ACCEPTED' })
                        });
                        if (res.ok) {
                            window.UI.showToast('Join request accepted! User is now a project member.', 'success');
                            initDashboard();
                        } else {
                            window.UI.showToast('Failed to update join request', 'error');
                            btn.disabled = false;
                        }
                    } catch (err) {
                        window.UI.showToast('Error updating request', 'error');
                        btn.disabled = false;
                    }
                };
            });

            joinList.querySelectorAll('[data-action-reject-join]').forEach(btn => {
                btn.onclick = async () => {
                    const reqId = btn.getAttribute('data-action-reject-join');
                    btn.disabled = true;
                    try {
                        const res = await window.apiFetch(`/api/join-requests/${reqId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: 'REJECTED' })
                        });
                        if (res.ok) {
                            window.UI.showToast('Join request declined', 'info');
                            initDashboard();
                        } else {
                            window.UI.showToast('Failed to update join request', 'error');
                            btn.disabled = false;
                        }
                    } catch (err) {
                        window.UI.showToast('Error updating request', 'error');
                        btn.disabled = false;
                    }
                };
            });
        }

        if (subtabJoinReceived) subtabJoinReceived.onclick = () => { activeJoinSubtab = 'received'; renderJoinRequests(); };
        if (subtabJoinSent) subtabJoinSent.onclick = () => { activeJoinSubtab = 'sent'; renderJoinRequests(); };
        renderJoinRequests();

        // Subtabs: Meeting Requests (Received vs Sent)
        let activeMeetSubtab = 'received';
        const subtabMeetReceived = document.getElementById('subtab-meet-received');
        const subtabMeetSent = document.getElementById('subtab-meet-sent');
        const meetList = document.getElementById('meeting-requests-list');

        function renderMeetingRequests() {
            if (!meetList) return;
            const list = activeMeetSubtab === 'received' ? meetReceived : meetSent;

            if (subtabMeetReceived && subtabMeetSent) {
                if (activeMeetSubtab === 'received') {
                    subtabMeetReceived.className = 'px-2.5 py-1 rounded bg-surface-variant text-on-surface font-bold';
                    subtabMeetSent.className = 'px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface';
                } else {
                    subtabMeetReceived.className = 'px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface';
                    subtabMeetSent.className = 'px-2.5 py-1 rounded bg-surface-variant text-on-surface font-bold';
                }
            }

            if (list.length === 0) {
                meetList.innerHTML = `
                    <div class="p-6 text-center text-xs text-on-surface-variant">
                        <span class="material-symbols-outlined text-[28px] opacity-40 mb-1 block">event_busy</span>
                        ${activeMeetSubtab === 'received' ? 'No meeting requests received.' : 'You have not scheduled any meetings yet.'}
                    </div>
                `;
                return;
            }

            let html = '';
            list.forEach(m => {
                const project = allProjects.find(p => p.id === m.projectId) || m.project;
                const projectTitle = project ? (project.title || 'Project') : 'Project';
                const requesterName = m.user?.name || 'Developer';
                const requesterInitial = requesterName.charAt(0).toUpperCase();
                const formattedDate = m.preferredDate ? new Date(m.preferredDate).toLocaleString() : 'Date TBD';

                let statusBadge = '';
                if (m.status === 'ACCEPTED') {
                    statusBadge = '<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase">Accepted</span>';
                } else if (m.status === 'REJECTED') {
                    statusBadge = '<span class="px-2 py-0.5 bg-error/20 text-error border border-error/30 rounded text-[10px] font-bold uppercase">Declined</span>';
                } else {
                    statusBadge = '<span class="px-2 py-0.5 bg-secondary/20 text-secondary border border-secondary/30 rounded text-[10px] font-bold uppercase animate-pulse">Pending Review</span>';
                }

                let actionsHtml = '';
                if (activeMeetSubtab === 'received' && m.status === 'PENDING') {
                    actionsHtml = `
                        <div class="flex items-center gap-2 mt-2 sm:mt-0">
                            <button data-action-accept-meet="${m.id}" class="px-3 py-1 bg-secondary text-on-secondary rounded-lg text-xs font-bold shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">check</span> Accept
                            </button>
                            <button data-action-reject-meet="${m.id}" class="px-3 py-1 bg-surface-variant hover:bg-error/20 hover:text-error text-on-surface-variant rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">close</span> Decline
                            </button>
                        </div>
                    `;
                }

                html += `
                    <div class="p-3 bg-surface-container/70 border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div class="flex items-start sm:items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                ${requesterInitial}
                            </div>
                            <div class="min-w-0 space-y-0.5">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-bold text-on-surface text-sm">${escapeHtml(requesterName)}</span>
                                    <span class="text-xs text-on-surface-variant">requested a sync for</span>
                                    <a href="#project_details?projectId=${m.projectId}" class="text-secondary hover:underline font-bold text-xs truncate max-w-[200px]">${escapeHtml(projectTitle)}</a>
                                </div>
                                <div class="text-[11px] text-on-surface-variant flex items-center gap-2 flex-wrap">
                                    <span class="flex items-center gap-1 text-on-surface"><span class="material-symbols-outlined text-[13px]">schedule</span> ${formattedDate}</span>
                                    ${m.message ? `<span>• ${escapeHtml(m.message)}</span>` : ''}
                                </div>
                                ${m.responseNotes ? `<div class="text-xs text-tertiary mt-1"><strong>Owner note:</strong> ${escapeHtml(m.responseNotes)}</div>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 self-end sm:self-center">
                            ${statusBadge}
                            ${actionsHtml}
                        </div>
                    </div>
                `;
            });

            meetList.innerHTML = html;

            // Attach Meeting Accept & Reject Handlers
            meetList.querySelectorAll('[data-action-accept-meet]').forEach(btn => {
                btn.onclick = async () => {
                    const reqId = btn.getAttribute('data-action-accept-meet');
                    btn.disabled = true;
                    try {
                        const res = await window.apiFetch(`/api/meetings/${reqId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: 'ACCEPTED' })
                        });
                        if (res.ok) {
                            window.UI.showToast('Meeting request accepted!', 'success');
                            initDashboard();
                        } else {
                            window.UI.showToast('Failed to update meeting', 'error');
                            btn.disabled = false;
                        }
                    } catch (err) {
                        window.UI.showToast('Error updating meeting', 'error');
                        btn.disabled = false;
                    }
                };
            });

            meetList.querySelectorAll('[data-action-reject-meet]').forEach(btn => {
                btn.onclick = async () => {
                    const reqId = btn.getAttribute('data-action-reject-meet');
                    btn.disabled = true;
                    try {
                        const res = await window.apiFetch(`/api/meetings/${reqId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: 'REJECTED' })
                        });
                        if (res.ok) {
                            window.UI.showToast('Meeting request declined', 'info');
                            initDashboard();
                        } else {
                            window.UI.showToast('Failed to update meeting', 'error');
                            btn.disabled = false;
                        }
                    } catch (err) {
                        window.UI.showToast('Error updating meeting', 'error');
                        btn.disabled = false;
                    }
                };
            });
        }

        if (subtabMeetReceived) subtabMeetReceived.onclick = () => { activeMeetSubtab = 'received'; renderMeetingRequests(); };
        if (subtabMeetSent) subtabMeetSent.onclick = () => { activeMeetSubtab = 'sent'; renderMeetingRequests(); };
        renderMeetingRequests();

        // Notifications List
        const notifList = document.getElementById('notifications-list');
        const readAllBtn = document.getElementById('btn-read-all-notifications');

        function renderNotificationsList() {
            if (!notifList) return;

            if (notifications.length === 0) {
                notifList.innerHTML = `
                    <div class="p-6 text-center text-xs text-on-surface-variant">
                        <span class="material-symbols-outlined text-[28px] opacity-40 mb-1 block">notifications_off</span>
                        No notifications yet.
                    </div>
                `;
                return;
            }

            let html = '';
            notifications.forEach(n => {
                let icon = 'notifications';
                let iconColor = 'text-primary bg-primary/10';

                if (n.type.includes('JOIN')) {
                    icon = n.type.includes('ACCEPTED') ? 'how_to_reg' : 'person_add';
                    iconColor = n.type.includes('ACCEPTED') ? 'text-tertiary bg-tertiary/10' : 'text-primary bg-primary/10';
                } else if (n.type.includes('MEET')) {
                    icon = n.type.includes('ACCEPTED') ? 'event_available' : 'calendar_month';
                    iconColor = n.type.includes('ACCEPTED') ? 'text-tertiary bg-tertiary/10' : 'text-secondary bg-secondary/10';
                }

                const formattedTime = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';
                const unreadClass = !n.read ? 'border-l-4 border-l-primary bg-surface-container/90' : 'bg-surface-container/40 opacity-75';

                html += `
                    <div class="p-3 border border-white/5 rounded-xl flex items-start justify-between gap-3 ${unreadClass}">
                        <div class="flex items-start gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span class="material-symbols-outlined text-[18px]">${icon}</span>
                            </div>
                            <div class="min-w-0 space-y-0.5">
                                <div class="font-bold text-on-surface text-xs">${escapeHtml(n.title)}</div>
                                <div class="text-xs text-on-surface-variant">${escapeHtml(n.message)}</div>
                                <div class="text-[10px] text-on-surface-variant/70 mt-1">${formattedTime}</div>
                            </div>
                        </div>
                        ${!n.read ? `
                            <button data-action-mark-read="${n.id}" class="text-[11px] text-primary hover:underline flex-shrink-0 font-medium">
                                Mark read
                            </button>
                        ` : ''}
                    </div>
                `;
            });

            notifList.innerHTML = html;

            notifList.querySelectorAll('[data-action-mark-read]').forEach(btn => {
                btn.onclick = async () => {
                    const nId = btn.getAttribute('data-action-mark-read');
                    try {
                        const res = await window.apiFetch(`/api/notifications/${nId}/read`, { method: 'PATCH' });
                        if (res.ok) {
                            if (window.updateNotificationBadge) window.updateNotificationBadge();
                            initDashboard();
                        }
                    } catch (err) {
                        console.warn('Could not mark notification read:', err);
                    }
                };
            });
        }

        if (readAllBtn) {
            readAllBtn.onclick = async () => {
                try {
                    const res = await window.apiFetch('/api/notifications/read-all', { method: 'POST' });
                    if (res.ok) {
                        if (window.updateNotificationBadge) window.updateNotificationBadge();
                        window.UI.showToast('All notifications marked as read', 'success');
                        initDashboard();
                    }
                } catch (err) {
                    console.warn('Could not mark all notifications read:', err);
                }
            };
        }

        renderNotificationsList();

    } catch (err) {
        console.error('Error loading requests and notifications hub:', err);
    }
}

function renderDynamicKnowledgeGraph(projects, allIssues) {
    const container = document.getElementById('knowledge-graph-container');
    const svg = document.getElementById('knowledge-graph-svg');
    const nodesContainer = document.getElementById('knowledge-graph-nodes');
    const emptyState = document.getElementById('knowledge-graph-empty');
    const countBadge = document.getElementById('knowledge-graph-count');

    if (!container || !svg || !nodesContainer) return;

    if (countBadge) {
        countBadge.textContent = `${projects.length} ${projects.length === 1 ? 'Project' : 'Projects'}`;
    }

    if (projects.length === 0) {
        svg.innerHTML = '';
        nodesContainer.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 280;

    const neonPalettes = [
        { stroke: '#00ff88', bg: '#00ff88', glow: 'rgba(0, 255, 136, 0.5)', text: '#00ff88' },
        { stroke: '#a855f7', bg: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', text: '#c084fc' },
        { stroke: '#00d2ff', bg: '#00d2ff', glow: 'rgba(0, 210, 255, 0.5)', text: '#38bdf8' },
        { stroke: '#ff9e00', bg: '#ff9e00', glow: 'rgba(255, 158, 0, 0.5)', text: '#fbbf24' },
        { stroke: '#f43f5e', bg: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)', text: '#fb7185' }
    ];

    let svgLinesHtml = '';
    let nodesHtml = '';

    const numProjects = projects.length;

    projects.forEach((proj, projIdx) => {
        const palette = neonPalettes[projIdx % neonPalettes.length];
        
        // Calculate center for project node
        let projX, projY;
        if (numProjects === 1) {
            projX = width * 0.5;
            projY = height * 0.48;
        } else if (numProjects === 2) {
            projX = width * (projIdx === 0 ? 0.32 : 0.68);
            projY = height * 0.48;
        } else if (numProjects === 3) {
            const positions = [
                { x: width * 0.25, y: height * 0.45 },
                { x: width * 0.52, y: height * 0.58 },
                { x: width * 0.78, y: height * 0.42 }
            ];
            projX = positions[projIdx].x;
            projY = positions[projIdx].y;
        } else {
            const angle = (2 * Math.PI * projIdx) / numProjects;
            const rx = width * 0.32;
            const ry = height * 0.28;
            projX = (width * 0.5) + rx * Math.cos(angle);
            projY = (height * 0.5) + ry * Math.sin(angle);
        }

        // Find linked issues for this project
        const projectIssues = allIssues.filter(i => i.projectId === proj.id);

        // Render Issue Nodes and Connecting Lines
        const issueCount = Math.min(projectIssues.length, 6); // Keep visual clarity
        const orbitRadius = numProjects === 1 ? 65 : (numProjects <= 3 ? 48 : 38);

        for (let i = 0; i < issueCount; i++) {
            const issue = projectIssues[i];
            const issueAngle = (2 * Math.PI * i) / (issueCount || 1) + (projIdx * 0.5);
            const issueX = projX + orbitRadius * Math.cos(issueAngle);
            const issueY = projY + orbitRadius * Math.sin(issueAngle);

            // SVG connecting line
            svgLinesHtml += `
                <line x1="${projX}" y1="${projY}" x2="${issueX}" y2="${issueY}" 
                      stroke="${palette.stroke}" stroke-width="1.5" stroke-opacity="0.4" 
                      stroke-dasharray="3 3" />
            `;

            // Smaller Issue dot
            nodesHtml += `
                <div class="absolute rounded-full cursor-pointer transition-transform hover:scale-150 group z-10" 
                     style="left: ${issueX}px; top: ${issueY}px; transform: translate(-50%, -50%); width: 10px; height: 10px; background-color: ${palette.bg}; opacity: 0.85; box-shadow: 0 0 8px ${palette.glow};"
                     onclick="window.location.hash='issues?projectId=${proj.id}'">
                    <div class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-surface-container-highest text-white text-[10px] rounded whitespace-nowrap z-30 border border-white/10 shadow-lg pointer-events-none">
                        ${escapeHtml(issue.title)} (${issue.priority || 'Issue'})
                    </div>
                </div>
            `;
        }

        // Larger Project Node
        nodesHtml += `
            <div class="absolute rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 group z-20"
                 style="left: ${projX}px; top: ${projY}px; transform: translate(-50%, -50%); width: 26px; height: 26px; background-color: ${palette.bg}; box-shadow: 0 0 18px ${palette.glow};"
                 onclick="window.location.hash='issues?projectId=${proj.id}'">
                <span class="material-symbols-outlined text-[14px] text-background font-bold">folder</span>
                <div class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-white text-[11px] font-bold rounded whitespace-nowrap z-30 border border-white/10 shadow-lg pointer-events-none">
                    ${escapeHtml(proj.title)} (${projectIssues.length} issues)
                </div>
            </div>
            <div class="absolute text-[11px] font-bold tracking-wide pointer-events-none truncate max-w-[120px] text-center" 
                 style="left: ${projX}px; top: ${projY + 18}px; transform: translateX(-50%); color: ${palette.text}; text-shadow: 0 0 10px ${palette.glow};">
                ${escapeHtml(proj.title)}
            </div>
        `;
    });

    svg.innerHTML = svgLinesHtml;
    nodesContainer.innerHTML = nodesHtml;
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

window.initDashboard = initDashboard;

