# V11.0 Headless Services - CORRECTED Execution Plan

**Date**: January 6, 2025  
**Executor**: AI Agent (Claude)  
**Architecture**: V11.0 "Great Refactoring" - Headless Service Libraries  
**Estimated Duration**: 3-4 hours systematic implementation  
**Status**: TECH LEAD APPROVED with Critical Corrections Applied

---

## 🚨 **CRITICAL CORRECTIONS APPLIED**

### **Git Safety Protocol (FIXED)**
- ✅ **SAVE UNCOMMITTED WORK**: Commit V9.5 conversation timeout work before branch switching
- ✅ **PRESERVE INSTITUTIONAL KNOWLEDGE**: Push work to origin before refactoring
- ✅ **SAFE BRANCH MANAGEMENT**: Proper sequence to avoid work loss

### **Prisma Migration Strategy (ADDED)**
- ✅ **V11.0 SCHEMA MODERNIZATION**: PascalCase naming with @map attributes  
- ✅ **MIGRATION SEQUENCING**: Explicit steps for database transformation
- ✅ **ROLLBACK SAFETY**: Backup strategies for migration failures

### **Knowledge Base Integration (INCORPORATED)**
- ✅ **Prisma Client Generation**: Mandatory at each phase
- ✅ **Module System Validation**: Runtime import testing  
- ✅ **Environment Variable Propagation**: Service orchestration protocols
- ✅ **Dependency Chain Integrity**: TypeScript project reference validation

### **Tech Lead Architectural Corrections (INTEGRATED)**
- ✅ **ELIMINATE container.ts ANTI-PATTERN**: Use Composition Root in server.ts
- ✅ **PURE DEPENDENCY INJECTION**: Explicit constructor injection chain
- ✅ **DOCKER-COMPOSE CLARIFICATION**: Databases-only for development

---

## 🔒 **PHASE 0: WORK PRESERVATION** 
*MANDATORY: Secure existing work before ANY refactoring*

### **Step 0.1: Commit Current V9.5 Work**
```bash
# Check current git status
git status

# Add all V9.5 conversation timeout architecture work
git add .

# Commit with descriptive message
git commit -m "V9.5: Complete conversation timeout architecture implementation

- Redis heartbeat management in DialogueAgent
- ConversationTimeoutWorker with BullMQ integration  
- IngestionWorker job processing pipeline
- Prisma schema and seeding scripts
- Critical debugging lessons documented

This represents functional V9.5 architecture before V11.0 refactoring."

# Push to preserve work
git push origin feature/v8-agent-network
```

### **Step 0.2: Create Safe Branch Management**
```bash
# Create backup branch from current state
git checkout -b backup/pre-v11-refactoring
git push origin backup/pre-v11-refactoring

# Create V11.0 feature branch  
git checkout -b feature/v11-headless-services
```

### **Step 0.3: Environment Validation**
```bash
# MANDATORY: Verify database services running
docker ps | grep -E "(postgres|redis|weaviate|neo4j)" || {
  echo "❌ CRITICAL: Database services not running"
  echo "Run: docker-compose up -d"
  exit 1
}

# MANDATORY: Test database connectivity
cd packages/database
node -e "require('@prisma/client')" || {
  echo "❌ CRITICAL: Prisma client not available"
  echo "Run: pnpm db:generate"
  exit 1
}
cd ../..

# Stop any running application services
pnpm services:stop 2>/dev/null || true
```

---

## 🗄️ **PHASE 1: DATABASE SCHEMA MODERNIZATION**
*Goal: Prepare database for V11.0 before service transformation*

