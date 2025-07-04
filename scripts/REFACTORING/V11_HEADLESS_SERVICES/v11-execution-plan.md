# V11.0 Headless Services - Detailed Execution Plan

**Date**: January 3, 2025  
**Executor**: AI Agent (Claude)  
**Architecture**: V11.0 "Great Refactoring" - Headless Service Libraries  
**Estimated Duration**: 2-3 hours systematic implementation

---

## 🎯 **EXECUTION OVERVIEW**

This plan systematically transforms the current flawed architecture (multiple redundant HTTP servers) into the correct V11.0 headless service architecture (single API Gateway with pure business logic libraries).

### **Execution Principles**
1. **Fail-Safe**: Create backup branch before any deletions
2. **Incremental**: Verify each phase before proceeding  
3. **Documented**: Track all changes for potential rollback
4. **Tested**: Validate functionality after each phase

---

## 🚀 **PRE-EXECUTION CHECKLIST**

### **Environment Preparation**
- [ ] ✅ Create backup branch: `git checkout -b backup/pre-v11-refactoring`
- [ ] ✅ Create feature branch: `git checkout -b feature/v11-headless-services`
- [ ] ✅ Stop all running services: `pnpm services:stop`
- [ ] ✅ Verify Docker databases running: `docker ps | grep -E "(postgres|redis|weaviate|neo4j)"`
- [ ] ✅ Clean build artifacts: `pnpm clean`

### **Documentation Preparation**
- [ ] ✅ Document current service URLs (for rollback reference)
- [ ] ✅ Backup critical configuration files
- [ ] ✅ Note any active development sessions

---

## 📝 **PHASE 1: SERVICE STRIPPING** 
*Goal: Remove all redundant HTTP infrastructure from services*

### **Step 1.1: Delete API Gateway Monolithic Controller**
```bash
# Delete the incorrectly structured agent controller
rm -f apps/api-gateway/src/controllers/agent.controller.ts

# Verify deletion
ls -la apps/api-gateway/src/controllers/
```

### **Step 1.2: Strip Dialogue Service HTTP Infrastructure**
```bash
# Delete HTTP-related files
rm -rf services/dialogue-service/src/controllers/
rm -rf services/dialogue-service/src/routes/
rm -f services/dialogue-service/src/app.ts
rm -f services/dialogue-service/src/server.ts

# Verify core business logic remains
ls -la services/dialogue-service/src/
# Should show: DialogueAgent.ts, PromptBuilder.ts, index.ts
```

### **Step 1.3: Strip User Service HTTP Infrastructure**
```bash
# Delete HTTP-related files
rm -rf services/user-service/src/controllers/
rm -rf services/user-service/src/routes/
rm -f services/user-service/src/app.ts
rm -f services/user-service/src/server.ts

# Verify structure
ls -la services/user-service/src/
# Should show: index.ts and prepare for new UserService.ts
```

### **Step 1.4: Strip Card Service HTTP Infrastructure**
```bash
# Delete HTTP-related files
rm -rf services/card-service/src/controllers/
rm -rf services/card-service/src/routes/
rm -f services/card-service/src/app.ts
rm -f services/card-service/src/server.ts

# Verify core business logic remains
ls -la services/card-service/src/
# Should show: CardService.ts, CardFactory.ts, index.ts
```

### **Step 1.5: Update Service Package Dependencies**
```bash
# Remove HTTP-related dependencies from each service
cd services/dialogue-service
# Edit package.json to remove: express, cors, axios
cd ../user-service
# Edit package.json to remove: express, cors, axios
cd ../card-service
# Edit package.json to remove: express, cors, axios
cd ../..
```

**✅ Phase 1 Verification**
```bash
# Verify no HTTP servers remain in services
find services/ -name "server.ts" -o -name "app.ts" | wc -l
# Should return 0

# Verify no controllers or routes remain
find services/ -type d -name "controllers" -o -name "routes" | wc -l
# Should return 0
```

---

## 🔧 **PHASE 2: PURE LIBRARY TRANSFORMATION**
*Goal: Transform services into pure business logic libraries*

### **Step 2.1: Transform Dialogue Service**

#### **Update index.ts**
```typescript
// services/dialogue-service/src/index.ts
export { DialogueAgent } from './DialogueAgent';
export { PromptBuilder } from './PromptBuilder';

// Remove any server startup code
```

