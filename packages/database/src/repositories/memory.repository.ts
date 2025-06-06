import { PrismaClient } from '../prisma-client';
import { DatabaseService } from '../index';

export interface CreateMemoryUnitData {
  user_id: string;
  source_type: string;
  title?: string;
  content?: string; // For raw content
  tier?: number;
  importance_score?: number;
  is_private?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateChunkData {
  muid: string;
  user_id: string;
  text: string;
  sequence_order: number;
  role?: string;
  metadata?: Record<string, any>;
}

export class MemoryRepository {
  private prisma: PrismaClient;

  constructor(private databaseService: DatabaseService) {
    this.prisma = databaseService.prisma;
  }

  /**
   * Create a new memory unit
   */
  async createMemoryUnit(data: CreateMemoryUnitData) {
    try {
      // Create the memory unit without content field
      const memoryUnit = await this.prisma.memoryUnit.create({
        data: {
          user_id: data.user_id,
          source_type: data.source_type,
          title: data.title,
          creation_ts: new Date(),
          processing_status: 'raw',
          tier: data.tier || 1,
          importance_score: data.importance_score,
          is_private: data.is_private ?? true,
          metadata: data.metadata,
        },
      });

      // If content is provided, store it in the content field or skip raw_content creation
      // Note: raw_content table may not exist in current schema
      // if (data.content) {
      //   await this.prisma.raw_content.create({
      //     data: {
      //       muid: memoryUnit.muid,
      //       user_id: data.user_id,
      //       content_type: 'text',
      //       content: data.content,
      //       creation_ts: new Date(),
      //     },
      //   });
      // }

      return memoryUnit;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Memory unit with this ID already exists.');
      }
      throw error;
    }
  }

  /**
   * Create a chunk linked to a memory unit
   */
  async createChunk(data: CreateChunkData) {
    try {
      return await this.prisma.chunk.create({
        data: {
          muid: data.muid,
          user_id: data.user_id,
          text_content: data.text,
          sequence_order: data.sequence_order,
          role: data.role,
          char_count: data.text.length,
          token_count: Math.ceil(data.text.length / 4), // Rough token estimate
          metadata: data.metadata,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new Error('Referenced memory unit does not exist.');
      }
      throw error;
    }
  }

  /**
   * Get memory units for a user
   */
  async getMemoryUnitsForUser(userId: string, limit: number = 20, offset: number = 0) {
    return await this.prisma.memoryUnit.findMany({
      where: { user_id: userId },
      include: {
        chunks: {
          orderBy: { sequence_order: 'asc' },
        },
      },
      orderBy: { creation_ts: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get memory unit by ID
   */
  async getMemoryUnitById(muid: string, userId: string) {
    return await this.prisma.memoryUnit.findFirst({
      where: { 
        muid,
        user_id: userId,
      },
      include: {
        chunks: {
          orderBy: { sequence_order: 'asc' },
        },
      },
    });
  }

  /**
   * Update memory unit processing status
   */
  async updateMemoryUnitStatus(muid: string, status: string) {
    return await this.prisma.memoryUnit.update({
      where: { muid },
      data: { 
        processing_status: status,
        last_modified_ts: new Date(),
      },
    });
  }

  /**
   * Get chunks for a memory unit
   */
  async getChunksForMemoryUnit(muid: string) {
    return await this.prisma.chunk.findMany({
      where: { muid },
      orderBy: { sequence_order: 'asc' },
    });
  }

  /**
   * Update memory unit metadata
   */
  async updateMemoryUnitMetadata(muid: string, metadataKey: string, metadataValue: any) {
    // Get current metadata
    const memoryUnit = await this.prisma.memoryUnit.findUnique({
      where: { muid },
      select: { metadata: true },
    });

    if (!memoryUnit) {
      throw new Error(`Memory unit with ID ${muid} not found`);
    }

    // Merge new metadata with existing
    const currentMetadata = (memoryUnit.metadata as Record<string, any>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      [metadataKey]: metadataValue,
    };

    return await this.prisma.memoryUnit.update({
      where: { muid },
      data: { 
        metadata: updatedMetadata,
        last_modified_ts: new Date(),
      },
    });
  }
} 