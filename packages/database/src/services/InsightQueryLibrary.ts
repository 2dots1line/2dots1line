import { Driver, Session, Record as Neo4jRecord } from 'neo4j-driver';

// Strategic Insight Data Structures
export interface TopSalientValue {
  name: string;
  type: 'value';
  importance_score: number;
  recent_connections: number;
  supporting_memories: string[];
}

export interface StalledGoal {
  name: string;
  type: 'goal';
  last_activity_date: string;
  days_since_activity: number;
  blocking_factors: string[];
}

export interface ValueActionAlignment {
  value_name: string;
  aligned_actions: number;
  misaligned_actions: number;
  alignment_score: number;
  recent_conflicts: string[];
}

export interface EmergingTheme {
  theme_name: string;
  connectivity_growth: number;
  new_connections_this_cycle: number;
  key_concepts: string[];
}

export interface KnowledgeGap {
  gap_area: string;
  evidence_type: 'missing_connections' | 'isolated_concepts' | 'shallow_depth';
  suggested_exploration: string;
  related_concepts: string[];
}

export interface NegativeSentimentContext {
  context_name: string;
  sentiment_intensity: number;
  frequency_this_cycle: number;
  associated_emotions: string[];
}

export interface ActiveStoryArc {
  arc_name: string;
  activity_score: number;
  recent_developments: string[];
  key_participants: string[];
}

export interface IsolatedConcept {
  concept_id: string;
  name: string;
  type: string;
  connection_count: number;
  last_activity: string;
}

export interface CommunityAnalysis {
  community_id: string;
  name: string;
  member_count: number;
  cohesion_score: number;
  key_concepts: string[];
  growth_trend: 'growing' | 'stable' | 'declining';
}

export interface EmergentRelationshipVocabulary {
  label: string;
  frequency: number;
  recent_usage: boolean;
  semantic_category: string;
}

/**
 * InsightQueryLibrary - Thematic Cypher Queries for Strategic Analysis
 * 
 * This library provides pre-defined, optimized Cypher queries for the InsightEngine's
 * strategic analysis. Each method corresponds to a specific thematic analysis required
 * for building the StrategicInsightPackage.
 */
