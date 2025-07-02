#!/bin/bash

# 2D1L System Health Check
# Comprehensive verification of build system, services, and dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅ OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠️  WARN]${NC} $1"; }
log_error() { echo -e "${RED}[❌ FAIL]${NC} $1"; }

ISSUES_FOUND=0

# Function to report issues
report_issue() {
    log_error "$1"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

# Function to check for duplicate lock files
check_lock_files() {
    log_info "Checking for pnpm lock file conflicts..."
    
    local lock_files=$(find "$ROOT_DIR" -maxdepth 1 -name "pnpm-lock*.yaml" | wc -l)
    
    if [ "$lock_files" -eq 1 ]; then
        log_success "Single pnpm-lock.yaml file found"
    else
        report_issue "Multiple pnpm lock files detected (found $lock_files)"
        find "$ROOT_DIR" -maxdepth 1 -name "pnpm-lock*.yaml" | sed 's/^/  → /'
        echo "  💡 Fix with: pnpm fix:pnpm"
    fi
}

# Function to check for TypeScript build conflicts
check_typescript_builds() {
    log_info "Checking for TypeScript build conflicts..."
    
    local conflict_files=$(find "$ROOT_DIR" -name "*tsbuildinfo*" -not -path "*/node_modules/*" -not -name "*.json" | grep -E "( [0-9]|[0-9]+\.)" | wc -l)
    
    if [ "$conflict_files" -eq 0 ]; then
        log_success "No TypeScript build conflicts found"
    else
        report_issue "TypeScript build conflicts detected ($conflict_files files)"
        find "$ROOT_DIR" -name "*tsbuildinfo*" -not -path "*/node_modules/*" -not -name "*.json" | grep -E "( [0-9]|[0-9]+\.)" | sed 's/^/  → /'
        echo "  💡 Fix with: pnpm fix:typescript"
    fi
}

# Function to check build system integrity
check_build_system() {
    log_info "Checking build system integrity..."
    
    if pnpm build >/dev/null 2>&1; then
        log_success "Build system working correctly"
    else
        report_issue "Build system has errors"
        echo "  💡 Fix with: pnpm fix:conflicts"
    fi
}

# Function to check service status
check_services() {
    log_info "Checking service status..."
    
    local services=("3001:API Gateway" "3002:Dialogue Service" "3003:User Service" "3004:Card Service")
    local running_services=0
    
    for service in "${services[@]}"; do
        local port=$(echo $service | cut -d: -f1)
        local name=$(echo $service | cut -d: -f2)
        
        if lsof -i :$port >/dev/null 2>&1; then
            if curl -f http://localhost:$port/api/health >/dev/null 2>&1; then
                log_success "$name (port $port) - Running & Healthy"
            else
                log_warning "$name (port $port) - Running but not responding to health checks"
            fi
            running_services=$((running_services + 1))
        else
            log_info "$name (port $port) - Not running"
        fi
    done
    
    if [ "$running_services" -eq 0 ]; then
        log_info "No services running - use 'pnpm services:start' to start them"
    elif [ "$running_services" -eq 4 ]; then
        log_success "All services running"
    else
        log_warning "$running_services/4 services running"
    fi
}

# Function to check database connectivity
check_databases() {
    log_info "Checking database connectivity..."
    
    # PostgreSQL
    if nc -z localhost 5433 >/dev/null 2>&1; then
        log_success "PostgreSQL accessible (port 5433)"
    else
        log_warning "PostgreSQL not accessible (port 5433)"
        echo "  💡 Start with: docker-compose up -d postgres"
    fi
    
    # Redis
    if nc -z localhost 6379 >/dev/null 2>&1; then
        log_success "Redis accessible (port 6379)"
    else
        log_warning "Redis not accessible (port 6379)"
        echo "  💡 Start with: docker-compose up -d redis"
    fi
    
    # Weaviate
    if curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1; then
        log_success "Weaviate accessible (port 8080)"
    else
        log_warning "Weaviate not accessible (port 8080)"
        echo "  💡 Start with: docker-compose up -d weaviate"
    fi
    
    # Neo4j
    if curl -f http://localhost:7475 >/dev/null 2>&1; then
        log_success "Neo4j accessible (port 7475)"
    else
        log_warning "Neo4j not accessible (port 7475)"
        echo "  💡 Start with: docker-compose up -d neo4j"
    fi
}

# Function to check environment configuration
check_environment() {
    log_info "Checking environment configuration..."
    
    if [ -f "$ROOT_DIR/.env" ]; then
        log_success ".env file exists"
        
        # Check critical variables
        if grep -q "DATABASE_URL" "$ROOT_DIR/.env"; then
            log_success "DATABASE_URL configured"
        else
            log_warning "DATABASE_URL not found in .env"
        fi
        
        if grep -q "GOOGLE_API_KEY" "$ROOT_DIR/.env"; then
            log_success "GOOGLE_API_KEY configured"
        else
            log_warning "GOOGLE_API_KEY not found in .env (image analysis won't work)"
        fi
    else
        report_issue ".env file not found"
        echo "  💡 Copy from envexample.md and configure"
    fi
}

# Function to check workspace configuration
check_workspace() {
    log_info "Checking workspace configuration..."
    
    if [ -f "$ROOT_DIR/.npmrc" ]; then
        log_success "Workspace .npmrc exists"
    else
        log_warning ".npmrc not found"
        echo "  💡 Generate with: pnpm fix:pnpm"
    fi
    
    if [ -f "$ROOT_DIR/pnpm-workspace.yaml" ]; then
        log_success "pnpm workspace configuration exists"
    else
        report_issue "pnpm-workspace.yaml not found"
    fi
}

# Main health check
main() {
    echo "🔍 2D1L System Health Check"
    echo "============================"
    echo ""
    
    check_lock_files
    echo ""
    
    check_typescript_builds
    echo ""
    
    check_build_system
    echo ""
    
    check_services
    echo ""
    
    check_databases
    echo ""
    
    check_environment
    echo ""
    
    check_workspace
    echo ""
    
    # Summary
    echo "📋 Health Check Summary"
    echo "======================="
    
    if [ "$ISSUES_FOUND" -eq 0 ]; then
        log_success "System is healthy! No issues found."
    else
        log_warning "Found $ISSUES_FOUND issue(s) that need attention."
        echo ""
        echo "🛠️  Quick fixes:"
        echo "  • pnpm fix:conflicts    - Fix all build conflicts"
        echo "  • pnpm services:start   - Start all backend services"
        echo "  • docker-compose up -d  - Start all database services"
    fi
    
    echo ""
    echo "💡 Useful commands:"
    echo "  • pnpm services:status  - Check service status"
    echo "  • pnpm services:logs    - View service logs"
    echo "  • pnpm build           - Test build system"
    echo "  • ./scripts/health-check.sh - Run this check again"
}

# Command line interface
case "${1:-check}" in
    "quick"|"q")
        check_lock_files
        check_typescript_builds
        ;;
    "services"|"s")
        check_services
        check_databases
        ;;
    "build"|"b")
        check_build_system
        ;;
    "check"|*)
        main
        ;;
esac 