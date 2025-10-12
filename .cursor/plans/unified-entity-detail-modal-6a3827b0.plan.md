<!-- 6a3827b0-1e3a-47f5-ad3f-aa527ed41270 76e8de56-c44f-4fdb-8634-f1890d7cc14e -->
# Entity and Relationship Editing System

## Overview

Enable users to directly edit:

1. Entity title and content (with 3-database sync)
2. Relationship properties (type, description, strength)
3. Create new relationships between entities
4. Delete relationships

## Current System Architecture

### Data Flow

```
PostgreSQL (Source of truth for entity data)
    ↕ sync
Neo4j (Relationships + entity metadata for graph traversal)
    ↕ sync
Weaviate (Vector embeddings for semantic search)
```

### Existing Edit Capabilities

- ✅ **CardRepository**: `updateCustomFields()` - card-level title/content overrides
- ✅ **Repositories**: `update()` methods - entity-level updates (Concept, MemoryUnit, etc.)
- ❌ **No entity sync** - Updates don't propagate to Neo4j/Weaviate
- ❌ **No relationship editing** - No methods to update/delete relationships
- ❌ **No user-initiated relationship creation**

### Database Schemas

**PostgreSQL** (14 fields per entity):

- `entity_id`, `user_id`, `title`, `content`, `type`, `status`
- `created_at`, `updated_at`, `importance_score`
- `position_x`, `position_y`, `position_z`
- `community_id`, `merged_into_entity_id`

**Neo4j Nodes** (standardized V11.0):

- Same as PostgreSQL: `entity_id`, `user_id`, `entity_type`, `title`, `content`, `type`, `status`, `created_at`, `updated_at`

**Neo4j Relationships** (standardized V11.0):

- `relationship_id` (UUID, unique)
- `relationship_type` (edge type)
- `created_at`, `updated_at`
- `user_id` (multi-tenancy)
- `source_agent` (which worker created it)
- `strength` (0.0-1.0, optional)
- `description` (human-readable, optional)
- `context` (additional context, optional)

**Weaviate** (UserKnowledgeItem class):

- `entity_id`, `user_id`, `entity_type`, `title`, `content`, `type`, `status`, `created_at`
- Vector embedding (regenerated on content change)

## Implementation Strategy

### Phase 1: Entity Editing (Title & Content)

#### Frontend UI Components

**EntityDetailModal Enhancement**:

- Add edit mode toggle (pencil icon button)
- Inline editable title (contentEditable or input field)
- Expandable textarea for content editing
- Save/Cancel buttons in edit mode
- Loading state during save

**Edit Workflow**:

1. User clicks edit button
2. Title/content become editable
3. User makes changes
4. Click save → API call → 3-database sync
5. Refresh entity details

#### Backend Implementation

**New Service**: `packages/database/src/services/EntityUpdateService.ts`

```typescript
class EntityUpdateService {
  async updateEntityWithSync(params: {
    entityId: string;
    entityType: string;
    userId: string;
    title?: string;
    content?: string;
    updateEmbedding?: boolean; // default true
  }): Promise<void>
}
```

**3-Database Sync Process**:

1. Update PostgreSQL (via repository)
2. Update Neo4j node properties
3. Update Weaviate entry
4. Re-generate embedding if content changed (async)

**New API Endpoints**:

- `PUT /api/v1/entities/:entityId` - Update entity properties
- `PATCH /api/v1/entities/:entityId/title` - Quick title update
- `PATCH /api/v1/entities/:entityId/content` - Quick content update

#### Conflict Resolution

**Worker Protection**:

- Add `user_edited` flag to entities
- Add `last_edited_by` field (user vs worker)
- Add `user_edit_timestamp`
- Workers check flags before overwriting

**Merge Strategy**:

- User edits take precedence
- Workers append to content instead of replacing
- UI shows diff when conflicts detected

### Phase 2: Relationship Editing

#### Frontend UI Components

**RelationshipEditor Component** (new):

- Display connected entities as graph or list
- Each edge shows:
  - Source → Target
  - Relationship type (editable dropdown)
  - Description (editable text field)
  - Strength (slider 0-100%)
  - Delete button
- "Add Relationship" button opens entity picker

**Entity Picker Modal** (new):

- Search entities by title
- Filter by entity type
- Preview entity content
- Select target entity for new relationship

#### Backend Implementation

**Neo4j Relationship Methods** (add to Neo4jService):

```typescript
updateRelationship(relationshipId: string, updates: {
  relationship_type?: string;
  description?: string;
  strength?: number;
}): Promise<void>

deleteRelationship(relationshipId: string, userId: string): Promise<void>

createUserRelationship(params: {
  sourceId: string;
  targetId: string;
  userId: string;
  relationshipType: string;
  description?: string;
  strength?: number;
}): Promise<string> // returns relationship_id
```

**New API Endpoints**:

- `GET /api/v1/relationships/:relationshipId` - Get relationship details
- `PUT /api/v1/relationships/:relationshipId` - Update relationship
- `DELETE /api/v1/relationships/:relationshipId` - Delete relationship
- `POST /api/v1/relationships` - Create new relationship

**Relationship Type Catalog**:

- Predefined types: `RELATED_TO`, `DEPENDS_ON`, `INSPIRED_BY`, `CONTRADICTS`, `SUPPORTS`
- Allow custom types (user-defined)
- Validation: prevent self-loops, check entity existence

### Phase 3: Advanced Features

#### Batch Operations

- Select multiple entities → bulk edit
- Select multiple relationships → bulk delete

#### Undo/Redo

