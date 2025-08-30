# Entity Type Unification Implementation Plan

**Document Version:** 1.0  
**Date:** December 29, 2025  
**Purpose:** Comprehensive plan to unify all 8 core entity types across PostgreSQL, Neo4j, and Weaviate, ensuring proper embedding creation, card gallery support, and graph projection.

**Status:** Ready for Implementation  
**Priority:** HIGH - Critical for system functionality  

---

## **Executive Summary**

Currently, only `MemoryUnit` and `Concept` entities are fully supported across all three databases. `DerivedArtifact`, `Community`, and `ProactivePrompt` entities are created but lack proper embeddings, causing graph projection failures and incomplete system functionality.

This plan implements **Option 1** for concept merging (secondary concepts are updated in place with merged status) and ensures all 8 entity types are consistently supported across the entire system.

---

## **Current State Analysis**

### **Entity Type Coverage Matrix**

| Entity Type | PostgreSQL | Neo4j | Weaviate | Card Gallery | Graph Projection | Embeddings |
|-------------|------------|-------|----------|---------------|------------------|-------------|
| **User** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **MemoryUnit** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Concept** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DerivedArtifact** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Community** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **ProactivePrompt** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **GrowthEvent** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### **Critical Issues Identified**

1. **Missing Neo4j Schema**: `ProactivePrompt` lacks Neo4j constraints and indexes
2. **Incomplete Embedding Pipeline**: Only `MemoryUnit` and `Concept` get embeddings created
3. **GraphProjectionWorker Limitations**: Doesn't support all entity types
4. **Concept Merging Confusion**: `MergedConcept` entities create redundant nodes
5. **Frontend Inconsistency**: Card gallery and graph visualization don't handle all types
6. **Missing Entity Types**: `GrowthEvent` and `User` are completely excluded from graph projection and visualization
7. **GrowthEvent Invisibility**: 13 growth events exist in PostgreSQL but are invisible in the 3D knowledge graph

---

## **Additional Entity Types to Incorporate**

### **GrowthEvent Integration**

**Current Status:**
- ✅ **PostgreSQL**: 13 growth events exist with full repository support
- ✅ **Repository**: Complete `GrowthEventRepository` with CRUD operations
- ❌ **Neo4j**: No nodes, constraints, or indexes
- ❌ **Embeddings**: No embedding creation pipeline
- ❌ **Graph Projection**: Not included in `Node3D` interface
- ❌ **3D Visualization**: Completely invisible in knowledge graph

**Why Include GrowthEvent:**
- Growth events represent user progress and learning milestones
- They provide temporal context for knowledge evolution
- Essential for tracking user development over time
- Currently being created but not visualized (data loss)

### **User Entity Integration**

**Current Status:**
- ✅ **PostgreSQL**: User records exist with authentication
- ✅ **Neo4j**: User nodes exist with basic constraints
- ❌ **Embeddings**: No user profile embeddings
- ❌ **Graph Projection**: Not included in visualization
- ❌ **Card Gallery**: No user profile cards

**Why Include User:**
- Users are central nodes in the knowledge graph
- User profiles should be searchable and relatable
- Essential for community and relationship mapping
- Provides context for all other entity relationships

---

## **Implementation Plan**

### **Phase 1: Database Schema Alignment (HIGH PRIORITY)**

#### **1.1 Add ProactivePrompt to Neo4j Schema**

**File:** `packages/database/schemas/neo4j.cypher`

```cypher
-- Add ProactivePrompt constraint and indexes
CREATE CONSTRAINT proactiveprompt_prompt_id_unique IF NOT EXISTS FOR (n:ProactivePrompt) REQUIRE n.prompt_id IS UNIQUE;
CREATE INDEX proactiveprompt_userId_idx IF NOT EXISTS FOR (n:ProactivePrompt) ON (n.userId);

-- Add GrowthEvent constraints and indexes
CREATE CONSTRAINT growthevent_event_id_unique IF NOT EXISTS FOR (n:GrowthEvent) REQUIRE n.event_id IS UNIQUE;
CREATE INDEX growthevent_userId_idx IF NOT EXISTS FOR (n:GrowthEvent) ON (n.userId);
CREATE INDEX growth_event_dimension_key_idx IF NOT EXISTS FOR (n:GrowthEvent) ON (n.dimension_key);
CREATE INDEX growthevent_creation_ts_idx IF NOT EXISTS FOR (n:GrowthEvent) ON (n.creation_ts);

-- Verify User constraints exist
CREATE CONSTRAINT user_userId_unique IF NOT EXISTS FOR (n:User) REQUIRE n.userId IS UNIQUE;
```

