/*
 * CodeCollab Accessible Command Palette (Phase 14)
 * ------------------------------------------------
 * Shortcuts: Cmd/Ctrl + K, or '/' when not typing in form inputs.
 * Features: View navigation, instant project & developer search, keyboard navigation,
 * full ARIA combobox/listbox accessibility, and strict XSS prevention.
 */

(function () {
    const DEFAULT_ACTIONS = [
        { id: 'nav-explore', title: 'Explore Projects', category: 'Navigation', icon: 'explore', action: () => window.location.hash = 'explore' },
        { id: 'nav-projects', title: 'My Projects', category: 'Navigation', icon: 'folder', action: () => window.location.hash = 'projects' },
        { id: 'nav-create-project', title: 'Create New Project', category: 'Action', icon: 'add_circle', action: () => window.location.hash = 'create-project' },
        { id: 'nav-community', title: 'Developer Community', category: 'Navigation', icon: 'groups', action: () => window.location.hash = 'community' },
        { id: 'nav-issues', title: 'Issues & Tasks', category: 'Navigation', icon: 'task_alt', action: () => window.location.hash = 'issues' },
        { id: 'nav-docs', title: 'Documentation & API', category: 'Navigation', icon: 'menu_book', action: () => window.location.hash = 'docs' },
        { id: 'nav-profile', title: 'Profile & Settings', category: 'Navigation', icon: 'account_circle', action: () => window.location.hash = 'profile' },
        { id: 'action-contact-admin', title: 'Contact Administrator', category: 'Help', icon: 'support_agent', action: () => window.UI?.openContactAdmin() }
    ];

    let isOpen = false;
    let selectedIndex = 0;
    let currentResults = [];
    let searchDebounce = null;

    function buildPaletteDOM() {
        if (document.getElementById('command-palette-backdrop')) return;

        const backdrop = document.createElement('div');
        backdrop.id = 'command-palette-backdrop';
        backdrop.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden items-start justify-center pt-20 p-4 transition-opacity duration-200';
        backdrop.setAttribute('aria-hidden', 'true');

        backdrop.innerHTML = `
            <div id="command-palette-modal" 
                 role="dialog" 
                 aria-modal="true" 
                 aria-label="Command Palette" 
                 class="glass-panel w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] bg-surface/95 transform transition-all duration-200 scale-95 opacity-0">
                
                <!-- Search Input Bar -->
                <div class="flex items-center px-4 py-3 border-b border-white/10 gap-3">
                    <span class="material-symbols-outlined text-outline text-[20px]" aria-hidden="true">search</span>
                    <input id="command-palette-input" 
                           type="text" 
                           role="combobox" 
                           aria-autocomplete="list" 
                           aria-expanded="true" 
                           aria-controls="command-palette-results" 
                           aria-activedescendant="" 
                           placeholder="Type a command, search projects, or find developers..." 
                           class="w-full bg-transparent text-on-surface placeholder:text-outline text-sm outline-none border-none ring-0">
                    <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/10 text-outline">ESC</kbd>
                </div>

                <!-- Results List -->
                <ul id="command-palette-results" 
                    role="listbox" 
                    class="overflow-y-auto p-2 space-y-1 flex-1 max-h-96">
                </ul>

                <!-- Footer Hints -->
                <div class="px-4 py-2 bg-surface-container/50 border-t border-white/5 flex items-center justify-between text-[11px] text-outline select-none">
                    <div class="flex items-center gap-3">
                        <span><kbd class="px-1 py-0.5 rounded bg-white/5 border border-white/10">↑</kbd> <kbd class="px-1 py-0.5 rounded bg-white/5 border border-white/10">↓</kbd> Navigate</span>
                        <span><kbd class="px-1 py-0.5 rounded bg-white/5 border border-white/10">↵</kbd> Select</span>
                    </div>
                    <span><kbd class="px-1 py-0.5 rounded bg-white/5 border border-white/10">/</kbd> Quick Open</span>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closePalette();
        });

        const input = document.getElementById('command-palette-input');
        input.addEventListener('input', (e) => handleSearch(e.target.value));
        input.addEventListener('keydown', handleKeyNavigation);
    }

    function openPalette() {
        buildPaletteDOM();
        const backdrop = document.getElementById('command-palette-backdrop');
        const modal = document.getElementById('command-palette-modal');
        const input = document.getElementById('command-palette-input');

        isOpen = true;
        backdrop.setAttribute('aria-hidden', 'false');
        backdrop.classList.remove('hidden');
        backdrop.classList.add('flex');

        requestAnimationFrame(() => {
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
            input.value = '';
            input.focus();
            renderResults(DEFAULT_ACTIONS);
        });
    }

    function closePalette() {
        if (!isOpen) return;
        const backdrop = document.getElementById('command-palette-backdrop');
        const modal = document.getElementById('command-palette-modal');

        if (modal) {
            modal.classList.remove('scale-100', 'opacity-100');
            modal.classList.add('scale-95', 'opacity-0');
        }

        setTimeout(() => {
            if (backdrop) {
                backdrop.classList.remove('flex');
                backdrop.classList.add('hidden');
                backdrop.setAttribute('aria-hidden', 'true');
            }
            isOpen = false;
        }, 150);
    }

    async function handleSearch(query) {
        clearTimeout(searchDebounce);
        const q = (query || '').trim().toLowerCase();

        if (!q) {
            renderResults(DEFAULT_ACTIONS);
            return;
        }

        // Search within default actions
        const matchedActions = DEFAULT_ACTIONS.filter(a => 
            a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
        );

        renderResults(matchedActions);

        // Debounce server search for live projects & developers using centralized apiFetch
        searchDebounce = setTimeout(async () => {
            try {
                const fetchFn = async (endpoint) => {
                    try {
                        const res = (typeof window.apiFetch === 'function')
                            ? await window.apiFetch(endpoint)
                            : await fetch(endpoint);
                        return (res && res.ok) ? await res.json() : [];
                    } catch {
                        return [];
                    }
                };

                const [projRes, devRes] = await Promise.allSettled([
                    fetchFn(`/api/projects?search=${encodeURIComponent(q)}&limit=4`),
                    fetchFn(`/api/users?search=${encodeURIComponent(q)}&limit=4`)
                ]);

                const combined = [...matchedActions];

                if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) {
                    projRes.value.slice(0, 4).forEach(p => {
                        combined.push({
                            id: `proj-${p.id}`,
                            title: p.title || 'Untitled Project',
                            subtitle: p.category || 'Project',
                            category: 'Projects',
                            icon: 'laptop_chromebook',
                            action: () => window.location.hash = `project/${encodeURIComponent(p.id)}`
                        });
                    });
                }

                if (devRes.status === 'fulfilled' && Array.isArray(devRes.value)) {
                    devRes.value.slice(0, 4).forEach(d => {
                        combined.push({
                            id: `dev-${d.id}`,
                            title: d.name || 'Developer',
                            subtitle: d.title || 'Collaborator',
                            category: 'Developers',
                            icon: 'person',
                            action: () => window.location.hash = `developer/${encodeURIComponent(d.id)}`
                        });
                    });
                }

                renderResults(combined);
            } catch (err) {
                console.warn('[CommandPalette] Remote search failed:', err);
            }
        }, 200);
    }

    function renderResults(items) {
        currentResults = items;
        selectedIndex = 0;
        const list = document.getElementById('command-palette-results');
        const input = document.getElementById('command-palette-input');
        if (!list) return;

        list.innerHTML = '';

        if (items.length === 0) {
            list.innerHTML = `
                <li class="px-4 py-8 text-center text-sm text-outline select-none">
                    No results found
                </li>
            `;
            if (input) input.setAttribute('aria-activedescendant', '');
            return;
        }

        items.forEach((item, index) => {
            const isSelected = index === selectedIndex;
            const li = document.createElement('li');
            li.id = `palette-item-${index}`;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', String(isSelected));
            li.className = `px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-sm transition-all select-none ${
                isSelected ? 'bg-primary/10 text-primary font-medium border border-primary/20' : 'text-on-surface hover:bg-white/5'
            }`;

            // Safe DOM Construction (Phase 2.2 - Zero Stored/DOM XSS)
            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex items-center gap-3 min-w-0';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'material-symbols-outlined text-[18px] text-outline flex-shrink-0';
            iconSpan.setAttribute('aria-hidden', 'true');
            iconSpan.textContent = item.icon || 'arrow_forward';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'truncate';
            titleSpan.textContent = item.title;

            leftDiv.appendChild(iconSpan);
            leftDiv.appendChild(titleSpan);

            if (item.subtitle) {
                const subSpan = document.createElement('span');
                subSpan.className = 'text-xs text-outline ml-2 truncate';
                subSpan.textContent = `· ${item.subtitle}`;
                leftDiv.appendChild(subSpan);
            }

            const catSpan = document.createElement('span');
            catSpan.className = 'text-[11px] text-outline font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 ml-2 flex-shrink-0';
            catSpan.textContent = item.category;

            li.appendChild(leftDiv);
            li.appendChild(catSpan);

            li.addEventListener('click', () => {
                closePalette();
                if (typeof item.action === 'function') item.action();
            });

            list.appendChild(li);
        });

        if (input && items[0]) {
            input.setAttribute('aria-activedescendant', 'palette-item-0');
        }
    }

    function updateSelection() {
        const list = document.getElementById('command-palette-results');
        const input = document.getElementById('command-palette-input');
        if (!list) return;

        const items = list.querySelectorAll('li[role="option"]');
        items.forEach((item, index) => {
            const isSelected = index === selectedIndex;
            item.setAttribute('aria-selected', String(isSelected));
            if (isSelected) {
                item.className = 'px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-sm transition-all select-none bg-primary/10 text-primary font-medium border border-primary/20';
                item.scrollIntoView({ block: 'nearest' });
                if (input) input.setAttribute('aria-activedescendant', item.id);
            } else {
                item.className = 'px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-sm transition-all select-none text-on-surface hover:bg-white/5';
            }
        });
    }

    function handleKeyNavigation(e) {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentResults.length > 0) {
                selectedIndex = (selectedIndex + 1) % currentResults.length;
                updateSelection();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentResults.length > 0) {
                selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
                updateSelection();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentResults[selectedIndex]) {
                const target = currentResults[selectedIndex];
                closePalette();
                if (typeof target.action === 'function') target.action();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closePalette();
        }
    }

    // Global keyboard shortcut triggers
    window.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (isOpen) closePalette();
            else openPalette();
            return;
        }

        // '/' shortcut when not inside input/textarea/contenteditable
        if (e.key === '/' && !isOpen) {
            const active = document.activeElement;
            const isInput = active && (
                active.tagName === 'INPUT' || 
                active.tagName === 'TEXTAREA' || 
                active.tagName === 'SELECT' || 
                active.isContentEditable
            );
            if (!isInput) {
                e.preventDefault();
                openPalette();
            }
        }
    });

    window.CommandPalette = {
        open: openPalette,
        close: closePalette
    };
})();
