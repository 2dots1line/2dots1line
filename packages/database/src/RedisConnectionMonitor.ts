/**
 * Redis Connection Monitor
 * Utility to monitor Redis connection health and usage
 */

import Redis from 'ioredis';

export class RedisConnectionMonitor {
  private redis: Redis;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Start monitoring Redis connection health
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('[RedisMonitor] Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('[RedisMonitor] Starting Redis connection monitoring...');

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkConnectionHealth();
      } catch (error) {
        console.error('[RedisMonitor] Error during health check:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('[RedisMonitor] Stopped monitoring');
  }

  /**
   * Check Redis connection health and log statistics
   */
  private async checkConnectionHealth(): Promise<void> {
    try {
      // Test basic connectivity
      const startTime = Date.now();
      await this.redis.ping();
      const latency = Date.now() - startTime;

      // Get Redis info
      const info = await this.redis.info('clients');
      const memoryInfo = await this.redis.info('memory');

      // Parse client information
      const clientLines = info.split('\n').filter(line => line.startsWith('connected_clients:'));
      const connectedClients = clientLines.length > 0 ? parseInt(clientLines[0].split(':')[1]) : 0;

      // Parse memory information
      const memoryLines = memoryInfo.split('\n').filter(line => 
        line.startsWith('used_memory_human:') || line.startsWith('used_memory_peak_human:')
      );
      const usedMemory = memoryLines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1] || 'unknown';
      const peakMemory = memoryLines.find(line => line.startsWith('used_memory_peak_human:'))?.split(':')[1] || 'unknown';

      console.log(`[RedisMonitor] Health Check - Latency: ${latency}ms, Connected Clients: ${connectedClients}, Memory: ${usedMemory} (Peak: ${peakMemory})`);

      // Warn if too many connections
      if (connectedClients > 20) {
        console.warn(`[RedisMonitor] WARNING: High connection count detected: ${connectedClients}`);
      }

      // Warn if high latency
      if (latency > 100) {
        console.warn(`[RedisMonitor] WARNING: High latency detected: ${latency}ms`);
      }

    } catch (error) {
      console.error('[RedisMonitor] Connection health check failed:', error);
    }
  }

  /**
   * Get current connection statistics
   */
  public async getConnectionStats(): Promise<{
    latency: number;
    connectedClients: number;
    usedMemory: string;
    peakMemory: string;
  }> {
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const latency = Date.now() - startTime;

      const info = await this.redis.info('clients');
      const memoryInfo = await this.redis.info('memory');

      const clientLines = info.split('\n').filter(line => line.startsWith('connected_clients:'));
      const connectedClients = clientLines.length > 0 ? parseInt(clientLines[0].split(':')[1]) : 0;

      const memoryLines = memoryInfo.split('\n').filter(line => 
        line.startsWith('used_memory_human:') || line.startsWith('used_memory_peak_human:')
      );
      const usedMemory = memoryLines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1] || 'unknown';
      const peakMemory = memoryLines.find(line => line.startsWith('used_memory_peak_human:'))?.split(':')[1] || 'unknown';

      return {
        latency,
        connectedClients,
        usedMemory,
        peakMemory
      };
    } catch (error) {
      console.error('[RedisMonitor] Failed to get connection stats:', error);
      throw error;
    }
  }
}