**Verification:**
```cypher
-- Verify constraint exists
SHOW CONSTRAINTS;
-- Should show proactiveprompt_prompt_id_unique, growthevent_event_id_unique, user_userId_unique

-- Verify index exists
SHOW INDEXES;
-- Should show proactiveprompt_userId_idx, growthevent_userId_idx, growth_event_dimension_key_idx, growthevent_creation_ts_idx
```

#### **1.2 Verify All Entity Type Constraints**

**File:** `packages/database/schemas/neo4j.cypher`

Ensure all entity types have proper constraints:

```cypher
-- Verify all constraints exist
CREATE CONSTRAINT user_userId_unique IF NOT EXISTS FOR (n:User) REQUIRE n.userId IS UNIQUE;
CREATE CONSTRAINT memoryunit_muid_unique IF NOT EXISTS FOR (n:MemoryUnit) REQUIRE n.muid IS UNIQUE;
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (n:Concept) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT derivedartifact_id_unique IF NOT EXISTS FOR (n:DerivedArtifact) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT community_community_id_unique IF NOT EXISTS FOR (n:Community) REQUIRE n.community_id IS UNIQUE;
CREATE CONSTRAINT proactiveprompt_prompt_id_unique IF NOT EXISTS FOR (n:ProactivePrompt) REQUIRE n.prompt_id IS UNIQUE;
```

---

### **Phase 2: Fix Embedding Creation Pipeline (HIGH PRIORITY)**

#### **2.1 Update IngestionAnalyst for All Entity Types**

**File:** `workers/ingestion-worker/src/IngestionAnalyst.ts`

**Current Issue:** Only creates embeddings for `MemoryUnit` and `Concept`

**Solution:** Add support for all entity types in embedding creation

```typescript
// Replace the existing hardcoded filter with dynamic content extraction
private async extractTextContentForEntity(entityId: string, entityType: string): Promise<string | null> {
  try {
    switch (entityType) {
      case 'MemoryUnit':
        const memory = await this.memoryRepository.findById(entityId);
        return memory ? `${memory.title}\n${memory.content}` : null;
        
      case 'Concept':
        const concept = await this.conceptRepository.findById(entityId);
        return concept ? `${concept.name}: ${concept.description || ''}` : null;
        
      case 'DerivedArtifact':
        const artifact = await this.derivedArtifactRepository.findById(entityId);
        return artifact ? `${artifact.title}\n\n${artifact.content_narrative}` : null;
        
      case 'ProactivePrompt':
        const prompt = await this.proactivePromptRepository.findById(entityId);
        return prompt ? prompt.prompt_text : null;
        
      case 'Community':
        const community = await this.communityRepository.findById(entityId);
        return community ? `${community.name}: ${community.description || ''}` : null;
        
      case 'GrowthEvent':
        const growthEvent = await this.growthEventRepository.findById(entityId);
        return growthEvent ? `${growthEvent.dimension_key}: ${growthEvent.rationale}\nDelta: ${growthEvent.delta_value}` : null;
        
      case 'User':
        const user = await this.userRepository.findById(entityId);
        return user ? `${user.username || user.email}: ${user.profile?.bio || 'User profile'}` : null;
        
      default:
        console.warn(`[IngestionAnalyst] Unknown entity type for embedding: ${entityType}`);
        return null;
    }
  } catch (error: unknown) {
    console.error(`[IngestionAnalyst] Error extracting text content for ${entityType} ${entityId}:`, error);
    return null;
  }
}

// Update the publishEvents method to handle all entity types
private async publishEvents(userId: string, newEntities: Array<{ id: string; type: string }>) {
  // Publish embedding jobs for each new entity
  for (const entity of newEntities) {
    const textContent = await this.extractTextContentForEntity(entity.id, entity.type);
    
    if (textContent) {
      await this.embeddingQueue.add('create_embedding', {
        entityId: entity.id,
        entityType: entity.type,
        textContent,
        userId
      });
      
      console.log(`[IngestionAnalyst] Queued embedding job for ${entity.type} ${entity.id}`);
    }
  }
  
  // Rest of the method remains the same...
}
```

#### **2.2 Update InsightEngine for All Entity Types**

**File:** `workers/insight-worker/src/InsightEngine.ts`

**Current Issue:** Filters out certain entity types from embedding creation

**Solution:** Include all entity types in embedding creation

