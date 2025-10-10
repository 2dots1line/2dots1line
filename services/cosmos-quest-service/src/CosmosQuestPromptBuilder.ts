/**
 * CosmosQuestPromptBuilder.ts
 * V11.0 - Quest-specific prompt builder for CosmosQuestAgent
 * Uses shared PromptBuilder infrastructure with cosmos-specific templates
 */

import { ConfigService } from '@2dots1line/config-service';
import { UserRepository, ConversationRepository } from '@2dots1line/database';
import { VisualizationEntity } from '@2dots1line/shared-types';
import { ExtendedAugmentedMemoryContext } from '@2dots1line/tools/src/retrieval/types';
import { PromptCacheService } from '@2dots1line/core-utils';
import { Redis } from 'ioredis';
import Mustache from 'mustache';

export interface KeyPhraseExtractionInput {
  userId: string;
  conversationId: string;
  userQuestion: string;
  questType: string;
}

export interface FinalResponseInput {
  userId: string;
  conversationId: string;
  userQuestion: string;
  augmentedContext: ExtendedAugmentedMemoryContext;
  visualization: {
    stage1: VisualizationEntity[];
    stage2: VisualizationEntity[];
    stage3: VisualizationEntity[];
  };
}

export interface PromptBuildOutput {
  systemPrompt: string;
  userPrompt: string;
  conversationHistory: any[];
}

