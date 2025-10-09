/**
 * Embedding Controller
 * Provides API endpoints for the shared embedding service
 */

import { Request, Response } from 'express';
import { getSharedEmbeddingService } from '@2dots1line/tools';
import { DatabaseService } from '@2dots1line/database';

export class EmbeddingController {
  private sharedEmbeddingService: any;

  constructor(databaseService: DatabaseService) {
    this.sharedEmbeddingService = getSharedEmbeddingService(databaseService);
  }

  /**
   * Generate or retrieve embedding for a text phrase
   * POST /api/v1/embedding/generate
   */
  async generateEmbedding(req: Request, res: Response): Promise<void> {
    try {
      const { text, userId = 'system' } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Text is required and must be a string'
          }
        });
        return;
      }

      console.log(`🔍 EmbeddingController: Generating embedding for text (${text.length} chars)`);
      
      const vector = await this.sharedEmbeddingService.getEmbedding(text, userId);
      
      res.json({
        success: true,
        data: {
          vector,
          text,
          userId,
          dimensions: vector.length
        }
      });

    } catch (error) {
      console.error('EmbeddingController: Generate embedding failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'EMBEDDING_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Embedding generation failed'
        }
      });
    }
  }

  /**
   * Generate embeddings for multiple text phrases
   * POST /api/v1/embedding/batch
   */
  async generateBatchEmbeddings(req: Request, res: Response): Promise<void> {
    try {
      const { texts, userId = 'system' } = req.body;

      if (!Array.isArray(texts) || texts.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Texts must be a non-empty array'
          }
        });
        return;
      }

      console.log(`🔍 EmbeddingController: Generating batch embeddings for ${texts.length} texts`);
      
      const embeddings = await this.sharedEmbeddingService.getEmbeddings(texts, userId);
      
      // Convert Map to object for JSON response
      const embeddingsObject: Record<string, number[]> = {};
      embeddings.forEach((vector: number[], text: string) => {
        embeddingsObject[text] = vector;
      });
      
      res.json({
        success: true,
        data: {
          embeddings: embeddingsObject,
          userId,
          count: embeddings.size
        }
      });

    } catch (error) {
      console.error('EmbeddingController: Batch embedding generation failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_EMBEDDING_ERROR',
          message: error instanceof Error ? error.message : 'Batch embedding generation failed'
        }
      });
    }
  }

  /**
   * Clear embedding cache
   * DELETE /api/v1/embedding/cache
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const { phrase, userId = 'system' } = req.query;

      console.log(`🔍 EmbeddingController: Clearing cache for user "${userId}"${phrase ? ` and phrase "${phrase}"` : ''}`);
      
      await this.sharedEmbeddingService.clearCache(
        phrase as string | undefined, 
        userId as string
      );
      
      res.json({
        success: true,
        data: {
          message: phrase 
            ? `Cache cleared for phrase "${phrase}"` 
            : `All cache cleared for user "${userId}"`,
          userId,
          phrase: phrase || null
        }
      });

    } catch (error) {
      console.error('EmbeddingController: Clear cache failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CACHE_CLEAR_ERROR',
          message: error instanceof Error ? error.message : 'Cache clear failed'
        }
      });
    }
  }
}
