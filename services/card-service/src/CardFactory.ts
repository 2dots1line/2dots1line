/**
 * CardFactory.ts
 *
 * V9.5
 *
 * This service is responsible for the deterministic creation of Cards based on
 * newly generated knowledge entities. It centralizes the business logic for
 * deciding if an entity is "card-worthy" and how it should be presented.
 */
import {
  CardRepository,
  ConceptRepository,
  DerivedArtifactRepository,
  MemoryRepository,
  ProactivePromptRepository,
  CommunityRepository,
  GrowthEventRepository,
  UserRepository,
  DatabaseService,
  CreateCardData
} from '@2dots1line/database';
import type { Prisma } from '@prisma/client';
import {
  TConcept,
  TDerivedArtifact,
  TMemoryUnit,
  TCommunity,
  TGrowthEvent,
  TUser
} from '@2dots1line/shared-types';
import { ConfigService } from '@2dots1line/config-service';

// Define types locally (using any for now since Prisma types are complex)
type Card = any;
type ProactivePrompt = any;
type Community = any;
type GrowthEvent = any;
type User = any;

type CreatableEntity = TMemoryUnit | TConcept | TDerivedArtifact | ProactivePrompt | Community | GrowthEvent | User;
type EntityType = 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'ProactivePrompt' | 'Community' | 'GrowthEvent' | 'User';

interface CreateCardResult {
  created: boolean;
  cardId?: string;
  reason?: string;
}

