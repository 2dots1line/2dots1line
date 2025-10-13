import { ConfigService } from '@2dots1line/config-service';
import { UserRepository, ConversationRepository, DatabaseService } from '@2dots1line/database';
import { getEntityTypeMapping, PromptCacheService } from '@2dots1line/core-utils';
import { SharedEmbeddingService } from '@2dots1line/tools';

// Use any type for now since Prisma types are complex
type conversation_messages = any;
import { 
  AugmentedMemoryContext,
  ViewContext,
  EngagementContext
} from '@2dots1line/shared-types';
import { Redis } from 'ioredis';
import * as Mustache from 'mustache';
import { SessionRepository } from '@2dots1line/database';
import * as fs from 'fs';
import * as path from 'path';


export interface PromptBuildInput {
  userId: string;
  conversationId: string;
  finalInputText: string;
  augmentedMemoryContext?: AugmentedMemoryContext;
  isNewConversation: boolean; // V11.0: Flag from controller instead of complex logic
  viewContext?: ViewContext; // V11.0: Current view context (chat | cards | cosmos)
  engagementContext?: EngagementContext; // V11.0: User engagement context
}


export interface PromptBuildOutput {
  systemPrompt: string;    // Background context (identity, memory profile, etc.)
  userPrompt: string;      // Current turn info (instructions, input text)
  conversationHistory: conversation_messages[]; // Properly formatted history
}

export class PromptBuilder {
  private sharedEmbeddingService: SharedEmbeddingService;

