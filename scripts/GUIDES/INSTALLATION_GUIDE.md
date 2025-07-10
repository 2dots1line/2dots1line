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

### 5. Port Verification & Conflict Resolution

#### **5.1 Initial Port Status Check**
```bash
# Verify all required ports and their usage
echo "=== 2D1L Port Status Check ==="
ports=(3000 3001 5555 5433 6379 7475 7688 8080)
for port in "${ports[@]}"; do
  echo "Port $port:"
  lsof -i :$port 2>/dev/null | head -3
  echo "---"
done
```

#### **5.2 Service-Specific Conflict Detection & Resolution**

##### **PostgreSQL (Port 5433)**
```bash
# Check for PostgreSQL conflicts
echo "=== PostgreSQL Port 5433 Analysis ==="
sudo lsof -i :5433

# Expected: Should show either Docker postgres process OR local postgres conflict
# CONFLICT INDICATORS:
# - Process owned by 'postgres' user (local installation)
# - Command shows 'postgres' not 'com.docker.*'

# RESOLUTION for PostgreSQL conflicts:
brew services list | grep postgres
brew services stop postgresql@15  # or postgresql@14, postgresql@16
# Alternative: sudo kill -9 [PID from lsof output]

# Verify resolution:
sudo lsof -i :5433
# Expected: No output (port free) or Docker process only
```

##### **Redis (Port 6379)**
```bash
# Check for Redis conflicts
echo "=== Redis Port 6379 Analysis ==="
lsof -i :6379

# Expected: Should show Docker redis connections OR local redis conflict
# CONFLICT INDICATORS:
# - Process shows 'redis-server' not 'com.docker.*'
# - User is current user, not Docker

# RESOLUTION for Redis conflicts:
brew services list | grep redis
brew services stop redis
# Alternative: sudo killall redis-server

# Verify resolution:
lsof -i :6379
# Expected: Only Docker redis connections (com.docker.*)
```

##### **Neo4j (Ports 7475, 7688)**
```bash
# Check for Neo4j conflicts
echo "=== Neo4j Ports 7475, 7688 Analysis ==="
lsof -i :7475
lsof -i :7688

# CONFLICT INDICATORS:
# - Process shows 'java' with Neo4j in command line
# - Not owned by Docker

# RESOLUTION for Neo4j conflicts:
brew services list | grep neo4j
brew services stop neo4j
# Alternative: pkill -f neo4j

# Verify resolution:
lsof -i :7475 && lsof -i :7688
# Expected: Only Docker neo4j connections or no output
```

##### **Weaviate (Port 8080)**
```bash
# Check for Weaviate/general port 8080 conflicts
echo "=== Port 8080 Analysis ==="
lsof -i :8080

# COMMON CONFLICTS:
# - Local development servers (npm, python -m http.server, etc.)
# - Other Docker containers
# - MacOS built-in services

# RESOLUTION strategies:
# 1. Kill specific process: sudo kill -9 [PID]
# 2. Stop brew services: brew services stop [service]
# 3. Check other Docker containers: docker ps -a

# Verify resolution:
lsof -i :8080
# Expected: Only Docker weaviate process or no output
```

#### **5.3 Comprehensive Conflict Resolution Script**
```bash
# Automated conflict resolution for all 2D1L services
echo "=== Stopping All Potential Local Service Conflicts ==="

# Stop all brew services that might conflict
brew services stop postgresql@15 2>/dev/null || true
brew services stop postgresql@14 2>/dev/null || true  
brew services stop postgresql@16 2>/dev/null || true
brew services stop redis 2>/dev/null || true
brew services stop neo4j 2>/dev/null || true

# Kill any remaining processes on required ports
for port in 5433 6379 7475 7688 8080; do
  echo "Checking port $port..."
  pids=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    sudo kill -9 $pids 2>/dev/null || true
  fi
done

echo "✅ Port cleanup complete"
```

#### **5.4 Post-Resolution Verification**
```bash
# Verify all ports are clear for Docker
echo "=== Final Port Verification ==="
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to start
sleep 10

# Check Docker container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Expected output:
# NAMES                    STATUS          PORTS
# postgres-2d1l           Up X seconds    0.0.0.0:5433->5432/tcp
# redis-2d1l              Up X seconds    0.0.0.0:6379->6379/tcp  
# neo4j-2d1l              Up X seconds    7473/tcp, 0.0.0.0:7475->7474/tcp, 0.0.0.0:7688->7687/tcp
# weaviate-2d1l           Up X seconds    0.0.0.0:8080->8080/tcp

# Test database connectivity
echo "=== Database Connectivity Tests ==="
docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line
docker exec redis-2d1l redis-cli ping
docker exec neo4j-2d1l cypher-shell -u neo4j -p 2dots1line "RETURN 'Neo4j Connected' as status;"
curl -s http://localhost:8080/v1/meta | jq -r '.version // "Weaviate connection failed"'

# Expected: All tests should pass with success messages
```

#### **5.5 Common Troubleshooting Scenarios**

##### **Scenario 1: PostgreSQL Still Conflicting**
```bash
# If pg_isready fails or port 5433 still occupied:
ps aux | grep postgres | grep -v grep
brew services list | grep postgres
sudo pkill -f postgres
sudo rm /usr/local/var/postgres/postmaster.pid 2>/dev/null || true
```

##### **Scenario 2: Redis Keys Missing After Switch**
```bash
# If BullMQ data was in local Redis and now missing:
echo "Checking Redis key migration..."
docker exec redis-2d1l redis-cli KEYS "bull:*" | wc -l
# If 0: BullMQ data was in local Redis, services will recreate as needed
```

