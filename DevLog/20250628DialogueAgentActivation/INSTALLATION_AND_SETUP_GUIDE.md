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
- **Node.js**: >= 18.0.0
- **pnpm**: 10.11.1 (specified in package.json)
- **Docker**: Latest version with Docker Compose
- **Git**: For version control

### System Requirements
- **macOS**: Tested on macOS 24.5.0 (Darwin)
- **Memory**: At least 8GB RAM (16GB recommended)
- **Storage**: At least 10GB free space for Docker images and data

---

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd 2D1L
```

### 2. Install pnpm (if not already installed)
```bash
npm install -g pnpm@10.11.1
```

### 3. Verify Prerequisites
```bash
node --version    # Should be >= 18.0.0
pnpm --version    # Should be 10.11.1
docker --version  # Should be latest
docker compose version  # Should support modern syntax
```

---

## Environment Configuration

### 1. Create Environment File
Copy the example environment file and customize it:

```bash
cp envexample.md .env
```

### 2. Required Environment Variables
Edit `.env` with your actual values:

```bash
# === SECURITY ===
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1d

# === AI PROVIDER KEYS ===
GOOGLE_API_KEY=your-actual-gemini-api-key-here

# === DATABASE CREDENTIALS ===
POSTGRES_USER=danniwang
POSTGRES_PASSWORD=MaxJax2023@
POSTGRES_DB_NAME=twodots1line

# === DATABASE PORTS ===
POSTGRES_HOST_PORT=5433
NEO4J_HTTP_HOST_PORT=7475
NEO4J_BOLT_HOST_PORT=7688
WEAVIATE_HOST_PORT=8080
REDIS_HOST_PORT=6379

# === APPLICATION PORTS ===
API_GATEWAY_HOST_PORT=3001
API_GATEWAY_CONTAINER_PORT=3001

# === INTERNAL DOCKER NETWORK ===
POSTGRES_HOST_FOR_APP_IN_DOCKER=postgres
POSTGRES_PORT_FOR_APP_IN_DOCKER=5432
NEO4J_URI_DOCKER=neo4j://neo4j:7687
WEAVIATE_HOST_DOCKER=weaviate:8080
REDIS_HOST_DOCKER=redis
REDIS_PORT_FOR_APP_IN_DOCKER=6379

# === GENERAL ===
NODE_ENV=development
```

### 3. Database Connection URLs
The system uses these connection patterns:
- **Host machine tools**: `postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line`
- **Docker containers**: `postgresql://danniwang:MaxJax2023@@postgres:5432/twodots1line`

---

## Deep Cleaning & Fresh Start

### 1. Stop All Running Services
```bash
# Stop any running Node processes
pkill -f "node"
pkill -f "ts-node"
pkill -f "pnpm dev"

# Check for processes on common ports
lsof -ti:3000,3001,5555,6379,7474,7687,8080 | xargs kill -9 2>/dev/null || true
```

### 2. Clean Docker Environment
```bash
# Stop and remove all containers
docker compose down --remove-orphans

# Remove old images (be careful - this removes ALL Docker images)
docker system prune -a --volumes

# Remove specific 2dots1line images if they exist
docker images | grep "2d1l\|2dots1line" | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true

# Remove old volumes
docker volume ls | grep "2d1l\|postgres\|neo4j\|weaviate\|redis" | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true
```

### 3. Clean Node Dependencies
```bash
# Remove all node_modules and build artifacts
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Clean pnpm cache
pnpm store prune
```

### 4. Clean Database Data Directories
```bash
# Remove existing database data (CAUTION: This deletes all data!)
rm -rf postgres_data neo4j_data weaviate_data redis_data
```

---

## Docker Environment Setup

### 1. Create Docker Network
```bash
docker network create 2d1l_network
```

### 2. Verify Docker Compose Configuration
Check that `docker-compose.yml` has all required services:
- postgres (port 5433)
- neo4j (ports 7475, 7688)
- weaviate (port 8080)
- redis (port 6379)
- api-gateway (port 3001) - can be disabled for local development

### 3. Start Database Services Only
For hybrid development (databases in Docker, apps locally):
```bash
# Start only database services
docker compose up -d postgres neo4j weaviate redis

# Verify services are healthy
docker compose ps
docker compose logs postgres
docker compose logs neo4j
docker compose logs weaviate
docker compose logs redis
```

### 4. Health Check Commands
```bash
# PostgreSQL
docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line

# Neo4j
curl -f http://localhost:7475 || echo "Neo4j not ready"

# Weaviate
curl -f http://localhost:8080/v1/.well-known/ready || echo "Weaviate not ready"

# Redis
docker exec redis-2d1l redis-cli ping
```

---

## Database Setup & Migrations

