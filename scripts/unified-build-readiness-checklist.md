# 2D1L UNIFIED BUILD READINESS CHECKLIST
**CRITICAL**: Complete systematic audit combining reactive fixes + proactive categorical risk discovery

---

## 🎯 **HOW TO USE THIS DOCUMENT (FOR FUTURE AGENTS)**

### **📋 CHECKLIST USAGE PROTOCOL**

#### **🚨 MANDATORY: BEFORE ANY CODE CHANGES**
- [ ] **Read this entire document** - Understand all categorical risks
- [ ] **Run Phase I-III baseline audits** - Establish current state
- [ ] **Document current working state** - Note what's currently building successfully
- [ ] **Identify change scope** - What packages/dependencies will be affected by your changes

#### **⚡ AFTER EVERY SIGNIFICANT CHANGE (INCREMENTAL VALIDATION)**
- [ ] **STOP and verify the change worked** before proceeding to next change
- [ ] **Run affected package builds immediately** - Don't accumulate changes
- [ ] **Verify installation integrity** if you changed any package.json files
- [ ] **Update this checklist** if you discover new failure modes

#### **🔄 VERSION CHANGES / DEPENDENCY UPDATES (HIGH RISK)**
- [ ] **MANDATORY: Run complete Post-Version-Change Recovery Protocol** (see below)
- [ ] **NEVER change multiple versions simultaneously** - Change one dependency type at a time
- [ ] **Test each version change individually** before proceeding to next
- [ ] **Document version compatibility matrix** - What works together

#### **🏗️ STRUCTURAL CHANGES (MONOREPO ARCHITECTURE)**
- [ ] **Run complete Phase I-IX audit** before and after changes
- [ ] **Test build order dependencies** - Changes may affect build sequence
- [ ] **Verify project references** - Structural changes break TypeScript references
- [ ] **Update dependency documentation** - Keep architecture diagrams current

#### **🚀 DEPLOYMENT READINESS**
- [ ] **Complete Phase I-IX checklist** - All sections must pass
- [ ] **Run comprehensive build test** - `turbo run build` must succeed
- [ ] **Generate deployment artifacts** - Verify all packages build for production
- [ ] **Test in clean environment** - Simulate fresh clone scenario

---

## 🛡️ **CATEGORICAL FAILURE PREVENTION (REFLECTION-BASED)**
**Lessons from recent build failures - prevent these failure modes**

### **🔍 POST-CHANGE VERIFICATION GATES (MANDATORY)**
- [ ] **BINARY EXISTENCE VERIFICATION** - After version changes, verify expected binaries exist:
  ```bash
  # Example: After TypeScript version change
  ls packages/[package]/node_modules/typescript/bin/tsc || echo "❌ TypeScript binary missing"
  
  # Test all critical binaries after changes
  npx tsc --version && echo "✅ TypeScript available" || echo "❌ TypeScript broken"
  ```

- [ ] **INSTALLATION INTEGRITY CHECKS** - After package.json changes:
  ```bash
  # Verify installations actually work, don't just check lockfiles
  pnpm --filter=@2dots1line/[changed-package] install
  # Then verify the package can find its dependencies
  ```

- [ ] **DEPENDENCY READINESS VERIFICATION** - Before building package X, verify all dependencies built:
  ```bash
  # Example: Before building tools, verify its dependencies exist
  ls packages/shared-types/dist/ && echo "✅ shared-types ready" || echo "❌ Need to build shared-types first"
  ls packages/database/dist/ && echo "✅ database ready" || echo "❌ Need to build database first"
  ```

- [ ] **🚨 BACKUP FILE CONTAMINATION CHECK** - After any editing operations:
  ```bash
  # Check for .bak files created during editing
  find . -name "*.bak" -not -path "./node_modules/*" | wc -l
  # Should return 0 - if not, investigate what created them and clean up:
  find . -name "*.bak" -not -path "./node_modules/*" -delete
  ```

- [ ] **🔍 LEGACY REFERENCE DETECTION** - After any structural changes:
  ```bash
  # Check for references to non-existent packages in tsconfig files
  npx tsc --noEmit --skipLibCheck 2>&1 | grep "File.*not found"
  # Common legacy references: cognitive-hub, utils (should be core-utils)
  ```

