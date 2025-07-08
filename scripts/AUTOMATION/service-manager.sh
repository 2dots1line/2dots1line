#!/bin/bash

# 2D1L V11.0 Service Manager - PM2-Based Service Control
# Manages V11.0 architecture with PM2 processes and Docker databases

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Install with: npm install -g pm2"
        return 1
    fi
    return 0
}

# Load environment variables
load_env() {
    if [ -f "$ROOT_DIR/.env" ]; then
        log_info "Loading environment variables..."
        set -a
        source "$ROOT_DIR/.env"
        log_success "Environment variables loaded and exported"
        
        # Validate critical environment variables
        if [ -z "$DATABASE_URL" ]; then
            log_error "DATABASE_URL not found in environment"
            return 1
        fi
        if [ -z "$GOOGLE_API_KEY" ]; then
            log_warning "GOOGLE_API_KEY not found - image analysis will not work"
        fi
    else
        log_error ".env file not found at $ROOT_DIR/.env"
        return 1
    fi
}

# Check database prerequisites
check_databases() {
    log_info "Checking database services..."
    
    # Check databases
    local db_issues=0
    
    if ! nc -z localhost 5433 >/dev/null 2>&1; then
        log_error "PostgreSQL not accessible on port 5433"
        db_issues=$((db_issues + 1))
    fi
    
    if ! nc -z localhost 6379 >/dev/null 2>&1; then
        log_error "Redis not accessible on port 6379"  
        db_issues=$((db_issues + 1))
    fi
    
    if ! curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1; then
        log_error "Weaviate not accessible on port 8080"
        db_issues=$((db_issues + 1))
    fi
    
    if ! curl -f http://localhost:7475 >/dev/null 2>&1; then
        log_error "Neo4j not accessible on port 7475"
        db_issues=$((db_issues + 1))
    fi
    
    if [ $db_issues -eq 0 ]; then
        log_success "All database services are accessible"
        return 0
    else
        log_warning "$db_issues/4 database services are not accessible"
        log_info "Start databases with: pnpm start:db"
        return 1
    fi
}

# Display V11.0 service status
show_status() {
    log_info "V11.0 System Status:"
    echo ""
    
    # PM2 Process Status
    echo "📊 PM2 Processes:"
    if pm2 list | grep -q "online\|stopped\|errored"; then
        pm2 list
    else
        echo "  No PM2 processes running"
    fi
    
    echo ""
    
    # Key Service Health Checks
    echo "🔍 Service Health Checks:"
    echo "┌─────────────────────┬────────────────────────┬─────────────┐"
    echo "│ Service             │ URL                    │ Status      │"
    echo "├─────────────────────┼────────────────────────┼─────────────┤"
    
    # API Gateway (main service)
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        printf "│ %-19s │ %-22s │ %-11s │\n" "API Gateway" "localhost:3001" "✅ OK"
    else
        printf "│ %-19s │ %-22s │ %-11s │\n" "API Gateway" "localhost:3001" "❌ FAIL"
    fi
    
    # Dimension Reducer (Python service)
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        printf "│ %-19s │ %-22s │ %-11s │\n" "Dimension Reducer" "localhost:8000" "✅ OK"
    else
        printf "│ %-19s │ %-22s │ %-11s │\n" "Dimension Reducer" "localhost:8000" "❌ FAIL"
    fi
    
    echo "└─────────────────────┴────────────────────────┴─────────────┘"
    echo ""
    
    # Database Status
    echo "🗄️ Database Status:"
    echo "┌─────────────────────┬────────────────────────┬─────────────┐"
    echo "│ Database            │ Access                 │ Status      │"
    echo "├─────────────────────┼────────────────────────┼─────────────┤"
    
    # PostgreSQL
    if nc -z localhost 5433 >/dev/null 2>&1; then
        printf "│ %-19s │ %-22s │ %-11s │\n" "PostgreSQL" "localhost:5433" "✅ OK"
    else
        printf "│ %-19s │ %-22s │ %-11s │\n" "PostgreSQL" "localhost:5433" "❌ FAIL"
    fi
    
    # Redis
    if nc -z localhost 6379 >/dev/null 2>&1; then
        printf "│ %-19s │ %-22s │ %-11s │\n" "Redis" "localhost:6379" "✅ OK"
    else
        printf "│ %-19s │ %-22s │ %-11s │\n" "Redis" "localhost:6379" "❌ FAIL"
    fi
    
    # Weaviate
    if curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1; then
        printf "│ %-19s │ %-22s │ %-11s │\n" "Weaviate" "localhost:8080" "✅ OK"
    else
        printf "│ %-19s │ %-22s │ %-11s │\n" "Weaviate" "localhost:8080" "❌ FAIL"
    fi
    
    # Neo4j
    if curl -f http://localhost:7475 >/dev/null 2>&1; then
        printf "│ %-19s │ %-22s │ %-11s │\n" "Neo4j" "localhost:7475" "✅ OK"
    else
        printf "│ %-19s │ %-22s │ %-11s │\n" "Neo4j" "localhost:7475" "❌ FAIL"
    fi
    
    echo "└─────────────────────┴────────────────────────┴─────────────┘"
}

