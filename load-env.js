const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');

function loadEnv({ required = [] } = {}) {
  if (!fs.existsSync(envPath)) {
    console.error(`❌ .env file not found at: ${envPath}`);
    console.error('   Copy .env.example to .env and restart the server.');
    process.exit(1);
  }

  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('❌ Failed to load .env:', result.error.message);
    process.exit(1);
  }

  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Prisma Error: ${key} not found.`);
      console.error(`   Add ${key} to your .env file and restart the server.`);
      process.exit(1);
    }
  }
}

module.exports = { loadEnv, envPath };
