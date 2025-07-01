#!/bin/bash

# 2D1L Backend Services Stop Script
# Stops all backend services gracefully

echo "🛑 Stopping 2D1L Backend Services..."

# Kill all node processes related to our services
pkill -f "api-gateway.*pnpm dev" && echo "✅ API Gateway stopped"
pkill -f "user-service.*pnpm dev" && echo "✅ User Service stopped"  
pkill -f "dialogue-service.*pnpm dev" && echo "✅ Dialogue Service stopped"
pkill -f "card-service.*pnpm dev" && echo "✅ Card Service stopped"

# Alternative: Kill by port if the above doesn't work
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "🔌 Port 3001 freed"
lsof -ti:3002 | xargs kill -9 2>/dev/null && echo "🔌 Port 3002 freed"
lsof -ti:3003 | xargs kill -9 2>/dev/null && echo "🔌 Port 3003 freed"
lsof -ti:3004 | xargs kill -9 2>/dev/null && echo "🔌 Port 3004 freed"

echo "✅ All backend services stopped" 