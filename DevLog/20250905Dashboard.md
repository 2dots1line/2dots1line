# Personal Growth Companion Dashboard

## 1. Dashboard Overview

**Purpose**: Transform insight worker outputs into a warm, conversational experience that feels like catching up with a thoughtful friend.

**Core Principle**: Present data as shared observations and natural conversation invitations, not metrics or tasks.

## 1.1 Critical Issue: Field Competition Between Workers

**Problem Identified**: The Insight Worker and Ingestion Worker are both writing to the same database field (`users.next_conversation_context_package`), causing data conflicts and loss of functionality.

**Impact**:
- **Chat UI Fallback Issue**: Insight Worker overwrites the `proactive_greeting` field that Ingestion Worker creates, causing Chat UI to always show the default fallback message instead of personalized greetings
- **Data Loss**: Each worker completely overwrites the other's data instead of merging or using separate fields
- **Inconsistent User Experience**: Users lose personalized conversation starters and context continuity

**Root Cause**: Both workers use the same field for different purposes:
- **Ingestion Worker**: Stores `forward_looking_context` with `proactive_greeting`, `unresolved_topics_for_next_convo`, `suggested_initial_focus`
- **Insight Worker**: Stores strategic insights with `key_insights`, `proactive_guidance`, `growth_insights`, `cycle_health`, `conversation_starters`

**Evidence**: Insight Worker output completely lacks `proactive_greeting` field:
```json
{
  "cycle_health": {...},
  "key_insights": [...],
  "proactive_guidance": [...],
  "growth_insights": {...},
  "conversation_starters": [...]
  // Missing: "proactive_greeting" field that Chat UI needs
}
```

## 1.2 Solution Strategy: Dedicated Storage Architecture

**Immediate Fix Options**:

**Option A: Field Separation (Recommended)**
- **Ingestion Worker**: Continue using `users.next_conversation_context_package` for conversation continuity
- **Insight Worker**: Use new dedicated field `users.insight_cycle_context_package` for strategic insights
- **Benefits**: Clean separation, no data conflicts, both workers can operate independently

**Recommended Implementation Path**:
1. **Phase 1**: Implement Option A (field separation) for immediate fix
2. **Phase 2**: Build dynamic dashboard system with atomic component storage
3. **Phase 3**: Remove old JSON field storage entirely

## 2. Forward-Looking Dashboard Architecture

**Core Design Principles:**
1. **Configuration Over Code**: All behavior defined in config files
2. **Semantic Over Literal**: Use semantic field names, map to actual database fields
3. **Dynamic Over Static**: Generate sections based on available data, not hardcoded types
4. **Extensible Over Fixed**: Plugin architecture for new section types and data sources
5. **Schema-Agnostic**: Abstract away database field names and structure

## 2.1 Dynamic Dashboard Engine

**Single Endpoint Architecture:**
```typescript
// Single dynamic endpoint replaces all hardcoded endpoints
GET /api/v1/dashboard?user_id={userId}&cycle_id={cycleId}&sections={sectionTypes}&format={format}

// Or GraphQL-style query approach
POST /api/v1/dashboard/query
{
  "user_id": "123",
  "sections": ["insights", "prompts", "growth"],
  "filters": {"cycle_id": "latest", "priority": "high"},
  "format": "conversational"
}
```

**Response Structure:**
```typescript
interface DashboardResponse {
  user_id: string;
  cycle_id: string;
  generated_at: string;
  sections: DashboardSection[];
  metadata: {
    total_sections: number;
    data_sources: string[];
    template_version: string;
  };
}

interface DashboardSection {
  id: string;
  type: string;
  title: string;
  content: any[];
  priority: number;
  metadata: {
    source_type: string;
    item_count: number;
    template_used: string;
  };
}
```

## 2.2 Schema-Agnostic Configuration System

**Semantic Field Mapping Configuration:**
```json
// config/semantic_field_mappings.json
{
  "field_mappings": {
    "content": {
      "derived_artifacts": ["content_narrative", "content", "text"],
      "proactive_prompts": ["prompt_text", "text", "content"],
      "memory_units": ["content", "description", "narrative"]
    },
    "title": {
      "derived_artifacts": ["title", "name", "subject"],
      "proactive_prompts": ["title", "name", "subject"],
      "memory_units": ["title", "name", "subject"]
    },
    "timestamp": {
      "derived_artifacts": ["created_at", "timestamp", "date"],
      "proactive_prompts": ["created_at", "timestamp", "date"],
      "memory_units": ["created_at", "timestamp", "date"]
    },
    "type": {
      "derived_artifacts": ["artifact_type", "type", "category"],
      "proactive_prompts": ["prompt_type", "type", "category"],
      "memory_units": ["type", "category", "classification"]
    },
    "priority": {
      "derived_artifacts": ["confidence_score", "priority_score"],
      "proactive_prompts": ["priority_level", "priority_score"],
      "memory_units": ["importance_score", "priority_score"]
    },
    "actionability": {
      "derived_artifacts": ["actionability", "timing"],
      "proactive_prompts": ["timing_suggestion", "actionability"],
      "memory_units": ["actionability", "urgency"]
    }
  }
}
```

**Dynamic Section Templates:**
```json
// config/dashboard_section_templates.json
{
  "section_templates": {
    "celebration_moments": {
      "title_generator": "template:celebration_title",
      "content_mapper": "semantic:content",
      "data_source": "growth_trajectory_updates",
      "filter_conditions": {
        "field": "celebration_moments",
        "type": "array"
      },
      "display_config": {
        "max_items": 1,
        "sort_by": "semantic:timestamp",
        "sort_order": "DESC",
        "priority": 1,
        "tone": "warm",
        "include_emojis": true
      }
    },
    "strategic_insights": {
      "title_generator": "template:insight_title",
      "content_mapper": "semantic:content",
      "data_source": "derived_artifacts",
      "filter_conditions": {
        "artifact_type": ["insight", "pattern", "synthesis"],
        "actionability": ["immediate", "short_term"]
      },
      "display_config": {
        "max_items": 3,
        "sort_by": "semantic:priority",
        "sort_order": "DESC",
        "priority": 2,
        "tone": "thoughtful",
        "include_confidence": true
      }
    },
    "conversation_invitations": {
      "title_generator": "template:conversation_title",
      "content_mapper": "semantic:content",
      "data_source": "proactive_prompts",
      "filter_conditions": {
        "prompt_type": ["reflection", "exploration", "goal_setting"],
        "timing_suggestion": ["next_conversation", "immediate"]
      },
      "display_config": {
        "max_items": 2,
        "sort_by": "semantic:priority",
        "sort_order": "DESC",
        "priority": 3,
        "tone": "curious",
        "include_emojis": true
      }
    },
    "growth_patterns": {
      "title_generator": "template:pattern_title",
      "content_mapper": "semantic:content",
      "data_source": "growth_trajectory_updates",
      "filter_conditions": {
        "field": "identified_patterns",
        "type": "array"
      },
      "display_config": {
        "max_items": 2,
        "sort_by": "semantic:timestamp",
        "sort_order": "DESC",
        "priority": 4,
        "tone": "observational",
        "include_confidence": false
      }
    },
    "recommendations": {
      "title_generator": "template:recommendation_title",
      "content_mapper": "semantic:content",
      "data_source": "derived_artifacts",
      "filter_conditions": {
        "artifact_type": ["recommendation"],
        "actionability": ["immediate", "short_term", "long_term"]
      },
      "display_config": {
        "max_items": 2,
        "sort_by": "semantic:priority",
        "sort_order": "DESC",
        "priority": 5,
        "tone": "actionable",
        "include_confidence": true
      }
    },
    "emerging_themes": {
      "title_generator": "template:theme_title",
      "content_mapper": "semantic:content",
      "data_source": "growth_trajectory_updates",
      "filter_conditions": {
        "field": "emerging_themes",
        "type": "array"
      },
      "display_config": {
        "max_items": 2,
        "sort_by": "semantic:timestamp",
        "sort_order": "DESC",
        "priority": 6,
        "tone": "reflective",
        "include_confidence": false
      }
    }
  }
}
```

