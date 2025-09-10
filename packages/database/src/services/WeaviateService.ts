import { DatabaseService } from '../DatabaseService';
import { WeaviateClient } from 'weaviate-ts-client';

// Local type definition to avoid complex import issues
export interface UserKnowledgeItem {
  id: string;
  externalId: string;
  userId: string;
  sourceEntityType: string;
  sourceEntityId: string;
  textContent: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  vector?: number[];
  metadata?: Record<string, any>;
}

export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number;
  includeVector?: boolean;
  hybridSearch?: {
    query: string;
    alpha?: number; // Balance between semantic and keyword search
  };
}

export interface WeaviateUpsertItem {
  id: string;
  externalId: string;
  userId: string;
  sourceEntityType: string;
  sourceEntityId: string;
  textContent: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  vector?: number[];
  status?: string;
}

export class WeaviateService {
  private client: WeaviateClient;
  private className = 'UserKnowledgeItem';

  constructor(databaseService: DatabaseService) {
    this.client = databaseService.weaviate;
  }

  /**
   * Upserts multiple knowledge items to Weaviate.
   */
  public async upsertKnowledgeItems(items: WeaviateUpsertItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    try {
      console.log(`[WeaviateService] Upserting ${items.length} knowledge items`);

      // Batch upsert operation
      let batcher = this.client.batch.objectsBatcher();
      
      for (const item of items) {
        const weaviateObject: any = {
          class: this.className,
          id: item.id,
          properties: {
            externalId: item.externalId,
            userId: item.userId,
            sourceEntityType: item.sourceEntityType,
            sourceEntityId: item.sourceEntityId,
            textContent: item.textContent,
            title: item.title,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            ...(item.status && { status: item.status })
          }
        };

        // Include vector in the object if provided
        if (item.vector) {
          weaviateObject.vector = item.vector;
        }

        batcher = batcher.withObject(weaviateObject);
      }

      const result = await batcher.do();
      
      if (result && result.length > 0) {
        const errors = result.filter((r: any) => r.result?.errors);
        if (errors.length > 0) {
          console.error('[WeaviateService] Some items failed to upsert:', errors);
        }
      }

      console.log(`[WeaviateService] Successfully upserted ${items.length} knowledge items`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to upsert ${items.length} items to Weaviate: ${errorMessage}`);
    }
  }

  /**
   * Performs semantic search on knowledge items.
   */
  public async semanticSearch(
    queryVector: number[],
    userId: string,
    options: SemanticSearchOptions = {}
  ): Promise<UserKnowledgeItem[]> {
    const { limit = 10, threshold = 0.7, includeVector = false } = options;

    try {
      console.log(`[WeaviateService] Performing semantic search for user ${userId}`);

      let query = this.client.graphql.get()
        .withClassName(this.className)
        .withFields('externalId userId sourceEntityType sourceEntityId textContent title createdAt updatedAt')
        .withNearVector({
          vector: queryVector,
          certainty: threshold
        })
        .withWhere({
          path: ['userId'],
          operator: 'Equal',
          valueString: userId
        })
        .withLimit(limit);

      if (includeVector) {
        query = query.withFields('externalId userId sourceEntityType sourceEntityId textContent title createdAt updatedAt _additional { vector }');
      }

      const result = await query.do();
      
      if (!result?.data?.Get?.[this.className]) {
        return [];
      }

      const items = result.data.Get[this.className];
      return items.map((item: any) => ({
        id: item.id || '',
        externalId: item.externalId,
        userId: item.userId,
        sourceEntityType: item.sourceEntityType,
        sourceEntityId: item.sourceEntityId,
        textContent: item.textContent,
        title: item.title,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        vector: item._additional?.vector
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Semantic search failed: ${errorMessage}`);
    }
  }

