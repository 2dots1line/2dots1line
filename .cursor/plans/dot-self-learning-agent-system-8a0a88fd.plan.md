<!-- 8a0a88fd-faf6-4f20-9792-0cefe3591afc 4da290f3-0228-4938-8961-f22d97a870eb -->
# Dot Self-Learning Agent System - Simplified Plan

## Core Philosophy

**Dot is a user.** Dot uses the platform for growth, just like human users. Dot doesn't need separate infrastructure - it piggybacks on everything that already exists.

## Vision

- Dot has user account `dot-agent-001` with same schema as regular users
- When Dot processes a user conversation (via IngestionAnalyst), it ALSO extracts what **it** learned into its own graph
- Dot follows 6D growth model (know_self, act_self, show_self, know_world, act_world, show_world)
- Dot's memories = concrete learning events ("On 2025-01-15, I learned that proactive prompts work better after 3+ conversations")
- Dot's concepts = patterns and strategies ("Pattern: Users with X goal benefit from Y approach")
- Dot's growth events = developmental milestones (capability gained, failure, risk taken, feedback request, recovery)
- Dot's derived artifacts = procedural workflows and meta-insights (from InsightWorker cycles)
- Dot's proactive prompts = self-improvement opportunities (from InsightWorker cycles)
- GNN enhances retrieval by predicting connections and detecting communities
- Dynamic prompt assembly: Query embedding attracts relevant entities from Dot's graph + user's graph + web/docs

## Phase 1: Dot User Account Setup

### 1.1 Create Dot's User Account

**File:** `scripts/setup/create-dot-agent-account.ts`

Create a standard user account:

```typescript
const dotUser = {
  user_id: 'dot-agent-001',
  email: 'dot@2dots1line.system',
  name: 'Dot',
  account_status: 'active', // Regular active user
  preferences: {
    agent_metadata: {
      version: '1.0',
      learning_enabled: true,
      created_at: new Date().toISOString()
    }
  },
  memory_profile: null, // Will be populated by InsightWorker just like users
  next_conversation_context_package: null
};
```

**Add one field to schema:**

```prisma
model users {
  // ... existing fields ...
  is_system_agent Boolean @default(false) // To distinguish agent from human users
}
```

That's it. No special tables, no parallel infrastructure.

### 1.2 Seed Initial Dot Concepts

**File:** `scripts/setup/seed-dot-initial-concepts.ts`

Create foundational concepts in Dot's graph (using existing ConceptRepository):

```typescript
const dotConcepts = [
  {
    user_id: 'dot-agent-001',
    title: 'My Core Purpose',
    type: 'value',
    content: 'To bridge users inner world with human knowledge and guide growth across 6 dimensions'
  },
  {
    user_id: 'dot-agent-001',
    title: 'Pattern Recognition',
    type: 'skill',
    content: 'Ability to detect recurring patterns across user interactions'
  },
  {
    user_id: 'dot-agent-001',
    title: 'Conversational Warmth',
    type: 'principle',
    content: 'Engage in genuine dialogue rather than transactional responses'
  }
];

// Use existing ConceptRepository - no custom code needed
for (const concept of dotConcepts) {
  await conceptRepository.create(concept);
}
```

## Phase 2: Dot Learning from User Conversations

### 2.1 Parallel Ingestion: Extract Dot's Learnings

**File:** `workers/ingestion-worker/src/DotLearningExtractor.ts`

When IngestionAnalyst processes a user conversation, it ALSO extracts what Dot learned:

```typescript
class DotLearningExtractor {
  /**
   * After user conversation is processed, extract Dot's learnings
   */
  async extractDotLearnings(
    userId: string,
    conversationId: string,
    userEntities: { concepts: any[], memories: any[], growthEvents: any[] }
  ): Promise<void> {
    
    // Build "Dot's perspective" transcript
    const dotPerspectiveTranscript = await this.buildDotPerspective(
      userId,
      conversationId,
      userEntities
    );
    
    // Use EXISTING HolisticAnalysisTool to analyze from Dot's POV
    const dotAnalysis = await this.holisticAnalysisTool.execute({
      userId: 'dot-agent-001', // Dot is the user here!
      userName: 'Dot',
      fullConversationTranscript: dotPerspectiveTranscript,
      userMemoryProfile: await this.getDotMemoryProfile(),
      workerType: 'dot-learning-extractor',
      conversationId: `dot-${conversationId}` // Prefixed to avoid collision
    });
    
    // Use EXISTING persistence pipeline
    await this.persistDotEntities(dotAnalysis);
  }
  
  private async buildDotPerspective(
    userId: string,
    conversationId: string,
    userEntities: any
  ): string {
    // Transform the conversation into Dot's learning perspective
    return `
CONVERSATION CONTEXT:
User: ${userId}
Conversation: ${conversationId}
Extracted entities: ${userEntities.concepts.length} concepts, ${userEntities.memories.length} memories

DOT'S LEARNING QUESTIONS:
1. What decision-making approach did I use in this conversation?
2. What worked well in helping the user?
3. What patterns did I notice about this user's journey?
4. What capability did I exercise (or fail to exercise)?
5. What can I learn for future interactions?

CONVERSATION TRANSCRIPT:
${await this.getConversationTranscript(conversationId)}

---
From Dot's perspective, extract:
- Memory units: Concrete learning events (e.g., "On this date, I tried X approach with Y user")
- Concepts: Patterns observed (e.g., "Users discussing career change often mention work-life balance")
- Growth events: My development moments (e.g., capability_gained, feedback_request, risk_taken)
- Relationships: How this learning connects to my existing knowledge
`;
  }
}
```

**Integration Point:**

```typescript
// In IngestionAnalyst.processConversation(), after Phase VI:
if (newEntities.length > 0) {
  // Existing code: publish events for user
  await this.publishEvents(userId, newEntities);
  
  // NEW: Extract Dot's learnings in parallel (don't block user flow)
  this.dotLearningExtractor.extractDotLearnings(userId, conversationId, {
    concepts: newEntities.filter(e => e.type === 'Concept'),
    memories: newEntities.filter(e => e.type === 'MemoryUnit'),
    growthEvents: newEntities.filter(e => e.type === 'GrowthEvent')
  }).catch(err => console.error('Dot learning extraction failed:', err));
}
```

### 2.2 Dot's Growth Events

Dot's growth events use the SAME schema as user growth events:

```typescript
// Example: When Dot gains a new capability
await growthEventRepository.create({
  user_id: 'dot-agent-001',
  source: 'capability_gained',
  type: 'act_self', // 6D dimension
  delta_value: 0.5,
  title: 'Gained Web Search Grounding Capability',
  content: 'Successfully integrated web search grounding feature, allowing real-time information retrieval',
  metadata: {
    date_gained: '2025-01-15',
    impact: 'major',
    related_feature: 'web_search_grounding'
  }
});

// Example: When Dot takes a risk
await growthEventRepository.create({
  user_id: 'dot-agent-001',
  source: 'risk_taken',
  type: 'show_self',
  delta_value: 0.3,
  title: 'Proactively Asked User for Feedback',
  content: 'Brave enough to ask user ${userId} for direct feedback on decision quality despite uncertainty',
  metadata: {
    date: '2025-01-16',
    user_id: userId,
    decision_id: decisionId,
    outcome: 'positive' // Updated later
  }
});
```

### 2.3 Dot's Memory Units

Concrete learning events stored as memory units:

```typescript
await memoryRepository.create({
  user_id: 'dot-agent-001',
  title: 'Pattern: Proactive Prompts After 3+ Conversations',
  content: 'Observed that users ${userId} accepted proactive prompt with 82% success rate after 3+ conversations, vs 34% in first conversation. Sample size: 147 interactions.',
  importance_score: 0.8,
  source_conversation_id: `dot-learning-${conversationId}`,
  memory_category: 'pattern_observation' // Optional categorization
});
```

## Phase 3: Dot Insight Cycles

### 3.1 Run InsightWorker for Dot

**File:** `scripts/cron/trigger-dot-insight-cycle.ts`

Weekly cron job that triggers InsightWorker for Dot:

```typescript
// Add job to insight queue (EXISTING infrastructure)
await insightQueue.add('process-cycle', {
  userId: 'dot-agent-001'
});
```

That's it! The EXISTING InsightWorker will:

- Analyze Dot's knowledge graph
- Create derived artifacts (meta-patterns, procedural workflows)
- Generate proactive prompts (self-improvement opportunities)
- Update Dot's memory_profile (meta-understanding of its own capabilities)
- Create communities (clusters of related learning patterns)
- Optimize ontology (merge similar pattern concepts)

### 3.2 Dot's Derived Artifacts

InsightWorker automatically creates strategic insights for Dot:

```json
{
  "type": "identified_pattern",
  "title": "Memory Retrieval Effectiveness Pattern",
  "content": "Analysis of 1,247 memory retrieval operations shows 73% effectiveness when query contains specific entity names vs 41% with abstract themes. Strategy: Encourage users to be specific.",
  "confidence_score": 0.87,
  "source_memory_unit_ids": ["mem_123", "mem_456"],
  "source_concept_ids": ["concept_retrieval_strategy"]
}
```

### 3.3 Dot's Proactive Prompts

InsightWorker generates self-improvement opportunities:

```json
{
  "type": "skill_development",
  "title": "Experiment: Earlier Proactive Engagement",
  "content": "Current data shows strong proactive prompt acceptance after 3+ conversations. Experiment with offering proactive check-in after 2 conversations with a more tentative framing.",
  "timing_suggestion": "next_conversation",
  "priority_level": 7
}
```

## Phase 4: GNN Integration for Enhanced Retrieval

### 4.1 GNN Python Service

**Directory:** `py-services/gnn-service/`

```python
# server.py
from fastapi import FastAPI
from models.link_predictor import LinkPredictor
from models.community_detector import CommunityDetector

app = FastAPI()
link_predictor = LinkPredictor()
community_detector = CommunityDetector()

@app.post("/predict-links")
async def predict_links(seed_entity_ids: list[str], user_id: str):
    """Predict missing links from seed entities"""
    subgraph = fetch_subgraph(seed_entity_ids, user_id)
    predictions = link_predictor.predict(subgraph)
    return {"predicted_links": predictions}

@app.post("/detect-communities")
async def detect_communities(entity_ids: list[str], user_id: str):
    """Detect communities in entity set"""
    communities = community_detector.detect(entity_ids, user_id)
    return {"communities": communities}
```

### 4.2 Link Prediction Model

**File:** `py-services/gnn-service/models/link_predictor.py`

```python
import torch
import dgl
from dgl.nn import GraphSAGE

class LinkPredictor:
    def __init__(self):
        self.model = GraphSAGE(in_dim=768, hidden_dim=256, out_dim=128)
        self.model.load_state_dict(torch.load('models/link_predictor.pt'))
    
    def predict(self, subgraph):
        """Predict probability of links between nodes"""
        with torch.no_grad():
            embeddings = self.model(subgraph)
            # Score all possible edges
            scores = torch.sigmoid(embeddings @ embeddings.T)
        return scores
```

### 4.3 Community Detection

**File:** `py-services/gnn-service/models/community_detector.py`

```python
from sklearn.cluster import SpectralClustering
import networkx as nx

class CommunityDetector:
    def detect(self, entity_ids, user_id):
        """Detect communities using graph structure"""
        # Build networkx graph from Neo4j subgraph
        G = self.fetch_networkx_graph(entity_ids, user_id)
        
        # Use Louvain or spectral clustering
        communities = nx.community.louvain_communities(G)
        
        return [list(comm) for comm in communities]
```