```typescript
// Update the filter to include all entity types
private async publishEmbeddingJobs(userId: string, newEntities: Array<{ id: string; type: string }>) {
  const embeddingJobs = [];
  
  // Include all entity types for embedding
  const contentEntities = newEntities.filter(entity => 
    ['DerivedArtifact', 'ProactivePrompt', 'Community'].includes(entity.type)
  );
  
  console.log(`[InsightEngine] Filtered ${newEntities.length} total entities to ${contentEntities.length} content entities for embedding`);

  for (const entity of contentEntities) {
    try {
      const textContent = await this.extractTextContentForEntity(entity.id, entity.type);
      
      if (textContent) {
        embeddingJobs.push({
          entityId: entity.id,
          entityType: entity.type as 'DerivedArtifact' | 'ProactivePrompt' | 'Community',
          textContent,
          userId
        });
        
        console.log(`[InsightEngine] Prepared embedding job for ${entity.type} ${entity.id}`);
      }
    } catch (error: unknown) {
      console.error(`[InsightEngine] Error preparing embedding job for ${entity.type} ${entity.id}:`, error);
    }
  }

  // Rest of the method remains the same...
}
```

#### **2.3 Verify EmbeddingWorker Support**

**File:** `workers/embedding-worker/src/EmbeddingWorker.ts`

**Current State:** Already supports all entity types

**Verification:** Ensure the interface includes all types:

```typescript
export interface EmbeddingJob {
  entityId: string;
  entityType: 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt';
  textContent: string;
  userId: string;
}
```

---

### **Phase 3: Implement Concept Consolidation (Option 1 - Corrected) (HIGH PRIORITY)**

#### **3.1 Update InsightEngine Concept Merging**

**File:** `workers/insight-worker/src/InsightEngine.ts`

**Current Issue:** Creates `MergedConcept` entities instead of updating existing Concept nodes

**Solution:** Implement Option 1 - secondary concepts are updated in place with merged status, maintaining consistency across all databases

```typescript
/**
 * Execute Neo4j concept merging operations with proper status updates
 */
private async executeConceptMerging(ontologyOptimizations: any): Promise<string[]> {
  if (!this.dbService.neo4j) {
    console.warn('[InsightEngine] Neo4j client not available, skipping concept merging');
    return [];
  }
  
  const mergedConceptIds: string[] = [];
  
  try {
    for (const merge of ontologyOptimizations.concepts_to_merge) {
      // 1. Mark secondary concepts as merged in both PostgreSQL and Neo4j
      await this.markSecondaryConceptsAsMerged(merge);
      
      // 2. Update primary concept metadata to reflect merging
      await this.updatePrimaryConceptMetadata(merge);
      
      // 3. Redirect all relationships to primary concept
      await this.redirectRelationshipsToPrimary(merge);
      
      // 4. Create new embedding for primary concept (includes merged knowledge)
      await this.createUpdatedEmbedding(merge.primary_concept_id);
      
      mergedConceptIds.push(merge.primary_concept_id);
    }
  } catch (error: unknown) {
    console.error('[InsightEngine] Error during concept merging:', error);
    throw error;
  }
  
  return mergedConceptIds;
}

#### **3.2 Fix Neo4j Merging Implementation**

**Current Issue:** Neo4j creates separate `MergedConcept` nodes instead of updating existing Concept nodes

**Solution:** Update existing Concept nodes with merged status properties

```typescript
/**
 * Update Neo4j Concept node status (NOT create MergedConcept)
 */
private async updateNeo4jConceptStatus(conceptId: string, statusData: any): Promise<void> {
  if (!this.dbService.neo4j) return;
  
  const session = this.dbService.neo4j.session();
  try {
    // Update existing Concept node instead of creating MergedConcept
    const result = await session.run(`
      MATCH (c:Concept {concept_id: $conceptId})
      SET c.status = $status,
          c.merged_into_concept_id = $mergedIntoConceptId,
          c.merged_at = $mergedAt
      RETURN c
    `, {
      conceptId,
      status: statusData.status,
      mergedIntoConceptId: statusData.merged_into_concept_id,
      mergedAt: statusData.merged_at
    });
    
    console.log(`[InsightEngine] Updated Neo4j Concept ${conceptId} status to merged`);
  } finally {
    session.close();
  }
}

/**
 * Update primary concept metadata in Neo4j
 */
private async updateNeo4jPrimaryConceptMetadata(conceptId: string, metadata: any): Promise<void> {
  if (!this.dbService.neo4j) return;
  
  const session = this.dbService.neo4j.session();
  try {
    // Update primary concept metadata
    const result = await session.run(`
      MATCH (c:Concept {concept_id: $conceptId})
      SET c.metadata = $metadata
      RETURN c
    `, {
      conceptId,
      metadata: JSON.stringify(metadata)
    });
    
    console.log(`[InsightEngine] Updated Neo4j Concept ${conceptId} metadata`);
  } finally {
    session.close();
  }
}

/**
 * Update primary concept metadata to reflect merging operations
 */
