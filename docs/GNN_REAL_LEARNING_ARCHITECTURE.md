# Real GNN Architecture: Self-Evolving Agent Knowledge

**Philosophy:** The GNN should **learn** and **evolve**, not just retrieve. Graph neural networks learn patterns, optimize edges, and improve over time.

---

## What Makes This a Real GNN (Not Just Graph Queries)

### Traditional Graph Query (What I Proposed Before)
- Static retrieval: "Give me constraints for intent X"
- Fixed relationships: Edge weights don't change
- Manual updates: Developer changes graph structure
- **Problem:** No learning, no evolution

### Real GNN (What We Should Build)
- **Dynamic edge weights:** Learn which constraints are most important
- **Pattern discovery:** Automatically find new constraint relationships
- **Outcome-based optimization:** Update graph based on response quality
- **Composition learning:** Learn optimal prompt assembly patterns
- **Self-improving:** Graph structure evolves from usage

---

## Core GNN Architecture

### 1. Graph Structure with Learnable Parameters

**Neo4j Schema Enhancement:**

```cypher
// Add learnable properties to edges
CREATE CONSTRAINT edge_learnable_props IF NOT EXISTS FOR ()-[r]-() 
REQUIRE r.weight IS NOT NULL, r.confidence IS NOT NULL;

// Edge properties that evolve:
- weight: Float (0.0-1.0) - How important this relationship is
- confidence: Float (0.0-1.0) - How confident we are in this relationship
- success_rate: Float (0.0-1.0) - % of times this edge led to good outcomes
- usage_count: Integer - How many times this edge was traversed
- last_updated: DateTime - When this edge was last modified
- error_rate: Float (0.0-1.0) - % of times this edge led to failures
```

### 2. Message Passing Between Nodes

**GNN Message Passing Algorithm:**

```typescript
/**
 * Graph Neural Network: Message Passing for Constraint Selection
 * 
 * Instead of simple retrieval, the GNN learns optimal paths through
 * the constraint graph by passing messages between nodes.
 */
class GNNConstraintSelector {
  /**
   * Message Passing: Learn which constraints to activate
   */
  async computeConstraintActivation(
    intentNode: ConceptNode,
    graph: DotKnowledgeGraph
  ): Promise<ActivatedConstraints> {
    
    // Step 1: Initialize node states
    const nodeStates = this.initializeNodeStates(graph, intentNode);
    
    // Step 2: Message Passing (iterative, learns patterns)
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // For each constraint node, aggregate messages from neighbors
      for (const constraintNode of graph.constraintNodes) {
        const messages = this.collectMessages(
          constraintNode,
          graph,
          nodeStates
        );
        
        // Update node state based on messages (learnable weights)
        nodeStates[constraintNode.id] = this.aggregateMessages(
          messages,
          nodeStates[constraintNode.id],
          constraintNode.learnableParameters
        );
      }
      
      // Check convergence
      if (this.hasConverged(nodeStates)) break;
    }
    
    // Step 3: Extract activated constraints (nodes with high activation)
    return this.extractActivatedConstraints(nodeStates, this.threshold);
  }
  
  /**
   * Collect messages from neighboring nodes
   * Messages are weighted by edge weights (learnable)
   */
  private collectMessages(
    node: ConceptNode,
    graph: DotKnowledgeGraph,
    nodeStates: NodeStateMap
  ): Message[] {
    const messages: Message[] = [];
    
    // Get all incoming edges
    const incomingEdges = graph.getIncomingEdges(node.id);
    
    for (const edge of incomingEdges) {
      const neighborState = nodeStates[edge.sourceNodeId];
      const edgeWeight = edge.weight; // Learnable parameter
      
      // Message = neighbor state × edge weight
      messages.push({
        sourceNodeId: edge.sourceNodeId,
        content: neighborState.activation * edgeWeight,
        edgeType: edge.relationshipType
      });
    }
    
    return messages;
  }
  
  /**
   * Aggregate messages to update node state
   * Uses learnable aggregation function
   */
  private aggregateMessages(
    messages: Message[],
    currentState: NodeState,
    learnableParams: LearnableParameters
  ): NodeState {
    // Weighted sum of messages (learnable aggregation)
    const aggregated = messages.reduce((sum, msg) => {
      return sum + (msg.content * learnableParams.messageWeight);
    }, currentState.activation);
    
    // Apply activation function (learnable)
    const newActivation = this.activationFunction(
      aggregated,
      learnableParams
    );
    
    return {
      activation: newActivation,
      confidence: this.computeConfidence(messages),
      timestamp: Date.now()
    };
  }
}
```

### 3. Learning from Outcomes

**Outcome-Based Edge Weight Updates:**