### **Step 1.1: Create V11.0 Schema Migration**
```typescript
// packages/database/prisma/migrations/[timestamp]_v11_modernization/migration.sql

-- Rename tables to PascalCase (with backward compatibility)
ALTER TABLE users RENAME TO Users;
ALTER TABLE conversations RENAME TO Conversations;  
ALTER TABLE conversation_messages RENAME TO ConversationMessages;
ALTER TABLE memory_units RENAME TO MemoryUnits;
ALTER TABLE cards RENAME TO Cards;
ALTER TABLE concepts RENAME TO Concepts;
ALTER TABLE communities RENAME TO Communities;
ALTER TABLE derived_artifacts RENAME TO DerivedArtifacts;
ALTER TABLE growth_events RENAME TO GrowthEvents;
ALTER TABLE interaction_logs RENAME TO InteractionLogs;
ALTER TABLE media_items RENAME TO MediaItems;
ALTER TABLE proactive_prompts RENAME TO ProactivePrompts;
ALTER TABLE user_challenges RENAME TO UserChallenges;
ALTER TABLE user_graph_projections RENAME TO UserGraphProjections;
ALTER TABLE user_sessions RENAME TO UserSessions;

-- Update column names to camelCase (examples)
ALTER TABLE Users RENAME COLUMN user_id TO userId;
ALTER TABLE Users RENAME COLUMN created_at TO createdAt;
ALTER TABLE Users RENAME COLUMN updated_at TO updatedAt;

-- Add V11.0 architectural fields
ALTER TABLE Conversations ADD COLUMN processedBy VARCHAR(50) DEFAULT 'unknown';
ALTER TABLE Conversations ADD COLUMN processingStatus VARCHAR(20) DEFAULT 'pending';
```

### **Step 1.2: Update Prisma Schema with @map Attributes**
```prisma
// packages/database/prisma/schema.prisma

model User {
  userId    String   @id @map("user_id")
  email     String   @unique  
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  conversations Conversation[]
  memoryUnits   MemoryUnit[]
  
  @@map("Users")
}

model Conversation {
  id              String    @id
  userId          String    @map("user_id")
  title           String?
  startTime       DateTime  @default(now()) @map("start_time")
  endedAt         DateTime? @map("ended_at")
  contextSummary  String?   @map("context_summary")
  importanceScore Float?    @map("importance_score")
  sourceCardId    String?   @map("source_card_id")
  status          String    @default("active")
  
  // V11.0 architecture fields
  processedBy       String @default("unknown") @map("processed_by")
  processingStatus  String @default("pending") @map("processing_status")
  
  // Relations  
  user     User                   @relation(fields: [userId], references: [userId])
  messages ConversationMessage[]
  
  @@map("Conversations")
}
```

### **Step 1.3: Execute Database Migration**
```bash
# CRITICAL: Backup database before migration
pg_dump $DATABASE_URL > backup_pre_v11_$(date +%Y%m%d_%H%M%S).sql

# Generate migration
cd packages/database
pnpm prisma migrate dev --name v11_modernization

# MANDATORY: Regenerate Prisma client for new schema
pnpm db:generate

# MANDATORY: Test new schema works
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst().then(() => console.log('✅ V11.0 schema working')).catch(e => {
  console.log('❌ Schema migration failed:', e.message);
  process.exit(1);
});
"

cd ../..
```

---

## 🔧 **PHASE 2: SERVICE STRIPPING** 
*Goal: Remove redundant HTTP infrastructure*

### **Step 2.1: Strip Dialogue Service HTTP Infrastructure**
```bash
# Delete HTTP-related files
rm -rf services/dialogue-service/src/controllers/
rm -rf services/dialogue-service/src/routes/
rm -f services/dialogue-service/src/app.ts
rm -f services/dialogue-service/src/server.ts

# Update package.json - remove HTTP dependencies
cd services/dialogue-service
npm pkg delete dependencies.express dependencies.cors dependencies.axios
cd ../..

# Verify core business logic remains
ls -la services/dialogue-service/src/
# Should show: DialogueAgent.ts, PromptBuilder.ts, index.ts
```

### **Step 2.2: Strip User Service HTTP Infrastructure**
```bash
# Delete HTTP-related files  
rm -rf services/user-service/src/controllers/
rm -rf services/user-service/src/routes/
rm -f services/user-service/src/app.ts
rm -f services/user-service/src/server.ts

# Update package.json
cd services/user-service
npm pkg delete dependencies.express dependencies.cors dependencies.axios
cd ../..
```