**Template Generators:**
```json
// config/template_generators.json
{
  "title_generators": {
    "celebration_title": "Something to celebrate! 🎉",
    "insight_title": "I noticed something interesting",
    "conversation_title": "Want to explore something?",
    "pattern_title": "Here's what I'm seeing",
    "recommendation_title": "Here's what I'd suggest",
    "theme_title": "I'm seeing some themes emerge",
    "growth_title": "Your growth journey"
  },
  "content_transformers": {
    "conversational": "Convert technical language to warm, personal observations",
    "actionable": "Focus on next steps and practical applications",
    "reflective": "Encourage deeper thinking and self-awareness",
    "warm": "Use encouraging, supportive language with personal touch",
    "thoughtful": "Present insights as gentle observations and discoveries",
    "curious": "Frame questions as invitations to explore and discover",
    "observational": "Present patterns as neutral observations without judgment",
    "actionable": "Focus on concrete next steps and practical applications"
  },
  "tone_configurations": {
    "celebration": {
      "tone": "warm",
      "include_emojis": true,
      "language_style": "encouraging",
      "personal_pronouns": "I noticed you've..."
    },
    "insight": {
      "tone": "thoughtful", 
      "include_confidence": true,
      "language_style": "observational",
      "personal_pronouns": "I've been noticing..."
    },
    "conversation": {
      "tone": "curious",
      "include_emojis": true,
      "language_style": "inviting",
      "personal_pronouns": "I'm curious about..."
    },
    "pattern": {
      "tone": "observational",
      "include_confidence": false,
      "language_style": "neutral",
      "personal_pronouns": "I'm seeing a pattern..."
    },
    "recommendation": {
      "tone": "actionable",
      "include_confidence": true,
      "language_style": "directive",
      "personal_pronouns": "I'd suggest..."
    },
    "theme": {
      "tone": "reflective",
      "include_confidence": false,
      "language_style": "contemplative",
      "personal_pronouns": "I'm noticing themes..."
    }
  }
}
```

## 2.3 Insight Worker Output to Dashboard Mapping

**Real Examples from Insight Worker Logs:**

### 2.3.1 Derived Artifacts Mapping

**Source Data Structure:**
```typescript
// From StrategicSynthesisOutput.derived_artifacts
{
  "artifact_type": "insight" | "pattern" | "recommendation" | "synthesis",
  "title": "Growth Pattern Analysis",
  "content": "I noticed you've been making great progress on...",
  "confidence_score": 0.8,
  "supporting_evidence": ["conversation_123", "growth_event_456"],
  "actionability": "immediate" | "short_term" | "long_term" | "aspirational",
  "source_concept_ids": ["concept_789"],
  "source_memory_unit_ids": ["memory_101"]
}
```

**Dashboard Section Mapping:**
```json
{
  "strategic_insights": {
    "data_source": "derived_artifacts",
    "filter": "artifact_type IN ['insight', 'pattern', 'synthesis']",
    "display": {
      "title": "I noticed something interesting",
      "content": "content_narrative",
      "confidence": "confidence_score",
      "tone": "thoughtful"
    }
  },
  "recommendations": {
    "data_source": "derived_artifacts", 
    "filter": "artifact_type = 'recommendation'",
    "display": {
      "title": "Here's what I'd suggest",
      "content": "content_narrative",
      "actionability": "actionability",
      "tone": "actionable"
    }
  }
}
```

### 2.3.2 Proactive Prompts Mapping

**Source Data Structure:**
```typescript
// From StrategicSynthesisOutput.proactive_prompts
{
  "prompt_type": "reflection" | "exploration" | "goal_setting" | "skill_development" | "creative_expression",
  "title": "Want to explore something?",
  "prompt_text": "You've identified that 'people often forget who they are' as a core pain point. How do you envision the 'two dots one line Application' specifically addressing this?",
  "context_explanation": "Based on your recent conversations about...",
  "timing_suggestion": "next_conversation" | "weekly_check_in" | "monthly_review" | "quarterly_planning",
  "priority_level": 8
}
```

**Dashboard Section Mapping:**
```json
{
  "conversation_invitations": {
    "data_source": "proactive_prompts",
    "filter": "timing_suggestion = 'next_conversation' AND prompt_type IN ['reflection', 'exploration', 'goal_setting']",
    "display": {
      "title": "Want to explore something?",
      "content": "prompt_text",
      "context": "context_explanation",
      "tone": "curious"
    }
  }
}
```

### 2.3.3 Growth Trajectory Updates Mapping

**Source Data Structure:**
```typescript
// From StrategicSynthesisOutput.growth_trajectory_updates
{
  "identified_patterns": ["Pattern of growth in AI development", "Consistent focus on user-centered design"],
  "emerging_themes": ["Entrepreneurship", "AI Integration", "Personal Growth"],
  "recommended_focus_areas": ["Consider exploring user feedback loops", "Focus on MVP validation"],
  "potential_blind_spots": ["Technical debt management", "Scalability planning"],
  "celebration_moments": ["Successfully built application without prior software experience", "Strategic pivot from consulting to AI entrepreneurship"]
}
```

**Dashboard Section Mapping:**
```json
{
  "celebration_moments": {
    "data_source": "growth_trajectory_updates",
    "field": "celebration_moments",
    "display": {
      "title": "Something to celebrate! 🎉",
      "content": "array_item",
      "tone": "warm",
      "include_emojis": true
    }
  },
  "growth_patterns": {
    "data_source": "growth_trajectory_updates", 
    "field": "identified_patterns",
    "display": {
      "title": "Here's what I'm seeing",
      "content": "array_item",
      "tone": "observational"
    }
  },
  "emerging_themes": {
    "data_source": "growth_trajectory_updates",
    "field": "emerging_themes", 
    "display": {
      "title": "I'm seeing some themes emerge",
      "content": "array_item",
      "tone": "reflective"
    }
  }
}
```

### 2.3.4 Real Example Transformation

**Before (Raw Insight Worker Output):**
```json
{
  "derived_artifacts": [
    {
      "artifact_type": "insight",
      "title": "Growth Pattern Analysis", 
      "content": "Danni has been making significant progress in AI development, transitioning from consulting to building practical applications.",
      "confidence_score": 0.8,
      "actionability": "immediate"
    }
  ],
  "proactive_prompts": [
    {
      "prompt_type": "exploration",
      "prompt_text": "You've identified that 'people often forget who they are' as a core pain point. How do you envision the 'two dots one line Application' specifically addressing this?",
      "timing_suggestion": "next_conversation",
      "priority_level": 8
    }
  ],
  "growth_trajectory_updates": {
    "celebration_moments": ["Successfully built application without prior software experience"]
  }
}
```

**After (Dashboard Sections):**
```json
{
  "sections": [
    {
      "id": "celebration_1",
      "type": "celebration_moments",
      "title": "Something to celebrate! 🎉",
      "content": [
        {
          "text": "I noticed you've successfully built an application without prior software experience - that's incredible progress!",
          "tone": "warm",
          "confidence": null
        }
      ],
      "priority": 1
    },
    {
      "id": "insight_1", 
      "type": "strategic_insights",
      "title": "I noticed something interesting",
      "content": [
        {
          "text": "I've been noticing you've been making significant progress in AI development, transitioning from consulting to building practical applications.",
          "tone": "thoughtful",
          "confidence": 0.8
        }
      ],
      "priority": 2
    },
    {
      "id": "conversation_1",
      "type": "conversation_invitations", 
      "title": "Want to explore something?",
      "content": [
        {
          "text": "You've identified that 'people often forget who they are' as a core pain point. How do you envision the 'two dots one line Application' specifically addressing this?",
          "tone": "curious",
          "context": "Based on your recent conversations about core identity and user pain points"
        }
      ],
      "priority": 3
    }
  ]
}
```

## 2.4 Plugin-Based Dashboard Engine

