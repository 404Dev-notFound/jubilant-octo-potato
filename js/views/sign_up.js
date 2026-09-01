export function render_sign_up() {
    return `<div class="flex items-center justify-center min-h-[85vh] py-8">
    <div class="glass-panel p-xl rounded-2xl w-full max-w-md border-t-4 border-t-tertiary shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl -z-10"></div>
        <div class="text-center mb-lg">
            <span class="material-symbols-outlined text-[48px] text-tertiary mb-sm">person_add</span>
            <h2 class="font-display text-headline-md font-bold">Join CodeCollab</h2>
            <p class="text-on-surface-variant text-sm mt-1">Create your developer account to collaborate and build</p>
        </div>
        
        <form id="signUpForm" class="space-y-md">
            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">FULL NAME</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person</span>
                    <input type="text" name="name" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-tertiary transition-colors" placeholder="Alex Rivera" required>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">EMAIL ADDRESS</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">mail</span>
                    <input type="email" name="email" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-tertiary transition-colors" placeholder="alex@example.com" required>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">MOBILE NUMBER</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">phone</span>
                    <input type="tel" name="mobileNumber" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-tertiary transition-colors" placeholder="+1 234 567 8900" pattern="[+]?[0-9\\s\\-()]{7,20}" title="Please enter a valid mobile number (7-20 digits)" required>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">PASSWORD</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">lock</span>
                    <input type="password" id="signup-view-password" name="password" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-20 py-sm text-sm text-on-surface outline-none focus:border-tertiary transition-colors" placeholder="••••••••" minlength="6" required>
                    <button type="button" data-toggle-password="signup-view-password" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-mono select-none px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer" aria-label="Toggle password visibility">
                        <span class="material-symbols-outlined text-[15px]">visibility</span>
                        <span class="password-toggle-label text-[11px] font-bold">Show</span>
                    </button>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">CONFIRM PASSWORD</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">lock_clock</span>
                    <input type="password" id="signup-view-confirm-password" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-20 py-sm text-sm text-on-surface outline-none focus:border-tertiary transition-colors" placeholder="••••••••" minlength="6" required>
                    <button type="button" data-toggle-password="signup-view-confirm-password" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-mono select-none px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer" aria-label="Toggle confirm password visibility">
                        <span class="material-symbols-outlined text-[15px]">visibility</span>
                        <span class="password-toggle-label text-[11px] font-bold">Show</span>
                    </button>
                </div>
            </div>
            
            <button type="submit" class="w-full py-sm bg-tertiary text-on-tertiary font-bold rounded-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-xs">
                <span>CREATE ACCOUNT</span>
                <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
            </button>
        </form>
        
        <div class="mt-lg flex items-center gap-sm">
            <div class="h-[1px] bg-white/10 flex-1"></div>
            <span class="text-xs text-on-surface-variant uppercase tracking-wider">Or continue with</span>
            <div class="h-[1px] bg-white/10 flex-1"></div>
        </div>
        
        <div class="mt-md grid grid-cols-2 gap-sm">
            <button class="py-sm bg-surface-container border border-white/5 hover:bg-surface-variant rounded-lg flex items-center justify-center gap-xs text-sm transition-colors">
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" class="w-4 h-4 filter invert opacity-80" alt="GitHub"> GitHub
            </button>
            <button class="py-sm bg-surface-container border border-white/5 hover:bg-surface-variant rounded-lg flex items-center justify-center gap-xs text-sm transition-colors">
                <span class="text-blue-500 font-bold">G</span> Google
            </button>
        </div>
        
        <p class="text-center text-sm text-on-surface-variant mt-lg">
            Already have an account? <a href="#login" class="text-tertiary font-bold hover:underline">Sign in</a>
        </p>
    </div>
</div>`;
}
