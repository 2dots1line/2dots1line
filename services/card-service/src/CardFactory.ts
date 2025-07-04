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
  CreateCardData,
  cards as Card,
  proactive_prompts,
} from '@2dots1line/database';
import {
  TConcept,
  TDerivedArtifact,
  TMemoryUnit,
} from '@2dots1line/shared-types';
import { ConfigService } from '@2dots1line/config-service';

type CreatableEntity = TMemoryUnit | TConcept | TDerivedArtifact | proactive_prompts;
type EntityType = 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'ProactivePrompt';

interface CreateCardResult {
  created: boolean;
  cardId?: string;
  reason?: string;
}

export class CardFactory {
  private eligibilityRules: any;
  private cardTemplates: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly cardRepository: CardRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly conceptRepository: ConceptRepository,
    private readonly derivedArtifactRepository: DerivedArtifactRepository,
    private readonly proactivePromptRepository: ProactivePromptRepository
  ) {
    this.eligibilityRules = this.configService.getCardEligibilityRules();
    this.cardTemplates = this.configService.getCardTemplates();
  }

  /**
   * Main method to process an entity and potentially create a card for it.
   */
  async createCardForEntity(
    entityInfo: { id: string; type: EntityType },
    userId: string
  ): Promise<CreateCardResult> {
    const { id, type } = entityInfo;

    const entity = await this.fetchEntity(id, type);
    if (!entity) {
      return { created: false, reason: `${type} with id ${id} not found.` };
    }

    const isEligible = this.checkEligibility(entity, type);
    if (!isEligible) {
      return {
        created: false,
        reason: `${type} ${id} did not meet eligibility criteria.`,
      };
    }

    const cardData = this.constructCardData(entity, type, userId);
    if (!cardData) {
      return {
        created: false,
        reason: `Could not construct card data for ${type} ${id}.`,
      };
    }

    const newCard = await this.cardRepository.create(cardData);
    return { created: true, cardId: newCard.card_id };
  }

  private async fetchEntity(id: string, type: EntityType): Promise<CreatableEntity | null> {
    switch (type) {
      case 'MemoryUnit':
        return this.memoryRepository.findById(id);
      case 'Concept':
        return this.conceptRepository.findById(id);
      case 'DerivedArtifact':
        return this.derivedArtifactRepository.findById(id);
      case 'ProactivePrompt':
        return this.proactivePromptRepository.findById(id);
      default:
        return null;
    }
  }

  private checkEligibility(entity: CreatableEntity, type: EntityType): boolean {
    const rules = this.eligibilityRules[type];
    if (!rules) return false;
    if (rules.always_eligible) return true;

    switch (type) {
      case 'MemoryUnit':
        const mu = entity as TMemoryUnit;
        return (mu.importance_score ?? 0) >= rules.min_importance_score;
      case 'Concept':
        const concept = entity as TConcept;
        const salience = concept.metadata?.salience ?? concept.confidence ?? 0;
        return salience >= rules.min_salience && rules.eligible_types.includes(concept.type);
      case 'DerivedArtifact':
        const da = entity as TDerivedArtifact;
        return rules.eligible_types.includes(da.artifact_type);
      default:
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
    }

    const template = this.cardTemplates[templateKey];
    if (!template) return null;

    const displayData = this.buildDisplayData(entity, template.display_data);

    return {
      user_id: userId,
      card_type: template.card_type,
      source_entity_id: (entity as any).muid || (entity as any).concept_id || (entity as any).artifact_id || (entity as any).prompt_id,
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
}
