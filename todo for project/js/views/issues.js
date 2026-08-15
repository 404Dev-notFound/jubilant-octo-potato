export function render_issues() {
    return `
<main class="relative w-full max-w-[1400px] mx-auto p-xl flex flex-col min-h-screen pt-4">
    <!-- Header Section -->
    <div id="issues-header" class="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
        <div>
            <div class="flex items-center gap-xs mb-xs">
                <span class="material-symbols-outlined text-primary text-[28px]">view_kanban</span>
                <h1 class="font-display text-headline-lg text-primary">Issues Kanban</h1>
            </div>
            <div class="flex items-center gap-sm flex-wrap">
                <span class="text-on-surface-variant font-label-sm tracking-wider uppercase text-xs">Project:</span>
                <div class="relative inline-block">
                    <select id="issues-project-selector" class="bg-surface-container border border-white/10 rounded-lg px-3 py-1 text-xs text-on-surface font-mono font-bold outline-none focus:border-primary transition-colors appearance-none pr-7 cursor-pointer">
                        <option value="">Loading projects...</option>
                    </select>
                    <span class="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">expand_more</span>
                </div>
                <span id="issues-total-count" class="px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-mono">0 issues</span>
            </div>
        </div>
        
        <div class="flex items-center gap-sm">
            <button id="add-issue-btn" data-form="add_issue_form" data-status="TODO" class="px-lg py-sm bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-xs text-sm">
                <span class="material-symbols-outlined text-[18px]">add_circle</span> NEW ISSUE
            </button>
        </div>
    </div>
    
    <!-- Kanban Board Columns -->
    <div id="kanban-board" class="grid grid-cols-1 md:grid-cols-3 gap-md h-full pb-8">
        
        <!-- TO DO Column -->
        <div class="flex flex-col gap-sm kanban-column bg-surface-container-low/50 border border-white/5 rounded-2xl p-md backdrop-blur-sm" data-status="TODO">
            <div class="flex items-center justify-between px-xs pb-xs border-b border-white/5">
                <div class="font-bold text-sm text-on-surface flex items-center gap-xs">
                    <span class="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
                    <span class="tracking-wide">TO DO</span>
                </div>
                <span class="px-2.5 py-0.5 bg-surface-container-highest rounded-full text-xs font-mono font-bold text-on-surface-variant column-count">0</span>
            </div>
            <div class="column-cards min-h-[180px] flex flex-col gap-sm p-1 rounded-xl transition-all">
                <!-- Cards injected here -->
            </div>
            <button data-form="add_issue_form" data-status="TODO" class="add-issue-col-btn w-full py-2.5 border border-dashed border-white/10 text-on-surface-variant/80 rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-xs mt-auto text-xs font-bold">
                <span class="material-symbols-outlined text-[16px]">add</span> Add Issue
            </button>
        </div>

        <!-- IN PROGRESS Column -->
        <div class="flex flex-col gap-sm kanban-column bg-surface-container-low/50 border border-white/5 rounded-2xl p-md backdrop-blur-sm" data-status="IN_PROGRESS">
            <div class="flex items-center justify-between px-xs pb-xs border-b border-white/5">
                <div class="font-bold text-sm text-on-surface flex items-center gap-xs">
                    <span class="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <span class="tracking-wide">IN PROGRESS</span>
                </div>
                <span class="px-2.5 py-0.5 bg-surface-container-highest rounded-full text-xs font-mono font-bold text-on-surface-variant column-count">0</span>
            </div>
            <div class="column-cards min-h-[180px] flex flex-col gap-sm p-1 rounded-xl transition-all">
                <!-- Cards injected here -->
            </div>
            <button data-form="add_issue_form" data-status="IN_PROGRESS" class="add-issue-col-btn w-full py-2.5 border border-dashed border-white/10 text-on-surface-variant/80 rounded-xl hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all flex items-center justify-center gap-xs mt-auto text-xs font-bold">
                <span class="material-symbols-outlined text-[16px]">add</span> Add Issue
            </button>
        </div>

        <!-- DONE Column -->
        <div class="flex flex-col gap-sm kanban-column bg-surface-container-low/50 border border-white/5 rounded-2xl p-md backdrop-blur-sm" data-status="DONE">
            <div class="flex items-center justify-between px-xs pb-xs border-b border-white/5">
                <div class="font-bold text-sm text-on-surface flex items-center gap-xs">
                    <span class="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                    <span class="tracking-wide">DONE</span>
                </div>
                <span class="px-2.5 py-0.5 bg-surface-container-highest rounded-full text-xs font-mono font-bold text-on-surface-variant column-count">0</span>
            </div>
            <div class="column-cards min-h-[180px] flex flex-col gap-sm p-1 rounded-xl transition-all">
                <!-- Cards injected here -->
            </div>
            <button data-form="add_issue_form" data-status="DONE" class="add-issue-col-btn w-full py-2.5 border border-dashed border-white/10 text-on-surface-variant/80 rounded-xl hover:border-tertiary hover:text-tertiary hover:bg-tertiary/5 transition-all flex items-center justify-center gap-xs mt-auto text-xs font-bold">
                <span class="material-symbols-outlined text-[16px]">add</span> Add Issue
            </button>
        </div>
    </div>
</main>
`;
}

