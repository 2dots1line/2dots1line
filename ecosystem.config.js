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
  // Remove shared logging configuration to fix log header confusion
  // Each process will use its own log files by default
  // error_file: path.join(__dirname, 'logs', 'pm2-error.log'),
  // out_file: path.join(__dirname, 'logs', 'pm2-out.log'),
  // log_file: path.join(__dirname, 'logs', 'pm2-combined.log'),
  time: true,
  merge_logs: false, // Disable log merging to prevent confusion
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
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'api-gateway-error.log'),
      out_file: path.join(__dirname, 'logs', 'api-gateway-out.log'),
      log_file: path.join(__dirname, 'logs', 'api-gateway-combined.log'),
    },
    {
      name: 'ingestion-worker',
      script: './workers/ingestion-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'ingestion-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'ingestion-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'ingestion-worker-combined.log'),
    },
    {
      name: 'insight-worker',
      script: './workers/insight-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'insight-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'insight-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'insight-worker-combined.log'),
    },
    {
      name: 'ontology-optimization-worker',
      script: './workers/ontology-optimization-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'ontology-optimization-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'ontology-optimization-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'ontology-optimization-worker-combined.log'),
    },
    {
      name: 'card-worker',
      script: './workers/card-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'card-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'card-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'card-worker-combined.log'),
    },
    {
      name: 'embedding-worker',
      script: './workers/embedding-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'embedding-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'embedding-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'embedding-worker-combined.log'),
    },
    {
      name: 'graph-projection-worker',
      script: './workers/graph-projection-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'graph-projection-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'graph-projection-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'graph-projection-worker-combined.log'),
    },
    {
      name: 'conversation-timeout-worker',
      script: './workers/conversation-timeout-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'conversation-timeout-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'conversation-timeout-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'conversation-timeout-worker-combined.log'),
    },
    {
      name: 'maintenance-worker',
      script: './workers/maintenance-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'maintenance-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'maintenance-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'maintenance-worker-combined.log'),
    },
    {
      name: 'notification-worker',
      script: './workers/notification-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'notification-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'notification-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'notification-worker-combined.log'),
    },
    {
      name: 'spatial-query-worker',
      script: './workers/spatial-query-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'spatial-query-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'spatial-query-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'spatial-query-worker-combined.log'),
    },
    {
      name: 'video-generation-worker',
      script: './workers/video-generation-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'video-generation-worker-error.log'),
      out_file: path.join(__dirname, 'logs', 'video-generation-worker-out.log'),
      log_file: path.join(__dirname, 'logs', 'video-generation-worker-combined.log'),
    },
    {
      name: 'web-app',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/web-app',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      env: {
        ...baseEnv,
        NEXT_PUBLIC_API_BASE_URL: 'http://34.136.210.47:3001',
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
        ...baseEnv,
        NEXT_PUBLIC_API_BASE_URL: 'http://34.136.210.47:3001',
      },
      env_development: {
        NODE_ENV: 'development',
        ...baseEnv,
        NEXT_PUBLIC_API_BASE_URL: 'http://34.136.210.47:3001',
      },
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'web-app-error.log'),
      out_file: path.join(__dirname, 'logs', 'web-app-out.log'),
      log_file: path.join(__dirname, 'logs', 'web-app-combined.log'),
    },
    {
      name: 'web-app-dev',
      script: 'pnpm',
      args: 'dev',
      cwd: './apps/web-app',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ...baseConfig,
      env: {
        ...baseEnv,
        NEXT_PUBLIC_API_BASE_URL: 'http://34.136.210.47:3001',
        NODE_ENV: 'development',
      },
      env_development: {
        NODE_ENV: 'development',
        ...baseEnv,
        NEXT_PUBLIC_API_BASE_URL: 'http://34.136.210.47:3001',
      },
      // Force individual logging to prevent shared context
      error_file: path.join(__dirname, 'logs', 'web-app-dev-error.log'),
      out_file: path.join(__dirname, 'logs', 'web-app-dev-out.log'),
      log_file: path.join(__dirname, 'logs', 'web-app-dev-combined.log'),
    },
  ],
}; 