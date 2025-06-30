# 2D1L PRE-BUILD SUCCESS CHECKLIST
**CRITICAL**: Complete ALL checks before ANY build attempts. NO EXCEPTIONS.

## 🎯 **SYSTEMATIC AUDIT PROTOCOL**
- [ ] **PAUSE at ANY unexpected finding for full reassessment**
- [ ] **NO reactive fixes** - identify patterns and fix systematically  
- [ ] **Document ALL findings** before implementing ANY solution
- [ ] **Extrapolate from errors** to find similar issues proactively

---

## 📊 **1. ENVIRONMENT & TOOLING VERIFICATION**

### **1.1 System Environment**
- [ ] `echo $PATH` - PATH contains standard directories (/usr/bin, /usr/local/bin, etc.)
- [ ] `which node` - Node.js accessible
- [ ] `which npm` - npm accessible  
- [ ] `which pnpm` - pnpm accessible
- [ ] `which turbo` - turbo accessible

### **1.2 Version Consistency Analysis**
- [ ] `node --version` - Check Node.js version matches package.json engines
- [ ] `pnpm --version` - Check pnpm version matches package.json engines
- [ ] `turbo --version` - Check global turbo version
- [ ] `npx turbo --version` - Check local turbo version
- [ ] **CRITICAL**: Global and local turbo versions MUST be compatible
- [ ] **CRITICAL**: turbo.json format MUST match turbo version (pipeline vs tasks)

### **1.3 Package Manager State**
- [ ] `pnpm-lock.yaml` exists and is not corrupted
- [ ] No competing package managers (no package-lock.json, yarn.lock)
- [ ] All node_modules directories are clean (delete if corrupted)

---

## 🔧 **2. TURBO CONFIGURATION AUDIT**

### **2.1 Turbo Version Compatibility**
- [ ] Local turbo version in package.json devDependencies
- [ ] Global turbo version via `turbo --version`
- [ ] Turbo.json schema matches turbo version:
  - [ ] v1.x uses `"pipeline": { ... }`
  - [ ] v2.x uses `"tasks": { ... }`
- [ ] **VERIFY**: No version mismatch between local/global turbo

### **2.2 Turbo Configuration Validity**  
- [ ] turbo.json syntax is valid JSON
- [ ] All task names in turbo.json match package.json scripts
- [ ] Task dependencies are correctly specified
- [ ] Output directories match actual build outputs
- [ ] No circular task dependencies

---

## 📦 **3. WORKSPACE CONFIGURATION AUDIT**

### **3.1 Workspace Structure**
- [ ] pnpm-workspace.yaml includes correct workspace patterns
- [ ] All packages have valid package.json files
- [ ] No workspace packages point to non-buildable directories
- [ ] **VERIFY**: config/* NOT included as buildable package

### **3.2 Package Dependency Analysis**
- [ ] All `workspace:^` dependencies point to existing packages
- [ ] No circular dependencies between packages
- [ ] All external dependencies have compatible versions
- [ ] **AUDIT**: Check for intentionally removed dependencies

---

## 🔨 **4. TYPESCRIPT CONFIGURATION AUDIT**

### **4.1 Root TypeScript Configuration**
- [ ] tsconfig.base.json exists and is valid
- [ ] Root tsconfig.json has correct project references
- [ ] **CRITICAL**: NO source file includes in root config when using project references

### **4.2 Package TypeScript Configurations**
- [ ] Every package has tsconfig.json AND tsconfig.build.json
- [ ] All packages have `"composite": true` in main tsconfig
- [ ] All packages have `"noEmit": false` in build tsconfig
- [ ] **CRITICAL**: Project references are complete for ALL packages

### **4.3 Project References Verification**
```bash
# Check EVERY package for missing project references:
find . -name "tsconfig.json" -path "*/packages/*" -o -path "*/services/*" -o -path "*/workers/*" -o -path "*/apps/*"
```
- [ ] Each package references its dependencies via project references
- [ ] Build configs reference build configs, not main configs
- [ ] No missing project references that would cause "rootDir" violations

---

## 🗃️ **5. DATABASE & GENERATED FILES AUDIT**

### **5.1 Prisma Configuration**
- [ ] packages/database/prisma/schema.prisma exists
- [ ] Prisma client generated: `pnpm --filter=@2dots1line/database db:generate`
- [ ] packages/database/src/prisma-client.ts exists after generation
- [ ] No Prisma client import errors

### **5.2 Generated Files & Type Declarations**
- [ ] All generated .js files have corresponding .d.ts files
- [ ] shader-lib generated files have type declarations
- [ ] No TypeScript errors on generated file imports
- [ ] All build-time generation scripts work

---

## 🧹 **6. BUILD ARTIFACT CONTAMINATION CHECK**

### **6.1 Build Artifact Cleanup Required**
- [ ] No .tsbuildinfo files in root or packages
- [ ] No dist/ directories with stale builds
- [ ] No .next/ directories in non-Next.js packages
- [ ] No .turbo/ cache with incompatible versions
- [ ] All node_modules are fresh and consistent

### **6.2 Clean State Verification**
- [ ] Run cleanup script successfully
- [ ] Verify all artifacts removed
- [ ] Fresh pnpm install completed without errors
- [ ] No conflicting cached states

---

## 🎯 **7. INTENTIONAL DEPENDENCY REMOVALS AUDIT**

### **7.1 Previously Removed Dependencies**
- [ ] jsonwebtoken - Intentionally removed from api-gateway
- [ ] **AUDIT ALL**: Check git history for intentionally removed deps
- [ ] Document WHY each dependency was removed
- [ ] **NEVER re-add** removed dependencies without explicit approval

### **7.2 Alternative Implementations**
- [ ] Verify alternative implementations exist for removed dependencies
- [ ] Check that removal didn't break functionality
- [ ] Ensure development/production environments handle removals

---

## 🔍 **8. COMPILATION TESTING (BEFORE BUILD)**

### **8.1 Individual Package Compilation**
- [ ] Test compile database package: `pnpm --filter=@2dots1line/database build`
- [ ] Test compile all packages individually before full build
- [ ] **CRITICAL**: Catch TypeScript errors BEFORE full build
- [ ] Verify all packages can resolve their dependencies

### **8.2 Import Resolution Testing**
- [ ] Test that all @2dots1line/* imports resolve correctly
- [ ] Verify workspace packages can import from each other
- [ ] Check for any missing type declarations

---

## 🚀 **9. FINAL PRE-BUILD VALIDATION**

### **9.1 Environment Readiness**
- [ ] All development tools accessible
- [ ] All configurations valid
- [ ] All dependencies resolved
- [ ] All generated files present

### **9.2 Build Readiness Declaration**
- [ ] **100% of checklist items verified ✅**
- [ ] **NO outstanding issues or warnings**  
- [ ] **ALL patterns of failure addressed systematically**
- [ ] **Confident that build will succeed without reactive fixes**

---

## ⚠️ **FAILURE PROTOCOL**
- **ANY checklist failure** → STOP and investigate systematically
- **NO reactive fixes** → Find root cause and fix pattern
- **Unexpected issues** → UPDATE this checklist immediately
- **Multiple similar errors** → Fix ALL instances, not just the first

---

## 📝 **AUDIT LOG**
- Date: [FILL IN]
- Auditor: [AI/Human]
- Status: [PASS/FAIL]
- Issues Found: [LIST ALL]
- Actions Taken: [SYSTEMATIC FIXES ONLY] 