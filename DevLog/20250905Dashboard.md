# Personal Growth Companion Dashboard

## 1. Dashboard Overview

**Purpose**: Transform insight worker outputs into a warm, conversational experience that feels like catching up with a thoughtful friend.

**Core Principle**: Present data as shared observations and natural conversation invitations, not metrics or tasks.

## 2. Dashboard Template System

**Following the Card Template Pattern:**
Just like `config/card_templates.json` defines how different entity types become cards, we need `config/dashboard_templates.json` to define how different data types become dashboard sections.

**Template Structure:**
```json
{
  "DerivedArtifact_celebration_moment": {
    "section_type": "celebration_section",
    "display_config": {
      "title_template": "Something to celebrate!",
      "content_source_field": "content_narrative",
      "max_items": 1,
      "sort_by": "created_at",
      "sort_order": "DESC"
    }
  },
  "DerivedArtifact_focus_area": {
    "section_type": "focus_section", 
    "display_config": {
      "title_template": "Areas of interest",
      "content_source_field": "content_narrative",
      "max_items": 3,
      "sort_by": "created_at",
      "sort_order": "DESC"
    }
  },
  "DerivedArtifact_pattern": {
    "section_type": "pattern_section",
    "display_config": {
      "title_template": "I noticed something interesting",
      "content_source_field": "content_narrative", 
      "max_items": 2,
      "sort_by": "created_at",
      "sort_order": "DESC"
    }
  },
  "ProactivePrompt_next_conversation": {
    "section_type": "conversation_starter",
    "display_config": {
      "title_template": "Want to explore something?",
      "content_source_field": "prompt_text",
      "max_items": 2,
      "sort_by": "created_at",
      "sort_order": "DESC"
    }
  }
}
```

**Template-Driven Dashboard Generation:**
- Dashboard sections are generated based on available data and templates
- Each `artifact_type` + `timing_suggestion` combination has a template
- Templates define section appearance, content source, and display rules
- No hardcoded section names - everything driven by templates

## 3. Dashboard Factory Implementation