# Start all V11.0 services
start_services() {
    log_info "Starting V11.0 Backend Services..."
    
    # Check prerequisites
    check_pm2 || return 1
    load_env || return 1
    
    # Ensure databases are running
    if ! check_databases; then
        log_warning "Some databases are not accessible. Consider running: pnpm start:db"
    fi
    
    # Generate Prisma client if needed
    log_info "Ensuring Prisma client is generated..."
    cd "$ROOT_DIR/packages/database" && pnpm db:generate >/dev/null 2>&1
    cd "$ROOT_DIR"
    
    # Stop any existing PM2 processes
    log_info "Cleaning up any existing PM2 processes..."
    pm2 delete all >/dev/null 2>&1 || true
    
    # Start PM2 processes using ecosystem config
    log_info "Starting PM2 processes from ecosystem.config.js..."
    if pm2 start ecosystem.config.js; then
        log_success "PM2 services started successfully"
        
        # Wait for services to initialize
        log_info "Waiting for services to initialize..."
        sleep 10
        
        # Show status
        show_status
    else
        log_error "Failed to start PM2 services"
        return 1
    fi
    
    log_success "V11.0 service startup complete!"
    echo ""
    log_info "💡 Management commands:"
    echo "  • Monitor: pm2 monit"
    echo "  • Logs: pm2 logs"
    echo "  • Status: pm2 status"
    echo "  • Stop: pm2 delete all"
}

# Stop all V11.0 services  
stop_services() {
    log_info "Stopping V11.0 services..."
    
    check_pm2 || return 1
    
    if pm2 delete all; then
        log_success "All PM2 services stopped"
    else
        log_warning "No PM2 services were running"
    fi
}

# Restart all V11.0 services
restart_services() {
    log_info "Restarting V11.0 services..."
    stop_services
    sleep 2
    start_services
}

# Show logs for specific service or all
show_logs() {
    local service="$1"
    
    check_pm2 || return 1
    
    if [ -n "$service" ]; then
        if pm2 logs "$service" --lines 50; then
            log_success "Showing logs for $service"
        else
            log_error "Service $service not found"
            log_info "Available services:"
            pm2 list | grep -E "│.*│" | tail -n +4 | head -n -1
        fi
    else
        log_info "Showing logs for all services (Ctrl+C to exit):"
        pm2 logs --lines 0
    fi
}

# Main command router
case "${1:-help}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "help"|*)
        echo "2D1L V11.0 Service Manager (PM2-Based)"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start    - Start all V11.0 services via PM2"
        echo "  stop     - Stop all PM2 services"
        echo "  restart  - Restart all PM2 services"
        echo "  status   - Show comprehensive system status"
        echo "  logs [service] - Show logs for specific service or all"
        echo "  help     - Show this help message"
        echo ""
        echo "V11.0 Architecture:"
        echo "  • API Gateway: Single Node.js server (port 3001)"
        echo "  • Workers: Background processors (PM2 managed)"
        echo "  • Python Services: ML services (PM2 managed)"
        echo "  • Databases: Docker containers"
        echo ""
        echo "Available PM2 services:"
        check_pm2 && pm2 list 2>/dev/null | grep -E "│.*│" | tail -n +4 | head -n -1 || echo "  (PM2 not installed or no services running)"
        ;;
esac 