import os
import glob
from bs4 import BeautifulSoup

base_dir = 'codecollab_v2'
views_dir = os.path.join(base_dir, 'views')
os.makedirs(views_dir, exist_ok=True)
os.makedirs(os.path.join(base_dir, 'js'), exist_ok=True)

# 1. Read the original screens to extract head and copy to views
screens = glob.glob(os.path.join(base_dir, 'temp_screens', '*.html'))

if not screens:
    print("No screens found in temp_screens!")
    exit(1)

# Extract head from the first screen
with open(screens[0], 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

head_content = "".join([str(tag) for tag in soup.head.children])
body_classes = soup.body.get('class', [])
body_class_str = ' '.join(body_classes) if body_classes else "bg-surface-container-lowest text-on-surface font-body-md min-h-screen"

# Process existing screens
existing_views = []
for screen_path in screens:
    name = os.path.basename(screen_path).replace('.html', '')
    with open(screen_path, 'r', encoding='utf-8') as f:
        screen_html = f.read()
    
    screen_soup = BeautifulSoup(screen_html, 'html.parser')
    body_content = "".join([str(child) for child in screen_soup.body.children])
    
    view_path = os.path.join(views_dir, f"{name.lower()}.html")
    with open(view_path, 'w', encoding='utf-8') as f:
        f.write(body_content)
    existing_views.append(name.lower())

# 2. Create templates for missing pages
missing_pages = [
    "explore", "add_project", "organizations", "learning_center",
    "resources", "events", "leaderboard", "team_collaboration",
    "issues", "pull_requests", "notifications", "user_profile",
    "settings", "about", "contact", "welcome", "account_setup"
]

boilerplate = """
<main class="relative z-10 w-full p-xl flex flex-col min-h-screen">
    <div class="glass-panel p-lg rounded-xl flex-1 flex flex-col mt-xl">
        <h1 class="font-display text-headline-lg text-primary mb-md">{title}</h1>
        <div class="h-[1px] bg-outline-variant mb-lg"></div>
        <div class="flex-1 text-on-surface-variant flex items-center justify-center border-2 border-dashed border-outline-variant rounded-lg">
            <div class="text-center">
                <span class="material-symbols-outlined text-[48px] mb-sm opacity-50" data-icon="construction">construction</span>
                <h2 class="text-headline-md text-on-surface mb-xs">Module Under Construction</h2>
                <p>The {title} functionality is currently being assembled.</p>
            </div>
        </div>
    </div>
</main>
"""

for page in missing_pages:
    if page not in existing_views:
        view_path = os.path.join(views_dir, f"{page}.html")
        title = page.replace('_', ' ').title()
        with open(view_path, 'w', encoding='utf-8') as f:
            f.write(boilerplate.replace("{title}", title))

# 3. Create App Shell index.html
# We will include a navigation header in the app shell so it's shared across pages
shell_html = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    {head_content}
    <link rel="stylesheet" href="css/design-system.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="{body_class_str} flex flex-col">
    <!-- Shared Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 bg-[#0B0E14]/70 backdrop-blur-xl border-b border-white/10">
        <div class="max-w-[1400px] mx-auto px-lg h-[70px] flex items-center justify-between">
            <a href="#home_explore" class="flex items-center gap-sm group">
                <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">terminal</span>
                <span class="font-display text-[20px] font-bold tracking-tight text-on-surface">CODECOLLAB</span>
            </a>
            
            <div class="hidden md:flex items-center gap-lg font-label-sm">
                <a href="#dashboard" class="text-on-surface-variant hover:text-primary transition-colors">DASHBOARD</a>
                <a href="#explore" class="text-on-surface-variant hover:text-primary transition-colors">EXPLORE</a>
                <a href="#issues" class="text-on-surface-variant hover:text-primary transition-colors">ISSUES</a>
                <a href="#community_hub" class="text-on-surface-variant hover:text-primary transition-colors">COMMUNITY</a>
                <a href="#ai_workspace" class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[16px] text-tertiary">smart_toy</span> AI
                </a>
            </div>

            <div class="flex items-center gap-sm">
                <div class="relative hidden sm:block">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input type="text" placeholder="Search..." class="bg-surface-variant border border-white/5 rounded-full pl-xl pr-md py-[6px] text-sm text-on-surface outline-none focus:border-primary/50 transition-all w-[200px] focus:w-[280px]">
                </div>
                <a href="#notifications" class="p-xs text-on-surface-variant hover:text-primary transition-colors relative">
                    <span class="material-symbols-outlined">notifications</span>
                    <span class="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse"></span>
                </a>
                <a href="#user_profile" class="w-[32px] h-[32px] rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm ml-sm hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                    U
                </a>
            </div>
        </div>
    </nav>

    <!-- App Content Injection Point -->
    <div id="app-content" class="flex-1 w-full relative pt-[70px]">
        <!-- Views will be loaded here -->
        <div class="flex items-center justify-center min-h-[50vh]">
            <span class="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
        </div>
    </div>
    
    <!-- Shared Toast Container -->
    <div id="toast-container" class="fixed bottom-lg right-lg z-50 flex flex-col gap-sm"></div>

    <script src="js/data.js"></script>
    <script src="js/components.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
"""

with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(shell_html)

print("Architecture refactored successfully.")
