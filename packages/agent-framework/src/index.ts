export * from './base-agent';

// Re-export types and services used by BaseAgent and expected by consumers
export type { TAgentInput, TAgentOutput, TAgentContext, Tool, TToolInput, TToolOutput } from '@2dots1line/shared-types';
export { ToolRegistry } from '@2dots1line/tool-registry';
export { DatabaseService } from '@2dots1line/database';

// Add other exports from the framework as they are created 