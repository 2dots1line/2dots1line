# V11.0 Headless Services Architecture Baseline

**Date**: January 3, 2025  
**Purpose**: Complete V11.0 "Great Refactoring" from monolithic services to headless library architecture  
**Tech Lead Review**: Architecture fundamentally flawed - services running redundant HTTP servers

---

## 🎯 **ARCHITECTURAL TRANSFORMATION OVERVIEW**

### **Current Flawed Architecture (V9.5)**
```
┌─────────────────┐    HTTP     ┌─────────────────┐    HTTP     ┌─────────────────┐
│   api-gateway   │ ────────► │ dialogue-service │ ────────► │  user-service   │
│  (port 3001)    │           │  (port 3002)    │           │  (port 3003)    │
│                 │           │                 │           │                 │
│ Controllers     │           │ Controllers     │           │ Controllers     │
│ Routes          │           │ Routes          │           │ Routes          │
│ Express Server  │           │ Express Server  │           │ Express Server  │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

### **Target V11.0 Architecture (Headless Services)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           api-gateway (single entry point)              │
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │ ConversationCtrl│    │   AuthController│    │   CardController│     │
│  │                 │    │                 │    │                 │     │
│  │   dialogueAgent │    │   userService   │    │   cardService   │     │
│  │        ↓        │    │        ↓        │    │        ↓        │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                         Direct Method Calls (In-Process)
                                     ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ DialogueAgent   │    │  UserService    │    │  CardService    │
│ (Pure Library)  │    │ (Pure Library)  │    │ (Pure Library)  │
│                 │    │                 │    │                 │
│ No HTTP Server  │    │ No HTTP Server  │    │ No HTTP Server  │
│ Business Logic  │    │ Business Logic  │    │ Business Logic  │
│ Only            │    │ Only            │    │ Only            │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📁 **IMPACTED FILES & DIRECTORIES**

### **🚨 FILES TO DELETE (Redundant HTTP Infrastructure)**

#### **API Gateway Cleanup**
- ❌ `apps/api-gateway/src/controllers/agent.controller.ts` (CRITICAL: Delete monolithic controller)

#### **Service HTTP Infrastructure (Eliminate Entirely)**
- ❌ `services/dialogue-service/src/controllers/agent.controller.ts`
- ❌ `services/dialogue-service/src/routes/v1/index.ts`
- ❌ `services/dialogue-service/src/app.ts`
- ❌ `services/dialogue-service/src/server.ts`
- ❌ `services/user-service/src/controllers/auth.controller.ts`
- ❌ `services/user-service/src/controllers/user.controller.ts`
- ❌ `services/user-service/src/controllers/index.ts`
- ❌ `services/user-service/src/routes/v1/index.ts`
- ❌ `services/user-service/src/app.ts`
- ❌ `services/user-service/src/server.ts`

#### **Card Service HTTP Infrastructure**
- ❌ `services/card-service/src/controllers/` (entire directory)
- ❌ `services/card-service/src/routes/` (entire directory)
- ❌ `services/card-service/src/app.ts`
- ❌ `services/card-service/src/server.ts`

### **🔄 FILES TO TRANSFORM (Core Business Logic → Pure Libraries)**

#### **Dialogue Service → Pure Library**
- 🔄 `services/dialogue-service/src/DialogueAgent.ts` → Dependency injection constructor
- 🔄 `services/dialogue-service/src/PromptBuilder.ts` → Remove HTTP dependencies
- 🔄 `services/dialogue-service/src/index.ts` → Export only classes, no server startup
- 🔄 `services/dialogue-service/package.json` → Remove Express dependencies

#### **User Service → Pure Library**
- 🔄 `services/user-service/src/UserService.ts` → Create new pure service class
- 🔄 `services/user-service/src/AuthService.ts` → Create new authentication service
- 🔄 `services/user-service/src/index.ts` → Export classes only
- 🔄 `services/user-service/package.json` → Remove Express dependencies

#### **Card Service → Pure Library**
- 🔄 `services/card-service/src/CardService.ts` → Enhance with dependency injection
- 🔄 `services/card-service/src/CardFactory.ts` → Keep as-is (already pure)
- 🔄 `services/card-service/src/index.ts` → Export classes only
- 🔄 `services/card-service/package.json` → Remove Express dependencies

### **✅ FILES TO CREATE (New Architecture Components)**

#### **API Gateway Enhancement**
- ✅ `apps/api-gateway/src/container.ts` → Dependency injection container
- ✅ `apps/api-gateway/src/controllers/conversation.controller.ts` → Direct service injection
- ✅ `ecosystem.config.cjs` → PM2 process management (root level)

#### **Process Management**
- ✅ Root-level PM2 configuration for all workers
- ✅ Enhanced service manager scripts for new architecture

### **🔧 FILES TO UPDATE (Configuration & Dependencies)**

#### **API Gateway Controllers (Direct Service Injection)**
- 🔧 `apps/api-gateway/src/controllers/auth.controller.ts` → Use injected UserService
- 🔧 `apps/api-gateway/src/controllers/user.controller.ts` → Use injected UserService  
- 🔧 `apps/api-gateway/src/controllers/card.controller.ts` → Use injected CardService
- 🔧 `apps/api-gateway/src/routes/v1/index.ts` → Use container instances
- 🔧 `apps/api-gateway/src/server.ts` → Initialize container before startup
- 🔧 `apps/api-gateway/package.json` → Add service dependencies

#### **Database Schema (V11.0 Finalization)**
- 🔧 `packages/database/prisma/schema.prisma` → PascalCase/camelCase refactoring

#### **Shared Types Updates**
- 🔧 `packages/shared-types/src/index.ts` → Export new service interfaces
- 🔧 `packages/shared-types/src/api/` → Update for new architecture

#### **Automation Scripts**
- 🔧 `scripts/AUTOMATION/service-manager.sh` → Remove individual service ports
- 🔧 `package.json` → Update scripts for new architecture
- 🔧 `docker-compose.dev.yml` → Remove service containers

---

## 🏗️ **DETAILED TARGET STRUCTURE**

### **Post-Refactoring Directory Structure**

```
2D1L/
├── apps/
│   ├── api-gateway/                 # SINGLE HTTP ENTRY POINT
│   │   ├── src/
│   │   │   ├── container.ts         # 🆕 Dependency injection
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts       # 🔧 Uses UserService directly
│   │   │   │   ├── conversation.controller.ts # 🔧 Uses DialogueAgent directly
│   │   │   │   ├── card.controller.ts       # 🔧 Uses CardService directly
│   │   │   │   └── user.controller.ts       # 🔧 Uses UserService directly
│   │   │   ├── routes/v1/index.ts   # 🔧 Uses container instances
│   │   │   └── server.ts            # 🔧 Initializes container
│   │   └── package.json             # 🔧 Add all service dependencies
│   └── web-app/                     # Unchanged
│
├── services/                        # PURE BUSINESS LOGIC LIBRARIES
│   ├── dialogue-service/
│   │   ├── src/
│   │   │   ├── DialogueAgent.ts     # 🔄 Pure class, dependency injection
│   │   │   ├── PromptBuilder.ts     # 🔄 Remove HTTP dependencies
│   │   │   └── index.ts             # 🔄 Export classes only
│   │   └── package.json             # 🔄 Remove Express dependencies
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── UserService.ts       # 🆕 Pure user operations
│   │   │   ├── AuthService.ts       # 🆕 Pure authentication logic
│   │   │   └── index.ts             # 🔄 Export classes only
│   │   └── package.json             # 🔄 Remove Express dependencies
│   └── card-service/
│       ├── src/
│       │   ├── CardService.ts       # 🔄 Enhanced with DI
│       │   ├── CardFactory.ts       # ✅ Already pure
│       │   └── index.ts             # 🔄 Export classes only
│       └── package.json             # 🔄 Remove Express dependencies
│
├── workers/                         # BACKGROUND PROCESSES (PM2 Managed)
│   ├── conversation-timeout-worker/ # ✅ Already properly structured
│   ├── ingestion-worker/            # ✅ Already properly structured
│   ├── embedding-worker/            # 🔧 Ensure PM2 compatibility
│   ├── insight-worker/              # 🔧 Ensure PM2 compatibility
│   ├── card-worker/                 # 🔧 Ensure PM2 compatibility
│   ├── graph-sync-worker/           # 🔧 Ensure PM2 compatibility
│   ├── graph-projection-worker/     # 🔧 Ensure PM2 compatibility
│   ├── maintenance-worker/          # 🔧 Ensure PM2 compatibility
│   └── notification-worker/         # 🔧 Ensure PM2 compatibility
│
├── packages/                        # SHARED LIBRARIES (Unchanged)
└── ecosystem.config.cjs             # 🆕 PM2 configuration for all processes
```

---

## 🔗 **DEPENDENCY FLOW CHANGES**

### **Before (HTTP Calls Between Services)**
```typescript
// api-gateway/src/controllers/auth.controller.ts
const response = await axios.post('http://localhost:3003/api/v1/auth/login', req.body);
```

### **After (Direct Method Calls)**
```typescript
// api-gateway/src/controllers/auth.controller.ts
const result = await this.userService.authenticate(email, password);
```

### **Container-Based Dependency Injection**
```typescript
// apps/api-gateway/src/container.ts
export const container = {
  userService: new UserService(databaseService),
  dialogueAgent: new DialogueAgent(configService, userRepository, promptBuilder),
  cardService: new CardService(databaseService, configService)
};

