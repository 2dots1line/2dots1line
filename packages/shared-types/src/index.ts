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
  InsightJob
} from './ai/job.types';

// === ENTITY TYPES ===
export type {
  // User and context types
  TUser,
  CoreIdentity,
  UserMemoryProfile,
  KnowledgeGraphSchema,
  NextConversationContextPackage,
  TurnContextPackage,
  AugmentedMemoryContext,
  SummarizedConversation
} from './entities/user.types';

export type {
  // Memory types
  TMemoryUnit,
  TRawContent,
  EMemorySourceType,
  EMemoryProcessingStatus,
  ERawContentType
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
  CardType
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

// Deprecated entity types (kept for backward compatibility)
export type {
  TAnnotation,
  AnnotationType
} from './entities/annotation.types';

export type {
  TChunk
} from './entities/chunk.types';

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
  TListInsightsResponse,
  TCreateAnnotationRequest,
  TCreateAnnotationResponse
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
  details?: Record<string, any>;
  request_id?: string;
}

export interface TSuccessResponse<TData = any> {
  data: TData;
  message?: string;
  request_id?: string;
  metadata?: Record<string, any>;
} 