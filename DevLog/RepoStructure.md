# 2dots1line Repository Structure

**Generated:** December 2024  
**Purpose:** Complete file-by-file documentation of the repository structure

## Root Directory

```
2D1L/
├── .dockerignore (460B, 22 lines)
├── .DS_Store (6.0KB, 1 lines)
├── .eslintrc.js (838B, 35 lines)
├── .gitignore (484B, 57 lines)
├── .prettierrc.js (158B, 9 lines)
├── docker-compose.yml (6.0KB, 158 lines)
├── envexample.md (3.2KB, 90 lines)
├── package.json (1.9KB, 68 lines)
├── pnpm-lock.yaml (370KB, 11624 lines)
├── pnpm-workspace.yaml (596B, 30 lines)
├── README.md (1.3KB, 70 lines)
├── test-api-endpoints.js (3.2KB, 86 lines)
├── test-google-api.js (2.4KB, 69 lines)
├── tsconfig.base.json (1.5KB, 37 lines)
├── tsconfig.json (1.4KB, 48 lines)
└── turbo.json (1.2KB, 61 lines)
```

## Directory Structure Overview

The repository follows a monorepo structure with the following main directories:
- `apps/` - Application entry points
- `packages/` - Shared libraries and utilities
- `services/` - Backend services
- `workers/` - Background processing workers
- `DevLog/` - Development documentation
- `docs/` - Project documentation
- `config/` - Configuration files
- `infrastructure/` - Infrastructure as code
- `archive/` - Legacy and archived code

## Apps Directory (`apps/`)

### API Gateway (`apps/api-gateway/`)
Main REST API gateway for the application.

