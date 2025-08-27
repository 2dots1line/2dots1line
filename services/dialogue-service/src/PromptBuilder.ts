import { ConfigService } from '@2dots1line/config-service';
import { UserRepository, ConversationRepository, conversation_messages } from '@2dots1line/database';
import { 
  AugmentedMemoryContext
} from '@2dots1line/shared-types';
import { Redis } from 'ioredis';
import * as Mustache from 'mustache';


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
    
    // Get static templates
    const preambleTpl = this.configService.getTemplate('preamble');
    const identityTpl = this.configService.getTemplate('system_identity_template');
    const responseFormatTpl = this.configService.getTemplate('response_format_block');
    const instructionsTpl = this.configService.getTemplate('dialogue_agent_instructions');
    const coreIdentity = this.configService.getCoreIdentity();

    // --- STEP 2: AWAIT ALL DATA ---
    const [user, conversationHistory, recentSummaries, turnContextStr] = await Promise.all([
      userPromise,
      historyPromise,
      summariesPromise,
      turnContextPromise
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

    // --- STEP 3: BUILD SYSTEM PROMPT (Background Context) ---
    const systemComponents: (string | null)[] = [
      Mustache.render(preambleTpl, { user_name: user.name || 'User' }),
      Mustache.render(identityTpl, { ...coreIdentity, user_name: user.name || 'User' }),
      this.formatComponent('user_memory_profile', user.memory_profile),
      this.formatComponent('knowledge_graph_schema', user.knowledge_graph_schema),
      this.formatComponent('summaries_of_recent_important_conversations_this_cycle', recentSummaries),
      
      // V11.0 SIMPLIFIED LOGIC: Use flag from controller
      isNewConversation ? 
        this.formatContextFromLastConversation(user.next_conversation_context_package, user.name || 'User') : 
        this.formatContextFromLastTurn(turnContext, user.name || 'User')
    ];

    const systemPrompt = systemComponents.filter(c => c !== null).join('\n\n');

    // --- STEP 4: BUILD USER PROMPT (Current Turn Context) ---
    const userComponents: (string | null)[] = [
      this.formatComponent('augmented_memory_context', augmentedMemoryContext),
      responseFormatTpl,
      this.formatComponent('final_input_text', finalInputText),
      Mustache.render(instructionsTpl, { user_name: user.name || 'User' })
    ];

    const userPrompt = userComponents.filter(c => c !== null).join('\n\n');
    
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
   * If content is null, undefined, or an empty array, it returns a self-closing tag.
   */
  private formatComponent(tagName: string, content: unknown): string {
    if (content === null || content === undefined || (Array.isArray(content) && content.length === 0)) {
      return `<${tagName}>\n</${tagName}>`;
    }
    
    let formattedContent: string;

    // Handle special formatting for conversation history
    if (tagName === 'current_conversation_history' && Array.isArray(content)) {
      formattedContent = this.formatConversationHistory(content as conversation_messages[]);
    } else if (typeof content === 'string') {
      formattedContent = content;
    } else {
      formattedContent = JSON.stringify(content, null, 2);
    }
      
    return `<${tagName}>\n${formattedContent}\n</${tagName}>`;
  }

  /**
   * Formats conversation history into a clean, LLM-friendly transcript.
   */
  private formatConversationHistory(messages: conversation_messages[]): string {
    // The history is fetched most-recent-first, so we reverse it for chronological order.
    return [...messages].reverse().map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
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
} 