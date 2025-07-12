# 2D1L China vs. Non-China Model Ecosystem Configuration Plan

## Executive Summary

This document analyzes the current AI model usage across the 2D1L system and provides a comprehensive implementation plan for making the product easily configurable to toggle between China vs. non-China model ecosystems, addressing the challenge of the disintegrated model ecosystem between China and the U.S.

## 1. Current AI Model Usage Analysis

### 1.1 Core AI Tools and Their Model Dependencies

Based on comprehensive codebase analysis, the following AI models are currently being called:

#### **LLMChatTool** (`packages/tools/src/ai/LLMChatTool.ts`)
- **Current Models**: Google Gemini (gemini-1.5-flash, gemini-2.0-flash-exp, gemini-1.5-flash-8b)
- **Usage**: Primary conversational AI across all agents
- **Used By**: DialogueAgent, IngestionAnalyst (via HolisticAnalysisTool), InsightEngine (via StrategicSynthesisTool)
- **Configuration**: `ModelConfigService.getModelForUseCase('chat')`
- **API Key**: `GOOGLE_API_KEY`
- **Impact**: **CRITICAL** - Core system functionality depends on this

#### **TextEmbeddingTool** (`packages/tools/src/ai/TextEmbeddingTool.ts`)
- **Current Models**: Google Gemini (text-embedding-004)
- **Usage**: Text vectorization for semantic search and retrieval
- **Used By**: EmbeddingWorker, HybridRetrievalTool
- **Configuration**: `ModelConfigService.getModelForUseCase('embedding')`
- **API Key**: `GOOGLE_API_KEY`
- **Impact**: **CRITICAL** - Vector dimensions must match for semantic search

#### **VisionCaptionTool** (`packages/tools/src/ai/VisionCaptionTool.ts`)
- **Current Models**: Google Gemini Vision (gemini-2.0-flash-exp, gemini-1.5-flash)
- **Usage**: Image analysis and captioning
- **Used By**: DialogueAgent (multimodal input processing)
- **Configuration**: `ModelConfigService.getModelForUseCase('vision')`
- **API Key**: `GOOGLE_API_KEY`
- **Impact**: **MODERATE** - Affects multimodal capabilities

#### **AudioTranscribeTool** (`packages/tools/src/data/AudioTranscribeTool.ts`)
- **Current Models**: Google Speech-to-Text
- **Usage**: Audio transcription to text
- **Used By**: DialogueAgent (audio input processing)
- **Configuration**: Google Cloud credentials
- **API Key**: `GOOGLE_APPLICATION_CREDENTIALS`
- **Impact**: **MODERATE** - Affects audio input capabilities

#### **DocumentExtractTool** (`packages/tools/src/data/DocumentExtractTool.ts`)
- **Current Models**: Local libraries (pdf-parse, mammoth)
- **Usage**: Text extraction from documents
- **Used By**: DialogueAgent (document processing)
- **Configuration**: No external AI models
- **API Key**: None
- **Impact**: **LOW** - Uses local processing

### 1.2 Current Regional Support

- **US/Non-China**: Fully implemented with Google ecosystem
- **China**: Partially implemented DeepSeek client exists but incomplete
- **Configuration**: `packages/ai-clients/src/index.ts` has region-aware client selection
- **Missing**: Complete DeepSeek implementation, China-specific model configurations

## 2. Scope of Impact Analysis

### 2.1 High-Impact Areas

1. **Core AI Processing**: All conversational AI, knowledge extraction, and strategic analysis
2. **Vector Embeddings**: Semantic search, memory retrieval, knowledge graph operations
3. **Multimodal Processing**: Image and audio input handling
4. **Worker Processes**: Background processing for ingestion and insights
5. **API Endpoints**: All user-facing chat and file upload functionality

### 2.2 Critical Dependencies