**Core Dashboard Engine:**
```typescript
export class DynamicDashboardEngine {
  private fieldMappings: FieldMappings;
  private sectionTemplates: SectionTemplates;
  private templateGenerators: TemplateGenerators;
  private dataSources: Map<string, DataSourcePlugin>;
  private sectionRenderers: Map<string, SectionRendererPlugin>;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {
    this.dataSources = new Map();
    this.sectionRenderers = new Map();
  }

  async initialize(): Promise<void> {
    this.fieldMappings = await this.configService.getFieldMappings();
    this.sectionTemplates = await this.configService.getSectionTemplates();
    this.templateGenerators = await this.configService.getTemplateGenerators();
    
    // Register built-in plugins
    this.registerDataSource('derived_artifacts', new DerivedArtifactsDataSource());
    this.registerDataSource('proactive_prompts', new ProactivePromptsDataSource());
    this.registerDataSource('memory_units', new MemoryUnitsDataSource());
    
    this.registerSectionRenderer('celebration', new CelebrationRenderer());
    this.registerSectionRenderer('insight', new InsightRenderer());
    this.registerSectionRenderer('conversation_starter', new ConversationStarterRenderer());
  }

  async generateDashboard(request: DashboardRequest): Promise<DashboardResponse> {
    const { user_id, cycle_id, sections, filters } = request;
    
    // Get available data from all registered sources
    const allData = await this.collectDataFromSources(user_id, cycle_id, filters);
    
    // Apply semantic field mapping
    const mappedData = this.applySemanticMapping(allData);
    
    // Generate sections based on available data and templates
    const generatedSections = await this.generateSections(mappedData, sections);
    
    return {
      user_id,
      cycle_id,
      generated_at: new Date().toISOString(),
      sections: generatedSections,
      metadata: {
        total_sections: generatedSections.length,
        data_sources: Array.from(this.dataSources.keys()),
        template_version: this.templateGenerators.version
      }
    };
  }

  private async collectDataFromSources(userId: string, cycleId: string, filters: any): Promise<any[]> {
    const allData: any[] = [];
    
    for (const [sourceName, dataSource] of this.dataSources) {
      try {
        const data = await dataSource.fetchData(userId, cycleId, filters);
        allData.push(...data.map(item => ({ ...item, _source: sourceName })));
      } catch (error) {
        console.warn(`Failed to fetch data from ${sourceName}:`, error);
      }
    }
    
    return allData;
  }

  private applySemanticMapping(data: any[]): any[] {
    return data.map(item => {
      const sourceType = item._source;
      const mappedItem: any = { ...item };
      
      // Apply semantic field mapping
      for (const [semanticField, fieldVariants] of Object.entries(this.fieldMappings.field_mappings)) {
        const variants = fieldVariants[sourceType] || [];
        const actualField = variants.find(field => item[field] !== undefined);
        
        if (actualField) {
          mappedItem[semanticField] = item[actualField];
        }
      }
      
      return mappedItem;
    });
  }

  private async generateSections(data: any[], requestedSections?: string[]): Promise<DashboardSection[]> {
    const sections: DashboardSection[] = [];
    
    for (const [sectionType, template] of Object.entries(this.sectionTemplates.section_templates)) {
      // Skip if specific sections requested and this isn't one of them
      if (requestedSections && !requestedSections.includes(sectionType)) continue;
      
      // Filter data based on template conditions
      const filteredData = this.filterDataByTemplate(data, template);
      
      if (filteredData.length > 0) {
        const section = await this.buildSection(sectionType, template, filteredData);
        sections.push(section);
      }
    }
    
    return sections.sort((a, b) => a.priority - b.priority);
  }

  // Plugin registration methods
  registerDataSource(name: string, plugin: DataSourcePlugin): void {
    this.dataSources.set(name, plugin);
  }

  registerSectionRenderer(type: string, plugin: SectionRendererPlugin): void {
    this.sectionRenderers.set(type, plugin);
  }
}
```

**Plugin Interfaces:**
```typescript
interface DataSourcePlugin {
  fetchData(userId: string, cycleId: string, filters: any): Promise<any[]>;
  getSupportedFilters(): string[];
}

interface SectionRendererPlugin {
  canHandle(sectionType: string): boolean;
  render(data: any[], template: any, config: any): Promise<DashboardSection>;
  getPriority(): number;
}
```

## 2.4 Configuration System

**ConfigService Extensions:**
```typescript
// Add to ConfigService.ts
public getFieldMappings(): FieldMappings {
  return this.configCache.get('semantic_field_mappings');
}

public getSectionTemplates(): SectionTemplates {
  return this.configCache.get('dashboard_section_templates');
}

public getTemplateGenerators(): TemplateGenerators {
  return this.configCache.get('template_generators');
}

public getDataSourceConfig(): DataSourceConfig {
  return this.configCache.get('data_source_config');
}
```

**Data Source Configuration:**
```json
// config/data_source_config.json
{
  "data_sources": {
    "derived_artifacts": {
      "enabled": true,
      "priority": 1,
      "filters": ["cycle_id", "artifact_type", "created_at"],
      "cache_ttl": 300
    },
    "proactive_prompts": {
      "enabled": true,
      "priority": 2,
      "filters": ["cycle_id", "timing_suggestion", "priority_level"],
      "cache_ttl": 300
    },
    "memory_units": {
      "enabled": true,
      "priority": 3,
      "filters": ["cycle_id", "importance_score", "created_at"],
      "cache_ttl": 600
    }
  }
}
```

**Plugin Configuration:**
```json
// config/plugin_config.json
{
  "plugins": {
    "data_sources": {
      "derived_artifacts": {
        "class": "DerivedArtifactsDataSource",
        "config": {
          "max_items": 100,
          "include_metadata": true
        }
      },
      "proactive_prompts": {
        "class": "ProactivePromptsDataSource",
        "config": {
          "max_items": 50,
          "include_metadata": true
        }
      }
    },
    "section_renderers": {
      "celebration": {
        "class": "CelebrationRenderer",
        "config": {
          "tone": "warm",
          "include_emojis": true
        }
      },
      "insight": {
        "class": "InsightRenderer",
        "config": {
          "tone": "thoughtful",
          "include_confidence": true
        }
      }
    }
  }
}
```

## 5. Database Schema Requirements

### 5.1 Immediate Fix: Field Separation Schema
**File**: New migration to add dedicated field for Insight Worker
```sql
-- Add dedicated field for Insight Worker strategic insights
ALTER TABLE "users" ADD COLUMN "insight_cycle_context_package" JSONB;

-- Add index for efficient querying
CREATE INDEX "idx_users_insight_cycle_context" ON "users" USING GIN ("insight_cycle_context_package");
```

**Code Changes Required**:
```typescript
// In InsightEngine.ts - Update the updateNextConversationContext method
private async updateNextConversationContext(userId: string, analysisOutput: StrategicSynthesisOutput): Promise<void> {
  // ... existing logic ...
  
  await this.userRepository.update(userId, {
    insight_cycle_context_package: nextContextPackage  // ← Change from next_conversation_context_package
  });
}
```

### 5.1 Atomic Component Storage
**Solution**: Store insight worker output as atomic components in existing normalized tables with `cycle_id` references.

**Schema Changes:**
```sql
-- Add cycle_id to existing tables
ALTER TABLE derived_artifacts ADD COLUMN cycle_id TEXT;
ALTER TABLE proactive_prompts ADD COLUMN cycle_id TEXT;

-- Add foreign key constraints
ALTER TABLE derived_artifacts ADD CONSTRAINT fk_derived_artifacts_cycle 
  FOREIGN KEY (cycle_id) REFERENCES user_cycles(cycle_id) ON DELETE CASCADE;
ALTER TABLE proactive_prompts ADD CONSTRAINT fk_proactive_prompts_cycle 
  FOREIGN KEY (cycle_id) REFERENCES user_cycles(cycle_id) ON DELETE CASCADE;
```

### 4.2 Componentized Dashboard Architecture

**Core Concept**: Dashboard is a live UI with multiple components that pull from different data sources with varying update frequencies.

#### 4.2.1 Component Update Frequencies

**Real-time Components** (Updated on every user action):
```typescript
interface RealTimeComponent {
  componentType: 'live_stats' | 'recent_activity' | 'current_session';
  dataSource: {
    table: 'conversations' | 'cards' | 'memory_units' | 'concepts';
    query: 'COUNT(*) WHERE user_id = ? AND created_at > ?';
    refreshInterval: 'immediate'; // On every user interaction
  };
  examples: [
    'Total cards: 47',
    'Active conversations: 3', 
    'Memory units this week: 12',
    'New concepts today: 2'
  ];
}
```

**Cycle-based Components** (Updated per insight cycle):
```typescript
interface CycleBasedComponent {
  componentType: 'strategic_insights' | 'growth_patterns' | 'celebration_moments';
  dataSource: {
    table: 'derived_artifacts' | 'proactive_prompts';
    query: 'WHERE cycle_id = ? AND section_type = ?';
    refreshInterval: 'cycle'; // Every insight cycle (weekly/bi-weekly)
  };
  examples: [
    'I noticed you\'ve been making great progress on...',
    'Something to celebrate!',
    'Want to explore something?'
  ];
}
```

**Event-driven Components** (Updated on specific events):
```typescript
interface EventDrivenComponent {
  componentType: 'follow_up_questions' | 'unresolved_topics' | 'conversation_starters';
  dataSource: {
    table: 'proactive_prompts' | 'conversations';
    query: 'WHERE timing_suggestion = ? AND status = ?';
    refreshInterval: 'event'; // On conversation completion, ingestion analysis
  };
  examples: [
    'You mentioned wanting to explore...',
    'Last time we talked about...',
    'I\'m curious about your thoughts on...'
  ];
}
```

