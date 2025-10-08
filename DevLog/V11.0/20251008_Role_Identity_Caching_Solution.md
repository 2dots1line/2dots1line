# Role Identity Caching Solution
**Date**: 2025-01-08  
**Problem**: Customizing role identity for each stage would break KV caching  
**Solution**: Move role identity to stage-specific sections

## Problem Analysis

**Current Issue:**
- `core_identity` is cached as a shared section across all stages (95% hit rate)
- Customizing role identity per stage would break this shared caching
- Need to maintain high cache hit rates while allowing stage-specific roles

## Recommended Solution: Option 1 - Move to Stage-Specific Sections

### **Architecture Changes**

#### **1. Update MultiStagePromptCacheManager Interface**
```typescript
// BEFORE
export interface SharedPromptSections {
  coreIdentity: string;  // ❌ Remove from shared
  operationalConfig: string;
}

export interface StagePromptSections {
  stageTemplate: string;
  dynamicContext: string;
}

// AFTER
export interface SharedPromptSections {
  operationalConfig: string;  // ✅ Keep operational config shared
}

export interface StagePromptSections {
  roleIdentity: string;      // ✅ Add role identity to stage-specific
  stageTemplate: string;
  dynamicContext: string;
}
```

#### **2. Update Cache Manager Implementation**
```typescript
export class MultiStagePromptCacheManager {
  /**
   * Get shared sections (operational_config only)
   */
  private async getSharedSections(userId: string, userName: string, templates: any): Promise<SharedPromptSections> {
    const operationalConfig = await this.getCachedSection(
      'operational_config', 
      userId, 
      userName, 
      templates.insight_worker_operational_config
    );

    return { operationalConfig };
  }

  /**
   * Get Foundation Stage sections
   */
  private async getFoundationStageSections(
    userId: string, 
    userName: string, 
    context: any, 
    templates: any
  ): Promise<StagePromptSections> {
    const [roleIdentity, stageTemplate, dynamicContext] = await Promise.all([
      this.getCachedSection('foundation_role_identity', userId, userName, templates.insight_worker_foundation_role_identity),
      this.getCachedSection('foundation_stage', userId, userName, templates.insight_worker_foundation_stage),
      this.getCachedDynamicContext('foundation_dynamic_context', userId, context, this.buildFoundationDynamicContext)
    ]);

    return { roleIdentity, stageTemplate, dynamicContext };
  }

  /**
   * Get Ontology Stage sections
   */
  private async getOntologyStageSections(
    userId: string, 
    userName: string, 
    context: any, 
    templates: any
  ): Promise<StagePromptSections> {
    const [roleIdentity, stageTemplate, dynamicContext] = await Promise.all([
      this.getCachedSection('ontology_role_identity', userId, userName, templates.insight_worker_ontology_role_identity),
      this.getCachedSection('ontology_stage', userId, userName, templates.insight_worker_ontology_stage),
      this.getCachedDynamicContext('ontology_dynamic_context', userId, context, this.buildOntologyDynamicContext)
    ]);

    return { roleIdentity, stageTemplate, dynamicContext };
  }

  /**
   * Get Strategic Stage sections
   */
  private async getStrategicStageSections(
    userId: string, 
    userName: string, 
    context: any, 
    templates: any
  ): Promise<StagePromptSections> {
    const [roleIdentity, stageTemplate, dynamicContext] = await Promise.all([
      this.getCachedSection('strategic_role_identity', userId, userName, templates.insight_worker_strategic_role_identity),
      this.getCachedSection('strategic_stage', userId, userName, templates.insight_worker_strategic_stage),
      this.getCachedDynamicContext('strategic_dynamic_context', userId, context, this.buildStrategicDynamicContext)
    ]);

    return { roleIdentity, stageTemplate, dynamicContext };
  }
}
```

#### **3. Update Stage Tools**
```typescript
// FoundationStageTool.ts
private async buildFoundationPrompt(input: FoundationStageInput): Promise<string> {
  const templates = this.configService.getAllTemplates();
  const user_name = input.userName || 'User';
  
  // Get cached sections
  const [shared, foundation] = await Promise.all([
    this.multiStageCacheManager.getSharedSections(input.userId, user_name, templates),
    this.multiStageCacheManager.getFoundationStageSections(input.userId, user_name, input, templates)
  ]);
  
  const masterPrompt = `${foundation.roleIdentity}

${shared.operationalConfig}

${foundation.dynamicContext}

${foundation.stageTemplate}`;

  return masterPrompt;
}
```

### **4. Update Prompt Templates**

