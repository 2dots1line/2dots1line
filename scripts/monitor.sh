#!/bin/bash

# Monitoring Launcher Script
# Choose your monitoring mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔍 2dots1line V11.0 Monitoring Dashboard${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Choose your monitoring mode:${NC}"
echo ""
echo -e "${GREEN}1)${NC} ${BLUE}Full System Monitor${NC} - All workers, databases, Redis, and system health"
echo -e "${GREEN}2)${NC} ${PURPLE}LLM Call Monitor${NC} - Focus on LLM API calls, requests, and responses"
echo -e "${GREEN}3)${NC} ${YELLOW}Quick Status Check${NC} - One-time status overview"
echo -e "${GREEN}4)${NC} ${RED}Exit${NC}"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Starting Full System Monitor...${NC}"
        ./scripts/monitor-llm-workers.sh
        ;;
    2)
        echo -e "${GREEN}🚀 Starting LLM Call Monitor...${NC}"
        ./scripts/monitor-llm-calls.sh
        ;;
    3)
        echo -e "${GREEN}🚀 Running Quick Status Check...${NC}"
        echo ""
        
        # Quick status check
        echo -e "${CYAN}📊 Quick System Status:${NC}"
        echo "========================"
        
        # Docker status
        if command -v docker >/dev/null 2>&1; then
            echo -e "${BLUE}🐳 Docker Services:${NC}"
            docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(dialogue|ingestion|insight|worker|service)" || echo "  No worker containers found"
        fi
        
        # LLM configuration
        echo -e "\n${YELLOW}⚙️  LLM Configuration:${NC}"
        if [[ -f .env ]]; then
            if grep -q "LLM_CHAT_MODEL" .env; then
                chat_model=$(grep "LLM_CHAT_MODEL" .env | cut -d'=' -f2)
                echo -e "  🤖 Chat Model: ${GREEN}$chat_model${NC}"
            fi
        else
            echo -e "  ❌ .env file not found"
        fi
        
        # Recent LLM activity
        echo -e "\n${CYAN}🤖 Recent LLM Activity:${NC}"
        if command -v docker >/dev/null 2>&1; then
            recent_llm=$(docker-compose logs --tail=10 2>/dev/null | grep -i -E "(llm|gemini|model)" | tail -3 || echo "No recent LLM activity")
            if [[ "$recent_llm" != "No recent LLM activity" ]]; then
                echo "$recent_llm" | while IFS= read -r line; do
                    echo -e "  $line"
                done
            else
                echo -e "  💤 No recent LLM activity"
            fi
        fi
        
        echo -e "\n${GREEN}✅ Quick status check complete!${NC}"
        ;;
    4)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac
