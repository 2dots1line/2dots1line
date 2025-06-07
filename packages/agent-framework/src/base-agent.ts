import { DatabaseService } from '@2dots1line/database';
import { TAgentInput, TAgentOutput, TAgentContext, TToolInput, TToolOutput, Tool } from '@2dots1line/shared-types';
import { ToolRegistry } from '@2dots1line/tool-registry';

export abstract class BaseAgent<TInput extends TAgentInput = TAgentInput, TOutput extends TAgentOutput = TAgentOutput> {
  public readonly name: string;
  protected toolRegistry: ToolRegistry;
  protected databaseService: DatabaseService;
  private availableTools: Map<string, Tool<any, any>> = new Map();

  constructor(name: string, toolRegistry: ToolRegistry, databaseService: DatabaseService) {
    this.name = name;
    this.toolRegistry = toolRegistry;
    this.databaseService = databaseService;
    console.log(`Agent [${this.name}] initialized.`);
  }

  /**
   * Registers a tool for this agent to use.
   * This allows agents to have a curated list of tools from the main registry.
   */
  public registerTool(tool: Tool<any, any>): void {
    if (this.availableTools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered for agent "${this.name}". Overwriting.`);
    }
    this.availableTools.set(tool.name, tool);
    console.log(`Agent [${this.name}] registered tool: ${tool.name}`);
  }

  /**
   * Executes a registered tool by its name.
   */
  protected async executeTool<TInput extends TToolInput<any>, TOutput extends TToolOutput<any>>(
    toolName: string,
    input: TInput
  ): Promise<TOutput> {
    const tool = this.availableTools.get(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not registered or available for agent "${this.name}".`);
    }
    console.log(`Agent [${this.name}] executing tool: ${toolName} with input:`, input);
    try {
      // Note: context is not passed to toolRegistry.executeTool as it only accepts toolName and input
      // Context handling would need to be implemented within the tool itself if needed
      const result = await this.toolRegistry.executeTool(toolName, input);
      return result as TOutput;
    } catch (error) {
      console.error(`Agent [${this.name}] error executing tool "${toolName}":`, error);
      throw error; // Rethrow or handle as per agent's error strategy
    }
  }

  /**
   * Abstract method to be implemented by concrete agent classes.
   * This is the main entry point for an agent's processing logic.
   */
  public abstract process(input: TInput, context?: TAgentContext): Promise<TOutput>;

  // Helper method to log agent activity
  protected log(message: string, data?: any): void {
    console.log(`[${this.name} Agent]: ${message}`, data || '');
  }
} 