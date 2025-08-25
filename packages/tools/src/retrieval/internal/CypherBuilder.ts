/**
 * CypherBuilder.ts
 * V9.5 Safe Cypher query construction from pre-approved templates
 * Validates parameters and builds parameterized queries for Neo4j execution
 */

import { CypherQuery, CypherTemplate } from '../types';
import { ParamGuard } from './ParamGuard';

export class CypherBuilder {
  private templates: Record<string, CypherTemplate>;
  private paramGuard: ParamGuard;

  constructor(cypherTemplates: Record<string, any>) {
    this.templates = cypherTemplates?.templates || {};
    this.paramGuard = new ParamGuard();
  }

  /**
   * Build a safe, parameterized Cypher query from template
   */
  public buildQuery(queryKey: string, runtimeParams: Record<string, any>): CypherQuery {
    const templateConfig = this.templates[queryKey];
    if (!templateConfig) {
      throw new Error(`CypherBuilder: No template found for key '${queryKey}'`);
    }

    // Merge default parameters with runtime parameters
    const finalParams = { ...templateConfig.defaultParams, ...runtimeParams };
    
    // Ensure LIMIT parameters are always integers
    if (finalParams.limit !== undefined) {
      finalParams.limit = Math.floor(Number(finalParams.limit));
      if (isNaN(finalParams.limit) || finalParams.limit < 0) {
        throw new Error(`CypherBuilder: Invalid limit value: ${finalParams.limit}`);
      }
    }
    
    // Validate parameters using ParamGuard
    this.paramGuard.validateCypherParams(queryKey, finalParams, templateConfig.allowedParams);

    return { 
      cypher: templateConfig.cypher, 
      params: finalParams 
    };
  }

  /**
   * Build neighborhood traversal query
   */
  public buildNeighborhoodQuery(
    seedEntities: Array<{id: string, type: string}>, 
    userId: string, 
    limit: number = 20
  ): CypherQuery {
    return this.buildQuery('neighborhood', {
      seedEntities,
      userId,
      limit: Math.floor(limit) // Ensure limit is an integer
    });
  }

  /**
   * Build timeline-based traversal query
   */
  public buildTimelineQuery(
    seedEntities: Array<{id: string, type: string}>, 
    userId: string, 
    limit: number = 15
  ): CypherQuery {
    return this.buildQuery('timeline', {
      seedEntities,
      userId,
      limit: Math.floor(limit) // Ensure limit is an integer
    });
  }

  /**
   * Build conceptual relationship query
   */
  public buildConceptualQuery(
    seedEntities: Array<{id: string, type: string}>, 
    userId: string, 
    limit: number = 15
  ): CypherQuery {
    return this.buildQuery('conceptual', {
      seedEntities,
      userId,
      limit: Math.floor(limit) // Ensure limit is an integer
    });
  }

  /**
   * Get available query templates
   */
  public getAvailableTemplates(): string[] {
    return Object.keys(this.templates);
  }

  /**
   * Get template configuration for a specific query
   */
  public getTemplate(queryKey: string): CypherTemplate | null {
    return this.templates[queryKey] || null;
  }

  /**
   * Validate that a template exists and has required fields
   */
  public validateTemplate(queryKey: string): boolean {
    const template = this.templates[queryKey];
    return !!(template && 
              template.cypher && 
              template.allowedParams && 
              template.defaultParams);
  }

  /**
   * Get detailed template information for debugging
   */
  public getTemplateDebugInfo(queryKey: string): {
    exists: boolean;
    hasCypher: boolean;
    hasAllowedParams: boolean;
    hasDefaultParams: boolean;
    templateKeys: string[];
  } {
    const template = this.templates[queryKey];
    return {
      exists: !!template,
      hasCypher: !!(template && template.cypher),
      hasAllowedParams: !!(template && template.allowedParams),
      hasDefaultParams: !!(template && template.defaultParams),
      templateKeys: Object.keys(this.templates)
    };
  }
} 