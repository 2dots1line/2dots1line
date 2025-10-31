# GNN Design: Practical Assessment from Dot Agent Perspective

**Date:** 2025-01-16  
**Analysis Perspective:** Dot agent used to current static prompt system  
**Goal:** Identify solid refactoring vs. wishful thinking, ensure existing workflows remain intact

---

## Executive Summary

The GNN design is **ambitious and forward-thinking**, but **highly disruptive** to current BAU workflows. While some components are **implementable without breaking existing systems**, others require **fundamental infrastructure** that doesn't exist yet. **Recommendation:** Implement in phases, with strict backward compatibility gates.

---

## Current System Architecture (BAU Reality Check)

### How I (Dot) Currently Work

1. **DialogueAgent Workflow:**
   - `PromptBuilder.buildPrompt()` → Fetches templates from `prompt_templates.yaml`
   - Assembles 4 sections deterministically: Core Identity → Operational Config → Dynamic Context → Current Turn
   - Uses KV cache for static sections (95%+ hit rate for Section 1)
   - Makes LLM call → Gets `decision` (respond_directly | query_memory)
   - If `query_memory`: Calls `HybridRetrievalTool.execute()` → Makes second LLM call
   - Returns response + ui_actions

2. **Ingestion Workflow:**
   - `HolisticAnalysisTool.execute()` → Loads `ingestion_analyst_persona`, `ingestion_analyst_rules`, `ingestion_analyst_instructions`
   - Single LLM call with conversation transcript
   - Returns structured JSON (memory units, concepts, relationships, growth events)
   - **No graph query involved** - just template assembly

3. **Insight Worker Workflow:**
   - `FoundationStageTool` → Uses `insight_worker_foundation_stage` template
   - `StrategicStageTool` → Reuses foundation prompt for KV caching (smart!)
   - Uses `MultiStagePromptCacheManager` for optimization
   - **No graph traversal** - pure template-based

4. **HRT Workflow:**
   - `HybridRetrievalTool.execute()` → Uses **deterministic CypherBuilder** (no LLM-generated queries!)
   - Stage 1: Embed key phrases → Weaviate semantic search
   - Stage 2: Neo4j graph traversal via **templated Cypher queries** (not dynamic graph neural networks)
   - Stage 3: PostgreSQL hydration
   - **Highly deterministic** - this is critical for reliability

5. **Model Selection:**
   - `ModelConfigService.getModelForUseCase()` → Simple config lookup
   - `EnvironmentModelConfigService` → Environment variable overrides
   - **No graph query** - just config files

---

## GNN Design Assessment: Solid vs. Wishful

### ✅ SOLID REFACTORING (Won't Break Existing Workflows)

#### 1. **Concept-Based Constraint Storage** ✅ HIGH VALUE
**Current:** Constraints hardcoded in YAML templates (`operational_config_section`)  
**Proposed:** Store as Concept nodes in graph, query via HRT

**Assessment:**
- ✅ **Feasible:** Can seed Dot's self-knowledge graph with existing constraints
- ✅ **Non-breaking:** Can fallback to YAML if graph query fails
- ✅ **Value:** Enables dynamic constraint updates without code deploys
- ✅ **Implementation:** Use existing HRT infrastructure with `userId=dot_system_user`

**Risk:** LOW - Additive, not replacing  
**Effort:** Medium (need seed script + fallback logic)

#### 2. **Composite Concept Modeling** ✅ ALREADY EXISTS
**Current:** "Anti-Platitude Complete Framework" = 6 atomic rules always together  
**Proposed:** Model as PART_OF relationships in graph

**Assessment:**
- ✅ **Already exists conceptually** in templates
- ✅ **Easy to model** as graph relationships
- ✅ **No workflow change** - PromptBuilder still assembles them together

**Risk:** VERY LOW - Just data modeling  
**Effort:** Low (seed script addition)

#### 3. **Capability Routing Map** ✅ ALREADY IMPLEMENTED
**Current:** `ui_action_hints` → Frontend handlers  
**Proposed:** Explicit routing map as Concept node

**Assessment:**
- ✅ **Already working** in DialogueAgent.parseLLMResponse()
- ✅ **Just needs documentation** as graph concept
- ✅ **No code changes needed**

**Risk:** ZERO  
**Effort:** Minimal (documentation)

