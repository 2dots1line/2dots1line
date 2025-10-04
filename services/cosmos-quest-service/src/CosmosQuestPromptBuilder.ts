/**
 * CosmosQuestPromptBuilder.ts
 * V11.0 - Quest-specific prompt builder for CosmosQuestAgent
 * Provides proper context to LLM for key phrase extraction and final response generation
 */

import { ConfigService } from '@2dots1line/config-service';
import { UserRepository, ConversationRepository } from '@2dots1line/database';
import { VisualizationEntity } from '@2dots1line/shared-types';
import { ExtendedAugmentedMemoryContext } from '@2dots1line/tools/src/retrieval/types';
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
    private redisClient: Redis
  ) {}

  /**
   * Build prompt for key phrase extraction with minimal context (OPTIMIZED)
   */
  public async buildKeyPhraseExtractionPrompt(input: KeyPhraseExtractionInput): Promise<PromptBuildOutput> {
    console.log('\n🔧 CosmosQuestPromptBuilder.buildKeyPhraseExtractionPrompt - Starting...');
    console.log('📋 Input:', { 
      userId: input.userId, 
      conversationId: input.conversationId, 
      userQuestion: input.userQuestion.substring(0, 100) + '...',
      questType: input.questType
    });

    // OPTIMIZED: Only fetch essential user data - no conversation history or summaries
    const user = await this.userRepository.findUserByIdWithContext(input.userId);

    if (!user) {
      throw new Error(`CosmosQuestPromptBuilder Error: User not found for userId: ${input.userId}`);
    }

    console.log('📊 Data fetched (OPTIMIZED):', {
      userFound: !!user,
      userName: user.name
    });

    // Build quest-specific system prompt with minimal context
    const systemPrompt = this.buildKeyPhraseSystemPrompt(user, [], [], null);
    
    // Build user prompt for key phrase extraction
    const userPrompt = this.buildKeyPhraseUserPrompt(input.userQuestion, input.questType, user.name || 'User');

    console.log('\n📝 CosmosQuestPromptBuilder - KEY PHRASE SYSTEM PROMPT (OPTIMIZED):');
    console.log('='.repeat(50));
    console.log(systemPrompt.substring(0, 300) + '...');
    console.log('='.repeat(50));
    
    console.log('\n📝 CosmosQuestPromptBuilder - KEY PHRASE USER PROMPT:');
    console.log('='.repeat(50));
    console.log(userPrompt.substring(0, 300) + '...');
    console.log('='.repeat(50));

    return {
      systemPrompt,
      userPrompt,
      conversationHistory: [] // Not needed for key phrase extraction
    };
  }

  /**
   * Build prompt for final response generation
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

    // Build final response system prompt
    const systemPrompt = this.buildFinalResponseSystemPrompt(user);
    
    // Build user prompt for final response
    const userPrompt = this.buildFinalResponseUserPrompt(
      input.userQuestion, 
      input.augmentedContext, 
      input.visualization, 
      user.name || 'User'
    );

    console.log('\n📝 CosmosQuestPromptBuilder - FINAL RESPONSE SYSTEM PROMPT:');
    console.log('='.repeat(50));
    console.log(systemPrompt.substring(0, 300) + '...');
    console.log('='.repeat(50));
    
    console.log('\n📝 CosmosQuestPromptBuilder - FINAL RESPONSE USER PROMPT:');
    console.log('='.repeat(50));
    console.log(userPrompt.substring(0, 300) + '...');
    console.log('='.repeat(50));

    return {
      systemPrompt,
      userPrompt,
      conversationHistory: [] // Not needed for final response
    };
  }

  /**
   * Build system prompt for key phrase extraction (OPTIMIZED - minimal context)
   */
  private buildKeyPhraseSystemPrompt(user: any, recentSummaries: any[], conversationHistory: any[], turnContext: any): string {
    // Only include essential user context - no verbose memory profile
    const essentialUserContext = this.formatEssentialUserContext(user);

    return `=== COSMOS QUEST AGENT - KEY PHRASE EXTRACTION ===

You are a specialized AI assistant for the CosmosQuestAgent, designed to extract meaningful key phrases from user questions for immersive memory exploration through 3D visualization.

CORE PURPOSE:
- Extract 3-7 key phrases that will guide memory retrieval and 3D visualization
- Consider both literal words and implied concepts based on user intent
- Generate phrases that will find relevant memories, concepts, and artifacts
- Think like a memory explorer, not just a keyword extractor

KEY PHRASE EXTRACTION GUIDELINES:
1. **Literal Extraction**: Include important nouns, verbs, and concepts from the user's question
2. **Intent-Based Expansion**: Add related concepts that the user likely means but didn't explicitly state
3. **Memory Context**: Consider what memories, people, places, or experiences might be relevant
4. **Temporal Context**: Include time-related concepts if the question implies past/present/future
5. **Emotional Context**: Include emotional or thematic concepts that might connect to memories
6. **Relationship Context**: Include relationship or social concepts that might be relevant

EXAMPLES:
- "Tell me about my skating memories" → ["skating", "ice skating", "winter sports", "childhood activities", "family memories", "sports"]
- "What do I remember about my trip to Japan?" → ["Japan", "travel", "vacation", "Japanese culture", "trip memories", "international travel"]
- "Show me memories about my daughter" → ["daughter", "family", "children", "parenting", "family memories", "relationships"]

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "key_phrases": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5"]
}

${essentialUserContext ? `\n${essentialUserContext}\n` : ''}`;
  }

  /**
   * Build user prompt for key phrase extraction
   */
  private buildKeyPhraseUserPrompt(userQuestion: string, questType: string, userName: string): string {
    return `=== CURRENT QUEST REQUEST ===

User: ${userName}
Quest Type: ${questType}
User Question: "${userQuestion}"

Please extract 3-7 key phrases that will help us explore ${userName}'s memories and create an immersive 3D visualization. Consider both the literal words and the deeper intent behind the question.

Remember: These phrases will be used to search through ${userName}'s personal memory database, so think about what memories, experiences, people, places, or concepts might be relevant to this question.`;
  }

  /**
   * Build system prompt for final response generation (OPTIMIZED - minimal context)
   */
  private buildFinalResponseSystemPrompt(user: any): string {
    // Only include essential user context - no verbose memory profile
    const essentialUserContext = this.formatEssentialUserContext(user);

    return `=== COSMOS QUEST AGENT - FINAL RESPONSE GENERATION ===

You are a specialized AI assistant for the CosmosQuestAgent, designed to generate thoughtful responses and guided walkthroughs for immersive memory exploration.

CORE PURPOSE:
- Create a warm, insightful response that helps the user understand their memory connections
- Generate a step-by-step walkthrough script for the 3D visualization
- Provide a reflective question that encourages deeper exploration
- Be conversational, supportive, and genuinely helpful

RESPONSE GUIDELINES:
1. **Memory Integration**: Reference specific details from the retrieved memories
2. **Connection Insights**: Highlight interesting patterns or connections you notice
3. **Personal Touch**: Use the user's name and acknowledge their personal journey
4. **Guided Discovery**: Help them see their memories in new ways
5. **Reflective Engagement**: Encourage them to explore and reflect

WALKTHROUGH SCRIPT GUIDELINES:
- Create 3-5 steps that guide the user through the visualization
- Each step should have a clear purpose and duration
- Use the provided Entity IDs to focus on specific entities in each step
- Focus on helping them understand the connections between memories
- Make it feel like a guided tour of their personal cosmos

REFLECTIVE QUESTION GUIDELINES:
- Ask something that encourages deeper thinking about the patterns
- Help them connect their memories to their current life or goals
- Be open-ended and thought-provoking
- Avoid yes/no questions

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "response_text": "Your warm, insightful response here...",
  "walkthrough_script": [
    {
      "step_number": 1,
      "title": "Step Title",
      "description": "What happens in this step",
      "focus_entity_id": null,
      "duration_seconds": 3
    }
  ],
  "reflective_question": "What patterns do you notice in these connections?"
}

${essentialUserContext ? `\n${essentialUserContext}\n` : ''}`;
  }

  /**
   * Build user prompt for final response generation
   */
  private buildFinalResponseUserPrompt(
    userQuestion: string, 
    augmentedContext: ExtendedAugmentedMemoryContext, 
    visualization: any,
    userName: string
  ): string {
    const memoryContext = this.formatComponentContent('augmented_memory_context', augmentedContext);
    const visualizationContext = this.formatComponentContent('visualization_data', visualization);

    return `=== FINAL RESPONSE GENERATION ===

User: ${userName}
Original Question: "${userQuestion}"

${memoryContext ? `\n${memoryContext}\n` : ''}
${visualizationContext ? `\n${visualizationContext}\n` : ''}

Please generate a thoughtful response, walkthrough script, and reflective question based on the retrieved memories and visualization data. Help ${userName} understand the connections between their memories and provide a meaningful exploration experience.`;
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
}
