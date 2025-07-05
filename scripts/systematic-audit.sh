#!/bin/bash

# 🎯 SYSTEMATIC AUDIT SCRIPT - LESSON 19 IMPLEMENTATION
# Run this before ANY troubleshooting or major changes
# Implements comprehensive system validation protocols

set -e

echo "🔍 SYSTEMATIC AUDIT - 2D1L V11.0"
echo "================================="
echo "Implementing LESSON 19: Proactive System Validation"
echo ""

AUDIT_FAILED=false

# 1. DEPENDENCY AUDIT
echo "📦 PHASE 1: WORKSPACE DEPENDENCY AUDIT"
echo "Checking for missing @2dots1line dependencies..."

for dir in apps/* services/* workers/*; do
  if [ -f "$dir/package.json" ] && [ -d "$dir/src" ]; then
    echo "  Auditing $dir..."
    
    # Extract imports
    grep -r "from '@2dots1line/" "$dir/src" 2>/dev/null | \
      sed "s/.*from '\(@2dots1line\/[^']*\)'.*/\1/" | \
      sort | uniq > /tmp/imports_audit.txt 2>/dev/null || touch /tmp/imports_audit.txt
    
    # Extract package.json dependencies  
    grep -A 20 '"dependencies"' "$dir/package.json" 2>/dev/null | \
      grep '@2dots1line' | \
      sed 's/.*"\(@2dots1line\/[^"]*\)".*/\1/' > /tmp/deps_audit.txt 2>/dev/null || touch /tmp/deps_audit.txt
    
    # Find missing dependencies
    MISSING=$(comm -23 /tmp/imports_audit.txt /tmp/deps_audit.txt 2>/dev/null || echo "")
    if [ -n "$MISSING" ]; then
      echo "    ❌ MISSING DEPENDENCIES in $dir:"
      echo "$MISSING" | sed 's/^/      /'
      AUDIT_FAILED=true
    else
      echo "    ✅ Dependencies complete"
    fi
    
    rm -f /tmp/imports_audit.txt /tmp/deps_audit.txt
  fi
done

echo ""

# 2. TYPESCRIPT CONFIGURATION AUDIT
echo "📝 PHASE 2: TYPESCRIPT CONFIGURATION AUDIT"
echo "Checking TypeScript project references..."

for dir in apps/* services/* workers/*; do
  if [ -f "$dir/tsconfig.build.json" ]; then
    echo "  Checking $dir..."
    if grep -q '"references"' "$dir/tsconfig.build.json"; then
      echo "    ✅ Has project references"
    else
      echo "    ❌ MISSING project references"
      AUDIT_FAILED=true
    fi
  fi
done

echo ""

# 3. ENVIRONMENT VARIABLE AUDIT
echo "🌍 PHASE 3: ENVIRONMENT VARIABLE AUDIT"
echo "Checking environment variable dependencies..."

ENV_DEPS=$(grep -r "process\.env\." apps/*/src services/*/src workers/*/src 2>/dev/null | \
           grep -v "NODE_ENV" | \
           sed 's/.*process\.env\.\([A-Z_]*\).*/\1/' | \
           sort | uniq | grep -v '^$')

if [ -n "$ENV_DEPS" ]; then
  echo "  Environment variables required:"
  echo "$ENV_DEPS" | sed 's/^/    /'
  
  echo "  Checking ecosystem.config.js coverage..."
  for var in $ENV_DEPS; do
    if grep -q "$var:" ecosystem.config.js; then
      echo "    ✅ $var covered in ecosystem config"
    else
      echo "    ❌ $var MISSING from ecosystem config"
      AUDIT_FAILED=true
    fi
  done
else
  echo "  ✅ No additional environment dependencies found"
fi

echo ""

# 4. BUILD VERIFICATION
echo "🔨 PHASE 4: BUILD VERIFICATION"
echo "Testing build system..."

if pnpm build >/dev/null 2>&1; then
  echo "  ✅ Build successful"
else
  echo "  ❌ BUILD FAILED"
  echo "  Run 'pnpm build' for details"
  AUDIT_FAILED=true
fi

echo ""

# 5. MODULE RESOLUTION TEST
echo "🔗 PHASE 5: MODULE RESOLUTION TEST"
echo "Testing critical module imports..."

cd apps/api-gateway
if node -e "require('@2dots1line/tools'); console.log('Tools import successful')" >/dev/null 2>&1; then
  echo "  ✅ Tools package import successful"
else
  echo "  ❌ Tools package import FAILED"
  AUDIT_FAILED=true
fi

if node -e "require('@2dots1line/database'); console.log('Database import successful')" >/dev/null 2>&1; then
  echo "  ✅ Database package import successful"
else
  echo "  ❌ Database package import FAILED"
  AUDIT_FAILED=true
fi

cd ../../

echo ""

# 6. PM2 ENVIRONMENT TEST
echo "🔧 PHASE 6: PM2 ENVIRONMENT VERIFICATION"
if pm2 list | grep -q "online"; then
  echo "  Testing environment propagation..."
  if pm2 exec 0 -- env | grep -q "DATABASE_URL="; then
    echo "  ✅ Environment variables properly propagated to PM2 processes"
  else
    echo "  ❌ Environment variables NOT propagated to PM2 processes"
    AUDIT_FAILED=true
  fi
else
  echo "  ⚠️  No PM2 processes running - skipping environment test"
fi

echo ""

# FINAL AUDIT RESULT
echo "🎯 SYSTEMATIC AUDIT COMPLETE"
echo "============================"

if [ "$AUDIT_FAILED" = true ]; then
  echo "❌ AUDIT FAILED - System issues detected"
  echo ""
  echo "RECOMMENDED ACTIONS:"
  echo "1. Fix missing dependencies in package.json files"
  echo "2. Add missing TypeScript project references"
  echo "3. Update ecosystem.config.js with missing environment variables"
  echo "4. Resolve build errors before proceeding"
  echo "5. Test module imports in clean environment"
  echo ""
  echo "DO NOT PROCEED with troubleshooting until audit passes"
  exit 1
else
  echo "✅ AUDIT PASSED - System validation complete"
  echo "Safe to proceed with development/troubleshooting"
fi 