```
apps/api-gateway/
├── .dockerignore (106B, 11 lines)
├── .DS_Store (6.0KB, 1 lines)
├── API_DOCUMENTATION.md (7.6KB, 277 lines)
├── Dockerfile (2.3KB, 72 lines)
├── jest.config.js (359B, 13 lines)
├── package.json (1.2KB, 42 lines)
├── test-api-manual.sh (6.2KB, 179 lines)
├── tsconfig.json (673B, 21 lines)
├── tsconfig.tsbuildinfo (133KB, 1 lines)
├── src/
│   ├── .DS_Store (6.0KB, 2 lines)
│   ├── app.ts (2.1KB, 58 lines)
│   ├── server.ts (152B, 7 lines)
│   ├── controllers/
│   │   ├── auth.controller.ts (7.4KB, 289 lines)
│   │   ├── auth.controller.ts.bak (5.5KB, 166 lines)
│   │   ├── card.controller.ts (7.7KB, 273 lines)
│   │   ├── chat.controller.ts (13KB, 406 lines)
│   │   ├── user.controller.ts (7.5KB, 251 lines)
│   │   └── __tests__/
│   │       ├── auth.controller.test.ts (3.4KB, 95 lines)
│   │       ├── auth.controller.test.ts.bak (3.4KB, 95 lines)
│   │       └── chat.controller.test.ts (4.1KB, 145 lines)
│   ├── middleware/
│   │   ├── auth.middleware.ts (1.7KB, 44 lines)
│   │   └── upload.middleware.ts (2.6KB, 99 lines)
│   ├── routes/
│   │   ├── auth.routes.ts (519B, 13 lines)
│   │   ├── auth.routes.ts.bak (473B, 15 lines)
│   │   ├── card.routes.ts (1.8KB, 61 lines)
│   │   ├── chat.routes.ts (1.3KB, 42 lines)
│   │   └── user.routes.ts (987B, 32 lines)
│   ├── types/
│   │   ├── express.d.ts (301B, 14 lines)
│   │   └── index.d.ts (191B, 11 lines)
│   └── __tests__/
│       ├── api-test.ts (2.3KB, 82 lines)
│       ├── auth.integration.test.ts (6.9KB, 227 lines)
│       ├── create-test-users.ts.bak (1.8KB, 62 lines)
│       └── setup.ts (680B, 14 lines)
├── uploads/ (directory for file uploads)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Backend API (`apps/backend-api/`)
Secondary backend API service.

```
apps/backend-api/
├── package.json (909B, 30 lines)
├── tsconfig.json (432B, 18 lines)
├── tsconfig.tsbuildinfo (34KB, 1 lines)
├── src/
│   └── server.ts (446B, 19 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Web App (`apps/web-app/`)
Next.js frontend application.

```
apps/web-app/
├── package.json
├── tsconfig.json
├── public/
│   └── videos/ (video assets)
├── src/
│   ├── app/ (Next.js app directory)
│   ├── components/
│   │   ├── hud/ (heads-up display components)
│   │   └── modal/ (modal components)
│   ├── services/ (frontend services)
│   ├── stores/ (state management)
│   └── styles/ (styling files)
├── .next/ (Next.js build output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Storybook (`apps/storybook/`)
Component documentation and testing.

```
apps/storybook/
├── .storybook/ (storybook configuration)
└── styles/ (storybook styles)
```

## Packages Directory (`packages/`)

### Database Package (`packages/database/`)
Database access layer with Prisma, Neo4j, Redis, and Weaviate integrations.

```
packages/database/
├── jest.config.js (538B, 20 lines)
├── package.json (1.3KB, 42 lines)
├── README.md (8.4KB, 365 lines)
├── tsconfig.json (417B, 22 lines)
├── tsconfig.tsbuildinfo (118KB, 1 lines)
├── prisma/
│   ├── schema.prisma (17KB, 472 lines)
│   └── migrations/
│       ├── migration_lock.toml (128B, 4 lines)
│       └── 20250603010109_init_v7_schema_corrected/
│           └── migration.sql (19KB, 534 lines)
├── scripts/ (database scripts)
├── src/
│   ├── config.ts (4.9KB, 156 lines)
│   ├── index.ts (8.1KB, 253 lines)
│   ├── prisma-client.ts (48B, 1 lines)
│   ├── prisma.ts (3.4KB, 140 lines)
│   ├── neo4j/
│   │   └── index.ts (9.2KB, 345 lines)
│   ├── redis/
│   │   └── index.ts (8.1KB, 321 lines)
│   ├── weaviate/
│   │   ├── index.ts (13KB, 405 lines)
│   │   └── schema.json (11KB, 357 lines)
│   ├── repositories/
│   │   ├── index.ts (582B, 25 lines)
│   │   ├── card.repository.ts (9.6KB, 326 lines)
│   │   ├── concept.repository.ts (4.7KB, 186 lines)
│   │   ├── conversation.repository.ts (4.1KB, 162 lines)
│   │   ├── growth-event.repository.ts (4.5KB, 190 lines)
│   │   ├── media.repository.ts (3.0KB, 138 lines)
│   │   ├── memory.repository.ts (4.6KB, 185 lines)
│   │   ├── user.repository.ts (4.0KB, 131 lines)
│   │   └── __tests__/
│   │       └── user.repository.test.ts (5.1KB, 173 lines)
│   └── __tests__/ (database tests)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Shared Types (`packages/shared-types/`)
TypeScript type definitions shared across the monorepo.

```
packages/shared-types/
├── package.json (560B, 22 lines)
├── README.md (1.1KB, 41 lines)
├── tsconfig.json (419B, 22 lines)
├── src/
│   ├── index.ts (1.5KB, 74 lines)
│   ├── ai/
│   │   ├── index.ts (360B, 15 lines)
│   │   ├── agent.types.ts (12KB, 425 lines)
│   │   ├── job.types.ts (1.7KB, 50 lines)
│   │   └── tool.types.ts (9.9KB, 350 lines)
│   ├── api/
│   │   ├── index.ts (602B, 33 lines)
│   │   ├── chat.api.types.ts (1.4KB, 53 lines)
│   │   ├── common.types.ts (1.4KB, 65 lines)
│   │   ├── memory.api.types.ts (2.2KB, 92 lines)
│   │   └── user.api.types.ts (857B, 45 lines)
│   ├── entities/
│   │   ├── index.ts (407B, 13 lines)
│   │   ├── annotation.types.ts (1.1KB, 39 lines)
│   │   ├── chunk.types.ts (1.5KB, 50 lines)
│   │   ├── community.types.ts (1.7KB, 48 lines)
│   │   ├── concept.types.ts (6.4KB, 207 lines)
│   │   ├── interaction.types.ts (3.3KB, 89 lines)
│   │   ├── media.types.ts (1.6KB, 47 lines)
│   │   ├── memory.types.ts (3.8KB, 108 lines)
│   │   ├── misc.types.ts (1.8KB, 56 lines)
│   │   ├── system.types.ts (2.4KB, 75 lines)
│   │   └── user.types.ts (2.7KB, 90 lines)
│   ├── errors/
│   │   └── index.ts (1.4KB, 63 lines)
│   └── state/
│       ├── index.ts (74B, 2 lines)
│       └── orb.types.ts (2.6KB, 75 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### AI Clients (`packages/ai-clients/`)
AI service integrations and LLM clients.

```
packages/ai-clients/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (848B, 32 lines)
├── tsconfig.json (424B, 18 lines)
├── tsconfig.tsbuildinfo (37KB, 1 lines)
├── src/
│   ├── .DS_Store (6.0KB, 2 lines)
│   ├── index.ts (1.3KB, 40 lines)
│   ├── deepseek/
│   │   └── index.ts (986B, 31 lines)
│   ├── google/
│   │   └── index.ts (4.7KB, 159 lines)
│   ├── interfaces/
│   │   ├── index.ts (32B, 1 lines)
│   │   └── common.types.ts (3.4KB, 113 lines)
│   └── tools/
│       └── llm-chat.tool.ts (5.8KB, 202 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Agent Framework (`packages/agent-framework/`)
Base classes and utilities for AI agents.

```
packages/agent-framework/
├── .DS_Store (6.0KB, 1 lines)
├── jest.config.js (1.1KB, 29 lines)
├── package.json (624B, 24 lines)
├── tsconfig.json (590B, 24 lines)
├── tsconfig.tsbuildinfo (120KB, 1 lines)
├── src/
│   ├── index.ts (403B, 8 lines)
│   ├── base-agent.ts (2.6KB, 63 lines)
│   └── __tests__/
│       └── base-agent.test.ts (4.2KB, 109 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Core Utils (`packages/core-utils/`)
Core utility functions for formatting, security, and validation.

```
packages/core-utils/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (641B, 26 lines)
├── tsconfig.json (392B, 22 lines)
├── tsconfig.tsbuildinfo (33KB, 1 lines)
├── src/
│   ├── index.ts (254B, 9 lines)
│   ├── formatting/
│   │   └── index.ts (116B, 2 lines)
│   ├── security/
│   │   └── index.ts (112B, 2 lines)
│   └── validation/
│       └── index.ts (116B, 2 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```


### Orb Core (`packages/orb-core/`)
Core orb functionality including base classes, effects, emotions, and states.

```
packages/orb-core/
├── package.json (631B, 24 lines)
├── tsconfig.json (430B, 20 lines)
├── tsconfig.tsbuildinfo (89KB, 1 lines)
├── src/
│   ├── index.ts (221B, 11 lines)
│   ├── base/
│   │   └── index.ts (812B, 44 lines)
│   ├── effects/
│   │   └── index.ts (1.5KB, 59 lines)
│   ├── emotions/
│   │   └── index.ts (emotion definitions)
│   └── states/
│       └── index.ts (926B, 52 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Shader Library (`packages/shader-lib/`)
GLSL shader library and compilation utilities.

```
packages/shader-lib/
├── package.json (539B, 20 lines)
├── tsconfig.json (425B, 17 lines)
├── tsconfig.tsbuildinfo (32KB, 1 lines)
├── src/
│   ├── index.ts (117B, 3 lines)
│   ├── generated/ (generated shader files)
│   ├── generated 2/ (additional generated files)
│   └── shaders/
│       └── myFirstShader.glsl (330B, 23 lines)
├── scripts/ (build scripts)
├── dist/ (compiled output)
├── dist 2/ (additional build output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### UI Components (`packages/ui-components/`)
Reusable React components and UI utilities.

```
packages/ui-components/
├── package.json (1000B, 32 lines)
├── tsconfig.json (406B, 16 lines)
├── tsconfig.tsbuildinfo (37KB, 1 lines)
├── 2dots1line-ui-components-0.1.0.tgz (3.4KB, 6 lines)
├── src/
│   ├── index.ts (607B, 19 lines)
│   ├── components/
│   │   ├── index.ts (1.1KB, 31 lines)
│   │   ├── Button.tsx (1.2KB, 42 lines)
│   │   ├── DragHandle.tsx (1.5KB, 53 lines)
│   │   ├── ErrorMessage.tsx (616B, 30 lines)
│   │   ├── FileAttachment.tsx (5.6KB, 181 lines)
│   │   ├── GlassButton.tsx (1.4KB, 62 lines)
│   │   ├── GlassmorphicPanel.tsx (2.4KB, 120 lines)
│   │   ├── GlassmorphicPanel.stories.tsx (4.2KB, 169 lines)
│   │   ├── InputField.tsx (1.5KB, 63 lines)
│   │   ├── MinimizeToggle.tsx (1.9KB, 67 lines)
│   │   ├── VoiceRecordingIndicator.css (2.7KB, 160 lines)
│   │   ├── VoiceRecordingIndicator.tsx (1.6KB, 61 lines)
│   │   └── markdown/
│   │       ├── MarkdownRenderer.tsx (5.9KB, 206 lines)
│   │       └── markdown.styles.css (2.7KB, 149 lines)
│   ├── hooks/
│   │   ├── index.ts (398B, 15 lines)
│   │   └── useVoiceRecording.ts (13KB, 429 lines)
│   ├── theme/
│   │   └── index.ts (152B, 7 lines)
│   └── utils/
│       └── cn.ts (169B, 6 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Tool Registry (`packages/tool-registry/`)
Registry and management for AI tools.

```
packages/tool-registry/
├── .DS_Store (6.0KB, 1 lines)
├── jest.config.js (614B, 25 lines)
├── package.json (867B, 34 lines)
├── tsconfig.build.json (432B, 23 lines)
├── tsconfig.build.tsbuildinfo (37KB, 1 lines)
├── tsconfig.json (143B, 5 lines)
├── src/
│   ├── .DS_Store (6.0KB, 1 lines)
│   ├── index.ts (347B, 14 lines)
│   ├── registry.ts (8.5KB, 252 lines)
│   ├── types.ts (3.1KB, 91 lines)
│   ├── tools/
│   │   ├── index.ts (198B, 3 lines)
│   │   ├── stub-db-operation.tool.ts (2.4KB, 68 lines)
│   │   ├── stub-text-embedding.tool.ts (1.8KB, 63 lines)
│   │   └── stub-vector-search.tool.ts (1.9KB, 66 lines)
│   └── __tests__/
│       └── registry.test.ts (3.1KB, 80 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Text Tool (`packages/text-tool/`)
Natural Language Processing and Named Entity Recognition tools.

```
packages/text-tool/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (705B, 27 lines)
├── tsconfig.json (432B, 17 lines)
├── tsconfig.tsbuildinfo (36KB, 1 lines)
├── src/
│   ├── index.ts (142B, 7 lines)
│   ├── ner.ts (11KB, 336 lines)
│   └── ner-tool.ts (5.4KB, 188 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Document Tool (`packages/document-tool/`)
Document processing and extraction utilities.

```
packages/document-tool/
├── package.json (791B, 29 lines)
├── tsconfig.json (423B, 18 lines)
├── tsconfig.tsbuildinfo (36KB, 1 lines)
├── src/
│   ├── index.ts (152B, 6 lines)
│   ├── document-extract.tool.ts (9.1KB, 266 lines)
│   └── types.d.ts (480B, 21 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Vision Tool (`packages/vision-tool/`)
Computer vision and image processing tools.

```
packages/vision-tool/
├── package.json (726B, 27 lines)
├── tsconfig.json (423B, 18 lines)
├── tsconfig.tsbuildinfo (36KB, 1 lines)
├── src/ (vision processing source files)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Utils (`packages/utils/`)
Legacy utility package.

```
packages/utils/
└── src/
    ├── formatting/ (formatting utilities)
    ├── security/ (security utilities)
    └── validation/ (validation utilities)
```

└── .turbo/ (turborepo cache) 

    └── validation/ (validation utilities)
```

## Services Directory (`services/`)
### Cognitive Hub (`services/cognitive-hub/`)
Central service for AI agents and cognitive processing.

```
services/cognitive-hub/
├── .DS_Store (6.0KB, 1 lines)
├── jest.config.js (863B, 28 lines)
├── package.json (1.4KB, 49 lines)
├── tsconfig.json (845B, 33 lines)
├── tsconfig.tsbuildinfo (125KB, 1 lines)
├── config/
│   ├── dot-system-prompt.json (2.3KB, 5 lines)
│   ├── dot_system_prompt.json (1.3KB, 5 lines)
│   ├── growth_model_rules.json (6.1KB, 168 lines)
│   └── ner_rules.json (1.6KB, 75 lines)
├── src/
│   ├── .DS_Store (6.0KB, 1 lines)
│   ├── index.ts (403B, 15 lines)
│   ├── agents/
│   │   ├── .DS_Store (6.0KB, 1 lines)
│   │   ├── index.ts (1.1KB, 39 lines)
│   │   ├── dialogue/
│   │   │   └── DialogueAgent.ts (18KB, 476 lines)
│   │   ├── ingestion/
│   │   │   ├── IngestionAnalyst.ts (34KB, 921 lines)
│   │   │   └── IngestionAnalyst.test.ts (21KB, 558 lines)
│   │   ├── insight/
│   │   │   └── InsightEngine.ts (6.1KB, 203 lines)
│   │   ├── ontology/
│   │   │   └── OntologySteward.ts (5.9KB, 202 lines)
│   │   └── retrieval/
│   │       └── RetrievalPlanner.ts (5.1KB, 163 lines)
│   ├── services/
│   │   ├── index.ts (141B, 7 lines)
│   │   ├── card.service.ts (9.2KB, 294 lines)
│   │   ├── config.service.ts (11KB, 356 lines)
│   │   └── orb-state.manager.ts (4.4KB, 168 lines)
│   └── tools/
│       └── index.ts (1.5KB, 46 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

## Workers Directory (`workers/`)

### Embedding Worker (`workers/embedding-worker/`)
Background worker for text embedding processing.

```
workers/embedding-worker/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (786B, 27 lines)
├── tsconfig.json (565B, 21 lines)
├── tsconfig.tsbuildinfo (54KB, 1 lines)
├── src/
│   └── index.ts (1.2KB, 43 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Insight Worker (`workers/insight-worker/`)
Background worker for insight generation and processing.

```
workers/insight-worker/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (785B, 27 lines)
├── tsconfig.json (568B, 21 lines)
├── tsconfig.tsbuildinfo (54KB, 1 lines)
├── src/
│   └── index.ts (1.1KB, 42 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Scheduler (`workers/scheduler/`)
Background worker for job scheduling and task management.

```
workers/scheduler/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (787B, 28 lines)
├── tsconfig.json (520B, 20 lines)
├── tsconfig.tsbuildinfo (52KB, 1 lines)
├── src/
│   └── index.ts (1.6KB, 56 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)
```

### Embedding Worker (workers/embedding-worker/)
Background worker for text embedding processing.

workers/embedding-worker/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (786B, 27 lines)
├── tsconfig.json (565B, 21 lines)
├── tsconfig.tsbuildinfo (54KB, 1 lines)
├── src/
│   └── index.ts (1.2KB, 43 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)

### Insight Worker (workers/insight-worker/)
Background worker for insight generation and processing.

Background worker for insight generation and processing.workers/insight-worker/
├── .DS_Store (6.0KB, 1 lines)
├── package.json (785B, 27 lines)
├── tsconfig.json (568B, 21 lines)
├── tsconfig.tsbuildinfo (54KB, 1 lines)
├── src/
│   └── index.ts (1.1KB, 42 lines)
├── dist/ (compiled output)
├── node_modules/ (dependencies)
└── .turbo/ (turborepo cache)

Additional Directories
Development Documentation (DevLog/)
Contains development logs, technical specifications, and project documentation.
Documentation (docs/)
Project documentation including archived materials and setup guides.
Configuration (config/)
Global configuration files and TypeScript configuration.
Infrastructure (infrastructure/)
Infrastructure as code and deployment configurations.
3D Assets (3d-assets/)
3D models, textures, materials, and environment maps for the application.
Archive (archive/)
Legacy code and archived components from previous versions.
Data Directories
neo4j_data/ - Neo4j graph database data
postgres_data/ - PostgreSQL database data
redis_data/ - Redis cache data
weaviate_data/ - Weaviate vector database data
Total Repository Statistics:
Applications: 4 (api-gateway, backend-api, web-app, storybook)
Packages: 14 shared libraries and utilities
Services: 1 cognitive hub service
Workers: 3 background processing workers
Primary Languages: TypeScript, JavaScript, GLSL
Build System: Turborepo monorepo with pnpm
Databases: PostgreSQL, Neo4j, Redis, Weaviate
This repository structure follows modern monorepo best practices with clear separation of concerns between applications, shared packages, services, and workers.