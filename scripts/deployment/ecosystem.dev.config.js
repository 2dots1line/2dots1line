// Development ecosystem configuration
// Use this for local development with hot reload

const path = require('path');
const { EnvironmentLoader } = require('../../packages/core-utils/dist/environment/EnvironmentLoader');

// Initialize environment loader
const envLoader = EnvironmentLoader.getInstance();
const env = envLoader.load();

// Generate consistent environment for all PM2 processes
const baseEnv = envLoader.generateEcosystemEnv();

const baseConfig = {
  env: baseEnv,
  env_development: {
    NODE_ENV: 'development',
    ...baseEnv,
  },
  max_memory_restart: '1G',
  restart_delay: 4000,
  time: true,
  merge_logs: false,
};

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: path.join(__dirname, '../../apps/api-gateway/dist/server.js'),
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      ...baseConfig,
      error_file: path.join(__dirname, 'logs', 'api-gateway-error.log'),
      out_file: path.join(__dirname, 'logs', 'api-gateway-out.log'),
      log_file: path.join(__dirname, 'logs', 'api-gateway-combined.log'),
    },
    {
      name: 'web-app',
      script: 'pnpm',
      args: 'dev',
      cwd: path.join(__dirname, '../../apps/web-app'),
      instances: 1,
      exec_mode: 'fork',
      watch: true, // Enable file watching for hot reload
      ...baseConfig,
      env: {
        ...baseEnv,
        NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001',
        NODE_ENV: 'development',
      },
      env_development: {
        NODE_ENV: 'development',
        ...baseEnv,
        NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001',
      },
      error_file: path.join(__dirname, 'logs', 'web-app-dev-error.log'),
      out_file: path.join(__dirname, 'logs', 'web-app-dev-out.log'),
      log_file: path.join(__dirname, 'logs', 'web-app-dev-combined.log'),
    },
  ],
};
