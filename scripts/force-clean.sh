#!/bin/bash

echo "🧹 Force Clean Script - Aggressive cleanup with process killing"

# 1. Kill all relevant processes first
echo "Killing background processes..."
pkill -f "pm2 logs" 2>/dev/null || true
pkill -f "turbo.*daemon" 2>/dev/null || true
pkill -f "turbo.*build" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
pkill -f "pnpm.*dev" 2>/dev/null || true

# Wait a moment for processes to die
sleep 2

# 2. Remove lock files
echo "Removing lock files..."
rm -f pnpm-lock.yaml pnpm-lock\ 2.yaml

# 3. Force remove .turbo directory (this is usually the culprit)
echo "Force removing .turbo directories..."
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

# 4. Force remove dist directories
echo "Force removing dist directories..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# 5. Force remove .next directories
echo "Force removing .next directories..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# 6. Remove build artifacts from source directories
echo "Removing build artifacts from source..."
find packages -name "*.js" -path "*/src/*" -delete 2>/dev/null || true
find packages -name "*.d.ts" -path "*/src/*" -delete 2>/dev/null || true
find packages -name "*.map" -path "*/src/*" -delete 2>/dev/null || true

# 7. Remove TypeScript build info files
echo "Removing TypeScript build info files..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# 8. Try to remove node_modules with timeout
echo "Attempting to remove node_modules..."
timeout 60 rm -rf node_modules 2>/dev/null || echo "⚠️  node_modules removal timed out or failed"

echo "✅ Force clean completed!"
echo ""
echo "If node_modules still exists and you need to remove it manually:"
echo "  sudo rm -rf node_modules"
echo ""
echo "Then run: pnpm install"
