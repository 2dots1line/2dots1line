<!-- 28c5342b-14a5-4fad-a62c-a1be50843cd4 48deba65-09b8-45c0-904c-1e403ed1331a -->
# Agent Entity and Relationship Capability Configuration

## Overview

This plan extends the Agent Capability Framework (from seed-entity-selection-effects plan Phase 2) to include entity and relationship management capabilities required by the unified-entity-detail-modal plan. The configuration enables the agent to proactively suggest, create, edit, and manage entities and relationships with proper consent mechanisms.

## Design Principles

1. **Consent for data changes**: All entity/relationship mutations require user consent
2. **Context-aware suggestions**: Agent only suggests entity operations when contextually relevant
3. **Read-only operations**: Entity viewing/details do not require consent
4. **Batch operations supported**: Multiple entities/relationships can be managed in one action
5. **3-database sync**: All mutations trigger EntityUpdateService for PostgreSQL → Neo4j → Weaviate sync

## Capability Categories

### 1. Entity Data Operations

Add to `data_operations` category in `config/agent_capabilities.json`:

```json
{
  "id": "create_entity",
  "name": "Create new entity (Concept/MemoryUnit)",
  "trigger_patterns": [
    "save this concept",
    "remember this as",
    "create an entity for",
    "this is important",
    "I want to track this"
  ],
  "question_template": "Should I create a new entity to save this?",
  "available_from": ["chat", "cosmos", "cards"],
  "requires_consent": true,
  "execution_type": "backend_api",
  "target_endpoint": "/api/v1/entities",
  "method": "POST",
  "parameters": {
    "entity_type": "string",
    "title": "string",
    "content": "string",
    "importance_score": "number?",
    "tags": "array<string>?"
  },
  "success_action": {
    "type": "display_confirmation",
    "message": "Entity created and synced across your knowledge graph."
  },
  "backend_service": "EntityUpdateService",
  "triggers_sync": true
}
```



```json
{
  "id": "edit_entity_content",
  "name": "Edit entity title or content",
  "trigger_patterns": [
    "change this to",
    "update the content",
    "edit this entity",
    "correct this",
    "modify the description"
  ],
  "question_template": "Should I update this entity for you?",
  "available_from": ["chat", "cosmos", "cards"],
  "requires_consent": true,
  "execution_type": "backend_api",
  "target_endpoint": "/api/v1/entities/:entityId",
  "method": "PUT",
  "parameters": {
    "entity_id": "string",
    "title": "string?",
    "content": "string?",
    "update_embedding": "boolean"
  },
  "success_action": {
    "type": "display_confirmation",
    "message": "Entity updated. Changes synced across all databases."
  },
  "backend_service": "EntityUpdateService",
  "triggers_sync": true,
  "async_operation": {
    "embedding_regeneration": true,
    "estimated_duration_ms": 2000
  }
}
```



```json
{
  "id": "quick_edit_entity_title",
  "name": "Quick edit entity title",
  "trigger_patterns": [
    "rename this to",
    "call this",
    "change the title"
  ],
  "question_template": "Should I rename this entity?",
  "available_from": ["chat", "cosmos", "cards"],
  "requires_consent": true,
  "execution_type": "backend_api",
  "target_endpoint": "/api/v1/entities/:entityId/title",
  "method": "PATCH",
  "parameters": {
    "entity_id": "string",
    "title": "string"
  },
  "success_action": {
    "type": "display_confirmation",
    "message": "Title updated."
  },
  "backend_service": "EntityUpdateService",
  "triggers_sync": true
}
```

### 2. Relationship Operations

Add new category `relationship_operations` in `config/agent_capabilities.json`:

```json
"relationship_operations": {
  "description": "Create, edit, and manage relationships between entities",
  "capabilities": [
    {
      "id": "create_relationship",
      "name": "Create relationship between entities",
      "trigger_patterns": [
        "connect these concepts",
        "link this to",
        "relates to",
        "this builds on",
        "this contradicts"
      ],
      "question_template": "Should I create a relationship between these entities?",
      "available_from": ["chat", "cosmos", "cards"],
      "requires_consent": true,
      "execution_type": "backend_api",
      "target_endpoint": "/api/v1/relationships",
      "method": "POST",
      "parameters": {
        "source_id": "string",
        "target_id": "string",
        "relationship_type": "string",
        "description": "string?",
        "strength": "number?",
        "context": "string?"
      },
      "relationship_types": [
        "RELATED_TO",
        "DEPENDS_ON",
        "INSPIRED_BY",
        "CONTRADICTS",
        "SUPPORTS",
        "EVOLVED_FROM",
        "PART_OF",
        "SIMILAR_TO"
      ],
      "success_action": {
        "type": "display_confirmation",
        "message": "Relationship created in your knowledge graph."
      },
      "backend_service": "RelationshipService",
      "updates_graph": true
    },
    {
      "id": "edit_relationship",
      "name": "Edit relationship properties",
      "trigger_patterns": [
        "change the connection type",
        "update this relationship",
        "make this connection stronger",
        "weaken this link"
      ],
      "question_template": "Should I update this relationship?",
      "available_from": ["cosmos", "cards"],
      "requires_consent": true,
      "execution_type": "backend_api",
      "target_endpoint": "/api/v1/relationships/:relationshipId",
      "method": "PUT",
      "parameters": {
        "relationship_id": "string",
        "relationship_type": "string?",
        "description": "string?",
        "strength": "number?",
        "context": "string?"
      },
      "success_action": {
        "type": "display_confirmation",
        "message": "Relationship updated."
      },
      "backend_service": "RelationshipService",
      "updates_graph": true
    },
    {
      "id": "delete_relationship",
      "name": "Delete relationship between entities",
      "trigger_patterns": [
        "remove this connection",
        "delete this relationship",
        "disconnect these",
        "break this link"
      ],
      "question_template": "Should I remove this relationship?",
      "available_from": ["cosmos", "cards"],
      "requires_consent": true,
      "execution_type": "backend_api",
      "target_endpoint": "/api/v1/relationships/:relationshipId",
      "method": "DELETE",
      "parameters": {
        "relationship_id": "string",
        "user_id": "string"
      },
      "success_action": {
        "type": "display_confirmation",
        "message": "Relationship removed from your knowledge graph."
      },
      "backend_service": "RelationshipService",
      "updates_graph": true,
      "warning": "This action cannot be undone."
    }
  ]
}
```

### 3. Batch Operations

Add to `data_operations` category:

```json
{
  "id": "batch_create_relationships",
  "name": "Create multiple relationships at once",
  "trigger_patterns": [
    "connect all of these",
    "link these concepts together",
    "create relationships between",
    "organize these connections"
  ],
  "question_template": "Should I create all these relationships for you?",
  "available_from": ["chat", "cosmos", "cards"],
  "requires_consent": true,
  "execution_type": "backend_api",
  "target_endpoint": "/api/v1/relationships/batch",
  "method": "POST",
  "parameters": {
    "relationships": "array<{source_id: string, target_id: string, relationship_type: string, description?: string, strength?: number}>"
  },
  "success_action": {
    "type": "display_confirmation",
    "message": "All relationships created successfully."
  },
  "backend_service": "RelationshipService",
  "updates_graph": true,
  "max_batch_size": 20
}
```

### 4. Entity Viewing (Read-Only, No Consent Required)

Add new category `entity_viewing`:

```json
"entity_viewing": {
  "description": "View and explore entity details without modification",
  "capabilities": [
    {
      "id": "view_entity_details",
      "name": "View detailed entity information",
      "trigger_patterns": [
        "show me details about",
        "what is this entity",
        "tell me more about this",
        "entity information"
      ],
      "available_from": ["chat", "cosmos", "cards"],
      "requires_consent": false,
      "execution_type": "frontend_component",
      "target_component": "EntityDetailModal",
      "parameters": {
        "entity_id": "string"
      }
    },
    {
      "id": "view_entity_relationships",
      "name": "View entity connections",
      "trigger_patterns": [
        "what is this connected to",
        "show connections",
        "related entities",
        "what links to this"
      ],
      "available_from": ["chat", "cosmos", "cards"],
      "requires_consent": false,
      "execution_type": "backend_api",
      "target_endpoint": "/api/v1/entities/:entityId/related",
      "method": "GET",
      "parameters": {
        "entity_id": "string"
      }
    }
  ]
}
```

## API Endpoints to Implement

Based on capabilities above, these new endpoints are required:

### Entity Endpoints

