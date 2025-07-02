# ⚡ **DAILY DEVELOPMENT WORKFLOW - 2D1L**
*Streamlined procedures for efficient daily development*

---

## 🚀 **QUICK START - MORNING SETUP**

### **1. System Health Check (2 minutes)**
```bash
# Quick health verification
pnpm health:check

# If no issues detected, proceed to development
# If issues found, see troubleshooting section below
```

### **2. Start Development Environment**
```bash
# Start all backend services
pnpm services:start

# In separate terminal, start frontend
cd apps/web-app && pnpm dev
```

### **3. Verify Everything Works**
```bash
# Check services are running
pnpm services:status

# Test critical endpoints
curl -f http://localhost:3001/api/health  # API Gateway
curl -f http://localhost:3000/           # Web App
```

---

## 🔄 **DEVELOPMENT CYCLE PROTOCOLS**

### **BEFORE MAKING ANY CHANGES**
```bash
# 1. Pull latest changes
git pull

# 2. Install any new dependencies
pnpm install

# 3. Quick build check
pnpm build

# 4. Verify current state works
pnpm services:status
```

### **DURING DEVELOPMENT - INCREMENTAL VALIDATION**

**After changing a package:**
```bash
# Build just that package
pnpm --filter=@2dots1line/[package-name] build

# If it depends on database, ensure Prisma is current
cd packages/database && pnpm db:generate
```

**After changing service code:**
```bash
# Restart affected services
pnpm services:restart

# Test the specific functionality
curl -f http://localhost:300X/api/health
```

**After changing frontend code:**
```bash
# Usually auto-reloads via Next.js
# If webpack issues, clear cache:
cd apps/web-app && rm -rf .next && pnpm dev
```

### **BEFORE COMMITTING**
```bash
# 1. Full build test
pnpm build

# 2. Lint check
pnpm lint

# 3. Quick conflict check
ls -la | grep -E "(pnpm-lock|tsbuildinfo)" | wc -l
# Should show only 1 pnpm-lock.yaml

# 4. Service integration test
pnpm services:status
```

---

## 🚨 **COMMON DAILY ISSUES & QUICK FIXES**

### **Issue: Services Won't Start**
```bash
# Quick fix sequence
pnpm services:stop
sleep 2
pnpm services:start

# If still failing, check Docker services
docker ps | grep -E "(postgres|redis|weaviate|neo4j)"
```

### **Issue: Build Failures After Git Pull**
```bash
# Standard recovery procedure
pnpm install
cd packages/database && pnpm db:generate
pnpm build
```

### **Issue: Frontend Behaving Strangely**
```bash
# Clear Next.js cache
cd apps/web-app && rm -rf .next
pnpm dev
```

### **Issue: TypeScript Errors After Changes**
```bash
# Check for common conflicts
pnpm fix:conflicts

# Individual package type check
cd [affected-package] && npx tsc --noEmit
```

### **Issue: Database Connection Errors**
```bash
# Restart database services
docker-compose restart postgres redis

# Regenerate Prisma client
cd packages/database && pnpm db:generate
pnpm services:restart
```

---

## 🧪 **TESTING WORKFLOWS**

### **Testing Image Upload Feature**
```bash
# 1. Ensure services running
pnpm services:status

# 2. Test upload via web app
open http://localhost:3000

# 3. Check media records in database
cd packages/database && pnpm db:studio
# Navigate to Media table

# 4. Verify analysis in logs
tail -f logs/dialogue-service.log | grep -i "image\|vision"
```

### **Testing Dialogue Agent**
```bash
# 1. Verify agent service health
curl -f http://localhost:3002/api/health

# 2. Test conversation via API
curl -X POST http://localhost:3001/api/v1/conversations/[id]/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"test message"}'

# 3. Monitor processing
tail -f logs/dialogue-service.log
```

### **Testing Database Operations**
```bash
# Access Prisma Studio
cd packages/database && pnpm db:studio

# Or direct database access
docker exec -it [postgres-container] psql -U danniwang -d twodots1line
```