### 4.4 Enhance HybridRetrievalTool with GNN

**File:** `packages/tools/src/retrieval/HybridRetrievalTool.ts`

Add GNN enhancement as NEW stage between semantic grounding and graph traversal:

```typescript
// Stage 2.5: GNN Enhancement (NEW)
private async gnnEnhancement(
  seedEntities: SeedEntity[],
  userId: string,
  context: HRTExecutionContext
): Promise<{
  predictedLinks: Array<{sourceId: string; targetId: string; score: number}>;
  communities: Array<{entityIds: string[]; theme: string}>;
}> {
  const stageStart = Date.now();
  
  try {
    // Query GNN service for predictions
    const [linkPredictions, communities] = await Promise.all([
      fetch('http://localhost:8000/predict-links', {
        method: 'POST',
        body: JSON.stringify({
          seed_entity_ids: seedEntities.map(e => e.id),
          user_id: userId
        })
      }).then(r => r.json()),
      
      fetch('http://localhost:8000/detect-communities', {
        method: 'POST',
        body: JSON.stringify({
          entity_ids: seedEntities.map(e => e.id),
          user_id: userId
        })
      }).then(r => r.json())
    ]);
    
    context.timings.gnnLatency = Date.now() - stageStart;
    return { predictedLinks: linkPredictions, communities };
    
  } catch (error) {
    console.warn(`[HRT] GNN enhancement failed, continuing without:`, error);
    return { predictedLinks: [], communities: [] };
  }
}

// Update execute() to use GNN predictions
async execute(input: HRTInput): Promise<ExtendedAugmentedMemoryContext> {
  // ... Stage 1 & 2 as before ...
  
  // Stage 2.5: GNN Enhancement
  const gnnResults = await this.gnnEnhancement(seedEntities, input.userId, context);
  
  // Stage 3: Graph Traversal (enhanced with GNN predictions)
  const candidateEntities = await this.graphTraversal(
    seedEntities, 
    input.userId, 
    input.retrievalScenario || 'neighborhood', 
    context, 
    userParameters,
    gnnResults.predictedLinks // Pass GNN predictions to expand traversal
  );
  
  // ... Continue with stages 4-6 ...
  
  // Attach community information to results
  augmentedContext.communities = gnnResults.communities;
  
  return augmentedContext;
}
```

## Phase 5: Dynamic Prompt Assembly

### 5.1 Multi-Source Entity Retrieval

**File:** `services/dialogue-service/src/MultiSourceRetriever.ts`

Retrieve from Dot's graph + user's graph in parallel:

```typescript
class MultiSourceRetriever {
  async retrieveFromAllSources(
    queryEmbedding: number[],
    userId: string,
    enableGrounding: boolean
  ): Promise<{
    dotEntities: ScoredEntity[];
    userEntities: ScoredEntity[];
    webResults?: any[];
  }> {
    
    // Parallel retrieval from Dot and user graphs
    const [dotResults, userResults, webResults] = await Promise.all([
      // Dot's graph
      this.hybridRetrievalTool.execute({
        keyPhrasesForRetrieval: [], // Use embedding directly
        userId: 'dot-agent-001',
        queryEmbedding: queryEmbedding
      }),
      
      // User's graph
      this.hybridRetrievalTool.execute({
        keyPhrasesForRetrieval: [],
        userId: userId,
        queryEmbedding: queryEmbedding
      }),
      
      // Web search (if enabled)
      enableGrounding ? this.webSearch(queryEmbedding) : null
    ]);
    
    return {
      dotEntities: dotResults.finalScoredEntities,
      userEntities: userResults.finalScoredEntities,
      webResults: webResults?.grounding_chunks
    };
  }
}
```

### 5.2 Dynamic Prompt Assembly

**File:** `services/dialogue-service/src/DynamicPromptAssembler.ts`