- `POST /api/v1/entities` - Create new entity
- `PUT /api/v1/entities/:entityId` - Update entity (title + content)
- `PATCH /api/v1/entities/:entityId/title` - Quick title update
- `PATCH /api/v1/entities/:entityId/content` - Quick content update
- `GET /api/v1/entities/:entityId` - Get entity details (already exists)
- `GET /api/v1/entities/:entityId/related` - Get related entities (already exists)

### Relationship Endpoints

- `GET /api/v1/relationships/:relationshipId` - Get relationship details
- `POST /api/v1/relationships` - Create single relationship
- `POST /api/v1/relationships/batch` - Create multiple relationships
- `PUT /api/v1/relationships/:relationshipId` - Update relationship
- `DELETE /api/v1/relationships/:relationshipId` - Delete relationship

## Backend Services Required

### EntityUpdateService

Location: `packages/database/src/services/EntityUpdateService.ts`

Methods:

- `createEntity(params)` - Create with 3-DB sync
- `updateEntity(entityId, updates)` - Update with 3-DB sync
- `updateTitle(entityId, title)` - Quick title update
- `updateContent(entityId, content)` - Content update + embedding regen

### RelationshipService

Location: `packages/database/src/services/RelationshipService.ts`

Methods:

- `createRelationship(params)` - Create single edge
- `createRelationshipBatch(relationships)` - Create multiple edges
- `updateRelationship(relationshipId, updates)` - Update edge properties
- `deleteRelationship(relationshipId, userId)` - Delete edge

## Integration with PromptBuilder

Update `services/dialogue-service/src/PromptBuilder.ts` to load entity capabilities:

```typescript
private formatAgentCapabilities(
  viewContext?: ViewContext,
  conversationContext?: any,
  engagementContext?: EngagementContext
): string {
  // ... existing code ...
  
  // Filter entity operations based on context
  const hasEntityReference = this.detectEntityReference(conversationContext);
  const hasMultipleEntities = this.detectMultipleEntities(conversationContext);
  
  // Boost relevance scores for entity capabilities when entities are mentioned
  if (hasEntityReference) {
    allCapabilities.forEach(cap => {
      if (cap.category === 'data_operations' || cap.category === 'relationship_operations') {
        cap.relevance_score = (cap.relevance_score || 0) + 15;
      }
    });
  }
  
  // Boost batch operations when multiple entities detected
  if (hasMultipleEntities) {
    allCapabilities.forEach(cap => {
      if (cap.id.includes('batch')) {
        cap.relevance_score = (cap.relevance_score || 0) + 20;
      }
    });
  }
  
  // ... rest of ranking logic ...
}

private detectEntityReference(conversationContext: any): boolean {
  // Check for entity_id mentions in recent messages
  // Check for "this concept", "this entity", "this memory" keywords
  return false; // Placeholder
}

private detectMultipleEntities(conversationContext: any): boolean {
  // Check for multiple entity references
  // Check for "these concepts", "all of these", plurals
  return false; // Placeholder
}
```

## Frontend Integration

### ChatInterface.tsx Enhancement

Update `apps/web-app/src/components/chat/ChatInterface.tsx` to handle entity/relationship actions:

```typescript
const handleActionClick = useCallback((action: UiAction, buttonValue: 'confirm' | 'dismiss') => {
  // ... existing switch_view logic ...
  
  if (buttonValue === 'confirm' && action.action === 'create_entity') {
    const confirmScenario = action.payload.scenarios.on_confirm;
    
    // Call EntityUpdateService via API
    apiClient.post('/api/v1/entities', {
      entity_type: action.payload.entity_type,
      title: action.payload.title,
      content: action.payload.content
    }).then(result => {
      addMessage({
        type: 'bot',
        content: confirmScenario.success_message
      });
    });
  }
  
  if (buttonValue === 'confirm' && action.action === 'create_relationship') {
    const confirmScenario = action.payload.scenarios.on_confirm;
    
    apiClient.post('/api/v1/relationships', {
      source_id: action.payload.source_id,
      target_id: action.payload.target_id,
      relationship_type: action.payload.relationship_type,
      description: action.payload.description
    }).then(result => {
      addMessage({
        type: 'bot',
        content: confirmScenario.success_message
      });
    });
  }
  
  // ... handle other entity/relationship actions ...
}, [/* deps */]);
```

