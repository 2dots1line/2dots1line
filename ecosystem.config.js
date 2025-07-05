const path = require('path');
require('dotenv').config(); // Load .env file explicitly

const appsPath = path.resolve(__dirname, 'apps');
const workersPath = path.resolve(__dirname, 'workers');

const baseConfig = {
  exec_mode: 'fork',
  instances: 1,
  env_file: path.resolve(__dirname, '.env'),
  env: {
    NODE_ENV: 'development',
    // Explicitly pass critical environment variables
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USERNAME: process.env.NEO4J_USERNAME,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    WEAVIATE_URL: process.env.WEAVIATE_URL,
  },
  env_production: {
    NODE_ENV: 'production'
  }
};

// Workers that build to dist/src/index.js
const buildScriptSrc = (packagePath) => `${packagePath}/dist/src/index.js`;
// Workers that build to dist/index.js
const buildScript = (packagePath) => `${packagePath}/dist/index.js`;
const apiBuildScript = (packagePath) => `${packagePath}/dist/server.js`;

module.exports = {
  apps: [
    // --- API Gateway ---
    {
      ...baseConfig,
      name: 'api-gateway',
      script: apiBuildScript(path.join(appsPath, 'api-gateway')),
    },

    // --- Workers ---
    { ...baseConfig, name: 'card-worker', script: buildScript(path.join(workersPath, 'card-worker')) },
    { ...baseConfig, name: 'conversation-timeout-worker', script: buildScriptSrc(path.join(workersPath, 'conversation-timeout-worker')) },
    { ...baseConfig, name: 'embedding-worker', script: buildScript(path.join(workersPath, 'embedding-worker')) },
    { ...baseConfig, name: 'graph-projection-worker', script: buildScriptSrc(path.join(workersPath, 'graph-projection-worker')) },
    { ...baseConfig, name: 'graph-sync-worker', script: buildScriptSrc(path.join(workersPath, 'graph-sync-worker')) },
    { ...baseConfig, name: 'ingestion-worker', script: buildScriptSrc(path.join(workersPath, 'ingestion-worker')), instances: 2 },
    { ...baseConfig, name: 'insight-worker', script: buildScript(path.join(workersPath, 'insight-worker')) },
    { ...baseConfig, name: 'maintenance-worker', script: buildScriptSrc(path.join(workersPath, 'maintenance-worker')) },
    { ...baseConfig, name: 'notification-worker', script: buildScriptSrc(path.join(workersPath, 'notification-worker')) },
  ]
}; 