/**
 * @fileoverview
 * Shared TypeScript types for 2dots1line V9.7 monorepo.
 * Updated to align with V9.7 schema and remove obsolete types.
 */

// === AI TOOL TYPES ===
export type {
  // Core tool interfaces
  Tool,
  TToolInput,
  TToolOutput,
  IToolCapability,
  
  // Current V9.7 tool types
  TTextEmbeddingInputPayload,
  TTextEmbeddingResult,
  TTextEmbeddingToolInput,
  TTextEmbeddingToolOutput,
  TVectorSearchInputPayload,
  TVectorSearchResult,
  TVectorSearchResultItem,
  TVectorSearchToolInput,
  TVectorSearchToolOutput,
  LLMChatInputPayload,
  LLMChatResult,
  LLMChatToolInput,
  LLMChatToolOutput,
  
  // Deprecated tool types (kept for backward compatibility)
  TNERInputPayload,
  TNERResult,
  TNERToolInput,
  TNERToolOutput,
  TExtractedEntity,
  VisionCaptionInputPayload,
  VisionCaptionResult,
  VisionCaptionToolInput,
  VisionCaptionToolOutput,
  DocumentExtractInputPayload,
  DocumentExtractResult,
  DocumentExtractToolInput,
  DocumentExtractToolOutput
} from './ai/tool.types';

// === AI AGENT TYPES ===
export type {
  // Base agent interfaces
  IAgentInput,
  IAgentOutput,
  TAgentInput,
  TAgentOutput,
  
  // Current V9.7 DialogueAgent types
  IDialogueAgentInput,
  IDialogueAgentOutput,
  TDialogueAgentInputPayload,
  TDialogueAgentResult,
  TDialogueAgentInput,
  TDialogueAgentOutput,
  
  // Deprecated agent types (kept for backward compatibility)
  IIngestionAnalystInput,
  IIngestionAnalystOutput,
  TIngestionAnalystInput,
  TIngestionAnalystInputPayload,
  TIngestionAnalystResult,
  TIngestionContentItem
} from './ai/agent.types';

// === AI JOB TYPES ===
export type {
  EmbeddingJob,
  IngestionJob,
  InsightJob,
  NotificationJob,
  NewCardAvailablePayload,
  GraphProjectionUpdatedPayload,
  SSEMessage,
  NotificationJobPayload
} from './ai/job.types';

// === ENTITY TYPES ===
export type {
  // User and context types
  TUser,
  CoreIdentity,
  UserMemoryProfile,
  NextConversationContextPackage,
  TurnContextPackage,
  AugmentedMemoryContext,
  SummarizedConversation
} from './entities/user.types';

export type {
  // Memory types
  TMemoryUnit,
  TRawContent,
  ERawContentType,
  UserKnowledgeItem
} from './entities/memory.types';

export type {
  // Concept types
  TConcept
} from './entities/concept.types';

export type {
  // Media types
  TMedia
} from './entities/media.types';

export type {
  // Community types
  TCommunity,
  TConceptCommunityLink
} from './entities/community.types';

export type {
  // Conversation and message types
  TConversation,
  TConversationMessage,
  TInsight // Deprecated but kept for compatibility
} from './entities/interaction.types';

export type {
  // Card types (V9.7 new)
  TCard,
  CardStatus,
  CardType,
  DisplayCard,
  ImageCollection
} from './entities/card.types';

export type {
  // Growth event types (V9.7 new)
  TGrowthEvent,
  GrowthDimension,
  GrowthEventSource
} from './entities/growth-event.types';

export type {
  // Interaction log types (V9.7 new - replaces annotations)
  TInteractionLog,
  InteractionType,
  InteractionTargetType
} from './entities/interaction-log.types';

export type {
  // Derived artifact types (V9.7 new)
  TDerivedArtifact,
  DerivedArtifactType
} from './entities/derived-artifact.types';

export type {
  // Cosmos node types (V11.0 new - 3D visualization)
  Vector3D,
  ScreenPosition,
  NodeConnection,
  NodeAppearance,
  CosmosNode,
  NodeCluster,
  CosmosScene,
  NodeInteractionEvent,
  CosmosNavigationState,
  CosmosSearchResult,
  LayoutConfig
} from './entities/CosmosNode';

export type {
  // Cosmos query types (V11.0 new - interactive spatial queries)
  CosmosQuery,
  CosmosQueryResponse,
  CosmosQueryNode,
  CosmosEdge,
  SpatialQueryType,
  SpatialQueryJob,
  ViewportBounds,
  CameraState
} from './cosmos-query.types';

export type {
  // Relationship types (V11.0 new - standardized relationship properties)
  RelationshipProps
} from './entities/relationship.types';

