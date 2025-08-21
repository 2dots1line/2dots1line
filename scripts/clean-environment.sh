#!/bin/bash

echo "🧹 Starting comprehensive environment cleanup..."

# Stop all PM2 processes first
echo "📋 Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Kill any Turbo daemon processes
echo "🔄 Killing Turbo daemon processes..."
pkill -f "turbo.*daemon" 2>/dev/null || true
pkill -f turbo 2>/dev/null || true

# Wait a moment for processes to fully stop
sleep 2

# Remove node_modules and lock files
echo "🗑️  Removing node_modules and lock files..."
rm -rf node_modules pnpm-lock.yaml 2>/dev/null || true

# Remove build artifacts
echo "🧹 Removing build artifacts..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true  
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Remove nested node_modules (synchronous)
echo "🗂️  Removing nested node_modules..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# Prune pnpm store
echo "📦 Pruning pnpm store..."
pnpm store prune 2>/dev/null || true

echo "✅ Environment cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm install"
echo "2. Run: pnpm build"
echo "3. Start services: pm2 start ecosystem.config.js"
