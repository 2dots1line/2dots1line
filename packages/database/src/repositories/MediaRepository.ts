/**
 * MediaRepository.ts
 * V9.7 Repository for Media operations
 */

import { Media, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface CreateMediaData {
  user_id: string;
  memory_unit_id?: string;
  type: string;
  storage_url: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  hash?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateMediaData {
  processing_status?: string;
  metadata?: Prisma.InputJsonValue;
}

export class MediaRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateMediaData): Promise<Media> {
    return this.db.prisma.media.create({
      data,
    });
  }

  async findById(mediaId: string): Promise<Media | null> {
    return this.db.prisma.media.findUnique({
      where: { media_id: mediaId },
      include: {
        memory_unit: true,
      },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Media[]> {
    return this.db.prisma.media.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByMemoryUnit(memoryUnitId: string): Promise<Media[]> {
    return this.db.prisma.media.findMany({
      where: { memory_unit_id: memoryUnitId },
      orderBy: { created_at: 'asc' },
    });
  }

  async findByType(userId: string, type: string, limit = 50): Promise<Media[]> {
    return this.db.prisma.media.findMany({
      where: {
        user_id: userId,
        type,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByProcessingStatus(status: string, limit = 50): Promise<Media[]> {
    return this.db.prisma.media.findMany({
      where: { processing_status: status },
      take: limit,
      orderBy: { created_at: 'asc' },
    });
  }

  async findByHash(hash: string): Promise<Media | null> {
    return this.db.prisma.media.findUnique({
      where: { hash },
    });
  }

  async update(mediaId: string, data: UpdateMediaData): Promise<Media> {
    return this.db.prisma.media.update({
      where: { media_id: mediaId },
      data,
    });
  }

  async updateProcessingStatus(mediaId: string, status: string): Promise<Media> {
    return this.db.prisma.media.update({
      where: { media_id: mediaId },
      data: { processing_status: status },
    });
  }

  async delete(mediaId: string): Promise<void> {
    await this.db.prisma.media.delete({
      where: { media_id: mediaId },
    });
  }

  async count(userId?: string, type?: string): Promise<number> {
    return this.db.prisma.media.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(type && { type }),
      },
    });
  }

  async getTotalSizeByUser(userId: string): Promise<number> {
    const result = await this.db.prisma.media.aggregate({
      where: { user_id: userId },
      _sum: { size_bytes: true },
    });
    return result._sum.size_bytes || 0;
  }
} 