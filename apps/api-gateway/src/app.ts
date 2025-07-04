import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { createV1Routes } from './routes/v1';

// Import services and repositories for Composition Root
import { DatabaseService } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { DialogueAgent, PromptBuilder } from '@2dots1line/dialogue-service';
import { UserService, AuthService } from '@2dots1line/user-service';
import { CardService } from '@2dots1line/card-service';
import { UserRepository, ConversationRepository, CardRepository } from '@2dots1line/database';

// Import Controllers
import { AuthController } from './controllers/auth.controller';
import { CardController } from './controllers/card.controller';
import { ConversationController } from './controllers/conversation.controller';
import { UserController } from './controllers/user.controller';

const app: express.Application = express();
app.use(cors());
app.use(express.json());

// --- COMPOSITION ROOT ---
// This is where we instantiate all our classes and inject dependencies.

// Level 1: Core Infrastructure
const databaseService = DatabaseService.getInstance();
const configService = new ConfigService();

// Level 2: Repositories
const userRepo = new UserRepository(databaseService);
const conversationRepo = new ConversationRepository(databaseService);
const cardRepo = new CardRepository(databaseService);

// Level 3: Headless Services (Business Logic) - V11.0 Architecture
const userService = new UserService(databaseService);
const authService = new AuthService(databaseService);
const cardService = new CardService(databaseService);

// DialogueAgent requires more complex setup - will be implemented later
const promptBuilder = new PromptBuilder(configService, userRepo, conversationRepo, databaseService.redis);
const dialogueAgent = new DialogueAgent({
  configService,
  conversationRepository: conversationRepo,
  redisClient: databaseService.redis,
  promptBuilder,
  // TODO: Add remaining dependencies for DialogueAgent
} as any); // Temporary 'as any' during refactoring

// Level 4: Controllers (The final layer, receives services) - V11.0 Architecture
const authController = new AuthController(authService);
const userController = new UserController(userService);
const cardController = new CardController(cardService);
const conversationController = new ConversationController(dialogueAgent);

// Level 5: Mount controllers onto the Express app
app.use('/api/v1', createV1Routes(authController, userController, cardController, conversationController));

// Central Error Handler
app.use(errorHandler);

export default app; 