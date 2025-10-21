#!/usr/bin/env node

/**
 * Direct Next.js startup script for PM2
 * This prevents zombie processes by running Next.js directly under PM2
 */

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://34.136.210.47:3001';
process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL = 'http://34.136.210.47:3002';

// Change to web-app directory
process.chdir(path.join(__dirname, '../../apps/web-app'));

// Clean up any existing Next.js processes
const { exec } = require('child_process');
exec('pkill -f "next-server" 2>/dev/null || true', () => {
  exec('sudo fuser -k 3000/tcp 2>/dev/null || true', () => {
    // Start Next.js directly
    const nextProcess = spawn('pnpm', ['start'], {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd()
    });

    // Handle process signals
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      nextProcess.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      nextProcess.kill('SIGINT');
    });

    // Forward exit codes
    nextProcess.on('exit', (code, signal) => {
      console.log(`Next.js process exited with code ${code} and signal ${signal}`);
      process.exit(code || 0);
    });

    nextProcess.on('error', (err) => {
      console.error('Failed to start Next.js process:', err);
      process.exit(1);
    });
  });
});
