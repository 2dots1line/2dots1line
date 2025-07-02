#!/bin/bash

# 2D1L pnpm Lock File Conflict Prevention & Fix
# Prevents duplicate lock files and dependency conflicts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to check for pnpm lock file conflicts
check_lock_conflicts() {
    local duplicates=$(find "$ROOT_DIR" -maxdepth 1 -name "pnpm-lock*.yaml" | wc -l)
    
    if [ "$duplicates" -gt 1 ]; then
        log_warning "Found multiple pnpm lock files:"
        find "$ROOT_DIR" -maxdepth 1 -name "pnpm-lock*.yaml" -exec ls -la {} \;
        return 1
    fi
    
    return 0
}

# Function to clean up duplicate lock files
cleanup_lock_duplicates() {
    log_info "Cleaning up duplicate pnpm lock files..."
    
    # Keep the original pnpm-lock.yaml, remove numbered duplicates
    find "$ROOT_DIR" -maxdepth 1 -name "pnpm-lock [0-9]*.yaml" -delete
    find "$ROOT_DIR" -maxdepth 1 -name "pnpm-lock[0-9]*.yaml" -delete
    
    log_success "Duplicate lock files cleaned up"
}

# Function to validate pnpm-lock.yaml integrity
validate_lock_file() {
    local lock_file="$ROOT_DIR/pnpm-lock.yaml"
    
    if [ ! -f "$lock_file" ]; then
        log_error "pnpm-lock.yaml not found!"
        return 1
    fi
    
    # Check if the lock file is valid YAML
    if ! pnpm install --lockfile-only --frozen-lockfile >/dev/null 2>&1; then
        log_warning "pnpm-lock.yaml appears to be corrupted"
        return 1
    fi
    
    log_success "pnpm-lock.yaml is valid"
    return 0
}

# Function to regenerate lock file safely
regenerate_lock_file() {
    log_info "Regenerating pnpm-lock.yaml safely..."
    
    # Backup current lock file
    if [ -f "$ROOT_DIR/pnpm-lock.yaml" ]; then
        cp "$ROOT_DIR/pnpm-lock.yaml" "$ROOT_DIR/pnpm-lock.yaml.backup"
        log_info "Backed up current lock file"
    fi
    
    # Remove lock file and reinstall
    rm -f "$ROOT_DIR/pnpm-lock.yaml"
    
    # Install with fresh lock file
    if pnpm install; then
        log_success "Lock file regenerated successfully"
        rm -f "$ROOT_DIR/pnpm-lock.yaml.backup"
    else
        log_error "Failed to regenerate lock file"
        if [ -f "$ROOT_DIR/pnpm-lock.yaml.backup" ]; then
            mv "$ROOT_DIR/pnpm-lock.yaml.backup" "$ROOT_DIR/pnpm-lock.yaml"
            log_info "Restored backup lock file"
        fi
        return 1
    fi
}

# Function to prevent concurrent pnpm operations
check_pnpm_processes() {
    local pnpm_processes=$(ps aux | grep -E "pnpm (install|add|remove|update)" | grep -v grep | wc -l)
    
    if [ "$pnpm_processes" -gt 0 ]; then
        log_warning "Found running pnpm processes:"
        ps aux | grep -E "pnpm (install|add|remove|update)" | grep -v grep
        log_error "Please wait for existing pnpm operations to complete"
        return 1
    fi
    
    return 0
}

# Function to setup pnpm workspace optimization
optimize_pnpm_workspace() {
    log_info "Optimizing pnpm workspace configuration..."
    
    # Create or update .npmrc for better conflict prevention
    cat > "$ROOT_DIR/.npmrc" << 'EOF'
# pnpm Configuration for 2D1L Monorepo
# Prevents lock file conflicts and optimizes workspace behavior

# Workspace settings
link-workspace-packages=true
shared-workspace-lockfile=true
prefer-workspace-packages=true

# Conflict prevention
resolution-mode=highest
save-exact=false

# Performance optimization
enable-pre-post-scripts=true
recursive-install=false

# Cache settings
store-dir=node_modules/.pnpm-store
cache-dir=node_modules/.pnpm-cache

# Lockfile behavior
lockfile-include-tarball-url=false
EOF
    
    log_success "pnpm workspace configuration optimized"
}

# Main execution
main() {
    log_info "🔧 Fixing pnpm Lock File Conflicts..."
    
    # Check for running pnpm processes
    if ! check_pnpm_processes; then
        log_error "Cannot proceed with active pnpm processes"
        exit 1
    fi
    
    # Clean up any existing duplicates
    cleanup_lock_duplicates
    
    # Check for conflicts
    if ! check_lock_conflicts; then
        log_warning "Lock file conflicts detected, cleaning up..."
        cleanup_lock_duplicates
    fi
    
    # Validate current lock file
    if ! validate_lock_file; then
        log_warning "Lock file validation failed, regenerating..."
        regenerate_lock_file
    fi
    
    # Optimize workspace configuration
    optimize_pnpm_workspace
    
    log_success "🎯 pnpm conflicts resolved!"
    log_info "💡 To prevent future conflicts:"
    echo "  • Always use 'pnpm services:start' instead of manual service startup"
    echo "  • Avoid running multiple pnpm commands simultaneously"
    echo "  • Use 'pnpm install --frozen-lockfile' in CI/CD"
}

# Command line interface
case "${1:-fix}" in
    "check")
        check_lock_conflicts && log_success "No lock file conflicts found"
        ;;
    "clean")
        cleanup_lock_duplicates
        ;;
    "validate")
        validate_lock_file
        ;;
    "regenerate")
        regenerate_lock_file
        ;;
    "optimize")
        optimize_pnpm_workspace
        ;;
    "fix"|*)
        main
        ;;
esac 