  /**
   * Performs hybrid search (semantic + keyword) on knowledge items.
   */
  public async hybridSearch(
    queryText: string,
    queryVector: number[],
    userId: string,
    options: SemanticSearchOptions = {}
  ): Promise<UserKnowledgeItem[]> {
    const { limit = 10, includeVector = false, hybridSearch } = options;
    const alpha = hybridSearch?.alpha || 0.7; // Default to favor semantic search

    try {
      console.log(`[WeaviateService] Performing hybrid search for user ${userId}`);

      let query = this.client.graphql.get()
        .withClassName(this.className)
        .withFields('externalId userId sourceEntityType sourceEntityId textContent title createdAt updatedAt')
        .withHybrid({
          query: queryText,
          alpha: alpha,
          vector: queryVector
        })
        .withWhere({
          path: ['userId'],
          operator: 'Equal',
          valueString: userId
        })
        .withLimit(limit);

      if (includeVector) {
        query = query.withFields('externalId userId sourceEntityType sourceEntityId textContent title createdAt updatedAt _additional { vector }');
      }

      const result = await query.do();
      
      if (!result?.data?.Get?.[this.className]) {
        return [];
      }

      const items = result.data.Get[this.className];
      return items.map((item: any) => ({
        id: item.id || '',
        externalId: item.externalId,
        userId: item.userId,
        sourceEntityType: item.sourceEntityType,
        sourceEntityId: item.sourceEntityId,
        textContent: item.textContent,
        title: item.title,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        vector: item._additional?.vector
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Hybrid search failed: ${errorMessage}`);
    }
  }

  /**
   * Gets knowledge items by their IDs.
   */
  public async getKnowledgeItemsByIds(ids: string[], includeVector: boolean = false): Promise<UserKnowledgeItem[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const items: UserKnowledgeItem[] = [];

      for (const id of ids) {
        try {
          let query = this.client.data.getterById().withClassName(this.className).withId(id);
          
          if (includeVector) {
            query = query.withVector();
          }

          const item = await query.do();
          
          if (item && item.properties) {
            items.push({
              id: item.id || id,
              externalId: String(item.properties.externalId || ''),
              userId: String(item.properties.userId || ''),
              sourceEntityType: String(item.properties.sourceEntityType || ''),
              sourceEntityId: String(item.properties.sourceEntityId || ''),
              textContent: String(item.properties.textContent || ''),
              title: String(item.properties.title || ''),
              createdAt: String(item.properties.createdAt || ''),
              updatedAt: String(item.properties.updatedAt || ''),
              vector: item.vector
            });
          }
        } catch (itemError) {
          console.warn(`[WeaviateService] Failed to retrieve item ${id}:`, itemError);
          // Continue with other items
        }
      }

      return items;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get knowledge items: ${errorMessage}`);
    }
  }

  /**
   * Deletes knowledge items by their IDs.
   */
  public async deleteKnowledgeItems(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    try {
      console.log(`[WeaviateService] Deleting ${ids.length} knowledge items`);

      for (const id of ids) {
        try {
          await this.client.data.deleter()
            .withClassName(this.className)
            .withId(id)
            .do();
        } catch (itemError) {
          console.warn(`[WeaviateService] Failed to delete item ${id}:`, itemError);
          // Continue with other items
        }
      }

      console.log(`[WeaviateService] Successfully deleted ${ids.length} knowledge items`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete items from Weaviate: ${errorMessage}`);
    }
  }

  /**
   * Gets all knowledge items for a specific user.
   */
  public async getUserKnowledgeItems(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<UserKnowledgeItem[]> {
    try {
      console.log(`[WeaviateService] Getting knowledge items for user ${userId}`);

      const result = await this.client.graphql.get()
        .withClassName(this.className)
        .withFields('externalId userId sourceEntityType sourceEntityId textContent title createdAt updatedAt')
        .withWhere({
          path: ['userId'],
          operator: 'Equal',
          valueString: userId
        })
        .withLimit(limit)
        .withOffset(offset)
        .do();

      if (!result?.data?.Get?.[this.className]) {
        return [];
      }

      const items = result.data.Get[this.className];
      return items.map((item: any) => ({
        id: item.id || '',
        externalId: item.externalId,
        userId: item.userId,
        sourceEntityType: item.sourceEntityType,
        sourceEntityId: item.sourceEntityId,
        textContent: item.textContent,
        title: item.title,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get user knowledge items: ${errorMessage}`);
    }
  }

  /**
   * Performs a simple text-based search using BM25.
   */
  public async keywordSearch(
    query: string,
    userId: string,
    limit: number = 10
  ): Promise<UserKnowledgeItem[]> {
    try {
      console.log(`[WeaviateService] Performing keyword search for user ${userId}`);

      const result = await this.client.graphql.get()
        .withClassName(this.className)
        .withFields('externalId userId sourceEntityType sourceEntityId textContent title createdAt updatedAt')
        .withBm25({
          query: query,
          properties: ['textContent', 'title']
        })
        .withWhere({
          path: ['userId'],
          operator: 'Equal',
          valueString: userId
        })
        .withLimit(limit)
        .do();

      if (!result?.data?.Get?.[this.className]) {
        return [];
      }

      const items = result.data.Get[this.className];
      return items.map((item: any) => ({
        id: item.id || '',
        externalId: item.externalId,
        userId: item.userId,
        sourceEntityType: item.sourceEntityType,
        sourceEntityId: item.sourceEntityId,
        textContent: item.textContent,
        title: item.title,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Keyword search failed: ${errorMessage}`);
    }
  }

  /**
   * Health check for Weaviate connection.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.misc.metaGetter().do();
      return !!result.version;
    } catch (error) {
      console.error('Weaviate health check failed:', error);
      return false;
    }
  }

  /**
   * Ensures the knowledge item class exists in Weaviate with proper schema.
   */
  public async ensureSchema(): Promise<void> {
    try {
      // Check if class exists
      const schema = await this.client.schema.getter().do();
      const existingClass = schema.classes?.find((cls: any) => cls.class === this.className);
      
      if (!existingClass) {
        // Create the class with proper schema
        const classDefinition = {
          class: this.className,
          description: 'User knowledge items for semantic search and retrieval',
          vectorizer: 'text2vec-openai', // or whatever vectorizer is configured
          properties: [
            {
              name: 'externalId',
              dataType: ['string'],
              description: 'External identifier for the knowledge item'
            },
            {
              name: 'userId',
              dataType: ['string'],
              description: 'ID of the user who owns this knowledge item'
            },
            {
              name: 'sourceEntityType',
              dataType: ['string'],
              description: 'Type of the source entity (memory, concept, etc.)'
            },
            {
              name: 'sourceEntityId',
              dataType: ['string'],
              description: 'ID of the source entity'
            },
            {
              name: 'textContent',
              dataType: ['text'],
              description: 'Main text content for semantic search'
            },
            {
              name: 'title',
              dataType: ['string'],
              description: 'Title or summary of the knowledge item'
            },
            {
              name: 'createdAt',
              dataType: ['string'],
              description: 'Creation timestamp'
            },
            {
              name: 'updatedAt',
              dataType: ['string'],
              description: 'Last update timestamp'
            }
          ]
        };

        await this.client.schema.classCreator().withClass(classDefinition).do();
        console.log(`Created Weaviate class: ${this.className}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Schema setup failed: ${errorMessage}`);
    }
  }

  /**
   * Update concept status in Weaviate for a single concept
   */
  public async updateConceptStatus(conceptId: string, status: string): Promise<void> {
    try {
      console.log(`[WeaviateService] Updating concept ${conceptId} status to: ${status}`);
      
      // Find the Weaviate object by sourceEntityId (concept ID)
      const existingObjects = await this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('_additional { id }')
        .withWhere({
          path: ['sourceEntityId'],
          operator: 'Equal',
          valueString: conceptId
        })
        .withLimit(1)
        .do();

      if (!existingObjects.data?.Get?.[this.className] || existingObjects.data.Get[this.className].length === 0) {
        console.warn(`[WeaviateService] No Weaviate object found for concept ${conceptId}`);
        return;
      }

      const weaviateObject = existingObjects.data.Get[this.className][0];
      
      // Update the status field
      await this.client.data
        .updater()
        .withClassName(this.className)
        .withId(weaviateObject._additional.id)
        .withProperties({
          status: status,
          updatedAt: new Date().toISOString()
        })
        .do();

      console.log(`[WeaviateService] Successfully updated concept ${conceptId} status to: ${status}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[WeaviateService] Failed to update concept ${conceptId} status:`, errorMessage);
      // Don't throw - allow the operation to continue even if Weaviate update fails
    }
  }

  /**
   * Batch update concept statuses in Weaviate
   */
  public async batchUpdateConceptStatus(updates: Array<{conceptId: string, status: string}>): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    try {
      console.log(`[WeaviateService] Batch updating ${updates.length} concept statuses`);
      
      let batcher = this.client.batch.objectsBatcher();
      let updateCount = 0;

      for (const update of updates) {
        // Find the Weaviate object by sourceEntityId
        const existingObjects = await this.client.graphql
          .get()
          .withClassName(this.className)
          .withFields('_additional { id }')
          .withWhere({
            path: ['sourceEntityId'],
            operator: 'Equal',
            valueString: update.conceptId
          })
          .withLimit(1)
          .do();

        if (existingObjects.data?.Get?.[this.className] && existingObjects.data.Get[this.className].length > 0) {
          const weaviateObject = existingObjects.data.Get[this.className][0];
          
          batcher = batcher.withObject({
            class: this.className,
            id: weaviateObject._additional.id,
            properties: {
              status: update.status,
              updatedAt: new Date().toISOString()
            }
          });
          updateCount++;
        } else {
          console.warn(`[WeaviateService] No Weaviate object found for concept ${update.conceptId}`);
        }
      }

      if (updateCount > 0) {
        await batcher.do();
        console.log(`[WeaviateService] Successfully batch updated ${updateCount} concept statuses`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[WeaviateService] Failed to batch update concept statuses:`, errorMessage);
      // Don't throw - allow the operation to continue even if Weaviate update fails
    }
  }
} 