```typescript
/**
 * After each conversation turn, update edge weights based on outcome
 */
class GNNLearningService {
  /**
   * Update graph based on actual conversation outcome
   */
  async learnFromOutcome(
    conversationTurn: ConversationTurn,
    activatedConstraints: ActivatedConstraints,
    outcome: ConversationOutcome
  ): Promise<void> {
    
    // For each constraint that was activated
    for (const constraint of activatedConstraints) {
      // Find edges that led to this constraint being activated
      const activationPath = this.findActivationPath(
        conversationTurn.intent,
        constraint
      );
      
      // Update edge weights based on outcome
      for (const edge of activationPath) {
        await this.updateEdgeWeight(edge, outcome);
      }
    }
    
    // Discover new relationships if pattern detected
    await this.discoverNewRelationships(conversationTurn, outcome);
  }
  
  /**
   * Update edge weight based on outcome quality
   */
  private async updateEdgeWeight(
    edge: GraphEdge,
    outcome: ConversationOutcome
  ): Promise<void> {
    const currentWeight = edge.weight;
    const currentSuccessRate = edge.success_rate || 0.5;
    
    // Compute reward signal
    const reward = this.computeReward(outcome);
    
    // Update success rate (moving average)
    const newSuccessRate = (currentSuccessRate * 0.9) + (reward * 0.1);
    
    // Update edge weight (reinforcement learning)
    // If good outcome → increase weight
    // If bad outcome → decrease weight
    const weightDelta = this.learningRate * (reward - currentSuccessRate);
    const newWeight = Math.max(0.0, Math.min(1.0, currentWeight + weightDelta));
    
    // Update in Neo4j
    await this.neo4j.query(`
      MATCH ()-[r:${edge.relationshipType}]-()
      WHERE r.relationship_id = $edgeId
      SET 
        r.weight = $newWeight,
        r.success_rate = $newSuccessRate,
        r.usage_count = r.usage_count + 1,
        r.last_updated = datetime()
      RETURN r
    `, {
      edgeId: edge.id,
      newWeight,
      newSuccessRate
    });
  }
  
  /**
   * Compute reward signal from conversation outcome
   */
  private computeReward(outcome: ConversationOutcome): number {
    let reward = 0.5; // Neutral baseline
    
    // Positive signals (increase reward)
    if (outcome.userEngagement === 'high') reward += 0.3;
    if (outcome.responseQuality === 'good') reward += 0.2;
    if (outcome.followUpMessage) reward += 0.1; // User continued conversation
    if (outcome.constraintAdherence === 'high') reward += 0.1;
    
    // Negative signals (decrease reward)
    if (outcome.constraintViolations > 0) reward -= 0.2;
    if (outcome.userEngagement === 'low') reward -= 0.2;
    if (outcome.responseQuality === 'poor') reward -= 0.3;
    if (outcome.errorOccurred) reward -= 0.4;
    
    return Math.max(0.0, Math.min(1.0, reward));
  }
  
  /**
   * Discover new relationships from successful patterns
   */
  private async discoverNewRelationships(
    conversationTurn: ConversationTurn,
    outcome: ConversationOutcome
  ): Promise<void> {
    // If outcome was good and we notice a pattern
    if (outcome.reward > 0.7) {
      // Check if there's a constraint combination we haven't seen before
      const constraintSet = conversationTurn.activatedConstraints.map(c => c.id);
      
      // Query: Has this constraint combination worked well before?
      const existingPattern = await this.findSimilarPattern(constraintSet);
      
      if (!existingPattern) {
        // New successful pattern discovered!
        // Create a composite concept node for this constraint combination
        await this.createCompositeConcept(constraintSet, outcome);
        
        console.log(`🎯 GNN Discovery: New successful constraint pattern: ${constraintSet.join(', ')}`);
      }
    }
  }
}
```

### 4. Prompt Assembly Optimization

**Learn Optimal Prompt Composition:**

```typescript
/**
 * GNN learns best way to assemble prompts from components
 */
class GNNPromptComposer {
  /**
   * Learn optimal section ordering based on outcomes
   */
  async optimizePromptComposition(
    context: ConversationContext,
    sections: PromptSection[]
  ): Promise<OptimizedPrompt> {
    
    // Query graph: What section order works best for this context?
    const learnedOrder = await this.queryOptimalSectionOrder(context);
    
    // If learned order exists, use it
    if (learnedOrder) {
      return this.assemblePrompt(sections, learnedOrder);
    }
    
    // Otherwise, try different orders and learn
    const orders = this.generateCandidateOrders(sections);
    const bestOrder = await this.evaluateOrders(orders, context);
    
    // Store successful order in graph for future use
    await this.storeLearnedOrder(context, bestOrder);
    
    return this.assemblePrompt(sections, bestOrder);
  }
  
  /**
   * Query graph for learned optimal section order
   */
  private async queryOptimalSectionOrder(
    context: ConversationContext
  ): Promise<SectionOrder | null> {
    // Find similar contexts in graph
    const similarContexts = await this.findSimilarContexts(context);
    
    // Get section orders that worked well for similar contexts
    const successfulOrders = similarContexts
      .filter(c => c.success_rate > 0.7)
      .map(c => c.section_order);
    
    if (successfulOrders.length > 0) {
      // Return most successful order
      return this.mostFrequentOrder(successfulOrders);
    }
    
    return null;
  }
}
```