  // Dependencies are injected via the constructor for testability and DI best practices.
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private conversationRepository: ConversationRepository,
    private sessionRepository: SessionRepository, // NEW DEPENDENCY
    private redisClient: Redis,
    private promptCacheService?: PromptCacheService // Optional for backward compatibility
  ) {
    // Initialize SharedEmbeddingService with DatabaseService singleton
    this.sharedEmbeddingService = new SharedEmbeddingService(DatabaseService.getInstance());
  }

  /**
   * Generic method to fetch all required data in parallel
   */
  private async fetchAllPromptData(userId: string, conversationId: string): Promise<{
    user: any;
    conversationHistory: any[];
    recentSummaries: any[];
    turnContextStr: string | null;
    sessionContext: any[];
    recentConversation: any;
  }> {
    // Fetch all data in parallel for better performance
    const [
      user,
      conversationHistory,
      recentSummaries,
      turnContextStr,
      sessionContext,
      recentConversation
    ] = await Promise.all([
      this.userRepository.findUserByIdWithContext(userId),
      this.conversationRepository.getMostRecentMessages(conversationId, 10),
      this.conversationRepository.getRecentImportantConversationSummaries(userId),
      this.redisClient.get(`turn_context:${userId}:${conversationId}`),
      this.getSessionContext(userId, conversationId),
      this.conversationRepository.getMostRecentProcessedConversationWithContext(userId)
    ]);

    return {
      user,
      conversationHistory,
      recentSummaries,
      turnContextStr,
      sessionContext,
      recentConversation
    };
  }

  /**
   * V11.0 STANDARD: Build separate system and user prompts + conversation history
   * READ-ONLY: No side effects, no database writes
   */
  public async buildPrompt(input: PromptBuildInput): Promise<PromptBuildOutput> {
    const { userId, conversationId, finalInputText, augmentedMemoryContext, isNewConversation, viewContext, engagementContext } = input;
    
    // Default to chat view if no view context is provided
    const effectiveViewContext = viewContext || { currentView: 'chat' as const };
    
    console.log('\n🔧 PromptBuilder.buildPrompt - Starting V11.0 prompt assembly...');
    console.log('📋 PromptBuilder - Input:', { 
      userId, 
      conversationId, 
      finalInputText: finalInputText.substring(0, 100) + '...',
      hasAugmentedContext: !!augmentedMemoryContext,
      isNewConversation,
      viewContext: effectiveViewContext.currentView
    });

    // --- STEP 1: FETCH ALL DYNAMIC DATA IN PARALLEL (READ-ONLY) ---
    const { user, conversationHistory, recentSummaries, turnContextStr, sessionContext, recentConversation } = 
      await this.fetchAllPromptData(userId, conversationId);
    
    // Get new optimized templates
    const coreIdentityTpl = this.configService.getTemplate('core_identity_section');
    const operationalConfigTpl = this.configService.getTemplate('operational_config_section');
    const dynamicContextTpl = this.configService.getTemplate('dynamic_context_section');
    const currentTurnTpl = this.configService.getTemplate('current_turn_section');
    const coreIdentity = this.configService.getCoreIdentity();

    if (!user) {
      throw new Error(`PromptBuilder Error: User not found for userId: ${userId}`);
    }

    const turnContext = turnContextStr ? JSON.parse(turnContextStr) : null;

    console.log('📊 PromptBuilder - Data fetched:', {
      userFound: !!user,
      historyLength: conversationHistory.length,
      summariesCount: Array.isArray(recentSummaries) ? recentSummaries.length : 0,
      hasTurnContext: !!turnContext,
      isNewConversation,
      hasRecentConversation: !!recentConversation,
      hasProactiveGreeting: !!recentConversation?.proactive_greeting
    });

    // --- STEP 3: BUILD OPTIMIZED 4-SECTION PROMPT WITH CACHING ---
    
    // Section 1: Core Identity (Static - Highest Cache Hit Rate)
    const section1 = await this.getCachedSection('core_identity', userId, user.name || 'User', coreIdentityTpl);
    
    // Section 2: Operational Configuration (Semi-Static - Medium Cache Hit Rate)
    const section2 = await this.getCachedSection('operational_config', userId, user.name || 'User', operationalConfigTpl);
    
    // Section 3: Dynamic Context (Variable Cache Hit Rate - Ordered by Stability)
    const section3Data = {
      user_memory_profile: this.formatComponentContent('user_memory_profile', user.memory_profile),
      conversation_summaries: this.formatComponentContent('conversation_summaries', recentSummaries),
      session_context: sessionContext.length > 0 ? this.formatComponentContent('session_context', sessionContext) : null,
      current_conversation_history: this.formatComponentContent('current_conversation_history', conversationHistory),
      augmented_memory_context: this.formatComponentContent('augmented_memory_context', augmentedMemoryContext),
      view_context: this.formatViewContext(effectiveViewContext, user.name || 'User'),
      engagement_context: this.formatEngagementContext(engagementContext)
    };
    const section3 = await this.getCachedDynamicContext(userId, conversationId, section3Data, dynamicContextTpl);
    
    // Section 4: Current Turn (No Cache - Turn-Specific)
    const section4Data = {
      context_from_last_conversation: isNewConversation ? 
        this.formatContextFromLastConversation(recentConversation?.forward_looking_context, user.name || 'User') : null,
      context_from_last_turn: !isNewConversation ? 
        this.formatContextFromLastTurn(turnContext, user.name || 'User') : null,
      user_message: finalInputText
    };
    const section4 = Mustache.render(currentTurnTpl, section4Data);

    // Combine all sections with clear separators
    const systemPrompt = [
      section1,
      section2,
      section3
    ].filter(s => s && s.trim()).join('\n\n');

    const userPrompt = section4;
    
    console.log('\n📝 PromptBuilder - V11.0 SYSTEM PROMPT:');
    console.log('='.repeat(50));
    console.log(systemPrompt.substring(0, 300) + '...');
    console.log('='.repeat(50));
    
    console.log('\n📝 PromptBuilder - V11.0 USER PROMPT:');
    console.log('='.repeat(50));
    console.log(userPrompt.substring(0, 300) + '...');
    console.log('='.repeat(50));
    
    console.log(`📏 PromptBuilder - System: ${systemPrompt.length}, User: ${userPrompt.length}, History: ${conversationHistory.length} messages\n`);
    
    return {
      systemPrompt,
      userPrompt,
      conversationHistory
    };
  }

  /**
   * Get cached section or build and cache it
   */
  private async getCachedSection(
    sectionType: string, 
    userId: string, 
    userName: string, 
    template: string
  ): Promise<string> {
    // If no cache service, fall back to direct rendering
    if (!this.promptCacheService) {
      return Mustache.render(template, { user_name: userName });
    }

    // Try to get from cache
    const cached = await this.promptCacheService.getCachedSection(sectionType, userId);
    if (cached) {
      return cached.content;
    }

    // Build and cache
    const content = Mustache.render(template, { user_name: userName });
    await this.promptCacheService.setCachedSection(sectionType, userId, content);
    
    return content;
  }

  /**
   * Get cached dynamic context section
   */
  private async getCachedDynamicContext(
    userId: string,
    conversationId: string,
    section3Data: any,
    template: string
  ): Promise<string> {
    // If no cache service, fall back to direct rendering
    if (!this.promptCacheService) {
      return Mustache.render(template, section3Data);
    }

    // Try to get from cache
    const cached = await this.promptCacheService.getCachedSection(
      'dynamic_context', 
      userId, 
      conversationId,
      section3Data
    );
    if (cached) {
      return cached.content;
    }

    // Build and cache
    const content = Mustache.render(template, section3Data);
    await this.promptCacheService.setCachedSection(
      'dynamic_context', 
      userId, 
      content, 
      conversationId,
      section3Data
    );
    
    return content;
  }


  /**
   * A helper to format a component into an XML-like tag structure.
   * If content is null, undefined, or an empty array, it returns null so it gets filtered out.
   */
  private formatComponent(tagName: string, content: unknown): string | null {
    if (content === null || content === undefined || (Array.isArray(content) && content.length === 0)) {
      return null; // Return null instead of empty tags so it gets filtered out
    }
    
    let formattedContent: string;

    // Handle special formatting for conversation history
    if (tagName === 'current_conversation_history' && Array.isArray(content)) {
      formattedContent = this.formatConversationHistory(content as conversation_messages[]);
    } else if (tagName === 'session_context' && Array.isArray(content)) {
      formattedContent = this.formatSessionContext(content as conversation_messages[]);
    } else if (typeof content === 'string') {
      formattedContent = content;
    } else {
      formattedContent = JSON.stringify(content, null, 2);
    }
      
    return `<${tagName}>\n${formattedContent}\n</${tagName}>`;
  }

  /**
   * V11.0: Helper to format component content for Mustache templates (without XML tags)
   * Returns formatted content or null if empty
   */
  private formatComponentContent(tagName: string, content: unknown): string | null {
    if (content === null || content === undefined || (Array.isArray(content) && content.length === 0)) {
      return null;
    }
    
    // Handle special formatting for conversation history
    if (tagName === 'current_conversation_history' && Array.isArray(content)) {
      return this.formatConversationHistory(content as conversation_messages[]);
    } else if (tagName === 'session_context' && Array.isArray(content)) {
      return this.formatSessionContext(content as conversation_messages[]);
    } else if (tagName === 'conversation_summaries' && Array.isArray(content)) {
      return this.formatConversationSummaries(content);
    } else if (tagName === 'augmented_memory_context' && typeof content === 'object' && content !== null) {
      return this.formatAugmentedMemoryContext(content as any);
    } else if (typeof content === 'string') {
      return this.decodeHtmlEntities(content);
    } else {
      // For JSON content, decode HTML entities in string values
      const jsonString = JSON.stringify(content, null, 2);
      return this.decodeHtmlEntities(jsonString);
    }
  }

  /**
   * Formats augmented memory context for LLM consumption.
   * Ensures the LLM recognizes that memory context has been provided, even if only concepts are available.
   */
  private formatAugmentedMemoryContext(context: any): string | null {
    if (!context) return null;
    
    const parts: string[] = [];
    
    // Add relevant memories if available
    if (context.relevant_memories && Array.isArray(context.relevant_memories) && context.relevant_memories.length > 0) {
      parts.push('**Relevant Memories:**');
      context.relevant_memories.forEach((memory: string, index: number) => {
        parts.push(`${index + 1}. ${this.decodeHtmlEntities(memory)}`);
      });
    }
    
    // Add retrieved concepts if available (even if no memories)
    if (context.retrievedConcepts && Array.isArray(context.retrievedConcepts) && context.retrievedConcepts.length > 0) {
      parts.push('**Related Concepts:**');
      context.retrievedConcepts.forEach((concept: any, index: number) => {
        const title = concept.title || concept.entity_id || `Concept ${index + 1}`;
        const content = concept.content ? ` - ${this.decodeHtmlEntities(concept.content)}` : '';
        parts.push(`${index + 1}. ${this.decodeHtmlEntities(title)}${content}`);
      });
    }
    
    // Add contextual insights if available
    if (context.contextual_insights && Array.isArray(context.contextual_insights) && context.contextual_insights.length > 0) {
      parts.push('**Contextual Insights:**');
      context.contextual_insights.forEach((insight: string, index: number) => {
        parts.push(`${index + 1}. ${this.decodeHtmlEntities(insight)}`);
      });
    }
    
    // Add emotional context if available
    if (context.emotional_context) {
      parts.push(`**Emotional Context:** ${this.decodeHtmlEntities(context.emotional_context)}`);
    }
    
    // Add retrieval summary if available
    if (context.retrievalSummary) {
      parts.push(`**Retrieval Summary:** ${this.decodeHtmlEntities(context.retrievalSummary)}`);
    }
    
    // If no content is available, return null (this should not happen if HRT found anything)
    if (parts.length === 0) {
      return null;
    }
    
    return parts.join('\n\n');
  }

  /**
   * Formats conversation history into a clean, LLM-friendly transcript.
   */
  private formatConversationHistory(messages: conversation_messages[]): string {
    // The history is fetched most-recent-first, so we reverse it for chronological order.
    return [...messages].reverse().map(msg => 
      `${msg.type.toUpperCase()}: ${this.decodeHtmlEntities(msg.content)}`
    ).join('\n');
  }

  /**
   * V11.0: Formats conversation summaries for the new template structure
   */
  private formatConversationSummaries(summaries: any[]): string {
    if (!Array.isArray(summaries) || summaries.length === 0) {
      return '';
    }
    
    return summaries.map((summary, index) => {
      const importance = summary.conversation_importance_score || summary.importance_score || 'N/A';
      const title = summary.conversation_summary || summary.title || `Conversation ${index + 1}`;
      // Decode HTML entities that might be in the data
      const decodedTitle = this.decodeHtmlEntities(title);
      return `[${importance}/10] ${decodedTitle}`;
    }).join('\n');
  }

  /**
   * V11.0: Helper to decode HTML entities in text
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
   * Formats context from the last conversation using Mustache templating.
   */
  private formatContextFromLastConversation(contextPackage: any, userName: string): string {
    if (!contextPackage) {
      return '<context_from_last_conversation>\n</context_from_last_conversation>';
    }

    const templates = this.configService.getAllTemplates();
    const template = templates.context_from_last_conversation;
    
    if (!template) {
      // Fallback if template not found
      return `<context_from_last_conversation>\n${JSON.stringify(contextPackage, null, 2)}\n</context_from_last_conversation>`;
    }

    try {
      const formatted = Mustache.render(template, { ...contextPackage, user_name: userName });
      return formatted;
    } catch (error) {
      console.error('Error rendering context_from_last_conversation template:', error);
      return `<context_from_last_conversation>\n${JSON.stringify(contextPackage, null, 2)}\n</context_from_last_conversation>`;
    }
  }

  /**
   * Formats context from the last turn using Mustache templating.
   */
  private formatContextFromLastTurn(turnContext: any, userName: string): string {
    if (!turnContext) {
      return '<context_from_last_turn>\n</context_from_last_turn>';
    }

    const templates = this.configService.getAllTemplates();
    const template = templates.context_from_last_turn;
    
    if (!template) {
      // Fallback if template not found
      return `<context_from_last_turn>\n${JSON.stringify(turnContext, null, 2)}\n</context_from_last_turn>`;
    }

    try {
      const formatted = Mustache.render(template, { ...turnContext, user_name: userName });
      return formatted;
    } catch (error) {
      console.error('Error rendering context_from_last_turn template:', error);
      return `<context_from_last_turn>\n${JSON.stringify(turnContext, null, 2)}\n</context_from_last_turn>`;
    }
  }

  /**
   * Generic method to build context with standardized field names
   */
  private buildContextWithStandardizedFields(contextData: any, contextType: string): string {
    if (!contextData) return '';
    
    switch (contextType) {
      case 'session':
        return this.formatSessionContext(contextData);
      case 'turn':
        return this.formatContextFromLastTurn(contextData, 'User');
      case 'conversation':
        return this.formatConversationHistory(contextData);
      default:
        return JSON.stringify(contextData, null, 2);
    }
  }

  /**
   * NEW METHOD: Get session context from previous conversations in same session
   */
  private async getSessionContext(userId: string, conversationId: string): Promise<conversation_messages[]> {
    try {
      console.log(`🔍 PromptBuilder.getSessionContext - Starting for conversation: ${conversationId}`);
      
      // Get current conversation to find its session
      const conversation = await this.conversationRepository.findByIdWithSessionId(conversationId);
      console.log(`🔍 PromptBuilder.getSessionContext - Conversation found:`, {
        id: conversation?.conversation_id,
        session_id: conversation?.session_id,
        status: conversation?.status,
        hasSessionId: !!conversation?.session_id
      });
      
      if (!conversation?.session_id) {
        console.log(`❌ PromptBuilder.getSessionContext - No session_id found for conversation ${conversationId}`);
        return [];
      }

      // Get context from previous conversations in same session
      const sessionContext = await this.conversationRepository.getSessionContext(
        conversation.session_id, 
        conversationId, 
        10 // Last 10 messages from most recent processed conversation
      );
      
      console.log(`🔍 PromptBuilder.getSessionContext - Session context retrieved:`, {
        sessionId: conversation.session_id,
        messageCount: sessionContext.length,
        messages: sessionContext.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' }))
      });
      
      return sessionContext;
    } catch (error) {
      console.error('❌ PromptBuilder.getSessionContext - Failed to get session context:', error);
      return [];
    }
  }

  /**
   * NEW METHOD: Format session context component
   */
  private formatSessionContext(messages: conversation_messages[]): string {
    if (messages.length === 0) return '';
    
    const contextText = messages
      .reverse() // Show in chronological order
      .map(msg => `${msg.type.toUpperCase()}: ${this.decodeHtmlEntities(msg.content)}`)
      .join('\n');
    
    return `## Session Context (Previous Conversation in Same Chat Window)
This context comes from the most recently processed conversation in your current chat session:

${contextText}

---`;
  }

  /**
   * NEW METHOD: Load view-specific instructions from configuration
   */
  private loadViewSpecificInstructions(view: string): any {
    try {
      const configPath = path.join(process.cwd(), 'config', 'view_specific_instructions.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const viewConfigs = JSON.parse(configData);
      
      return viewConfigs[view] || null;
    } catch (error) {
      console.error('Error loading view-specific instructions:', error);
      return null;
    }
  }

  /**
   * NEW METHOD: Format view context component with minimal information
   */
  private formatViewContext(viewContext: ViewContext, userName: string): string {
    const templates = this.configService.getAllTemplates();
    const template = templates.view_context_template;
    
    // Load view-specific configuration
    const viewConfig = this.loadViewSpecificInstructions(viewContext.currentView);
    
    if (!template) {
      // Fallback if template not found
      const fallback = `**Current View:** ${viewContext.currentView}\n**View Description:** ${viewContext.viewDescription || this.getDefaultViewDescription(viewContext.currentView)}`;
      if (viewConfig?.available_features?.length > 0) {
        return fallback + `\n\n**Available Features:**\n${viewConfig.available_features.map((feature: string) => `- ${feature}`).join('\n')}`;
      }
      return fallback;
    }

    try {
      // Load available transitions from view_transitions.json
      const transitionsConfig = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'config', 'view_transitions.json'),
          'utf-8'
        )
      );

      // Filter transitions that start from current view
      const availableTransitions = Object.entries(transitionsConfig.transitions)
        .filter(([key, t]: [string, any]) => t.from === viewContext.currentView)
        .map(([key, t]: [string, any]) => ({
          transition_key: key,
          from: t.from,
          to: t.to,
          question_template: t.question_template,
          trigger_patterns: t.trigger_patterns,
          target_chat_size: t.target_chat_size
        }));

      const viewData = {
        current_view: viewContext.currentView,
        view_description: viewContext.viewDescription || this.getDefaultViewDescription(viewContext.currentView),
        user_name: userName,
        // Add available features data
        available_features: viewConfig?.available_features || [],
        has_available_features: viewConfig?.available_features?.length > 0,
        
        // NEW: Available transitions
        has_available_transitions: availableTransitions.length > 0,
        available_transitions: availableTransitions
      };
      
      return Mustache.render(template, viewData);
    } catch (error) {
      console.error('Error rendering view_context_template:', error);
      const fallback = `**Current View:** ${viewContext.currentView}\n**View Description:** ${viewContext.viewDescription || this.getDefaultViewDescription(viewContext.currentView)}`;
      if (viewConfig?.available_features?.length > 0) {
        return fallback + `\n\n**Available Features:**\n${viewConfig.available_features.map((feature: string) => `- ${feature}`).join('\n')}`;
      }
      return fallback;
    }
  }

  /**
   * Helper method to get default view descriptions
   */
  private getDefaultViewDescription(view: string): string {
    switch (view) {
      case 'chat':
        return 'Main conversational interface for open-ended dialogue and personal growth';
      case 'cards':
        return 'Knowledge graph exploration interface with card-based interactions';
      case 'cosmos':
        return '3D immersive memory visualization and exploration interface';
      case 'dashboard':
        return 'Overview interface for high-level insights and strategic knowledge graph exploration';
      default:
        return 'Unknown interface context';
    }
  }

  /**
   * Format engagement context for LLM consumption
   */
  private formatEngagementContext(engagementContext?: EngagementContext): string | null {
    if (!engagementContext || !engagementContext.recentEvents || engagementContext.recentEvents.length === 0) {
      return null;
    }

    try {

    const parts: string[] = [];
    
    // Filter events to last 30 seconds
    const cutoffTime = new Date(Date.now() - 30000);
    const recentEvents = engagementContext.recentEvents.filter(event => 
      new Date(event.timestamp) >= cutoffTime
    );

    if (recentEvents.length === 0) {
      return null;
    }

    // Group events by type and view
    const eventsByType = recentEvents.reduce((acc, event) => {
      if (!acc[event.type]) acc[event.type] = [];
      acc[event.type].push(event);
      return acc;
    }, {} as Record<string, typeof recentEvents>);

    const eventsByView = recentEvents.reduce((acc, event) => {
      if (!acc[event.view]) acc[event.view] = [];
      acc[event.view].push(event);
      return acc;
    }, {} as Record<string, typeof recentEvents>);

    // Add recent interactions summary
    parts.push('**Recent User Interactions (Last 30 seconds):**');
    
    // Show clicks by view
    Object.entries(eventsByView).forEach(([view, events]) => {
      const clicks = events.filter(e => e.type === 'click');
      if (clicks.length > 0) {
        const entityClicks = clicks.filter(e => e.targetType === 'entity');
        const cardClicks = clicks.filter(e => e.targetType === 'card');
        
        let viewSummary = `- **${view} view**: ${clicks.length} clicks`;
        if (entityClicks.length > 0) {
          viewSummary += ` (${entityClicks.length} entities: ${entityClicks.map(e => e.target).join(', ')})`;
        }
        if (cardClicks.length > 0) {
          viewSummary += ` (${cardClicks.length} cards: ${cardClicks.map(e => e.target).join(', ')})`;
        }
        parts.push(viewSummary);
      }
    });

    // Show navigation patterns
    const navigationEvents = eventsByType.navigation || [];
    if (navigationEvents.length > 0) {
      const viewSwitches = navigationEvents.map(e => `${e.metadata?.fromView || 'unknown'} → ${e.target}`).join(', ');
      parts.push(`- **Navigation**: ${viewSwitches}`);
    }

    // Add enriched entities (entities user spent significant time with)
    if (engagementContext.enrichedEntities && engagementContext.enrichedEntities.length > 0) {
      parts.push('\n**Entities User Engaged With Deeply:**');
      engagementContext.enrichedEntities.forEach(entity => {
        parts.push(`- **${entity.title}** (${entity.type}): ${entity.content.substring(0, 100)}${entity.content.length > 100 ? '...' : ''}`);
      });
    }

    // Add interaction summary
    if (engagementContext.interactionSummary) {
      const { totalClicks, uniqueTargets, viewSwitches } = engagementContext.interactionSummary;
      parts.push(`\n**Interaction Summary**: ${totalClicks} total clicks, ${uniqueTargets} unique targets, ${viewSwitches} view switches`);
    }

    // Add session context
    if (engagementContext.sessionDuration) {
      const sessionMinutes = Math.round(engagementContext.sessionDuration / 60000);
      parts.push(`**Session Duration**: ${sessionMinutes} minutes`);
    }

    return parts.join('\n');
    } catch (error) {
      console.error('Error formatting engagement context:', error);
      return null;
    }
  }

  /**
   * Format agent capabilities for LLM consumption
   * Loads capabilities from agent_capabilities.json and filters by context
   * Uses semantic similarity for ranking (with keyword fallback)
   */
  private async formatAgentCapabilities(
    viewContext?: ViewContext,
    conversationContext?: any
  ): Promise<string | null> {
    try {
      // Load capabilities config
      const capabilitiesConfig = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'config', 'agent_capabilities.json'),
          'utf-8'
        )
      );

      const currentView = viewContext?.currentView || 'chat';
      
      // Filter capabilities available from current view
      const availableCapabilities = this.filterCapabilitiesByContext(
        capabilitiesConfig,
        currentView
      );

      // Rank by relevance (semantic similarity to recent messages)
      const rankedCapabilities = await this.rankCapabilitiesByRelevance(
        availableCapabilities,
        conversationContext
      );

      // Take top N (configurable)
      const topCapabilities = rankedCapabilities.slice(
        0,
        capabilitiesConfig.prompt_config.max_capabilities_in_prompt
      );

      if (topCapabilities.length === 0) {
        return null;
      }

      const templates = this.configService.getAllTemplates();
      const template = templates.agent_capabilities_template;
      if (!template) {
        return null;
      }

      return Mustache.render(template, {
        current_view: currentView,
        available_capabilities: topCapabilities,
        improvisation_allowed: capabilitiesConfig.prompt_config.fallback_to_improvisation,
        improvisation_guidelines: capabilitiesConfig.prompt_config.improvisation_guidelines
      });
    } catch (error) {
      console.error('Error formatting agent capabilities:', error);
      return null;
    }
  }

  /**
   * Filter capabilities by current view context
   */
  private filterCapabilitiesByContext(
    config: any,
    currentView: string
  ): any[] {
    const allCapabilities: any[] = [];
    
    // Flatten all capabilities from all categories
    Object.values(config.capability_categories).forEach((category: any) => {
      category.capabilities.forEach((cap: any) => {
        // Include view_transitions special handling
        if (cap.id === 'switch_view') {
          // Always available from any view
          allCapabilities.push({
            ...cap,
            category: category.description,
            available_from: [currentView]
          });
        } else if (cap.available_from && cap.available_from.includes(currentView)) {
          allCapabilities.push({
            ...cap,
            category: category.description
          });
        }
      });
    });

    return allCapabilities;
  }

  /**
   * Rank capabilities by semantic similarity to recent conversation
   * 
   * Uses SharedEmbeddingService with Redis caching for fast lookups.
   * Fallback to keyword matching if embedding generation fails.
   * 
   * Performance:
   * - Cache hit: <10ms (Redis lookup)
   * - Cache miss: ~800ms (embedding generation)
   * - Capability embeddings cached for 7 days
   * - Conversation embeddings cached for 5 minutes
   */
  private async rankCapabilitiesByRelevance(
    capabilities: any[],
    conversationContext: any
  ): Promise<any[]> {
    if (!conversationContext?.recentMessages || conversationContext.recentMessages.length === 0) {
      return capabilities;
    }

    try {
      // 1. Join recent conversation text
      const recentText = conversationContext.recentMessages
        .map((m: any) => m.content)
        .join(' ');

      // 2. Generate conversation embedding (cached in Redis for 5 min)
      const convEmbedding = await this.sharedEmbeddingService.getEmbedding(
        recentText,
        conversationContext.userId || 'system',
        'capability-ranking'
      );

      // 3. Score each capability based on semantic similarity
      const capabilityScores = await Promise.all(
        capabilities.map(async (cap) => {
          if (!cap.trigger_patterns || cap.trigger_patterns.length === 0) {
            return { ...cap, relevance_score: 0, similarity_raw: 0 };
          }

          // Combine all trigger patterns for this capability
          const triggerText = cap.trigger_patterns.join('. ');
          
          // Get embedding (cached in Redis for 7 days)
          const capEmbedding = await this.sharedEmbeddingService.getEmbedding(
            triggerText,
            'system',
            `capability-${cap.id}`
          );

          // 4. Calculate cosine similarity
          const similarity = this.cosineSimilarity(convEmbedding, capEmbedding);
          
          // Scale to 0-100 for intuitive scoring
          const score = similarity * 100;

          return {
            ...cap,
            relevance_score: score,
            similarity_raw: similarity
          };
        })
      );

      // 5. Sort by relevance (descending)
      return capabilityScores.sort((a, b) => b.relevance_score - a.relevance_score);

    } catch (error) {
      console.error('Semantic ranking failed, falling back to keyword matching:', error);
      // Fallback to keyword matching
      return this.rankCapabilitiesByKeywords(capabilities, conversationContext);
    }
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimensions must match: ${a.length} vs ${b.length}`);
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magA === 0 || magB === 0) {
      return 0; // Avoid division by zero
    }
    
    return dotProduct / (magA * magB);
  }

  /**
   * Fallback: Keyword-based ranking when embedding fails
   */
  private rankCapabilitiesByKeywords(
    capabilities: any[],
    conversationContext: any
  ): any[] {
    const recentText = conversationContext.recentMessages
      .map((m: any) => m.content)
      .join(' ')
      .toLowerCase();

    const scored = capabilities.map(cap => {
      let score = 0;
      
      if (cap.trigger_patterns) {
        cap.trigger_patterns.forEach((pattern: string) => {
          // Exact substring match
          if (recentText.includes(pattern.toLowerCase())) {
            score += 10;
          }
          
          // Partial word match
          const words = pattern.toLowerCase().split(' ');
          const matchedWords = words.filter(word => recentText.includes(word));
          if (matchedWords.length > 0) {
            score += matchedWords.length * 2;
          }
        });
      }
      
      return { ...cap, relevance_score: score };
    });

    return scored.sort((a, b) => b.relevance_score - a.relevance_score);
  }
} 