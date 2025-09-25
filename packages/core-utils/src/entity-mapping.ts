/**
 * Centralized Entity Type Mapping Utility
 * 
 * This utility provides standardized mappings between different entity type representations
 * used throughout the 2D1L codebase. With the V11.0 field standardization, all entities
 * now use consistent field names, enabling generic operations.
 */

export interface EntityTypeMapping {
  /** Database table name */
  tableName: string;
  /** Standardized entity type name */
  entityType: string;
  /** Display name for UI */
  displayType: string;
  /** Default importance score */
  defaultImportance: number;
  /** Whether this entity type supports cards */
  supportsCards: boolean;
}

/**
 * Centralized mapping of all entity types to their standardized representations
 * This replaces repetitive mapping logic throughout the codebase
 */
export const ENTITY_TYPE_MAPPINGS: Record<string, EntityTypeMapping> = {
  // Concepts
  'concept': {
    tableName: 'concepts',
    entityType: 'concept',
    displayType: 'Concept',
    defaultImportance: 0.5,
    supportsCards: true
  },
  
  // Memory Units
  'memoryunit': {
    tableName: 'memory_units',
    entityType: 'memoryunit',
    displayType: 'MemoryUnit',
    defaultImportance: 0.5,
    supportsCards: true
  },
  'memory_unit': {
    tableName: 'memory_units',
    entityType: 'memoryunit',
    displayType: 'MemoryUnit',
    defaultImportance: 0.5,
    supportsCards: true
  },
  
  // Derived Artifacts
  'derivedartifact': {
    tableName: 'derived_artifacts',
    entityType: 'derivedartifact',
    displayType: 'DerivedArtifact',
    defaultImportance: 0.7,
    supportsCards: true
  },
  'derived_artifact': {
    tableName: 'derived_artifacts',
    entityType: 'derivedartifact',
    displayType: 'DerivedArtifact',
    defaultImportance: 0.7,
    supportsCards: true
  },
  
  // Communities
  'community': {
    tableName: 'communities',
    entityType: 'community',
    displayType: 'Community',
    defaultImportance: 0.8,
    supportsCards: true
  },
  
  // Proactive Prompts
  'proactiveprompt': {
    tableName: 'proactive_prompts',
    entityType: 'proactiveprompt',
    displayType: 'ProactivePrompt',
    defaultImportance: 0.6,
    supportsCards: true
  },
  'proactive_prompt': {
    tableName: 'proactive_prompts',
    entityType: 'proactiveprompt',
    displayType: 'ProactivePrompt',
    defaultImportance: 0.6,
    supportsCards: true
  },
  
  // Growth Events
  'growthevent': {
    tableName: 'growth_events',
    entityType: 'growthevent',
    displayType: 'GrowthEvent',
    defaultImportance: 0.4,
    supportsCards: true
  },
  'growth_event': {
    tableName: 'growth_events',
    entityType: 'growthevent',
    displayType: 'GrowthEvent',
    defaultImportance: 0.4,
    supportsCards: true
  },
  
  // Users
  'user': {
    tableName: 'users',
    entityType: 'user',
    displayType: 'User',
    defaultImportance: 0.3,
    supportsCards: true
  },
  
  // Merged Concepts (special case)
  'mergedconcept': {
    tableName: 'concepts',
    entityType: 'mergedconcept',
    displayType: 'MergedConcept',
    defaultImportance: 0.5,
    supportsCards: true
  },
  'merged_concept': {
    tableName: 'concepts',
    entityType: 'mergedconcept',
    displayType: 'MergedConcept',
    defaultImportance: 0.5,
    supportsCards: true
  }
};

/**
 * Get entity type mapping by normalized type name
 * @param entityType - The entity type to look up (case-insensitive)
 * @returns EntityTypeMapping or null if not found
 */
export function getEntityTypeMapping(entityType: string): EntityTypeMapping | null {
  const normalizedType = entityType.toLowerCase();
  return ENTITY_TYPE_MAPPINGS[normalizedType] || null;
}

/**
 * Get all supported entity types
 * @returns Array of all supported entity type names
 */
export function getSupportedEntityTypes(): string[] {
  return Object.keys(ENTITY_TYPE_MAPPINGS);
}

/**
 * Get all entity types that support cards
 * @returns Array of entity types that can have cards created for them
 */
export function getCardSupportedEntityTypes(): string[] {
  return Object.entries(ENTITY_TYPE_MAPPINGS)
    .filter(([_, mapping]) => mapping.supportsCards)
    .map(([type, _]) => type);
}

/**
 * Check if an entity type supports cards
 * @param entityType - The entity type to check
 * @returns True if the entity type supports cards
 */
export function supportsCards(entityType: string): boolean {
  const mapping = getEntityTypeMapping(entityType);
  return mapping?.supportsCards || false;
}

/**
 * Get the database table name for an entity type
 * @param entityType - The entity type
 * @returns Database table name or null if not found
 */
export function getTableName(entityType: string): string | null {
  const mapping = getEntityTypeMapping(entityType);
  return mapping?.tableName || null;
}

/**
 * Get the display type name for an entity type
 * @param entityType - The entity type
 * @returns Display type name or null if not found
 */
export function getDisplayType(entityType: string): string | null {
  const mapping = getEntityTypeMapping(entityType);
  return mapping?.displayType || null;
}

/**
 * Get the default importance score for an entity type
 * @param entityType - The entity type
 * @returns Default importance score or 0.5 if not found
 */
export function getDefaultImportance(entityType: string): number {
  const mapping = getEntityTypeMapping(entityType);
  return mapping?.defaultImportance || 0.5;
}