### EntityDetailModal Enhancement

Update `apps/web-app/src/components/modal/EntityDetailModal.tsx`:

- Add "Edit" button that triggers edit mode
- In edit mode, show editable fields for title and content
- Add "Save" button that calls `/api/v1/entities/:entityId` PUT endpoint
- Add "View Relationships" button that opens RelationshipEditor

### New Components

Create these new components:

1. `apps/web-app/src/components/entity/EntityEditor.tsx`

                        - Inline title/content editing
                        - Save/Cancel buttons
                        - Loading states

2. `apps/web-app/src/components/entity/RelationshipEditor.tsx`

                        - List of relationships with edit controls
                        - Relationship type dropdown
                        - Description text field
                        - Strength slider (0-100%)
                        - Delete button per relationship
                        - "Add Relationship" button

3. `apps/web-app/src/components/entity/EntityPicker.tsx`

                        - Search entities by title
                        - Filter by type (Concept, MemoryUnit, etc.)
                        - Preview entity content
                        - Select button

## Worker Protection Flags

Add these fields to all entity tables in PostgreSQL:

```sql
ALTER TABLE concepts ADD COLUMN user_edited BOOLEAN DEFAULT false;
ALTER TABLE concepts ADD COLUMN last_edited_by VARCHAR(50) DEFAULT 'system';
ALTER TABLE concepts ADD COLUMN user_edit_timestamp TIMESTAMP;

-- Repeat for memory_units, insights, etc.
```

Update workers to check these flags:

```typescript
// In IngestionAnalyst.ts, InsightEngine.ts, etc.
before_update = async (entityId: string) => {
  const entity = await repo.findById(entityId);
  
  if (entity.user_edited && entity.last_edited_by === 'user') {
    const timeSinceEdit = Date.now() - new Date(entity.user_edit_timestamp).getTime();
    
    if (timeSinceEdit < 24 * 60 * 60 * 1000) { // 24 hours
      console.log(`Skipping update for ${entityId}: recently edited by user`);
      return false; // Skip update
    }
  }
  
  return true; // Allow update
};
```

## Prompt Template Update

Add to `config/prompt_templates.yaml`:

```yaml
agent_capabilities_template: |
  # ... existing content ...
  
  **ENTITY & RELATIONSHIP OPERATIONS**
  
  When users mention entities, concepts, or connections, you have these capabilities:
  
  {{#entity_capabilities}}
 - **{{name}}** ({{id}}): {{#requires_consent}}Requires consent.{{/requires_consent}}
    Trigger patterns: {{#trigger_patterns}}"{{.}}", {{/trigger_patterns}}
    {{#question_template}}Ask: "{{question_template}}"{{/question_template}}
  {{/entity_capabilities}}
  
  **Important Notes:**
 - All entity/relationship changes require 3-database sync (PostgreSQL → Neo4j → Weaviate)
 - Content changes trigger async embedding regeneration (~2 seconds)
 - Always check for entity references in conversation before suggesting entity operations
 - Batch operations available when multiple entities are mentioned
```

## Testing Scenarios

### Entity Creation

1. User says: "I want to remember this insight"
2. Agent: "Should I create a new entity to save this?" [Yes] [Maybe later]
3. User clicks "Yes"
4. Agent: Calls POST /api/v1/entities
5. Verify: Entity created in PostgreSQL, Neo4j node created, Weaviate entry created

### Entity Editing

1. User opens EntityDetailModal for existing entity
2. Clicks "Edit" button
3. Changes title from "Growth Mindset" to "Growth Mindset Framework"
4. Changes content
5. Clicks "Save"
6. Verify: All 3 databases updated, embedding regenerated

### Relationship Creation

1. User says: "Connect this concept to my growth mindset"
2. Agent: "Should I create a relationship between these entities?" [Yes] [No]
3. User clicks "Yes"
4. Agent: Calls POST /api/v1/relationships
5. Verify: Neo4j edge created with properties, visible in Cosmos view

### Batch Relationships

1. User says: "Link all these concepts together"
2. Agent detects 5 entity references
3. Agent: "Should I create all these relationships for you?" [Yes] [No]
4. User clicks "Yes"
5. Agent: Calls POST /api/v1/relationships/batch with array of 5 relationships
6. Verify: All edges created, graph updated

