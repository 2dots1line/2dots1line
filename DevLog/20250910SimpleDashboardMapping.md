# Simple Dashboard Mapping: Insight Worker Outputs to Dashboard Sections

## 1. Overview

**Goal**: Create a clean 1-to-1 mapping from existing insight worker outputs to dashboard sections without introducing new taxonomy or terminology.

**Principle**: Use existing field names and types from the insight worker output structure.

## 2. Simplified Insight Worker Output Structure

Based on the actual insight worker logs and code analysis, with simplifications:

```typescript
interface StrategicSynthesisOutput {
  derived_artifacts: Array<{
    artifact_type: "insight" | "pattern" | "recommendation" | "synthesis" | "identified_pattern" | "emerging_theme" | "focus_area" | "blind_spot" | "celebration_moment";
    title: string;
    content: string;
    confidence_score: number;
    supporting_evidence: string[];
    actionability: "immediate" | "short_term" | "long_term" | "aspirational";
    source_concept_ids: string[];
    source_memory_unit_ids: string[];
  }>;
  
  proactive_prompts: Array<{
    prompt_type: "reflection" | "exploration" | "goal_setting" | "skill_development" | "creative_expression";
    title: string;
    prompt_text: string;
    context_explanation: string;
    timing_suggestion: "next_conversation" | "weekly_check_in" | "monthly_review" | "quarterly_planning";
    priority_level: number;
  }>;
  
  // REMOVED: growth_trajectory_updates (merged into derived_artifacts)
  // REMOVED: cycle_metrics (not meaningful for users)
}
```

## 3. Simple 1-to-1 Dashboard Section Mapping

### 3.1 Derived Artifacts → Dashboard Sections

```json
{
  "dashboard_sections": {
    "insights": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'insight'",
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score",
        "actionability": "actionability"
      },
      "sort_by": "confidence_score",
      "max_items": 3
    },
    "patterns": {
      "data_source": "derived_artifacts", 
      "filter": "artifact_type = 'pattern'",
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score"
      },
      "sort_by": "confidence_score",
      "max_items": 2
    },
    "recommendations": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'recommendation'", 
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score",
        "actionability": "actionability"
      },
      "sort_by": "confidence_score",
      "max_items": 2
    },
    "synthesis": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'synthesis'",
      "display_fields": {
        "title": "title", 
        "content": "content",
        "confidence": "confidence_score"
      },
      "sort_by": "confidence_score",
      "max_items": 2
    },
    "identified_patterns": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'identified_pattern'",
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score"
      },
      "sort_by": "confidence_score",
      "max_items": 3
    },
    "emerging_themes": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'emerging_theme'",
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score"
      },
      "sort_by": "confidence_score",
      "max_items": 3
    },
    "focus_areas": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'focus_area'",
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score",
        "actionability": "actionability"
      },
      "sort_by": "confidence_score",
      "max_items": 3
    },
    "blind_spots": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'blind_spot'",
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score"
      },
      "sort_by": "confidence_score",
      "max_items": 2
    },
    "celebration_moments": {
      "data_source": "derived_artifacts",
      "filter": "artifact_type = 'celebration_moment'",
      "display_fields": {
        "title": "title",
        "content": "content",
        "confidence": "confidence_score"
      },
      "sort_by": "confidence_score",
      "max_items": 1
    }
  }
}
```

### 3.2 Proactive Prompts → Dashboard Sections

