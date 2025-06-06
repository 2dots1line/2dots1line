/**
 * Cognitive Hub Tools Registry
 * Exports all tools developed within the cognitive hub and provides registration helpers
 */

import type { ToolRegistry } from '@2dots1line/tool-registry';

// Import all tools that implement IExecutableTool
import { EnhancedNERTool } from './text-tools/ner-tool';

// Export individual tools
export { EnhancedNERTool };

// Export core implementations for direct use
export * from './text-tools';

/**
 * Register all cognitive hub tools with a ToolRegistry instance
 */
export function registerCognitiveHubTools(registry: ToolRegistry): void {
  // Register text processing tools
  registry.register(EnhancedNERTool);
  
  // Future tools can be registered here:
  // registry.register(SentimentAnalysisTool);
  // registry.register(TopicModelingTool);
  // registry.register(TextSummarizationTool);
  
  console.info('Registered all cognitive hub tools with registry');
}

/**
 * Get list of all cognitive hub tool names
 */
export function getCognitiveHubToolNames(): string[] {
  return [
    EnhancedNERTool.manifest.name,
    // Add future tool names here
  ];
} 