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
    processing_status?: string;
    metadata?: Prisma.InputJsonValue;
}
export interface UpdateMediaData {
    processing_status?: string;
    metadata?: Prisma.InputJsonValue;
}
export declare class MediaRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateMediaData): Promise<Media>;
    findById(mediaId: string): Promise<Media | null>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<Media[]>;
    findByMemoryUnit(memoryUnitId: string): Promise<Media[]>;
    findByType(userId: string, type: string, limit?: number): Promise<Media[]>;
    findByProcessingStatus(status: string, limit?: number): Promise<Media[]>;
    findByHash(hash: string): Promise<Media | null>;
    update(mediaId: string, data: UpdateMediaData): Promise<Media>;
    updateProcessingStatus(mediaId: string, status: string): Promise<Media>;
    delete(mediaId: string): Promise<void>;
    count(userId?: string, type?: string): Promise<number>;
    getTotalSizeByUser(userId: string): Promise<number>;
}
//# sourceMappingURL=MediaRepository.d.ts.map