#### **Update package.json**
```json
// services/dialogue-service/package.json
{
  "name": "@2dots1line/dialogue-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@2dots1line/database": "workspace:*",
    "@2dots1line/shared-types": "workspace:*",
    "@2dots1line/core-utils": "workspace:*",
    "@2dots1line/tools": "workspace:*",
    "ioredis": "^5.3.2"
    // Remove: express, cors, axios
  }
}
```

### **Step 2.2: Create User Service Pure Libraries**

#### **Create UserService.ts**
```typescript
// services/user-service/src/UserService.ts
import { DatabaseService, UserRepository } from '@2dots1line/database';
import type { User } from '@2dots1line/shared-types';

export class UserService {
  private userRepository: UserRepository;

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
  }

  async getUserProfile(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    return this.userRepository.update(userId, updates);
  }

  async getUserGrowthProfile(userId: string): Promise<any> {
    // Implement growth profile logic
    throw new Error('UserService.getUserGrowthProfile() - Implementation pending');
  }

  async getDashboardGrowthSummary(userId: string): Promise<any> {
    // Implement dashboard summary logic
    throw new Error('UserService.getDashboardGrowthSummary() - Implementation pending');
  }
}
```

#### **Create AuthService.ts**
```typescript
// services/user-service/src/AuthService.ts
import { DatabaseService, UserRepository } from '@2dots1line/database';
import { validatePassword, hashPassword } from '@2dots1line/core-utils';
import type { User, LoginCredentials, RegisterCredentials } from '@2dots1line/shared-types';

export class AuthService {
  private userRepository: UserRepository;

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; token: string }> {
    const { email, password, name } = credentials;
    
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await this.userRepository.create({
      email,
      hashedPassword,
      name
    });

    // Generate JWT token
    const token = this.generateJWTToken(user.userId);
    
    return { user, token };
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const { email, password } = credentials;
    
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Validate password
    const isValidPassword = await validatePassword(password, user.hashedPassword);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateJWTToken(user.userId);
    
    return { user, token };
  }

  private generateJWTToken(userId: string): string {
    // JWT generation logic
    throw new Error('AuthService.generateJWTToken() - Implementation pending');
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    // Token refresh logic
    throw new Error('AuthService.refreshToken() - Implementation pending');
  }
}
```

#### **Update User Service index.ts**
```typescript
// services/user-service/src/index.ts
export { UserService } from './UserService';
export { AuthService } from './AuthService';
```

#### **Update User Service package.json**
```json
// services/user-service/package.json
{
  "name": "@2dots1line/user-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@2dots1line/database": "workspace:*",
    "@2dots1line/shared-types": "workspace:*",
    "@2dots1line/core-utils": "workspace:*"
    // Remove: express, cors, axios
  }
}
```

### **Step 2.3: Transform Card Service**

#### **Update Card Service index.ts**
```typescript
// services/card-service/src/index.ts
export { CardService } from './CardService';
export { CardFactory } from './CardFactory';
```

#### **Update Card Service package.json**
```json
// services/card-service/package.json
{
  "name": "@2dots1line/card-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@2dots1line/database": "workspace:*",
    "@2dots1line/shared-types": "workspace:*",
    "@2dots1line/core-utils": "workspace:*"
    // Remove: express, cors, axios
  }
}
```

**✅ Phase 2 Verification**
```bash
# Verify all services export only classes
grep -r "export.*class" services/*/src/index.ts

# Verify no HTTP dependencies remain
grep -r "express\|cors\|axios" services/*/package.json
# Should return no results

# Build services as libraries
pnpm --filter=@2dots1line/dialogue-service build
pnpm --filter=@2dots1line/user-service build
pnpm --filter=@2dots1line/card-service build
```

---

## 🏗️ **PHASE 3: API GATEWAY ENHANCEMENT**
*Goal: Implement dependency injection and direct service usage*