// apps/api-gateway/src/controllers/auth.controller.ts
constructor(private userService: UserService) {}
```

---

## 🔄 **WORKER PROCESS MANAGEMENT**

### **Current Worker State**
```bash
# Currently started manually/individually
cd workers/conversation-timeout-worker && node dist/index.js
cd workers/ingestion-worker && node dist/index.js
# ... etc for 9 workers
```

### **Target PM2 Management**
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './apps/api-gateway/dist/server.js',
      instances: 1,
      autorestart: true
    },
    {
      name: 'conversation-timeout-worker',
      script: './workers/conversation-timeout-worker/dist/index.js',
      instances: 1,
      autorestart: true
    },
    // ... all 9 workers defined
  ]
};
```

---

## 📊 **IMPACT ASSESSMENT**

### **Breaking Changes**
- ✅ **Service-to-service HTTP calls eliminated** → Direct function calls
- ✅ **Multiple HTTP servers reduced to one** → Single API Gateway
- ✅ **Worker process management centralized** → PM2 ecosystem

### **Non-Breaking Changes**
- ✅ **External API contracts unchanged** → Same REST endpoints
- ✅ **Database schema enhanced** → PascalCase/camelCase (with @map)
- ✅ **Worker functionality unchanged** → Same BullMQ processing

### **Performance Improvements**
- ✅ **Elimination of HTTP overhead** for internal service calls
- ✅ **Reduced memory footprint** (single Express server vs 4+)
- ✅ **Simplified debugging** (single process for HTTP layer)
- ✅ **Faster request processing** (in-process method calls)

---

## 🎯 **IMPLEMENTATION PHASES**

### **Phase 1: Service Stripping** 
- Delete redundant HTTP infrastructure from services
- Transform services into pure libraries

### **Phase 2: API Gateway Enhancement**
- Implement dependency injection container
- Update controllers to use direct service injection

### **Phase 3: Process Management**
- Implement PM2 ecosystem configuration
- Update automation scripts

### **Phase 4: Database Schema Finalization**
- Apply V11.0 Prisma schema with naming conventions
- Run migration and update generated client

---

**Status**: Ready for systematic implementation following the tech lead's definitive architectural guidance. 