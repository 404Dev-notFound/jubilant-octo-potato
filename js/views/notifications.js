// Notifications View for CodeCollab
// Fully connected to DB via /api/notifications, /api/notifications/:id/read, /api/notifications/read-all

const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function getNotificationConfig(n) {
    const type = n.type || 'SYSTEM';
    if (type.includes('JOIN_REQUEST_RECEIVED')) {
        return {
            icon: 'group_add',
            badge: 'Join Request',
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            actionUrl: '#dashboard',
            actionText: 'View in Dashboard'
        };
    }
    if (type.includes('JOIN_REQUEST_ACCEPTED') || type.includes('JOIN_ACCEPTED')) {
        return {
            icon: 'how_to_reg',
            badge: 'Join Accepted',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            actionUrl: n.projectId ? `#project_details?projectId=${n.projectId}` : '#dashboard',
            actionText: 'Open Project'
        };
    }
    if (type.includes('JOIN_REQUEST_REJECTED') || type.includes('JOIN_REJECTED')) {
        return {
            icon: 'person_remove',
            badge: 'Join Update',
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
            actionUrl: '#explore',
            actionText: 'Explore Projects'
        };
    }
    if (type.includes('MEETING_REQUEST_RECEIVED')) {
        return {
            icon: 'calendar_month',
            badge: 'Meeting Invite',
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            actionUrl: '#dashboard',
            actionText: 'Manage Meetings'
        };
    }
    if (type.includes('MEETING_REQUEST_ACCEPTED') || type.includes('MEETING_ACCEPTED')) {
        return {
            icon: 'event_available',
            badge: 'Meeting Confirmed',
            color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
            actionUrl: '#dashboard',
            actionText: 'View Meeting Link'
        };
    }
    if (type.includes('MEETING_REQUEST_REJECTED') || type.includes('MEETING_REJECTED')) {
        return {
            icon: 'event_busy',
            badge: 'Meeting Update',
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            actionUrl: '#dashboard',
            actionText: 'Dashboard'
        };
    }
    if (type.includes('TEAM_JOIN_REQUEST')) {
        return {
            icon: 'diversity_3',
            badge: 'Team Request',
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            actionUrl: '#community',
            actionText: 'View Community Teams'
        };
    }
    if (type.includes('TEAM_JOIN_ACCEPTED')) {
        return {
            icon: 'celebration',
            badge: 'Team Accepted',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            actionUrl: '#community',
            actionText: 'Go to Team'
        };
    }
    if (type.includes('TEAM_JOIN_REJECTED')) {
        return {
            icon: 'person_cancel',
            badge: 'Team Update',
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
            actionUrl: '#community',
            actionText: 'Community'
        };
    }
    if (type.includes('ISSUE_ASSIGNED')) {
        return {
            icon: 'assignment_ind',
            badge: 'Issue Assigned',
            color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
            actionUrl: n.projectId ? `#issues?projectId=${n.projectId}` : '#issues',
            actionText: 'Open Issues'
        };
    }
    if (type.includes('ISSUE_RESOLVED')) {
        return {
            icon: 'task_alt',
            badge: 'Issue Resolved',
            color: 'text-green-400 bg-green-500/10 border-green-500/20',
            actionUrl: n.projectId ? `#issues?projectId=${n.projectId}` : '#issues',
            actionText: 'View Issues'
        };
    }
    if (type.includes('USER_UPVOTED')) {
        return {
            icon: 'thumb_up',
            badge: 'Upvote',
            color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
            actionUrl: '#community',
            actionText: 'View Developers'
        };
    }
    if (type.includes('USER_FOLLOWED')) {
        return {
            icon: 'person_add',
            badge: 'New Follower',
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
            actionUrl: '#community',
            actionText: 'Community'
        };
    }
    return {
        icon: 'notifications',
        badge: 'Notification',
        color: 'text-primary bg-primary/10 border-primary/20',
        actionUrl: '',
        actionText: ''
    };
}

