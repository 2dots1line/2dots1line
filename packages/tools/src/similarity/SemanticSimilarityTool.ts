import { WeaviateClient } from 'weaviate-ts-client';
import { ConfigService } from '@2dots1line/config-service';
import { TextEmbeddingTool } from '../ai/TextEmbeddingTool';

export interface SemanticSimilarityInput {
  candidateNames: string[];
  userId: string;
  entityTypes: ('concept' | 'memory_unit')[];
  maxResults?: number;
}

export interface SemanticSimilarityResult {
  candidateName: string;
  bestMatch: {
    entityId: string;
    entityName: string;
    entityType: 'concept' | 'memory_unit';
    similarityScore: number;
  } | null;
}

export class SemanticSimilarityTool {
  private weaviateClient: WeaviateClient;
  private configService: ConfigService;
  private embeddingTool: typeof TextEmbeddingTool;

  constructor(weaviateClient: WeaviateClient, configService: ConfigService, embeddingTool: typeof TextEmbeddingTool) {
    this.weaviateClient = weaviateClient;
    this.configService = configService;
    this.embeddingTool = embeddingTool;
  }

  async execute(input: SemanticSimilarityInput): Promise<SemanticSimilarityResult[]> {
    const results: SemanticSimilarityResult[] = [];
    
    for (const candidateName of input.candidateNames) {
      const bestMatch = await this.findBestSemanticMatch(
        candidateName,
        input.userId,
        input.entityTypes,
        input.maxResults || 1
      );
      
      results.push({
        candidateName,
        bestMatch
      });
    }
    
    return results;
  }

  private async findBestSemanticMatch(
    candidateName: string,
    userId: string,
    entityTypes: ('concept' | 'memory_unit')[],
    maxResults: number
  ): Promise<SemanticSimilarityResult['bestMatch']> {
    try {
      console.log(`[SemanticSimilarityTool] Searching for MOST SIMILAR entity to "${candidateName}" (target types: [${entityTypes.join(', ')}])`);
      
      // Generate embedding for the candidate name (same as HRT approach)
      const embeddingResult = await this.embeddingTool.execute({
        payload: {
          text_to_embed: candidateName
        }
      });
      
      if (!embeddingResult.result?.vector) {
        console.warn(`[SemanticSimilarityTool] Failed to generate embedding for "${candidateName}"`);
        return null;
      }
      
      const searchVector = embeddingResult.result.vector;
      console.log(`[SemanticSimilarityTool] Generated ${searchVector.length}-dimensional vector for "${candidateName}"`);
      
      // Use nearVector search with UserKnowledgeItem class (EXACT same as HRT)
      const result = await this.weaviateClient
        .graphql
        .get()
        .withClassName('UserKnowledgeItem')
        .withFields('externalId sourceEntityType title _additional { distance }')
        .withWhere({
          operator: 'Equal',
          path: ['userId'],
          valueString: userId
        })
        .withNearVector({ vector: searchVector })
        .withLimit(3) // Same as HRT
        .do();
      
      const entities = result?.data?.Get?.UserKnowledgeItem || [];
      
      if (entities.length === 0) {
        console.log(`[SemanticSimilarityTool] No similar entities found for "${candidateName}"`);
        return null;
      }

      // Find the MOST SIMILAR entity (different from HRT - we want the single best match)
      let bestEntity = null;
      let bestSimilarity = -1; // Start with -1 to ensure we find something
      
      for (const item of entities) {
        // Validate that we have valid data before processing (same as HRT)
        if (item.externalId && item.sourceEntityType) {
          const distance = item._additional?.distance || 1.0;
          const similarity = 1.0 - distance;
          
          // Check if this entity type matches our target types (case-insensitive)
          const isTargetType = entityTypes.some(targetType => {
            if (targetType === 'concept') return item.sourceEntityType === 'Concept';
            if (targetType === 'memory_unit') return item.sourceEntityType === 'MemoryUnit';
            return false;
          });
          
          // Find the MOST similar entity of the target type (no threshold - we want the best match)
          if (isTargetType && similarity > bestSimilarity) {
            bestEntity = item;
            bestSimilarity = similarity;
          }
        } else {
          console.warn(`[SemanticSimilarityTool] Skipping item with null externalId or sourceEntityType:`, item);
        }
      }
      
      if (!bestEntity) {
        console.error(`[SemanticSimilarityTool] ERROR: No entities of target types [${entityTypes.join(', ')}] found in database for user ${userId}. This should not happen if database is not empty.`);
        return null;
      }
      
      const entityName = bestEntity.title || bestEntity.externalId;
      console.log(`[SemanticSimilarityTool] MOST SIMILAR entity found for "${candidateName}": "${entityName}" (id: ${bestEntity.externalId}, type: ${bestEntity.sourceEntityType}, similarity: ${bestSimilarity.toFixed(3)})`);
      
      return {
        entityId: bestEntity.externalId,
        entityName: bestEntity.title || bestEntity.externalId, // Use title if available, fallback to externalId
        entityType: (bestEntity.sourceEntityType === 'Concept' ? 'concept' : 'memory_unit') as 'concept' | 'memory_unit',
        similarityScore: bestSimilarity
      };
      
    } catch (error) {
      console.error(`[SemanticSimilarityTool] Error finding semantic match for "${candidateName}":`, error);
      return null;
    }
  }
}