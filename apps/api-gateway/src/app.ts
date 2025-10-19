import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { createV1Routes } from './routes/v1';

// Import services and repositories for Composition Root
import { DatabaseService } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { DialogueAgent, PromptBuilder } from '@2dots1line/dialogue-service';
import { CosmosQuestAgent, CosmosQuestPromptBuilder } from '@2dots1line/cosmos-quest-service';
import { UserService, AuthService, DashboardService } from '@2dots1line/user-service';
import { CardService } from '@2dots1line/card-service';
import { UserRepository, ConversationRepository, SessionRepository, CardRepository, MediaRepository } from '@2dots1line/database';

// Import Tools for DialogueAgent
import { 
  LLMChatTool, 
  VisionCaptionTool, 
  AudioTranscribeTool, 
  DocumentExtractTool, 
  HybridRetrievalTool 
} from '@2dots1line/tools';

// Import Controllers
import { AuthController } from './controllers/auth.controller';
import { CardController } from './controllers/card.controller';
import { ConversationController } from './controllers/conversation.controller';
import { UserController } from './controllers/user.controller';
import { GraphController } from './controllers/graph.controller';
import { MediaController } from './controllers/media.controller';
import { HRTParametersController } from './controllers/hrtParameters.controller';
import { EmbeddingController } from './controllers/embedding.controller';
import { InsightController } from './controllers/insight.controller';

async function createApp(): Promise<express.Application> {
  const app: express.Application = express();
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
  }));
  app.use(express.json());

  // --- COMPOSITION ROOT ---
  // This is where we instantiate all our classes and inject dependencies.

  // Level 1: Core Infrastructure
  const databaseService = DatabaseService.getInstance();
  const configService = new ConfigService();
  
  // Environment variables are now loaded by DatabaseService
  
  // CRITICAL: Initialize ConfigService before using it
  console.log('🔧 Initializing ConfigService...');
  await configService.initialize();
  console.log('✅ ConfigService initialized successfully');

  // Level 2: Repositories
  const userRepo = new UserRepository(databaseService);
  const conversationRepo = new ConversationRepository(databaseService);
  const sessionRepo = new SessionRepository(databaseService); // NEW
  const cardRepo = new CardRepository(databaseService);
  const mediaRepo = new MediaRepository(databaseService);

  // Level 3: Headless Services (Business Logic) - V11.0 Architecture
  const userService = new UserService(databaseService);
  const authService = new AuthService(databaseService);
  const cardService = new CardService(databaseService);
  const dashboardService = new DashboardService(databaseService);

  // DialogueAgent with all required dependencies
  const promptBuilder = new PromptBuilder(configService, userRepo, conversationRepo, sessionRepo, databaseService.redis);
  const hybridRetrievalTool = new HybridRetrievalTool(databaseService, configService);
  
  const dialogueAgent = new DialogueAgent({
    configService,
    conversationRepository: conversationRepo,
    redisClient: databaseService.redis,
    promptBuilder,
    llmChatTool: LLMChatTool,
    visionCaptionTool: VisionCaptionTool,
    audioTranscribeTool: AudioTranscribeTool,
    documentExtractTool: DocumentExtractTool,
    hybridRetrievalTool: hybridRetrievalTool
  });

  // CosmosQuestAgent with all required dependencies
  const cosmosQuestPromptBuilder = new CosmosQuestPromptBuilder(configService, userRepo, conversationRepo, databaseService.redis);
  
  const cosmosQuestAgent = new CosmosQuestAgent({
    configService,
    conversationRepository: conversationRepo,
    userRepository: userRepo,
    redisClient: databaseService.redis,
    promptBuilder: cosmosQuestPromptBuilder,
    llmChatTool: LLMChatTool,
    hybridRetrievalTool: hybridRetrievalTool
  });

  // Level 4: Controllers (The final layer, receives services) - V11.0 Architecture
  const authController = new AuthController(authService);
  const userController = new UserController(userService, dashboardService);
  const cardController = new CardController(cardService);
  const conversationController = new ConversationController(dialogueAgent, conversationRepo, sessionRepo, mediaRepo, databaseService.redis);
  const graphController = new GraphController(databaseService);
  console.log('🔧 Initializing MediaController...');
  const mediaController = new MediaController();
  console.log('✅ MediaController initialized successfully');
  console.log('🔧 Initializing HRTParametersController...');
  const hrtParametersController = new HRTParametersController(databaseService);
  console.log('✅ HRTParametersController initialized successfully');
  
  console.log('🔧 Initializing EmbeddingController...');
  const embeddingController = new EmbeddingController(databaseService);
  console.log('✅ EmbeddingController initialized successfully');

  console.log('🔧 Initializing InsightController...');
  const insightController = new InsightController();
  console.log('✅ InsightController initialized successfully');

  // Level 5: Mount controllers onto the Express app
  app.use('/api/v1', createV1Routes(authController, userController, cardController, conversationController, graphController, mediaController, hrtParametersController, embeddingController, insightController, cosmosQuestAgent));

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export { createApp }; 