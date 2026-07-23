export function render_pull_requests() {
    return `
<main class="relative w-full max-w-[1200px] mx-auto p-xl flex flex-col min-h-screen pt-4">
    <div class="flex items-center justify-between mb-lg">
        <div>
            <h1 class="font-display text-headline-lg text-primary mb-xs">Pull Requests</h1>
            <p class="text-on-surface-variant font-label-sm tracking-widest uppercase">Review & Merge</p>
        </div>
        <button data-action="toast" data-message="Creating PR..." class="px-md py-sm bg-primary text-on-primary rounded-lg font-bold shadow-lg hover:bg-primary-container transition-colors flex items-center gap-xs">
            <span class="material-symbols-outlined text-[18px]">add</span> NEW PULL REQUEST
        </button>
    </div>
    
    <div class="glass-panel rounded-xl overflow-hidden">
        <div class="bg-surface-container p-md border-b border-outline-variant flex gap-md">
            <button class="font-bold text-on-surface">3 Open</button>
            <button class="text-on-surface-variant hover:text-on-surface">142 Closed</button>
        </div>
        <div class="divide-y divide-outline-variant">
            <div class="p-md hover:bg-surface-variant transition-colors flex gap-sm cursor-pointer" onclick="window.location.hash='project_details'">
                <span class="material-symbols-outlined text-tertiary mt-1">merge</span>
                <div>
                    <h4 class="font-bold text-on-surface text-lg">Implement zero-copy network stack</h4>
                    <p class="text-sm text-on-surface-variant mt-1">#102 opened 2 days ago by <span class="text-on-surface">alexdev</span></p>
                </div>
                <div class="ml-auto flex items-center gap-sm">
                    <span class="px-2 py-1 bg-surface-container rounded text-xs text-on-surface-variant">enhancement</span>
                    <span class="material-symbols-outlined text-tertiary" title="CI Passed">check</span>
                </div>
            </div>
        </div>
    </div>
</main>
`;
}