private async updatePrimaryConceptMetadata(merge: any): Promise<void> {
  // Update primary concept metadata in PostgreSQL
  await this.conceptRepository.update(merge.primary_concept_id, {
    metadata: {
      merged_concepts: merge.secondary_concept_ids,
      merge_rationale: merge.merge_rationale,
      merged_at: new Date().toISOString(),
      total_merged_concepts: merge.secondary_concept_ids.length + 1
    }
  });
  
  // Update primary concept metadata in Neo4j
  await this.updateNeo4jPrimaryConceptMetadata(merge.primary_concept_id, {
    merged_concepts: merge.secondary_concept_ids,
    merge_rationale: merge.merge_rationale,
    merged_at: new Date().toISOString(),
    total_merged_concepts: merge.secondary_concept_ids.length + 1
  });
}

/**
 * Mark secondary concepts as merged in both PostgreSQL and Neo4j
 */
private async markSecondaryConceptsAsMerged(merge: any): Promise<void> {
  for (const secondaryId of merge.secondary_concept_ids) {
    // Update PostgreSQL status
    await this.conceptRepository.update(secondaryId, {
      status: 'merged',
      merged_into_concept_id: merge.primary_concept_id
    });
    
    // Update Neo4j Concept node status (NOT create MergedConcept)
    await this.updateNeo4jConceptStatus(secondaryId, {
      status: 'merged',
      merged_into_concept_id: merge.primary_concept_id,
      merged_at: new Date().toISOString()
    });
  }
}

/**
 * Redirect all relationships to primary concept
 */
private async redirectRelationshipsToPrimary(merge: any): Promise<void> {
  const session = this.dbService.neo4j.session();
  
  try {
    // Redirect outgoing relationships from secondary concepts to primary
    for (const secondaryId of merge.secondary_concept_ids) {
      const redirectCypher = `
        MATCH (secondary:Concept {id: $secondaryId})-[r]->(target)
        WHERE NOT target:Concept OR target.id <> $primaryId
        WITH secondary, r, target
        MATCH (primary:Concept {id: $primaryId})
        CREATE (primary)-[newRel:RELATED_TO]->(target)
        SET newRel = properties(r),
            newRel.redirected_from = $secondaryId,
            newRel.redirected_at = datetime()
        DELETE r
      `;
      
      await session.run(redirectCypher, {
        secondaryId,
        primaryId: merge.primary_concept_id
      });
    }
    
    // Redirect incoming relationships to secondary concepts
    for (const secondaryId of merge.secondary_concept_ids) {
      const redirectIncomingCypher = `
        MATCH (source)-[r]->(secondary:Concept {id: $secondaryId})
        WHERE NOT source:Concept OR source.id <> $primaryId
        WITH source, r, secondary
        MATCH (primary:Concept {id: $primaryId})
        CREATE (source)-[newRel:RELATED_TO]->(primary)
        SET newRel = properties(r),
            newRel.redirected_from = $secondaryId,
            newRel.redirected_at = datetime()
        DELETE r
      `;
      
      await session.run(redirectIncomingCypher, {
        secondaryId,
        primaryId: merge.primary_concept_id
      });
    }
  } finally {
    session.close();
  }
}

/**
 * Create consolidated embedding for merged concept
 */
private async createConsolidatedEmbedding(consolidatedConcept: any): Promise<void> {
  // 1. Generate new text content
  const consolidatedText = await this.generateConsolidatedTextContent(consolidatedConcept);
  
  // 2. Generate new embedding
  const embeddingResult = await this.textEmbeddingTool.execute({
    text_to_embed: consolidatedText,
    model_id: 'text-embedding-3-small'
  });
  
  // 3. Update existing Weaviate object
  await this.databaseService.weaviate
    .data
    .updater()
    .withClassName('UserKnowledgeItem')
    .withId(consolidatedConcept.id)
    .withProperties({
      title: consolidatedConcept.name,
      textContent: consolidatedText,
      sourceEntityType: 'Concept',
      sourceEntityId: consolidatedConcept.id,
      updatedAt: new Date().toISOString(),
      consolidated: true,
      mergeMetadata: JSON.stringify(consolidatedConcept.metadata)
    })
    .withVector(embeddingResult.result.vector)
    .do();
  
  console.log(`✅ [InsightEngine] Updated embedding for consolidated concept: ${consolidatedConcept.id}`);
}

/**
 * Generate comprehensive text content for consolidated concept
 */