## Files to Create

1. `config/agent_capabilities.json` - Add entity/relationship capabilities (modify existing)
2. `packages/database/src/services/EntityUpdateService.ts` - 3-DB sync service
3. `packages/database/src/services/RelationshipService.ts` - Relationship CRUD
4. `apps/api-gateway/src/controllers/entity-edit.controller.ts` - Entity edit endpoints
5. `apps/api-gateway/src/controllers/relationship.controller.ts` - Relationship endpoints
6. `apps/web-app/src/components/entity/EntityEditor.tsx` - Edit UI
7. `apps/web-app/src/components/entity/RelationshipEditor.tsx` - Relationship UI
8. `apps/web-app/src/components/entity/EntityPicker.tsx` - Entity search/select
9. `apps/web-app/src/hooks/useEntityUpdate.ts` - Entity update hook
10. `apps/web-app/src/hooks/useRelationshipManagement.ts` - Relationship CRUD hook

## Files to Modify

1. `apps/web-app/src/components/chat/ChatInterface.tsx` - Handle entity/relationship actions
2. `apps/web-app/src/components/modal/EntityDetailModal.tsx` - Add edit mode
3. `services/dialogue-service/src/PromptBuilder.ts` - Load entity capabilities, boost relevance
4. `config/prompt_templates.yaml` - Add entity operations section
5. `apps/api-gateway/src/routes/v1/index.ts` - Add new routes
6. `packages/database/src/services/Neo4jService.ts` - Add relationship CRUD methods
7. `workers/ingestion-worker/src/IngestionAnalyst.ts` - Check user_edited flag
8. `workers/insight-worker/src/InsightEngine.ts` - Respect user edits

## Success Criteria

- Agent can suggest entity creation when contextually appropriate
- Agent can suggest relationship creation between mentioned entities
- All entity updates sync across PostgreSQL, Neo4j, and Weaviate
- Embedding regeneration triggered for content changes
- Workers respect user_edited flags
- EntityDetailModal has functional edit mode
- Relationship editor allows inline editing of edge properties
- Batch operations work for multiple relationships
- All operations require consent before execution

### To-dos

- [ ] Add entity data operation capabilities (create_entity, edit_entity_content, quick_edit_entity_title) to config/agent_capabilities.json
- [ ] Add relationship_operations category with create/edit/delete relationship capabilities to config/agent_capabilities.json
- [ ] Add batch_create_relationships capability to data_operations category
- [ ] Add entity_viewing category with read-only capabilities (no consent required)
- [ ] Create packages/database/src/services/EntityUpdateService.ts with 3-database sync methods
- [ ] Create packages/database/src/services/RelationshipService.ts with relationship CRUD methods
- [ ] Add createRelationship, updateRelationship, deleteRelationship methods to packages/database/src/services/Neo4jService.ts
- [ ] Create apps/api-gateway/src/controllers/entity-edit.controller.ts with entity CRUD endpoints
- [ ] Create apps/api-gateway/src/controllers/relationship.controller.ts with relationship CRUD endpoints
- [ ] Add entity and relationship routes to apps/api-gateway/src/routes/v1/index.ts
- [ ] Update apps/web-app/src/components/chat/ChatInterface.tsx to handle entity and relationship action confirmations
- [ ] Create apps/web-app/src/components/entity/EntityEditor.tsx with inline editing UI
- [ ] Create apps/web-app/src/components/entity/RelationshipEditor.tsx with relationship management UI
- [ ] Create apps/web-app/src/components/entity/EntityPicker.tsx for entity search and selection
- [ ] Update apps/web-app/src/components/modal/EntityDetailModal.tsx to integrate edit mode and relationship editor
- [ ] Create apps/web-app/src/hooks/useEntityUpdate.ts for entity update operations
- [ ] Create apps/web-app/src/hooks/useRelationshipManagement.ts for relationship CRUD operations
- [ ] Update services/dialogue-service/src/PromptBuilder.ts to load entity capabilities and boost relevance based on entity references
- [ ] Add entity and relationship operations section to config/prompt_templates.yaml
- [ ] Add user_edited, last_edited_by, and user_edit_timestamp fields to entity tables via migration
- [ ] Update workers (IngestionAnalyst, InsightEngine, OntologyOptimizer) to check user_edited flags before updates