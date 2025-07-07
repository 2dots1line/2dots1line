import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';
/**
 * Represents the manifest for a tool that can be registered.
 * Includes metadata for discovery and execution.
 */
export interface IToolManifest<TInput = any, TOutput = any> {
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
     * Input schema (e.g., a Zod schema or JSON schema) for validating TToolInput<TInput>.
     * For simplicity, we'll use a function type for validation initially.
     */
    validateInput: (input: TToolInput<TInput>) => {
        valid: boolean;
        errors?: string[];
    };
    /**
     * Output schema (e.g., a Zod schema or JSON schema) for validating TToolOutput<TOutput>.
     * For simplicity, we'll use a function type for validation initially.
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
export interface IExecutableTool<TInput = any, TOutput = any> {
    manifest: IToolManifest<TInput, TOutput>;
    /**
     * Executes the tool with the given input.
     * Must handle its own errors and return a TToolOutput.
     */
    execute: (input: TToolInput<TInput>) => Promise<TToolOutput<TOutput>>;
}
/**
 * Criteria for finding tools in the registry.
 */
export interface IToolSearchCriteria {
    /** Optional: Filter by region */
    region?: 'us' | 'cn';
    /** Optional: Filter by one or more capabilities (e.g., 'text_embedding') */
    capability?: string | string[];
    /** Optional: Filter by one or more categories */
    category?: string | string[];
    /** Optional: Filter by tool name (exact match) */
    name?: string;
    /** Optional: Filter by minimum version */
    minVersion?: string;
}
/**
 * Custom error class for tool execution failures.
 */
export declare class ToolExecutionError extends Error {
    cause?: Error;
    toolName?: string;
    input?: TToolInput<any>;
    constructor(message: string, options?: {
        cause?: Error;
        toolName?: string;
        input?: TToolInput<any>;
    });
}
//# sourceMappingURL=types.d.ts.map