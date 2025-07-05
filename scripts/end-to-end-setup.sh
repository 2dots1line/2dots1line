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
echo "5. Building all packages in dependency order..."
if ! pnpm build; then
    echo "❌ CRITICAL: Build failed"
    exit 1
fi

echo "6. Verifying critical packages built..."
for package in "packages/tools/dist/index.js" "packages/database/dist/index.js" "apps/api-gateway/dist/server.js"; do
    if [ ! -f "$package" ]; then
        echo "❌ CRITICAL: $package not built"
        exit 1
    fi
done
echo "✅ Critical packages verification passed"

# PHASE 3: BUILD AND VERIFY
echo "📋 PHASE 3: BUILD AND VERIFY"
echo "7. Building all packages..."
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ CRITICAL: Build failed"
    exit 1
fi
echo "✅ All packages built successfully"

echo "8. Testing tool imports (verifying lazy initialization)..."
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
echo "9. Starting database containers..."
docker-compose -f docker-compose.dev.yml up -d

echo "10. Waiting for databases to be ready..."
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
echo "✅ All databases ready"

echo "11. Applying database migrations..."
if ! npx dotenv -e .env -- pnpm --filter=@2dots1line/database db:migrate:dev; then
    echo "❌ CRITICAL: Database migration failed"
    exit 1
fi
echo "✅ Database migrations completed"

# PHASE 5: START SERVICES
echo ""
echo "📋 PHASE 5: START SERVICES"
echo "12. Starting all services with proper environment loading..."
if ! source .env && pm2 start ecosystem.config.js; then
    echo "❌ CRITICAL: Service startup failed"
    exit 1
fi

echo "13. Waiting for services to initialize..."
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

echo "14. Testing API Gateway health..."
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "❌ CRITICAL: API Gateway not responding"
    exit 1
fi
echo "✅ API Gateway responding"

# PHASE 6: VERIFICATION
echo ""
echo "📋 PHASE 6: VERIFICATION"
echo "15. Testing database connections via API Gateway..."
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "❌ CRITICAL: API Gateway health check failed"
    exit 1
fi

echo "16. Verifying ingestion workers have environment..."
if pm2 logs ingestion-worker --lines 5 | grep "environment variable is required" > /dev/null 2>&1; then
    echo "❌ CRITICAL: Ingestion workers missing environment variables"
    exit 1
fi
echo "✅ Ingestion workers have proper environment"

echo "17. Testing module resolution..."
cd apps/api-gateway
if ! node -e "console.log('Tools package:', require.resolve('@2dots1line/tools'))" > /dev/null 2>&1; then
    echo "❌ CRITICAL: Module resolution failed"
    exit 1
fi
cd ../..
echo "✅ Module resolution working"

# SUCCESS SUMMARY
echo ""
echo "🎉 END-TO-END SETUP COMPLETED SUCCESSFULLY!"
echo "============================================="
echo "✅ All 17 verification steps passed"
echo "✅ System ready for dialogue agent to ingestion analyst testing"

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