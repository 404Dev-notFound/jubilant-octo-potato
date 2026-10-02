const app = require('../server');

console.log('App router keys:', Object.keys(app.router || {}));
const stack = app.router ? app.router.stack : (app._router ? app._router.stack : []);
console.log('Stack length:', stack.length);

const routes = [];
stack.forEach(layer => {
    if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        routes.push(`${methods.padEnd(7)} ${layer.route.path}`);
    }
});
console.log(`Found ${routes.length} direct routes:`);
routes.forEach(r => console.log(r));
process.exit(0);
