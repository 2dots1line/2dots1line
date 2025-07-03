# Emergency Procedures for 2D1L Project

## 🔧 **TypeScript & Node.js Type Resolution Failures**

### **Emergency Symptoms**
- `Cannot find module 'fs' or its corresponding type declarations`
- `Cannot find module 'crypto' or its corresponding type declarations`
- `Cannot find name 'process'`
- `Cannot find name 'Buffer'`
- `Could not find a declaration file for module 'path'`
- `File '@types/node/index.d.ts' not found`

### **Immediate Triage**
```bash
# Quick diagnosis
pnpm list @types/node
grep -r "import.*'fs'" apps/ services/
grep -r "process\.env" apps/ services/
```

### **Emergency Resolution**
```bash
# 1. Install @types/node at workspace root
pnpm add -D -w @types/node

# 2. Install @types/node in affected packages
cd apps/api-gateway && pnpm add -D @types/node
cd ../../services/dialogue-service && pnpm add -D @types/node
cd ../../services/user-service && pnpm add -D @types/node

# 3. Clean and rebuild
cd ../../
pnpm clean:rebuild
```

### **Root Cause Analysis**
**Why This Happens:**
- pnpm's strict dependency isolation prevents packages from accessing @types/node from workspace root
- Backend packages using Node.js APIs (fs, crypto, path, os, process, Buffer) require explicit @types/node dependency
- Dynamic imports (`await import('fs')`) also need Node.js types
- tsconfig "types": ["node"] without local @types/node fails in pnpm workspaces

**Prevention:**
- Always install @types/node in individual packages that use Node.js APIs
- Use health check script to detect missing dependencies
- Document Node.js usage patterns in new packages

### **Verification Steps**
```bash
# 1. Check build passes
pnpm build

# 2. Run health check
pnpm health:check

# 3. Verify specific packages
cd apps/api-gateway && pnpm run build
cd ../../services/dialogue-service && pnpm run build
```

**Timeline:** 5-10 minutes for complete resolution 

## ⚠️ **CRITICAL: Agent Verification Failure Patterns**

### **Why TypeScript Verification Can Fail**
**Problem:** Agents may incorrectly declare success when TypeScript errors persist.

**Root Cause:** 
- **Cached Builds:** `pnpm build` uses Turbo cache and may replay successful builds even when source TypeScript errors exist
- **Incremental Compilation:** TypeScript may use cached `.d.ts` files that mask real errors
- **Dependency Chain Masking:** Missing types in one package may be temporarily resolved by stale builds in dependent packages

### **Proper Verification Protocol**
```bash
# ❌ WRONG: Can give false positives due to caching
pnpm build

# ✅ CORRECT: Fresh verification without cache
npx tsc --noEmit

# ✅ CORRECT: Package-specific verification
cd target/package && npx tsc --noEmit

# ✅ CORRECT: Clean rebuild verification
pnpm clean:rebuild
```

### **Warning Signs of Failed Verification**
- Agent claims success but user still sees errors
- Build passes but IDE/LSP still shows errors
- TypeScript errors persist after "fixes"
- Clean rebuild reveals completely different errors

### **Post-Fix Verification Checklist**
- [ ] `npx tsc --noEmit` in affected packages
- [ ] Check specific files/lines mentioned in original error
- [ ] Verify dependency installation: `pnpm list @types/node`
- [ ] Test with clean rebuild: `pnpm clean:rebuild` 

## 🔧 **Prisma Client Generation in Clean Rebuilds**

### **Emergency Symptoms**
- `pnpm clean:rebuild` fails at build step
- Error: `Cannot find module '@prisma/client'` or missing Prisma types
- Build works after manual `prisma generate` but defeats automation purpose

### **Root Cause**
Database package `build` script missing Prisma client generation:
```json
// ❌ BROKEN: Missing Prisma generation
"build": "tsc -p tsconfig.build.json"

// ✅ FIXED: Self-contained build
"build": "prisma generate && tsc -p tsconfig.build.json"
```

### **Emergency Resolution**
```bash
# 1. Fix the database package build script
cd packages/database
npm pkg set scripts.build="prisma generate && tsc -p tsconfig.build.json"

# 2. Test the fix
pnpm build

# 3. Verify clean rebuild works end-to-end
pnpm clean:rebuild
```

### **Prevention Protocol**
- **Monorepo Rule:** All packages with generated dependencies MUST include generation in their build script
- **Self-Containment:** Build scripts should work from clean state without external dependencies
- **Test Clean Rebuilds:** Always test automation scripts from completely clean environment