export class InsightQueryLibrary {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Executes a parameterized read query within a managed session.
   */
  private async runReadQuery(cypher: string, params: Record<string, any>): Promise<Neo4jRecord[]> {
    const session: Session = this.driver.session({ defaultAccessMode: 'READ' });
    try {
      const result = await session.run(cypher, params);
      return result.records;
    } catch (error) {
      console.error(`Neo4j Insight Query Failed: ${cypher}`, { params, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Identity Insights: Top Salient Values
   * Finds the user's most important values based on importance_score and recent activity.
   */
  public async getTopSalientValues(userId: string): Promise<TopSalientValue[]> {
    const cypher = `
      MATCH (v:Concept {userId: $userId, type: 'value', status: 'active'})
      OPTIONAL MATCH (v)-[:RELATED_TO]-(connected)
      WHERE connected.userId = $userId
      OPTIONAL MATCH (v)<-[:HIGHLIGHTS]-(mu:MemoryUnit)
      WHERE mu.userId = $userId AND mu.created_at > datetime() - duration('P30D')
      WITH v, 
           count(DISTINCT connected) as connection_count,
           collect(DISTINCT mu.muid)[0..3] as recent_memories,
           v.importance_score as base_importance_score
      WHERE base_importance_score > 0.3
      RETURN v.name as name,
             v.type as type,
             base_importance_score as importance_score,
             connection_count as recent_connections,
             recent_memories as supporting_memories
      ORDER BY base_importance_score DESC, connection_count DESC
      LIMIT 5
    `;
    
    const records = await this.runReadQuery(cypher, { userId });
    return records.map(record => ({
      name: record.get('name'),
      type: record.get('type'),
      importance_score: record.get('importance_score'),
      recent_connections: record.get('recent_connections').toNumber(),
      supporting_memories: record.get('supporting_memories')
    }));
  }

  /**
   * Goal Insights: Stalled Goals
   * Identifies goals that haven't had recent activity or progress.
   */
  public async getStalledGoals(userId: string, cycleStartDate: string): Promise<StalledGoal[]> {
    const cypher = `
      MATCH (g:Concept {userId: $userId, type: 'goal', status: 'active'})
      OPTIONAL MATCH (g)<-[:HIGHLIGHTS]-(mu:MemoryUnit)
      WHERE mu.userId = $userId
      WITH g, 
           max(mu.created_at) as last_activity,
           collect(DISTINCT mu.muid) as related_memories
      WHERE last_activity < datetime($cycleStartDate) - duration('P14D') OR last_activity IS NULL
      OPTIONAL MATCH (g)-[:RELATED_TO {relationship_label: 'blocked_by'}]->(blocker:Concept)
      WHERE blocker.userId = $userId
      WITH g, 
           last_activity,
           duration.between(coalesce(last_activity, datetime() - duration('P90D')), datetime()).days as days_stalled,
           collect(DISTINCT blocker.name) as blocking_factors
      RETURN g.name as name,
             g.type as type,
             coalesce(toString(last_activity), 'never') as last_activity_date,
             days_stalled as days_since_activity,
             blocking_factors
      ORDER BY days_stalled DESC
      LIMIT 10
    `;
    
    const records = await this.runReadQuery(cypher, { userId, cycleStartDate });
    return records.map(record => ({
      name: record.get('name'),
      type: record.get('type'),
      last_activity_date: record.get('last_activity_date'),
      days_since_activity: record.get('days_since_activity').toNumber(),
      blocking_factors: record.get('blocking_factors')
    }));
  }

  /**
   * Value-Action Alignment Analysis
   * Analyzes how well the user's actions align with their stated values.
   */
  public async getValueActionAlignment(userId: string, cycleStartDate: string): Promise<ValueActionAlignment[]> {
    const cypher = `
      MATCH (v:Concept {userId: $userId, type: 'value', status: 'active'})
      WHERE v.importance_score > 0.4
      OPTIONAL MATCH (v)-[r:RELATED_TO {relationship_label: 'supports_action'}]->(action:Concept)
      WHERE action.userId = $userId AND action.type IN ['project', 'goal', 'habit']
      OPTIONAL MATCH (v)-[r2:RELATED_TO {relationship_label: 'conflicts_with'}]->(conflict:Concept)
      WHERE conflict.userId = $userId AND conflict.type IN ['project', 'goal', 'habit']
      OPTIONAL MATCH (v)<-[:HIGHLIGHTS]-(mu:MemoryUnit)
      WHERE mu.userId = $userId 
        AND mu.created_at > datetime($cycleStartDate) - duration('P30D')
        AND mu.content =~ '(?i).*(conflict|tension|struggle|difficult).*'
      WITH v,
           count(DISTINCT action) as aligned_count,
           count(DISTINCT conflict) as conflict_count,
           collect(DISTINCT mu.title)[0..3] as recent_conflicts
      WHERE aligned_count > 0 OR conflict_count > 0
      WITH v, aligned_count, conflict_count, recent_conflicts,
           CASE 
             WHEN aligned_count + conflict_count = 0 THEN 0.5
             ELSE toFloat(aligned_count) / (aligned_count + conflict_count)
           END as alignment_ratio
      RETURN v.name as value_name,
             aligned_count as aligned_actions,
             conflict_count as misaligned_actions,
             alignment_ratio as alignment_score,
             recent_conflicts
      ORDER BY alignment_ratio ASC, (aligned_count + conflict_count) DESC
      LIMIT 8
    `;
    
    const records = await this.runReadQuery(cypher, { userId, cycleStartDate });
    return records.map(record => ({
      value_name: record.get('value_name'),
      aligned_actions: record.get('aligned_actions').toNumber(),
      misaligned_actions: record.get('misaligned_actions').toNumber(),
      alignment_score: record.get('alignment_score'),
      recent_conflicts: record.get('recent_conflicts')
    }));
  }

  /**
   * Emerging Themes by Connectivity
   * Identifies themes that are gaining connections and becoming more central.
   */
  public async getEmergingThemes(userId: string, cycleStartDate: string, previousCycleStartDate: string): Promise<EmergingTheme[]> {
    const cypher = `
      MATCH (t:Concept {userId: $userId, type: 'theme', status: 'active'})
      OPTIONAL MATCH (t)-[r:RELATED_TO]->(connected)
      WHERE connected.userId = $userId 
        AND r.created_ts > datetime($previousCycleStartDate)
      WITH t, 
           count(r) as new_connections,
           collect(DISTINCT connected.name)[0..5] as key_concepts
      WHERE new_connections > 0
      OPTIONAL MATCH (t)-[all_r:RELATED_TO]->(all_connected)
      WHERE all_connected.userId = $userId
      WITH t, new_connections, key_concepts,
           count(all_r) as total_connections
      WITH t, new_connections, key_concepts, total_connections,
           CASE 
             WHEN total_connections = 0 THEN 0
             ELSE toFloat(new_connections) / total_connections
           END as growth_ratio
      WHERE growth_ratio > 0.2 AND new_connections >= 2
      RETURN t.name as theme_name,
             growth_ratio as connectivity_growth,
             new_connections as new_connections_this_cycle,
             key_concepts
      ORDER BY growth_ratio DESC, new_connections DESC
      LIMIT 6
    `;
    
    const records = await this.runReadQuery(cypher, { userId, cycleStartDate, previousCycleStartDate });
    return records.map(record => ({
      theme_name: record.get('theme_name'),
      connectivity_growth: record.get('connectivity_growth'),
      new_connections_this_cycle: record.get('new_connections_this_cycle').toNumber(),
      key_concepts: record.get('key_concepts')
    }));
  }

  /**
   * Knowledge Coverage Gaps
   * Identifies areas where the user's knowledge graph is sparse or disconnected.
   */
  public async getKnowledgeGaps(userId: string): Promise<KnowledgeGap[]> {
    const cypher = `
      // Find isolated concepts (potential knowledge gaps)
      MATCH (c:Concept {userId: $userId, status: 'active'})
      WHERE NOT (c)-[:RELATED_TO]-()
      WITH 'isolated_concepts' as gap_type, 
           c.type as gap_area,
           count(c) as gap_count,
           collect(c.name)[0..3] as examples
      WHERE gap_count >= 2
      
      UNION
      
      // Find concept types with very few connections
      MATCH (c:Concept {userId: $userId, status: 'active'})
      OPTIONAL MATCH (c)-[:RELATED_TO]-(connected)
      WHERE connected.userId = $userId
      WITH c.type as concept_type, 
           avg(count(connected)) as avg_connections,
           count(c) as concept_count
      WHERE concept_count >= 3 AND avg_connections < 1.5
      WITH 'missing_connections' as gap_type,
           concept_type as gap_area,
           concept_count as gap_count,
           [] as examples
      
      UNION
      
      // Find themes without sufficient depth
      MATCH (t:Concept {userId: $userId, type: 'theme', status: 'active'})
      OPTIONAL MATCH (t)-[:RELATED_TO*1..2]-(related)
      WHERE related.userId = $userId
      WITH t, count(DISTINCT related) as depth_score
      WHERE depth_score < 3
      WITH 'shallow_depth' as gap_type,
           'theme_exploration' as gap_area,
           count(t) as gap_count,
           collect(t.name)[0..3] as examples
      WHERE gap_count >= 2
      
      RETURN gap_type as evidence_type,
             gap_area,
             gap_count,
             examples as related_concepts
      ORDER BY gap_count DESC
      LIMIT 5
    `;
    
    const records = await this.runReadQuery(cypher, { userId });
    return records.map(record => ({
      gap_area: record.get('gap_area'),
      evidence_type: record.get('evidence_type') as 'missing_connections' | 'isolated_concepts' | 'shallow_depth',
      suggested_exploration: this.generateGapSuggestion(record.get('evidence_type'), record.get('gap_area')),
      related_concepts: record.get('related_concepts')
    }));
  }

  /**
   * Contexts Triggering Negative Sentiment
   * Identifies situations or topics that consistently trigger negative emotions.
   */
  public async getContextsTriggeringNegativeSentiment(userId: string, cycleStartDate: string): Promise<NegativeSentimentContext[]> {
    const cypher = `
      MATCH (neg:Concept {userId: $userId, type: 'emotion_negative', status: 'active'})
      MATCH (neg)<-[:HIGHLIGHTS]-(mu:MemoryUnit)
      WHERE mu.userId = $userId 
        AND mu.created_at > datetime($cycleStartDate) - duration('P30D')
      MATCH (mu)-[:HIGHLIGHTS]->(context:Concept)
      WHERE context.userId = $userId 
        AND context.type IN ['person', 'project', 'role', 'theme']
        AND context.id <> neg.id
      WITH context, neg,
           count(mu) as frequency,
           avg(coalesce(mu.importance_score, 0.5)) as avg_intensity
      WHERE frequency >= 2
      WITH context.name as context_name,
           avg_intensity as sentiment_intensity,
           sum(frequency) as total_frequency,
           collect(DISTINCT neg.name) as emotions
      WHERE total_frequency >= 3
      RETURN context_name,
             sentiment_intensity,
             total_frequency as frequency_this_cycle,
             emotions as associated_emotions
      ORDER BY sentiment_intensity DESC, total_frequency DESC
      LIMIT 6
    `;
    
    const records = await this.runReadQuery(cypher, { userId, cycleStartDate });
    return records.map(record => ({
      context_name: record.get('context_name'),
      sentiment_intensity: record.get('sentiment_intensity'),
      frequency_this_cycle: record.get('frequency_this_cycle').toNumber(),
      associated_emotions: record.get('associated_emotions')
    }));
  }

  /**
   * Most Active Story Arcs This Cycle
   * Identifies ongoing narratives or themes that have been most active recently.
   */
  public async getMostActiveStoryArcs(userId: string, cycleStartDate: string): Promise<ActiveStoryArc[]> {
    const cypher = `
      MATCH (arc:Concept {userId: $userId, type: 'event_theme', status: 'active'})
      MATCH (arc)<-[:HIGHLIGHTS]-(mu:MemoryUnit)
      WHERE mu.userId = $userId 
        AND mu.created_at > datetime($cycleStartDate) - duration('P30D')
      WITH arc, 
           count(mu) as activity_count,
           collect(DISTINCT mu.title)[0..3] as recent_developments
      WHERE activity_count >= 2
      OPTIONAL MATCH (arc)-[:RELATED_TO]-(participant:Concept)
      WHERE participant.userId = $userId 
        AND participant.type IN ['person', 'role', 'organization']
      WITH arc, activity_count, recent_developments,
           collect(DISTINCT participant.name)[0..4] as participants
      RETURN arc.name as arc_name,
             activity_count as activity_score,
             recent_developments,
             participants as key_participants
      ORDER BY activity_score DESC
      LIMIT 8
    `;
    
    const records = await this.runReadQuery(cypher, { userId, cycleStartDate });
    return records.map(record => ({
      arc_name: record.get('arc_name'),
      activity_score: record.get('activity_score').toNumber(),
      recent_developments: record.get('recent_developments'),
      key_participants: record.get('key_participants')
    }));
  }

  /**
   * Isolated or Underconnected Concepts
   * Finds concepts that may need better integration into the knowledge graph.
   */
  public async getIsolatedOrUnderconnectedConcepts(userId: string): Promise<IsolatedConcept[]> {
    const cypher = `
      MATCH (c:Concept {userId: $userId, status: 'active'})
      OPTIONAL MATCH (c)-[:RELATED_TO]-(connected)
      WHERE connected.userId = $userId
      WITH c, count(connected) as connection_count
      WHERE connection_count <= 1
      OPTIONAL MATCH (c)<-[:HIGHLIGHTS]-(mu:MemoryUnit)
      WHERE mu.userId = $userId
      WITH c, connection_count, max(mu.created_at) as last_activity
      RETURN c.concept_id as concept_id,
             c.name as name,
             c.type as type,
             connection_count,
             coalesce(toString(last_activity), 'unknown') as last_activity
      ORDER BY connection_count ASC, last_activity DESC
      LIMIT 15
    `;
    
    const records = await this.runReadQuery(cypher, { userId });
    return records.map(record => ({
      concept_id: record.get('concept_id'),
      name: record.get('name'),
      type: record.get('type'),
      connection_count: record.get('connection_count').toNumber(),
      last_activity: record.get('last_activity')
    }));
  }

  /**
   * Community Detection and Analysis
   * Analyzes the structure of concept communities and their health.
   */
  public async getCommunityDetectionAndAnalysis(userId: string): Promise<CommunityAnalysis[]> {
    const cypher = `
      MATCH (c:Concept {userId: $userId, status: 'active'})
      WHERE exists(c.community_id)
      WITH c.community_id as community_id, 
           collect(c) as members,
           count(c) as member_count
      WHERE member_count >= 3
      UNWIND members as member
      OPTIONAL MATCH (member)-[:RELATED_TO]-(other_member)
      WHERE other_member.userId = $userId 
        AND other_member.community_id = community_id
      WITH community_id, members, member_count,
           count(other_member) as internal_connections,
           member_count * (member_count - 1) as max_connections
      WITH community_id, members, member_count,
           CASE 
             WHEN max_connections = 0 THEN 0
             ELSE toFloat(internal_connections) / max_connections
           END as cohesion_score
      WITH community_id, member_count, cohesion_score,
           [m IN members | m.name][0..5] as key_concept_names
      RETURN community_id,
             'Community_' + toString(community_id) as name,
             member_count,
             cohesion_score,
             key_concept_names as key_concepts,
             CASE 
               WHEN cohesion_score > 0.6 THEN 'growing'
               WHEN cohesion_score > 0.3 THEN 'stable'
               ELSE 'declining'
             END as growth_trend
      ORDER BY cohesion_score DESC, member_count DESC
      LIMIT 10
    `;
    
    const records = await this.runReadQuery(cypher, { userId });
    return records.map(record => ({
      community_id: record.get('community_id'),
      name: record.get('name'),
      member_count: record.get('member_count').toNumber(),
      cohesion_score: record.get('cohesion_score'),
      key_concepts: record.get('key_concepts'),
      growth_trend: record.get('growth_trend') as 'growing' | 'stable' | 'declining'
    }));
  }

  /**
   * Emergent Relationship Vocabulary
   * Gathers all unique relationship labels and their usage patterns.
   */
  public async getEmergentRelationshipVocabulary(userId: string): Promise<EmergentRelationshipVocabulary[]> {
    const cypher = `
      MATCH ()-[r:RELATED_TO]->()
      WHERE r.userId = $userId AND r.relationship_label IS NOT NULL
      WITH r.relationship_label as label, 
           count(r) as frequency,
           max(r.created_ts) as last_used
      WHERE frequency >= 2
      WITH label, frequency, last_used,
           duration.between(last_used, datetime()).days as days_since_use
      RETURN label,
             frequency,
             days_since_use < 30 as recent_usage,
             CASE 
               WHEN label =~ '(?i).*(feel|emotion|sentiment).*' THEN 'emotional'
               WHEN label =~ '(?i).*(goal|achieve|target).*' THEN 'aspirational'
               WHEN label =~ '(?i).*(cause|lead|result).*' THEN 'causal'
               WHEN label =~ '(?i).*(support|help|enable).*' THEN 'supportive'
               WHEN label =~ '(?i).*(block|prevent|hinder).*' THEN 'obstructive'
               ELSE 'descriptive'
             END as semantic_category
      ORDER BY frequency DESC
      LIMIT 50
    `;
    
    const records = await this.runReadQuery(cypher, { userId });
    return records.map(record => ({
      label: record.get('label'),
      frequency: record.get('frequency').toNumber(),
      recent_usage: record.get('recent_usage'),
      semantic_category: record.get('semantic_category')
    }));
  }

  /**
   * Helper method to generate gap exploration suggestions
   */
  private generateGapSuggestion(evidenceType: string, gapArea: string): string {
    const suggestions = {
      'isolated_concepts': `Consider exploring connections between isolated ${gapArea} concepts and existing themes`,
      'missing_connections': `Explore relationships within the ${gapArea} domain to build conceptual bridges`,
      'shallow_depth': `Deepen exploration of ${gapArea} through more detailed analysis and connections`
    };
    
    return suggestions[evidenceType as keyof typeof suggestions] || 
           `Investigate the ${gapArea} area for potential knowledge expansion`;
  }

  /**
   * Health check - verifies the service can connect to Neo4j.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const records = await this.runReadQuery('RETURN 1 as test', {});
      return records.length > 0;
    } catch (error) {
      console.error('InsightQueryLibrary health check failed:', error);
      return false;
    }
  }

  /**
   * Get query execution statistics for monitoring
   */
  public async getQueryStatistics(userId: string): Promise<{
    totalConcepts: number;
    totalRelationships: number;
    totalMemoryUnits: number;
    avgConceptConnections: number;
  }> {
    const cypher = `
      MATCH (c:Concept {userId: $userId})
      OPTIONAL MATCH (c)-[:RELATED_TO]-(connected)
      WHERE connected.userId = $userId
      WITH count(DISTINCT c) as concept_count,
           count(connected) as relationship_count,
           avg(count(connected)) as avg_connections
      MATCH (mu:MemoryUnit {userId: $userId})
      RETURN concept_count as totalConcepts,
             relationship_count as totalRelationships,
             count(mu) as totalMemoryUnits,
             avg_connections as avgConceptConnections
    `;
    
    const records = await this.runReadQuery(cypher, { userId });
    const record = records[0];
    
    return {
      totalConcepts: record.get('totalConcepts').toNumber(),
      totalRelationships: record.get('totalRelationships').toNumber(),
      totalMemoryUnits: record.get('totalMemoryUnits').toNumber(),
      avgConceptConnections: record.get('avgConceptConnections')
    };
  }
} 