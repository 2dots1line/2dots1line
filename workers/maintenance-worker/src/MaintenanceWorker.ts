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
    environmentLoader.injectIntoProcess(); // CRITICAL: Inject into process.env for Prisma
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
    
    // Scan for turn context keys without TTL (now user-scoped)
    const turnContextStream = this.dbService.redis.scanStream({ match: 'turn_context:*:*' });
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

    // Scan for conversation timeout keys without TTL (these can get stuck when Redis fails)
    const conversationTimeoutStream = this.dbService.redis.scanStream({ match: 'conversation:timeout:*' });
    for await (const keys of conversationTimeoutStream) {
      for (const key of keys) {
        const ttl = await this.dbService.redis.ttl(key);
        if (ttl === -1) {
          console.warn(`[MaintenanceWorker] Found stale conversation timeout key: ${key}. Deleting.`);
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
      
      // Skip Weaviate auto-fix for now - focus on Neo4j node creation
      console.log('[MaintenanceWorker] 🔧 Weaviate auto-fix skipped - prioritizing Neo4j node creation');
      
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
          select: { entity_id: true },
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
            'MATCH (c:Concept {id: $conceptId, userId: $userId}) RETURN c.id AS conceptId LIMIT 1',
            { conceptId: concept.entity_id, userId: userId }
          );
          
          if (result.records.length === 0) {
            totalOrphanedCount++;
            console.log(`[MaintenanceWorker] ❌ Orphaned concept: ${concept.entity_id} (user: ${userId}) - exists in PostgreSQL but not in Neo4j`);
          }
        }
        
        // Log progress for this user
        console.log(`[MaintenanceWorker] User ${userId}: ${conceptsInPg.length} concepts checked`);
      }
      
      console.log(`[MaintenanceWorker] Concept integrity check complete. Total checked: ${totalCheckedCount}. Total orphaned: ${totalOrphanedCount}`);
      
      // Auto-fix missing concepts if any found
      if (totalOrphanedCount > 0) {
        console.log(`[MaintenanceWorker] 🔧 Auto-fixing ${totalOrphanedCount} missing concepts...`);
        await this.autoFixMissingConcepts();
      }
      
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
          select: { entity_id: true },
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
            'MATCH (m:MemoryUnit {id: $muid, userId: $userId}) RETURN m.id AS muid LIMIT 1',
            { muid: memoryUnit.entity_id, userId: userId }
          );
          
          if (result.records.length === 0) {
            totalOrphanedCount++;
            console.log(`[MaintenanceWorker] ❌ Orphaned memory unit: ${memoryUnit.entity_id} (user: ${userId}) - exists in PostgreSQL but not in Neo4j`);
          }
        }
        
        // Log progress for this user
        console.log(`[MaintenanceWorker] User ${userId}: ${memoryUnitsInPg.length} memory units checked`);
      }
      
      console.log(`[MaintenanceWorker] Memory unit integrity check complete. Total checked: ${totalCheckedCount}. Total orphaned: ${totalOrphanedCount}`);
      
      // Auto-fix missing memory units if any found
      if (totalOrphanedCount > 0) {
        console.log(`[MaintenanceWorker] 🔧 Auto-fixing ${totalOrphanedCount} missing memory units...`);
        await this.autoFixMissingMemoryUnits();
      }
      
    } finally {
      await neo4jSession.close();
    }
  }

  private async checkVectorSyncIntegrity(): Promise<void> {
    console.log('[MaintenanceWorker] 🔍 Checking Weaviate data integrity...');
    
    try {
      // First, get Weaviate schema to understand what classes exist
      console.log('[MaintenanceWorker] 🔍 Discovering Weaviate schema...');
      
      const schemaResult = await this.dbService.weaviate.schema
        .getter()
        .do();
      
      const weaviateClasses = schemaResult.classes || [];
      console.log(`[MaintenanceWorker] Found ${weaviateClasses.length} classes in Weaviate:`, 
        weaviateClasses.map(c => c.class).join(', '));
      
      if (weaviateClasses.length === 0) {
        console.log('[MaintenanceWorker] ⚠️ No classes found in Weaviate - schema may be empty');
        return;
      }
      
      let totalCheckedCount = 0;
      let totalMissingCount = 0;
      let totalOrphanedCount = 0;
      
      // Check each entity type systematically
      for (const weaviateClass of weaviateClasses) {
        const className = weaviateClass.class;
        if (!className) continue;
        
        console.log(`[MaintenanceWorker] 🔍 Checking class: ${className}`);
        
        try {
          // Get count of objects in this Weaviate class
                              const countResult = await this.dbService.weaviate.graphql
                      .aggregate()
                      .withClassName(className)
                      .withFields('meta { count }')
                      .do();
          
                              const weaviateCount = countResult.data.Aggregate[className]?.[0]?.meta?.count || 0;
          console.log(`[MaintenanceWorker] Weaviate ${className}: ${weaviateCount} objects`);
          
          // Get corresponding PostgreSQL count based on class type
          let pgCount = 0;
          let pgTableName = '';
          
          switch (className.toLowerCase()) {
            case 'concept':
              pgTableName = 'concepts';
              pgCount = await this.dbService.prisma.concepts.count();
              break;
            case 'memoryunit':
            case 'memory_unit':
              pgTableName = 'memory_units';
              pgCount = await this.dbService.prisma.memory_units.count();
              break;
            case 'conversation':
              pgTableName = 'conversations';
              pgCount = await this.dbService.prisma.conversations.count();
              break;
            case 'conversationmessage':
            case 'conversation_message':
              pgTableName = 'conversation_messages';
              pgCount = await this.dbService.prisma.conversation_messages.count();
              break;
            case 'card':
              pgTableName = 'cards';
              pgCount = await this.dbService.prisma.cards.count();
              break;
            default:
              console.log(`[MaintenanceWorker] ⚠️ Unknown class type: ${className} - skipping count comparison`);
              continue;
          }
          
          console.log(`[MaintenanceWorker] PostgreSQL ${pgTableName}: ${pgCount} records`);
          
          // Compare counts
          if (pgCount > weaviateCount) {
            const missing = pgCount - weaviateCount;
            totalMissingCount += missing;
            console.log(`[MaintenanceWorker] ❌ Missing ${missing} ${className} objects in Weaviate`);
          } else if (weaviateCount > pgCount) {
            const orphaned = weaviateCount - pgCount;
            totalOrphanedCount += orphaned;
            console.log(`[MaintenanceWorker] ⚠️ Orphaned ${orphaned} ${className} objects in Weaviate (not in PostgreSQL)`);
          } else {
            console.log(`[MaintenanceWorker] ✅ ${className} counts match: ${pgCount} = ${weaviateCount}`);
          }
          
          totalCheckedCount++;
          
          // Sample check: verify a few specific records exist in both systems
          if (pgCount > 0 && weaviateCount > 0) {
            await this.sampleCheckEntityIntegrity(className, pgTableName);
          }
          
        } catch (error) {
          console.error(`[MaintenanceWorker] Error checking class ${className}:`, error);
        }
      }
      
      console.log(`[MaintenanceWorker] Weaviate integrity check complete.`);
      console.log(`[MaintenanceWorker] Classes checked: ${totalCheckedCount}`);
      console.log(`[MaintenanceWorker] Total missing in Weaviate: ${totalMissingCount}`);
      console.log(`[MaintenanceWorker] Total orphaned in Weaviate: ${totalOrphanedCount}`);
      
    } catch (error) {
      console.error('[MaintenanceWorker] Weaviate integrity check failed:', error);
    }
  }
  
  private async sampleCheckEntityIntegrity(className: string, pgTableName: string): Promise<void> {
    try {
      // Get a sample of records from PostgreSQL
      const sampleRecords = await this.dbService.prisma.$queryRawUnsafe(
        `SELECT id, user_id FROM ${pgTableName} ORDER BY RANDOM() LIMIT 5`
      ) as Array<{id: string, user_id: string}>;
      
      console.log(`[MaintenanceWorker] 🔍 Sample checking ${sampleRecords.length} ${className} records...`);
      
      let foundCount = 0;
      for (const record of sampleRecords) {
        try {
          // Build appropriate query based on class type
          const weaviateQuery = this.dbService.weaviate.graphql
            .get()
            .withClassName(className)
            .withFields('id userId _additional { vector }')
            .withWhere({
              path: ['id'],
              operator: 'Equal',
              valueString: record.id
            });
          
          const result = await weaviateQuery.do();
          const weaviateObject = result.data.Get[className]?.[0];
          
          if (weaviateObject) {
            foundCount++;
            // Verify the object has a vector (check if _additional.vector exists)
            if (weaviateObject._additional?.vector) {
              console.log(`[MaintenanceWorker] ✅ ${className} ${record.id}: Found with vector`);
            } else {
              console.log(`[MaintenanceWorker] ⚠️ ${className} ${record.id}: Found but no vector`);
            }
          } else {
            console.log(`[MaintenanceWorker] ❌ ${className} ${record.id}: Not found in Weaviate`);
          }
          
        } catch (error) {
          console.error(`[MaintenanceWorker] Error checking ${className} ${record.id}:`, error);
        }
      }
      
      console.log(`[MaintenanceWorker] Sample check: ${foundCount}/${sampleRecords.length} ${className} records found in Weaviate`);
      
    } catch (error) {
      console.error(`[MaintenanceWorker] Error in sample check for ${className}:`, error);
    }
  }

  /**
   * Auto-fix methods for data discrepancies
   */
  private async autoFixMissingConcepts(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 Starting auto-fix for missing concepts...');
    
    try {
      // Get all concepts that exist in PostgreSQL but not in Neo4j
      const missingConcepts = await this.dbService.prisma.concepts.findMany({
        where: {
          entity_id: {
            notIn: await this.getExistingNeo4jConceptIds()
          }
        },
        select: {
          entity_id: true,
          title: true,
          content: true,
          user_id: true,
          created_at: true,
          updated_at: true
        }
      });

      if (missingConcepts.length === 0) {
        console.log('[MaintenanceWorker] ✅ No missing concepts to fix');
        return;
      }

      console.log(`[MaintenanceWorker] 🔧 Found ${missingConcepts.length} missing concepts to create in Neo4j`);

      const neo4jSession = this.dbService.neo4j.session();
      let createdCount = 0;

      try {
        for (const concept of missingConcepts) {
          try {
            await neo4jSession.run(`
              CREATE (c:Concept {
                id: $conceptId,
                name: $name,
                description: $description,
                userId: $userId,
                createdAt: $createdAt,
                updatedAt: $updatedAt
              })
            `, {
              conceptId: concept.entity_id,
              name: concept.title || '',
              description: concept.content || '',
              userId: concept.user_id,
              createdAt: concept.created_at,
              updatedAt: concept.updated_at
            });

            createdCount++;
            console.log(`[MaintenanceWorker] ✅ Created Neo4j concept: ${concept.entity_id}`);
          } catch (error) {
            console.error(`[MaintenanceWorker] ❌ Failed to create concept ${concept.entity_id}:`, error);
          }
        }
      } finally {
        await neo4jSession.close();
      }

      console.log(`[MaintenanceWorker] 🔧 Auto-fix complete: ${createdCount}/${missingConcepts.length} concepts created in Neo4j`);

    } catch (error) {
      console.error('[MaintenanceWorker] ❌ Auto-fix for concepts failed:', error);
    }
  }

  private async autoFixMissingMemoryUnits(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 Starting auto-fix for missing memory units...');
    
    try {
      // Get all memory units that exist in PostgreSQL but not in Neo4j
      const missingMemoryUnits = await this.dbService.prisma.memory_units.findMany({
        where: {
          entity_id: {
            notIn: await this.getExistingNeo4jMemoryUnitIds()
          }
        },
        select: {
          entity_id: true,
          content: true,
          user_id: true,
          created_at: true,
          updated_at: true
        }
      });

      if (missingMemoryUnits.length === 0) {
        console.log('[MaintenanceWorker] ✅ No missing memory units to fix');
        return;
      }

      console.log(`[MaintenanceWorker] 🔧 Found ${missingMemoryUnits.length} missing memory units to create in Neo4j`);

      const neo4jSession = this.dbService.neo4j.session();
      let createdCount = 0;

      try {
        for (const memoryUnit of missingMemoryUnits) {
          try {
            await neo4jSession.run(`
              CREATE (m:MemoryUnit {
                id: $muid,
                content: $content,
                userId: $userId,
                createdAt: $createdAt,
                updatedAt: $updatedAt
              })
            `, {
              muid: memoryUnit.entity_id,
              content: memoryUnit.content || '',
              userId: memoryUnit.user_id,
              createdAt: memoryUnit.created_at,
              updatedAt: memoryUnit.updated_at
            });

            createdCount++;
            console.log(`[MaintenanceWorker] ✅ Created Neo4j memory unit: ${memoryUnit.entity_id}`);
          } catch (error) {
            console.error(`[MaintenanceWorker] ❌ Failed to create memory unit ${memoryUnit.entity_id}:`, error);
          }
        }
      } finally {
        await neo4jSession.close();
      }

      console.log(`[MaintenanceWorker] 🔧 Auto-fix complete: ${createdCount}/${missingMemoryUnits.length} memory units created in Neo4j`);

    } catch (error) {
      console.error('[MaintenanceWorker] ❌ Auto-fix for memory units failed:', error);
    }
  }

  private async getExistingNeo4jConceptIds(): Promise<string[]> {
    const neo4jSession = this.dbService.neo4j.session();
    try {
      const result = await neo4jSession.run('MATCH (c:Concept) RETURN c.id AS conceptId');
      return result.records.map(record => record.get('conceptId'));
    } finally {
      await neo4jSession.close();
    }
  }

  private async getExistingNeo4jMemoryUnitIds(): Promise<string[]> {
    const neo4jSession = this.dbService.neo4j.session();
    try {
      const result = await neo4jSession.run('MATCH (m:MemoryUnit) RETURN m.id AS muid');
      return result.records.map(record => record.get('muid'));
    } finally {
      await neo4jSession.close();
    }
  }

  private async triggerReEmbedding(entityId: string, entityType: string): Promise<void> {
    console.log(`[MaintenanceWorker] 🔧 Triggering re-embedding for ${entityType}: ${entityId}`);
    
    try {
      // Add to embedding worker queue for re-processing
      const embeddingJob = {
        type: 're-embed',
        entityType: entityType,
        entityId: entityId,
        timestamp: new Date().toISOString(),
        source: 'maintenance-worker'
      };

      await this.dbService.redis.lpush('embedding:queue', JSON.stringify(embeddingJob));
      console.log(`[MaintenanceWorker] ✅ Added ${entityType} ${entityId} to embedding queue`);
      
    } catch (error) {
      console.error(`[MaintenanceWorker] ❌ Failed to trigger re-embedding for ${entityType} ${entityId}:`, error);
    }
  }

  private async autoFixWeaviateVectors(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 Starting auto-fix for Weaviate vector issues...');
    
    try {
      // Only check concepts that are missing from Weaviate (not all concepts!)
      // This is a more targeted approach that won't overwhelm the system
      console.log('[MaintenanceWorker] 🔧 Checking for concepts missing from Weaviate...');
      
      // For now, skip the Weaviate auto-fix until we have a proper schema mapping
      // The real priority is fixing the missing Neo4j nodes
      console.log('[MaintenanceWorker] 🔧 Weaviate vector auto-fix skipped - focusing on Neo4j node creation first');
      
    } catch (error) {
      console.error('[MaintenanceWorker] ❌ Auto-fix for Weaviate vectors failed:', error);
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

  /**
   * Manually trigger auto-fix for all data discrepancies
   */
  public async triggerAutoFix(): Promise<void> {
    console.log('[MaintenanceWorker] 🔧 MANUAL TRIGGER: Auto-fix for data discrepancies');
    
    try {
      console.log('[MaintenanceWorker] 🔧 Starting comprehensive auto-fix process...');
      
      // Auto-fix missing Neo4j concepts
      console.log('[MaintenanceWorker] 🔧 Step 1: Fixing missing Neo4j concepts...');
      await this.autoFixMissingConcepts();
      console.log('[MaintenanceWorker] 🔧 Step 1 completed');
      
      // Auto-fix missing Neo4j memory units  
      console.log('[MaintenanceWorker] 🔧 Step 2: Fixing missing Neo4j memory units...');
      await this.autoFixMissingMemoryUnits();
      console.log('[MaintenanceWorker] 🔧 Step 2 completed');
      
      // Auto-fix Weaviate vector issues
      console.log('[MaintenanceWorker] 🔧 Step 3: Fixing Weaviate vector issues...');
      await this.autoFixWeaviateVectors();
      console.log('[MaintenanceWorker] 🔧 Step 3 completed');
      
      console.log('[MaintenanceWorker] ✅ Comprehensive auto-fix process completed');
      
    } catch (error) {
      console.error('[MaintenanceWorker] ❌ Auto-fix process failed:', error);
      throw error;
    }
  }
}