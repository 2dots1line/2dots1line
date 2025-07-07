import type { TToolInput, TToolOutput, Tool } from '@2dots1line/shared-types';
import type { IExecutableTool, IToolManifest, IToolSearchCriteria } from './types';
/**
 * Manages the registration, discovery, and execution of deterministic tools.
 */
export declare class ToolRegistry {
    private tools;
    /**
     * Registers an executable tool with the registry.
     * @param tool - The tool instance implementing IExecutableTool.
     * @throws Error if a tool with the same name is already registered.
     */
    register(tool: IExecutableTool<any, any>): void;
    /**
     * Registers a simple tool (implementing the basic Tool interface) by wrapping it.
     * @param tool - The tool instance implementing the basic Tool interface.
     * @param options - Additional options for the tool manifest.
     */
    registerSimpleTool<TInput = any, TOutput = any>(tool: Tool<TToolInput<TInput>, TToolOutput<TOutput>>, options?: {
        availableRegions?: ('us' | 'cn')[];
        categories?: string[];
        capabilities?: string[];
        performance?: {
            avgLatencyMs?: number;
            isAsync?: boolean;
            isIdempotent?: boolean;
        };
        cost?: {
            currency: string;
            perCall?: number;
            perUnit?: {
                unit: string;
                amount: number;
            };
        };
        limitations?: string[];
    }): void;
    /**
     * Simple tool execution method that works with tool names registered via registerSimpleTool.
     * @param toolName - The name of the tool to execute.
     * @param input - The input for the tool.
     * @returns Promise resolving to the tool output.
     */
    executeSimpleTool<TInput = any, TOutput = any>(toolName: string, input: TToolInput<TInput>): Promise<TToolOutput<TOutput>>;
    /**
     * Get a registered tool instance.
     * @param toolName - The name of the tool.
     * @returns The tool instance or undefined if not found.
     */
    getTool<T extends IExecutableTool<any, any>>(toolName: string): T | undefined;
    /**
     * Finds tools matching the given criteria.
     * @param criteria - The search criteria (region, capability, category, name, minVersion).
     * @returns An array of tool manifests matching the criteria.
     */
    findTools(criteria: IToolSearchCriteria): IToolManifest<any, any>[];
    /**
     * Executes a registered tool by name.
     * @param toolName - The unique name of the tool to execute.
     * @param input - The input payload for the tool, conforming to TToolInput.
     * @returns A promise resolving to the tool's output, conforming to TToolOutput.
     * @throws ToolExecutionError if the tool is not found, input validation fails, or execution fails.
     */
    executeTool<TInput = any, TOutput = any>(toolName: string, input: TToolInput<TInput>): Promise<TToolOutput<TOutput>>;
    /**
     * Retrieves the manifest for a specific tool.
     * @param toolName - The name of the tool.
     * @returns The tool's manifest, or undefined if not found.
     */
    getManifest(toolName: string): IToolManifest<any, any> | undefined;
    /**
     * Lists all registered tools' manifests.
     * @returns An array of all tool manifests.
     */
    listAllTools(): IToolManifest<any, any>[];
    /**
     * Build composite tools for specific agents based on their configuration.
     * @param agentType - The type of agent requiring the composite tool.
     * @returns The composite tool instance for the agent.
     */
    buildCompositeToolForAgent(agentType: string): any;
}
//# sourceMappingURL=ToolRegistry.d.ts.map