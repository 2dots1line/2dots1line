# V11.0 "Great Refactoring" - FINAL EXECUTION PLAN
*Enhanced with Root File Updates, Config Architecture Refinement, and Operational Parameters*

## CRITICAL PRE-EXECUTION SAFETY

```bash
# SAFE Git Protocol - Commit existing work first
git add .
git commit -m "feat(v9.5): Complete conversation timeout architecture before V11.0 refactoring"
git push origin feature/v8-agent-network

# Create and switch to V11.0 branch
git checkout -b feature/v11-headless-services
```

---

## PHASE 1: DATABASE MODERNIZATION & CONFIG ARCHITECTURE

### 1.1 Create New Configuration Architecture

**Create:** `config/operational_parameters.json`
```json
{
  "version": "1.0",
  "conversation": {
    "timeout_seconds": 300
  },
  "workers": {
    "maintenance": {
      "check_interval_seconds": 3600
    },
    "ingestion": {
      "batch_size": 10,
      "retry_attempts": 3
    }
  },
  "retrieval": {
    "max_results": 50,
    "similarity_threshold": 0.7
  }
}
```

### 1.2 Database Schema Migration

**BACKUP FIRST:**
```bash
pnpm db:studio  # Verify current state
docker exec postgres-2d1l pg_dump -U 2d1luser -d 2d1l_dev > backup_pre_v11.sql
```

**Apply Schema Changes:** `packages/database/prisma/schema.prisma`
```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  profileImageUrl   String?  @map("profile_image_url")
  preferences       Json?
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  conversations     Conversation[]
  memoryUnits       MemoryUnit[]
  cards             Card[]

  @@map("users")
}

model Conversation {
  id              String            @id @default(cuid())
  userId          String            @map("user_id")
  title           String?
  status          ConversationStatus @default(ACTIVE)
  processedBy     String?           @map("processed_by")  // V11.0: Track which service processed
  processingStatus ProcessingStatus? @map("processing_status") // V11.0: Track processing state
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages        Message[]
  memoryUnits     MemoryUnit[]

  @@map("conversations")
}

model Message {
  id              String      @id @default(cuid())
  conversationId  String      @map("conversation_id")
  role            MessageRole
  content         String
  metadata        Json?
  createdAt       DateTime    @default(now()) @map("created_at")

  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("messages")
}

model MemoryUnit {
  id              String          @id @default(cuid())
  userId          String          @map("user_id")
  conversationId  String?         @map("conversation_id")
  type            MemoryUnitType
  content         String
  metadata        Json?
  importance      Float           @default(0.5)
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  conversation    Conversation?   @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  cards           Card[]

  @@map("memory_units")
}

model Card {
  id              String      @id @default(cuid())
  userId          String      @map("user_id")
  memoryUnitId    String      @map("memory_unit_id")
  type            CardType
  title           String
  content         String
  visualStyle     Json?       @map("visual_style")
  metadata        Json?
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  memoryUnit      MemoryUnit  @relation(fields: [memoryUnitId], references: [id], onDelete: Cascade)

  @@map("cards")
}

enum ConversationStatus {
  ACTIVE
  ENDED
  ARCHIVED
}

enum ProcessingStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum MemoryUnitType {
  FACT
  INSIGHT
  GOAL
  PREFERENCE
  RELATIONSHIP
  SKILL
}

enum CardType {
  INSIGHT
  GOAL
  REFLECTION
  ACHIEVEMENT
  RELATIONSHIP
  SKILL_DEVELOPMENT
}
```

**Generate and Apply Migration:**
```bash
pnpm db:generate
pnpm db:migrate:dev --name "v11_headless_services_schema"
```

### 1.3 Enhanced ConfigService

**Transform:** `services/config-service/src/ConfigService.ts`
- Add `getOperationalParameter(path: string)` method
- Add `operational_parameters.json` loading
- Maintain backward compatibility

---

## PHASE 2: PURE CONSTANTS REFACTORING

### 2.1 Transform constants.ts to Pure Constants

