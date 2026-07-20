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

    // Scroll Progress for Nebula Background (Camera animation driven in index.html)
    window.addEventListener('scroll', () => {
        // No longer translating the nebulaBg directly, it remains fixed.
        // The ThreeJS script in index.html will read window.scrollY.
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
        const formBtn = e.target.closest('[data-form]');
        if (formBtn) {
            e.preventDefault();
            const formName = formBtn.getAttribute('data-form');
            if (viewCache[formName]) {
                window.UI.openModal(viewCache[formName]);
            } else {
                fetch(`forms/${formName}.html`)
                    .then(res => {
                        if (!res.ok) throw new Error('Form not found');
                        return res.text();
                    })
                    .then(html => {
                        viewCache[formName] = html;
                        window.UI.openModal(html);
                    })
                    .catch(err => {
                        console.error(err);
                        window.UI.showToast('Error loading form', 'error');
                    });
            }
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
});