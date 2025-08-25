import { DatabaseService } from '@2dots1line/database';

import type { CycleDates } from './InsightEngine';

export interface IngestionActivitySummary {
  totalConversations: number;
  totalMemoryUnits: number;
  totalConcepts: number;
  totalGrowthEvents: number;
  conversationSummaries: Array<{
    id: string;
    title: string;
    importance_score: number;
    context_summary: string;
    created_at: Date;
  }>;
  memoryThemes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  conceptDistribution: Array<{
    type: string;
    count: number;
    examples: string[];
  }>;
  growthEventSummary: Array<{
    dim_key: string;
    total_delta: number;
    event_count: number;
  }>;
}

export interface GraphAnalysisPackage {
  totalNodes: number;
  totalRelationships: number;
  nodeTypeCounts: Record<string, number>;
  relationshipTypeCounts: Record<string, number>;
  structuralMetrics: {
    averageDegree: number;
    densityScore: number;
    clusteringCoefficient: number;
  };
  keyConceptClusters: Array<{
    centroid_concept: string;
    connected_concepts: string[];
    cluster_size: number;
    semantic_coherence: number;
  }>;
  ontologyGaps: Array<{
    gap_type: string;
    description: string;
    affected_concepts: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface StrategicInsightPackage {
  userEvolutionMetrics: {
    knowledge_breadth_change: number;
    knowledge_depth_change: number;
    curiosity_pattern_shift: number;
    learning_velocity: number;
  };
  emergentPatterns: Array<{
    pattern_type: string;
    description: string;
    supporting_evidence: string[];
    confidence_score: number;
  }>;
  knowledgeGaps: Array<{
    gap_area: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
    potential_bridges: string[];
  }>;
  growthOpportunities: Array<{
    opportunity_type: string;
    description: string;
    estimated_impact: 'high' | 'medium' | 'low';
    prerequisites: string[];
  }>;
}

// Type guard for growth event details
function isGrowthEventDetails(val: unknown): val is { dim_key?: string; delta?: number } {
  return typeof val === 'object' && val !== null && (
    'dim_key' in val || 'delta' in val
  );
}

export class InsightDataCompiler {
  constructor(
    private dbService: DatabaseService,
    private neo4jClient?: any
  ) {}

  async compileIngestionActivity(userId: string, cycleDates: CycleDates): Promise<IngestionActivitySummary> {
    console.log(`[InsightDataCompiler] Compiling ingestion activity for user ${userId} from ${cycleDates.cycleStartDate} to ${cycleDates.cycleEndDate}`);

    try {
      // Fetch conversations within cycle period
      const conversations = await this.dbService.prisma.conversations.findMany({
        where: {
          user_id: userId,
          start_time: {
            gte: cycleDates.cycleStartDate,
            lte: cycleDates.cycleEndDate
          }
        },
        select: {
          id: true,
          title: true,
          importance_score: true,
          context_summary: true,
          start_time: true
        },
        orderBy: { importance_score: 'desc' }
      });

      // Fetch memory units within cycle period
      const memoryUnits = await this.dbService.prisma.memory_units.findMany({
        where: {
          user_id: userId,
          creation_ts: {
            gte: cycleDates.cycleStartDate,
            lte: cycleDates.cycleEndDate
          }
        },
        select: {
          title: true,
          content: true
        }
      });

      // Fetch concepts within cycle period
      const concepts = await this.dbService.prisma.concepts.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: cycleDates.cycleStartDate,
            lte: cycleDates.cycleEndDate
          }
        },
        select: {
          name: true,
          type: true,
          description: true
        }
      });