### **Step 3.1: Create Dependency Injection Container**
```typescript
// apps/api-gateway/src/container.ts
import { DatabaseService } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { DialogueAgent, PromptBuilder } from '@2dots1line/dialogue-service';
import { UserService, AuthService } from '@2dots1line/user-service';
import { CardService } from '@2dots1line/card-service';
import { 
  UserRepository, 
  ConversationRepository,
  CardRepository,
  MemoryUnitRepository 
} from '@2dots1line/database';
import Redis from 'ioredis';

// Container to hold all singleton instances
export const container = {} as any;

export async function initializeContainer() {
  console.log('🚀 Initializing application container...');

  // Level 1: Core Infrastructure
  container.databaseService = DatabaseService.getInstance();
  container.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  container.configService = new ConfigService(container.redisClient);
  await container.configService.initialize();
  
  // Level 2: Repositories
  container.userRepository = new UserRepository(container.databaseService);
  container.conversationRepository = new ConversationRepository(container.databaseService);
  container.cardRepository = new CardRepository(container.databaseService);
  container.memoryUnitRepository = new MemoryUnitRepository(container.databaseService);

  // Level 3: Business Logic Services
  container.authService = new AuthService(container.databaseService);
  container.userService = new UserService(container.databaseService);
  container.cardService = new CardService(container.databaseService, container.configService);
  
  // Level 4: Complex Services (with multiple dependencies)
  container.promptBuilder = new PromptBuilder(
    container.configService,
    container.userRepository,
    container.conversationRepository,
    container.redisClient
  );
  
  container.dialogueAgent = new DialogueAgent({
    configService: container.configService,
    conversationRepository: container.conversationRepository,
    memoryUnitRepository: container.memoryUnitRepository,
    redisClient: container.redisClient,
    promptBuilder: container.promptBuilder
  });

  console.log('✅ Application container initialized successfully');
}
```

### **Step 3.2: Create Conversation Controller**
```typescript
// apps/api-gateway/src/controllers/conversation.controller.ts
import { Request, Response } from 'express';
import { DialogueAgent } from '@2dots1line/dialogue-service';
import { ConversationRepository } from '@2dots1line/database';
import Redis from 'ioredis';
import { REDIS_CONVERSATION_HEARTBEAT_PREFIX, DEFAULT_CONVERSATION_TIMEOUT_SECONDS } from '@2dots1line/core-utils';

export class ConversationController {
  constructor(
    private dialogueAgent: DialogueAgent,
    private conversationRepo: ConversationRepository,
    private redisClient: Redis
  ) {}

  public postMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { message, conversation_id } = req.body;
      
      let actualConversationId = conversation_id;
      if (!actualConversationId) {
        const newConvo = await this.conversationRepo.create({ 
          userId, 
          title: `New Conversation`,
          status: 'active'
        });
        actualConversationId = newConvo.id;
      }

      // Set Redis heartbeat
      const heartbeatKey = `${REDIS_CONVERSATION_HEARTBEAT_PREFIX}${actualConversationId}`;
      await this.redisClient.set(heartbeatKey, 'active', 'EX', DEFAULT_CONVERSATION_TIMEOUT_SECONDS);
      
      // Log user message
      await this.conversationRepo.addMessage({ 
        conversationId: actualConversationId, 
        role: 'user', 
        content: message 
      });

      // DIRECTLY call the service method (no HTTP!)
      const result = await this.dialogueAgent.processTurn({ 
        userId, 
        conversationId: actualConversationId, 
        currentMessageText: message 
      });
      
      // Reset heartbeat after successful processing
      await this.redisClient.set(heartbeatKey, 'active', 'EX', DEFAULT_CONVERSATION_TIMEOUT_SECONDS);
      
      res.status(200).json({ 
        success: true, 
        conversation_id: actualConversationId,
        data: result 
      });
    } catch (error) {
      console.error('Error in ConversationController:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };

  public uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { conversation_id } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      // DIRECTLY call the service method
      const result = await this.dialogueAgent.processFileUpload({
        userId,
        conversationId: conversation_id,
        file: file
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Error in ConversationController upload:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
}
```

### **Step 3.3: Update API Gateway Controllers**

#### **Update Auth Controller**
```typescript
// apps/api-gateway/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '@2dots1line/user-service';
import type { TApiResponse, TRegisterRequest, TLoginRequest } from '@2dots1line/shared-types';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body as TRegisterRequest);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error in auth register:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body as TLoginRequest);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error in auth login:', error);
      res.status(401).json({ success: false, error: error.message });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from your client.'
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.refreshToken(req.body.refreshToken);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error in auth refresh token:', error);
      res.status(401).json({ success: false, error: error.message });
    }
  };
}
```

