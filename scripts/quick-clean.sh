#!/bin/bash

echo "🧹 Quick Clean Script - Avoiding hanging operations"

# 1. Remove lock files
echo "Removing lock files..."
rm -f pnpm-lock.yaml pnpm-lock\ 2.yaml

# 2. Remove build artifacts from source directories
echo "Removing build artifacts from source..."
find packages -name "*.js" -path "*/src/*" -delete 2>/dev/null || true
find packages -name "*.d.ts" -path "*/src/*" -delete 2>/dev/null || true
find packages -name "*.map" -path "*/src/*" -delete 2>/dev/null || true

# 3. Remove dist directories
echo "Removing dist directories..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# 4. Remove .next directories
echo "Removing .next directories..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# 5. Remove .turbo directories
echo "Removing .turbo directories..."
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

# 6. Remove TypeScript build info files
echo "Removing TypeScript build info files..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# 7. Remove node_modules (but skip if it hangs)
echo "Removing node_modules (this may take a moment)..."
timeout 30 rm -rf node_modules 2>/dev/null || echo "⚠️  node_modules removal timed out - you may need to remove it manually"

echo "✅ Quick clean completed!"
echo ""
echo "If you need to remove node_modules manually, try:"
echo "  rm -rf node_modules"
echo ""
echo "If that hangs, try:"
echo "  sudo rm -rf node_modules"
