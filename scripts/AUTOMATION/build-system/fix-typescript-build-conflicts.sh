#!/bin/bash

# 2D1L TypeScript Build Info File Conflict Fix
# Adds explicit tsBuildInfoFile paths to prevent conflicts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to add tsBuildInfoFile to a JSON config
add_build_info_file() {
    local config_file="$1"
    local build_info_path="$2"
    
    if [ ! -f "$config_file" ]; then
        return
    fi
    
    # Check if tsBuildInfoFile already exists
    if grep -q "tsBuildInfoFile" "$config_file"; then
        log_info "$(basename "$config_file") already has tsBuildInfoFile"
        return
    fi
    
    # Check if the file has compilerOptions
    if ! grep -q "compilerOptions" "$config_file"; then
        log_warning "$(basename "$config_file") has no compilerOptions, skipping"
        return
    fi
    
    log_info "Adding tsBuildInfoFile to $(basename "$config_file")..."
    
    # Create a temporary file for the updated config
    local temp_file=$(mktemp)
    
    # Use Node.js to properly parse and update the JSON
    node -e "
        const fs = require('fs');
        const path = '$config_file';
        const buildInfoPath = '$build_info_path';
        
        try {
            const config = JSON.parse(fs.readFileSync(path, 'utf8'));
            
            if (config.compilerOptions) {
                config.compilerOptions.tsBuildInfoFile = buildInfoPath;
                fs.writeFileSync('$temp_file', JSON.stringify(config, null, 2) + '\n');
                console.log('✅ Updated: ' + path);
            }
        } catch (error) {
            console.error('❌ Error updating ' + path + ':', error.message);
            process.exit(1);
        }
    "
    
    if [ $? -eq 0 ]; then
        mv "$temp_file" "$config_file"
        log_success "Updated $(basename "$config_file")"
    else
        rm -f "$temp_file"
        log_error "Failed to update $(basename "$config_file")"
    fi
}

log_info "🔧 Fixing TypeScript Build Info File Conflicts..."

# Clean up any existing conflicting files
log_info "Cleaning up existing tsbuildinfo conflicts..."
find "$ROOT_DIR" -name "*.tsbuildinfo" -not -path "*/node_modules/*" -delete
find "$ROOT_DIR" -name "*tsbuildinfo*" -not -path "*/node_modules/*" -not -name "*.json" -delete

# Fix all tsconfig.build.json files
log_info "Updating tsconfig.build.json files..."
while IFS= read -r config_file; do
    add_build_info_file "$config_file" "./dist/tsconfig.build.tsbuildinfo"
done < <(find "$ROOT_DIR" -name "tsconfig.build.json" -not -path "*/node_modules/*")

# Fix main tsconfig.json files that have composite: true
log_info "Updating main tsconfig.json files with composite builds..."
while IFS= read -r config_file; do
    if grep -q '"composite".*:.*true' "$config_file"; then
        add_build_info_file "$config_file" "./dist/tsconfig.tsbuildinfo"
    fi
done < <(find "$ROOT_DIR" -name "tsconfig.json" -not -path "*/node_modules/*" -not -name "tsconfig.base.json")

# Update turbo.json to prevent parallel build conflicts
log_info "Updating turbo.json for safer parallel builds..."
if [ -f "$ROOT_DIR/turbo.json" ]; then
    node -e "
        const fs = require('fs');
        const turboPath = '$ROOT_DIR/turbo.json';
        
        try {
            const config = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
            
            // Add safer build outputs configuration
            if (config.tasks && config.tasks.build) {
                config.tasks.build.outputs = ['dist/**', '!dist/**/*.tsbuildinfo'];
            }
            
            // Add cleanup task
            config.tasks['clean:build'] = {
                'cache': false,
                'outputs': []
            };
            
            fs.writeFileSync(turboPath, JSON.stringify(config, null, 2) + '\n');
            console.log('✅ Updated turbo.json');
        } catch (error) {
            console.error('❌ Error updating turbo.json:', error.message);
        }
    "
fi

# Update .gitignore to be more specific about tsbuildinfo files
log_info "Updating .gitignore for better tsbuildinfo handling..."
if ! grep -q "dist/\*\.tsbuildinfo" "$ROOT_DIR/.gitignore"; then
    echo "" >> "$ROOT_DIR/.gitignore"
    echo "# TypeScript build info files (specific to avoid conflicts)" >> "$ROOT_DIR/.gitignore"
    echo "dist/*.tsbuildinfo" >> "$ROOT_DIR/.gitignore"
    echo "**/dist/*.tsbuildinfo" >> "$ROOT_DIR/.gitignore"
    log_success "Updated .gitignore"
fi

log_success "🎯 TypeScript build conflicts fixed!"
log_info "💡 Run 'pnpm build' to test the new configuration" 