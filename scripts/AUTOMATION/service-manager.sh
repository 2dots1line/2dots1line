#!/bin/bash

# 2D1L Service Manager - Comprehensive Service Control
# Prevents conflicts and provides clear service state management

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOGS_DIR="$ROOT_DIR/logs"
PID_FILE="$ROOT_DIR/.service-pids"

# Service definitions (service_name:path:port)
SERVICES="
api-gateway:apps/api-gateway:3001
user-service:services/user-service:3003
dialogue-service:services/dialogue-service:3002
card-service:services/card-service:3004
"

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

# Check if port is in use
is_port_in_use() {
    local port=$1
    lsof -ti:$port >/dev/null 2>&1
}

# Kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo $pids | xargs kill -9 2>/dev/null
        log_warning "Killed existing processes on port $port: $pids"
        sleep 1
        
        # Double-check if port is still in use
        if is_port_in_use $port; then
            local remaining_pids=$(lsof -ti:$port 2>/dev/null)
            if [ -n "$remaining_pids" ]; then
                echo $remaining_pids | xargs kill -9 2>/dev/null
                log_warning "Force killed remaining processes on port $port: $remaining_pids"
                sleep 1
            fi
        fi
    fi
}

# Kill processes by service pattern
kill_service_processes() {
    local service=$1
    log_info "Cleaning up any leftover $service processes..."
    
    # Kill ts-node-dev processes for this service
    local service_pids=$(ps aux | grep "$service.*ts-node-dev" | grep -v grep | awk '{print $2}')
    if [ -n "$service_pids" ]; then
        echo $service_pids | xargs kill -9 2>/dev/null
        log_warning "Killed $service ts-node-dev processes: $service_pids"
    fi
    
    # Also kill any node processes in the service directory
    local dir_pids=$(ps aux | grep "$service.*pnpm dev" | grep -v grep | awk '{print $2}')
    if [ -n "$dir_pids" ]; then
        echo $dir_pids | xargs kill -9 2>/dev/null
        log_warning "Killed $service pnpm processes: $dir_pids"
    fi
}

# Parse service info
get_service_info() {
    local service_line=$1
    local field=$2
    echo $service_line | cut -d':' -f$field
}

# Get service status
get_service_status() {
    local service_line=$1
    local port=$(get_service_info "$service_line" 3)
    
    if is_port_in_use $port; then
        echo "RUNNING"
    else
        echo "STOPPED"
    fi
}

# Display service status table
show_status() {
    log_info "Current Service Status:"
    echo "┌─────────────────┬────────┬──────┬─────────────┐"
    echo "│ Service         │ Status │ Port │ Health      │"
    echo "├─────────────────┼────────┼──────┼─────────────┤"
    
    echo "$SERVICES" | grep -v '^$' | while read service_line; do
        if [ -n "$service_line" ]; then
            local service=$(get_service_info "$service_line" 1)
            local port=$(get_service_info "$service_line" 3)
            local status=$(get_service_status "$service_line")
            local health="N/A"
            
            if [ "$status" = "RUNNING" ]; then
                if curl -f http://localhost:$port/api/health >/dev/null 2>&1; then
                    health="✅ OK"
                else
                    health="❌ FAIL"
                fi
            fi
            
            printf "│ %-15s │ %-6s │ %-4s │ %-11s │\n" "$service" "$status" "$port" "$health"
        fi
    done
    
    echo "└─────────────────┴────────┴──────┴─────────────┘"
}

# Load environment variables
load_env() {
    if [ -f "$ROOT_DIR/.env" ]; then
        log_info "Loading environment variables..."
        set -a
        source "$ROOT_DIR/.env"
        # Keep set -a active so variables are exported to subshells
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check databases
    nc -z localhost 5433 >/dev/null 2>&1 || { log_error "PostgreSQL not accessible on 5433"; return 1; }
    nc -z localhost 6379 >/dev/null 2>&1 || { log_error "Redis not accessible on 6379"; return 1; }
    curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1 || { log_error "Weaviate not accessible on 8080"; return 1; }
    
    log_success "All database services are accessible"
    
    # Generate Prisma client if needed
    log_info "Ensuring Prisma client is generated..."
    cd "$ROOT_DIR/packages/database" && pnpm db:generate >/dev/null 2>&1
    cd "$ROOT_DIR"
    
    return 0
}

