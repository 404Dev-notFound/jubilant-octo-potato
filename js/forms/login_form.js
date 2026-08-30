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
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Mobile Number</label>
                <input type="tel" name="mobileNumber" required placeholder="+1 234 567 8900" pattern="[+]?[0-9\\s\\-()]{7,20}" title="Please enter a valid mobile number (7-20 digits)" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-primary transition-colors">
            </div>
            
            <div>
                <div class="flex justify-between mb-xs">
                    <label class="block text-sm font-label-sm text-on-surface">Password</label>
                    <a href="#" data-contact-admin="forgot-password" class="text-xs text-primary hover:underline flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-[14px]">support_agent</span>
                        Forgot password?
                    </a>
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
        <div class="mt-md text-center">
            <button type="button" data-contact-admin="general" class="text-xs text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">contact_support</span> Need help? Contact Administrator
            </button>
        </div>
    </div>
</div>
`;
}