export function render_notifications() {
    return `
    <main class="w-full max-w-[1100px] mx-auto px-4 md:px-8 py-8 md:py-12 animate-fade-in">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 mb-8">
            <div class="space-y-1">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                        <span class="material-symbols-outlined text-[24px]">notifications</span>
                    </div>
                    <div>
                        <h1 class="font-display text-2xl md:text-3xl font-black text-on-surface tracking-tight">Notifications</h1>
                        <p class="text-xs md:text-sm text-on-surface-variant">Stay updated on your project invites, meetings, team requests, and activities.</p>
                    </div>
                </div>
            </div>
            
            <!-- Controls & Mark All Read -->
            <div class="flex items-center gap-3 self-start md:self-auto">
                <div id="notif-unread-badge" class="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span id="notif-unread-count-text">0 Unread</span>
                </div>
                <button id="btn-mark-all-read" class="px-4 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-white/10 hover:border-primary/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    <span class="material-symbols-outlined text-[16px]">done_all</span>
                    Mark All as Read
                </button>
            </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none" id="notif-filter-tabs">
            <button data-filter="all" class="filter-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-primary text-on-primary shadow-md shadow-primary/20 cursor-pointer">
                All (<span id="tab-count-all">0</span>)
            </button>
            <button data-filter="unread" class="filter-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-surface-container hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-white/5 cursor-pointer">
                Unread (<span id="tab-count-unread">0</span>)
            </button>
            <button data-filter="read" class="filter-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-surface-container hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-white/5 cursor-pointer">
                Read (<span id="tab-count-read">0</span>)
            </button>
            <button data-filter="requests" class="filter-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-surface-container hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-white/5 cursor-pointer">
                Requests (<span id="tab-count-requests">0</span>)
            </button>
        </div>

        <!-- Notifications Container -->
        <div id="notifications-list-container" class="space-y-3">
            <!-- Loading Skeleton -->
            <div class="space-y-3">
                <div class="p-4 bg-surface-container-low/50 rounded-2xl border border-white/5 animate-pulse flex items-start gap-4">
                    <div class="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-white/10 rounded w-1/4"></div>
                        <div class="h-3 bg-white/5 rounded w-3/4"></div>
                    </div>
                </div>
                <div class="p-4 bg-surface-container-low/50 rounded-2xl border border-white/5 animate-pulse flex items-start gap-4">
                    <div class="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-white/10 rounded w-1/3"></div>
                        <div class="h-3 bg-white/5 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    `;
}

