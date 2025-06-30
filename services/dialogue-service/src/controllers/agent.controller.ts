import { Request, Response } from 'express';
import { DialogueAgent, DialogueAgentDependencies, PromptBuilder } from '../DialogueAgent';
import { DatabaseService, ConversationRepository, UserRepository } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { LLMChatTool, VisionCaptionTool, AudioTranscribeTool, DocumentExtractTool, HybridRetrievalTool } from '@2dots1line/tools';
import { Redis } from 'ioredis';
import { TDialogueAgentInput, TDialogueAgentOutput } from '@2dots1line/shared-types';

export class AgentController {
  private dialogueAgent: DialogueAgent;
  private databaseService: DatabaseService;
  private conversationRepository: ConversationRepository;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.conversationRepository = new ConversationRepository(this.databaseService);
    const userRepository = new UserRepository(this.databaseService);
    const configService = new ConfigService();
    const redisClient = this.databaseService.redis;

    const dependencies: DialogueAgentDependencies = {
      configService,
      conversationRepository: this.conversationRepository,
      redisClient,
      promptBuilder: new PromptBuilder(configService, userRepository, this.conversationRepository, redisClient),
      llmChatTool: LLMChatTool,
      visionCaptionTool: VisionCaptionTool,
      audioTranscribeTool: AudioTranscribeTool,
      documentExtractTool: DocumentExtractTool,
      hybridRetrievalTool: new HybridRetrievalTool(this.databaseService, configService)
    };
    
    this.dialogueAgent = new DialogueAgent(dependencies);
    console.log('✅ DialogueAgent initialized successfully within dialogue-service.');
  }

  public chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, message, conversation_id, source_card_id, context } = req.body;

      if (!userId || !message) {
        res.status(400).json({ success: false, error: 'userId and message are required.' });
        return;
      }
      
      let actualConversationId = conversation_id;
      if (!actualConversationId) {
        const newConversation = await this.conversationRepository.create({
          user_id: userId,
          title: `Conversation started at ${new Date().toISOString()}`,
        });
        actualConversationId = newConversation.id;
      }

      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        role: 'user',
        content: message,
      });

      const dialogueInput: TDialogueAgentInput = {
        user_id: userId,
        region: 'us', // Default region
        payload: {
          message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          message_text: message,
          conversation_id: actualConversationId,
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          source_card_id: source_card_id,
          session_id: context?.session_id,
          timestamp: new Date().toISOString()
        }
      };

      const result: TDialogueAgentOutput = await this.dialogueAgent.processDialogue(dialogueInput);

      if (result.status === 'success') {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in AgentController.chat:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
} 