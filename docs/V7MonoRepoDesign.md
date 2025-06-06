# 2dots1line V7 Monorepo Design

## Overview

This document details the monorepo structure for the 2dots1line V7 implementation. The structure builds upon the V4 architecture while integrating the advanced UI/UX features and 3-layer architecture described in the V7 UI/UX Design and Technical Specification.

The V7 monorepo is designed to:

1. **Support the 3-Layer UI Architecture** (3D Canvas, 2D Modal, 3D Orb)
2. **Enable Team Collaboration** across frontend, backend, and 3D teams
3. **Promote Code Reuse** through shared packages
4. **Ensure Clean Architecture** with separation of concerns
5. **Facilitate Regional Deployment** for both US and China markets
6. **Integrate Advanced 3D Rendering** with performant WebGL implementations

## Design Principles

Following feedback and architectural refinement, the V7 monorepo incorporates these key design principles:

1. **Strict Vertical vs. Horizontal Separation**:
   - Front-end "vertical slices" live inside apps/* (web-app, mobile-app, api-gateway)
   - Shared "horizontal" libraries live in packages/* with clear dependency direction
   - Scene-agnostic camera controls, post-processing, and utilities belong in packages/canvas-core
   - No circular dependencies between shared packages

2. **Binary-Free Source of Truth**:
   - Source assets (models, textures) under 5MB stored in Git
   - Optimized, packed, or compressed artifacts stored in object storage
   - Asset processing pipeline pulls from external storage during build

3. **Progressive Service Decomposition**:
   - Start with monolithic cognitive-hub service exporting adapters
   - Split into microservices only when traffic patterns justify
   - Use API gateway (BFF) for client-facing endpoints to shield from internal changes

## Package Management

We use **Turborepo** for our monorepo management, with enhancements to support WebGL/Three.js development:

- Specialized caching configurations for shader assets
- Support for GLSL/shader modules in the build pipeline
- Integration with 3D asset pipeline tools

### Root Package.json

```json
{
  "name": "@2dots1line/v7-monorepo",
  "version": "7.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*",
    "workers/*",
    "3d-assets/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md,glsl}\"",
    "prepare": "husky install",
    "process-assets": "node scripts/asset-processing/process-assets.js"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-glsl": "^0.0.15",
    "glslify": "^7.1.1",
    "glsl-type-basics": "^1.0.0",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2",
    "prettier": "^3.2.5",
    "turbo": "^2.1.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "packageManager": "npm@10.5.0"
}
```

### Turbo Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local",
    ".node-version",
    "turbo.json"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "shader:compile": {
      "outputs": ["dist/shaders/**"]
    }
  }
}
```

## Directory Structure

The V7 monorepo structure expands on the V4 design with additional directories and packages to support the 3-layer UI architecture:

```
/2dots1line-v7-monorepo/                # Root directory
├── .github/                            # GitHub-specific settings
│   ├── ISSUE_TEMPLATE/                 # Templates for GitHub issues
│   ├── PULL_REQUEST_TEMPLATE.md        # PR template
│   └── workflows/                      # CI/CD workflows
│       ├── ci-main.yml                 # Main branch CI
│       ├── ci-pr.yml                   # PR validation
│       └── deployment.yml              # Deployment workflow
│
├── apps/                               # Application implementations
│   ├── web-app/                        # Next.js web application
│   │   ├── public/                     # Static assets
│   │   ├── src/
│   │   │   ├── app/                    # Next.js App Router pages
│   │   │   │   ├── (auth)/             # Auth-related routes
│   │   │   │   │   ├── login/
│   │   │   │   │   └── signup/
│   │   │   │   ├── (main)/             # Main app routes
│   │   │   │   │   ├── chat/           # Dot chat interface
│   │   │   │   │   ├── dashboard/      # Dashboard view
│   │   │   │   │   ├── cards/          # Card gallery
│   │   │   │   │   ├── graph/          # Knowledge graph exploration
│   │   │   │   │   └── settings/       # User settings
│   │   │   │   └── layout.tsx          # Root layout
│   │   │   ├── components/             # React components
│   │   │   │   ├── common/             # Generic UI components
│   │   │   │   ├── layout/             # Layout components
│   │   │   │   ├── cards/              # Card-related components
│   │   │   │   ├── chat/               # Chat interface components
│   │   │   │   ├── modal/              # 2D Modal Layer components
│   │   │   │   └── accessibility/      # Accessibility components
│   │   │   ├── canvas/                 # Scene-specific 3D implementations
│   │   │   │   ├── scenes/             # Scene implementations
│   │   │   │   │   ├── CloudScene/     # Cloud scene components
│   │   │   │   │   ├── AscensionScene/ # Ascension scene components
│   │   │   │   │   └── GraphScene/     # Graph scene components
│   │   │   ├── orb/                    # 3D Orb Layer (app-specific)
│   │   │   │   ├── components/         # Orb components for this app
│   │   │   │   └── hooks/              # App-specific Orb hooks
│   │   │   ├── shaders/                # App-specific GLSL shaders
│   │   │   ├── stores/                 # State management
│   │   │   │   ├── sceneStore.ts       # Scene state
│   │   │   │   ├── orbStore.ts         # Orb state
│   │   │   │   ├── cardStore.ts        # Card gallery state
│   │   │   │   └── userStore.ts        # User state
│   │   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── lib/                    # Client-side utilities
│   │   │   │   ├── api/                # API client
│   │   │   │   └── utils/              # Utility functions
│   │   │   ├── styles/                 # Global styles
│   │   │   └── types/                  # TypeScript type definitions
│   │   ├── next.config.js              # Next.js configuration
│   │   ├── package.json                # Web app dependencies
│   │   ├── tsconfig.json               # TypeScript config
│   │   └── README.md                   # Web app documentation
│   │
│   ├── mobile-app/                     # React Native mobile app
│   │   ├── src/                        # Mobile app source code
│   │   │   ├── screens/                # App screens
│   │   │   ├── components/             # Mobile UI components
│   │   │   ├── canvas/                 # Mobile 3D implementation
│   │   │   ├── orb/                    # Mobile Orb implementation
│   │   │   ├── navigation/             # Navigation setup
│   │   │   ├── hooks/                  # Mobile-specific hooks
│   │   │   ├── services/               # Mobile services
│   │   │   └── utils/                  # Mobile utilities
│   │   ├── ios/                        # iOS-specific files
│   │   ├── android/                    # Android-specific files
│   │   ├── package.json                # Mobile dependencies
│   │   └── README.md                   # Mobile app documentation
│   │
│   ├── api-gateway/                    # Client-facing API Gateway (BFF)
│   │   ├── src/
│   │   │   ├── graphql/                # GraphQL schema and resolvers
│   │   │   ├── trpc/                   # tRPC router (optional alternative)
│   │   │   ├── controllers/            # API endpoint handlers
│   │   │   ├── services/               # Proxy services to internal APIs
│   │   │   ├── middleware/             # API middleware
│   │   │   ├── auth/                   # Centralized authentication logic
│   │   │   └── server.ts               # Server setup
│   │   ├── package.json                # Gateway dependencies
│   │   └── README.md                   # Gateway documentation
│   │
│   ├── storybook/                      # Storybook for component documentation
│   │   ├── .storybook/                 # Storybook configuration
│   │   ├── stories/                    # Component stories
│   │   └── package.json                # Storybook dependencies
│   │
│   ├── backend-api/                    # Express.js API server
│   │   ├── src/
│   │   │   ├── config/                 # Backend configuration
│   │   │   │   ├── database.ts         # Database connections
│   │   │   │   ├── queue.ts            # Queue configuration
│   │   │   │   ├── cache.ts            # Redis configuration
│   │   │   │   ├── llm.ts              # LLM provider config
│   │   │   │   └── logging.ts          # Logging configuration
│   │   │   ├── controllers/            # API endpoint handlers
│   │   │   │   ├── auth.controller.ts  # Authentication endpoints
│   │   │   │   ├── chat.controller.ts  # Chat endpoints
│   │   │   │   ├── card.controller.ts  # Card gallery endpoints
│   │   │   │   ├── graph.controller.ts # Graph visualization endpoints
│   │   │   │   └── orb.controller.ts   # Orb state endpoints
│   │   │   ├── middleware/             # Express middleware
│   │   │   ├── routes/                 # API route definitions
│   │   │   ├── services/               # Business logic services
│   │   │   ├── utils/                  # Backend utilities
│   │   │   └── server.ts               # Express server setup
│   │   ├── prisma/                     # Prisma ORM
│   │   │   ├── schema.prisma           # Database schema
│   │   │   ├── migrations/             # Database migrations
│   │   │   └── seed.ts                 # Seed data
│   │   ├── package.json                # Backend dependencies
│   │   └── README.md                   # Backend documentation
│
├── packages/                           # Shared code libraries
│   ├── shared-types/                   # Common TypeScript types
│   │   ├── src/
│   │   │   ├── entities/               # Core entity type definitions
│   │   │   ├── api/                    # API request/response types
│   │   │   ├── ui/                     # UI component types
│   │   │   ├── canvas/                 # 3D Canvas types
│   │   │   ├── orb/                    # Orb types
│   │   │   ├── growth/                 # Growth dimension types
│   │   │   └── index.ts                # Exports
│   │   └── package.json                # Types dependencies
│   │
│   ├── database/                       # Database access layer
│   │   ├── src/
│   │   │   ├── prisma/                 # Prisma client wrapper
│   │   │   ├── neo4j/                  # Neo4j client wrapper
│   │   │   ├── weaviate/               # Weaviate client wrapper
│   │   │   ├── redis/                  # Redis client wrapper
│   │   │   └── index.ts                # Exports
│   │   └── package.json                # Database dependencies
│   │
│   ├── ai-clients/                     # LLM provider clients
│   │   ├── src/
│   │   │   ├── google/                 # Google AI client
│   │   │   ├── deepseek/               # DeepSeek client
│   │   │   ├── models/                 # Model selection logic
│   │   │   ├── interfaces/             # Common interfaces
│   │   │   └── index.ts                # Exports
│   │   └── package.json                # AI client dependencies
│   │
│   ├── ui-components/                  # Shared UI components
│   │   ├── src/
│   │   │   ├── components/             # React components
│   │   │   ├── hooks/                  # UI-related hooks
│   │   │   ├── theme/                  # Design tokens and theming
│   │   │   ├── animations/             # Animation utilities
│   │   │   └── glassmorphic/           # Glassmorphic design components
│   │   └── package.json                # UI dependencies
│   │
│   ├── canvas-core/                    # Shared 3D Canvas utilities
│   │   ├── src/
│   │   │   ├── scene/                  # Scene management
│   │   │   ├── camera/                 # Camera controls
│   │   │   ├── lighting/               # Lighting systems
│   │   │   ├── post-processing/        # Post-processing effects
│   │   │   ├── performance/            # Performance optimization
│   │   │   ├── loaders/                # Asset loading utilities
│   │   │   └── index.ts                # Exports
│   │   └── package.json                # Canvas core dependencies
│   │
│   ├── shader-lib/                     # Shared shader library
│   │   ├── src/
│   │   │   ├── noise/                  # Noise generation shaders
│   │   │   ├── atmospherics/           # Atmospheric effect shaders
│   │   │   ├── particles/              # Particle system shaders
│   │   │   ├── utils/                  # Shader utilities
│   │   │   └── index.ts                # Exports
│   │   └── package.json                # Shader lib dependencies
│   │
│   ├── orb-core/                       # Shared Orb implementations
│   │   ├── src/
│   │   │   ├── base/                   # Base Orb implementation
│   │   │   ├── states/                 # Visual state definitions
│   │   │   ├── emotions/               # Emotional state definitions
│   │   │   ├── effects/                # Visual effect utilities
│   │   │   └── index.ts                # Exports
│   │   └── package.json                # Orb core dependencies
│   │
│   └── core-utils/                     # Shared core utilities
│       ├── src/
│       │   ├── formatting/             # Date, text formatters
│       │   ├── validation/             # Validation helpers
│       │   ├── security/               # Security utilities
│       │   ├── math/                   # Math utilities for 3D
│       │   └── index.ts                # Exports
│       ├── README.md                   # Note: Do not import this package from other shared packages
│       └── package.json                # Utils dependencies
│
├── services/                           # Cognitive agents & tools
│   ├── cognitive-hub/                  # Unified cognitive services process
│   │   ├── src/
│   │   │   ├── agents/                 # Agent implementations
│   │   │   │   ├── dialogue/           # Dialogue Agent (Dot)
│   │   │   │   ├── ingestion/          # Ingestion Analyst
│   │   │   │   ├── retrieval/          # Retrieval Planner
│   │   │   │   ├── insight/            # Insight Engine
│   │   │   │   └── ontology/           # Ontology Steward
│   │   │   ├── tools/                  # Common tools used by agents
│   │   │   │   ├── text-tools/         # Text processing tools
│   │   │   │   ├── vision-tools/       # Vision processing tools
│   │   │   │   ├── embedding-tools/    # Embedding generation tools
│   │   │   │   ├── vector-tools/       # Vector search tools
│   │   │   │   └── graph-tools/        # Graph operation tools
│   │   │   ├── adapters/               # Service adapters
│   │   │   ├── config/                 # Configuration
│   │   │   └── index.ts                # Exports
│   │   └── package.json                # Hub dependencies
│   │
│   └── tools/                          # Standalone deterministic tools
│       ├── text-tools/                 # Text processing tools
│       ├── vision-tools/               # Vision processing tools
│       ├── embedding-tools/            # Embedding generation tools
│       ├── vector-tools/               # Vector search tools
│       ├── graph-tools/                # Graph operation tools
│       ├── registry/                   # Tool registry
│       └── README.md                   # Tools documentation
│
├── workers/                            # Background workers
│   ├── ingestion-worker/               # Ingestion queue processor
│   ├── embedding-worker/               # Embedding generation worker
│   ├── insight-worker/                 # Insight generation worker
│   └── scheduler/                      # Scheduled job processor
│
├── 3d-assets/                          # 3D asset sources (under 5MB)
│   ├── environment-maps/               # HDR environment maps
│   │   ├── src/                        # Source assets
│   │   └── package.json                # Package info
│   │
│   ├── textures/                       # Texture assets
│   │   ├── clouds/                     # Cloud textures
│   │   ├── particles/                  # Particle textures
│   │   ├── noise/                      # Noise textures
│   │   └── package.json                # Package info
│   │
│   ├── models/                         # 3D models
│   │   ├── src/                        # Source models
│   │   └── package.json                # Package info
│   │
│   └── materials/                      # Material definitions
│       ├── src/                        # Material source files
│       └── package.json                # Package info
│
├── infrastructure/                     # IaC for deployment
│   ├── modules/                        # Shared Terraform modules
│   │   ├── database/                   # Database modules
│   │   ├── compute/                    # Compute modules
│   │   └── networking/                 # Networking modules
│   │
│   ├── env-aws/                        # AWS deployments (US-region)
│   │   ├── terraform/                  # Terraform root configuration
│   │   ├── variables/                  # Environment variables
│   │   └── README.md                   # AWS documentation
│   │
│   ├── env-tencent/                    # Tencent Cloud deployments (China-region)
│   │   ├── terraform/                  # Terraform root configuration
│   │   ├── variables/                  # Environment variables
│   │   └── README.md                   # Tencent documentation
│   │
│   └── docker/                         # Docker Compose for local dev
│       ├── docker-compose.yml          # Main compose file
│       ├── docker-compose.dev.yml      # Development overrides
│       └── README.md                   # Docker documentation
│
├── docs/                               # Documentation
│   ├── v7UIUXDesign.md                 # UI/UX design specification
│   ├── v7TechSpec.md                   # Technical specification
│   ├── V7MonoRepoDesign.md             # This document
│   ├── V7DataSchemaDesign.md           # Data schema design
│   ├── architecture/                   # Architecture diagrams
│   ├── api/                            # API documentation
│   └── README.md                       # Docs overview
│
├── scripts/                            # Utility scripts
│   ├── setup/                          # Setup scripts
│   ├── migration/                      # Data migration scripts
│   ├── asset-processing/               # 3D asset processing
│   │   ├── process-assets.js           # Main asset processing script
│   │   ├── compress-textures.js        # Texture compression
│   │   ├── optimize-models.js          # Model optimization
│   │   └── process-hdri.js             # HDR processing
│   └── shader-compilation/             # Shader compilation scripts
│
├── config/                             # Global configuration
│   ├── eslint/                         # ESLint configuration
│   ├── prettier/                       # Prettier configuration
│   ├── jest/                           # Jest test configuration
│   └── tsconfig/                       # Base TypeScript configs
│
├── .gitignore                          # Git ignore file
├── .eslintrc.js                        # Root ESLint config
├── .prettierrc.js                      # Root Prettier config
├── jest.config.js                      # Root Jest config
├── tsconfig.json                       # Root TypeScript config
├── turbo.json                          # Turborepo configuration
├── package.json                        # Root package.json
└── README.md                           # Project overview
```

## Key Refinements for V7

The V7 monorepo design incorporates these refinements based on team feedback:

### 1. Vertical vs. Horizontal Code Organization

- **Scene-agnostic 3D utilities** moved from `apps/web-app/canvas/` to `packages/canvas-core/`
  - Camera controls, post-processing, and performance helpers now live in the shared package
  - Only scene-specific implementations remain in the app layer
  - Prevents duplication when porting to mobile or other platforms

- **Core utilities dependency direction**
  - `packages/core-utils` (renamed from `utils`) is explicitly forbidden from being imported by other shared packages
  - This enforces a single dependency direction and prevents circular dependencies
  - App-specific utilities still reside in their respective app folders

### 2. Separated Deployment Infrastructure

- Split AWS and Tencent Cloud infrastructure into separate root configurations:
  - `infrastructure/env-aws/` contains US-region deployment
  - `infrastructure/env-tencent/` contains China-region deployment
  - `infrastructure/modules/` contains shared modules referenced by both

- This separation prevents terraform apply accidents between regions
- A GitHub action will block PRs that edit .tf files outside their environment folder without bumping both roots

### 3. API Gateway / BFF Pattern

- Added `apps/api-gateway/` as a Backend-For-Frontend (BFF) service
- Centralizes authentication, API versioning, and client-facing contracts
- Shields clients from internal service boundary changes
- Supports GraphQL or tRPC for efficient client-server communication
- Mobile and web clients connect to this gateway rather than directly to services

### 4. Binary Asset Management

- Source assets under 5MB are stored in Git under `3d-assets/*/src/`
- Optimized/transformed artifacts (compressed textures, processed HDRIs) are stored externally
- CI pipeline pulls from object storage during build via `scripts/asset-processing/`
- This keeps the repository lean while preserving source fidelity

### 5. Cognitive Services Architecture

- Initial implementation uses a unified `services/cognitive-hub/` with all agents as modules
- This simplifies early development and reduces network hops between agents
- Service can be split into microservices later when traffic patterns justify
- Clear module boundaries and adapters facilitate future decomposition

### 6. Developer Experience Enhancements

- **Shader Linting**: Added glslify and glsl-type-basics for WebGL shader validation
- **Storybook**: Moved to `apps/storybook/` for separate caching of built stories
- **Turborepo Cache Keys**: Added `.node-version` and `turbo.json` to globalDependencies
- **Package Naming**: Standardized to `@2dots1line/<scope>-<n>` (e.g., `@2dots1line/ui-button`)

### 7. Test Strategy

- **Component Testing**: Added Cypress Component Testing for shader-free UI components
- **3D Testing**: Use Playwright with WebGL context stub for scene testing
- **Snapshot Testing**: Snapshot Orb GLB scene JSON rather than full screenshots

## Package Dependencies

Here's a diagram of key package dependencies for the V7 architecture:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                             WEB APP / MOBILE APP                           │
│ ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐  ┌─────────────┐ │
│ │  3D CANVAS  │  │  2D MODAL LAYER  │  │  3D ORB LAYER │  │ STATE MGMT  │ │
│ └──────┬──────┘  └────────┬─────────┘  └───────┬───────┘  └──────┬──────┘ │
└─────────┼───────────────────┼─────────────────┼─────────────────┼─────────┘
          │                   │                 │                 │
┌─────────▼───────┬───────────▼─────────┬───────▼─────────┬──────▼──────────┐
│  canvas-core    │   ui-components     │   orb-core      │  shared-types   │
└─────────┬───────┴───────────┬─────────┴───────┬─────────┴──────┬──────────┘
          │                   │                 │                 │
┌─────────▼───────┐ ┌─────────▼─────────┐ ┌─────▼───────────┐ ┌──▼───────────┐
│   shader-lib    │ │  3d-assets        │ │  api-clients    │ │  core-utils  │
└─────────────────┘ └───────────────────┘ └─────────────────┘ └──────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                  │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                         COGNITIVE HUB                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌────────┐ │
│ │dialogue-agent│ │ingestion    │ │insight-engine│ │retrieval   │ │ontology│ │
│ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ └────────┘ │
└─────────┼───────────────┼───────────────┼──────────────┼───────────────────┘
          │               │               │              │
┌─────────▼───────────────▼───────────────▼──────────────▼───────────────────┐
│                              DATABASE                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ PostgreSQL  │  │   Neo4j     │  │  Weaviate   │  │     Redis       │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```