### **Step 2.3: Strip Card Service HTTP Infrastructure**
```bash
# Delete HTTP-related files
rm -rf services/card-service/src/controllers/
rm -rf services/card-service/src/routes/
rm -f services/card-service/src/app.ts  
rm -f services/card-service/src/server.ts

# Update package.json
cd services/card-service  
npm pkg delete dependencies.express dependencies.cors dependencies.axios
cd ../..
```

### **Step 2.4: Knowledge Base Validation - Prisma Client Generation**
```bash
# MANDATORY after service changes: Regenerate Prisma client
cd packages/database && pnpm db:generate && cd ../..

# CRITICAL TEST: Runtime import validation (Lesson 4)
cd services/dialogue-service && node -e "
try { 
  const db = require('@2dots1line/database'); 
  console.log('✅ Database import successful'); 
} catch(e) { 
  console.log('❌ Import failed:', e.message); 
  process.exit(1);
}"
cd ../..
```

---

## 🏗️ **PHASE 3: PURE LIBRARY TRANSFORMATION**
*Goal: Transform services into pure business logic*

### **Step 3.1: Transform Dialogue Service to Pure Library**
```typescript
// services/dialogue-service/src/index.ts
export { DialogueAgent } from './DialogueAgent';
export { PromptBuilder } from './PromptBuilder';

// Export service factory for DI
export { createDialogueService } from './DialogueServiceFactory';
```

```typescript
// services/dialogue-service/src/DialogueServiceFactory.ts
import { DialogueAgent } from './DialogueAgent';
import { PromptBuilder } from './PromptBuilder';
import type { DatabaseService } from '@2dots1line/database';
import type { ToolRegistry } from '@2dots1line/tool-registry';

export interface DialogueServiceDependencies {
  databaseService: DatabaseService;
  toolRegistry: ToolRegistry;
  redisClient: any;
}

export function createDialogueService(deps: DialogueServiceDependencies) {
  const promptBuilder = new PromptBuilder(deps.databaseService);
  const dialogueAgent = new DialogueAgent(
    deps.databaseService,
    deps.toolRegistry, 
    promptBuilder,
    deps.redisClient
  );
  
  return {
    dialogueAgent,
    promptBuilder
  };
}
```

### **Step 3.2: Create User Service Pure Libraries**
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
}
```

```typescript
// services/user-service/src/AuthService.ts  
import { DatabaseService, UserRepository } from '@2dots1line/database';
import { validatePassword, hashPassword } from '@2dots1line/core-utils';

export class AuthService {
  private userRepository: UserRepository;

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
  }

  async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
    // Implementation
  }
}
```

### **Step 3.3: Knowledge Base Validation - Module System Testing**
```bash
# CRITICAL TEST: Module boundaries work (Lesson 5)
for service in dialogue-service user-service card-service; do
  echo "Testing service: $service"
  cd "services/$service"
  
  # Test TypeScript compilation
  npx tsc --noEmit --strict || {
    echo "❌ TypeScript compilation failed for $service"
    exit 1
  }
  
  # Test runtime imports  
  node -e "require('./dist/index.js')" || {
    echo "❌ Runtime import failed for $service" 
    exit 1
  }
  
  cd ../..
done
```

---

## 🔗 **PHASE 4: COMPOSITION ROOT ARCHITECTURE**
*Goal: Implement pure dependency injection without container anti-pattern*

### **Step 4.1: Create Composition Root in API Gateway**

**TECH LEAD APPROVED: Eliminate container.ts anti-pattern**

```typescript
// apps/api-gateway/src/server.ts (COMPOSITION ROOT PATTERN)
import express from 'express';
import cors from 'cors';

// Infrastructure
import { DatabaseService } from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import { ToolRegistry } from '@2dots1line/tool-registry';

// Pure Service Libraries  
import { createDialogueService } from '@2dots1line/dialogue-service';
import { UserService, AuthService } from '@2dots1line/user-service';
import { CardService } from '@2dots1line/card-service';

