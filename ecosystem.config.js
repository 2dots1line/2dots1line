const path = require('path');

const appsPath = path.resolve(__dirname, 'apps');
const workersPath = path.resolve(__dirname, 'workers');

const tsxInterpreter = path.resolve(__dirname, 'node_modules/.bin/tsx');

const baseConfig = {
  exec_mode: 'fork',
  instances: 1,
  interpreter: tsxInterpreter,
  env: {
    NODE_ENV: 'development',
    TS_NODE_PROJECT: 'tsconfig.json'
  },
  env_production: {
    NODE_ENV: 'production'
  }
};

const productionScript = (packagePath) => `${packagePath}/dist/index.js`;
const devScript = (packagePath) => `${packagePath}/src/index.ts`;

module.exports = {
  apps: [
    // --- API Gateway ---
    {
      ...baseConfig,
      name: 'api-gateway',
      script: devScript(path.join(appsPath, 'api-gateway')),
      env_production: { ...baseConfig.env_production, script: productionScript(path.join(appsPath, 'api-gateway')) }
    },

    // --- Workers ---
    { ...baseConfig, name: 'card-worker', script: devScript(path.join(workersPath, 'card-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'card-worker')) }},
    { ...baseConfig, name: 'conversation-timeout-worker', script: devScript(path.join(workersPath, 'conversation-timeout-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'conversation-timeout-worker')) }},
    { ...baseConfig, name: 'embedding-worker', script: devScript(path.join(workersPath, 'embedding-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'embedding-worker')) }},
    { ...baseConfig, name: 'graph-projection-worker', script: devScript(path.join(workersPath, 'graph-projection-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'graph-projection-worker')) }},
    { ...baseConfig, name: 'graph-sync-worker', script: devScript(path.join(workersPath, 'graph-sync-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'graph-sync-worker')) }},
    { ...baseConfig, name: 'ingestion-worker', script: devScript(path.join(workersPath, 'ingestion-worker')), instances: 2, env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'ingestion-worker')) }},
    { ...baseConfig, name: 'insight-worker', script: devScript(path.join(workersPath, 'insight-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'insight-worker')) }},
    { ...baseConfig, name: 'maintenance-worker', script: devScript(path.join(workersPath, 'maintenance-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'maintenance-worker')) }},
    { ...baseConfig, name: 'notification-worker', script: devScript(path.join(workersPath, 'notification-worker')), env_production: { ...baseConfig.env_production, script: productionScript(path.join(workersPath, 'notification-worker')) }},
  ]
}; 