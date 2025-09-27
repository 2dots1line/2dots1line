#!/bin/bash

echo "🧹 Safe Clean Script - Handling problematic node_modules"
echo ""

# Check if node_modules exists and its size
if [ -d "node_modules" ]; then
    echo "📊 node_modules directory found:"
    du -sh node_modules 2>/dev/null || echo "Cannot determine size"
    echo ""
    
    echo "🔍 Checking for problematic files..."
    ls -la node_modules | grep -E "(\s[0-9]+\s|\.bin\s[0-9]+)" || echo "No obviously problematic files found"
    echo ""
    
    echo "⚠️  Standard removal methods are timing out due to file system issues."
    echo "📝 Manual steps required:"
    echo ""
    echo "1. Try renaming the directory first:"
    echo "   mv node_modules node_modules_old"
    echo ""
    echo "2. If that works, then remove it:"
    echo "   rm -rf node_modules_old"
    echo ""
    echo "3. If that still hangs, try with sudo:"
    echo "   sudo rm -rf node_modules_old"
    echo ""
    echo "4. As a last resort, restart your system and try again"
    echo ""
    echo "🔄 Proceeding with other cleanup tasks..."
else
    echo "✅ node_modules not found - skipping"
fi

echo ""
echo "🧹 Cleaning other build artifacts..."

# Remove other build artifacts (these should work fine)
echo "Removing lock files..."
rm -f pnpm-lock.yaml pnpm-lock\ 2.yaml

echo "Removing build artifacts from source..."
find packages -name "*.js" -path "*/src/*" -delete 2>/dev/null || true
find packages -name "*.d.ts" -path "*/src/*" -delete 2>/dev/null || true
find packages -name "*.map" -path "*/src/*" -delete 2>/dev/null || true

echo "Removing dist directories..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

echo "Removing .next directories..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

echo "Removing .turbo directories..."
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

echo "Removing TypeScript build info files..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

echo ""
echo "✅ Safe clean completed!"
echo ""
echo "📋 Summary:"
echo "  - Other build artifacts: ✅ Cleaned"
echo "  - node_modules: ⚠️  Requires manual intervention"
echo ""
echo "💡 Next steps:"
echo "  1. Follow the manual steps above for node_modules"
echo "  2. Run 'pnpm install' to reinstall dependencies"
echo "  3. Your project should be clean and ready to go!"

