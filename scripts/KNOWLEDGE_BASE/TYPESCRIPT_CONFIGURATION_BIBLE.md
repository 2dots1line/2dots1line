# 📘 **TYPESCRIPT CONFIGURATION BIBLE - 2D1L**
*Definitive reference for TypeScript configuration in monorepo architecture*

---

## 🎯 **AUTHORITATIVE PRINCIPLES**

> *This document represents the definitive TypeScript configuration standards for 2D1L, incorporating all lessons learned from systematic debugging and architectural analysis.*

### **🧬 CORE ARCHITECTURAL INSIGHTS**

1. **FRONTEND ≠ BACKEND MODULE SYSTEMS** - Different runtime environments require incompatible TypeScript settings
2. **PROJECT REFERENCES ARE MANDATORY** - Monorepo packages must use TypeScript project references for proper dependency management
3. **BUILD INFO FILES MUST BE EXPLICIT** - Prevent race conditions with explicit `tsBuildInfoFile` paths
4. **CONFIGURATION INHERITANCE CAN CREATE SILENT CONFLICTS** - Multiple valid base configs can interact incorrectly

---

## 🏗️ **MONOREPO ARCHITECTURE PATTERNS**

### **🎯 CONFIGURATION HIERARCHY**

```
ROOT/
├── tsconfig.json                  # Solution file (references only)
├── tsconfig.base.json            # Shared compiler options
├── packages/
│   └── [package]/
│       ├── tsconfig.json         # Package config (extends base)
│       └── tsconfig.build.json   # Build config (if needed)
├── services/
│   └── [service]/
│       ├── tsconfig.json         # Service config (extends base)
│       └── tsconfig.build.json   # Build config
└── apps/
    └── [app]/
        ├── tsconfig.json         # App config (may override base)
        └── next.config.js        # App-specific settings
```

---

## 📋 **DEFINITIVE CONFIGURATION TEMPLATES**

### **🔧 ROOT SOLUTION FILE** (`tsconfig.json`)
```json
{
  "extends": "./tsconfig.base.json",
  "files": [],
  "references": [
    { "path": "packages/shared-types" },
    { "path": "packages/database" },
    { "path": "packages/core-utils" },
    { "path": "packages/ai-clients" },
    { "path": "packages/tool-registry" },
    { "path": "packages/tools" },
    { "path": "packages/canvas-core" },
    { "path": "packages/orb-core" },
    { "path": "packages/shader-lib" },
    { "path": "packages/ui-components" },
    { "path": "services/config-service" },
    { "path": "services/user-service" },
    { "path": "services/dialogue-service" },
    { "path": "services/card-service" },
    { "path": "workers/card-worker" },
    { "path": "workers/conversation-timeout-worker" },
    { "path": "workers/embedding-worker" },
    { "path": "workers/graph-projection-worker" },
    { "path": "workers/graph-sync-worker" },
    { "path": "workers/ingestion-worker" },
    { "path": "workers/insight-worker" },
    { "path": "workers/maintenance-worker" },
    { "path": "workers/notification-worker" },
    { "path": "apps/api-gateway" },
    { "path": "apps/web-app" },
    { "path": "apps/storybook" }
  ]
}
```

**CRITICAL RULES:**
- ✅ **ONLY** `references` and `files: []` in root solution file
- ✅ Every buildable package/service/app MUST be listed in references
- ❌ **NEVER** include `include`, `exclude`, or `compilerOptions` in root

---

### **🛠️ BASE CONFIGURATION** (`tsconfig.base.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "incremental": true,
    "noEmitOnError": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**CRITICAL DECISIONS:**
- **`"module": "CommonJS"`** - Backend Node.js standard
- **`"moduleResolution": "node"`** - Server-side resolution
- **Frontend apps will override these** for browser compatibility

---

### **📦 PACKAGE CONFIGURATION TEMPLATE** (`packages/[name]/tsconfig.json`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "references": [
    { "path": "../shared-types" }
    // Add other workspace dependencies as needed
  ]
}
```

**BUILD CONFIGURATION** (`packages/[name]/tsconfig.build.json`)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "tsBuildInfoFile": "./dist/tsconfig.build.tsbuildinfo"
  },
  "references": [
    { "path": "../shared-types" }
    // Must match dependencies exactly
  ]
}
```

**CRITICAL REQUIREMENTS:**
- ✅ `tsBuildInfoFile` MUST be explicitly set (prevents race conditions)
- ✅ `references` MUST match workspace dependencies exactly
- ✅ `outDir` and `rootDir` for proper build output

---

### **🚀 SERVICE CONFIGURATION TEMPLATE** (`services/[name]/tsconfig.json`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo",
    "@types/node": "^20.0.0"
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "references": [
    { "path": "../../packages/shared-types" },
    { "path": "../../packages/database" },
    { "path": "../../packages/core-utils" }
    // Add other dependencies
  ]
}
```

**BUILD CONFIGURATION** (`services/[name]/tsconfig.build.json`)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "tsBuildInfoFile": "./dist/tsconfig.build.tsbuildinfo"
  }
}
```

