#!/bin/bash

# Specialized LLM Call Monitoring Script
# Focuses specifically on LLM API interactions, requests, and responses

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
LOG_FILE="./logs/llm-calls.log"
MONITOR_INTERVAL=2

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

echo -e "${CYAN}🤖 LLM Call Monitor - Real-time API Interaction Tracking${NC}"
echo -e "${CYAN}====================================================${NC}"
echo -e "${YELLOW}Log file: $LOG_FILE${NC}"
echo -e "${YELLOW}Monitoring interval: ${MONITOR_INTERVAL}s${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop monitoring${NC}"
echo ""

# Function to get timestamp
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Function to monitor LLM calls from Docker logs
monitor_llm_logs() {
    echo -e "${CYAN}📡 LLM API Calls & Responses:${NC}"
    
    if command -v docker >/dev/null 2>&1; then
        # Get recent logs from all services and filter for LLM activity
        recent_logs=$(docker-compose logs --tail=50 2>/dev/null | grep -i -E "(llm|gemini|model|chat|completion|api|request|response)" || echo "No LLM activity")
        
        if [[ "$recent_logs" != "No LLM activity" ]]; then
            echo "$recent_logs" | while IFS= read -r line; do
                # Extract and format different types of LLM activity
                
                # Model selection
                if [[ $line == *"model"* ]] && [[ $line == *"gemini"* ]]; then
                    model=$(echo "$line" | grep -o "gemini-[0-9.]*-[a-z]*" | head -1)
                    if [[ -n "$model" ]]; then
                        echo -e "  🎯 ${GREEN}Model Selected: $model${NC}"
                    fi
                fi
                
                # API requests
                if [[ $line == *"request"* ]] || [[ $line == *"sending"* ]] || [[ $line == *"calling"* ]]; then
                    echo -e "  📤 ${BLUE}API Request: $line${NC}"
                fi
                
                # API responses
                if [[ $line == *"response"* ]] || [[ $line == *"received"* ]] || [[ $line == *"result"* ]]; then
                    echo -e "  📥 ${GREEN}API Response: $line${NC}"
                fi
                
                # Errors
                if [[ $line == *"error"* ]] || [[ $line == *"failed"* ]] || [[ $line == *"exception"* ]]; then
                    echo -e "  ❌ ${RED}Error: $line${NC}"
                fi
                
                # Success messages
                if [[ $line == *"success"* ]] || [[ $line == *"completed"* ]]; then
                    echo -e "  ✅ ${GREEN}Success: $line${NC}"
                fi
                
                # Token usage
                if [[ $line == *"token"* ]] || [[ $line == *"usage"* ]]; then
                    echo -e "  📊 ${PURPLE}Token Usage: $line${NC}"
                fi
                
                # Processing time
                if [[ $line == *"time"* ]] || [[ $line == *"duration"* ]] || [[ $line == *"ms"* ]]; then
                    echo -e "  ⏱️  ${YELLOW}Timing: $line${NC}"
                fi
            done
        else
            echo -e "  💤 No recent LLM activity detected"
        fi
    else
        echo -e "  ❌ Docker not available"
    fi
    echo ""
}

# Function to monitor specific service logs
monitor_service_logs() {
    local service_name=$1
    local color=$2
    
    echo -e "${color}📋 $service_name Logs:${NC}"
    
    if command -v docker >/dev/null 2>&1; then
        logs=$(docker-compose logs --tail=10 "$service_name" 2>/dev/null | grep -i -E "(llm|gemini|model|chat|completion|api|request|response|error|success)" || echo "No LLM activity")
        
        if [[ "$logs" != "No LLM activity" ]]; then
            echo "$logs" | while IFS= read -r line; do
                echo -e "  $line"
            done
        else
            echo -e "  💤 No LLM activity in $service_name"
        fi
    fi
    echo ""
}

# Function to monitor Redis for LLM-related data
monitor_redis_llm() {
    echo -e "${PURPLE}🔍 Redis LLM Data:${NC}"
    
    if command -v redis-cli >/dev/null 2>&1; then
        # Look for LLM-related keys in Redis
        llm_keys=$(redis-cli keys "*llm*" 2>/dev/null || echo "")
        model_keys=$(redis-cli keys "*model*" 2>/dev/null || echo "")
        chat_keys=$(redis-cli keys "*chat*" 2>/dev/null || echo "")
        
        if [[ -n "$llm_keys" ]] || [[ -n "$model_keys" ]] || [[ -n "$chat_keys" ]]; then
            echo -e "  🔑 LLM-related Redis keys found:"
            echo "$llm_keys" | while read key; do
                if [[ -n "$key" ]]; then
                    echo -e "    $key"
                fi
            done
            echo "$model_keys" | while read key; do
                if [[ -n "$key" ]]; then
                    echo -e "    $key"
                fi
            done
            echo "$chat_keys" | while read key; do
                if [[ -n "$key" ]]; then
                    echo -e "    $key"
                fi
            done
        else
            echo -e "  💤 No LLM-related data in Redis"
        fi
    else
        echo -e "  ❌ Redis CLI not available"
    fi
    echo ""
}

