# TypeScript Monorepo Configuration Guide: Lessons from the Trenches

*A comprehensive guide to preventing and resolving TypeScript configuration chaos in large monorepos*

## Executive Summary

This guide documents hard-learned lessons from a major TypeScript configuration refactor that took a monorepo from **widespread build failures** to **18/23 packages building successfully**. The key insight: TypeScript configuration issues in monorepos are **systemic problems** that require **systematic solutions**, not isolated fixes.

## Core Problem: The Configuration Paradox

### The Root Issue
Modern monorepos have a fundamental tension between:
- **IDE Language Server**: Needs TypeScript configs for real-time type checking
- **Build System**: Needs separate configs for compilation artifacts
- **Project References**: Must maintain consistent dependency graphs

### What Goes Wrong
1. **Source Directory Pollution**: Compiled artifacts mixed with source code
2. **Broken Dependency Chains**: Incorrect relative paths in project references
3. **IDE vs Build Conflicts**: Different `noEmit` settings causing reference incompatibilities
4. **Cascading Failures**: One broken config breaks dependent packages

## The Five-Phase Solution Framework

### Phase 1: Establish the Standard Architecture

**Rule 1: Unified Configuration Strategy**
```json
// tsconfig.json (IDE + Structure)
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,           // Required for project references
    "rootDir": "./src",          // Keep source separate
    "outDir": "./dist"           // Keep artifacts separate
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/__tests__", "**/*.test.ts"]
}

// tsconfig.build.json (Build Only)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false             // Allow compilation
  },
  "references": [
    { "path": "../../packages/shared-types" },
    { "path": "../../packages/core-utils" }
  ]
}
```

**Rule 2: Never Use `noEmit: true` in Referenced Projects**
- TypeScript project references **cannot** depend on projects with `noEmit: true`
- This causes the cryptic error: "Referenced project may not disable emit"

### Phase 2: Systematic Path Validation

**Rule 3: Calculate Relative Paths Precisely**
```bash
# From workers/embedding-worker to packages/shared-types
# workers/embedding-worker -> . -> .. -> packages/shared-types
# Result: "../../packages/shared-types"

# From services/dialogue-service to services/config-service  
# services/dialogue-service -> . -> .. -> config-service
# Result: "../config-service"
```

**Rule 4: Validate All References**
```bash
# Test every reference path exists
find . -name "tsconfig.build.json" -exec grep -l "path.*packages" {} \; | \
xargs -I {} sh -c 'echo "Checking {}:" && grep -o "path.*" {}'
```

### Phase 3: Dependency Chain Integrity

**Rule 5: Respect Dependency Hierarchy**
```
packages/ (foundation layer)
  ↓
services/ (business logic layer)  
  ↓
workers/ (processing layer)
  ↓  
apps/ (presentation layer)
```

**Rule 6: Never Create Circular Dependencies**
- If Package A references Package B, Package B cannot reference Package A
- Use dependency injection or event systems to break cycles

### Phase 4: Build-First Validation

**Rule 7: Test Changes Incrementally**
```bash
# Test single package
cd packages/shared-types && pnpm build

# Test dependency chain
pnpm build 2>&1 | grep "successful"

# Full validation
pnpm build --force
```

**Rule 8: Read Build Output Carefully**
- `cache hit` = No changes, using cached build
- `cache miss` = Rebuilding due to changes
- Count successful vs total packages for progress tracking

### Phase 5: Generated Code Management

**Rule 9: Handle Generated Files Properly**
```json
// For packages with generated code (e.g., shader-lib)
{
  "scripts": {
    "clean": "rimraf dist src/generated",
    "generate": "node ./scripts/generate-shaders.js", 
    "build": "pnpm generate && tsc -p tsconfig.build.json"
  }
}
```

**Rule 10: Exclude Generated Directories**
```json
{
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/generated"]
}
```

## Debugging Methodology

### 1. Error Classification
```bash
# TypeScript Configuration Errors
TS6053: File 'path/to/tsconfig.json' not found
→ Fix relative paths in references

# Project Reference Errors  
TS6306: Referenced project may not disable emit
→ Remove noEmit: true from referenced project

# Missing Dependencies
TS2307: Cannot find module 'package-name'
→ Add missing dependency to package.json

# Type Errors
TS2322: Type 'X' is not assignable to type 'Y'  
→ Fix actual type mismatches
```

### 2. Systematic Diagnosis
```bash
# 1. Check basic structure
find . -name "tsconfig*.json" | head -10

# 2. Find broken references
grep -r "path.*\.\./\.\./\.\./\.\./\.\." */tsconfig.build.json

# 3. Test individual packages
cd packages/problem-package && pnpm build

# 4. Check dependency exports
cat packages/database/src/index.ts | grep "export"
```