- **5 Core AI Tools** requiring region-specific model selection
- **3 Main Workers** (DialogueAgent, IngestionAnalyst, InsightEngine) using AI tools
- **ModelConfigService** needs extension for region-aware configuration
- **Environment Variables** must support multiple API keys and regions
- **Configuration Files** need China-specific model definitions

## 3. Practical Implementation Challenges

### 3.1 **Embedding Dimension Compatibility**
**Challenge**: Different embedding models produce vectors with different dimensions
- Google text-embedding-004: 768 dimensions
- DeepSeek embeddings: Different dimension count (needs verification)
- Weaviate collections configured for specific dimensions

**Solution**: 
- Implement dimension mapping/transformation layer
- Create region-specific Weaviate collections
- Version embedding metadata for migration support

### 3.2 **LLM JSON Format Compatibility**
**Challenge**: Different models have varying JSON output reliability
- Google Gemini: Strong JSON structure following
- DeepSeek: JSON formatting reliability varies
- System prompts may need model-specific adaptations

**Solution**:
- Implement model-specific prompt templates
- Enhanced JSON parsing with multiple fallback strategies
- Model-specific output validation and retry logic

### 3.3 **System Prompting Differences**
**Challenge**: Models respond differently to system prompts
- Token limits vary between models
- Instruction following capabilities differ
- Context window sizes vary

**Solution**:
- Region-specific prompt templates in `config/prompt_templates.yaml`
- Dynamic prompt adaptation based on model capabilities
- Context window aware prompt truncation

### 3.4 **API Rate Limits and Quotas**
**Challenge**: Different providers have different rate limits
- Google API quotas and pricing
- DeepSeek API limitations
- Fallback strategies needed

**Solution**:
- Implement intelligent rate limiting
- Cross-provider fallback chains
- Queue-based processing for high-volume scenarios

### 3.5 **Model Capability Variations**
**Challenge**: Different models have different capabilities
- Vision processing availability
- Audio transcription quality
- Function calling support
- Multimodal capabilities

**Solution**:
- Capability-aware tool selection
- Graceful degradation strategies
- Feature flags for region-specific capabilities

## 4. Comprehensive Implementation Plan

### 4.1 Phase 1: Infrastructure Foundation (Week 1-2)

#### **Task 1.1: Complete DeepSeek Client Implementation**
```typescript
// packages/ai-clients/src/deepseek/index.ts
export class DeepSeekAIClient implements ILLMClient {
  async chatCompletion(request: TChatCompletionRequest): Promise<TChatCompletionResponse> {
    // Full DeepSeek API integration
    // JSON format handling
    // Error handling and retries
  }
  
  async generateEmbedding(request: TEmbeddingRequest): Promise<TEmbeddingResponse> {
    // DeepSeek embedding API integration
    // Dimension compatibility handling
  }
}
```

#### **Task 1.2: Region Detection and Configuration**
```typescript
// packages/shared-types/src/config/region.types.ts
export interface RegionConfig {
  region: 'us' | 'cn';
  aiProviders: {
    llm: 'google' | 'deepseek';
    embedding: 'google' | 'deepseek';
    vision: 'google' | 'deepseek';
    audio: 'google' | 'deepseek';
  };
  apiKeys: {
    [provider: string]: string;
  };
}

// services/config-service/src/RegionConfigService.ts
export class RegionConfigService {
  detectRegion(): 'us' | 'cn' {
    // Network-based detection
    // Environment variable override
    // GFW connectivity tests
  }
  
  getRegionConfig(region: 'us' | 'cn'): RegionConfig {
    // Load region-specific configuration
  }
}
```

#### **Task 1.3: Enhanced ModelConfigService**
```typescript
// services/config-service/src/ModelConfigService.ts
export class ModelConfigService {
  getModelForUseCase(useCase: string, region?: string): ModelConfig {
    const currentRegion = region || this.regionConfigService.detectRegion();
    return this.getRegionSpecificModel(useCase, currentRegion);
  }
  
  private getRegionSpecificModel(useCase: string, region: string): ModelConfig {
    // Region-aware model selection
    // Fallback chains within region
    // Cross-region fallbacks for emergencies
  }
}
```

