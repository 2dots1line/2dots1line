#!/bin/bash
# scripts/deployment/setup-vm-with-fixes.sh
# VM Setup Script with Persistent Fixes Applied

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up VM with persistent fixes...${NC}"

# 1. Clone repository
echo -e "${YELLOW}📥 Cloning repository...${NC}"
if [ -d "2D1L" ]; then
    echo "Repository already exists, updating..."
    cd 2D1L
    git pull origin compute-engine-deployment
else
    git clone https://github.com/2dots1line/2dots1line.git 2D1L
    cd 2D1L
    git checkout compute-engine-deployment
fi

# 2. Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install
pnpm build

# 3. Setup Nginx with correct configuration
echo -e "${YELLOW}🔧 Configuring Nginx with image loading fixes...${NC}"
sudo tee /etc/nginx/sites-available/2d1l > /dev/null << 'EOF'
server {
    server_name 2d1l.com www.2d1l.com;

    # Image API routes (Next.js app) - MUST come before general /api/ route
    location /api/covers/ {
        proxy_pass http://localhost:3000/api/covers/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Other API routes (API Gateway)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Notification Worker (Socket.IO)
    location /socket.io/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (Next.js app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/2d1l.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/2d1l.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.2d1l.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = 2d1l.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name 2d1l.com www.2d1l.com;
    return 404;
}
EOF

# 4. Enable site and test configuration
echo -e "${YELLOW}🔗 Enabling Nginx site...${NC}"
sudo ln -sf /etc/nginx/sites-available/2d1l /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Start services
echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
docker-compose -f docker-compose.dev.yml up -d

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

echo -e "${YELLOW}🚀 Starting application services...${NC}"
pnpm start:prod

echo -e "${GREEN}✅ VM setup complete with all fixes applied!${NC}"
echo -e "${BLUE}📋 Applied fixes:${NC}"
echo -e "  • Image loading: /api/covers/ routes to Next.js app"
echo -e "  • Generated images: Included in git deployment"
echo -e "  • Nginx configuration: Proper route priority"
echo -e "  • Socket.IO: Notification worker routing"
echo -e "  • HTTPS: SSL termination configured"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
echo -e "  • Frontend: https://2d1l.com"
echo -e "  • API: https://2d1l.com/api/"
echo -e "  • Socket.IO: https://2d1l.com/socket.io/"
echo ""
echo -e "${YELLOW}🔍 Verify fixes:${NC}"
echo -e "  • Test image loading: Generate a card cover and verify it displays"
echo -e "  • Test Socket.IO: Check browser console for connection success"
echo -e "  • Test HTTPS: Verify no 'Not secure' warnings"