private async generateConsolidatedTextContent(merge: any): Promise<string> {
  const primaryConcept = await this.conceptRepository.findById(merge.primary_concept_id);
  const secondaryConcepts = await Promise.all(
    merge.secondary_concept_ids.map(id => this.conceptRepository.findById(id))
  );
  
  // Create comprehensive text representation
  let consolidatedText = `CONCEPT: ${merge.new_concept_name}\n\n`;
  consolidatedText += `DESCRIPTION: ${merge.new_concept_description}\n\n`;
  
  // Include original concept information
  consolidatedText += `ORIGINAL CONCEPTS:\n`;
  consolidatedText += `- ${primaryConcept.name}: ${primaryConcept.description || 'No description'}\n`;
  
  for (const secondary of secondaryConcepts) {
    consolidatedText += `- ${secondary.name}: ${secondary.description || 'No description'}\n`;
  }
  
  // Include merge rationale
  consolidatedText += `\nMERGE RATIONALE: ${merge.merge_rationale}\n`;
  
  // Include any additional context from relationships
  const relationships = await this.getConceptRelationships(merge.primary_concept_id);
  if (relationships.length > 0) {
    consolidatedText += `\nRELATED TOPICS: ${relationships.map(r => r.target_name).join(', ')}\n`;
  }
  
  return consolidatedText;
}
```

#### **3.2 Remove MergedConcept from System**

**Files to Update:**

1. **GraphProjectionWorker**: Remove `MergedConcept` type support
2. **EmbeddingWorker**: Remove `MergedConcept` from interface
3. **InsightEngine**: Remove `MergedConcept` from embedding creation

```typescript
// Remove from all interfaces and type definitions
// No more 'MergedConcept' type anywhere in the system
```

---

### **Phase 4: Update GraphProjectionWorker (HIGH PRIORITY)**

#### **4.1 Update Node3D Interface**

**File:** `workers/graph-projection-worker/src/GraphProjectionWorker.ts`

```typescript
export interface Node3D {
  id: string;
  type: 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt' | 'GrowthEvent' | 'User';
  title: string;
  content: string;
  position: [number, number, number]; // 3D coordinates
  connections: string[]; // Connected node IDs
  importance: number;
  metadata: {
    createdAt: string;
    lastUpdated: string;
    userId: string;
    isMerged?: boolean;
    mergedIntoConceptId?: string | null;
    status?: string;
  };
}
```

#### **4.2 Update Node Type Detection**

```typescript
private async fetchGraphStructureFromNeo4j(userId: string): Promise<{...}> {
  const processedNodes = graphStructure.nodes.map(node => {
    let nodeType: 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt' | 'GrowthEvent' | 'User';
    
    if (node.labels.includes('ProactivePrompt')) {
      nodeType = 'ProactivePrompt';
    } else if (node.labels.includes('GrowthEvent')) {
      nodeType = 'GrowthEvent';
    } else if (node.labels.includes('User')) {
      nodeType = 'User';
    } else if (node.labels.includes('Concept')) {
      // Handle merged concepts - they should still appear but with merged status
      if (node.properties.status === 'merged') {
        // This is a merged concept, mark it as such but don't skip it
        nodeType = 'Concept';
        // Add merged status to metadata for visual distinction
        node.properties.isMerged = true;
        node.properties.mergedIntoConceptId = node.properties.merged_into_concept_id;
      } else {
        nodeType = 'Concept';
      }
    } else if (node.labels.includes('MemoryUnit')) {
      nodeType = 'MemoryUnit';
    } else if (node.labels.includes('DerivedArtifact')) {
      nodeType = 'DerivedArtifact';
    } else if (node.labels.includes('Community')) {
      nodeType = 'Community';
    } else {
      console.error(`[GraphProjectionWorker] ❌ Unsupported node type: ${node.labels.join(', ')} for node ${node.id}`);
      throw new Error(`Unsupported node type: ${node.labels.join(', ')}`);
    }
    
    // Extract actual UUID from properties instead of Neo4j internal ID
    const entityId = node.properties.prompt_id || node.properties.muid || node.properties.id || 
                    node.properties.community_id || node.properties.artifact_id ||
                    node.properties.event_id || node.properties.userId;
    
    if (!entityId || !this.isValidUuid(entityId)) {
      console.error(`[GraphProjectionWorker] ❌ Invalid or missing UUID for node ${node.id}: ${entityId}`);
      throw new Error(`Invalid UUID for node ${node.id}: ${entityId}`);
    }
    
    // Extract connections from edges
    const connections = graphStructure.edges
      .filter(edge => edge.source === node.id)
      .map(edge => edge.target);
    
    return {
      id: entityId, // Use actual UUID, not Neo4j internal ID
      type: nodeType,
      title: node.properties.title || node.properties.name || 'Untitled',
      content: node.properties.content || node.properties.description || '',
      importance: node.properties.importance_score || node.properties.salience || 0.5,
      createdAt: node.properties.created_at || node.properties.creation_ts || new Date().toISOString(),
      connections
    };
  }).filter(Boolean); // Remove any null nodes (should be none now)
  
  // Process edges to match the expected format
  const processedEdges = graphStructure.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    properties: edge.properties
  }));
  
  console.log(`[GraphProjectionWorker] ✅ Fetched ${processedNodes.length} nodes and ${processedEdges.length} edges from Neo4j for user ${userId}`);
  return { nodes: processedNodes, edges: processedEdges };
}
```

#### **4.3 Visual Distinction for Merged Concepts**

**Objective**: Provide clear visual indication of merged concepts in the 3D graph

```typescript
// In the node processing, add merged status to metadata
return {
  id: entityId,
  type: nodeType,
  title: node.properties.title || node.properties.name || 'Untitled',
  content: node.properties.content || node.properties.description || '',
  importance: node.properties.importance_score || node.properties.salience || 0.5,
  createdAt: node.properties.created_at || node.properties.creation_ts || new Date().toISOString(),
  connections,
  metadata: {
    // Add merged concept information
    isMerged: node.properties.isMerged || false,
    mergedIntoConceptId: node.properties.mergedIntoConceptId || null,
    status: node.properties.status || 'active'
  }
};
```

**Frontend Implementation**: The 3D graph should render merged concepts with:
- **Different color**: e.g., muted/transparent appearance
- **Visual indicator**: Small icon or badge showing merged status
- **Connection line**: Clear line to the primary concept they're merged into

#### **4.4 Enhanced Error Logging**

```typescript
private async fetchEmbeddingsFromWeaviate(nodes: any[]): Promise<number[][]> {
  if (!this.databaseService.weaviate) {
    console.warn(`[GraphProjectionWorker] Weaviate client not available, using fallback vectors`);
    return this.generateFallbackVectors(nodes.length);
  }

  try {
    const vectors: number[][] = [];
    
    for (const node of nodes) {
      try {
        // Validate if node.id is a valid UUID before querying Weaviate
        if (!this.isValidUuid(node.id)) {
          console.error(`[GraphProjectionWorker] ❌ Node ID "${node.id}" is not a valid UUID, cannot query Weaviate`);
          throw new Error(`Invalid UUID: ${node.id}`);
        }

        // Use unified UserKnowledgeItem class with sourceEntityType filter
        const result = await this.databaseService.weaviate
          .graphql
          .get()
          .withClassName('UserKnowledgeItem')
          .withFields('externalId sourceEntityType sourceEntityId _additional { vector }')
          .withWhere({
            operator: 'And',
            operands: [
              {
                path: ['sourceEntityType'],
                operator: 'Equal',
                valueString: node.type
              },
              {
                path: ['sourceEntityId'],
                operator: 'Equal',
                valueString: node.id
              }
            ]
          })
          .withLimit(1)
          .do();

        if (result.data?.Get?.UserKnowledgeItem?.[0]?._additional?.vector) {
          const embedding = result.data.Get.UserKnowledgeItem[0]._additional.vector;
          vectors.push(embedding);
          console.log(`[GraphProjectionWorker] ✅ Retrieved embedding for ${node.type} ${node.id}`);
        } else {
          console.error(`[GraphProjectionWorker] ❌ No embedding found for ${node.type} ${node.id}`);
          console.error(`[GraphProjectionWorker] ❌ Weaviate query returned:`, JSON.stringify(result.data, null, 2));
          throw new Error(`Missing embedding for ${node.type} ${node.id}`);
        }
      } catch (nodeError: any) {
        console.error(`[GraphProjectionWorker] ❌ Failed to retrieve embedding for ${node.type} ${node.id}:`, nodeError?.message || 'Unknown error');
        throw nodeError; // Fail fast instead of using fallback
      }
    }
    
    console.log(`[GraphProjectionWorker] ✅ Retrieved ${vectors.length} embeddings from Weaviate`);
    return vectors;
    
  } catch (error) {
    console.error(`[GraphProjectionWorker] ❌ Weaviate query failed:`, error);
    throw error; // Fail fast instead of using fallback
  }
}
```

---

### **Phase 5: Frontend Integration (MEDIUM PRIORITY)**

#### **5.1 Update NodeMesh Component**

**File:** `apps/web-app/src/components/cosmos/NodeMesh.tsx`

```typescript
// Add ProactivePrompt color coding
const getNodeColor = () => {
  let baseColor;
  
  // Get entity type from node properties
  const entityType = node.entityType || node.type || node.category || 'unknown';
  
  // Color coding by entity type
  switch (entityType) {
    case 'MemoryUnit':
      baseColor = '#4488ff'; // Blue for memory units
      break;
    case 'Concept':
      baseColor = '#44ff44'; // Green for concepts
      break;
    case 'Community':
      baseColor = '#ff8844'; // Orange for communities
      break;
    case 'DerivedArtifact':
    case 'Artifact':
      baseColor = '#ff4488'; // Pink for derived artifacts
      break;
    case 'ProactivePrompt':
      baseColor = '#ffaa00'; // Orange-Yellow for proactive prompts
      break;
    case 'GrowthEvent':
      baseColor = '#8844ff'; // Purple for growth events
      break;
    case 'User':
      baseColor = '#44ffff'; // Cyan for users
      break;
    default:
      baseColor = '#888888'; // Gray for unknown types
      break;
  }
  
  // Rest of the method remains the same...
};
```

#### **5.2 Update Card Gallery**

**File:** `apps/web-app/src/components/cards/CardGallery.tsx`

```typescript
const getCardType = (entityType: string) => {
  switch (entityType) {
    case 'MemoryUnit':
      return 'memory';
    case 'Concept':
      return 'concept';
    case 'Community':
      return 'community';
    case 'DerivedArtifact':
      return 'artifact';
    case 'ProactivePrompt':
      return 'prompt';
    case 'GrowthEvent':
      return 'growth_event';
    case 'User':
      return 'user';
    default:
      return 'unknown';
  }
};