## Development Team Structure

The V7 architecture supports specialized teams working in parallel:

1. **3D Canvas Team:**
   - Responsible for: Scene implementations, shaders, 3D performance
   - Primary directories: `packages/canvas-core/`, `shader-lib/`, `apps/web-app/canvas/scenes/`

2. **UI/UX Team:**
   - Responsible for: 2D Modal layer, Card Gallery, general UI components
   - Primary directories: `packages/ui-components/`, `apps/web-app/components/`

3. **Orb Team:**
   - Responsible for: Orb visualization, state management, effects
   - Primary directories: `packages/orb-core/`, `apps/web-app/orb/`

4. **Backend Team:**
   - Responsible for: Agent implementation, data processing, API services
   - Primary directories: `services/cognitive-hub/`, `workers/`, `packages/database/`

5. **DevOps Team:**
   - Responsible for: Infrastructure, deployment, monitoring
   - Primary directories: `infrastructure/`, CI/CD pipelines

## Development Environment Setup

### Prerequisites

- Node.js (v18+)
- Docker Desktop
- Git
- npm (v10+)
- GPU-accelerated browser for 3D development

### Initial Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/2dots1line-v7-monorepo.git
cd 2dots1line-v7-monorepo
```

2. Install dependencies
```bash
npm install
```

3. Start infrastructure services
```bash
docker-compose up -d
```

4. Process 3D assets (downloads optimized assets from object storage)
``