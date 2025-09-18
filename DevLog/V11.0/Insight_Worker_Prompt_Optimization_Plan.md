# Insight Worker Prompt Optimization Plan

**Date:** January 26, 2025  
**Version:** V11.0  
**Status:** Analysis Complete - Implementation Ready  
**Priority:** High - Performance & Maintainability

---

## **📋 EXECUTIVE SUMMARY**

This document outlines a comprehensive optimization plan for the insight worker prompt system based on analysis of the current implementation. The plan addresses four key areas: prompt bloat reduction, parameter centralization, memory schema optimization, and derived artifacts integration.

### **Key Findings:**
- **InsightDataCompiler Useless**: After code analysis, `InsightDataCompiler` provides only basic data aggregation and empty placeholders, not sophisticated analysis
- **Bias Risk**: Current approach could create feedback loops where frequently selected concepts get more relationships and get selected even more
- **Prompt Bloat**: Current prompt includes unnecessary data (relationships, metadata) that bloats LLM input
- **Parameter Scatter**: Hardcoded parameters scattered across 15+ files need centralization

### **🚨 CRITICAL REALITY CHECK: InsightDataCompiler Analysis**

After line-by-line code analysis, `InsightDataCompiler` is essentially useless:

**What it actually does:**
- `compileGraphAnalysis()`: Returns empty arrays for `keyConceptClusters`, `ontologyGaps` - just counts nodes
- `compileStrategicInsights()`: Uses arbitrary multipliers (0.7, 0.8, 0.6) on growth event deltas - no real analysis
- `compileIngestionActivity()`: Simple keyword matching for themes - no sophisticated NLP
- `identifyEmergentPatterns()`: Just checks if `conversations.length > 3` - trivial logic

**What it does NOT do:**
- No sophisticated graph analysis
- No real pattern recognition  
- No strategic insights
- No meaningful ontology analysis

**Conclusion:** The optimization plan should **bypass `InsightDataCompiler` entirely** and build proper analysis directly in `InsightEngine` or create a new, actually useful analysis service.

### **📝 UPDATED OPTIMIZATION STRATEGY:**

**Instead of leveraging useless `InsightDataCompiler`:**
1. **DELETE `InsightDataCompiler.ts` entirely** - it provides no value
2. **Build real analysis methods** directly in `InsightEngine`
3. **Use existing tools** like `SemanticSimilarityTool` and `HybridRetrievalTool` for actual analysis
4. **Create meaningful strategic insights** instead of empty placeholders
5. **Implement proper graph analysis** instead of just counting nodes
6. **Focus on prompt optimization** with systematic, clear approach
- **Outdated Schemas**: User memory profile and knowledge schema contain outdated/irrelevant information
- **Better Alternatives**: Derived artifacts and proactive prompts provide better context than raw schemas

---

## **🎯 SYSTEMATIC INSIGHT WORKER PROMPT BUILDING (Without InsightDataCompiler)**

### **Core Principle: Direct Data Fetching + Task-Based Selection**

The insight worker prompt should be built using **direct database queries** and **existing tools**, not the useless `InsightDataCompiler`.

### **Step 1: Fetch Core Data Directly from Database**

```typescript
// In InsightEngine.gatherComprehensiveContext()
private async gatherComprehensiveContext(userId: string, jobId: string, cycleDates: CycleDates) {
  // 1. Fetch conversations with importance filtering
  const conversations = await this.dbService.prisma.conversations.findMany({
    where: {
      user_id: userId,
      start_time: { gte: cycleDates.cycleStartDate, lte: cycleDates.cycleEndDate },
      importance_score: { gte: 3 } // Only important conversations
    },
    select: {
      id: true,
      title: true,
      context_summary: true,
      importance_score: true,
      start_time: true
    },
    orderBy: { importance_score: 'desc' },
    take: 10 // Limit to top 10
  });

  // 2. Fetch memory units with importance filtering
  const memoryUnits = await this.dbService.prisma.memory_units.findMany({
    where: {
      user_id: userId,
      creation_ts: { gte: cycleDates.cycleStartDate, lte: cycleDates.cycleEndDate },
      importance_score: { gte: 5 } // Only high-importance memories
    },
    select: {
      id: true,
      title: true,
      content: true,
      importance_score: true,
      creation_ts: true
    },
    orderBy: { importance_score: 'desc' },
    take: 15 // Limit to top 15
  });

  // 3. Fetch concepts with salience filtering
  const concepts = await this.dbService.prisma.concepts.findMany({
    where: {
      user_id: userId,
      salience: { gte: 0.3 } // Only concepts with decent salience
    },
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      salience: true,
      created_at: true
    },
    orderBy: { salience: 'desc' }
  });

  // 4. Fetch growth events
  const growthEvents = await this.dbService.prisma.growth_events.findMany({
    where: {
      user_id: userId,
      created_at: { gte: cycleDates.cycleStartDate, lte: cycleDates.cycleEndDate }
    },
    select: {
      id: true,
      dim_key: true,
      details: true,
      created_at: true
    }
  });
[Question: this is all for context, no need to provide fluffs like title, salience, time of creation]
  // 5. Fetch derived artifacts and proactive prompts
  const derivedArtifacts = await this.getRecentDerivedArtifacts(userId, cycleDates);
  const proactivePrompts = await this.getRecentProactivePrompts(userId, cycleDates);
}
```
[Question: make sure you are fetching derivedArtifacts and proactive prompts from most recent cycle]
### **Step 2: Task-Based Concept Selection (No InsightDataCompiler)**