export class CosmosQuestPromptBuilder {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private conversationRepository: ConversationRepository,
    private redisClient: Redis,
    private promptCacheService?: PromptCacheService // Optional for backward compatibility
  ) {}

  /**
   * Build prompt for key phrase extraction using shared template system
   */
  public async buildKeyPhraseExtractionPrompt(input: KeyPhraseExtractionInput): Promise<PromptBuildOutput> {
    console.log('\n🔧 CosmosQuestPromptBuilder.buildKeyPhraseExtractionPrompt - Starting...');
    console.log('📋 Input:', { 
      userId: input.userId, 
      conversationId: input.conversationId, 
      userQuestion: input.userQuestion.substring(0, 100) + '...',
      questType: input.questType
    });

    // Fetch essential user data
    const user = await this.userRepository.findUserByIdWithContext(input.userId);

    if (!user) {
      throw new Error(`CosmosQuestPromptBuilder Error: User not found for userId: ${input.userId}`);
    }

    console.log('📊 Data fetched:', {
      userFound: !!user,
      userName: user.name
    });

    // Get cosmos-specific template from shared template system
    const template = this.configService.getTemplate('cosmos_quest_key_phrase_extraction');
    
    if (!template) {
      throw new Error('CosmosQuestPromptBuilder Error: cosmos_quest_key_phrase_extraction template not found');
    }

    // Prepare template variables
    const templateVars = {
      user_name: user.name || 'User',
      quest_type: input.questType,
      user_question: input.userQuestion,
      key_phrase_extraction: true, // Enable key phrase extraction section
      final_response_generation: false, // Disable final response section
      essential_user_context: this.formatEssentialUserContext(user),
      augmented_memory_context: null, // Not needed for key phrase extraction
      visualization_data: null // Not needed for key phrase extraction
    };

    // Render the template with caching
    const systemPrompt = await this.getCachedPrompt('cosmos_key_phrase', input.userId, templateVars, template);
    
    // For key phrase extraction, we only need the system prompt
    const userPrompt = '';

    console.log('\n📝 CosmosQuestPromptBuilder - KEY PHRASE SYSTEM PROMPT (CONSOLIDATED):');
    console.log('='.repeat(50));
    console.log(systemPrompt.substring(0, 300) + '...');
    console.log('='.repeat(50));

    return {
      systemPrompt,
      userPrompt,
      conversationHistory: [] // Not needed for key phrase extraction
    };
  }

  /**
   * Build prompt for final response generation using shared template system
   */
  public async buildFinalResponsePrompt(input: FinalResponseInput): Promise<PromptBuildOutput> {
    console.log('\n🔧 CosmosQuestPromptBuilder.buildFinalResponsePrompt - Starting...');
    console.log('📋 Input:', { 
      userId: input.userId, 
      conversationId: input.conversationId, 
      userQuestion: input.userQuestion.substring(0, 100) + '...',
      hasAugmentedContext: !!input.augmentedContext,
      visualizationStages: {
        stage1: input.visualization.stage1.length,
        stage2: input.visualization.stage2.length,
        stage3: input.visualization.stage3.length
      }
    });

    // Fetch user data
    const user = await this.userRepository.findUserByIdWithContext(input.userId);
    if (!user) {
      throw new Error(`CosmosQuestPromptBuilder Error: User not found for userId: ${input.userId}`);
    }

    // Get cosmos-specific template from shared template system
    const template = this.configService.getTemplate('cosmos_quest_final_response');
    
    if (!template) {
      throw new Error('CosmosQuestPromptBuilder Error: cosmos_quest_final_response template not found');
    }

    // Prepare template variables
    const templateVars = {
      user_name: user.name || 'User',
      quest_type: 'memory_exploration', // Default quest type
      user_question: input.userQuestion,
      key_phrase_extraction: false, // Disable key phrase extraction section
      final_response_generation: true, // Enable final response section
      essential_user_context: this.formatEssentialUserContext(user),
      augmented_memory_context: this.formatAugmentedMemoryContext(input.augmentedContext),
      visualization_data: this.formatVisualizationData(input.visualization)
    };

    // Render the template with caching
    const systemPrompt = await this.getCachedPrompt('cosmos_final_response', input.userId, templateVars, template);
    
    // For final response, we only need the system prompt
    const userPrompt = '';

    console.log('\n📝 CosmosQuestPromptBuilder - FINAL RESPONSE SYSTEM PROMPT (CONSOLIDATED):');
    console.log('='.repeat(50));
    console.log('🔍 DEBUG - Template Variables:');
    console.log('- hasAugmentedContext:', !!templateVars.augmented_memory_context);
    console.log('- augmented_memory_context length:', templateVars.augmented_memory_context?.length || 0);
    console.log('- visualization_data length:', templateVars.visualization_data?.length || 0);
    console.log('- user_question:', templateVars.user_question);
    console.log('='.repeat(50));
    console.log(systemPrompt.substring(0, 500) + '...');
    console.log('='.repeat(50));

    return {
      systemPrompt,
      userPrompt,
      conversationHistory: [] // Not needed for final response
    };
  }


  /**
   * Helper to format component content for prompts
   */
  private formatComponentContent(tagName: string, content: unknown): string | null {
    if (content === null || content === undefined || (Array.isArray(content) && content.length === 0)) {
      return null;
    }
    
    let formattedContent: string;

    if (tagName === 'current_conversation_history' && Array.isArray(content)) {
      formattedContent = this.formatConversationHistory(content);
    } else if (tagName === 'conversation_summaries' && Array.isArray(content)) {
      formattedContent = this.formatConversationSummaries(content);
    } else if (tagName === 'augmented_memory_context' && content) {
      formattedContent = this.formatAugmentedMemoryContext(content as ExtendedAugmentedMemoryContext);
    } else if (tagName === 'visualization_data' && content) {
      formattedContent = this.formatVisualizationData(content);
    } else if (typeof content === 'string') {
      formattedContent = this.decodeHtmlEntities(content);
    } else {
      formattedContent = JSON.stringify(content, null, 2);
    }
      
    return `<${tagName}>\n${formattedContent}\n</${tagName}>`;
  }

  /**
   * Format conversation history
   */
  private formatConversationHistory(messages: any[]): string {
    return [...messages].reverse().map(msg => 
      `${msg.type.toUpperCase()}: ${this.decodeHtmlEntities(msg.content)}`
    ).join('\n');
  }

  /**
   * Format conversation summaries
   */
  private formatConversationSummaries(summaries: any[]): string {
    if (!Array.isArray(summaries) || summaries.length === 0) {
      return '';
    }
    
    return summaries.map((summary, index) => {
      const importance = summary.conversation_importance_score || summary.importance_score || 'N/A';
      const title = summary.conversation_summary || summary.title || `Conversation ${index + 1}`;
      const decodedTitle = this.decodeHtmlEntities(title);
      return `[${importance}/10] ${decodedTitle}`;
    }).join('\n');
  }

  /**
   * Format augmented memory context
   */
  private formatAugmentedMemoryContext(context: ExtendedAugmentedMemoryContext): string {
    console.log('🔍 DEBUG - formatAugmentedMemoryContext called with:', {
      hasRetrievedMemoryUnits: !!(context.retrievedMemoryUnits && context.retrievedMemoryUnits.length > 0),
      hasRetrievedConcepts: !!(context.retrievedConcepts && context.retrievedConcepts.length > 0),
      hasRetrievedArtifacts: !!(context.retrievedArtifacts && context.retrievedArtifacts.length > 0),
      memoryUnitsCount: context.retrievedMemoryUnits?.length || 0,
      conceptsCount: context.retrievedConcepts?.length || 0,
      artifactsCount: context.retrievedArtifacts?.length || 0
    });
    
    let formatted = '';
    
    if (context.retrievedMemoryUnits && context.retrievedMemoryUnits.length > 0) {
      formatted += `\n## Retrieved Memory Units (${context.retrievedMemoryUnits.length}):\n`;
      context.retrievedMemoryUnits.forEach((unit, index) => {
        formatted += `${index + 1}. ${unit.title || 'Untitled Memory'}\n`;
        if (unit.content) {
          formatted += `   Content: ${unit.content.substring(0, 200)}...\n`;
        }
        if (unit.relevance_score) {
          formatted += `   Relevance: ${unit.relevance_score}\n`;
        }
        formatted += '\n';
      });
    }
    
    if (context.retrievedConcepts && context.retrievedConcepts.length > 0) {
      formatted += `\n## Retrieved Concepts (${context.retrievedConcepts.length}):\n`;
      context.retrievedConcepts.forEach((concept, index) => {
        formatted += `${index + 1}. ${concept.title || 'Untitled Concept'}\n`;
        if (concept.description) {
          formatted += `   Description: ${concept.description.substring(0, 200)}...\n`;
        }
        formatted += '\n';
      });
    }
    
    if (context.retrievedArtifacts && context.retrievedArtifacts.length > 0) {
      formatted += `\n## Retrieved Artifacts (${context.retrievedArtifacts.length}):\n`;
      context.retrievedArtifacts.forEach((artifact, index) => {
        formatted += `${index + 1}. ${artifact.title || 'Untitled Artifact'}\n`;
        if (artifact.description) {
          formatted += `   Description: ${artifact.description.substring(0, 200)}...\n`;
        }
        formatted += '\n';
      });
    }
    
    return formatted;
  }

  /**
   * Format visualization data
   */
  private formatVisualizationData(visualization: any): string {
    let formatted = '';
    
    if (visualization.stage1 && visualization.stage1.length > 0) {
      formatted += `\n## Stage 1 Entities (Direct Matches - ${visualization.stage1.length}):\n`;
      visualization.stage1.forEach((entity: any, index: number) => {
        formatted += `${index + 1}. ${entity.title} (${entity.entityType})\n`;
        formatted += `   Entity ID: ${entity.entityId}\n`;
        formatted += `   Relevance: ${entity.relevanceScore}\n`;
        formatted += `   Texture: ${entity.starTexture}\n\n`;
      });
    }
    
    if (visualization.stage2 && visualization.stage2.length > 0) {
      formatted += `\n## Stage 2 Entities (1-hop Connections - ${visualization.stage2.length}):\n`;
      visualization.stage2.forEach((entity: any, index: number) => {
        formatted += `${index + 1}. ${entity.title} (${entity.entityType})\n`;
        formatted += `   Entity ID: ${entity.entityId}\n`;
        formatted += `   Relevance: ${entity.relevanceScore}\n`;
        formatted += `   Texture: ${entity.starTexture}\n\n`;
      });
    }
    
    if (visualization.stage3 && visualization.stage3.length > 0) {
      formatted += `\n## Stage 3 Entities (2-hop Connections - ${visualization.stage3.length}):\n`;
      visualization.stage3.forEach((entity: any, index: number) => {
        formatted += `${index + 1}. ${entity.title} (${entity.entityType})\n`;
        formatted += `   Entity ID: ${entity.entityId}\n`;
        formatted += `   Relevance: ${entity.relevanceScore}\n`;
        formatted += `   Texture: ${entity.starTexture}\n\n`;
      });
    }
    
    return formatted;
  }

  /**
   * Helper to decode HTML entities in text
   */
  private decodeHtmlEntities(text: string): string {
    if (typeof text !== 'string') return text;
    
    return text
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/g, '/')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
  }

  /**
   * Format essential user context (OPTIMIZED - minimal context)
   */
  private formatEssentialUserContext(user: any): string | null {
    if (!user) return null;
    
    const essentialInfo = [];
    
    // User name
    if (user.name) {
      essentialInfo.push(`User: ${user.name}`);
    }
    
    // Current focus areas (if available and concise)
    if (user.current_focus_areas && Array.isArray(user.current_focus_areas) && user.current_focus_areas.length > 0) {
      const focusAreas = user.current_focus_areas.slice(0, 3).join(', '); // Limit to 3 areas
      essentialInfo.push(`Current Focus: ${focusAreas}`);
    }
    
    // Basic preferences (if available and concise)
    if (user.preferences && typeof user.preferences === 'object') {
      const prefs = [];
      if (user.preferences.communication_style) prefs.push(`Communication: ${user.preferences.communication_style}`);
      if (user.preferences.exploration_depth) prefs.push(`Exploration: ${user.preferences.exploration_depth}`);
      if (prefs.length > 0) {
        essentialInfo.push(`Preferences: ${prefs.join(', ')}`);
      }
    }
    
    if (essentialInfo.length === 0) return null;
    
    return `<essential_user_context>\n${essentialInfo.join('\n')}\n</essential_user_context>`;
  }

  /**
   * Get cached prompt or build and cache it
   */
  private async getCachedPrompt(
    sectionType: string,
    userId: string,
    templateVars: any,
    template: string
  ): Promise<string> {
    // If no cache service, fall back to direct rendering
    if (!this.promptCacheService) {
      return Mustache.render(template, templateVars);
    }

    // Try to get from cache
    const cached = await this.promptCacheService.getCachedSection(sectionType, userId, undefined, templateVars);
    if (cached) {
      return cached.content;
    }

    // Build and cache
    const content = Mustache.render(template, templateVars);
    await this.promptCacheService.setCachedSection(sectionType, userId, content, undefined, templateVars);
    
    return content;
  }
}
