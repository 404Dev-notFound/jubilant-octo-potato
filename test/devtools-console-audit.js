const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testFrontendRoutes() {
    console.log('====================================================');
    console.log('🖥️ DevTools Network & Console Simulation Pass');
    console.log('====================================================');

    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

    const virtualConsole = new jsdom.VirtualConsole();
    const consoleErrors = [];
    const consoleWarns = [];

    virtualConsole.on('error', (...args) => {
        consoleErrors.push(args.join(' '));
    });
    virtualConsole.on('warn', (...args) => {
        consoleWarns.push(args.join(' '));
    });

    const dom = new JSDOM(indexHtml, {
        url: 'http://localhost:3000/#home',
        runScripts: 'dangerously',
        resources: 'usable',
        virtualConsole,
        pretendToBeVisual: true
    });

    // Provide browser mocks if needed by Three.js / Canvas
    dom.window.HTMLCanvasElement.prototype.getContext = () => null;

    console.log('DOM initialized. Waiting for initial page load and script resolution...');
    await new Promise(r => setTimeout(r, 2000));

    console.log(`Initial Load Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
        consoleErrors.forEach(e => console.log('  ⚠️ Console Error:', e));
    }

    const routes = [
        '#explore',
        '#issues',
        '#community',
        '#leaderboard',
        '#about',
        '#contact',
        '#terms',
        '#privacy',
        '#user_profile',
        '#notifications',
        '#dashboard'
    ];

    for (const route of routes) {
        console.log(`Navigating to ${route}...`);
        dom.window.location.hash = route;
        dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
        await new Promise(r => setTimeout(r, 600));
    }

    console.log('====================================================');
    console.log(`Simulation Complete.`);
    console.log(`Total Console Errors across all route transitions: ${consoleErrors.length}`);
    console.log(`Total Console Warnings: ${consoleWarns.length}`);
    console.log('====================================================');

    process.exit(consoleErrors.length > 0 ? 1 : 0);
}

testFrontendRoutes().catch(err => {
    console.error('Audit simulation encountered fatal error:', err);
    process.exit(1);
});