##### **Scenario 3: Neo4j Authentication Issues**
```bash
# If cypher-shell authentication fails:
docker exec neo4j-2d1l neo4j-admin set-initial-password 2dots1line
docker restart neo4j-2d1l
```

##### **Scenario 4: Port Still Occupied After Cleanup**
```bash
# Nuclear option for stubborn processes:
sudo lsof -i :5433 -i :6379 -i :7475 -i :7688 -i :8080 | awk 'NR>1 {print $2}' | sort -u | xargs sudo kill -9
```

#### **5.6 Prevention Guidelines**
1. **Always use Docker for development**: Avoid installing PostgreSQL, Redis, Neo4j via Homebrew for 2D1L project
2. **Check ports before starting**: Run port verification before each development session
3. **Use project-specific Redis**: Never run global Redis service during 2D1L development
4. **Monitor Docker logs**: Use `docker logs [container-name]` to verify proper startup
5. **Restart on conflicts**: When in doubt, run the comprehensive cleanup script and restart Docker services

## Database Setup & Migrations

### 1. PostgreSQL (via Prisma)

#### Generate Prisma Client
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma generate
cd ../..
```

#### Apply Database Schema
```bash
cd packages/database
pnpm prisma db push
cd ../..
```

#### Test PostgreSQL Connection
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
npx prisma db pull --print >/dev/null && echo "✅ PostgreSQL via Prisma OK"
cd ../..
```

### 2. Neo4j Graph Database

#### Apply Neo4j Schema (Constraints & Indexes)
```bash
# Apply schema from cypher file
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 -f /var/lib/neo4j/import/schemas/neo4j.cypher || \
cat packages/database/schemas/neo4j.cypher | docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123

echo "✅ Neo4j schema applied"
```

#### Verify Neo4j Schema
```bash
echo "=== Neo4j Constraints ==="
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "SHOW CONSTRAINTS;"

echo "=== Neo4j Indexes ==="
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "SHOW INDEXES;" | head -10

echo "✅ Neo4j schema verification complete"
```

#### Test Neo4j Connection
```bash
echo "RETURN 'Neo4j connection test' as message;" | docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123
```

### 3. Weaviate Vector Database

#### Apply Weaviate Schema
```bash
# Create UserKnowledgeItem class schema
curl -X POST "http://localhost:8080/v1/schema" \
  -H "Content-Type: application/json" \
  -d @packages/database/schemas/weaviate_schema.json && \
echo "✅ Weaviate schema applied" || echo "⚠️ Weaviate schema may already exist"
```

#### Verify Weaviate Schema
```bash
echo "=== Weaviate Classes ==="
curl -s -X GET "http://localhost:8080/v1/schema" | jq '.classes[].class'

echo "=== UserKnowledgeItem Properties ==="
curl -s -X GET "http://localhost:8080/v1/schema/UserKnowledgeItem" | jq '.properties[].name'

echo "✅ Weaviate schema verification complete"
```

#### Test Weaviate Connection
```bash
curl -s -X GET "http://localhost:8080/v1/meta" | jq '.version' && echo "✅ Weaviate connection OK"
```

### 4. Redis Cache & Queue Storage

#### Test Redis Connection
```bash
docker exec redis-2d1l redis-cli ping && echo "✅ Redis connection OK"
```

#### Verify Redis Configuration
```bash
echo "=== Redis Keyspace Notifications ==="
docker exec redis-2d1l redis-cli CONFIG GET notify-keyspace-events

echo "=== Redis Memory Usage ==="
docker exec redis-2d1l redis-cli INFO memory | grep used_memory_human

echo "✅ Redis verification complete"
```

### 5. Comprehensive Database Health Check
```bash
echo "=== COMPREHENSIVE DATABASE HEALTH CHECK ==="

# PostgreSQL
echo "1. PostgreSQL:"
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT 'PostgreSQL' as db, version();" | head -3

# Neo4j
echo "2. Neo4j:"
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "CALL dbms.components() YIELD name, versions RETURN name, versions[0] as version;"

# Weaviate
echo "3. Weaviate:"
curl -s -X GET "http://localhost:8080/v1/meta" | jq -r '"Weaviate version: " + .version'

# Redis
echo "4. Redis:"
docker exec redis-2d1l redis-cli INFO server | grep redis_version

echo "✅ All databases healthy and schemas applied"
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

pm2 start ecosystem.config.js

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
pm2 flush                     # Delete all logs

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

# Flush all logs (clears log files)
pm2 flush

# View logs for all services
pm2 logs

# View logs for specific service with line limit
pm2 logs graph-projection-worker --lines 20

# Monitor logs in real-time for all services
pm2 logs --timestamp

# View only error logs
pm2 logs --error

# View logs from last 1 hour
pm2 logs --since 1h

# Quick status overview
pm2 status

# Detailed monitoring dashboard (updates every 2 seconds)
pm2 monit

# Show detailed info for specific service
pm2 describe graph-projection-worker

# Show process list with more details
pm2 list

# Real-time monitoring dashboard (press 'q' to quit)
pm2 monit

# Check memory usage
pm2 status | grep memory

# Check restart counts (should stay stable)
pm2 status | grep "↺"

# Check if any services are errored
pm2 status | grep -E "(error|stopped|errored)"

# Restart specific service if needed
pm2 restart graph-projection-worker

# Reload all services (zero-downtime)
pm2 reload ecosystem.config.js

After any restart, wait 30 seconds then run pm2 status to ensure stability
Monitor restart counts (↺ column) - should stay low and stable
Check logs after changes with pm2 logs --lines 20 --timestamp
Use pm2 monit for real-time monitoring when needed