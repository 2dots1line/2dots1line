import { UserRepository, ConversationRepository, users, conversation_messages } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { Redis } from 'ioredis';
import Mustache from 'mustache';
import { 
  CoreIdentity, 
  AugmentedMemoryContext, 
  SummarizedConversation 
} from '@2dots1line/shared-types';

export interface PromptBuildInput {
  userId: string;
  conversationId: string;
  finalInputText: string;
  augmentedMemoryContext?: AugmentedMemoryContext;
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
   * The primary method to assemble the complete system prompt for the DialogueAgent.
   */
  public async buildPrompt(input: PromptBuildInput): Promise<string> {
    const { userId, conversationId, finalInputText, augmentedMemoryContext } = input;
    
    console.log('\n🔧 PromptBuilder.buildPrompt - Starting prompt assembly...');
    console.log('📋 PromptBuilder - Input:', { 
      userId, 
      conversationId, 
      finalInputText: finalInputText.substring(0, 100) + '...',
      hasAugmentedContext: !!augmentedMemoryContext 
    });

    // --- STEP 1: FETCH DYNAMIC DATA & STATIC TEMPLATES IN PARALLEL ---
    // The ConfigService is assumed to be initialized at application startup, not per-call.
    const userPromise = this.userRepository.findUserByIdWithContext(userId); // Use more descriptive repo method
    const historyPromise = this.conversationRepository.getMostRecentMessages(conversationId, 10);
    const summariesPromise = this.conversationRepository.getRecentImportantConversationSummaries(userId);
    const turnContextPromise = this.redisClient.get(`turn_context:${conversationId}`);
    
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
    const isFirstTurn = conversationHistory.length === 0;

    console.log('📊 PromptBuilder - Data fetched:', {
      userFound: !!user,
      historyLength: conversationHistory.length,
      summariesCount: Array.isArray(recentSummaries) ? recentSummaries.length : 0,
      hasTurnContext: !!turnContext,
      isFirstTurn
    });

    // --- STEP 3: ASSEMBLE PROMPT COMPONENTS ---
    const components: (string | null)[] = [
      preambleTpl,
      Mustache.render(identityTpl, coreIdentity),
      this.formatComponent('user_memory_profile', user.memory_profile),
      this.formatComponent('knowledge_graph_schema', user.knowledge_graph_schema),
      this.formatComponent('summaries_of_recent_important_conversations_this_cycle', recentSummaries),
      isFirstTurn ? this.formatComponent('context_from_last_conversation', user.next_conversation_context_package) : null,
      !isFirstTurn ? this.formatComponent('context_from_last_turn', turnContext) : null,
      this.formatComponent('current_conversation_history', conversationHistory),
      this.formatComponent('augmented_memory_context', augmentedMemoryContext),
      responseFormatTpl,
      this.formatComponent('final_input_text', finalInputText),
      instructionsTpl
    ];

    const assembledPrompt = components.filter(c => c !== null).join('\n\n');
    
    console.log('\n📝 PromptBuilder - ASSEMBLED SYSTEM PROMPT:');
    console.log('='.repeat(80));
    console.log(assembledPrompt);
    console.log('='.repeat(80));
    console.log(`📏 PromptBuilder - Prompt length: ${assembledPrompt.length} characters\n`);
    
    return assembledPrompt;
  }

  /**
   * A helper to format a component into an XML-like tag structure.
   * If content is null, undefined, or an empty array, it returns a self-closing tag.
   */
  private formatComponent(tagName: string, content: any): string {
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
} 