export async function initNotifications() {
    const container = document.getElementById('notifications-list-container');
    if (!container) return;

    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        container.innerHTML = `
            <div class="p-12 text-center bg-surface-container-low/40 rounded-2xl border border-white/5 backdrop-blur-md max-w-lg mx-auto mt-6">
                <div class="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
                    <span class="material-symbols-outlined text-[32px]">lock</span>
                </div>
                <h3 class="text-lg font-bold text-on-surface mb-2">Sign in to view notifications</h3>
                <p class="text-xs text-on-surface-variant mb-6">Notifications are user-specific and securely persisted in your account. Please log in to see your project invites, meetings, and team requests.</p>
                <button data-form="login_form" class="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-all cursor-pointer">
                    Sign In to CodeCollab
                </button>
            </div>
        `;
        const dot = document.getElementById('nav-notifications-dot');
        if (dot) dot.classList.add('hidden');
        return;
    }

    let notifications = [];
    let currentFilter = 'all';

    async function loadNotifications() {
        try {
            const res = await window.apiFetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            notifications = Array.isArray(data) ? data : (data.notifications || []);
            updateCounts();
            renderList();
            if (window.updateNotificationBadge) {
                window.updateNotificationBadge();
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
            container.innerHTML = `
                <div class="p-8 text-center bg-surface-container-low/40 rounded-2xl border border-error/20 max-w-lg mx-auto">
                    <span class="material-symbols-outlined text-error text-[36px] mb-2 block">error</span>
                    <h3 class="text-sm font-bold text-on-surface mb-1">Failed to load notifications</h3>
                    <p class="text-xs text-on-surface-variant mb-4">There was a problem connecting to the server. Please try again.</p>
                    <button id="btn-retry-notifs" class="px-4 py-2 bg-surface-variant hover:bg-surface-container-high rounded-xl text-xs font-bold text-on-surface border border-white/10 transition-colors">
                        Retry
                    </button>
                </div>
            `;
            const retryBtn = document.getElementById('btn-retry-notifs');
            if (retryBtn) retryBtn.onclick = () => loadNotifications();
        }
    }

    function updateCounts() {
        const unreadCount = notifications.filter(n => !n.read).length;
        const readCount = notifications.filter(n => n.read).length;
        const requestsCount = notifications.filter(n => n.type && (n.type.includes('JOIN') || n.type.includes('MEET') || n.type.includes('TEAM'))).length;

        const unreadCountText = document.getElementById('notif-unread-count-text');
        if (unreadCountText) {
            unreadCountText.textContent = `${unreadCount} Unread`;
        }

        const unreadBadge = document.getElementById('notif-unread-badge');
        if (unreadBadge) {
            if (unreadCount === 0) {
                unreadBadge.className = 'px-3 py-1.5 rounded-full bg-surface-container border border-white/10 text-on-surface-variant text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm';
                unreadBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-on-surface-variant/40"></span> 0 Unread`;
            } else {
                unreadBadge.className = 'px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm';
                unreadBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span> ${unreadCount} Unread`;
            }
        }

        const tabAll = document.getElementById('tab-count-all');
        if (tabAll) tabAll.textContent = notifications.length;

        const tabUnread = document.getElementById('tab-count-unread');
        if (tabUnread) tabUnread.textContent = unreadCount;

        const tabRead = document.getElementById('tab-count-read');
        if (tabRead) tabRead.textContent = readCount;

        const tabRequests = document.getElementById('tab-count-requests');
        if (tabRequests) tabRequests.textContent = requestsCount;

        const markAllBtn = document.getElementById('btn-mark-all-read');
        if (markAllBtn) {
            markAllBtn.disabled = unreadCount === 0;
        }

        const navDot = document.getElementById('nav-notifications-dot');
        if (navDot) {
            if (unreadCount > 0) {
                navDot.classList.remove('hidden');
            } else {
                navDot.classList.add('hidden');
            }
        }
    }

    function getFilteredNotifications() {
        if (currentFilter === 'unread') {
            return notifications.filter(n => !n.read);
        }
        if (currentFilter === 'read') {
            return notifications.filter(n => n.read);
        }
        if (currentFilter === 'requests') {
            return notifications.filter(n => n.type && (n.type.includes('JOIN') || n.type.includes('MEET') || n.type.includes('TEAM')));
        }
        return notifications;
    }

    function renderList() {
        const filtered = getFilteredNotifications();

        if (filtered.length === 0) {
            let emptyMsg = "You're all caught up! When project invites, meetings, or responses arrive, they'll appear here.";
            let emptyTitle = "No notifications yet";
            if (currentFilter === 'unread') {
                emptyMsg = "You have read all your notifications.";
                emptyTitle = "No unread notifications";
            } else if (currentFilter === 'requests') {
                emptyMsg = "You have no pending or past project join or meeting requests.";
                emptyTitle = "No request notifications";
            }

            container.innerHTML = `
                <div class="p-12 text-center bg-surface-container-low/30 rounded-2xl border border-white/5 backdrop-blur-sm max-w-md mx-auto my-6">
                    <div class="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/50 mx-auto mb-3">
                        <span class="material-symbols-outlined text-[28px]">notifications_off</span>
                    </div>
                    <h3 class="text-sm font-bold text-on-surface mb-1">${emptyTitle}</h3>
                    <p class="text-xs text-on-surface-variant leading-relaxed">${emptyMsg}</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(n => {
            const config = getNotificationConfig(n);
            const formattedTime = timeAgo(n.createdAt);
            const isUnread = !n.read;

            const cardClasses = isUnread
                ? 'border-l-4 border-l-primary bg-surface-container-high/80 border-white/10 hover:border-primary/40 shadow-sm'
                : 'border-l-4 border-l-transparent bg-surface-container-low/40 border-white/5 opacity-85 hover:opacity-100';

            html += `
                <div class="p-4 md:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group ${cardClasses}" data-id="${n.id}">
                    <div class="flex items-start gap-3.5 min-w-0 flex-1">
                        <!-- Icon Badge -->
                        <div class="w-10 h-10 rounded-xl ${config.color} border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                            <span class="material-symbols-outlined text-[20px]">${config.icon}</span>
                        </div>

                        <!-- Content -->
                        <div class="min-w-0 flex-1 space-y-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.color} border">
                                    ${config.badge}
                                </span>
                                ${isUnread ? '<span class="w-2 h-2 rounded-full bg-primary inline-block"></span>' : ''}
                                <span class="text-[11px] text-on-surface-variant/60 font-mono ml-auto md:ml-0">${formattedTime}</span>
                            </div>
                            <h4 class="text-sm font-bold text-on-surface leading-tight">${escapeHtml(n.title)}</h4>
                            <p class="text-xs text-on-surface-variant leading-relaxed">${escapeHtml(n.message)}</p>
                            ${n.project?.title ? `
                                <div class="text-[11px] text-primary/80 font-medium pt-0.5 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[14px]">folder</span>
                                    <span>${escapeHtml(n.project.title)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Action Controls -->
                    <div class="flex items-center gap-2 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto justify-end">
                        ${config.actionUrl ? `
                            <a href="${config.actionUrl}" class="px-3 py-1.5 bg-surface-container hover:bg-surface-variant text-on-surface border border-white/5 hover:border-primary/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                                <span>${config.actionText}</span>
                                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </a>
                        ` : ''}

                        ${isUnread ? `
                            <button data-action="mark-read" data-id="${n.id}" class="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                                <span class="material-symbols-outlined text-[14px]">done</span>
                                Mark Read
                            </button>
                        ` : ''}

                        <button data-action="delete" data-id="${n.id}" title="Delete notification" class="p-1.5 text-on-surface-variant/50 hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Bind Mark Read buttons
        container.querySelectorAll('[data-action="mark-read"]').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                try {
                    btn.disabled = true;
                    btn.innerHTML = `<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span>`;
                    const res = await window.apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
                    if (res.ok) {
                        const notif = notifications.find(x => x.id === id);
                        if (notif) notif.read = true;
                        updateCounts();
                        renderList();
                        if (window.updateNotificationBadge) window.updateNotificationBadge();
                    }
                } catch (err) {
                    console.error('Error marking notification as read:', err);
                }
            };
        });

        // Bind Delete buttons
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                try {
                    const res = await window.apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        notifications = notifications.filter(x => x.id !== id);
                        updateCounts();
                        renderList();
                        if (window.updateNotificationBadge) window.updateNotificationBadge();
                        if (window.UI && window.UI.showToast) {
                            window.UI.showToast('Notification deleted', 'info');
                        }
                    }
                } catch (err) {
                    console.error('Error deleting notification:', err);
                }
            };
        });
    }

    // Filter tab clicks
    const filterTabs = document.querySelectorAll('#notif-filter-tabs .filter-tab');
    filterTabs.forEach(tab => {
        tab.onclick = () => {
            const filter = tab.getAttribute('data-filter');
            currentFilter = filter;

            filterTabs.forEach(t => {
                if (t === tab) {
                    t.className = 'filter-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-primary text-on-primary shadow-md shadow-primary/20 cursor-pointer';
                } else {
                    t.className = 'filter-tab px-4 py-2 rounded-xl text-xs font-bold transition-all bg-surface-container hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-white/5 cursor-pointer';
                }
            });

            renderList();
        };
    });

    // Mark All As Read button
    const markAllBtn = document.getElementById('btn-mark-all-read');
    if (markAllBtn) {
        markAllBtn.onclick = async () => {
            try {
                markAllBtn.disabled = true;
                markAllBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> Marking...`;

                const res = await window.apiFetch('/api/notifications/read-all', { method: 'POST' });
                if (res.ok) {
                    notifications.forEach(n => n.read = true);
                    updateCounts();
                    renderList();
                    if (window.updateNotificationBadge) window.updateNotificationBadge();
                    if (window.UI && window.UI.showToast) {
                        window.UI.showToast('All notifications marked as read', 'success');
                    }
                }
            } catch (err) {
                console.error('Error marking all notifications as read:', err);
            } finally {
                if (markAllBtn) {
                    markAllBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">done_all</span> Mark All as Read`;
                }
            }
        };
    }

    // Initial load
    await loadNotifications();
}
