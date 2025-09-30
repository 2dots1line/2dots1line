/**
 * RelationshipUtils for 2dots1line V11.0
 * Centralized utility for generating standardized relationship properties
 */

import { RelationshipProps } from '@2dots1line/shared-types';

export class RelationshipUtils {
  /**
   * Generate a unique relationship ID
   * Format: rel-{timestamp}-{worker}-{random}
   */
  static generateRelationshipId(workerName: string): string {
    const timestamp = Date.now();
    // Use crypto.randomUUID() for better uniqueness, fallback to enhanced random
    const random = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().replace(/-/g, '').substring(0, 8)
      : Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
    return `rel-${timestamp}-${workerName}-${random}`;
  }
  
  /**
   * Create standardized relationship properties
   * All workers must use this to ensure consistency
   */
  static createRelationshipProps(
    relationshipType: string,
    workerName: string,
    userId: string,
    options: {
      strength?: number;
      description?: string;
    } = {}
  ): RelationshipProps {
    // Context-aware default strength based on relationship type and worker
    const getDefaultStrength = (): number => {
      // If strength is explicitly provided, use it
      if (options.strength !== undefined) {
        return options.strength;
      }
      
      // Context-aware defaults based on relationship type and worker
      switch (relationshipType) {
        case 'MEMBER_OF':
          return 0.8; // Community membership is typically strong
        case 'STRATEGIC_RELATIONSHIP':
          return 0.7; // Strategic relationships are important
        case 'RELATED_TO':
        case 'IS_SIMILAR_TO':
        case 'IS_ANALOGOUS_TO':
          return 0.6; // Similarity relationships are moderately strong
        case 'CAUSES':
        case 'INFLUENCES':
        case 'ENABLES':
          return 0.7; // Causal relationships are important
        case 'IS_PART_OF':
        case 'IS_A_TYPE_OF':
          return 0.8; // Hierarchical relationships are strong
        default:
          return 0.5; // Generic default for unknown types
      }
    };

    return {
      relationship_id: this.generateRelationshipId(workerName),
      relationship_type: relationshipType,
      created_at: new Date().toISOString(),
      user_id: userId,
      source_agent: workerName,
      strength: getDefaultStrength(),
      description: options.description ?? `Relationship of type ${relationshipType}` // More meaningful default
    };
  }
}