- [ ] **📦 ROOT TYPESCRIPT INSTALLATION VERIFICATION** - Critical for consistent linting:
  ```bash
  # Verify TypeScript is installed at root (required for npx tsc)
  npx tsc --version || echo "❌ Root TypeScript missing - run pnpm install"
  ls node_modules/typescript/ || echo "❌ TypeScript module missing"
  ```

### **🔄 INTERMITTENT ERROR PATTERN DETECTION (CRITICAL INSIGHT)**
- [ ] **TIMING-DEPENDENT ERROR IDENTIFICATION**:
  ```bash
  # Run linting multiple times to catch intermittent issues
  npx tsc --noEmit --skipLibCheck  # Run 1
  sleep 2
  npx tsc --noEmit --skipLibCheck  # Run 2 - should give same results
  ```
- [ ] **BUILD CACHE DEPENDENCY DETECTION**:
  ```bash
  # Test if errors depend on build state
  rm -rf packages/*/dist/ services/*/dist/ workers/*/dist/
  npx tsc --noEmit --skipLibCheck  # Should show all errors consistently
  ```
- [ ] **PROJECT REFERENCE RESOLUTION TIMING**:
  ```bash
  # Verify project references resolve consistently
  turbo run build --dry-run  # Should show same dependency graph each time
  ```

### **🎯 LEGACY REFERENCE AUDIT PROTOCOL (DEFINITIVE)**
- [ ] **TSCONFIG LEGACY REFERENCE SCAN**:
  ```bash
  # Find all project references in tsconfig files
  find . -name "tsconfig*.json" -not -path "./node_modules/*" -exec grep -H "path.*\.\." {} \;
  # Verify each referenced path actually exists
  ```
- [ ] **PACKAGE DEPENDENCY ALIGNMENT CHECK**:
  ```bash
  # For each package, verify tsconfig references match package.json dependencies
  for pkg in packages/* services/* workers/*; do
    if [ -f "$pkg/package.json" ] && [ -f "$pkg/tsconfig.json" ]; then
      echo "=== Checking $pkg ==="
      echo "Dependencies:" && grep '"@2dots1line/' "$pkg/package.json" || echo "None"
      echo "TS References:" && grep '"path"' "$pkg/tsconfig.json" || echo "None"
    fi
  done
  ```

### **⚠️ ROOT DEPENDENCY STABILITY ENFORCEMENT**
- [ ] **ROOT PACKAGE.JSON VERIFICATION** - After version standardization:
  ```bash
  # Verify root dependencies are installed and working
  ls node_modules/typescript/ && npx tsc --version || echo "❌ Root TypeScript broken"
  ls node_modules/turbo/ && npx turbo --version || echo "❌ Root Turbo broken"
  ls node_modules/eslint/ && npx eslint --version || echo "❌ Root ESLint broken"
  ```
- [ ] **ROOT INSTALLATION RECOVERY** - If root dependencies are broken:
  ```bash
  # Always reinstall root after bulk version changes
  pnpm install  # This fixes most root dependency issues
  ```

### **🎯 BUILD ORDER ENFORCEMENT (SYSTEMATIC)**
- [ ] **DEPENDENCY CHAIN VALIDATION** - Never build out of order:
  ```bash
  # MANDATORY BUILD ORDER (learned from failures):
  # 1. Foundation packages (no dependencies)
  pnpm --filter=@2dots1line/shared-types build
  
  # 2. Database layer (requires Prisma generation)
  cd packages/database && pnpm db:generate && pnpm build && cd ../..
  
  # 3. Core services
  pnpm --filter=@2dots1line/config-service build
  pnpm --filter=@2dots1line/core-utils build
  
  # 4. Higher-level packages
  pnpm --filter=@2dots1line/tool-registry build
  pnpm --filter=@2dots1line/tools build
  ```

- [ ] **PRE-BUILD DEPENDENCY AUDIT** - Before building any package:
  ```bash
  # Check that all workspace dependencies are built
  grep '"@2dots1line/' packages/[target]/package.json | while read dep; do
    # Extract package name and verify its dist/ exists
    echo "Checking dependency: $dep"
  done
  ```

### **⚙️ VERSION CHANGE FAILURE PREVENTION (CRITICAL)**
- [ ] **INCREMENTAL VERSION TESTING** - Never change multiple versions at once:
  ```bash
  # ❌ NEVER DO: Bulk version changes
  # find . -name "package.json" -exec sed -i 's/typescript.*/typescript: "^5.8.3"/' {} \;
  
  # ✅ CORRECT: Change one package type at a time, test each
  # 1. Change TypeScript version in 3 packages
  # 2. Test those 3 packages build
  # 3. Continue to next batch
  ```