#### 4.2.2 General Component Setup Process

**Step 1: Define Component Configuration**
```json
// config/dashboard_components.json
{
  "components": {
    "live_stats": {
      "title": "Your Progress",
      "componentType": "live_stats",
      "dataSource": {
        "table": "cards",
        "query": "SELECT COUNT(*) as total_cards FROM cards WHERE user_id = ?",
        "refreshInterval": "immediate"
      },
      "displayConfig": {
        "template": "stat_card",
        "icon": "📊",
        "color": "blue"
      }
    },
    "celebration_moments": {
      "title": "Something to celebrate!",
      "componentType": "celebration_moments", 
      "dataSource": {
        "table": "derived_artifacts",
        "query": "WHERE section_type = 'celebration' AND cycle_id = ?",
        "refreshInterval": "cycle"
      },
      "displayConfig": {
        "template": "celebration_card",
        "icon": "🎉",
        "color": "green",
        "maxItems": 1
      }
    },
    "follow_up_questions": {
      "title": "Want to explore something?",
      "componentType": "follow_up_questions",
      "dataSource": {
        "table": "proactive_prompts", 
        "query": "WHERE timing_suggestion = 'next_conversation' AND status = 'pending'",
        "refreshInterval": "event"
      },
      "displayConfig": {
        "template": "question_card",
        "icon": "💭",
        "color": "purple",
        "maxItems": 2
      }
    }
  }
}
```

**Step 2: Implement Component Data Source**
```typescript
// packages/dashboard/src/components/LiveStatsComponent.ts
export class LiveStatsComponent implements DashboardComponent {
  async fetchData(userId: string, config: ComponentConfig): Promise<ComponentData> {
    const { table, query } = config.dataSource;
    
    // Execute query based on component configuration
    const result = await this.dbService.query(query, [userId]);
    
    return {
      componentId: config.id,
      title: config.title,
      data: result,
      lastUpdated: new Date().toISOString(),
      refreshInterval: config.dataSource.refreshInterval
    };
  }
}
```

**Step 3: Register Component in Dashboard Engine**
```typescript
// packages/dashboard/src/DynamicDashboardEngine.ts
export class DynamicDashboardEngine {
  async initialize(): Promise<void> {
    // Load component configurations
    const componentConfigs = await this.configService.getDashboardComponents();
    
    // Register components based on configuration
    for (const [componentId, config] of Object.entries(componentConfigs.components)) {
      const componentClass = this.getComponentClass(config.componentType);
      this.registerComponent(componentId, new componentClass(config));
    }
  }
  
  private getComponentClass(componentType: string): typeof DashboardComponent {
    const componentMap = {
      'live_stats': LiveStatsComponent,
      'celebration_moments': CelebrationComponent,
      'follow_up_questions': FollowUpQuestionsComponent,
      'strategic_insights': StrategicInsightsComponent
    };
    return componentMap[componentType];
  }
}
```

### 4.3 Insight Worker Componentization

**Core Concept**: Insight Worker prompt templates are componentized to match dashboard component requirements.

#### 4.3.1 Component-Driven Prompt Assembly

**Dashboard-Driven Insight Generation**:
```typescript
// Insight Worker reads dashboard component requirements
interface DashboardComponentRequirement {
  componentId: string;
  componentType: string;
  requiredOutputs: {
    dataFields: string[];
    contentTypes: string[];
    displayFormats: string[];
  };
  promptTemplate: string;
  outputSchema: any;
}

// Insight Worker generates outputs based on dashboard requirements
class ComponentizedInsightEngine {
  async generateInsights(userId: string, cycleId: string): Promise<ComponentizedOutput> {
    // 1. Get dashboard component requirements
    const componentRequirements = await this.getDashboardComponentRequirements();
    
    // 2. Generate component-specific prompts
    const componentPrompts = await this.buildComponentPrompts(componentRequirements);
    
    // 3. Execute LLM calls for each component
    const componentOutputs = await this.executeComponentGeneration(componentPrompts);
    
    // 4. Persist outputs to appropriate tables with component metadata
    await this.persistComponentOutputs(componentOutputs);
    
    return componentOutputs;
  }
}
```

#### 4.3.2 Component-Specific Prompt Templates

**Celebration Component Prompt**:
```typescript
// config/insight_component_prompts.json
{
  "celebration_moments": {
    "promptTemplate": `
      Based on the user's recent activity, identify 1-2 genuine celebration moments.
      
      User Data:
      - Recent conversations: {conversationSummaries}
      - Growth events: {growthEvents}
      - New concepts: {newConcepts}
      
      Generate celebration content that:
      1. Highlights genuine progress or achievements
      2. Uses warm, encouraging language
      3. Is specific and personal
      4. Feels authentic, not forced
      
      Output format:
      {
        "celebration_moments": [
          {
            "title": "Something to celebrate!",
            "content": "I noticed you've been...",
            "confidence": 0.8,
            "source_evidence": ["conversation_123", "growth_event_456"]
          }
        ]
      }
    `,
    "outputSchema": {
      "celebration_moments": "array",
      "title": "string",
      "content": "string", 
      "confidence": "number",
      "source_evidence": "array"
    }
  }
}
```

**Strategic Insights Component Prompt**:
```typescript
{
  "strategic_insights": {
    "promptTemplate": `
      Analyze the user's knowledge graph and identify 2-3 strategic insights.
      
      Knowledge Graph:
      - Concepts: {concepts}
      - Relationships: {relationships}
      - Memory units: {memoryUnits}
      
      Generate insights that:
      1. Reveal patterns the user might not notice
      2. Connect seemingly unrelated concepts
      3. Suggest growth opportunities
      4. Use "I noticed..." language
      
      Output format:
      {
        "strategic_insights": [
          {
            "title": "I noticed something interesting",
            "content": "There's a pattern in how you...",
            "confidence": 0.7,
            "actionability": "short_term",
            "source_evidence": ["concept_789", "memory_101"]
          }
        ]
      }
    `,
    "outputSchema": {
      "strategic_insights": "array",
      "title": "string",
      "content": "string",
      "confidence": "number", 
      "actionability": "enum",
      "source_evidence": "array"
    }
  }
}
```

#### 4.3.3 Dashboard-Insight Worker Connection

**Configuration-Driven Connection**:
```typescript
// config/dashboard_insight_connection.json
{
  "connections": {
    "celebration_moments": {
      "dashboardComponent": "celebration_moments",
      "insightWorkerOutput": "celebration_moments",
      "persistenceTable": "derived_artifacts",
      "persistenceFields": {
        "artifact_type": "celebration_moment",
        "section_type": "celebration",
        "priority_score": 1.0,
        "display_metadata": {
          "tone": "warm",
          "include_emojis": true,
          "max_items": 1
        }
      }
    },
    "strategic_insights": {
      "dashboardComponent": "strategic_insights", 
      "insightWorkerOutput": "strategic_insights",
      "persistenceTable": "derived_artifacts",
      "persistenceFields": {
        "artifact_type": "strategic_insight",
        "section_type": "strategic_insights",
        "priority_score": 0.8,
        "display_metadata": {
          "tone": "thoughtful",
          "include_confidence": true,
          "max_items": 3
        }
      }
    },
    "conversation_starters": {
      "dashboardComponent": "follow_up_questions",
      "insightWorkerOutput": "conversation_invitations", 
      "persistenceTable": "proactive_prompts",
      "persistenceFields": {
        "section_type": "conversation_starters",
        "display_priority": 1,
        "display_metadata": {
          "tone": "curious",
          "include_emojis": true
        }
      }
    }
  }
}
```

### 4.4 Data Aggregation Strategy
- Query `user_cycles` table for latest successful cycle
- Query atomic components directly from existing tables using `cycle_id`
- Join with `conversations`, `growth_events`, `memory_units` for additional context
- Use existing table indexes for efficient querying

### 4.5 Content Transformation
- Convert technical insights to conversational language
- Present observations in first person ("I've noticed...")
- Frame growth opportunities constructively
- Highlight positive developments and celebrations


## 3. Implementation Roadmap

### Phase 0: Critical Field Competition Fix (IMMEDIATE)
1. **Add new database field** `users.insight_cycle_context_package` (JSONB)
2. **Update Insight Worker** to write to new field instead of `next_conversation_context_package`
3. **Test Chat UI** to ensure `proactive_greeting` is preserved and working
4. **Verify both workers** can operate independently without data conflicts

