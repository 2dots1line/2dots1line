# 2dots1line V9.5 - Complete Installation & Setup Guide

## Table of Contents
1. [Prerequisites & System Requirements](#prerequisites--system-requirements)
2. [Initial System Preparation](#initial-system-preparation)
3. [Environment Configuration](#environment-configuration)
4. [Docker Environment Setup](#docker-environment-setup)
5. [Database Setup & Migrations](#database-setup--migrations)
6. [Building & Starting Services](#building--starting-services)
7. [Testing & Validation](#testing--validation)
8. [Live Monitoring Setup](#live-monitoring-setup)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)
10. [Daily Development Workflow](#daily-development-workflow)

---

## 🚨 **CRITICAL LESSON LEARNED - TypeScript Configuration Fix**

**BEFORE STARTING ANY SERVICES**, apply this essential fix to prevent module resolution errors:

### Required TypeScript Configuration Updates

For all services and apps that use `ts-node-dev`, update their `tsconfig.json` to include:

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node"
  }
}
```

**Files to update immediately:**
- `apps/api-gateway/tsconfig.json`
- `services/dialogue-service/tsconfig.json`
- `services/*/tsconfig.json` (all services)

Without this fix, services will fail to start with module resolution errors when using `ts-node-dev`.

---

## Prerequisites & System Requirements

### Required Software
- **Node.js**: v22.16.0+ (verified working)
- **pnpm**: v8.14.1+ (verified working)
- **Docker**: Latest version with Docker Compose
- **PostgreSQL Client**: For database testing (optional but recommended)
- **Redis CLI**: For Redis testing (optional but recommended)

### System Verification
```bash
# Verify all prerequisites
node --version    # Should show v22.16.0+
pnpm --version   # Should show 8.14.1+
docker --version # Should show latest Docker
```

---

## Initial System Preparation

### 1. Start Docker Desktop
```bash
# macOS - Start Docker Desktop application
open -a Docker

# Wait for Docker to be ready (approximately 60 seconds)
echo "Waiting for Docker to start..." && sleep 60

# Verify Docker is running
docker info >/dev/null 2>&1 && echo "✅ Docker is running" || echo "❌ Docker is not running"
```

### 2. Clean Installation
```bash
# Run the clean rebuild script
chmod +x scripts/clean-rebuild.sh
./scripts/clean-rebuild.sh

# Install dependencies
pnpm install
```

### 3. Verify Installation
```bash
# Check for successful installation
pnpm ls --depth=0 | head -10
```

---

## Environment Configuration

### Environment Variables Setup
The `.env` file should already be configured. Verify it contains:

```bash
# Check critical environment variables
grep -E "(DATABASE_URL|REDIS_URL|NEO4J_)" .env
```

Expected values:
- `DATABASE_URL=postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line`
- `REDIS_URL=redis://localhost:6379`
- `NEO4J_URI=bolt://localhost:7688`
- `NEO4J_PASSWORD=password123`

---

## Docker Environment Setup

### 1. Create Docker Network
```bash
docker network create 2d1l_network 2>/dev/null || echo "Network already exists"
docker network ls | grep 2d1l_network
```

### 2. Start Database Services
```bash
# Start all database services
docker-compose up -d postgres neo4j weaviate redis

# Verify services are starting
docker-compose ps
```

### 3. Wait for Service Initialization
```bash
# Wait for services to initialize (90 seconds recommended)
echo "⏳ Waiting for database services to initialize..."
sleep 90
```

### 4. Health Checks
```bash
# PostgreSQL
docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line && echo "✅ PostgreSQL ready"

# Redis
docker exec redis-2d1l redis-cli ping && echo "✅ Redis ready"

# Neo4j
curl -f http://localhost:7475 >/dev/null 2>&1 && echo "✅ Neo4j ready"

# Weaviate
curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1 && echo "✅ Weaviate ready"
```

### 5. Port Verification
```bash
# Verify all required ports are accessible
ports=(5433 6379 7475 7688 8080)
for port in "${ports[@]}"; do
  if lsof -i :$port >/dev/null 2>&1; then
    echo "✅ Port $port is in use"
  else
    echo "❌ Port $port is not in use"
  fi
done
```

---

## Database Setup & Migrations

### 1. Generate Prisma Client
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma generate
cd ../..
```

### 2. Apply Database Schema
```bash
cd packages/database
pnpm prisma db push
cd ../..
```

### 3. Test Database Connections
```bash
# Test PostgreSQL via Prisma
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
npx prisma db pull --print >/dev/null && echo "✅ PostgreSQL via Prisma OK"
cd ../..

# Test Redis
redis-cli -p 6379 ping >/dev/null 2>&1 && echo "✅ Redis connection OK"

# Test Neo4j
echo "RETURN 'Neo4j connection test' as message;" | docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123
```

---

## Building & Starting Services

### 1. Apply TypeScript Configuration Fix
```bash
# CRITICAL: Apply TypeScript fixes BEFORE building
# For API Gateway
cat > apps/api-gateway/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "jsx": "react-jsx",
    "module": "CommonJS",
    "moduleResolution": "node"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  "references": [
    { "path": "../../packages/shared-types/tsconfig.build.json" }
  ]
}
EOF

# For Dialogue Service
cat > services/dialogue-service/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "module": "CommonJS",
    "moduleResolution": "node"
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "references": [
    { "path": "../config-service" },
    { "path": "../../packages/database" },
    { "path": "../../packages/shared-types" },
    { "path": "../../packages/tools" }
  ]
}
EOF
```

### 2. Build All Packages
```bash
echo "🔨 Building all packages..."
pnpm build

# Verify build success
echo "✅ Build completed. Checking dist directories..."
find . -name "dist" -type d -not -path "./node_modules/*" | head -10
```

### 3. Start Core Services

#### Option A: Unified Service Startup (Recommended)
**Use the unified service orchestration scripts for consistent environment and reliable startup:**

```bash
# Start all backend services with proper environment loading
pnpm services:start

# Wait for services to initialize
sleep 15

# Verify all services are running
curl -f http://localhost:3001/api/health && echo "✅ API Gateway ready"
curl -f http://localhost:3003/api/health && echo "✅ User Service ready"
curl -f http://localhost:3002/api/health && echo "✅ Dialogue Service ready"
curl -f http://localhost:3004/api/health && echo "✅ Card Service ready"
```

#### Start Web Application
```bash
cd apps/web-app
pnpm dev &
# Wait for startup
sleep 15
cd ../..
```

#### Option B: Manual Service Startup (Legacy/Debugging Only)
**Note**: Only use this method for debugging. The unified approach is more reliable.

#### Start Prisma Studio (Background)
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma studio --port 5555 > /tmp/prisma-studio.log 2>&1 &
echo "🎯 Prisma Studio starting at http://localhost:5555"
cd ../..
```

#### Start Individual Services (If needed for debugging)
```bash
# Load environment variables first
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
export REDIS_URL="redis://localhost:6379"
export GOOGLE_API_KEY="your-google-api-key"

# Start services in separate terminals
cd apps/api-gateway && pnpm dev &
cd services/user-service && pnpm dev &
cd services/dialogue-service && pnpm dev &
cd services/card-service && pnpm dev &
```

---

## Testing & Validation

### 1. Service Accessibility Tests
```bash
echo "🧪 Testing service accessibility..."

# API Gateway
curl -f http://localhost:3001/api/health >/dev/null 2>&1 && echo "✅ API Gateway (3001) accessible"

# Prisma Studio
curl -f http://localhost:5555 >/dev/null 2>&1 && echo "✅ Prisma Studio (5555) accessible"

# Neo4j Browser
curl -f http://localhost:7475 >/dev/null 2>&1 && echo "✅ Neo4j Browser (7475) accessible"

# Weaviate API
curl -f http://localhost:8080/v1/meta >/dev/null 2>&1 && echo "✅ Weaviate API (8080) accessible"

# Web App
curl -f http://localhost:3000 >/dev/null 2>&1 && echo "✅ Web App (3000) accessible"
```

### 2. Database Connection Tests
```bash
echo "🔍 Testing database connections..."

# PostgreSQL via Prisma
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
npx prisma db pull --print >/dev/null && echo "✅ PostgreSQL via Prisma OK"
cd ../..

# Redis
redis-cli -p 6379 ping >/dev/null 2>&1 && echo "✅ Redis connection OK"
```

### 3. API Integration Test
```bash
echo "🧪 Testing API integration..."

# Test complete API flow
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"message": "Hello, this is a test message for installation verification","context": {"session_id": "installation-test-session"}}' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## 🔍 Comprehensive Live Monitoring & Debugging Guide

### 📊 Service Access URLs
Once everything is running, you can access:

- **Web Application**: http://localhost:3000
- **API Gateway**: http://localhost:3001/api/health
- **User Service**: http://localhost:3003/api/health
- **Dialogue Service**: http://localhost:3002/api/health
- **Card Service**: http://localhost:3004/api/health
- **Prisma Studio**: http://localhost:5555
- **Neo4j Browser**: http://localhost:7475 (neo4j/password123)
- **Weaviate Console**: http://localhost:8080/v1/meta

### 🚨 Critical Live Log Monitoring Commands

#### **Primary Service Logs (Essential for Development)**
```bash
# 🎯 DIALOGUE SERVICE LOG (Most Important - Image Upload, LLM, DialogueAgent)
tail -f logs/dialogue-service.log

# 👤 USER SERVICE LOG (Authentication, User Management)
tail -f logs/user-service.log

# 🌐 API GATEWAY LOG (Request Routing, CORS, Authentication Flow)
tail -f logs/api-gateway.log

# 📄 CARD SERVICE LOG (Card Generation, Business Logic)
tail -f logs/card-service.log
```

#### **Database & Infrastructure Logs**
```bash
# 🗄️ POSTGRESQL DATABASE LOGS
docker logs postgres-2d1l --tail=50 -f

# 📊 REDIS CACHE LOGS  
docker logs redis-2d1l --tail=20 -f

# 🕸️ NEO4J GRAPH DATABASE LOGS
docker logs neo4j-2d1l --tail=30 -f

# 🧠 WEAVIATE VECTOR DATABASE LOGS
docker logs weaviate-2d1l --tail=30 -f
```

#### **Multi-Service Monitoring (Monitor Everything Simultaneously)**
```bash
# 📺 ALL NODE.JS SERVICE LOGS IN PARALLEL
# Open 4 separate terminal windows/tabs and run:
# Terminal 1: tail -f logs/dialogue-service.log
# Terminal 2: tail -f logs/user-service.log  
# Terminal 3: tail -f logs/api-gateway.log
# Terminal 4: tail -f logs/card-service.log

# 🐳 ALL DOCKER SERVICE LOGS
docker-compose logs -f postgres neo4j redis weaviate

# 📊 COMBINED INFRASTRUCTURE MONITORING
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### 🔧 Advanced Monitoring & Debugging

#### **Real-Time System Health Monitoring**
```bash
# 🚀 SERVICE AVAILABILITY DASHBOARD
watch -n 5 'echo "=== SERVICE HEALTH CHECK $(date) ===" && \
curl -s http://localhost:3001/api/health | head -1 && echo " → API Gateway" && \
curl -s http://localhost:3002/api/health | head -1 && echo " → Dialogue Service" && \
curl -s http://localhost:3003/api/health | head -1 && echo " → User Service" && \
curl -s http://localhost:3004/api/health | head -1 && echo " → Card Service" && \
echo "=== DATABASE STATUS ===" && \
docker exec postgres-2d1l pg_isready -U danniwang && \
docker exec redis-2d1l redis-cli ping && \
echo "=== INFRASTRUCTURE ===" && \
curl -s http://localhost:8080/v1/.well-known/ready | grep ready && echo " → Weaviate OK"'

# 📈 PORT USAGE MONITORING
watch -n 3 'lsof -i :3000,3001,3002,3003,3004,5555,5433,6379,7475,7688,8080 | grep LISTEN'

# 💾 NODE.JS PROCESS MONITORING
watch -n 5 'ps aux | grep -E "(node|pnpm)" | grep -v grep | grep -E "(api-gateway|dialogue-service|user-service|card-service|web-app)"'
```

#### **Image Upload & DialogueAgent Debugging**
```bash
# 🖼️ IMAGE UPLOAD SPECIFIC DEBUGGING
# Focus on these logs when testing image uploads:

# Primary: DialogueAgent processing & VisionCaptionTool
tail -f logs/dialogue-service.log | grep -E "(VisionCaptionTool|DialogueAgent|upload|image|media)"

# Secondary: API Gateway file handling
tail -f logs/api-gateway.log | grep -E "(upload|multipart|POST.*conversations)"

# Database: Media record creation
tail -f logs/dialogue-service.log | grep -E "(Media|media_id|MediaRepository)"
```

#### **Database Activity Monitoring**
```bash
# 📊 POSTGRESQL QUERY MONITORING (Advanced)
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '1 seconds' 
ORDER BY duration DESC;"

# 🔍 PRISMA QUERY DEBUGGING (Enable query logging)
# Add to dialogue service startup: DEBUG=prisma:query pnpm dev

# 📈 REDIS ACTIVITY MONITORING
docker exec redis-2d1l redis-cli monitor

# 🕸️ NEO4J ACTIVE TRANSACTIONS
echo "CALL db.listTransactions();" | docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123
```

#### **Performance & Resource Monitoring**
```bash
# 🎯 MEMORY USAGE BY SERVICE
docker stats --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}" --no-stream

# 💽 DISK USAGE MONITORING  
du -sh postgres_data/ neo4j_data/ weaviate_data/ redis_data/ logs/

# 🚀 REQUEST RATE MONITORING (API Gateway)
tail -f logs/api-gateway.log | grep -E "POST|GET|PUT|DELETE" | while read line; do
  echo "$(date '+%H:%M:%S') - $line"
done

# 🔥 ERROR RATE MONITORING (All Services)
tail -f logs/*.log | grep -E "(Error|ERROR|Failed|failed|Exception)" --color=always
```

### 🎯 Specific Debugging Scenarios

#### **Image Upload Not Working**
```bash
# Step 1: Check API Gateway receives file
tail -f logs/api-gateway.log | grep -E "(upload|multipart|file)"

# Step 2: Verify request forwarding to dialogue service  
tail -f logs/api-gateway.log | grep -E "POST.*conversations.*upload"

# Step 3: Monitor dialogue service processing
tail -f logs/dialogue-service.log | grep -E "(upload|VisionCaptionTool|Media|media_id)"

# Step 4: Check for environment variable issues
tail -f logs/dialogue-service.log | grep -E "(GOOGLE_API_KEY|Environment variable)"

# Step 5: Database connectivity for media records
tail -f logs/dialogue-service.log | grep -E "(MediaRepository|Prisma|DATABASE_URL)"
```

#### **DialogueAgent/LLM Issues**
```bash
# Monitor LLM processing pipeline
tail -f logs/dialogue-service.log | grep -E "(DialogueAgent|LLMChatTool|PromptBuilder|processDialogue)"

# Google API connectivity issues
tail -f logs/dialogue-service.log | grep -E "(google|gemini|api.*key)"

# Context assembly debugging
tail -f logs/dialogue-service.log | grep -E "(context|prompt|conversation|memory)"
```

#### **Authentication Flow Debugging**
```bash
# User registration/login issues
tail -f logs/user-service.log | grep -E "(register|login|auth|token)"

# API Gateway authentication middleware
tail -f logs/api-gateway.log | grep -E "(authorization|bearer|token|middleware)"

# Session management
tail -f logs/user-service.log | grep -E "(session|cookie|expire)"
```

#### **Database Connectivity Issues**
```bash
# Prisma client issues
tail -f logs/*.log | grep -E "(Prisma|DATABASE_URL|connection.*failed)"

# Redis connectivity
tail -f logs/*.log | grep -E "(Redis|REDIS_URL|connection.*redis)"

# Neo4j connectivity  
tail -f logs/*.log | grep -E "(Neo4j|NEO4J|bolt://)"

# Weaviate connectivity
tail -f logs/*.log | grep -E "(Weaviate|vector|embedding)"
```

### 📋 Daily Monitoring Checklist

#### **Morning Startup Verification**
```bash
# ✅ Quick health check script
./scripts/health-check.sh  # Run comprehensive system check

# ✅ Service status verification
pnpm services:status      # Check if all services are running

# ✅ Database connectivity test
./scripts/test-databases.sh

# ✅ End-to-end API test
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"message": "Morning system test"}' | jq
```

#### **Development Session Monitoring**
1. **Keep Primary Logs Open**: Always have `dialogue-service.log` visible
2. **Monitor Resource Usage**: Check `docker stats` periodically  
3. **Watch for Errors**: Use error-filtering commands during active development
4. **Database Health**: Monitor PostgreSQL query performance for slow operations
5. **API Response Times**: Watch for request/response latency in logs

#### **End of Day Cleanup & Status**
```bash
# 📊 Generate daily usage report
echo "=== DAILY DEVELOPMENT REPORT $(date) ===" > daily-report.txt
echo "Services uptime:" >> daily-report.txt
docker ps --format "{{.Names}}: {{.Status}}" >> daily-report.txt
echo "Log file sizes:" >> daily-report.txt  
ls -lh logs/*.log >> daily-report.txt
echo "Database sizes:" >> daily-report.txt
du -sh *_data/ >> daily-report.txt

# 🧹 Clean up log files if they get too large (optional)
find logs/ -name "*.log" -size +100M -exec truncate -s 50M {} \;

# 💤 Graceful shutdown
pnpm services:stop
docker-compose down
```

### 🆘 Emergency Debugging Commands

#### **System Not Responding**
```bash
# 🚨 EMERGENCY: Kill all related processes
pkill -f "pnpm dev"
pkill -f "ts-node-dev"
pkill -f "next dev"

# 🔄 EMERGENCY: Full system restart
docker-compose down -v
./scripts/clean-rebuild.sh
pnpm services:start
```

#### **Database Recovery**
```bash
# 🗄️ PostgreSQL emergency reset
docker-compose down postgres
docker volume rm 2d1l_postgres_data
docker-compose up -d postgres
cd packages/database && pnpm prisma db push

# 🧠 Weaviate emergency reset  
docker-compose down weaviate
docker volume rm 2d1l_weaviate_data
docker-compose up -d weaviate
```

#### **Quick Log Analysis**
```bash
# 🔍 Find most recent errors across all logs
find logs/ -name "*.log" -exec grep -l "Error\|ERROR\|Failed" {} \; | xargs ls -lt | head -5

# 📊 Count error types across services
grep -h "Error\|ERROR" logs/*.log | sort | uniq -c | sort -nr

# ⏰ Show last 10 minutes of critical activity
find logs/ -name "*.log" -exec grep -h "$(date -d '10 minutes ago' '+%Y-%m-%d %H:%M')" {} \; | tail -20
```

This comprehensive monitoring setup ensures you can quickly identify, diagnose, and resolve issues during development, with special focus on the critical image upload and DialogueAgent functionality.

---

## Troubleshooting Common Issues

### Issue 1: TypeScript Module Resolution Errors
**Symptoms**: Services fail to start with "Cannot find module" errors
**Solution**: Apply the TypeScript configuration fix (see Building & Starting Services section)

### Issue 2: Database Connection Failures
**Symptoms**: Prisma errors, connection timeouts
**Solution**: 
```bash
# Restart database services
docker-compose down
docker-compose up -d postgres neo4j weaviate redis
sleep 90
```

### Issue 3: Port Already in Use
**Symptoms**: EADDRINUSE errors
**Solution**:
```bash
# Find and kill processes using required ports
lsof -ti:3000,3001,3002,5555 | xargs kill -9
```

### Issue 4: Docker Services Not Starting
**Symptoms**: Docker compose services show unhealthy status
**Solution**:
```bash
# Full Docker reset
docker-compose down -v
docker system prune -f
docker-compose up -d
```

---

## Daily Development Workflow

### Quick Start (After Initial Setup)
```bash
# 1. Start Docker services
docker-compose up -d

# 2. Wait for database initialization
sleep 30

# 3. Start all backend services (unified approach)
pnpm services:start

# 4. Start web application
cd apps/web-app && pnpm dev &

# 5. Start Prisma Studio (optional, for database monitoring)
cd packages/database && pnpm prisma studio &

# 6. Open browser to http://localhost:3000
```

### Service Management Commands
```bash
# Start all backend services
pnpm services:start

# Stop all backend services  
pnpm services:stop

# Restart all backend services
pnpm services:restart

# Full development environment (services + web app)
pnpm dev:full
```

### Before Committing Changes
```bash
# Run the build verification
pnpm build

# Run tests
pnpm test

# Check linting
pnpm lint
```

---

## ✅ Installation Success Criteria

Your installation is successful when:

1. ✅ All database services are accessible (PostgreSQL, Redis, Neo4j, Weaviate)
2. ✅ API Gateway responds to health checks
3. ✅ Web application loads on http://localhost:3000
4. ✅ API integration test returns successful response
5. ✅ Prisma Studio is accessible for database monitoring
6. ✅ All builds complete without errors

## 🎯 Next Steps

After successful installation:
1. Implement the full DialogueAgent in the dialogue service
2. Set up user authentication
3. Configure production environment variables
4. Set up proper logging and monitoring
5. Implement the remaining workers and services

---

## 📝 Lessons Learned & Risk Mitigation

### Critical Success Factors:
1. **TypeScript Configuration**: CommonJS module resolution is essential for ts-node-dev compatibility
2. **Service Dependencies**: Start with simple services and progressively add complexity
3. **Database Initialization**: Allow sufficient time for Docker services to initialize
4. **Infrastructure Testing**: Use simple test services to validate infrastructure before complex implementations

### Proactive Checks:
1. Always verify Docker is running before starting services
2. Check port availability before service startup
3. Test database connections before starting dependent services
4. Use health check endpoints to verify service status
5. Monitor Node.js processes to identify startup issues

### Process Improvements:
1. Automated health check scripts
2. Progressive service startup approach
3. Clear error messaging for common issues
4. Comprehensive logging for debugging
5. Rollback procedures for failed deployments

This guide provides a comprehensive, step-by-step approach to setting up the complete 2dots1line V9.5 development environment. Each step has been designed to be verifiable and includes troubleshooting guidance for common issues. 


Log monitoring:

   tail -f logs/dialogue-service.log