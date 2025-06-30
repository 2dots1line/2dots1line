/**
 * DerivedArtifactRepository.ts
 * V9.7 Repository for DerivedArtifact operations
 */
import { DerivedArtifact, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
export interface CreateDerivedArtifactData {
    user_id: string;
    artifact_type: string;
    title: string;
    content_narrative?: string;
    content_data?: Prisma.InputJsonValue;
    source_memory_unit_id?: string;
    source_concept_id?: string;
}
export interface UpdateDerivedArtifactData {
    title?: string;
    content_narrative?: string;
    content_data?: Prisma.InputJsonValue;
}
export declare class DerivedArtifactRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateDerivedArtifactData): Promise<DerivedArtifact>;
    findById(artifactId: string): Promise<DerivedArtifact | null>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<DerivedArtifact[]>;
    findByType(userId: string, artifactType: string, limit?: number): Promise<DerivedArtifact[]>;
    findBySourceMemoryUnit(memoryUnitId: string): Promise<DerivedArtifact[]>;
    findBySourceConcept(conceptId: string): Promise<DerivedArtifact[]>;
    update(artifactId: string, data: UpdateDerivedArtifactData): Promise<DerivedArtifact>;
    delete(artifactId: string): Promise<void>;
    count(userId?: string, artifactType?: string): Promise<number>;
}
//# sourceMappingURL=DerivedArtifactRepository.d.ts.map