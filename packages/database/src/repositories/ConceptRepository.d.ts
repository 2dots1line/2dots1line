/**
 * ConceptRepository.ts
 * V9.7 Repository for Concept operations
 */
import { Concept } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
export interface CreateConceptData {
    user_id: string;
    name: string;
    type: string;
    description?: string;
    salience?: number;
    community_id?: string;
}
export interface UpdateConceptData {
    name?: string;
    type?: string;
    description?: string;
    status?: string;
    salience?: number;
    community_id?: string;
    merged_into_concept_id?: string;
}
export declare class ConceptRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateConceptData): Promise<Concept>;
    findById(conceptId: string): Promise<Concept | null>;
    /**
     * Batch method for HybridRetrievalTool - find multiple concepts by IDs
     */
    findByIds(conceptIds: string[], userId: string): Promise<Concept[]>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<Concept[]>;
    findByNameAndType(userId: string, name: string, type: string): Promise<Concept | null>;
    findByType(userId: string, type: string, limit?: number): Promise<Concept[]>;
    findByCommunity(communityId: string): Promise<Concept[]>;
    update(conceptId: string, data: UpdateConceptData): Promise<Concept>;
    mergeConcept(sourceConceptId: string, targetConceptId: string): Promise<Concept>;
    archiveConcept(conceptId: string): Promise<Concept>;
    delete(conceptId: string): Promise<void>;
    findBySalienceRange(userId: string, minSalience: number, maxSalience: number, limit?: number): Promise<Concept[]>;
    searchByName(userId: string, searchTerm: string, limit?: number): Promise<Concept[]>;
    findMostSalient(userId: string, limit?: number): Promise<Concept[]>;
    count(userId?: string, status?: string): Promise<number>;
    findRecentlyUpdated(userId: string, days?: number, limit?: number): Promise<Concept[]>;
}
//# sourceMappingURL=ConceptRepository.d.ts.map