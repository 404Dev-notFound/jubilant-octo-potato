/**
 * Build Verification Script (Phase 19)
 * Checks:
 * - production CSS exists and is non-empty
 * - generated CSS is not stale relative to source CSS or tailwind config
 * - Prisma client is generated
 * - Required frontend core modules exist
 * - Exits with code 0 on success, or non-zero on fatal check in production
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function verifyBuild(options = { exitOnError: true, silent: false }) {
    const issues = [];
    const warnings = [];

    // 1. Check production CSS
    const prodCssPath = path.join(rootDir, 'css', 'tailwind.prod.css');
    const srcCssPath = path.join(rootDir, 'css', 'tailwind.src.css');
    const configPath = path.join(rootDir, 'tailwind.config.js');

    if (!fs.existsSync(prodCssPath)) {
        issues.push(`Production CSS missing: ${path.relative(rootDir, prodCssPath)}. Run 'npm run build' to generate.`);
    } else {
        const prodStat = fs.statSync(prodCssPath);
        if (prodStat.size < 1000) {
            issues.push(`Production CSS appears truncated or empty (${prodStat.size} bytes): ${path.relative(rootDir, prodCssPath)}`);
        }

        // Check staleness relative to source files
        if (fs.existsSync(srcCssPath)) {
            const srcStat = fs.statSync(srcCssPath);
            if (srcStat.mtimeMs > prodStat.mtimeMs) {
                warnings.push(`Production CSS is older than source CSS (${path.relative(rootDir, srcCssPath)}). Re-run 'npm run build'.`);
            }
        }
        if (fs.existsSync(configPath)) {
            const configStat = fs.statSync(configPath);
            if (configStat.mtimeMs > prodStat.mtimeMs) {
                warnings.push(`Production CSS is older than tailwind.config.js. Re-run 'npm run build'.`);
            }
        }
    }

    // 2. Check Prisma Client
    const prismaGenPath = path.join(rootDir, 'prisma', 'generated', 'client', 'index.js');
    const prismaNodeModulesPath = path.join(rootDir, 'node_modules', '.prisma', 'client', 'index.js');
    const hasPrisma = fs.existsSync(prismaGenPath) || fs.existsSync(prismaNodeModulesPath);

    if (!hasPrisma) {
        warnings.push(`Prisma Client not found at ${path.relative(rootDir, prismaGenPath)}. If running with database, execute 'npx prisma generate'.`);
    }

    // 3. Check Core Frontend Assets
    const requiredAssets = [
        'index.html',
        'favicon.svg',
        'css/design-system.css',
        'css/styles.css',
        'js/app.js',
        'js/session.js',
        'js/command_palette.js',
        'js/components.js',
        'js/nebula.js'
    ];

    for (const asset of requiredAssets) {
        const assetPath = path.join(rootDir, asset);
        if (!fs.existsSync(assetPath)) {
            issues.push(`Required frontend asset missing: ${asset}`);
        }
    }

    const isOk = issues.length === 0;

    if (!options.silent) {
        if (isOk && warnings.length === 0) {
            console.log('✅ [Build Verification] All production assets, CSS bundles, and generated artifacts are verified and fresh.');
        } else {
            if (warnings.length > 0) {
                console.warn('⚠️ [Build Verification Warnings]:\n  - ' + warnings.join('\n  - '));
            }
            if (issues.length > 0) {
                console.error('❌ [Build Verification Failures]:\n  - ' + issues.join('\n  - '));
            }
        }
    }

    if (options.exitOnError && !isOk) {
        process.exit(1);
    }

    return { isOk, issues, warnings };
}

if (require.main === module) {
    verifyBuild({ exitOnError: true, silent: false });
}

module.exports = { verifyBuild };
