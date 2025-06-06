// packages/database/src/neo4j/schema.cypher
// V7 Schema for Neo4j - CORRECTED SYNTAX FOR NEO4J 5.x

// --- Constraints (Ensure Uniqueness) ---

// User Node
CREATE CONSTRAINT user_userId_unique IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE;

// MemoryUnit Node
CREATE CONSTRAINT memoryUnit_muid_unique IF NOT EXISTS FOR (mu:MemoryUnit) REQUIRE mu.muid IS UNIQUE;

// Concept Node
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE;

// DerivedArtifact Node
CREATE CONSTRAINT derivedArtifact_id_unique IF NOT EXISTS FOR (da:DerivedArtifact) REQUIRE da.id IS UNIQUE;

// Media Node (Uncomment and adjust if you model Media as nodes in Neo4j)
// CREATE CONSTRAINT media_id_unique IF NOT EXISTS FOR (md:Media) REQUIRE md.id IS UNIQUE;

// Annotation Node (Uncomment and adjust if you model Annotations as nodes)
// CREATE CONSTRAINT annotation_aid_unique IF NOT EXISTS FOR (an:Annotation) REQUIRE an.aid IS UNIQUE;

// Community Node
CREATE CONSTRAINT community_communityId_unique IF NOT EXISTS FOR (com:Community) REQUIRE com.community_id IS UNIQUE;

// Tag Node (Uncomment and adjust if you have a dedicated Tag node)
// CREATE CONSTRAINT tag_id_unique IF NOT EXISTS FOR (t:Tag) REQUIRE t.id IS UNIQUE;
// CREATE CONSTRAINT tag_name_unique IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE;


// --- Indexes (For Query Performance) ---
// Index creation syntax remains largely the same or is often automatically created with uniqueness constraints for the exact property.
// However, explicit indexes can still be useful for non-unique properties or for existence constraints.

// User Node
CREATE INDEX user_userId_idx IF NOT EXISTS FOR (u:User) ON (u.userId); // Often redundant if unique constraint exists, but harmless

// MemoryUnit Node
CREATE INDEX memoryUnit_muid_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.muid); // Redundant with constraint
CREATE INDEX memoryUnit_userId_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.userId);
CREATE INDEX memoryUnit_creationTs_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.creation_ts);
CREATE INDEX memoryUnit_sourceType_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.source_type);

// Concept Node
CREATE INDEX concept_id_idx IF NOT EXISTS FOR (c:Concept) ON (c.id); // Redundant with constraint
CREATE INDEX concept_userId_idx IF NOT EXISTS FOR (c:Concept) ON (c.userId);
CREATE INDEX concept_name_idx IF NOT EXISTS FOR (c:Concept) ON (c.name);
CREATE INDEX concept_type_idx IF NOT EXISTS FOR (c:Concept) ON (c.type);
CREATE INDEX concept_communityId_idx IF NOT EXISTS FOR (c:Concept) ON (c.community_id);

// DerivedArtifact Node
CREATE INDEX derivedArtifact_id_idx IF NOT EXISTS FOR (da:DerivedArtifact) ON (da.id); // Redundant with constraint
CREATE INDEX derivedArtifact_userId_idx IF NOT EXISTS FOR (da:DerivedArtifact) ON (da.userId);
CREATE INDEX derivedArtifact_type_idx IF NOT EXISTS FOR (da:DerivedArtifact) ON (da.artifact_type);

// Community Node
CREATE INDEX community_communityId_idx IF NOT EXISTS FOR (com:Community) ON (com.community_id); // Redundant with constraint
CREATE INDEX community_userId_idx IF NOT EXISTS FOR (com:Community) ON (com.userId);
CREATE INDEX community_name_idx IF NOT EXISTS FOR (com:Community) ON (com.name);

// Example for a relationship property index (syntax varies slightly based on Neo4j version for relationship indexes)
// For Neo4j 5.x, relationship property indexes are usually created like this:
// CREATE INDEX rel_highlights_weight_idx IF NOT EXISTS FOR ()-[r:HIGHLIGHTS]-() ON (r.weight);
// Note: Full-text schema indexes are different and more powerful for text searching on properties.