// Controllers
import { createAuthController } from './controllers/auth.controller';
import { createUserController } from './controllers/user.controller';
import { createDialogueController } from './controllers/dialogue.controller';
import { createCardController } from './controllers/card.controller';

// Routes
import { createAuthRoutes } from './routes/auth.routes';
import { createUserRoutes } from './routes/user.routes';
import { createDialogueRoutes } from './routes/dialogue.routes';
import { createCardRoutes } from './routes/card.routes';

async function startServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // --- COMPOSITION ROOT: BUILD DEPENDENCY GRAPH ---
  
  // LEVEL 1: Core Infrastructure
  const databaseService = DatabaseService.getInstance();
  const redisClient = databaseService.redis;
  const configService = new ConfigService(redisClient);
  await configService.initialize();
  
  // LEVEL 2: Tool Registry
  const toolRegistry = new ToolRegistry(configService);
  await toolRegistry.initialize();
  
  // LEVEL 3: Pure Service Libraries (Business Logic)
  const authService = new AuthService(databaseService);
  const userService = new UserService(databaseService);
  const cardService = new CardService(databaseService, configService);
  
  const { dialogueAgent, promptBuilder } = createDialogueService({
    databaseService,
    toolRegistry,
    redisClient
  });
  
  // LEVEL 4: Controllers (HTTP Interface Layer)
  const authController = createAuthController(authService);
  const userController = createUserController(userService);
  const dialogueController = createDialogueController(dialogueAgent, promptBuilder);
  const cardController = createCardController(cardService);
  
  // LEVEL 5: Mount Routes
  app.use('/api/v1/auth', createAuthRoutes(authController));
  app.use('/api/v1/users', createUserRoutes(userController));
  app.use('/api/v1/dialogue', createDialogueRoutes(dialogueController));
  app.use('/api/v1/cards', createCardRoutes(cardController));
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // Start server
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
    console.log(`✅ Pure Composition Root architecture initialized`);
  });
}

