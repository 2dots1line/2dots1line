/**
 * @fileoverview
 * Shared TypeScript types for 2dots1line V7 monorepo.
 */
export type { Tool, TToolInput, TToolOutput, VisionCaptionInputPayload, VisionCaptionResult, TTextEmbeddingInputPayload, TTextEmbeddingResult, TTextEmbeddingToolInput, TTextEmbeddingToolOutput, TVectorSearchInputPayload, TVectorSearchResult, TVectorSearchToolInput, TVectorSearchToolOutput, TNERInputPayload, TNERResult, TNERToolInput, TNERToolOutput, TExtractedEntity, LLMChatInputPayload, LLMChatResult, LLMChatToolInput, LLMChatToolOutput, DocumentExtractInputPayload, DocumentExtractResult, DocumentExtractToolInput, DocumentExtractToolOutput } from './ai/tool.types';
export type { TAgentInput, TAgentOutput, TDialogueAgentInputPayload, TDialogueAgentResult, TDialogueAgentInput, TDialogueAgentOutput, TIngestionAnalystInput, TIngestionAnalystInputPayload, TIngestionAnalystResult, TIngestionContentItem } from './ai/agent.types';
export type { TAgentContext } from './ai/index';
export type { EmbeddingJob, IngestionJob, InsightJob } from './ai/job.types';
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
//# sourceMappingURL=index.d.ts.map