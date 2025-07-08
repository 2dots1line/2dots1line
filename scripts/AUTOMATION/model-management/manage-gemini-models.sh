#!/bin/bash

# 2D1L Gemini Model Management Script
# Provides easy management of Gemini model configuration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/gemini_models.json"
TEST_SCRIPT="$SCRIPT_DIR/test_gemini_models.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi
    
    if [ ! -f "$TEST_SCRIPT" ]; then
        print_error "Test script not found: $TEST_SCRIPT"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Install with: brew install jq"
        exit 1
    fi
    
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_warning "GOOGLE_API_KEY environment variable not set"
        echo "Models tests will fail without a valid API key"
    fi
}

test_models() {
    print_header "Testing All Gemini Models"
    
    cd "$SCRIPT_DIR" || exit 1
    
    echo "🧪 Running automated model tests..."
    if node test_gemini_models.js; then
        print_success "Model testing completed"
        echo ""
        echo "📊 Updated test results:"
        jq '.testing_results' "$CONFIG_FILE"
    else
        print_error "Model testing failed"
        exit 1
    fi
}

show_status() {
    print_header "Current Model Configuration Status"
    
    echo "🎯 Primary models for each use case:"
    jq -r '.models | to_entries[] | "  \(.key): \(.value.primary)"' "$CONFIG_FILE"
    
    echo ""
    echo "🔄 Fallback models:"
    jq -r '.models | to_entries[] | "  \(.key): [\(.value.fallback | join(", "))]"' "$CONFIG_FILE"
    
    echo ""
    echo "🧪 Last test results:"
    jq -r '.testing_results | to_entries[] | "  \(.key): \(.value)"' "$CONFIG_FILE"
    
    echo ""
    echo "📅 Last updated: $(jq -r '.last_updated' "$CONFIG_FILE")"
    
    # Check for quota issues
    QUOTA_ISSUES=$(jq -r '.testing_results | to_entries[] | select(.value | contains("quota_exceeded") or contains("🚫")) | .key' "$CONFIG_FILE")
    if [ -n "$QUOTA_ISSUES" ]; then
        echo ""
        print_warning "Models with quota issues:"
        echo "$QUOTA_ISSUES" | while read -r model; do
            echo "  - $model"
        done
    fi
}

update_config() {
    print_header "Updating Model Configuration"
    
    # Backup current config
    BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    print_success "Created backup: $BACKUP_FILE"
    
    echo "📝 Opening model configuration for editing..."
    ${EDITOR:-nano} "$CONFIG_FILE"
    
    # Validate JSON after editing
    if jq empty "$CONFIG_FILE" 2>/dev/null; then
        print_success "Configuration file is valid JSON"
    else
        print_error "Configuration file contains invalid JSON"
        echo "🔄 Restoring backup..."
        cp "$BACKUP_FILE" "$CONFIG_FILE"
        exit 1
    fi
    
    echo ""
    echo "🔄 Testing updated configuration..."
    cd "$SCRIPT_DIR" || exit 1
    
    if node test_gemini_models.js; then
        print_success "Configuration updated and tested successfully"
        echo ""
        print_warning "Remember to restart services to apply changes:"
        echo "  pnpm services:restart"
    else
        print_error "Configuration test failed"
        echo "🔄 Restoring backup..."
        cp "$BACKUP_FILE" "$CONFIG_FILE"
        exit 1
    fi
}

check_quota() {
    print_header "Quota Status Check"
    
    cd "$SCRIPT_DIR" || exit 1
    
    echo "📈 Testing all models for quota status..."
    OUTPUT=$(node test_gemini_models.js 2>&1)
    
    # Extract quota information
    echo "$OUTPUT" | grep -E "(✅|🚫|quota)"
    
    # Summary
    AVAILABLE_COUNT=$(echo "$OUTPUT" | grep -c "✅")
    QUOTA_EXCEEDED_COUNT=$(echo "$OUTPUT" | grep -c "🚫\|quota_exceeded")
    
    echo ""
    echo "📊 Summary:"
    echo "  Available models: $AVAILABLE_COUNT"
    echo "  Quota exceeded: $QUOTA_EXCEEDED_COUNT"
    
    if [ "$QUOTA_EXCEEDED_COUNT" -gt 0 ]; then
        print_warning "Some models have quota issues - consider updating fallback chains"
    else
        print_success "All models are available"
    fi
}

