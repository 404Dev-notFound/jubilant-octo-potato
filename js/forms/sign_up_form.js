export function render_sign_up_form() {
    return `<div class="glass-panel rounded-2xl border-t-4 border-t-tertiary overflow-hidden shadow-2xl max-w-md w-full mx-auto animate-fade-in-up">
    <div class="flex justify-between items-center p-md border-b border-white/5 bg-surface-container relative">
        <h3 class="font-bold text-xl text-on-surface flex items-center gap-xs">
            <span class="material-symbols-outlined text-tertiary">person_add</span>
            Create Account
        </h3>
        <button data-close-modal class="text-on-surface-variant hover:text-error transition-colors p-1 absolute right-4 top-4">
            <span class="material-symbols-outlined">close</span>
        </button>
    </div>
    
    <div class="p-xl">
        <form id="signUpForm" class="space-y-md" >
            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Full Name</label>
                <input type="text" name="name" required placeholder="Alex Developer" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-tertiary transition-colors">
            </div>
            
            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Email Address</label>
                <input type="email" name="email" required placeholder="dev@example.com" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-tertiary transition-colors">
            </div>

            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Mobile Number</label>
                <div class="relative">
                    <input type="tel" name="mobileNumber" required placeholder="+1 234 567 8900" pattern="[+]?[0-9\s\-()]{7,20}" title="Please provide a valid mobile number (7-20 digits)" class="w-full bg-surface-container border border-white/10 rounded-xl px-md py-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Password</label>
                <div class="relative">
                    <input type="password" id="signup-modal-password" name="password" required placeholder="••••••••" class="w-full bg-surface-container border border-white/10 rounded-xl pl-md pr-20 py-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                    <button type="button" data-toggle-password="signup-modal-password" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-mono select-none px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer" aria-label="Toggle password visibility">
                        <span class="material-symbols-outlined text-[16px]">visibility</span>
                        <span class="password-toggle-label text-[11px] font-bold">Show</span>
                    </button>
                </div>
            </div>

            <div>
                <label class="block text-sm font-label-sm text-on-surface mb-xs">Confirm Password</label>
                <div class="relative">
                    <input type="password" id="signup-modal-confirm-password" required placeholder="••••••••" class="w-full bg-surface-container border border-white/10 rounded-xl pl-md pr-20 py-sm text-on-surface outline-none focus:border-tertiary transition-colors">
                    <button type="button" data-toggle-password="signup-modal-confirm-password" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-mono select-none px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer" aria-label="Toggle confirm password visibility">
                        <span class="material-symbols-outlined text-[16px]">visibility</span>
                        <span class="password-toggle-label text-[11px] font-bold">Show</span>
                    </button>
                </div>
            </div>
            
            <button type="submit" class="w-full py-md bg-tertiary text-on-tertiary rounded-xl font-bold shadow-lg shadow-tertiary/20 hover:scale-[1.02] transition-transform mt-sm flex justify-center items-center gap-xs">
                Sign Up <span class="material-symbols-outlined text-sm">rocket_launch</span>
            </button>
        </form>
        
        <div class="mt-lg text-center text-sm text-on-surface-variant">
            Already have an account? 
            <a href="#" data-form="login_form" class="text-tertiary font-bold hover:underline">Log in</a>
        </div>
    </div>
</div>
`;
}