**Transform:** `packages/core-utils/src/constants.ts`
```typescript
/**
 * Shared, truly constant values for the 2dots1line V11.0 system.
 * These are hard-coded contracts between services and should only be
 * changed by a developer as part of a code update.
 *
 * Tunable parameters are located in /config/operational_parameters.json
 * and accessed via the ConfigService.
 */

// Redis key prefixes
export const REDIS_CONVERSATION_HEARTBEAT_PREFIX = 'conversation:heartbeat:';

// Queue names
export const INGESTION_QUEUE_NAME = 'ingestion-queue';
export const CARD_AND_GRAPH_QUEUE_NAME = 'card-and-graph-queue';
export const EMBEDDING_QUEUE_NAME = 'embedding-queue';
export const GRAPH_PROJECTION_QUEUE_NAME = 'graph-projection-queue';
export const NOTIFICATION_QUEUE_NAME = 'notification-queue';
export const MAINTENANCE_QUEUE_NAME = 'maintenance-queue';

// Default values (fallbacks when ConfigService unavailable)
export const DEFAULT_CONVERSATION_TIMEOUT_SECONDS = 300;
export const DEFAULT_API_GATEWAY_PORT = 3001;
```

---

## PHASE 3: ROOT-LEVEL INFRASTRUCTURE UPDATES

### 3.1 Docker Compose Modernization

**Transform:** `docker-compose.yml`
- Remove: `dialogue-service`, `user-service`, `card-service` containers
- Keep: All databases, Python services, workers
- Update: `api-gateway` dependencies (remove service dependencies)

```yaml
networks:
  2d1l_network:
    driver: bridge

services:
  # --- 1. CORE DATABASES (UNCHANGED) ---
  postgres: # ... existing config ...
  neo4j: # ... existing config ...
  weaviate: # ... existing config ...
  redis: # ... existing config ...

  # --- 2. PYTHON MICROSERVICES (UNCHANGED) ---
  dimension-reducer: # ... existing config ...

  # --- 3. SINGLE NODE.JS API GATEWAY ---
  api-gateway:
    build: { context: ., dockerfile: Dockerfile, args: { APP_NAME: api-gateway } }
    container_name: api-gateway-2d1l
    ports: [ "${API_GATEWAY_HOST_PORT:-3001}:3001" ]
    env_file: .env
    networks: [ 2d1l_network ]
    depends_on:
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_started
      weaviate:
        condition: service_started
      redis:
        condition: service_started

  # --- 4. ASYNCHRONOUS WORKERS (UNCHANGED) ---
  conversation-timeout-worker: # ... existing config ...
  ingestion-worker: # ... existing config ...
  card-worker: # ... existing config ...
  embedding-worker: # ... existing config ...
  insight-worker: # ... existing config ...
  graph-projection-worker: # ... existing config ...
```

### 3.2 Root Package.json Updates

**Transform:** Root `package.json` scripts
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "api:start": "pm2 start ecosystem.config.js --only api-gateway",
    "api:stop": "pm2 stop api-gateway",
    "api:restart": "pm2 restart api-gateway",
    "workers:start": "pm2 start ecosystem.config.js --only workers",
    "workers:stop": "pm2 stop workers",
    "workers:restart": "pm2 restart workers",
    "system:start": "pm2 start ecosystem.config.js",
    "system:stop": "pm2 stop all",
    "system:status": "pm2 status",
    "system:logs": "pm2 logs",
    "dev:full": "pnpm system:start && cd apps/web-app && pnpm dev",
    "format": "prettier --write \"**/*.{ts,tsx,md,json,yaml}\"",
    "preinstall": "npx only-allow pnpm",
    "db:generate": "pnpm --filter=@2dots1line/database db:generate",
    "db:migrate:dev": "pnpm --filter=@2dots1line/database db:migrate:dev",
    "db:studio": "pnpm --filter=@2dots1line/database db:studio",
    "db:seed": "pnpm --filter=@2dots1line/database db:seed"
  }
}
```

### 3.3 PM2 Ecosystem Configuration

**Create:** `ecosystem.config.js`
```javascript
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './apps/api-gateway/dist/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'conversation-timeout-worker',
      script: './workers/conversation-timeout-worker/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'ingestion-worker',
      script: './workers/ingestion-worker/dist/index.js',
      instances: 2,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'card-worker',
      script: './workers/card-worker/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'embedding-worker',
      script: './workers/embedding-worker/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'insight-worker',
      script: './workers/insight-worker/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'graph-projection-worker',
      script: './workers/graph-projection-worker/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