```json
{
  "dashboard_sections": {
    "reflection_prompts": {
      "data_source": "proactive_prompts",
      "filter": "prompt_type = 'reflection'",
      "display_fields": {
        "title": "title",
        "content": "prompt_text",
        "context": "context_explanation",
        "timing": "timing_suggestion",
        "priority": "priority_level"
      },
      "sort_by": "priority_level",
      "max_items": 2
    },
    "exploration_prompts": {
      "data_source": "proactive_prompts",
      "filter": "prompt_type = 'exploration'",
      "display_fields": {
        "title": "title",
        "content": "prompt_text", 
        "context": "context_explanation",
        "timing": "timing_suggestion",
        "priority": "priority_level"
      },
      "sort_by": "priority_level",
      "max_items": 2
    },
    "goal_setting_prompts": {
      "data_source": "proactive_prompts",
      "filter": "prompt_type = 'goal_setting'",
      "display_fields": {
        "title": "title",
        "content": "prompt_text",
        "context": "context_explanation", 
        "timing": "timing_suggestion",
        "priority": "priority_level"
      },
      "sort_by": "priority_level",
      "max_items": 2
    },
    "skill_development_prompts": {
      "data_source": "proactive_prompts",
      "filter": "prompt_type = 'skill_development'",
      "display_fields": {
        "title": "title",
        "content": "prompt_text",
        "context": "context_explanation",
        "timing": "timing_suggestion", 
        "priority": "priority_level"
      },
      "sort_by": "priority_level",
      "max_items": 2
    },
    "creative_expression_prompts": {
      "data_source": "proactive_prompts",
      "filter": "prompt_type = 'creative_expression'",
      "display_fields": {
        "title": "title",
        "content": "prompt_text",
        "context": "context_explanation",
        "timing": "timing_suggestion",
        "priority": "priority_level"
      },
      "sort_by": "priority_level",
      "max_items": 2
    }
  }
}
```

### 3.3 Summary of Changes

**REMOVED SECTIONS:**
- `growth_trajectory_updates` → Merged into `derived_artifacts` with new artifact types
- `cycle_metrics` → Removed entirely (not meaningful for users)

**NEW ARTIFACT TYPES:**
- `identified_pattern` (was in growth_trajectory_updates.identified_patterns)
- `emerging_theme` (was in growth_trajectory_updates.emerging_themes)  
- `focus_area` (was in growth_trajectory_updates.recommended_focus_areas)
- `blind_spot` (was in growth_trajectory_updates.potential_blind_spots)
- `celebration_moment` (was in growth_trajectory_updates.celebration_moments)

## 4. Database Query Mapping

### 4.1 Derived Artifacts Queries

```sql
-- Get insights
SELECT title, content_narrative, confidence_score, actionability, created_at
FROM derived_artifacts 
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'insight'
ORDER BY confidence_score DESC
LIMIT 3;

-- Get patterns  
SELECT title, content_narrative, confidence_score, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'pattern'
ORDER BY confidence_score DESC
LIMIT 2;

-- Get recommendations
SELECT title, content_narrative, confidence_score, actionability, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'recommendation'
ORDER BY confidence_score DESC
LIMIT 2;

-- Get synthesis
SELECT title, content_narrative, confidence_score, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'synthesis'
ORDER BY confidence_score DESC
LIMIT 2;

-- Get identified patterns (NEW)
SELECT title, content_narrative, confidence_score, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'identified_pattern'
ORDER BY confidence_score DESC
LIMIT 3;

-- Get emerging themes (NEW)
SELECT title, content_narrative, confidence_score, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'emerging_theme'
ORDER BY confidence_score DESC
LIMIT 3;

-- Get focus areas (NEW)
SELECT title, content_narrative, confidence_score, actionability, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'focus_area'
ORDER BY confidence_score DESC
LIMIT 3;

-- Get blind spots (NEW)
SELECT title, content_narrative, confidence_score, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'blind_spot'
ORDER BY confidence_score DESC
LIMIT 2;

-- Get celebration moments (NEW)
SELECT title, content_narrative, confidence_score, created_at
FROM derived_artifacts
WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'celebration_moment'
ORDER BY confidence_score DESC
LIMIT 1;
```

### 4.2 Proactive Prompts Queries

