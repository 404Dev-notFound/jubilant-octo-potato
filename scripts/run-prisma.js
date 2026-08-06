/*
 * Script to run Prisma commands via npx.
 * This script ensures all required environment variables, specifically
 * the DATABASE_URL, are loaded before invoking Prisma commands.
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { loadEnv } = require('../load-env.js');

loadEnv({ required: ['DATABASE_URL'] });

const args = ['prisma', ...process.argv.slice(2)];
const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: path.join(__dirname, '..'),
});

process.exit(result.status ?? 1);