      // Fetch growth events within cycle period
      const growthEvents = await this.dbService.prisma.growth_events.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: cycleDates.cycleStartDate,
            lte: cycleDates.cycleEndDate
          }
        },
        // Remove select: { dim_key: true, delta: true }
      });

      // Analyze memory themes
      const memoryThemes = this.analyzeMemoryThemes(memoryUnits);

      // Analyze concept distribution (handle nullable descriptions)
      const conceptsWithDescriptions = concepts.map(c => ({
        name: c.name,
        type: c.type,
        description: c.description || 'No description'
      }));
      const conceptDistribution = this.analyzeConceptDistribution(conceptsWithDescriptions);

      // Analyze growth event summary
      const growthEventSummary = this.analyzeGrowthEvents(
        growthEvents.map(event => {
          const details = event.details;
          return {
            dim_key: isGrowthEventDetails(details) && typeof details.dim_key === 'string' ? details.dim_key : 'unknown',
            delta: isGrowthEventDetails(details) && typeof details.delta === 'number' ? details.delta : 0,
          };
        })
      );

      return {
        totalConversations: conversations.length,
        totalMemoryUnits: memoryUnits.length,
        totalConcepts: concepts.length,
        totalGrowthEvents: growthEvents.length,
        conversationSummaries: conversations.map(conv => ({
          id: conv.id,
          title: conv.title || 'Untitled Conversation',
          importance_score: conv.importance_score || 0,
          context_summary: conv.context_summary || 'No summary available',
          created_at: conv.start_time
        })),
        memoryThemes,
        conceptDistribution,
        growthEventSummary
      };

    } catch (error) {
      console.error(`[InsightDataCompiler] Error compiling ingestion activity for user ${userId}:`, error);
      throw error;
    }
  }

  async compileGraphAnalysis(userId: string): Promise<GraphAnalysisPackage> {
    console.log(`[InsightDataCompiler] Compiling graph analysis for user ${userId}`);

    try {
      // If Neo4j client is available, perform detailed graph analysis
      if (this.neo4jClient) {
        return await this.performNeo4jGraphAnalysis(userId);
      }

      // Fallback: Basic analysis using PostgreSQL data
      return await this.performBasicGraphAnalysis(userId);

    } catch (error) {
      console.error(`[InsightDataCompiler] Error compiling graph analysis for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * V11.0: Compiles node metrics for a user during their insight cycle
   * This is the correct approach for analytical needs (per tech lead directive)
   */
  public async compileNodeMetrics(userId: string): Promise<Array<{ nodeId: string; connectionCount: number }>> {
    if (!this.neo4jClient) {
      console.warn(`[InsightDataCompiler] Neo4j client not available for compileNodeMetrics`);
      return [];
    }

    const session = this.neo4jClient.session();
    try {
      // Single query to get all connection counts for one user during their insight cycle
      const cypher = `
        MATCH (n) WHERE n.userId = $userId AND (n:Concept OR n:MemoryUnit)
        WITH n, apoc.node.degree(n) AS connectionCount
        RETURN COALESCE(n.id, n.muid, n.concept_id) as nodeId, connectionCount
      `;
      
      const result = await session.run(cypher, { userId });

      return result.records.map((record: any) => ({
        nodeId: record.get('nodeId'),
        connectionCount: record.get('connectionCount').toNumber(),
      }));
    } catch (error) {
      console.error(`[InsightDataCompiler] Error compiling node metrics for user ${userId}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async compileStrategicInsights(userId: string, cycleDates: CycleDates): Promise<StrategicInsightPackage> {
    console.log(`[InsightDataCompiler] Compiling strategic insights for user ${userId}`);

    try {
      // Calculate user evolution metrics
      const userEvolutionMetrics = await this.calculateUserEvolutionMetrics(userId, cycleDates);

      // Identify emergent patterns
      const emergentPatterns = await this.identifyEmergentPatterns(userId, cycleDates);

      // Identify knowledge gaps
      const knowledgeGaps = await this.identifyKnowledgeGaps(userId);

      // Identify growth opportunities
      const growthOpportunities = await this.identifyGrowthOpportunities(userId, cycleDates);

      return {
        userEvolutionMetrics,
        emergentPatterns,
        knowledgeGaps,
        growthOpportunities
      };

    } catch (error) {
      console.error(`[InsightDataCompiler] Error compiling strategic insights for user ${userId}:`, error);
      throw error;
    }
  }

  private analyzeMemoryThemes(memoryUnits: Array<{ title: string; content: string }>): Array<{ theme: string; count: number; examples: string[] }> {
    // Simple thematic analysis based on keywords
    const themes = new Map<string, { count: number; examples: string[] }>();

    memoryUnits.forEach(memory => {
      const text = `${memory.title} ${memory.content}`.toLowerCase();
      
      // Define theme keywords (this could be enhanced with NLP)
      const themeKeywords = {
        'learning': ['learn', 'study', 'education', 'course', 'training', 'skill'],
        'career': ['work', 'job', 'career', 'professional', 'business', 'project'],
        'personal': ['family', 'friend', 'relationship', 'personal', 'life', 'health'],
        'technology': ['tech', 'software', 'code', 'programming', 'computer', 'digital'],
        'creativity': ['art', 'music', 'creative', 'design', 'writing', 'imagine']
      };

      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          if (!themes.has(theme)) {
            themes.set(theme, { count: 0, examples: [] });
          }
          const themeData = themes.get(theme)!;
          themeData.count++;
          if (themeData.examples.length < 3) {
            themeData.examples.push(memory.title);
          }
        }
      });
    });

    return Array.from(themes.entries()).map(([theme, data]) => ({
      theme,
      count: data.count,
      examples: data.examples
    }));
  }

  private analyzeConceptDistribution(concepts: Array<{ name: string; type: string; description: string }>): Array<{ type: string; count: number; examples: string[] }> {
    const distribution = new Map<string, { count: number; examples: string[] }>();

    concepts.forEach(concept => {
      if (!distribution.has(concept.type)) {
        distribution.set(concept.type, { count: 0, examples: [] });
      }
      const typeData = distribution.get(concept.type)!;
      typeData.count++;
      if (typeData.examples.length < 3) {
        typeData.examples.push(concept.name);
      }
    });

    return Array.from(distribution.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      examples: data.examples
    }));
  }

  private analyzeGrowthEvents(growthEvents: Array<{ dim_key: string; delta: number }>): Array<{ dim_key: string; total_delta: number; event_count: number }> {
    const summary = new Map<string, { total_delta: number; event_count: number }>();

    growthEvents.forEach(event => {
      if (!summary.has(event.dim_key)) {
        summary.set(event.dim_key, { total_delta: 0, event_count: 0 });
      }
      const dimData = summary.get(event.dim_key)!;
      dimData.total_delta += event.delta;
      dimData.event_count++;
    });

    return Array.from(summary.entries()).map(([dim_key, data]) => ({
      dim_key,
      total_delta: data.total_delta,
      event_count: data.event_count
    }));
  }

  private async performNeo4jGraphAnalysis(userId: string): Promise<GraphAnalysisPackage> {
    const session = this.neo4jClient.session();
    
    try {
      // Get total nodes and relationships for user
      const statsQuery = `
        MATCH (n {user_id: $userId})
        OPTIONAL MATCH (n)-[r]-()
        RETURN count(DISTINCT n) as nodeCount, count(DISTINCT r) as relCount
      `;
      const statsResult = await session.run(statsQuery, { userId });
      const stats = statsResult.records[0];

      // Get node type distribution
      const nodeTypeQuery = `
        MATCH (n {user_id: $userId})
        RETURN labels(n)[0] as nodeType, count(n) as count
      `;
      const nodeTypeResult = await session.run(nodeTypeQuery, { userId });
      const nodeTypeCounts = Object.fromEntries(
        nodeTypeResult.records.map((record: any) => [
          record.get('nodeType'),
          record.get('count').toNumber()
        ])
      );

      // Basic structural metrics (simplified)
      const totalNodes = stats.get('nodeCount').toNumber();
      const totalRelationships = stats.get('relCount').toNumber();

      return {
        totalNodes,
        totalRelationships,
        nodeTypeCounts,
        relationshipTypeCounts: {},
        structuralMetrics: {
          averageDegree: totalNodes > 0 ? (totalRelationships * 2) / totalNodes : 0,
          densityScore: totalNodes > 1 ? totalRelationships / (totalNodes * (totalNodes - 1) / 2) : 0,
          clusteringCoefficient: 0.5 // Placeholder
        },
        keyConceptClusters: [],
        ontologyGaps: []
      };

    } finally {
      await session.close();
    }
  }

  private async performBasicGraphAnalysis(userId: string): Promise<GraphAnalysisPackage> {
    // Fallback analysis using PostgreSQL data
    const conceptCount = await this.dbService.prisma.concepts.count({
      where: { user_id: userId }
    });

    const memoryCount = await this.dbService.prisma.memory_units.count({
      where: { user_id: userId }
    });

    return {
      totalNodes: conceptCount + memoryCount,
      totalRelationships: 0,
      nodeTypeCounts: {
        'Concept': conceptCount,
        'MemoryUnit': memoryCount
      },
      relationshipTypeCounts: {},
      structuralMetrics: {
        averageDegree: 0,
        densityScore: 0,
        clusteringCoefficient: 0
      },
      keyConceptClusters: [],
      ontologyGaps: []
    };
  }

  private async calculateUserEvolutionMetrics(userId: string, cycleDates: CycleDates) {
    // Calculate metrics based on growth events and activity patterns
    const growthEvents = await this.dbService.prisma.growth_events.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: cycleDates.cycleStartDate,
          lte: cycleDates.cycleEndDate
        }
      }
    });

    const totalDelta = growthEvents.reduce((sum, event) => {
      const details = event.details;
      return sum + (isGrowthEventDetails(details) && typeof details.delta === 'number' ? details.delta : 0);
    }, 0);
    const avgDelta = growthEvents.length > 0 ? totalDelta / growthEvents.length : 0;

    return {
      knowledge_breadth_change: avgDelta * 0.7, // Simplified calculation
      knowledge_depth_change: avgDelta * 0.8,
      curiosity_pattern_shift: avgDelta * 0.6,
      learning_velocity: avgDelta * 1.2
    };
  }

  private async identifyEmergentPatterns(userId: string, cycleDates: CycleDates) {
    // Analyze patterns in conversations and activities
    const conversations = await this.dbService.prisma.conversations.findMany({
      where: {
        user_id: userId,
        start_time: {
          gte: cycleDates.cycleStartDate,
          lte: cycleDates.cycleEndDate
        }
      },
      select: { context_summary: true }
    });

    // Simple pattern detection (could be enhanced with ML)
    const patterns = [];
    if (conversations.length > 3) {
      patterns.push({
        pattern_type: 'high_engagement',
        description: 'User shows consistent engagement across multiple conversations',
        supporting_evidence: conversations.slice(0, 3).map(c => c.context_summary || 'No summary'),
        confidence_score: 0.8
      });
    }

    return patterns;
  }

  private async identifyKnowledgeGaps(userId: string) {
    // Identify potential knowledge gaps based on user's current knowledge graph
    const concepts = await this.dbService.prisma.concepts.findMany({
      where: { user_id: userId },
      select: { type: true, name: true }
    });

    const conceptTypes = new Set(concepts.map(c => c.type));
    const gaps = [];

    // Example gap detection logic
    if (!conceptTypes.has('methodology') && conceptTypes.has('project')) {
      gaps.push({
        gap_area: 'methodology',
        description: 'User has project concepts but lacks methodological frameworks',
        urgency: 'medium' as const,
        potential_bridges: ['project management', 'best practices']
      });
    }

    return gaps;
  }

  private async identifyGrowthOpportunities(userId: string, cycleDates: CycleDates) {
    // Identify growth opportunities based on recent activity and patterns
    const recentConcepts = await this.dbService.prisma.concepts.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: cycleDates.cycleStartDate,
          lte: cycleDates.cycleEndDate
        }
      },
      select: { type: true, name: true }
    });

    const opportunities = [];

    if (recentConcepts.length > 5) {
      opportunities.push({
        opportunity_type: 'knowledge_synthesis',
        description: 'High concept creation rate indicates readiness for synthesis work',
        estimated_impact: 'high' as const,
        prerequisites: ['conceptual mapping', 'pattern recognition']
      });
    }

    return opportunities;
  }
}
