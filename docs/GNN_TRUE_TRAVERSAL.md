# True GNN Traversal: Message Passing Through Constraint Graph

**Problem with previous approach:** Rule-based intent detection → static graph lookup = NOT real traversal  
**Solution:** Embed user message → semantic seed nodes → message passing → constraint activation

---

## What Makes This True Graph Traversal

### ❌ What I Proposed Before (Wrong)
```
1. Rule-based intent detection ("show me" → media_generation)
2. Static graph lookup: "Give me constraints for media_generation"
3. Return pre-defined constraint set
```

**Problem:** This is just a lookup table, not graph traversal. No learning, no propagation, no message passing.

### ✅ True Graph Traversal (Correct)
```
1. Embed user message → vector in embedding space
2. Semantic similarity search → find seed nodes in constraint graph
3. Message passing: Nodes propagate activation through edges
4. Iterative propagation: Activation spreads to connected nodes
5. Convergence: Final activated nodes = relevant constraints
6. Learning: Edge weights update based on outcomes
```

---

## Architecture: Message Passing GNN

### Stage 1: Semantic Grounding (Find Seed Nodes)

```typescript
/**
 * Stage 1: Embed user message and find seed nodes in constraint graph
 * This is NOT rule-based categorization - it's semantic similarity
 */
class GNNTraversalService {
  /**
   * True graph traversal starting from user message
   */
  async traverseFromUserMessage(
    userMessage: string,
    conversationContext: ConversationContext
  ): Promise<ActivatedConstraints> {
    
    // Step 1: Embed user message (semantic representation)
    const messageEmbedding = await this.embedMessage(userMessage);
    
    // Step 2: Semantic similarity search in Dot's constraint graph
    // Find which constraint/capability nodes are semantically closest to user message
    const seedNodes = await this.findSeedNodes(messageEmbedding);
    
    // Step 3: Message passing from seed nodes through graph
    const activatedNodes = await this.messagePassing(seedNodes);
    
    // Step 4: Extract constraints from activated nodes
    return this.extractConstraints(activatedNodes);
  }
  
  /**
   * Embed user message into vector space
   */
  private async embedMessage(message: string): Promise<number[]> {
    // Use existing embedding infrastructure
    const embeddingTool = new TextEmbeddingTool();
    const result = await embeddingTool.execute({
      payload: { text: message }
    });
    return result.result.embedding;
  }
  
  /**
   * Find seed nodes via semantic similarity (NOT rule-based!)
   */
  private async findSeedNodes(
    messageEmbedding: number[]
  ): Promise<SeedNode[]> {
    // Use Weaviate to find semantically similar constraint nodes
    // This finds nodes based on ACTUAL SEMANTIC MEANING, not keywords
    
    const weaviateService = this.databaseService.weaviate;
    const similarNodes = await weaviateService.semanticSearch(
      messageEmbedding,
      'dot_system_user', // Query Dot's knowledge graph
      {
        limit: 10, // Top 10 semantically closest nodes
        similarityThreshold: 0.3 // Minimum similarity
      }
    );
    
    // Map Weaviate results to graph nodes
    return similarNodes.map(node => ({
      nodeId: node.entity_id,
      nodeType: node.entity_type, // Could be: capability, constraint, concept, etc.
      similarity: node._additional?.certainty || 0,
      initialActivation: node._additional?.certainty || 0 // Seed activation strength
    }));
  }
}
```

### Stage 2: Message Passing (Graph Neural Network)

