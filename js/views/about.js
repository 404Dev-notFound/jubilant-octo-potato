export function render_about() {
    return `<main class="relative w-full max-w-[1000px] mx-auto p-xl flex flex-col pt-12 text-center">
    <h1 class="font-display text-[48px] font-bold text-on-surface mb-sm">Empowering the <span class="text-primary">Open Source</span> Future</h1>
    <p class="text-lg text-on-surface-variant max-w-2xl mx-auto mb-xl">CodeCollab is built for developers, by developers. Our mission is to seamlessly connect students, maintainers, and organizations to build incredible software together.</p>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-lg text-left mt-lg">
        <div class="glass-panel p-lg rounded-xl">
            <span class="material-symbols-outlined text-[32px] text-primary mb-md">groups</span>
            <h3 class="font-bold text-lg mb-sm">Community First</h3>
            <p class="text-sm text-on-surface-variant">We prioritize healthy interactions, mentorship, and growing the next generation of engineers through active open source contribution.</p>
        </div>
        <div class="glass-panel p-lg rounded-xl">
            <span class="material-symbols-outlined text-[32px] text-secondary mb-md">smart_toy</span>
            <h3 class="font-bold text-lg mb-sm">AI Accelerated</h3>
            <p class="text-sm text-on-surface-variant">Integrating state-of-the-art AI to automate code reviews, generate documentation, and match you with the perfect issues.</p>
        </div>
        <div class="glass-panel p-lg rounded-xl">
            <span class="material-symbols-outlined text-[32px] text-tertiary mb-md">rocket_launch</span>
            <h3 class="font-bold text-lg mb-sm">Built for Speed</h3>
            <p class="text-sm text-on-surface-variant">A blazingly fast SPA architecture designed to handle thousands of concurrent collaborations without breaking a sweat.</p>
        </div>
    </div>
</main>`;
}
