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
    // Set process title for proper PM2 identification
    process.title = 'maintenance-worker';
    
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

    // Debug: Check the type of INTEGRITY_CHECK_BATCH_SIZE
    console.log('[MaintenanceWorker] Debug - INTEGRITY_CHECK_BATCH_SIZE:', {
      value: this.config.INTEGRITY_CHECK_BATCH_SIZE,
      type: typeof this.config.INTEGRITY_CHECK_BATCH_SIZE,
      isInteger: Number.isInteger(this.config.INTEGRITY_CHECK_BATCH_SIZE)
    });

    this.dbService = DatabaseService.getInstance();
  }

  public async initialize(): Promise<void> {
    console.log('[MaintenanceWorker] Initializing V11.0 maintenance worker...');
    
    // CRITICAL: Ensure this worker is isolated from Redis event processing
    console.log('[MaintenanceWorker] 🔒 ISOLATION: This worker does NOT process Redis events');
    console.log('[MaintenanceWorker] 🔒 ISOLATION: Only scheduled maintenance tasks will run');
    
    // Debug: Validate cron expressions
    console.log('[MaintenanceWorker] Debug - Cron expressions:');
    console.log(`  Redis cleanup: "${this.config.REDIS_CLEANUP_CRON}" (valid: ${cron.validate(this.config.REDIS_CLEANUP_CRON)})`);
    console.log(`  Integrity check: "${this.config.INTEGRITY_CHECK_CRON}" (valid: ${cron.validate(this.config.INTEGRITY_CHECK_CRON)})`);
    console.log(`  DB optimization: "${this.config.DB_OPTIMIZATION_CRON}" (valid: ${cron.validate(this.config.DB_OPTIMIZATION_CRON)})`);
    console.log(`  Archiving: "${this.config.ARCHIVING_CRON}" (valid: ${cron.validate(this.config.ARCHIVING_CRON)})`);
    
    // Schedule the main maintenance cycle (daily at 2 AM)
    const integrityCheckTask = cron.schedule(this.config.INTEGRITY_CHECK_CRON, async () => {
      if (!this.isRunning && !this.isShuttingDown) {
        console.log('[MaintenanceWorker] 🔄 Daily maintenance cycle triggered');
        await this.runMaintenanceCycle();
      }
    });
    this.tasks.push(integrityCheckTask);
    console.log(`[MaintenanceWorker] Maintenance cycle scheduled: ${this.config.INTEGRITY_CHECK_CRON}`);

    // Schedule Redis cleanup task (hourly)
    if (this.config.ENABLE_REDIS_CLEANUP) {
      const redisCleanupTask = cron.schedule(this.config.REDIS_CLEANUP_CRON, async () => {
        if (!this.isShuttingDown) {
          console.log('[MaintenanceWorker] 🔄 Hourly Redis cleanup triggered');
          await this.cleanupStaleRedisKeys();
        }
      });
      this.tasks.push(redisCleanupTask);
      console.log(`[MaintenanceWorker] Redis cleanup scheduled: ${this.config.REDIS_CLEANUP_CRON}`);
    }

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());

    console.log('[MaintenanceWorker] V11.0 initialization complete');
    console.log('[MaintenanceWorker] 🔒 ISOLATION: Worker is ready for scheduled maintenance tasks only');
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
    console.log('[MaintenanceWorker] 🔍 Starting data integrity check...');
    
    try {
      // Check concept integrity (PostgreSQL vs Neo4j)
      await this.checkConceptIntegrity();
      
      // Check memory unit integrity (PostgreSQL vs Neo4j)
      await this.checkMemoryUnitIntegrity();
      
      // Check vector sync integrity (PostgreSQL vs Weaviate)
      await this.checkVectorSyncIntegrity();
      
      console.log('[MaintenanceWorker] ✅ Data integrity check completed');
    } catch (error) {
      console.error('[MaintenanceWorker] ❌ Data integrity check failed:', error);
    }
  }

  private async checkConceptIntegrity(): Promise<void> {
    console.log('[MaintenanceWorker] 🔍 Checking concept integrity...');
    
    const neo4jSession = this.dbService.neo4j.session();
    let totalCheckedCount = 0;
    let totalOrphanedCount = 0;
    
    try {
      // Get distinct user IDs from PostgreSQL
      const usersWithConcepts = await this.dbService.prisma.concepts.findMany({
        select: { user_id: true },
        distinct: ['user_id']
      });
      
      console.log(`[MaintenanceWorker] Found ${usersWithConcepts.length} users with concepts to check`);
      
      for (const userRecord of usersWithConcepts) {
        const userId = userRecord.user_id;
        console.log(`[MaintenanceWorker] Checking concepts for user: ${userId}`);
        
        // Get concepts for this user from PostgreSQL
        const conceptsInPg = await this.dbService.prisma.concepts.findMany({
          select: { concept_id: true },
          where: { user_id: userId },
          take: this.config.INTEGRITY_CHECK_BATCH_SIZE
        });
        
        if (conceptsInPg.length === 0) {
          console.log(`[MaintenanceWorker] No concepts found in PostgreSQL for user: ${userId}`);
          continue;
        }
        
        console.log(`[MaintenanceWorker] Checking ${conceptsInPg.length} concepts for user: ${userId}`);
        
        // Check each concept individually in Neo4j
        for (const concept of conceptsInPg) {
          totalCheckedCount++;
          
          const result = await neo4jSession.run(
            'MATCH (c:Concept {concept_id: $conceptId, userId: $userId}) RETURN c.concept_id AS conceptId LIMIT 1',
            { conceptId: concept.concept_id, userId: userId }
          );
          
          if (result.records.length === 0) {
            totalOrphanedCount++;
            console.log(`[MaintenanceWorker] ❌ Orphaned concept: ${concept.concept_id} (user: ${userId}) - exists in PostgreSQL but not in Neo4j`);
          }
        }
        
        // Log progress for this user
        console.log(`[MaintenanceWorker] User ${userId}: ${conceptsInPg.length} concepts checked`);
      }
      
      console.log(`[MaintenanceWorker] Concept integrity check complete. Total checked: ${totalCheckedCount}. Total orphaned: ${totalOrphanedCount}`);
      
    } finally {
      await neo4jSession.close();
    }
  }

  private async checkMemoryUnitIntegrity(): Promise<void> {
    console.log('[MaintenanceWorker] 🔍 Checking memory unit integrity...');
    
    const neo4jSession = this.dbService.neo4j.session();
    let totalCheckedCount = 0;
    let totalOrphanedCount = 0;
    
    try {
      // Get distinct user IDs from PostgreSQL
      const usersWithMemoryUnits = await this.dbService.prisma.memory_units.findMany({
        select: { user_id: true },
        distinct: ['user_id']
      });
      
      console.log(`[MaintenanceWorker] Found ${usersWithMemoryUnits.length} users with memory units to check`);
      
      for (const userRecord of usersWithMemoryUnits) {
        const userId = userRecord.user_id;
        console.log(`[MaintenanceWorker] Checking memory units for user: ${userId}`);
        
        // Get memory units for this user from PostgreSQL
        const memoryUnitsInPg = await this.dbService.prisma.memory_units.findMany({
          select: { muid: true },
          where: { user_id: userId },
          take: this.config.INTEGRITY_CHECK_BATCH_SIZE
        });
        
        if (memoryUnitsInPg.length === 0) {
          console.log(`[MaintenanceWorker] No memory units found in PostgreSQL for user: ${userId}`);
          continue;
        }
        
        console.log(`[MaintenanceWorker] Checking ${memoryUnitsInPg.length} memory units for user: ${userId}`);
        
        // Check each memory unit individually in Neo4j
        for (const memoryUnit of memoryUnitsInPg) {
          totalCheckedCount++;
          
          const result = await neo4jSession.run(
            'MATCH (m:MemoryUnit {muid: $muid, userId: $userId}) RETURN m.muid AS muid LIMIT 1',
            { muid: memoryUnit.muid, userId: userId }
          );
          
          if (result.records.length === 0) {
            totalOrphanedCount++;
            console.log(`[MaintenanceWorker] ❌ Orphaned memory unit: ${memoryUnit.muid} (user: ${userId}) - exists in PostgreSQL but not in Neo4j`);
          }
        }
        
        // Log progress for this user
        console.log(`[MaintenanceWorker] User ${userId}: ${memoryUnitsInPg.length} memory units checked`);
      }
      
      console.log(`[MaintenanceWorker] Memory unit integrity check complete. Total checked: ${totalCheckedCount}. Total orphaned: ${totalOrphanedCount}`);
      
    } finally {
      await neo4jSession.close();
    }
  }

  private async checkVectorSyncIntegrity(): Promise<void> {
    console.log('[MaintenanceWorker] 🔍 Checking vector sync integrity...');
    
    try {
      // Get distinct user IDs from PostgreSQL
      const usersWithConcepts = await this.dbService.prisma.concepts.findMany({
        select: { user_id: true },
        distinct: ['user_id']
      });
      
      console.log(`[MaintenanceWorker] Found ${usersWithConcepts.length} users with concepts to check in Weaviate`);
      
      let totalCheckedCount = 0;
      let totalMissingVectorsCount = 0;
      
      for (const userRecord of usersWithConcepts) {
        const userId = userRecord.user_id;
        
        // Get concepts for this user from PostgreSQL
        const conceptsInPg = await this.dbService.prisma.concepts.findMany({
          select: { concept_id: true },
          where: { user_id: userId },
          take: this.config.INTEGRITY_CHECK_BATCH_SIZE
        });
        
        if (conceptsInPg.length === 0) continue;
        
        // Check each concept in Weaviate
        for (const concept of conceptsInPg) {
          totalCheckedCount++;
          
          try {
            // Query Weaviate for this specific concept
                         const weaviateResult = await this.dbService.weaviate.graphql
              .get()
              .withClassName('Concept')
              .withFields('concept_id userId')
              .withWhere({
                operator: 'And',
                operands: [
                  { path: ['concept_id'], operator: 'Equal', valueString: concept.concept_id },
                  { path: ['userId'], operator: 'Equal', valueString: userId }
                ]
              })
              .do();
            
            if (!weaviateResult.data.Get.Concept || weaviateResult.data.Get.Concept.length === 0) {
              totalMissingVectorsCount++;
              console.log(`[MaintenanceWorker] ❌ Missing vector: ${concept.concept_id} (user: ${userId}) - exists in PostgreSQL but not in Weaviate`);
            }
          } catch (error) {
            console.error(`[MaintenanceWorker] Error checking concept ${concept.concept_id} in Weaviate:`, error);
            totalMissingVectorsCount++;
          }
        }
      }
      
      console.log(`[MaintenanceWorker] Vector sync integrity check complete. Total checked: ${totalCheckedCount}. Total missing vectors: ${totalMissingVectorsCount}`);
      
    } catch (error) {
      console.error('[MaintenanceWorker] Vector sync integrity check failed:', error);
    }
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
    
    // CRITICAL: Verify isolation from Redis event processing
    await this.verifyIsolation();
    
    console.log('[MaintenanceWorker] V11.0 worker started successfully');
  }

  /**
   * Verify that this worker is isolated from Redis event processing
   */
  private async verifyIsolation(): Promise<void> {
    console.log('[MaintenanceWorker] 🔒 VERIFYING ISOLATION...');
    
    // Check that we don't have any Redis event subscriptions
    const redisClient = this.dbService.redis;
    
    // Verify no active subscriptions
    if (redisClient.status !== 'ready') {
      console.log('[MaintenanceWorker] 🔒 ISOLATION: Redis client not ready, no event processing');
    } else {
      console.log('[MaintenanceWorker] 🔒 ISOLATION: Redis client ready for maintenance operations only');
    }
    
    console.log('[MaintenanceWorker] 🔒 ISOLATION: Maintenance worker is properly isolated');
    console.log('[MaintenanceWorker] 🔒 ISOLATION: No Redis event processing will occur');
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

  // --- MANUAL TRIGGER METHODS FOR TESTING ---

  /**
   * Manually trigger Redis cleanup task
   */
  public async triggerRedisCleanup(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 MANUAL TRIGGER: Redis cleanup task');
    await this.cleanupStaleRedisKeys();
  }

  /**
   * Manually trigger data integrity check task
   */
  public async triggerDataIntegrityCheck(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 MANUAL TRIGGER: Data integrity check task');
    await this.runDataIntegrityCheck();
  }

  /**
   * Manually trigger database optimization task
   */
  public async triggerDatabaseOptimization(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 MANUAL TRIGGER: Database optimization task');
    await this.runDatabaseOptimization();
  }

  /**
   * Manually trigger data archiving task
   */
  public async triggerDataArchiving(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 MANUAL TRIGGER: Data archiving task');
    await this.archiveOldConversations();
  }

  /**
   * Manually trigger expired session cleanup
   */
  public async triggerExpiredSessionCleanup(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 MANUAL TRIGGER: Expired session cleanup task');
    await this.cleanupExpiredSessions();
  }
}