# Stop all services
stop_services() {
    log_info "Stopping all services..."
    
    # Kill by port and service pattern to ensure complete cleanup
    echo "$SERVICES" | grep -v '^$' | while read service_line; do
        if [ -n "$service_line" ]; then
            local service=$(get_service_info "$service_line" 1)
            local port=$(get_service_info "$service_line" 3)
            
            # Kill by port first
            kill_port $port
            
            # Then kill any remaining service processes
            kill_service_processes $service
        fi
    done
    
    # Additional cleanup: kill any remaining ts-node-dev processes
    local remaining_ts_node=$(ps aux | grep "ts-node-dev.*src/server.ts" | grep -v grep | awk '{print $2}')
    if [ -n "$remaining_ts_node" ]; then
        echo $remaining_ts_node | xargs kill -9 2>/dev/null
        log_warning "Killed remaining ts-node-dev processes: $remaining_ts_node"
    fi
    
    # Clean up PID file
    rm -f "$PID_FILE"
    
    log_success "All services stopped"
}

# Start all services
start_services() {
    log_info "Starting 2D1L Backend Services..."
    
    # Load environment and check prerequisites
    load_env || return 1
    check_prerequisites || return 1
    
    # Stop any existing services first
    stop_services
    
    # Create logs directory
    mkdir -p "$LOGS_DIR"
    
    # Clear PID file
    echo "# Service PIDs - $(date)" > "$PID_FILE"
    
    # Start each service
    echo "$SERVICES" | grep -v '^$' | while read service_line; do
        if [ -n "$service_line" ]; then
            local service=$(get_service_info "$service_line" 1)
            local path=$(get_service_info "$service_line" 2)
            local port=$(get_service_info "$service_line" 3)
            
            log_info "Starting $service on port $port..."
            
            # Start service with inherited environment variables  
            (cd "$ROOT_DIR/$path" && pnpm dev > "$LOGS_DIR/$service.log" 2>&1) &
            local pid=$!
            
            echo "$service=$pid" >> "$PID_FILE"
            log_success "$service started (PID: $pid)"
        fi
    done
    
    # Wait for services to start
    log_info "Waiting for services to initialize..."
    sleep 10
    
    # Health checks
    log_info "Performing health checks..."
    show_status
    
    log_success "Service startup complete!"
    echo ""
    log_info "💡 Management commands:"
    echo "  • Stop all: ./scripts/service-manager.sh stop"
    echo "  • Status: ./scripts/service-manager.sh status"
    echo "  • Restart: ./scripts/service-manager.sh restart"
    echo "  • Logs: tail -f logs/*.log"
}

# Restart services
restart_services() {
    log_info "Restarting all services..."
    stop_services
    sleep 2
    start_services
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
        if [ -n "$2" ]; then
            tail -f "$LOGS_DIR/$2.log" 2>/dev/null || log_error "Log file for $2 not found"
        else
            log_info "Available log files:"
            ls -la "$LOGS_DIR"/*.log 2>/dev/null || log_warning "No log files found"
        fi
        ;;
    "help"|*)
        echo "2D1L Service Manager"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  start    - Start all backend services"
        echo "  stop     - Stop all backend services"
        echo "  restart  - Restart all backend services"
        echo "  status   - Show current service status"
        echo "  logs [service] - Show logs for specific service or list all"
        echo "  help     - Show this help message"
        echo ""
        echo "Services: api-gateway, user-service, dialogue-service, card-service"
        ;;
esac 