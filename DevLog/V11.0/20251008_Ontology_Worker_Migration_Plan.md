# Ontology Worker Migration Plan
**Date**: 2025-01-08  
**Goal**: Move Ontology stage from Insight Worker to dedicated Ontology Optimization Worker

## Current State Analysis

### **Insight Worker (Current)**
- **Stage 1**: Ontology (standalone, no HRT)
- **Stage 2**: Foundation (with HRT)
- **Stage 3**: Strategic (with HRT, follows Foundation)

### **Ontology Optimization Worker (Existing)**
- **Structure**: Complete BullMQ worker setup
- **Implementation**: Empty placeholders in LLMBasedOptimizer
- **Queue**: `ontology-optimization-queue`
- **Job Types**: `merge`, `archive`, `community`, `full`

## Migration Strategy

### **Phase 1: Move Ontology Logic to Dedicated Worker**

#### **1.1 Update Ontology Optimization Worker**
- **Replace LLMBasedOptimizer**: Use existing OntologyStageTool from insight-worker
- **Add Context Gathering**: Implement lightweight context gathering (no HRT)
- **Add Job Processing**: Handle full ontology optimization jobs
- **Add Persistence**: Store ontology optimization results

#### **1.2 Update Insight Worker**
- **Remove Ontology Stage**: Remove from InsightWorkflowOrchestrator
- **Simplify to 2 Stages**: Foundation → Strategic only
- **Add Ontology Trigger**: Trigger ontology worker when needed
- **Maintain Dependencies**: Ensure Foundation/Strategic can run without ontology

### **Phase 2: Implement Flexible Scheduling**

#### **2.1 Ontology Worker Scheduling**
- **On-Demand**: Triggered by Insight Worker when needed
- **Scheduled**: Regular maintenance runs (daily/weekly)
- **Event-Driven**: Triggered by knowledge graph changes
- **Manual**: Admin-triggered optimization runs

#### **2.2 Insight Worker Integration**
- **Optional Ontology**: Foundation/Strategic can run with or without ontology
- **Context Awareness**: Use optimized knowledge graph when available
- **Fallback Handling**: Graceful degradation when ontology not available

## Implementation Plan

### **Step 1: Update Ontology Optimization Worker**

#### **1.1 Replace LLMBasedOptimizer with OntologyStageTool**
```typescript
// workers/ontology-optimization-worker/src/strategies/LLMBasedOptimizer.ts
import { OntologyStageTool } from '@2dots1line/tools';

export class LLMBasedOptimizer implements OptimizationStrategy {
  private ontologyStageTool: OntologyStageTool;

  constructor(
    private dbService: DatabaseService,
    private conceptRepository: ConceptRepository,
    private configService: ConfigService,
    private promptCacheService: PromptCacheService
  ) {
    this.ontologyStageTool = new OntologyStageTool(configService, promptCacheService);
  }

  async performFullOptimization(userId: string): Promise<OntologyOptimizationResult> {
    // Gather lightweight context (no HRT)
    const context = await this.gatherOntologyContext(userId);
    
    // Execute ontology optimization using OntologyStageTool
    const result = await this.ontologyStageTool.execute(context);
    
    // Persist results
    await this.persistOntologyResults(userId, result);
    
    return result;
  }
}
```

#### **1.2 Add Context Gathering Method**
```typescript
private async gatherOntologyContext(userId: string): Promise<OntologyStageInput> {
  // Get user data
  const user = await this.userRepository.findById(userId);
  
  // Get current knowledge graph data (from database, no HRT)
  const currentKnowledgeGraph = await this.getCurrentKnowledgeGraph(userId);
  
  // Get user memory profile
  const userMemoryProfile = await this.getUserMemoryProfile(userId);
  
  // Get recent growth events (from database)
  const recentGrowthEvents = await this.getRecentGrowthEvents(userId);
  
  // Get recent conversations (from database)
  const recentConversations = await this.getRecentConversations(userId);
  
  return {
    userId,
    userName: user.name || 'User',
    userMemoryProfile,
    cycleId: randomUUID(),
    cycleStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    cycleEndDate: new Date().toISOString(),
    currentKnowledgeGraph,
    recentGrowthEvents,
    strategicContext: {
      retrievedMemoryUnits: [],
      retrievedConcepts: [],
      retrievedArtifacts: [],
      retrievalSummary: 'No HRT retrieval needed for ontology optimization'
    },
    previousKeyPhrases: [],
    workerType: 'ontology-optimization-worker',
    workerJobId: randomUUID()
  };
}
```

#### **1.3 Update Job Processing**
```typescript
// workers/ontology-optimization-worker/src/OntologyOptimizer.ts
async processOptimization(job: Job<OntologyJobData>): Promise<void> {
  const { userId, optimizationType, conceptIds, threshold } = job.data;
  
  console.log(`[OntologyOptimizer] Starting ${optimizationType} optimization for user ${userId}`);

  try {
    switch (optimizationType) {
      case 'full':
        // Use OntologyStageTool for full optimization
        const result = await this.llmOptimizer.performFullOptimization(userId);
        console.log(`[OntologyOptimizer] Full optimization completed: ${JSON.stringify(result)}`);
        break;
      case 'merge':
        await this.optimizeConceptMerging(userId, conceptIds, threshold);
        break;
      case 'archive':
        await this.optimizeConceptArchiving(userId, conceptIds);
        break;
      case 'community':
        await this.optimizeCommunityFormation(userId, conceptIds);
        break;
    }
    
    console.log(`[OntologyOptimizer] Successfully completed ${optimizationType} optimization`);
  } catch (error) {
    console.error(`[OntologyOptimizer] Error in ${optimizationType} optimization:`, error);
    throw error;
  }
}
```

