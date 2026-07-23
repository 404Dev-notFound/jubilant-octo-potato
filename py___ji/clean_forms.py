import glob, re

for f in glob.glob('codecollab_v2/js/forms/*.js'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove onsubmit attributes
    new_content = re.sub(r'onsubmit="[^"]*"', '', content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')
