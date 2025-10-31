import { environmentLoader } from '@2dots1line/core-utils';
import { DatabaseService, UserRepository, ConceptRepository } from '@2dots1line/database';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

// Use any type for now since Prisma types are complex
type User = any;

/**
 * UserService - Pure business logic for user operations
 * V11.0 Headless Service - No HTTP dependencies
 */
export class UserService {
  private userRepository: UserRepository;
  private databaseService: DatabaseService;
  private redisConnection: Redis;
  private embeddingQueue: Queue;
  private cardQueue: Queue;
  private graphQueue: Queue;

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
    this.databaseService = databaseService;
    
    // Initialize Redis connection for queue operations
    const redisUrl = environmentLoader.get('REDIS_URL');
    if (redisUrl) {
      this.redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        connectTimeout: 10000, // 10 seconds timeout for connection
        lazyConnect: true, // Don't connect immediately
      });
      
      // Initialize BullMQ queues (same as IngestionAnalyst)
      this.embeddingQueue = new Queue('embedding-queue', { connection: this.redisConnection });
      this.cardQueue = new Queue('card-queue', { connection: this.redisConnection });
      this.graphQueue = new Queue('graph-queue', { connection: this.redisConnection });
    } else {
      throw new Error('REDIS_URL environment variable is required for UserService');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Create a new user
   * V11.1.1 ENHANCEMENT: Automatically create User concept and trigger onboarding ingestion
   */
  async createUser(userData: {
    email: string;
    name?: string;
    profileImageUrl?: string;
    preferences?: any;
  }): Promise<User> {
    // Create the user in the database
    const user = await this.userRepository.create({
      email: userData.email,
      name: userData.name,
      profile_picture_url: userData.profileImageUrl,
      preferences: userData.preferences,
    });

    // V11.1.1 ENHANCEMENT: Automatically create User concept for the new user
    await this.createUserConcept(user.user_id, user.name || 'User');

    return user;
  }

  /**
   * V11.1.1 NEW: Create a User concept for the user in their knowledge graph
   * Includes full workflow: concept creation, embedding, card creation, and graph projection
   */
  private async createUserConcept(userId: string, userName: string): Promise<void> {
    try {
      const conceptRepo = new ConceptRepository(this.databaseService);
      
      // Create a User concept for this user
      const userConceptData = {
        user_id: userId,
        title: userName,
        type: 'person',
        content: `The user (${userName}) in this knowledge graph - the central person whose experiences, interests, and growth are being tracked.`,
        importance_score: 10 // High importance since user is central to their own knowledge graph
      };

      // Check if Neo4j is available
      if (!this.databaseService.neo4j) {
        console.warn(`[UserService] Neo4j client not available, creating user concept in PostgreSQL only`);
        const userConcept = await conceptRepo.create(userConceptData);
        console.log(`[UserService] ✅ Created User concept in PostgreSQL only: ${userConcept.entity_id}`);
        await this.triggerUserConceptWorkflow(userId, userConcept.entity_id, userName);
        return;
      }

      // Create in PostgreSQL and Neo4j in transaction (mimicking IngestionAnalyst.createEntityWithNeo4j)
      const neo4jSession = this.databaseService.neo4j.session();
      const neo4jTransaction = neo4jSession.beginTransaction();

      try {
        // Step 1: Create entity in PostgreSQL
        const userConcept = await conceptRepo.create(userConceptData);
        console.log(`[UserService] ✅ Created User concept in PostgreSQL: ${userConcept.entity_id}`);

        // Step 2: Create Neo4j node with standardized properties (V11.0 schema compliance)
        const neo4jProperties = {
          entity_id: userConcept.entity_id,
          user_id: userId,
          entity_type: 'Concept',
          title: userConcept.title,
          content: userConcept.content,
          importance_score: userConcept.importance_score,
          created_at: new Date().toISOString(),
          source: 'UserService',
          type: userConcept.type,
          status: userConcept.status || 'active'
        };

        // Step 3: Create Neo4j node in transaction
        await this.createNeo4jNodeInTransaction(neo4jTransaction, 'Concept', neo4jProperties);
        
        // Step 4: Commit transaction
        await neo4jTransaction.commit();
        console.log(`[UserService] ✅ Created User concept in Neo4j: ${userConcept.entity_id}`);

        // Step 5: Trigger downstream workflows
        await this.triggerUserConceptWorkflow(userId, userConcept.entity_id, userName);

      } catch (error) {
        await neo4jTransaction.rollback();
        throw error;
      } finally {
        await neo4jSession.close();
      }

    } catch (error) {
      console.error(`[UserService] ❌ Error creating User concept for ${userName}:`, error);
      // Don't fail user creation if concept creation fails
    }
  }

  /**
   * Create Neo4j node in transaction (copied from IngestionAnalyst)
   */
  private async createNeo4jNodeInTransaction(transaction: any, label: string, properties: any): Promise<void> {
    const cypher = `CREATE (n:${label} $props)`;
    await transaction.run(cypher, { props: properties });
  }

  /**
   * V11.1.1 NEW: Trigger full workflow for user concept (embedding, card, graph)
   * Mimics IngestionAnalyst.publishEvents() pattern
   */
  private async triggerUserConceptWorkflow(userId: string, conceptId: string, userName: string): Promise<void> {
    try {
      console.log(`[UserService] 🚀 Publishing user concept ${conceptId} to downstream workers`);

      // FIX: Use title only for consistency with IngestionAnalyst.extractTextContent()
      // Concepts are embedded with title only (see IngestionAnalyst.ts line 637)
      const textContent = userName;  // Just the name, like all other concepts
      const newEntities = [{ id: conceptId, type: 'Concept' }];

      // Step 1: Publish embedding job (same as IngestionAnalyst)
      await this.embeddingQueue.add('create_embedding', {
        entityId: conceptId,
        entityType: 'Concept',
        textContent,  // Now consistent: title only
        userId
      });
      console.log(`[UserService] ✅ Queued embedding job for user concept ${conceptId}`);

      // Step 2: Publish new_entities_created event (same as IngestionAnalyst)
      const eventPayload = {
        type: 'new_entities_created',
        userId,
        entities: newEntities,
        source: 'UserService'
      };

      // Publish to card queue (cards can be created immediately)
      await this.cardQueue.add('new_entities_created', eventPayload);
      console.log(`[UserService] ✅ Published new_entities_created event to card-queue`);

      // Publish to graph queue (graph projection will wait for embeddings)
      await this.graphQueue.add('new_entities_created', eventPayload);
      console.log(`[UserService] ✅ Published new_entities_created event to graph-queue`);

      console.log(`[UserService] 🎉 User concept ${conceptId} published to all downstream workers`);

    } catch (error) {
      console.error(`[UserService] ❌ Error publishing user concept ${conceptId}:`, error);
      // Don't fail user creation if workflow fails
    }
  }


  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: {
    name?: string;
    profileImageUrl?: string;
    preferences?: any;
    language_preference?: string;
  }): Promise<User> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.profileImageUrl !== undefined) updateData.profile_picture_url = updates.profileImageUrl;
    if (updates.preferences !== undefined) updateData.preferences = updates.preferences;
    if (updates.language_preference !== undefined) updateData.language_preference = updates.language_preference;

    return this.userRepository.update(userId, updateData);
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user !== null;
  }

  /**
   * Cleanup Redis connection
   */
  async cleanup(): Promise<void> {
    if (this.redisConnection) {
      await this.redisConnection.quit();
    }
  }
}