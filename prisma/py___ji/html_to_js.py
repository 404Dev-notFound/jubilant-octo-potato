import os
import glob
from bs4 import BeautifulSoup

def convert_html_to_js(source_dir, dest_dir):
    os.makedirs(dest_dir, exist_ok=True)
    html_files = glob.glob(os.path.join(source_dir, '*.html'))
    
    for html_file in html_files:
        basename = os.path.basename(html_file).replace('.html', '')
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        soup = BeautifulSoup(content, 'html.parser')
        # If the file has a body, extract it, otherwise use the whole thing
        if soup.body:
            html_content = "".join([str(tag) for tag in soup.body.children])
        else:
            html_content = content
            
        # Escape backticks and format
        html_content = html_content.replace('`', '\\`')
        html_content = html_content.replace('$', '\\$')
        
        # ensure safe characters for function names
        func_name = basename.replace('-', '_')
        
        js_content = f"export function render_{func_name}() {{\n    return `{html_content}`;\n}}\n"
        
        dest_file = os.path.join(dest_dir, f"{basename}.js")
        with open(dest_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Converted {html_file} -> {dest_file}")

if __name__ == '__main__':
    convert_html_to_js('codecollab_v2/views', 'codecollab_v2/js/views')
    convert_html_to_js('codecollab_v2/forms', 'codecollab_v2/js/forms')
    convert_html_to_js('codecollab_v2/temp_screens', 'codecollab_v2/js/temp_screens')
