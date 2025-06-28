// V9.7 Definitive Schema for Neo4j 5.x

// --- CONSTRAINTS (Ensure Uniqueness & Create Backing Indexes) ---
CREATE CONSTRAINT user_userId_unique IF NOT EXISTS FOR (n:User) REQUIRE n.userId IS UNIQUE;
CREATE CONSTRAINT memoryunit_muid_unique IF NOT EXISTS FOR (n:MemoryUnit) REQUIRE n.muid IS UNIQUE;
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (n:Concept) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT derivedartifact_id_unique IF NOT EXISTS FOR (n:DerivedArtifact) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT community_community_id_unique IF NOT EXISTS FOR (n:Community) REQUIRE n.community_id IS UNIQUE;

// --- INDEXES (For Query Performance) ---
CREATE INDEX memoryunit_userId_idx IF NOT EXISTS FOR (n:MemoryUnit) ON (n.userId);
CREATE INDEX concept_userId_idx IF NOT EXISTS FOR (n:Concept) ON (n.userId);
CREATE INDEX derivedartifact_userId_idx IF NOT EXISTS FOR (n:DerivedArtifact) ON (n.userId);
CREATE INDEX community_userId_idx IF NOT EXISTS FOR (n:Community) ON (n.userId);

CREATE INDEX memoryunit_creation_ts_idx IF NOT EXISTS FOR (n:MemoryUnit) ON (n.creation_ts);
CREATE INDEX concept_name_idx IF NOT EXISTS FOR (n:Concept) ON (n.name);
CREATE INDEX concept_type_idx IF NOT EXISTS FOR (n:Concept) ON (n.type);
CREATE INDEX concept_status_idx IF NOT EXISTS FOR (n:Concept) ON (n.status); 