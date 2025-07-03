# Refactoring Protocols for 2D1L Project

## 🏗️ **Monorepo Dependency Management Protocols**

### **Node.js Type Dependencies**

When adding or refactoring backend packages that use Node.js APIs:

#### **Required Actions:**
1. **Install @types/node locally** in any package using:
   - File system operations (`fs`, `path`)
   - Cryptographic functions (`crypto`)
   - Operating system utilities (`os`)
   - Process globals (`process`, `Buffer`)
   - Dynamic Node.js imports (`await import('fs')`)

```bash
# For each backend package
cd apps/api-gateway && pnpm add -D @types/node
cd services/dialogue-service && pnpm add -D @types/node
```

#### **Verification Checklist:**
- [ ] Package builds without TypeScript errors
- [ ] Health check passes: `pnpm health:check`
- [ ] No "Cannot find module" errors for Node.js modules
- [ ] No "Cannot find name" errors for Node.js globals

#### **Anti-Patterns to Avoid:**
- ❌ Relying only on workspace root @types/node
- ❌ Adding `"types": ["node"]` to tsconfig without local dependency
- ❌ Ignoring TypeScript type errors in backend code
- ❌ Using Node.js APIs without proper type safety

#### **Pattern to Follow:**
```json
// package.json for backend packages
{
  "devDependencies": {
    "@types/node": "^20.19.4",
    "typescript": "^5.8.3"
  }
}
```

#### **Integration with CI/CD:**
- Health check script verifies Node.js type dependencies
- Build process validates all packages can access required types
- Lint process catches type safety issues early

### **When This Protocol Applies:**
- Creating new backend services
- Adding Node.js functionality to existing packages
- Migrating from npm/yarn to pnpm
- Resolving TypeScript compilation errors
- Setting up new development environments 

## 🚨 **CRITICAL: AI Agent Verification Protocols**

### **Mandatory TypeScript Fix Verification**

When an AI agent fixes TypeScript errors, it **MUST** follow this verification protocol:

#### **❌ NEVER Trust These for Verification:**
```bash
pnpm build          # Uses Turbo cache - can replay old successful builds
pnpm lint           # May use cached type information
turbo run build     # Cached results mask real errors
```

#### **✅ ALWAYS Use These for Verification:**
```bash
# 1. Direct TypeScript check without cache
npx tsc --noEmit

# 2. Package-specific verification
cd target/package && npx tsc --noEmit

# 3. Check specific files mentioned in errors
npx tsc --noEmit path/to/specific/file.ts

# 4. Verify dependencies are actually installed
pnpm list @types/node
pnpm list @types/express

# 5. Ultimate verification - clean rebuild
pnpm clean:rebuild
```

#### **Required Post-Fix Actions:**
1. **Read the actual source code** - verify the problematic lines exist and are syntactically correct
2. **Check dependency installation** - confirm required type packages are in package.json
3. **Test specific error locations** - verify each file/line mentioned in original error
4. **Document what was actually fixed** - explain the root cause and solution

#### **Red Flags for Failed Verification:**
- Declaring success without checking specific files mentioned in error
- Using cached build commands for verification
- Not confirming dependency installations
- User reports same errors persist after "fix"

### **Critical Learning from V9.5 TypeScript Incidents:**
- Node.js type errors require `@types/node` in **each package** that uses Node APIs
- pnpm's strict isolation prevents packages from accessing workspace root dependencies
- Cached builds can mask TypeScript errors for hours/days until clean rebuild
- Always verify the specific lines mentioned in error reports 

## 🏗️ **Monorepo Package Self-Containment Rules**

### **Generated Dependencies Protocol**

**MANDATORY RULE:** Any package with generated dependencies (Prisma, GraphQL, Protobuf, etc.) MUST include generation in its build script.

#### **Example: Database Package with Prisma**
```json
// ✅ CORRECT: Self-contained build
{
  "scripts": {
    "build": "prisma generate && tsc -p tsconfig.build.json",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev"
  }
}

// ❌ WRONG: Missing generation in build
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "db:generate": "prisma generate"
  }
}
```

#### **Self-Containment Verification Checklist**
- [ ] Package builds successfully from completely clean environment
- [ ] No manual generation steps required before build
- [ ] `pnpm clean:rebuild` completes without intervention
- [ ] Build script includes all necessary generation commands

#### **Generated Dependency Types**
- **Prisma:** `prisma generate` before TypeScript compilation
- **GraphQL:** `graphql-codegen` before TypeScript compilation  
- **Protobuf:** `protoc` before TypeScript compilation
- **OpenAPI:** `openapi-generator` before TypeScript compilation

#### **Enforcement Protocol**
1. **Every PR with generated dependencies** must include self-contained build script
2. **CI/CD verification** must test clean builds from scratch
3. **Documentation updates** required for any new generated dependencies

### **Clean Rebuild Dependency Rules**
- Database packages: Include client generation
- Code generators: Include generation in build step
- Asset processors: Include processing in build step
- Type generators: Include type generation before compilation 

