/**
 * CardRepository.ts
 * V9.7 Repository for Card operations
 */

import { Card, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface CreateCardData {
  user_id: string;
  card_type: string;
  source_entity_id: string;
  source_entity_type: string;
  display_data?: Prisma.InputJsonValue;
}

export interface UpdateCardData {
  status?: string;
  is_favorited?: boolean;
  display_data?: Prisma.InputJsonValue;
  is_synced?: boolean;
}

export class CardRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateCardData): Promise<Card> {
    return this.db.prisma.card.create({
      data,
    });
  }

  async findById(cardId: string): Promise<Card | null> {
    return this.db.prisma.card.findUnique({
      where: { card_id: cardId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Card[]> {
    return this.db.prisma.card.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findActiveByUserId(userId: string, limit = 50): Promise<Card[]> {
    return this.db.prisma.card.findMany({
      where: {
        user_id: userId,
        status: 'active_canvas',
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findArchivedByUserId(userId: string, limit = 50): Promise<Card[]> {
    return this.db.prisma.card.findMany({
      where: {
        user_id: userId,
        status: 'active_archive',
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findFavoritedByUserId(userId: string): Promise<Card[]> {
    return this.db.prisma.card.findMany({
      where: {
        user_id: userId,
        is_favorited: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceEntity(sourceEntityId: string, sourceEntityType: string): Promise<Card[]> {
    return this.db.prisma.card.findMany({
      where: {
        source_entity_id: sourceEntityId,
        source_entity_type: sourceEntityType,
      },
    });
  }

  async update(cardId: string, data: UpdateCardData): Promise<Card> {
    return this.db.prisma.card.update({
      where: { card_id: cardId },
      data,
    });
  }

  async archive(cardId: string): Promise<Card> {
    return this.db.prisma.card.update({
      where: { card_id: cardId },
      data: { status: 'active_archive' },
    });
  }

  async complete(cardId: string): Promise<Card> {
    return this.db.prisma.card.update({
      where: { card_id: cardId },
      data: { status: 'completed' },
    });
  }

  async favorite(cardId: string, favorited = true): Promise<Card> {
    return this.db.prisma.card.update({
      where: { card_id: cardId },
      data: { is_favorited: favorited },
    });
  }

  async markSynced(cardId: string, synced = true): Promise<Card> {
    return this.db.prisma.card.update({
      where: { card_id: cardId },
      data: { is_synced: synced },
    });
  }

  async delete(cardId: string): Promise<void> {
    await this.db.prisma.card.delete({
      where: { card_id: cardId },
    });
  }

  async findByType(userId: string, cardType: string, limit = 50): Promise<Card[]> {
    return this.db.prisma.card.findMany({
      where: {
        user_id: userId,
        card_type: cardType,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(userId?: string, status?: string): Promise<number> {
    return this.db.prisma.card.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(status && { status }),
      },
    });
  }

  async findUnsyncedByUserId(userId: string): Promise<Card[]> {
    return this.db.prisma.card.findMany({
      where: {
        user_id: userId,
        is_synced: false,
      },
      orderBy: { created_at: 'asc' },
    });
  }
} 