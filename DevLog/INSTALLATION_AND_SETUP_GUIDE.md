# 2dots1line V9.7 - Complete Installation & Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deep Cleaning & Fresh Start](#deep-cleaning--fresh-start)
5. [Docker Environment Setup](#docker-environment-setup)
6. [Database Setup & Migrations](#database-setup--migrations)
7. [Building & Starting Services](#building--starting-services)
8. [Port Management & Service Monitoring](#port-management--service-monitoring)
9. [Live Monitoring Tools](#live-monitoring-tools)
10. [Testing & Validation](#testing--validation)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v18+ (recommended: v20+)
- **pnpm**: v8+ (NOT npm - we exclusively use pnpm)
- **Docker**: v20+ with Docker Compose
- **Git**: Latest version
- **Redis CLI**: For Redis monitoring (optional but recommended)

### Installation Commands
```bash
# Install Node.js (using nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install pnpm globally
npm install -g pnpm@latest

# Verify installations
node --version    # Should be v18+
pnpm --version   # Should be v8+
docker --version # Should be v20+
```

---

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url> 2D1L
cd 2D1L
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify workspace structure
pnpm ls --depth=0
```

---

## Environment Configuration

### 1. Create Environment File
```bash
cp envexample.md .env
```

### 2. Configure Environment Variables
Edit `.env` file with these **working values**:

```bash
# === DATABASE CONFIGURATION ===
DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
POSTGRES_USER=danniwang
POSTGRES_PASSWORD=MaxJax2023@
POSTGRES_DB=twodots1line

# === REDIS CONFIGURATION ===
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_HOST_DOCKER=redis  # Used only in Docker

# === NEO4J CONFIGURATION ===
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=MaxJax2023@

# === WEAVIATE CONFIGURATION ===
WEAVIATE_URL="http://localhost:8080"

# === AI SERVICES ===
GOOGLE_API_KEY="AIzaSyCK5BnB8RbdJ6iT0s1lep89o2H7TMAreIg"

# === JWT CONFIGURATION ===
JWT_SECRET="your-super-secret-jwt-key-here"

# === WORKER CONFIGURATION ===
CONVERSATION_TIMEOUT_MINUTES=5
TIMEOUT_CHECK_INTERVAL_SECONDS=30
ENABLE_INGESTION_QUEUE=true

# === DEVELOPMENT FLAGS ===
NODE_ENV=development
LOG_LEVEL=debug
```

---

## Deep Cleaning & Fresh Start

### Complete System Reset
```bash
# Stop all running services
pkill -f "pnpm dev" || true
pkill -f "ts-node" || true
pkill -f "next dev" || true
pkill -f "prisma studio" || true

# Clean Docker environment
docker-compose down -v --remove-orphans
docker system prune -f
docker volume prune -f

# Remove old Docker images that might interfere
docker rmi $(docker images -q --filter "dangling=true") 2>/dev/null || true

# Clean Node.js artifacts
rm -rf node_modules/
rm -rf */node_modules/
rm -rf */*/node_modules/
rm -rf pnpm-lock.yaml
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Reinstall everything fresh
pnpm install
```

---

## Docker Environment Setup

### 1. Start Database Services
```bash
# Start all databases
docker-compose up -d postgres neo4j weaviate redis

# Verify all services are healthy
docker-compose ps
```

### 2. Health Check Commands
```bash
# PostgreSQL
docker exec -it 2d1l-postgres-1 pg_isready -U danniwang -d twodots1line

# Redis
docker exec -it 2d1l-redis-1 redis-cli ping

# Neo4j (wait ~30 seconds for startup)
curl -u neo4j:MaxJax2023@ http://localhost:7474/db/data/

# Weaviate
curl http://localhost:8080/v1/meta
```

### 3. Expected Ports
- **PostgreSQL**: 5433 (mapped from 5432)
- **Redis**: 6379
- **Neo4j HTTP**: 7474
- **Neo4j Bolt**: 7687
- **Weaviate**: 8080

---

## Database Setup & Migrations

### 1. PostgreSQL Schema Migration
```bash
cd packages/database

# Apply Prisma migrations
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma db push

# Verify schema
pnpm prisma db seed || echo "No seed script found"
```

### 2. Start Prisma Studio
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma studio --port 5555 &
```

### 3. Neo4j Setup
```bash
# Neo4j will auto-create database on first connection
# No manual schema required - it's schemaless
```

---

## Building & Starting Services

### 1. Build All Packages
```bash
# Build entire monorepo
pnpm build

# Or build specific packages
pnpm --filter @2dots1line/database build
pnpm --filter @2dots1line/tools build
pnpm --filter @2dots1line/shared-types build
```

### 2. Start Core Services

#### Terminal 1: API Gateway
```bash
cd apps/api-gateway
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm dev
```

#### Terminal 2: Web App
```bash
cd apps/web-app
pnpm dev
```

#### Terminal 3: Conversation Timeout Worker
```bash
cd workers/conversation-timeout-worker
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm dev
```

### 3. Service URLs
- **Web App**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555

---

## Port Management & Service Monitoring

### 1. Check Port Usage
```bash
# Check what's running on key ports
lsof -i :3000  # Web App
lsof -i :3001  # API Gateway
lsof -i :5433  # PostgreSQL
lsof -i :5555  # Prisma Studio
lsof -i :6379  # Redis
lsof -i :7474  # Neo4j HTTP
lsof -i :7687  # Neo4j Bolt
lsof -i :8080  # Weaviate
```

### 2. Kill Services by Port
```bash
# Kill specific ports if needed
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:5555 | xargs kill -9
```

### 3. Process Management
```bash
# Find Node.js processes
ps aux | grep -E "(pnpm|node|ts-node)" | grep -v grep

# Kill all Node.js development servers
pkill -f "pnpm dev"
pkill -f "ts-node-dev"
pkill -f "next dev"
```

---

## Live Monitoring Tools

### 1. Docker Services Monitoring
```bash
# Monitor Docker containers
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f neo4j
docker-compose logs -f weaviate

# Check container health
watch docker-compose ps
```

### 2. Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli -p 6379

# Monitor Redis activity
redis-cli -p 6379 monitor

# Check specific keys
redis-cli -p 6379 KEYS "*timeout*"
redis-cli -p 6379 KEYS "*conversation*"
redis-cli -p 6379 KEYS "*turn_context*"

# Get key with TTL
redis-cli -p 6379 TTL "conversation:timeout:some-uuid"
```

### 3. Database Monitoring

#### Prisma Studio
- Access at http://localhost:5555
- Real-time database inspection
- Check `conversations` and `conversation_messages` tables

#### PostgreSQL Direct Access
```bash
# Connect to PostgreSQL
psql "postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"

# Useful queries
SELECT COUNT(*) FROM conversations WHERE status = 'active';
SELECT COUNT(*) FROM conversation_messages;
SELECT * FROM conversations ORDER BY start_time DESC LIMIT 5;
```

### 4. Application Logs Monitoring

#### API Gateway Logs
Look for these log patterns:
- `🎯 ConversationController.postMessage - Starting`: Request received
- `🤖 PromptBuilder - Assembling system prompt`: Prompt building
- `🎯 LLMChatTool - FINAL ASSEMBLED PROMPT`: Complete prompt sent to LLM
- `🎯 LLMChatTool - RAW LLM RESPONSE`: Raw response from Gemini
- `📊 LLMChatTool - Usage stats`: Token usage and costs
- `[da_*] Starting turn processing`: DialogueAgent processing start
- `[da_*] Decision: Respond Directly`: DialogueAgent decision making

#### Database Recording Logs
- `📝 ConversationController - Recording user message`: Message being saved
- `✅ ConversationController - User message recorded`: Successful save
- `❌ ConversationController - Failed to record`: Database errors

### 5. Worker Monitoring
```bash
# Check if conversation timeout worker is running
ps aux | grep "conversation-timeout-worker" | grep -v grep

# Monitor worker logs
cd workers/conversation-timeout-worker
pnpm dev 2>&1 | tee worker.log

# Check Redis for worker activity
redis-cli -p 6379 KEYS "*timeout*"
redis-cli -p 6379 KEYS "*conversation*"
```

---

## Testing & Validation

### 1. Database Connection Test
```bash
# Test PostgreSQL
psql "postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line" -c "SELECT NOW();"

# Test through Prisma
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
npx prisma db seed || echo "No seed script"
```

### 2. API Endpoint Testing
```bash
# Test authentication (development mode)
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "message": "Test message for database recording verification",
    "context": {
      "session_id": "test-session-123"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "conversation_id": "uuid-here",
  "response_text": "AI response here",
  "message_id": "response-timestamp",
  "timestamp": "2025-06-28T15:38:42.419Z"
}
```

### 3. Database Recording Verification
After API test, check in Prisma Studio:
1. Go to http://localhost:5555
2. Check `conversations` table for new conversation record
3. Check `conversation_messages` table for both user and assistant messages
4. Verify `conversation_id` matches between tables

### 4. Redis Context Verification
```bash
# Check if turn context is stored
redis-cli -p 6379 KEYS "turn_context:*"
redis-cli -p 6379 GET "turn_context:your-conversation-id"

# Check timeout keys
redis-cli -p 6379 KEYS "conversation:timeout:*"
redis-cli -p 6379 TTL "conversation:timeout:your-conversation-id"
```

### 5. Worker Functionality Test
```bash
# Set a short timeout key manually to test worker
redis-cli -p 6379 SETEX "conversation:timeout:test-123" 10 "active"

# Watch worker logs for timeout processing
# Should see: "⏰ Conversation timeout detected for: test-123"
```

---

## Troubleshooting

### 1. Common Issues

#### Port Conflicts
**Symptom**: `EADDRINUSE` errors
**Solution**:
```bash
# Find and kill process using the port
sudo lsof -ti:3001 | xargs kill -9
```

#### Docker Database Connection Issues
**Symptom**: Connection refused to databases
**Solution**:
```bash
# Restart Docker services
docker-compose down
docker-compose up -d postgres redis neo4j weaviate

# Wait for health checks
sleep 30
docker-compose ps
```

#### Prisma Schema Issues
**Symptom**: `Schema file not found`
**Solution**:
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma generate
pnpm prisma db push
```

### 2. Redis Connection Issues
**Symptom**: Redis connection errors in logs
**Solution**:
```bash
# Check Redis is running
docker exec -it 2d1l-redis-1 redis-cli ping

# Restart Redis if needed
docker-compose restart redis
```

### 3. Build Issues
**Symptom**: TypeScript compilation errors
**Solution**:
```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### 4. Environment Variable Issues
**Symptom**: Services can't connect to databases
**Solution**:
```bash
# Verify environment variables are loaded
echo $DATABASE_URL
echo $REDIS_URL

# Restart services after environment changes
pkill -f "pnpm dev"
# Then restart each service
```

### 5. Foreign Key Constraint Errors
**Symptom**: `Foreign key constraint violated`
**Solution**: The system now automatically creates conversation records before adding messages. If you see this error, check the ConversationController logs for the creation process.

---

## Development Workflow

### Daily Startup Sequence
1. **Start Docker**: `docker-compose up -d`
2. **Wait for health**: `sleep 30 && docker-compose ps`
3. **Start Prisma Studio**: `cd packages/database && pnpm prisma studio --port 5555 &`
4. **Start API Gateway**: `cd apps/api-gateway && pnpm dev` (Terminal 1)
5. **Start Web App**: `cd apps/web-app && pnpm dev` (Terminal 2)
6. **Start Workers**: `cd workers/conversation-timeout-worker && pnpm dev` (Terminal 3)

### Daily Shutdown Sequence
1. **Stop Node services**: `pkill -f "pnpm dev"`
2. **Stop Docker**: `docker-compose down`

### Key Monitoring Commands
```bash
# Health check all services
curl -s http://localhost:3000 >/dev/null && echo "✅ Web App" || echo "❌ Web App"
curl -s http://localhost:3001/health >/dev/null && echo "✅ API Gateway" || echo "❌ API Gateway"
curl -s http://localhost:5555 >/dev/null && echo "✅ Prisma Studio" || echo "❌ Prisma Studio"
docker exec -it 2d1l-postgres-1 pg_isready && echo "✅ PostgreSQL" || echo "❌ PostgreSQL"
docker exec -it 2d1l-redis-1 redis-cli ping >/dev/null && echo "✅ Redis" || echo "❌ Redis"
```

---

## Architecture Overview

### Service Dependencies
```
Web App (3000) → API Gateway (3001) → DialogueAgent → Database Services
                                    → Redis (6379)
                                    → PostgreSQL (5433)
                                    → Neo4j (7687)
                                    → Weaviate (8080)

Workers:
- ConversationTimeoutWorker → Redis + PostgreSQL
```

### Data Flow
1. **User Message** → Web App → API Gateway → ConversationController
2. **ConversationController** → Creates/updates conversation → Records user message
3. **DialogueAgent** → PromptBuilder → LLM → Response generation
4. **Response Recording** → ConversationController → Database
5. **Timeout Management** → Redis keys → ConversationTimeoutWorker
6. **Background Processing** → Ingestion queue → Future workers

---

This guide provides everything needed to set up, run, monitor, and debug the 2dots1line V9.7 system. All commands and configurations have been tested and verified to work together. 