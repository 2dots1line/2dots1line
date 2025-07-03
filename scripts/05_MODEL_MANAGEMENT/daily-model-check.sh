#!/bin/bash

# 2D1L Daily Gemini Model Health Check
# Automated monitoring of model availability and quota status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/gemini_models.json"
LOG_DIR="$PROJECT_ROOT/logs"
REPORT_FILE="$LOG_DIR/model-health-$(date +%Y-%m-%d).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Helper functions
log_message() {
    echo -e "$1" | tee -a "$REPORT_FILE"
}

print_header() {
    local message="$1"
    log_message "${BLUE}================================${NC}"
    log_message "${BLUE}$message${NC}"
    log_message "${BLUE}================================${NC}"
}

print_success() {
    log_message "${GREEN}✅ $1${NC}"
}

print_warning() {
    log_message "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    log_message "${RED}❌ $1${NC}"
}

check_environment() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi
    
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_warning "GOOGLE_API_KEY environment variable not set"
        print_warning "Model testing will be skipped"
        return 1
    fi
    
    return 0
}

test_models() {
    local has_api_key=$1
    
    if [ "$has_api_key" -eq 0 ]; then
        log_message "🧪 Testing model availability..."
        
        cd "$SCRIPT_DIR" || return 1
        
        # Capture both stdout and stderr
        local test_output
        test_output=$(node test_gemini_models.js 2>&1)
        local test_exit_code=$?
        
        # Log full output to file
        echo "$test_output" >> "$REPORT_FILE"
        
        if [ $test_exit_code -eq 0 ]; then
            print_success "Model testing completed successfully"
        else
            print_error "Model testing failed"
            return 1
        fi
        
        # Analyze results
        local quota_issues
        quota_issues=$(echo "$test_output" | grep -c "🚫\|quota_exceeded")
        
        local available_models
        available_models=$(echo "$test_output" | grep -c "✅")
        
        log_message "📊 Test Summary:"
        log_message "  Available models: $available_models"
        log_message "  Quota exceeded: $quota_issues"
        
        if [ "$quota_issues" -gt 0 ]; then
            print_warning "QUOTA ISSUES DETECTED"
            log_message "Models with quota issues:"
            echo "$test_output" | grep "🚫\|quota_exceeded" | while read -r line; do
                log_message "  $line"
            done
            
            log_message ""
            log_message "🔧 Suggested actions:"
            log_message "  1. Check fallback models are working"
            log_message "  2. Consider upgrading Google Cloud plan"
            log_message "  3. Review usage patterns"
            log_message "  4. Update model configuration with: scripts/manage-gemini-models.sh update-config"
            
            return 2 # Warning exit code
        else
            print_success "All models are operational"
            return 0
        fi
    else
        log_message "⏭️  Skipping model tests (no API key)"
        return 0
    fi
}

show_current_configuration() {
    log_message ""
    log_message "🎯 Current primary models:"
    
    if command -v jq >/dev/null 2>&1; then
        jq -r '.models | to_entries[] | "  \(.key): \(.value.primary)"' "$CONFIG_FILE" | tee -a "$REPORT_FILE"
        
        log_message ""
        log_message "📅 Configuration last updated:"
        local last_updated
        last_updated=$(jq -r '.last_updated' "$CONFIG_FILE")
        log_message "  $last_updated"
    else
        log_message "  (jq not available - install with: brew install jq)"
    fi
}

check_service_health() {
    log_message ""
    log_message "🔍 Service health check:"
    
    # Check if services are running on expected ports
    local services=(
        "3001:API Gateway"
        "3002:Dialogue Service" 
        "3003:User Service"
        "3004:Card Service"
    )
    
    for service in "${services[@]}"; do
        local port=$(echo "$service" | cut -d: -f1)
        local name=$(echo "$service" | cut -d: -f2)
        
        if curl -f "http://localhost:$port/api/health" >/dev/null 2>&1; then
            log_message "  ✅ $name (port $port) operational"
        else
            log_message "  ❌ $name (port $port) not responding"
        fi
    done
}

check_database_health() {
    log_message ""
    log_message "🗄️  Database health check:"
    
    # PostgreSQL
    if docker exec postgres-2d1l pg_isready -U danniwang >/dev/null 2>&1; then
        log_message "  ✅ PostgreSQL operational"
    else
        log_message "  ❌ PostgreSQL not responding"
    fi
    
    # Redis
    if docker exec redis-2d1l redis-cli ping >/dev/null 2>&1; then
        log_message "  ✅ Redis operational"
    else
        log_message "  ❌ Redis not responding"
    fi
    
    # Neo4j
    if curl -f http://localhost:7475 >/dev/null 2>&1; then
        log_message "  ✅ Neo4j operational"
    else
        log_message "  ❌ Neo4j not responding"
    fi
    
    # Weaviate
    if curl -f http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1; then
        log_message "  ✅ Weaviate operational"
    else
        log_message "  ❌ Weaviate not responding"
    fi
}

