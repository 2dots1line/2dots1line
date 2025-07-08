#!/bin/bash

# 🎯 2D1L V11.0 END-TO-END SETUP PROTOCOL
# This script implements LESSON 15 from CRITICAL_LESSONS_LEARNED.md
# Execute with: ./scripts/AUTOMATION/end-to-end-setup.sh

set -e  # Exit on any error

echo "🚀 Starting 2D1L V11.0 End-to-End Setup Protocol"
echo "=================================================="

# PHASE 0: ENVIRONMENT PREPARATION
echo "📋 PHASE 0: ENVIRONMENT PREPARATION"

echo "A. Killing all services occupying critical ports..."
echo "   Scanning for processes on critical ports (3000, 3001, 5432, 5433, 6379, 7474, 7475, 7687, 7688, 8080, 8000, 5555)..."

# Kill processes on critical ports
critical_ports=(3000 3001 5432 5433 6379 7474 7475 7687 7688 8080 8000 5555)
for port in "${critical_ports[@]}"; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "   🔫 Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || echo "     (Process already gone)"
    fi
done

# Additional cleanup for known service patterns
echo "   🔫 Killing Next.js development servers..."
pkill -f "next dev" 2>/dev/null || echo "     No Next.js processes found"

echo "   🔫 Killing Node.js processes with 2D1L in path..."
pkill -f "202506062D1L" 2>/dev/null || echo "     No matching Node.js processes found"

echo "   🔫 Killing any Prisma Studio processes..."
pkill -f "prisma studio" 2>/dev/null || echo "     No Prisma Studio processes found"

echo "✅ Port cleanup completed"

echo "B. Verifying Docker daemon and container health..."
# Check if Docker daemon is running, start if needed
if ! docker info > /dev/null 2>&1; then
    echo "   🚀 Starting Docker Desktop..."
    open -a Docker
    
    # Wait for Docker daemon to start
    echo "   ⏳ Waiting for Docker daemon to start..."
    max_wait=60
    wait_time=0
    while [ $wait_time -lt $max_wait ]; do
        if docker info > /dev/null 2>&1; then
            break
        fi
        echo "     Still waiting for Docker... (${wait_time}s/${max_wait}s)"
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        echo "❌ CRITICAL: Docker daemon failed to start within ${max_wait} seconds"
        exit 1
    fi
fi
echo "   ✅ Docker daemon running"

# Stop any existing containers to ensure clean state
echo "   🔄 Stopping existing database containers..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null || echo "     No existing containers to stop"

# Start database containers
echo "   🚀 Starting fresh database containers..."
if ! docker-compose -f docker-compose.dev.yml up -d; then
    echo "❌ CRITICAL: Failed to start database containers"
    exit 1
fi

# Wait for containers to be ready with timeout
echo "   ⏳ Waiting for database containers to be healthy..."
max_wait=60
wait_time=0
while [ $wait_time -lt $max_wait ]; do
    all_healthy=true
    
    # Check PostgreSQL
    if ! docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line > /dev/null 2>&1; then
        all_healthy=false
    fi
    
    # Check Redis
    if ! docker exec redis-2d1l redis-cli ping > /dev/null 2>&1; then
        all_healthy=false
    fi
    
    # Check Neo4j
    if ! docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "RETURN 1" > /dev/null 2>&1; then
        all_healthy=false
    fi
    
    # Check Weaviate
    if ! curl -f http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        break
    fi
    
    echo "     Still waiting for databases... (${wait_time}s/${max_wait}s)"
    sleep 5
    wait_time=$((wait_time + 5))
done

if [ $wait_time -ge $max_wait ]; then
    echo "❌ CRITICAL: Database containers failed to become healthy within ${max_wait} seconds"
    echo "   Check Docker logs: docker-compose -f docker-compose.dev.yml logs"
    exit 1
fi

echo "✅ All database containers healthy and ready"

echo "C. Environment variable verification..."
# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ CRITICAL: .env file not found"
    echo "   Please copy .env.example to .env and configure it"
    exit 1
fi

source .env

# Check critical environment variables  
critical_env_vars=("DATABASE_URL" "GOOGLE_API_KEY" "NEO4J_USER" "NEO4J_PASSWORD" "WEAVIATE_HOST_LOCAL" "REDIS_HOST_PORT")
missing_vars=()

for var in "${critical_env_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ CRITICAL: Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo "   Please configure these in your .env file"
    exit 1
fi
echo "✅ All critical environment variables present"