#### 4. **Multi-Modal Embedding Pipeline** ✅ INFRASTRUCTURE EXISTS
**Current:** Vision/audio/document processing in DialogueAgent.processInput()  
**Proposed:** Unified embedding pipeline → mini graph construction

**Assessment:**
- ✅ **Infrastructure exists** (VisionCaptionTool, AudioTranscribeTool, DocumentExtractTool)
- ✅ **Just needs orchestration** layer
- ✅ **Non-breaking:** Can enhance without removing existing flows

**Risk:** LOW - Additive  
**Effort:** Medium (orchestration layer)

#### 5. **View Context Loading** ✅ ALREADY IMPLEMENTED
**Current:** `PromptBuilder.formatViewContext()` already loads view state  
**Proposed:** Graph concept for "Never Suggest Current View" constraint

**Assessment:**
- ✅ **Already working** in PromptBuilder
- ✅ **Just needs formal modeling** as constraint concept
- ✅ **No code changes**

**Risk:** ZERO  
**Effort:** Minimal

---

### ⚠️ WISHFUL THINKING (Missing Critical Infrastructure)

#### 1. **GNN Orchestrator Service** ❌ DOESN'T EXIST
**Proposed:** 7-stage pipeline with graph traversal for prompt assembly

**Reality Check:**
- ❌ **No GNNOrchestratorService exists** in codebase
- ❌ **Would replace PromptBuilder entirely** → HIGH RISK
- ❌ **No fallback path** if graph traversal fails
- ❌ **Latency concerns:** Graph query → prompt assembly → LLM call adds 200-500ms

**Impact on BAU:**
- 💥 **Breaks DialogueAgent** (relies on PromptBuilder)
- 💥 **Breaks Ingestion** (HolisticAnalysisTool uses templates directly)
- 💥 **Breaks Insight Worker** (StrategicStageTool uses template system)