```typescript
/**
 * Stage 2: Message passing through constraint graph
 * This is the REAL GNN part - nodes influence each other through edges
 */
class MessagePassingEngine {
  /**
   * Propagate activation through graph via message passing
   */
  async propagateActivation(
    seedNodes: SeedNode[],
    graph: DotKnowledgeGraph,
    maxIterations: number = 5
  ): Promise<NodeActivationMap> {
    
    // Initialize: All nodes start with activation 0
    let nodeActivations: NodeActivationMap = new Map();
    
    // Seed initial activation from semantic similarity
    for (const seed of seedNodes) {
      nodeActivations.set(seed.nodeId, {
        activation: seed.initialActivation,
        confidence: seed.similarity,
        iteration: 0
      });
    }
    
    // Iterative message passing
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const nextActivations = new Map<NodeActivationMap>();
      
      // For each node in graph
      for (const node of graph.getAllNodes()) {
        // Collect messages from all neighbors
        const messages = await this.collectMessages(
          node,
          graph,
          nodeActivations,
          iteration
        );
        
        // Aggregate messages to compute new activation
        const newActivation = this.aggregateMessages(
          messages,
          nodeActivations.get(node.id)?.activation || 0,
          graph.getNodeParameters(node.id) // Learnable parameters
        );
        
        // Only propagate if activation is significant
        if (newActivation > this.activationThreshold) {
          nextActivations.set(node.id, {
            activation: newActivation,
            confidence: this.computeConfidence(messages),
            iteration
          });
        }
      }
      
      // Update activation map
      nodeActivations = this.mergeActivations(nodeActivations, nextActivations);
      
      // Check convergence (activations stabilize)
      if (this.hasConverged(nodeActivations, prevActivations)) {
        console.log(`Message passing converged at iteration ${iteration}`);
        break;
      }
      
      prevActivations = new Map(nodeActivations);
    }
    
    return nodeActivations;
  }
  
  /**
   * Collect messages from neighboring nodes
   * Messages are weighted by edge weights (learnable)
   */
  private async collectMessages(
    targetNode: GraphNode,
    graph: DotKnowledgeGraph,
    currentActivations: NodeActivationMap,
    iteration: number
  ): Promise<Message[]> {
    const messages: Message[] = [];
    
    // Get all incoming edges (nodes that connect TO this target node)
    const incomingEdges = await graph.getIncomingEdges(targetNode.id);
    
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source_id;
      const sourceActivation = currentActivations.get(sourceNodeId);
      
      // Only send message if source node is activated
      if (sourceActivation && sourceActivation.activation > 0) {
        // Message strength = source activation × edge weight
        // Edge weight is LEARNABLE and evolves from usage
        const messageStrength = sourceActivation.activation * edge.weight;
        
        messages.push({
          sourceNodeId,
          targetNodeId: targetNode.id,
          strength: messageStrength,
          edgeType: edge.relationship_type, // ENABLES, REQUIRES, APPLIES_TO, etc.
          edgeWeight: edge.weight, // This is what gets updated from learning
          edgeConfidence: edge.confidence || 0.5
        });
      }
    }
    
    return messages;
  }
  
  /**
   * Aggregate messages to compute new node activation
   * This is where learnable aggregation happens
   */
  private aggregateMessages(
    messages: Message[],
    currentActivation: number,
    nodeParams: LearnableNodeParameters
  ): number {
    if (messages.length === 0) {
      // No messages → decay activation
      return currentActivation * nodeParams.decayRate; // Typically 0.9
    }
    
    // Weighted sum of incoming messages
    // Different edge types contribute differently (learnable)
    let aggregatedActivation = 0;
    
    for (const message of messages) {
      // Weight contribution by edge type
      const edgeTypeWeight = nodeParams.edgeTypeWeights[message.edgeType] || 1.0;
      
      aggregatedActivation += message.strength * edgeTypeWeight;
    }
    
    // Combine with current activation (residual connection)
    const combined = (nodeParams.residualWeight * currentActivation) + 
                     ((1 - nodeParams.residualWeight) * aggregatedActivation);
    
    // Apply activation function (ReLU or sigmoid)
    return Math.max(0, Math.min(1.0, this.activationFunction(combined, nodeParams)));
  }
  
  /**
   * Activation function (learnable parameters)
   */
  private activationFunction(
    input: number,
    params: LearnableNodeParameters
  ): number {
    // Can use ReLU, sigmoid, or learnable function
    // For now: ReLU with learnable threshold
    return Math.max(0, input - params.activationThreshold);
  }
}
```

### Stage 3: Constraint Extraction

