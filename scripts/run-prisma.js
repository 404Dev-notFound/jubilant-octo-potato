const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
const dbCommands = ['db', 'migrate', 'studio'];
const requiresDb = args.some(arg => dbCommands.includes(arg));

loadEnv({ required: requiresDb ? ['DATABASE_URL'] : [] });

const prismaCliPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
let result;

if (fs.existsSync(prismaCliPath)) {
  result = spawnSync(process.execPath, [prismaCliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..'),
  });
} else {
  const args = ['prisma', ...process.argv.slice(2)];
  result = spawnSync('npx', args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
    cwd: path.join(__dirname, '..'),
  });
}

process.exit(result.status ?? 1);

