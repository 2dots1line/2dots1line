#!/bin/bash

# Simplified 2D1L Application Deployment Script
# This script deploys the 2D1L application to the Compute Engine VM
# Run this script ON the VM after VM setup is complete

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="d1l-460112"
REPO_URL="https://github.com/2dots1line/2dots1line.git"
BRANCH="compute-engine-deployment"

echo -e "${BLUE}🚀 Starting 2D1L Application Deployment${NC}"
echo "Project: $PROJECT_ID"
echo ""

# Get VM external IP
VM_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")
echo -e "${GREEN}🌐 VM External IP: $VM_IP${NC}"

# Install Docker if not present
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Clone repository
echo -e "${YELLOW}📥 Cloning repository...${NC}"
cd ~
if [ -d "2D1L" ]; then
    echo "Repository already exists, updating..."
    cd 2D1L
    git pull origin $BRANCH
else
    git clone $REPO_URL 2D1L
    cd 2D1L
    git checkout $BRANCH
fi

# Create .env file with hardcoded values for now
echo -e "${YELLOW}🔑 Creating environment file...${NC}"
cat > .env << EOF
# === APPLICATION CONFIGURATION ===
NODE_ENV=production

# === DATABASE CONFIGURATIONS ===
# PostgreSQL (Docker container on same VM)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123
POSTGRES_DB=twodots1line
POSTGRES_HOST_PORT=5433

# Neo4j (Docker container on same VM)
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
NEO4J_HTTP_HOST_PORT=7474
NEO4J_BOLT_HOST_PORT=7688

# Weaviate (Docker container on same VM)
WEAVIATE_SCHEME=http
WEAVIATE_HOST_PORT=8080

# Redis (Docker container on same VM)
REDIS_HOST_PORT=6379

# === CONNECTION URLS ===
# Database URLs (localhost since Docker runs on same VM)
DATABASE_URL=postgresql://postgres:password123@localhost:5433/twodots1line
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7688
NEO4J_URI_DOCKER=neo4j://neo4j:7687
WEAVIATE_URL=http://localhost:8080
WEAVIATE_SCHEME_DOCKER=http
WEAVIATE_HOST_DOCKER=weaviate:8080

# === APPLICATION URLS ===
# Use VM external IP for external access
FRONTEND_URL=http://$VM_IP:3000
NOTIFICATION_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://$VM_IP:3001
NEXT_PUBLIC_WEAVIATE_URL=http://$VM_IP:8080

# === SECURITY ===
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d

# === AI PROVIDER KEYS ===
GOOGLE_API_KEY=your-google-api-key-here
PEXELS_API_KEY=your-pexels-api-key-here

# === LLM MODEL CONFIGURATION ===
LLM_CHAT_MODEL=gemini-2.5-flash
LLM_VISION_MODEL=gemini-2.5-flash
LLM_EMBEDDING_MODEL=text-embedding-004
LLM_FALLBACK_MODEL=gemini-2.0-flash-exp

# === MEDIA GENERATION MODELS ===
LLM_IMAGE_MODEL=gemini-2.5-flash-image
LLM_VIDEO_MODEL=veo-3.0-fast-generate-001
LLM_LIVE_MODEL=gemini-live-2.5-flash-preview-native-audio
LLM_AUDIO_TTS_MODEL=gemini-native-audio

# === PORTS ===
API_GATEWAY_HOST_PORT=3001
API_GATEWAY_CONTAINER_PORT=3001

# === CONVERSATION TIMEOUT CONFIGURATION ===
CONVERSATION_TIMEOUT_MINUTES=2
TIMEOUT_CHECK_INTERVAL_SECONDS=30
ENABLE_INGESTION_QUEUE=true

# === DOCKER NETWORK CONFIG ===
POSTGRES_HOST_FOR_APP_IN_DOCKER=postgres
POSTGRES_PORT_FOR_APP_IN_DOCKER=5432
REDIS_HOST_DOCKER=redis
REDIS_PORT_FOR_APP_IN_DOCKER=6379
EOF

echo -e "${GREEN}✅ Environment file created${NC}"

# Install dependencies and build
echo -e "${YELLOW}📦 Installing dependencies and building...${NC}"
pnpm setup
pnpm build

# Start Docker services
echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Verify database connections
echo -e "${YELLOW}🔍 Verifying database connections...${NC}"

# PostgreSQL
if docker exec postgres-2d1l pg_isready -U postgres -d twodots1line; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    exit 1
fi

# Redis
if docker exec redis-2d1l redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
    exit 1
fi

# Neo4j
if curl -s http://localhost:7474 > /dev/null; then
    echo -e "${GREEN}✅ Neo4j is ready${NC}"
else
    echo -e "${RED}❌ Neo4j connection failed${NC}"
    exit 1
fi

# Weaviate
if curl -s http://localhost:8080/v1/.well-known/ready > /dev/null; then
    echo -e "${GREEN}✅ Weaviate is ready${NC}"
else
    echo -e "${RED}❌ Weaviate connection failed${NC}"
    exit 1
fi

# Start PM2 services
echo -e "${YELLOW}🚀 Starting PM2 services...${NC}"
pm2 start ecosystem.config.js
pm2 save

# Start frontend in production mode
echo -e "${YELLOW}🌐 Starting frontend...${NC}"
cd apps/web-app
pnpm build
pm2 start "pnpm start" --name "web-app" --cwd /home/$USER/2D1L/apps/web-app
pm2 save

# Final verification
echo -e "${YELLOW}🔍 Final verification...${NC}"
sleep 10

# Check PM2 status
echo -e "${BLUE}📊 PM2 Status:${NC}"
pm2 status

# Check Docker containers
echo -e "${BLUE}🐳 Docker Containers:${NC}"
docker ps

# Test API Gateway
if curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway is responding${NC}"
else
    echo -e "${RED}❌ API Gateway is not responding${NC}"
fi

# Test frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Application deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Access URLs:${NC}"
echo -e "${GREEN}🌐 Frontend: http://$VM_IP:3000${NC}"
echo -e "${GREEN}🔌 API Gateway: http://$VM_IP:3001${NC}"
echo -e "${GREEN}📊 Neo4j Browser: http://$VM_IP:7474${NC}"
echo -e "${GREEN}🔍 Weaviate: http://$VM_IP:8080${NC}"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "  pm2 status          # Check PM2 processes"
echo "  pm2 logs            # View PM2 logs"
echo "  docker ps           # Check Docker containers"
echo "  docker-compose logs # View Docker logs"

