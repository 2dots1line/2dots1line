/**
 * Main entry point for the @2dots1line/tool-registry package.
 */

export { ToolRegistry } from './ToolRegistry';
export type {
  IExecutableTool,
  IToolManifest,
  IToolSearchCriteria,
} from './types';
export { ToolExecutionError } from './types';

// Placeholder for future tool exports, e.g.:
// export * from './tools/text-embedding.tool'; 