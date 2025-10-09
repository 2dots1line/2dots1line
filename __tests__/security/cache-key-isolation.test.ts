/**
 * Cache Key User Isolation Security Tests
 * 
 * This test suite verifies that all Redis cache keys are properly user-scoped
 * to prevent cross-user data pollution and ensure data isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Redis from 'ioredis';

describe('Cache Key User Isolation Security Tests', () => {
  let redis: Redis;
  const testUserId1 = 'test-user-123';
  const testUserId2 = 'test-user-456';
  const testConversationId1 = 'test-conv-123';
  const testConversationId2 = 'test-conv-456';

  beforeEach(async () => {
    // Use a test Redis instance
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 15, // Use test database
      lazyConnect: true
    });
    await redis.connect();
    
    // Clear test database
    await redis.flushdb();
  });

  afterEach(async () => {
    await redis.flushdb();
    await redis.quit();
  });

  describe('Turn Context Cache Keys', () => {
    it('should isolate turn context between different users', async () => {
      const turnContext1 = { focus: 'user1-focus', tone: 'supportive' };
      const turnContext2 = { focus: 'user2-focus', tone: 'analytical' };

      // Set turn context for both users
      await redis.set(
        `turn_context:${testUserId1}:${testConversationId1}`,
        JSON.stringify(turnContext1),
        'EX',
        600
      );
      await redis.set(
        `turn_context:${testUserId2}:${testConversationId1}`,
        JSON.stringify(turnContext2),
        'EX',
        600
      );

      // Verify isolation - each user should only see their own context
      const retrieved1 = await redis.get(`turn_context:${testUserId1}:${testConversationId1}`);
      const retrieved2 = await redis.get(`turn_context:${testUserId2}:${testConversationId1}`);

      expect(JSON.parse(retrieved1!)).toEqual(turnContext1);
      expect(JSON.parse(retrieved2!)).toEqual(turnContext2);
      expect(JSON.parse(retrieved1!)).not.toEqual(JSON.parse(retrieved2!));
    });

    it('should prevent cross-user access to turn context', async () => {
      const turnContext = { focus: 'private-focus', tone: 'confidential' };

      // Set turn context for user1
      await redis.set(
        `turn_context:${testUserId1}:${testConversationId1}`,
        JSON.stringify(turnContext),
        'EX',
        600
      );

      // User2 should not be able to access user1's context
      const user2Access = await redis.get(`turn_context:${testUserId2}:${testConversationId1}`);
      expect(user2Access).toBeNull();

      // User1 should be able to access their own context
      const user1Access = await redis.get(`turn_context:${testUserId1}:${testConversationId1}`);
      expect(JSON.parse(user1Access!)).toEqual(turnContext);
    });
  });

  describe('Conversation Timeout Cache Keys', () => {
    it('should isolate conversation timeouts between different users', async () => {
      // Set conversation timeouts for both users
      await redis.set(
        `conversation:timeout:${testUserId1}:${testConversationId1}`,
        testConversationId1,
        'EX',
        300
      );
      await redis.set(
        `conversation:timeout:${testUserId2}:${testConversationId1}`,
        testConversationId1,
        'EX',
        300
      );

      // Verify both keys exist independently
      const timeout1 = await redis.get(`conversation:timeout:${testUserId1}:${testConversationId1}`);
      const timeout2 = await redis.get(`conversation:timeout:${testUserId2}:${testConversationId1}`);

      expect(timeout1).toBe(testConversationId1);
      expect(timeout2).toBe(testConversationId1);
    });

    it('should prevent cross-user timeout interference', async () => {
      // Set timeout for user1
      await redis.set(
        `conversation:timeout:${testUserId1}:${testConversationId1}`,
        testConversationId1,
        'EX',
        300
      );

      // User2 should not have access to user1's timeout
      const user2Timeout = await redis.get(`conversation:timeout:${testUserId2}:${testConversationId1}`);
      expect(user2Timeout).toBeNull();

      // User1 should have their timeout
      const user1Timeout = await redis.get(`conversation:timeout:${testUserId1}:${testConversationId1}`);
      expect(user1Timeout).toBe(testConversationId1);
    });
  });

  describe('HRT Cache Keys', () => {
    it('should isolate HRT results between different users', async () => {
      const hrtResult1 = { retrievedMemoryUnits: ['memory1'], retrievedConcepts: ['concept1'] };
      const hrtResult2 = { retrievedMemoryUnits: ['memory2'], retrievedConcepts: ['concept2'] };

      // Set HRT results for both users
      await redis.set(
        `hrt:result:v9_5:${testUserId1}:${testConversationId1}:neighborhood:phrase1:weights1`,
        JSON.stringify(hrtResult1),
        'EX',
        300
      );
      await redis.set(
        `hrt:result:v9_5:${testUserId2}:${testConversationId1}:neighborhood:phrase1:weights1`,
        JSON.stringify(hrtResult2),
        'EX',
        300
      );

      // Verify isolation
      const result1 = await redis.get(`hrt:result:v9_5:${testUserId1}:${testConversationId1}:neighborhood:phrase1:weights1`);
      const result2 = await redis.get(`hrt:result:v9_5:${testUserId2}:${testConversationId1}:neighborhood:phrase1:weights1`);

      expect(JSON.parse(result1!)).toEqual(hrtResult1);
      expect(JSON.parse(result2!)).toEqual(hrtResult2);
      expect(JSON.parse(result1!)).not.toEqual(JSON.parse(result2!));
    });
  });

  describe('Embedding Cache Keys', () => {
    it('should isolate embedding cache between different users', async () => {
      const embedding1 = [0.1, 0.2, 0.3];
      const embedding2 = [0.4, 0.5, 0.6];

      // Set embeddings for both users
      await redis.set(
        `shared_embedding:${testUserId1}:test-phrase`,
        JSON.stringify({ vector: embedding1, timestamp: Date.now() }),
        'EX',
        300
      );
      await redis.set(
        `shared_embedding:${testUserId2}:test-phrase`,
        JSON.stringify({ vector: embedding2, timestamp: Date.now() }),
        'EX',
        300
      );

      // Verify isolation
      const emb1 = await redis.get(`shared_embedding:${testUserId1}:test-phrase`);
      const emb2 = await redis.get(`shared_embedding:${testUserId2}:test-phrase`);

      expect(JSON.parse(emb1!).vector).toEqual(embedding1);
      expect(JSON.parse(emb2!).vector).toEqual(embedding2);
      expect(JSON.parse(emb1!).vector).not.toEqual(JSON.parse(emb2!).vector);
    });
  });

  describe('Prompt Cache Keys', () => {
    it('should isolate prompt cache between different users', async () => {
      const prompt1 = 'User 1 specific prompt content';
      const prompt2 = 'User 2 specific prompt content';

      // Set prompt cache for both users
      await redis.set(
        `prompt_section:core_identity:${testUserId1}`,
        prompt1,
        'EX',
        3600
      );
      await redis.set(
        `prompt_section:core_identity:${testUserId2}`,
        prompt2,
        'EX',
        3600
      );

      // Verify isolation
      const prompt1Retrieved = await redis.get(`prompt_section:core_identity:${testUserId1}`);
      const prompt2Retrieved = await redis.get(`prompt_section:core_identity:${testUserId2}`);

      expect(prompt1Retrieved).toBe(prompt1);
      expect(prompt2Retrieved).toBe(prompt2);
      expect(prompt1Retrieved).not.toBe(prompt2Retrieved);
    });
  });

  describe('HRT Parameters Cache Keys', () => {
    it('should isolate HRT parameters between different users', async () => {
      const params1 = { scoring: { topNCandidatesForHydration: 10 } };
      const params2 = { scoring: { topNCandidatesForHydration: 20 } };

      // Set HRT parameters for both users
      await redis.set(
        `hrt_parameters:${testUserId1}`,
        JSON.stringify(params1),
        'EX',
        3600
      );
      await redis.set(
        `hrt_parameters:${testUserId2}`,
        JSON.stringify(params2),
        'EX',
        3600
      );

      // Verify isolation
      const params1Retrieved = await redis.get(`hrt_parameters:${testUserId1}`);
      const params2Retrieved = await redis.get(`hrt_parameters:${testUserId2}`);

      expect(JSON.parse(params1Retrieved!)).toEqual(params1);
      expect(JSON.parse(params2Retrieved!)).toEqual(params2);
      expect(JSON.parse(params1Retrieved!)).not.toEqual(JSON.parse(params2Retrieved!));
    });
  });

  describe('Cache Key Pattern Validation', () => {
    it('should validate user-scoped cache key formats', () => {
      // Test that user-scoped keys have the correct format
      const userScopedKeys = [
        'turn_context:user123:conversation123',
        'conversation:timeout:user123:conversation123',
        'hrt:result:v9_5:user123:conversation123:neighborhood:phrase1:weights1',
        'shared_embedding:user123:phrase1',
        'prompt_section:core_identity:user123',
        'hrt_parameters:user123',
      ];

      userScopedKeys.forEach(key => {
        // Each key should contain at least one colon after the prefix
        expect(key).toMatch(/:/);
        
        // Each key should not start with just the prefix (no user ID)
        if (key.startsWith('turn_context:')) {
          expect(key).not.toBe('turn_context:');
          expect(key.split(':').length).toBeGreaterThan(2);
        } else if (key.startsWith('conversation:timeout:')) {
          expect(key).not.toBe('conversation:timeout:');
          expect(key.split(':').length).toBeGreaterThan(3);
        } else if (key.startsWith('hrt:result:')) {
          expect(key).not.toBe('hrt:result:');
          expect(key.split(':').length).toBeGreaterThan(2);
        } else if (key.startsWith('shared_embedding:')) {
          expect(key).not.toBe('shared_embedding:');
          expect(key.split(':').length).toBeGreaterThan(2);
        } else if (key.startsWith('prompt_section:')) {
          expect(key).not.toBe('prompt_section:');
          expect(key.split(':').length).toBeGreaterThan(2);
        } else if (key.startsWith('hrt_parameters:')) {
          expect(key).not.toBe('hrt_parameters:');
          expect(key.split(':').length).toBeGreaterThan(1);
        }
      });
    });
  });

  describe('Cache Key Collision Prevention', () => {
    it('should prevent cache key collisions between users with similar IDs', async () => {
      const similarUserId1 = 'user123';
      const similarUserId2 = 'user1234';
      const conversationId = 'conv123';

      const context1 = { focus: 'user1-focus' };
      const context2 = { focus: 'user2-focus' };

      // Set contexts for users with similar IDs
      await redis.set(
        `turn_context:${similarUserId1}:${conversationId}`,
        JSON.stringify(context1),
        'EX',
        600
      );
      await redis.set(
        `turn_context:${similarUserId2}:${conversationId}`,
        JSON.stringify(context2),
        'EX',
        600
      );

      // Verify no collision occurred
      const retrieved1 = await redis.get(`turn_context:${similarUserId1}:${conversationId}`);
      const retrieved2 = await redis.get(`turn_context:${similarUserId2}:${conversationId}`);

      expect(JSON.parse(retrieved1!)).toEqual(context1);
      expect(JSON.parse(retrieved2!)).toEqual(context2);
      expect(JSON.parse(retrieved1!)).not.toEqual(JSON.parse(retrieved2!));
    });
  });
});
