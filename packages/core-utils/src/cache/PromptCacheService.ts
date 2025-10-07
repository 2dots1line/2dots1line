/**
 * PromptCacheService.ts
 * V11.0 - Universal prompt section caching service for all agents
 * Implements Redis-based caching with TTL and invalidation strategies
 */

// Generic interface for cache operations
interface CacheOperations {
  kvGet(key: string): Promise<string | null>;
  kvSet(key: string, value: string, ttlSeconds: number): Promise<void>;
  kvDel(pattern: string): Promise<void>;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

export interface CachedSection {
  content: string;
  cached: boolean;
  cacheKey: string;
  ttl: number;
  timestamp: number;
}

export interface CacheConfig {
  section_ttl_seconds: {
    core_identity: number;
    operational_config: number;
    dynamic_context: number;
    current_turn: number;
    cosmos_key_phrase: number;
    cosmos_final_response: number;
    ontology_optimization: number;
    artifact_generation: number;
    proactive_prompts: number;
    growth_events: number;
    key_phrase_extraction: number;
    ingestion_analyst_persona: number;
    ingestion_analyst_rules: number;
    ingestion_analyst_instructions: number;
  };
  cache_keys: {
    pattern: string;
    examples: string[];
  };
  invalidation: {
    user_update_triggers: string[];
    global_update_triggers: string[];
  };
}

export class PromptCacheService {
  private metrics: Map<string, CacheMetrics> = new Map();
  private config: CacheConfig;

  constructor(
    private cacheOperations: CacheOperations,
    config?: Partial<CacheConfig>
  ) {
    // Default cache configuration
    this.config = {
      section_ttl_seconds: {
        core_identity: 3600,        // 1 hour - rarely changes
        operational_config: 1800,   // 30 minutes - changes occasionally
        dynamic_context: 300,       // 5 minutes - changes frequently
        current_turn: 0,            // Never cache - always unique
        cosmos_key_phrase: 3600,    // 1 hour - template rarely changes
        cosmos_final_response: 1800, // 30 minutes - template changes occasionally
        ontology_optimization: 3600, // 1 hour - ontology structure stable
        artifact_generation: 1800,   // 30 minutes - generation patterns stable
        proactive_prompts: 1800,     // 30 minutes - prompt patterns stable
        growth_events: 1800,         // 30 minutes - event patterns stable
        key_phrase_extraction: 3600, // 1 hour - extraction patterns stable
        ingestion_analyst_persona: 3600,    // 1 hour - persona rarely changes
        ingestion_analyst_rules: 3600,      // 1 hour - rules rarely change
        ingestion_analyst_instructions: 1800, // 30 minutes - instructions occasionally change
        ...config?.section_ttl_seconds
      },
      cache_keys: {
        pattern: 'prompt_section:{section_type}:{userId}:{conversationId?}',
        examples: [
          'prompt_section:core_identity:user123',
          'prompt_section:operational_config:user123',
          'prompt_section:dynamic_context:user123:conv456',
          'prompt_section:cosmos_key_phrase:user123'
        ],
        ...config?.cache_keys
      },
      invalidation: {
        user_update_triggers: [
          'user_profile_update',
          'user_preferences_change',
          'user_memory_profile_update'
        ],
        global_update_triggers: [
          'template_update',
          'core_identity_update',
          'operational_config_update'
        ],
        ...config?.invalidation
      }
    };
  }

  /**
   * Get cached prompt section with metrics tracking
   */
  async getCachedSection(
    sectionType: string, 
    userId: string, 
    conversationId?: string,
    additionalContext?: Record<string, any>
  ): Promise<CachedSection | null> {
    const cacheKey = this.buildCacheKey(sectionType, userId, conversationId, additionalContext);
    
    try {
      const cached = await this.cacheOperations.kvGet(cacheKey);
      
      if (cached) {
        this.recordCacheHit(sectionType);
        console.log(`[PromptCacheService] Cache HIT for ${sectionType} (${userId})`);
        
        return {
          content: cached,
          cached: true,
          cacheKey,
          ttl: this.config.section_ttl_seconds[sectionType as keyof typeof this.config.section_ttl_seconds] || 0,
          timestamp: Date.now()
        };
      } else {
        this.recordCacheMiss(sectionType);
        console.log(`[PromptCacheService] Cache MISS for ${sectionType} (${userId})`);
        return null;
      }
    } catch (error) {
      console.warn(`[PromptCacheService] Cache read failed for ${cacheKey}:`, error);
      this.recordCacheMiss(sectionType);
      return null; // Graceful degradation
    }
  }

