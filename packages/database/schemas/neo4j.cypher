// V11.0 Definitive Schema for Neo4j 5.x - Field Naming Standardization

// --- CONSTRAINTS (Ensure Uniqueness & Create Backing Indexes) ---
// V11.0: Unified constraint across all entity types since schema is now consistent
CREATE CONSTRAINT user_userId_unique IF NOT EXISTS FOR (n:User) REQUIRE n.userId IS UNIQUE;
CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (n) REQUIRE n.entity_id IS UNIQUE;

// --- INDEXES (For Query Performance) ---
// V11.0: Unified indexes to work across all entity types since schema is now consistent
CREATE INDEX user_id_idx IF NOT EXISTS FOR (n) ON (n.user_id);
CREATE INDEX entity_type_idx IF NOT EXISTS FOR (n) ON (n.entity_type);
CREATE INDEX type_idx IF NOT EXISTS FOR (n) ON (n.type);
CREATE INDEX status_idx IF NOT EXISTS FOR (n) ON (n.status);
CREATE INDEX created_at_idx IF NOT EXISTS FOR (n) ON (n.created_at);

// --- STANDARDIZED NODE PROPERTIES ---
// All entity types will have these consistent properties:
// entity_id: String     // Primary identifier (same as PostgreSQL)
// user_id: String       // User reference
// entity_type: String   // Which entity table (concept, memory_unit, etc.)
// title: String         // Display name
// content: String       // Main content
// type: String          // Sub-type within entity
// status: String        // Lifecycle state
// created_at: DateTime  // Creation timestamp
// updated_at: DateTime  // Update timestamp (where applicable)
// V11.0 Cosmos: 3D coordinates for spatial positioning
// position_x: Float     // X coordinate in 3D space
// position_y: Float     // Y coordinate in 3D space
// position_z: Float     // Z coordinate in 3D space

// --- STANDARDIZED RELATIONSHIP PROPERTIES ---
// V11.0: All relationships will have these consistent properties:
// relationship_id: String        // Unique identifier for the relationship
// relationship_type: String      // Type of relationship (RELATED_TO, MEMBER_OF, etc.)
// created_at: String            // ISO timestamp when relationship was created
// user_id: String               // User reference for multi-tenancy
// source_agent: String          // Which worker/service created this relationship
// strength: Float               // Relationship strength (0.0-1.0, optional)
// description: String           // Human-readable description (optional)

// --- RELATIONSHIP CONSTRAINTS ---
// Ensure relationship_id uniqueness across all relationships
CREATE CONSTRAINT relationship_id_unique IF NOT EXISTS FOR ()-[r]-() REQUIRE r.relationship_id IS UNIQUE;

// --- RELATIONSHIP INDEXES ---
// Indexes for common relationship queries
CREATE INDEX relationship_type_idx IF NOT EXISTS FOR ()-[r]-() ON (r.relationship_type);
CREATE INDEX relationship_user_id_idx IF NOT EXISTS FOR ()-[r]-() ON (r.user_id);
CREATE INDEX relationship_source_agent_idx IF NOT EXISTS FOR ()-[r]-() ON (r.source_agent);
CREATE INDEX relationship_created_at_idx IF NOT EXISTS FOR ()-[r]-() ON (r.created_at); 