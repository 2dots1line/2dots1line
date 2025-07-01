import { Request, Response } from 'express';
import { DialogueAgent, DialogueAgentDependencies, PromptBuilder } from '../DialogueAgent';
import { DatabaseService, ConversationRepository, UserRepository, MediaRepository } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { LLMChatTool, VisionCaptionTool, AudioTranscribeTool, DocumentExtractTool, HybridRetrievalTool } from '@2dots1line/tools';
import { Redis } from 'ioredis';
import { TDialogueAgentInput, TDialogueAgentOutput } from '@2dots1line/shared-types';
import { createHash } from 'crypto';

export class AgentController {
  private dialogueAgent: DialogueAgent;
  private databaseService: DatabaseService;
  private conversationRepository: ConversationRepository;
  private mediaRepository: MediaRepository;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.conversationRepository = new ConversationRepository(this.databaseService);
    this.mediaRepository = new MediaRepository(this.databaseService);
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
        // Transform response to match frontend expectations
        const response = {
          success: true,
          response_text: result.result?.response_text,
          conversation_id: result.result?.conversation_id,
          metadata: result.metadata
        };
        res.status(200).json(response);
      } else {
        res.status(500).json({
          success: false,
          error: result.error?.message || 'Internal Server Error'
        });
      }
    } catch (error) {
      console.error('Error in AgentController.chat:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };

  public upload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, message, conversation_id, file, context } = req.body;

      if (!userId || !file) {
        res.status(400).json({ success: false, error: 'userId and file are required.' });
        return;
      }

      let actualConversationId = conversation_id;
      if (!actualConversationId) {
        const newConversation = await this.conversationRepository.create({
          user_id: userId,
          title: `Image conversation started at ${new Date().toISOString()}`,
        });
        actualConversationId = newConversation.id;
      }

      // 1. Analyze image with VisionCaptionTool first (needed for media metadata)
      console.log('Analyzing uploaded image with VisionCaptionTool...');
      const visionInput = {
        user_id: userId,
        region: 'us' as const,
        payload: {
          imageUrl: file.dataUrl,
          imageType: file.mimetype.split('/')[1] || 'unknown'
        },
        metadata: {
          session_id: context?.session_id,
          timestamp: new Date().toISOString()
        }
      };

      const visionResult = await VisionCaptionTool.execute(visionInput);
      
      let imageAnalysis = 'Image uploaded but analysis not available.';
      if (visionResult.status === 'success' && visionResult.result) {
        imageAnalysis = `Image Analysis: ${visionResult.result.caption}`;
        
        if (visionResult.result.detectedObjects && visionResult.result.detectedObjects.length > 0) {
          const objects = visionResult.result.detectedObjects.map(obj => obj.name).join(', ');
          imageAnalysis += `\n\nDetected objects: ${objects}`;
        }
        
        if (visionResult.result.metadata?.scene_description) {
          imageAnalysis += `\n\nScene: ${visionResult.result.metadata.scene_description}`;
        }
      }

      // 2. Record file in media model
      let mediaRecord = null;
      try {
        // Generate hash for deduplication
        const fileHash = createHash('sha256').update(file.dataUrl).digest('hex');
        
        // Check if file already exists (deduplication)
        const existingMedia = await this.mediaRepository.findByHash(fileHash);
        
        if (existingMedia) {
          console.log(`File already exists in database: ${existingMedia.media_id}`);
          mediaRecord = existingMedia;
        } else {
          // Create new media record
          mediaRecord = await this.mediaRepository.create({
            user_id: userId,
            type: 'image',
            storage_url: file.dataUrl, // For now storing base64 directly, in production this would be a cloud storage URL
            filename: file.filename || file.originalname,
            mime_type: file.mimetype,
            size_bytes: file.size,
            hash: fileHash,
            processing_status: 'completed', // Since vision analysis already completed
            metadata: {
              upload_timestamp: new Date().toISOString(),
              conversation_id: actualConversationId,
              original_filename: file.originalname,
              vision_analysis_completed: true,
              vision_analysis_timestamp: new Date().toISOString(),
              vision_analysis_result: visionResult.status === 'success' ? visionResult.result : null
            }
          });
          
          console.log(`✅ Media record created: ${mediaRecord.media_id} (${file.size} bytes, ${file.mimetype})`);
        }
      } catch (error) {
        console.error('❌ Failed to record media in database:', error);
        // Continue with the flow even if media recording fails
      }

      // 3. Record user's message with media reference
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        role: 'user',
        content: message || 'What can you tell me about this image?',
        media_ids: mediaRecord ? [mediaRecord.media_id] : []
      });

      // 4. Record image analysis as assistant message
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        role: 'assistant',
        content: `[Image Analysis] ${imageAnalysis}`,
        media_ids: mediaRecord ? [mediaRecord.media_id] : []
      });

      // 5. Generate LLM response about the image using enhanced context
      // Include the image analysis directly in the message text for better integration
      const userQuestion = message || 'What can you tell me about this image?';
      
      // Combine user question with image analysis for better context
      const enhancedMessage = `${userQuestion}\n\n[Context: ${imageAnalysis}]`;

      const dialogueInput: TDialogueAgentInput = {
        user_id: userId,
        region: 'us' as const,
        payload: {
          message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          message_text: enhancedMessage, // Include image analysis in the message
          conversation_id: actualConversationId,
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          session_id: context?.session_id,
          timestamp: new Date().toISOString(),
          image_analysis_included: true,
          image_analysis_text: imageAnalysis,
          media_id: mediaRecord?.media_id
        }
      };

      const result: TDialogueAgentOutput = await this.dialogueAgent.processDialogue(dialogueInput);

      if (result.status === 'success') {
        // Transform response to match frontend expectations
        const response = {
          success: true,
          response_text: result.result?.response_text,
          conversation_id: result.result?.conversation_id,
          metadata: {
            ...result.metadata,
            image_analysis: imageAnalysis,
            media_record: mediaRecord ? {
              media_id: mediaRecord.media_id,
              type: mediaRecord.type,
              processing_status: mediaRecord.processing_status,
              created_at: mediaRecord.created_at,
              was_duplicate: !!mediaRecord && mediaRecord.created_at < new Date(Date.now() - 1000) // Simple check if created more than 1 second ago
            } : null,
            file_info: {
              filename: file.filename,
              originalname: file.originalname,
              size: file.size,
              mimetype: file.mimetype
            }
          }
        };
        res.status(200).json(response);
      } else {
        res.status(500).json({
          success: false,
          error: result.error?.message || 'Internal Server Error'
        });
      }

    } catch (error) {
      console.error('Error in AgentController.upload:', error);
      res.status(500).json({ success: false, error: 'File upload processing failed' });
    }
  };
} 