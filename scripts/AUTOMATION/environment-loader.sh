#!/bin/bash

# SYSTEMATIC SOLUTION for Shell Script Environment Context Loss
# Addresses: LESSON 49 from CRITICAL_LESSONS_LEARNED.md
# 
# This script ensures consistent environment variable loading across all shell contexts
# and prevents the environment context loss pattern that causes verification failures.

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Find project root
find_project_root() {
    local current_dir="$(pwd)"
    
    while [[ "$current_dir" != "/" ]]; do
        if [[ -f "$current_dir/package.json" ]] && [[ -d "$current_dir/packages" ]]; then
            echo "$current_dir"
            return
        fi
        current_dir="$(dirname "$current_dir")"
    done
    
    echo "$(pwd)"
}

# Load environment variables from multiple sources
load_environment() {
    local project_root="$1"
    
    echo -e "${BLUE}Loading environment variables...${NC}"
    
    # Source .env files in order of precedence
    local env_files=(".env.development" ".env.local" ".env")
    local loaded_files=()
    
    for env_file in "${env_files[@]}"; do
        local env_path="$project_root/$env_file"
        if [[ -f "$env_path" ]]; then
            set -a  # Export all variables
            source "$env_path"
            set +a  # Stop exporting
            loaded_files+=("$env_file")
            echo -e "${GREEN}✓${NC} Loaded $env_file"
        fi
    done
    
    if [[ ${#loaded_files[@]} -eq 0 ]]; then
        echo -e "${YELLOW}⚠️${NC} No .env files found, using system environment only"
    fi
    
    # Resolve variable variations (addresses multiple lessons)
    resolve_environment_variations
    
    # Validate critical variables
    validate_critical_variables
    
    echo -e "${GREEN}✅ Environment loaded successfully${NC}"
}

# Resolve environment variable variations
resolve_environment_variations() {
    # Neo4j variations (LESSON 18 fix)
    if [[ -z "${NEO4J_URI:-}" && -n "${NEO4J_URI_DOCKER:-}" ]]; then
        export NEO4J_URI="${NEO4J_URI_DOCKER}"
    fi
    
    if [[ -z "${NEO4J_USER:-}" && -n "${NEO4J_USERNAME:-}" ]]; then
        export NEO4J_USER="${NEO4J_USERNAME}"
    elif [[ -z "${NEO4J_USERNAME:-}" && -n "${NEO4J_USER:-}" ]]; then
        export NEO4J_USERNAME="${NEO4J_USER}"
    fi
    
    # Redis variations
    if [[ -z "${REDIS_URL:-}" && -n "${REDIS_HOST:-}" && -n "${REDIS_PORT:-}" ]]; then
        export REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
    fi
    
    # Apply defaults for missing variables
    export NODE_ENV="${NODE_ENV:-development}"
    export PORT="${PORT:-3000}"
    export API_GATEWAY_PORT="${API_GATEWAY_PORT:-3001}"
    export REDIS_HOST="${REDIS_HOST:-localhost}"
    export REDIS_PORT="${REDIS_PORT:-6379}"
    export NEO4J_URI="${NEO4J_URI:-bolt://localhost:7687}"
    export WEAVIATE_URL="${WEAVIATE_URL:-http://localhost:8080}"
}

# Validate critical environment variables
validate_critical_variables() {
    local required_vars=("DATABASE_URL" "GOOGLE_API_KEY" "JWT_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${YELLOW}⚠️${NC} Missing required environment variables: ${missing_vars[*]}"
        echo -e "${YELLOW}   This may cause runtime failures in services that depend on these variables.${NC}"
    fi
}

# Service-specific environment validation
validate_service_environment() {
    local service_name="$1"
    
    case "$service_name" in
        "database")
            local db_vars=("DATABASE_URL" "NEO4J_URI" "NEO4J_USER" "NEO4J_PASSWORD" "REDIS_URL" "WEAVIATE_URL")
            ;;
        "ai-services")
            local db_vars=("GOOGLE_API_KEY")
            ;;
        "auth")
            local db_vars=("JWT_SECRET")
            ;;
        "redis")
            local db_vars=("REDIS_URL")
            ;;
        "neo4j")
            local db_vars=("NEO4J_URI" "NEO4J_USER" "NEO4J_PASSWORD")
            ;;
        *)
            echo -e "${YELLOW}⚠️${NC} Unknown service: $service_name"
            return 0
            ;;
    esac
    
    local missing_vars=()
    for var in "${db_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${RED}❌${NC} Service $service_name missing required environment variables: ${missing_vars[*]}"
        return 1
    else
        echo -e "${GREEN}✅${NC} Service $service_name environment validation passed"
        return 0
    fi
}

# Display environment variable status
show_environment_status() {
    echo -e "${BLUE}Environment Variable Status:${NC}"
    echo "  NODE_ENV: ${NODE_ENV:-NOT_SET}"
    echo "  DATABASE_URL: ${DATABASE_URL:0:30}..."
    echo "  GOOGLE_API_KEY: ${GOOGLE_API_KEY:0:10}..."
    echo "  JWT_SECRET: ${JWT_SECRET:0:10}..."
    echo "  REDIS_URL: ${REDIS_URL:-NOT_SET}"
    echo "  NEO4J_URI: ${NEO4J_URI:-NOT_SET}"
    echo "  NEO4J_USER: ${NEO4J_USER:-NOT_SET}"
    echo "  WEAVIATE_URL: ${WEAVIATE_URL:-NOT_SET}"
}

# Execute command with guaranteed environment
execute_with_environment() {
    local project_root="$1"
    shift
    
    # Ensure environment is loaded
    load_environment "$project_root"
    
    # Execute command
    echo -e "${BLUE}Executing:${NC} $*"
    "$@"
}

# Main function
main() {
    local project_root
    project_root="$(find_project_root)"
    
    case "${1:-help}" in
        "load")
            load_environment "$project_root"
            show_environment_status
            ;;
        "validate")
            load_environment "$project_root"
            if [[ -n "${2:-}" ]]; then
                validate_service_environment "$2"
            else
                validate_critical_variables
            fi
            ;;
        "exec")
            shift
            execute_with_environment "$project_root" "$@"
            ;;
        "status")
            load_environment "$project_root"
            show_environment_status
            ;;
        "help"|*)
            echo "Usage: $0 <command> [args...]"
            echo ""
            echo "Commands:"
            echo "  load                    - Load environment variables"
            echo "  validate [service]      - Validate environment variables (optionally for specific service)"
            echo "  exec <command>         - Execute command with environment loaded"
            echo "  status                 - Show environment variable status"
            echo "  help                   - Show this help message"
            echo ""
            echo "Services for validation:"
            echo "  database, ai-services, auth, redis, neo4j"
            echo ""
            echo "Examples:"
            echo "  $0 load"
            echo "  $0 validate database"
            echo "  $0 exec pm2 start ecosystem.config.js"
            echo "  $0 status"
            ;;
    esac
}

# If script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

# If script is sourced, just load environment
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    project_root="$(find_project_root)"
    load_environment "$project_root"
fi 