### 3. Fix Verification
```bash
# Before fix
pnpm build 2>&1 | grep "Tasks.*successful"
# Tasks: 5 successful, 23 total

# After fix  
pnpm build 2>&1 | grep "Tasks.*successful"
# Tasks: 18 successful, 23 total
```

## Common Anti-Patterns to Avoid

### ❌ The Global Fix Approach
```bash
# DON'T: Try to fix everything at once
find . -name "tsconfig*.json" -exec sed -i 's/old/new/g' {} \;
```

### ❌ The Copy-Paste Configuration
```bash
# DON'T: Copy configs without understanding paths
cp packages/working/tsconfig.build.json packages/broken/
```

### ❌ The "It Works On My Machine" Fix
```bash
# DON'T: Only test in IDE, ignore build system
code . # Opens in IDE, types look good
# But: pnpm build fails
```

### ❌ The Dependency Bypass
```json
// DON'T: Skip type checking to "fix" errors
{
  "compilerOptions": {
    "skipLibCheck": true,
    "noImplicitAny": false
  }
}
```

## Best Practices for New Modules

### 1. Module Creation Checklist
```bash
# ✅ Create directory structure
mkdir -p packages/new-module/src

# ✅ Copy template configs  
cp packages/shared-types/tsconfig.json packages/new-module/
cp packages/shared-types/tsconfig.build.json packages/new-module/

# ✅ Update package.json
cat > packages/new-module/package.json << EOF
{
  "name": "@2dots1line/new-module",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "rimraf dist"
  }
}
EOF

# ✅ Add to workspace
echo '"packages/new-module"' >> pnpm-workspace.yaml

# ✅ Test immediately
cd packages/new-module && pnpm build
```

### 2. Reference Addition Protocol
```bash
# ✅ Calculate correct path
echo "From $(pwd) to target: ../../packages/shared-types"

# ✅ Add reference
jq '.references += [{"path": "../../packages/shared-types"}]' \
   tsconfig.build.json > tmp && mv tmp tsconfig.build.json

# ✅ Test reference
pnpm build
```

## Emergency Recovery Procedures

### When Everything Breaks
```bash
# 1. Save current state
git stash

# 2. Find last working commit
git log --oneline | grep -E "(build|config)" | head -5

# 3. Reset to working state
git checkout <working-commit> -- "*/tsconfig*.json"

# 4. Test recovery
pnpm build

# 5. Reapply changes incrementally
git stash pop
# Fix one package at a time
```

### When Build Performance Degrades
```bash
# Clear all caches
rm -rf .turbo/cache
rm -rf node_modules/.cache
rm -rf */dist

# Reinstall dependencies
pnpm install --frozen-lockfile

# Rebuild from scratch
pnpm build --force
```

## Key Insights from the Trenches

### 1. **Configuration is Code**
TypeScript configurations are executable code that affects the entire dependency graph. Treat them with the same rigor as application code.

### 2. **Dependencies Are Contracts**  
Project references create compile-time contracts. Breaking a reference breaks all dependents.

### 3. **IDE ≠ Build System**
Just because the IDE shows green doesn't mean the build will work. Always test both.

### 4. **Incremental Validation Saves Time**
Fix one package, test, fix next. Don't batch fixes and debug multiple issues simultaneously.

### 5. **Generated Code Needs Special Handling**
Files created by build scripts need explicit management in TypeScript configurations.

### 6. **Relative Paths Are Fragile**
Monorepo restructuring breaks relative paths. Consider tooling to validate and update them automatically.

## Success Metrics

### Build Health Indicators
```bash
# Good health: >90% packages building
pnpm build 2>&1 | awk '/Tasks:.*successful/ {print ($2/$4)*100"% success rate"}'

# Configuration consistency
find . -name "tsconfig.build.json" | xargs grep -l "noEmit.*false" | wc -l

# Reference validity  
find . -name "tsconfig.build.json" -exec sh -c 'echo "{}:"; grep -o "path.*" {} | while read path; do dir=$(dirname {}); target=$(echo $path | cut -d'"' -f2); [ -f "$dir/$target/tsconfig.json" ] || echo "BROKEN: $target"; done' \;
```

### Quality Gates
1. **Zero TypeScript Errors**: No TS2xxx errors in build output
2. **Clean References**: All `path` entries point to valid locations  
3. **Consistent Structure**: All packages follow the same config pattern
4. **Fast Builds**: Cache hit rate >70% for incremental builds

## Conclusion

TypeScript configuration in monorepos is a **systems problem** requiring **systematic solutions**. The key to success is:

1. **Standardize early** and maintain consistency
2. **Validate incrementally** rather than fixing in bulk  
3. **Test both IDE and build** scenarios
4. **Treat configuration as critical infrastructure**

Following this guide should prevent the weeks of debugging that inspired it. Remember: in monorepos, configuration consistency is not optional—it's survival.

---

*"The best time to fix TypeScript configuration was before the first package. The second best time is now."*
