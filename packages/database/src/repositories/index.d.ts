/**
 * Repositories Index - V9.7
 * Exports all repository classes and interfaces
 */
export * from './UserRepository';
export type { CreateUserData, UpdateUserData } from './UserRepository';
export * from './ConversationRepository';
export type { CreateConversationData, CreateMessageData, UpdateConversationData, ConversationSummary } from './ConversationRepository';
export * from './MemoryRepository';
export type { CreateMemoryUnitData, UpdateMemoryUnitData } from './MemoryRepository';
export * from './ConceptRepository';
export type { CreateConceptData, UpdateConceptData } from './ConceptRepository';
export * from './CardRepository';
export type { CreateCardData, UpdateCardData } from './CardRepository';
export * from './MediaRepository';
export type { CreateMediaData, UpdateMediaData } from './MediaRepository';
export { DerivedArtifactRepository } from './DerivedArtifactRepository';
export type { CreateDerivedArtifactData, UpdateDerivedArtifactData } from './DerivedArtifactRepository';
export * from './GrowthEventRepository';
export type { CreateGrowthEventData } from './GrowthEventRepository';
export { InteractionLogRepository } from './InteractionLogRepository';
export type { CreateInteractionLogData } from './InteractionLogRepository';
export { ProactivePromptRepository } from './ProactivePromptRepository';
export type { CreateProactivePromptData, UpdateProactivePromptData } from './ProactivePromptRepository';
export type { CardData, CardFilters, CardResultWithMeta } from './CardRepository';
import { DatabaseService } from '../DatabaseService';
import { UserRepository } from './UserRepository';
import { ConversationRepository } from './ConversationRepository';
import { MemoryRepository } from './MemoryRepository';
import { ConceptRepository } from './ConceptRepository';
import { CardRepository } from './CardRepository';
import { MediaRepository } from './MediaRepository';
import { DerivedArtifactRepository } from './DerivedArtifactRepository';
import { GrowthEventRepository } from './GrowthEventRepository';
import { InteractionLogRepository } from './InteractionLogRepository';
import { ProactivePromptRepository } from './ProactivePromptRepository';
export declare function createRepositories(db: DatabaseService): {
    user: UserRepository;
    conversation: ConversationRepository;
    memory: MemoryRepository;
    concept: ConceptRepository;
    card: CardRepository;
    media: MediaRepository;
    derivedArtifact: DerivedArtifactRepository;
    growthEvent: GrowthEventRepository;
    interactionLog: InteractionLogRepository;
    proactivePrompt: ProactivePromptRepository;
};
export type RepositoryCollection = ReturnType<typeof createRepositories>;
//# sourceMappingURL=index.d.ts.map