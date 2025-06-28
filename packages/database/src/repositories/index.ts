/**
 * Repositories Index - V9.7
 * Exports all repository classes and interfaces
 */

// User Management
export { UserRepository } from './UserRepository';
export type { CreateUserData, UpdateUserData } from './UserRepository';

// Conversations & Messages
export { ConversationRepository } from './ConversationRepository';
export type { 
  CreateConversationData, 
  CreateMessageData, 
  UpdateConversationData,
  ConversationSummary
} from './ConversationRepository';

// Memory & Content
export { MemoryRepository } from './MemoryRepository';
export type { CreateMemoryUnitData, UpdateMemoryUnitData } from './MemoryRepository';

// Knowledge Graph
export { ConceptRepository } from './ConceptRepository';
export type { CreateConceptData, UpdateConceptData } from './ConceptRepository';

// Presentation Layer
export { CardRepository } from './CardRepository';
export type { CreateCardData, UpdateCardData } from './CardRepository';

// Media & Assets
export { MediaRepository } from './MediaRepository';
export type { CreateMediaData, UpdateMediaData } from './MediaRepository';

// Derived Content
export { DerivedArtifactRepository } from './DerivedArtifactRepository';
export type { 
  CreateDerivedArtifactData, 
  UpdateDerivedArtifactData 
} from './DerivedArtifactRepository';

// Growth & Analytics
export { GrowthEventRepository } from './GrowthEventRepository';
export type { CreateGrowthEventData } from './GrowthEventRepository';

// User Interactions
export { InteractionLogRepository } from './InteractionLogRepository';
export type { CreateInteractionLogData } from './InteractionLogRepository';

// Proactive Prompts
export { ProactivePromptRepository } from './ProactivePromptRepository';
export type { 
  CreateProactivePromptData, 
  UpdateProactivePromptData 
} from './ProactivePromptRepository';

// Repository Factory Function
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

export function createRepositories(db: DatabaseService) {
  return {
    user: new UserRepository(db),
    conversation: new ConversationRepository(db),
    memory: new MemoryRepository(db),
    concept: new ConceptRepository(db),
    card: new CardRepository(db),
    media: new MediaRepository(db),
    derivedArtifact: new DerivedArtifactRepository(db),
    growthEvent: new GrowthEventRepository(db),
    interactionLog: new InteractionLogRepository(db),
    proactivePrompt: new ProactivePromptRepository(db),
  };
}

export type RepositoryCollection = ReturnType<typeof createRepositories>; 