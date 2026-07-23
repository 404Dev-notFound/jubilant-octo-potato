export function render_login_form() {
    return `<div class="glass-panel rounded-2xl border-t-4 border-t-primary overflow-hidden shadow-2xl max-w-md w-full mx-auto animate-fade-in-up">
    <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container relative">
        <h3 class="font-bold text-xl text-on-surface flex items-center gap-xs">
            <span class="material-symbols-outlined text-primary">login</span>
            Welcome Back
        </h3>
        <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 absolute right-4 top-4">
            <span class="material-symbols-outlined">close</span>
        </button>
    </div>
    
    <div class="p-xl">
        <p class="text-on-surface-variant mb-lg text-sm text-center">Sign in to continue to CODECOLLAB.</p>
        
        <form id="loginForm" class="space-y-md" >
            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Email Address</label>
                <input type="email" name="email" required placeholder="dev@example.com" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-primary transition-colors">
            </div>
            
            <div>
                <div class="flex justify-between mb-xs">
                    <label class="block text-sm font-label-sm text-on-surface">Password</label>
                    <a href="#" class="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <input type="password" name="password" required placeholder="••••••••" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-primary transition-colors">
            </div>
            
            <button type="submit" class="w-full py-md bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform mt-sm flex justify-center items-center gap-xs">
                Sign In <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
        </form>
        
        <div class="mt-lg text-center text-sm text-on-surface-variant">
            Don't have an account? 
            <a href="#" data-form="sign_up_form" class="text-primary font-bold hover:underline">Create one</a>
        </div>
    </div>
</div>
`;
}
