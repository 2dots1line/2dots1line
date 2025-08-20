#!/bin/bash

# Test script to demonstrate monitoring capabilities
# This simulates LLM activity for testing purposes

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🧪 Monitoring Test Script${NC}"
echo -e "${CYAN}========================${NC}"
echo ""

echo -e "${YELLOW}This script will help you test the monitoring capabilities:${NC}"
echo ""
echo "1. Start the monitoring in another terminal"
echo "2. Run this script to simulate activity"
echo "3. Watch the monitoring dashboard for changes"
echo ""

echo -e "${GREEN}Step 1: Start monitoring in another terminal${NC}"
echo "Run: ./scripts/monitor.sh"
echo "Choose option 2 (LLM Call Monitor)"
echo ""

read -p "Press Enter when you have the monitoring running in another terminal..."

echo -e "${GREEN}Step 2: Simulating LLM activity...${NC}"
echo ""

# Simulate some activity
echo "🤖 Simulating LLM API calls..."
sleep 2

echo "📡 Sending request to Google Gemini..."
sleep 1

echo "📥 Response received successfully"
sleep 1

echo "🎯 Using model: gemini-2.5-flash"
sleep 1

echo "📊 Token usage: promptTokens: 150, candidateTokens: 45"
sleep 1

echo "⏱️ Processing time: 2345ms"
sleep 1

echo ""
echo -e "${GREEN}✅ Test completed!${NC}"
echo ""
echo -e "${YELLOW}You should have seen activity in your monitoring dashboard.${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "1. Try the Full System Monitor (option 1)"
echo "2. Test with real API calls by starting your services"
echo "3. Check the generated log files in ./logs/"
echo ""
echo -e "${GREEN}Happy monitoring! 🎉${NC}"