---

### **🌐 FRONTEND APP CONFIGURATION** (`apps/web-app/tsconfig.json`)

**CRITICAL: Frontend apps MUST override base module system for browser compatibility**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "ES6"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true,
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"],
  "references": [
    { "path": "../../packages/shared-types" },
    { "path": "../../packages/ui-components" }
  ]
}
```

**FRONTEND-SPECIFIC OVERRIDES:**
- ✅ `"module": "esnext"` - ES modules for bundlers
- ✅ `"moduleResolution": "bundler"` - Webpack resolution
- ✅ `"lib": ["dom", "dom.iterable", "ES6"]` - Browser APIs
- ✅ `"noEmit": true"` - Next.js handles compilation
- ✅ `"jsx": "preserve"` - Let Next.js process JSX

---

## 🔗 **PROJECT REFERENCES MANAGEMENT**

### **DEPENDENCY-TO-REFERENCE MAPPING RULES**

**MANDATORY PRINCIPLE**: Every workspace dependency in `package.json` MUST have corresponding TypeScript reference

```bash
# VERIFICATION PROTOCOL
for pkg in packages/* services/* workers/* apps/*; do
  if [ -f "$pkg/package.json" ] && [ -f "$pkg/tsconfig.json" ]; then
    echo "=== Checking $pkg ==="
    echo "Workspace deps:" && grep '"@2dots1line/' "$pkg/package.json" || echo "None"
    echo "TS references:" && grep -A 10 '"references"' "$pkg/tsconfig.json" || echo "None"
  fi
done
```

### **REFERENCE PATH PATTERNS**

```json
// From packages/tools/tsconfig.json
"references": [
  { "path": "../shared-types" },           // Sibling package
  { "path": "../database" },              // Sibling package
  { "path": "../../services/config-service" }  // Cross-directory
]

// From services/dialogue-service/tsconfig.json  
"references": [
  { "path": "../../packages/shared-types" },  // Up to packages
  { "path": "../../packages/database" },      // Up to packages
  { "path": "../../packages/tools" }          // Up to packages
]

// From apps/web-app/tsconfig.json
"references": [
  { "path": "../../packages/shared-types" },     // Up to packages
  { "path": "../../packages/ui-components" }     // Up to packages
]
```

---

## 🚨 **BUILD INFO FILE RACE CONDITION PREVENTION**

### **EXPLICIT BUILD INFO PATHS (MANDATORY)**

**PROBLEM**: Multiple TypeScript builds without explicit `tsBuildInfoFile` create race conditions

**SOLUTION**: Every TypeScript config MUST specify explicit build info file path

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"
  }
}
```

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./dist/tsconfig.build.tsbuildinfo"  
  }
}
```

**DETECTION PROTOCOL:**
```bash
# Check for missing explicit build info files
find . -name "tsconfig*.json" -not -path "./node_modules/*" -exec grep -L "tsBuildInfoFile" {} \;

# Check for race condition artifacts
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json" | wc -l
# Should return 0 after builds complete
```

**AUTOMATIC FIX:**
```bash
pnpm fix:typescript  # Adds explicit tsBuildInfoFile to all configs
```

---

## ⚠️ **MODULE SYSTEM COMPATIBILITY MATRIX**

### **CRITICAL INCOMPATIBILITIES**

| **Environment** | **Module** | **ModuleResolution** | **Target** | **Reason** |
|-----------------|------------|---------------------|------------|------------|
| **Node.js Backend** | `CommonJS` | `node` | `ES2020` | Server runtime expects CommonJS |
| **Next.js Frontend** | `esnext` | `bundler` | `ES2017` | Webpack bundler needs ES modules |
| **Storybook** | `esnext` | `bundler` | `ES2017` | Webpack bundler needs ES modules |
| **Node.js Workers** | `CommonJS` | `node` | `ES2020` | Server runtime expects CommonJS |

### **SILENT ARCHITECTURE CONFLICT DETECTION**

**PROBLEM**: Valid individual configs can create systemic failures at module boundaries

**DETECTION PROTOCOL:**
```bash
# Test runtime imports work, not just compilation
cd services/dialogue-service && node -e "
try { 
  const db = require('@2dots1line/database'); 
  console.log('✅ Database import successful'); 
} catch(e) { 
  console.log('❌ Import failed:', e.message); 
}"

# Check for module system mismatches
grep -r '"module"' packages/*/tsconfig*.json services/*/tsconfig*.json apps/*/tsconfig*.json
```

---

## 🔄 **BUILD ORDER & DEPENDENCY CHAIN**

### **MANDATORY BUILD SEQUENCE**

**CRITICAL**: TypeScript project references require strict build order