#### **Update User Controller**
```typescript
// apps/api-gateway/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '@2dots1line/user-service';
import type { TApiResponse } from '@2dots1line/shared-types';

export class UserController {
  constructor(private userService: UserService) {}

  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const user = await this.userService.getUserProfile(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error in getUserProfile:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };

  getGrowthProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const growthProfile = await this.userService.getUserGrowthProfile(userId);
      res.status(200).json({ success: true, data: growthProfile });
    } catch (error: any) {
      console.error('Error in getGrowthProfile:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };

  getDashboardGrowthSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const summary = await this.userService.getDashboardGrowthSummary(userId);
      res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      console.error('Error in getDashboardGrowthSummary:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
}
```

#### **Update Card Controller**
```typescript
// apps/api-gateway/src/controllers/card.controller.ts
import { Request, Response } from 'express';
import { CardService } from '@2dots1line/card-service';

export class CardController {
  constructor(private cardService: CardService) {}

  public getCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const cards = await this.cardService.getCardsForUser(userId, req.query as any);
      res.status(200).json({ success: true, data: cards });
    } catch (error: any) {
      console.error('Error in getCards:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch cards' });
    }
  };

  public getCardBySourceEntity = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { entityId } = req.params;
      const { type } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!type) {
        res.status(400).json({ error: 'Query parameter "type" is required.' });
        return;
      }

      const card = await this.cardService.getCardBySourceEntity(userId, entityId, type as string);
      if (!card) {
        res.status(404).json({ success: false, error: 'Card not found' });
        return;
      }

      res.status(200).json({ success: true, data: card });
    } catch (error: any) {
      console.error('Error in getCardBySourceEntity:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch card details' });
    }
  };

  public getCardDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { cardId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const card = await this.cardService.getCardDetails(userId, cardId);
      if (!card) {
        res.status(404).json({ success: false, error: 'Card not found' });
        return;
      }

      res.status(200).json({ success: true, data: card });
    } catch (error: any) {
      console.error('Error in getCardDetails:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch card details' });
    }
  };
}
```

### **Step 3.4: Update Routes to Use Container**
```typescript
// apps/api-gateway/src/routes/v1/index.ts
import { Router, type IRouter } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { uploadSingle, handleUploadError } from '../../middleware/upload.middleware';
import { container } from '../../container';

// Import controller classes
import { AuthController } from '../../controllers/auth.controller';
import { ConversationController } from '../../controllers/conversation.controller';
import { CardController } from '../../controllers/card.controller';
import { UserController } from '../../controllers/user.controller';

const v1Router: IRouter = Router();

// Instantiate controllers with injected dependencies
const authController = new AuthController(container.authService);
const conversationController = new ConversationController(
  container.dialogueAgent,
  container.conversationRepository,
  container.redisClient
);
const cardController = new CardController(container.cardService);
const userController = new UserController(container.userService);

// --- Auth Routes (Public) ---
v1Router.post('/auth/register', authController.register);
v1Router.post('/auth/login', authController.login);
v1Router.post('/auth/logout', authController.logout);
v1Router.post('/auth/refresh', authController.refreshToken);

// --- Conversation Routes (Authenticated) ---
v1Router.post('/agent/chat', authMiddleware, conversationController.postMessage);
v1Router.post('/agent/upload', authMiddleware, uploadSingle, conversationController.uploadFile, handleUploadError);

// --- User Routes (Authenticated) ---
v1Router.get('/users/me/profile', authMiddleware, userController.getUserProfile);
v1Router.get('/users/me/growth-profile', authMiddleware, userController.getGrowthProfile);
v1Router.get('/users/me/dashboard/growth-summary', authMiddleware, userController.getDashboardGrowthSummary);

// --- Card Routes (Authenticated) ---
v1Router.get('/cards', authMiddleware, cardController.getCards);
v1Router.get('/cards/by-source/:entityId', authMiddleware, cardController.getCardBySourceEntity);
v1Router.get('/cards/:cardId', authMiddleware, cardController.getCardDetails);

// --- Graph Routes (Authenticated) ---
v1Router.get('/graph-projection/latest', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Graph projection endpoint not yet implemented.' });
});

export default v1Router;
```