### **Step 2: Update Insight Worker**

#### **2.1 Remove Ontology Stage from Orchestrator**
```typescript
// workers/insight-worker/src/InsightWorkflowOrchestrator.ts
async executeUserCycle(job: Job<InsightJobData>): Promise<CycleResult> {
  const { userId } = job.data;
  const cycleId = randomUUID();
  const startTime = Date.now();
  const results: Partial<StageResults> = {};
  
  console.log(`[InsightWorkflowOrchestrator] Starting 2-stage cycle ${cycleId} for user ${userId}`);
  
  try {
    // Calculate cycle dates
    const cycleDates = this.calculateCycleDates();
    
    // Create user cycle record first
    await this.userCycleRepository.create({
      cycle_id: cycleId,
      user_id: userId,
      type: 'insight_cycle',
      created_at: new Date()
    });
    
    // Stage 1: Foundation (Critical - must succeed for strategic stage)
    console.log(`[InsightWorkflowOrchestrator] Stage 1: Foundation analysis for user ${userId}`);
    results.foundation = await this.executeFoundationStage(userId, cycleDates, cycleId);
    await this.persistStageResults(cycleId, 'foundation', results.foundation);
    console.log(`[InsightWorkflowOrchestrator] Stage 1 completed for user ${userId}`);
    
    // Stage 2: Strategic (Depends on Foundation only)
    console.log(`[InsightWorkflowOrchestrator] Stage 2: Strategic insights for user ${userId}`);
    results.strategic = await this.executeStrategicStage(userId, results.foundation, cycleDates, cycleId);
    await this.persistStageResults(cycleId, 'strategic', results.strategic);
    console.log(`[InsightWorkflowOrchestrator] Stage 2 completed for user ${userId}`);
    
    // Optional: Trigger ontology optimization (non-blocking)
    await this.triggerOntologyOptimization(userId, cycleId);
    
    // Final integration with available results
    console.log(`[InsightWorkflowOrchestrator] Final integration for user ${userId}`);
    const finalResult = await this.integrateResults(userId, results, cycleId);
    await this.persistStageResults(cycleId, 'integration', finalResult);
    
    // ... rest of the method
  }
}
```

#### **2.2 Add Ontology Trigger Method**
```typescript
private async triggerOntologyOptimization(userId: string, cycleId: string): Promise<void> {
  try {
    // Add job to ontology optimization queue
    const ontologyQueue = new Queue('ontology-optimization-queue', { 
      connection: this.redisConnection 
    });
    
    await ontologyQueue.add('full-optimization', {
      userId,
      optimizationType: 'full',
      triggeredBy: 'insight-worker',
      cycleId
    }, {
      delay: 5000, // 5 second delay to allow insight cycle to complete
      attempts: 2,
      removeOnComplete: true,
      removeOnFail: false
    });
    
    console.log(`[InsightWorkflowOrchestrator] Triggered ontology optimization for user ${userId}`);
  } catch (error) {
    console.warn(`[InsightWorkflowOrchestrator] Failed to trigger ontology optimization:`, error);
    // Don't fail the insight cycle if ontology trigger fails
  }
}
```

### **Step 3: Update PM2 Configuration**

#### **3.1 Add Ontology Worker to PM2**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    // ... existing apps
    {
      name: 'ontology-optimization-worker',
      script: 'dist/index.js',
      cwd: './workers/ontology-optimization-worker',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'ontology-optimization'
      },
      error_file: './logs/ontology-optimization-worker-error.log',
      out_file: './logs/ontology-optimization-worker-out.log',
      log_file: './logs/ontology-optimization-worker-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

## Benefits of Migration

### **1. Cleaner Architecture**
- **Insight Worker**: Pure Foundation → Strategic conversation flow
- **Ontology Worker**: Dedicated knowledge graph optimization
- **Separation of Concerns**: Each worker has single responsibility

### **2. Flexible Scheduling**
- **On-Demand**: Triggered when needed
- **Scheduled**: Regular maintenance runs
- **Event-Driven**: Triggered by knowledge graph changes
- **Manual**: Admin-triggered optimization

### **3. Better Performance**
- **Parallel Execution**: Ontology can run independently
- **Non-Blocking**: Insight cycle doesn't wait for ontology
- **Resource Optimization**: Each worker can be scaled independently

### **4. Improved Maintainability**
- **Focused Workers**: Easier to debug and maintain
- **Independent Deployment**: Can deploy workers separately
- **Clear Dependencies**: Obvious data flow between workers

## Migration Timeline

### **Phase 1: Core Migration (Week 1)**
1. Update Ontology Optimization Worker with OntologyStageTool
2. Remove Ontology stage from Insight Worker
3. Add ontology trigger mechanism
4. Test basic functionality

### **Phase 2: Integration & Testing (Week 2)**
1. Update PM2 configuration
2. Add comprehensive error handling
3. Test end-to-end workflows
4. Performance testing

### **Phase 3: Optimization & Monitoring (Week 3)**
1. Add monitoring and metrics
2. Optimize scheduling strategies
3. Add admin interfaces
4. Documentation updates

## Expected Outcomes

### **Immediate Benefits**
- **Cleaner Insight Worker**: Pure Foundation-Strategic flow
- **Dedicated Ontology Worker**: Focused knowledge graph optimization
- **Flexible Scheduling**: Ontology can run independently

### **Long-term Benefits**
- **Better Scalability**: Workers can be scaled independently
- **Improved Maintainability**: Clear separation of concerns
- **Enhanced Performance**: Non-blocking ontology optimization
- **Better Monitoring**: Dedicated metrics for each worker

This migration will create a much cleaner and more maintainable architecture while preserving all existing functionality.
