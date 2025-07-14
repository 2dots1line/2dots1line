/**
 * MaintenanceWorker.ts
 * V11.0 CORRECT IMPLEMENTATION with EnvironmentLoader Integration
 * Worker responsible for data hygiene, integrity, and infrastructure optimization.
 */

import { DatabaseService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import * as cron from 'node-cron';

/**
 * MaintenanceWorker V11.0 Configuration with EnvironmentLoader
 * All thresholds and schedules are configuration-driven via environment variables
 */
export class MaintenanceWorker {
  private dbService: DatabaseService;
  private tasks: cron.ScheduledTask[] = [];
  private isRunning: boolean = false;
  private isShuttingDown: boolean = false;
  private config: {
    ENABLE_REDIS_CLEANUP: boolean;
    ENABLE_INTEGRITY_CHECK: boolean;
    ENABLE_DB_OPTIMIZATION: boolean;
    ENABLE_ARCHIVING: boolean;
    REDIS_CLEANUP_CRON: string;
    INTEGRITY_CHECK_CRON: string;
    DB_OPTIMIZATION_CRON: string;
    ARCHIVING_CRON: string;
    STALE_REDIS_KEY_THRESHOLD_HOURS: number;
    ARCHIVE_CONVERSATIONS_AFTER_DAYS: number;
    INTEGRITY_CHECK_BATCH_SIZE: number;
  };

  constructor() {
    // CRITICAL: Load environment variables first
    console.log('[MaintenanceWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[MaintenanceWorker] Environment variables loaded successfully');

    // Load configuration from EnvironmentLoader
    this.config = {
      ENABLE_REDIS_CLEANUP: environmentLoader.get('ENABLE_REDIS_CLEANUP_TASK') === 'true',
      ENABLE_INTEGRITY_CHECK: environmentLoader.get('ENABLE_INTEGRITY_CHECK_TASK') === 'true',
      ENABLE_DB_OPTIMIZATION: environmentLoader.get('ENABLE_DB_OPTIMIZATION_TASK') === 'true',
      ENABLE_ARCHIVING: environmentLoader.get('ENABLE_ARCHIVING_TASK') === 'true', // Default to false for safety

      REDIS_CLEANUP_CRON: environmentLoader.get('CLEANUP_REDIS_CRON') || '0 * * * *', // Hourly
      INTEGRITY_CHECK_CRON: environmentLoader.get('INTEGRITY_CHECK_CRON') || '0 2 * * *', // Daily at 2 AM
      DB_OPTIMIZATION_CRON: environmentLoader.get('DB_OPTIMIZATION_CRON') || '0 3 * * 1', // Weekly on Monday at 3 AM
      ARCHIVING_CRON: environmentLoader.get('ARCHIVING_CRON') || '0 4 1 * *', // Monthly on the 1st at 4 AM

      STALE_REDIS_KEY_THRESHOLD_HOURS: parseInt(environmentLoader.get('STALE_REDIS_KEY_THRESHOLD_HOURS') || '24', 10),
      ARCHIVE_CONVERSATIONS_AFTER_DAYS: parseInt(environmentLoader.get('ARCHIVE_CONVERSATIONS_AFTER_DAYS') || '730', 10),
      INTEGRITY_CHECK_BATCH_SIZE: parseInt(environmentLoader.get('INTEGRITY_CHECK_BATCH_SIZE') || '1000', 10),
    };

    console.log('[MaintenanceWorker] Configuration loaded:', {
      redisCleanup: this.config.ENABLE_REDIS_CLEANUP,
      integrityCheck: this.config.ENABLE_INTEGRITY_CHECK,
      dbOptimization: this.config.ENABLE_DB_OPTIMIZATION,
      archiving: this.config.ENABLE_ARCHIVING,
    });

    this.dbService = DatabaseService.getInstance();
  }

  public async initialize(): Promise<void> {
    console.log('[MaintenanceWorker] Initializing V11.0 maintenance worker...');
    
    // Schedule the main maintenance cycle (daily at 2 AM)
    cron.schedule(this.config.INTEGRITY_CHECK_CRON, async () => {
      if (!this.isRunning && !this.isShuttingDown) {
        await this.runMaintenanceCycle();
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());

    console.log(`[MaintenanceWorker] Maintenance cycle scheduled: ${this.config.INTEGRITY_CHECK_CRON}`);
    console.log('[MaintenanceWorker] V11.0 initialization complete');
  }

  public async runMaintenanceCycle(): Promise<void> {
    if (this.isRunning) {
      console.log('[MaintenanceWorker] Maintenance cycle already running, skipping.');
      return;
    }

    if (this.isShuttingDown) {
      console.log('[MaintenanceWorker] Shutting down, skipping maintenance cycle.');
      return;
    }

    this.isRunning = true;
    console.log('[MaintenanceWorker] Starting V11.0 maintenance cycle...');

    const tasks = [
      // REQUIRED TASKS FROM V11.0 SPEC
      { 
        name: 'Cleanup Stale Redis Keys', 
        fn: () => this.cleanupStaleRedisKeys(), 
        enabled: this.config.ENABLE_REDIS_CLEANUP 
      },
      { 
        name: 'Run Data Integrity Check', 
        fn: () => this.runDataIntegrityCheck(), 
        enabled: this.config.ENABLE_INTEGRITY_CHECK 
      },
      { 
        name: 'Run Database Optimization', 
        fn: () => this.runDatabaseOptimization(), 
        enabled: this.config.ENABLE_DB_OPTIMIZATION 
      },
      
      // REFACTORED TASKS (corrected per tech lead review)
      { 
        name: 'Cleanup Expired Sessions', 
        fn: () => this.cleanupExpiredSessions(), 
        enabled: true 
      },
      { 
        name: 'Archive Old Conversations', 
        fn: () => this.archiveOldConversations(), 
        enabled: this.config.ENABLE_ARCHIVING 
      },
      // Note: Media cleanup tasks commented out until storage deletion is implemented
      // { name: 'Cleanup Orphaned Media Items', fn: () => this.cleanupOrphanedMediaItems(), enabled: true },
    ];

    for (const task of tasks) {
      if (this.isShuttingDown) {
        console.log('[MaintenanceWorker] Shutdown requested, stopping maintenance cycle');
        break;
      }

      if (task.enabled) {
        try {
          console.log(`[MaintenanceWorker] Running: ${task.name}`);
          await task.fn();
          console.log(`[MaintenanceWorker] ✅ Completed: ${task.name}`);
        } catch (error) {
          console.error(`[MaintenanceWorker] ❌ Failed: ${task.name}`, error);
        }
      } else {
        console.log(`[MaintenanceWorker] ⏩ Skipping disabled task: ${task.name}`);
      }
    }

    console.log('[MaintenanceWorker] V11.0 maintenance cycle finished.');
    this.isRunning = false;
  }

  // --- REQUIRED TASKS FROM V11.0 SPEC ---

  /**
   * Task 1: Cleanup Stale Redis Keys
   * Prevents memory leaks from keys that failed to expire correctly
   */
  private async cleanupStaleRedisKeys(): Promise<void> {
    console.log('[MaintenanceWorker] Starting Redis cleanup...');
    let staleKeysFound = 0;
    
    // Scan for turn context keys without TTL
    const turnContextStream = this.dbService.redis.scanStream({ match: 'turn_context:*' });
    for await (const keys of turnContextStream) {
      for (const key of keys) {
        const ttl = await this.dbService.redis.ttl(key);
        if (ttl === -1) { // -1 means no TTL set
          console.warn(`[MaintenanceWorker] Found stale Redis key with no TTL: ${key}. Deleting.`);
          await this.dbService.redis.del(key);
          staleKeysFound++;
        }
      }
    }

    // Scan for SSE connection keys without TTL
    const sseStream = this.dbService.redis.scanStream({ match: 'sse_connections:*' });
    for await (const keys of sseStream) {
      for (const key of keys) {
        const ttl = await this.dbService.redis.ttl(key);
        if (ttl === -1) {
          console.warn(`[MaintenanceWorker] Found stale SSE connection key: ${key}. Deleting.`);
          await this.dbService.redis.del(key);
          staleKeysFound++;
        }
      }
    }

    console.log(`[MaintenanceWorker] Deleted ${staleKeysFound} stale Redis keys.`);
  }

  /**
   * Task 2: Data Integrity Cross-Check
   * Detects inconsistencies between PostgreSQL, Neo4j, and Weaviate
   */
  private async runDataIntegrityCheck(): Promise<void> {
    console.log('[MaintenanceWorker] Starting data integrity check...');

    // Check 1: Orphaned Concepts in PostgreSQL vs Neo4j
    await this.checkConceptIntegrity();
    
    // Check 2: Orphaned Memory Units in PostgreSQL vs Neo4j
    await this.checkMemoryUnitIntegrity();
    
    // Check 3: Vector Store Sync Check (sample)
    await this.checkVectorStoreSync();

    console.log('[MaintenanceWorker] Data integrity check completed.');
  }

  private async checkConceptIntegrity(): Promise<void> {
    const conceptsInPg = await this.dbService.prisma.concepts.findMany({ 
      select: { concept_id: true },
      take: this.config.INTEGRITY_CHECK_BATCH_SIZE
    });
    const conceptIdsInPg = new Set(conceptsInPg.map(c => c.concept_id));
    
    const neo4jSession = this.dbService.neo4j.session();
    try {
      const result = await neo4jSession.run(
        'MATCH (c:Concept) RETURN c.conceptId AS conceptId LIMIT $limit',
        { limit: this.config.INTEGRITY_CHECK_BATCH_SIZE }
      );
      const conceptIdsInNeo4j = new Set(result.records.map(r => r.get('conceptId')));

      let orphanedCount = 0;
      for (const pgId of conceptIdsInPg) {
        if (!conceptIdsInNeo4j.has(pgId)) {
          console.error(`[Data Integrity Error] Concept ID ${pgId} exists in PostgreSQL but NOT in Neo4j.`);
          orphanedCount++;
        }
      }
      
      console.log(`[MaintenanceWorker] Checked ${conceptIdsInPg.size} concepts. Found ${orphanedCount} integrity issues.`);
    } finally {
      await neo4jSession.close();
    }
  }

  private async checkMemoryUnitIntegrity(): Promise<void> {
    const memoryUnitsInPg = await this.dbService.prisma.memory_units.findMany({ 
      select: { muid: true },
      take: this.config.INTEGRITY_CHECK_BATCH_SIZE
    });
    const memoryUnitIdsInPg = new Set(memoryUnitsInPg.map(m => m.muid));
    
    const neo4jSession = this.dbService.neo4j.session();
    try {
      const result = await neo4jSession.run(
        'MATCH (m:MemoryUnit) RETURN m.memoryUnitId AS memoryUnitId LIMIT $limit',
        { limit: this.config.INTEGRITY_CHECK_BATCH_SIZE }
      );
      const memoryUnitIdsInNeo4j = new Set(result.records.map(r => r.get('memoryUnitId')));

      let orphanedCount = 0;
      for (const pgId of memoryUnitIdsInPg) {
        if (!memoryUnitIdsInNeo4j.has(pgId)) {
          console.error(`[Data Integrity Error] MemoryUnit ID ${pgId} exists in PostgreSQL but NOT in Neo4j.`);
          orphanedCount++;
        }
      }
      
      console.log(`[MaintenanceWorker] Checked ${memoryUnitIdsInPg.size} memory units. Found ${orphanedCount} integrity issues.`);
    } finally {
      await neo4jSession.close();
    }
  }

  private async checkVectorStoreSync(): Promise<void> {
    // Sample check: verify that recent memory units have vectors in Weaviate
    const recentMemoryUnits = await this.dbService.prisma.memory_units.findMany({
      select: { muid: true },
      orderBy: { ingestion_ts: 'desc' },
      take: 10 // Sample size
    });

    let vectorMissingCount = 0;
    for (const unit of recentMemoryUnits) {
      try {
        const response = await fetch(`${process.env.WEAVIATE_URL}/v1/objects?class=UserKnowledgeItem&where={"path":["memoryUnitId"],"operator":"Equal","valueText":"${unit.muid}"}`);
        const data = await response.json();
        
        if (!data.objects || data.objects.length === 0) {
          console.warn(`[Data Integrity Warning] MemoryUnit ${unit.muid} missing from Weaviate`);
          vectorMissingCount++;
        }
      } catch (error) {
        console.error(`[MaintenanceWorker] Error checking Weaviate for ${unit.muid}:`, error);
      }
    }

    console.log(`[MaintenanceWorker] Checked ${recentMemoryUnits.length} memory units in Weaviate. Found ${vectorMissingCount} missing vectors.`);
  }

  /**
   * Task 3: Database Optimization
   * Maintains PostgreSQL query planner performance
   */
  private async runDatabaseOptimization(): Promise<void> {
    console.log('[MaintenanceWorker] Starting database optimization (VACUUM ANALYZE)...');
    
    const tables = ['conversations', 'conversation_messages', 'memory_units', 'concepts', 'cards'];
    
    for (const table of tables) {
      try {
        await this.dbService.prisma.$executeRawUnsafe(`VACUUM ANALYZE ${table};`);
        console.log(`[MaintenanceWorker] ✅ Optimized table: ${table}`);
      } catch (error) {
        console.error(`[MaintenanceWorker] ❌ Failed to optimize table ${table}:`, error);
      }
    }
    
    console.log('[MaintenanceWorker] Database optimization complete.');
  }

  // --- REFACTORED TASKS (corrected per tech lead review) ---

  /**
   * Cleanup expired user sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const result = await this.dbService.prisma.user_sessions.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
    console.log(`[MaintenanceWorker] Deleted ${result.count} expired sessions.`);
  }

  /**
   * Archive old conversations (using configurable threshold)
   */
  private async archiveOldConversations(): Promise<void> {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - this.config.ARCHIVE_CONVERSATIONS_AFTER_DAYS);

    const result = await this.dbService.prisma.conversations.updateMany({
      where: {
        status: 'processed',
        ended_at: { lt: archiveDate },
      },
      data: { status: 'archived' },
    });
    
    console.log(`[MaintenanceWorker] Archived ${result.count} conversations older than ${this.config.ARCHIVE_CONVERSATIONS_AFTER_DAYS} days.`);
  }

  // NOTE: updateUserActivityStats() REMOVED per tech lead directive
  // This functionality should be implemented as middleware in api-gateway for real-time updates

  // NOTE: Media cleanup tasks commented out until storage deletion is implemented
  // The database-only cleanup is dangerous and incomplete

  /**
   * Starts the worker and begins scheduling
   */
  public async start(): Promise<void> {
    await this.initialize();
    console.log('[MaintenanceWorker] V11.0 worker started successfully');
  }

  /**
   * Gracefully shuts down the worker
   */
  private async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('[MaintenanceWorker] Initiating graceful shutdown...');

    // Wait for current maintenance cycle to complete
    while (this.isRunning) {
      console.log('[MaintenanceWorker] Waiting for maintenance cycle to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      await this.dbService.closeConnections();
      console.log('[MaintenanceWorker] Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('[MaintenanceWorker] Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Stops the worker
   */
  public async stop(): Promise<void> {
    await this.gracefulShutdown();
  }
} 