# Function to monitor environment configuration
monitor_llm_config() {
    echo -e "${YELLOW}⚙️  LLM Configuration:${NC}"
    
    if [[ -f .env ]]; then
        # Extract and display LLM configuration
        if grep -q "LLM_CHAT_MODEL" .env; then
            chat_model=$(grep "LLM_CHAT_MODEL" .env | cut -d'=' -f2)
            echo -e "  🤖 Chat Model: ${GREEN}$chat_model${NC}"
        fi
        
        if grep -q "LLM_VISION_MODEL" .env; then
            vision_model=$(grep "LLM_VISION_MODEL" .env | cut -d'=' -f2)
            echo -e "  👁️  Vision Model: ${GREEN}$vision_model${NC}"
        fi
        
        if grep -q "LLM_EMBEDDING_MODEL" .env; then
            embedding_model=$(grep "LLM_EMBEDDING_MODEL" .env | cut -d'=' -f2)
            echo -e "  🔗 Embedding Model: ${GREEN}$embedding_model${NC}"
        fi
        
        if grep -q "GOOGLE_API_KEY" .env; then
            api_key_length=$(grep "GOOGLE_API_KEY" .env | cut -d'=' -f2 | wc -c)
            if [[ $api_key_length -gt 10 ]]; then
                echo -e "  🔑 API Key: ${GREEN}Configured (${api_key_length} chars)${NC}"
            else
                echo -e "  🔑 API Key: ${RED}Not configured${NC}"
            fi
        fi
    else
        echo -e "  ❌ .env file not found"
    fi
    echo ""
}

# Function to monitor API rate limits and quotas
monitor_api_limits() {
    echo -e "${BLUE}📊 API Usage & Limits:${NC}"
    
    # This would typically check actual API usage from Google Cloud Console
    # For now, we'll monitor for rate limit errors in logs
    
    if command -v docker >/dev/null 2>&1; then
        rate_limit_logs=$(docker-compose logs --tail=100 2>/dev/null | grep -i -E "(rate.limit|quota|limit|429|too.many.requests)" || echo "No rate limit issues")
        
        if [[ "$rate_limit_logs" != "No rate limit issues" ]]; then
            echo -e "  ⚠️  ${YELLOW}Rate limit issues detected:${NC}"
            echo "$rate_limit_logs" | while IFS= read -r line; do
                echo -e "    $line"
            done
        else
            echo -e "  ✅ No rate limit issues detected"
        fi
    fi
    echo ""
}

# Function to save LLM activity to log file
save_llm_activity() {
    if command -v docker >/dev/null 2>&1; then
        # Get LLM activity and save to log file
        llm_activity=$(docker-compose logs --tail=20 2>/dev/null | grep -i -E "(llm|gemini|model|chat|completion|api|request|response)" || echo "")
        
        if [[ -n "$llm_activity" ]]; then
            echo "=== $(timestamp) ===" >> "$LOG_FILE"
            echo "$llm_activity" >> "$LOG_FILE"
            echo "" >> "$LOG_FILE"
        fi
    fi
}

# Main monitoring loop
main() {
    while true; do
        clear
        echo -e "${CYAN}🕐 $(timestamp) - LLM Call Monitor${NC}"
        echo -e "${CYAN}==============================${NC}"
        echo ""
        
        monitor_llm_config
        monitor_llm_logs
        monitor_service_logs "dialogue-service" "$BLUE"
        monitor_service_logs "ingestion-worker" "$GREEN"
        monitor_service_logs "insight-worker" "$PURPLE"
        monitor_redis_llm
        monitor_api_limits
        
        # Save activity to log file
        save_llm_activity
        
        echo -e "${YELLOW}⏳ Refreshing in ${MONITOR_INTERVAL} seconds... (Ctrl+C to stop)${NC}"
        echo -e "${YELLOW}📄 Log file: $LOG_FILE${NC}"
        sleep "$MONITOR_INTERVAL"
    done
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${GREEN}✅ LLM monitoring stopped${NC}"; echo -e "${YELLOW}📄 Log file: $LOG_FILE${NC}"; exit 0' INT

# Start monitoring
main
