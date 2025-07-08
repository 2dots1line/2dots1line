#!/bin/bash

# =============================================================================
# 2D1L DEVELOPMENT ENVIRONMENT SETUP SCRIPT
# =============================================================================
# Installs missing development tools (Node.js, pnpm) for clean rebuilds
# =============================================================================

set -e

echo "🛠️  ===== 2D1L DEVELOPMENT ENVIRONMENT SETUP ====="
echo "🎯 Installing missing development tools for 2D1L monorepo"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

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
# STEP 1: INSTALL NODE.JS via NVM (RECOMMENDED)
# =============================================================================

log_step "STEP 1: Installing Node.js via NVM"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js already installed: $NODE_VERSION"
else
    log_step "Installing NVM (Node Version Manager)..."
    
    # Download and install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Reload shell to pick up NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Install Node.js LTS (matches package.json engines requirement >=18.0.0)
    log_step "Installing Node.js LTS..."
    nvm install --lts
    nvm use --lts
    nvm alias default lts/*
    
    log_success "Node.js installed via NVM"
fi

# =============================================================================
# STEP 2: INSTALL PNPM
# =============================================================================

log_step "STEP 2: Installing pnpm"

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    log_success "pnpm already installed: $PNPM_VERSION"
else
    log_step "Installing pnpm via corepack..."
    
    # Enable corepack (comes with Node.js 16.10+)
    corepack enable
    
    # Install pnpm (matches package.json packageManager requirement)
    corepack prepare pnpm@8.14.1 --activate
    
    log_success "pnpm installed via corepack"
fi

# =============================================================================
# STEP 3: VERIFY INSTALLATION
# =============================================================================

log_step "STEP 3: Verifying Installation"

echo ""
echo "🔍 Installed versions:"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "✓ Node.js: $NODE_VERSION"
else
    log_error "✗ Node.js not found"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "✓ npm: $NPM_VERSION"
else
    log_error "✗ npm not found"
    exit 1
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    log_success "✓ pnpm: $PNPM_VERSION"
else
    log_error "✗ pnpm not found"
    exit 1
fi

# Check if versions meet requirements
log_step "Checking version requirements..."

# Node.js >= 18.0.0 (from package.json engines)
NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -ge 18 ]; then
    log_success "✓ Node.js version meets requirement (>=18.0.0)"
else
    log_error "✗ Node.js version too old (need >=18.0.0, have $(node --version))"
    exit 1
fi

# pnpm >= 8.0.0 (from package.json engines)
PNPM_MAJOR=$(pnpm --version | cut -d'.' -f1)
if [ "$PNPM_MAJOR" -ge 8 ]; then
    log_success "✓ pnpm version meets requirement (>=8.0.0)"
else
    log_error "✗ pnpm version too old (need >=8.0.0, have $(pnpm --version))"
    exit 1
fi

# =============================================================================
# STEP 4: FINAL SETUP
# =============================================================================

log_step "STEP 4: Final Setup Instructions"

echo ""
log_success "🎉 DEVELOPMENT ENVIRONMENT READY!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your terminal or run: source ~/.bashrc"
echo "   2. Run the cleanup script: ./scripts/clean-rebuild.sh"
echo "   3. Install dependencies: pnpm install"
echo "   4. Build the project: pnpm build"
echo ""
echo "💡 If you see 'command not found' errors:"
echo "   - Make sure to restart your terminal"
echo "   - Or manually source: source ~/.nvm/nvm.sh"
echo ""
log_warning "⚠️  You may need to restart your terminal for PATH changes to take effect"
echo ""
echo "🕐 Setup completed at: $(date)"
echo "============================================" 