/*
 * Utility module to load environment variables.
 * Supports local .env file as well as direct container/cloud environment injection.
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');

/*
 * Load environment variables, checking for required keys.
 * In containerized/cloud environments, variables are often passed directly via process.env.
 */
function loadEnv({ required = ['JWT_SECRET', 'DATABASE_URL'] } = {}) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.warn('⚠️  Warning: Failed to parse .env file:', result.error.message);
    }
  }

  const missing = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Environment Configuration Error: Missing required variable(s): ${missing.join(', ')}`);
    if (!fs.existsSync(envPath)) {
      console.error(`   No .env file found at: ${envPath}`);
      console.error('   Please provide required variables via .env or container environment variables.');
    }
    // In production, exit if critical secrets are missing
    if (process.env.NODE_ENV === 'production' || missing.includes('JWT_SECRET')) {
      process.exit(1);
    }
  }
}

module.exports = { loadEnv, envPath };