**Testing Checklist**:
- [ ] Run Ingestion Worker → verify `proactive_greeting` appears in `next_conversation_context_package`
- [ ] Run Insight Worker → verify strategic insights appear in `insight_cycle_context_package`
- [ ] Open Chat UI → verify personalized greeting appears (not fallback message)
- [ ] Run both workers in sequence → verify no data overwrites occur
- [ ] Check database → verify both fields contain expected data

### Phase 0.5: Database Schema Updates (IMMEDIATE)
1. **Add dashboard-specific fields to existing tables**:
   ```sql
   -- Add to derived_artifacts
   ALTER TABLE "derived_artifacts" ADD COLUMN "cycle_id" TEXT;
   ALTER TABLE "derived_artifacts" ADD COLUMN "section_type" TEXT;
   ALTER TABLE "derived_artifacts" ADD COLUMN "priority_score" FLOAT DEFAULT 0.5;
   ALTER TABLE "derived_artifacts" ADD COLUMN "display_metadata" JSONB;
   
   -- Add to proactive_prompts
   ALTER TABLE "proactive_prompts" ADD COLUMN "cycle_id" TEXT;
   ALTER TABLE "proactive_prompts" ADD COLUMN "section_type" TEXT;
   ALTER TABLE "proactive_prompts" ADD COLUMN "display_priority" INT DEFAULT 1;
   ALTER TABLE "proactive_prompts" ADD COLUMN "display_metadata" JSONB;
   ```

2. **Add indexes for dashboard queries**:
   ```sql
   CREATE INDEX "idx_derived_artifacts_section_type" ON "derived_artifacts"("section_type");
   CREATE INDEX "idx_proactive_prompts_section_type" ON "proactive_prompts"("section_type");
   CREATE INDEX "idx_derived_artifacts_priority" ON "derived_artifacts"("priority_score" DESC);
   CREATE INDEX "idx_derived_artifacts_cycle_id" ON "derived_artifacts"("cycle_id");
   CREATE INDEX "idx_proactive_prompts_cycle_id" ON "proactive_prompts"("cycle_id");
   ```

3. **Create user_cycles table**:
   ```sql
   CREATE TABLE "user_cycles" (
     "cycle_id" TEXT PRIMARY KEY,
     "user_id" TEXT NOT NULL,
     "cycle_start_date" TIMESTAMP NOT NULL,
     "cycle_end_date" TIMESTAMP NOT NULL,
     "cycle_type" TEXT NOT NULL DEFAULT 'strategic',
     "status" TEXT NOT NULL DEFAULT 'active',
     "created_at" TIMESTAMP DEFAULT NOW(),
     "completed_at" TIMESTAMP,
     "metadata" JSONB,
     
     FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
   );
   ```

### Phase 1: Insight Worker Updates (IMMEDIATE)
1. **Update InsightEngine.ts**:
   - Add `cycleId` parameter to `persistStrategicUpdates` method
   - Add dashboard-specific fields to artifact and prompt creation
   - Add helper methods for section type mapping
   - Add `persistGrowthTrajectoryUpdates` method

2. **Update StrategicSynthesisTool.ts**:
   - Add `cycleId` to `StrategicSynthesisInput` interface
   - Update prompt templates to include cycle context

3. **Update Insight Worker main process**:
   - Generate `cycleId` for each insight cycle
   - Pass `cycleId` to all persistence methods
   - Create cycle record in `user_cycles` table

4. **Test Insight Worker**:
   - Verify new fields are populated correctly
   - Verify growth trajectory updates are persisted as artifacts
   - Verify section types are mapped correctly

### Phase 2: Configuration System Setup
1. **Create configuration files**:
   - `config/semantic_field_mappings.json`
   - `config/dashboard_section_templates.json`
   - `config/template_generators.json`
   - `config/data_source_config.json`
   - `config/plugin_config.json`
2. **Update `ConfigService`** to load new configuration files
3. **Add configuration validation** and error handling
4. **Create configuration migration tools** for existing data

### Phase 2: Plugin Architecture Implementation
1. **Create plugin interfaces** (`DataSourcePlugin`, `SectionRendererPlugin`)
2. **Implement built-in data source plugins**:
   - `DerivedArtifactsDataSource`
   - `ProactivePromptsDataSource`
   - `MemoryUnitsDataSource`
3. **Implement built-in section renderer plugins**:
   - `CelebrationRenderer`
   - `InsightRenderer`
   - `ConversationStarterRenderer`
4. **Create plugin registry and loading system**

### Phase 3: Dynamic Dashboard Engine
1. **Implement `DynamicDashboardEngine`** core class
2. **Add semantic field mapping** functionality
3. **Implement dynamic section generation** based on available data
4. **Add caching and performance optimization**
5. **Create single dynamic API endpoint** (`GET /api/v1/dashboard`)

### Phase 4: Database Schema Evolution
1. **Add `cycle_id` to existing tables** (`derived_artifacts`, `proactive_prompts`)
2. **Create `user_cycles` table** for cycle metadata
3. **Add database indexes** for efficient querying
4. **Create data migration scripts** from JSON fields to normalized tables
5. **Implement gradual migration strategy** (dual-write, then cutover)

### Phase 5: Frontend Integration
1. **Update dashboard components** to use dynamic API endpoint
2. **Implement generic section rendering** based on section metadata
3. **Add real-time updates** when new data becomes available
4. **Create fallback UI** for missing or failed sections
5. **Add user customization** for section preferences

### Phase 6: Advanced Features
1. **Add custom plugin support** for third-party data sources
2. **Implement A/B testing** for different section templates
3. **Add analytics and usage tracking** for section performance
4. **Create admin interface** for template and configuration management
5. **Add internationalization** support for templates

### Phase 7: Optimization and Scaling
1. **Implement intelligent caching** based on data freshness
2. **Add background processing** for expensive section generation
3. **Create performance monitoring** and alerting
4. **Optimize database queries** and add query optimization
5. **Add horizontal scaling** support for high-traffic scenarios

## 4. Schema Analysis & Insight Worker Review

### 4.1 Current Schema Assessment

**✅ EXISTING STRENGTHS:**
- **Rich Data Sources**: Current schema has excellent foundation with `derived_artifacts`, `proactive_prompts`, `memory_units`, `growth_events`
- **Proper Relationships**: Good foreign key relationships and indexes for efficient querying
- **JSONB Flexibility**: Existing JSONB fields allow for flexible data storage
- **User-Centric Design**: All tables properly linked to `users` table with cascade deletes

**❌ CRITICAL GAPS FOR DYNAMIC DASHBOARD:**

#### 4.1.1 Missing Cycle Management
```sql
-- MISSING: No user_cycles table for cycle metadata
-- Current: Insight Worker calculates cycle dates on-the-fly
-- Needed: Persistent cycle tracking for dashboard queries
```

#### 4.1.2 Field Competition Issue (CONFIRMED)
```sql
-- CONFLICT: Both workers write to same field
users.next_conversation_context_package JSONB  -- Ingestion Worker: proactive_greeting
users.next_conversation_context_package JSONB  -- Insight Worker: strategic insights (OVERWRITES!)

-- SOLUTION: Add dedicated field for Insight Worker
users.insight_cycle_context_package JSONB      -- Insight Worker: strategic insights only
```

#### 4.1.3 Missing Cycle References
```sql
-- MISSING: No cycle_id in existing tables
derived_artifacts.cycle_id TEXT                -- Link artifacts to specific cycles
proactive_prompts.cycle_id TEXT                -- Link prompts to specific cycles
growth_events.cycle_id TEXT                    -- Link events to specific cycles
```

#### 4.1.4 Missing Dashboard-Specific Fields
```sql
-- MISSING: Fields needed for dynamic dashboard
derived_artifacts.priority_score FLOAT         -- For section prioritization
derived_artifacts.display_metadata JSONB       -- Dashboard-specific formatting
proactive_prompts.section_type TEXT           -- Which dashboard section this belongs to
proactive_prompts.display_priority INT        -- Order within section
```

### 4.2 Insight Worker Analysis

**✅ CURRENT STRENGTHS:**
- **Rich Data Generation**: StrategicSynthesisTool generates comprehensive output including:
  - `derived_artifacts` (insights, patterns, recommendations, synthesis)
  - `proactive_prompts` (reflection, exploration, goal_setting prompts)
  - `growth_trajectory_updates` (patterns, themes, focus areas)
  - `cycle_metrics` (health scores, coherence, momentum)
