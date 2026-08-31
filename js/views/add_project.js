const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_add_project() {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const ownerName = currentUser ? (currentUser.name || `User #${currentUser.id}`) : 'Authenticated User';
    const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'U';

    return `
<main class="w-full max-w-[1000px] mx-auto px-4 md:px-8 py-8 animate-fade-in-up text-on-surface">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Repository Scaffolding
            </div>
            <h1 class="text-3xl md:text-4xl font-display font-extrabold text-on-surface tracking-tight">Create & Publish Project</h1>
            <p class="text-sm text-on-surface-variant mt-1">Publish your open-source project to CodeCollab, discover contributors, and manage issues.</p>
        </div>
        <button onclick="window.history.back()" class="px-4 py-2 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all border border-white/5">
            Back
        </button>
    </div>

    <!-- Main Form Panel -->
    <div class="glass-panel p-6 md:p-10 rounded-2xl border border-white/10 bg-surface-container-low/70 backdrop-blur-md shadow-2xl">
        <form id="addProjectForm" class="space-y-6">
            <!-- Owner Banner -->
            <div class="p-4 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-md">
                        ${ownerInitial}
                    </div>
                    <div>
                        <div class="text-[11px] font-bold uppercase tracking-wider text-secondary">Project Creator & Lead</div>
                        <div class="text-sm font-bold text-on-surface">${escapeHtml(ownerName)}</div>
                    </div>
                </div>
                <span class="px-2.5 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Author
                </span>
            </div>

            <!-- Title & Category Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Project Title <span class="text-secondary">*</span></label>
                    <input type="text" name="title" required placeholder="e.g. Hyperion Distributed Storage Engine" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors">
                </div>
                
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Category <span class="text-secondary">*</span></label>
                    <select name="category" required class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors appearance-none cursor-pointer">
                        <option value="" disabled selected>Select category...</option>
                        <option value="AI">Artificial Intelligence & ML</option>
                        <option value="Web">Web Development & Fullstack</option>
                        <option value="Mobile">Mobile Application</option>
                        <option value="Developer Tools">Developer Tools & CLI</option>
                        <option value="Open Source Platform">Open Source Infrastructure</option>
                    </select>
                </div>
            </div>

            <!-- Tech Stack -->
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Tech Stack (comma separated) <span class="text-secondary">*</span></label>
                <input type="text" name="techStack" required placeholder="e.g. Rust, TypeScript, React, Docker, GraphQL" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors">
            </div>
            
            <!-- Description -->
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Project Description <span class="text-secondary">*</span></label>
                <textarea name="description" required rows="4" placeholder="Detail the purpose of this project, architectural goals, target contributors, and milestone roadmap..." class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors resize-none"></textarea>
            </div>

            <!-- GitHub URL -->
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">GitHub Repository URL <span class="text-secondary">*</span></label>
                <input type="url" name="githubUrl" required placeholder="https://github.com/username/repository" class="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors">
            </div>

            <!-- Team Members Picker -->
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center justify-between">
                    <span>Add Initial Collaborators</span>
                    <span class="text-[10px] text-on-surface-variant font-mono">Optional</span>
                </label>
                <div id="project-members-picker" class="bg-surface-container/50 border border-white/10 rounded-xl p-3 min-h-[60px]">
                    <p class="text-xs text-on-surface-variant animate-pulse">Loading community developers...</p>
                </div>
            </div>
            
            <!-- Form Action Footer -->
            <div class="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button type="button" onclick="window.history.back()" class="px-6 py-3 bg-surface-variant text-on-surface rounded-xl font-bold hover:bg-outline-variant transition-colors text-sm">
                    Cancel
                </button>
                <button type="submit" class="px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-transform flex items-center gap-2 text-sm">
                    <span>Submit & Publish</span>
                    <span class="material-symbols-outlined text-[18px]">cloud_upload</span>
                </button>
            </div>
        </form>
    </div>
</main>
`;
}

export async function initAddProject() {
    const container = document.getElementById('project-members-picker');
    if (!container) return;

    try {
        const currentUserStr = localStorage.getItem('currentUser');
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const res = await window.apiFetch('/api/users');
        if (res.ok) {
            const users = await res.json();
            const filteredUsers = users.filter(u => !currentUser || String(u.id) !== String(currentUser.id));
            if (filteredUsers.length === 0) {
                container.innerHTML = `<p class="text-xs text-on-surface-variant italic">No other registered users available to add.</p>`;
                return;
            }
            let html = '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">';
            filteredUsers.forEach(u => {
                const uName = u.name || `User #${u.id}`;
                const initial = uName.charAt(0).toUpperCase();
                html += `
                    <label class="flex items-center gap-2 p-2 bg-surface-container rounded-lg border border-white/5 hover:border-secondary/40 cursor-pointer transition-colors text-xs text-on-surface">
                        <input type="checkbox" name="memberIds" value="${u.id}" class="rounded bg-surface-container border-white/20 text-secondary focus:ring-secondary">
                        <span class="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-[10px]">${initial}</span>
                        <span class="truncate font-medium">${escapeHtml(uName)}</span>
                    </label>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }
    } catch (e) {
        console.warn('Could not load users for project members:', e);
        container.innerHTML = `<p class="text-xs text-on-surface-variant italic">Community roster ready.</p>`;
    }
}