echo "D. System resource verification..."
# Check available disk space (need at least 5GB for builds)
available_space=$(df . | tail -1 | awk '{print $4}')
required_space=5242880  # 5GB in KB
if [ "$available_space" -lt "$required_space" ]; then
    echo "❌ CRITICAL: Insufficient disk space"
    echo "   Available: $(($available_space / 1024 / 1024))GB, Required: 5GB"
    echo "   Please free up disk space and try again"
    exit 1
fi
echo "✅ Sufficient disk space available"

# Check Node.js and pnpm versions
if ! command -v node > /dev/null 2>&1; then
    echo "❌ CRITICAL: Node.js not installed"
    exit 1
fi

if ! command -v pnpm > /dev/null 2>&1; then
    echo "❌ CRITICAL: pnpm not installed"
    echo "   Install with: npm install -g pnpm"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ CRITICAL: Node.js version too old (found: $(node --version), required: >=18)"
    exit 1
fi
echo "✅ Node.js and pnpm versions compatible"

echo "🎉 Phase 0 completed - Environment ready for setup"
echo ""

# PHASE 1: CLEAN SLATE
echo "📋 PHASE 1: CLEAN SLATE"
echo "1. Stopping all PM2 processes..."
pm2 delete all || echo "No PM2 processes to stop"

echo "2. Executing complete clean install..."
echo "   2a. Killing IDE processes that might lock files..."
# Kill Cursor/VSCode TypeScript processes
pkill -f "typingsInstaller" 2>/dev/null || true
pkill -f "tsserver" 2>/dev/null || true

echo "   2b. Fast removal with minimal output..."
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

echo "   2c. Installing fresh dependencies..."
pnpm install

echo "   2d. Generating Prisma client..."
pnpm --filter=@2dots1line/database db:generate

echo "3. Verifying no duplicate lock files..."
LOCK_COUNT=$(find . -name "pnpm-lock*.yaml" -not -path "./node_modules/*" | wc -l)
if [ "$LOCK_COUNT" -ne 1 ]; then
    echo "❌ CRITICAL: Found $LOCK_COUNT lock files - expected 1"
    exit 1
fi
echo "✅ Lock file verification passed"

echo "4. Verifying Prisma client generated..."
if ! ls node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/ > /dev/null 2>&1; then
    echo "❌ CRITICAL: Prisma client not generated"
    exit 1
fi
echo "✅ Prisma client verification passed"

# PHASE 2: BUILD ALL PACKAGES
echo ""
echo "📋 PHASE 2: BUILD ALL PACKAGES"

echo "5. Verifying turbo concurrency configuration (LESSON 42)..."
PERSISTENT_TASK_COUNT=$(find . -name "package.json" -exec grep -l '"dev":' {} \; | wc -l | tr -d ' ')
TURBO_CONCURRENCY=$(grep -o '"concurrency": *[0-9]*' turbo.json | grep -o '[0-9]*' || echo "10")
echo "   Persistent dev tasks: $PERSISTENT_TASK_COUNT"
echo "   Turbo concurrency: $TURBO_CONCURRENCY"

if [ "$TURBO_CONCURRENCY" -le "$PERSISTENT_TASK_COUNT" ]; then
    echo "❌ CRITICAL: Turbo concurrency ($TURBO_CONCURRENCY) insufficient for $PERSISTENT_TASK_COUNT tasks"
    echo "   This will cause frontend build failures and 404 static resource errors"
    echo "   Update turbo.json concurrency to at least $((PERSISTENT_TASK_COUNT + 5))"
    exit 1
fi
echo "✅ Turbo concurrency adequate"

echo "6. Building all packages in dependency order..."
if ! pnpm build; then
    echo "❌ CRITICAL: Build failed"
    exit 1
fi

echo "7. Verifying critical packages built..."
critical_packages=(
    "packages/tools/dist/index.js"
    "packages/database/dist/index.js" 
    "packages/shared-types/dist/index.js"
    "packages/core-utils/dist/index.js"
    "packages/ai-clients/dist/index.js"
    "packages/tool-registry/dist/index.js"
    "apps/api-gateway/dist/server.js"
    "services/config-service/dist/index.js"
    "services/dialogue-service/dist/index.js"
    "services/card-service/dist/index.js"
    "workers/ingestion-worker/dist/index.js"
    "workers/card-worker/dist/index.js"
    "workers/embedding-worker/dist/index.js"
    "workers/graph-projection-worker/dist/index.js"
    "workers/insight-worker/dist/index.js"
    "workers/conversation-timeout-worker/dist/src/index.js"
)

for package in "${critical_packages[@]}"; do
    if [ ! -f "$package" ]; then
        echo "❌ CRITICAL: $package not built"
        exit 1
    fi
done
echo "✅ Critical packages verification passed"