### 1. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify Prisma client generation
pnpm --filter=@2dots1line/database prisma generate
```

### 2. Apply Database Schema
```bash
# Set DATABASE_URL and run migrations
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"

# Run Prisma migrations
pnpm --filter=@2dots1line/database prisma migrate dev

# Or use the root script
pnpm db:migrate:dev
```

### 3. Verify Database Connection
```bash
# Test PostgreSQL connection
psql "postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line" -c "SELECT version();"

# Test via Prisma
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
npx prisma db pull --print
```

---

## Building & Starting Services

### 1. Build All Packages
```bash
# Build all packages in dependency order
pnpm build

# Or build specific packages
pnpm --filter=@2dots1line/database build
pnpm --filter=@2dots1line/tools build
pnpm --filter=@2dots1line/dialogue-service build
pnpm --filter=@2dots1line/api-gateway build
```

### 2. Start API Gateway (Local Development)
```bash
cd apps/api-gateway
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm dev
```

### 3. Start Web Application
```bash
cd apps/web-app
pnpm dev
```

### 4. Start Background Workers
```bash
# Conversation timeout worker
cd workers/conversation-timeout-worker
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm dev

# Other workers as needed
cd workers/ingestion-worker && pnpm dev &
cd workers/insight-worker && pnpm dev &
cd workers/embedding-worker && pnpm dev &
```

---

## Port Management & Service Monitoring

### 1. Standard Port Allocation
- **3000**: Web App (Next.js)
- **3001**: API Gateway
- **5433**: PostgreSQL
- **5555**: Prisma Studio
- **6379**: Redis
- **7475**: Neo4j Browser (HTTP)
- **7688**: Neo4j Bolt
- **8080**: Weaviate API

### 2. Check Port Usage
```bash
# Check what's running on each port
lsof -i :3000  # Web app
lsof -i :3001  # API Gateway
lsof -i :5433  # PostgreSQL
lsof -i :5555  # Prisma Studio
lsof -i :6379  # Redis
lsof -i :7475  # Neo4j HTTP
lsof -i :7688  # Neo4j Bolt
lsof -i :8080  # Weaviate

# Kill processes on specific ports if needed
lsof -ti:3001 | xargs kill -9
```

### 3. Service Status Commands
```bash
# Docker services
docker compose ps
docker compose logs -f [service-name]

# Local Node processes
ps aux | grep "node\|ts-node" | grep -v grep

# Database connectivity
redis-cli -p 6379 ping
curl http://localhost:8080/v1/.well-known/ready
curl http://localhost:7475
```

---

## Live Monitoring Tools

### 1. Prisma Studio (Database GUI)
```bash
# Start Prisma Studio
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma studio --port 5555

# Access at: http://localhost:5555
```

**What to monitor in Prisma Studio:**
- **conversations** table: New conversation records
- **conversation_messages** table: User and assistant messages
- **users** table: User accounts and profiles
- **cards** table: Generated cards and their states

### 2. Redis Monitoring
```bash
# Redis CLI for live monitoring
redis-cli -p 6379

# Inside Redis CLI:
MONITOR                    # Live command monitoring
KEYS *                     # See all keys
GET "some-key"            # Get specific key value
INFO memory               # Memory usage stats

# Monitor Redis from terminal
redis-cli -p 6379 --latency-history -i 1
```

**What to monitor in Redis:**
- Turn context storage: `turn_context:*`
- Session data: `session:*`
- Background job queues
- Cache entries

### 3. Neo4j Browser
```bash
# Access Neo4j Browser at: http://localhost:7475
# Login: neo4j / password123
```

**Useful Cypher queries:**
```cypher
// Show all nodes and relationships
MATCH (n) RETURN n LIMIT 25

// Show user concepts
MATCH (u:User)-[:HAS_CONCEPT]->(c:Concept) RETURN u, c

// Show conversation flows
MATCH (conv:Conversation)-[:HAS_MESSAGE]->(msg:Message) RETURN conv, msg
```

### 4. Weaviate Monitoring
```bash
# Check Weaviate status
curl http://localhost:8080/v1/.well-known/ready

# List all classes
curl http://localhost:8080/v1/schema

# Query specific class
curl http://localhost:8080/v1/objects?class=UserMemory&limit=10
```

### 5. Terminal Log Monitoring

**API Gateway Logs:**
```bash
cd apps/api-gateway
pnpm dev 2>&1 | tee api-gateway.log

