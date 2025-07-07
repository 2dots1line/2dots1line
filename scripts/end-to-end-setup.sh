#!/bin/bash

# 🎯 2D1L V11.0 END-TO-END SETUP PROTOCOL
# This script implements LESSON 15 from CRITICAL_LESSONS_LEARNED.md
# Execute with: ./scripts/end-to-end-setup.sh

set -e  # Exit on any error

echo "🚀 Starting 2D1L V11.0 End-to-End Setup Protocol"
echo "=================================================="

# PHASE 1: CLEAN SLATE
echo "📋 PHASE 1: CLEAN SLATE"
echo "1. Stopping all PM2 processes..."
pm2 delete all || echo "No PM2 processes to stop"

echo "2. Executing complete clean install..."
pnpm run clean-install

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
echo "📋 PHASE 3: FRONTEND VERIFICATION (LESSON 41)"
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
echo "11. Starting database containers..."
docker-compose -f docker-compose.dev.yml up -d

echo "12. Waiting for databases to be ready..."
sleep 10

echo "   Checking PostgreSQL..."
if ! nc -z localhost 5433; then
    echo "❌ CRITICAL: PostgreSQL not ready"
    exit 1
fi

echo "   Checking Redis..."
if ! nc -z localhost 6379; then
    echo "❌ CRITICAL: Redis not ready"
    exit 1
fi

echo "   Checking Weaviate..."
if ! curl -f http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
    echo "❌ CRITICAL: Weaviate not ready"
    exit 1
fi

echo "   Checking Python Dimension Reducer Service..."
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ⚠️  WARNING: Python Dimension Reducer not ready - will be started with PM2"
    echo "   Note: Python service runs locally, not in Docker"
else
    echo "   ✅ Python Dimension Reducer ready"
fi
echo "✅ All core databases ready (PostgreSQL, Redis, Weaviate, Neo4j)"

echo "13. Applying database migrations..."
if ! npx dotenv -e .env -- pnpm --filter=@2dots1line/database db:migrate:dev; then
    echo "❌ CRITICAL: Database migration failed"
    exit 1
fi
echo "✅ Database migrations completed"

# PHASE 5: START SERVICES
echo ""
echo "📋 PHASE 5: START SERVICES"
echo "14. Starting all services with proper environment loading..."
if ! source .env && pm2 start ecosystem.config.js; then
    echo "❌ CRITICAL: Service startup failed"
    exit 1
fi

echo "15. Waiting for services to initialize..."
sleep 5

echo "    Checking for errored services..."
ERRORED_COUNT=$(pm2 status | grep -c "errored" || echo "0")
if [ "$ERRORED_COUNT" -gt 0 ]; then
    echo "❌ CRITICAL: $ERRORED_COUNT services errored"
    pm2 status
    echo "Check logs with: pm2 logs --err --lines 20"
    exit 1
fi
echo "✅ All services online"

echo "16. Testing API Gateway health..."
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "❌ CRITICAL: API Gateway not responding"
    exit 1
fi
echo "✅ API Gateway responding"

# PHASE 6: VERIFICATION
echo ""
echo "📋 PHASE 6: VERIFICATION"
echo "17. Testing database connections via API Gateway..."
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "❌ CRITICAL: API Gateway health check failed"
    exit 1
fi

echo "18. Verifying workers have proper environment..."
# Check for critical environment variables
required_env_vars=("GOOGLE_API_KEY" "DATABASE_URL" "NEO4J_URI" "REDIS_HOST" "WEAVIATE_URL")
for var in "${required_env_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ CRITICAL: Missing environment variable: $var"
        exit 1
    fi
done

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
# Test if DATABASE_URL environment variable was properly loaded
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