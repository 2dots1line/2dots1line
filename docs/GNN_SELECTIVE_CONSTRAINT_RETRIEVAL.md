# Selective Constraint Retrieval: Practical GNN for Daily Conversations

**Goal:** Reduce prompt bloat by dynamically retrieving only relevant constraints/capabilities per turn  
**Principle:** Add graph queries as optional enhancement, keep PromptBuilder intact  
**Benefit:** Smaller prompts = faster responses, lower cost, better LLM performance

---

## Problem Statement

### Current System Prompt Size

**DialogueAgent typical prompt:**
```
Section 1: Core Identity (~800 tokens)
  - Dot's persona, archetype, core purpose
  - 13 fundamental principles (all included always)
  
Section 2: Operational Config (~2000 tokens)
  - Language matching (always included)
  - Memory retrieval decision hierarchy (always included)
  - JSON structure constraints (always included)
  - Media generation constraints (included even if no media request)
  - View switch constraints (included even if no view transition)
  - Web search guidelines (included even if no web search)
  - Cosmos Quest requirements (included even if no quest)
  
Section 3: Dynamic Context (~500-3000 tokens)
  - User memory profile
  - Conversation history
  
Section 4: Current Turn (~100-500 tokens)
  - User message
```

**Total: ~3500-6500 tokens** per request, where ~2500 tokens are **static constraints** that may not be relevant to this specific turn.

---

## Solution: Context-Aware Constraint Retrieval

### Core Idea

Instead of including ALL constraints in every prompt, **query Dot's graph** to retrieve only constraints relevant to the detected intent/context of this specific turn.

### Example Scenarios

#### Scenario 1: Simple Memory Question
**User:** "Tell me about my trip to Japan"

**Current System:**
- Includes ALL constraints (~2500 tokens of potentially irrelevant rules)
- Prompt: 3500 tokens total

**With Selective Retrieval:**
```
1. Detect intent: memory_query (from user message)
2. Query graph: 
   - "Memory Retrieval via HRT" capability
   - "Decision Hierarchy Complete" (memory-specific)
   - "Key Phrase Generation Complete Guidelines"
   - Language Matching (always required)
3. Exclude:
   - Media generation constraints (not relevant)
   - View switch constraints (not relevant)
   - Web search guidelines (not relevant)
   - Cosmos Quest requirements (not relevant)
4. Prompt: ~1500 tokens (43% reduction)
```

#### Scenario 2: Image Generation Request
**User:** "Show me what serenity looks like"

**Current System:**
- Includes ALL constraints
- Prompt: 3500 tokens

**With Selective Retrieval:**
```
1. Detect intent: media_generation (from "show me")
2. Query graph:
   - "Image Generation via Imagen" capability
   - "Media Generation Complete Constraints" (6 rules)
   - Language Matching (always required)
   - JSON structure constraints (always required)
3. Exclude:
   - Memory retrieval guidelines (not relevant)
   - View switch constraints (not relevant)
   - Web search guidelines (not relevant)
4. Prompt: ~1200 tokens (66% reduction)
```

#### Scenario 3: Capability Question
**User:** "What can you do?"

**Current System:**
- Includes ALL constraints (most not relevant)
- Prompt: 3500 tokens

**With Selective Retrieval:**
```
1. Detect intent: self_reflection (user asking about Dot)
2. Query graph:
   - "Agent Capabilities" community (all 9 capabilities)
   - "Core Identity" (persona, purpose)
   - Language Matching (always required)
3. Exclude:
   - All operational constraints (not relevant)
   - Memory retrieval rules (not relevant)
   - JSON structure (not needed for explanation)
4. Prompt: ~800 tokens (77% reduction)
```

---

## Implementation Design

### Phase 1: Intent Detection + Selective Retrieval

**New Component:** `ConstraintSelectorService`

