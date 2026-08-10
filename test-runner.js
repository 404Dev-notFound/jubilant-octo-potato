const { spawn } = require('child_process');

const server = spawn('node', ['server.js'], { stdio: 'inherit' });

setTimeout(() => {
    const test = spawn('node', ['test-req.js'], { stdio: 'inherit' });
    test.on('close', (code) => {
        server.kill();
        process.exit(code);
    });
}, 2000);
