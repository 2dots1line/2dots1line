"use strict";
/**
 * DerivedArtifactRepository.ts
 * V9.7 Repository for DerivedArtifact operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DerivedArtifactRepository = void 0;
class DerivedArtifactRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.derivedArtifact.create({
            data,
        });
    }
    async findById(artifactId) {
        return this.db.prisma.derivedArtifact.findUnique({
            where: { artifact_id: artifactId },
            include: {
                source_memory_unit: true,
                source_concept: true,
            },
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.derivedArtifact.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
        });
    }
    async findByType(userId, artifactType, limit = 50) {
        return this.db.prisma.derivedArtifact.findMany({
            where: {
                user_id: userId,
                artifact_type: artifactType,
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async findBySourceMemoryUnit(memoryUnitId) {
        return this.db.prisma.derivedArtifact.findMany({
            where: { source_memory_unit_id: memoryUnitId },
            orderBy: { created_at: 'desc' },
        });
    }
    async findBySourceConcept(conceptId) {
        return this.db.prisma.derivedArtifact.findMany({
            where: { source_concept_id: conceptId },
            orderBy: { created_at: 'desc' },
        });
    }
    async update(artifactId, data) {
        return this.db.prisma.derivedArtifact.update({
            where: { artifact_id: artifactId },
            data,
        });
    }
    async delete(artifactId) {
        await this.db.prisma.derivedArtifact.delete({
            where: { artifact_id: artifactId },
        });
    }
    async count(userId, artifactType) {
        return this.db.prisma.derivedArtifact.count({
            where: {
                ...(userId && { user_id: userId }),
                ...(artifactType && { artifact_type: artifactType }),
            },
        });
    }
}
exports.DerivedArtifactRepository = DerivedArtifactRepository;
//# sourceMappingURL=DerivedArtifactRepository.js.map