### **Step 3.5: Update Server to Initialize Container**
```typescript
// apps/api-gateway/src/server.ts
import app from './app';
import { initializeContainer } from './container';

const PORT = process.env.API_GATEWAY_PORT || 3001;

async function start() {
  try {
    console.log('🚀 Starting API Gateway...');
    
    // Initialize all dependencies BEFORE starting the server
    await initializeContainer();
    
    app.listen(PORT, () => {
      console.log(`✅ API Gateway is running on port ${PORT}`);
      console.log(`🔗 All services integrated via dependency injection`);
    });
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
}

start();
```

### **Step 3.6: Update API Gateway Package Dependencies**
```json
// apps/api-gateway/package.json
{
  "dependencies": {
    "@2dots1line/dialogue-service": "workspace:*",
    "@2dots1line/user-service": "workspace:*", 
    "@2dots1line/card-service": "workspace:*",
    "@2dots1line/config-service": "workspace:*",
    "@2dots1line/database": "workspace:*",
    "@2dots1line/shared-types": "workspace:*",
    "@2dots1line/core-utils": "workspace:*",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "ioredis": "^5.3.2",
    "axios": "^1.6.0"
  }
}
```

**✅ Phase 3 Verification**
```bash
# Build API Gateway with new dependencies
pnpm --filter=@2dots1line/api-gateway install
pnpm --filter=@2dots1line/api-gateway build

# Verify no HTTP calls between services remain
grep -r "axios.post\|axios.get" apps/api-gateway/src/controllers/
# Should return no internal service calls

# Verify dependency injection is used
grep -r "constructor.*Service" apps/api-gateway/src/controllers/
# Should show injected services
```

---

## ⚙️ **PHASE 4: PROCESS MANAGEMENT**
*Goal: Implement PM2 ecosystem for centralized process management*

### **Step 4.1: Install PM2**
```bash
# Add PM2 to root dependencies
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L
pnpm add -w pm2
```

### **Step 4.2: Create PM2 Ecosystem Configuration**
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './apps/api-gateway/dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
        API_GATEWAY_PORT: 3001
      }
    },
    // Worker processes
    {
      name: 'conversation-timeout-worker',
      script: './workers/conversation-timeout-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        CONVERSATION_TIMEOUT_MINUTES: 5
      }
    },
    {
      name: 'ingestion-worker',
      script: './workers/ingestion-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'embedding-worker',
      script: './workers/embedding-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'insight-worker',
      script: './workers/insight-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'card-worker',
      script: './workers/card-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'graph-sync-worker',
      script: './workers/graph-sync-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'graph-projection-worker',
      script: './workers/graph-projection-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'maintenance-worker',
      script: './workers/maintenance-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'notification-worker',
      script: './workers/notification-worker/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
```

### **Step 4.3: Update Root Package Scripts**
```json
// package.json (root)
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean",
    
    // New PM2-based commands
    "start": "pm2 start ecosystem.config.cjs",
    "stop": "pm2 stop ecosystem.config.cjs",
    "restart": "pm2 restart ecosystem.config.cjs",
    "logs": "pm2 logs",
    "status": "pm2 status",
    "monitor": "pm2 monit",
    
    // Legacy service commands (deprecated)
    "services:start": "echo 'Use: pnpm start' && pnpm start",
    "services:stop": "echo 'Use: pnpm stop' && pnpm stop",
    "services:restart": "echo 'Use: pnpm restart' && pnpm restart",
    "services:status": "echo 'Use: pnpm status' && pnpm status",
    "services:logs": "echo 'Use: pnpm logs' && pnpm logs",
    
    // Development commands
    "dev:full": "pnpm build && pnpm start && cd apps/web-app && pnpm dev",
    "format": "prettier --write \"**/*.{ts,tsx,md,json,yaml}\"",
    "preinstall": "npx only-allow pnpm",
    
    // Database commands
    "db:generate": "pnpm --filter=@2dots1line/database db:generate",
    "db:migrate:dev": "pnpm --filter=@2dots1line/database db:migrate:dev",
    "db:studio": "pnpm --filter=@2dots1line/database db:studio",
    "db:seed": "pnpm --filter=@2dots1line/database db:seed",
    
    // Utility commands
    "fix:conflicts": "./scripts/AUTOMATION/build-system/fix-build-conflicts.sh",
    "fix:typescript": "./scripts/AUTOMATION/build-system/fix-typescript-build-conflicts.sh",
    "fix:pnpm": "./scripts/AUTOMATION/build-system/fix-pnpm-conflicts.sh",
    "health:check": "./scripts/AUTOMATION/monitoring/health-check.sh",
    "clean:rebuild": "./scripts/AUTOMATION/build-system/partial-clean-rebuild.sh"
  }
}
```

### **Step 4.4: Update Service Manager Script**
```bash
# scripts/AUTOMATION/service-manager.sh
# Update to use PM2 instead of manual process management
# Replace service definitions with PM2 commands
```

**✅ Phase 4 Verification**
```bash
# Test PM2 ecosystem
pnpm build
pm2 start ecosystem.config.cjs
pm2 status
# Should show 1 API Gateway + 9 workers running

