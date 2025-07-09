# 2dots1line V11.0 - Complete Installation & Setup Guide

## Table of Contents
1. [Prerequisites & System Requirements](#prerequisites--system-requirements)
2. [Initial System Preparation](#initial-system-preparation)
3. [Environment Configuration](#environment-configuration)
4. [Docker Environment Setup](#docker-environment-setup)
5. [Database Setup & Migrations](#database-setup--migrations)
6. [Building & Starting Services](#building--starting-services)
7. [Testing & Validation](#testing--validation)
8. [Gemini Model Configuration Management](#gemini-model-configuration-management)
9. [Live Monitoring Setup](#live-monitoring-setup)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)
11. [Daily Development Workflow](#daily-development-workflow)

---

## 🚨 **V11.0 ARCHITECTURE OVERVIEW**

**KEY V11.0 CHANGES:**
- **Headless Services**: `dialogue-service`, `user-service`, `card-service`, `config-service` are now **libraries** imported by the API Gateway
- **Single API Server**: Only the API Gateway runs as a server (port 3001)
- **PM2 Management**: All workers and Python services are managed via PM2
- **Simplified Architecture**: No more separate service servers - everything flows through the API Gateway

**What Runs Where:**
- **API Gateway**: Single Node.js server (port 3001) with all service logic
- **Workers**: Background processors managed by PM2 (ingestion, insight, card, etc.)
- **Python Services**: ML services managed by PM2 (dimension-reducer on port 8000)
- **Databases**: Docker containers (PostgreSQL, Redis, Weaviate, Neo4j)
- **Frontend**: Next.js development server (port 3000)
- **Prisma Studio**: Database management UI (port 5555)

---

## Prerequisites & System Requirements

### Required Software
- **Node.js**: v18.0.0+ (verified working with v22.16.0+)
- **pnpm**: v8.14.1+ (package manager)
- **Docker**: Latest version with Docker Compose
- **PM2**: Process manager for workers (installed via pnpm)
- **Python**: v3.8+ (for dimension-reducer service)

### System Verification
```bash
# Verify all prerequisites
node --version    # Should show v18.0.0+
pnpm --version   # Should show 8.14.1+
docker --version # Should show latest Docker
pm2 --version    # Should show PM2 version (or install globally)
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

Manual cleansing:
# Use faster, quieter removal approach
rm -rf node_modules pnpm-lock.yaml 2>/dev/null || true

# Remove other artifacts silently
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true  
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Force remove any remaining nested node_modules (background)
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null &

echo "   2c. Pruning pnpm store..."
pnpm store prune


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
grep -E "(DATABASE_URL|REDIS_URL|NEO4J_|GOOGLE_API_KEY)" .env
```

Expected values:
- `DATABASE_URL=postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line`
- `REDIS_URL=redis://localhost:6379`
- `NEO4J_URI=bolt://localhost:7688`
- `NEO4J_PASSWORD=password123`
- `GOOGLE_API_KEY=your-google-api-key`

---

## Docker Environment Setup

### 1. Create Docker Network
```bash
docker network create 2d1l_network 2>/dev/null || echo "Network already exists"
docker network ls | grep 2d1l_network
```

### 2. Start Database Services
```bash
# Start all database services using development compose
docker-compose -f docker-compose.dev.yml up -d

# Verify services are starting
docker-compose -f docker-compose.dev.yml ps
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
docker exec $(docker ps -q -f "name=postgres") pg_isready -U danniwang -d twodots1line && echo "✅ PostgreSQL ready"

# Redis
docker exec $(docker ps -q -f "name=redis") redis-cli ping && echo "✅ Redis ready"

# Neo4j
curl -f http://localhost:7475 >/dev/null 2>&1 && echo "✅ Neo4j ready"

# Weaviate
curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1 && echo "✅ Weaviate ready"
```

### 5. Port Verification
```bash
# Verify all required ports are accessible
ports=(3000 3001 5555 5433 6379 7475 7688 8080)
for port in "${ports[@]}"; do
  if lsof -i :$port >/dev/null 2>&1; then
    echo "✅ Port $port is in use"
  else
    echo "❌ Port $port is not in use"
  fi
done
```
### how to kill an occupied port:
lsof -i :5433
docker ps -a
expect the following: 
CONTAINER ID   IMAGE                              COMMAND                  CREATED          STATUS

PORTS                                                      NAMES
c3564df5f6a3   postgres:16-alpine                 "docker-entrypoint.s…"   16 minutes ago   Created

                                                           postgres-2d1l
dce0cacbb59c   redis:7-alpine                     "docker-entrypoint.s…"   16 minutes ago   Up 16 minutes

0.0.0.0:6379->6379/tcp                                     redis-2d1l
16d98f55984f   neo4j:5                            "tini -g -- /startup…"   16 minutes ago   Up 16 minutes

7473/tcp, 0.0.0.0:7475->7474/tcp, 0.0.0.0:7688->7687/tcp   neo4j-2d1l
bd5cf3886c14   semitechnologies/weaviate:1.25.3   "/bin/weaviate --hos…"   16 minutes ago   Up 16 minutes

0.0.0.0:8080->8080/tcp                                     weaviate-2d1l

netstat -an | grep 5433

docker network ls
Expect the following
danniwang@Dannis-MacBook-Pro 2D1L % docker network ls
NETWORK ID     NAME                DRIVER    SCOPE
3d5b1a3f0a54   2d1l_2d1l_network   bridge    local
4434c4f1f8ba   bridge              bridge    local
350f3b703009   host                host      local
e759c2a63ab9   none                null      local
danniwang@Dannis-MacBook-Pro 2D1L %
---
sudo lsof -i :5433

Expect: 

danniwang@Dannis-MacBook-Pro 2D1L % sudo lsof -i :5433
Password:
COMMAND  PID     USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
postgres 528 postgres    7u  IPv6 0xfd217f872dedff58      0t0  TCP *:pyrrho (LISTEN)
postgres 528 postgres    8u  IPv4 0x17e1899cd45ca9ee      0t0  TCP *:pyrrho (LISTEN)
danniwang@Dannis-MacBook-Pro 2D1L %

(Optional)
ps aux | grep postgres
brew services list | grep postgres

More aggressively kill by PID
sudo kill -9 528

After thoroughly killing process occupying 5433 port (owned by postgres, therefore not found by lsof -ti:5433), repeat the docker commands
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
docker ps
docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line

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
echo "RETURN 'Neo4j connection test' as message;" | docker exec -i $(docker ps -q -f "name=neo4j") cypher-shell -u neo4j -p password123
```

---

## Building & Starting Services

### 1. Build All Packages
```bash
echo "🔨 Building all packages..."
pnpm build

# Verify build success
echo "✅ Build completed. Checking dist directories..."
find . -name "dist" -type d -not -path "./node_modules/*" | head -10
```
# Find all compiled TypeScript artifacts in src directories
find packages/*/src services/*/src workers/*/src apps/*/src \
  -name "*.js" -o -name "*.d.ts" -o -name "*.map" -o -name "*.js.map" -o -name "*.d.ts.map" -o -name "*.tsbuildinfo" \
  2>/dev/null | grep -v -E "(glsl\.d\.ts|express\.d\.ts|generated/)"

# SAFE: Remove only obvious compiled artifacts (excludes legitimate .d.ts files)
find packages/*/src services/*/src workers/*/src apps/*/src \
  -name "*.js" -o -name "*.js.map" -o -name "*.d.ts.map" -o -name "*.tsbuildinfo" \
  2>/dev/null | grep -v -E "(glsl\.d\.ts|express\.d\.ts|generated/)" | xargs rm -f

# Remove ALL compiled files from src directories (use only if you're sure)
find packages/*/src services/*/src workers/*/src \
  -name "*.js" -o -name "*.d.ts" -o -name "*.map" -o -name "*.tsbuildinfo" \
  -delete 2>/dev/null

# Add this to package.json scripts
"clean:src": "find packages/*/src services/*/src workers/*/src -name '*.js' -o -name '*.js.map' -o -name '*.d.ts.map' -o -name '*.tsbuildinfo' | grep -v -E '(glsl\\.d\\.ts|express\\.d\\.ts|generated/)' | xargs rm -f"

### 2. V11.0 Service Startup

#### Start All Services (Recommended)
```bash
# Start databases (if not already running)
pnpm start:db

# Start all Node.js services and workers via PM2

echo ""
echo "📋 PHASE 5: START SERVICES"
echo "14. Starting all services with proper environment loading..."

# Critical fix: PM2 needs environment loaded properly
source .env

# Fix environment variable mapping for workers
export NEO4J_URI="${NEO4J_URI_HOST}"
export NEO4J_USERNAME="${NEO4J_USER}"

echo "    Environment variables configured:"
echo "    - NEO4J_URI: ${NEO4J_URI}"
echo "    - DATABASE_URL: ${DATABASE_URL:0:20}..."

if ! pm2 start ecosystem.config.js; then
    echo "❌ CRITICAL: Service startup failed"
    exit 1
fi


# Start frontend development server
cd apps/web-app && pnpm dev &
cd ../..

# Start Prisma Studio
npx prisma studio --schema=./packages/database/prisma/schema.prisma
```

#### Alternative: Step-by-Step Startup
```bash
# 1. Start databases
docker-compose -f docker-compose.dev.yml up -d

# 2. Start PM2 services (API Gateway + Workers + Python services)
pm2 start ecosystem.config.js

# 3. Start frontend
cd apps/web-app
pnpm dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../../.frontend-pid
cd ../..

# 4. Start Prisma Studio
cd packages/database
pnpm prisma studio --port 5555 &
PRISMA_PID=$!
echo $PRISMA_PID > ../../.prisma-studio-pid
cd ../..
```
or
    npx prisma studio --schema=./packages/database/prisma/schema.prisma
    
### 3. V11.0 Service Management Commands
```bash
# PM2 Service Management
pm2 status                    # Check all PM2 processes
pm2 logs                      # View all logs
pm2 logs api-gateway          # View specific service logs
pm2 restart api-gateway       # Restart specific service
pm2 restart all               # Restart all services
pm2 stop all                  # Stop all services
pm2 delete all                # Delete all services

# Quick Management via pnpm scripts
pnpm start:services           # Start all PM2 services
pnpm stop:services            # Stop all PM2 services  
pnpm restart:services         # Restart all PM2 services
pnpm status                   # Check PM2 status
pnpm logs                     # View PM2 logs

# Database Management
pnpm start:db                 # Start database containers
pnpm stop:db                  # Stop database containers

# Full System Management
pnpm full-restart             # Complete system restart
```

---

## Testing & Validation

### 1. V11.0 Service Accessibility Tests
```bash
echo "🧪 Testing V11.0 service accessibility..."

# API Gateway (main server)
curl -f http://localhost:3001/api/health >/dev/null 2>&1 && echo "✅ API Gateway (3001) accessible"

# Frontend
curl -f http://localhost:3000 >/dev/null 2>&1 && echo "✅ Web App (3000) accessible"

# Prisma Studio
curl -f http://localhost:5555 >/dev/null 2>&1 && echo "✅ Prisma Studio (5555) accessible"

# Python Services
curl -f http://localhost:8000/health >/dev/null 2>&1 && echo "✅ Dimension Reducer (8000) accessible"

# Database Services
curl -f http://localhost:7475 >/dev/null 2>&1 && echo "✅ Neo4j Browser (7475) accessible"
curl -f http://localhost:8080/v1/meta >/dev/null 2>&1 && echo "✅ Weaviate API (8080) accessible"
```

### 2. PM2 Process Verification
```bash
echo "🔍 Checking PM2 processes..."
pm2 status
```

### 3. API Integration Test
```bash
echo "🧪 Testing V11.0 API integration..."

# Test complete API flow through API Gateway
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"message": "Hello, this is a test message for V11.0 installation verification","context": {"session_id": "installation-test-session"}}' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## 🤖 Gemini Model Configuration Management

The 2D1L system uses a centralized Gemini model configuration system that allows easy model management, automatic fallbacks, and quota monitoring.

### 📋 Overview

The system uses:
- **Configuration File**: `/config/gemini_models.json` - Centralized model definitions
- **Model Service**: `ModelConfigService` - Intelligent model selection with fallbacks
- **Testing Script**: `/scripts/05_MODEL_MANAGEMENT/test_gemini_models.js` - Automated availability testing
- **Use Cases**: Chat, Vision, Embedding - Each optimized for specific tasks

**📂 All model management tools are located in**: `scripts/05_MODEL_MANAGEMENT/`

### 🔍 Checking Current Model Configuration

#### View Current Active Models
```bash
# Quick status check - see what models are currently configured
cat config/gemini_models.json | jq '.models'

# Check last testing results
cat config/gemini_models.json | jq '.testing_results'
```

### 🧪 Testing Model Availability

#### Automated Model Testing
```bash
# Test all configured models against current API key
cd scripts/05_MODEL_MANAGEMENT
./manage-gemini-models.sh test

# Daily health check
./daily-model-check.sh
```

### ⚙️ Model Configuration Management
```bash
# Check current model status
scripts/05_MODEL_MANAGEMENT/manage-gemini-models.sh status

# Update configuration
scripts/05_MODEL_MANAGEMENT/manage-gemini-models.sh update-config

# Emergency fallback
scripts/05_MODEL_MANAGEMENT/manage-gemini-models.sh emergency
```

For complete model management documentation, see:
```bash
cat scripts/05_MODEL_MANAGEMENT/README_MODEL_MANAGEMENT.md
```

---

## 🔍 V11.0 Live Monitoring & Debugging Guide

### 📊 V11.0 Service Access URLs
Once everything is running, you can access:

- **API Gateway**: http://localhost:3001/api/health (main server)
- **Web Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **Dimension Reducer**: http://localhost:8000/health
- **Neo4j Browser**: http://localhost:7475 (neo4j/password123)
- **Weaviate Console**: http://localhost:8080/v1/meta

### 🚨 V11.0 Critical Live Log Monitoring Commands

#### **Primary Service Logs (PM2 Managed)**
```bash
# 🎯 API GATEWAY LOG (Most Important - All service logic now here)
pm2 logs api-gateway --lines 50

# 🔄 ALL PM2 SERVICES LOGS
pm2 logs --lines 0

# 📊 SPECIFIC WORKER LOGS
pm2 logs ingestion-worker --lines 50
pm2 logs insight-worker --lines 50
pm2 logs card-worker --lines 50

# 🐍 PYTHON SERVICES LOG
pm2 logs dimension-reducer --lines 50
```

#### **Database & Infrastructure Logs**
```bash
# 🗄️ POSTGRESQL DATABASE LOGS
docker logs $(docker ps -q -f "name=postgres") --tail=50 -f

# 📊 REDIS CACHE LOGS  
docker logs $(docker ps -q -f "name=redis") --tail=20 -f

# 🕸️ NEO4J GRAPH DATABASE LOGS
docker logs $(docker ps -q -f "name=neo4j") --tail=30 -f

# 🧠 WEAVIATE VECTOR DATABASE LOGS
docker logs $(docker ps -q -f "name=weaviate") --tail=30 -f
```

#### **Multi-Service Monitoring (V11.0)**
```bash
# 📺 ALL PM2 LOGS IN REAL-TIME
pm2 logs --lines 0

# 🐳 ALL DOCKER SERVICE LOGS
docker-compose -f docker-compose.dev.yml logs -f

# 📊 COMBINED SYSTEM MONITORING
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### 🔧 V11.0 Advanced Monitoring & Debugging

#### **Real-Time System Health Monitoring**
```bash
# 🚀 V11.0 SERVICE AVAILABILITY DASHBOARD
watch -n 5 'echo "=== V11.0 SERVICE HEALTH CHECK $(date) ===" && \
curl -s http://localhost:3001/api/health | head -1 && echo " → API Gateway" && \
curl -s http://localhost:8000/health | head -1 && echo " → Dimension Reducer" && \
echo "=== PM2 STATUS ===" && \
pm2 jlist | jq -r ".[] | \"\(.name): \(.pm2_env.status)\"" && \
echo "=== DATABASE STATUS ===" && \
docker exec $(docker ps -q -f "name=postgres") pg_isready -U danniwang && \
docker exec $(docker ps -q -f "name=redis") redis-cli ping && \
echo "=== INFRASTRUCTURE ===" && \
curl -s http://localhost:8080/v1/.well-known/ready | grep ready && echo " → Weaviate OK"'

# 📈 PORT USAGE MONITORING (V11.0)
watch -n 3 'lsof -i :3001,3000,5555,8000,5433,6379,7475,7688,8080 | grep LISTEN'

# 💾 PM2 PROCESS MONITORING
watch -n 5 'pm2 status'
```

#### **DialogueAgent & API Gateway Debugging (V11.0)**
```bash
# 🖼️ API GATEWAY PROCESSING (All service logic now here)
pm2 logs api-gateway --lines 0 | grep -E "(DialogueAgent|upload|image|media|conversation)"

# 🗣️ DIALOGUE PROCESSING PIPELINE
pm2 logs api-gateway --lines 0 | grep -E "(PromptBuilder|LLMChatTool|VisionCaptionTool)"

# 📊 WORKER ACTIVITY
pm2 logs ingestion-worker --lines 0 | grep -E "(processing|complete|error)"
```

#### **Database Activity Monitoring**
```bash
# 📊 POSTGRESQL QUERY MONITORING (Advanced)
docker exec -it $(docker ps -q -f "name=postgres") psql -U danniwang -d twodots1line -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '1 seconds' 
ORDER BY duration DESC;"

# 📈 REDIS ACTIVITY MONITORING
docker exec $(docker ps -q -f "name=redis") redis-cli monitor

# 🕸️ NEO4J ACTIVE TRANSACTIONS
echo "CALL db.listTransactions();" | docker exec -i $(docker ps -q -f "name=neo4j") cypher-shell -u neo4j -p password123
```

### 🎯 V11.0 Specific Debugging Scenarios

#### **API Gateway Request Flow (V11.0)**
```bash
# Step 1: Check API Gateway receives requests
pm2 logs api-gateway --lines 0 | grep -E "(POST|GET|PUT|DELETE)"

# Step 2: Monitor service integration within API Gateway
pm2 logs api-gateway --lines 0 | grep -E "(DialogueAgent|UserService|CardService)"

# Step 3: Check worker job dispatch
pm2 logs api-gateway --lines 0 | grep -E "(queue|job|worker)"
```

#### **Worker Processing Issues**
```bash
# Monitor worker job processing
pm2 logs ingestion-worker --lines 0 | grep -E "(job.*processing|job.*completed|job.*failed)"

# Check worker queue status
pm2 logs insight-worker --lines 0 | grep -E "(queue.*empty|queue.*processing)"

# Monitor Python service integration
pm2 logs dimension-reducer --lines 0 | grep -E "(request|processing|response)"
```

### 📋 V11.0 Daily Development Checklist

#### **Morning Startup Verification**
```bash
# ✅ Check Docker databases
docker-compose -f docker-compose.dev.yml ps

# ✅ Check PM2 services
pm2 status

# ✅ Quick health check
curl -f http://localhost:3001/api/health && echo "✅ API Gateway OK"
curl -f http://localhost:8000/health && echo "✅ Python Services OK"

# ✅ End-to-end API test
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"message": "Morning system test"}' | jq
```

#### **V11.0 Service Management**
```bash
# 🔄 Restart all services
pnpm full-restart

# 📊 Monitor system status
pm2 monit

# 🔍 Check logs for errors
pm2 logs | grep -i error

# 🧹 Clean restart if needed
pm2 delete all && pnpm start:services
```

### 🆘 V11.0 Emergency Commands

#### **System Not Responding**
```bash
# 🚨 EMERGENCY: Kill all PM2 processes
pm2 delete all

# 🚨 EMERGENCY: Kill all Node.js processes
pkill -f "node"

# 🔄 EMERGENCY: Full system restart
docker-compose -f docker-compose.dev.yml down
./scripts/clean-rebuild.sh
pnpm full-restart
```

#### **Quick System Status Check**
```bash
# 🎯 V11.0 SYSTEM STATUS SUMMARY
echo "=== V11.0 SYSTEM STATUS ==="
echo "PM2 Processes: $(pm2 jlist | jq length)"
echo "Docker Containers: $(docker ps | wc -l)"
echo "API Gateway: $(curl -s http://localhost:3001/api/health >/dev/null && echo "✅ OK" || echo "❌ FAIL")"
echo "Frontend: $(curl -s http://localhost:3000 >/dev/null && echo "✅ OK" || echo "❌ FAIL")"
echo "Databases: $(docker-compose -f docker-compose.dev.yml ps | grep -c "Up")/4 running"
```

---

## Troubleshooting Common Issues

### V11.0 Common Issues

#### **PM2 Services Not Starting**
```bash
# Check environment variables
pm2 exec 0 -- env | grep DATABASE_URL

# Restart with fresh environment
pm2 delete all
source .env
pm2 start ecosystem.config.js
```

#### **API Gateway Integration Issues**
```bash
# Check build artifacts
ls -la packages/*/dist

# Rebuild and restart
pnpm build
pm2 restart api-gateway
```

#### **Worker Job Processing Problems**
```bash
# Check worker status
pm2 logs ingestion-worker --lines 20

# Restart specific worker
pm2 restart ingestion-worker
```

### Database Connection Issues
```bash
# Test each database individually
docker exec $(docker ps -q -f "name=postgres") pg_isready -U danniwang
docker exec $(docker ps -q -f "name=redis") redis-cli ping
curl -f http://localhost:8080/v1/.well-known/ready
curl -f http://localhost:7475
```

---

## Daily Development Workflow

### V11.0 Development Session

#### **Start Development Session**
```bash
# 1. Start databases
pnpm start:db

# 2. Start all services
pnpm start:services

# 3. Start frontend
cd apps/web-app && pnpm dev &

# 4. Start Prisma Studio
cd packages/database && pnpm prisma studio &

# 5. Monitor logs
pm2 logs --lines 0
```

#### **During Development**
```bash
# Monitor specific service
pm2 logs api-gateway --lines 0

# Restart after code changes
pm2 restart api-gateway

# Check build status
pnpm build

# Test API endpoints
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"message": "Test message"}'
```

#### **End Development Session**
```bash
# Stop all services
pnpm stop:services

# Stop databases (optional)
pnpm stop:db

# Kill frontend and Prisma Studio
kill $(cat .frontend-pid .prisma-studio-pid)
```

---

## Quick Reference Commands

### V11.0 Essential Commands
```bash
# System Management
pnpm full-restart          # Complete system restart
pnpm start:services        # Start PM2 services
pnpm stop:services         # Stop PM2 services
pnpm status               # Check PM2 status
pnpm logs                 # View PM2 logs

# Database Management
pnpm start:db             # Start Docker databases
pnpm stop:db              # Stop Docker databases

# Development
pnpm build                # Build all packages
cd apps/web-app && pnpm dev  # Start frontend
cd packages/database && pnpm prisma studio  # Start Prisma Studio

# Monitoring
pm2 monit                 # PM2 monitoring dashboard
docker stats              # Docker container stats
curl http://localhost:3001/api/health  # API health check
```

### Database Access Commands
```bash
# PostgreSQL
docker exec -it $(docker ps -q -f "name=postgres") psql -U danniwang -d twodots1line

# Redis CLI
docker exec -it $(docker ps -q -f "name=redis") redis-cli

# Neo4j Cypher Shell
docker exec -it $(docker ps -q -f "name=neo4j") cypher-shell -u neo4j -p password123

# Weaviate API
curl http://localhost:8080/v1/meta
```

### Useful Monitoring Commands
```bash
# Watch PM2 status
watch pm2 status

# Monitor API Gateway logs
pm2 logs api-gateway --lines 0

# Monitor all logs with filtering
pm2 logs | grep -i error

# Check system resources
docker stats --no-stream
```

This comprehensive V11.0 installation guide provides everything needed to manage the 2D1L system efficiently with the new headless service architecture and PM2 process management.