- Store edit history in `entity_edit_history` table
- Keep last 10 edits per entity
- UI undo button (Ctrl+Z)

#### Real-time Collaboration

- WebSocket updates when other users edit
- Optimistic UI updates
- Conflict resolution UI

## Technical Challenges & Solutions

### Challenge 1: Embedding Regeneration Cost

**Problem**: Content changes require expensive OpenAI API calls

**Solutions**:

1. Debounce embedding updates (wait 5 seconds after last edit)
2. Queue embedding jobs (BullMQ)
3. Show "Embedding update pending" indicator
4. Allow "Save without re-embedding" option

### Challenge 2: Worker Conflicts

**Problem**: Workers might overwrite user edits

**Solutions**:

1. Add `user_edited` flag to entities
2. Workers check flag before updating
3. Worker updates append instead of replace
4. Periodic worker sync audit

### Challenge 3: Neo4j Sync Failures

**Problem**: PostgreSQL succeeds but Neo4j fails

**Solutions**:

1. Use transactions where possible
2. Implement retry logic
3. Audit log for failed syncs
4. Background sync job to fix inconsistencies

### Challenge 4: Relationship Type Explosion

**Problem**: Users create too many custom relationship types

**Solutions**:

1. Suggest existing types first
2. Limit to 50 custom types per user
3. Admin can promote custom types to global
4. Merge similar types tool

## Files to Create

### Frontend

- `apps/web-app/src/components/entity/EntityEditor.tsx` - Edit UI
- `apps/web-app/src/components/entity/RelationshipEditor.tsx` - Relationship UI
- `apps/web-app/src/components/entity/EntityPicker.tsx` - Entity search/select
- `apps/web-app/src/hooks/useEntityUpdate.ts` - Entity update hook
- `apps/web-app/src/hooks/useRelationshipManagement.ts` - Relationship CRUD hook

### Backend

- `packages/database/src/services/EntityUpdateService.ts` - 3-database sync
- `packages/database/src/services/RelationshipService.ts` - Relationship CRUD
- `apps/api-gateway/src/controllers/entity-edit.controller.ts` - Entity edit endpoints
- `apps/api-gateway/src/controllers/relationship.controller.ts` - Relationship endpoints

### Database

- Migration: Add `user_edited`, `last_edited_by`, `user_edit_timestamp` to all entity tables
- New table: `entity_edit_history` for undo/redo
- New table: `custom_relationship_types` for user-defined types

## Files to Modify

### Frontend

- `apps/web-app/src/components/modal/EntityDetailModal.tsx` - Add edit button and editor integration
- `apps/web-app/src/hooks/useEntityDetails.ts` - Add refetch after edits

### Backend

- `packages/database/src/services/Neo4jService.ts` - Add relationship CRUD methods
- `packages/database/src/services/WeaviateService.ts` - Add update method
- `apps/api-gateway/src/routes/v1/index.ts` - Add new routes
- All entity repositories - Add conflict checking

### Workers

- `workers/ingestion-worker/src/IngestionAnalyst.ts` - Check user_edited flag
- `workers/insight-worker/src/InsightEngine.ts` - Respect user edits
- `workers/ontology-optimization-worker/src/OntologyOptimizer.ts` - Preserve user relationships

## Testing Checklist

### Entity Editing

- [ ] Edit entity title, saves to all 3 databases
- [ ] Edit entity content, saves to all 3 databases
- [ ] Embedding regenerated after content change
- [ ] Worker respects user_edited flag
- [ ] Conflict resolution works when worker tries to update
- [ ] Undo/redo works for entity edits
- [ ] EntityDetailModal shows edit UI correctly

### Relationship Editing

- [ ] Create new relationship between two entities
- [ ] Edit relationship type from dropdown
- [ ] Edit relationship description
- [ ] Adjust relationship strength with slider
- [ ] Delete relationship
- [ ] Changes reflect in EntityDetailModal's related entities
- [ ] Changes visible in Cosmos 3D graph
- [ ] Prevent self-loops
- [ ] Validate entity existence before creating edge

### Cross-Database Consistency

- [ ] PostgreSQL update syncs to Neo4j
- [ ] PostgreSQL update syncs to Weaviate
- [ ] Failed Neo4j sync triggers retry
- [ ] Audit log captures sync failures
- [ ] Background job fixes inconsistencies

## Rollout Strategy

### Phase 1: Read-Only Preview (Week 1)

- UI shows edit buttons (disabled)
- Display "Coming soon" tooltip
- Gather user feedback on UI design

### Phase 2: Entity Editing Only (Week 2-3)

- Enable title/content editing
- 3-database sync
- Worker conflict protection
- Limited to power users (beta flag)

### Phase 3: Relationship Editing (Week 4-5)

- Enable relationship CRUD
- Full rollout to all users

### Phase 4: Advanced Features (Week 6+)

- Batch operations
- Undo/redo
- Real-time collaboration

### To-dos

- [ ] Research current entity creation/persistence patterns across workers and databases
- [ ] Design EntityUpdateService with 3-database synchronization
- [ ] Add relationship CRUD methods to Neo4jService
- [ ] Create EntityEditor component with inline editing for title and content
- [ ] Create RelationshipEditor component with graph/list view of connections
- [ ] Implement PUT /api/v1/entities/:entityId endpoint with sync logic
- [ ] Implement relationship CRUD API endpoints
- [ ] Add user_edited flags and conflict checking to workers
- [ ] Create BullMQ queue for async embedding regeneration
- [ ] Create EntityPicker modal for selecting target entities
- [ ] Integrate editing capabilities into EntityDetailModal