### 4.2 Phase 2: Model Configuration System (Week 2-3)

#### **Task 2.1: China Model Registry**
```json
// config/china_models.json
{
  "models": {
    "chat": {
      "primary": "deepseek-chat",
      "fallback": ["deepseek-coder", "qwen-turbo"],
      "capabilities": ["text", "reasoning", "json_output"],
      "context_window": 32768,
      "json_reliability": "high"
    },
    "embedding": {
      "primary": "deepseek-embed",
      "fallback": [],
      "dimensions": 1536,
      "max_tokens": 8192
    },
    "vision": {
      "primary": "qwen-vl",
      "fallback": ["deepseek-vision"],
      "capabilities": ["image_analysis", "ocr", "captioning"]
    }
  }
}
```

#### **Task 2.2: Cross-Region Configuration Management**
```typescript
// packages/shared-types/src/config/model-ecosystem.types.ts
export interface ModelEcosystem {
  region: 'us' | 'cn';
  providers: {
    [capability: string]: {
      primary: ModelProvider;
      fallback: ModelProvider[];
      crossRegionFallback?: ModelProvider[];
    };
  };
}

export interface ModelProvider {
  name: string;
  models: ModelConfig[];
  apiConfig: APIConfig;
  capabilities: string[];
  limitations: string[];
}
```

### 4.3 Phase 3: Tool Layer Updates (Week 3-4)

#### **Task 3.1: Region-Aware Tool Architecture**
```typescript
// packages/tools/src/ai/RegionAwareLLMTool.ts
export class RegionAwareLLMTool {
  constructor(
    private regionConfigService: RegionConfigService,
    private modelConfigService: ModelConfigService
  ) {}
  
  async execute(input: LLMInput): Promise<LLMOutput> {
    const region = this.regionConfigService.detectRegion();
    const modelConfig = this.modelConfigService.getModelForUseCase('chat', region);
    
    // Region-specific client selection
    const client = this.getAIClient(region, modelConfig);
    
    // Region-specific prompt adaptation
    const adaptedPrompt = this.adaptPromptForRegion(input, region, modelConfig);
    
    // Execute with region-specific handling
    return await this.executeWithRegionHandling(client, adaptedPrompt, region);
  }
}
```

#### **Task 3.2: Embedding Dimension Compatibility**
```typescript
// packages/tools/src/ai/CompatibleEmbeddingTool.ts
export class CompatibleEmbeddingTool {
  async execute(input: EmbeddingInput): Promise<EmbeddingOutput> {
    const region = this.regionConfigService.detectRegion();
    const embedding = await this.generateEmbedding(input, region);
    
    // Dimension compatibility handling
    const compatibleVector = await this.ensureCompatibleDimensions(
      embedding.vector,
      embedding.dimensions,
      this.targetDimensions
    );
    
    return {
      vector: compatibleVector,
      metadata: {
        ...embedding.metadata,
        originalDimensions: embedding.dimensions,
        targetDimensions: this.targetDimensions,
        region
      }
    };
  }
}
```

### 4.4 Phase 4: Advanced Features (Week 4-5)

#### **Task 4.1: Intelligent Fallback System**
```typescript
// packages/tools/src/fallback/FallbackOrchestrator.ts
export class FallbackOrchestrator {
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallbackChain: FallbackStrategy[]
  ): Promise<T> {
    for (const strategy of fallbackChain) {
      try {
        return await this.executeWithStrategy(operation, strategy);
      } catch (error) {
        console.warn(`Strategy ${strategy.name} failed:`, error);
        // Continue to next strategy
      }
    }
    throw new Error('All fallback strategies exhausted');
  }
}
```