**Following CardFactory Pattern:**
```typescript
export class DashboardFactory {
  private dashboardTemplates: any;
  private initialized: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.dashboardTemplates = await this.configService.getDashboardTemplates();
    this.initialized = true;
  }

  async generateDashboardSections(userId: string): Promise<DashboardSection[]> {
    await this.initialize();
    
    const latestCycle = await this.getLatestSuccessfulCycle(userId);
    if (!latestCycle) return this.getFallbackSections(userId);
    
    const sections: DashboardSection[] = [];
    
    // Get all data for the cycle
    const derivedArtifacts = await this.derivedArtifactsRepo.findByCycleId(latestCycle.cycle_id);
    const proactivePrompts = await this.proactivePromptsRepo.findByCycleId(latestCycle.cycle_id);
    
    // Group data by template keys
    const dataByTemplate = this.groupDataByTemplate(derivedArtifacts, proactivePrompts);
    
    // Generate sections based on templates
    for (const [templateKey, data] of Object.entries(dataByTemplate)) {
      const template = this.dashboardTemplates[templateKey];
      if (template && data.length > 0) {
        const section = this.buildSectionFromTemplate(template, data, templateKey);
        sections.push(section);
      }
    }
    
    return sections.sort((a, b) => a.priority - b.priority);
  }

  private groupDataByTemplate(artifacts: DerivedArtifact[], prompts: ProactivePrompt[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    // Group artifacts by artifact_type
    artifacts.forEach(artifact => {
      const key = `DerivedArtifact_${artifact.artifact_type}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(artifact);
    });
    
    // Group prompts by timing_suggestion
    prompts.forEach(prompt => {
      const key = `ProactivePrompt_${prompt.metadata?.timing_suggestion || 'general'}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(prompt);
    });
    
    return grouped;
  }

  private buildSectionFromTemplate(template: any, data: any[], templateKey: string): DashboardSection {
    const sortedData = this.sortData(data, template.display_config);
    const limitedData = sortedData.slice(0, template.display_config.max_items);
    
    return {
      sectionType: template.section_type,
      title: template.display_config.title_template,
      items: limitedData.map(item => this.buildItemFromTemplate(template, item)),
      priority: this.getSectionPriority(templateKey),
      templateKey
    };
  }
}
```

**Template-Driven Benefits:**
- **Consistent with Card System**: Same pattern as `CardFactory` and `card_templates.json`
- **Configurable**: Templates can be updated without code changes
- **Flexible**: New artifact types automatically get dashboard sections
- **Maintainable**: Clear separation between data and presentation logic

## 4. Configuration Requirements

### 4.1 Dashboard Templates Configuration
**File**: `config/dashboard_templates.json`
```json
{
  "DerivedArtifact_celebration_moment": {
    "section_type": "celebration_section",
    "display_config": {
      "title_template": "Something to celebrate!",
      "content_source_field": "content_narrative",
      "max_items": 1,
      "sort_by": "created_at",
      "sort_order": "DESC",
      "priority": 1
    }
  },
  "DerivedArtifact_focus_area": {
    "section_type": "focus_section",
    "display_config": {
      "title_template": "Areas of interest",
      "content_source_field": "content_narrative", 
      "max_items": 3,
      "sort_by": "created_at",
      "sort_order": "DESC",
      "priority": 2
    }
  },
  "DerivedArtifact_pattern": {
    "section_type": "pattern_section",
    "display_config": {
      "title_template": "I noticed something interesting",
      "content_source_field": "content_narrative",
      "max_items": 2,
      "sort_by": "created_at", 
      "sort_order": "DESC",
      "priority": 3
    }
  },
  "DerivedArtifact_insight": {
    "section_type": "insight_section",
    "display_config": {
      "title_template": "Recent insights",
      "content_source_field": "content_narrative",
      "max_items": 2,
      "sort_by": "created_at",
      "sort_order": "DESC", 
      "priority": 4
    }
  },
  "ProactivePrompt_next_conversation": {
    "section_type": "conversation_starter",
    "display_config": {
      "title_template": "Want to explore something?",
      "content_source_field": "prompt_text",
      "max_items": 2,
      "sort_by": "created_at",
      "sort_order": "DESC",
      "priority": 5
    }
  }
}
```

### 4.2 ConfigService Extension
**Add to `ConfigService.ts`:**
```typescript
public getDashboardTemplates(): any {
  const config = this.configCache.get('dashboard_templates');
  if (!config) {
    throw new Error('Dashboard templates configuration not loaded');
  }
  return config;
}
```

## 5. Database Schema Requirements

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

## 6. Implementation Priority

### Phase 1: Configuration Setup
1. **Create `config/dashboard_templates.json`** with all artifact type templates
2. **Update `ConfigService`** to load dashboard templates
3. **Add template validation** and error handling

### Phase 2: Database Schema Updates
1. **Add `cycle_id` to existing tables** (`derived_artifacts`, `proactive_prompts`)
2. **Create minimal `user_cycles` table** for cycle metadata
3. **Update insight worker persistence** to use atomic component storage

### Phase 3: Dashboard Factory Implementation
1. **Create `DashboardFactory`** following `CardFactory` pattern
2. **Implement template-driven section generation**
3. **Add data grouping and sorting logic**
4. **Implement fallback handling** for missing data

### Phase 4: Frontend Integration
1. **Update dashboard components** to use template-driven data
2. **Implement dynamic section rendering** based on available templates
3. **Add section priority ordering**
4. **Test with real insight worker outputs**

### Phase 5: Template Refinement
1. **Gather user feedback** on section appearance and content
2. **Refine templates** based on actual usage patterns
3. **Add new artifact type templates** as needed
4. **Optimize performance** for large datasets