pm2 stop ecosystem.config.cjs
pm2 delete ecosystem.config.cjs
```

---

## 🗄️ **PHASE 5: DATABASE SCHEMA FINALIZATION**
*Goal: Apply V11.0 Prisma schema with naming conventions*

### **Step 5.1: Update Prisma Schema**
```prisma
// packages/database/prisma/schema.prisma
// Apply PascalCase/camelCase naming conventions with @map attributes
// Add missing @updatedAt attributes
// Improve relation naming
```

### **Step 5.2: Run Migration**
```bash
cd packages/database
pnpm db:migrate:dev --name "v11_0_schema_finalization"
pnpm db:generate
cd ../..
```

**✅ Phase 5 Verification**
```bash
# Verify schema is valid
cd packages/database
pnpm prisma validate

# Verify client generation works
ls -la node_modules/.prisma/client/
cd ../..
```

---

## 🧪 **FINAL INTEGRATION TESTING**

### **Step 6.1: Build Everything**
```bash
pnpm clean
pnpm install
pnpm build
```

### **Step 6.2: Start V11.0 Architecture**
```bash
# Start all processes with PM2
pnpm start

# Verify all processes are running
pnpm status
```

### **Step 6.3: Test API Endpoints**
```bash
# Test authentication
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test conversation (direct service call, no HTTP overhead)
curl -X POST http://localhost:3001/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"Hello world"}'
```

### **Step 6.4: Performance Verification**
```bash
# Verify only 1 HTTP server running (vs previous 4)
lsof -i :3001  # Should show API Gateway
lsof -i :3002  # Should return nothing (dialogue service HTTP removed)
lsof -i :3003  # Should return nothing (user service HTTP removed)
lsof -i :3004  # Should return nothing (card service HTTP removed)

# Verify workers are running under PM2
pnpm status | grep worker
```

---

## ✅ **SUCCESS CRITERIA VERIFICATION**

### **Architecture Compliance**
- [ ] ✅ Single HTTP entry point (API Gateway only)
- [ ] ✅ Services are pure libraries (no HTTP servers)
- [ ] ✅ Direct method calls (no internal HTTP)
- [ ] ✅ Dependency injection throughout
- [ ] ✅ Centralized process management (PM2)

### **Performance Improvements**
- [ ] ✅ Internal service latency <1ms (vs 10-50ms HTTP)
- [ ] ✅ Memory reduction (1 Express server vs 4)
- [ ] ✅ Simplified debugging (single HTTP process)

### **Operational Improvements**
- [ ] ✅ Zero manual worker startup
- [ ] ✅ Automatic process restart on failure
- [ ] ✅ Centralized logging via PM2

---

## 🚀 **POST-IMPLEMENTATION CHECKLIST**

### **Documentation Updates**
- [ ] Update README.md with new architecture
- [ ] Update API documentation
- [ ] Update deployment guides
- [ ] Archive old service documentation

### **Cleanup**
- [ ] Remove old service-specific scripts
- [ ] Clean up unused dependencies
- [ ] Remove obsolete configuration files
- [ ] Update monitoring configurations

### **Team Communication**
- [ ] Document migration for other developers
- [ ] Update development workflows
- [ ] Update CI/CD pipelines if needed
- [ ] Archive architectural decision records

---

**Implementation Status**: 🔴 **Ready for Execution**  
**Next Action**: Begin Phase 1 - Service Stripping  
**Expected Completion**: 2-3 hours for complete V11.0 transformation 