### **Critical Success Criteria**
- `pnpm clean:rebuild` completes without manual intervention
- Database package builds successfully from clean state
- No manual `prisma generate` steps required 

## 🗄️ **Prisma Studio DATABASE_URL Resolution Failures**

### **Emergency Symptoms**
- `Error: Environment variable not found: DATABASE_URL`
- Prisma Studio fails to start with database connection errors
- `pnpm prisma` commands work from project root but fail from packages/database
- Prisma client errors about missing environment variables

### **Root Cause**
Prisma tools look for .env files in the same directory as schema.prisma, but our .env file is at the project root.

### **Emergency Resolution**
```bash
# 1. Create .env symlink for Prisma
ln -sf ../../.env packages/database/.env

# 2. Verify Prisma can now read environment variables
cd packages/database
pnpm prisma validate

# 3. Test database connectivity
pnpm prisma db pull --force

# 4. Restart Prisma Studio
pnpm db:studio
```

### **Prevention in Clean Rebuild**
The `pnpm clean:rebuild` script now automatically:
- Creates the .env symlink if missing
- Validates Prisma environment configuration
- Tests database connectivity before declaring success
- Verifies Prisma Studio can actually start and connect

### **Verification Protocol**
```bash
# Always verify these after Prisma changes:
1. Prisma can validate schema: pnpm prisma validate
2. Database connection works: pnpm prisma db pull --force  
3. Prisma client generates: ls node_modules/.prisma/client
4. Prisma Studio starts: curl -s http://localhost:5555
``` 

## 🚨 **CRITICAL: Automation Trustworthiness Protocol**

### **The Problem: False Confidence in Automation**
Previous automation scripts suffered from "success theater" - claiming services were ready without actually verifying they worked.

### **Symptoms of Untrustworthy Automation**
- Scripts show URLs but services return 404/500 errors
- "Success" messages when services are still starting up
- No verification that dependencies (Docker) are actually running
- Old processes interfering with new ones
- Missing environment configuration not caught early

### **Trustworthy Automation Requirements**

#### **Mandatory Pre-flight Checks**
```bash
# 1. Verify Docker is running
docker info > /dev/null 2>&1 || fail "Docker not running"

# 2. Check required containers exist
for container in postgres redis weaviate neo4j; do
    docker ps | grep -q "$container" || start_missing_containers
done

# 3. Test database connectivity
docker exec postgres-container pg_isready
docker exec redis-container redis-cli ping
```

#### **Process Cleanup Protocol**
```bash
# Kill all potentially conflicting processes BEFORE starting
pkill -f "next dev" || true
pkill -f "prisma studio" || true
pkill -f "pnpm dev" || true
pnpm services:stop || true
```

#### **Fail-Fast Validation**
```bash
# Exit immediately on any failure - don't continue with broken state
set -e

# Validate each critical step
pnpm install || fail_with_error "Install failed" 
pnpm build || fail_with_error "Build failed"
pnpm prisma validate || fail_with_error "Prisma config invalid"
```

#### **Real Service Verification**
```bash
# Wait for services with timeout and test actual connectivity
wait_for_service() {
    local url="$1" 
    local timeout=30
    for i in $(seq 1 $timeout); do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep 2
    done
    return 1
}

# Only show URLs that actually work
if wait_for_service "http://localhost:3000"; then
    echo "✅ Frontend: http://localhost:3000"
else
    fail_with_error "Frontend failed to start"
fi
```

#### **Never Show URLs Unless Verified Working**
```bash
# ❌ BAD: Shows URLs without verification
echo "Frontend: http://localhost:3000"
echo "Prisma: http://localhost:5555"

# ✅ GOOD: Only show verified working services
WORKING_SERVICES=()
for url in "http://localhost:3000" "http://localhost:5555"; do
    if curl -s "$url" > /dev/null 2>&1; then
        WORKING_SERVICES+=("$url")
    fi
done
```

### **Future Agent Requirements**
When building automation scripts, agents MUST:

1. **Pre-validate all dependencies** before starting work
2. **Clean up existing processes** that could interfere  
3. **Test every service** before declaring success
4. **Fail fast with clear error messages** on any issue
5. **Only show URLs that actually respond**
6. **Include timeout-based waiting** for services to start
7. **Provide specific debugging info** when things fail

### **Verification Checklist for Automation**
- [ ] Docker services verified running before starting
- [ ] Old processes killed before starting new ones
- [ ] Each build/install step validated with error handling
- [ ] Services tested with curl/connectivity checks
- [ ] Only working URLs shown to user
- [ ] Clear error messages with next steps provided
- [ ] Logs captured for debugging failures 