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
 * In containerized/cloud environments, variables are injected directly via process.env.
 */
function loadEnv({ required = [] } = {}) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.warn('⚠️  Warning: Failed to parse local .env file:', result.error.message);
    }
  }

  const missing = [];
  for (const key of required) {
    const val = process.env[key];
    if (!val || typeof val !== 'string' || val.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Environment Configuration Error: Missing required variable(s): ${missing.join(', ')}`);
    if (!fs.existsSync(envPath)) {
      console.error(`   No local .env file found at: ${envPath}`);
      console.error('   Please configure the required environment variable(s) in your cloud platform dashboard.');
    }
    // In production or when critical variables are missing, exit fail-fast
    if (process.env.NODE_ENV === 'production' || missing.includes('JWT_SECRET') || missing.includes('DATABASE_URL')) {
      process.exit(1);
    }
  }
}

module.exports = { loadEnv, envPath };