```typescript
/**
 * Stage 3: Extract constraints from activated nodes
 */
class ConstraintExtractor {
  /**
   * Extract constraints that should be included in prompt
   */
  async extractConstraints(
    activatedNodes: NodeActivationMap
  ): Promise<Constraint[]> {
    const constraints: Constraint[] = [];
    
    // Sort nodes by activation strength
    const sortedNodes = Array.from(activatedNodes.entries())
      .sort((a, b) => b[1].activation - a[1].activation);
    
    for (const [nodeId, activation] of sortedNodes) {
      // Only include if activation is above threshold
      if (activation.activation < this.minActivationThreshold) continue;
      
      // Load full node content from Postgres
      const nodeContent = await this.loadNodeContent(nodeId);
      
      if (nodeContent.type === 'constraint' || 
          nodeContent.type === 'capability' ||
          nodeContent.type === 'guideline') {
        constraints.push({
          id: nodeId,
          type: nodeContent.type,
          content: nodeContent.content,
          title: nodeContent.title,
          activation: activation.activation,
          confidence: activation.confidence,
          source: 'graph_traversal'
        });
      }
    }
    
    // Always include universal constraints (regardless of activation)
    const universalConstraints = await this.getUniversalConstraints();
    constraints.push(...universalConstraints);
    
    return constraints;
  }
}
```

---

## Example: True Traversal Flow

### User Message: "Show me what serenity looks like"

#### Stage 1: Semantic Grounding

```typescript
// Embed message
messageEmbedding = [0.23, -0.45, 0.67, ...] // 1536-dim vector

// Semantic similarity search in Dot's graph
seedNodes = [
  { nodeId: "img_gen_capability", similarity: 0.78, activation: 0.78 }, // "Show me" → image generation
  { nodeId: "visual_content_concept", similarity: 0.65, activation: 0.65 }, // "looks like" → visual concept
  { nodeId: "abstract_concept_handling", similarity: 0.52, activation: 0.52 }, // "serenity" → abstract
]
```

#### Stage 2: Message Passing (Iteration 1)

```typescript
// From seed node "img_gen_capability" (activation: 0.78)
// Follow edges to connected nodes:

Edges from img_gen_capability:
  - ENABLES → "Action: generate_image" (weight: 0.9) → activation: 0.78 × 0.9 = 0.70
  - HAS_CONSTRAINT → "Media: Never Mention Cost" (weight: 1.0) → activation: 0.78 × 1.0 = 0.78
  - HAS_CONSTRAINT → "Media: Ultra-Short Questions" (weight: 0.8) → activation: 0.78 × 0.8 = 0.62
  - REQUIRES → "Media Generation Complete Constraints" (weight: 0.95) → activation: 0.78 × 0.95 = 0.74

// Message passing continues...
// "Media Generation Complete Constraints" node receives messages:
//   - From img_gen_capability: 0.74
//   - Aggregates messages from all PART_OF edges:
//     - PART_OF → "Never Mention Cost" (already activated: 0.78)
//     - PART_OF → "Ignore Cost History" (weight: 0.9) → activation propagates
```

#### Stage 3: Convergence

After 3 iterations:
```
Activated Nodes (sorted by activation):
  1. "Image Generation via Imagen" (capability): 0.82
  2. "Media: Never Mention Cost" (constraint): 0.80
  3. "Media Generation Complete Constraints" (composite): 0.78
  4. "Media: Ultra-Short Questions" (constraint): 0.75
  5. "Media: Use Transition Message" (constraint): 0.72
  6. "Language Matching Mandatory" (universal): 1.0 (always included)
  7. "JSON Structure Constraints" (universal): 1.0 (always included)

Low activation (excluded):
  - "Memory Retrieval Guidelines": 0.15 (below threshold)
  - "View Switch Constraints": 0.08 (below threshold)
  - "Web Search Guidelines": 0.12 (below threshold)
```

#### Result: Only Relevant Constraints

```typescript
// Final prompt includes only:
constraints = [
  "Image Generation via Imagen", // Capability
  "Media Generation Complete Constraints", // Composite (includes 6 rules)
  "Language Matching Mandatory", // Universal
  "JSON Structure Constraints" // Universal
]

// Total: ~1200 tokens (vs 3500 tokens with all constraints)
```

---

## Learning: Edge Weight Updates

### After Conversation Turn

