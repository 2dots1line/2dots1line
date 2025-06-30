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
    hops: number = 2, 
    limit: number = 20
  ): CypherQuery {
    return this.buildQuery('neighborhood', {
      seedEntities,
      userId,
      hops,
      limit
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
      limit
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
      limit
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
} 