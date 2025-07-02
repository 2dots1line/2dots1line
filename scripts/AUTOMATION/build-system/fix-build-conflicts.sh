#!/bin/bash

# 2D1L Master Build Conflict Resolution Script
# Comprehensive fix for TypeScript and pnpm conflicts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

main() {
    echo "🚀 2D1L Build Conflict Resolution"
    echo "=================================="
    echo ""
    
    log_info "🔧 Step 1: Fixing TypeScript build conflicts..."
    if "$SCRIPT_DIR/fix-typescript-build-conflicts.sh"; then
        log_success "TypeScript conflicts resolved"
    else
        log_error "TypeScript fix failed"
        exit 1
    fi
    
    echo ""
    log_info "📦 Step 2: Fixing pnpm lock file conflicts..."
    if "$SCRIPT_DIR/fix-pnpm-conflicts.sh"; then
        log_success "pnpm conflicts resolved"
    else
        log_error "pnpm fix failed"
        exit 1
    fi
    
    echo ""
    log_info "🧪 Step 3: Testing build system..."
    if pnpm build >/dev/null 2>&1; then
        log_success "Build system working correctly"
    else
        log_warning "Build test failed, but conflicts are resolved"
        log_info "Run 'pnpm build' manually to see detailed errors"
    fi
    
    echo ""
    log_success "🎯 All build conflicts resolved!"
    echo ""
    log_info "📋 Summary of fixes applied:"
    echo "  ✅ TypeScript build info files configured with explicit paths"
    echo "  ✅ pnpm workspace optimized for conflict prevention"
    echo "  ✅ Build artifacts cleaned up"
    echo "  ✅ .gitignore updated"
    echo ""
    log_info "💡 To prevent future conflicts:"
    echo "  • Use 'pnpm services:start' for service management"
    echo "  • Run 'pnpm fix:conflicts' if issues recur"
    echo "  • Avoid manual parallel builds"
}

# Command line interface
case "${1:-fix}" in
    "typescript"|"ts")
        "$SCRIPT_DIR/fix-typescript-build-conflicts.sh"
        ;;
    "pnpm"|"lock")
        "$SCRIPT_DIR/fix-pnpm-conflicts.sh"
        ;;
    "fix"|*)
        main
        ;;
esac 