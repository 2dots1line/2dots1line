import { Request, Response } from 'express';
import { DialogueAgent, DialogueAgentDependencies, PromptBuilder } from '../DialogueAgent';
import { DatabaseService, ConversationRepository, UserRepository, MediaRepository } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { LLMChatTool, VisionCaptionTool, AudioTranscribeTool, DocumentExtractTool, HybridRetrievalTool } from '@2dots1line/tools';
import { Redis } from 'ioredis';
import { TDialogueAgentInput, TDialogueAgentOutput } from '@2dots1line/shared-types';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

      // 1. Determine file type and route to appropriate tool
      const fileType = this.determineFileType(file.mimetype, file.filename || file.originalname);
      console.log(`Processing uploaded ${fileType}: ${file.filename || file.originalname} (${file.mimetype})`);
      
      let extractedContent = '';
      let analysisResult: any = null;
      
      if (fileType === 'image') {
        // Handle image files with VisionCaptionTool
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
        analysisResult = visionResult;
        
        if (visionResult.status === 'success' && visionResult.result) {
          extractedContent = `Image Analysis: ${visionResult.result.caption}`;
          
          if (visionResult.result.detectedObjects && visionResult.result.detectedObjects.length > 0) {
            const objects = visionResult.result.detectedObjects.map(obj => obj.name).join(', ');
            extractedContent += `\n\nDetected objects: ${objects}`;
          }
          
          if (visionResult.result.metadata?.scene_description) {
            extractedContent += `\n\nScene: ${visionResult.result.metadata.scene_description}`;
          }
        } else {
          extractedContent = 'Image uploaded but analysis not available.';
        }
      } else if (fileType === 'document') {
        // Handle document files with DocumentExtractTool  
        console.log('Extracting text from uploaded document with DocumentExtractTool...');
        
        // For base64 data, we need to save it temporarily to a file for DocumentExtractTool
        const tempFilePath = await this.saveBase64ToTempFile(file.dataUrl, file.filename || file.originalname);
        
        try {
          const documentInput = {
            user_id: userId,
            region: 'us' as const,
            payload: {
              documentUrl: tempFilePath,
              documentType: file.mimetype
            },
            metadata: {
              session_id: context?.session_id,
              timestamp: new Date().toISOString()
            }
          };

          const documentResult = await DocumentExtractTool.execute(documentInput);
          analysisResult = documentResult;
          
          if (documentResult.status === 'success' && documentResult.result) {
            extractedContent = `Document Content:\n\n${documentResult.result.extractedText}`;
            
                         if (documentResult.result.metadata) {
               const meta = documentResult.result.metadata;
               extractedContent += `\n\n--- Document Metadata ---\n`;
               extractedContent += `File: ${(meta as any).fileName || meta.title || 'Unknown'}\n`;
               extractedContent += `Words: ${(meta as any).wordCount || 'Unknown'}\n`;
               extractedContent += `Language: ${meta.language || 'Unknown'}`;
             }
          } else {
            extractedContent = 'Document uploaded but text extraction failed.';
          }
        } finally {
          // Clean up temporary file
          await this.cleanupTempFile(tempFilePath);
        }
      } else {
        extractedContent = `File uploaded but type '${fileType}' is not supported for content extraction.`;
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
            type: fileType,
            storage_url: file.dataUrl, // For now storing base64 directly, in production this would be a cloud storage URL
            filename: file.filename || file.originalname,
            mime_type: file.mimetype,
            size_bytes: file.size,
            hash: fileHash,
            processing_status: 'completed', // Since analysis already completed
            metadata: {
              upload_timestamp: new Date().toISOString(),
              conversation_id: actualConversationId,
              original_filename: file.originalname,
              file_type: fileType,
              analysis_completed: true,
              analysis_timestamp: new Date().toISOString(),
              analysis_result: analysisResult?.status === 'success' ? analysisResult.result : null
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

      // 4. Record extracted content as assistant message
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        role: 'assistant',
        content: `[${fileType === 'image' ? 'Image Analysis' : 'Document Content'}] ${extractedContent}`,
        media_ids: mediaRecord ? [mediaRecord.media_id] : []
      });

      // 5. Generate LLM response using enhanced context
      // Include the extracted content directly in the message text for better integration
      const userQuestion = message || (fileType === 'image' ? 'What can you tell me about this image?' : 'Please summarize this document');
      
      // Combine user question with extracted content for better context
      const enhancedMessage = `${userQuestion}\n\n[Context: ${extractedContent}]`;

      const dialogueInput: TDialogueAgentInput = {
        user_id: userId,
        region: 'us' as const,
        payload: {
          message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          message_text: enhancedMessage, // Include extracted content in the message
          conversation_id: actualConversationId,
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          session_id: context?.session_id,
          timestamp: new Date().toISOString(),
          content_extracted: true,
          extracted_content: extractedContent,
          file_type: fileType,
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
            extracted_content: extractedContent,
            file_type: fileType,
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

  private determineFileType(mimeType: string, filename: string): 'image' | 'document' | 'unknown' {
    // Check MIME type first
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    
    // Check for document MIME types
    const documentMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ];
    
    if (documentMimeTypes.includes(mimeType)) {
      return 'document';
    }
    
    // Fallback to file extension
    const extension = path.extname(filename).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    }
    
    if (documentExtensions.includes(extension)) {
      return 'document';
    }
    
    return 'unknown';
  }

  private async saveBase64ToTempFile(dataUrl: string, originalFilename: string): Promise<string> {
    try {
      // Extract base64 data from data URL (format: data:mime/type;base64,actualdata)
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URL format');
      }
      
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate temporary file path
      const tempDir = os.tmpdir();
      const extension = path.extname(originalFilename);
      const tempFilename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${extension}`;
      const tempFilePath = path.join(tempDir, tempFilename);
      
      // Write to temporary file
      fs.writeFileSync(tempFilePath, buffer);
      
      console.log(`Saved temporary file: ${tempFilePath} (${buffer.length} bytes)`);
      return tempFilePath;
    } catch (error) {
      console.error('Error saving base64 to temp file:', error);
      throw new Error(`Failed to save temporary file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error cleaning up temporary file ${filePath}:`, error);
      // Don't throw here, as cleanup failure shouldn't break the main flow
    }
  }
} 