---

## Integration with Existing System

### Enhanced PromptBuilder (Not Replaced)

```typescript
class PromptBuilder {
  private gnnConstraintSelector: GNNConstraintSelector;
  private gnnLearningService: GNNLearningService;
  
  public async buildPrompt(input: PromptBuildInput): Promise<PromptBuildOutput> {
    // Step 1: Detect intent (unchanged)
    const intent = this.detectIntent(input.finalInputText, input.viewContext);
    
    // Step 2: GNN selects constraints (NEW - learns optimal selection)
    const activatedConstraints = await this.gnnConstraintSelector
      .computeConstraintActivation(intent, this.dotKnowledgeGraph);
    
    // Step 3: Build prompt with selected constraints (modified)
    const operationalConfig = this.buildFromConstraints(activatedConstraints);
    
    // Step 4: Assemble prompt (GNN optimizes section order)
    const optimizedPrompt = await this.gnnPromptComposer
      .optimizePromptComposition(context, sections);
    
    return optimizedPrompt;
  }
  
  /**
   * After response, learn from outcome
   */
  public async learnFromConversationTurn(
    turn: ConversationTurn,
    outcome: ConversationOutcome
  ): Promise<void> {
    // GNN updates edge weights based on what worked
    await this.gnnLearningService.learnFromOutcome(
      turn,
      turn.activatedConstraints,
      outcome
    );
  }
}
```

### Outcome Collection

```typescript
/**
 * Collect conversation outcomes for GNN learning
 */
class OutcomeCollector {
  async collectOutcome(
    conversationId: string,
    messageId: string
  ): Promise<ConversationOutcome> {
    // Collect metrics
    const outcome: ConversationOutcome = {
      // User engagement signals
      userEngagement: await this.measureUserEngagement(conversationId),
      responseQuality: await this.measureResponseQuality(messageId),
      followUpMessage: await this.checkFollowUp(conversationId, messageId),
      
      // Constraint adherence
      constraintViolations: await this.detectConstraintViolations(messageId),
      constraintAdherence: await this.measureConstraintAdherence(messageId),
      
      // System metrics
      errorOccurred: await this.checkErrors(messageId),
      latency: await this.getLatency(messageId),
      
      // Reward signal (computed)
      reward: 0 // Computed by GNNLearningService
    };
    
    return outcome;
  }
  
  private async measureUserEngagement(conversationId: string): Promise<'high' | 'medium' | 'low'> {
    // Check: Did user respond quickly? Did conversation continue?
    const nextMessage = await this.conversationRepo.getNextMessage(conversationId);
    const timeToResponse = nextMessage?.created_at - Date.now();
    
    if (nextMessage && timeToResponse < 60000) return 'high'; // Responded within 1 min
    if (nextMessage && timeToResponse < 300000) return 'medium'; // Responded within 5 min
    return 'low';
  }
  
  private async measureResponseQuality(messageId: string): Promise<'good' | 'neutral' | 'poor'> {
    // Check: Was response length appropriate? No errors? Proper JSON?
    const message = await this.conversationRepo.getMessage(messageId);
    
    // Heuristics for quality
    if (message.content.length < 50) return 'poor'; // Too short
    if (message.error) return 'poor';
    if (this.hasJsonErrors(message.content)) return 'poor';
    
    return 'good';
  }
  
  private async detectConstraintViolations(messageId: string): Promise<number> {
    const message = await this.conversationRepo.getMessage(messageId);
    const violations = [];
    
    // Check for constraint violations
    if (message.content.includes('$') || message.content.includes('cost')) {
      violations.push('media_cost_mention'); // Violated "Never Mention Cost"
    }
    
    if (message.content.includes('```json')) {
      violations.push('json_code_fence'); // Violated "No Code Fences"
    }
    
    // ... more violation checks
    
    return violations.length;
  }
}
```

---

## Self-Evolution Examples

### Example 1: Learning Optimal Constraint Sets

**Week 1:**
```
Intent: memory_query
GNN activates: 15 constraints
Outcome: Good response, high engagement
Learning: All 15 constraints validated ✅
```

**Week 2:**
```
Intent: memory_query  
GNN activates: 15 constraints (same as Week 1)
Outcome: Good response, but user asks follow-up clarifying question
Learning: Need to add "Clarification Guidelines" constraint
Graph update: Add edge memory_query → clarification_guidelines
```

**Week 3:**
```
Intent: memory_query
GNN activates: 16 constraints (includes new clarification_guidelines)
Outcome: Excellent - user got clear answer, no follow-up needed
Learning: Clarification guidelines important for memory queries ✅
Edge weight update: clarification_guidelines weight += 0.1
```

### Example 2: Discovering Composite Patterns

**Pattern Discovery:**
```
Observed: When users ask "show me [abstract concept]"
Successful pattern:
  - Image generation capability (required)
  - Media cost constraints (critical - users hate cost mentions)
  - Language matching (always required)
  
