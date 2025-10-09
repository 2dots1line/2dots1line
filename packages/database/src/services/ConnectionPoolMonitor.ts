/**
 * Connection Pool Monitor
 * Monitors and reports on database connection pool health and performance
 */

import { DatabaseService } from '../DatabaseService';

export interface ConnectionPoolMetrics {
  timestamp: number;
  weaviate: {
    activeConnections: number;
    queuedRequests: number;
    timeoutErrors: number;
    connectionErrors: number;
    avgResponseTime: number;
    totalRequests: number;
  };
  redis: {
    connected: boolean;
    activeConnections: number;
    queuedCommands: number;
    timeoutErrors: number;
    connectionErrors: number;
    avgResponseTime: number;
    totalCommands: number;
  };
  neo4j: {
    connected: boolean;
    activeSessions: number;
    queuedQueries: number;
    timeoutErrors: number;
    connectionErrors: number;
    avgResponseTime: number;
    totalQueries: number;
  };
}

export class ConnectionPoolMonitor {
  private db: DatabaseService;
  private metrics!: ConnectionPoolMetrics;
  private startTime: number;
  private requestCounts: {
    weaviate: number;
    redis: number;
    neo4j: number;
  };
  private errorCounts: {
    weaviate: { timeouts: number; connections: number };
    redis: { timeouts: number; connections: number };
    neo4j: { timeouts: number; connections: number };
  };
  private responseTimes: {
    weaviate: number[];
    redis: number[];
    neo4j: number[];
  };

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    this.startTime = Date.now();
    this.requestCounts = { weaviate: 0, redis: 0, neo4j: 0 };
    this.errorCounts = {
      weaviate: { timeouts: 0, connections: 0 },
      redis: { timeouts: 0, connections: 0 },
      neo4j: { timeouts: 0, connections: 0 }
    };
    this.responseTimes = {
      weaviate: [],
      redis: [],
      neo4j: []
    };

