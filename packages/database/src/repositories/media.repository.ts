/**
 * Media Repository
 * Handles media file persistence and metadata
 */

import { PrismaClient, Prisma, Media } from '../prisma-client';

export interface CreateMediaInput {
  muid?: string; // Optional memory unit link
  user_id: string;
  type: string;
  storage_url: string;
  original_name?: string;
  mime_type?: string;
  file_size_bytes?: number;
  hash_value?: string;
}

export interface UpdateMediaInput {
  extraction_status?: string;
  extracted_text?: string;
  metadata?: any;
}

export class MediaRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new media record
   */
  async createMedia(input: CreateMediaInput): Promise<Media> {
    return await this.prisma.media.create({
      data: {
        muid: input.muid,
        user_id: input.user_id,
        type: input.type,
        storage_url: input.storage_url,
        original_name: input.original_name,
        mime_type: input.mime_type,
        file_size_bytes: input.file_size_bytes,
        hash_value: input.hash_value,
        processing_status: 'pending',
        created_at: new Date(),
        metadata: {}
      }
    });
  }

  /**
   * Get media by ID
   */
  async getMedia(mediaId: string): Promise<Media | null> {
    return await this.prisma.media.findUnique({
      where: { id: mediaId }
    });
  }

  /**
   * Get media by user
   */
  async getUserMedia(
    userId: string, 
    type?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Media[]> {
    const where: any = { user_id: userId };
    if (type) {
      where.type = type;
    }

    return await this.prisma.media.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Update media processing status and metadata
   */
  async updateMedia(mediaId: string, input: UpdateMediaInput): Promise<Media> {
    return await this.prisma.media.update({
      where: { id: mediaId },
      data: {
        processing_status: input.extraction_status,
        extracted_text: input.extracted_text,
        metadata: input.metadata
      }
    });
  }

  /**
   * Mark media as processed with extracted text
   */
  async markAsProcessed(
    mediaId: string, 
    extractedText?: string,
    metadata?: any
  ): Promise<Media> {
    return await this.updateMedia(mediaId, {
      extraction_status: 'completed',
      extracted_text: extractedText,
      metadata
    });
  }

  /**
   * Mark media as failed processing
   */
  async markAsFailed(mediaId: string, error: string): Promise<Media> {
    return await this.updateMedia(mediaId, {
      extraction_status: 'failed',
      metadata: { error }
    });
  }

  /**
   * Get pending media for processing
   */
  async getPendingMedia(limit: number = 10): Promise<Media[]> {
    return await this.prisma.media.findMany({
      where: { processing_status: 'pending' },
      orderBy: { created_at: 'asc' },
      take: limit
    });
  }

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string): Promise<void> {
    await this.prisma.media.delete({
      where: { id: mediaId }
    });
  }
} 