### **Prevention Protocol**
```bash
# Always verify these after database package changes:
1. Database package builds from clean state: pnpm build
2. Prisma generates without errors: pnpm prisma generate  
3. Build script includes generation: grep "prisma generate" package.json
4. Dependencies are self-contained: no external generation steps required
5. Turbo can build package independently: turbo run build --filter=@2dots1line/database
6. Package works in clean environment: test with fresh node_modules
```

## 🚀 **Trustworthy Automation Design Principles**

### **The Trustworthiness Crisis in Development Automation**

Development automation frequently suffers from "success theater" - scripts that claim everything is working while services are actually broken or unreachable.

### **V9.5 Trustworthy Automation Standards**

#### **1. Fail-Fast Philosophy**
```bash
# MANDATORY: Every automation script MUST start with
set -e  # Exit immediately on any error

# MANDATORY: Provide clear failure function
fail_with_error() {
    log_error "$1"
    log_error "❌ Operation FAILED. Fix the above issue and retry."
    exit 1
}
```

#### **2. Pre-flight Validation Protocol**
```bash
# Before ANY automation work, validate all dependencies:

# Check Docker services
docker info > /dev/null 2>&1 || fail_with_error "Docker not running"

# Verify required containers
REQUIRED=("postgres" "redis" "weaviate" "neo4j") 
for container in "${REQUIRED[@]}"; do
    docker ps | grep -q "$container" || auto_start_missing
done

# Test database connectivity
docker exec postgres-container pg_isready || fail_with_error "PostgreSQL not ready"
```

#### **3. Process Cleanup Protocol**
```bash
# MANDATORY: Clean up conflicting processes before starting
pkill -f "next dev" || true
pkill -f "prisma studio" || true  
pkill -f "pnpm dev" || true
pnpm services:stop || true

# Remove stale PID files
rm -f .frontend-pid .prisma-studio-pid
```

#### **4. Real Service Verification**
```bash
# NEVER show URLs without verification
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local timeout=30
    local count=0
    
    while [ $count -lt $timeout ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0  # Service is responding
        fi
        sleep 2
        count=$((count + 2))
    done
    return 1  # Service failed to respond
}

# Only report working services
if wait_for_service "http://localhost:3000" "Frontend"; then
    WORKING_SERVICES+=("http://localhost:3000" "Frontend")
else
    fail_with_error "Frontend failed to start"
fi
```

#### **5. No Success Theater Protocol**
```bash
# ❌ FORBIDDEN: Showing unverified URLs
echo "Frontend: http://localhost:3000"
echo "Prisma: http://localhost:5555"

# ✅ REQUIRED: Only show verified working services
WORKING_SERVICES=()
FAILED_SERVICES=()

for url in "${URLS_TO_TEST[@]}"; do
    if curl -s "$url" > /dev/null 2>&1; then
        WORKING_SERVICES+=("$url")
    else
        FAILED_SERVICES+=("$url")
    fi
done

# Report only what actually works
if [ ${#WORKING_SERVICES[@]} -gt 0 ]; then
    echo "✅ VERIFIED WORKING SERVICES:"
    # ... show only working ones
fi
```

### **Automation Script Requirements Checklist**

Every automation script MUST include:

- [ ] **Fail-fast error handling** (`set -e` and `fail_with_error()`)
- [ ] **Pre-flight dependency checks** (Docker, environment)
- [ ] **Process cleanup** before starting services
- [ ] **Step-by-step validation** with clear error messages
- [ ] **Service connectivity testing** before declaring success
- [ ] **Timeout-based waiting** for services to start
- [ ] **Only verified URLs shown** to users
- [ ] **Comprehensive logging** for debugging failures
- [ ] **Clear next steps** provided on any failure
- [ ] **Environment setup** (symlinks, permissions, etc.)

### **Anti-Patterns to Avoid**

#### **❌ Success Theater**
- Showing URLs that return 404/500 errors
- "Started" messages for services that crashed
- Ignoring service startup failures

#### **❌ Dependency Assumptions**
- Assuming Docker containers are running
- Not checking environment variables exist
- Skipping connectivity tests

#### **❌ Process Conflicts**
- Starting new services while old ones are running
- Not cleaning up PID files
- Race conditions between services

### **Implementation Example: Clean Rebuild Script**

The enhanced `pnpm clean:rebuild` script exemplifies these principles:

1. **Pre-flight**: Verifies Docker + database connectivity
2. **Cleanup**: Kills old processes + removes artifacts
3. **Validation**: Tests each build step with error handling
4. **Service Testing**: Waits for and verifies each service works
5. **Honest Reporting**: Only shows URLs that actually respond

### **Future Agent Requirements**

When creating/modifying automation scripts, agents MUST:

1. **Implement all checklist items above**
2. **Test failure scenarios** (what if Docker is down?)
3. **Provide clear debugging information** on failure
4. **Never show "success" unless everything actually works**
5. **Include rollback/cleanup procedures** for partial failures

This ensures our automation builds trust rather than creating false confidence. 