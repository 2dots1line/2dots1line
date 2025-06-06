/**
 * Enhanced Named Entity Recognition (NER) Tool
 * Optimized for 2dots1line personal growth context
 * 
 * Phase 1: Hybrid approach with deterministic patterns + growth-oriented keywords
 */

export interface EntityMatch {
  text: string;
  type: EntityType;
  start: number;
  end: number;
  confidence: number;
  context?: string;
}

export enum EntityType {
  // Core entities for concept nodes
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION', 
  LOCATION = 'LOCATION',
  DATE = 'DATE',
  
  // Growth-oriented concepts (new for V7)
  EMOTION = 'EMOTION',
  VALUE = 'VALUE',
  GOAL = 'GOAL',
  SKILL = 'SKILL',
  STRUGGLE = 'STRUGGLE',
  ASPIRATION = 'ASPIRATION',
  
  // Low-priority entities (stored as metadata)
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL'
}

export interface NERResult {
  entities: EntityMatch[];
  conceptEntities: EntityMatch[]; // High-value entities for concept nodes
  metadataEntities: EntityMatch[]; // Low-value entities for metadata storage
  processingTime: number;
  totalEntities: number;
}

export class EnhancedNER {
  private static readonly EMOTION_KEYWORDS = [
    'happy', 'sad', 'anxious', 'proud', 'frustrated', 'excited', 'nervous',
    'confident', 'overwhelmed', 'grateful', 'disappointed', 'hopeful',
    'angry', 'peaceful', 'stressed', 'content', 'worried', 'joyful',
    'fearful', 'optimistic', 'depressed', 'enthusiastic', 'calm', 'restless'
  ];

  private static readonly VALUE_KEYWORDS = [
    'honesty', 'creativity', 'kindness', 'integrity', 'family', 'friendship',
    'loyalty', 'compassion', 'justice', 'freedom', 'growth', 'learning',
    'authenticity', 'respect', 'responsibility', 'courage', 'perseverance',
    'empathy', 'humility', 'gratitude', 'balance', 'excellence'
  ];

  private static readonly GOAL_PATTERNS = [
    /\b(?:I want to|my goal is to|I aim to|working towards|hoping to|planning to|trying to)\s+([^.!?]+)/gi,
    /\b(?:my objective|my target|I aspire to|I dream of|I hope to)\s+([^.!?]+)/gi,
    /\b(?:achieve|accomplish|reach|attain|realize)\s+([^.!?]+)/gi
  ];

  private static readonly SKILL_PATTERNS = [
    /\b(?:learning to|practicing|improving at|getting better at|studying|mastering)\s+([^.!?]+)/gi,
    /\b(?:developing|building|enhancing|strengthening)\s+(?:my|the)\s+([^.!?]+)/gi,
    /\b(?:skill in|ability to|talent for)\s+([^.!?]+)/gi
  ];