// Error handling
startServer().catch(error => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
```

### **Step 4.2: Create Modern Controller Factories**
```typescript
// apps/api-gateway/src/controllers/dialogue.controller.ts
import type { Request, Response } from 'express';
import type { DialogueAgent, PromptBuilder } from '@2dots1line/dialogue-service';

export function createDialogueController(
  dialogueAgent: DialogueAgent,
  promptBuilder: PromptBuilder
) {
  return {
    async sendMessage(req: Request, res: Response) {
      try {
        const { message, conversationId } = req.body;
        const userId = req.user?.id; // From auth middleware
        
        const response = await dialogueAgent.processMessage({
          userId,
          message,
          conversationId
        });
        
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    
    async getConversationHistory(req: Request, res: Response) {
      try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        
        const history = await promptBuilder.getConversationHistory(conversationId, userId);
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  };
}
```

---

## 🛠️ **PHASE 5: PROCESS MANAGEMENT MODERNIZATION**
*Goal: Replace multiple HTTP servers with PM2 ecosystem*

### **Step 5.1: Create PM2 Ecosystem Configuration**
```javascript
// ecosystem.config.cjs (ROOT LEVEL)
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './apps/api-gateway/dist/server.js',
      cwd: './apps/api-gateway',
      instances: 1,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        instances: 'max'
      }
    },
    {
      name: 'card-worker',
      script: './workers/card-worker/dist/index.js',
      cwd: './workers/card-worker',
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'conversation-timeout-worker',
      script: './workers/conversation-timeout-worker/dist/index.js', 
      cwd: './workers/conversation-timeout-worker',
      instances: 1,
      env: {
        NODE_ENV: 'development',
        CONVERSATION_TIMEOUT_MINUTES: 5
      }
    },
    {
      name: 'ingestion-worker',
      script: './workers/ingestion-worker/dist/index.js',
      cwd: './workers/ingestion-worker', 
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'insight-worker',
      script: './workers/insight-worker/dist/index.js',
      cwd: './workers/insight-worker',
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
```

### **Step 5.2: Update Docker Compose for Development**
```yaml
# docker-compose.dev.yml (DATABASES ONLY - Tech Lead Clarification)
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: twodots_dev
    ports:
      - "5433:5432"
    volumes:
      - ./postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - ./redis_data:/data

  neo4j:
    image: neo4j:5
    environment:
      NEO4J_AUTH: neo4j/password
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - ./neo4j_data:/data

  weaviate:
    image: weaviate/weaviate:latest
    ports:
      - "8080:8080"
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
    volumes:
      - ./weaviate_data:/var/lib/weaviate

# NOTE: No application services - they run via PM2 on host
```

### **Step 5.3: Update Package.json Scripts**
```json
{
  "scripts": {
    "dev": "pm2 start ecosystem.config.cjs",
    "dev:stop": "pm2 stop ecosystem.config.cjs",
    "dev:restart": "pm2 restart ecosystem.config.cjs",
    "dev:logs": "pm2 logs",
    "dev:status": "pm2 status",
    "services:start": "echo 'Use: pnpm dev'",
    "services:stop": "echo 'Use: pnpm dev:stop'"
  }
}
```

---

## ✅ **PHASE 6: VALIDATION & TESTING**
*Goal: Comprehensive testing of V11.0 architecture*

### **Step 6.1: Knowledge Base Validation Protocol**
```bash
# LESSON 1: Check for lock file proliferation
find . -name "pnpm-lock*.yaml" -not -path "./node_modules/*" | wc -l
# Should return 1

# LESSON 2: Check for build info race conditions  
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json" | wc -l
# Should return 0 after builds complete

# LESSON 3: Prisma client generation test
cd packages/database && node -e "require('@prisma/client')" && cd ../..

# LESSON 6: Environment variable propagation test
pnpm dev
sleep 5
curl -f http://localhost:3001/health || echo "❌ API Gateway not accessible"
```

### **Step 6.2: Integration Testing**
```bash
# Build all packages in correct order (Lesson 11)
pnpm build

# Test V11.0 architecture
pnpm dev

# Wait for services to start
sleep 10

# Test API Gateway endpoints
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Test dialogue endpoint
curl -X POST http://localhost:3001/api/v1/dialogue/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, this is a test message"}'

# Check PM2 status  
pnpm dev:status
```

---

## 🚀 **SUCCESS CRITERIA**

### **Architecture Success Indicators**
- ✅ **Single HTTP Server**: Only API Gateway listening on port 3001
- ✅ **Pure Service Libraries**: Services export business logic only, no HTTP servers
- ✅ **Composition Root**: Clean dependency injection in server.ts
- ✅ **Worker Stability**: PM2 manages all background processes  
- ✅ **Database Modernization**: V11.0 schema with PascalCase naming

### **Knowledge Base Compliance**
- ✅ **No Lock File Duplication**: Single pnpm-lock.yaml
- ✅ **No Build Info Conflicts**: Clean TypeScript compilation
- ✅ **Prisma Client Available**: Database imports work at runtime
- ✅ **Module System Integrity**: No CommonJS/ESNext conflicts
- ✅ **Environment Propagation**: All services access required variables

### **Operational Success**
- ✅ **PM2 Management**: `pnpm dev` starts entire system
- ✅ **Health Endpoints**: API Gateway responds to health checks
- ✅ **Worker Processing**: Background jobs process correctly
- ✅ **Database Connectivity**: All repositories function correctly

---

## 🔄 **ROLLBACK STRATEGY**

If V11.0 transformation fails:

```bash
# Stop current processes
pnpm dev:stop

# Return to backup branch
git checkout backup/pre-v11-refactoring

# Restore database if needed
psql $DATABASE_URL < backup_pre_v11_[timestamp].sql

# Restart V9.5 architecture
pnpm services:start
```

---

*This corrected execution plan incorporates all critical feedback from the tech lead and systematic lessons learned. It represents the definitive V11.0 transformation protocol.* 