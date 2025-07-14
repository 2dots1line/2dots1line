// SYSTEMATIC SOLUTION for PM2 Environment Loading Issues
// Addresses: LESSONS 6, 6A, 6B, 17, 18 from CRITICAL_LESSONS_LEARNED.md

// Use the new EnvironmentLoader to solve all environment loading patterns
const path = require('path');
const { EnvironmentLoader } = require('./packages/core-utils/dist/environment/EnvironmentLoader');

// Initialize environment loader
const envLoader = EnvironmentLoader.getInstance();
const env = envLoader.load();

// Generate consistent environment for all PM2 processes
const baseEnv = envLoader.generateEcosystemEnv();

console.log('✅ Environment loaded for PM2 ecosystem from:', Object.keys(baseEnv).length, 'variables');

const baseConfig = {
  env: baseEnv,
  env_production: {
    NODE_ENV: 'production',
    ...baseEnv,
  },
  // Remove unreliable env_file property (LESSON 6A)
  // env_file: '.env',  // ❌ This is unreliable
  max_memory_restart: '1G',
  restart_delay: 4000,
  error_file: path.join(__dirname, 'logs', 'pm2-error.log'),
  out_file: path.join(__dirname, 'logs', 'pm2-out.log'),
  log_file: path.join(__dirname, 'logs', 'pm2-combined.log'),
  time: true,
  merge_logs: true,
};

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './apps/api-gateway/dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'ingestion-worker',
      script: './workers/ingestion-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'insight-worker',
      script: './workers/insight-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'card-worker',
      script: './workers/card-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'embedding-worker',
      script: './workers/embedding-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'graph-projection-worker',
      script: './workers/graph-projection-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'conversation-timeout-worker',
      script: './workers/conversation-timeout-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'maintenance-worker',
      script: './workers/maintenance-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
    {
      name: 'notification-worker',
      script: './workers/notification-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
    },
  ],
}; 