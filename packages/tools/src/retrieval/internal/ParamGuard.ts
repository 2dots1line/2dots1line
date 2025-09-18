/**
 * ParamGuard.ts
 * V9.5 Runtime parameter validation and constraint enforcement
 * Validates and sanitizes parameters for safe Cypher query execution
 */

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export class ParamGuard {
  // V9.5 Configuration limits
  private static readonly MAX_RESULT_LIMIT = 100;
  private static readonly MAX_GRAPH_HOPS = 3;
  private static readonly MAX_SEED_ENTITIES = 300;
  private static readonly USER_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

  private rules: ValidationRule[];

  constructor(rules?: ValidationRule[]) {
    this.rules = rules || [];
  }

  /**
   * Validate Cypher query parameters against security constraints
   */
  public validateCypherParams(
    queryKey: string, 
    params: Record<string, any>, 
    allowedParams: string[]
  ): void {
    // Check that only allowed parameters are present
    for (const paramKey of Object.keys(params)) {
      if (!allowedParams.includes(paramKey)) {
        throw new Error(`ParamGuard: Parameter '${paramKey}' not allowed for query '${queryKey}'`);
      }
    }

    // Apply V9.5 security constraints
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || params.limit > ParamGuard.MAX_RESULT_LIMIT) {
        throw new Error(`ParamGuard: limit must be a number <= ${ParamGuard.MAX_RESULT_LIMIT}`);
      }
    }

    if (params.hops !== undefined) {
      if (typeof params.hops !== 'number' || params.hops > ParamGuard.MAX_GRAPH_HOPS) {
        throw new Error(`ParamGuard: hops must be a number <= ${ParamGuard.MAX_GRAPH_HOPS}`);
      }
    }

    if (params.seedEntities !== undefined) {
      if (!Array.isArray(params.seedEntities) || params.seedEntities.length > ParamGuard.MAX_SEED_ENTITIES) {
        throw new Error(`ParamGuard: seedEntities must be an array with <= ${ParamGuard.MAX_SEED_ENTITIES} items`);
      }
      
      // Validate each seed entity
      for (const entity of params.seedEntities) {
        if (!entity.id || typeof entity.id !== 'string') {
          throw new Error('ParamGuard: Each seed entity must have a valid id');
        }
        if (!entity.type || typeof entity.type !== 'string') {
          throw new Error('ParamGuard: Each seed entity must have a valid type');
        }
      }
    }

    if (params.userId !== undefined) {
      if (!ParamGuard.validateUserId(params.userId)) {
        throw new Error('ParamGuard: Invalid userId format');
      }
    }
  }

  /**
   * Validate general parameters against rules
   */
  public validate(params: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    const sanitizedParams: Record<string, any> = {};

    for (const rule of this.rules) {
      const value = params[rule.field];
      
      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Field '${rule.field}' is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        try {
          sanitizedParams[rule.field] = this.sanitize(value, rule);
        } catch (error) {
          errors.push(`Field '${rule.field}': ${error instanceof Error ? error.message : 'Validation error'}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? sanitizedParams : undefined
    };
  }

  /**
   * Sanitize a single value according to validation rule
   */
  public sanitize(value: any, rule: ValidationRule): any {
    // Type validation
    if (rule.type === 'string' && typeof value !== 'string') {
      throw new Error(`Expected string, got ${typeof value}`);
    }
    if (rule.type === 'number' && typeof value !== 'number') {
      throw new Error(`Expected number, got ${typeof value}`);
    }
    if (rule.type === 'boolean' && typeof value !== 'boolean') {
      throw new Error(`Expected boolean, got ${typeof value}`);
    }
    if (rule.type === 'array' && !Array.isArray(value)) {
      throw new Error(`Expected array, got ${typeof value}`);
    }

    // String-specific validations
    if (rule.type === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        throw new Error(`String too short (min: ${rule.minLength})`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        throw new Error(`String too long (max: ${rule.maxLength})`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        throw new Error('String does not match required pattern');
      }
    }

    // Number-specific validations
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        throw new Error(`Number too small (min: ${rule.min})`);
      }
      if (rule.max !== undefined && value > rule.max) {
        throw new Error(`Number too large (max: ${rule.max})`);
      }
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      throw new Error(`Value not in allowed list: ${rule.allowedValues.join(', ')}`);
    }

    return value;
  }

  /**
   * Add a validation rule
   */
  public addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a validation rule by field name
   */
  public removeRule(fieldName: string): void {
    this.rules = this.rules.filter(rule => rule.field !== fieldName);
  }

  /**
   * Sanitize search queries to prevent injection
   */
  public static sanitizeQuery(query: string): string {
    if (typeof query !== 'string') {
      throw new Error('Query must be a string');
    }
    
    // Remove potentially dangerous characters and patterns
    return query
      .replace(/[<>'"]/g, '') // Remove HTML/script injection chars
      .replace(/\b(DROP|DELETE|CREATE|ALTER|MERGE)\b/gi, '') // Remove dangerous Cypher keywords
      .trim()
      .substring(0, 500); // Limit length
  }

  /**
   * Validate user ID format
   */
  public static validateUserId(userId: string): boolean {
    if (typeof userId !== 'string') {
      return false;
    }
    
    return ParamGuard.USER_ID_PATTERN.test(userId) && 
           userId.length >= 3 && 
           userId.length <= 50;
  }
} 