export async function initIssues(initialProjectId) {
    let currentProjectId = initialProjectId;
    let currentProjectTitle = '';
    let cachedUsers = {};

    // Close open dropdowns on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
    });

    // 1. Fetch Users for Assignee name lookup
    try {
        const usersRes = await window.apiFetch('/api/users');
        if (usersRes.ok) {
            const users = await usersRes.json();
            users.forEach(u => { cachedUsers[u.id] = u; });
        }
    } catch(e) {}

    // 2. Fetch Projects to populate Project Switcher
    try {
        const res = await window.apiFetch('/api/projects');
        if (res.ok) {
            const projects = await res.json();
            const projectSelector = document.getElementById('issues-project-selector');
            
            if (projectSelector && projects.length > 0) {
                projectSelector.innerHTML = '';
                projects.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.title || 'Untitled Project';
                    projectSelector.appendChild(opt);
                });

                // If no project specified in URL, pick first or pinned project
                if (!currentProjectId) {
                    const pinned = projects.find(p => p.isPinned) || projects[0];
                    currentProjectId = pinned.id;
                    window.location.hash = `issues?projectId=${currentProjectId}`;
                }

                projectSelector.value = currentProjectId;
                const activeProj = projects.find(p => p.id === currentProjectId);
                if (activeProj) currentProjectTitle = activeProj.title;
                window.currentActiveProjectTitle = currentProjectTitle;

                // Handle switching projects
                projectSelector.addEventListener('change', (e) => {
                    const selectedId = e.target.value;
                    if (selectedId) {
                        window.location.hash = `issues?projectId=${selectedId}`;
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error fetching projects for selector:', e);
    }

    window.currentActiveProjectId = currentProjectId;

    if (!currentProjectId) {
        const projectSelector = document.getElementById('issues-project-selector');
        if (projectSelector) projectSelector.innerHTML = '<option>No projects available</option>';
        return;
    }


    // 4. Global hook to refresh board when an issue is created
    window.addIssueToBoard = async function(newIssue) {
        await loadIssues();
    };

    setupColumnDropZones();
    await loadIssues();

    // 5. Load Issues from PostgreSQL via Prisma API
    async function loadIssues() {
        try {
            const res = await window.apiFetch(`/api/projects/${currentProjectId}/issues`);
            if (res.ok) {
                const issues = await res.json();
                renderBoard(issues);
            } else if (res.status === 401) {
                console.warn('User not authenticated to load issues.');
            } else {
                console.error('API returned error loading issues:', res.status);
            }
        } catch(e) {
            console.error('Failed to load issues:', e);
        }
    }

    // 6. Render Issues on Kanban columns
    function renderBoard(issues) {
        const cols = {
            'TODO': document.querySelector('.kanban-column[data-status="TODO"] .column-cards'),
            'IN_PROGRESS': document.querySelector('.kanban-column[data-status="IN_PROGRESS"] .column-cards'),
            'DONE': document.querySelector('.kanban-column[data-status="DONE"] .column-cards')
        };
        const counts = { 'TODO': 0, 'IN_PROGRESS': 0, 'DONE': 0 };

        // Clear existing cards
        Object.values(cols).forEach(col => {
            if (col) col.innerHTML = '';
        });

        issues.forEach(issue => {
            const status = issue.status || 'TODO';
            if (cols[status]) {
                counts[status]++;
                cols[status].appendChild(createIssueCard(issue));
            }
        });

        // Update column count badges and empty states
        let totalIssues = 0;
        Object.keys(counts).forEach(status => {
            totalIssues += counts[status];
            const colHeader = document.querySelector(`.kanban-column[data-status="${status}"] .column-count`);
            if (colHeader) colHeader.textContent = counts[status];
            
            if (counts[status] === 0 && cols[status]) {
                cols[status].innerHTML = `
                    <div class="text-center text-xs text-on-surface-variant/50 py-lg empty-msg border border-dashed border-white/5 rounded-xl flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined text-[24px] opacity-40">inbox</span>
                        <span>No issues in this column</span>
                    </div>`;
            }
        });

        const totalCountEl = document.getElementById('issues-total-count');
        if (totalCountEl) totalCountEl.textContent = `${totalIssues} issue${totalIssues === 1 ? '' : 's'}`;
        
        setupDragAndDrop();
    }

    // 7. Create Issue Card Component
    function createIssueCard(issue) {
        const div = document.createElement('div');
        div.className = 'glass-panel p-md rounded-xl transition-all cursor-grab border-l-4 relative group shadow-md hover:shadow-xl hover:border-white/20 bg-surface-container-high/60';
        
        if (issue.status === 'TODO') div.classList.add('border-l-error');
        else if (issue.status === 'IN_PROGRESS') div.classList.add('border-l-secondary');
        else if (issue.status === 'DONE') div.classList.add('border-l-tertiary', 'opacity-80');

        div.draggable = true;
        div.setAttribute('data-id', issue.id);
        
        const tagsHtml = (issue.tags || []).map(t => 
            `<span class="px-2 py-0.5 bg-surface-container-highest rounded text-[10px] font-mono font-bold uppercase text-on-surface-variant border border-white/5">${t}</span>`
        ).join(' ');
        
        const priorityColors = {
            'LOW': 'text-on-surface-variant bg-white/5 border-white/10',
            'MEDIUM': 'text-secondary bg-secondary/10 border-secondary/20',
            'HIGH': 'text-primary bg-primary/10 border-primary/20',
            'URGENT': 'text-error bg-error/10 border-error/20'
        };
        const priorityStyle = priorityColors[issue.priority] || priorityColors['MEDIUM'];
        
        const titleClass = issue.status === 'DONE' ? 'line-through text-on-surface-variant' : 'text-on-surface';

        // Assignee details
        let assigneeHtml = '';
        if (issue.assigneeId) {
            const assignee = cachedUsers[issue.assigneeId];
            const name = assignee ? (assignee.name || assignee.email) : `User #${issue.assigneeId}`;
            const initial = name.charAt(0).toUpperCase();
            assigneeHtml = `
                <div class="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-[11px] text-on-surface-variant" title="Assigned to ${name}">
                    <span class="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold">${initial}</span>
                    <span class="truncate max-w-[90px]">${name}</span>
                </div>
            `;
        }

        // Move to options
        const moveOptions = [];
        if (issue.status !== 'TODO') {
            moveOptions.push(`<button class="w-full text-left px-sm py-1.5 hover:bg-white/5 text-xs text-on-surface transition-colors move-btn flex items-center gap-2 rounded" data-status="TODO"><span class="w-2 h-2 rounded-full bg-error"></span> Move to To Do</button>`);
        }
        if (issue.status !== 'IN_PROGRESS') {
            moveOptions.push(`<button class="w-full text-left px-sm py-1.5 hover:bg-white/5 text-xs text-on-surface transition-colors move-btn flex items-center gap-2 rounded" data-status="IN_PROGRESS"><span class="w-2 h-2 rounded-full bg-secondary"></span> Move to In Progress</button>`);
        }
        if (issue.status !== 'DONE') {
            moveOptions.push(`<button class="w-full text-left px-sm py-1.5 hover:bg-white/5 text-xs text-on-surface transition-colors move-btn flex items-center gap-2 rounded" data-status="DONE"><span class="w-2 h-2 rounded-full bg-tertiary"></span> Move to Done</button>`);
        }

        div.innerHTML = `
            <div class="flex justify-between items-start mb-2 gap-xs">
                <div class="flex gap-1 flex-wrap flex-1 items-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityStyle}">
                        ${issue.priority || 'MEDIUM'}
                    </span>
                    ${tagsHtml}
                </div>
                <div class="relative">
                    <button type="button" class="menu-toggle-btn text-on-surface-variant hover:text-primary transition-colors p-1 rounded-md hover:bg-white/5">
                        <span class="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                    <div class="dropdown-menu hidden absolute right-0 top-full mt-1 bg-surface-container border border-white/10 rounded-xl p-1.5 z-20 w-44 shadow-2xl backdrop-blur-md flex flex-col gap-0.5">
                        <div class="text-[10px] text-on-surface-variant px-sm py-1 font-bold uppercase tracking-wider">Actions:</div>
                        ${moveOptions.join('')}
                        <div class="h-px bg-white/10 my-1"></div>
                        <button class="w-full text-left px-sm py-1.5 hover:bg-error/10 text-xs text-error transition-colors delete-btn flex items-center gap-2 rounded">
                            <span class="material-symbols-outlined text-[14px]">delete</span> Delete Issue
                        </button>
                    </div>
                </div>
            </div>
            
            <h4 class="font-bold mb-1.5 text-sm leading-snug ${titleClass}">${issue.title}</h4>
            ${issue.description ? `<p class="text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">${issue.description}</p>` : ''}
            
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-white/5 gap-2">
                <div class="flex items-center gap-1.5">
                    ${assigneeHtml}
                </div>
                <span class="text-[10px] font-mono text-on-surface-variant/70">
                    ${new Date(issue.createdAt).toLocaleDateString()}
                </span>
            </div>
        `;

        // Toggle card dropdown menu
        const menuToggleBtn = div.querySelector('.menu-toggle-btn');
        const dropdownMenu = div.querySelector('.dropdown-menu');
        if (menuToggleBtn && dropdownMenu) {
            menuToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    if (m !== dropdownMenu) m.classList.add('hidden');
                });
                dropdownMenu.classList.toggle('hidden');
            });
        }

        // Direct Move actions
        div.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (dropdownMenu) dropdownMenu.classList.add('hidden');
                const newStatus = btn.getAttribute('data-status');
                await updateIssueStatus(issue.id, newStatus, div, issue.status);
            });
        });

        // Delete Issue action
        const deleteBtn = div.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (dropdownMenu) dropdownMenu.classList.add('hidden');
                if (!confirm('Are you sure you want to delete this issue?')) return;
                
                try {
                    const res = await window.apiFetch(`/api/projects/${currentProjectId}/issues/${issue.id}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        window.UI.showToast('Issue deleted', 'info');
                        await loadIssues();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        window.UI.showToast(err.error || 'Failed to delete issue', 'error');
                    }
                } catch(err) {
                    console.error('Delete issue error:', err);
                    window.UI.showToast('Error deleting issue', 'error');
                }
            });
        }

        return div;
    }

    // 8. Drag and Drop handlers
    function setupDragAndDrop() {
        const cards = document.querySelectorAll('.column-cards > div[draggable="true"]');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
                card.classList.add('opacity-40', 'scale-95');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('opacity-40', 'scale-95');
            });
        });
    }

    function setupColumnDropZones() {
        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(col => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                const cardsContainer = col.querySelector('.column-cards');
                if (cardsContainer) cardsContainer.classList.add('bg-white/5', 'ring-1', 'ring-primary/40');
            });
            col.addEventListener('dragleave', () => {
                const cardsContainer = col.querySelector('.column-cards');
                if (cardsContainer) cardsContainer.classList.remove('bg-white/5', 'ring-1', 'ring-primary/40');
            });
            col.addEventListener('drop', async (e) => {
                e.preventDefault();
                const cardsContainer = col.querySelector('.column-cards');
                if (cardsContainer) cardsContainer.classList.remove('bg-white/5', 'ring-1', 'ring-primary/40');
                
                const issueId = e.dataTransfer.getData('text/plain');
                if (!issueId) return;
                
                const newStatus = col.getAttribute('data-status');
                const card = document.querySelector(`[data-id="${issueId}"]`);
                if (!card) return;
                
                const oldCol = card.closest('.kanban-column');
                const oldStatus = oldCol ? oldCol.getAttribute('data-status') : null;
                
                if (oldStatus && oldStatus !== newStatus) {
                    await updateIssueStatus(issueId, newStatus, card, oldStatus);
                }
            });
        });
    }

    async function updateIssueStatus(issueId, newStatus, cardElement, oldStatus) {
        // Optimistic DOM Move
        const targetColCards = document.querySelector(`.kanban-column[data-status="${newStatus}"] .column-cards`);
        if (targetColCards && cardElement) {
            const emptyMsg = targetColCards.querySelector('.empty-msg');
            if (emptyMsg) emptyMsg.remove();
            targetColCards.appendChild(cardElement);
            
            // Optimistically update counts
            const oldColCount = document.querySelector(`.kanban-column[data-status="${oldStatus}"] .column-count`);
            const newColCount = document.querySelector(`.kanban-column[data-status="${newStatus}"] .column-count`);
            if (oldColCount) oldColCount.textContent = Math.max(0, parseInt(oldColCount.textContent || '0') - 1);
            if (newColCount) newColCount.textContent = parseInt(newColCount.textContent || '0') + 1;
        }

        try {
            const res = await window.apiFetch(`/api/projects/${currentProjectId}/issues/${issueId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to update issue status');
            }
            // Database updated! Sync board state
            await loadIssues();
        } catch(e) {
            console.error('Failed to update status:', e);
            window.UI.showToast(e.message || 'Failed to update issue status', 'error');
            await loadIssues();
        }
    }
}
