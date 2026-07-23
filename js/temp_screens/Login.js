export function render_Login() {
    return `
 Animated Shader Background 
<div class="fixed inset-0 z-0">
<!-- STITCH_THREEJS_START:ANIMATION_2 class="absolute inset-0 w-full h-full opacity-40" -->
<div class="absolute inset-0 w-full h-full opacity-40" style="display:block;">
<script src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"></script>
<div id="threejs-container-ANIMATION_2" style="width:100%;height:100%"></div>
<script>
(function() {
  const container = document.getElementById('threejs-container-ANIMATION_2');
  const devicePixelRatio = window.devicePixelRatio || 1;
  
const i3 = i * 3;
const n = i / count;

// Independent mathematical frequencies
const t1 = time * 0.15;
const t2 = time * 0.11 + n * 2.0;
const t3 = time * 0.08 + n * 4.0;

// Procedural harmonic motion
const radius = 25.0 + 5.0 * Math.sin(t1 + n * 6.28);
const angle = n * 62.8 + t2;
const spiral = n * 15.0;

// Interference patterns & Spiral field
const x = radius * Math.cos(angle + spiral) * (1.0 + 0.2 * Math.sin(t3 * 2.5 + n * 10.0));
const y = radius * Math.sin(angle + spiral) * (1.0 + 0.2 * Math.cos(t2 * 1.8 + n * 12.0));
const z = 15.0 * Math.sin(t1 * 1.2 + n * 20.0) + 10.0 * Math.cos(t2 * 0.7 + n * 8.0);

// Rotational fields & fractal-inspired evolution
const rotX = x * Math.cos(t1) - z * Math.sin(t1);
const rotZ = x * Math.sin(t1) + z * Math.cos(t1);

target.set(rotX, y + Math.sin(t2 * 0.5) * 5.0, rotZ);

// Dynamic color evolution based on position and time
const hue = (0.6 + 0.1 * Math.sin(t1 + n * 5.0)) % 1.0;
const saturation = 0.8 + 0.2 * Math.cos(t3);
const lightness = 0.5 + 0.3 * Math.sin(t2 + n * 3.14);

color.setHSL(hue, saturation, lightness);

})();
</script>
</div>
<!-- STITCH_THREEJS_END:ANIMATION_2 -->
</div>
 Main Auth Container 
<main class="relative z-10 w-full max-w-[440px] p-md">
<!-- Brand Logo Anchor -->
<div class="flex flex-col items-center mb-xl">
<div class="mb-sm float-animation">
<span class="material-symbols-outlined text-primary text-[48px]" data-icon="terminal">terminal</span>
</div>
<h1 class="font-display text-headline-lg text-primary tracking-tighter">CODECOLLAB</h1>
<p class="font-label-md text-on-surface-variant mt-xs">High-performance developer workspace</p>
</div>
<!-- Auth Card -->
<div class="glass-panel p-lg rounded-xl shadow-2xl">
<!-- Toggle Tabs -->
<div class="flex border-b border-outline-variant mb-lg">
<button class="flex-1 py-sm font-label-md transition-all active-tab" id="login-tab" onclick="switchTab('login')">LOGIN</button>
<button class="flex-1 py-sm font-label-md text-on-surface-variant hover:text-on-surface transition-all" id="signup-tab" onclick="switchTab('signup')">SIGN UP</button>
</div>
<!-- Forms Content -->
<div class="space-y-lg">
<!-- Social Logins -->
<div class="grid grid-cols-1 gap-sm">
<button class="w-full h-12 bg-on-primary-container text-on-primary font-bold rounded-lg flex items-center justify-center gap-sm hover:opacity-90 transition-all border border-white/10 group">
<span class="material-symbols-outlined group-hover:rotate-12 transition-transform" data-icon="github" data-original-icon="github">bathtub</span>
<span class="font-label-md">CONTINUE WITH GITHUB</span>
</button>
<div class="grid grid-cols-2 gap-sm">
<button class="h-11 bg-surface-container text-on-surface rounded-lg flex items-center justify-center gap-xs border border-white/5 hover:bg-surface-variant transition-all">
<span class="material-symbols-outlined text-[18px]" data-icon="google" data-original-icon="google">circle</span>
<span class="font-label-sm">GOOGLE</span>
</button>
<button class="h-11 bg-surface-container text-on-surface rounded-lg flex items-center justify-center gap-xs border border-white/5 hover:bg-surface-variant transition-all">
<span class="material-symbols-outlined text-[18px]" data-icon="discord" data-original-icon="discord">diamond</span>
<span class="font-label-sm">DISCORD</span>
</button>
</div>
</div>
<!-- Divider -->
<div class="flex items-center gap-md">
<div class="h-[1px] flex-1 bg-outline-variant"></div>
<span class="font-label-sm text-outline">OR EMAIL</span>
<div class="h-[1px] flex-1 bg-outline-variant"></div>
</div>
<!-- Main Form -->
<form action="/dashboard" class="space-y-md" id="auth-form" onsubmit="return handleAuth(event)">
<div class="hidden transition-all duration-300" id="username-field">
<label class="block font-label-md text-on-surface-variant mb-xs">USERNAME</label>
<div class="relative">
<input class="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-lg px-md focus:border-primary outline-none text-on-surface auth-input transition-all placeholder:opacity-30" placeholder="dev_name" type="text"/>
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" data-icon="person">person</span>
</div>
</div>
<div>
<label class="block font-label-md text-on-surface-variant mb-xs">EMAIL ADDRESS</label>
<div class="relative">
<input class="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-lg px-md focus:border-primary outline-none text-on-surface auth-input transition-all placeholder:opacity-30" placeholder="name@company.com" required="" type="email"/>
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" data-icon="alternate_email">alternate_email</span>
</div>
</div>
<div>
<div class="flex justify-between items-center mb-xs">
<label class="block font-label-md text-on-surface-variant">PASSWORD</label>
<a class="font-label-sm text-primary hover:underline" href="#">Forgot?</a>
</div>
<div class="relative">
<input class="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded-lg px-md focus:border-primary outline-none text-on-surface auth-input transition-all placeholder:opacity-30" placeholder="••••••••" required="" type="password"/>
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] cursor-pointer" data-icon="visibility">visibility</span>
</div>
</div>
<div class="pt-sm">
<button class="w-full h-12 bg-primary-container text-white font-bold rounded-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-sm" id="submit-btn" type="submit">
<span id="submit-text">ACCESS WORKSPACE</span>
<span class="material-symbols-outlined text-[20px]" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</form>
<!-- Onboarding Footer -->
<p class="text-center font-body-sm text-on-surface-variant" id="onboarding-text">
                    Don't have an account? 
                    <button class="text-primary font-bold hover:underline" onclick="switchTab('signup')">Sign up</button>
</p>
</div>
</div>
<!-- System Status Footer -->
<div class="mt-xl flex flex-col items-center gap-sm opacity-60">
<div class="flex items-center gap-sm font-label-sm text-outline">
<span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                SYSTEMS OPERATIONAL
            </div>
<div class="flex gap-md font-label-sm text-outline">
<a class="hover:text-on-surface transition-colors" href="#">PRIVACY</a>
<a class="hover:text-on-surface transition-colors" href="#">TERMS</a>
<a class="hover:text-on-surface transition-colors" href="#">HELP</a>
</div>
</div>
</main>
<script>
        function switchTab(mode) {
            const loginTab = document.getElementById('login-tab');
            const signupTab = document.getElementById('signup-tab');
            const usernameField = document.getElementById('username-field');
            const submitText = document.getElementById('submit-text');
            const onboardingText = document.getElementById('onboarding-text');

            if (mode === 'signup') {
                loginTab.classList.remove('active-tab', 'text-primary');
                loginTab.classList.add('text-on-surface-variant');
                signupTab.classList.add('active-tab');
                signupTab.classList.remove('text-on-surface-variant');
                
                usernameField.classList.remove('hidden');
                submitText.textContent = 'CREATE ACCOUNT';
                onboardingText.innerHTML = 'Already a member? <button onclick="switchTab(\'login\')" class="text-primary font-bold hover:underline">Log in</button>';
            } else {
                signupTab.classList.remove('active-tab');
                signupTab.classList.add('text-on-surface-variant');
                loginTab.classList.add('active-tab');
                loginTab.classList.remove('text-on-surface-variant');

                usernameField.classList.add('hidden');
                submitText.textContent = 'ACCESS WORKSPACE';
                onboardingText.innerHTML = "Don't have an account? <button onclick=\"switchTab('signup')\" class=\"text-primary font-bold hover:underline\">Sign up</button>";
            }
        }

        function handleAuth(e) {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            const originalContent = btn.innerHTML;
            
            // Visual feedback
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin" data-icon="progress_activity">progress_activity</span> AUTHENTICATING...';
            
            // Simulate processing
            setTimeout(() => {
                window.location.href = '#dashboard';
                // In real scenario this would route to /dashboard as requested
                alert('Success! Transitioning to Workspace Dashboard.');
            }, 1200);
            
            return false;
        }

        // Add subtle mouse movement parallax to the background
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            document.querySelector('webgl-shader').style.transform = \`translate(\${moveX}px, \${moveY}px) scale(1.1)\`;
        });
    </script>
`;
}