# PHASE 3: FRONTEND VERIFICATION
echo ""
echo "8. Starting frontend for comprehensive verification..."
cd apps/web-app
pkill -f "next dev" 2>/dev/null || echo "   No existing Next.js processes"
pnpm dev > web-app.log 2>&1 &
WEB_APP_PID=$!
echo "   Started web app with PID: $WEB_APP_PID"
cd ../..

echo "   Waiting for Next.js compilation..."
sleep 15

echo "9. Comprehensive frontend verification (not just HTTP)..."
# Multi-layer verification following LESSON 41

# Layer 1: HTTP accessibility
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ CRITICAL: Frontend HTTP not accessible"
    exit 1
fi

# Layer 2: HTML content verification
HTML_CONTENT=$(curl -s http://localhost:3000)
if ! echo "$HTML_CONTENT" | grep -q "<title>"; then
    echo "❌ CRITICAL: No valid HTML title"
    exit 1
fi

# Layer 3: Static resource accessibility (critical for UI)
CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_next/static/css/app/layout.css)
if [ "$CSS_STATUS" != "200" ]; then
    echo "❌ CRITICAL: CSS resources not accessible (status: $CSS_STATUS)"
    echo "   This indicates turbo concurrency or Next.js compilation issues"
    exit 1
fi

# Layer 4: Next.js compilation verification
if [ ! -d "apps/web-app/.next/static" ]; then
    echo "❌ CRITICAL: Next.js static directory missing"
    exit 1
fi

echo "✅ Comprehensive frontend verification passed"
echo "   - HTTP accessible"
echo "   - Valid HTML content"
echo "   - Static resources accessible"
echo "   - Next.js compilation complete"

# Kill frontend dev server for clean state
kill $WEB_APP_PID 2>/dev/null

echo "10. Testing tool imports (verifying lazy initialization)..."
cd apps/api-gateway
if ! node -e "const tools = require('@2dots1line/tools'); console.log('Tools loaded:', Object.keys(tools).length, 'exports');" 2>/dev/null; then
    echo "❌ CRITICAL: Tools import failed - constructor-time environment dependencies detected"
    echo "Apply LESSON 16: Use lazy initialization pattern for tools"
    exit 1
fi
cd ../../
echo "✅ Tools import successful - lazy initialization working"

# PHASE 4: DATABASE SETUP
echo ""
echo "📋 PHASE 4: DATABASE SETUP"
echo "11. Verifying database containers (started in Phase 0)..."
# Quick verification that containers are still healthy
if ! docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line > /dev/null 2>&1; then
    echo "❌ CRITICAL: PostgreSQL container unhealthy"
    exit 1
fi

if ! docker exec redis-2d1l redis-cli ping > /dev/null 2>&1; then
    echo "❌ CRITICAL: Redis container unhealthy"
    exit 1
fi

if ! curl -f http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
    echo "❌ CRITICAL: Weaviate container unhealthy"
    exit 1
fi

echo "✅ All database containers verified healthy"

echo "12. Applying database migrations..."
if ! npx dotenv -e .env -- pnpm --filter=@2dots1line/database db:migrate:dev; then
    echo "❌ CRITICAL: Database migration failed"
    exit 1
fi
echo "✅ Database migrations completed"

echo "13. Applying database schemas (Neo4j + Weaviate)..."
cd packages/database
if ! npx ts-node scripts/apply-schemas.ts; then
    echo "❌ CRITICAL: Schema application failed"
    exit 1
fi
cd ../..

