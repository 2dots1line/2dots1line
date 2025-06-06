import { PrismaClient, Prisma } from '../prisma-client';
import { DatabaseService } from '../index';

export interface CreateConceptData {
  user_id: string;
  name: string;
  type: string;
  description?: string;
  confidence?: number;
  metadata?: any;
}

export interface CreateConceptRelationshipData {
  user_id: string;
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: string;
  strength?: number;
  context_muid?: string;
  metadata?: any;
}

export interface CreateConceptInput {
  name: string;
  type: string;
  description?: string;
  metadata?: any;
}

export interface UpdateConceptInput {
  name?: string;
  type?: string;
  description?: string;
  confidence?: number;
  metadata?: any;
}

export class ConceptRepository {
  private prisma: PrismaClient;

  constructor(private databaseService: DatabaseService) {
    this.prisma = databaseService.prisma;
  }

  /**
   * Create or find an existing concept
   */
  async createOrFindConcept(data: CreateConceptData) {
    try {
      // First try to find existing concept by name and type for the user
      const existing = await this.prisma.concept.findFirst({
        where: {
          user_id: data.user_id,
          name: data.name,
          type: data.type,
        },
      });

      if (existing) {
        // Update existing concept with new data if provided
        const updateData: any = {
          description: data.description || existing.description,
          confidence: data.confidence ?? existing.confidence,
          last_updated_ts: new Date(),
        };
        
        if (data.metadata !== undefined) {
          updateData.metadata = data.metadata;
        }
        
        return await this.prisma.concept.update({
          where: { concept_id: existing.concept_id },
          data: updateData,
        });
      }

      // Create new concept
      return await this.prisma.concept.create({
        data: {
          user_id: data.user_id,
          name: data.name,
          type: data.type,
          description: data.description,
          confidence: data.confidence,
          metadata: data.metadata,
          user_defined: false, // Default to AI-generated
          created_at: new Date(),
          last_updated_ts: new Date(),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Concept with this name and type already exists.');
      }
      throw error;
    }
  }

  /**
   * Get concept by ID
   */
  async getConceptById(conceptId: string, userId: string) {
    return await this.prisma.concept.findFirst({
      where: {
        concept_id: conceptId,
        user_id: userId,
      },
    });
  }

  /**
   * Get concepts for a user
   */
  async getConceptsForUser(userId: string, type?: string, limit: number = 50, offset: number = 0) {
    const where: any = { user_id: userId };
    if (type) {
      where.type = type;
    }

    return await this.prisma.concept.findMany({
      where,
      orderBy: { last_updated_ts: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Search concepts by name
   */
  async searchConceptsByName(userId: string, searchTerm: string, limit: number = 20) {
    return await this.prisma.concept.findMany({
      where: {
        user_id: userId,
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { confidence: 'desc' },
      take: limit,
    });
  }

  /**
   * Create a relationship between concepts - DEPRECATED: Use Neo4j for relationships
   * This method is kept for backward compatibility but should not be used
   */
  async createConceptRelationship(data: CreateConceptRelationshipData) {
    throw new Error('Concept relationships are now handled by Neo4j. Use Neo4j repository instead.');
  }

  /**
   * Get relationships for a concept - DEPRECATED: Use Neo4j for relationships
   * This method is kept for backward compatibility but should not be used
   */
  async getConceptRelationships(conceptId: string, userId: string) {
    throw new Error('Concept relationships are now handled by Neo4j. Use Neo4j repository instead.');
  }

  /**
   * Delete concept (soft delete by setting confidence to 0)
   */
  async softDeleteConcept(conceptId: string, userId: string) {
    return await this.prisma.concept.update({
      where: { concept_id: conceptId },
      data: {
        confidence: 0,
        last_updated_ts: new Date(),
      },
    });
  }

  /**
   * Update concept confidence
   */
  async updateConceptConfidence(conceptId: string, confidence: number) {
    return await this.prisma.concept.update({
      where: { concept_id: conceptId },
      data: {
        confidence,
        last_updated_ts: new Date(),
      },
    });
  }
} 