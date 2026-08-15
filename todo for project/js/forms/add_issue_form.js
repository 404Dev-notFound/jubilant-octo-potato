export function render_add_issue_form(defaultStatus = 'TODO', projectId = '', projectTitle = '') {
    // Asynchronously populate users for the Assignee selector
    setTimeout(async () => {
        const select = document.getElementById('issue-assignee-select');
        if (!select) return;
        try {
            const res = await window.apiFetch('/api/users');
            if (res.ok) {
                const users = await res.json();
                users.forEach(u => {
                    const option = document.createElement('option');
                    option.value = u.id;
                    const displayName = u.name ? `${u.name} (${u.email})` : (u.email || `User #${u.id}`);
                    option.textContent = displayName;
                    select.appendChild(option);
                });
            }
        } catch (err) {
            console.warn('Could not load users for assignee selector:', err);
        }
    }, 50);

    const projectBadge = projectTitle 
        ? `<span class="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-mono">${projectTitle}</span>` 
        : '';

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-primary overflow-hidden shadow-2xl max-w-2xl w-full mx-auto animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container sticky top-0 z-10 backdrop-blur-md">
            <div class="flex items-center gap-sm">
                <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-[20px]">add_task</span>
                </div>
                <div>
                    <h3 class="font-bold text-lg text-on-surface flex items-center gap-xs">
                        Create New Issue
                        ${projectBadge}
                    </h3>
                    <p class="text-xs text-on-surface-variant font-label-sm">Add a task to the project Kanban board</p>
                </div>
            </div>
            <button type="button" data-close-modal class="text-on-surface-variant hover:text-error hover:bg-white/5 transition-colors p-1.5 rounded-lg">
                <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
        </div>
        
        <!-- Modal Body / Form -->
        <div class="p-xl">
            <form id="addIssueForm" class="space-y-md" data-project-id="${projectId}" onsubmit="return window.handleAddIssue(event)">
                
                <!-- Title -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs flex items-center justify-between">
                        <span>Issue Title <span class="text-error">*</span></span>
                        <span class="text-[10px] text-on-surface-variant/60">Required</span>
                    </label>
                    <input type="text" name="title" required autofocus placeholder="e.g., Fix WebSocket sync on drag-and-drop" 
                        class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all font-body-md">
                </div>
                
                <!-- Status & Priority Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                            Status <span class="text-error">*</span>
                        </label>
                        <div class="relative">
                            <select name="status" required class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors appearance-none cursor-pointer">
                                <option value="TODO" ${defaultStatus === 'TODO' ? 'selected' : ''}>📋 To Do</option>
                                <option value="IN_PROGRESS" ${defaultStatus === 'IN_PROGRESS' ? 'selected' : ''}>⚡ In Progress</option>
                                <option value="DONE" ${defaultStatus === 'DONE' ? 'selected' : ''}>✅ Done</option>
                            </select>
                            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                            Priority <span class="text-error">*</span>
                        </label>
                        <div class="relative">
                            <select name="priority" required class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors appearance-none cursor-pointer">
                                <option value="LOW">🟢 Low</option>
                                <option value="MEDIUM" selected>🟡 Medium</option>
                                <option value="HIGH">🟠 High</option>
                                <option value="URGENT">🔴 Urgent</option>
                            </select>
                            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                        </div>
                    </div>
                </div>

                <!-- Assignee -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs flex items-center justify-between">
                        <span>Assignee</span>
                        <span class="text-[10px] text-on-surface-variant/60">Optional</span>
                    </label>
                    <div class="relative">
                        <select name="assigneeId" id="issue-assignee-select" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors appearance-none cursor-pointer">
                            <option value="">👤 Unassigned</option>
                        </select>
                        <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                    </div>
                </div>

                <!-- Tags -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs flex items-center justify-between">
                        <span>Tags / Labels</span>
                        <span class="text-[10px] text-on-surface-variant/60">Comma-separated</span>
                    </label>
                    <input type="text" name="tags" id="issue-tags-input" placeholder="e.g., bug, frontend, critical" 
                        class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all">
                    
                    <!-- Quick tag pills -->
                    <div class="flex flex-wrap items-center gap-1.5 mt-2">
                        <span class="text-[10px] text-on-surface-variant/60 mr-1">Suggestions:</span>
                        ${['bug', 'feature', 'frontend', 'backend', 'ui/ux', 'docs', 'urgent'].map(tag => `
                            <button type="button" onclick="window.appendTag('${tag}')" class="px-2 py-0.5 bg-white/5 hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded text-[11px] font-mono transition-colors border border-white/5">
                                +${tag}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Description -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs flex items-center justify-between">
                        <span>Description</span>
                        <span class="text-[10px] text-on-surface-variant/60">Details & Steps</span>
                    </label>
                    <textarea name="description" rows="3" placeholder="Describe the issue, reproduction steps, or expected behavior..." 
                        class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all resize-none"></textarea>
                </div>
                
                <!-- Footer Action Buttons -->
                <div class="flex justify-end items-center gap-sm pt-md border-t border-white/5">
                    <button type="button" data-close-modal class="px-lg py-sm bg-surface-variant text-on-surface rounded-xl text-sm font-bold hover:bg-outline-variant transition-colors">
                        Cancel
                    </button>
                    <button type="submit" id="issue-submit-btn" class="px-xl py-sm bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Create Issue</span>
                    </button>
                </div>
            </form>
        </div>
    </div>`;
}

// Quick Tag helper
window.appendTag = function(tag) {
    const input = document.getElementById('issue-tags-input');
    if (!input) return;
    const existing = input.value.split(',').map(t => t.trim()).filter(Boolean);
    if (!existing.includes(tag)) {
        existing.push(tag);
        input.value = existing.join(', ');
    }
};

// Global handler for the add-issue form submission
window.handleAddIssue = async function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    const form = event.target;
    let projectId = form.getAttribute('data-project-id');
    
    // Fallback: If projectId is empty in form, attempt to detect from URL or active board
    if (!projectId || projectId === 'null' || projectId === 'undefined') {
        const hash = window.location.hash || '';
        const params = new URLSearchParams(hash.split('?')[1] || '');
        projectId = params.get('projectId') || window.currentActiveProjectId;
    }

    if (!projectId) {
        window.UI.showToast('Please select a project before creating an issue.', 'error');
        return false;
    }

    const submitBtn = document.getElementById('issue-submit-btn');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Create Issue';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> <span>Saving...</span>`;
    }

    const formData = new FormData(form);
    const rawTags = formData.get('tags') || '';
    const tagsArray = rawTags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
        title: (formData.get('title') || '').trim(),
        description: (formData.get('description') || '').trim(),
        status: formData.get('status') || 'TODO',
        priority: formData.get('priority') || 'MEDIUM',
        tags: tagsArray,
        assigneeId: formData.get('assigneeId') || null
    };

    try {
        const res = await window.apiFetch(`/api/projects/${projectId}/issues`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to create issue in database');
        }

        const newIssue = await res.json();
        
        // Immediately add to Kanban board
        if (typeof window.addIssueToBoard === 'function') {
            await window.addIssueToBoard(newIssue);
        }

        window.UI.closeModal();
        window.UI.showToast('Issue created and saved to database!', 'success');
    } catch (e) {
        console.error('Create issue error:', e);
        window.UI.showToast(e.message || 'Error creating issue', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    }

    return false;
};
