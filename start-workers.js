const { spawn } = require('child_process');
const path = require('path');

// List of all workers to start
const workers = [
  'ingestion-worker',
  'insight-worker', 
  'ontology-optimization-worker',
  'card-worker',
  'embedding-worker',
  'graph-projection-worker',
  'conversation-timeout-worker',
  'maintenance-worker',
  'notification-worker'
];

console.log('🚀 Starting all workers...');

const processes = [];

// Start each worker as a separate process
workers.forEach(workerName => {
  const workerPath = path.join(__dirname, 'workers', workerName, 'dist', 'index.js');
  
  console.log(`📦 Starting ${workerName}...`);
  
  const process = spawn('node', [workerPath], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env
  });
  
  // Prefix logs with worker name
  process.stdout.on('data', (data) => {
    console.log(`[${workerName}] ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`[${workerName}] ERROR: ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    console.log(`[${workerName}] Process exited with code ${code}`);
    if (code !== 0) {
      console.error(`❌ ${workerName} failed with exit code ${code}`);
      // Exit the main process if any worker fails
      process.exit(1);
    }
  });
  
  processes.push({ name: workerName, process });
});

console.log(`✅ Started ${workers.length} workers`);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down workers...');
  processes.forEach(({ name, process }) => {
    console.log(`Stopping ${name}...`);
    process.kill('SIGTERM');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down workers...');
  processes.forEach(({ name, process }) => {
    console.log(`Stopping ${name}...`);
    process.kill('SIGINT');
  });
});

// Keep the main process alive
process.on('exit', () => {
  console.log('👋 Main process exiting');
});