GNN creates composite: "Abstract Concept Visualization Pattern"
Stores as single concept node for faster future retrieval
```

**Future Use:**
```
User: "show me what peace looks like"
GNN: Activates "Abstract Concept Visualization Pattern" (one node, three constraints)
Result: Faster constraint selection, proven pattern
```

### Example 3: Learning Section Order

**Discovery:**
```
Context: First-time user, asks about capabilities
Tried order: Core Identity → Capabilities → Constraints
Outcome: User confused (too much info at once)

Tried order: Capabilities → Examples → Core Identity  
Outcome: Much better (user engaged, asked follow-up)

GNN stores: For "new_user + capability_question" → Use second order
Future: Automatically uses optimal order
```

---

## Implementation Architecture

### Component Structure

```
GNNSystem/
├── GNNConstraintSelector.ts      # Message passing for constraint activation
├── GNNLearningService.ts          # Update edge weights from outcomes
├── GNNPromptComposer.ts          # Optimize prompt composition
├── OutcomeCollector.ts            # Collect metrics for learning
├── GraphUpdater.ts                # Update Neo4j edge properties
└── PatternDiscovery.ts            # Discover new constraint relationships
```

### Data Flow

```
1. User Message
   ↓
2. Intent Detection (fast, rule-based)
   ↓
3. GNN Message Passing (learns which constraints to activate)
   ↓
4. Prompt Assembly (GNN optimizes section order)
   ↓
5. LLM Response
   ↓
6. Outcome Collection (engagement, quality, violations)
   ↓
7. GNN Learning (update edge weights, discover patterns)
   ↓
8. Graph Updated (Neo4j edge properties modified)
   ↓
9. Future requests benefit from learned patterns
```

---

## Key Differentiators (Why This is Real GNN)

### ✅ Learning, Not Just Retrieval
- Edge weights update based on outcomes
- Graph structure evolves (new relationships discovered)
- Optimal patterns emerge over time

### ✅ Message Passing
- Nodes influence each other through weighted edges
- Activation spreads through graph
- Convergence finds optimal constraint sets

### ✅ Outcome-Based Optimization
- Every conversation turn teaches the system
- Good outcomes strengthen edges
- Bad outcomes weaken edges

### ✅ Pattern Discovery
- Automatically finds successful constraint combinations
- Creates composite concepts for proven patterns
- No manual updates needed

### ✅ Self-Improving
- Graph gets better with every conversation
- Optimal paths emerge naturally
- System adapts to user behavior

---

## Practical Benefits

1. **Reduced Prompt Size** (50% reduction)
   - Only activates relevant constraints
   - GNN learns which constraints are actually needed

2. **Better Constraint Adherence**
   - GNN learns which constraint combinations work
   - Automatically excludes constraints that don't help

3. **Adaptive to User Patterns**
   - Different users → Different optimal constraint sets
   - GNN learns per-user patterns over time

4. **Discover Hidden Patterns**
   - "When users mention X, always need constraint Y"
   - Discovers relationships humans didn't see

5. **Continuous Improvement**
   - System gets better without code changes
   - Edge weights converge to optimal values

---

## Implementation Phases

### Phase 1: Foundation (3 weeks)
1. **Neo4j schema enhancement** (edge properties)
2. **GNNConstraintSelector** (message passing)
3. **Basic learning loop** (edge weight updates)

### Phase 2: Outcome Collection (2 weeks)
1. **OutcomeCollector** (metrics collection)
2. **Reward signal computation**
3. **Edge weight update pipeline**

### Phase 3: Pattern Discovery (2 weeks)
1. **PatternDiscovery** (find successful combinations)
2. **Composite concept creation**
3. **Graph structure evolution**

### Phase 4: Prompt Optimization (2 weeks)
1. **GNNPromptComposer** (section order learning)
2. **Integration with PromptBuilder**
3. **A/B testing framework**

---

## This is Real GNN Because:

1. **Learnable Parameters:** Edge weights update from experience
2. **Message Passing:** Nodes influence each other through graph
3. **Outcome-Based Learning:** Rewards shape graph structure
4. **Pattern Discovery:** New relationships emerge automatically
5. **Self-Evolution:** Graph structure improves over time

Not just graph queries - **actual neural network learning** through the graph structure.