```sql
-- Get reflection prompts
SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
FROM proactive_prompts
WHERE user_id = ? AND prompt_type = 'reflection'
ORDER BY priority_level DESC
LIMIT 2;

-- Get exploration prompts
SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
FROM proactive_prompts
WHERE user_id = ? AND prompt_type = 'exploration'
ORDER BY priority_level DESC
LIMIT 2;

-- Get goal setting prompts
SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
FROM proactive_prompts
WHERE user_id = ? AND prompt_type = 'goal_setting'
ORDER BY priority_level DESC
LIMIT 2;

-- Get skill development prompts
SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
FROM proactive_prompts
WHERE user_id = ? AND prompt_type = 'skill_development'
ORDER BY priority_level DESC
LIMIT 2;

-- Get creative expression prompts
SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
FROM proactive_prompts
WHERE user_id = ? AND prompt_type = 'creative_expression'
ORDER BY priority_level DESC
LIMIT 2;
```

### 4.3 Summary of Query Changes

**REMOVED QUERIES:**
- Growth trajectory updates query (no longer needed - data is now in derived_artifacts)

**UPDATED QUERIES:**
- All derived_artifacts queries now include `cycle_id` parameter
- All proactive_prompts queries now include `cycle_id` parameter

## 5. Simple Dashboard API Response

```typescript
interface SimpleDashboardResponse {
  user_id: string;
  cycle_id: string;
  generated_at: string;
  sections: {
    // Original derived artifacts
    insights: Array<{
      title: string;
      content: string;
      confidence: number;
      actionability: string;
      created_at: string;
    }>;
    patterns: Array<{
      title: string;
      content: string;
      confidence: number;
      created_at: string;
    }>;
    recommendations: Array<{
      title: string;
      content: string;
      confidence: number;
      actionability: string;
      created_at: string;
    }>;
    synthesis: Array<{
      title: string;
      content: string;
      confidence: number;
      created_at: string;
    }>;
    
    // NEW: Former growth trajectory items as derived artifacts
    identified_patterns: Array<{
      title: string;
      content: string;
      confidence: number;
      created_at: string;
    }>;
    emerging_themes: Array<{
      title: string;
      content: string;
      confidence: number;
      created_at: string;
    }>;
    focus_areas: Array<{
      title: string;
      content: string;
      confidence: number;
      actionability: string;
      created_at: string;
    }>;
    blind_spots: Array<{
      title: string;
      content: string;
      confidence: number;
      created_at: string;
    }>;
    celebration_moments: Array<{
      title: string;
      content: string;
      confidence: number;
      created_at: string;
    }>;
    
    // Proactive prompts (unchanged)
    reflection_prompts: Array<{
      title: string;
      content: string;
      context: string;
      timing: string;
      priority: number;
      created_at: string;
    }>;
    exploration_prompts: Array<{
      title: string;
      content: string;
      context: string;
      timing: string;
      priority: number;
      created_at: string;
    }>;
    goal_setting_prompts: Array<{
      title: string;
      content: string;
      context: string;
      timing: string;
      priority: number;
      created_at: string;
    }>;
    skill_development_prompts: Array<{
      title: string;
      content: string;
      context: string;
      timing: string;
      priority: number;
      created_at: string;
    }>;
    creative_expression_prompts: Array<{
      title: string;
      content: string;
      context: string;
      timing: string;
      priority: number;
      created_at: string;
    }>;
  };
}
```

## 6. Required Changes

### 6.1 StrategicSynthesisTool.ts Updates

**Remove from output schema:**
```typescript
// REMOVE these from StrategicSynthesisOutputSchema
growth_trajectory_updates: z.object({
  identified_patterns: z.array(z.string()),
  emerging_themes: z.array(z.string()),
  recommended_focus_areas: z.array(z.string()),
  potential_blind_spots: z.array(z.string()),
  celebration_moments: z.array(z.string())
}),
cycle_metrics: z.object({
  knowledge_graph_health: z.number().min(0).max(1),
  ontology_coherence: z.number().min(0).max(1),
  growth_momentum: z.number().min(0).max(1),
  strategic_alignment: z.number().min(0).max(1),
  insight_generation_rate: z.number().min(0).max(1)
})
```

