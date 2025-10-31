#!/bin/bash

# Set environment variables
export NODE_ENV=production
export NEXT_PUBLIC_API_BASE_URL=https://2d1l.com
export NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://2d1l.com

# Change to project root directory (where .next is located)
cd /home/danniwang/2D1L

# CRITICAL: Clean up any existing Next.js processes before starting
pkill -f "next-server" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

# Kill any processes using port 3000
sudo fuser -k 3000/tcp 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start the Next.js production server from the web-app directory
cd apps/web-app

# Use exec to replace the shell process with next start
# This ensures PM2 can properly manage the process tree
exec pnpm start
