import os
import glob
from bs4 import BeautifulSoup

# Run pip install beautifulsoup4 first if needed.

screens = glob.glob('codecollab_v2/temp_screens/*.html')

if not screens:
    print("No screens found!")
    exit(1)

with open(screens[0], 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

head_content = "".join([str(tag) for tag in soup.head.children])
body_classes = soup.body.get('class', [])

all_screens_html = ""

for screen_path in screens:
    name = os.path.basename(screen_path).replace('.html', '')
    with open(screen_path, 'r', encoding='utf-8') as f:
        screen_html = f.read()
    
    screen_soup = BeautifulSoup(screen_html, 'html.parser')
    
    # Extract body content
    body_content = "".join([str(child) for child in screen_soup.body.children])
                
    all_screens_html += f'<div id="screen-{name}" class="screen">\n{body_content}\n</div>\n'

index_html = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    {head_content}
    <link rel="stylesheet" href="css/design-system.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="{' '.join(body_classes)}">
    {all_screens_html}
    <script src="js/app.js"></script>
</body>
</html>
"""

os.makedirs('codecollab_v2/css', exist_ok=True)
os.makedirs('codecollab_v2/js', exist_ok=True)

with open('codecollab_v2/index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print("SPA index.html built successfully.")
