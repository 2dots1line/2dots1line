#!/bin/bash
# Database Reset Script for 2D1L
# Resets PostgreSQL, Neo4j, and Weaviate databases while preserving schemas

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_CONTAINER="postgres-2d1l"
NEO4J_CONTAINER="neo4j-2d1l"
WEAVIATE_URL="http://localhost:8080"
POSTGRES_USER="danniwang"
POSTGRES_DB="twodots1line"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password123"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "step") echo -e "${CYAN}🔧 $message${NC}" ;;
        "header") echo -e "${PURPLE}📋 $message${NC}" ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker container is running
check_container() {
    local container=$1
    if docker ps --format "table {{.Names}}" | grep -q "^${container}$"; then
        return 0
    else
        return 1
    fi
}

# Function to wait for user confirmation
confirm_action() {
    local message=$1
    echo -e "\n${YELLOW}$message${NC}"
    echo -e "${YELLOW}This will DELETE ALL DATA from the databases.${NC}"
    echo -e "${YELLOW}Schemas will be preserved, but all content will be lost.${NC}"
    echo -n "Are you sure you want to continue? (yes/no): "
    read -r response
    if [[ ! "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "info" "Database reset cancelled by user"
        exit 0
    fi
}

# Function to show help
show_help() {
    echo -e "${PURPLE}Database Reset Script for 2D1L${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -y, --yes           Skip confirmation prompts"
    echo "  -p, --postgres      Reset only PostgreSQL"
    echo "  -n, --neo4j         Reset only Neo4j"
    echo "  -w, --weaviate      Reset only Weaviate"
    echo "  -a, --all           Reset all databases (default)"
    echo "  -v, --verify        Verify reset results"
    echo "  -s, --status        Show current database status"
    echo ""
    echo "Examples:"
    echo "  $0                  # Reset all databases with confirmation"
    echo "  $0 -y               # Reset all databases without confirmation"
    echo "  $0 -p               # Reset only PostgreSQL"
    echo "  $0 -v               # Verify reset results"
    echo "  $0 -s               # Show current status"
    echo ""
    echo "This script will:"
    echo "  • Preserve database schemas"
    echo "  • Delete all data content"
    echo "  • Reset to clean state"
    echo "  • Verify reset success"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "header" "Checking Prerequisites"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.dev.yml" ]; then
        print_status "error" "This script must be run from the 2D1L project root directory"
        exit 1
    fi
    
    # Check if required commands exist
    for cmd in docker curl jq; do
        if command_exists "$cmd"; then
            print_status "success" "$cmd is available"
        else
            print_status "error" "$cmd is not available"
            exit 1
        fi
    done
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_status "error" "Docker is not running"
        exit 1
    fi
    
    print_status "success" "All prerequisites met"
}

# Function to show current database status
show_status() {
    print_status "header" "Current Database Status"
    
    echo -e "\n${CYAN}PostgreSQL Status:${NC}"
    if check_container "$POSTGRES_CONTAINER"; then
        print_status "success" "PostgreSQL container is running"
        # Count records in main tables
        local user_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")
        local concept_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM concepts;" 2>/dev/null | tr -d ' \n' || echo "0")
        local memory_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM memory_units;" 2>/dev/null | tr -d ' \n' || echo "0")
        echo "  Users: $user_count"
        echo "  Concepts: $concept_count"
        echo "  Memory Units: $memory_count"
    else
        print_status "error" "PostgreSQL container is not running"
    fi
    
    echo -e "\n${CYAN}Neo4j Status:${NC}"
    if check_container "$NEO4J_CONTAINER"; then
        print_status "success" "Neo4j container is running"
        # Count nodes
        local node_count=$(docker exec "$NEO4J_CONTAINER" cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "MATCH (n) RETURN count(n) as count;" 2>/dev/null | grep -v "ready to start" | grep -v "results consumed" | tr -d ' \n' || echo "0")
        echo "  Total Nodes: $node_count"
    else
        print_status "error" "Neo4j container is not running"
    fi
    
    echo -e "\n${CYAN}Weaviate Status:${NC}"
    if curl -s "$WEAVIATE_URL/v1/.well-known/ready" >/dev/null 2>&1; then
        print_status "success" "Weaviate is accessible"
        # Count objects
        local object_count=$(curl -s "$WEAVIATE_URL/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.totalResults // 0' 2>/dev/null || echo "0")
        echo "  UserKnowledgeItem Objects: $object_count"
    else
        print_status "error" "Weaviate is not accessible"
    fi
}

# Function to reset PostgreSQL
reset_postgresql() {
    print_status "step" "Resetting PostgreSQL Database"
    
    if ! check_container "$POSTGRES_CONTAINER"; then
        print_status "error" "PostgreSQL container is not running"
        return 1
    fi
    
    # List of tables to truncate (excluding system tables)
    local tables=(
        "cards" "conversations" "conversation_messages" "memory_units" 
        "concepts" "communities" "derived_artifacts" "growth_events" 
        "interaction_logs" "media_items" "proactive_prompts" 
        "user_challenges" "user_graph_projections" "user_sessions" 
        "llm_interactions"
    )
    
    # Build TRUNCATE command
    local truncate_cmd="TRUNCATE TABLE ${tables[*]} CASCADE;"
    
    print_status "info" "Executing: $truncate_cmd"
    
    if docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$truncate_cmd" >/dev/null 2>&1; then
        print_status "success" "PostgreSQL database reset completed"
        
        # Verify reset
        local user_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")
        if [ "$user_count" = "0" ]; then
            print_status "success" "PostgreSQL reset verified - all data cleared"
        else
            print_status "warning" "PostgreSQL reset may not be complete - users table still has $user_count records"
        fi
    else
        print_status "error" "PostgreSQL reset failed"
        return 1
    fi
}

# Function to reset Neo4j
reset_neo4j() {
    print_status "step" "Resetting Neo4j Database"
    
    if ! check_container "$NEO4J_CONTAINER"; then
        print_status "error" "Neo4j container is not running"
        return 1
    fi
    
    print_status "info" "Deleting all nodes and relationships"
    
    local result=$(docker exec "$NEO4J_CONTAINER" cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "MATCH (n) DETACH DELETE n;" 2>/dev/null)
    
    if echo "$result" | grep -q "Deleted.*nodes"; then
        print_status "success" "Neo4j database reset completed"
        
        # Verify reset
        local node_count=$(docker exec "$NEO4J_CONTAINER" cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "MATCH (n) RETURN count(n) as count;" 2>/dev/null | grep -v "ready to start" | grep -v "results consumed" | tr -d ' \n' || echo "0")
        if [ "$node_count" = "0" ]; then
            print_status "success" "Neo4j reset verified - all nodes deleted"
        else
            print_status "warning" "Neo4j reset may not be complete - still has $node_count nodes"
        fi
    else
        print_status "error" "Neo4j reset failed"
        return 1
    fi
}

# Function to reset Weaviate
reset_weaviate() {
    print_status "step" "Resetting Weaviate Database"
    
    if ! curl -s "$WEAVIATE_URL/v1/.well-known/ready" >/dev/null 2>&1; then
        print_status "error" "Weaviate is not accessible"
        return 1
    fi
    
    # Get all object IDs from UserKnowledgeItem class
    print_status "info" "Fetching all UserKnowledgeItem objects"
    
    local object_ids=$(curl -s "$WEAVIATE_URL/v1/objects?class=UserKnowledgeItem&limit=1000" | jq -r '.objects[].id' 2>/dev/null)
    
    if [ -z "$object_ids" ]; then
        print_status "info" "No UserKnowledgeItem objects found to delete"
        return 0
    fi
    
    local delete_count=0
    local total_count=$(echo "$object_ids" | wc -l)
    
    print_status "info" "Deleting $total_count UserKnowledgeItem objects"
    
    # Delete each object
    while IFS= read -r object_id; do
        if [ -n "$object_id" ]; then
            if curl -s -X DELETE "$WEAVIATE_URL/v1/objects/$object_id" >/dev/null 2>&1; then
                ((delete_count++))
                echo -ne "\r  Progress: $delete_count/$total_count objects deleted"
            fi
        fi
    done <<< "$object_ids"
    
    echo ""  # New line after progress
    
    if [ $delete_count -gt 0 ]; then
        print_status "success" "Weaviate database reset completed - deleted $delete_count objects"
        
        # Verify reset
        local remaining_count=$(curl -s "$WEAVIATE_URL/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.totalResults // 0' 2>/dev/null || echo "0")
        if [ "$remaining_count" = "0" ]; then
            print_status "success" "Weaviate reset verified - all objects deleted"
        else
            print_status "warning" "Weaviate reset may not be complete - still has $remaining_count objects"
        fi
    else
        print_status "info" "Weaviate was already empty"
    fi
}

# Function to verify reset results
verify_reset() {
    print_status "header" "Verifying Database Reset Results"
    
    echo -e "\n${CYAN}PostgreSQL Verification:${NC}"
    if check_container "$POSTGRES_CONTAINER"; then
        local user_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")
        local concept_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM concepts;" 2>/dev/null | tr -d ' \n' || echo "0")
        local memory_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM memory_units;" 2>/dev/null | tr -d ' \n' || echo "0")
        
        if [ "$user_count" = "0" ] && [ "$concept_count" = "0" ] && [ "$memory_count" = "0" ]; then
            print_status "success" "PostgreSQL: All data cleared"
        else
            print_status "warning" "PostgreSQL: Some data remains (Users: $user_count, Concepts: $concept_count, Memory: $memory_count)"
        fi
    else
        print_status "error" "PostgreSQL container not running"
    fi
    
    echo -e "\n${CYAN}Neo4j Verification:${NC}"
    if check_container "$NEO4J_CONTAINER"; then
        local node_count=$(docker exec "$NEO4J_CONTAINER" cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "MATCH (n) RETURN count(n) as count;" 2>/dev/null | grep -v "ready to start" | grep -v "results consumed" | tr -d ' \n' || echo "0")
        
        if [ "$node_count" = "0" ]; then
            print_status "success" "Neo4j: All nodes deleted"
        else
            print_status "warning" "Neo4j: Still has $node_count nodes"
        fi
    else
        print_status "error" "Neo4j container not running"
    fi
    
    echo -e "\n${CYAN}Weaviate Verification:${NC}"
    if curl -s "$WEAVIATE_URL/v1/.well-known/ready" >/dev/null 2>&1; then
        local object_count=$(curl -s "$WEAVIATE_URL/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.totalResults // 0' 2>/dev/null || echo "0")
        
        if [ "$object_count" = "0" ]; then
            print_status "success" "Weaviate: All objects deleted"
        else
            print_status "warning" "Weaviate: Still has $object_count objects"
        fi
    else
        print_status "error" "Weaviate not accessible"
    fi
    
    echo -e "\n${GREEN}🎉 Database reset verification complete!${NC}"
}

# Function to reset all databases
reset_all_databases() {
    print_status "header" "Starting Complete Database Reset"
    
    local success=true
    
    # Reset PostgreSQL
    if ! reset_postgresql; then
        success=false
    fi
    
    # Reset Neo4j
    if ! reset_neo4j; then
        success=false
    fi
    
    # Reset Weaviate
    if ! reset_weaviate; then
        success=false
    fi
    
    if [ "$success" = true ]; then
        print_status "success" "All databases reset successfully"
        verify_reset
    else
        print_status "error" "Some database resets failed"
        exit 1
    fi
}

# Parse command line arguments
SKIP_CONFIRM=false
RESET_POSTGRES=false
RESET_NEO4J=false
RESET_WEAVIATE=false
SHOW_STATUS=false
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        -p|--postgres)
            RESET_POSTGRES=true
            shift
            ;;
        -n|--neo4j)
            RESET_NEO4J=true
            shift
            ;;
        -w|--weaviate)
            RESET_WEAVIATE=true
            shift
            ;;
        -a|--all)
            RESET_POSTGRES=true
            RESET_NEO4J=true
            RESET_WEAVIATE=true
            shift
            ;;
        -s|--status)
            SHOW_STATUS=true
            shift
            ;;
        -v|--verify)
            VERIFY_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Default to all databases if none specified
