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

#### Start Prisma Studio (Background)
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma studio --port 5555 > /tmp/prisma-studio.log 2>&1 &
echo "🎯 Prisma Studio starting at http://localhost:5555"
cd ../..
```

#### Start API Gateway
```bash
cd apps/api-gateway
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm dev &
# Wait for startup
sleep 10
cd ../..
```

#### Start Dialogue Service (Simplified for Testing)
For initial testing, use a simple service. For production, follow the complex service setup guide.

#### Start Web Application
```bash
cd apps/web-app
export NEXT_PUBLIC_API_URL="http://localhost:3001"
pnpm dev &
# Wait for startup
sleep 15
cd ../..
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

## Live Monitoring Setup

### Access URLs
Once everything is running, you can access:

- **Web Application**: http://localhost:3000
- **API Gateway**: http://localhost:3001/api/health
- **Prisma Studio**: http://localhost:5555
- **Neo4j Browser**: http://localhost:7475 (neo4j/password123)
- **Weaviate Console**: http://localhost:8080/v1/meta

### Development Monitoring Commands
```bash
# Monitor all Node.js processes
ps aux | grep node | grep -v grep

# Monitor port usage
lsof -i :3000,3001,3002,5555,5433,6379,7475,7688,8080

# Monitor Docker containers
docker-compose ps
docker-compose logs --tail=50 postgres neo4j redis weaviate
```

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

# 3. Start development services
cd apps/api-gateway && pnpm dev &
cd ../web-app && pnpm dev &
cd ../../packages/database && pnpm prisma studio &

# 4. Open browser to http://localhost:3000
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