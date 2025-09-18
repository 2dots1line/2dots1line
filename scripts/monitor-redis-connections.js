#!/usr/bin/env node

/**
 * Redis Connection Monitor Script
 * 
 * This script helps monitor Redis connection usage to prevent
 * the connection exhaustion issues that were causing message
 * sending failures after notification batch processing.
 * 
 * Usage: node scripts/monitor-redis-connections.js
 */

const Redis = require('ioredis');

async function monitorRedisConnections() {
  console.log('🔍 Redis Connection Monitor Starting...\n');
  
  // Connect to Redis
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis\n');

    // Monitor every 10 seconds
    const interval = setInterval(async () => {
      try {
        const startTime = Date.now();
        await redis.ping();
        const latency = Date.now() - startTime;

        // Get Redis info
        const info = await redis.info('clients');
        const memoryInfo = await redis.info('memory');

        // Parse client information
        const clientLines = info.split('\n').filter(line => line.startsWith('connected_clients:'));
        const connectedClients = clientLines.length > 0 ? parseInt(clientLines[0].split(':')[1]) : 0;

        // Parse memory information
        const memoryLines = memoryInfo.split('\n').filter(line => 
          line.startsWith('used_memory_human:') || line.startsWith('used_memory_peak_human:')
        );
        const usedMemory = memoryLines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1] || 'unknown';
        const peakMemory = memoryLines.find(line => line.startsWith('used_memory_peak_human:'))?.split(':')[1] || 'unknown';

        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Latency: ${latency}ms | Clients: ${connectedClients} | Memory: ${usedMemory} (Peak: ${peakMemory})`);

        // Warning thresholds
        if (connectedClients > 20) {
          console.warn(`⚠️  WARNING: High connection count: ${connectedClients}`);
        }
        if (latency > 100) {
          console.warn(`⚠️  WARNING: High latency: ${latency}ms`);
        }

      } catch (error) {
        console.error('❌ Error during monitoring:', error.message);
      }
    }, 10000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down Redis monitor...');
      clearInterval(interval);
      redis.disconnect();
      process.exit(0);
    });

    console.log('📊 Monitoring Redis connections (press Ctrl+C to stop)\n');

  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    process.exit(1);
  }
}

// Run the monitor
monitorRedisConnections().catch(console.error);
