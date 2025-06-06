import { ToolRegistry } from '../registry';
import { StubTextEmbeddingTool, StubVectorSearchTool, StubDbOperationTool } from '../tools';
import { ToolExecutionError } from '../types';
import type { TToolInput, TTextEmbeddingToolInput, TVectorSearchToolInput } from '@2dots1line/shared-types/ai';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    registry.register(StubTextEmbeddingTool);
    registry.register(StubVectorSearchTool);
    registry.register(StubDbOperationTool);
  });

  it('should register tools', () => {
    expect(registry.listAllTools().length).toBe(3);
    expect(registry.getManifest('stub-text-embedding')).toBeDefined();
  });

  it('should find tools by capability', () => {
    const embeddingTools = registry.findTools({ capability: 'text_embedding' });
    expect(embeddingTools.length).toBe(1);
    expect(embeddingTools[0].name).toBe('stub-text-embedding');
  });

  it('should find tools by region', () => {
    const usTools = registry.findTools({ region: 'us' });
    expect(usTools.length).toBe(3);
    const cnTools = registry.findTools({ region: 'cn' });
    expect(cnTools.length).toBe(3);
  });

  it('should find tools by name', () => {
    const searchTools = registry.findTools({ name: 'stub-vector-search' });
    expect(searchTools.length).toBe(1);
    expect(searchTools[0].name).toBe('stub-vector-search');
  });

  it('should find tools by version', () => {
    const v010Tools = registry.findTools({ minVersion: '0.1.0' });
    expect(v010Tools.length).toBe(3);
    const v1Tools = registry.findTools({ minVersion: '1.0.0' });
    expect(v1Tools.length).toBe(0);
  });

  it('should execute a registered tool successfully', async () => {
    const input: TToolInput<TTextEmbeddingToolInput> = {
      payload: {
        text: 'Test embedding',
        model_id: 'test-model',
      },
    };
    const output = await registry.executeTool('stub-text-embedding', input);
    expect(output.result.vector).toBeDefined();
    expect(output.result.embedding_metadata.model_id).toBe('test-model');
    expect(output.metadata?.warnings).toContain('Using stub implementation');
  });

  it('should throw ToolExecutionError if tool is not found', async () => {
    const input: TToolInput<any> = { payload: {} };
    await expect(registry.executeTool('non-existent-tool', input))
      .rejects.toThrow(ToolExecutionError);
    await expect(registry.executeTool('non-existent-tool', input))
      .rejects.toThrow('Tool "non-existent-tool" not found in registry.');
  });

  it('should throw ToolExecutionError on invalid input', async () => {
    const invalidInput: TToolInput<TVectorSearchToolInput> = {
      payload: { vector: [1, 2, 3] } as any, // Missing 'k'
    };
    await expect(registry.executeTool('stub-vector-search', invalidInput))
      .rejects.toThrow(ToolExecutionError);
    await expect(registry.executeTool('stub-vector-search', invalidInput))
      .rejects.toThrow(/Invalid input for tool "stub-vector-search": Missing vector or k in payload/);
  });

  // Add more tests for output validation, different criteria combinations etc.
}); 