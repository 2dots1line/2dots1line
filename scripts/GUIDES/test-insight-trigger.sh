#!/bin/bash
# Test Insight Worker Trigger and Monitoring Script
# This script demonstrates the complete workflow for triggering and monitoring insight worker jobs

set -e  # Exit on any error

echo "🧪 Testing Insight Worker Trigger and Monitoring"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
check_service() {
    local service_name=$1
    if pm2 jlist | jq -e ".[] | select(.name==\"$service_name\" and .pm2_env.status==\"online\")" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to wait for user input
wait_for_user() {
    echo -e "\n${YELLOW}Press Enter to continue to the next step...${NC}"
    read -r
}

echo -e "\n${BLUE}Step 1: Checking Prerequisites${NC}"
echo "----------------------------------------"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "ecosystem.config.js" ]; then
    print_status "error" "This script must be run from the 2D1L project root directory"
    exit 1
fi

# Check if required commands exist
for cmd in node pm2 redis-cli docker; do
    if command_exists "$cmd"; then
        print_status "success" "$cmd is available"
    else
        print_status "error" "$cmd is not available"
        exit 1
    fi
done

# Check if insight worker is running
if check_service "insight-worker"; then
    print_status "success" "Insight worker is running"
else
    print_status "warning" "Insight worker is not running"
    echo "Starting all services..."
    pm2 start ecosystem.config.js
    sleep 5
    
    if check_service "insight-worker"; then
        print_status "success" "Insight worker started successfully"
    else
        print_status "error" "Failed to start insight worker"
        exit 1
    fi
fi

wait_for_user

echo -e "\n${BLUE}Step 2: Checking Current System Status${NC}"
echo "---------------------------------------------"

# Show current PM2 status
echo "PM2 Services Status:"
pm2 status | grep -E "(insight-worker|api-gateway)" || true

# Check Redis queue status
echo -e "\nRedis Queue Status:"
redis-cli -h localhost -p 6379 LLEN bull:insight 2>/dev/null || echo "Redis not accessible"

# Check current LLM interactions count
echo -e "\nCurrent LLM Interactions Count:"
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) as total_records FROM llm_interactions WHERE worker_type = 'insight-worker';" 2>/dev/null || echo "Database not accessible"

wait_for_user

echo -e "\n${BLUE}Step 3: Triggering Insight Worker Job${NC}"
echo "--------------------------------------------"

# Trigger the insight job
echo "Running trigger script..."
if node scripts/GUIDES/trigger-insight.js; then
    print_status "success" "Insight job triggered successfully"
else
    print_status "error" "Failed to trigger insight job"
    exit 1
fi

wait_for_user

echo -e "\n${BLUE}Step 4: Monitoring Job Processing${NC}"
echo "----------------------------------------"

# Show real-time monitoring for 30 seconds
echo "Monitoring job processing for 30 seconds..."
echo "Press Ctrl+C to stop monitoring early"

# Function to show current status
show_status() {
    echo -e "\n${YELLOW}=== Current Status $(date '+%H:%M:%S') ===${NC}"
    
    # Queue status
    local queue_length=$(redis-cli -h localhost -p 6379 LLEN bull:insight 2>/dev/null || echo "N/A")
    echo "Queue length: $queue_length"
    
    # Worker status
    if check_service "insight-worker"; then
        echo "Worker status: Running"
    else
        echo "Worker status: Stopped"
    fi
    
    # Recent logs
    echo "Recent worker logs:"
    pm2 logs insight-worker --lines 3 2>/dev/null | tail -3 || echo "No logs available"
    
    echo "----------------------------------------"
}

# Monitor for 30 seconds with updates every 5 seconds
for i in {1..6}; do
    show_status
    if [ $i -lt 6 ]; then
        sleep 5
    fi
done

wait_for_user

echo -e "\n${BLUE}Step 5: Verifying Job Completion${NC}"
echo "----------------------------------------"

# Check final queue status
echo "Final queue status:"
redis-cli -h localhost -p 6379 LLEN bull:insight 2>/dev/null || echo "Redis not accessible"

# Check for new LLM interactions
echo -e "\nNew LLM interactions:"
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  interaction_id,
  worker_type,
  worker_job_id,
  LEFT(full_prompt, 50) as prompt_preview,
  created_at
FROM llm_interactions 
WHERE worker_type = 'insight-worker' 
  AND created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC 
LIMIT 3;" 2>/dev/null || echo "Database not accessible"

wait_for_user

echo -e "\n${BLUE}Step 6: Summary and Next Steps${NC}"
echo "----------------------------------------"

print_status "success" "Test completed successfully!"
echo -e "\n${BLUE}What you've learned:${NC}"
echo "1. How to check if the insight worker is running"
echo "2. How to trigger insight worker jobs manually"
echo "3. How to monitor job processing in real-time"
echo "4. How to verify job completion and LLM logging"
echo "5. How to troubleshoot common issues"

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Review the complete guide: scripts/GUIDES/INSIGHT_WORKER_TRIGGER_GUIDE.md"
echo "2. Practice triggering jobs with different user IDs"
echo "3. Set up automated monitoring with the provided scripts"
echo "4. Explore the troubleshooting section for common issues"

echo -e "\n${GREEN}🎉 You're now ready to work with the insight worker!${NC}"
