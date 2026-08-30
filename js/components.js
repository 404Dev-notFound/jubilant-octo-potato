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
    },

    createPageSkeleton: (viewName = 'page') => {
        return `
            <main class="w-full max-w-[1400px] mx-auto p-xl flex flex-col pt-6 min-h-[70vh]">
                <!-- Header Skeleton -->
                <div class="flex justify-between items-center mb-lg">
                    <div class="space-y-sm">
                        <div class="w-64 h-8 rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                        <div class="w-40 h-4 rounded-lg bg-white/5 animate-pulse border border-white/5"></div>
                    </div>
                    <div class="w-32 h-10 rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                </div>

                <!-- Primary Content Cards Grid Skeleton -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
                    <div class="h-32 rounded-xl bg-white/5 animate-pulse border border-white/5 p-md"></div>
                    <div class="h-32 rounded-xl bg-white/5 animate-pulse border border-white/5 p-md"></div>
                    <div class="h-32 rounded-xl bg-white/5 animate-pulse border border-white/5 p-md"></div>
                </div>

                <!-- Main Layout Skeleton -->
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-lg">
                    <div class="xl:col-span-2 space-y-md">
                        <div class="h-64 rounded-xl bg-white/5 animate-pulse border border-white/5 p-lg"></div>
                        <div class="h-48 rounded-xl bg-white/5 animate-pulse border border-white/5 p-lg"></div>
                    </div>
                    <div class="space-y-md">
                        <div class="h-40 rounded-xl bg-white/5 animate-pulse border border-white/5 p-md"></div>
                        <div class="h-64 rounded-xl bg-white/5 animate-pulse border border-white/5 p-md"></div>
                    </div>
                </div>
            </main>
        `;
    },

    escapeHtml: (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    openContactAdmin: async (options = {}) => {
        try {
            const module = await import(`./forms/contact_admin_modal.js?t=${Date.now()}`);
            const html = module.render_contact_admin_modal(options);
            window.UI.openModal(html);
        } catch (err) {
            console.error('Failed to load contact admin modal:', err);
            window.UI.showToast('Contact administrator at scriptedbydev@gmail.com', 'info');
        }
    }
};

// Expose escapeHtml and openContactAdmin directly on window object as global utilities
window.escapeHtml = window.UI.escapeHtml;
window.openContactAdmin = window.UI.openContactAdmin;

// Global Page Load & Timeout Fallback Controller
window.PageLoadState = {
    activeTimer: null,
    currentView: null,

    startTimeout: (viewName, duration = 10000, onTimeout) => {
        if (window.PageLoadState.activeTimer) {
            clearTimeout(window.PageLoadState.activeTimer);
        }
        window.PageLoadState.currentView = viewName;
        window.PageLoadState.activeTimer = setTimeout(() => {
            window.PageLoadState.activeTimer = null;
            if (onTimeout) onTimeout();
        }, duration);
    },

    clearTimer: () => {
        if (window.PageLoadState.activeTimer) {
            clearTimeout(window.PageLoadState.activeTimer);
            window.PageLoadState.activeTimer = null;
        }
    },

    renderSkeleton: (container, viewName) => {
        if (!container) return;
        container.innerHTML = window.UI.createPageSkeleton(viewName);
    },

    renderFallback: (container, viewName, state = 'timeout', error = null) => {
        window.PageLoadState.clearTimer();
        if (!container) return;

        // Non-sensitive diagnostic logging for developers
        if (error) {
            console.warn(`[CodeCollab PageLoadState] View '${viewName}' fallback triggered. State: ${state}. Category: ${error.code || error.message || 'UNKNOWN'}.`);
        } else {
            console.warn(`[CodeCollab PageLoadState] View '${viewName}' fallback triggered. State: ${state}.`);
        }

        container.innerHTML = `
            <main class="w-full max-w-[1400px] mx-auto p-xl flex flex-col items-center justify-center min-h-[65vh] pt-12 text-center animate-fade-in">
                <div class="glass-panel p-xl rounded-2xl border border-white/10 max-w-lg w-full shadow-2xl relative overflow-hidden my-8">
                    <!-- Subtle Futuristic Dual-Ring Orbital Element -->
                    <div class="relative w-24 h-24 mx-auto mb-lg flex items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" style="animation-duration: 3s;"></div>
                        <div class="absolute inset-2 rounded-full border-2 border-tertiary/20 border-b-tertiary animate-spin" style="animation-duration: 2s; animation-direction: reverse;"></div>
                        <span class="material-symbols-outlined text-[36px] text-primary relative z-10">build_circle</span>
                    </div>

                    <h2 class="font-display text-headline-md font-bold text-on-surface mb-sm">We're working on it</h2>
                    
                    <p class="text-on-surface-variant text-sm leading-relaxed mb-md">
                        This page is taking a little longer than expected. Our team has been notified, and we're working to get everything running smoothly.
                    </p>

                    <p class="text-xs text-on-surface-variant/70 mb-lg font-mono">
                        Please try again in a moment.
                    </p>

                    <div class="flex flex-col sm:flex-row items-center justify-center gap-sm">
                        <button onclick="window.PageLoadState.retry('${viewName}')" class="w-full sm:w-auto px-lg py-sm bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-xs">
                            <span class="material-symbols-outlined text-[18px]">refresh</span> Retry
                        </button>
                        <button onclick="window.location.hash='home'" class="w-full sm:w-auto px-lg py-sm bg-surface-variant hover:bg-outline-variant text-on-surface font-bold rounded-xl transition-all flex items-center justify-center gap-xs">
                            <span class="material-symbols-outlined text-[18px]">home</span> Go Home
                        </button>
                    </div>
                </div>
            </main>
        `;
    },

    retry: (viewName) => {
        window.PageLoadState.clearTimer();
        const appContent = document.getElementById('app-content');
        if (appContent) {
            window.PageLoadState.renderSkeleton(appContent, viewName);
        }
        if (window.location.hash.includes(viewName)) {
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else {
            window.location.hash = viewName || 'home';
        }
    }
};

// Global Listeners for Modal & Contact Admin
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') || e.target.closest('[data-close-modal]')) {
        window.UI.closeModal();
        return;
    }

    const contactAdminBtn = e.target.closest('[data-contact-admin]');
    if (contactAdminBtn) {
        e.preventDefault();
        const context = contactAdminBtn.getAttribute('data-contact-admin') || 'general';
        const title = contactAdminBtn.getAttribute('data-title') || null;
        const message = contactAdminBtn.getAttribute('data-message') || null;
        window.UI.openContactAdmin({ context, title, message });
    }
});