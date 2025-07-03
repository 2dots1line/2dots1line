/**
 * MediaRepository.ts
 * V9.7 Repository for Media operations
 */

import type { media_items, Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateMediaData {
  user_id: string;
  memory_unit_id?: string;
  type: string;
  storage_url: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  hash?: string;
  processing_status?: string;
  metadata?: any;
}

export interface UpdateMediaData {
  processing_status?: string;
  metadata?: any;
}

export class MediaRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateMediaData): Promise<media_items> {
    return this.db.prisma.media_items.create({
      data: {
        media_id: randomUUID(),
        ...data,
      },
    });
  }

  async findById(mediaId: string): Promise<media_items | null> {
    return this.db.prisma.media_items.findUnique({
      where: { media_id: mediaId },
      include: {
        memory_units: true,
      },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<media_items[]> {
    return this.db.prisma.media_items.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByMemoryUnit(memoryUnitId: string): Promise<media_items[]> {
    return this.db.prisma.media_items.findMany({
      where: { memory_unit_id: memoryUnitId },
      orderBy: { created_at: 'asc' },
    });
  }

  async findByType(userId: string, type: string, limit = 50): Promise<media_items[]> {
    return this.db.prisma.media_items.findMany({
      where: {
        user_id: userId,
        type,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByProcessingStatus(status: string, limit = 50): Promise<media_items[]> {
    return this.db.prisma.media_items.findMany({
      where: { processing_status: status },
      take: limit,
      orderBy: { created_at: 'asc' },
    });
  }

  async findByHash(hash: string): Promise<media_items | null> {
    return this.db.prisma.media_items.findUnique({
      where: { hash },
    });
  }

  async update(mediaId: string, data: UpdateMediaData): Promise<media_items> {
    return this.db.prisma.media_items.update({
      where: { media_id: mediaId },
      data,
    });
  }

  async updateProcessingStatus(mediaId: string, status: string): Promise<media_items> {
    return this.db.prisma.media_items.update({
      where: { media_id: mediaId },
      data: { processing_status: status },
    });
  }

  async delete(mediaId: string): Promise<void> {
    await this.db.prisma.media_items.delete({
      where: { media_id: mediaId },
    });
  }

  async count(userId?: string, type?: string): Promise<number> {
    return this.db.prisma.media_items.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(type && { type }),
      },
    });
  }

  async getTotalSizeByUser(userId: string): Promise<number> {
    const result = await this.db.prisma.media_items.aggregate({
      where: { user_id: userId },
      _sum: { size_bytes: true },
    });
    return result._sum.size_bytes || 0;
  }
} 