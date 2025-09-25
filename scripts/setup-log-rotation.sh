#!/bin/bash

# Log Rotation Setup Script for 2D1L Project
# Configures PM2 to automatically rotate logs to prevent accumulation

set -e

echo "⚙️  Setting up log rotation for 2D1L Project"
echo "============================================="

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install PM2 first:"
    echo "   npm install -g pm2"
    exit 1
fi

# Create PM2 log rotation configuration
cat > ecosystem.logrotate.config.js << 'EOF'
// PM2 Log Rotation Configuration for 2D1L Project
// This configuration ensures logs are automatically rotated and old ones are cleaned up

module.exports = {
  apps: [
    // Add your existing app configurations here
    // The log rotation settings will be applied to all apps
  ],
  
  // Global log rotation settings
  log_rotate: {
    max_size: '10M',        // Rotate when log reaches 10MB
    retain: 5,              // Keep only 5 rotated files
    compress: true,         // Compress old log files
    dateFormat: 'YYYY-MM-DD_HH-mm-ss', // Date format for rotated files
    workerInterval: '30',   // Check for rotation every 30 seconds
    rotateInterval: '0 0 * * *', // Daily rotation at midnight
    rotateModule: true      // Use PM2's built-in rotation module
  }
};
EOF

echo "📝 Created ecosystem.logrotate.config.js"

# Install PM2 log rotate module if not already installed
echo "📦 Installing PM2 log rotate module..."
pm2 install pm2-logrotate

# Configure PM2 log rotate settings
echo "⚙️  Configuring PM2 log rotate settings..."

# Set log rotation parameters
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
pm2 set pm2-logrotate:rotateModule true

echo "✅ PM2 log rotation configured successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "   • Max log size: 10MB"
echo "   • Retain files: 5"
echo "   • Compress old logs: Yes"
echo "   • Rotation schedule: Daily at midnight"
echo "   • Check interval: Every 30 seconds"
echo ""
echo "🔄 To apply these settings to your running processes:"
echo "   pm2 reload ecosystem.config.js"
echo ""
echo "📊 To check log rotation status:"
echo "   pm2 show pm2-logrotate"
echo ""
echo "🧹 To manually trigger log rotation:"
echo "   pm2 reloadLogs"