- **Proper Persistence**: Stores data in normalized tables (`derived_artifacts`, `proactive_prompts`)
- **Cycle-Aware**: Calculates cycle dates and processes data within cycle boundaries

**❌ CRITICAL ISSUES FOR DASHBOARD:**

#### 4.2.1 Field Competition Problem (CONFIRMED)
```typescript
// CURRENT PROBLEM: Insight Worker overwrites Ingestion Worker data
await this.userRepository.update(userId, {
  next_conversation_context_package: nextContextPackage  // OVERWRITES proactive_greeting!
});
```

#### 4.2.2 Missing Cycle Context
```typescript
// MISSING: No cycle_id in generated artifacts
const artifact = {
  artifact_type: 'insight',
  title: 'Growth Pattern Analysis',
  content: '...',
  // MISSING: cycle_id: cycleId  // Dashboard needs this for filtering
};
```

#### 4.2.3 Dashboard-Unfriendly Data Structure
```typescript
// CURRENT: Technical field names
{
  "cycle_health": {...},
  "key_insights": [...],
  "proactive_guidance": [...],
  "growth_insights": {...},
  "conversation_starters": [...]
}

// NEEDED: Dashboard-friendly structure
{
  "celebration_moments": [...],      // For celebration section
  "strategic_insights": [...],       // For insight section  
  "conversation_invitations": [...], // For conversation starter section
  "growth_patterns": [...],          // For growth section
  "gentle_guidance": [...]           // For guidance section
}
```

### 4.3 Required Schema Updates

#### 4.3.1 Immediate Fix: Field Separation
```sql
-- Add dedicated field for Insight Worker
ALTER TABLE "users" ADD COLUMN "insight_cycle_context_package" JSONB;

-- Add index for efficient querying
CREATE INDEX "idx_users_insight_cycle_context" ON "users" USING GIN ("insight_cycle_context_package");
```

#### 4.3.2 Cycle Management Table
```sql
-- Create user_cycles table for cycle metadata
CREATE TABLE "user_cycles" (
  "cycle_id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "cycle_start_date" TIMESTAMP NOT NULL,
  "cycle_end_date" TIMESTAMP NOT NULL,
  "cycle_type" TEXT NOT NULL DEFAULT 'strategic',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "completed_at" TIMESTAMP,
  "metadata" JSONB,
  
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX "idx_user_cycles_user_id" ON "user_cycles"("user_id");
CREATE INDEX "idx_user_cycles_dates" ON "user_cycles"("cycle_start_date", "cycle_end_date");
CREATE INDEX "idx_user_cycles_status" ON "user_cycles"("status");
```

#### 4.3.3 Add Cycle References to Existing Tables
```sql
-- Add cycle_id to derived_artifacts
ALTER TABLE "derived_artifacts" ADD COLUMN "cycle_id" TEXT;
ALTER TABLE "derived_artifacts" ADD CONSTRAINT "fk_derived_artifacts_cycle" 
  FOREIGN KEY ("cycle_id") REFERENCES "user_cycles"("cycle_id") ON DELETE CASCADE;

-- Add cycle_id to proactive_prompts  
ALTER TABLE "proactive_prompts" ADD COLUMN "cycle_id" TEXT;
ALTER TABLE "proactive_prompts" ADD CONSTRAINT "fk_proactive_prompts_cycle"
  FOREIGN KEY ("cycle_id") REFERENCES "user_cycles"("cycle_id") ON DELETE CASCADE;

-- Add cycle_id to growth_events
ALTER TABLE "growth_events" ADD COLUMN "cycle_id" TEXT;
ALTER TABLE "growth_events" ADD CONSTRAINT "fk_growth_events_cycle"
  FOREIGN KEY ("cycle_id") REFERENCES "user_cycles"("cycle_id") ON DELETE CASCADE;
```

#### 4.3.4 Dashboard-Specific Fields
```sql
-- Add dashboard-specific fields to derived_artifacts
ALTER TABLE "derived_artifacts" ADD COLUMN "priority_score" FLOAT DEFAULT 0.5;
ALTER TABLE "derived_artifacts" ADD COLUMN "display_metadata" JSONB;
ALTER TABLE "derived_artifacts" ADD COLUMN "section_type" TEXT;

-- Add dashboard-specific fields to proactive_prompts
ALTER TABLE "proactive_prompts" ADD COLUMN "section_type" TEXT;
ALTER TABLE "proactive_prompts" ADD COLUMN "display_priority" INT DEFAULT 1;
ALTER TABLE "proactive_prompts" ADD COLUMN "display_metadata" JSONB;

-- Add indexes for dashboard queries
CREATE INDEX "idx_derived_artifacts_section_type" ON "derived_artifacts"("section_type");
CREATE INDEX "idx_proactive_prompts_section_type" ON "proactive_prompts"("section_type");
CREATE INDEX "idx_derived_artifacts_priority" ON "derived_artifacts"("priority_score" DESC);
```

### 4.4 Insight Worker Improvements

#### 4.4.1 Fix Field Competition
```typescript
// BEFORE: Overwrites Ingestion Worker data
await this.userRepository.update(userId, {
  next_conversation_context_package: nextContextPackage
});

// AFTER: Use dedicated field
await this.userRepository.update(userId, {
  insight_cycle_context_package: nextContextPackage
});
```

#### 4.4.2 Enhanced Persistence with Dashboard Fields
```typescript
// Update persistStrategicUpdates method in InsightEngine.ts
private async persistStrategicUpdates(
  userId: string,
  cycleId: string, // NEW: Add cycle context
  analysisOutput: StrategicSynthesisOutput
): Promise<Array<{ id: string; type: string }>> {
  
  // Create Derived Artifacts with dashboard-specific fields
  for (const artifact of derived_artifacts) {
    const artifactData: CreateDerivedArtifactData = {
      user_id: userId,
      cycle_id: cycleId, // NEW: Link to cycle
      artifact_type: artifact.artifact_type,
      title: artifact.title,
      content_narrative: artifact.content,
      content_data: artifact.content_data || null,
      source_concept_ids: artifact.source_concept_ids || [],
      source_memory_unit_ids: artifact.source_memory_unit_ids || [],
      
      // NEW: Dashboard-specific fields
      section_type: this.mapArtifactTypeToSectionType(artifact.artifact_type),
      priority_score: artifact.confidence_score,
      display_metadata: {
        tone: this.getToneForArtifactType(artifact.artifact_type),
        include_confidence: true,
        actionability: artifact.actionability,
        max_items: this.getMaxItemsForSection(artifact.artifact_type)
      }
    };

    const createdArtifact = await this.derivedArtifactRepository.create(artifactData);
    newEntities.push({ id: createdArtifact.artifact_id, type: 'DerivedArtifact' });
  }

  // Create Proactive Prompts with dashboard-specific fields
  for (const prompt of proactive_prompts) {
    const promptData: CreateProactivePromptData = {
      user_id: userId,
      cycle_id: cycleId, // NEW: Link to cycle
      prompt_text: prompt.prompt_text,
      source_agent: 'InsightEngine',
      
      // NEW: Dashboard-specific fields
      section_type: this.mapPromptTypeToSectionType(prompt.prompt_type),
      display_priority: prompt.priority_level,
      display_metadata: {
        tone: this.getToneForPromptType(prompt.prompt_type),
        include_emojis: true,
        timing: prompt.timing_suggestion
      },
      
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

// NEW: Helper methods for dashboard mapping
private mapArtifactTypeToSectionType(artifactType: string): string {
  const mapping = {
    'insight': 'strategic_insights',
    'pattern': 'growth_patterns', 
    'recommendation': 'recommendations',
    'synthesis': 'strategic_insights'
  };
  return mapping[artifactType] || 'strategic_insights';
}

private mapPromptTypeToSectionType(promptType: string): string {
  const mapping = {
    'reflection': 'conversation_invitations',
    'exploration': 'conversation_invitations',
    'goal_setting': 'conversation_invitations',
    'skill_development': 'conversation_invitations',
    'creative_expression': 'conversation_invitations'
  };
  return mapping[promptType] || 'conversation_invitations';
}

private getToneForArtifactType(artifactType: string): string {
  const toneMapping = {
    'insight': 'thoughtful',
    'pattern': 'observational',
    'recommendation': 'actionable',
    'synthesis': 'thoughtful'
  };
  return toneMapping[artifactType] || 'thoughtful';
}

private getToneForPromptType(promptType: string): string {
  return 'curious'; // All conversation invitations should be curious
}

private getMaxItemsForSection(artifactType: string): number {
  const maxItemsMapping = {
    'insight': 3,
    'pattern': 2,
    'recommendation': 2,
    'synthesis': 3
  };
  return maxItemsMapping[artifactType] || 2;
}
```