generate_recommendations() {
    local test_result=$1
    
    log_message ""
    log_message "💡 Daily Recommendations:"
    
    case $test_result in
        0)
            log_message "  ✅ System is healthy - no action required"
            log_message "  📅 Next check: Tomorrow at same time"
            ;;
        1)
            log_message "  ❌ Model testing failed - investigate immediately"
            log_message "  🔧 Actions: Check API key, network connectivity, Google API status"
            ;;
        2)
            log_message "  ⚠️  Quota issues detected - review and optimize"
            log_message "  🔧 Actions:"
            log_message "     - Update fallback chains: scripts/manage-gemini-models.sh update-config"
            log_message "     - Monitor usage patterns"
            log_message "     - Consider upgrading Google Cloud plan"
            ;;
        *)
            log_message "  ❓ Unknown status - manual investigation required"
            ;;
    esac
    
    # Check if it's been more than a week since last config update
    if command -v jq >/dev/null 2>&1; then
        local last_updated
        last_updated=$(jq -r '.last_updated' "$CONFIG_FILE")
        local days_since_update
        days_since_update=$(( ($(date +%s) - $(date -d "$last_updated" +%s 2>/dev/null || echo 0)) / 86400 ))
        
        if [ "$days_since_update" -gt 7 ]; then
            log_message ""
            log_message "  📅 Configuration is $days_since_update days old"
            log_message "  💡 Consider checking for new Google models: scripts/manage-gemini-models.sh list-models"
        fi
    fi
}

create_summary_report() {
    local test_result=$1
    
    # Create a brief summary for quick reference
    local summary_file="$LOG_DIR/model-health-summary.txt"
    
    cat > "$summary_file" << EOF
2D1L Model Health Summary - $(date)
=====================================

Status: $( [ $test_result -eq 0 ] && echo "✅ HEALTHY" || [ $test_result -eq 2 ] && echo "⚠️  WARNING" || echo "❌ CRITICAL" )
Last Check: $(date)
Report File: $REPORT_FILE

Primary Models:
$(jq -r '.models | to_entries[] | "  \(.key): \(.value.primary)"' "$CONFIG_FILE" 2>/dev/null || echo "  (configuration unavailable)")

Next Action: $( [ $test_result -eq 0 ] && echo "None required" || [ $test_result -eq 2 ] && echo "Review quota issues" || echo "Investigate failures" )
EOF
    
    log_message ""
    log_message "📄 Summary report created: $summary_file"
}

# Main execution
main() {
    # Clear the report file for today
    echo "" > "$REPORT_FILE"
    
    print_header "Daily Gemini Model Health Check - $(date)"
    
    # Environment check
    check_environment
    local has_api_key=$?
    
    # Show current configuration
    show_current_configuration
    
    # Test models if API key available
    test_models $has_api_key
    local test_result=$?
    
    # Check service health
    check_service_health
    
    # Check database health  
    check_database_health
    
    # Generate recommendations
    generate_recommendations $test_result
    
    # Create summary
    create_summary_report $test_result
    
    log_message ""
    print_header "Health Check Complete"
    log_message "📄 Full report: $REPORT_FILE"
    log_message "📋 Summary: $LOG_DIR/model-health-summary.txt"
    
    # Exit with appropriate code
    exit $test_result
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        echo "2D1L Daily Gemini Model Health Check"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quiet, -q    Suppress colored output (useful for cron)"
        echo "  --no-log       Don't write to log file"
        echo ""
        echo "Environment variables:"
        echo "  GOOGLE_API_KEY    Required for model testing"
        echo ""
        echo "Output files:"
        echo "  $LOG_DIR/model-health-YYYY-MM-DD.log"
        echo "  $LOG_DIR/model-health-summary.txt"
        echo ""
        echo "Exit codes:"
        echo "  0: All healthy"
        echo "  1: Critical issues (model tests failed)"
        echo "  2: Warning issues (quota exceeded)"
        exit 0
        ;;
    "--quiet"|"-q")
        # Disable colors for cron/automated use
        RED=''
        GREEN=''
        YELLOW=''
        BLUE=''
        NC=''
        main
        ;;
    "--no-log")
        # Don't write to log file
        REPORT_FILE="/dev/null"
        main
        ;;
    "")
        # Normal execution
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 