```typescript
/**
 * Update edge weights based on conversation outcome
 */
async learnFromOutcome(
  activatedNodes: NodeActivationMap,
  outcome: ConversationOutcome
): Promise<void> {
  
  // For each edge that was traversed
  for (const [nodeId, activation] of activatedNodes) {
    const outgoingEdges = await this.graph.getOutgoingEdges(nodeId);
    
    for (const edge of outgoingEdges) {
      // Compute reward signal
      const reward = this.computeReward(outcome, nodeId);
      
      // Update edge weight (reinforcement learning)
      const learningRate = 0.1;
      const weightDelta = learningRate * (reward - edge.success_rate);
      const newWeight = Math.max(0.0, Math.min(1.0, edge.weight + weightDelta));
      
      // Update success rate
      const newSuccessRate = (edge.success_rate * 0.9) + (reward * 0.1);
      
      // Persist to Neo4j
      await this.updateEdgeWeight(edge.id, newWeight, newSuccessRate);
    }
  }
}
```

### Example: Learning Pattern

**Turn 1:**
```
User: "Show me serenity"
Seed: "img_gen_capability" (similarity: 0.78)
Traversal: img_gen → "Never Mention Cost" (edge weight: 0.8)
Outcome: Good (user happy, no cost mentioned)
Update: edge weight 0.8 → 0.85 (strengthen)
```

**Turn 2:**
```
User: "What does peace look like?"
Seed: "img_gen_capability" (similarity: 0.75)
Traversal: img_gen → "Never Mention Cost" (edge weight: 0.85, stronger!)
Outcome: Good (cost not mentioned)
Update: edge weight 0.85 → 0.88
```

**Turn 10:**
```
Edge weight converged to 0.95
Result: "Never Mention Cost" always strongly activated for image requests
System learned: This constraint is critical for media generation
```

---

## Key Differences from Previous Approach

### ❌ Previous (Rule-Based)
```typescript
// Static rule matching
if (message.includes("show me")) {
  intent = "media_generation";
  constraints = getConstraintsForIntent(intent); // Lookup table
}
```

### ✅ True GNN Traversal
```typescript
// Semantic embedding → similarity → message passing
const embedding = await embed(message);
const seedNodes = await semanticSearch(embedding); // Finds nodes by meaning
const activated = await messagePassing(seedNodes); // Propagates through graph
const constraints = extract(activated); // Based on actual graph structure
```

---

## Implementation Details

### Neo4j Query for Message Passing

```cypher
// Find nodes connected to seed nodes via weighted edges
MATCH (seed:Concept)-[r:ENABLES|HAS_CONSTRAINT|REQUIRES]->(target:Concept)
WHERE seed.entity_id IN $seedNodeIds
  AND r.weight > $minEdgeWeight
WITH target, 
     sum(r.weight * $seedActivations[seed.entity_id]) as incomingActivation
WHERE incomingActivation > $activationThreshold
RETURN target.entity_id as nodeId,
       incomingActivation as activation
ORDER BY activation DESC
```

### Weaviate Schema for Dot's Knowledge

```json
{
  "class": "DotKnowledgeItem",
  "description": "Dot's self-knowledge (capabilities, constraints, concepts)",
  "properties": [
    { "name": "entity_id", "dataType": ["uuid"] },
    { "name": "user_id", "dataType": ["string"], "defaultValue": "dot_system_user" },
    { "name": "entity_type", "dataType": ["string"] }, // capability, constraint, concept
    { "name": "content", "dataType": ["text"] },
    { "name": "title", "dataType": ["text"] }
  ]
}
```

---

## Benefits of True Traversal

1. **Semantic Understanding**: Finds constraints by meaning, not keywords
2. **Automatic Discovery**: Discovers constraint relationships through graph structure
3. **Adaptive**: Edge weights evolve → system adapts
4. **Context-Aware**: Same message in different contexts → different activations
5. **Scalable**: Adding new constraints automatically integrates (no code changes)

---

## Integration Point

```typescript
// In PromptBuilder.buildPrompt()
const gnnTraversal = new GNNTraversalService(this.hybridRetrievalTool);

// True graph traversal (not rule-based!)
const activatedConstraints = await gnnTraversal.traverseFromUserMessage(
  input.finalInputText,
  { viewContext, conversationHistory, ... }
);

// Build prompt from activated constraints only
const operationalConfig = this.buildFromActivatedConstraints(activatedConstraints);
```

This is **real graph traversal** - embedding → semantic search → message passing → learning. Not rule-based categorization.