```bash
# 1. FOUNDATION PACKAGES (no dependencies)
pnpm --filter=@2dots1line/shared-types build

# 2. DATABASE LAYER (requires Prisma generation first)
cd packages/database && pnpm db:generate && pnpm build && cd ../..

# 3. CORE UTILITIES
pnpm --filter=@2dots1line/core-utils build
pnpm --filter=@2dots1line/ai-clients build

# 4. CONFIGURATION SERVICE (required by many others)
pnpm --filter=@2dots1line/config-service build

# 5. TOOL SYSTEM
pnpm --filter=@2dots1line/tool-registry build
pnpm --filter=@2dots1line/tools build

# 6. UI AND CANVAS (for frontend)
pnpm --filter=@2dots1line/canvas-core build
pnpm --filter=@2dots1line/orb-core build  
pnpm --filter=@2dots1line/shader-lib build
pnpm --filter=@2dots1line/ui-components build

# 7. SERVICES (depend on packages)
pnpm --filter=@2dots1line/user-service build
pnpm --filter=@2dots1line/dialogue-service build
pnpm --filter=@2dots1line/card-service build

# 8. WORKERS (depend on services and packages)
turbo run build --filter='workers/*'

# 9. APPLICATIONS (depend on everything)
pnpm --filter=@2dots1line/api-gateway build
pnpm --filter=@2dots1line/web-app build
pnpm --filter=@2dots1line/storybook build
```

**DEPENDENCY VERIFICATION:**
```bash
# Verify dependency chain intact
turbo run build --dry-run | grep -A 20 "Tasks to Run"
```

---

## 🧪 **VALIDATION PROTOCOLS**

### **INDIVIDUAL PACKAGE VALIDATION**
```bash
# Test each package individually
for pkg in packages/* services/*; do
  if [ -f "$pkg/tsconfig.json" ]; then
    echo "🔍 Type checking: $pkg"
    cd "$pkg" && npx tsc --noEmit --strict && cd ../.. || exit 1
  fi
done
```

### **INTEGRATION VALIDATION**  
```bash
# Test module boundaries work
cd services/dialogue-service && node -e "require('@2dots1line/database')"
cd services/user-service && node -e "require('@2dots1line/shared-types')"
cd packages/tools && node -e "require('@2dots1line/tool-registry')"
```

### **BUILD SYSTEM VALIDATION**
```bash
# Clean build all packages
pnpm clean && pnpm build

# Verify no build info conflicts
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json" | wc -l
# Should return 0
```

---

## 📊 **TROUBLESHOOTING GUIDE**

### **COMMON ERROR PATTERNS & SOLUTIONS**

| **Error Pattern** | **Root Cause** | **Solution** |
|-------------------|----------------|--------------|
| `Cannot find module '@2dots1line/package'` | Missing project reference | Add reference to tsconfig.json |
| `Project reference not found` | Wrong build order | Build dependencies first |
| `Module not found` runtime error | Module system mismatch | Check module/moduleResolution settings |
| Multiple `.tsbuildinfo` files | Missing explicit tsBuildInfoFile | Run `pnpm fix:typescript` |
| `Cannot resolve type definition` | Missing @types dependency | Add to package.json devDependencies |
| Build succeeds, import fails | Configuration inheritance conflict | Test runtime imports explicitly |
| `Object literal may only specify known properties` in Prisma | Prisma client out of sync with schema | Run `pnpm prisma generate` and clear node_modules/.prisma cache |
| `Private identifiers are only available when targeting ECMAScript 2015+` | Prisma client incompatible with TypeScript target | Ensure TypeScript target is ES2020+ and use project config |

### **EMERGENCY DIAGNOSTIC COMMANDS**

```bash
# Quick health check
npx tsc --noEmit --skipLibCheck  # Should show no errors

# Dependency chain verification
turbo run build --dry-run

# Module system audit
grep -r '"module"' packages/*/tsconfig*.json services/*/tsconfig*.json

# Build info conflict detection  
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json"

# Project reference verification
find . -name "tsconfig*.json" -not -path "./node_modules/*" -exec grep -H "references" {} \;

# Prisma client type synchronization check
cd packages/database && pnpm prisma generate && npx tsc --noEmit --project . --skipLibCheck
```

---

## 🚀 **MAINTENANCE PROTOCOLS**

### **ADDING NEW PACKAGES**
1. Create package with correct tsconfig template
2. Add explicit `tsBuildInfoFile` path
3. Add workspace dependencies to package.json
4. Add corresponding TypeScript references  
5. Update root solution file references
6. Test build order works

### **UPDATING DEPENDENCIES**
1. Update package.json workspace dependency
2. Update corresponding TypeScript reference
3. Verify build order still correct
4. Test individual and integration builds

### **CONFIGURATION CHANGES**
1. Document current working state
2. Make minimal changes
3. Test individual packages first
4. Test integration points
5. Verify runtime behavior

---

## 📚 **AUTHORITATIVE REFERENCES**

- **TypeScript Project References**: https://www.typescriptlang.org/docs/handbook/project-references.html
- **Monorepo Configuration**: https://turbo.build/repo/docs/handbook/workspaces
- **Module System Compatibility**: https://nodejs.org/api/esm.html

---

*This document represents the definitive TypeScript configuration standards for 2D1L. All conflicting guidance in other documents is superseded by this bible.* 