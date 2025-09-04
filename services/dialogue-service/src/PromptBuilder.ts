import { ConfigService } from '@2dots1line/config-service';
import { UserRepository, ConversationRepository, conversation_messages } from '@2dots1line/database';
import { 
  AugmentedMemoryContext
} from '@2dots1line/shared-types';
import { Redis } from 'ioredis';
import * as Mustache from 'mustache';
import { SessionRepository } from '@2dots1line/database';


export interface PromptBuildInput {
  userId: string;
  conversationId: string;
  finalInputText: string;
  augmentedMemoryContext?: AugmentedMemoryContext;
  isNewConversation: boolean; // V11.0: Flag from controller instead of complex logic
}

export interface PromptBuildOutput {
  systemPrompt: string;    // Background context (identity, memory profile, etc.)
  userPrompt: string;      // Current turn info (instructions, input text)
  conversationHistory: conversation_messages[]; // Properly formatted history
}

export class PromptBuilder {
  // Dependencies are injected via the constructor for testability and DI best practices.
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private conversationRepository: ConversationRepository,
    private sessionRepository: SessionRepository, // NEW DEPENDENCY
    private redisClient: Redis
  ) {}

  /**
   * V11.0 STANDARD: Build separate system and user prompts + conversation history
   * READ-ONLY: No side effects, no database writes
   */
  public async buildPrompt(input: PromptBuildInput): Promise<PromptBuildOutput> {
    const { userId, conversationId, finalInputText, augmentedMemoryContext, isNewConversation } = input;
    
    console.log('\n🔧 PromptBuilder.buildPrompt - Starting V11.0 prompt assembly...');
    console.log('📋 PromptBuilder - Input:', { 
      userId, 
      conversationId, 
      finalInputText: finalInputText.substring(0, 100) + '...',
      hasAugmentedContext: !!augmentedMemoryContext,
      isNewConversation
    });

    // --- STEP 1: FETCH ALL DYNAMIC DATA IN PARALLEL (READ-ONLY) ---
    const userPromise = this.userRepository.findUserByIdWithContext(userId);
    const historyPromise = this.conversationRepository.getMostRecentMessages(conversationId, 10);
    const summariesPromise = this.conversationRepository.getRecentImportantConversationSummaries(userId);
    const turnContextPromise = this.redisClient.get(`turn_context:${conversationId}`);
    const sessionContextPromise = this.getSessionContext(userId, conversationId); // NEW: Session context
    
    // Get new optimized templates
    const coreIdentityTpl = this.configService.getTemplate('core_identity_section');
    const operationalConfigTpl = this.configService.getTemplate('operational_config_section');
    const dynamicContextTpl = this.configService.getTemplate('dynamic_context_section');
    const currentTurnTpl = this.configService.getTemplate('current_turn_section');
    const coreIdentity = this.configService.getCoreIdentity();

    // --- STEP 2: AWAIT ALL DATA ---
    const [user, conversationHistory, recentSummaries, turnContextStr, sessionContext] = await Promise.all([
      userPromise,
      historyPromise,
      summariesPromise,
      turnContextPromise,
      sessionContextPromise // NEW
    ]);

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
      hasNextContextPackage: !!user.next_conversation_context_package
    });

    // --- STEP 3: BUILD OPTIMIZED 4-SECTION PROMPT ---
    
    // Section 1: Core Identity (Static - Highest Cache Hit Rate)
    const section1 = Mustache.render(coreIdentityTpl, { user_name: user.name || 'User' });
    
    // Section 2: Operational Configuration (Semi-Static - Medium Cache Hit Rate)
    const section2 = Mustache.render(operationalConfigTpl, { user_name: user.name || 'User' });
    
    // Section 3: Dynamic Context (Variable Cache Hit Rate - Ordered by Stability)
    const section3Data = {
      knowledge_graph_schema: this.formatComponentContent('knowledge_graph_schema', user.knowledge_graph_schema),
      user_memory_profile: this.formatComponentContent('user_memory_profile', user.memory_profile),
      conversation_summaries: this.formatComponentContent('conversation_summaries', recentSummaries),
      session_context: sessionContext.length > 0 ? this.formatComponentContent('session_context', sessionContext) : null,
      current_conversation_history: this.formatComponentContent('current_conversation_history', conversationHistory),
      augmented_memory_context: this.formatComponentContent('augmented_memory_context', augmentedMemoryContext)
    };
    const section3 = Mustache.render(dynamicContextTpl, section3Data);
    
    // Section 4: Current Turn (No Cache - Turn-Specific)
    const section4Data = {
      context_from_last_conversation: isNewConversation ? 
        this.formatContextFromLastConversation(user.next_conversation_context_package, user.name || 'User') : null,
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
    } else if (typeof content === 'string') {
      return this.decodeHtmlEntities(content);
    } else {
      // For JSON content, decode HTML entities in string values
      const jsonString = JSON.stringify(content, null, 2);
      return this.decodeHtmlEntities(jsonString);
    }
  }

  /**
   * Formats conversation history into a clean, LLM-friendly transcript.
   */
  private formatConversationHistory(messages: conversation_messages[]): string {
    // The history is fetched most-recent-first, so we reverse it for chronological order.
    return [...messages].reverse().map(msg => 
      `${msg.role.toUpperCase()}: ${this.decodeHtmlEntities(msg.content)}`
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
   * NEW METHOD: Get session context from previous conversations in same session
   */
  private async getSessionContext(userId: string, conversationId: string): Promise<conversation_messages[]> {
    try {
      console.log(`🔍 PromptBuilder.getSessionContext - Starting for conversation: ${conversationId}`);
      
      // Get current conversation to find its session
      const conversation = await this.conversationRepository.findByIdWithSessionId(conversationId);
      console.log(`🔍 PromptBuilder.getSessionContext - Conversation found:`, {
        id: conversation?.id,
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
        3 // Last 3 messages from most recent processed conversation
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
      .map(msg => `${msg.role.toUpperCase()}: ${this.decodeHtmlEntities(msg.content)}`)
      .join('\n');
    
    return `## Session Context (Previous Conversation in Same Chat Window)
This context comes from the most recently processed conversation in your current chat session:

${contextText}

---`;
  }
} 