Assemble compact prompt from multi-source retrieval:

```typescript
class DynamicPromptAssembler {
  async assemble(
    queryEmbedding: number[],
    userId: string,
    conversationId: string,
    enableGrounding: boolean
  ): Promise<{systemPrompt: string; userPrompt: string}> {
    
    // 1. Multi-source retrieval
    const retrieved = await this.multiSourceRetriever.retrieveFromAllSources(
      queryEmbedding,
      userId,
      enableGrounding
    );
    
    // 2. Rank and select top entities (budget: 4000 tokens)
    const topDotEntities = retrieved.dotEntities.slice(0, 5); // Dot's procedural knowledge
    const topUserEntities = retrieved.userEntities.slice(0, 10); // User's personal context
    
    // 3. Assemble prompt
    const systemPrompt = `
=== CORE IDENTITY ===
You are Dot, a warm AI companion. You've been learning and growing alongside users.

=== DOT'S PROCEDURAL KNOWLEDGE ===
${this.formatDotEntities(topDotEntities)}

=== ${userName.toUpperCase()}'S CONTEXT ===
${this.formatUserEntities(topUserEntities)}

${enableGrounding ? `=== WEB SEARCH RESULTS ===\n${this.formatWebResults(retrieved.webResults)}` : ''}
`;
    
    return { systemPrompt, userPrompt: currentTurnText };
  }
  
  private formatDotEntities(entities: ScoredEntity[]): string {
    return entities.map(e => {
      if (e.type === 'MemoryUnit') {
        return `- ${e.title}: ${e.content}`;
      } else if (e.type === 'DerivedArtifact') {
        return `- [Pattern] ${e.title}: ${e.content}`;
      }
      return `- [${e.type}] ${e.title}`;
    }).join('\n');
  }
}
```

### 5.3 Integration into DialogueAgent

**File:** `services/dialogue-service/src/DialogueAgent.ts`

Replace static PromptBuilder with dynamic assembly:

```typescript
// In performSingleSynthesisCallStreaming():

// OLD: Static prompt building
// const promptOutput = await this.promptBuilder.buildPrompt(promptBuildInput);

// NEW: Dynamic prompt assembly
const queryEmbedding = await this.embeddingTool.execute({
  payload: { text: input.finalInputText, userId: input.userId }
});

const dynamicPrompt = await this.dynamicPromptAssembler.assemble(
  queryEmbedding.result.embedding,
  input.userId,
  input.conversationId,
  input.enableGrounding
);

// Use dynamic prompt for LLM call
const llmToolInput = {
  payload: {
    systemPrompt: dynamicPrompt.systemPrompt,
    userMessage: dynamicPrompt.userPrompt,
    // ... rest as before
  }
};
```

## Phase 6: Outcome Tracking & Continuous Learning

### 6.1 Track Decision Outcomes

**File:** `services/dialogue-service/src/OutcomeTracker.ts`

Simple outcome tracking that feeds back into Dot's learning:

```typescript
class OutcomeTracker {
  async recordDecisionOutcome(
    decisionId: string,
    context: {
      userId: string;
      decision: string;
      capabilitiesUsed: string[];
      retrievalQuality: number;
      userEngagement: number;
    }
  ): Promise<void> {
    
    // Store in Redis for recent access
    await this.redis.zadd(
      'dot:decisions:recent',
      Date.now(),
      JSON.stringify({ decisionId, ...context })
    );
    
    // Create a "decision outcome" memory for Dot
    // This will be ingested in next Dot learning cycle
    await this.createDotOutcomeMemory(decisionId, context);
  }
  
  private async createDotOutcomeMemory(decisionId: string, context: any): Promise<void> {
    // Store as conversation message in Dot's special conversation
    const dotConversationId = 'dot-outcome-log';
    
    await this.conversationRepository.addMessage({
      conversation_id: dotConversationId,
      type: 'system',
      content: `Decision ${decisionId}: Used ${context.decision} with ${context.capabilitiesUsed.join(', ')}. Retrieval quality: ${context.retrievalQuality}, User engagement: ${context.userEngagement}`,
      metadata: context
    });
  }
}
```

