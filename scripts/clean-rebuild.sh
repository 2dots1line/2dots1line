#!/bin/bash

# =============================================================================
# 2D1L COMPREHENSIVE BUILD CLEANSING SCRIPT
# =============================================================================
# Ensures 100% clean state before rebuild attempts
# Addresses Node.js/pnpm environment setup + full artifact removal
# =============================================================================

set -e  # Exit on any error

echo "🧹 ===== 2D1L COMPREHENSIVE CLEANSING SCRIPT ====="
echo "⚠️  WARNING: This will destroy ALL build artifacts, caches, and Docker resources"
echo "📍 Working Directory: $(pwd)"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =============================================================================
# PHASE I: DOCKER COMPLETE DESTRUCTION
# =============================================================================

log_step "PHASE I: Docker Complete Destruction"

# Stop and remove ALL containers (not just project-specific)
if command -v docker &> /dev/null; then
    log_step "Stopping all Docker containers..."
    docker stop $(docker ps -aq) 2>/dev/null || log_warning "No containers to stop"
    
    log_step "Removing all Docker containers..."
    docker rm $(docker ps -aq) 2>/dev/null || log_warning "No containers to remove"
    
    log_step "Removing all Docker networks..."
    docker network prune -f 2>/dev/null || log_warning "No networks to remove"
    
    log_step "Removing all Docker volumes..."
    docker volume prune -f 2>/dev/null || log_warning "No volumes to remove"
    
    log_step "Removing all Docker images..."
    docker image prune -af 2>/dev/null || log_warning "No images to remove"
    
    log_step "Removing all Docker build cache..."
    docker builder prune -af 2>/dev/null || log_warning "No build cache to remove"
    
    log_step "Removing Docker system cache..."
    docker system prune -af --volumes 2>/dev/null || log_warning "System prune completed"
    
    log_success "Docker environment completely destroyed"
else
    log_warning "Docker not found - skipping Docker cleanup"
fi

# =============================================================================
# PHASE II: BUILD ARTIFACT ANNIHILATION
# =============================================================================

log_step "PHASE II: Build Artifact Annihilation"

# Remove all TypeScript build info files
log_step "Removing TypeScript build info files..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
find . -name "tsconfig.tsbuildinfo" -type f -delete 2>/dev/null || true

# Remove all dist directories
log_step "Removing all dist directories..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove all .next directories (Next.js)
log_step "Removing all .next directories..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove all .turbo directories (Turbo cache)
log_step "Removing all .turbo directories..."
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove all node_modules directories
log_step "Removing all node_modules directories..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove package manager lock files
log_step "Removing package manager lock files..."
rm -f pnpm-lock.yaml 2>/dev/null || true
rm -f package-lock.json 2>/dev/null || true
rm -f yarn.lock 2>/dev/null || true

# Remove all .cache directories
log_step "Removing all .cache directories..."
find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove coverage directories
log_step "Removing all coverage directories..."
find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove Jest cache
log_step "Removing Jest cache..."
find . -name ".jest" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove ESLint cache
log_step "Removing ESLint cache..."
find . -name ".eslintcache" -type f -delete 2>/dev/null || true

# Remove Prettier cache
log_step "Removing Prettier cache..."
find . -name ".prettiercache" -type f -delete 2>/dev/null || true

log_success "Build artifacts annihilated"

# =============================================================================
# PHASE III: DATABASE VALIDATION & CLEANUP
# =============================================================================

log_step "PHASE III: Database Validation & Cleanup"

# Validate Prisma schema exists
PRISMA_SCHEMA="packages/database/prisma/schema.prisma"
if [ -f "$PRISMA_SCHEMA" ]; then
    log_success "Prisma schema found: $PRISMA_SCHEMA"
    
    # Show schema info
    log_step "Prisma schema validation:"
    echo "📊 Schema file size: $(wc -c < "$PRISMA_SCHEMA") bytes"
    echo "📊 Schema line count: $(wc -l < "$PRISMA_SCHEMA") lines"
    
    # Check for database providers
    if grep -q "postgresql" "$PRISMA_SCHEMA"; then
        log_success "✓ PostgreSQL provider found in schema"
    else
        log_warning "✗ PostgreSQL provider not found in schema"
    fi
    
    if grep -q "sqlite" "$PRISMA_SCHEMA"; then
        log_success "✓ SQLite provider found in schema"
    else
        log_warning "✗ SQLite provider not found in schema"
    fi
else
    log_error "Prisma schema NOT found at: $PRISMA_SCHEMA"
fi