- [ ] **POST-VERSION-CHANGE MANDATORY CHECKS**:
  ```bash
  # After ANY version changes, ALWAYS run:
  echo "1. Verify installations work:"
  pnpm --filter=[changed-packages] install
  
  echo "2. Verify binaries exist:"
  npx tsc --version  # For TypeScript changes
  npx eslint --version  # For ESLint changes
  
  echo "3. Test individual package builds:"
  pnpm --filter=[changed-packages] build
  ```

### **🚫 COMMAND COMPLEXITY PREVENTION (VISIBILITY)**
- [ ] **SIMPLE COMMAND PROTOCOL** - Avoid complex echo chains that reduce visibility:
  ```bash
  # ❌ AVOID: Complex chained commands that can hang
  # echo "step 1" && echo "step 2" && pnpm command && echo "step 3"
  
  # ✅ USE: Simple, individual commands for better debugging
  echo "Starting build..."
  pnpm --filter=package build
  echo "Build completed"
  ```

- [ ] **PROGRESS VISIBILITY REQUIREMENTS**:
  - Use individual commands for each major step
  - Always show package names and expected outcomes
  - Provide clear success/failure indicators
  - Avoid background processes that hide output

---

## 📚 **DEFINITIVE TYPESCRIPT CONFIGURATION RULES** 
**Source: Official TypeScript Docs + moonrepo + Nx authoritative guides**

### **🔥 MANDATORY PROJECT REFERENCE SETTINGS (NEVER OPTIONAL)**
- [ ] `"composite": true` - **REQUIRED** for project references to work
- [ ] `"declaration": true` - **REQUIRED** for .d.ts generation across projects  
- [ ] `"declarationMap": true` - **REQUIRED** for editor "Go to Definition"
- [ ] `"incremental": true` - **REQUIRED** for build performance/caching
- [ ] `"noEmitOnError": true` - **REQUIRED** prevents invalid declarations
- [ ] `"skipLibCheck": true` - **REQUIRED** for performance

