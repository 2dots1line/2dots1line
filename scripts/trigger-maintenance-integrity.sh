#!/bin/bash

# trigger-maintenance-integrity.sh
# Convenience script to trigger maintenance worker integrity check from anywhere
# 
# Usage: ./scripts/trigger-maintenance-integrity.sh
# Or: bash scripts/trigger-maintenance-integrity.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

print_status "Project root: $PROJECT_ROOT"

# Check if we're in the right project structure
if [ ! -d "$PROJECT_ROOT/workers/maintenance-worker" ]; then
    print_error "Maintenance worker directory not found"
    print_error "Expected: $PROJECT_ROOT/workers/maintenance-worker"
    exit 1
fi

# Change to the maintenance worker directory
cd "$PROJECT_ROOT/workers/maintenance-worker"

print_status "Changed to maintenance worker directory: $(pwd)"

# Check if the trigger script exists
if [ ! -f "trigger-integrity-check.sh" ]; then
    print_error "Trigger script not found: trigger-integrity-check.sh"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in maintenance worker directory"
    exit 1
fi

print_status "Starting manual integrity check..."
print_status "This will verify database consistency across PostgreSQL, Neo4j, and Weaviate"
echo

# Run the integrity check using the local script
if ./trigger-integrity-check.sh; then
    echo
    print_success "Manual integrity check completed successfully!"
    print_success "Check the output above for any inconsistencies found."
else
    echo
    print_error "Manual integrity check failed!"
    print_error "Check the error messages above for details."
    exit 1
fi