**Add to derived_artifacts schema:**
```typescript
// UPDATE artifact_type enum to include new types
artifact_type: z.enum([
  'insight', 'pattern', 'recommendation', 'synthesis',
  'identified_pattern', 'emerging_theme', 'focus_area', 'blind_spot', 'celebration_moment'
])
```

### 6.2 Insight Worker Prompt Updates

**Update LLM prompt to generate individual artifacts instead of grouped arrays:**
```typescript
// OLD: Generate grouped arrays
"Generate growth trajectory updates with identified_patterns, emerging_themes, etc."

// NEW: Generate individual derived artifacts
"Generate individual derived artifacts for each identified pattern, emerging theme, focus area, blind spot, and celebration moment. Each should be a separate artifact with appropriate artifact_type."
```

### 6.3 InsightEngine.ts Updates

**Update persistence logic:**
```typescript
// REMOVE: growth_trajectory_updates persistence
// REMOVE: cycle_metrics persistence

// UPDATE: derived_artifacts persistence to handle new artifact types
for (const artifact of derived_artifacts) {
  const artifactData: CreateDerivedArtifactData = {
    user_id: userId,
    cycle_id: cycleId,
    artifact_type: artifact.artifact_type, // Now includes new types
    title: artifact.title,
    content_narrative: artifact.content,
    content_data: artifact.content_data || null,
    source_concept_ids: artifact.source_concept_ids || [],
    source_memory_unit_ids: artifact.source_memory_unit_ids || []
  };
  
  await this.derivedArtifactRepository.create(artifactData);
}
```

## 7. Implementation Steps

### Step 1: Database Schema Updates
```sql
-- Add cycle_id to existing tables
ALTER TABLE derived_artifacts ADD COLUMN cycle_id TEXT;
ALTER TABLE proactive_prompts ADD COLUMN cycle_id TEXT;

-- Add indexes for efficient querying
CREATE INDEX idx_derived_artifacts_cycle_id ON derived_artifacts(cycle_id);
CREATE INDEX idx_proactive_prompts_cycle_id ON proactive_prompts(cycle_id);
CREATE INDEX idx_derived_artifacts_type ON derived_artifacts(artifact_type);
CREATE INDEX idx_proactive_prompts_type ON proactive_prompts(prompt_type);
```

### Step 2: Update Insight Worker
```typescript
// In InsightEngine.ts - Update persistStrategicUpdates method
private async persistStrategicUpdates(
  userId: string,
  cycleId: string, // NEW: Add cycle context
  analysisOutput: StrategicSynthesisOutput
): Promise<Array<{ id: string; type: string }>> {
  
  // Create Derived Artifacts with cycle_id
  for (const artifact of derived_artifacts) {
    const artifactData: CreateDerivedArtifactData = {
      user_id: userId,
      cycle_id: cycleId, // NEW: Link to cycle
      artifact_type: artifact.artifact_type,
      title: artifact.title,
      content_narrative: artifact.content,
      content_data: artifact.content_data || null,
      source_concept_ids: artifact.source_concept_ids || [],
      source_memory_unit_ids: artifact.source_memory_unit_ids || []
    };

    const createdArtifact = await this.derivedArtifactRepository.create(artifactData);
    newEntities.push({ id: createdArtifact.artifact_id, type: 'DerivedArtifact' });
  }

  // Create Proactive Prompts with cycle_id
  for (const prompt of proactive_prompts) {
    const promptData: CreateProactivePromptData = {
      user_id: userId,
      cycle_id: cycleId, // NEW: Link to cycle
      prompt_text: prompt.prompt_text,
      source_agent: 'InsightEngine',
      metadata: {
        prompt_type: prompt.prompt_type,
        timing_suggestion: prompt.timing_suggestion,
        priority_level: prompt.priority_level,
        context_explanation: prompt.context_explanation
      }
    };

    const createdPrompt = await this.proactivePromptRepository.create(promptData);
    newEntities.push({ id: createdPrompt.prompt_id, type: 'ProactivePrompt' });
  }

  return newEntities;
}
```

