/**
 * GeneratedMediaRepository.ts
 * Repository for managing AI-generated media (images and videos)
 * V11.0 - AI Media Generation Suite
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface GeneratedMedia {
  id: string;
  userId: string;
  mediaType: 'image' | 'video';
  fileUrl: string;
  filePath: string;
  prompt: string;
  metadata: Record<string, any>;
  viewContext?: string;
  generationCost?: number;
  generationDurationSeconds?: number;
  provider?: string;
  model?: string;
  createdAt: Date;
}

export interface CreateGeneratedMediaInput {
  userId: string;
  mediaType: 'image' | 'video';
  fileUrl: string;
  filePath: string;
  prompt: string;
  metadata?: Record<string, any>;
  viewContext?: string;
  generationCost?: number;
  generationDurationSeconds?: number;
  provider?: string;
  model?: string;
}

export class GeneratedMediaRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = DatabaseService.getInstance().prisma;
  }

  /**
   * Create a new generated media record
   */
  async createGeneratedMedia(data: CreateGeneratedMediaInput): Promise<GeneratedMedia> {
    const result = await this.prisma.$queryRaw<any[]>`
      INSERT INTO generated_media (
        user_id,
        media_type,
        file_url,
        file_path,
        prompt,
        metadata,
        view_context,
        generation_cost,
        generation_duration_seconds,
        provider,
        model
      ) VALUES (
        ${data.userId},
        ${data.mediaType},
        ${data.fileUrl},
        ${data.filePath},
        ${data.prompt},
        ${Prisma.raw(`'${JSON.stringify(data.metadata || {})}'::jsonb`)},
        ${data.viewContext || null},
        ${data.generationCost || null},
        ${data.generationDurationSeconds || null},
        ${data.provider || null},
        ${data.model || null}
      )
      RETURNING *
    `;

    return this.mapToGeneratedMedia(result[0]);
  }

  /**
   * Get all generated videos for a user
   */
  async getUserGeneratedVideos(userId: string): Promise<GeneratedMedia[]> {
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM generated_media
      WHERE user_id = ${userId}
        AND media_type = 'video'
      ORDER BY created_at DESC
    `;

    return results.map(r => this.mapToGeneratedMedia(r));
  }

  /**
   * Get all generated images for a user
   */
  async getUserGeneratedImages(userId: string): Promise<GeneratedMedia[]> {
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM generated_media
      WHERE user_id = ${userId}
        AND media_type = 'image'
      ORDER BY created_at DESC
    `;

    return results.map(r => this.mapToGeneratedMedia(r));
  }

  /**
   * Get all generated media for a user (both images and videos)
   */
  async getUserGeneratedMedia(userId: string, mediaType?: 'image' | 'video'): Promise<GeneratedMedia[]> {
    if (mediaType) {
      return mediaType === 'video'
        ? this.getUserGeneratedVideos(userId)
        : this.getUserGeneratedImages(userId);
    }

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM generated_media
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return results.map(r => this.mapToGeneratedMedia(r));
  }

  /**
   * Get generated media by ID
   */
  async getGeneratedMediaById(id: string): Promise<GeneratedMedia | null> {
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT *
      FROM generated_media
      WHERE id = ${id}${Prisma.raw('::uuid')}
      LIMIT 1
    `;

    return results.length > 0 ? this.mapToGeneratedMedia(results[0]) : null;
  }

  /**
   * Delete generated media by ID
   * Returns true if deleted, false if not found
   */
  async deleteGeneratedMedia(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.$executeRaw`
      DELETE FROM generated_media
      WHERE id = ${id}${Prisma.raw('::uuid')}
        AND user_id = ${userId}
    `;

    return result > 0;
  }

  /**
   * Get total count of generated media for a user
   */
  async getUserMediaCount(userId: string, mediaType?: 'image' | 'video'): Promise<number> {
    const results = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM generated_media
      WHERE user_id = ${userId}
        ${mediaType ? Prisma.sql`AND media_type = ${mediaType}` : Prisma.empty}
    `;

    return Number(results[0]?.count || 0);
  }

  /**
   * Get total generation cost for a user
   */
  async getUserTotalCost(userId: string): Promise<number> {
    const results = await this.prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(generation_cost), 0) as total
      FROM generated_media
      WHERE user_id = ${userId}
        AND generation_cost IS NOT NULL
    `;

    return results[0]?.total || 0;
  }

  /**
   * Map database row to GeneratedMedia interface
   */
  private mapToGeneratedMedia(row: any): GeneratedMedia {
    return {
      id: row.id,
      userId: row.user_id,
      mediaType: row.media_type,
      fileUrl: row.file_url,
      filePath: row.file_path,
      prompt: row.prompt,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      viewContext: row.view_context,
      generationCost: row.generation_cost ? parseFloat(row.generation_cost) : undefined,
      generationDurationSeconds: row.generation_duration_seconds,
      provider: row.provider,
      model: row.model,
      createdAt: new Date(row.created_at)
    };
  }
}