```

---

## PHASE 4: SERVICE TRANSFORMATION TO HEADLESS LIBRARIES

### 4.1 Transform Services to Pure Libraries

**Delete Files:**
- `services/dialogue-service/src/app.ts`
- `services/dialogue-service/src/server.ts`
- `services/user-service/src/app.ts`
- `services/user-service/src/server.ts`
- `services/card-service/src/app.ts` (if exists)

**Create Pure Service Classes:**

`services/dialogue-service/src/index.ts`:
```typescript
export { DialogueService } from './DialogueService';
export { PromptBuilder } from './PromptBuilder';
export { DialogueAgent } from './DialogueAgent';
```

`services/user-service/src/index.ts`:
```typescript
export { UserService } from './UserService';
```

`services/card-service/src/index.ts`:
```typescript
export { CardService } from './CardService';
export { CardFactory } from './CardFactory';
```

### 4.2 API Gateway Transformation

**Transform:** `apps/api-gateway/src/server.ts` - Composition Root Pattern
```typescript
import express from 'express';
import { DatabaseService } from '@2dots1line/database';
import { ConfigService } from '../../services/config-service/src/ConfigService';
import { DialogueService } from '../../services/dialogue-service/src/DialogueService';
import { UserService } from '../../services/user-service/src/UserService';
import { CardService } from '../../services/card-service/src/CardService';

// Import controllers
import { AgentController } from './controllers/agent.controller';
import { UserController } from './controllers/user.controller';
import { CardController } from './controllers/card.controller';

const app = express();

// Dependency composition
const databaseService = new DatabaseService();
const configService = new ConfigService();
const dialogueService = new DialogueService(databaseService, configService);
const userService = new UserService(databaseService);
const cardService = new CardService(databaseService);

// Controller initialization
const agentController = new AgentController(dialogueService);
const userController = new UserController(userService);
const cardController = new CardController(cardService);

// Route registration
app.use('/api/v1/agent', agentController.router);
app.use('/api/v1/users', userController.router);
app.use('/api/v1/cards', cardController.router);

const PORT = process.env.API_GATEWAY_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 V11.0 API Gateway running on port ${PORT}`);
});
```

---

## PHASE 5: COMPREHENSIVE PROPAGATION UPDATES

### 5.1 Repository Updates (13 files)
- Update all Prisma model references to PascalCase
- Add new V11.0 fields handling

### 5.2 Worker Updates (10 files)
- Update ConfigService integration for operational parameters
- Remove service HTTP dependencies

### 5.3 Frontend Updates (3 files)
- Update API endpoint references
- Remove service-specific calls

### 5.4 Shared Types Updates (7 files)
- Add new V11.0 types
- Update existing interfaces

---

## VERIFICATION & TESTING

### Build Verification
```bash
pnpm build
pnpm db:generate
pm2 status
```

### Integration Testing
```bash
# Test API Gateway
curl http://localhost:3001/api/v1/health

# Test worker processing
curl -X POST http://localhost:3001/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test-user"}'

# Verify timeout workflow
redis-cli KEYS "conversation:heartbeat:*"
```

### Success Metrics
- ✅ Single HTTP server (API Gateway) running
- ✅ All workers processing jobs
- ✅ Database schema updated and operational
- ✅ Configuration system working via /config and .env
- ✅ No HTTP calls between internal services
- ✅ All 52 identified files updated successfully

---

## ROLLBACK STRATEGY
If critical issues emerge:
```bash
git checkout feature/v8-agent-network
docker-compose down && docker-compose up -d
pnpm build && pnpm services:start
```

---

**EXECUTION TIME ESTIMATE:** 6-8 hours
**CONFIDENCE LEVEL:** 95% (based on comprehensive analysis)
**RISK LEVEL:** Medium (mitigated by thorough planning and rollback strategy) 