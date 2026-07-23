document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const nebulaBg = document.getElementById('nebula-bg');
    const viewCache = {};

    window.updateAuthUI = function() {
        const currentUserStr = localStorage.getItem('currentUser');
        const authButtons = document.getElementById('auth-buttons-container');
        const profileDropdown = document.getElementById('profile-dropdown-container');
        const profileAvatar = document.getElementById('profile-avatar');
        
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            if (authButtons) authButtons.classList.add('hidden');
            if (profileDropdown) profileDropdown.classList.remove('hidden');
            if (profileAvatar) profileAvatar.textContent = (user.name ? user.name.charAt(0) : 'U').toUpperCase();
        } else {
            if (authButtons) authButtons.classList.remove('hidden');
            if (profileDropdown) profileDropdown.classList.add('hidden');
            if (profileAvatar) profileAvatar.textContent = 'U';
        }
    };
    
    // Call it initially
    window.updateAuthUI();

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
                // Dynamically import the JS view module
                const module = await import(`./views/${viewName}.js`);
                const funcName = `render_${viewName.replace(/-/g, '_')}`;
                if (module[funcName]) {
                    html = module[funcName]();
                    viewCache[viewName] = html;
                } else {
                    throw new Error(`Export ${funcName} not found in views/${viewName}.js`);
                }
            }
            // Small artificial delay to show skeleton and simulate real load
            setTimeout(async () => {
                appContent.innerHTML = html;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Fetch projects if on the explore page
                if (viewName === 'explore' || viewName === 'home_explore') {
                    const gridElement = document.getElementById('project-grid') || document.getElementById('explore-projects-container');
                    if (gridElement) {
                        try {
                            const res = await fetch('http://localhost:3000/api/projects');
                            if (!res.ok) throw new Error('API Error');
                            const projects = await res.json();
                            
                            let cardsHtml = '';
                            projects.forEach(p => {
                                const techBadges = p.techStack.map(tech => 
                                    `<span class="px-2.5 py-1 bg-surface-container-highest rounded-full text-[11px] font-medium text-on-surface-variant border border-white/5">${tech}</span>`
                                ).join('');
                                
                                cardsHtml += `
                                <div class="glass-card bg-surface-container-low/40 backdrop-blur-md rounded-[20px] border border-white/5 flex flex-col group overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2">
                                    <div class="relative w-full aspect-video overflow-hidden bg-surface-container">
                                        <div class="absolute top-3 left-3 z-10">
                                            <span class="px-2 py-1 bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                ${p.category}
                                            </span>
                                        </div>
                                        <div class="absolute top-3 right-3 z-10">
                                            <span class="px-2 py-1 bg-tertiary/10 text-tertiary border-tertiary/20 border rounded-md text-[10px] font-bold shadow-sm backdrop-blur-sm bg-opacity-80 uppercase tracking-wider">
                                                ${p.difficulty}
                                            </span>
                                        </div>
                                        <div class="absolute bottom-3 right-3 z-10">
                                            <span class="px-2 py-1 bg-primary text-on-primary rounded-md text-[10px] font-bold shadow-sm shadow-primary/20">
                                                Score: ${p.complexityScore || 0}
                                            </span>
                                        </div>
                                        <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" loading="lazy" />
                                        <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                    <div class="p-6 flex flex-col flex-1">
                                        <h4 class="font-bold text-xl text-on-surface mb-2 group-hover:text-primary transition-colors leading-tight">${p.title}</h4>
                                        <p class="text-sm text-on-surface-variant line-clamp-2 mb-5 flex-1">${p.description}</p>
                                        <div class="flex flex-wrap gap-2 mb-6">${techBadges}</div>
                                        <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                                            <a href="${p.githubUrl}" target="_blank" class="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors group/btn">
                                                <svg class="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg>
                                                <span>Code</span>
                                            </a>
                                            <a href="#" class="flex-1 flex justify-center items-center px-3 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95">
                                                View Project
                                            </a>
                                        </div>
                                    </div>
                                </div>`;
                            });
                            
                            // Remove skeleton and inject real data
                            gridElement.innerHTML = cardsHtml;
                            // Also hide the old hardcoded content if it exists
                            const realContent = document.getElementById('real-content');
                            if (realContent) realContent.remove();
                        } catch (err) {
                            console.error("Failed to load dynamic projects", err);
                            // Fallback to static content
                            const realContent = document.getElementById('real-content');
                            if (realContent) {
                                realContent.classList.remove('hidden');
                                gridElement.remove();
                            }
                        }
                    }
                }

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
            if (viewCache[formName]) {
                window.UI.openModal(viewCache[formName]);
            } else {
                import(`./forms/${formName}.js`)
                    .then(module => {
                        const funcName = `render_${formName.replace(/-/g, '_')}`;
                        if (module[funcName]) {
                            const html = module[funcName]();
                            viewCache[formName] = html;
                            window.UI.openModal(html);
                        } else {
                            throw new Error(`Export ${funcName} not found`);
                        }
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

    // Global Form Submit Interceptor
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
            });
            
            // Name field might be required for signup
            if (form.id === 'signUpForm' && !data.name) {
                const textInput = form.querySelector('input[type="text"]');
                if (textInput) data.name = textInput.value;
            }

            const endpoint = form.id === 'signUpForm' ? '/api/auth/signup' : '/api/auth/login';
            
            try {
                const response = await fetch(`http://localhost:3000${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
                console.error(error);
                window.UI.showToast('Error connecting to backend.', 'error');
            }
            return;
        }

        const formIdToTable = {
            'addProjectForm': 'projects',
            'createOrgForm': 'organizations',
            'editProfileForm': 'users'
        };

        const table = formIdToTable[form.id];
        
        if (table) {
            e.preventDefault();
            
            // Gather form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
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
                const response = await fetch(`http://localhost:3000/api/${table}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    window.UI.showToast('Data saved successfully!', 'success');
                    window.UI.closeModal();
                    if (table === 'projects') navigate();
                } else {
                    window.UI.showToast('Failed to save data.', 'error');
                }
            } catch (error) {
                console.error('Error saving data:', error);
                window.UI.showToast('Error connecting to backend.', 'error');
            }
        }
    });
});