const getCardTitle = (entity: any) => {
  switch (entity.type) {
    case 'MemoryUnit':
      return entity.title || 'Untitled Memory';
    case 'Concept':
      return entity.name || 'Untitled Concept';
    case 'Community':
      return entity.name || 'Untitled Community';
    case 'DerivedArtifact':
      return entity.title || 'Untitled Artifact';
    case 'ProactivePrompt':
      return entity.title || 'Proactive Prompt';
    case 'GrowthEvent':
      return `${entity.dimension_key} Growth Event` || 'Growth Event';
    case 'User':
      return entity.username || entity.email || 'User Profile';
    default:
      return 'Untitled';
  }
};
```

---

### **Phase 6: Data Cleanup and Migration (MEDIUM PRIORITY)**

#### **6.1 Clean Up Existing Merged Concepts**

**PostgreSQL Cleanup:**
```sql
-- Archive merged concepts
UPDATE concepts 
SET status = 'archived' 
WHERE status = 'merged';

-- Verify no active merged concepts remain
SELECT COUNT(*) FROM concepts WHERE status = 'merged';
-- Should return 0
```

**Neo4j Cleanup:**
```cypher
// Remove merged concept nodes from graph projection
MATCH (c:Concept {status: 'merged'})
DETACH DELETE c;

