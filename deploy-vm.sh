#!/bin/bash

# 2D1L Compute Engine Deployment Script
# This script automates the deployment of the 2D1L monorepo to Google Cloud Compute Engine

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VM_NAME="2d1l-vm"
ZONE="us-central1-a"
MACHINE_TYPE="e2-standard-4"
BOOT_DISK_SIZE="100GB"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
PROJECT_ID="d1l-460112"

echo -e "${BLUE}🚀 Starting 2D1L Compute Engine Deployment${NC}"
echo "Project: $PROJECT_ID"
echo "VM Name: $VM_NAME"
echo "Zone: $ZONE"
echo "Machine Type: $MACHINE_TYPE"
echo ""

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📋 Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Create the VM instance
echo -e "${YELLOW}🖥️  Creating Compute Engine VM instance...${NC}"
gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --boot-disk-size=$BOOT_DISK_SIZE \
    --boot-disk-type=pd-ssd \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --tags=2d1l-server \
    --metadata=startup-script='#!/bin/bash
# Update system
apt-get update && apt-get upgrade -y

# Install essential tools
apt-get install -y git curl wget unzip build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install pnpm and PM2
npm install -g pnpm@8.14.1
npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Create logs directory
mkdir -p /home/$USER/2D1L/logs

echo "✅ VM setup complete. Ready for application deployment."'

# Wait for VM to be ready
echo -e "${YELLOW}⏳ Waiting for VM to be ready...${NC}"
sleep 30

# Get VM external IP
VM_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
echo -e "${GREEN}✅ VM created successfully!${NC}"
echo -e "${GREEN}🌐 External IP: $VM_IP${NC}"

# Create firewall rules
echo -e "${YELLOW}🔥 Creating firewall rules...${NC}"

# Allow HTTP
gcloud compute firewall-rules create allow-http-2d1l \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server \
    --description "Allow HTTP traffic for 2D1L"

# Allow HTTPS
gcloud compute firewall-rules create allow-https-2d1l \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server \
    --description "Allow HTTPS traffic for 2D1L"

# Allow frontend port
gcloud compute firewall-rules create allow-frontend-2d1l \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server \
    --description "Allow frontend traffic for 2D1L"

# Allow API Gateway port
gcloud compute firewall-rules create allow-api-2d1l \
    --allow tcp:3001 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server \
    --description "Allow API Gateway traffic for 2D1L"

echo -e "${GREEN}✅ Firewall rules created successfully!${NC}"

# Display next steps
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. SSH into the VM:"
echo "   gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "2. Or use the browser SSH:"
echo "   https://console.cloud.google.com/compute/instancesDetail/zones/$ZONE/instances/$VM_NAME"
echo ""
echo "3. Once connected, run the application deployment script:"
echo "   ./deploy-app.sh"
echo ""
echo -e "${GREEN}🎉 VM deployment complete!${NC}"
echo -e "${GREEN}🌐 Your VM is accessible at: http://$VM_IP${NC}"
