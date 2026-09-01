document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const nebulaBg = document.getElementById('nebula-bg');
    const viewCache = {};

    // Canonical HTML escape helper in app scope
    const escapeHtml = window.escapeHtml = window.UI?.escapeHtml || function (str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Shared Password Visibility Toggle Handler
    window.togglePasswordVisibility = function (inputId, triggerElement) {
        const input = (typeof inputId === 'string') ? document.getElementById(inputId) : inputId;
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        const btn = triggerElement || input.parentElement?.querySelector('[data-toggle-password]');
        if (btn) {
            const icon = btn.querySelector('.material-symbols-outlined');
            const label = btn.querySelector('.password-toggle-label');
            if (icon) {
                icon.textContent = isPassword ? 'visibility_off' : 'visibility';
            }
            if (label) {
                label.textContent = isPassword ? 'Hide' : 'Show';
            }
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        }
    };

    // Event delegation for password toggle buttons
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-toggle-password]');
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            const targetId = toggleBtn.getAttribute('data-toggle-password');
            const targetInput = targetId ? document.getElementById(targetId) : toggleBtn.closest('.relative')?.querySelector('input');
            if (targetInput) {
                window.togglePasswordVisibility(targetInput, toggleBtn);
            }
        }
    });

    // --------------------------------------------------------------------------
    // API URL Discovery & Production-Ready Request Client
    // --------------------------------------------------------------------------
    window.getApiBaseUrl = function () {
        // Priority 1: Explicit LocalStorage override (for local testing/staging overrides)
        const customStorageUrl = (typeof localStorage !== 'undefined') ? (localStorage.getItem('CODECOLLAB_API_BASE_URL') || '').trim() : '';
        if (customStorageUrl) return customStorageUrl.replace(/\/+$/, '');

        // Priority 2: Runtime injected environment configuration
        const runtimeUrl = (typeof window !== 'undefined') ? ((window.__ENV__ && window.__ENV__.API_BASE_URL) || window.API_BASE_URL || '').trim() : '';
        if (runtimeUrl) return runtimeUrl.replace(/\/+$/, '');

        // Priority 3: HTML Meta Tag (<meta name="api-base-url" content="...">)
        if (typeof document !== 'undefined') {
            const metaTag = document.querySelector('meta[name="api-base-url"]');
            if (metaTag) {
                const metaUrl = (metaTag.getAttribute('content') || '').trim();
                if (metaUrl) return metaUrl.replace(/\/+$/, '');
            }
        }

        // Priority 4: Production Netlify Domain Detection
        if (typeof window !== 'undefined' && window.location && window.location.hostname) {
            const host = window.location.hostname.toLowerCase();
            if (host === 'opensource-projects.netlify.app' || host.endsWith('.netlify.app')) {
                return 'https://jubilant-octo-potato-production.up.railway.app';
            }
        }

        // Priority 5: Current Origin fallback
        const originUrl = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : '';
        return (originUrl || 'https://jubilant-octo-potato-production.up.railway.app').replace(/\/+$/, '');
    };

    // Safe Production Diagnostic Probe Utility
    window.diagnoseBackendConnection = async function (customUrl = null) {
        const baseUrl = customUrl || window.getApiBaseUrl();
        const healthUrl = `${baseUrl.replace(/\/+$/, '')}/health`;
        const diagnostic = {
            timestamp: new Date().toISOString(),
            online: typeof navigator !== 'undefined' ? navigator.onLine : true,
            apiBaseUrl: baseUrl,
            healthUrl: healthUrl,
            status: 'UNKNOWN',
            httpStatus: null,
            latencyMs: null,
            details: ''
        };

        const startTime = Date.now();
        try {
            if (!diagnostic.online) {
                diagnostic.status = 'ERR_OFFLINE';
                diagnostic.details = 'Browser is offline. No internet connection detected.';
                console.warn('[CodeCollab Connection Diagnostics]', diagnostic);
                return diagnostic;
            }

            const response = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
            diagnostic.latencyMs = Date.now() - startTime;
            diagnostic.httpStatus = response.status;

            if (response.ok) {
                diagnostic.status = 'CONNECTED';
                diagnostic.backendData = await response.json().catch(() => null);
                diagnostic.details = 'Backend is healthy, online, and responding normally.';
            } else {
                diagnostic.status = 'ERR_HTTP_STATUS';
                diagnostic.details = `Backend returned HTTP status ${response.status} (${response.statusText})`;
            }
        } catch (err) {
            diagnostic.latencyMs = Date.now() - startTime;
            if (err.name === 'AbortError') {
                diagnostic.status = 'ERR_TIMEOUT';
                diagnostic.details = 'Backend health check timed out.';
            } else if (!diagnostic.online) {
                diagnostic.status = 'ERR_OFFLINE';
                diagnostic.details = 'Device went offline during connection attempt.';
            } else {
                diagnostic.status = 'ERR_CORS_OR_NETWORK';
                diagnostic.details = 'Network request failed. This indicates a CORS origin mismatch, DNS failure, or unreachable server.';
            }
        }

        console.info('[CodeCollab Connection Diagnostics]', diagnostic);
        return diagnostic;
    };

    window.apiFetch = async function (endpoint, options = {}) {
        const baseUrl = window.getApiBaseUrl();
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

        const headers = { ...options.headers };
        if (!headers['Content-Type'] && !(options.body instanceof FormData) && options.method && options.method.toUpperCase() !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }

        // Attach Authorization header if user is logged in
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr && !url.includes('/api/auth/')) {
            try {
                const currentUser = JSON.parse(currentUserStr);
                if (currentUser.token) {
                    headers['Authorization'] = `Bearer ${currentUser.token}`;
                }
            } catch (e) { }
        }

        const fetchOptions = { cache: 'no-store', ...options, headers };
        
        let response;
        try {
            response = await fetch(url, fetchOptions);
        } catch (fetchErr) {
            const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
            const errCategory = isOffline ? 'ERR_OFFLINE' : 'ERR_CORS_OR_NETWORK';
            const userFriendlyMsg = isOffline
                ? 'You are offline. Please check your internet connection.'
                : 'Unable to reach backend server (CORS / Network restriction). Please check connection or try again.';

            console.warn(`[CodeCollab API Diagnostic] Request to ${cleanEndpoint} failed. Target: ${baseUrl}. Category: ${errCategory}.`, {
                endpoint: cleanEndpoint,
                category: errCategory,
                online: !isOffline,
                error: fetchErr.message
            });

            const enrichedError = new Error(userFriendlyMsg);
            enrichedError.code = errCategory;
            enrichedError.originalError = fetchErr;
            throw enrichedError;
        }

        if (response.status === 401) {
            localStorage.removeItem('currentUser');
            if (window.updateAuthUI) window.updateAuthUI();
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Session expired. Please log in again.', 'error');
            }
            throw new Error('Session expired');
        } else if (response.status === 403) {
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('You do not have permission to perform this action.', 'error');
            }
            throw new Error('Forbidden');
        }

        return response;
    };

    window.updateNotificationBadge = async function () {
        const dot = document.getElementById('nav-notifications-dot');
        if (!dot) return;
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) {
            dot.classList.add('hidden');
            return;
        }
        try {
            const res = await window.apiFetch('/api/notifications/unread');
            if (res && res.ok) {
                const data = await res.json();
                const unreadCount = Number(data.unreadCount ?? data.count) || 0;
                if (unreadCount > 0) {
                    dot.classList.remove('hidden');
                } else {
                    dot.classList.add('hidden');
                }
            } else {
                dot.classList.add('hidden');
            }
        } catch (e) {
            dot.classList.add('hidden');
        }
    };

    window.updateAuthUI = function () {
        // Update UI based on authentication status (show/hide login, profile, hero CTA, etc.)
        const currentUserStr = localStorage.getItem('currentUser');
        const authButtons = document.getElementById('auth-buttons-container');
        const profileDropdown = document.getElementById('profile-dropdown-container');
        const profileAvatar = document.getElementById('profile-avatar');
        const heroCtaBtn = document.getElementById('hero-cta-btn');
        let user = null;
        if (currentUserStr) {
            try {
                user = JSON.parse(currentUserStr);
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }

        if (user) {
            if (authButtons) {
                authButtons.classList.add('hidden');
                authButtons.classList.remove('md:flex', 'flex');
            }
            if (profileDropdown) profileDropdown.classList.remove('hidden');
            if (profileAvatar) profileAvatar.textContent = (user.name ? user.name.charAt(0) : 'U').toUpperCase();
            if (heroCtaBtn) {
                heroCtaBtn.removeAttribute('data-form');
                heroCtaBtn.setAttribute('onclick', "window.location.hash='dashboard'");
                heroCtaBtn.setAttribute('title', 'Dashboard');
                heroCtaBtn.innerHTML = `
                    <span class="material-symbols-outlined text-[20px] text-secondary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">dashboard</span>
                    <span>Dashboard</span>
                `;
            }
        } else {
            if (authButtons) {
                authButtons.classList.remove('hidden');
                authButtons.classList.add('hidden', 'md:flex');
            }
            if (profileDropdown) profileDropdown.classList.add('hidden');
            if (profileAvatar) profileAvatar.textContent = 'U';
            if (heroCtaBtn) {
                heroCtaBtn.removeAttribute('onclick');
                heroCtaBtn.setAttribute('data-form', 'sign_up_form');
                heroCtaBtn.setAttribute('title', 'Sign Up');
                heroCtaBtn.innerHTML = `
                    <span class="material-symbols-outlined text-[20px] text-secondary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">rocket_launch</span>
                    <span>Sign Up</span>
                `;
            }
        }

        window.updateNotificationBadge();
    };

    // Call it initially
    window.updateAuthUI();

    // Live periodic check for notifications every 15 seconds
    setInterval(() => {
        if (localStorage.getItem('currentUser')) {
            window.updateNotificationBadge();
        }
    }, 15000);

    window.renderProjectCard = function (p) {
        const safeTechStack = Array.isArray(p.techStack) ? p.techStack : (typeof p.techStack === 'string' ? p.techStack.split(',').map(s => s.trim()) : []);
        const techBadges = safeTechStack.map(tech =>
            `<span class="px-2.5 py-1 bg-surface-container-highest rounded-full text-[11px] font-medium text-on-surface-variant border border-white/5">${tech}</span>`
        ).join('');
        const demoBadge = p.isDemo ? `<span class="ml-2 px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-md text-[10px] font-bold uppercase tracking-wider">Demo</span>` : '';
        const ownerName = p.owner?.name || (p.ownerId ? `Developer #${p.ownerId}` : 'Open Source');
        const ownerInitial = ownerName.charAt(0).toUpperCase();
        const ownerDisplay = `<div class="flex items-center gap-2 text-xs text-on-surface-variant mb-3"><div class="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-[11px] font-bold flex items-center justify-center border border-secondary/30">${ownerInitial}</div><span class="truncate font-medium">By ${escapeHtml(ownerName)}</span></div>`;

        return `
        <div class="glass-card bg-surface-container-low/50 backdrop-blur-md rounded-[22px] border border-white/10 flex flex-col group overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 p-6" data-project-id="${p.id || ''}">
            <div class="flex items-center justify-between gap-2 mb-4">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-wider">
                        ${escapeHtml(p.category || 'Engineering')}
                    </span>
                    <span class="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-[10px] font-semibold uppercase">
                        ${escapeHtml(p.difficulty || 'Intermediate')}
                    </span>
                </div>
                ${p.isPinned ? `<span class="px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded text-[10px] font-bold uppercase tracking-wider">Pinned</span>` : ''}
            </div>

            <h4 class="font-bold text-xl text-on-surface mb-2 group-hover:text-primary transition-colors leading-tight flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">terminal</span>
                <span class="truncate">${escapeHtml(p.title || 'Untitled Project')}</span>${demoBadge}
            </h4>
            ${ownerDisplay}
            <p class="text-sm text-on-surface-variant line-clamp-3 mb-5 flex-1 leading-relaxed">${escapeHtml(p.description || 'Collaborative open-source software project on CodeCollab.')}</p>
            
            <div class="flex flex-wrap gap-1.5 mb-6">${techBadges}</div>

            <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                ${p.githubUrl ? `
                    <a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg>
                        <span>Code</span>
                    </a>
                ` : ''}
                <a href="#issues?projectId=${p.id}" class="flex-1 flex justify-center items-center gap-1 px-3 py-2.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl text-xs font-bold hover:bg-secondary hover:text-on-secondary transition-all active:scale-95">
                    <span class="material-symbols-outlined text-[14px]">view_kanban</span> Issues
                </a>
                <a href="#project_details?projectId=${p.id}" class="flex-1 flex justify-center items-center gap-1 px-3 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95">
                    <span class="material-symbols-outlined text-[14px]">visibility</span> View
                </a>
            </div>
        </div>`;
    };

    async function navigate() {
        // SPA navigation: parse hash, load appropriate view, and fetch dynamic data
        window.updateAuthUI();
        let rawHash = window.location.hash.substring(1);
        if (!rawHash && typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            rawHash = window.location.pathname.substring(1);
        }
        let hash = rawHash || 'home';
        const cleanHash = hash.replace(/^\/+|\/+$/g, '');
        let rawViewName = cleanHash.split('?')[0].toLowerCase().replace(/-/g, '_');
        if (rawViewName === 'community_hub') rawViewName = 'community';
        if (rawViewName === 'home_explore') rawViewName = 'explore';
        if (rawViewName === 'profile') rawViewName = 'user_profile';
        if (rawViewName === 'user-profile') rawViewName = 'user_profile';
        if (rawViewName === 'project-details') rawViewName = 'project_details';
        const viewName = rawViewName || 'home';
        const urlParams = new URLSearchParams(cleanHash.split('?')[1] || '');
        const projectId = urlParams.get('projectId') || urlParams.get('id');

        // AI Chat feature disabled as per request
        if (viewName === 'ai_chat') {
            window.location.hash = 'home';
            return;
        }

        // Ensure any active modal is closed on view change
        if (window.UI && window.UI.closeModal) {
            window.UI.closeModal();
        }

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

        // Clear previous navigation timeout and start 10s fallback timer
        if (window.PageLoadState) {
            window.PageLoadState.clearTimer();
            window.PageLoadState.startTimeout(viewName, 10000, () => {
                if (appContent) {
                    window.PageLoadState.renderFallback(appContent, viewName, 'timeout');
                }
            });
            window.PageLoadState.renderSkeleton(appContent, viewName);
        }

        try {
            let module;
            try {
                module = await import(`./views/${viewName}.js?t=${Date.now()}`);
            } catch (e) {
                try {
                    module = await import(`./views/${viewName}.js`);
                } catch (e2) {
                    console.warn(`Module import error for view '${viewName}'`, e2);
                }
            }

            let html = '';
            if (module) {
                const funcName = `render_${viewName.replace(/-/g, '_')}`;
                if (module[funcName]) {
                    html = module[funcName]();
                } else {
                    throw new Error(`Export ${funcName} not found in views/${viewName}.js`);
                }
            } else if (viewCache[viewName]) {
                html = viewCache[viewName];
            }

            if (!html) {
                throw new Error(`View template for '${viewName}' could not be loaded`);
            }

            appContent.innerHTML = html;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Initialize Home view
            if (viewName === 'home' && module && module.initHome) {
                await module.initHome();
            }

            // Initialize Explore view
            if ((viewName === 'explore' || viewName === 'home_explore') && module && module.initExplore) {
                await module.initExplore();
            }

            // Initialize Add Project view
            if (viewName === 'add_project' && module && module.initAddProject) {
                await module.initAddProject();
            }

            // Initialize Organizations view
            if (viewName === 'organizations' && module && module.initOrganizations) {
                await module.initOrganizations();
            }

            // Initialize Issues view
            if (viewName === 'issues' && module && module.initIssues) {
                await module.initIssues(projectId);
            }

            // Initialize Project Details view
            if ((viewName === 'project_details' || viewName === 'project-details') && module && module.initProjectDetails) {
                await module.initProjectDetails(projectId);
            }

            // Initialize Dashboard view
            if (viewName === 'dashboard') {
                if (module && module.initDashboard) {
                    await module.initDashboard();
                } else if (window.initDashboard) {
                    await window.initDashboard();
                }
            }

            // Initialize Community view
            if (viewName === 'community' && module && module.initCommunity) {
                await module.initCommunity();
            }

            // Initialize Settings view
            if (viewName === 'settings' && module && module.initSettings) {
                await module.initSettings();
            }

            // Initialize User Profile view
            if ((viewName === 'user_profile' || viewName === 'user-profile' || viewName === 'profile') && module && module.initUserProfile) {
                await module.initUserProfile(urlParams.get('id') || urlParams.get('userId') || projectId);
            }

            // Initialize Notifications view
            if (viewName === 'notifications' && module && module.initNotifications) {
                await module.initNotifications();
            }

            // Initialize Leaderboard view
            if (viewName === 'leaderboard' && module && module.initLeaderboard) {
                await module.initLeaderboard();
            }

            // Initialize Team Collaboration view
            if (viewName === 'team_collaboration' && module && module.initTeam_collaboration) {
                await module.initTeam_collaboration();
            }

            // Initialize Three.js simulation view
            if (viewName === 'three_js' && module && module.initThree_js) {
                await module.initThree_js();
            }

            // Update notification badge on navigation
            window.updateNotificationBadge();

            // Clear timer on successful load & initialization
            if (window.PageLoadState) {
                window.PageLoadState.clearTimer();
            }

            // Execute inline scripts if any
            appContent.querySelectorAll('script').forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) newScript.src = script.src;
                else newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
            });
        } catch (error) {
            console.warn(`[CodeCollab Router] Error navigating to '${viewName}':`, error.message || error);
            if (window.PageLoadState) {
                window.PageLoadState.renderFallback(appContent, viewName, 'error', error);
            } else {
                appContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center min-h-[60vh] text-error">
                        <span class="material-symbols-outlined text-[64px] mb-md">sentiment_dissatisfied</span>
                        <h2 class="text-headline-lg font-display mb-sm">Page Not Found</h2>
                        <p class="text-on-surface-variant mb-lg">The requested view '${viewName}' does not exist.</p>
                        <button onclick="window.location.hash='home'" class="px-xl py-sm bg-primary text-on-primary rounded-lg font-bold shadow-lg hover:bg-primary-container transition-colors">Return Home</button>
                    </div>
                `;
            }
        }
    }

    // Scroll Progress for Nebula Background (Camera animation driven in index.html)
    // Scroll listener: adjust nebula background opacity/blur based on current view
    window.addEventListener('scroll', () => {
        // No longer translating the nebulaBg directly, it remains fixed.
        // The ThreeJS script in index.html will read window.scrollY.
    });

    // Global Link Interceptor & Action Handler
    // Global click interceptor: handle internal navigation, logout, modals, and action buttons
    document.body.addEventListener('click', (e) => {
        // Toggle profile dropdown on avatar click and close when clicked outside or on a link
        const profileAvatarBtn = e.target.closest('#profile-avatar');
        const menu = document.getElementById('profile-dropdown-menu');
        if (profileAvatarBtn && menu) {
            menu.classList.toggle('!opacity-100');
            menu.classList.toggle('!visible');
        } else if (menu && (e.target.closest('#profile-dropdown-menu a') || !e.target.closest('#profile-dropdown-container'))) {
            menu.classList.remove('!opacity-100', '!visible');
        }
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');

            if (link.id === 'logout-btn') {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                window.updateAuthUI();
                window.UI.showToast('Successfully logged out', 'success');
                if (window.location.hash.includes('dashboard')) window.location.hash = 'home';
                return;
            }

            if (href && href.startsWith('/')) {
                e.preventDefault();
                window.location.hash = href.substring(1) || 'home';
            }
        }
        const formBtn = e.target.closest('[data-form]');
        if (formBtn) {
            e.preventDefault();
            const formName = formBtn.getAttribute('data-form');

            const protectedForms = [
                'add_project_form', 'create_org_form', 'edit_profile_form',
                'add_issue_form', 'create_team_form', 'update_availability_form',
                'create_looking_for_form', 'join_team_form'
            ];
            if (protectedForms.includes(formName) && !localStorage.getItem('currentUser')) {
                window.UI.showToast('Please log in to access this feature', 'error');
                return;
            }

            if (formName === 'edit_profile_form') {
                (async () => {
                    try {
                        const res = await window.apiFetch('/api/users/profile');
                        let userData = {};
                        if (res.ok) {
                            userData = await res.json();
                        } else {
                            const curStr = localStorage.getItem('currentUser');
                            if (curStr) userData = JSON.parse(curStr);
                        }
                        const module = await import(`./forms/edit_profile_form.js?t=${Date.now()}`);
                        const html = module.render_edit_profile_form(userData);
                        window.UI.openModal(html);
                        if (module.initEditProfileForm) {
                            module.initEditProfileForm(userData);
                        }
                    } catch (err) {
                        console.error('Error opening edit profile form:', err);
                        window.UI.showToast('Failed to load profile data', 'error');
                    }
                })();
                return;
            }

            if (formName === 'update_availability_form') {
                (async () => {
                    try {
                        const curStr = localStorage.getItem('currentUser');
                        let userData = curStr ? JSON.parse(curStr) : {};
                        const res = await window.apiFetch('/api/users/profile');
                        if (res.ok) {
                            userData = await res.json();
                        }
                        const module = await import(`./forms/update_availability_form.js?t=${Date.now()}`);
                        const html = module.render_update_availability_form(userData);
                        window.UI.openModal(html);
                        if (module.initUpdateAvailabilityForm) {
                            module.initUpdateAvailabilityForm(userData);
                        }
                    } catch (err) {
                        console.error('Error opening availability form:', err);
                        window.UI.showToast('Failed to load availability form', 'error');
                    }
                })();
                return;
            }

            if (formName === 'create_team_form') {
                (async () => {
                    try {
                        const module = await import(`./forms/create_team_form.js?t=${Date.now()}`);
                        const html = module.render_create_team_form();
                        window.UI.openModal(html);
                        if (module.initCreateTeamForm) {
                            module.initCreateTeamForm();
                        }
                    } catch (err) {
                        console.error('Error opening create team form:', err);
                        window.UI.showToast('Failed to load team form', 'error');
                    }
                })();
                return;
            }

            if (formName === 'create_looking_for_form') {
                (async () => {
                    try {
                        const module = await import(`./forms/create_looking_for_form.js?t=${Date.now()}`);
                        const html = module.render_create_looking_for_form();
                        window.UI.openModal(html);
                        if (module.initCreateLookingForForm) {
                            module.initCreateLookingForForm();
                        }
                    } catch (err) {
                        console.error('Error opening looking-for form:', err);
                        window.UI.showToast('Failed to load looking-for form', 'error');
                    }
                })();
                return;
            }

            if (formName === 'join_team_form') {
                (async () => {
                    try {
                        const teamId = formBtn.getAttribute('data-team-id') || '';
                        const teamName = formBtn.getAttribute('data-team-name') || 'Team';
                        const position = formBtn.getAttribute('data-position') || '';
                        const leadName = formBtn.getAttribute('data-lead-name') || 'Team Lead';

                        const module = await import(`./forms/join_team_form.js?t=${Date.now()}`);
                        const html = module.render_join_team_form({ teamId, teamName, position, leadName });
                        window.UI.openModal(html);
                        if (module.initJoinTeamForm) {
                            module.initJoinTeamForm({ teamId, teamName, position, leadName });
                        }
                    } catch (err) {
                        console.error('Error opening join team form:', err);
                        window.UI.showToast('Failed to load application form', 'error');
                    }
                })();
                return;
            }

            import(`./forms/${formName}.js?t=${Date.now()}`)
                .then(module => {
                    const funcName = `render_${formName.replace(/-/g, '_')}`;
                    if (module[funcName]) {
                        const status = formBtn.getAttribute('data-status') || 'TODO';
                        const html = formName === 'add_issue_form'
                            ? module[funcName](status, window.currentActiveProjectId || '', window.currentActiveProjectTitle || '')
                            : module[funcName]();
                        window.UI.openModal(html);
                    } else {
                        throw new Error(`Export ${funcName} not found`);
                    }
                })
                .catch(err => {
                    console.error(err);
                    window.UI.showToast('Error loading form', 'error');
                });
            return;
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

    // Global Form Submit Interceptor
    // Global form submit handler: process auth forms and generic data forms, POST to backend APIs
    document.addEventListener('submit', async (e) => {
        const form = e.target;

        // Handle auth forms specifically
        if (form.id === 'signUpForm' || form.id === 'loginForm') {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Extract from un-named inputs just in case
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.name) data[input.name] = input.value;
                else if (input.type === 'email') data['email'] = input.value;
                else if (input.type === 'password') data['password'] = input.value;
                else if (input.type === 'tel') data['mobileNumber'] = input.value;
            });

            // Name field might be required for signup
            if (form.id === 'signUpForm' && !data.name) {
                const textInput = form.querySelector('input[type="text"]');
                if (textInput) data.name = textInput.value;
            }

            // Mobile number field for login
            if (form.id === 'loginForm' && !data.mobileNumber) {
                const telInput = form.querySelector('input[type="tel"], input[name="mobileNumber"], input[name="phoneNumber"]');
                if (telInput) data.mobileNumber = telInput.value;
            }

            const endpoint = form.id === 'signUpForm' ? '/api/auth/signup' : '/api/auth/login';

            try {
                const response = await window.apiFetch(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('currentUser', JSON.stringify(result));
                    window.updateAuthUI();
                    window.UI.closeModal();
                    window.UI.showToast(form.id === 'signUpForm' ? 'Account created!' : 'Welcome back!', 'success');
                } else {
                    window.UI.showToast(result.error || 'Authentication failed', 'error');
                }
            } catch (error) {
                console.error('Auth submission error:', error);
                const toastMsg = error.code === 'ERR_OFFLINE'
                    ? 'You are offline. Please check your internet connection.'
                    : (error.code === 'ERR_CORS_OR_NETWORK'
                        ? 'Unable to reach backend server. Please verify network connection.'
                        : (error.message || 'Error connecting to backend.'));
                window.UI.showToast(toastMsg, 'error');
            }
            return;
        }

        if (form.id === 'addIssueForm') {
            // Handled directly by window.handleAddIssue
            return;
        }

        if (form.id === 'editProfileForm') {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                if (input.name) data[input.name] = input.value;
            });

            try {
                const response = await window.apiFetch('/api/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    const curUserStr = localStorage.getItem('currentUser');
                    if (curUserStr) {
                        try {
                            const cur = JSON.parse(curUserStr);
                            localStorage.setItem('currentUser', JSON.stringify({
                                ...cur,
                                ...updatedUser,
                                token: cur.token,
                                refreshToken: cur.refreshToken
                            }));
                        } catch (e) {
                            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        }
                    }
                    window.updateAuthUI();
                    window.UI.closeModal();
                    window.UI.showToast('Profile updated successfully!', 'success');

                    if (window.location.hash.includes('user_profile') || window.location.hash.includes('profile') || window.location.hash.includes('settings')) {
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                    }
                } else {
                    const err = await response.json().catch(() => ({}));
                    window.UI.showToast(err.error || 'Failed to save profile.', 'error');
                }
            } catch (error) {
                console.error('Error saving profile:', error);
                const toastMsg = error.code === 'ERR_OFFLINE'
                    ? 'You are offline. Please check your internet connection.'
                    : (error.code === 'ERR_CORS_OR_NETWORK'
                        ? 'Unable to reach backend server. Please verify network connection.'
                        : (error.message || 'Error connecting to backend.'));
                window.UI.showToast(toastMsg, 'error');
            }
            return;
        }

        const formIdToTable = {
            'addProjectForm': 'projects',
            'createOrgForm': 'organizations'
        };

        const table = formIdToTable[form.id];

        if (table) {
            e.preventDefault();

            // Gather form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // For projects, collect all checked memberIds into an array
            if (form.id === 'addProjectForm') {
                const memberIds = formData.getAll('memberIds');
                data.memberIds = memberIds;
            }

            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name) {
                    data[input.name] = input.value;
                } else if (input.type === 'email') {
                    data['email'] = input.value;
                } else if (input.type === 'password') {
                    data['password'] = input.value;
                } else if (input.type === 'text') {
                    data[input.placeholder || 'text'] = input.value;
                }
            });

            try {
                const response = await window.apiFetch(`/api/${table}`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    window.UI.showToast('Project created successfully!', 'success');
                    window.UI.closeModal();
                    if (table === 'projects') {
                        const gridElement = document.getElementById('explore-projects-container') || document.getElementById('project-grid');
                        if (gridElement) {
                            response.json().then(newProject => {
                                const newCardHtml = window.renderProjectCard(newProject);
                                gridElement.insertAdjacentHTML('beforeend', newCardHtml);
                            }).catch(err => console.error('Failed to parse newly created project:', err));
                        }
                    }
                } else {
                    window.UI.showToast('Failed to save data.', 'error');
                }
            } catch (error) {
                console.error('Error saving data:', error);
                const toastMsg = error.code === 'ERR_OFFLINE'
                    ? 'You are offline. Please check your internet connection.'
                    : (error.code === 'ERR_CORS_OR_NETWORK'
                        ? 'Unable to reach backend server. Please verify network connection.'
                        : (error.message || 'Error connecting to backend.'));
                window.UI.showToast(toastMsg, 'error');
            }
        }
    });
});