  private static readonly STRUGGLE_PATTERNS = [
    /\b(?:struggling with|having trouble|difficulty with|challenged by|finding it hard to)\s+([^.!?]+)/gi,
    /\b(?:can't seem to|unable to|failing to|stuck on)\s+([^.!?]+)/gi
  ];

  // Core entity patterns (existing)
  private static readonly PERSON_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  private static readonly ORG_PATTERN = /\b[A-Z][a-zA-Z\s&.,-]{2,50}(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Organization|Foundation|Institute|University|College|School)\.?)\b/g;
  private static readonly LOCATION_PATTERN = /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:CA|NY|TX|FL|WA|OR|IL|PA|OH|MI|GA|NC|VA|NJ|AZ|TN|IN|MA|MD|WI|MN|CO|AL|SC|LA|KY|AR|UT|NV|NM|WV|NE|ID|HI|NH|ME|RI|MT|DE|SD|ND|AK|VT|WY|DC))\b/g;
  private static readonly DATE_PATTERN = /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})\b/g;
  
  // Metadata-only patterns
  private static readonly EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private static readonly PHONE_PATTERN = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
  private static readonly URL_PATTERN = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?/g;

  /**
   * Extract entities from text with growth-oriented focus
   */
  static extractEntities(text: string): NERResult {
    const startTime = performance.now();
    const allEntities: EntityMatch[] = [];

    // Extract core entities (for concept nodes)
    allEntities.push(...this.extractCoreEntities(text));
    
    // Extract growth-oriented concepts (new for V7)
    allEntities.push(...this.extractGrowthConcepts(text));
    
    // Extract metadata entities (low priority)
    allEntities.push(...this.extractMetadataEntities(text));

    // Deduplicate and sort by confidence
    const deduplicatedEntities = this.deduplicateEntities(allEntities);
    
    // Separate high-value vs metadata entities
    const conceptEntities = deduplicatedEntities.filter(entity => 
      this.isConceptEntity(entity.type)
    );
    
    const metadataEntities = deduplicatedEntities.filter(entity => 
      this.isMetadataEntity(entity.type)
    );

    const processingTime = performance.now() - startTime;

    return {
      entities: deduplicatedEntities,
      conceptEntities,
      metadataEntities,
      processingTime,
      totalEntities: deduplicatedEntities.length
    };
  }

  private static extractCoreEntities(text: string): EntityMatch[] {
    const entities: EntityMatch[] = [];

    // Person entities
    entities.push(...this.extractWithPattern(text, this.PERSON_PATTERN, EntityType.PERSON, 0.7));
    
    // Organization entities  
    entities.push(...this.extractWithPattern(text, this.ORG_PATTERN, EntityType.ORGANIZATION, 0.8));
    
    // Location entities
    entities.push(...this.extractWithPattern(text, this.LOCATION_PATTERN, EntityType.LOCATION, 0.9));
    
    // Date entities
    entities.push(...this.extractWithPattern(text, this.DATE_PATTERN, EntityType.DATE, 0.9));

    return entities;
  }

  private static extractGrowthConcepts(text: string): EntityMatch[] {
    const entities: EntityMatch[] = [];

    // Emotion keywords
    entities.push(...this.extractKeywords(text, this.EMOTION_KEYWORDS, EntityType.EMOTION, 0.8));
    
    // Value keywords
    entities.push(...this.extractKeywords(text, this.VALUE_KEYWORDS, EntityType.VALUE, 0.8));
    
    // Goal patterns
    entities.push(...this.extractPatternGroups(text, this.GOAL_PATTERNS, EntityType.GOAL, 0.7));
    
    // Skill patterns
    entities.push(...this.extractPatternGroups(text, this.SKILL_PATTERNS, EntityType.SKILL, 0.7));
    
    // Struggle patterns
    entities.push(...this.extractPatternGroups(text, this.STRUGGLE_PATTERNS, EntityType.STRUGGLE, 0.7));

    return entities;
  }

  private static extractMetadataEntities(text: string): EntityMatch[] {
    const entities: EntityMatch[] = [];

    // These are stored as metadata, not top-level concepts
    entities.push(...this.extractWithPattern(text, this.EMAIL_PATTERN, EntityType.EMAIL, 0.9));
    entities.push(...this.extractWithPattern(text, this.PHONE_PATTERN, EntityType.PHONE, 0.9));
    entities.push(...this.extractWithPattern(text, this.URL_PATTERN, EntityType.URL, 0.9));

    return entities;
  }

  private static extractWithPattern(
    text: string, 
    pattern: RegExp, 
    type: EntityType, 
    baseConfidence: number
  ): EntityMatch[] {
    const entities: EntityMatch[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const entityText = match[0].trim();
      const start = match.index;
      const end = start + entityText.length;
      
      entities.push({
        text: entityText,
        type,
        start,
        end,
        confidence: baseConfidence,
        context: this.extractContext(text, start, end)
      });
    }

    return entities;
  }

  private static extractKeywords(
    text: string, 
    keywords: string[], 
    type: EntityType, 
    baseConfidence: number
  ): EntityMatch[] {
    const entities: EntityMatch[] = [];
    const textLower = text.toLowerCase();

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      let startIndex = 0;
      
      while (true) {
        const index = textLower.indexOf(keywordLower, startIndex);
        if (index === -1) break;
        
        // Check for word boundaries
        const beforeChar = index > 0 ? text[index - 1] : ' ';
        const afterChar = index + keyword.length < text.length ? text[index + keyword.length] : ' ';
        
        if (/\W/.test(beforeChar) && /\W/.test(afterChar)) {
          entities.push({
            text: text.substring(index, index + keyword.length),
            type,
            start: index,
            end: index + keyword.length,
            confidence: baseConfidence,
            context: this.extractContext(text, index, index + keyword.length)
          });
        }
        
        startIndex = index + 1;
      }
    }

    return entities;
  }

  private static extractPatternGroups(
    text: string, 
    patterns: RegExp[], 
    type: EntityType, 
    baseConfidence: number
  ): EntityMatch[] {
    const entities: EntityMatch[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const capturedText = match[1]?.trim();
        if (capturedText && capturedText.length > 0) {
          const start = match.index + match[0].indexOf(capturedText);
          const end = start + capturedText.length;
          
          entities.push({
            text: capturedText,
            type,
            start,
            end,
            confidence: baseConfidence,
            context: this.extractContext(text, start, end)
          });
        }
      }
    }

    return entities;
  }

  private static extractContext(text: string, start: number, end: number): string {
    const contextStart = Math.max(0, start - 25);
    const contextEnd = Math.min(text.length, end + 25);
    return text.substring(contextStart, contextEnd);
  }

  private static deduplicateEntities(entities: EntityMatch[]): EntityMatch[] {
    const deduplicated: EntityMatch[] = [];
    
    // Sort by start position first
    const sorted = entities.sort((a, b) => a.start - b.start);
    
    for (const entity of sorted) {
      // Check if this entity overlaps with any previously added entity
      const hasOverlap = deduplicated.some(existing => 
        this.entitiesOverlap(entity, existing)
      );
      
      if (!hasOverlap) {
        deduplicated.push(entity);
      } else {
        // Keep the one with higher confidence
        const overlappingIndex = deduplicated.findIndex(existing => 
          this.entitiesOverlap(entity, existing)
        );
        
        if (overlappingIndex >= 0 && entity.confidence > deduplicated[overlappingIndex].confidence) {
          deduplicated[overlappingIndex] = entity;
        }
      }
    }
    
    // Sort by confidence (highest first)
    return deduplicated.sort((a, b) => b.confidence - a.confidence);
  }

  private static entitiesOverlap(a: EntityMatch, b: EntityMatch): boolean {
    return !(a.end <= b.start || b.end <= a.start);
  }

  private static isConceptEntity(type: EntityType): boolean {
    return [
      EntityType.PERSON,
      EntityType.ORGANIZATION,
      EntityType.LOCATION,
      EntityType.DATE,
      EntityType.EMOTION,
      EntityType.VALUE,
      EntityType.GOAL,
      EntityType.SKILL,
      EntityType.STRUGGLE,
      EntityType.ASPIRATION
    ].includes(type);
  }

  private static isMetadataEntity(type: EntityType): boolean {
    return [
      EntityType.EMAIL,
      EntityType.PHONE,
      EntityType.URL
    ].includes(type);
  }
} 