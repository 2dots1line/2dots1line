/**
 * Cognitive Hub Tools Registry
 * Tools have been moved to their respective packages for better organization:
 * - LLM tools: @2dots1line/ai-clients
 * - Document tools: @2dots1line/document-tool  
 * - Text tools: @2dots1line/text-tool
 * - Vision tools: @2dots1line/vision-tool
 * 
 * This file now serves as a central registry helper for importing tools from packages
 */

import type { ToolRegistry } from '@2dots1line/tool-registry';

// Import tools from their respective packages
import { LLMChatTool } from '@2dots1line/ai-clients';
import { DocumentExtractTool } from '@2dots1line/document-tool';
import { EnhancedNERTool } from '@2dots1line/text-tool';
import { VisionCaptionTool } from '@2dots1line/vision-tool';

// Re-export tools for convenience
export { LLMChatTool, DocumentExtractTool, EnhancedNERTool, VisionCaptionTool };

/**
 * Register all cognitive hub tools with a ToolRegistry instance
 */
export function registerCognitiveHubTools(registry: ToolRegistry): void {
  // All tools now implement IExecutableTool interface, so we use register() directly
  registry.register(LLMChatTool);
  registry.register(DocumentExtractTool);
  registry.register(EnhancedNERTool);
  registry.register(VisionCaptionTool);
  
  console.info('Registered all cognitive hub tools with registry');
}

/**
 * Get list of all cognitive hub tool names
 */
export function getCognitiveHubToolNames(): string[] {
  return [
    'llm.chat',
    'document.extract',
    'ner.extract',
    'vision.caption'
  ];
} 