---

## 📊 **PERFORMANCE MONITORING**

### **Daily Health Metrics**
```bash
# Check service memory usage
docker stats --no-stream

# Check log file sizes
ls -lh logs/*.log

# Check database sizes
du -sh *_data/

# Check build artifact sizes
du -sh packages/*/dist services/*/dist
```

### **Build Performance Check**
```bash
# Time a clean build
time pnpm clean && pnpm build

# Check for build bottlenecks
turbo run build --dry-run
```

---

## 🔧 **ENVIRONMENT MANAGEMENT**

### **Environment Variables Check**
```bash
# Verify critical environment variables
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "REDIS_URL: ${REDIS_URL}"
echo "GOOGLE_API_KEY: ${GOOGLE_API_KEY:0:10}..."

# If missing, check .env file exists and source it
source .env
```

### **Docker Services Management**
```bash
# Check Docker services health
docker-compose ps

# Restart if needed
docker-compose restart [service-name]

# Full restart if major issues
docker-compose down && docker-compose up -d
```

---

## 🚀 **PRODUCTIVITY SHORTCUTS**

### **Useful Aliases (Add to ~/.zshrc or ~/.bashrc)**
```bash
# 2D1L shortcuts
alias 2d1l-start="cd /path/to/2D1L && pnpm services:start"
alias 2d1l-status="cd /path/to/2D1L && pnpm services:status"
alias 2d1l-logs="cd /path/to/2D1L && tail -f logs/*.log"
alias 2d1l-health="cd /path/to/2D1L && pnpm health:check"
alias 2d1l-build="cd /path/to/2D1L && pnpm build"
alias 2d1l-studio="cd /path/to/2D1L/packages/database && pnpm db:studio"
```

### **Quick Navigation**
```bash
# Jump to common directories
alias 2d1l-web="cd /path/to/2D1L/apps/web-app"
alias 2d1l-api="cd /path/to/2D1L/apps/api-gateway"  
alias 2d1l-dialogue="cd /path/to/2D1L/services/dialogue-service"
alias 2d1l-db="cd /path/to/2D1L/packages/database"
```

### **Quick Development Commands**
```bash
# Build specific packages quickly
alias build-tools="pnpm --filter=@2dots1line/tools build"
alias build-db="cd packages/database && pnpm db:generate && pnpm build && cd ../.."
alias restart-dialogue="pnpm services:stop && pnpm services:start"
```

---

## 📅 **END-OF-DAY CHECKLIST**

### **Before Leaving**
```bash
# 1. Commit your work
git add . && git commit -m "feat: [description]"

# 2. Stop services cleanly
pnpm services:stop

# 3. Optional: Stop Docker to save resources
docker-compose down

# 4. Quick cleanup
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json" -delete
```

### **Weekly Maintenance (Fridays)**
```bash
# Update dependencies (careful!)
pnpm update --latest

# Clean build artifacts
pnpm clean

# Prune Docker resources
docker system prune -f

# Archive old logs
mkdir -p logs/archive/$(date +%Y%m%d)
mv logs/*.log logs/archive/$(date +%Y%m%d)/ || true
```

---

## 🆘 **EMERGENCY PROCEDURES**

### **System Completely Broken**
```bash
# Nuclear option - full reset
./scripts/AUTOMATION/build-system/clean-rebuild.sh

# If that fails, see emergency procedures in troubleshooting docs
```

### **Need Help Fast**
1. Check `scripts/KNOWLEDGE_BASE/CRITICAL_LESSONS_LEARNED.md` for known issues
2. Use pattern recognition table for quick diagnosis
3. Run comprehensive health check: `pnpm health:check`
4. Check service logs: `tail -f logs/*.log`

---

*This workflow is optimized for daily productivity while maintaining system health. For complex debugging or architectural changes, refer to the systematic thinking framework and troubleshooting guides.* 