```typescript
// Add these methods directly to InsightEngine
private async getStrategicConceptSample(userId: string, cycleDates: CycleDates) {
  const allConcepts = await this.dbService.prisma.concepts.findMany({
    where: { user_id: userId },
    select: {
      id: true, name: true, type: true, description: true,
      salience: true, created_at: true, user_id: true
    }
  });

  const newConcepts = allConcepts.filter(c => 
    c.created_at >= cycleDates.cycleStartDate && 
    c.created_at <= cycleDates.cycleEndDate
  );

  return {
    // Task 1: Concept Merging - Use SemanticSimilarityTool
    merging: await this.getConceptsForMerging(newConcepts, allConcepts),
    
    // Task 2: Concept Archiving - Multi-criteria filtering
    archiving: await this.getConceptsForArchiving(allConcepts),
    
    // Task 3: Strategic Relationships - Use HRT for graph traversal
    relationships: await this.getConceptsForRelationships(newConcepts, allConcepts),
    
    // Task 4: Community Structure - Get existing communities
    communities: await this.getConceptsForCommunities(allConcepts),
    
    // Task 5: Description Synthesis - Find concepts needing better descriptions
    descriptionSynthesis: await this.getConceptsForDescriptionSynthesis(allConcepts)
  };
}
```
[Question: what do you mean by allConcepts? We spent a lot of time discussing why we cannot afford to pull in all concepts and we have specific criteria for each task. you are only using salience score, which is not very comprehensive selection criteria. for concept merging, I would select top 3 most semantically similar to each new concept (leverage semantic similarity tool), for archiving, low salience and old and low connection. strategic relationship, I would start with new concept and look at its connected memory units and concepts and traverse 1 or 2 hops and see if there is some direct relationship that should be created. for this task, salience or raw count of connections don't matter. For community structure, insight worker need to know existing communities and random sample of concepts from each community and decide if assign each new concept to existing communities or create new community. There is also that synthesize concept description task, for that task, separately listing concepts who need description synthesis is fine. Also how do you deduplicate? ]
### **Step 3: Build Optimized StrategicSynthesisInput**

```typescript
private async buildOptimizedStrategicInput(
  userId: string,
  conversations: any[],
  memoryUnits: any[],
  concepts: any[],
  growthEvents: any[],
  derivedArtifacts: any[],
  proactivePrompts: any[],
  conceptSelections: any
): Promise<StrategicSynthesisInput> {
  
  return {
    userId,
    userName: user.name || 'User',
    cycleId: `cycle-${userId}-${Date.now()}`,
    cycleStartDate: cycleDates.cycleStartDate,
    cycleEndDate: cycleDates.cycleEndDate,
    
    // Optimized currentKnowledgeGraph - NO RELATIONSHIPS
    currentKnowledgeGraph: {
      memoryUnits: conversations.map(conv => ({
        id: `conv_${conv.id}`,
        title: `[CONVERSATION] ${conv.title || 'Untitled Conversation'}`,
        content: conv.context_summary || 'No summary available',
        importance_score: conv.importance_score,
        tags: [],
        created_at: conv.start_time.toISOString()
      })),
      
      concepts: [
        ...conceptSelections.merging.map(m => m.new_concept),
        ...conceptSelections.archiving.map(a => a.concept),
        ...conceptSelections.relationships.map(r => r.source_concept),
        ...conceptSelections.communities.flatMap(c => c.sample_concepts),
        ...conceptSelections.descriptionSynthesis
      ],
      
      relationships: [], // REMOVED - causes prompt bloat
      conceptsNeedingSynthesis: conceptSelections.descriptionSynthesis
    },
    
    // Optimized recentGrowthEvents - only important ones
    recentGrowthEvents: growthEvents
      .filter(ge => Math.abs(ge.details?.delta || 0) > 0.5) // Only significant changes
      .map(ge => ({
        id: ge.id,
        dim_key: ge.dim_key,
        delta: ge.details?.delta || 0,
        created_at: ge.created_at.toISOString()
      })),
    
    // Optimized userProfile - use derived artifacts instead of raw schemas
    userProfile: {
      preferences: {},
      goals: [],
      interests: [],
      growth_trajectory: {
        // Use derived artifacts for strategic context
        derived_insights: derivedArtifacts.filter(da => da.artifact_type === 'insight'),
        proactive_prompts: proactivePrompts,
        // Add real analysis here instead of empty placeholders
        structural_metrics: await this.calculateRealStructuralMetrics(userId),
        knowledge_gaps: await this.identifyRealKnowledgeGaps(userId),
        emergent_patterns: await this.detectRealEmergentPatterns(userId, cycleDates)
      }
    },
    
    workerType: 'insight-worker',
    workerJobId: jobId
  };
}
```

### **Step 4: Remove InsightDataCompiler Dependencies**

```typescript
// In InsightEngine constructor - REMOVE InsightDataCompiler
constructor(
  private strategicSynthesisTool: StrategicSynthesisTool,
  private dbService: DatabaseService,
  private cardQueue: Queue,
  private graphQueue: Queue,
  private embeddingQueue: Queue
  // REMOVE: private insightDataCompiler: InsightDataCompiler
) {
  // ... rest of constructor
}

// In processUserCycle - REMOVE InsightDataCompiler calls
private async processUserCycle(userId: string, jobId: string, cycleDates: CycleDates) {
  // REMOVE: const [ingestionSummary, graphAnalysis, strategicInsights] = await Promise.all([
  //   this.insightDataCompiler.compileIngestionActivity(userId, cycleDates),
  //   this.insightDataCompiler.compileGraphAnalysis(userId),
  //   this.insightDataCompiler.compileStrategicInsights(userId, cycleDates)
  // ]);

  // REPLACE with direct data fetching
  const context = await this.gatherComprehensiveContext(userId, jobId, cycleDates);
  const strategicInput = await this.buildOptimizedStrategicInput(/* ... */);
  
  // ... rest of method
}
```

---

## **🔍 CURRENT STATE ANALYSIS**

### **1. Prompt Bloat Issues**

#### **Current StrategicSynthesisTool Prompt Structure:**
```typescript
// From StrategicSynthesisTool.ts lines 271-300
const masterPrompt = `${strategicPersonaWithUserName}

## Analysis Context
- **User ID**: ${input.userId}
- **Cycle ID**: ${input.cycleId}
- **Analysis Timestamp**: ${new Date().toISOString()}
- **Cycle Period**: ${input.cycleStartDate.toISOString()} to ${input.cycleEndDate.toISOString()}

## Current Knowledge Graph State
### Memory Units and Conversation Summaries (${input.currentKnowledgeGraph.memoryUnits.length} total)
${JSON.stringify(input.currentKnowledgeGraph.memoryUnits, null, 2)}

### Concepts (${input.currentKnowledgeGraph.concepts.length} total)
${JSON.stringify(input.currentKnowledgeGraph.concepts, null, 2)}

### Relationships (${input.currentKnowledgeGraph.relationships.length} total)
${JSON.stringify(input.currentKnowledgeGraph.relationships, null, 2)}

## Recent Growth Events (${input.recentGrowthEvents.length} total)
${JSON.stringify(input.recentGrowthEvents, null, 2)}

## User Profile
${JSON.stringify(input.userProfile, null, 2)}
```

#### **Identified Bloat Sources:**
1. **Relationships Section** - Not needed for strategic synthesis
2. **Conversation Metadata** - ID, title, tags, importance_score, created_at are unnecessary
3. **Unfiltered Memory Units** - No importance/salience filtering
4. **Raw User Profile** - Contains outdated schema information

### **2. Parameter Centralization Opportunities**

#### **Existing Parameters in operational_parameters.json:**
- `conversation_timeout_seconds`: 120
- `workers.check_interval_seconds`: 30

#### **Hardcoded Parameters Found Across Services:**

| Service/File | Parameter | Current Value | Should Be Centralized |
|--------------|-----------|---------------|----------------------|
| **LLM Parameters** | | | |
| `LLMChatTool.ts` | temperature | 0.7 | ✅ |
| `LLMChatTool.ts` | topK | 40 | ✅ |
| `LLMChatTool.ts` | topP | 0.95 | ✅ |
| `LLMChatTool.ts` | maxOutputTokens | 50000 | ✅ |
| `DialogueAgent.ts` | temperature | 0.3 | ✅ |
| `DialogueAgent.ts` | maxTokens | 50000 | ✅ |
| `StrategicSynthesisTool.ts` | temperature | 0.4 | ✅ |
| `HolisticAnalysisTool.ts` | temperature | 0.1 | ✅ |
| **Worker Parameters** | | | |
| `MaintenanceWorker.ts` | STALE_REDIS_KEY_THRESHOLD_HOURS | 24 | ✅ |
| `MaintenanceWorker.ts` | ARCHIVE_CONVERSATIONS_AFTER_DAYS | 730 | ✅ |
| `MaintenanceWorker.ts` | INTEGRITY_CHECK_BATCH_SIZE | 1000 | ✅ |
| `GraphProjectionWorker.ts` | concurrency | 2 | ✅ |
| `GraphProjectionWorker.ts` | retryAttempts | 3 | ✅ |
| `GraphProjectionWorker.ts` | retryDelay | 5000 | ✅ |
| `InsightEngine.ts` | cycle_duration_days | 2 | ✅ |
| `InsightEngine.ts` | max_growth_events | 20 | ✅ |
| `InsightEngine.ts` | max_relationships | 100 | ✅ |
| **Ingestion Worker Parameters** | | | |
| `IngestionWorker.ts` | concurrency | 2 | ✅ |
| `IngestionWorker.ts` | attempts | 1 | ✅ |
| `IngestionWorker.ts` | removeOnComplete | 10 | ✅ |
| `IngestionWorker.ts` | removeOnFail | 50 | ✅ |
| `IngestionAnalyst.ts` | semantic_similarity_threshold | 0.8 | ✅ |
| `IngestionAnalyst.ts` | max_memory_units_per_conversation | 10 | ✅ |
| `IngestionAnalyst.ts` | max_concepts_per_conversation | 15 | ✅ |
| **Card Worker Parameters** | | | |
| `CardWorker.ts` | concurrency | 5 | ✅ |
| `CardWorker.ts` | retryAttempts | 3 | ✅ |
| `CardWorker.ts` | retryDelay | 2000 | ✅ |
| **Embedding Worker Parameters** | | | |
| `EmbeddingWorker.ts` | concurrency | 3 | ✅ |
| `EmbeddingWorker.ts` | retryAttempts | 3 | ✅ |
| `EmbeddingWorker.ts` | retryDelay | 2000 | ✅ |
| `EmbeddingWorker.ts` | embeddingModelVersion | 'text-embedding-3-small' | ✅ |
| **Dashboard Service Parameters** | | | |
| `DashboardService.ts` | max_items_per_section | 1-5 (varies by type) | ✅ |
| `DashboardService.ts` | default_max_items | 5 | ✅ |
| `DashboardService.ts` | user_cycles_limit | 10 | ✅ |
| **Redis Connection Parameters** | | | |
| Multiple workers | maxRetriesPerRequest | null | ✅ |
| Multiple workers | enableReadyCheck | false | ✅ |
| Multiple workers | lazyConnect | true | ✅ |
| Multiple workers | keepAlive | 30000 | ✅ |
| Multiple workers | connectTimeout | 10000 | ✅ |
| Multiple workers | commandTimeout | 10000 | ✅ |
| Multiple workers | enableOfflineQueue | true | ✅ |
| **CRITICAL MISSING PARAMETERS** | | | |
| `IngestionAnalyst.ts` | conversation_importance_threshold | 1 | ✅ **CRITICAL** |
| `CardWorker.ts` | memory_unit_min_importance_score | 1.0 | ✅ **CRITICAL** |
| `CardWorker.ts` | concept_min_salience | 0.3 | ✅ **CRITICAL** |
| `CardWorker.ts` | max_cards_per_session | 100 | ✅ **CRITICAL** |
| `GraphProjectionWorker.ts` | max_nodes_per_projection | 1000 | ✅ **CRITICAL** |
| `GraphProjectionWorker.ts` | min_importance_for_visualization | 0.2 | ✅ **CRITICAL** |
| `DashboardService.ts` | insights_max_items | 3 | ✅ **CRITICAL** |
| `DashboardService.ts` | patterns_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | recommendations_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | synthesis_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | identified_patterns_max_items | 3 | ✅ **CRITICAL** |
| `DashboardService.ts` | emerging_themes_max_items | 3 | ✅ **CRITICAL** |
| `DashboardService.ts` | focus_areas_max_items | 3 | ✅ **CRITICAL** |
| `DashboardService.ts` | blind_spots_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | celebration_moments_max_items | 1 | ✅ **CRITICAL** |
| `DashboardService.ts` | reflection_prompts_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | exploration_prompts_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | goal_setting_prompts_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | skill_development_prompts_max_items | 2 | ✅ **CRITICAL** |
| `DashboardService.ts` | creative_expression_prompts_max_items | 2 | ✅ **CRITICAL** |

#### **Critical Decision-Making Parameters Analysis:**

**1. Ingestion Worker Decision Logic:**
- **`conversation_importance_threshold: 1`** - Currently hardcoded in `IngestionAnalyst.ts:181`
- **Impact**: Determines which conversations are important enough to generate memory units and concepts
- **Current Logic**: `if (persistence_payload.conversation_importance_score < 1) { skip entity creation }`
- **Centralization**: Move to `operational_parameters.json` for easy tuning

**2. Card Worker Decision Logic:**
- **`memory_unit_min_importance_score: 1.0`** - From `card_eligibility_rules.json:26`
- **`concept_min_salience: 0.3`** - From `card_eligibility_rules.json:29` (inferred from code)
- **`max_cards_per_session: 100`** - From `card_eligibility_rules.json:22`
- **Impact**: Determines which entities become UI cards and how many to show
- **Current Logic**: `entityData.importance_score < rules.min_importance_score` → skip card creation
- **Centralization**: Move from JSON config to `operational_parameters.json`

**3. Graph Projection Worker Decision Logic:**
- **`max_nodes_per_projection: 1000`** - Currently unlimited (all nodes included)
- **`min_importance_for_visualization: 0.2`** - Currently no filtering
- **Impact**: Determines which nodes appear in 3D knowledge cosmos visualization
- **Current Logic**: Includes all nodes from Neo4j, no importance filtering
- **Centralization**: Add filtering logic with configurable thresholds

**4. Dashboard Service Decision Logic:**
- **Per-section item limits** - Currently hardcoded in `DashboardService.ts:264-280`
- **Impact**: Controls how many items are displayed in each dashboard section
- **Current Logic**: `insights: 3, patterns: 2, recommendations: 2, etc.`
- **Centralization**: Move to `operational_parameters.json` for easy customization

### **3. Memory Schema Issues**

#### **Current User Profile Structure:**
```typescript
// From InsightEngine.ts lines 380-385
userProfile: {
  preferences: user.memory_profile || {},
  goals: [],
  interests: [],
  growth_trajectory: user.knowledge_graph_schema || {}
}
```

#### **Problems Identified:**
1. **memory_profile** contains outdated merge information and concept consolidation data
2. **knowledge_graph_schema** includes irrelevant concept merging details
3. **No filtering** by importance, salience, or recency
4. **Static goals/interests** arrays are always empty

### **4. Derived Artifacts & Proactive Prompts Analysis**

#### **Current Usage:**
- Derived artifacts are created but not used in prompts
- Proactive prompts are generated but not integrated into context
- Both provide more actionable insights than raw schemas

#### **Available Data:**
```typescript
// From schema.prisma
model derived_artifacts {
  artifact_id: String
  artifact_type: String // insight, pattern, recommendation, synthesis, etc.
  title: String
  content_narrative: String
  confidence_score: Float
  actionability: String // immediate, short_term, long_term, aspirational
}

model proactive_prompts {
  prompt_id: String
  prompt_text: String
  prompt_type: String
  timing_suggestion: String
  priority_level: String
}
```

---

## **🎯 OPTIMIZATION PLAN**

### **Phase 1: Prompt Bloat Reduction**

#### **1.1 Remove Unnecessary Data Sections**
- **Remove relationships section** - Not needed for strategic synthesis
- **Simplify conversation summaries** - Remove ID, title, tags, importance_score, created_at
- **Filter memory units** - Only include high-importance/salience items
- **Streamline growth events** - Remove low-impact events

#### **1.2 Leverage InsightDataCompiler for Smart Ontology Summary**

**CRITICAL DISCOVERY**: The `InsightDataCompiler` already provides comprehensive ontology analysis but is **completely underutilized**. Currently, only raw data dumps are sent to the LLM, ignoring the sophisticated analysis.

**CURRENT PROBLEM**: 
- `InsightDataCompiler.compileGraphAnalysis()` provides `keyConceptClusters`, `ontologyGaps`, `structuralMetrics`
- `InsightDataCompiler.compileStrategicInsights()` provides `knowledgeGaps`, `emergentPatterns`, `growthOpportunities`
- **NONE of this analysis is used in the prompt!**

**SOLUTION**: Multi-Tier Ontology Approach with Bias Prevention

```typescript
// Tier 1: Ontology Summary (from InsightDataCompiler - currently ignored!)
const ontologySummary = {
  structuralMetrics: graphAnalysis.structuralMetrics,
  keyConceptClusters: graphAnalysis.keyConceptClusters,
  ontologyGaps: graphAnalysis.ontologyGaps,
  knowledgeGaps: strategicInsights.knowledgeGaps,
  emergentPatterns: strategicInsights.emergentPatterns
};

// Tier 2: Cycle-Specific Data (recent activity)
const cycleData = {
  newConcepts: await this.getConceptsInCycle(userId, cycleDates),
  recentGrowthEvents: await this.getGrowthEventsInCycle(userId, cycleDates),
  conversationSummaries: ingestionSummary.conversationSummaries
};

// Tier 3: Strategic Sampling (simple diversity-based selection)
const strategicSample = await this.getStrategicConceptSample(userId, {
  maxConcepts: 20,
  diversityQuotas: {
    highSalience: 0.3,    // 30% high-salience concepts
    mediumSalience: 0.4,  // 40% medium-salience concepts
    lowSalience: 0.3,     // 30% low-salience concepts
    typeDiversity: true   // Ensure representation across concept types
  }
});
```

**Bias Prevention Strategy:**
1. **Task-Specific Selection**: Each task gets concepts optimized for its specific purpose using appropriate criteria
2. **Semantic Similarity**: Merging uses actual semantic similarity, not arbitrary quotas
3. **Network-Based Selection**: Relationships use graph traversal, not salience scores
4. **Random Sampling**: Communities use random sampling to prevent bias
5. **Quality-Based Filtering**: Description synthesis uses objective quality criteria
6. **Multi-Criteria Analysis**: Archiving combines salience, age, and connection count

#### **1.3 Task-Based Concept Selection Strategy**

**APPROACH**: Work backward from the insight worker's core tasks to determine ideal selection criteria for each specific task, then consolidate.

### **Core Insight Worker Tasks Analysis:**

#### **Task 1: Concept Merging** (`concepts_to_merge`)
**Goal**: Identify concepts that should be merged together
**Selection Strategy**:
- **For each new concept**: Find top 3 most semantically similar existing concepts
- **Use semantic similarity tool**: Leverage existing similarity calculation infrastructure
- **Focus on new concepts**: Only new concepts from current cycle are candidates for merging
- **Quality over quantity**: 3 best matches per new concept, not arbitrary quotas

#### **Task 2: Concept Archiving** (`concepts_to_archive`)
**Goal**: Identify concepts that are outdated, irrelevant, or superseded
**Selection Strategy**:
- **Multi-criteria filtering**: Low salience (≤0.3) AND old (30+ days) AND low connections (≤2)
- **Connection count analysis**: Query actual relationship counts from graph database
- **Temporal decay**: Older concepts get higher priority for archiving
- **Isolation factor**: Concepts with few relationships are more likely to be irrelevant

#### **Task 3: Strategic Relationships** (`new_strategic_relationships`)
**Goal**: Create meaningful connections between concepts
**Selection Strategy**:
- **Start with new concepts**: Only new concepts from current cycle
- **Network traversal**: Get 1-hop and 2-hop connections for each new concept
- **Context-rich selection**: Include connected memory units and concepts
- **Relationship discovery**: Look for missing direct relationships in the network
- **No salience bias**: Connection quality matters more than raw salience scores

#### **Task 4: Community Structure** (`community_structures`)
**Goal**: Identify clusters of related concepts
**Selection Strategy**:
- **Existing communities first**: Get all existing community structures
- **Random sampling**: 3 random concepts from each existing community
- **New concept assignment**: Determine if new concepts belong to existing communities
- **Community creation**: Identify when new communities should be formed
- **Representative sampling**: Random samples prevent bias toward high-salience concepts

#### **Task 5: Description Synthesis** (`concept_description_synthesis`)
**Goal**: Improve concept descriptions based on new information
**Selection Strategy**:
- **Quality-based filtering**: Concepts with poor descriptions (missing, short, placeholder, malformed)
- **Separate task**: This is a distinct task with its own selection criteria
- **Priority by salience**: High-salience concepts get priority for description improvement
- **Clear criteria**: Specific filters for identifying concepts needing better descriptions

### **Comprehensive Task-Based Selection Strategy:**

```typescript
async getStrategicConceptSample(userId: string, cycleDates: CycleDates) {
  // Get new concepts from this cycle
  const newConcepts = await this.getConceptsInCycle(userId, cycleDates);
  
  // Get all active concepts for context
  const allConcepts = await this.dbService.prisma.concepts.findMany({
    where: { user_id: userId, status: 'active' },
    select: {
      concept_id: true, name: true, description: true, type: true, 
      salience: true, created_at: true, merged_into_concept_id: true
    }
  });

  // Task-specific selections
  const selections = {
    // For merging: top 3 most semantically similar to each new concept
    merging: await this.selectForMerging(newConcepts, allConcepts),
    
    // For archiving: low salience + old + low connections
    archiving: await this.selectForArchiving(allConcepts),
    
    // For relationships: new concepts + their 1-2 hop network
    relationships: await this.selectForRelationships(newConcepts, userId),
    
    // For communities: existing communities + random samples
    communities: await this.selectForCommunities(allConcepts, userId),
    
    // For description synthesis: concepts needing better descriptions
    descriptionSynthesis: this.selectForDescriptionSynthesis(allConcepts)
  };

  return selections;
}

// Task 1: Concept Merging - Semantic Similarity Based
private async selectForMerging(newConcepts: any[], allConcepts: any[]) {
  const mergingCandidates = [];
  
  for (const newConcept of newConcepts) {
    // Find top 3 most semantically similar concepts
    const similarConcepts = await this.findSemanticallySimilar(
      newConcept, 
      allConcepts.filter(c => c.concept_id !== newConcept.concept_id),
      3
    );
    mergingCandidates.push(...similarConcepts);
  }
  
  return mergingCandidates;
}

// Task 2: Concept Archiving - Multi-Criteria Selection
private async selectForArchiving(allConcepts: any[]) {
  // Get connection counts for each concept
  const connectionCounts = await this.getConceptConnectionCounts(allConcepts.map(c => c.concept_id));
  
  return allConcepts
    .filter(c => 
      c.salience <= 0.3 && // Low salience
      c.created_at < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && // Old (30+ days)
      (connectionCounts[c.concept_id] || 0) <= 2 // Low connections (≤2)
    )
    .sort((a, b) => a.created_at - b.created_at) // Oldest first
    .slice(0, 10); // Limit to 10 for archiving
}

// Task 3: Strategic Relationships - Network Traversal
private async selectForRelationships(newConcepts: any[], userId: string) {
  const relationshipCandidates = [];
  
  for (const newConcept of newConcepts) {
    // Get connected memory units and concepts (1 hop)
    const connectedEntities = await this.getConnectedEntities(newConcept.concept_id, userId, 1);
    
    // Get 2-hop connections
    const twoHopEntities = await this.getConnectedEntities(newConcept.concept_id, userId, 2);
    
    relationshipCandidates.push({
      newConcept,
      oneHopConnections: connectedEntities,
      twoHopConnections: twoHopEntities
    });
  }
  
  return relationshipCandidates;
}

// Task 4: Community Structure - Existing Communities + Random Samples
private async selectForCommunities(allConcepts: any[], userId: string) {
  // Get existing communities
  const existingCommunities = await this.getExistingCommunities(userId);
  
  // Get random samples from each community
  const communitySamples = [];
  for (const community of existingCommunities) {
    const randomSample = this.getRandomSample(community.member_concept_ids, 3);
    communitySamples.push({
      community,
      sampleConcepts: randomSample
    });
  }
  
  return communitySamples;
}

// Task 5: Description Synthesis - Concepts Needing Better Descriptions
private selectForDescriptionSynthesis(allConcepts: any[]) {
  return allConcepts
    .filter(c => 
      !c.description || // No description
      c.description.length < 20 || // Very short description
      c.description === 'No description' || // Placeholder description
      c.description.includes('undefined') // Malformed description
    )
    .sort((a, b) => b.salience - a.salience) // High salience first
    .slice(0, 15); // Limit to 15
}

// Helper Methods
private async findSemanticallySimilar(targetConcept: any, candidates: any[], limit: number) {
  // Use semantic similarity tool to find most similar concepts
  const similarities = await Promise.all(
    candidates.map(async (candidate) => ({
      concept: candidate,
      similarity: await this.calculateSemanticSimilarity(targetConcept, candidate)
    }))
  );
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(item => item.concept);
}

private async getConceptConnectionCounts(conceptIds: string[]) {
  // Query Neo4j or relationship table for connection counts
  const counts = {};
  for (const conceptId of conceptIds) {
    counts[conceptId] = await this.getConnectionCount(conceptId);
  }
  return counts;
}

private async getConnectedEntities(conceptId: string, userId: string, hops: number) {
  // Traverse the knowledge graph to find connected entities
  // Implementation depends on your graph structure
  return await this.traverseGraph(conceptId, userId, hops);
}

private async getExistingCommunities(userId: string) {
  // Query for existing community structures
  // This might come from a communities table or be derived from graph analysis
  return await this.dbService.prisma.communities.findMany({
    where: { user_id: userId },
    include: { member_concept_ids: true }
  });
}

private getRandomSample(array: any[], count: number) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

#### **1.4 Simplify Conversation Summaries**
```typescript
// Current bloated format
{
  id: `conv_${conv.id}`,
  title: `[CONVERSATION] ${conv.title || 'Untitled Conversation'}`,
  content: conv.context_summary || 'No summary available',
  importance_score: conv.importance_score,
  tags: [],
  created_at: conv.created_at.toISOString()
}

// Proposed simplified format
{
  summary: conv.context_summary || 'No summary available'
}
```

### **Phase 2: Parameter Centralization**

#### **2.1 Create Enhanced operational_parameters.json**
```json
{
  "version": "2.0",
  "description": "Centralized operational parameters for all services",
  "conversation_timeout_seconds": 120,
  "workers": {
    "check_interval_seconds": 30
  },
  "llm_parameters": {
    "dialogue_agent": {
      "temperature": 0.3,
      "max_tokens": 50000,
      "top_p": 0.9
    },
    "insight_worker": {
      "temperature": 0.4,
      "max_tokens": 50000
    },
    "ingestion_worker": {
      "temperature": 0.1,
      "max_tokens": 50000
    },
    "default": {
      "temperature": 0.7,
      "top_k": 40,
      "top_p": 0.95,
      "max_tokens": 50000
    }
  },
  "worker_parameters": {
    "insight_engine": {
      "cycle_duration_days": 2,
      "max_growth_events": 20,
      "max_relationships": 100,
      "context_memory_units_limit": 10,
      "context_concepts_limit": 15,
      "analysis_memory_units_threshold": 4,
      "context_importance_threshold": 6,
      "context_salience_threshold": 0.7,
      "impact_threshold": 2
    },
    "ingestion_worker": {
      "concurrency": 2,
      "attempts": 1,
      "remove_on_complete": 10,
      "remove_on_fail": 50,
      "semantic_similarity_threshold": 0.8,
      "max_memory_units_per_conversation": 10,
      "max_concepts_per_conversation": 15
    },
    "card_worker": {
      "concurrency": 5,
      "retry_attempts": 3,
      "retry_delay_ms": 2000
    },
    "embedding_worker": {
      "concurrency": 3,
      "retry_attempts": 3,
      "retry_delay_ms": 2000,
      "embedding_model_version": "text-embedding-3-small"
    },
    "graph_projection_worker": {
      "concurrency": 2,
      "retry_attempts": 3,
      "retry_delay_ms": 5000
    },
    "maintenance_worker": {
      "stale_redis_key_threshold_hours": 24,
      "archive_conversations_after_days": 730,
      "integrity_check_batch_size": 1000
    }
  },
  "dashboard_parameters": {
    "max_items_per_section": {
      "insights": 3,
      "patterns": 2,
      "recommendations": 2,
      "synthesis": 2,
      "identified_patterns": 3,
      "emerging_themes": 3,
      "focus_areas": 3,
      "blind_spots": 2,
      "celebration_moments": 1,
      "reflection_prompts": 2,
      "exploration_prompts": 2,
      "goal_setting_prompts": 2,
      "skill_development_prompts": 2,
      "creative_expression_prompts": 2,
      "default": 5
    },
    "user_cycles_limit": 10
  },
  "redis_connection_parameters": {
    "max_retries_per_request": null,
    "enable_ready_check": false,
    "lazy_connect": true,
    "keep_alive_ms": 30000,
    "connect_timeout_ms": 10000,
    "command_timeout_ms": 10000,
    "enable_offline_queue": true
  },
  "retrieval_parameters": {
    "max_key_phrases": 5,
    "max_phrase_length": 100,
    "phrase_similarity_threshold": 0.8,
    "weaviate": {
      "results_per_phrase": 3,
      "similarity_threshold": 0.1,
      "timeout_ms": 5000
    },
    "neo4j": {
      "max_result_limit": 100,
      "max_graph_hops": 3,
      "max_seed_entities": 10,
      "query_timeout_ms": 10000
    }
  }
}
```

#### **2.2 Update ConfigService to Load Parameters**
```typescript
// Add to ConfigService.ts
public getOperationalParameters(): OperationalParameters {
  return this.loadConfigFile('operational_parameters.json');
}

public getLLMParameters(serviceName: string): LLMParameters {
  const params = this.getOperationalParameters();
  return params.llm_parameters[serviceName] || params.llm_parameters.default;
}

public getWorkerParameters(workerName: string): WorkerParameters {
  const params = this.getOperationalParameters();
  return params.worker_parameters[workerName] || {};
}
```

### **Phase 3: Memory Schema Optimization**

#### **3.1 Replace User Profile with Derived Artifacts**
```typescript
// Current approach
userProfile: {
  preferences: user.memory_profile || {},
  goals: [],
  interests: [],
  growth_trajectory: user.knowledge_graph_schema || {}
}

// Proposed approach
strategicContext: {
  recentInsights: await this.getRecentDerivedArtifacts(userId, cycleDates),
  proactiveGuidance: await this.getRecentProactivePrompts(userId, cycleDates),
  keyPatterns: await this.getKeyPatterns(userId, cycleDates)
}
```

#### **3.2 Implement Derived Artifacts Integration**

**LLM-Focused Data**: Only include content that directly helps the LLM understand context and make decisions:

```typescript
private async getRecentDerivedArtifacts(userId: string, cycleDates: CycleDates) {
  const artifacts = await this.dbService.prisma.derived_artifacts.findMany({
    where: {
      user_id: userId,
      created_at: {
        gte: cycleDates.cycleStartDate,
        lte: cycleDates.cycleEndDate
      }
    },
    select: {
      artifact_type: true,
      content_narrative: true
    },
    orderBy: { created_at: 'desc' },
    take: 5
  });
  
  return artifacts.map(artifact => ({
    type: artifact.artifact_type,
    content: artifact.content_narrative
  }));
}

private async getRecentProactivePrompts(userId: string, cycleDates: CycleDates) {
  const prompts = await this.dbService.prisma.proactive_prompts.findMany({
    where: {
      user_id: userId,
      created_at: {
        gte: cycleDates.cycleStartDate,
        lte: cycleDates.cycleEndDate
      }
    },
    select: {
      prompt_text: true
    },
    orderBy: { created_at: 'desc' },
    take: 3
  });
  
  return prompts.map(prompt => prompt.prompt_text);
}

// New method to leverage InsightDataCompiler analysis
private async buildOptimizedPrompt(userId: string, cycleDates: CycleDates) {
  // Get comprehensive analysis from InsightDataCompiler
  const [ingestionSummary, graphAnalysis, strategicInsights] = await Promise.all([
    this.insightDataCompiler.compileIngestionActivity(userId, cycleDates),
    this.insightDataCompiler.compileGraphAnalysis(userId),
    this.insightDataCompiler.compileStrategicInsights(userId, cycleDates)
  ]);

  // Get strategic concept sample (task-based selection)
  const strategicConcepts = await this.insightDataCompiler.getStrategicConceptSample(userId, 20);

  // Get derived artifacts (LLM-ready content)
  const derivedArtifacts = await this.getRecentDerivedArtifacts(userId, cycleDates);
  const proactivePrompts = await this.getRecentProactivePrompts(userId, cycleDates);

  return {
    // Ontology Summary (from InsightDataCompiler)
    ontologySummary: {
      structuralMetrics: graphAnalysis.structuralMetrics,
      keyConceptClusters: graphAnalysis.keyConceptClusters,
      ontologyGaps: graphAnalysis.ontologyGaps,
      knowledgeGaps: strategicInsights.knowledgeGaps,
      emergentPatterns: strategicInsights.emergentPatterns
    },
    
    // Cycle-Specific Data
    cycleData: {
      newConcepts: await this.getConceptsInCycle(userId, cycleDates),
      recentGrowthEvents: await this.getGrowthEventsInCycle(userId, cycleDates),
      conversationSummaries: ingestionSummary.conversationSummaries.map(conv => ({
        content: conv.context_summary // Only content, no metadata
      }))
    },
    
    // Strategic Sample (bias-prevented)
    strategicConcepts,
    
    // Derived Insights (LLM-ready)
    derivedArtifacts,
    proactivePrompts
  };
}
```

**Key Principle**: Remove metadata (title, confidence, actionability) that doesn't help LLM reasoning. Focus on content that provides actionable context.

#### **3.3 Remove Deprecated User Fields**
- Remove `memory_profile` field from users table
- Remove `knowledge_graph_schema` field from users table
- Update all references to use derived artifacts instead

### **Phase 4: Implementation Strategy**

#### **4.1 File Modifications Required**

| File | Modification Type | Description |
|------|------------------|-------------|
| `config/operational_parameters.json` | Create/Update | Centralized parameter configuration |
| `packages/tools/src/composite/StrategicSynthesisTool.ts` | Major | Remove relationships, implement two-tier filtering, simplify data |
| `workers/insight-worker/src/InsightEngine.ts` | Major | Replace user profile with derived artifacts, implement two-tier filtering |
| `services/config-service/src/ConfigService.ts` | Minor | Add parameter loading methods |
| `packages/database/prisma/schema.prisma` | Minor | Remove deprecated user fields |
| `packages/tools/src/ai/LLMChatTool.ts` | Minor | Use centralized parameters |
| `services/dialogue-service/src/DialogueAgent.ts` | Minor | Use centralized parameters |
| `workers/ingestion-worker/src/IngestionAnalyst.ts` | Minor | Use centralized parameters |
| `workers/ingestion-worker/src/index.ts` | Minor | Use centralized parameters |
| `workers/card-worker/src/CardWorker.ts` | Minor | Use centralized parameters |
| `workers/embedding-worker/src/EmbeddingWorker.ts` | Minor | Use centralized parameters |
| `workers/graph-projection-worker/src/GraphProjectionWorker.ts` | Minor | Use centralized parameters |
| `workers/maintenance-worker/src/MaintenanceWorker.ts` | Minor | Use centralized parameters |
| `packages/database/src/services/DashboardService.ts` | Minor | Use centralized parameters |

#### **4.2 Implementation Order**
1. **Week 1**: Create enhanced operational_parameters.json and update ConfigService
2. **Week 2**: Implement prompt bloat reduction in StrategicSynthesisTool
3. **Week 3**: Replace user profile with derived artifacts integration
4. **Week 4**: Update all services to use centralized parameters
5. **Week 5**: Remove deprecated user fields and cleanup

#### **4.3 Testing Strategy**
- **Unit Tests**: Test parameter loading and filtering logic
- **Integration Tests**: Verify prompt length reduction
- **Performance Tests**: Measure LLM response time improvements
- **Regression Tests**: Ensure functionality remains intact

---

## **🚀 DETAILED IMPLEMENTATION PLAN**

### **Phase 1: Foundation & Infrastructure (Week 1-2)**

#### **Step 1.1: Bypass Useless InsightDataCompiler - Build Real Analysis in InsightEngine**
**Files to Modify:**
- `workers/insight-worker/src/InsightEngine.ts` (add new methods)

**Implementation:**
```typescript
// Add new methods directly to InsightEngine class
private async getStrategicConceptSample(userId: string, cycleDates: CycleDates): Promise<{
  merging: any[];
  archiving: any[];
  relationships: any[];
  communities: any[];
  descriptionSynthesis: any[];
}> {
  // Build real analysis instead of using useless InsightDataCompiler
  // Implementation as detailed in section 1.3
}

private async getRealGraphAnalysis(userId: string): Promise<{
  structuralMetrics: any;
  keyConceptClusters: any[];
  ontologyGaps: any[];
}> {
  // Build actual graph analysis instead of empty placeholders
  // Use existing tools like SemanticSimilarityTool and HRT
}

// Add helper methods
private async findSemanticallySimilar(targetConcept: any, candidates: any[], limit: number)
private async getConceptConnectionCounts(conceptIds: string[])
private async getConnectedEntities(conceptId: string, userId: string, hops: number)
private async getExistingCommunities(userId: string)
private selectForDescriptionSynthesis(allConcepts: any[])
```

**Dependencies:**
- Use existing `SemanticSimilarityTool` (not create new one)
- Use existing HRT graph traversal via `CypherBuilder`
- Community detection algorithms

#### **Step 1.2: Leverage Existing SemanticSimilarityTool**
**Files to Modify:**
- `workers/insight-worker/src/InsightDataCompiler.ts`

**Implementation:**
```typescript
// Use existing SemanticSimilarityTool instead of creating new one
private async findSemanticallySimilar(targetConcept: any, candidates: any[], limit: number) {
  const semanticTool = new SemanticSimilarityTool(
    this.neo4jClient, // Weaviate client
    this.configService,
    TextEmbeddingTool,
    this.dbService
  );
  
  const result = await semanticTool.execute({
    candidateNames: [targetConcept.name],
    userId: targetConcept.user_id,
    entityTypes: ['concept'],
    maxResults: limit
  });
  
  return result[0]?.bestMatch ? [result[0].bestMatch] : [];
}
```

#### **Step 1.3: Leverage Existing HRT Graph Traversal**
**Files to Modify:**
- `workers/insight-worker/src/InsightDataCompiler.ts`

**Implementation:**
```typescript
// Use existing HRT infrastructure instead of raw Neo4j queries
private async getConnectedEntities(conceptId: string, userId: string, hops: number) {
  // Use existing HydrationAdapter from HRT
  const hydrationAdapter = new HydrationAdapter(this.dbService);
  
  // Get 1-hop and 2-hop connections using existing HRT methods
  const oneHopEntities = await this.getEntitiesAtHops(conceptId, userId, 1);
  const twoHopEntities = await this.getEntitiesAtHops(conceptId, userId, 2);
  
  return {
    oneHop: oneHopEntities,
    twoHop: twoHopEntities
  };
}

private async getEntitiesAtHops(conceptId: string, userId: string, hops: number) {
  // Use existing CypherBuilder from HRT
  const cypherBuilder = new CypherBuilder();
  const query = cypherBuilder.buildTraversalQuery('concept_relationships', {
    seedEntities: [{ id: conceptId, type: 'Concept' }],
    userId,
    hops,
    limit: 20
  });
  
  const session = this.neo4jClient.session();
  try {
    const result = await session.run(query.cypher, query.params);
    return this.processTraversalResult(result);
  } finally {
    await session.close();
  }
}
```

### **Phase 2: Prompt Optimization (Week 2-3)**

#### **Step 2.1: Update InsightEngine to Use Optimized Prompts**
**Files to Modify:**
- `workers/insight-worker/src/InsightEngine.ts`

**Implementation:**
```typescript
// Replace gatherComprehensiveContext method - NO NEW CLASS NEEDED
private async gatherComprehensiveContext(userId: string, jobId: string, cycleDates: CycleDates) {
  // BYPASS USELESS InsightDataCompiler - Build real analysis directly
  const [ingestionSummary, graphAnalysis, strategicInsights] = await Promise.all([
    this.getRealIngestionSummary(userId, cycleDates),
    this.getRealGraphAnalysis(userId),
    this.getRealStrategicInsights(userId, cycleDates)
  ]);

  // Get task-based concept selections (new method)
  const conceptSelections = await this.getStrategicConceptSample(userId, cycleDates);

  // Get derived artifacts and proactive prompts (existing methods)
  const derivedArtifacts = await this.getRecentDerivedArtifacts(userId, cycleDates);
  const proactivePrompts = await this.getRecentProactivePrompts(userId, cycleDates);

  // Build optimized StrategicSynthesisInput
  const strategicInput: StrategicSynthesisInput = {
    userId,
    userName: user.name || 'User',
    cycleId: `cycle-${userId}-${Date.now()}`,
    cycleStartDate: cycleDates.cycleStartDate,
    cycleEndDate: cycleDates.cycleEndDate,
    currentKnowledgeGraph: {
      memoryUnits: ingestionSummary.conversationSummaries.map(conv => ({
        id: `conv_${conv.id}`,
        title: `[CONVERSATION] ${conv.title || 'Untitled Conversation'}`,
        content: conv.context_summary || 'No summary available',
        importance_score: conv.importance_score,
        tags: [],
        created_at: conv.created_at.toISOString()
      })),
      concepts: conceptSelections.merging.concat(
        conceptSelections.archiving,
        conceptSelections.relationships,
        conceptSelections.communities,
        conceptSelections.descriptionSynthesis
      ),
      relationships: [], // Remove relationships section
      conceptsNeedingSynthesis: conceptSelections.descriptionSynthesis
    },
    recentGrowthEvents: await this.getGrowthEventsInCycle(userId, cycleDates),
    userProfile: {
      preferences: {},
      goals: [],
      interests: [],
      growth_trajectory: {
        structuralMetrics: graphAnalysis.structuralMetrics,
        keyConceptClusters: graphAnalysis.keyConceptClusters,
        ontologyGaps: graphAnalysis.ontologyGaps,
        knowledgeGaps: strategicInsights.knowledgeGaps,
        emergentPatterns: strategicInsights.emergentPatterns
      }
    },
    workerType: 'insight-worker',
    workerJobId: jobId
  };

  return { strategicInput };
}
```

### **Phase 3: Parameter Centralization (Week 3-4)**

#### **Step 3.1: Enhance operational_parameters.json**
**Files to Modify:**
- `config/operational_parameters.json`

**Implementation:**
```json
{
  "version": "2.0",
  "description": "Centralized operational parameters for all services",
  "llm_parameters": {
    "dialogue_agent": {
      "temperature": 0.3,
      "max_tokens": 50000,
      "top_p": 0.9
    },
    "insight_worker": {
      "temperature": 0.4,
      "max_tokens": 50000
    },
    "ingestion_worker": {
      "temperature": 0.1,
      "max_tokens": 50000
    },
    "default": {
      "temperature": 0.7,
      "top_k": 40,
      "top_p": 0.95,
      "max_tokens": 50000
    }
  },
  "worker_parameters": {
    "insight_engine": {
      "cycle_duration_days": 2,
      "max_growth_events": 20,
      "max_relationships": 100,
      "max_memory_units": 10,
      "max_concepts": 15,
      "concept_merging": {
        "similarity_threshold": 0.8,
        "max_candidates_per_concept": 3
      },
      "concept_archiving": {
        "salience_threshold": 0.3,
        "age_threshold_days": 30,
        "connection_threshold": 2
      },
      "strategic_relationships": {
        "max_hops": 2,
        "include_memory_units": true
      },
      "community_structure": {
        "sample_size_per_community": 3,
        "min_community_size": 2
      },
      "description_synthesis": {
        "min_description_length": 20,
        "max_candidates": 15
      }
    },
    "ingestion_worker": {
      "concurrency": 2,
      "attempts": 1,
      "removeOnComplete": 10,
      "removeOnFail": 50,
      "semantic_similarity_threshold": 0.8,
      "max_memory_units_per_conversation": 10,
      "max_concepts_per_conversation": 15
    },
    "card_worker": {
      "concurrency": 5,
      "retryAttempts": 3,
      "retryDelay": 2000
    },
    "embedding_worker": {
      "concurrency": 3,
      "retryAttempts": 3,
      "retryDelay": 2000,
      "embeddingModelVersion": "text-embedding-3-small"
    },
    "maintenance_worker": {
      "stale_redis_key_threshold_hours": 24,
      "archive_conversations_after_days": 730,
      "integrity_check_batch_size": 1000
    }
  },
  "dashboard_parameters": {
    "max_items_per_section": {
      "insights": 5,
      "patterns": 3,
      "recommendations": 4,
      "synthesis": 2,
      "themes": 3,
      "focus_areas": 2,
      "blind_spots": 1,
      "celebration_moments": 1
    },
    "default_max_items": 5,
    "user_cycles_limit": 10
  },
  "redis_parameters": {
    "maxRetriesPerRequest": null,
    "enableReadyCheck": false,
    "lazyConnect": true,
    "keepAlive": 30000,
    "connectTimeout": 10000,
    "commandTimeout": 10000,
    "enableOfflineQueue": true
  }
}
```

#### **Step 3.2: Update All Services to Use Centralized Parameters**
**Files to Modify:**
- `packages/tools/src/ai/LLMChatTool.ts`
- `services/dialogue-service/src/DialogueAgent.ts`
- `workers/ingestion-worker/src/IngestionAnalyst.ts`
- `workers/insight-worker/src/InsightEngine.ts`
- `packages/database/src/services/DashboardService.ts`

**Implementation Pattern:**
```typescript
// Example for LLMChatTool.ts
private async getLLMParameters(workerType: string = 'default') {
  const config = await this.configService.getConfig('operational_parameters');
  const workerConfig = config.llm_parameters[workerType] || config.llm_parameters.default;
  
  return {
    temperature: workerConfig.temperature,
    maxTokens: workerConfig.max_tokens,
    topP: workerConfig.top_p,
    topK: workerConfig.top_k
  };
}
```

### **Phase 4: Delete InsightDataCompiler.ts (Week 4)**

#### **Step 4.1: Remove InsightDataCompiler Dependencies**
**Files to Modify:**
- `workers/insight-worker/src/InsightEngine.ts` (remove constructor parameter and all calls)
- `workers/insight-worker/src/index.ts` (remove instantiation)
- `workers/insight-worker/src/InsightDataCompiler.ts` (DELETE FILE)

**Implementation:**
```typescript
// InsightEngine.ts - Remove InsightDataCompiler dependency
constructor(
  private strategicSynthesisTool: StrategicSynthesisTool,
  private dbService: DatabaseService,
  private cardQueue: Queue,
  private graphQueue: Queue,
  private embeddingQueue: Queue
  // REMOVE: private insightDataCompiler: InsightDataCompiler
) {
  // ... rest of constructor
}

// Remove all InsightDataCompiler calls and replace with direct data fetching
private async processUserCycle(userId: string, jobId: string, cycleDates: CycleDates) {
  // REMOVE: const [ingestionSummary, graphAnalysis, strategicInsights] = await Promise.all([
  //   this.insightDataCompiler.compileIngestionActivity(userId, cycleDates),
  //   this.insightDataCompiler.compileGraphAnalysis(userId),
  //   this.insightDataCompiler.compileStrategicInsights(userId, cycleDates)
  // ]);

  // REPLACE with direct data fetching as outlined in systematic approach
  const context = await this.gatherComprehensiveContext(userId, jobId, cycleDates);
  const strategicInput = await this.buildOptimizedStrategicInput(/* ... */);
  
  // ... rest of method
}
```

#### **Step 4.2: Delete InsightDataCompiler.ts File**
**Action:**
- Delete `workers/insight-worker/src/InsightDataCompiler.ts` entirely
- Remove all imports and references to InsightDataCompiler
- Update any tests that reference InsightDataCompiler

**Rationale:**
- File provides no useful analysis (empty placeholders, arbitrary multipliers)
- Direct database queries are more efficient and transparent
- Eliminates unnecessary complexity and maintenance burden

### **Phase 5: User Memory Profile Generation (Week 5)**

#### **Step 4.1: Add User Memory Profile Generation to Insight Worker**
**Files to Modify:**
- `packages/tools/src/composite/StrategicSynthesisTool.ts` (add new output type)
- `workers/insight-worker/src/InsightEngine.ts` (save generated profile)

**Implementation:**
```typescript
// StrategicSynthesisTool.ts - Add to StrategicSynthesisOutputSchema
derived_artifacts: z.array(z.object({
  artifact_type: z.enum(['insight', 'pattern', 'recommendation', 'synthesis', 'identified_pattern', 'emerging_theme', 'focus_area', 'blind_spot', 'celebration_moment', 'user_memory_profile']), // Add 'user_memory_profile'
  title: z.string(),
  content: z.string(),
  confidence_score: z.number().min(0).max(1),
  supporting_evidence: z.array(z.string()),
  actionability: z.enum(['immediate', 'short_term', 'long_term', 'aspirational']),
  content_data: z.record(z.any()).optional(),
  source_concept_ids: z.array(z.string()).optional(),
  source_memory_unit_ids: z.array(z.string()).optional()
})),

// InsightEngine.ts - Save user memory profile to users table
private async saveUserMemoryProfile(userId: string, profileContent: string) {
  await this.dbService.prisma.users.update({
    where: { user_id: userId },
    data: { memory_profile: profileContent }
  });
}

// In processUserCycle method, after strategic synthesis
const userMemoryProfileArtifact = output.derived_artifacts.find(
  artifact => artifact.artifact_type === 'user_memory_profile'
);

if (userMemoryProfileArtifact) {
  await this.saveUserMemoryProfile(userId, userMemoryProfileArtifact.content);
  console.log(`[InsightEngine] Updated user memory profile for user ${userId}`);
}
```

#### **Step 4.2: Remove Knowledge Graph Schema Field**
**Files to Modify:**
- `packages/database/prisma/schema.prisma`
- `packages/database/src/migrations/` (new migration)
- `services/dialogue-service/src/PromptBuilder.ts` (remove reference)
- `workers/ingestion-worker/src/IngestionAnalyst.ts` (remove reference)
- `config/prompt_templates.yaml` (remove template)

**Implementation:**
```sql
-- Migration: Remove knowledge_graph_schema field
ALTER TABLE users DROP COLUMN knowledge_graph_schema;
```

```typescript
// PromptBuilder.ts - Remove knowledge_graph_schema reference
const section3Data = {
  // Remove: knowledge_graph_schema: this.formatComponentContent('knowledge_graph_schema', user.knowledge_graph_schema),
  user_memory_profile: this.formatComponentContent('user_memory_profile', user.memory_profile),
  conversation_summaries: this.formatComponentContent('conversation_summaries', recentSummaries),
  // ... rest of the data
};

// IngestionAnalyst.ts - Remove knowledgeGraphSchema from gatherContextData
const { fullConversationTranscript, userMemoryProfile, userName } = 
  await this.gatherContextData(conversationId, userId);

// Update HolisticAnalysisTool call to remove knowledgeGraphSchema parameter
const analysisOutput = await this.holisticAnalysisTool.execute({
  userId,
  userName,
  fullConversationTranscript,
  userMemoryProfile,
  // Remove: knowledgeGraphSchema,
  workerType: 'ingestion-worker',
  workerJobId: job.id || 'unknown',
  conversationId,
  messageId: undefined
});
```

```yaml
# config/prompt_templates.yaml - Remove knowledge_graph_schema template
# Remove entire knowledge_graph_schema_template section (lines 418-430)
```

**Impact Analysis:**
- **Graph Projection Worker**: ✅ **NO IMPACT** - Does not use `knowledge_graph_schema` at all
- **Dialogue Agent**: ⚠️ **MINOR IMPACT** - Removes schema from prompt context (currently used for Cypher query generation)
- **Ingestion Analyst**: ⚠️ **MINOR IMPACT** - Removes schema from holistic analysis input
- **Insight Engine**: ✅ **NO IMPACT** - Already generates and updates this field

**What We're Losing:**
- **Cypher Query Context**: Dialogue agent uses schema to generate valid Neo4j queries
- **Ontology Awareness**: Ingestion analyst uses schema to understand concept/relationship types
- **Graph Structure Knowledge**: Both services lose awareness of user's graph structure patterns

**Mitigation Strategy:**
- **For Dialogue Agent**: Use `InsightDataCompiler.compileGraphAnalysis()` to get current graph structure
- **For Ingestion Analyst**: Use `InsightDataCompiler.compileStrategicInsights()` for ontology awareness
- **Alternative**: Generate schema on-demand from current graph state instead of storing it

#### **Step 4.3: Update Prompt Templates for User Memory Profile Generation**
**Files to Modify:**
- `config/prompt_templates.yaml`

**Implementation:**
```yaml
# Add to strategic_synthesis section
user_memory_profile_generation: |
  Generate a comprehensive user memory profile that captures:
  - Who the user is (identity, values, beliefs)
  - What they stand for and care about
  - Their goals and aspirations
  - Important people in their life
  - Key life experiences and milestones
  - Current focus areas and interests
  - Learning patterns and preferences
  - Communication style and preferences
  
  This should be a rich, narrative summary that helps other AI systems understand the user's context and personality.
  Use evidence from conversations, memory units, and concept relationships to build this profile.
```

**Key Benefits:**
- **Dynamic Profile**: User memory profile is now generated and updated by insight worker
- **Comprehensive**: Captures rich user context from all available data
- **Backward Compatible**: Existing services continue to use `memory_profile` field as usual
- **Cleaner Schema**: Removes unused `knowledge_graph_schema` field

---

## **📊 EXPECTED IMPACT**

### **Performance Improvements**
- **Prompt Length Reduction**: 50-70% reduction in prompt size through ontology summaries
- **LLM Response Time**: 30-40% faster due to focused, analyzed data
- **Token Usage**: 50-60% reduction in token consumption
- **Memory Usage**: 40-50% reduction in memory footprint
- **Strategic Analysis Quality**: Enhanced through comprehensive ontology analysis
- **Bias Prevention**: Task-specific selection prevents concept selection feedback loops
- **Leveraged Infrastructure**: Utilizes existing InsightDataCompiler analysis instead of raw data dumps

### **Maintainability Improvements**
- **Centralized Configuration**: Single source of truth for parameters
- **Easier Tuning**: Parameters can be adjusted without code changes
- **Better Monitoring**: Centralized logging of parameter usage
- **Reduced Duplication**: Eliminate hardcoded values across services

### **Data Quality Improvements**
- **Relevant Context**: Only high-importance data included in context prompts
- **Comprehensive Analysis**: Full concept data available for strategic decision-making
- **Actionable Insights**: Derived artifacts provide better context than raw schemas
- **Reduced Noise**: Filtered context data reduces LLM confusion
- **Better Synthesis**: Cleaner input leads to better strategic analysis
- **Preserved Functionality**: Two-tier approach maintains insight worker capabilities

---

## **⚠️ RISKS & MITIGATION**

### **Risks**
1. **Data Loss**: Removing fields might break existing functionality
2. **Performance Regression**: Filtering might add overhead
3. **Configuration Complexity**: Centralized config might become unwieldy
4. **Migration Issues**: Database schema changes require careful migration
5. **Strategic Analysis Degradation**: Over-filtering concepts could impact insight worker capabilities

### **Mitigation Strategies**
1. **Gradual Migration**: Implement changes incrementally with feature flags
2. **Comprehensive Testing**: Extensive testing at each phase
3. **Rollback Plan**: Maintain ability to revert changes quickly
4. **Monitoring**: Add metrics to track performance and data quality
5. **Two-Tier Approach**: Preserve full data for analysis while filtering context for efficiency
6. **A/B Testing**: Test filtering thresholds to ensure strategic analysis quality

---

## **✅ SUCCESS CRITERIA**

### **Quantitative Metrics**
- Prompt length reduced by at least 40% (context data only)
- LLM response time improved by at least 20%
- Token usage reduced by at least 40%
- All hardcoded parameters moved to centralized config
- Strategic analysis quality maintained (no degradation in concept merging/archiving capabilities)

### **Qualitative Metrics**
- Improved strategic synthesis quality
- Easier parameter tuning and maintenance
- Cleaner, more focused prompts
- Better separation of concerns
- Preserved insight worker functionality (concept merging, archiving, strategic relationships)

---

## **🚀 NEXT STEPS**

1. **Review and Approve Plan**: Get stakeholder approval for implementation
2. **Create Implementation Branch**: Set up feature branch for development
3. **Begin Phase 1**: Start with prompt bloat reduction
4. **Monitor Progress**: Track metrics and adjust as needed
5. **Deploy Incrementally**: Roll out changes in phases with monitoring

---

**Document Status**: Ready for Implementation  
**Next Review**: After Phase 1 completion  
**Owner**: Development Team  
**Stakeholders**: Product, Engineering, Operations
