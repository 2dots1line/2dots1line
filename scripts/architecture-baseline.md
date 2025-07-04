# 2D1L Architecture Baseline Documentation

## 🏗️ **Current Monorepo Structure**

### **Directory Hierarchy**
```
2D1L/
├── apps/                    # User-facing applications
│   ├── api-gateway/         # Main API endpoint aggregator
│   ├── storybook/           # Component documentation
│   └── web-app/             # React frontend application
├── services/                # Backend microservices
│   ├── card-service/        # Card management logic
│   ├── config-service/      # Configuration management
│   ├── dialogue-service/    # Conversation handling
│   └── user-service/        # User account management
├── workers/                 # Background job processors
│   ├── card-worker/         # Card processing jobs
│   ├── conversation-timeout-worker/
│   ├── embedding-worker/    # Vector embeddings
│   ├── graph-projection-worker/
│   ├── graph-sync-worker/   # Neo4j synchronization
│   ├── ingestion-worker/    # Data ingestion
│   ├── insight-worker/      # Analytics processing
│   ├── maintenance-worker/  # System maintenance
│   └── notification-worker/ # User notifications
└── packages/                # Shared libraries
    ├── ai-clients/          # LLM client abstractions
    ├── canvas-core/         # 3D canvas utilities
    ├── core-utils/          # General utilities
    ├── database/            # Database access layer
    ├── orb-core/            # UI orb components
    ├── shader-lib/          # GLSL shader management
    ├── shared-types/        # TypeScript type definitions
    ├── tool-registry/       # AI tool management
    ├── tools/               # Atomic and composite tools
    └── ui-components/       # Reusable React components
```

## 📊 **Dependency Hierarchy Mapping**

### **Foundation Layer (No Dependencies)**
- `packages/shared-types`
- `packages/core-utils`
- `packages/canvas-core`
- `packages/shader-lib`

### **Data Layer (Depends on Foundation)**
- `packages/database` → shared-types, core-utils
- `packages/ai-clients` → shared-types, core-utils

### **Business Logic Layer**
- `packages/tools` → database, shared-types, ai-clients
- `packages/tool-registry` → tools, shared-types
- `packages/ui-components` → shared-types, canvas-core

### **Service Layer**
- `services/*` → database, shared-types, tools
- `workers/*` → database, shared-types, tools, tool-registry

### **Application Layer (Top Level)**
- `apps/api-gateway` → services, shared-types, core-utils
- `apps/web-app` → ui-components, shared-types, canvas-core
- `apps/storybook` → ui-components

## ⚠️ **Current Architectural Issues**

### **Dependency Direction Violations**
- ✅ **VERIFIED**: No packages import from apps/ (correct)
- ✅ **VERIFIED**: No reverse dependencies found
- ❌ **ISSUE**: Some services may have circular workspace dependencies (needs investigation)

### **Missing Abstractions**
- **Database Layer**: Direct Prisma usage in multiple packages
- **Configuration Management**: Scattered config loading
- **Error Handling**: Inconsistent error types across services

### **Project Reference Issues**
- **Missing References**: 13+ packages missing TypeScript project references
- **Build Order**: No enforced build dependency order
- **Composite Configuration**: Inconsistent composite settings

## 🎯 **Architectural Constraints**

### **Approved Patterns**
1. **Dependency Direction**: packages → services/workers → apps
2. **Database Access**: Only through packages/database repositories
3. **Type Sharing**: All types from packages/shared-types
4. **Configuration**: Centralized in config/ directory
5. **Tool Architecture**: Atomic tools → composite tools → agent usage

### **Forbidden Patterns**
1. **Reverse Dependencies**: apps importing packages is FORBIDDEN
2. **Direct Database Access**: Services/apps directly using Prisma
3. **Circular Dependencies**: Any package depending on itself transitively
4. **Hardcoded Configuration**: Business logic values hardcoded in source

### **Package Naming Conventions**
- **Apps**: `kebab-case` (api-gateway, web-app)
- **Services**: `kebab-case` with -service suffix
- **Workers**: `kebab-case` with -worker suffix
- **Packages**: `kebab-case` (shared-types, core-utils)
- **Workspace Names**: `@2dots1line/package-name`

## 📋 **Architecture Compliance Checklist**

### **Workspace Structure**
- ✅ Directory structure matches V9.5 specification
- ✅ pnpm-workspace.yaml includes correct patterns
- ✅ No buildable packages in config/ directory
- ❌ Some packages missing proper export configurations

### **Dependency Management**
- ✅ All workspace dependencies use `workspace:^` syntax
- ❌ Missing project references cause build issues
- ❌ TypeScript version inconsistencies across packages
- ❌ Some peer dependency warnings unresolved

### **Build System**
- ✅ Turbo.json uses correct v2.0 tasks format
- ❌ Task dependencies don't reflect actual build order
- ❌ Generated files (Prisma, shaders) not automated
- ❌ Build outputs inconsistent across packages

## 🚀 **Architectural Improvement Roadmap**

### **Phase 1: Documentation** ✅ COMPLETED
- Environment variables documented
- Security baseline established
- Architecture constraints defined

### **Phase 2: Build System Stabilization**
- Fix Prisma client generation automation
- Ensure all generated files have TypeScript declarations
- Clean build artifact contamination

### **Phase 3: TypeScript Configuration**
- Add missing project references systematically
- Standardize tsconfig patterns across packages
- Fix composite configuration issues

### **Phase 4: Version Standardization**
- Standardize TypeScript versions (target: ^5.3.3)
- Resolve peer dependency conflicts
- Update incompatible packages gradually

### **Phase 5: Architecture Enforcement**
- Implement dependency direction linting
- Standardize package export patterns
- Add architectural constraint validation

## 🔍 **Monitoring & Validation**

### **Automated Checks**
- Dependency direction validation
- Circular dependency detection
- Version compatibility monitoring
- Build order verification

### **Manual Reviews**
- Monthly architecture compliance review
- Quarterly dependency audit
- Annual architectural pattern review

---

**Baseline Established**: December 30, 2024  
**Next Architecture Review**: January 2025  
**Compliance Level**: 65% (improvements needed) 