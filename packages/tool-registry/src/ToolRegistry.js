"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
const compare_versions_1 = require("compare-versions");
const types_1 = require("./types");
/**
 * Manages the registration, discovery, and execution of deterministic tools.
 */
class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }
    /**
     * Registers an executable tool with the registry.
     * @param tool - The tool instance implementing IExecutableTool.
     * @throws Error if a tool with the same name is already registered.
     */
    register(tool) {
        const { name } = tool.manifest;
        if (this.tools.has(name)) {
            console.warn(`Tool with name "${name}" already registered. Overwriting.`);
            // Alternatively, throw new Error(`Tool with name "${name}" already registered.`);
        }
        console.info(`Registering tool: ${name} (v${tool.manifest.version})`);
        this.tools.set(name, tool);
    }
    /**
     * Registers a simple tool (implementing the basic Tool interface) by wrapping it.
     * @param tool - The tool instance implementing the basic Tool interface.
     * @param options - Additional options for the tool manifest.
     */
    registerSimpleTool(tool, options) {
        const manifest = {
            name: tool.name,
            description: tool.description,
            version: tool.version,
            availableRegions: options?.availableRegions || ['us', 'cn'],
            categories: options?.categories || ['general'],
            capabilities: options?.capabilities || [tool.name],
            validateInput: () => ({ valid: true }), // Simple validation - could be enhanced
            validateOutput: () => ({ valid: true }), // Simple validation - could be enhanced
            performance: options?.performance,
            cost: options?.cost,
            limitations: options?.limitations
        };
        const executableTool = {
            manifest,
            execute: tool.execute.bind(tool)
        };
        this.register(executableTool);
    }
    /**
     * Simple tool execution method that works with tool names registered via registerSimpleTool.
     * @param toolName - The name of the tool to execute.
     * @param input - The input for the tool.
     * @returns Promise resolving to the tool output.
     */
    async executeSimpleTool(toolName, input) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new types_1.ToolExecutionError(`Tool "${toolName}" not found in registry.`);
        }
        try {
            return await tool.execute(input);
        }
        catch (error) {
            throw new types_1.ToolExecutionError(`Execution failed for tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error instanceof Error ? error : undefined, toolName, input });
        }
    }
    /**
     * Get a registered tool instance.
     * @param toolName - The name of the tool.
     * @returns The tool instance or undefined if not found.
     */
    getTool(toolName) {
        return this.tools.get(toolName);
    }
    /**
     * Finds tools matching the given criteria.
     * @param criteria - The search criteria (region, capability, category, name, minVersion).
     * @returns An array of tool manifests matching the criteria.
     */
    findTools(criteria) {
        const foundManifests = [];
        for (const tool of this.tools.values()) {
            const manifest = tool.manifest;
            let match = true;
            // Check name (exact match)
            if (criteria.name && manifest.name !== criteria.name) {
                match = false;
            }
            // Check region
            if (match && criteria.region && !manifest.availableRegions.includes(criteria.region)) {
                match = false;
            }
            // Check capability
            if (match && criteria.capability) {
                const requiredCapabilities = Array.isArray(criteria.capability) ? criteria.capability : [criteria.capability];
                if (!requiredCapabilities.every(cap => manifest.capabilities.includes(cap))) {
                    match = false;
                }
            }
            // Check category
            if (match && criteria.category) {
                const requiredCategories = Array.isArray(criteria.category) ? criteria.category : [criteria.category];
                if (!requiredCategories.every(cat => manifest.categories.includes(cat))) {
                    match = false;
                }
            }
            // Check minimum version
            if (match && criteria.minVersion) {
                try {
                    if ((0, compare_versions_1.compareVersions)(manifest.version, criteria.minVersion) < 0) {
                        match = false;
                    }
                }
                catch {
                    // Ignore version comparison errors and skip version check
                    console.warn(`Invalid version format for tool ${manifest.name} (${manifest.version}) or criteria (${criteria.minVersion}). Skipping version check.`);
                }
            }
            if (match) {
                foundManifests.push(manifest);
            }
        }
        return foundManifests;
    }
    /**
     * Executes a registered tool by name.
     * @param toolName - The unique name of the tool to execute.
     * @param input - The input payload for the tool, conforming to TToolInput.
     * @returns A promise resolving to the tool's output, conforming to TToolOutput.
     * @throws ToolExecutionError if the tool is not found, input validation fails, or execution fails.
     */
    async executeTool(toolName, input) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new types_1.ToolExecutionError(`Tool "${toolName}" not found in registry.`);
        }
        const startTime = Date.now();
        // Validate Input
        try {
            const validationResult = tool.manifest.validateInput(input);
            if (!validationResult.valid) {
                throw new types_1.ToolExecutionError(`Invalid input for tool "${toolName}": ${validationResult.errors?.join(', ') ?? 'Validation failed'}`, {
                    toolName,
                    input
                });
            }
        }
        catch (err) {
            throw new types_1.ToolExecutionError(`Input validation error for tool "${toolName}": ${err.message}`, {
                cause: err,
                toolName,
                input
            });
        }
        // Execute Tool
        let output;
        try {
            console.debug(`Executing tool: ${toolName}`);
            output = await tool.execute(input);
            console.debug(`Tool ${toolName} execution finished.`);
        }
        catch (err) {
            throw new types_1.ToolExecutionError(`Execution failed for tool "${toolName}": ${err.message}`, {
                cause: err,
                toolName,
                input
            });
        }
        // Validate Output
        try {
            const validationResult = tool.manifest.validateOutput(output);
            if (!validationResult.valid) {
                throw new types_1.ToolExecutionError(`Invalid output from tool "${toolName}": ${validationResult.errors?.join(', ') ?? 'Validation failed'}`, {
                    toolName,
                    input
                });
            }
        }
        catch (err) {
            throw new types_1.ToolExecutionError(`Output validation error for tool "${toolName}": ${err.message}`, {
                cause: err,
                toolName,
                input
            });
        }
        // Add processing time to metadata if not already present
        if (!output.metadata) {
            output.metadata = {};
        }
        if (output.metadata.processing_time_ms === undefined) {
            output.metadata.processing_time_ms = Date.now() - startTime;
        }
        return output;
    }
    /**
     * Retrieves the manifest for a specific tool.
     * @param toolName - The name of the tool.
     * @returns The tool's manifest, or undefined if not found.
     */
    getManifest(toolName) {
        return this.tools.get(toolName)?.manifest;
    }
    /**
     * Lists all registered tools' manifests.
     * @returns An array of all tool manifests.
     */
    listAllTools() {
        return Array.from(this.tools.values()).map(tool => tool.manifest);
    }
    /**
     * Build composite tools for specific agents based on their configuration.
     * @param agentType - The type of agent requiring the composite tool.
     * @returns The composite tool instance for the agent.
     */
    buildCompositeToolForAgent(agentType) {
        if (agentType === 'ingestionAnalyst') {
            // Import the required dependencies
            const { HolisticAnalysisTool } = require('@2dots1line/tools');
            const { LLMChatTool } = require('@2dots1line/ai-clients');
            const { ConfigService } = require('@2dots1line/config-service');
            // Create a ConfigService instance
            const configService = new ConfigService();
            // Return the properly constructed HolisticAnalysisTool
            return new HolisticAnalysisTool(LLMChatTool, configService);
        }
        throw new Error(`Unknown agent type: ${agentType}`);
    }
}
exports.ToolRegistry = ToolRegistry;
//# sourceMappingURL=ToolRegistry.js.map