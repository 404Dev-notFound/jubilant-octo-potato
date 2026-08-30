/**
 * CodeCollab — First-Visit Explore Projects Onboarding Guidance
 * Displays a non-blocking glassmorphic onboarding toast for first-time visitors in a session,
 * guiding them to discover open-source repositories and developers in Explore Projects.
 */

(function () {
    const STORAGE_KEY = 'codecollab_explore_onboarding_shown';

    function initExploreOnboarding() {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        // Ensure onboarding guidance is only displayed once per session
        try {
            if (sessionStorage.getItem(STORAGE_KEY)) {
                return;
            }
        } catch (e) {
            // Fallback if sessionStorage is restricted
        }

        // Wait for DOM readiness and initial navigation
        setTimeout(() => {
            renderExploreToast();
        }, 1200);
    }

    function renderExploreToast() {
        // Prevent duplicate toasts
        if (document.getElementById('explore-onboarding-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'explore-onboarding-toast';
        toast.className = 'fixed bottom-6 right-6 z-[90] max-w-sm w-[calc(100%-3rem)] glass-panel p-md rounded-2xl border border-primary/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 transform translate-y-8 opacity-0 flex items-start gap-md cursor-pointer hover:border-primary/60 hover:scale-[1.02] group';
        
        toast.innerHTML = `
            <div class="p-xs bg-primary/10 text-primary rounded-xl border border-primary/20 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[22px]">explore</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-0.5">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                        <span>Start here</span>
                        <span class="material-symbols-outlined text-[14px]">stars</span>
                    </span>
                    <button id="close-onboarding-btn" class="text-on-surface-variant/60 hover:text-on-surface p-0.5 transition-colors" title="Dismiss">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
                <h4 class="font-bold text-sm text-on-surface leading-snug">Explore Projects</h4>
                <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Discover repositories, connect with developers, and find something worth building.
                </p>
                <div class="mt-2 text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Explore</span>
                    <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Entrance animation
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-8', 'opacity-0');
        });

        // Mark as shown in sessionStorage
        try {
            sessionStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {}

        // Handle click on toast to navigate to #explore
        toast.addEventListener('click', (e) => {
            if (e.target.closest('#close-onboarding-btn')) {
                e.stopPropagation();
                dismissToast(toast);
                return;
            }
            dismissToast(toast);
            window.location.hash = 'explore';
        });

        // Auto-dismiss after ~3.5 seconds if user does not click
        const autoDismissTimer = setTimeout(() => {
            dismissToast(toast);
        }, 3500);

        toast.addEventListener('mouseenter', () => clearTimeout(autoDismissTimer));
    }

    function dismissToast(toast) {
        if (!toast) return;
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExploreOnboarding);
    } else {
        initExploreOnboarding();
    }
})();