    this.initializeMetrics();
  }

  /**
   * Initialize metrics with current state
   */
  private initializeMetrics(): void {
    this.metrics = {
      timestamp: Date.now(),
      weaviate: {
        activeConnections: 0,
        queuedRequests: 0,
        timeoutErrors: 0,
        connectionErrors: 0,
        avgResponseTime: 0,
        totalRequests: 0
      },
      redis: {
        connected: false,
        activeConnections: 0,
        queuedCommands: 0,
        timeoutErrors: 0,
        connectionErrors: 0,
        avgResponseTime: 0,
        totalCommands: 0
      },
      neo4j: {
        connected: false,
        activeSessions: 0,
        queuedQueries: 0,
        timeoutErrors: 0,
        connectionErrors: 0,
        avgResponseTime: 0,
        totalQueries: 0
      }
    };
  }

  /**
   * Record a Weaviate request
   */
  recordWeaviateRequest(responseTime: number, success: boolean, error?: Error): void {
    this.requestCounts.weaviate++;
    this.responseTimes.weaviate.push(responseTime);
    
    // Keep only last 100 response times for rolling average
    if (this.responseTimes.weaviate.length > 100) {
      this.responseTimes.weaviate.shift();
    }

    if (!success && error) {
      if (error.message.includes('timeout')) {
        this.errorCounts.weaviate.timeouts++;
      } else if (error.message.includes('connection') || error.message.includes('network')) {
        this.errorCounts.weaviate.connections++;
      }
    }
  }

  /**
   * Record a Redis command
   */
  recordRedisCommand(responseTime: number, success: boolean, error?: Error): void {
    this.requestCounts.redis++;
    this.responseTimes.redis.push(responseTime);
    
    if (this.responseTimes.redis.length > 100) {
      this.responseTimes.redis.shift();
    }

    if (!success && error) {
      if (error.message.includes('timeout')) {
        this.errorCounts.redis.timeouts++;
      } else if (error.message.includes('connection') || error.message.includes('network')) {
        this.errorCounts.redis.connections++;
      }
    }
  }

  /**
   * Record a Neo4j query
   */
  recordNeo4jQuery(responseTime: number, success: boolean, error?: Error): void {
    this.requestCounts.neo4j++;
    this.responseTimes.neo4j.push(responseTime);
    
    if (this.responseTimes.neo4j.length > 100) {
      this.responseTimes.neo4j.shift();
    }

    if (!success && error) {
      if (error.message.includes('timeout')) {
        this.errorCounts.neo4j.timeouts++;
      } else if (error.message.includes('connection') || error.message.includes('network')) {
        this.errorCounts.neo4j.connections++;
      }
    }
  }

  /**
   * Get current connection pool metrics
   */
  getMetrics(): ConnectionPoolMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate average response times
    const avgWeaviateTime = this.responseTimes.weaviate.length > 0 
      ? this.responseTimes.weaviate.reduce((a, b) => a + b, 0) / this.responseTimes.weaviate.length 
      : 0;
    
    const avgRedisTime = this.responseTimes.redis.length > 0 
      ? this.responseTimes.redis.reduce((a, b) => a + b, 0) / this.responseTimes.redis.length 
      : 0;
    
    const avgNeo4jTime = this.responseTimes.neo4j.length > 0 
      ? this.responseTimes.neo4j.reduce((a, b) => a + b, 0) / this.responseTimes.neo4j.length 
      : 0;

    return {
      timestamp: now,
      weaviate: {
        activeConnections: 0, // Weaviate doesn't expose connection count
        queuedRequests: 0,    // Weaviate doesn't expose queue count
        timeoutErrors: this.errorCounts.weaviate.timeouts,
        connectionErrors: this.errorCounts.weaviate.connections,
        avgResponseTime: Math.round(avgWeaviateTime),
        totalRequests: this.requestCounts.weaviate
      },
      redis: {
        connected: this.db.redis.status === 'ready',
        activeConnections: 1, // Redis client maintains one connection
        queuedCommands: 0,    // Redis doesn't expose queue count
        timeoutErrors: this.errorCounts.redis.timeouts,
        connectionErrors: this.errorCounts.redis.connections,
        avgResponseTime: Math.round(avgRedisTime),
        totalCommands: this.requestCounts.redis
      },
      neo4j: {
        connected: true, // Neo4j driver doesn't expose connection status easily
        activeSessions: 0, // Neo4j doesn't expose session count
        queuedQueries: 0,  // Neo4j doesn't expose queue count
        timeoutErrors: this.errorCounts.neo4j.timeouts,
        connectionErrors: this.errorCounts.neo4j.connections,
        avgResponseTime: Math.round(avgNeo4jTime),
        totalQueries: this.requestCounts.neo4j
      }
    };
  }

  /**
   * Get connection pool health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    weaviate: 'healthy' | 'degraded' | 'unhealthy';
    redis: 'healthy' | 'degraded' | 'unhealthy';
    neo4j: 'healthy' | 'degraded' | 'unhealthy';
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    // Assess Weaviate health
    let weaviateHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (metrics.weaviate.timeoutErrors > 10 || metrics.weaviate.connectionErrors > 5) {
      weaviateHealth = 'unhealthy';
      recommendations.push('Weaviate connection issues detected - check network connectivity and server status');
    } else if (metrics.weaviate.timeoutErrors > 5 || metrics.weaviate.avgResponseTime > 5000) {
      weaviateHealth = 'degraded';
      recommendations.push('Weaviate performance degraded - consider increasing timeout or reducing concurrent requests');
    }

    // Assess Redis health
    let redisHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!metrics.redis.connected || metrics.redis.connectionErrors > 5) {
      redisHealth = 'unhealthy';
      recommendations.push('Redis connection issues detected - check Redis server status');
    } else if (metrics.redis.timeoutErrors > 5 || metrics.redis.avgResponseTime > 1000) {
      redisHealth = 'degraded';
      recommendations.push('Redis performance degraded - check Redis server load');
    }

    // Assess Neo4j health
    let neo4jHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (metrics.neo4j.connectionErrors > 5) {
      neo4jHealth = 'unhealthy';
      recommendations.push('Neo4j connection issues detected - check Neo4j server status');
    } else if (metrics.neo4j.timeoutErrors > 5 || metrics.neo4j.avgResponseTime > 10000) {
      neo4jHealth = 'degraded';
      recommendations.push('Neo4j performance degraded - check query complexity and server load');
    }

    // Overall health
    const overallHealth = [weaviateHealth, redisHealth, neo4jHealth].includes('unhealthy') 
      ? 'unhealthy' 
      : [weaviateHealth, redisHealth, neo4jHealth].includes('degraded') 
        ? 'degraded' 
        : 'healthy';

    return {
      overall: overallHealth,
      weaviate: weaviateHealth,
      redis: redisHealth,
      neo4j: neo4jHealth,
      recommendations
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.startTime = Date.now();
    this.requestCounts = { weaviate: 0, redis: 0, neo4j: 0 };
    this.errorCounts = {
      weaviate: { timeouts: 0, connections: 0 },
      redis: { timeouts: 0, connections: 0 },
      neo4j: { timeouts: 0, connections: 0 }
    };
    this.responseTimes = {
      weaviate: [],
      redis: [],
      neo4j: []
    };
  }

  /**
   * Log current metrics to console
   */
  logMetrics(): void {
    const metrics = this.getMetrics();
    const health = this.getHealthStatus();
    
    console.log('📊 Connection Pool Metrics:', {
      overall: health.overall,
      uptime: `${Math.round((Date.now() - this.startTime) / 1000)}s`,
      weaviate: {
        requests: metrics.weaviate.totalRequests,
        avgTime: `${metrics.weaviate.avgResponseTime}ms`,
        errors: metrics.weaviate.timeoutErrors + metrics.weaviate.connectionErrors,
        health: health.weaviate
      },
      redis: {
        connected: metrics.redis.connected,
        commands: metrics.redis.totalCommands,
        avgTime: `${metrics.redis.avgResponseTime}ms`,
        errors: metrics.redis.timeoutErrors + metrics.redis.connectionErrors,
        health: health.redis
      },
      neo4j: {
        queries: metrics.neo4j.totalQueries,
        avgTime: `${metrics.neo4j.avgResponseTime}ms`,
        errors: metrics.neo4j.timeoutErrors + metrics.neo4j.connectionErrors,
        health: health.neo4j
      }
    });

    if (health.recommendations.length > 0) {
      console.log('⚠️ Recommendations:', health.recommendations);
    }
  }
}

// Export singleton instance
let connectionPoolMonitor: ConnectionPoolMonitor | null = null;

export const getConnectionPoolMonitor = (databaseService: DatabaseService): ConnectionPoolMonitor => {
  if (!connectionPoolMonitor) {
    connectionPoolMonitor = new ConnectionPoolMonitor(databaseService);
  }
  return connectionPoolMonitor;
};
