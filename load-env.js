/*
 * Utility module to load environment variables from a .env file.
 * Ensures the required .env file exists and validates required keys.
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables, ensuring DATABASE_URL is set


const envPath = path.join(__dirname, '.env');

/*
 * Load environment variables, optionally checking for required keys.
 * Exits the process with an error message if .env is missing or required keys are absent.
 */
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
