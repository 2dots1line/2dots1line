#!/bin/bash
# Switch branch on VM with proper service management

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <branch-name>"
    echo "   Example: $0 feature/new-feature"
    exit 1
fi

BRANCH_NAME="$1"

echo "🔄 Switching VM to branch: $BRANCH_NAME"

# Stop services
echo "⏹️ Stopping services..."
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 stop all"

# Switch branch
echo "🌿 Switching to branch: $BRANCH_NAME"
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && git fetch origin && git checkout $BRANCH_NAME && git pull origin $BRANCH_NAME"

# Install dependencies
echo "📦 Installing dependencies..."
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pnpm install"

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pnpm --filter=@2dots1line/database db:generate"

# Build application
echo "🔨 Building application..."
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pnpm build"

# Start services
echo "▶️ Starting services..."
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.config.js"

# Check status
echo "📊 Checking service status..."
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 status"

echo "✅ Branch switch complete!"
echo "🌐 VM should be accessible at: http://34.136.210.47:3000"
