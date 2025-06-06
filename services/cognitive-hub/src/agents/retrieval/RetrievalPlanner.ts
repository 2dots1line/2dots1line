/**
 * Retrieval Planner
 * Orchestrates hybrid retrieval across PostgreSQL, Neo4j, and Weaviate
 */

import { BaseAgent } from '@2dots1line/agent-framework';
import { DatabaseService } from '@2dots1line/database';
import { ToolRegistry } from '@2dots1line/tool-registry';
import { 
  TAgentInput, 
  TAgentOutput, 
  TAgentContext
} from '@2dots1line/shared-types';

// Define RetrievalPlanner specific types
export interface TRetrievalPlannerInputPayload {
  /** The search query or text to find relevant content for */
  query: string;
  /** Maximum number of results to return */
  top_k?: number;
  /** Filters to apply during retrieval */
  filters?: {
    /** Filter by content type */
    content_types?: string[];
    /** Filter by importance score threshold */
    min_importance?: number;
    /** Filter by date range */
    date_range?: {
      start?: string;
      end?: string;
    };
    /** Filter by specific concept types */
    concept_types?: string[];
  };
  /** Context about what the retrieval is for */
  retrieval_context?: 'conversation' | 'insight_generation' | 'card_discovery' | 'general';
}

export interface TRetrievalPlannerResult {
  /** Retrieved memory units */
  memory_units: Array<{
    muid: string;
    title: string;
    content_preview: string;
    importance_score: number;
    similarity_score: number;
    created_at: string;
  }>;
  /** Retrieved concepts */
  concepts: Array<{
    concept_id: string;
    name: string;
    type: string;
    description: string;
    similarity_score: number;
  }>;
  /** Retrieved chunks */
  chunks: Array<{
    cid: string;
    text_content: string;
    muid: string;
    similarity_score: number;
  }>;
  /** Formatted context block ready for LLM use */
  formatted_context: string;
  /** Total number of items retrieved across all sources */
  total_retrieved: number;
  /** Sources used in this retrieval */
  sources_used: Array<'vector' | 'graph' | 'relational'>;
}

export type TRetrievalPlannerInput = TAgentInput<TRetrievalPlannerInputPayload>;
export type TRetrievalPlannerOutput = TAgentOutput<TRetrievalPlannerResult>;

export class RetrievalPlanner extends BaseAgent<
  TRetrievalPlannerInput,
  TRetrievalPlannerOutput
> {
  constructor(databaseService: DatabaseService, toolRegistry: ToolRegistry) {
    super('RetrievalPlanner', toolRegistry, databaseService);
    this.log('RetrievalPlanner initialized');
  }

  /**
   * Placeholder process method for RetrievalPlanner
   * Orchestrates hybrid retrieval across multiple databases
   */
  public async process(
    input: TRetrievalPlannerInput, 
    context?: TAgentContext
  ): Promise<TRetrievalPlannerOutput> {
    this.log('Processing retrieval request', { 
      userId: input.user_id,
      query: input.payload.query?.substring(0, 50) + '...',
      topK: input.payload.top_k,
      context: input.payload.retrieval_context
    });

    try {
      const result: TRetrievalPlannerResult = {
        memory_units: [
          {
            muid: 'stub-memory-1',
            title: 'Example Memory Unit',
            content_preview: `Stub memory related to query: "${input.payload.query}"`,
            importance_score: 0.75,
            similarity_score: 0.82,
            created_at: new Date().toISOString()
          }
        ],
        concepts: [
          {
            concept_id: 'stub-concept-1',
            name: 'Example Concept',
            type: 'general',
            description: `Stub concept extracted from query analysis: "${input.payload.query}"`,
            similarity_score: 0.78
          }
        ],
        chunks: [
          {
            cid: 'stub-chunk-1',
            text_content: `This is a stub chunk that would be semantically similar to: "${input.payload.query}"`,
            muid: 'stub-memory-1',
            similarity_score: 0.85
          }
        ],
        formatted_context: `### Relevant Context\n\nBased on your query "${input.payload.query}", here are some relevant memories and concepts:\n\n**Memory:** Example Memory Unit\n**Concept:** Example Concept\n**Details:** This is placeholder context that would be formatted for LLM consumption.`,
        total_retrieved: 3,
        sources_used: ['vector', 'graph', 'relational']
      };

      return {
        status: 'success',
        result,
        request_id: input.request_id,
        metadata: {
          processing_time_ms: 120,
          tool_calls: [
            { tool_name: 'vector.similar', duration_ms: 45, success: true },
            { tool_name: 'graph.query', duration_ms: 35, success: true },
            { tool_name: 'embed.text', duration_ms: 40, success: true }
          ],
          processed_in_region: input.region
        }
      };
    } catch (error) {
      this.log('Error in RetrievalPlanner process', error);
      return {
        status: 'error',
        error: {
          code: 'RETRIEVAL_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error in RetrievalPlanner'
        },
        request_id: input.request_id,
        metadata: {
          processing_time_ms: 10,
          processed_in_region: input.region
        }
      };
    }
  }
} 