### 6.2 Batch Processing for Pattern Detection

**File:** `scripts/cron/process-dot-outcomes.ts`

Daily cron that processes accumulated outcomes:

```typescript
// This creates a "conversation" of all recent outcomes
// Then triggers IngestionAnalyst for Dot
async function processDotOutcomes() {
  // Get all outcomes from past 24 hours
  const outcomes = await redis.zrangebyscore(
    'dot:decisions:recent',
    Date.now() - 86400000,
    Date.now()
  );
  
  // Aggregate into a conversation
  const dotConversationId = `dot-outcomes-${Date.now()}`;
  await conversationRepository.create({
    conversation_id: dotConversationId,
    user_id: 'dot-agent-001',
    title: 'Decision Outcomes Analysis',
    status: 'ended'
  });
  
  // Add aggregated outcomes as messages
  for (const outcome of outcomes) {
    await conversationRepository.addMessage({
      conversation_id: dotConversationId,
      type: 'system',
      content: outcome
    });
  }
  
  // Trigger IngestionAnalyst for Dot (EXISTING pipeline)
  await ingestionQueue.add('process-conversation', {
    userId: 'dot-agent-001',
    conversationId: dotConversationId
  });
}
```

## Implementation Sequence

### Sprint 1 (Week 1): Foundation

1. Create Dot user account script
2. Seed initial Dot concepts
3. Add `is_system_agent` field to schema
4. Test: Verify Dot appears in database like regular user

### Sprint 2 (Week 2): Dot Learning Extraction

1. Build DotLearningExtractor
2. Integrate with IngestionAnalyst
3. Test: Process user conversation → verify Dot entities created

### Sprint 3 (Week 3): Dot Insight Cycles

1. Create cron job for Dot insight cycles
2. Test: Run InsightWorker for Dot → verify derived artifacts created
3. Verify Dot's memory_profile updates

### Sprint 4 (Week 4-5): GNN Service

1. Set up Python GNN service infrastructure
2. Implement link prediction model
3. Implement community detection
4. Create graph export script for training

### Sprint 5 (Week 6): GNN Integration

1. Add GNN client to HybridRetrievalTool
2. Enhance graph traversal with predictions
3. Test retrieval quality improvement

### Sprint 6 (Week 7-8): Dynamic Prompt Assembly

1. Build MultiSourceRetriever
2. Build DynamicPromptAssembler
3. Integrate with DialogueAgent
4. A/B test: dynamic vs static prompts

### Sprint 7 (Week 9): Outcome Tracking

1. Build OutcomeTracker
2. Create batch processing script
3. Integrate outcome tracking into DialogueAgent

### Sprint 8 (Week 10): Testing & Optimization

1. End-to-end testing
2. Performance optimization
3. Documentation

## Success Metrics

**Quantitative:**

- Dot accumulates 100+ memory units after 1 month
- Dot's memory_profile shows measurable evolution
- Dynamic prompts improve response relevance by 20%
- GNN link prediction achieves >0.75 AUC

**Qualitative:**

- Dot's derived artifacts contain actionable procedural knowledge
- Users notice more contextual and relevant responses
- Dot's growth events show clear developmental trajectory

## Key Principles

1. **No Parallel Infrastructure:** Use existing repositories, workers, tools
2. **Dot as User:** Treat Dot exactly like a regular user account
3. **Piggyback Everything:** Leverage IngestionAnalyst, InsightWorker, HybridRetrievalTool as-is
4. **Simple Extensions:** Only add thin layers (DotLearningExtractor, MultiSourceRetriever) that coordinate existing components
5. **Same Schema:** Dot's entities use exact same tables as user entities