### Step 3: Create Simple Dashboard API
```typescript
// GET /api/v1/dashboard/simple?user_id={userId}&cycle_id={cycleId}
export async function getSimpleDashboard(userId: string, cycleId: string) {
  const [
    insights,
    patterns, 
    recommendations,
    synthesis,
    reflectionPrompts,
    explorationPrompts,
    goalSettingPrompts,
    skillDevelopmentPrompts,
    creativeExpressionPrompts,
    userProfile
  ] = await Promise.all([
    // Derived artifacts queries
    db.query(`
      SELECT title, content_narrative, confidence_score, actionability, created_at
      FROM derived_artifacts 
      WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'insight'
      ORDER BY confidence_score DESC LIMIT 3
    `, [userId, cycleId]),
    
    db.query(`
      SELECT title, content_narrative, confidence_score, created_at
      FROM derived_artifacts
      WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'pattern'
      ORDER BY confidence_score DESC LIMIT 2
    `, [userId, cycleId]),
    
    db.query(`
      SELECT title, content_narrative, confidence_score, actionability, created_at
      FROM derived_artifacts
      WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'recommendation'
      ORDER BY confidence_score DESC LIMIT 2
    `, [userId, cycleId]),
    
    db.query(`
      SELECT title, content_narrative, confidence_score, created_at
      FROM derived_artifacts
      WHERE user_id = ? AND cycle_id = ? AND artifact_type = 'synthesis'
      ORDER BY confidence_score DESC LIMIT 2
    `, [userId, cycleId]),
    
    // Proactive prompts queries
    db.query(`
      SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
      FROM proactive_prompts
      WHERE user_id = ? AND cycle_id = ? AND prompt_type = 'reflection'
      ORDER BY priority_level DESC LIMIT 2
    `, [userId, cycleId]),
    
    db.query(`
      SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
      FROM proactive_prompts
      WHERE user_id = ? AND cycle_id = ? AND prompt_type = 'exploration'
      ORDER BY priority_level DESC LIMIT 2
    `, [userId, cycleId]),
    
    db.query(`
      SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
      FROM proactive_prompts
      WHERE user_id = ? AND cycle_id = ? AND prompt_type = 'goal_setting'
      ORDER BY priority_level DESC LIMIT 2
    `, [userId, cycleId]),
    
    db.query(`
      SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
      FROM proactive_prompts
      WHERE user_id = ? AND cycle_id = ? AND prompt_type = 'skill_development'
      ORDER BY priority_level DESC LIMIT 2
    `, [userId, cycleId]),
    
    db.query(`
      SELECT title, prompt_text, context_explanation, timing_suggestion, priority_level, created_at
      FROM proactive_prompts
      WHERE user_id = ? AND cycle_id = ? AND prompt_type = 'creative_expression'
      ORDER BY priority_level DESC LIMIT 2
    `, [userId, cycleId]),
    
    // Growth trajectory from user profile
    db.query(`
      SELECT memory_profile->'growth_trajectory' as growth_trajectory
      FROM users
      WHERE user_id = ?
    `, [userId])
  ]);

  const growthTrajectory = userProfile[0]?.growth_trajectory || {};

  return {
    user_id: userId,
    cycle_id: cycleId,
    generated_at: new Date().toISOString(),
    sections: {
      insights: insights.map(row => ({
        title: row.title,
        content: row.content_narrative,
        confidence: row.confidence_score,
        actionability: row.actionability,
        created_at: row.created_at
      })),
      patterns: patterns.map(row => ({
        title: row.title,
        content: row.content_narrative,
        confidence: row.confidence_score,
        created_at: row.created_at
      })),
      recommendations: recommendations.map(row => ({
        title: row.title,
        content: row.content_narrative,
        confidence: row.confidence_score,
        actionability: row.actionability,
        created_at: row.created_at
      })),
      synthesis: synthesis.map(row => ({
        title: row.title,
        content: row.content_narrative,
        confidence: row.confidence_score,
        created_at: row.created_at
      })),
      reflection_prompts: reflectionPrompts.map(row => ({
        title: row.title,
        content: row.prompt_text,
        context: row.context_explanation,
        timing: row.timing_suggestion,
        priority: row.priority_level,
        created_at: row.created_at
      })),
      exploration_prompts: explorationPrompts.map(row => ({
        title: row.title,
        content: row.prompt_text,
        context: row.context_explanation,
        timing: row.timing_suggestion,
        priority: row.priority_level,
        created_at: row.created_at
      })),
      goal_setting_prompts: goalSettingPrompts.map(row => ({
        title: row.title,
        content: row.prompt_text,
        context: row.context_explanation,
        timing: row.timing_suggestion,
        priority: row.priority_level,
        created_at: row.created_at
      })),
      skill_development_prompts: skillDevelopmentPrompts.map(row => ({
        title: row.title,
        content: row.prompt_text,
        context: row.context_explanation,
        timing: row.timing_suggestion,
        priority: row.priority_level,
        created_at: row.created_at
      })),
      creative_expression_prompts: creativeExpressionPrompts.map(row => ({
        title: row.title,
        content: row.prompt_text,
        context: row.context_explanation,
        timing: row.timing_suggestion,
        priority: row.priority_level,
        created_at: row.created_at
      })),
      identified_patterns: growthTrajectory.identified_patterns || [],
      emerging_themes: growthTrajectory.emerging_themes || [],
      recommended_focus_areas: growthTrajectory.recommended_focus_areas || [],
      potential_blind_spots: growthTrajectory.potential_blind_spots || [],
      celebration_moments: growthTrajectory.celebration_moments || [],
      cycle_metrics: growthTrajectory.cycle_metrics || {}
    }
  };
}
```

