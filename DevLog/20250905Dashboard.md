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

**Option B: Field Merging**
- **Insight Worker**: Read existing `next_conversation_context_package`, merge its data, preserve `proactive_greeting`
- **Benefits**: Maintains single field, preserves conversation continuity
- **Risks**: Complex merge logic, potential for data corruption

**Option C: Atomic Component Storage (Long-term)**
- **Both Workers**: Store data in normalized tables (`derived_artifacts`, `proactive_prompts`, `user_cycles`)
- **Dashboard Factory**: Query and aggregate data from multiple tables
- **Benefits**: Most flexible, supports complex queries, eliminates field competition entirely

**Recommended Implementation Path**:
1. **Phase 1**: Implement Option A (field separation) for immediate fix
2. **Phase 2**: Migrate to Option C (atomic storage) as part of dashboard implementation
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
    }
  }
}
```

**Dynamic Section Templates:**
```json
// config/dashboard_section_templates.json
{
  "section_templates": {
    "celebration": {
      "title_generator": "template:celebration_title",
      "content_mapper": "semantic:content",
      "filter_conditions": {
        "type": ["celebration_moment", "achievement", "milestone"]
      },
      "display_config": {
        "max_items": 1,
        "sort_by": "semantic:timestamp",
        "sort_order": "DESC",
        "priority": 1
      }
    },
    "insight": {
      "title_generator": "template:insight_title",
      "content_mapper": "semantic:content",
      "filter_conditions": {
        "type": ["insight", "pattern", "synthesis"]
      },
      "display_config": {
        "max_items": 3,
        "sort_by": "semantic:timestamp",
        "sort_order": "DESC",
        "priority": 2
      }
    },
    "conversation_starter": {
      "title_generator": "template:conversation_title",
      "content_mapper": "semantic:content",
      "filter_conditions": {
        "type": ["proactive_prompt"],
        "timing": ["next_conversation", "immediate"]
      },
      "display_config": {
        "max_items": 2,
        "sort_by": "semantic:timestamp",
        "sort_order": "DESC",
        "priority": 3
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
    "celebration_title": "Something to celebrate!",
    "insight_title": "I noticed something interesting",
    "conversation_title": "Want to explore something?",
    "pattern_title": "Here's what I'm seeing",
    "growth_title": "Your growth journey"
  },
  "content_transformers": {
    "conversational": "Convert technical language to warm, personal observations",
    "actionable": "Focus on next steps and practical applications",
    "reflective": "Encourage deeper thinking and self-awareness"
  }
}
```

## 2.3 Plugin-Based Dashboard Engine

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

### 5.0 Immediate Fix: Field Separation Schema
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

### 4.2 Data Aggregation Strategy
- Query `user_cycles` table for latest successful cycle
- Query atomic components directly from existing tables using `cycle_id`
- Join with `conversations`, `growth_events`, `memory_units` for additional context
- Use existing table indexes for efficient querying

### 4.3 Content Transformation
- Convert technical insights to conversational language
- Present observations in first person ("I've noticed...")
- Frame growth opportunities constructively
- Highlight positive developments and celebrations

### 4.4 API Endpoints
- `GET /api/v1/dashboard/personal-check-in`
- `GET /api/v1/dashboard/gentle-guidance`
- `GET /api/v1/dashboard/shared-discoveries`
- `GET /api/v1/dashboard/meaningful-moments`
- `GET /api/v1/dashboard/natural-invitations`
- `GET /api/v1/dashboard/growth-timeline`

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

### Phase 1: Configuration System Setup
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

## 4. Key Benefits of Forward-Looking Design

### 4.1 Extensibility
- **New Data Sources**: Add new data sources without code changes
- **New Section Types**: Create new section types via configuration
- **Custom Plugins**: Third-party developers can extend functionality
- **Schema Evolution**: Database changes don't break existing functionality

### 4.2 Maintainability
- **Configuration-Driven**: Behavior changes via config files, not code
- **Semantic Abstraction**: Field name changes don't break templates
- **Plugin Isolation**: Issues in one plugin don't affect others
- **Clear Separation**: Data, presentation, and business logic are separate

### 4.3 Performance
- **Intelligent Caching**: Cache based on data freshness and usage patterns
- **Lazy Loading**: Load only requested sections and data
- **Background Processing**: Expensive operations run asynchronously
- **Query Optimization**: Database queries optimized for actual usage

### 4.4 User Experience
- **Dynamic Content**: Sections appear based on available data
- **Personalization**: User preferences drive section selection
- **Real-time Updates**: New data appears without page refresh
- **Graceful Degradation**: System works even when some data sources fail