if [ "$RESET_POSTGRES" = false ] && [ "$RESET_NEO4J" = false ] && [ "$RESET_WEAVIATE" = false ] && [ "$SHOW_STATUS" = false ] && [ "$VERIFY_ONLY" = false ]; then
    RESET_POSTGRES=true
    RESET_NEO4J=true
    RESET_WEAVIATE=true
fi

# Main execution
main() {
    echo -e "${PURPLE}🗄️  Database Reset Script for 2D1L${NC}"
    echo "================================================"
    
    # Check prerequisites
    check_prerequisites
    
    # Show status if requested
    if [ "$SHOW_STATUS" = true ]; then
        show_status
        exit 0
    fi
    
    # Verify only if requested
    if [ "$VERIFY_ONLY" = true ]; then
        verify_reset
        exit 0
    fi
    
    # Show current status before reset
    show_status
    
    # Confirm action unless skipped
    if [ "$SKIP_CONFIRM" = false ]; then
        confirm_action "Preparing to reset databases..."
    fi
    
    # Perform resets
    if [ "$RESET_POSTGRES" = true ] && [ "$RESET_NEO4J" = true ] && [ "$RESET_WEAVIATE" = true ]; then
        reset_all_databases
    else
        if [ "$RESET_POSTGRES" = true ]; then
            reset_postgresql
        fi
        
        if [ "$RESET_NEO4J" = true ]; then
            reset_neo4j
        fi
        
        if [ "$RESET_WEAVIATE" = true ]; then
            reset_weaviate
        fi
        
        print_status "success" "Selected databases reset completed"
        verify_reset
    fi
    
    echo -e "\n${GREEN}🎉 Database reset completed successfully!${NC}"
    echo -e "${BLUE}Your databases are now clean and ready for fresh data.${NC}"
}

# Run main function
main "$@"