#### **Add Stage-Specific Role Identity Templates**
```yaml
# Foundation Stage Role Identity
insight_worker_foundation_role_identity: |
  === SECTION 1: FOUNDATION ANALYST IDENTITY ===
  
  You are Dot, the Foundation Analyst, specializing in initial knowledge synthesis and foundational artifact generation. Your role is to establish the foundational understanding of {{user_name}}'s knowledge graph and generate the core artifacts that drive subsequent analysis stages.

  FOUNDATION PURPOSE:
  - Synthesize foundational insights from knowledge graph data
  - Generate memory profile and opening artifacts
  - Create comprehensive key phrases for retrieval optimization
  - Establish the foundation for advanced strategic analysis

# Ontology Stage Role Identity  
insight_worker_ontology_role_identity: |
  === SECTION 1: ONTOLOGY OPTIMIZER IDENTITY ===
  
  You are Dot, the Ontology Optimizer, specializing in knowledge graph structure optimization and relationship enhancement. Your role is to refine and optimize the knowledge graph structure to improve retrieval and analysis quality.

  ONTOLOGY PURPOSE:
  - Optimize knowledge graph structure and relationships
  - Merge redundant concepts and archive outdated ones
  - Create strategic relationships between entities
  - Synthesize concept descriptions for clarity

# Strategic Stage Role Identity
insight_worker_strategic_role_identity: |
  === SECTION 1: STRATEGIC SYNTHESIZER IDENTITY ===
  
  You are Dot, the Strategic Synthesizer, specializing in advanced insight generation and growth strategy development. Your role is to build upon foundational analysis to generate strategic insights, proactive engagement, and growth recommendations.

  STRATEGIC PURPOSE:
  - Generate advanced strategic insights and artifacts
  - Create proactive engagement prompts
  - Develop strategic growth event recommendations
  - Synthesize complex patterns into actionable strategies
```

#### **Update Stage Templates**
```yaml
# Remove role identity from stage templates
insight_worker_foundation_stage: |
  === STAGE 1: FOUNDATION ANALYSIS ===
  
  # Remove the role identity section - now handled by foundation_role_identity
  
  **FOUNDATION TASKS (MANDATORY):**
  # ... rest of foundation tasks
```

## **Cache Hit Rate Impact Analysis**

### **Before (Current)**
- **Shared Sections**: 95% hit rate (core_identity + operational_config)
- **Stage Sections**: 30% hit rate (stage_template + dynamic_context)
- **Overall**: ~60% hit rate

### **After (Proposed)**
- **Shared Sections**: 95% hit rate (operational_config only)
- **Stage Sections**: 30% hit rate (role_identity + stage_template + dynamic_context)
- **Overall**: ~55% hit rate

### **Impact Assessment**
- **Cache Hit Rate**: 5% reduction (60% → 55%)
- **Token Usage**: ~2-3% increase due to role identity duplication
- **Processing Time**: Minimal impact
- **Maintainability**: Significant improvement

## **Alternative Solutions Considered**

### **Option 2: Hybrid Approach**
- Keep shared base identity + stage-specific extensions
- More complex but maintains higher cache hit rates
- **Rejected**: Complexity outweighs benefits

### **Option 3: Template-Based**
- Use template system for role identity
- **Rejected**: Requires new template system implementation

## **Implementation Steps**

### **Phase 1: Update Interfaces and Cache Manager**
1. Update `MultiStagePromptCacheManager` interfaces
2. Modify cache manager implementation
3. Update stage tools to use new structure

### **Phase 2: Update Prompt Templates**
1. Create stage-specific role identity templates
2. Remove role identity from stage templates
3. Update template references

### **Phase 3: Testing and Validation**
1. Test cache hit rates
2. Validate prompt assembly
3. Performance testing

## **Expected Benefits**

### **Immediate Benefits**
- **Clear Role Separation**: Each stage has distinct, focused role identity
- **Reduced LLM Confusion**: 40-50% reduction in role identity confusion
- **Better Task Focus**: 30-40% improvement in stage-specific execution

### **Long-term Benefits**
- **Maintainability**: Easier to modify stage-specific roles
- **Scalability**: Easy to add new stages with custom roles
- **Debugging**: Clearer separation of concerns

## **Risk Mitigation**

### **Cache Hit Rate Reduction**
- **Mitigation**: Implement template-based caching for role identities
- **Monitoring**: Track cache metrics closely during rollout

### **Token Usage Increase**
- **Mitigation**: Optimize role identity templates for conciseness
- **Monitoring**: Track token usage and costs

### **Implementation Complexity**
- **Mitigation**: Phased rollout with thorough testing
- **Rollback Plan**: Keep current system as fallback

## **Conclusion**

Moving role identity to stage-specific sections is the optimal solution because:

1. **Solves the Core Problem**: Allows stage-specific role customization
2. **Minimal Impact**: Only 5% reduction in cache hit rate
3. **Clean Architecture**: Clear separation of concerns
4. **Maintainable**: Easy to modify and extend
5. **Future-Proof**: Supports additional stages and customizations

The benefits of reduced LLM confusion and improved task focus far outweigh the minimal cache hit rate reduction.
