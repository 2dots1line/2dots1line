#!/bin/bash

# Real-time LLM and Worker Monitoring Script
# Monitors workers, LLM calls, Redis queues, and system health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
LOG_DIR="./logs"
MONITOR_INTERVAL=3

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo -e "${CYAN}🔍 2dots1line V11.0 Real-Time Monitoring Dashboard${NC}"
echo -e "${CYAN}================================================${NC}"
echo -e "${YELLOW}Monitoring interval: ${MONITOR_INTERVAL}s${NC}"
echo -e "${YELLOW}Log directory: $LOG_DIR${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop monitoring${NC}"
echo ""

# Function to get timestamp
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Function to check if Redis is available
check_redis() {
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to monitor Docker containers
monitor_docker() {
    echo -e "${BLUE}🐳 Docker Services Status:${NC}"
    if command -v docker >/dev/null 2>&1; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(dialogue|ingestion|insight|worker|service)" || echo "No worker containers found"
    else
        echo "Docker not available"
    fi
    echo ""
}

# Function to monitor Redis queues
monitor_redis_queues() {
    if check_redis; then
        echo -e "${PURPLE}📊 Redis Queue Status:${NC}"
        
        # Get queue lengths
        queues=("ingestion_queue" "insight_queue" "embedding_queue" "notification_queue" "maintenance_queue")
        
        for queue in "${queues[@]}"; do
            length=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" llen "$queue" 2>/dev/null || echo "0")
            echo -e "  ${queue}: ${length} jobs"
        done
        
        # Get recent Redis keys
        echo -e "\n${PURPLE}🔑 Recent Redis Keys:${NC}"
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" keys "*" | grep -E "(turn_context|session|user)" | head -5 | while read key; do
            echo -e "  $key"
        done
    else
        echo -e "${RED}❌ Redis not available${NC}"
    fi
    echo ""
}

# Function to monitor log files
monitor_logs() {
    echo -e "${GREEN}📝 Recent Log Activity:${NC}"
    
    # Monitor various log sources
    log_sources=(
        "docker-compose logs --tail=5 dialogue-service 2>/dev/null || echo 'No dialogue-service logs'"
        "docker-compose logs --tail=5 ingestion-worker 2>/dev/null || echo 'No ingestion-worker logs'"
        "docker-compose logs --tail=5 insight-worker 2>/dev/null || echo 'No insight-worker logs'"
        "docker-compose logs --tail=5 embedding-worker 2>/dev/null || echo 'No embedding-worker logs'"
    )
    
    for log_cmd in "${log_sources[@]}"; do
        eval "$log_cmd" | while IFS= read -r line; do
            # Color code different types of log messages
            if [[ $line == *"LLM"* ]] || [[ $line == *"gemini"* ]]; then
                echo -e "  ${CYAN}🤖 $line${NC}"
            elif [[ $line == *"ERROR"* ]] || [[ $line == *"error"* ]]; then
                echo -e "  ${RED}❌ $line${NC}"
            elif [[ $line == *"SUCCESS"* ]] || [[ $line == *"success"* ]]; then
                echo -e "  ${GREEN}✅ $line${NC}"
            elif [[ $line == *"WARN"* ]] || [[ $line == *"warning"* ]]; then
                echo -e "  ${YELLOW}⚠️  $line${NC}"
            else
                echo -e "  📄 $line"
            fi
        done
    done
    echo ""
}

# Function to monitor LLM API calls
monitor_llm_calls() {
    echo -e "${CYAN}🤖 LLM API Activity:${NC}"
    
    # Check for recent LLM-related logs
    if command -v docker >/dev/null 2>&1; then
        # Look for LLM-related activity in recent logs
        llm_logs=$(docker-compose logs --tail=20 2>/dev/null | grep -i -E "(llm|gemini|model|chat|completion)" || echo "No recent LLM activity")
        
        if [[ "$llm_logs" != "No recent LLM activity" ]]; then
            echo "$llm_logs" | while IFS= read -r line; do
                # Extract and highlight model names
                if [[ $line == *"gemini"* ]]; then
                    model=$(echo "$line" | grep -o "gemini-[0-9.]*-[a-z]*" | head -1)
                    if [[ -n "$model" ]]; then
                        echo -e "  🎯 Using model: ${GREEN}$model${NC}"
                    fi
                fi
                
                # Highlight API calls
                if [[ $line == *"API"* ]] || [[ $line == *"request"* ]]; then
                    echo -e "  📡 $line"
                fi
            done
        else
            echo -e "  💤 No recent LLM activity detected"
        fi
    fi
    echo ""
}

# Function to monitor system resources
monitor_system() {
    echo -e "${BLUE}💻 System Resources:${NC}"
    
    # CPU and Memory usage
    if command -v docker >/dev/null 2>&1; then
        echo -e "  Docker containers: $(docker ps -q | wc -l | tr -d ' ') running"
        echo -e "  Docker memory: $(docker stats --no-stream --format "table {{.MemUsage}}" | tail -n +2 | awk '{sum+=$1} END {print sum "MB"}')"
    fi
    
    # Disk usage
    disk_usage=$(df -h . | awk 'NR==2 {print $5}')
    echo -e "  Disk usage: $disk_usage"
    
    echo ""
}

# Function to monitor environment configuration
monitor_config() {
    echo -e "${YELLOW}⚙️  Environment Configuration:${NC}"
    
    # Check LLM model configuration
    if [[ -f .env ]]; then
        echo -e "  📄 .env file found"
        
        # Extract LLM configuration
        if grep -q "LLM_CHAT_MODEL" .env; then
            chat_model=$(grep "LLM_CHAT_MODEL" .env | cut -d'=' -f2)
            echo -e "  🤖 Chat model: ${GREEN}$chat_model${NC}"
        fi
        
        if grep -q "LLM_VISION_MODEL" .env; then
            vision_model=$(grep "LLM_VISION_MODEL" .env | cut -d'=' -f2)
            echo -e "  👁️  Vision model: ${GREEN}$vision_model${NC}"
        fi
        
        if grep -q "GOOGLE_API_KEY" .env; then
            api_key_status=$(grep "GOOGLE_API_KEY" .env | cut -d'=' -f2 | wc -c)
            if [[ $api_key_status -gt 10 ]]; then
                echo -e "  🔑 API Key: ${GREEN}Configured${NC}"
            else
                echo -e "  🔑 API Key: ${RED}Not configured${NC}"
            fi
        fi
    else
        echo -e "  ❌ .env file not found"
    fi
    echo ""
}

# Function to monitor database connections
monitor_databases() {
    echo -e "${PURPLE}🗄️  Database Status:${NC}"
    
    # PostgreSQL
    if command -v docker >/dev/null 2>&1; then
        pg_status=$(docker-compose ps postgres 2>/dev/null | grep -c "Up" || echo "0")
        if [[ $pg_status -eq 1 ]]; then
            echo -e "  🐘 PostgreSQL: ${GREEN}Running${NC}"
        else
            echo -e "  🐘 PostgreSQL: ${RED}Not running${NC}"
        fi
    fi
    
    # Neo4j
    if command -v docker >/dev/null 2>&1; then
        neo4j_status=$(docker-compose ps neo4j 2>/dev/null | grep -c "Up" || echo "0")
        if [[ $neo4j_status -eq 1 ]]; then
            echo -e "  🕸️  Neo4j: ${GREEN}Running${NC}"
        else
            echo -e "  🕸️  Neo4j: ${RED}Not running${NC}"
        fi
    fi
    
    # Weaviate
    if command -v docker >/dev/null 2>&1; then
        weaviate_status=$(docker-compose ps weaviate 2>/dev/null | grep -c "Up" || echo "0")
        if [[ $weaviate_status -eq 1 ]]; then
            echo -e "  🔍 Weaviate: ${GREEN}Running${NC}"
        else
            echo -e "  🔍 Weaviate: ${RED}Not running${NC}"
        fi
    fi
    
    echo ""
}

# Main monitoring loop
main() {
    while true; do
        clear
        echo -e "${CYAN}🕐 $(timestamp) - 2dots1line V11.0 Monitoring Dashboard${NC}"
        echo -e "${CYAN}================================================${NC}"
        echo ""
        
        monitor_config
        monitor_docker
        monitor_databases
        monitor_redis_queues
        monitor_llm_calls
        monitor_system
        monitor_logs
        
        echo -e "${YELLOW}⏳ Refreshing in ${MONITOR_INTERVAL} seconds... (Ctrl+C to stop)${NC}"
        sleep "$MONITOR_INTERVAL"
    done
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${GREEN}✅ Monitoring stopped${NC}"; exit 0' INT

# Start monitoring
main