```typescript
class ConstraintSelectorService {
  /**
   * Analyzes turn context and retrieves only relevant constraints
   */
  async selectConstraints(
    userId: string,
    userMessage: string,
    viewContext: ViewContext,
    conversationHistory: Message[]
  ): Promise<RelevantConstraints> {
    
    // Step 1: Detect primary intent (lightweight, no LLM needed)
    const intent = this.detectIntent(userMessage, viewContext, conversationHistory);
    
    // Step 2: Query Dot's graph for relevant constraints
    const relevantConstraints = await this.queryGraphForConstraints(
      intent,
      userId // Use dot_system_user for Dot's knowledge
    );
    
    // Step 3: Always include universal constraints
    const universalConstraints = await this.getUniversalConstraints(userId);
    
    return {
      capabilities: relevantConstraints.capabilities,
      decisionRules: relevantConstraints.decisionRules,
      constraints: [...universalConstraints, ...relevantConstraints.constraints],
      guidelines: relevantConstraints.guidelines
    };
  }
  
  /**
   * Lightweight intent detection (rule-based, fast)
   */
  private detectIntent(
    userMessage: string,
    viewContext: ViewContext,
    history: Message[]
  ): ConversationIntent {
    const message = userMessage.toLowerCase();
    
    // Media generation triggers
    if (message.match(/\b(show me|visualize|generate.*image|make.*video)\b/i)) {
      return { type: 'media_generation', subtype: this.detectMediaType(message) };
    }
    
    // Self-reflection triggers
    if (message.match(/\b(what.*can.*you|how.*do.*you|your.*capabilities|what.*are.*you)\b/i)) {
      return { type: 'self_reflection' };
    }
    
    // Memory query triggers
    if (message.match(/\b(tell me.*about|remember|my|I.*did|I.*went|I.*had)\b/i) ||
        this.hasPastEntityReferences(message, history)) {
      return { type: 'memory_query' };
    }
    
    // View switch triggers
    if (message.match(/\b(go.*to|switch.*to|show.*me.*cosmos|dashboard)\b/i)) {
      return { type: 'view_transition' };
    }
    
    // Web search triggers
    if (message.match(/\b(current|latest|recent|news|today|2025)\b/i) &&
        !this.isPersonalQuestion(message)) {
      return { type: 'web_search' };
    }
    
    // Default: general conversation
    return { type: 'general_conversation' };
  }
  
  /**
   * Query Dot's graph for constraints relevant to this intent
   */
  private async queryGraphForConstraints(
    intent: ConversationIntent,
    userId: string
  ): Promise<GraphConstraints> {
    // Use existing HRT infrastructure with dot_system_user
    const keyPhrases = this.intentToKeyPhrases(intent);
    
    const graphResults = await this.hybridRetrievalTool.execute({
      keyPhrasesForRetrieval: keyPhrases,
      userId: 'dot_system_user', // Query Dot's own knowledge graph
      userParameters: this.getDotSystemParameters()
    });
    
    // Extract constraints from retrieved concepts
    return this.extractConstraintsFromGraphResults(graphResults, intent);
  }
  
  /**
   * Always include universal constraints (can't be skipped)
   */
  private async getUniversalConstraints(userId: string): Promise<Constraint[]> {
    // These are ALWAYS needed, no matter the intent
    return [
      { type: 'language_matching', content: '...' }, // Always required
      { type: 'json_structure', content: '...' },   // Always required
      { type: 'core_identity', content: '...' }     // Always required
    ];
  }
}
```

### Integration with PromptBuilder

**Modified PromptBuilder.buildPrompt():**

```typescript
public async buildPrompt(input: PromptBuildInput): Promise<PromptBuildOutput> {
  // ... existing data fetching ...
  
  // NEW: Selective constraint retrieval (optional, can be disabled)
  let operationalConfig: string;
  
  if (this.configService.getFeatureFlag('enable_selective_constraints')) {
    // Use graph to retrieve only relevant constraints
    const constraintSelector = new ConstraintSelectorService(
      this.hybridRetrievalTool,
      this.configService
    );
    
    const relevantConstraints = await constraintSelector.selectConstraints(
      userId,
      input.finalInputText,
      input.viewContext,
      conversationHistory
    );
    
    operationalConfig = this.buildOperationalConfigFromConstraints(
      relevantConstraints
    );
    
    console.log(`📉 PromptBuilder - Selective constraints: ${relevantConstraints.constraints.length} retrieved (vs ${ALL_CONSTRAINTS.length} total)`);
  } else {
    // Fallback: Use existing template (full constraints)
    operationalConfig = await this.getCachedSection(
      'operational_config',
      userId,
      user.name,
      operationalConfigTpl
    );
  }
  
  // Rest of prompt building unchanged...
  const systemPrompt = [section1, operationalConfig, section3].join('\n\n');
  
  return { systemPrompt, userPrompt, conversationHistory };
}
```