## 7. Benefits of Simplified Structure

### 7.1 Structural Benefits
1. **Unified Data Model**: All content is stored as derived artifacts with consistent structure
2. **No Crowded JSON Fields**: Each item gets its own row instead of being buried in arrays
3. **Consistent Querying**: All sections use the same table with different filters
4. **Better Performance**: Individual rows are easier to index and query than JSON arrays
5. **Easier Debugging**: Each item has its own database record with full metadata

### 7.2 Development Benefits
1. **Simplified Code**: No special handling for growth trajectory vs derived artifacts
2. **Consistent Persistence**: All content uses the same persistence logic
3. **Unified API**: All sections return the same data structure
4. **Easy Testing**: Each artifact type can be tested independently
5. **Clear Ownership**: Each dashboard section maps to a specific artifact type

### 7.3 User Experience Benefits
1. **Consistent Display**: All sections show the same metadata (title, content, confidence, etc.)
2. **Better Sorting**: Items can be sorted by confidence, date, or other fields
3. **Individual Actions**: Each item can have its own actions (like, share, etc.)
4. **Clear Hierarchy**: Users can see exactly what type of content each item is
5. **No Confusion**: No need to understand different data structures for different sections

### 7.4 Maintenance Benefits
1. **Single Source of Truth**: All content comes from derived_artifacts table
2. **Easy Schema Changes**: Changes to derived_artifacts affect all sections consistently
3. **Simple Migrations**: No need to migrate complex JSON structures
4. **Clear Dependencies**: Easy to see what depends on what
5. **Reduced Complexity**: Fewer moving parts means fewer things can break

## 8. Testing Checklist

- [ ] Verify `cycle_id` is added to `derived_artifacts` and `proactive_prompts` tables
- [ ] Test insight worker creates artifacts with `cycle_id`
- [ ] Test dashboard API returns correct data for each section type
- [ ] Verify filtering by `artifact_type` and `prompt_type` works correctly
- [ ] Test growth trajectory data is retrieved from user memory profile
- [ ] Verify sorting by `confidence_score` and `priority_level` works
- [ ] Test limit constraints are respected for each section
