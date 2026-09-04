const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const dirsToCheck = ['src', 'js', 'test', 'scripts'];
const individualFiles = ['server.js'];

let totalChecked = 0;
let errors = [];

function checkFile(filePath) {
    totalChecked++;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const isEsModule = /^\s*(import|export)\b/m.test(content) || filePath.includes('js\\views\\') || filePath.includes('js\\forms\\') || filePath.includes('js/views/') || filePath.includes('js/forms/');

        if (isEsModule) {
            // Check ES Module syntax via vm.SourceTextModule if available or dynamic import via data URI
            if (vm.SourceTextModule) {
                new vm.SourceTextModule(content, { identifier: filePath });
            } else {
                // Fallback: check function syntax wrapping if export stripped, or compile
                const sanitized = content
                    .replace(/^(\s*)import\s+.*?;?$/gm, '$1// import')
                    .replace(/^(\s*)export\s+default\s+/gm, '$1')
                    .replace(/^(\s*)export\s+(\{[^}]*\}|const|let|var|function|class|async\s+function)/gm, '$1$2');
                new vm.Script(sanitized, { filename: filePath });
            }
        } else {
            new vm.Script(content, { filename: filePath });
        }
    } catch (err) {
        errors.push({ filePath, message: err.message });
    }
}

function walkDir(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.git') {
                walkDir(fullPath);
            }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            checkFile(fullPath);
        }
    }
}

for (const dir of dirsToCheck) {
    const fullDir = path.join(rootDir, dir);
    if (fs.existsSync(fullDir)) {
        walkDir(fullDir);
    }
}

for (const file of individualFiles) {
    const fullFile = path.join(rootDir, file);
    if (fs.existsSync(fullFile)) {
        checkFile(fullFile);
    }
}

console.log(`Checked ${totalChecked} JavaScript files across the codebase.`);
if (errors.length > 0) {
    console.error(`❌ Found ${errors.length} syntax errors:`);
    for (const err of errors) {
        console.error(`- ${path.relative(rootDir, err.filePath)}: ${err.message}`);
    }
    process.exit(1);
} else {
    console.log(`✅ 100% of ${totalChecked} JavaScript files passed syntax compilation with ZERO errors!`);
}