# In another terminal, monitor logs
tail -f api-gateway.log | grep -E "(🎯|✅|❌|🔧|📝)"
```

**LLM Interaction Logs:**
Look for these log patterns:
- `🤖 LLMChatTool - FINAL ASSEMBLED PROMPT`: Complete prompt sent to LLM
- `🎯 LLMChatTool - RAW LLM RESPONSE`: Raw response from Gemini
- `📊 LLMChatTool - Usage stats`: Token usage and costs
- `[da_*] Starting turn processing`: DialogueAgent processing start
- `[da_*] Decision: Respond Directly`: DialogueAgent decision making

**Database Recording Logs:**
- `📝 ConversationController - Recording user message`: Message being saved
- `✅ ConversationController - User message recorded`: Successful save
- `❌ ConversationController - Failed to record`: Database errors

### 6. Worker Monitoring
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
2. Check `conversations` table for new record
3. Check `conversation_messages` table for user and assistant messages
4. Verify `conversation_id` matches between tables

### 4. Redis Context Verification
```bash
redis-cli -p 6379
KEYS "*turn_context*"
GET "turn_context:conversation-id-here"
```

### 5. LLM Integration Test
```bash
# Test with actual AI processing
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "message": "What is the meaning of life?",
    "context": {
      "session_id": "llm-test-session"
    }
  }'
```

Check logs for:
- Prompt building process
- LLM API call
- Response parsing
- Database recording

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use
```bash
# Find and kill process on port
lsof -ti:3001 | xargs kill -9

# Or use different port
export PORT=3002
pnpm dev
```

#### 2. Database Connection Failed
```bash
# Check if PostgreSQL container is running
docker compose ps postgres

# Check connection string
echo $DATABASE_URL

# Test direct connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

#### 3. Prisma Schema Not Found
```bash
# Ensure you're in the right directory
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma studio --port 5555
```

#### 4. Redis Connection Errors
```bash
# Check Redis container
docker compose logs redis

# Test Redis connection
redis-cli -p 6379 ping

# Check for hostname resolution issues in logs
# If you see "getaddrinfo ENOTFOUND redis", it means the app is trying to connect to Docker hostname instead of localhost
```

#### 5. Build Failures
```bash
# Clean and rebuild
pnpm store prune
rm -rf node_modules package-lock.json yarn.lock
pnpm install
pnpm build
```

#### 6. Docker Issues
```bash
# Reset Docker completely
docker compose down --remove-orphans
docker system prune -a --volumes
docker network create 2d1l_network
docker compose up -d postgres neo4j weaviate redis
```

### Debugging Tools

#### 1. Verbose Logging
```bash
# Enable debug mode
export DEBUG=*
export NODE_ENV=development
pnpm dev
```

#### 2. Database Query Logging
```bash
# Enable Prisma query logging
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line?schema=public&logging=true"
```

#### 3. Docker Container Inspection
```bash
# Check container logs
docker compose logs -f postgres
docker compose logs -f redis

# Execute commands inside containers
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line
docker exec -it redis-2d1l redis-cli
```

### Emergency Reset Procedure

If everything breaks, follow this sequence:

```bash
# 1. Stop everything
pkill -f "node"
docker compose down --remove-orphans

# 2. Clean everything
rm -rf node_modules dist .turbo .next
rm -rf postgres_data neo4j_data weaviate_data redis_data
docker system prune -a --volumes

# 3. Start fresh
docker network create 2d1l_network
pnpm install
docker compose up -d postgres neo4j weaviate redis

# 4. Wait for services to be ready (30-60 seconds)
sleep 60

# 5. Setup database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm db:migrate:dev

# 6. Build and start
pnpm build
cd apps/api-gateway && pnpm dev
```

---

## Development Workflow

### Daily Development Routine

1. **Start databases** (if not already running):
   ```bash
   docker compose up -d postgres neo4j weaviate redis
   ```

2. **Start monitoring tools**:
   ```bash
   # Terminal 1: Prisma Studio
   cd packages/database && export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line" && pnpm prisma studio --port 5555
   
   # Terminal 2: Redis monitoring
   redis-cli -p 6379 MONITOR
   ```

3. **Start development servers**:
   ```bash
   # Terminal 3: API Gateway
   cd apps/api-gateway && export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line" && pnpm dev
   
   # Terminal 4: Web App
   cd apps/web-app && pnpm dev
   
   # Terminal 5: Workers (optional)
   cd workers/conversation-timeout-worker && export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line" && pnpm dev
   ```

### Monitoring Checklist

- [ ] Prisma Studio shows database activity
- [ ] Redis MONITOR shows cache operations
- [ ] API Gateway logs show request processing
- [ ] Neo4j Browser accessible at http://localhost:7475
- [ ] Weaviate API responding at http://localhost:8080
- [ ] Web app accessible at http://localhost:3000
- [ ] API Gateway accessible at http://localhost:3001

---

This guide covers the complete setup and monitoring workflow for the 2dots1line V9.7 system. Keep this document updated as the system evolves and new monitoring requirements emerge. 