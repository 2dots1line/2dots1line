/**
 * Shared Embedding Service
 * Provides centralized embedding generation and caching for reuse across HRT and entityLookup
 */

import { TextEmbeddingTool } from './TextEmbeddingTool';
import { DatabaseService } from '@2dots1line/database';
import type { IExecutableTool, TTextEmbeddingInputPayload, TTextEmbeddingResult } from '@2dots1line/shared-types';

export interface EmbeddingCacheEntry {
  vector: number[];
  timestamp: number;
  model_used: string;
}

export class SharedEmbeddingService {
  private embeddingTool: IExecutableTool<TTextEmbeddingInputPayload, TTextEmbeddingResult>;
  private db: DatabaseService;
  private cacheTtlSeconds: number = 300; // 5 minutes
  private initialized = false;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    this.embeddingTool = TextEmbeddingTool; // Use the exported instance directly
  }

  /**
   * Get or generate embedding for a text phrase
   * Checks cache first, generates if not found or expired
   */
  async getEmbedding(phrase: string, userId: string = 'system'): Promise<number[]> {
    try {
      // Check cache first
      const cacheKey = this.getEmbeddingCacheKey(phrase, userId);
      const cached = await this.db.kvGet<EmbeddingCacheEntry>(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        console.log(`🔍 SharedEmbeddingService: Cache hit for phrase "${phrase}"`);
        return cached.vector;
      }

      console.log(`🔍 SharedEmbeddingService: Generating new embedding for phrase "${phrase}"`);
      
      // Generate new embedding
      const result = await this.embeddingTool.execute({
        payload: {
          text_to_embed: phrase
        },
        request_id: `shared-embedding-${Date.now()}`
      });

      if (result.status !== 'success' || !result.result?.vector) {
        throw new Error(`Embedding generation failed: ${result.error?.message || 'Unknown error'}`);
      }

      // Cache the result
      const cacheEntry: EmbeddingCacheEntry = {
        vector: result.result.vector,
        timestamp: Date.now(),
        model_used: result.result.embedding_metadata?.model_id_used || 'unknown'
      };

      await this.db.kvSet(cacheKey, cacheEntry, this.cacheTtlSeconds);
      console.log(`🔍 SharedEmbeddingService: Cached embedding for phrase "${phrase}" (${result.result.vector.length} dimensions)`);

      return result.result.vector;

    } catch (error) {
      console.error('SharedEmbeddingService: Failed to get embedding:', error);
      throw error;
    }
  }

  /**
   * Get embeddings for multiple phrases in parallel
   */
  async getEmbeddings(phrases: string[], userId: string = 'system'): Promise<Map<string, number[]>> {
    const embeddings = new Map<string, number[]>();
    
    // Process in parallel for better performance
    const promises = phrases.map(async (phrase) => {
      try {
        const vector = await this.getEmbedding(phrase, userId);
        embeddings.set(phrase, vector);
      } catch (error) {
        console.error(`Failed to get embedding for phrase "${phrase}":`, error);
        // Continue with other phrases even if one fails
      }
    });

    await Promise.all(promises);
    return embeddings;
  }

  /**
   * Generate cache key for a phrase
   */
  private getEmbeddingCacheKey(phrase: string, userId: string): string {
    // Normalize phrase for consistent caching
    const normalizedPhrase = phrase.toLowerCase().trim();
    return `shared_embedding:${userId}:${normalizedPhrase}`;
  }

  /**
   * Check if cached entry is still valid
   */
  private isCacheValid(entry: EmbeddingCacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < (this.cacheTtlSeconds * 1000);
  }

  /**
   * Clear cache for a specific phrase or all phrases for a user
   */
  async clearCache(phrase?: string, userId: string = 'system'): Promise<void> {
    if (phrase) {
      const cacheKey = this.getEmbeddingCacheKey(phrase, userId);
      await this.db.kvDel(cacheKey);
      console.log(`🔍 SharedEmbeddingService: Cleared cache for phrase "${phrase}"`);
    } else {
      // Clear all embeddings for user (this is more expensive)
      const pattern = `shared_embedding:${userId}:*`;
      await this.db.kvDel(pattern);
      console.log(`🔍 SharedEmbeddingService: Cleared all embeddings for user "${userId}"`);
    }
  }
}

// Export singleton instance
let sharedEmbeddingService: SharedEmbeddingService | null = null;

export const getSharedEmbeddingService = (databaseService: DatabaseService): SharedEmbeddingService => {
  if (!sharedEmbeddingService) {
    sharedEmbeddingService = new SharedEmbeddingService(databaseService);
  }
  return sharedEmbeddingService;
};