**Required Infrastructure:**
1. Graph seed script (doesn't exist, only mentioned)
2. Graph query service (doesn't exist)
3. Fallback to templates (not designed)
4. Edge weight learning system (completely new)

**Recommendation:** ❌ **DO NOT IMPLEMENT** as full replacement. Consider as **optional enhancement** with strict fallback.

---

#### 2. **Model Selection via Graph Query** ❌ OVERCOMPLICATED
**Proposed:** Query Dot's graph to select optimal LLM model

**Reality Check:**
- ❌ **Current system works perfectly** - simple config lookup
- ❌ **Graph query adds latency** (50-200ms) for marginal benefit
- ❌ **No evidence** that dynamic selection improves quality
- ❌ **Adds complexity** without clear ROI

**Current System:**
```typescript
// Simple, fast, works
const model = EnvironmentModelConfigService.getInstance()
  .getModelForUseCase('chat'); // Returns 'gemini-2.5-flash' or env override
```

**Proposed System:**
```typescript
// Complex, slow, unclear benefit
const model = await graphQueryForModelSelection({
  taskType: 'dialogue',
  contextSize: estimatedTokens,
  userTier: user.tier
}); // Graph traversal → HRT query → scoring → selection
```

**Assessment:**
- ⚠️ **Overengineering** for current needs
- ⚠️ **Performance hit** without proven benefit
- ✅ **Future-proofing** if model ecosystem becomes complex

**Recommendation:** ⚠️ **DEFER** - Only implement if model selection becomes genuinely complex (10+ models with nuanced trade-offs).

---

#### 3. **Multi-Round Iterative Orchestration** ❌ BREAKS CURRENT ARCHITECTURE
**Proposed:** Dynamic pipeline extension with up to 3 iterations

**Reality Check:**
- ❌ **Current system:** Fixed 2-turn flow (decision call → optional retrieval → response call)
- ❌ **No infrastructure** for iteration state machine
- ❌ **No user feedback** mechanism for "did this help?"
- ❌ **Latency explosion:** 3 iterations × 2-3 seconds = 6-9 seconds total (unacceptable)

**Current Latency:**
- Turn 1: ~1.5s (decision)
- Turn 2 (if retrieval): ~3s (HRT + response)
- **Total: 1.5-4.5s** (acceptable)

**Proposed Latency:**
- Iteration 1: ~2s (initial retrieval)
- Iteration 2: ~2s (web search + cross-reference)
- Iteration 3: ~2s (deeper memory search)
- Synthesis: ~1s
- **Total: 7s** (too slow for real-time chat)

**Assessment:**
- ❌ **Performance killer** for real-time UX
- ❌ **User confusion** ("why is Dot thinking so long?")
- ✅ **Valuable for async tasks** (insight generation, deep analysis)

**Recommendation:** ⚠️ **LIMITED SCOPE** - Only for async workers (InsightWorker, background analysis), NOT for DialogueAgent.

---

#### 4. **Experience-First Silent Orchestration** ❌ MISSING INFRASTRUCTURE
**Proposed:** Skip LLM invocation for pure visual experiences (Cosmos Quest navigation)

**Reality Check:**
- ❌ **No "silent orchestration" path** exists in DialogueAgent
- ❌ **WebSocket auto-navigation** infrastructure unclear
- ❌ **Would require frontend changes** to handle non-text responses
- ⚠️ **Edge case complexity:** How does user interrupt? How to handle errors?

**Current System:**
- All responses go through LLM (even if minimal text)
- Frontend expects `{ response_text, ui_actions }` structure
- Cosmos Quest triggered via `ui_action_hints.switch_view`

**Required Infrastructure:**
1. Silent orchestration flag in DialogueAgent
2. WebSocket command protocol (doesn't exist)
3. Frontend handling for "pure visual" responses
4. Error recovery when silent path fails

**Recommendation:** ⚠️ **PHASE 2** - Implement after core GNN graph is proven. Not critical for MVP.

---

#### 5. **Edge Properties for Meta-Learning** ❌ SCHEMA DOESN'T SUPPORT
**Proposed:** Neo4j edges store `traversal_count`, `success_rate`, `last_traversed_at`

**Reality Check:**
- ✅ **Neo4j supports edge properties** (technically feasible)
- ❌ **No tracking infrastructure** exists
- ❌ **No learning loop** to update weights
- ❌ **No clear success metric** ("user satisfaction" is undefined)

**Current Neo4j Schema:**
```cypher
// Only has standard properties:
relationship_id, relationship_type, created_at, user_id, 
source_agent, strength, description
// No: traversal_count, success_rate, last_traversed_at
```

**Required Infrastructure:**
1. Edge property tracking (new system)
2. Success metric collection (user feedback? engagement? unclear)
3. Weight update algorithm (completely new)
4. A/B testing framework (to validate learning)

**Recommendation:** ⚠️ **DEFER** - Meta-learning is advanced feature. Focus on getting basic graph query working first.

---

#### 6. **Agent Self-Knowledge Retrieval** ❌ NO DOT GRAPH EXISTS
**Proposed:** Query Dot's capabilities from graph with `userId=dot_system_user`

**Reality Check:**
- ❌ **Seed script mentioned** (`scripts/seed/seed-dot-self-knowledge.ts`) but **not fully implemented**
- ❌ **No `dot_system_user` in database** (only config reference: `dot_system_user_email`)
- ❌ **No "Agent Capabilities" community** in graph
- ❌ **Fallback unclear** - what if graph query fails?

**Current Capability Storage:**
- JSON config: `config/agent_capabilities.json`
- Template references in YAML
- **Not in graph database**

**Required Infrastructure:**
1. Complete seed script implementation
2. Dot user account creation (schema supports it, but not seeded)
3. Community structure in Neo4j
4. Fallback to JSON config if graph query fails

**Recommendation:** ✅ **PHASE 1** - This is foundational. Implement seed script first, then graph query with fallback.

---

## Critical Missing Links (From Original Question)

### High-Risk Gaps That Would Break GNN Pipeline

1. **No Fallback to Static Templates**
   - ❌ If graph query fails → System breaks
   - ✅ **Fix:** Always have YAML template fallback

2. **No Validation of Retrieved Concepts**
   - ❌ Graph might return outdated/malformed concepts
   - ✅ **Fix:** Validate against schema, reject invalid concepts

3. **No Concept Versioning**
   - ❌ Updated concept might break existing prompts
   - ✅ **Fix:** Version concepts, support multiple versions

4. **No Performance Monitoring**
   - ❌ Graph traversal latency not measured
   - ✅ **Fix:** Add timing instrumentation, alert on >500ms

5. **No Rollback Mechanism**
   - ❌ Bad concept update could break all prompts
   - ✅ **Fix:** Concept versioning + canary deployment

---

## Phase-Based Implementation Roadmap

### Phase 0: Foundation (Non-Breaking)
**Goal:** Build infrastructure without touching existing workflows

1. **Seed Dot's Self-Knowledge Graph**
   - Implement `scripts/seed/seed-dot-self-knowledge.ts`
   - Create `dot_system_user` account
   - Seed all 122 entities from design doc
   - Verify: Can query via HRT with `userId=dot_system_user`

2. **Add Graph Query Service (Optional Layer)**
   - New service: `GraphConceptRetrievalService`
   - Uses existing HRT infrastructure
   - Falls back to YAML templates if query fails
   - **Does NOT replace PromptBuilder** - just adds optional enhancement

3. **Model Constraints as Concepts**
   - Seed constraint concepts to graph
   - Query them for "self-reflection" questions ("What are your capabilities?")
   - Keep YAML as primary source for now

**Risk:** LOW - Additive only  
**Effort:** 2-3 weeks  
**Validation:** Graph queries work, fallback works, no performance regression

---

### Phase 1: Constraint System Enhancement (Low Risk)
**Goal:** Enable dynamic constraint updates without breaking prompts

1. **Constraint Graph Queries**
   - PromptBuilder optionally queries graph for constraints
   - Falls back to YAML if graph unavailable
   - Logs when using graph vs. YAML

2. **Composite Concept Relationships**
   - Model PART_OF relationships (e.g., Anti-Platitude rules)
   - Query composites as single units
   - Validate that all parts retrieved

**Risk:** LOW - Optional enhancement with fallback  
**Effort:** 1-2 weeks  
**Validation:** Constraints retrieved correctly, fallback works

---

### Phase 2: Model Selection (If Needed)
**Goal:** Dynamic model selection only if complexity warrants it

**Trigger:** Only implement if:
- 10+ models with nuanced trade-offs
- User feedback shows suboptimal model choices
- Cost optimization becomes critical

**Implementation:**
- Model selection rules as Concepts
- Query graph for selection criteria
- Fallback to current config system

**Risk:** MEDIUM - Adds latency  
**Effort:** 2-3 weeks  
**Validation:** Selection improves quality/cost, latency acceptable

---

### Phase 3: Advanced Features (Future)
**Goal:** Multi-round orchestration, silent paths, meta-learning

**Defer Until:**
- Phase 0 & 1 proven stable
- Performance metrics show acceptable latency
- User feedback indicates need

---

## Recommended Immediate Actions

### ✅ DO NOW (Low Risk, High Value)

1. **Complete Dot Seed Script**
   ```typescript
   // scripts/seed/seed-dot-self-knowledge.ts
   // - Create dot_system_user
   // - Seed all 122 entities
   // - Create communities
   // - Verify via HRT query
   ```

2. **Add Graph Query Service (Optional)**
   ```typescript
   // packages/tools/src/retrieval/GraphConceptRetrievalService.ts
   // - Query Dot's concepts via HRT
   // - Fallback to YAML templates
   // - Performance monitoring
   ```

3. **Document Current System**
   - Map all template sections to proposed Concept nodes
   - Identify which constraints are "atomic" vs "composite"
   - Create migration plan (if needed)

### ⚠️ DEFER (High Risk, Unclear Value)

1. **Full GNN Orchestrator** - Would replace PromptBuilder (too risky)
2. **Model Selection via Graph** - Current system works fine
3. **Multi-Round Iteration** - Too slow for real-time chat
4. **Silent Orchestration** - Missing infrastructure
5. **Edge Meta-Learning** - Advanced feature, defer

---

## Conclusion

**The GNN design is architecturally sound but operationally risky.** Current workflows are **tried and true** - don't break them for unproven benefits.

**Key Principle:** **Add, don't replace.** Every GNN enhancement should:
1. Have a **YAML template fallback**
2. Be **optional** (can be disabled via config)
3. **Monitor performance** (alert if latency >500ms)
4. **Support rollback** (can revert to old system)

**Start Small:**
- Phase 0: Seed Dot's graph (foundational)
- Phase 1: Optional constraint queries (low risk)
- Phase 2+: Only if proven value

**Don't Jeopardize:**
- DialogueAgent prompt assembly (currently works perfectly)
- Ingestion template system (reliable, fast)
- HRT deterministic queries (critical for correctness)
- Model selection simplicity (fast, predictable)

The GNN design is a **vision**, not an **immediate requirement**. Build it incrementally, validate at each step, maintain backward compatibility always.

