export function render_login() {
    return `<div class="flex items-center justify-center min-h-[80vh]">
    <div class="glass-panel p-xl rounded-2xl w-full max-w-md border-t-4 border-t-primary shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10"></div>
        <div class="text-center mb-lg">
            <span class="material-symbols-outlined text-[48px] text-primary mb-sm">terminal</span>
            <h2 class="font-display text-headline-md font-bold">Welcome Back</h2>
            <p class="text-on-surface-variant text-sm mt-1">Sign in to continue to CodeCollab</p>
        </div>
        
        <form id="loginForm" class="space-y-md">
            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">EMAIL ADDRESS</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">mail</span>
                    <input type="email" name="email" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors" placeholder="you@example.com" required>
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-on-surface-variant mb-xs">MOBILE NUMBER</label>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">phone</span>
                    <input type="tel" name="mobileNumber" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-md py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors" placeholder="+1 234 567 8900" pattern="[+]?[0-9\\s\\-()]{7,20}" title="Please enter a valid mobile number (7-20 digits)" required>
                </div>
            </div>
            <div>
                <div class="flex justify-between items-end mb-xs">
                    <label class="block text-xs font-bold text-on-surface-variant">PASSWORD</label>
                    <a href="#" data-contact-admin="forgot-password" class="text-xs text-primary hover:underline flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-[13px]">support_agent</span>
                        Forgot?
                    </a>
                </div>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">lock</span>
                    <input type="password" id="login-view-password" name="password" class="w-full bg-surface-container border border-white/10 rounded-lg pl-xl pr-20 py-sm text-sm text-on-surface outline-none focus:border-primary transition-colors" placeholder="••••••••" required>
                    <button type="button" data-toggle-password="login-view-password" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-xs font-mono select-none px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer" aria-label="Toggle password visibility">
                        <span class="material-symbols-outlined text-[15px]">visibility</span>
                        <span class="password-toggle-label text-[11px] font-bold">Show</span>
                    </button>
                </div>
            </div>
            
            <button type="submit" class="w-full py-sm bg-primary text-on-primary font-bold rounded-lg shadow-lg hover:bg-primary-container transition-colors">SIGN IN</button>
        </form>
        
        <div class="mt-lg flex items-center gap-sm">
            <div class="h-[1px] bg-white/10 flex-1"></div>
            <span class="text-xs text-on-surface-variant uppercase tracking-wider">Or continue with</span>
            <div class="h-[1px] bg-white/10 flex-1"></div>
        </div>
        
        <div class="mt-md grid grid-cols-2 gap-sm">
            <button type="button" data-oauth="github" class="py-sm bg-surface-container border border-white/5 hover:bg-surface-variant rounded-lg flex items-center justify-center gap-xs text-sm transition-colors cursor-pointer">
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" class="w-4 h-4 filter invert opacity-80" alt="GitHub"> GitHub
            </button>
            <button type="button" data-oauth="google" class="py-sm bg-surface-container border border-white/5 hover:bg-surface-variant rounded-lg flex items-center justify-center gap-xs text-sm transition-colors cursor-pointer">
                <span class="text-blue-500 font-bold">G</span> Google
            </button>
        </div>
        
        <p class="text-center text-sm text-on-surface-variant mt-lg">
            Don't have an account? <a href="#sign_up" class="text-primary hover:underline">Sign up</a>
        </p>
    </div>
</div>`;
}
