const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:3000/#explore' });
setTimeout(() => {
    const btn = dom.window.document.querySelector('button[data-form="add_project_form"]');
    console.log(btn ? 'Button exists: ' + btn.outerHTML : 'Button not found');
    console.log(dom.window.document.getElementById('app-content').innerHTML.substring(0, 300));
}, 2000);