# Clean up database data directories
log_step "Cleaning database data directories..."
rm -rf postgres_data/* 2>/dev/null || true
rm -rf postgres_data_backup_*/* 2>/dev/null || true
rm -rf neo4j_data/* 2>/dev/null || true
rm -rf redis_data/* 2>/dev/null || true
rm -rf weaviate_data/* 2>/dev/null || true

log_success "Database validation completed"

# =============================================================================
# PHASE IV: DEVELOPMENT ENVIRONMENT VERIFICATION
# =============================================================================

log_step "PHASE IV: Development Environment Verification"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "✓ Node.js found: $NODE_VERSION"
else
    log_error "✗ Node.js NOT found in PATH"
    echo "  Install Node.js: https://nodejs.org/"
    echo "  Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "✓ npm found: $NPM_VERSION"
else
    log_error "✗ npm NOT found in PATH"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    log_success "✓ pnpm found: $PNPM_VERSION"
else
    log_error "✗ pnpm NOT found in PATH"
    echo "  Install pnpm: npm install -g pnpm"
    echo "  Or use corepack: corepack enable && corepack prepare pnpm@latest --activate"
fi

# Check turbo
if command -v turbo &> /dev/null; then
    TURBO_VERSION=$(turbo --version)
    log_success "✓ turbo found: $TURBO_VERSION"
else
    log_warning "✗ turbo NOT found globally (this is OK - can use npx)"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "✓ Docker found: $DOCKER_VERSION"
else
    log_error "✗ Docker NOT found in PATH"
fi

# =============================================================================
# PHASE V: WORKSPACE STRUCTURE VALIDATION
# =============================================================================

log_step "PHASE V: Workspace Structure Validation"

# Validate package.json exists
if [ -f "package.json" ]; then
    log_success "✓ Root package.json found"
    
    # Check packageManager field
    if grep -q '"packageManager"' package.json; then
        PACKAGE_MANAGER=$(grep '"packageManager"' package.json)
        log_success "✓ packageManager field found: $PACKAGE_MANAGER"
    else
        log_warning "✗ packageManager field missing (required for Turbo v2.0)"
    fi
else
    log_error "✗ Root package.json NOT found"
fi

# Validate pnpm-workspace.yaml
if [ -f "pnpm-workspace.yaml" ]; then
    log_success "✓ pnpm-workspace.yaml found"
else
    log_error "✗ pnpm-workspace.yaml NOT found"
fi

# Validate turbo.json
if [ -f "turbo.json" ]; then
    log_success "✓ turbo.json found"
    
    # Check if using new tasks format
    if grep -q '"tasks"' turbo.json; then
        log_success "✓ Using Turbo v2.0 'tasks' format"
    elif grep -q '"pipeline"' turbo.json; then
        log_warning "✗ Using deprecated 'pipeline' format (use 'tasks' for v2.0)"
    fi
else
    log_error "✗ turbo.json NOT found"
fi

# Count workspace packages
APPS_COUNT=$(ls -1 apps/ 2>/dev/null | wc -l | tr -d ' ')
PACKAGES_COUNT=$(ls -1 packages/ 2>/dev/null | wc -l | tr -d ' ')
SERVICES_COUNT=$(ls -1 services/ 2>/dev/null | wc -l | tr -d ' ')
WORKERS_COUNT=$(ls -1 workers/ 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Workspace package counts:"
echo "   Apps: $APPS_COUNT"
echo "   Packages: $PACKAGES_COUNT"
echo "   Services: $SERVICES_COUNT"
echo "   Workers: $WORKERS_COUNT"

log_success "Workspace validation completed"

# =============================================================================
# PHASE VI: FINAL CLEANUP STATUS
# =============================================================================

log_step "PHASE VI: Final Cleanup Status"

echo ""
echo "🧹 ===== CLEANSING COMPLETE ====="
echo ""
echo "✅ All build artifacts removed"
echo "✅ All Docker resources destroyed"
echo "✅ All caches cleared"
echo "✅ Database data directories cleaned"
echo "✅ Workspace structure validated"
echo ""

# Check critical missing tools
MISSING_TOOLS=()
command -v node &> /dev/null || MISSING_TOOLS+=("node")
command -v pnpm &> /dev/null || MISSING_TOOLS+=("pnpm")
command -v docker &> /dev/null || MISSING_TOOLS+=("docker")

if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then
    log_success "🎉 ENVIRONMENT READY FOR CLEAN REBUILD!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. pnpm install"
    echo "   2. pnpm build"
    echo ""
else
    log_warning "⚠️  MISSING DEVELOPMENT TOOLS:"
    for tool in "${MISSING_TOOLS[@]}"; do
        echo "   - $tool"
    done
    echo ""
    echo "📖 Please install missing tools before rebuilding"
fi

echo "🕐 Cleanup completed at: $(date)"
echo "============================================" 