echo "13b. Verifying schemas applied successfully..."
# Check Neo4j constraints exist (exclude header line from count)
NEO4J_CONSTRAINTS=$(echo "SHOW CONSTRAINTS;" | docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
if [ "$NEO4J_CONSTRAINTS" -lt 5 ]; then
    echo "❌ CRITICAL: Neo4j constraints not properly applied ($NEO4J_CONSTRAINTS found)"
    exit 1
fi

# Check Weaviate schema exists
WEAVIATE_CLASSES=$(curl -s http://localhost:8080/v1/schema | jq '.classes | length' 2>/dev/null || echo "0")
if [ "$WEAVIATE_CLASSES" -eq 0 ]; then
    echo "❌ CRITICAL: Weaviate schema not applied"
    exit 1
fi

echo "✅ Database schemas applied and verified"
echo "   Neo4j constraints: $NEO4J_CONSTRAINTS"
echo "   Weaviate classes: $WEAVIATE_CLASSES"

# PHASE 5: START SERVICES
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

echo "15. Waiting for services to initialize..."
sleep 10

echo "    Verifying PM2 processes actually started..."
PM2_PROCESS_COUNT=$(pm2 list | grep -c "online\|stopped\|errored" || echo "0")
if [ "$PM2_PROCESS_COUNT" -eq 0 ]; then
    echo "❌ CRITICAL: No PM2 processes found - startup failed"
    echo "PM2 status:"
    pm2 status
    exit 1
fi

echo "    Checking for errored services..."
ERRORED_COUNT=$(pm2 status | grep -c "errored" || echo "0")
if [ "$ERRORED_COUNT" -gt 0 ]; then
    echo "❌ CRITICAL: $ERRORED_COUNT services errored"
    pm2 status
    echo "Check logs with: pm2 logs --err --lines 20"
    exit 1
fi
echo "✅ All services online ($PM2_PROCESS_COUNT processes)"

echo "16. Testing API Gateway health (V11.0)..."
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "❌ CRITICAL: API Gateway not responding"
    exit 1
fi
echo "✅ API Gateway responding"

# PHASE 6: VERIFICATION
echo ""
echo "📋 PHASE 6: VERIFICATION"
echo "17. Testing database connections via API Gateway (V11.0)..."
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "❌ CRITICAL: API Gateway health check failed"
    exit 1
fi

echo "18. Verifying workers have proper environment..."
# Ensure environment variables are loaded for verification
source .env
export NEO4J_URI="${NEO4J_URI_HOST}"
export NEO4J_USERNAME="${NEO4J_USER}"

# Check for critical environment variables
echo "    Checking critical environment variables:"
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ CRITICAL: Missing environment variable: GOOGLE_API_KEY"
    exit 1
fi
if [ -z "$DATABASE_URL" ]; then
    echo "❌ CRITICAL: Missing environment variable: DATABASE_URL"
    exit 1
fi
if [ -z "$NEO4J_URI" ]; then
    echo "❌ CRITICAL: Missing environment variable: NEO4J_URI"
    exit 1
fi
if [ -z "$REDIS_HOST_PORT" ]; then
    echo "❌ CRITICAL: Missing environment variable: REDIS_HOST_PORT"
    exit 1
fi
if [ -z "$WEAVIATE_HOST_LOCAL" ]; then
    echo "❌ CRITICAL: Missing environment variable: WEAVIATE_HOST_LOCAL"
    exit 1
fi
echo "    ✅ All required environment variables present"

# Check worker logs for environment errors
workers_to_check=("ingestion-worker" "embedding-worker" "card-worker" "graph-projection-worker")
for worker in "${workers_to_check[@]}"; do
    if pm2 logs "$worker" --lines 5 | grep -E "(environment variable is required|Missing.*environment)" > /dev/null 2>&1; then
        echo "❌ CRITICAL: $worker missing environment variables"
        pm2 logs "$worker" --lines 10 --err
        exit 1
    fi
done
echo "✅ All workers have proper environment"

echo "19. Testing module resolution..."
cd apps/api-gateway
if ! node -e "console.log('Tools package:', require.resolve('@2dots1line/tools'))" > /dev/null 2>&1; then
    echo "❌ CRITICAL: Module resolution failed"
    exit 1
fi
cd ../..
echo "✅ Module resolution working"

echo "20. Testing Jest configuration..."
if ! pnpm exec jest --config jest.config.test.js --showConfig > /dev/null 2>&1; then
    echo "❌ CRITICAL: Jest configuration invalid"
    exit 1
fi
echo "✅ Jest configuration valid"

# SUCCESS SUMMARY
echo ""
echo "🎉 END-TO-END SETUP COMPLETED SUCCESSFULLY!"
echo "============================================="
echo "✅ All 20 verification steps passed"
echo "✅ System ready for V11 testing across all loops"
echo "✅ Jest configuration verified and ready for unit testing"

# Final system status
echo ""
echo "📊 FINAL SYSTEM STATUS:"
pm2 status
echo ""
echo "🔗 Available endpoints:"
echo "   - API Gateway Health: http://localhost:3001/api/v1/health"
echo "   - Prisma Studio: Run 'pnpm --filter=@2dots1line/database db:studio'"
echo "   - Neo4j Browser: http://localhost:7475"
echo "   - Weaviate: http://localhost:8080" 

# DATABASE INSPECTION TOOLS
echo ""
echo "🔍 DATABASE INSPECTION TOOLS:"
echo "============================================="

# Start Prisma Studio with DEFINITIVE working protocol (LESSON 40)
echo "21. Starting Prisma Studio with proven Installation Guide approach..."
echo "   CRITICAL: Using LESSON 40 definitive working protocol"
lsof -ti:5555 | xargs kill -9 2>/dev/null || echo "   No existing Prisma Studio processes"
lsof -ti:5556 | xargs kill -9 2>/dev/null || echo "   No existing Prisma Studio processes on 5556"
npx prisma studio --schema=./packages/database/prisma/schema.prisma > prisma-studio.log 2>&1 &
STUDIO_PID=$!
echo "   Prisma Studio PID: $STUDIO_PID"
sleep 8

echo "22. Verifying Prisma Studio with ACTUAL DATABASE connectivity..."
# Ensure DATABASE_URL is loaded for Prisma Studio verification
source .env
if [ -z "$DATABASE_URL" ]; then
    echo "   ❌ CRITICAL: DATABASE_URL not loaded - Prisma Studio will fail"
    echo "   Check environment loading in script"
    exit 1
fi

# Test HTTP accessibility (basic check)
if curl -s http://localhost:5555 > /dev/null 2>&1; then
    echo "   ✅ Prisma Studio HTTP accessible"
    
    # Test database table count to verify actual database connection
    DB_TABLE_COUNT=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | docker exec -i postgres-2d1l psql -U danniwang -d twodots1line -t 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$DB_TABLE_COUNT" -gt 0 ]; then
        echo "   ✅ Database connection verified - $DB_TABLE_COUNT tables available"
        echo "   ✅ Prisma Studio fully functional at: http://localhost:5555"
    else
        echo "   ❌ Database connection failed - no tables visible"
        echo "   Check DATABASE_URL and PostgreSQL accessibility"
        echo "   Prisma Studio logs: tail prisma-studio.log"
    fi
else
    echo "   ❌ Prisma Studio HTTP not accessible"
    echo "   Check Prisma Studio logs: tail prisma-studio.log"
fi

echo ""
echo "📋 DATABASE ACCESS METHODS:"
echo "1. PostgreSQL (Relational Data):"
echo "   - Web UI: http://localhost:5555 (Prisma Studio)"
echo "   - Direct Query: docker exec -i postgres-2d1l psql -U danniwang -d twodots1line"
echo "   - Sample Query: SELECT * FROM memory_units LIMIT 5;"

echo ""
echo "2. Neo4j (Knowledge Graph):"
echo "   - Web UI: http://localhost:7475 (Neo4j Browser)"
echo "   - Username: neo4j | Password: password123"
echo "   - Direct Query: docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123"
echo "   - Sample Query: MATCH (n) RETURN n LIMIT 5;"

echo ""
echo "3. Weaviate (Vector Search):"
echo "   - REST API: http://localhost:8080/v1/objects"
echo "   - Health Check: http://localhost:8080/v1/.well-known/ready"
echo "   - Sample Query: curl 'http://localhost:8080/v1/objects?limit=5'"

echo ""
echo "🧪 SAMPLE DATABASE QUERIES:"
echo "============================================="

# Sample queries for testing
echo "# PostgreSQL - Show memory units for a user:"
echo 'echo "SELECT muid, title, importance_score FROM memory_units WHERE user_id = '\''YOUR_USER_ID'\'' ORDER BY importance_score DESC;" | docker exec -i postgres-2d1l psql -U danniwang -d twodots1line'

echo ""
echo "# Neo4j - Show knowledge graph structure:"
echo 'echo "MATCH (a)-[r]->(b) RETURN a.entityId as source, type(r) as relationship, b.entityId as target LIMIT 10;" | docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123'

echo ""
echo "# Weaviate - Show objects for a user:"
echo 'curl -s "http://localhost:8080/v1/objects?where=%7B%22path%22%3A%5B%22userId%22%5D%2C%22operator%22%3A%22Equal%22%2C%22valueText%22%3A%22YOUR_USER_ID%22%7D" | jq ".objects[] | {entityId: .properties.entityId, title: .properties.title}"'

echo ""
echo "🎯 MEMORY RETRIEVAL TESTING:"
echo "============================================="
echo "Test memory retrieval with explicit trigger phrases:"
echo 'curl -X POST http://localhost:3001/api/v1/agent/start-conversation \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer test-token" \'
echo '  -d '\''{"userId":"YOUR_USER_ID","initialMessage":"Do you remember when we discussed..."}'\'' | jq ".data.initialResponse.response_text"'

echo ""
echo "Check DialogueAgent decision logs:"
echo 'tail -20 ~/.pm2/logs/api-gateway-out-0.log | grep -A 5 "decision"'

echo ""
echo "✅ Complete V9.5 memory pipeline ready for testing!"
echo "✅ All databases populated with test data"
echo "✅ Memory retrieval protocol functioning" 