list_available_models() {
    print_header "Available Google Models"
    
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_error "GOOGLE_API_KEY environment variable not set"
        exit 1
    fi
    
    echo "🔍 Fetching available models from Google API..."
    curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_API_KEY" | \
        jq -r '.models[]? | select(.name | contains("gemini") or contains("embedding")) | .name' | \
        sed 's/models\///' | sort
}

emergency_fallback() {
    print_header "Emergency Model Fallback"
    
    print_warning "This will replace your current configuration with emergency fallback models"
    echo "Current config will be backed up first."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled"
        exit 0
    fi
    
    # Backup current config
    BACKUP_FILE="$CONFIG_FILE.emergency_backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    print_success "Created emergency backup: $BACKUP_FILE"
    
    # Create emergency config
    cat > "$CONFIG_FILE" << 'EOF'
{
  "models": {
    "chat": {
      "primary": "gemini-1.5-flash",
      "fallback": ["gemini-1.5-flash-8b"],
      "description": "Emergency fallback for chat",
      "capabilities": ["text", "reasoning", "conversation"],
      "context_window": 1000000
    },
    "vision": {
      "primary": "gemini-1.5-flash", 
      "fallback": ["gemini-1.5-flash-8b"],
      "description": "Emergency fallback for vision",
      "capabilities": ["text", "images", "multimodal"],
      "context_window": 1000000
    },
    "embedding": {
      "primary": "text-embedding-004",
      "fallback": [],
      "description": "Standard embedding model",
      "capabilities": ["embeddings"],
      "context_window": 2048
    }
  },
  "available_models": {
    "gemini-1.5-flash": {
      "status": "available",
      "type": "stable",
      "capabilities": ["text", "images", "multimodal"],
      "context_window": 1000000
    },
    "gemini-1.5-flash-8b": {
      "status": "available", 
      "type": "stable",
      "capabilities": ["text", "images", "multimodal"],
      "context_window": 1000000
    },
    "text-embedding-004": {
      "status": "available",
      "type": "stable",
      "capabilities": ["embeddings"],
      "context_window": 2048
    }
  },
  "last_updated": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "testing_results": {
    "note": "Emergency configuration - run 'test' command to verify"
  }
}
EOF
    
    print_success "Emergency configuration applied"
    echo ""
    print_warning "Next steps:"
    echo "  1. Test the emergency config: $0 test"
    echo "  2. Restart services: pnpm services:restart"
    echo "  3. Restore full config when ready: cp $BACKUP_FILE $CONFIG_FILE"
}

show_help() {
    echo "2D1L Gemini Model Management Script"
    echo ""
    echo "Usage: $0 {command} [options]"
    echo ""
    echo "Commands:"
    echo "  test              - Test all configured models against current API key"
    echo "  status            - Show current configuration and test results"
    echo "  update-config     - Open config file for editing and test changes"
    echo "  check-quota       - Quick quota status check for all models"
    echo "  list-models       - List all available models from Google API"
    echo "  emergency         - Apply emergency fallback configuration"
    echo "  help              - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test                    # Test all models"
    echo "  $0 status                  # Show current status"
    echo "  $0 check-quota            # Quick quota check"
    echo "  EDITOR=code $0 update-config  # Use VS Code to edit config"
    echo ""
    echo "Environment variables:"
    echo "  GOOGLE_API_KEY            - Required for model testing"
    echo "  EDITOR                    - Editor for config updates (default: nano)"
    echo ""
    echo "Configuration file: $CONFIG_FILE"
    echo "Test script: $TEST_SCRIPT"
}

# Main script logic
case "$1" in
    "test")
        check_prerequisites
        test_models
        ;;
    "status")
        check_prerequisites
        show_status
        ;;
    "update-config")
        check_prerequisites
        update_config
        ;;
    "check-quota")
        check_prerequisites
        check_quota
        ;;
    "list-models")
        list_available_models
        ;;
    "emergency")
        emergency_fallback
        ;;
    "help"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 