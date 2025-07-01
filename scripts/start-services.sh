#!/bin/bash

# 2D1L Backend Services Startup Script
# Starts all required backend services for the authentication and dialogue pipeline

echo "🚀 Starting 2D1L Backend Services..."

# Load environment variables
if [ -f .env ]; then
  echo "📝 Loading environment variables from .env..."
  set -a  # automatically export all variables
  source .env
  set +a  # turn off automatic export
  echo "✅ Environment variables loaded"
  echo "🔍 DATABASE_URL: ${DATABASE_URL:0:50}..." # Show first 50 chars for verification
else
  echo "❌ .env file not found"
  exit 1
fi

# Check if databases are running
echo "📊 Checking database services..."
nc -z localhost 5433 >/dev/null 2>&1 || { echo "❌ PostgreSQL not accessible on 5433"; exit 1; }
nc -z localhost 6379 >/dev/null 2>&1 || { echo "❌ Redis not accessible on 6379"; exit 1; }
curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1 || { echo "❌ Weaviate not accessible on 8080"; exit 1; }
echo "✅ Database services are running"

# Generate Prisma client if needed
echo "🔄 Ensuring Prisma client is generated..."
cd packages/database && pnpm db:generate && cd ../..

# Create logs directory first
mkdir -p logs

# Start services in background
echo "🎯 Starting API Gateway..."
(cd apps/api-gateway && pnpm dev > ../../logs/api-gateway.log 2>&1) &
API_GATEWAY_PID=$!

echo "👤 Starting User Service..."
(cd services/user-service && pnpm dev > ../../logs/user-service.log 2>&1) &
USER_SERVICE_PID=$!

echo "💬 Starting Dialogue Service..."
(cd services/dialogue-service && pnpm dev > ../../logs/dialogue-service.log 2>&1) &
DIALOGUE_SERVICE_PID=$!

echo "🃏 Starting Card Service..."
(cd services/card-service && pnpm dev > ../../logs/card-service.log 2>&1) &
CARD_SERVICE_PID=$!

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health checks
echo "🔍 Performing health checks..."
curl -f http://localhost:3001/api/health >/dev/null 2>&1 && echo "✅ API Gateway (3001) OK" || echo "❌ API Gateway failed"
curl -f http://localhost:3003/api/health >/dev/null 2>&1 && echo "✅ User Service (3003) OK" || echo "❌ User Service failed"
curl -f http://localhost:3002/api/health >/dev/null 2>&1 && echo "✅ Dialogue Service (3002) OK" || echo "❌ Dialogue Service failed"
curl -f http://localhost:3004/api/health >/dev/null 2>&1 && echo "✅ Card Service (3004) OK" || echo "❌ Card Service failed"

echo "📝 Service PIDs:"
echo "  API Gateway: $API_GATEWAY_PID"
echo "  User Service: $USER_SERVICE_PID"
echo "  Dialogue Service: $DIALOGUE_SERVICE_PID"
echo "  Card Service: $CARD_SERVICE_PID"

echo ""
echo "🎉 Backend services startup complete!"
echo "💡 To stop all services: ./scripts/stop-services.sh"
echo "📋 To view logs: tail -f logs/*.log"
echo ""
echo "🧪 Test signup: curl -X POST http://localhost:3001/api/v1/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}'" 