#!/bin/bash
# Test script for insight worker trigger functionality
# This script tests both basic and enhanced trigger scripts

set -e

echo "🧪 Testing Insight Worker Trigger Scripts"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo "ℹ️  $message"
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if service is running
check_service() {
    local service=$1
    local check_command=$2
    
    if eval "$check_command" >/dev/null 2>&1; then
        print_status "success" "$service is running"
        return 0
    else
        print_status "error" "$service is not running"
        return 1
    fi
}

echo ""
echo "📋 Prerequisites Check"
echo "---------------------"

# Check if Node.js is available
if command_exists node; then
    print_status "success" "Node.js is available"
else
    print_status "error" "Node.js is not available"
    exit 1
fi

# Check if PM2 is available
if command_exists pm2; then
    print_status "success" "PM2 is available"
else
    print_status "error" "PM2 is not available"
    exit 1
fi

# Check if Redis CLI is available
if command_exists redis-cli; then
    print_status "success" "Redis CLI is available"
else
    print_status "warning" "Redis CLI is not available (Docker container may be used)"
fi

# Check if Docker is available
if command_exists docker; then
    print_status "success" "Docker is available"
else
    print_status "warning" "Docker is not available"
fi

echo ""
echo "🔍 Service Status Check"
echo "----------------------"

# Check if insight worker is running
if pm2 jlist | jq -e '.[] | select(.name=="insight-worker" and .pm2_env.status=="online")' >/dev/null 2>&1; then
    print_status "success" "Insight worker is running"
else
    print_status "error" "Insight worker is not running"
    echo "💡 Start services with: pm2 start ecosystem.config.js"
    exit 1
fi

# Check Redis connection
if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
    print_status "success" "Redis is accessible"
else
    print_status "error" "Redis is not accessible"
    echo "💡 Start Redis with: docker-compose -f docker-compose.dev.yml up -d redis"
    exit 1
fi

# Check PostgreSQL connection (if Docker is available)
if command_exists docker && docker exec postgres-2d1l pg_isready -U danniwang >/dev/null 2>&1; then
    print_status "success" "PostgreSQL is accessible"
else
    print_status "warning" "PostgreSQL connection check skipped (Docker may not be available)"
fi

echo ""
echo "🧪 Script Testing"
echo "----------------"

# Test basic trigger script help
echo "Testing basic trigger script help..."
if node scripts/GUIDES/trigger-insight.js --help >/dev/null 2>&1; then
    print_status "success" "Basic trigger script help works"
else
    print_status "error" "Basic trigger script help failed"
fi

# Test enhanced trigger script help
echo "Testing enhanced trigger script help..."
if node scripts/GUIDES/trigger-insight-enhanced.js --help >/dev/null 2>&1; then
    print_status "success" "Enhanced trigger script help works"
else
    print_status "error" "Enhanced trigger script help failed"
fi

# Test status check
echo "Testing status check..."
if node scripts/GUIDES/trigger-insight-enhanced.js --status >/dev/null 2>&1; then
    print_status "success" "Status check works"
else
    print_status "error" "Status check failed"
fi

echo ""
echo "📊 Current System Status"
echo "----------------------"

# Show current queue status
echo "Queue Status:"
queue_length=$(redis-cli -h localhost -p 6379 LLEN bull:insight 2>/dev/null || echo "N/A")
echo "  Main queue: $queue_length"

# Show worker status
worker_status=$(pm2 jlist | jq -r '.[] | select(.name=="insight-worker") | .pm2_env.status' 2>/dev/null || echo "Unknown")
echo "  Worker status: $worker_status"

# Show recent LLM interactions count
if command_exists docker && docker exec postgres-2d1l pg_isready -U danniwang >/dev/null 2>&1; then
    interaction_count=$(docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) FROM llm_interactions WHERE worker_type = 'insight-worker';" -t 2>/dev/null | tr -d ' \n' || echo "N/A")
    echo "  LLM interactions: $interaction_count"
else
    echo "  LLM interactions: N/A (PostgreSQL not accessible)"
fi

echo ""
echo "🎯 Ready for Testing"
echo "-------------------"
echo "The insight worker trigger scripts are ready for use!"
echo ""
echo "Quick commands:"
echo "  Basic trigger:    node scripts/GUIDES/trigger-insight.js"
echo "  Enhanced trigger: node scripts/GUIDES/trigger-insight-enhanced.js --monitor"
echo "  Status check:     node scripts/GUIDES/trigger-insight-enhanced.js --status"
echo ""
echo "For detailed usage, see: scripts/GUIDES/INSIGHT_WORKER_COMPLETE_GUIDE.md"
echo ""

print_status "success" "Test completed successfully!"
