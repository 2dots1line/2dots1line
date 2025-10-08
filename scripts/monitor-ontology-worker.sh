#!/bin/bash

# Ontology Worker Monitoring Script
# This script monitors the ontology worker logs in real-time

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="../logs"
ONTOLOGY_LOG_FILE="$LOG_DIR/ontology-optimization-worker-combined.log"
USER_ID=${1:-""}

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  ONTOLOGY WORKER LOG MONITOR${NC}"
echo -e "${CYAN}============================================================${NC}"

if [ -n "$USER_ID" ]; then
    echo -e "${BLUE}Filtering for User ID: $USER_ID${NC}"
    echo -e "${BLUE}Log File: $ONTOLOGY_LOG_FILE${NC}"
    echo -e "${CYAN}============================================================${NC}"
    
    if [ -f "$ONTOLOGY_LOG_FILE" ]; then
        echo -e "${GREEN}✅ Log file found. Starting real-time monitoring...${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop monitoring${NC}"
        echo ""
        
        # Monitor logs with filtering
        tail -f "$ONTOLOGY_LOG_FILE" | grep --line-buffered -E "(OntologyOptimizer|LLMBasedOptimizer|$USER_ID|ERROR|SUCCESS|completed|failed)" | while read line; do
            # Color code different types of log entries
            if echo "$line" | grep -q "ERROR\|failed\|FAILED"; then
                echo -e "${RED}$line${NC}"
            elif echo "$line" | grep -q "SUCCESS\|completed\|COMPLETED"; then
                echo -e "${GREEN}$line${NC}"
            elif echo "$line" | grep -q "$USER_ID"; then
                echo -e "${MAGENTA}$line${NC}"
            elif echo "$line" | grep -q "OntologyOptimizer\|LLMBasedOptimizer"; then
                echo -e "${BLUE}$line${NC}"
            else
                echo -e "${YELLOW}$line${NC}"
            fi
        done
    else
        echo -e "${RED}❌ Log file not found: $ONTOLOGY_LOG_FILE${NC}"
        echo -e "${YELLOW}Available log files in $LOG_DIR:${NC}"
        ls -la "$LOG_DIR"/*.log 2>/dev/null || echo "No log files found"
    fi
else
    echo -e "${YELLOW}Usage: $0 <userId>${NC}"
    echo -e "${YELLOW}Example: $0 user-123${NC}"
    echo ""
    echo -e "${BLUE}Available log files:${NC}"
    ls -la "$LOG_DIR"/*.log 2>/dev/null || echo "No log files found"
fi