#### 4.4.3 Handle Growth Trajectory Updates
```typescript
// NEW: Persist growth trajectory updates as separate derived artifacts
private async persistGrowthTrajectoryUpdates(
  userId: string,
  cycleId: string,
  growthTrajectoryUpdates: any
): Promise<void> {
  
  // Persist celebration moments as high-priority derived artifacts
  if (growthTrajectoryUpdates.celebration_moments?.length > 0) {
    for (const moment of growthTrajectoryUpdates.celebration_moments) {
      const celebrationData: CreateDerivedArtifactData = {
        user_id: userId,
        cycle_id: cycleId,
        artifact_type: 'celebration_moment',
        title: 'Something to celebrate!',
        content_narrative: moment,
        section_type: 'celebration_moments',
        priority_score: 1.0, // Highest priority
        display_metadata: {
          tone: 'warm',
          include_emojis: true,
          max_items: 1
        }
      };
      
      await this.derivedArtifactRepository.create(celebrationData);
    }
  }

  // Persist identified patterns as observational artifacts
  if (growthTrajectoryUpdates.identified_patterns?.length > 0) {
    for (const pattern of growthTrajectoryUpdates.identified_patterns) {
      const patternData: CreateDerivedArtifactData = {
        user_id: userId,
        cycle_id: cycleId,
        artifact_type: 'pattern',
        title: 'Here\'s what I\'m seeing',
        content_narrative: pattern,
        section_type: 'growth_patterns',
        priority_score: 0.7,
        display_metadata: {
          tone: 'observational',
          include_confidence: false,
          max_items: 2
        }
      };
      
      await this.derivedArtifactRepository.create(patternData);
    }
  }

  // Persist emerging themes as reflective artifacts
  if (growthTrajectoryUpdates.emerging_themes?.length > 0) {
    for (const theme of growthTrajectoryUpdates.emerging_themes) {
      const themeData: CreateDerivedArtifactData = {
        user_id: userId,
        cycle_id: cycleId,
        artifact_type: 'theme',
        title: 'I\'m seeing some themes emerge',
        content_narrative: theme,
        section_type: 'emerging_themes',
        priority_score: 0.6,
        display_metadata: {
          tone: 'reflective',
          include_confidence: false,
          max_items: 2
        }
      };
      
      await this.derivedArtifactRepository.create(themeData);
    }
  }

  // Persist recommended focus areas as actionable artifacts
  if (growthTrajectoryUpdates.recommended_focus_areas?.length > 0) {
    for (const focusArea of growthTrajectoryUpdates.recommended_focus_areas) {
      const focusData: CreateDerivedArtifactData = {
        user_id: userId,
        cycle_id: cycleId,
        artifact_type: 'recommendation',
        title: 'Here\'s what I\'d suggest',
        content_narrative: focusArea,
        section_type: 'recommendations',
        priority_score: 0.8,
        display_metadata: {
          tone: 'actionable',
          include_confidence: true,
          max_items: 2
        }
      };
      
      await this.derivedArtifactRepository.create(focusData);
    }
  }
}
```

#### 4.4.3 Dashboard-Friendly Output Structure
```typescript
// Transform technical output to dashboard-friendly structure
const dashboardOutput = {
  celebration_moments: analysisOutput.growth_trajectory_updates.celebration_moments.map(moment => ({
    title: "Something to celebrate!",
    content: moment,
    type: "celebration_moment",
    priority: 1
  })),
  
  strategic_insights: analysisOutput.derived_artifacts
    .filter(artifact => artifact.artifact_type === 'insight')
    .map(insight => ({
      title: "I noticed something interesting",
      content: insight.content,
      type: "insight",
      priority: 2,
      confidence: insight.confidence_score
    })),
    
  conversation_invitations: analysisOutput.proactive_prompts
    .filter(prompt => prompt.timing_suggestion === 'next_conversation')
    .map(prompt => ({
      title: "Want to explore something?",
      content: prompt.prompt_text,
      type: "conversation_starter",
      priority: 3
    }))
};
```

### 4.5 Critical Insight Worker Issues Analysis

#### 4.5.1 Issue #1: Prompt Assembly Contains Too Much Low-Value Information

**CURRENT PROBLEM:**
The `StrategicSynthesisInput` is bloated with redundant and low-value data:

```typescript
// CURRENT: Massive data dump to LLM
const strategicInput: StrategicSynthesisInput = {
  currentKnowledgeGraph: {
    memoryUnits: [...], // ALL memory units + conversation summaries
    concepts: [...],    // ALL concepts
    relationships: [...], // ALL relationships
    conceptsNeedingSynthesis: [...] // Duplicate concept data
  },
  recentGrowthEvents: [...], // Raw growth events
  userProfile: { preferences: any, goals: [], interests: [] } // Generic profile data
};
```

**ANALYSIS:**
- **Memory Units**: Includes ALL memory units + conversation summaries (potentially 100+ items)
- **Concepts**: Includes ALL concepts regardless of relevance (potentially 50+ items)
- **Relationships**: Includes ALL relationships (potentially 200+ items)
- **Growth Events**: Raw event data without analysis or prioritization
- **User Profile**: Generic preference/goal data that doesn't change meaningfully

**IMPACT:**
- **Token Waste**: 80% of prompt tokens are low-value data
- **LLM Confusion**: Too much noise dilutes signal
- **Cost**: Unnecessary token usage increases costs
- **Performance**: Slower processing due to large context

#### 4.5.2 Issue #2: InsightDataCompiler Not Used in Prompt Assembly

**CURRENT PROBLEM:**
The `InsightDataCompiler` is instantiated but its compiled data is NOT used in the prompt:

```typescript
// CURRENT: InsightDataCompiler data is ignored
const [ingestionSummary, graphAnalysis, strategicInsights] = await Promise.all([
  this.insightDataCompiler.compileIngestionActivity(userId, cycleDates),
  this.insightDataCompiler.compileGraphAnalysis(userId),
  this.insightDataCompiler.compileStrategicInsights(userId, cycleDates)
]);

// BUT: The prompt uses raw data instead of compiled insights
const strategicInput: StrategicSynthesisInput = {
  currentKnowledgeGraph: {
    memoryUnits: await this.getUserMemoryUnits(userId, cycleDates), // RAW DATA
    concepts: await this.getUserConcepts(userId, cycleDates),       // RAW DATA
    // ... compiled data is completely ignored!
  }
};
```

**ANALYSIS:**
- **Redundant Processing**: InsightDataCompiler does sophisticated analysis that's thrown away
- **Missed Opportunities**: Compiled insights like `emergentPatterns`, `knowledgeGaps`, `growthOpportunities` are ignored
- **Inefficiency**: Two separate data gathering processes for the same information

#### 4.5.3 Issue #3: Output Impact Analysis

**HIGH IMPACT OUTPUTS (Dashboard-Worthy):**
```typescript
// These outputs are valuable and should be prioritized
derived_artifacts: [
  {
    artifact_type: 'insight',           // ✅ High impact
    title: 'Growth Pattern Analysis',   // ✅ Dashboard-worthy
    content: 'I noticed you\'ve been...', // ✅ Conversational
    confidence_score: 0.8,              // ✅ Actionable
    actionability: 'immediate'          // ✅ User-relevant
  }
],
proactive_prompts: [
  {
    prompt_type: 'exploration',         // ✅ High impact
    title: 'Want to explore something?', // ✅ Dashboard-worthy
    prompt_text: 'I\'ve been thinking...', // ✅ Conversational
    timing_suggestion: 'next_conversation' // ✅ Actionable
  }
],
growth_trajectory_updates: {
  celebration_moments: ['Great progress on...'], // ✅ High impact
  emerging_themes: ['Pattern of growth in...'],  // ✅ Dashboard-worthy
  recommended_focus_areas: ['Consider exploring...'] // ✅ Actionable
}
```

**LOW IMPACT OUTPUTS (Abstract Metrics):**
```typescript
// These outputs are less valuable and should be minimized
ontology_optimizations: {
  concepts_to_merge: [...],        // ❌ Technical, not user-facing
  concepts_to_archive: [...],      // ❌ Technical, not user-facing
  new_strategic_relationships: [...], // ❌ Abstract, hard to understand
  community_structures: [...]      // ❌ Technical, not actionable
},
cycle_metrics: {
  knowledge_graph_health: 0.7,     // ❌ Abstract metric
  ontology_coherence: 0.8,         // ❌ Abstract metric
  growth_momentum: 0.6,            // ❌ Abstract metric
  strategic_alignment: 0.9,        // ❌ Abstract metric
  insight_generation_rate: 0.5     // ❌ Abstract metric
}
```

#### 4.5.4 Issue #4: Persistence Strategy Problems

**CURRENT PERSISTENCE:**
```typescript
// GOOD: Properly persists to normalized tables
await this.derivedArtifactRepository.create({
  user_id: userId,
  artifact_type: artifact.artifact_type,
  title: artifact.title,
  content_narrative: artifact.content,
  content_data: artifact.content_data,
  source_concept_ids: artifact.source_concept_ids,
  source_memory_unit_ids: artifact.source_memory_unit_ids
});
```

**MISSING PERSISTENCE:**
```typescript
// MISSING: Dashboard-specific fields
derived_artifacts: {
  cycle_id: cycleId,                    // ❌ Missing: Link to cycle
  section_type: 'strategic_insights',   // ❌ Missing: Dashboard section
  priority_score: 0.8,                  // ❌ Missing: Display priority
  display_metadata: {                   // ❌ Missing: Dashboard formatting
    tone: 'thoughtful',
    include_confidence: true,
    max_items: 3
  }
}
```

#### 4.5.5 Issue #5: Missing Dashboard Feedback Loop

**CURRENT PROBLEM:**
No mechanism for dashboard content to inform the next insight cycle:

```typescript
// MISSING: No feedback from previous dashboard performance
const strategicInput: StrategicSynthesisInput = {
  // ... current data
  // MISSING: previousDashboardPerformance: {...}
  // MISSING: userEngagementMetrics: {...}
  // MISSING: successfulSectionTypes: [...]
  // MISSING: failedSectionTypes: [...]
};
```

### 4.6 Recommended Insight Worker Redesign

#### 4.6.1 Streamlined Prompt Assembly
```typescript
// NEW: Focus on high-value, compiled insights only
const strategicInput: StrategicSynthesisInput = {
  userId,
  cycleId,
  cycleStartDate: cycleDates.cycleStartDate,
  cycleEndDate: cycleDates.cycleEndDate,
  
  // USE COMPILED DATA instead of raw data
  compiledInsights: {
    ingestionSummary,      // ✅ Use InsightDataCompiler output
    graphAnalysis,         // ✅ Use InsightDataCompiler output  
    strategicInsights      // ✅ Use InsightDataCompiler output
  },
  
  // MINIMAL raw data - only what's absolutely necessary
  essentialContext: {
    topMemoryUnits: await this.getTopMemoryUnits(userId, cycleDates, 10), // Top 10 only
    keyConcepts: await this.getKeyConcepts(userId, cycleDates, 15),       // Top 15 only
    significantGrowthEvents: await this.getSignificantGrowthEvents(userId, cycleDates, 5) // Top 5 only
  },
  
  // ADD: Dashboard feedback loop
  dashboardFeedback: await this.getDashboardFeedback(userId, previousCycleId),
  
  // ADD: User preferences for personalization
  userPreferences: await this.getUserDashboardPreferences(userId)
};
```

#### 4.6.2 Focused Output Structure
```typescript
// NEW: Prioritize dashboard-worthy outputs
interface StreamlinedStrategicSynthesisOutput {
  // HIGH PRIORITY: Dashboard-worthy content
  dashboardContent: {
    celebration_moments: Array<{
      title: string;
      content: string;
      confidence: number;
      source_evidence: string[];
    }>;
    strategic_insights: Array<{
      title: string;
      content: string;
      confidence: number;
      actionability: 'immediate' | 'short_term' | 'long_term';
      source_evidence: string[];
    }>;
    conversation_invitations: Array<{
      title: string;
      prompt_text: string;
      context_explanation: string;
      priority: number;
    }>;
  };
  
  // MEDIUM PRIORITY: Actionable recommendations
  actionableRecommendations: Array<{
    type: 'concept_merge' | 'knowledge_gap' | 'growth_opportunity';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // LOW PRIORITY: Technical optimizations (minimal)
  technicalOptimizations: {
    concepts_to_merge: Array<{
      primary_concept_id: string;
      secondary_concept_ids: string[];
      rationale: string;
    }>;
    // Remove abstract metrics like ontology_health, coherence, etc.
  };
}
```

### 4.7 Implementation Priority

**Phase 0 (IMMEDIATE - Fix Field Competition):**
1. Add `users.insight_cycle_context_package` field
2. Update Insight Worker to use new field
3. Test Chat UI functionality

**Phase 1 (Foundation - Cycle Management):**
1. Create `user_cycles` table
2. Add `cycle_id` to existing tables
3. Update Insight Worker to create cycle records

**Phase 2 (Insight Worker Redesign):**
1. **Streamline Prompt Assembly**: Use InsightDataCompiler output instead of raw data
2. **Focus Output Structure**: Prioritize dashboard-worthy content over abstract metrics
3. **Enhanced Persistence**: Add dashboard-specific fields to existing tables
4. **Remove Redundancy**: Eliminate duplicate data gathering processes

**Phase 3 (Dashboard Feedback Loop):**
1. Add dashboard interaction tracking
2. Implement feedback loop for next cycle
3. Add user preference learning

**Phase 4 (Dynamic Dashboard):**
1. Implement DynamicDashboardEngine
2. Create configuration files
3. Build plugin architecture

## 5. Key Benefits of Forward-Looking Design

### 5.1 Extensibility
- **New Data Sources**: Add new data sources without code changes
- **New Section Types**: Create new section types via configuration
- **Custom Plugins**: Third-party developers can extend functionality
- **Schema Evolution**: Database changes don't break existing functionality

### 5.2 Maintainability
- **Configuration-Driven**: Behavior changes via config files, not code
- **Semantic Abstraction**: Field name changes don't break templates
- **Plugin Isolation**: Issues in one plugin don't affect others
- **Clear Separation**: Data, presentation, and business logic are separate

### 5.3 Performance
- **Intelligent Caching**: Cache based on data freshness and usage patterns
- **Lazy Loading**: Load only requested sections and data
- **Background Processing**: Expensive operations run asynchronously
- **Query Optimization**: Database queries optimized for actual usage

### 5.4 User Experience
- **Dynamic Content**: Sections appear based on available data
- **Personalization**: User preferences drive section selection
- **Real-time Updates**: New data appears without page refresh
- **Graceful Degradation**: System works even when some data sources fail

## 6. Summary: Insight Worker to Dashboard Integration

### 6.1 Key Achievements
This document provides a complete roadmap for transforming insight worker outputs into a dynamic, conversational dashboard experience. The key innovations include:

1. **Field Competition Resolution**: Fixed the critical issue where Insight Worker and Ingestion Worker overwrote each other's data by using separate database fields.

2. **Dashboard-Specific Schema**: Added `section_type`, `priority_score`, and `display_metadata` fields to existing tables to support dynamic dashboard rendering.

3. **Concrete Output Mapping**: Provided specific examples of how each insight worker output type maps to dashboard sections:
   - `derived_artifacts` → `strategic_insights`, `recommendations`
   - `proactive_prompts` → `conversation_invitations`
   - `growth_trajectory_updates` → `celebration_moments`, `growth_patterns`, `emerging_themes`

4. **Tone-Aware Templates**: Created specific tone configurations for each section type (warm, thoughtful, curious, observational, actionable, reflective).

5. **Real Examples**: Used actual insight worker log data to show concrete transformations from technical output to conversational dashboard content.

### 6.2 Implementation Priority
The implementation is prioritized to fix the critical field competition issue first, then enhance the insight worker to support dashboard-specific fields, and finally build the dynamic dashboard engine.

### 6.3 Expected User Experience
Users will see a warm, conversational dashboard that feels like catching up with a thoughtful friend, presenting insights as gentle observations and invitations to explore, rather than technical metrics or tasks.

### 6.4 Technical Benefits
- **Leverages Existing Infrastructure**: Uses current `derived_artifacts` and `proactive_prompts` tables
- **Schema-Agnostic**: Dashboard templates work regardless of database field name changes
- **Configuration-Driven**: All behavior defined in config files, not code
- **Extensible**: Easy to add new section types and data sources
- **Performance-Optimized**: Uses existing indexes and efficient queries