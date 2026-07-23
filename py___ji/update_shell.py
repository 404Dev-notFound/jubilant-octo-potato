import os
from bs4 import BeautifulSoup

base_dir = 'codecollab_v2'

# Read rose_nebula.html
with open(os.path.join(base_dir, 'rose_nebula.html'), 'r', encoding='utf-8') as f:
    nebula_soup = BeautifulSoup(f.read(), 'html.parser')

import_map = ""
for script in nebula_soup.head.find_all('script'):
    if script.get('type') == 'importmap':
        import_map = str(script)

nebula_script = ""
for script in nebula_soup.body.find_all('script'):
    if script.get('type') == 'module':
        nebula_script = str(script)

# Add opacity and scroll parallax to the script
nebula_script = nebula_script.replace('document.body.appendChild(renderer.domElement);', 
'''
renderer.domElement.id = 'nebula-canvas';
document.getElementById('nebula-bg').appendChild(renderer.domElement);
''')

# We need to make sure the orbit controls don't intercept mouse clicks for the whole page.
# Remove OrbitControls if it blocks the UI, or disable them.
nebula_script = nebula_script.replace('const controls = new OrbitControls(camera, renderer.domElement);', '/* OrbitControls disabled for background */')
nebula_script = nebula_script.replace('controls.enableDamping = true;', '')
nebula_script = nebula_script.replace('controls.autoRotate = AUTO_SPIN;', '')
nebula_script = nebula_script.replace('controls.autoRotateSpeed = 2.0;', '')
nebula_script = nebula_script.replace('controls.update();', '')
# Add simple auto-rotation to camera instead
nebula_script = nebula_script.replace('// SWARM LOGIC', 
'''
camera.position.x = Math.sin(time * 0.1) * 100;
camera.position.z = Math.cos(time * 0.1) * 100;
camera.lookAt(0, 0, 0);
// SWARM LOGIC
''')

# Read current index.html to keep Tailwind setup
with open(os.path.join(base_dir, 'index.html'), 'r', encoding='utf-8') as f:
    index_soup = BeautifulSoup(f.read(), 'html.parser')

tailwind_scripts = ""
for script in index_soup.head.find_all('script'):
    if 'tailwind' in str(script):
        tailwind_scripts += str(script) + "\n"
        
fonts = ""
for link in index_soup.head.find_all('link'):
    if 'fonts.googleapis' in str(link):
        fonts += str(link) + "\n"

new_index_html = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CODECOLLAB - Open Source Platform</title>
    {fonts}
    {tailwind_scripts}
    <link rel="stylesheet" href="css/design-system.css">
    <link rel="stylesheet" href="css/styles.css">
    {import_map}
    <style>
        #nebula-bg {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            opacity: 0.5; /* Default for non-home pages */
            transition: opacity 0.5s, transform 0.1s;
            pointer-events: none; /* Let clicks pass through */
        }}
        #nebula-canvas {{
            width: 100% !important;
            height: 100% !important;
        }}
    </style>