### **🎯 PACKAGE-TYPE SPECIFIC SETTINGS (DEFINITIVE)**
- [ ] **PACKAGES** (libraries): `"emitDeclarationOnly": true` (emit .d.ts, not .js)
- [ ] **APPLICATIONS** (apps): `"noEmit": true` (no emissions, others shouldn't import)
- [ ] **BUILD CONFIGS** (tsconfig.build.json): Normal compilation settings

### **📁 CONFIGURATION FILE ARCHITECTURE (OFFICIAL PATTERN)**
- [ ] **Root tsconfig.json**: ONLY `references[]` + `files: []` (solution file)
- [ ] **Root tsconfig.options.json**: Shared compiler options (inherited by all)
- [ ] **Package tsconfig.json**: `extends` options + package-specific `references[]`
- [ ] **Package tsconfig.build.json**: OPTIONAL for npm publishing

### **🚨 CONFIGURATION ANTI-PATTERNS (NEVER DO)**
- [ ] ❌ **NEVER** put `include` in root when using project references
- [ ] ❌ **NEVER** mix source compilation with reference configuration  
- [ ] ❌ **NEVER** add unnecessary compiler options to packages
- [ ] ❌ **NEVER** forget `outDir` in packages that emit declarations
- [ ] ❌ **NEVER** use `rootDir` violations (imports outside project boundary)

### **🔬 TYPE DEFINITION COMPLETENESS (CRITICAL LESSON LEARNED)**
- [ ] **MANDATORY @types/* DEPENDENCIES**: Every package MUST have complete type definitions
  ```bash
  # Check for missing type definitions
  find packages/ services/ -name "package.json" -exec grep -H '"@types/' {} \;
  ```
- [ ] **VERIFY TYPE AVAILABILITY**: Run `npx tsc --noEmit` in each package individually
- [ ] **COMMON MISSING TYPES**: `@types/node`, `@types/jest`, package-specific types

---

## 🎯 **AUDIT PROTOCOL**
- [ ] **PAUSE at ANY unexpected finding for full reassessment**
- [ ] **NO reactive fixes** - identify patterns and fix systematically  
- [ ] **Document ALL findings** before implementing solutions
- [ ] **Extrapolate from errors** to find similar issues proactively
- [ ] **CATEGORICAL RISK DISCOVERY** - find issues builds never reveal

---

## 📊 **PHASE I: ENVIRONMENT & TOOLING VERIFICATION**

### **1.1 System Environment**
- [ ] `echo $PATH` - PATH contains standard directories
- [ ] `which node && node --version` - Node.js accessible and correct version
- [ ] `which npm && npm --version` - npm accessible  
- [ ] `which pnpm && pnpm --version` - pnpm accessible and matches engines
- [ ] `which turbo` - turbo accessible

### **1.2 Version Consistency Analysis**
- [ ] **CRITICAL**: Local vs Global turbo version compatibility
  - [ ] Local: `npx turbo --version` or check installation
  - [ ] Global: `turbo --version`
  - [ ] Package.json devDependencies turbo version
- [ ] **CRITICAL**: turbo.json format matches version (pipeline vs tasks)

### **🔥 1.3 VERSION INCOMPATIBILITY CHAOS AUDIT**
- [ ] **TYPESCRIPT VERSION CONSISTENCY**:
  ```bash
  echo "🚨 TypeScript Version Spread Analysis:"
  find . -name "package.json" -exec grep '"typescript"' {} \; 2>/dev/null | sort | uniq -c
  ```
- [ ] **NODE VERSION CONSISTENCY**: All packages use same engines requirement
- [ ] **REACT VERSION CONSISTENCY**: Check UI packages for version mismatches
- [ ] **PEER DEPENDENCY VERSION CONFLICTS**: Beyond Storybook warnings

---

## 🔧 **PHASE II: TURBO & BUILD SYSTEM AUDIT**

### **2.1 Turbo Installation & Configuration**
- [ ] Local turbo properly installed: `ls node_modules/.bin/turbo`
- [ ] turbo.json syntax valid: `cat turbo.json | jq .`
- [ ] All task names match package.json scripts across workspace
- [ ] Task dependencies correctly specified (no circular dependencies)
- [ ] Output directories match actual build outputs

### **2.2 Build Script Consistency**
- [ ] All packages have consistent build scripts
- [ ] Build scripts don't conflict with each other
- [ ] No missing build scripts for packages that need them

---

## 📦 **PHASE III: WORKSPACE & DEPENDENCY AUDIT**

### **3.1 Workspace Structure Verification**
- [ ] pnpm-workspace.yaml patterns match actual directories
- [ ] **VERIFY**: `config/*` NOT included as buildable package
- [ ] All package.json files valid JSON

### **3.2 Dependency Resolution Analysis**  
- [ ] All `workspace:^` dependencies point to existing packages
- [ ] No circular dependencies: `pnpm list --depth=999 2>&1 | grep -i circular`
- [ ] **PEER DEPENDENCY AUDIT**: `pnpm install 2>&1 | grep -A 20 "peer dependencies"`
- [ ] **INTENTIONAL REMOVALS**: Verify removed deps (jsonwebtoken, etc.) stay removed

### **🔥 3.3 MONOREPO ARCHITECTURE VIOLATIONS**
- [ ] **DEPENDENCY DIRECTION VIOLATIONS**:
  ```bash
  # Apps should not be imported by packages
  grep -r "from.*apps/" packages/ 2>/dev/null || echo "✅ No reverse dependencies"
  ```
- [ ] **CIRCULAR WORKSPACE DEPENDENCIES**: No package depends on itself transitively
- [ ] **MISSING DEPENDENCY DECLARATIONS**: Used packages declared in package.json
- [ ] **WORKSPACE REFERENCE CONSISTENCY**: All workspace:^ references valid

---

## 🔨 **PHASE IV: TYPESCRIPT CONFIGURATION AUDIT**

### **4.1 Root Configuration (DEFINITIVE RULES)**
- [ ] **Root tsconfig.json STRUCTURE**:
  ```json
  {
    "extends": "./tsconfig.options.json",
    "files": [],
    "references": [
      { "path": "packages/shared-types" },
      { "path": "packages/database" }
      // ... ALL packages, services, workers, apps
    ]
  }
  ```
- [ ] **Root tsconfig.options.json MANDATORY OPTIONS**:
  ```json
  {
    "compilerOptions": {
      "composite": true,
      "declaration": true,
      "declarationMap": true,
      "incremental": true,
      "noEmitOnError": true,
      "skipLibCheck": true,
      "strict": true,
      "target": "ES2020",
      "module": "ESNext",
      "moduleResolution": "bundler"
    }
  }
  ```

### **4.2 Package TypeScript Configurations (AUTHORITATIVE)**
- [ ] **PACKAGE TSCONFIG TEMPLATE (Libraries)**:
  ```json
  {
    "extends": "../../tsconfig.options.json",
    "compilerOptions": {
      "emitDeclarationOnly": true,
      "outDir": "./lib"
    },
    "include": ["src/**/*"],
    "references": [
      { "path": "../dependency-package" }
    ]
  }
  ```
- [ ] **APPLICATION TSCONFIG TEMPLATE (Apps)**:
  ```json
  {
    "extends": "../../tsconfig.options.json", 
    "compilerOptions": {
      "noEmit": true
    },
    "include": ["src/**/*"],
    "references": [
      { "path": "../../packages/shared-types" }
    ]
  }
  ```

### **4.3 Project References Systematic Verification (DEFINITIVE)**
- [ ] **DEPENDENCY-TO-REFERENCE MAPPING MUST BE EXACT**:
  ```bash
  # Every workspace dependency MUST have corresponding reference
  for pkg in packages/* services/* workers/* apps/*; do
    if [ -f "$pkg/package.json" ]; then
      echo "=== Checking $pkg ==="
      echo "Workspace deps:" && grep '"@2dots1line/' "$pkg/package.json" || echo "None"
      echo "TS references:" && grep -A 10 '"references"' "$pkg/tsconfig.json" || echo "None"
    fi
  done
  ```
- [ ] **BUILD ORDER VERIFICATION**: References must respect dependency chain
- [ ] **NO CIRCULAR REFERENCES**: Project references cannot form cycles

---

## 🗃️ **PHASE V: DATABASE & GENERATED FILES AUDIT**

### **5.1 Prisma Critical Pre-Build Requirements (MANDATORY - LESSON LEARNED)**
- [ ] **🚨 ABSOLUTE PREREQUISITE - PRISMA CLIENT GENERATION**:
  ```bash
  echo "🔥 CRITICAL: Generating Prisma client BEFORE any build attempts"
  pnpm --filter=@2dots1line/database db:generate
  ```
- [ ] **VERIFICATION**: Check client generation success: `ls -la node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/`
- [ ] **VERSION CONSISTENCY**: Ensure @prisma/client and prisma versions match exactly
- [ ] **🚨 AUTOMATED SOLUTION NEEDED**: Create pre-build script that always generates Prisma client

### **5.2 Systematic Prisma Client Management (DEFINITIVE APPROACH)**
- [ ] **ROOT-LEVEL AUTOMATION**: Add to root package.json scripts:
  ```json
  {
    "scripts": {
      "prebuild": "pnpm --filter=@2dots1line/database db:generate",
      "build": "turbo run build",
      "clean:prisma": "pnpm --filter=@2dots1line/database clean && pnpm --filter=@2dots1line/database db:generate"
    }
  }
  ```
- [ ] **CI/CD INTEGRATION**: Ensure Prisma generation runs before any build in CI
- [ ] **DEVELOPER ONBOARDING**: Document that `pnpm prebuild` MUST be run before any builds

### **5.3 Generated Files Deep Audit (ENHANCED)**
- [ ] **ALL GENERATED .js FILES HAVE .d.ts DECLARATIONS**:
  ```bash
  find . -name "*.glsl.js" | while read jsfile; do
    dtsfile="${jsfile%.js}.d.ts"
    [ -f "$dtsfile" ] && echo "✅ $jsfile" || echo "❌ MISSING: $dtsfile"
  done
  ```
- [ ] **PRISMA CLIENT ACCESSIBILITY**: Verify `@prisma/client` imports work across packages
- [ ] **Shader-lib generation script works**
- [ ] **All build-time generation scripts executable**

---

## 🧹 **PHASE VI: BUILD ARTIFACT CONTAMINATION CLEANUP**

### **6.1 Comprehensive Contamination Detection & Removal**
- [ ] **EXHAUSTIVE CONTAMINATION SCAN**:
  ```bash
  find . -name "*.tsbuildinfo" | wc -l && echo "tsbuildinfo files"
  find . -name "dist" -type d | wc -l && echo "dist directories"  
  find . -name ".next" -type d | wc -l && echo ".next directories"
  find . -name ".turbo" -type d | wc -l && echo ".turbo cache directories"
  ```
- [ ] **CONTAMINATION REMOVAL**: Run cleanup script and verify zero artifacts

---

## 🔥 **PHASE VII: PROACTIVE CATEGORICAL RISK DISCOVERY**

### **7.1 RUNTIME ENVIRONMENT DEPENDENCIES**
- [ ] **UNDOCUMENTED ENVIRONMENT VARIABLES**:
  ```bash
  grep -r "process\.env\." --include="*.ts" . | grep -v "NODE_ENV" | \
  grep -v "/node_modules/" | cut -d: -f2 | grep -o "process\.env\.[A-Z_]*" | sort | uniq
  ```
- [ ] **MISSING .env.example**: Check if file exists and documents all env vars
- [ ] **HARDCODED ENVIRONMENT VALUES**: No localhost/production URLs in code

### **7.2 SECURITY & HARDCODED VALUES**
- [ ] **HARDCODED SECRETS SCAN**:
  ```bash
  grep -r "password.*=" --include="*.ts" . 2>/dev/null | grep -v node_modules || echo "None"
  grep -r "key.*=" --include="*.ts" . 2>/dev/null | grep -v node_modules | head -3 || echo "None"
  ```
- [ ] **API ENDPOINT HARDCODING**: No hardcoded URLs in source code
- [ ] **CREDENTIAL EXPOSURE**: No API keys, passwords, tokens in git

### **7.3 IMPORT/EXPORT ARCHITECTURE RISKS**
- [ ] **MISSING EXPORT TARGETS** (efficient check):
  ```bash
  find packages/tools -name "*.ts" -exec grep -l "from '\./internal'" {} \; | head -3 | \
  while read file; do echo "Checking: $file"; grep "from '\./internal'" "$file" | head -2; done
  ```
- [ ] **BARREL FILE COMPLETENESS**: All packages export what they should
- [ ] **CROSS-PACKAGE IMPORT VALIDATION**: @2dots1line imports resolve correctly

### **7.4 BUILD OUTPUT CONSISTENCY**
- [ ] **PACKAGE ENTRY POINTS CONSISTENCY**:
  ```bash
  find packages/ -name "package.json" | while read pkg; do
    echo "=== $pkg ===" && grep -E '"(main|types|exports)"' "$pkg" 2>/dev/null || echo "No entry points"
  done
  ```
- [ ] **BUILD SCRIPT CONSISTENCY**: Compatible build commands across packages
- [ ] **TYPE DECLARATION COMPLETENESS**: All packages generate .d.ts files

---

## 🚀 **PHASE VIII: MANDATORY PRE-BUILD EXECUTION SEQUENCE (UPDATED)**

### **8.1 Required Pre-Build Steps (IN ORDER - DEFINITIVE)**
- [ ] **STEP 1**: Clean all artifacts via cleanup script
- [ ] **STEP 2**: Fresh `pnpm install` 
- [ ] **STEP 3**: **🚨 MANDATORY PRISMA GENERATION** (NEVER SKIP):
  ```bash
  pnpm --filter=@2dots1line/database db:generate
  # VERIFY: Check that Prisma client was generated successfully
  ```
- [ ] **STEP 4**: **TYPE DEFINITION VERIFICATION**:
  ```bash
  # Test each package individually for type completeness
  for pkg in packages/* services/*; do
    if [ -f "$pkg/tsconfig.json" ]; then
      echo "Testing: $pkg"
      cd "$pkg" && npx tsc --noEmit && cd ../..
    fi
  done
  ```
- [ ] **STEP 5**: Fix missing project references systematically (if any)
- [ ] **STEP 6**: Test individual package compilation

### **8.2 Automated Pre-Build Protocol (RECOMMENDED IMPLEMENTATION)**
- [ ] **ROOT SCRIPT AUTOMATION**: 
  ```bash
  # Add to root package.json
  "prebuild": "pnpm run clean:all && pnpm install && pnpm run db:generate && pnpm run verify:types"
  ```
- [ ] **DATABASE SCRIPT**: `"db:generate": "pnpm --filter=@2dots1line/database db:generate"`
- [ ] **TYPE VERIFICATION**: `"verify:types": "pnpm --filter='packages/*' --filter='services/*' exec npx tsc --noEmit"`

---

## 🔥 **PHASE IX: INCREMENTAL BUILD TESTING (CRITICAL DISCOVERY + TYPE SAFETY)**

### **9.1 Systematic Build Chain Validation (ENHANCED)**
- [ ] **FOUNDATION PACKAGES FIRST** (MANDATORY ORDER):
  ```bash
  # Test dependency-free packages first
  pnpm --filter=@2dots1line/shared-types build
  pnpm --filter=@2dots1line/database build  # AFTER Prisma generation
  ```
- [ ] **INTERMEDIATE PACKAGES** (SECOND TIER):
  ```bash
  pnpm --filter=@2dots1line/tool-registry build
  pnpm --filter=@2dots1line/tools build
  pnpm --filter=@2dots1line/config-service build
  ```
- [ ] **TYPE SAFETY VERIFICATION** (NEW REQUIREMENT):
  ```bash
  # Verify NO type errors in each package
  for pkg in packages/* services/*; do
    if [ -f "$pkg/tsconfig.json" ]; then
      echo "🔍 Type checking: $pkg"
      cd "$pkg" && npx tsc --noEmit --strict && cd ../.. || exit 1
    fi
  done
  ```

### **9.2 Build Error Pattern Analysis (ENHANCED)**
- [ ] **TypeScript "rootDir" violations** → Usually indicate circular dependencies
- [ ] **"Cannot find module" for workspace packages** → Missing build order or project references
- [ ] **"Cannot find type definition"** → Missing @types/* dependencies or Prisma generation
- [ ] **Type definition errors after tsconfig changes** → Overly aggressive configuration changes

### **🚨 CRITICAL LESSONS LEARNED (MUST NEVER FORGET)**
- [ ] **PRISMA CLIENT GENERATION IS NON-OPTIONAL** - Always required before any builds
- [ ] **TYPE DEFINITION COMPLETENESS** - Build success ≠ TypeScript compliance
- [ ] **VERIFICATION PROTOCOLS** - Test each package individually for complete validation
- [ ] **AUTOMATION IS ESSENTIAL** - Manual steps lead to surprises and failures
- [ ] **⚠️ VERSION CHANGES BREAK INSTALLATIONS** - After version standardization, packages MUST be reinstalled
- [ ] **🔧 DEPENDENCY CHAIN SEQUENCE MATTERS** - Build dependencies in correct order (shared-types → database → config-service → tools)
- [ ] **📍 LOCAL PRISMA GENERATION WORKS BETTER** - Use `cd packages/database && pnpm db:generate` instead of `pnpm --filter`
- [ ] **🚫 AVOID COMPLEX ECHO COMMANDS** - Use simple, direct commands for better visibility and debugging

### **🔄 POST-VERSION-CHANGE RECOVERY PROTOCOL (DEFINITIVE)**
- [ ] **STEP 1**: Reinstall dependencies for affected packages:
  ```bash
  pnpm --filter=@2dots1line/tool-registry install
  pnpm --filter=@2dots1line/tools install
  # Continue for other packages as needed
  ```
- [ ] **STEP 2**: Generate Prisma client using local approach:
  ```bash
  cd packages/database && pnpm db:generate
  ```
- [ ] **STEP 3**: Build in dependency order:
  ```bash
  # Foundation packages first
  pnpm --filter=@2dots1line/shared-types build
  pnpm --filter=@2dots1line/database build
  pnpm --filter=@2dots1line/config-service build
  pnpm --filter=@2dots1line/tools build
  ```
- [ ] **STEP 4**: Verify no regressions with individual package testing

---

## 🎯 **SUCCESS CRITERIA (UPDATED)**
✅ **Zero build failures due to preventable issues**  
✅ **Zero TypeScript compilation errors (not just build success)**  
✅ **Zero runtime failures due to missing environment variables**  
✅ **Zero security vulnerabilities from hardcoded values**  
✅ **All generated files have proper TypeScript support**  
✅ **All project references complete and correct**  
✅ **All version incompatibilities resolved**  
✅ **All architectural violations identified and addressed**
✅ **Prisma client automatically generated and accessible**
✅ **Complete type definition coverage verified** 