export class CardFactory {
  private eligibilityRules: any;
  private cardTemplates: any;
  private initialized: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly cardRepository: CardRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly conceptRepository: ConceptRepository,
    private readonly derivedArtifactRepository: DerivedArtifactRepository,
    private readonly proactivePromptRepository: ProactivePromptRepository,
    private readonly communityRepository: CommunityRepository,
    private readonly growthEventRepository: GrowthEventRepository,
    private readonly userRepository: UserRepository
  ) {
    // Don't load configs in constructor - they're async!
    // Must call initialize() after construction
  }

  /**
   * Initialize the CardFactory with async configuration loading
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[CardFactory] Loading configurations...');
    this.eligibilityRules = await this.configService.getCardEligibilityRules();
    this.cardTemplates = await this.configService.getCardTemplates();
    this.initialized = true;
    console.log('[CardFactory] Configurations loaded successfully');
  }

  /**
   * Main method to process an entity and potentially create a card for it.
   */
  async createCardForEntity(
    entityInfo: { id: string; type: EntityType },
    userId: string
  ): Promise<CreateCardResult> {
    // Ensure CardFactory is initialized before processing
    await this.initialize();
    
    const { id, type } = entityInfo;

    console.log(`[CardFactory] Processing ${type} ${id} for user ${userId}`);

    const entity = await this.fetchEntity(id, type);
    if (!entity) {
      console.log(`[CardFactory] ❌ Entity not found: ${type} ${id}`);
      return { created: false, reason: `${type} with id ${id} not found.` };
    }
    console.log(`[CardFactory] ✅ Entity fetched: ${type} ${id}`);

    const isEligible = this.checkEligibility(entity, type);
    if (!isEligible) {
      console.log(`[CardFactory] ❌ Entity not eligible: ${type} ${id}`);
      return {
        created: false,
        reason: `${type} ${id} did not meet eligibility criteria.`,
      };
    }
    console.log(`[CardFactory] ✅ Entity eligible: ${type} ${id}`);

    const cardData = this.constructCardData(entity, type, userId);
    if (!cardData) {
      console.log(`[CardFactory] ❌ Could not construct card data: ${type} ${id}`);
      return {
        created: false,
        reason: `Could not construct card data for ${type} ${id}.`,
      };
    }
    console.log(`[CardFactory] ✅ Card data constructed: ${type} ${id}`);

    const newCard = await this.cardRepository.create(cardData);
    console.log(`[CardFactory] ✅ Card created: ${newCard.card_id} for ${type} ${id}`);
    return { created: true, cardId: newCard.card_id };
  }

  private async fetchEntity(id: string, type: EntityType): Promise<CreatableEntity | null> {
    return await this.fetchEntityByType(type, id);
  }

  private checkEligibility(entity: CreatableEntity, type: EntityType): boolean {
    const rules = this.eligibilityRules[type];
    console.log(`[CardFactory] Checking eligibility for ${type}:`, { rulesExist: !!rules });
    
    if (!rules) return false;
    if (rules.always_eligible) return true;

    switch (type) {
      case 'MemoryUnit':
        const mu = entity as TMemoryUnit;
        const muScore = mu.importance_score ?? 0;
        const muEligible = muScore >= rules.min_importance_score;
        console.log(`[CardFactory] MemoryUnit eligibility: score=${muScore}, threshold=${rules.min_importance_score}, eligible=${muEligible}`);
        return muEligible;
      case 'Concept':
        const concept = entity as TConcept;
        const importanceScore = concept.importance_score ?? concept.confidence ?? 0;
        const typeEligible = rules.eligible_types.includes(concept.type || (entity as any).type);
        const importanceEligible = importanceScore >= rules.min_importance_score;
        const conceptEligible = importanceEligible && typeEligible;
        console.log(`[CardFactory] Concept eligibility:`, {
          importanceScore, 
          threshold: rules.min_importance_score,
          type: concept.type || (entity as any).type,
          eligibleTypes: rules.eligible_types,
          importanceEligible,
          typeEligible,
          conceptEligible
        });
        return conceptEligible;
      case 'DerivedArtifact':
        const da = entity as TDerivedArtifact;
        const daEligible = rules.eligible_types.includes(da.type);
        console.log(`[CardFactory] DerivedArtifact eligibility: type=${da.type}, eligibleTypes=${rules.eligible_types}, eligible=${daEligible}`);
        return daEligible;
      case 'Community':
        const community = entity as any;
        const communityEligible = rules.always_eligible || true; // Communities are generally eligible
        console.log(`[CardFactory] Community eligibility: eligible=${communityEligible}`);
        return communityEligible;
      case 'GrowthEvent':
        const growthEvent = entity as any;
        const growthEventEligible = rules.always_eligible || true; // Growth events are generally eligible
        console.log(`[CardFactory] GrowthEvent eligibility: eligible=${growthEventEligible}`);
        return growthEventEligible;
      case 'ProactivePrompt':
        const prompt = entity as any;
        const promptEligible = rules.always_eligible || true; // Proactive prompts are generally eligible
        console.log(`[CardFactory] ProactivePrompt eligibility: eligible=${promptEligible}`);
        return promptEligible;
      case 'User':
        const user = entity as any;
        const userEligible = rules.always_eligible || false; // Users are generally not eligible for cards
        console.log(`[CardFactory] User eligibility: eligible=${userEligible}`);
        return userEligible;
      default:
        console.warn(`[CardFactory] Unknown entity type for eligibility check: ${type}`);
        return false;
    }
  }

  private constructCardData(entity: CreatableEntity, type: EntityType, userId: string): CreateCardData | null {
    let templateKey: string = type;
    if (type === 'Concept') {
        const conceptType = (entity as TConcept).type;
        // e.g. "Concept_goal"
        if (this.cardTemplates[`Concept_${conceptType}`]) {
            templateKey = `Concept_${conceptType}`;
        }
    } else if (type === 'DerivedArtifact') {
        const artifactType = (entity as TDerivedArtifact).type;
        // e.g. "DerivedArtifact_cycle_report"
        if (this.cardTemplates[`DerivedArtifact_${artifactType}`]) {
            templateKey = `DerivedArtifact_${artifactType}`;
        }
    }

    const template = this.cardTemplates[templateKey];
    if (!template) return null;

    const displayData = this.buildDisplayData(entity, template.display_data);

    // All entities now use standardized entity_id field
    const sourceEntityId = (entity as any).entity_id;
    if (!sourceEntityId) {
      console.warn(`[CardFactory] Entity missing entity_id: ${type}`);
      return null;
    }

    return {
      user_id: userId,
      type: template.type,
      source_entity_id: sourceEntityId,
      source_entity_type: type,
      display_data: displayData,
    };
  }

  private buildDisplayData(entity: CreatableEntity, template: any): any {
    const title = (entity as any)[template.title_source_field] || 'Untitled';
    let preview = (entity as any)[template.preview_source_field] || '';

    if (template.preview_truncate_length && preview.length > template.preview_truncate_length) {
      preview = preview.substring(0, template.preview_truncate_length) + '...';
    }

    // This can be expanded to include more fields from the template
    return {
      title,
      previewText: preview,
    };
  }

  /**
   * Generic method to fetch entity by type using standardized field names
   * This replaces the need for separate switch cases since all entities now use:
   * - entity_id (primary key)
   * - user_id (for filtering)
   * - title, content, created_at, updated_at (standardized fields)
   */
  private async fetchEntityByType(type: EntityType, id: string): Promise<CreatableEntity | null> {
    try {
      switch (type) {
        case 'MemoryUnit':
          return this.memoryRepository.findById(id);
        case 'Concept':
          return this.conceptRepository.findById(id);
        case 'DerivedArtifact':
          return this.derivedArtifactRepository.findById(id) as unknown as Promise<CreatableEntity | null>;
        case 'ProactivePrompt':
          return this.proactivePromptRepository.findById(id);
        case 'Community':
          // Note: CommunityRepository doesn't have findById, so we'll use a direct Prisma query
          return await this.databaseService.prisma.communities.findUnique({
            where: { entity_id: id }
          });
        case 'GrowthEvent':
          return this.growthEventRepository.findById(id);
        case 'User':
          return this.userRepository.findById(id);
        default:
          console.warn(`[CardFactory] Unknown entity type: ${type}`);
          return null;
      }
    } catch (error) {
      console.error(`[CardFactory] Error fetching ${type} ${id}:`, error);
      return null;
    }
  }
}
