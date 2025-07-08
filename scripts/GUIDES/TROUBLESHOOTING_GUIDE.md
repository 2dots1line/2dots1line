# 🚨 **EMERGENCY TROUBLESHOOTING & CRISIS MANAGEMENT - 2D1L**
*Comprehensive procedures for system failures, complex debugging, and crisis recovery*

---

## 🆘 **EMERGENCY RESPONSE HIERARCHY**

> *When the system is broken, follow this triage hierarchy from quickest fixes to comprehensive recovery.*

### **⚡ IMMEDIATE TRIAGE (< 2 minutes)**

**System completely unresponsive:**
```bash
# 1. QUICK HEALTH CHECK
pnpm health:check

# 2. SERVICE STATUS
pnpm services:status

# 3. DOCKER SERVICES
docker ps | grep -E "(postgres|redis|weaviate|neo4j)"

# 4. IMMEDIATE DIAGNOSIS
tail -20 logs/*.log 2>/dev/null || echo "No logs available"
```

**Based on triage results, jump to appropriate section below:**
- **Services down** → [Service Recovery](#service-recovery)
- **Build failures** → [Build System Recovery](#build-system-recovery)  
- **Database issues** → [Database Recovery](#database-recovery)
- **Complex errors** → [Systematic Debugging](#systematic-debugging)
- **Nuclear option** → [Complete System Reset](#complete-system-reset)

---

## 🔧 **SERVICE RECOVERY PROCEDURES**

### **🚀 SERVICE STARTUP FAILURES**

**Services won't start:**
```bash
# 1. STOP ALL SERVICES
pnpm services:stop
sleep 5

# 2. CHECK FOR PORT CONFLICTS
lsof -i :3001,3002,3003,3004 | grep LISTEN
# Kill any conflicting processes
sudo lsof -ti:3001,3002,3003,3004 | xargs sudo kill -9 2>/dev/null || true

# 3. RESTART WITH CLEAN ENVIRONMENT
pnpm services:start

# 4. VERIFY STARTUP
pnpm services:status
```

**Service crashes immediately:**
```bash
# 1. CHECK SERVICE LOGS
tail -50 logs/[service-name].log

# 2. COMMON FIXES
# Environment variables missing:
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
source .env  # Reload environment

# Database not ready:
nc -z localhost 5433 || echo "PostgreSQL not accessible"
docker-compose restart postgres

# Prisma client not generated:
cd packages/database && pnpm db:generate && cd ../..

# 3. RESTART SPECIFIC SERVICE
pnpm services:stop
pnpm services:start
```

**Authentication/API failures:**
```bash
# 1. CHECK API GATEWAY
curl -f http://localhost:3001/api/health || echo "API Gateway down"

# 2. CHECK ENVIRONMENT VARIABLES
echo "Required vars:"
echo "GOOGLE_API_KEY: ${GOOGLE_API_KEY:0:10}..."
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# 3. RESTART WITH ENVIRONMENT
pnpm services:stop
source .env
pnpm services:start
```

### **🔌 SERVICE CONNECTIVITY ISSUES**

**Services running but can't communicate:**
```bash
# 1. VERIFY SERVICE HEALTH ENDPOINTS
for port in 3001 3002 3003; do
  echo "Testing port $port:"
  curl -f http://localhost:$port/api/health || echo "Port $port not responding"
done

# 2. CHECK DOCKER NETWORK
docker network ls
docker network inspect bridge

# 3. RESTART NETWORKING
docker-compose down
docker-compose up -d
sleep 30
pnpm services:restart
```

---

## 🏗️ **BUILD SYSTEM RECOVERY**

### **⚙️ BUILD FAILURES**

**TypeScript compilation errors:**
```bash
# 1. QUICK CONFLICT FIX
pnpm fix:conflicts

# 2. CLEAN BUILD
pnpm clean
pnpm build

# 3. IF STILL FAILING - CHECK INDIVIDUAL PACKAGES
for pkg in packages/*; do
  echo "Building: $pkg"
  cd "$pkg" && npx tsc --noEmit && cd ../.. || {
    echo "❌ Failed: $pkg"
    break
  }
done
```

**Import/module resolution errors:**
```bash
# 1. CHECK PROJECT REFERENCES
find . -name "tsconfig*.json" -not -path "./node_modules/*" -exec grep -L "references" {} \;

# 2. VERIFY DEPENDENCY CHAIN
turbo run build --dry-run

# 3. TEST RUNTIME IMPORTS
cd services/dialogue-service && node -e "
try { 
  require('@2dots1line/database'); 
  console.log('✅ Database import works');
} catch(e) { 
  console.log('❌ Import failed:', e.message); 
}"

# 4. REBUILD DEPENDENCY CHAIN IN ORDER
pnpm --filter=@2dots1line/shared-types build
cd packages/database && pnpm db:generate && pnpm build && cd ../..
pnpm --filter=@2dots1line/core-utils build
pnpm build
```

**Parallel build conflicts:**
```bash
# 1. CHECK FOR RACE CONDITION ARTIFACTS
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json"

# 2. CLEAN ARTIFACTS
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json" -delete

# 3. FIX BUILD INFO PATHS
pnpm fix:typescript

# 4. SEQUENTIAL BUILD
pnpm clean
pnpm build
```

### **📦 DEPENDENCY RESOLUTION FAILURES**

**pnpm install failures:**
```bash
# 1. CHECK FOR LOCK FILE CONFLICTS
ls -la pnpm-lock*.yaml

# 2. CLEAN RESOLUTION
rm pnpm-lock*.yaml 2>/dev/null || true
rm -rf node_modules
pnpm install

# 3. IF STILL FAILING - NUCLEAR DEPENDENCY RESET
rm -rf node_modules packages/*/node_modules services/*/node_modules
rm pnpm-lock.yaml
pnpm install --force
```

**Version compatibility issues:**
```bash
# 1. CHECK NODE VERSION
node --version  # Should be 20+

# 2. CHECK CONFLICTING VERSIONS
find . -name "package.json" -exec grep -H '"typescript"' {} \;

# 3. REINSTALL AFTER VERSION CHANGES
pnpm install
npx tsc --version  # Verify tooling works
```

---

## 🗄️ **DATABASE RECOVERY**

### **🐘 PostgreSQL Issues**

**Connection failures:**
```bash
# 1. CHECK DATABASE STATUS
docker ps | grep postgres
nc -z localhost 5433 || echo "PostgreSQL not accessible"

# 2. RESTART DATABASE
docker-compose restart postgres
sleep 30

# 3. TEST CONNECTION
cd packages/database
npx prisma db push --skip-generate || echo "Database connection failed"

# 4. REGENERATE PRISMA CLIENT
pnpm db:generate
```

**Schema/migration issues:**
```bash
# 1. CHECK MIGRATION STATUS
cd packages/database
npx prisma migrate status

# 2. RESET IF CORRUPTED
npx prisma migrate reset --force

# 3. REGENERATE CLIENT
pnpm db:generate

# 4. SEED DATA IF NEEDED
pnpm db:seed
```

**Database corruption/data issues:**
```bash
# 1. BACKUP CURRENT STATE
docker exec [postgres-container] pg_dump -U danniwang twodots1line > backup.sql

# 2. RESET DATABASE
docker-compose down
docker volume rm $(docker volume ls -q | grep postgres) 2>/dev/null || true
docker-compose up -d postgres
sleep 60

# 3. RESTORE SCHEMA
cd packages/database
npx prisma migrate dev
pnpm db:generate
```

### **🔴 Redis/Cache Issues**

**Redis connectivity:**
```bash
# 1. CHECK REDIS STATUS
nc -z localhost 6379 || echo "Redis not accessible"

# 2. RESTART REDIS
docker-compose restart redis

# 3. FLUSH CACHE IF CORRUPTED
docker exec [redis-container] redis-cli FLUSHALL
```

### **🌊 Weaviate Vector Database Issues**

**Weaviate connection failures:**
```bash
# 1. CHECK WEAVIATE STATUS
curl -f http://localhost:8080/v1/.well-known/ready || echo "Weaviate not ready"

# 2. RESTART WEAVIATE
docker-compose restart weaviate
sleep 60

# 3. VERIFY SCHEMAS
curl http://localhost:8080/v1/schema
```

---

## 🔍 **SYSTEMATIC DEBUGGING PROCEDURES**

### **🧪 COMPLEX PROBLEM ISOLATION**

**When multiple systems are failing:**

1. **ESTABLISH BASELINE**
   ```bash
   # Document current state
   git status
   pnpm health:check > debug-baseline.txt
   docker ps > docker-status.txt
   tail -50 logs/*.log > error-snapshot.txt
   ```

2. **BINARY SEARCH METHODOLOGY**
   ```bash
   # Test half of system at a time
   
   # Test build system only:
   pnpm clean && pnpm build
   
   # Test services only (without build):
   pnpm services:restart
   
   # Test database only:
   docker-compose restart postgres redis
   
   # Test frontend only:
   cd apps/web-app && rm -rf .next && pnpm dev
   ```

3. **COMPONENT ISOLATION**
   ```bash
   # Test each component individually
   
   # Database layer:
   cd packages/database && pnpm db:generate && pnpm build
   
   # Core packages:
   pnpm --filter=@2dots1line/shared-types build
   pnpm --filter=@2dots1line/core-utils build
   
   # Services one by one:
   pnpm --filter=@2dots1line/user-service build
   pnpm --filter=@2dots1line/dialogue-service build
   ```

### **🔬 ROOT CAUSE ANALYSIS FRAMEWORK**

**Apply systematic investigation:**

1. **TIMING ANALYSIS**
   ```bash
   # When did the problem start?
   git log --oneline -20  # Recent changes
   
   # Is it consistent or intermittent?
   for i in {1..5}; do
     echo "Test run $i:"
     pnpm build && echo "✅ Success" || echo "❌ Failed"
   done
   ```

2. **ENVIRONMENTAL FACTORS**
   ```bash
   # Check environment differences
   echo "Environment variables:"
   env | grep -E "(DATABASE|API|NODE)" | sort
   
   # Check file system state
   find . -name "*.lock" -o -name "*.tsbuildinfo" | grep -v node_modules
   
   # Check process conflicts
   ps aux | grep -E "(node|pnpm|tsc)" | grep -v grep
   ```

3. **DEPENDENCY CHAIN ANALYSIS**
   ```bash
   # What changed recently that could affect this?
   git diff HEAD~5 --name-only | grep -E "(package\.json|tsconfig|\.env)"
   
   # What depends on the failing component?
   grep -r "failing-component" packages/*/package.json services/*/package.json
   ```

### **🎯 PATTERN MATCHING**

**Use known failure patterns:**

Check `scripts/KNOWLEDGE_BASE/CRITICAL_LESSONS_LEARNED.md` for:

| **Symptom** | **Likely Cause** | **Quick Fix** |
|-------------|------------------|---------------|
| Build succeeds, runtime import fails | Module system mismatch | Check tsconfig module settings |
| Services start but auth fails | Environment variable propagation | Restart with `pnpm services:start` |
| Multiple .tsbuildinfo files | Parallel build race condition | Run `pnpm fix:typescript` |
| Duplicate pnpm-lock files | Concurrent pnpm processes | Run `pnpm fix:pnpm` |
| Frontend webpack chunk errors | Next.js cache corruption | Delete `.next` directory |

---

## 🔥 **COMPLETE SYSTEM RESET**

### **☢️ NUCLEAR OPTION (Last Resort)**

**When all else fails:**

```bash
# 1. SAVE CURRENT STATE
git add . && git commit -m "emergency: before nuclear reset"
git tag "emergency-backup-$(date +%Y%m%d-%H%M)"

# 2. COMPLETE SYSTEM RESET
./scripts/AUTOMATION/build-system/clean-rebuild.sh

# 3. VERIFY RESET WORKED
pnpm health:check
pnpm services:start
pnpm services:status
```

**Manual nuclear reset if script fails:**

```bash
# 1. STOP EVERYTHING
pnpm services:stop 2>/dev/null || true
docker-compose down 2>/dev/null || true

# 2. CLEAN ALL BUILD ARTIFACTS
rm -rf node_modules packages/*/node_modules services/*/node_modules workers/*/node_modules apps/*/node_modules
rm -rf packages/*/dist services/*/dist workers/*/dist apps/*/dist
rm -f pnpm-lock*.yaml
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -delete

# 3. RESTART INFRASTRUCTURE
docker-compose up -d
sleep 90

# 4. REINSTALL AND REBUILD
pnpm install
cd packages/database && pnpm db:generate && cd ../..
pnpm build

# 5. START SERVICES
pnpm services:start
```

---

## 📊 **RECOVERY VERIFICATION**

### **✅ SYSTEM HEALTH VALIDATION**

**After any recovery procedure:**

```bash
# 1. COMPREHENSIVE HEALTH CHECK
pnpm health:check

# 2. CRITICAL WORKFLOW TESTS
# Image upload test:
open http://localhost:3000
# Upload test image, verify in database

# Conversation test:
# Send message, verify response generated

# Database test:
cd packages/database && pnpm db:studio
# Verify tables and data accessible

# 3. PERFORMANCE BASELINE
time pnpm build  # Should complete in reasonable time

# 4. SERVICE INTEGRATION
curl -f http://localhost:3001/api/health
curl -f http://localhost:3002/api/health  
curl -f http://localhost:3003/api/health
```

### **📈 POST-INCIDENT ANALYSIS**

**Document for future prevention:**

```markdown
## Incident Report: [Date/Time]
**Problem**: [Description of what went wrong]
**Root Cause**: [True underlying cause]
**Recovery Method**: [What fixed it]
**Prevention**: [How to prevent recurrence]
**Lessons Learned**: [New insights gained]
**Documentation Updates**: [What needs updating]
```

---

## 🚨 **ESCALATION PROCEDURES**

### **🆘 WHEN TO ESCALATE**

**Escalate if:**
- Nuclear reset doesn't work
- Data corruption suspected
- Security issues detected
- Critical production systems affected
- Unknown error patterns discovered

### **📝 INCIDENT DOCUMENTATION**

**Prepare for escalation:**

```bash
# 1. COLLECT DIAGNOSTIC INFO
pnpm health:check > incident-health.txt
docker ps > incident-docker.txt
docker-compose logs > incident-logs.txt
tail -200 logs/*.log > incident-app-logs.txt
git log --oneline -20 > incident-recent-changes.txt

# 2. DOCUMENT REPRODUCTION STEPS
echo "Steps to reproduce:"
echo "1. [Step 1]"
echo "2. [Step 2]"
echo "3. [Error occurs]"

# 3. DOCUMENT ATTEMPTED FIXES
echo "Attempted fixes:"
echo "- [Fix 1] - [Result]"
echo "- [Fix 2] - [Result]"
```

---

## 🎯 **PREVENTION INTEGRATION**

### **🧠 LEARNING CAPTURE**

**After resolving any complex issue:**

1. **Update Critical Lessons** - Add new failure mode to knowledge base
2. **Enhance Health Checks** - Add detection for this issue
3. **Improve Automation** - Script any manual recovery steps
4. **Refine Procedures** - Update emergency procedures based on experience

### **🔄 CONTINUOUS IMPROVEMENT**

**Emergency procedures should evolve:**
- **Faster** - Reduce time to resolution
- **Smarter** - Better pattern recognition
- **Automated** - Script more recovery steps
- **Preventive** - Catch issues before they become emergencies

---

*Emergency procedures are your lifeline when the system fails. Use them systematically, document what you learn, and always improve them based on experience.* 