// Verify no merged concepts remain
MATCH (c:Concept {status: 'merged'})
RETURN COUNT(c);
// Should return 0
```

**Weaviate Cleanup:**
```typescript
// Remove embeddings for merged concepts
const mergedConcepts = await dbService.prisma.concepts.findMany({
  where: { status: 'merged' }
});

for (const concept of mergedConcepts) {
  try {
    await weaviateService.deleteObject('UserKnowledgeItem', concept.concept_id);
    console.log(`✅ Removed embedding for merged concept: ${concept.concept_id}`);
  } catch (error) {
    console.warn(`⚠️ Could not remove embedding for ${concept.concept_id}:`, error);
  }
}
```

#### **6.2 Verify All Entity Types Have Embeddings**

```typescript
// Check embedding coverage for all entity types
const entityTypes = ['MemoryUnit', 'Concept', 'DerivedArtifact', 'Community', 'ProactivePrompt', 'GrowthEvent', 'User'];

for (const entityType of entityTypes) {
  const count = await weaviateService.countObjects('UserKnowledgeItem', {
    sourceEntityType: entityType
  });
  
  console.log(`${entityType}: ${count} embeddings found`);
}
```

---

## **Testing and Verification**

### **Test Cases**

1. **Entity Creation Test**
   - Create entities of each type
   - Verify embeddings are created in Weaviate
   - Verify nodes appear in Neo4j
   - Verify records exist in PostgreSQL

2. **Graph Projection Test**
   - Generate graph projection for user with all entity types
   - Verify all entity types appear in 3D visualization
   - Verify no "unknown node type" errors
   - Verify proper color coding for each entity type

3. **Concept Merging Test**
   - Create multiple similar concepts
   - Trigger concept merging
   - Verify primary concept gets consolidated properties
   - Verify secondary concepts are archived
   - Verify new embedding represents consolidated knowledge

4. **Card Gallery Test**
   - Verify all entity types appear in card gallery
   - Verify proper card types and titles
   - Verify proper navigation and interaction

5. **GrowthEvent Integration Test**
   - Verify growth events appear in Neo4j graph
   - Verify growth event embeddings are created
   - Verify growth events are visible in 3D visualization
   - Verify proper color coding (purple) for growth events

6. **User Entity Integration Test**
   - Verify user nodes appear in Neo4j graph
   - Verify user profile embeddings are created
   - Verify users are visible in 3D visualization
   - Verify proper color coding (cyan) for users
   - Verify user relationships with other entities

### **Verification Commands**

```bash
# Check Neo4j constraints
cypher-shell -u neo4j -p password "SHOW CONSTRAINTS;"