export interface UserGraphProjection {
  version: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
  nodes: {
    id: string;
    type: 'Concept' | 'MemoryUnit' | 'DerivedArtifact';
    label: string;
    position: [number, number, number];
    community_id: string;
    metadata?: Record<string, unknown>;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type: string;
    weight?: number;
    metadata?: Record<string, unknown>;
  }[];
  communities: {
    id: string;
    label: string;
    description: string;
    color: string;
    centroid: [number, number, number];
    radius: number;
    member_node_ids: string[];
  }[];
  metadata: {
    dimension_reduction_algorithm: string;
    vector_dimensionality: string;
    semantic_similarity_threshold: number;
    communities: {
      id: string;
      label: string;
      description: string;
      color: string;
    }[];
  };
}

// Deprecated entity types (kept for backward compatibility)
// Note: TAnnotation and TChunk have been deprecated and removed

// === API TYPES ===
export type {
  TApiResponse,
  TApiResponseSuccess,
  TApiResponseError,
  TPaginationInput,
  TSortInput
} from './api/common.types';

export type {
  TSendMessageRequest,
  TSendMessageResponse,
  TGetConversationHistoryRequest,
  TGetConversationHistoryResponse,
  TListConversationsRequest,
  TListConversationsResponse
} from './api/chat.api.types';

export type {
  TListMemoryUnitsRequest,
  TListMemoryUnitsResponse,
  TListConceptsRequest,
  TListConceptsResponse,
  TGetRelatedConceptsRequest,
  TGetRelatedConceptsResponse,
  TListInsightsRequest,
  TListInsightsResponse
} from './api/memory.api.types';

export type {
  TLoginRequest,
  TLoginResponse,
  TRegisterRequest,
  TRegisterResponse,
  TUpdateUserPreferencesRequest
} from './api/user.api.types';

// === STATE TYPES ===
export * from './state';

// === ERROR TYPES ===
export * from './errors';

// === LEGACY COMPATIBILITY ===
// Basic response types for backward compatibility
export interface TErrorResponse {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

export interface TSuccessResponse<TData = Record<string, unknown>> {
  data: TData;
  message?: string;
  request_id?: string;
  metadata?: Record<string, unknown>;
}

// === TOOL REGISTRY TYPES (to break circular dependency) ===
// Import the base tool types first
import type { TToolInput, TToolOutput } from './ai/tool.types';

/**
 * Represents the manifest for a tool that can be registered.
 * Includes metadata for discovery and execution.
 */
export interface IToolManifest<TInput = Record<string, unknown>, TOutput = Record<string, unknown>> {
  /** Unique name of the tool (e.g., 'text-embedding-google', 'ner-spacy-en') */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** Version of the tool (e.g., '1.0.2') */
  version: string;
  /** Regions where this specific tool implementation is available (e.g., ['us', 'cn']) */
  availableRegions: ('us' | 'cn')[];
  /** Functional categories the tool belongs to (e.g., ['text_processing', 'embedding']) */
  categories: string[];
  /** General capabilities provided (e.g., 'text_embedding', 'ner', 'vector_search') */
  capabilities: string[];
  /**
   * Input schema validation function for TToolInput<TInput>.
   */
  validateInput: (input: TToolInput<TInput>) => {
    valid: boolean;
    errors?: string[];
  };
  /**
   * Output schema validation function for TToolOutput<TOutput>.
   */
  validateOutput: (output: TToolOutput<TOutput>) => {
    valid: boolean;
    errors?: string[];
  };
  /** Performance characteristics */
  performance?: {
    avgLatencyMs?: number;
    isAsync?: boolean;
    isIdempotent?: boolean;
  };
  /** Cost characteristics (e.g., per call, per token) */
  cost?: {
    currency: string;
    perCall?: number;
    perUnit?: {
      unit: string;
      amount: number;
    };
  };
  /** Any known limitations or dependencies */
  limitations?: string[];
}

/**
 * Interface for an executable tool.
 * Tools must implement this to be used by the registry.
 */
export interface IExecutableTool<TInput = Record<string, unknown>, TOutput = Record<string, unknown>> {
  manifest: IToolManifest<TInput, TOutput>;
  /** 
   * Executes the tool with the given input. 
   * Must handle its own errors and return a TToolOutput.
   */
  execute: (input: TToolInput<TInput>) => Promise<TToolOutput<TOutput>>;
}

/**
 * Search criteria for finding tools in the registry.
 */
export interface IToolSearchCriteria {
  /** Exact tool name to match */
  name?: string;
  /** Region where tool should be available */
  region?: 'us' | 'cn';
  /** Required capability (can be string or array) */
  capability?: string | string[];
  /** Required category (can be string or array) */
  category?: string | string[];
  /** Minimum version required */
  minVersion?: string;
}

/**
 * Tool execution error for registry operations.
 */
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
} 