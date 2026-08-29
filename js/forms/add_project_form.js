export function render_add_project_form() {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const ownerName = currentUser ? (currentUser.name || `User #${currentUser.id}`) : 'Authenticated User';
    const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'U';

    // Populate team members selector asynchronously
    setTimeout(async () => {
        const container = document.getElementById('project-members-picker');
        if (!container) return;
        try {
            const res = await (window.apiFetch ? window.apiFetch('/api/users') : fetch('/api/users'));
            if (res.ok) {
                const users = await res.json();
                const filteredUsers = users.filter(u => !currentUser || String(u.id) !== String(currentUser.id));
                if (filteredUsers.length === 0) {
                    container.innerHTML = `<p class="text-xs text-on-surface-variant italic">No other registered users available to add.</p>`;
                    return;
                }
                let html = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">';
                filteredUsers.forEach(u => {
                    const uName = u.name || `User #${u.id}`;
                    const initial = uName.charAt(0).toUpperCase();
                    html += `
                        <label class="flex items-center gap-2 p-2 bg-surface-container rounded-lg border border-white/5 hover:border-secondary/40 cursor-pointer transition-colors text-xs text-on-surface">
                            <input type="checkbox" name="memberIds" value="${u.id}" class="rounded bg-surface-container border-white/20 text-secondary focus:ring-secondary">
                            <span class="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-[10px]">${initial}</span>
                            <span class="truncate font-medium">${uName}</span>
                        </label>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        } catch (e) {
            console.error('Failed to load users for project members:', e);
        }
    }, 50);

    return `<div class="glass-panel rounded-2xl border-t-4 border-t-secondary overflow-hidden shadow-2xl max-w-2xl w-full mx-auto animate-fade-in-up max-h-[90vh] overflow-y-auto">
    <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container sticky top-0 z-10 backdrop-blur-md">
        <h3 class="font-bold text-xl text-on-surface flex items-center gap-xs">
            <span class="material-symbols-outlined text-secondary">add_box</span>
            Add New Project
        </h3>
        <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1">
            <span class="material-symbols-outlined">close</span>
        </button>
    </div>
    
    <div class="p-xl">
        <form id="addProjectForm" class="space-y-lg">
            
            <!-- Project Owner Banner -->
            <div class="p-md bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-sm">
                    <div class="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-md">
                        ${ownerInitial}
                    </div>
                    <div>
                        <div class="text-xs font-bold uppercase tracking-wider text-secondary">Project Owner</div>
                        <div class="text-sm font-bold text-on-surface">${ownerName}</div>
                    </div>
                </div>
                <span class="px-2.5 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Author
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                    <label class="block text-sm font-label-sm text-on-surface mb-xs">Project Title</label>
                    <input type="text" name="title" required placeholder="e.g. NextGen API" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-secondary transition-colors">
                </div>
                
                <div>
                    <label class="block text-sm font-label-sm text-on-surface mb-xs">Category</label>
                    <select name="category" required class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-secondary transition-colors appearance-none">
                        <option value="" disabled selected>Select category...</option>
                        <option value="AI">Artificial Intelligence</option>
                        <option value="Web">Web Development</option>
                        <option value="Mobile">Mobile App</option>
                        <option value="Developer Tools">Developer Tools</option>
                        <option value="Open Source Platform">Open Source Platform</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Tech Stack (comma separated)</label>
                <input type="text" name="techStack" required placeholder="e.g. React, Node.js, MongoDB" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-secondary transition-colors">
            </div>
            
            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Short Description</label>
                <textarea name="description" required rows="3" placeholder="Briefly describe your project..." class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-secondary transition-colors resize-none"></textarea>
            </div>

            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">GitHub Repository URL</label>
                <input type="url" name="githubUrl" required placeholder="https://github.com/username/repo" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-secondary transition-colors">
            </div>

            <!-- Team Members Picker -->
            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs flex items-center justify-between">
                    <span>Assign Team Members</span>
                    <span class="text-[10px] text-on-surface-variant font-mono">Optional</span>
                </label>
                <div id="project-members-picker" class="bg-surface-container/50 border border-white/10 rounded-xl p-sm">
                    <p class="text-xs text-on-surface-variant animate-pulse">Loading members...</p>
                </div>
            </div>
            
            <div class="flex justify-end gap-sm pt-md border-t border-white/5">
                <button type="button" data-close-modal class="px-xl py-md bg-surface-variant text-on-surface rounded-xl font-bold hover:bg-outline-variant transition-colors">
                    Cancel
                </button>
                <button type="submit" class="px-xl py-md bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-transform flex items-center gap-xs">
                    Submit Project <span class="material-symbols-outlined text-sm">cloud_upload</span>
                </button>
            </div>
        </form>
    </div>
</div>
`;
}
