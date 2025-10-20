#!/bin/bash

# Set environment variables
export NODE_ENV=production
export NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001
export NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://34.136.210.47:3002

# Change to project root directory (where .next is located)
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L

# Start the Next.js production server from the web-app directory
cd apps/web-app && exec pnpm start