---

## Self-Evolution Through Usage Tracking

### Learning What Works

**Track constraint usage:**
```typescript
interface ConstraintUsageMetrics {
  constraint_id: string;
  intent_type: string;
  times_retrieved: number;
  times_used_in_prompt: number;
  response_quality_score?: number; // Future: user feedback
  response_latency_ms?: number;
}

// Store in Neo4j as edge properties or PostgreSQL table
```

**Evolution Strategy:**
1. **Track which constraints are retrieved** for each intent type
2. **Measure response quality** (user engagement, conversation continuation)
3. **Identify underused constraints** (retrieved but not actually needed)
4. **Identify missing constraints** (intent detected but wrong constraints retrieved)
5. **Update constraint-to-intent mappings** in graph based on learned patterns

### Example: Learning Pattern

**Week 1:**
- "Memory query" intent → Retrieves 15 constraints
- Analysis: Only 8 constraints actually appear in successful responses
- Action: Update graph to reduce constraint set for memory queries

**Week 2:**
- "Media generation" intent → Retrieves 10 constraints
- Analysis: Users complain about cost mentions (constraint not working)
- Action: Strengthen "Never Mention Cost" constraint importance_score

**Week 3:**
- "Self-reflection" intent → Retrieves capability list
- Analysis: Users find answers incomplete
- Action: Add missing capability (e.g., "Document Analysis") to graph

---

## Practical Benefits (Measurable)

### 1. Reduced Prompt Size

**Current Average:** ~4000 tokens  
**With Selective Retrieval:** ~1500-2000 tokens (50% reduction)

**Impact:**
- **Latency:** 200-300ms faster (smaller prompt = faster LLM processing)
- **Cost:** 50% lower token costs per request
- **Quality:** LLM focuses on relevant constraints (less distraction)

### 2. Self-Improvement

**Track metrics:**
- Which constraints are actually used (vs. just retrieved)
- Response quality by constraint set
- User satisfaction by intent type

**Evolution:**
- Graph learns optimal constraint sets per intent
- System automatically improves without code changes

### 3. Predictable Behavior

**Current:** System prompt is large, LLM may miss constraints  
**With Graph:** Only relevant constraints → More predictable adherence

---

## Implementation Roadmap

### Sprint 1: Foundation (2 weeks)
1. **Complete Dot seed script**
   - Seed all constraints as Concepts
   - Create capability nodes
   - Establish intent → constraint relationships

2. **Intent detection (rule-based)**
   - Simple pattern matching
   - Fast (<10ms)
   - No LLM needed

3. **ConstraintSelectorService**
   - Query Dot's graph via HRT
   - Extract relevant constraints
   - Fallback to full template if query fails

### Sprint 2: Integration (1 week)
1. **Modify PromptBuilder**
   - Add optional selective constraint path
   - Feature flag: `enable_selective_constraints`
   - Metrics logging

2. **A/B Testing**
   - 10% traffic: Selective constraints
   - 90% traffic: Full template (baseline)
   - Compare: latency, cost, response quality

### Sprint 3: Learning Loop (2 weeks)
1. **Usage tracking**
   - Log which constraints retrieved
   - Log which constraints actually used
   - Store in PostgreSQL/Neo4j

2. **Analysis dashboard**
   - Show constraint usage patterns
   - Identify optimization opportunities
   - Manual refinement of intent → constraint mappings