</head>
<body class="bg-surface-container-lowest text-on-surface font-body-md min-h-screen flex flex-col relative overflow-x-hidden">
    <!-- Rose Nebula Background -->
    <div id="nebula-bg"></div>

    <!-- Shared Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/10">
        <div class="max-w-[1400px] mx-auto px-lg h-[70px] flex items-center justify-between">
            <a href="#home" class="flex items-center gap-sm group">
                <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">terminal</span>
                <span class="font-display text-[20px] font-bold tracking-tight text-on-surface">CODECOLLAB</span>
            </a>
            
            <div class="hidden lg:flex items-center gap-lg font-label-sm">
                <a href="#dashboard" class="text-on-surface-variant hover:text-primary transition-colors">DASHBOARD</a>
                <a href="#explore" class="text-on-surface-variant hover:text-primary transition-colors">EXPLORE</a>
                <a href="#issues" class="text-on-surface-variant hover:text-primary transition-colors">ISSUES</a>
                <a href="#community" class="text-on-surface-variant hover:text-primary transition-colors">COMMUNITY</a>
                <a href="#ai_workspace" class="text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[16px] text-tertiary">smart_toy</span> AI
                </a>
            </div>

            <div class="flex items-center gap-sm">
                <div class="relative hidden sm:block">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input type="text" placeholder="Search projects, users..." class="bg-surface-variant border border-white/5 rounded-full pl-xl pr-md py-[6px] text-sm text-on-surface outline-none focus:border-primary/50 transition-all w-[200px] focus:w-[280px]">
                </div>
                
                <a href="#ai_chat" data-action="modal" data-target="ai-assistant-modal" class="p-xs text-on-surface-variant hover:text-tertiary transition-colors relative cursor-pointer" title="AI Assistant">
                    <span class="material-symbols-outlined">psychology</span>
                </a>
                
                <a href="#notifications" class="p-xs text-on-surface-variant hover:text-primary transition-colors relative">
                    <span class="material-symbols-outlined">notifications</span>
                    <span class="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse"></span>
                </a>
                
                <!-- Profile Menu Dropdown Trigger -->
                <div class="relative group cursor-pointer ml-sm">
                    <div class="w-[32px] h-[32px] rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-primary/50 transition-all">
                        U
                    </div>
                    <!-- Dropdown -->
                    <div class="absolute right-0 mt-2 w-48 bg-surface-container-high rounded-xl border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                        <div class="p-xs flex flex-col">
                            <a href="#user_profile" class="px-md py-sm text-sm text-on-surface hover:bg-surface-variant rounded-lg transition-colors">Profile</a>
                            <a href="#settings" class="px-md py-sm text-sm text-on-surface hover:bg-surface-variant rounded-lg transition-colors">Settings</a>
                            <div class="h-[1px] bg-outline-variant w-full my-xs"></div>
                            <a href="#login" class="px-md py-sm text-sm text-error hover:bg-error/10 rounded-lg transition-colors">Sign out</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- App Content Injection Point -->
    <div id="app-content" class="flex-1 w-full relative pt-[70px]">
        <div class="flex items-center justify-center min-h-[50vh]">
            <span class="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
        </div>
    </div>
    
    <!-- Comprehensive Footer -->
    <footer class="bg-surface-container-lowest border-t border-white/5 mt-auto relative z-10">
        <div class="max-w-[1400px] mx-auto px-lg py-xl">
            <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-xl">
                <div class="lg:col-span-2">
                    <a href="#home" class="flex items-center gap-sm mb-md">
                        <span class="material-symbols-outlined text-primary text-[24px]">terminal</span>
                        <span class="font-display text-[20px] font-bold text-on-surface">CODECOLLAB</span>
                    </a>
                    <p class="text-on-surface-variant text-sm mb-lg max-w-sm">
                        Connecting developers, maintainers, and organizations through open-source collaboration and intelligent code review.
                    </p>
                    <div class="flex gap-sm">
                        <a href="#" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-all"><span class="material-symbols-outlined text-[18px]">code</span></a>
                        <a href="#" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-all"><span class="material-symbols-outlined text-[18px]">forum</span></a>
                        <a href="#" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-all"><span class="material-symbols-outlined text-[18px]">public</span></a>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold text-on-surface mb-md">Platform</h4>
                    <ul class="space-y-sm text-sm text-on-surface-variant">
                        <li><a href="#explore" class="hover:text-primary transition-colors">Explore Projects</a></li>
                        <li><a href="#ai_workspace" class="hover:text-primary transition-colors">AI Workspace</a></li>
                        <li><a href="#organizations" class="hover:text-primary transition-colors">Organizations</a></li>
                        <li><a href="#leaderboard" class="hover:text-primary transition-colors">Leaderboard</a></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="font-bold text-on-surface mb-md">Resources</h4>
                    <ul class="space-y-sm text-sm text-on-surface-variant">
                        <li><a href="#documentation" class="hover:text-primary transition-colors">Documentation</a></li>
                        <li><a href="#learning_center" class="hover:text-primary transition-colors">Learning Center</a></li>
                        <li><a href="#events" class="hover:text-primary transition-colors">Events & Hackathons</a></li>
                        <li><a href="#community" class="hover:text-primary transition-colors">Community Forum</a></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="font-bold text-on-surface mb-md">Company</h4>
                    <ul class="space-y-sm text-sm text-on-surface-variant">
                        <li><a href="#about" class="hover:text-primary transition-colors">About Us</a></li>
                        <li><a href="#contact" class="hover:text-primary transition-colors">Contact</a></li>
                        <li><a href="#terms" class="hover:text-primary transition-colors">Terms of Service</a></li>
                        <li><a href="#privacy" class="hover:text-primary transition-colors">Privacy Policy</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="h-[1px] bg-white/5 w-full my-lg"></div>
            
            <div class="flex flex-col md:flex-row items-center justify-between text-xs text-on-surface-variant">
                <p>&copy; 2026 CodeCollab Inc. All rights reserved.</p>
                <p>Version 2.0.0-rc1</p>
            </div>
        </div>
    </footer>

    <!-- Global Modal Container -->
    <div id="modal-container" class="fixed inset-0 z-[100] flex items-center justify-center p-lg opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"></div>
        <div id="modal-content" class="relative z-10 w-full max-w-2xl transform scale-95 transition-transform duration-300"></div>
    </div>
    
    <!-- Shared Toast Container -->
    <div id="toast-container" class="fixed bottom-lg right-lg z-[100] flex flex-col gap-sm"></div>

    <script src="js/data.js"></script>
    <script src="js/components.js"></script>
    <script src="js/app.js"></script>
    
    <!-- Nebula Script (Modified) -->
    {nebula_script}
</body>
</html>
"""

with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(new_index_html)

print("App shell index.html successfully updated with Rose Nebula, Navigation, and Footer.")
