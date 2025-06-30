"use strict";
/**
 * MediaRepository.ts
 * V9.7 Repository for Media operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaRepository = void 0;
class MediaRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.media.create({
            data,
        });
    }
    async findById(mediaId) {
        return this.db.prisma.media.findUnique({
            where: { media_id: mediaId },
            include: {
                memory_unit: true,
            },
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.media.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
        });
    }
    async findByMemoryUnit(memoryUnitId) {
        return this.db.prisma.media.findMany({
            where: { memory_unit_id: memoryUnitId },
            orderBy: { created_at: 'asc' },
        });
    }
    async findByType(userId, type, limit = 50) {
        return this.db.prisma.media.findMany({
            where: {
                user_id: userId,
                type,
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async findByProcessingStatus(status, limit = 50) {
        return this.db.prisma.media.findMany({
            where: { processing_status: status },
            take: limit,
            orderBy: { created_at: 'asc' },
        });
    }
    async findByHash(hash) {
        return this.db.prisma.media.findUnique({
            where: { hash },
        });
    }
    async update(mediaId, data) {
        return this.db.prisma.media.update({
            where: { media_id: mediaId },
            data,
        });
    }
    async updateProcessingStatus(mediaId, status) {
        return this.db.prisma.media.update({
            where: { media_id: mediaId },
            data: { processing_status: status },
        });
    }
    async delete(mediaId) {
        await this.db.prisma.media.delete({
            where: { media_id: mediaId },
        });
    }
    async count(userId, type) {
        return this.db.prisma.media.count({
            where: {
                ...(userId && { user_id: userId }),
                ...(type && { type }),
            },
        });
    }
    async getTotalSizeByUser(userId) {
        const result = await this.db.prisma.media.aggregate({
            where: { user_id: userId },
            _sum: { size_bytes: true },
        });
        return result._sum.size_bytes || 0;
    }
}
exports.MediaRepository = MediaRepository;
//# sourceMappingURL=MediaRepository.js.map