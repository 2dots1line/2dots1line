"use strict";
/**
 * ConceptRepository.ts
 * V9.7 Repository for Concept operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConceptRepository = void 0;
class ConceptRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.concept.create({
            data,
        });
    }
    async findById(conceptId) {
        return this.db.prisma.concept.findUnique({
            where: { concept_id: conceptId },
            include: {
                community: true,
                merged_into_concept: true,
                merged_from_concepts: true,
                derived_artifacts_as_source: true,
            },
        });
    }
    /**
     * Batch method for HybridRetrievalTool - find multiple concepts by IDs
     */
    async findByIds(conceptIds, userId) {
        return this.db.prisma.concept.findMany({
            where: {
                concept_id: { in: conceptIds },
                user_id: userId,
                status: 'active'
            },
            include: {
                community: true,
                merged_into_concept: true,
                merged_from_concepts: true,
                derived_artifacts_as_source: true,
            },
            orderBy: { salience: 'desc' }
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.concept.findMany({
            where: {
                user_id: userId,
                status: 'active',
            },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
            include: {
                community: true,
            },
        });
    }
    async findByNameAndType(userId, name, type) {
        return this.db.prisma.concept.findUnique({
            where: {
                user_id_name_type: {
                    user_id: userId,
                    name,
                    type,
                },
            },
        });
    }
    async findByType(userId, type, limit = 50) {
        return this.db.prisma.concept.findMany({
            where: {
                user_id: userId,
                type,
                status: 'active',
            },
            take: limit,
            orderBy: { salience: 'desc' },
        });
    }
    async findByCommunity(communityId) {
        return this.db.prisma.concept.findMany({
            where: {
                community_id: communityId,
                status: 'active',
            },
            orderBy: { salience: 'desc' },
        });
    }
    async update(conceptId, data) {
        return this.db.prisma.concept.update({
            where: { concept_id: conceptId },
            data,
        });
    }
    async mergeConcept(sourceConceptId, targetConceptId) {
        return this.db.prisma.concept.update({
            where: { concept_id: sourceConceptId },
            data: {
                status: 'merged',
                merged_into_concept_id: targetConceptId,
            },
        });
    }
    async archiveConcept(conceptId) {
        return this.db.prisma.concept.update({
            where: { concept_id: conceptId },
            data: { status: 'archived' },
        });
    }
    async delete(conceptId) {
        await this.db.prisma.concept.delete({
            where: { concept_id: conceptId },
        });
    }
    async findBySalienceRange(userId, minSalience, maxSalience, limit = 50) {
        return this.db.prisma.concept.findMany({
            where: {
                user_id: userId,
                status: 'active',
                salience: {
                    gte: minSalience,
                    lte: maxSalience,
                },
            },
            take: limit,
            orderBy: { salience: 'desc' },
        });
    }
    async searchByName(userId, searchTerm, limit = 50) {
        return this.db.prisma.concept.findMany({
            where: {
                user_id: userId,
                status: 'active',
                name: { contains: searchTerm, mode: 'insensitive' },
            },
            take: limit,
            orderBy: { salience: 'desc' },
        });
    }
    async findMostSalient(userId, limit = 10) {
        return this.db.prisma.concept.findMany({
            where: {
                user_id: userId,
                status: 'active',
                salience: { not: null },
            },
            take: limit,
            orderBy: { salience: 'desc' },
        });
    }
    async count(userId, status) {
        return this.db.prisma.concept.count({
            where: {
                ...(userId && { user_id: userId }),
                ...(status && { status }),
            },
        });
    }
    async findRecentlyUpdated(userId, days = 7, limit = 50) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        return this.db.prisma.concept.findMany({
            where: {
                user_id: userId,
                status: 'active',
                last_updated_ts: {
                    gte: dateThreshold,
                },
            },
            take: limit,
            orderBy: { last_updated_ts: 'desc' },
        });
    }
}
exports.ConceptRepository = ConceptRepository;
//# sourceMappingURL=ConceptRepository.js.map