#### **Task 4.2: Admin Configuration Interface**
```typescript
// packages/admin-tools/src/ModelConfigManager.ts
export class ModelConfigManager {
  async switchRegion(targetRegion: 'us' | 'cn'): Promise<void> {
    // Validate region capabilities
    // Update environment configuration
    // Restart necessary services
    // Verify functionality
  }
  
  async testModelEcosystem(region: 'us' | 'cn'): Promise<TestResults> {
    // Test all model types
    // Verify compatibility
    // Report issues
  }
}
```

### 4.5 Phase 5: Testing and Validation (Week 5-6)

#### **Task 5.1: Comprehensive Testing Framework**
```typescript
// __tests__/model-ecosystem/RegionCompatibilityTest.ts
describe('Model Ecosystem Compatibility', () => {
  test('US models work correctly', async () => {
    const usConfig = await setupUSEnvironment();
    await validateAllCapabilities(usConfig);
  });
  
  test('China models work correctly', async () => {
    const cnConfig = await setupChinaEnvironment();
    await validateAllCapabilities(cnConfig);
  });
  
  test('Cross-region fallback works', async () => {
    await simulateRegionFailure('us');
    await validateFallbackToChina();
  });
});
```

## 5. Environmental Configuration Strategy

### 5.1 Environment Variables Schema
```bash
# Region Configuration
DEPLOYMENT_REGION=us|cn|auto
ENABLE_CROSS_REGION_FALLBACK=true|false

# US API Keys
GOOGLE_API_KEY=your_google_api_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials

# China API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key
QWEN_API_KEY=your_qwen_api_key
BAIDU_API_KEY=your_baidu_api_key

# Model Preferences
PREFERRED_CHAT_MODEL=auto|specific_model
PREFERRED_EMBEDDING_MODEL=auto|specific_model
PREFERRED_VISION_MODEL=auto|specific_model
```

### 5.2 Configuration Files Structure
```
config/
├── model-ecosystems/
│   ├── us-models.json
│   ├── china-models.json
│   └── global-fallbacks.json
├── region-detection/
│   ├── network-tests.json
│   └── geo-mappings.json
└── capabilities/
    ├── model-capabilities.json
    └── feature-matrix.json
```

## 6. Migration and Deployment Strategy

### 6.1 Backward Compatibility
- Maintain existing Google-only functionality as default
- Gradual rollout of region-aware features
- Feature flags for safe testing

### 6.2 Data Migration
- Embedding dimension compatibility layer
- Progressive re-embedding for dimension changes
- Metadata versioning for tracking migrations

### 6.3 Monitoring and Alerts
- Region-specific performance metrics
- Cross-region failover alerts
- Model performance comparisons

## 7. Risk Mitigation

### 7.1 Technical Risks
- **Model Quality Differences**: Implement quality scoring and feedback loops
- **API Reliability**: Multiple fallback providers within each region
- **Performance Variations**: Adaptive timeout and retry strategies

### 7.2 Operational Risks
- **Configuration Complexity**: Automated configuration validation
- **Regional Compliance**: Legal review of model usage in each region
- **Cost Management**: Budget monitoring for multiple API providers

## 8. Success Metrics

### 8.1 Functionality Metrics
- 100% feature parity between regions
- <5% performance degradation when switching regions
- <99.9% uptime with fallback systems

### 8.2 User Experience Metrics
- Seamless region detection and switching
- Consistent response quality across regions
- <2 second additional latency for region switches

## 9. Implementation Timeline

- **Week 1-2**: Infrastructure Foundation
- **Week 3-4**: Model Configuration System
- **Week 4-5**: Tool Layer Updates
- **Week 5-6**: Advanced Features & Testing
- **Week 7**: Deployment & Monitoring Setup

## 10. Next Steps

1. **Immediate**: Complete DeepSeek client implementation
2. **Short-term**: Implement region detection and configuration
3. **Medium-term**: Deploy comprehensive testing framework
4. **Long-term**: Continuous optimization and model ecosystem expansion

This plan addresses the core business challenge of model ecosystem fragmentation while maintaining system reliability and user experience across different geographical regions.
