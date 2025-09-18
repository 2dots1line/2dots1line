/**
 * Jest Setup for V11.0 Tests
 * 
 * This file configures the test environment for all tests,
 * including global mocks, timeouts, and test utilities.
 */

import { jest } from '@jest/globals';

// Extend Jest timeout for tests
jest.setTimeout(60000);

// Global test configuration
beforeAll(() => {
  // Suppress console logs during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Cleanup after all tests
  jest.restoreAllMocks();
});

// Global mock implementations for common external services
(global as any).mockDatabaseResponses = {
  user: {
    id: 'test-user-123',
    memory_profile: {
      dominant_themes: ['technology', 'learning'],
      communication_preferences: { detail_level: 'balanced' }
    }
  },
  conversation: {
    id: 'test-conversation-456',
    messages: [],
    importance_score: 7.5
  }
};

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEO4J_URI = 'bolt://localhost:7687';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.WEAVIATE_URL = 'http://localhost:8080';

export {}; 