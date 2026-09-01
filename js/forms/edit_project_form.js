const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) 
    ? window.escapeHtml 
    : (str => (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

export function render_edit_project_form(project) {
    if (!project) return '<div>Project not found</div>';

    const techStackStr = Array.isArray(project.techStack) 
        ? project.techStack.join(', ') 
        : (typeof project.techStack === 'string' ? project.techStack : '');

    const currentProgress = typeof project.progress === 'number' ? project.progress : 0;
    const currentReadme = project.readme || project.description || '';

    return `
    <div class="glass-panel rounded-2xl border-t-4 border-t-secondary overflow-hidden shadow-2xl max-w-3xl w-full mx-auto animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container sticky top-0 z-20 backdrop-blur-md">
            <div class="flex items-center gap-sm">
                <div class="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
                    <span class="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div>
                    <h3 class="font-bold text-lg text-on-surface flex items-center gap-xs">
                        Edit Project
                    </h3>
                    <p class="text-xs text-on-surface-variant font-label-sm">Update project details, metadata, and README</p>
                </div>
            </div>
            <button type="button" data-close-modal class="text-on-surface-variant hover:text-error hover:bg-white/5 transition-colors p-1.5 rounded-lg">
                <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
        </div>
        
        <!-- Form Body -->
        <div class="p-xl">
            <form id="editProjectForm" data-project-id="${project.id}" class="space-y-lg">
                
                <!-- Project Name & Category -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                            Project Name <span class="text-error">*</span>
                        </label>
                        <input type="text" name="title" required value="${escapeHtml(project.title || '')}" 
                            class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-secondary transition-colors font-bold">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                            Category <span class="text-error">*</span>
                        </label>
                        <select name="category" required class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-secondary transition-colors cursor-pointer">
                            <option value="Infrastructure" ${project.category === 'Infrastructure' ? 'selected' : ''}>Infrastructure</option>
                            <option value="AI / Machine Learning" ${project.category === 'AI / Machine Learning' || project.category === 'AI' ? 'selected' : ''}>AI / Machine Learning</option>
                            <option value="Developer Tools" ${project.category === 'Developer Tools' ? 'selected' : ''}>Developer Tools</option>
                            <option value="Web Development" ${project.category === 'Web Development' || project.category === 'Web' ? 'selected' : ''}>Web Development</option>
                            <option value="Mobile App" ${project.category === 'Mobile App' || project.category === 'Mobile' ? 'selected' : ''}>Mobile App</option>
                            <option value="Systems & Rust" ${project.category === 'Systems & Rust' ? 'selected' : ''}>Systems & Rust</option>
                            <option value="Open Source Platform" ${project.category === 'Open Source Platform' ? 'selected' : ''}>Open Source Platform</option>
                        </select>
                    </div>
                </div>

                <!-- Difficulty & Progress -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                            Difficulty
                        </label>
                        <select name="difficulty" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-secondary transition-colors cursor-pointer">
                            <option value="Beginner Friendly" ${project.difficulty === 'Beginner Friendly' ? 'selected' : ''}>Beginner Friendly</option>
                            <option value="Intermediate" ${project.difficulty === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="Advanced" ${project.difficulty === 'Advanced' ? 'selected' : ''}>Advanced / Systems</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs flex justify-between">
                            <span>Completion Progress</span>
                            <span id="edit-progress-display" class="text-secondary font-mono font-bold">${currentProgress}%</span>
                        </label>
                        <input type="range" name="progress" id="edit-progress-slider" min="0" max="100" value="${currentProgress}" 
                            class="w-full accent-secondary cursor-pointer mt-2" oninput="document.getElementById('edit-progress-display').textContent = this.value + '%'">
                    </div>
                </div>

                <!-- Tech Stack -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs flex justify-between">
                        <span>Technologies & Tags</span>
                        <span class="text-[10px] text-on-surface-variant/60">Comma-separated</span>
                    </label>
                    <input type="text" name="techStack" value="${escapeHtml(techStackStr)}" placeholder="e.g. Rust, Tokio, WebAssembly, Docker" 
                        class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-secondary transition-colors font-mono">
                </div>

                <!-- GitHub URL -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                        GitHub Repository URL
                    </label>
                    <input type="url" name="githubUrl" value="${escapeHtml(project.githubUrl || '')}" placeholder="https://github.com/organization/repository" 
                        class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-secondary transition-colors">
                </div>
                
                <!-- Short Description -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                        Short Description <span class="text-error">*</span>
                    </label>
                    <textarea name="description" required rows="2" placeholder="Brief project summary displayed on cards..." 
                        class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-sm text-on-surface outline-none focus:border-secondary transition-colors resize-none">${escapeHtml(project.description || '')}</textarea>
                </div>

                <!-- Full README.md Markdown Editor -->
                <div>
                    <div class="flex justify-between items-center mb-xs">
                        <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Project README (Markdown)
                        </label>
                        <span class="text-[10px] text-secondary font-mono flex items-center gap-1">
                            <span class="material-symbols-outlined text-[13px]">code</span> Supports Markdown
                        </span>
                    </div>
                    <textarea name="readme" rows="8" placeholder="Write comprehensive project documentation, installation instructions, architecture overview..." 
                        class="w-full bg-surface-container border border-white/10 rounded-xl p-md text-xs font-mono text-on-surface outline-none focus:border-secondary transition-colors leading-relaxed">${escapeHtml(currentReadme)}</textarea>
                </div>

                <!-- Modal Actions -->
                <div class="flex justify-end items-center gap-sm pt-md border-t border-white/5">
                    <button type="button" data-close-modal class="px-lg py-sm bg-surface-variant text-on-surface rounded-xl text-sm font-bold hover:bg-outline-variant transition-colors">
                        Cancel
                    </button>
                    <button type="submit" id="edit-project-submit-btn" class="px-xl py-sm bg-secondary text-on-secondary rounded-xl text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[18px]">save</span>
                        <span>Save Changes</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}