### Sprint 4: Auto-Improvement (Future)
1. **Automatic constraint set optimization**
   - Analyze usage patterns
   - Suggest constraint set changes
   - Human review before applying

---

## Risk Mitigation

### Fallback Strategy

```typescript
async selectConstraints(...): Promise<RelevantConstraints> {
  try {
    // Try graph retrieval
    const graphConstraints = await this.queryGraphForConstraints(...);
    
    // Validate: Must have minimum required constraints
    if (this.validateMinimumConstraints(graphConstraints)) {
      return graphConstraints;
    }
    
    // Fallback: Use full template
    console.warn('Graph query incomplete, falling back to full template');
    return this.getFullConstraintTemplate();
    
  } catch (error) {
    // Always fallback on error
    console.error('Graph query failed, using full template:', error);
    return this.getFullConstraintTemplate();
  }
}
```

### Validation

```typescript
function validateMinimumConstraints(constraints: RelevantConstraints): boolean {
  // Must have these always
  const required = [
    'language_matching',
    'json_structure',
    'core_identity'
  ];
  
  return required.every(req => 
    constraints.constraints.some(c => c.type === req)
  );
}
```

### Monitoring

- **Alert if:** Graph query latency >200ms
- **Alert if:** Fallback rate >5%
- **Alert if:** Response quality drops (user engagement metrics)

---

## Example: Real-World Usage

### Before (Current System)

```
User: "What can you do?"

System Prompt (3500 tokens):
  - Dot's full persona (800 tokens)
  - ALL 13 fundamental principles (400 tokens)
  - Memory retrieval guidelines (500 tokens) ← NOT RELEVANT
  - Media generation constraints (300 tokens) ← NOT RELEVANT
  - View switch rules (200 tokens) ← NOT RELEVANT
  - Web search guidelines (200 tokens) ← NOT RELEVANT
  - Cosmos Quest requirements (300 tokens) ← NOT RELEVANT
  - Language matching (100 tokens) ✅ RELEVANT
  - JSON structure (100 tokens) ✅ RELEVANT
  - Dynamic context (600 tokens)

LLM Response: Generic list of capabilities (works, but verbose)
Latency: ~2.5s
Cost: $0.014 (4000 tokens × $3.50/1M)
```

### After (Selective Retrieval)

```
User: "What can you do?"

Intent Detected: self_reflection (10ms)
Graph Query: Retrieve "Agent Capabilities" community (150ms)
Constraints Retrieved:
  - Agent Capabilities (9 nodes) ✅
  - Core Identity ✅
  - Language Matching ✅
  - JSON Structure ✅

System Prompt (800 tokens):
  - Dot's persona (400 tokens)
  - Capability list from graph (200 tokens) ✅ RELEVANT ONLY
  - Language matching (100 tokens) ✅
  - JSON structure (100 tokens) ✅
  - Dynamic context (0 tokens - not needed for capability question)

LLM Response: Focused, relevant capability list
Latency: ~1.8s (700ms faster)
Cost: $0.0056 (1600 tokens × $3.50/1M) (60% cost reduction)
```

---

## Key Design Principles

1. **Additive, Not Replacing**
   - PromptBuilder stays intact
   - Graph query is optional enhancement
   - Always fallback to full template

2. **Lightweight Intent Detection**
   - Rule-based pattern matching
   - No LLM needed (fast, cheap)
   - Can enhance later with ML if needed

3. **Gradual Learning**
   - Track usage patterns
   - Manual refinement first
   - Auto-improvement later (only if proven)

4. **Measurable Benefits**
   - Token reduction metrics
   - Latency improvement
   - Cost savings
   - Response quality (user engagement)

---

## Conclusion

This approach gives you **immediate, measurable benefits** (smaller prompts, faster responses, lower cost) while building toward the full GNN vision. It's **practical, incremental, and non-breaking**.

**The key insight:** You don't need full graph neural network orchestration for daily conversations. You just need **smart constraint selection** based on detected intent. The graph is the knowledge base; intent detection + retrieval is the practical application.

Start here, measure results, then expand if proven valuable.

