#!/bin/bash

# Log Cleanup Script for 2D1L Project
# Safely removes old log files while preserving recent ones

set -e

LOG_DIR="logs"
BACKUP_DIR="logs/backup-$(date +%Y%m%d_%H%M%S)"

echo "🧹 2D1L Log Cleanup Script"
echo "=========================="

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# Function to safely clean logs for a service
clean_service_logs() {
    local service_name="$1"
    local keep_count="${2:-3}"  # Default to keeping 3 most recent files
    
    echo "🔍 Processing $service_name logs..."
    
    # Find all log files for this service
    local files=($(ls -t "$LOG_DIR"/${service_name}*.log 2>/dev/null || true))
    
    if [ ${#files[@]} -eq 0 ]; then
        echo "   No log files found for $service_name"
        return
    fi
    
    echo "   Found ${#files[@]} log files for $service_name"
    
    # Keep the most recent files, backup and remove the rest
    local files_to_remove=()
    for ((i=keep_count; i<${#files[@]}; i++)); do
        files_to_remove+=("${files[i]}")
    done
    
    if [ ${#files_to_remove[@]} -gt 0 ]; then
        echo "   📦 Backing up ${#files_to_remove[@]} old log files..."
        for file in "${files_to_remove[@]}"; do
            cp "$file" "$BACKUP_DIR/"
            rm "$file"
            echo "   ✅ Removed: $(basename "$file")"
        done
    else
        echo "   ✅ No old logs to remove for $service_name"
    fi
}

# Clean up PM2 system logs (keep only 2 most recent)
echo "🔍 Processing PM2 system logs..."
pm2_files=($(ls -t "$LOG_DIR"/pm2-*.log 2>/dev/null || true))
if [ ${#pm2_files[@]} -gt 2 ]; then
    echo "   📦 Backing up old PM2 logs..."
    for ((i=2; i<${#pm2_files[@]}; i++)); do
        cp "${pm2_files[i]}" "$BACKUP_DIR/"
        rm "${pm2_files[i]}"
        echo "   ✅ Removed: $(basename "${pm2_files[i]}")"
    done
else
    echo "   ✅ No old PM2 logs to remove"
fi

# Clean up service-specific logs (keep only 1 most recent)
echo "🔍 Processing service-specific logs..."
service_files=($(ls -t "$LOG_DIR"/*-service.log "$LOG_DIR"/*-worker.log 2>/dev/null || true))
if [ ${#service_files[@]} -gt 1 ]; then
    echo "   📦 Backing up old service logs..."
    for ((i=1; i<${#service_files[@]}; i++)); do
        cp "${service_files[i]}" "$BACKUP_DIR/"
        rm "${service_files[i]}"
        echo "   ✅ Removed: $(basename "${service_files[i]}")"
    done
else
    echo "   ✅ No old service logs to remove"
fi

# Clean up numbered log files for each service
services=(
    "api-gateway"
    "card-worker" 
    "conversation-timeout-worker"
    "embedding-worker"
    "graph-projection-worker"
    "ingestion-worker"
    "insight-worker"
    "maintenance-worker"
    "notification-worker"
    "ontology-optimization-worker"
)

for service in "${services[@]}"; do
    clean_service_logs "$service" 3
done

# Clean up any remaining numbered logs
echo "🔍 Processing remaining numbered logs..."
numbered_files=($(ls -t "$LOG_DIR"/*-[0-9]*.log 2>/dev/null || true))
if [ ${#numbered_files[@]} -gt 0 ]; then
    echo "   📦 Backing up remaining numbered logs..."
    for file in "${numbered_files[@]}"; do
        cp "$file" "$BACKUP_DIR/"
        rm "$file"
        echo "   ✅ Removed: $(basename "$file")"
    done
fi

# Show final results
echo ""
echo "📊 Cleanup Summary:"
echo "==================="
echo "📁 Backup location: $BACKUP_DIR"
echo "📈 Remaining log files:"
ls -la "$LOG_DIR"/*.log 2>/dev/null | wc -l | xargs echo "   Total files:"
echo "💾 Backup files created:"
ls -la "$BACKUP_DIR"/*.log 2>/dev/null | wc -l | xargs echo "   Total backed up:"

echo ""
echo "✅ Log cleanup completed successfully!"
echo "💡 Tip: You can safely delete the backup directory after verifying everything works correctly"
echo "   rm -rf $BACKUP_DIR"