  /**
   * Set cached prompt section with TTL
   */
  async setCachedSection(
    sectionType: string,
    userId: string,
    content: string,
    conversationId?: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(sectionType, userId, conversationId, additionalContext);
    const ttl = this.config.section_ttl_seconds[sectionType as keyof typeof this.config.section_ttl_seconds] || 0;
    
    // Don't cache if TTL is 0 (e.g., current_turn)
    if (ttl === 0) {
      console.log(`[PromptCacheService] Skipping cache for ${sectionType} (TTL=0)`);
      return;
    }

    try {
      await this.cacheOperations.kvSet(cacheKey, content, ttl);
      console.log(`[PromptCacheService] Cached ${sectionType} for ${userId} (TTL: ${ttl}s)`);
    } catch (error) {
      console.warn(`[PromptCacheService] Cache write failed for ${cacheKey}:`, error);
      // Don't throw - caching is optimization, not critical
    }
  }

  /**
   * Invalidate all caches for a specific user
   */
  async invalidateUser(userId: string): Promise<void> {
    try {
      // Get all keys matching the user pattern
      const pattern = `prompt_section:*:${userId}*`;
      await this.cacheOperations.kvDel(pattern);
      console.log(`[PromptCacheService] Invalidated all caches for user ${userId}`);
    } catch (error) {
      console.warn(`[PromptCacheService] Cache invalidation failed for user ${userId}:`, error);
    }
  }

  /**
   * Invalidate caches for a specific section type across all users
   */
  async invalidateSection(sectionType: string): Promise<void> {
    try {
      const pattern = `prompt_section:${sectionType}:*`;
      await this.cacheOperations.kvDel(pattern);
      console.log(`[PromptCacheService] Invalidated all caches for section ${sectionType}`);
    } catch (error) {
      console.warn(`[PromptCacheService] Cache invalidation failed for section ${sectionType}:`, error);
    }
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(sectionType?: string): CacheMetrics | Map<string, CacheMetrics> {
    if (sectionType) {
      return this.metrics.get(sectionType) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0 };
    }
    return new Map(this.metrics);
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(sectionType?: string): void {
    if (sectionType) {
      this.metrics.delete(sectionType);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Build cache key with consistent pattern
   */
  private buildCacheKey(
    sectionType: string, 
    userId: string, 
    conversationId?: string,
    additionalContext?: Record<string, any>
  ): string {
    let key = `prompt_section:${sectionType}:${userId}`;
    
    if (conversationId) {
      key += `:${conversationId}`;
    }
    
    // Add additional context as hash if provided
    if (additionalContext && Object.keys(additionalContext).length > 0) {
      const contextHash = this.hashContext(additionalContext);
      key += `:${contextHash}`;
    }
    
    return key;
  }

  /**
   * Create hash from additional context for cache key
   */
  private hashContext(context: Record<string, any>): string {
    const sortedKeys = Object.keys(context).sort();
    const contextString = sortedKeys.map(key => `${key}:${JSON.stringify(context[key])}`).join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Record cache hit for metrics
   */
  private recordCacheHit(sectionType: string): void {
    const metrics = this.metrics.get(sectionType) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0 };
    metrics.hits++;
    metrics.totalRequests++;
    metrics.hitRate = metrics.hits / metrics.totalRequests;
    this.metrics.set(sectionType, metrics);
  }

  /**
   * Record cache miss for metrics
   */
  private recordCacheMiss(sectionType: string): void {
    const metrics = this.metrics.get(sectionType) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0 };
    metrics.misses++;
    metrics.totalRequests++;
    metrics.hitRate = metrics.hits / metrics.totalRequests;
    this.metrics.set(sectionType, metrics);
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