# Check Weaviate schema
curl -X GET "http://localhost:8080/v1/schema"

# Check PostgreSQL entity counts
psql -d your_database -c "SELECT entity_type, COUNT(*) FROM entities GROUP BY entity_type;"

# Check GrowthEvent count in PostgreSQL
psql -d your_database -c "SELECT COUNT(*) as growth_event_count FROM growth_events;"

# Check User count in PostgreSQL  
psql -d your_database -c "SELECT COUNT(*) as user_count FROM users;"

# Check GrowthEvent nodes in Neo4j
cypher-shell -u neo4j -p password "MATCH (g:GrowthEvent) RETURN COUNT(g) as growth_event_count;"

# Check User nodes in Neo4j
cypher-shell -u neo4j -p password "MATCH (u:User) RETURN COUNT(u) as user_count;"

# Test graph projection
curl -X POST "http://localhost:3000/api/v1/graph/project" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'
```

---

## **Rollback Plan**

### **If Issues Arise**

1. **Database Rollback**
   ```sql
   -- Restore original concept statuses
   UPDATE concepts SET status = 'active' WHERE status = 'archived';
   ```

2. **Code Rollback**
   ```bash
   git revert HEAD~1  # Revert last commit
   git revert HEAD~1  # Revert second-to-last commit
   ```

3. **Neo4j Rollback**
   ```cypher
   // Restore original concept nodes
   MATCH (c:Concept {status: 'archived'})
   SET c.status = 'active'
   ```

---

## **Success Criteria**

### **Phase 1: Schema Alignment**
- [ ] All entity types have proper Neo4j constraints and indexes
- [ ] No schema errors in Neo4j startup logs

### **Phase 2: Embedding Pipeline**
- [ ] All entity types get embeddings created in Weaviate
- [ ] No "missing embedding" errors in logs
- [ ] Embedding creation jobs complete successfully

### **Phase 3: Concept Consolidation**
- [ ] No `MergedConcept` entities created in Neo4j
- [ ] Secondary concepts are properly marked as merged in both databases
- [ ] Primary concepts have metadata reflecting merged concepts
- [ ] All relationships are properly redirected to primary concepts
- [ ] Merged concepts maintain their original data but with merged status

### **Phase 4: Graph Projection**
- [ ] All entity types appear in 3D visualization
- [ ] No "unknown node type" errors
- [ ] Proper UUID handling (no Neo4j internal IDs)
- [ ] All nodes have proper embeddings
- [ ] Merged concepts are visually distinguished from active concepts
- [ ] Clear visual indication of concept merging relationships
- [ ] GrowthEvent nodes appear with proper purple color coding
- [ ] User nodes appear with proper cyan color coding
- [ ] GrowthEvent and User nodes have proper metadata and connections

### **Phase 5: Frontend Integration**
- [ ] All entity types appear in card gallery
- [ ] Proper color coding in 3D visualization
- [ ] Consistent user experience across all entity types

### **Phase 6: Data Cleanup**
- [ ] No orphaned merged concepts
- [ ] Clean database state
- [ ] All embeddings properly indexed

---

## **Timeline Estimate**

- **Phase 1-2**: 2-3 days (critical infrastructure)
- **Phase 3**: 2-3 days (concept consolidation logic)
- **Phase 4**: 1-2 days (graph projection updates)
- **Phase 5**: 1-2 days (frontend integration)
- **Phase 6**: 1 day (cleanup and verification)

**Total Estimated Time**: 7-11 days

---

## **Dependencies**

1. **Neo4j Database**: Must be running and accessible
2. **Weaviate Database**: Must be running and accessible
3. **PostgreSQL Database**: Must be running and accessible
4. **Redis**: Must be running for job queues
5. **All Workers**: Must be running for testing

---

## **Notes for Implementation Agent**

1. **Start with Phase 1**: Database schema changes are foundational
2. **Test incrementally**: Verify each phase before proceeding
3. **Monitor logs**: Watch for errors during implementation
4. **Backup data**: Ensure data safety before major changes
5. **Coordinate deployments**: Some changes may require service restarts

This plan provides a comprehensive roadmap for achieving full entity type unification across the entire system. Each phase builds upon the previous one, ensuring a systematic and reliable implementation.
