# 2D1L Deployment and Startup Guide

## Overview

This guide provides comprehensive instructions for deploying and managing the 2D1L application across different environments (local development and VM production). It covers first-time setup, daily workflows, troubleshooting, and maintenance procedures.

## Table of Contents

1. [First-Time Setup](#first-time-setup)
2. [Environment Configurations](#environment-configurations)
3. [Daily Development Workflow](#daily-development-workflow)
4. [Deployment Workflows](#deployment-workflows)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Maintenance Procedures](#maintenance-procedures)

---

## First-Time Setup

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- PM2 (installed globally: `npm install -g pm2`)
- Git access to the repository
- Google Cloud SDK (for VM deployment)

### Local Development Setup

#### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd 2D1L

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@2dots1line/database db:generate
```

#### 2. Environment Configuration

```bash
# Create .env file for local development
# Edit environment variables for local development
# Key variables to set:
# - FRONTEND_URL=http://localhost:3000
# - NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
# - Database connection strings for local Docker services
```

#### 3. Start Database Services

```bash
# Start all database services (PostgreSQL, Neo4j, Weaviate, Redis)
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker ps
```

#### 4. Build and Start Application

```bash
# Build all packages
pnpm build

# Start in development mode (recommended for local development)
pnpm start:dev
```

#### 5. Set Up Frontend Environment (CRITICAL - One-time setup)

**CRITICAL**: The frontend requires specific environment variables to function properly:

```bash
# Create web app environment file
cd apps/web-app
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3001" > .env
echo "NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002" >> .env
cd ../..

# Rebuild web app with environment variables
cd apps/web-app && pnpm build && cd ../..
pm2 restart web-app
```

#### 6. Create Test User (One-time setup)

```bash
# Register test user for development
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "dev-user-123", "email": "dev@example.com", "password": "password123"}'
```

#### 7. Access the Application

```bash
# Open browser to clear cache and login
open http://localhost:3000/clear-cache.html
# Then go to: http://localhost:3000
# Login with: dev@example.com / password123
```

### VM Production Setup

#### 1. VM Initial Setup

```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Clone repository
git clone <repository-url>
cd 2D1L

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@2dots1line/database db:generate
```

#### 2. VM Environment Configuration (STANDARDIZED)

**CRITICAL**: Use the automated environment setup script to ensure consistency:

```bash
# Run the standardized environment setup
./scripts/deployment/setup-vm-environment.sh

# This script will:
# - Create .env from envexample.md template
# - Validate all critical environment variables
# - Ensure port consistency (DIMENSION_REDUCER_HOST_PORT=5001)
# - Create environment validation script
```

**Manual Configuration (if needed):**
```bash
# Edit environment variables for VM production
# Key variables to set:
# - FRONTEND_URL=http://34.136.210.47:3000
# - NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001
# - DIMENSION_REDUCER_HOST_PORT=5001
# - DIMENSION_REDUCER_URL=http://localhost:5001
# - Database connection strings for VM Docker services
```

#### 3. Start VM Services

```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d

# Validate environment (optional but recommended)
./scripts/deployment/validate-environment.sh

# Build and start in production mode
pnpm build
pnpm start:prod
```

---

## Environment Configurations

### Ecosystem Configurations

The project uses three different PM2 ecosystem configurations:

#### 1. `scripts/deployment/ecosystem.config.js` (Original Full Configuration)
- **Use for:** VM deployment with all services
- **Services:** API Gateway + All Workers + Web App
- **Environment:** Production

#### 2. `scripts/deployment/ecosystem.dev.config.js` (Development Configuration)
- **Use for:** Local development
- **Services:** API Gateway + Web App (dev mode with hot reload)
- **Environment:** Development with file watching

#### 3. `scripts/deployment/ecosystem.prod.config.js` (Production Configuration)
- **Use for:** VM production deployment
- **Services:** API Gateway + All Workers + Web App (production mode)
- **Environment:** Production

### Environment Variables

#### Local Development Environment Variables

**Root `.env` file** (backend services):
```bash
# Database URLs (local Docker)
DATABASE_URL=postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line
NEO4J_URI=neo4j://localhost:7688
WEAVIATE_URL=http://localhost:8080
REDIS_URL=redis://localhost:6379

# Service URLs
NOTIFICATION_SERVICE_URL=http://localhost:3002

# API Keys
GOOGLE_API_KEY=your_google_api_key
PEXELS_API_KEY=your_pexels_api_key
```

**`apps/web-app/.env` file** (frontend client-side variables - REQUIRED):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002
```

**CRITICAL**: The `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` is essential for Socket.IO connections and real-time features like HRT seed entities, video notifications, and insight generation notifications.

#### VM Production Environment Variables

**Root `.env` file** (backend services):
```bash
# Database URLs (VM Docker)
DATABASE_URL=postgresql://postgres:password@localhost:5433/twodots1line
NEO4J_URI=neo4j://localhost:7688
WEAVIATE_URL=http://localhost:8080
REDIS_URL=redis://localhost:6379

# Service URLs
NOTIFICATION_SERVICE_URL=http://34.136.210.47:3002

# API Keys (same as local)
GOOGLE_API_KEY=your_google_api_key
PEXELS_API_KEY=your_pexels_api_key
```

**`apps/web-app/.env` file** (frontend client-side variables - REQUIRED):
```bash
NEXT_PUBLIC_API_BASE_URL=https://34.136.210.47
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://34.136.210.47
```

**CRITICAL**: The `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` is essential for Socket.IO connections and real-time features like HRT seed entities, video notifications, and insight generation notifications.

---

## HTTPS and PWA Setup (VM Production)

### HTTPS Configuration

The VM production environment now includes HTTPS support:

**Nginx Reverse Proxy:**
- Handles HTTPS termination
- Redirects HTTP (80) to HTTPS (443)
- Proxies requests to internal services
- Self-signed SSL certificate for testing

**Environment Variables (HTTPS):**
```bash
# VM Production with HTTPS
NEXT_PUBLIC_API_BASE_URL=https://34.136.210.47
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://34.136.210.47
```

**Benefits:**
- ✅ No "Not secure" browser warnings
- ✅ Full PWA functionality
- ✅ Professional appearance
- ✅ Secure data transmission

### PWA (Progressive Web App) Features

**Implemented:**
- Web App Manifest (`/manifest.json`)
- Install prompt for mobile users
- Custom app icons (192x192, 512x512)
- Full-screen mobile experience
- Black theme matching cosmic aesthetic

**Mobile Benefits:**
- Full-screen experience (no browser UI)
- App-like native feel
- Home screen installation
- Maximum screen space for cosmic backgrounds

---

## Next.js Environment Variables (CRITICAL)

### Understanding Next.js Environment Variable Requirements

**CRITICAL**: Environment variables for Next.js frontend must follow special rules that differ from backend services:

#### Client-Side Variables (Browser JavaScript)

Variables that need to be accessible in the browser (client-side React components):

- **MUST** be prefixed with `NEXT_PUBLIC_`
- **MUST** be defined in `apps/web-app/.env` file
- Are embedded into the JavaScript bundle at **build time**
- **Cannot** be changed at runtime without rebuilding
- PM2 environment variables do **NOT** affect client-side code directly

**Example**: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL`

#### Server-Side Variables (Next.js API Routes)

Variables only needed for server-side Next.js API routes:

- Can use any name (no prefix required)
- Available from PM2 ecosystem config
- Can be overridden at runtime
- Not included in client-side bundle

#### Required Frontend Environment Variables

The following variables **MUST** be present in `apps/web-app/.env`:

1. `NEXT_PUBLIC_API_BASE_URL` - API Gateway URL for backend communication
2. `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` - Socket.IO/Notification service URL for real-time features

### Why Can't I Delete apps/web-app/.env?

Unlike backend services which get all environment variables from PM2's ecosystem config, Next.js has special requirements:

1. **Build-time embedding**: Variables prefixed with `NEXT_PUBLIC_` are embedded into the client-side JavaScript bundle during the build process
2. **Not runtime-configurable**: These variables cannot be changed after build without rebuilding the entire application
3. **PM2 limitation**: PM2 environment variables only affect Node.js server-side code, not browser JavaScript
4. **Source of truth**: The `.env` file in `apps/web-app/` is the definitive source for client-side environment variables

**Therefore**: `apps/web-app/.env` must exist and contain all `NEXT_PUBLIC_*` variables needed by the frontend.

### Environment Variable Configuration by Environment

#### Local Development

`apps/web-app/.env`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002
```

Root `.env` contains database URLs and API keys used by backend services.

#### VM Production

`apps/web-app/.env`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://34.136.210.47:3002
```

Root `.env` contains database URLs and API keys used by backend services.

### Deployment Checklist

When deploying to a new environment:

- [ ] Ensure `apps/web-app/.env` exists with correct `NEXT_PUBLIC_*` variables for that environment
- [ ] **For VM deployments**: Create firewall rule for port 3002: `gcloud compute firewall-rules create allow-notification-2d1l --allow tcp:3002 --source-ranges 0.0.0.0/0 --target-tags twodots-server`
- [ ] Rebuild Next.js application: `cd apps/web-app && pnpm build`
- [ ] Verify environment variables in browser console: `console.log(process.env.NEXT_PUBLIC_API_BASE_URL)`
- [ ] Check Socket.IO connection: Look for "[Socket.IO] ✅ Connection established successfully" in browser console
- [ ] Test HRT seed entities: Send message "search memory" in Cosmos view and verify seed entities appear

---

## Daily Development Workflow

### Local Development

#### Starting Your Development Session

```bash
# 1. Start database services
docker-compose -f docker-compose.dev.yml up -d

# 2. Start application services
pm2 start scripts/deployment/ecosystem.dev.config.js

# 3. Verify everything is running
pm2 status
curl -s http://localhost:3001/api/v1/health
```

**Note**: If this is your first time starting the app, you'll also need to:
1. Set up frontend environment variables (see First-Time Setup section)
2. Create a test user
3. Clear authentication cache if needed

#### Making Changes

```bash
# 1. Make your code changes
# 2. Hot reload will automatically restart the web-app
# 3. For backend changes, restart specific services:
pm2 restart api-gateway
```

#### Stopping Development

```bash
# Stop all services
pm2 delete all

# Stop database services
docker-compose -f docker-compose.dev.yml down
```

### VM Production

#### Prerequisites: Docker Setup

**CRITICAL:** Before starting services, ensure Docker permissions are configured.

```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Install docker-compose if not already installed
sudo apt update
sudo apt install docker-compose -y

# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Test Docker access
docker ps
```

#### Starting Production Services

```bash
# Navigate to project directory
cd ~/2D1L

# Start all services
pnpm start:prod

# Verify services
pm2 status
```

#### Stopping Production Services

```bash
# Stop all PM2 processes
pm2 stop all

# Or stop specific services
pm2 stop web-app
pm2 stop api-gateway
```

---

## Deployment Workflows

### Pushing Changes to VM

#### 1. Local Development → Git

```bash
# 1. Commit your changes
git add .
git commit -m "feat: your feature description"

# 2. Push to repository
git push origin compute-engine-deployment
```

#### 2. Git → VM Deployment

```bash
# 1. SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# 2. Pull latest changes
cd ~/2D1L
git pull origin compute-engine-deployment

# 3. Install any new dependencies
pnpm install

# 4. Rebuild if necessary
pnpm build

# 5. Restart services
pm2 restart all
```

### Automated Deployment Script

Create a deployment script for easier VM updates:

```bash
#!/bin/bash
# deploy-to-vm.sh

echo "🚀 Deploying to VM..."

# Pull latest changes
git pull origin compute-engine-deployment

# Install dependencies
pnpm install

# Build application
pnpm build

# Restart services
pm2 restart all

echo "✅ Deployment complete!"
```

### Environment-Specific Deployments

#### Development Deployment
```bash
# Local development
pnpm start:dev

# VM development (if needed)
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.dev.config.js"
```

#### Production Deployment
```bash
# VM production
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.prod.config.js"
```

### If modified dimension reducer, run the following in vm
# 1. Pull latest changes
git reset --hard origin/compute-engine-deployment
git pull origin compute-engine-deployment

# 2. Install Node.js dependencies
pnpm install

# 3. Build Node.js packages
pnpm build

# 4. Rebuild the dimension-reducer Docker container
docker-compose -f docker-compose.dev.yml build dimension-reducer

# 5. Restart the dimension-reducer container
docker-compose -f docker-compose.dev.yml up -d dimension-reducer

# 6. Restart PM2 services
pm2 restart all
---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Port Conflicts

**Problem:** "EADDRINUSE: address already in use :::3000"

**Solution:**
```bash
# Find processes using port 3000
lsof -ti:3000

# Kill the process
kill -9 <process-id>

# Or kill all Next.js processes
pkill -f next

# Restart PM2 services
pm2 restart web-app
```

#### 2. "Verifying your session..." Hanging

**Problem:** Web-app shows "Verifying your session..." indefinitely

**Root Causes:**
- Browser localStorage corruption
- Zustand persist middleware failures
- Production build hydration mismatches
- Network timeouts in authentication

**Solutions (in order of effectiveness):**

```bash
# 1. Clear browser storage
# Visit: http://localhost:3000/clear-storage.html
# Or manually clear localStorage in browser dev tools

# 2. Restart web-app
pm2 restart web-app

# 3. Complete reset (most effective)
pkill -f next && sleep 2 && pnpm build && pm2 restart web-app

# 4. Check environment variables
pm2 env <web-app-process-id>
```

#### 3. Database Connection Issues

**Problem:** Services can't connect to databases

**Solution:**
```bash
# Check if Docker services are running
docker ps

# Restart database services
docker-compose -f docker-compose.dev.yml restart

# Check database connectivity
curl -s http://localhost:3001/api/v1/health
```

#### 4. Authentication Errors

**Problem:** "User not found" or login failures

**Common Causes:**
- Incorrect API base URL configuration
- Database connection issues
- Missing environment variables
- CORS configuration problems

**Solutions:**
```bash
# 1. Verify API Gateway is running
curl -s http://localhost:3001/api/v1/health

# 2. Check environment variables
pm2 env <api-gateway-process-id>

# 3. Verify database connectivity
# Check logs for database connection errors
pm2 logs api-gateway

# 4. Test with development user
# Use: dev-user-123 / dev-token for testing
```

#### 5. Socket.IO Connection Issues

**Problem:** Socket.IO not connecting, real-time features not working (seed entities not appearing, no video notifications, etc.)

**Common Causes:**
- Missing `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` in `apps/web-app/.env`
- Missing firewall rule for port 3002 (VM deployments)
- Notification worker not running
- Next.js not rebuilt after environment variable changes
- User authentication not completed

**Solutions:**

**For Local Development:**
```bash
# 1. Verify apps/web-app/.env has NEXT_PUBLIC_NOTIFICATION_SERVICE_URL
cat apps/web-app/.env | grep NEXT_PUBLIC_NOTIFICATION_SERVICE_URL

# 2. Add if missing (local dev)
echo "NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002" >> apps/web-app/.env

# 3. Rebuild Next.js (REQUIRED after env var changes)
cd apps/web-app
pnpm build
cd ../..

# 4. Restart web-app
pm2 restart web-app

# 5. Verify notification-worker is running
pm2 list | grep notification-worker
curl -s http://localhost:3002/health
```

**For VM Production:**
```bash
# 1. Check if firewall rule exists for port 3002
gcloud compute firewall-rules list --filter="name~notification" --format="table(name,allowed[].map().firewall_rule().list():label=ALLOW)"

# 2. Create firewall rule if missing
gcloud compute firewall-rules create allow-notification-2d1l \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:3002 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=twodots-server \
    --description="Allow external access to notification worker on port 3002"

# 3. SSH into VM and verify environment variables
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && cat apps/web-app/.env | grep NEXT_PUBLIC_NOTIFICATION_SERVICE_URL"

# 4. Add missing environment variable if needed
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && echo 'NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://[VM_IP]:3002' >> apps/web-app/.env"

# 5. Rebuild and restart on VM
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && cd apps/web-app && pnpm build && cd ../.. && pm2 restart web-app"
```

**Verification Steps:**
```bash
# 1. Test notification worker accessibility
curl -v http://[VM_IP]:3002/health

# 2. Check browser console for Socket.IO connection
# Should see: "[Socket.IO] ✅ Connection established successfully"
# NOT: "WebSocket connection to 'ws://[VM_IP]:3002/socket.io/...' failed"
```

**Verification in Browser Console:**
```javascript
// Check if environment variable is set
console.log(process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL);

// Should output: "http://localhost:3002" (local) or "http://[VM_IP]:3002" (VM)
// If undefined, rebuild is needed
```

**Test HRT Seed Entities:**
1. Navigate to Cosmos view: `http://[VM_IP]:3000/cosmos`
2. Send message: "search memory" or "tell me about my childhood"
3. Check if seed entities appear at bottom of cosmos view
4. If not working, check browser console for Socket.IO errors

#### 6. Card Cover Images Return 404 (Generated but Not Accessible)

**Problem:** Card cover generation works (files are created), but images return 404 when accessed via browser

**Root Causes:**
1. **Missing Images on VM**: Generated images only exist locally, not deployed to VM
2. **Nginx Routing Issue**: `/api/covers/` routes incorrectly sent to API Gateway instead of Next.js app
3. **Cloudflare Caching**: 404 responses cached by Cloudflare CDN

**Symptoms:**
- Console shows: `Failed to load resource: the server responded with a status of 404 (Not Found)`
- URLs like: `https://2d1l.com/api/covers/cardId-timestamp.png` return 404
- Files exist locally in `apps/web-app/public/covers/` directory but not on VM
- Question mark placeholders appear instead of cover images

**Complete Solution:**

**Step 1: Deploy Generated Images to VM**
```bash
# 1. Allow covers directory in .gitignore (already done)
# .gitignore should include: !apps/web-app/public/covers/

# 2. Add images to git and commit (if not already done)
git add apps/web-app/public/covers/
git add .gitignore
git commit -m "feat: include generated cover images in deployment"
git push origin compute-engine-deployment

# 3. Deploy to VM
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && git pull origin compute-engine-deployment"
```

**Step 2: Fix Nginx Configuration**
```bash
# Update Nginx to route /api/covers/ to Next.js app (not API Gateway)
gcloud compute ssh twodots-vm --zone=us-central1-a --command="sudo tee /etc/nginx/sites-available/2d1l > /dev/null << 'EOF'
server {
    server_name 2d1l.com www.2d1l.com;

    # Image API routes (Next.js app) - MUST come before general /api/ route
    location /api/covers/ {
        proxy_pass http://localhost:3000/api/covers/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Other API routes (API Gateway)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Frontend (Next.js app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/2d1l.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/2d1l.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
EOF"

# Test and reload Nginx
gcloud compute ssh twodots-vm --zone=us-central1-a --command="sudo nginx -t && sudo systemctl reload nginx"
```

**Step 3: Rebuild and Restart Services**
```bash
# Rebuild Next.js app on VM
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pnpm install && cd apps/web-app && pnpm build && cd ../.. && pm2 restart web-app"
```

**Step 4: Verify Fix**
```bash
# Test with cache-busting parameter to bypass Cloudflare cache
curl -I "https://2d1l.com/api/covers/[filename].png?v=$(date +%s)"

# Should return: HTTP/2 200 with content-type: image/png
```

**For Local Development:**
```bash
# Usually works automatically in development mode
# If issues occur, check if files exist in public/covers/
ls -la apps/web-app/public/covers/
```

**Why This Happens:**
- **Local Development**: Next.js dev server automatically serves static files from `public` directory
- **VM Production**: Generated images must be deployed to VM, and Nginx must route correctly
- **Generated Files**: Cover images are created at runtime, not at build time, so they need custom serving logic
- **Nginx Priority**: More specific routes (`/api/covers/`) must come before general routes (`/api/`)

**Prevention:** 
1. **Persistent Fix**: The `.gitignore` change ensures images are always deployed
2. **Nginx Config**: The updated configuration is persistent and will work on rebuilds
3. **API Route**: The custom API route at `/api/covers/[filename]` ensures proper serving

## Critical VM vs Local Development Differences

### Key Lessons Learned

Both the Socket.IO connection issue and card cover serving issue reveal important differences between local development and VM production deployments:

#### 1. Network Configuration
- **Local**: Services bind to `localhost` by default, work automatically
- **VM**: Services must bind to `0.0.0.0` to accept external connections
- **Firewall**: Google Cloud requires explicit firewall rules for external access

#### 2. Static File Serving & Generated Content
- **Local**: Next.js dev server automatically serves static files from `public` directory
- **VM**: Next.js production build requires explicit API routes for runtime-generated files
- **Generated Content**: Files created at runtime need custom serving logic
- **Deployment**: Generated images must be committed to git and deployed to VM
- **Nginx Routing**: Specific routes (`/api/covers/`) must come before general routes (`/api/`)

#### 3. Environment Variables
- **Local**: Development mode is more forgiving with missing variables
- **VM**: Production mode requires all `NEXT_PUBLIC_*` variables to be properly configured
- **Build Time**: Next.js embeds client-side variables at build time, not runtime

### VM Deployment Checklist

When deploying to VM, always verify:

- [ ] **Firewall Rules**: All required ports (3000, 3001, 3002) are open
- [ ] **Network Binding**: Services bind to `0.0.0.0` not `localhost`
- [ ] **Environment Variables**: All `NEXT_PUBLIC_*` variables are in `apps/web-app/.env`
- [ ] **Static File Serving**: Custom API routes exist for runtime-generated content
- [ ] **Image Deployment**: Generated images are committed to git and deployed to VM
- [ ] **Nginx Configuration**: `/api/covers/` routes to Next.js app, not API Gateway
- [ ] **Socket.IO Connection**: Test real-time features work end-to-end
- [ ] **Cover Generation**: Test AI-generated content displays properly

### Debugging "Works Locally, Fails on VM" Issues

When features work locally but fail on VM:

1. **Check Network Access**: Test external connectivity to all services
2. **Verify File Serving**: Ensure static files are accessible via HTTP
3. **Test Real-time Features**: Verify Socket.IO connections work
4. **Check Environment Variables**: Confirm all required variables are set
5. **Review Build Output**: Ensure all API routes are included in production build

#### 7. Build Failures

**Problem:** `pnpm build` fails

**Solutions:**
```bash
# 1. Clean and rebuild
pnpm clean
pnpm build

# 2. Clean install
pnpm clean-install

# 3. Check for TypeScript errors
pnpm lint

# 4. Verify all dependencies are installed
pnpm install
```

#### 7. Docker Permission Errors

**Problem:** `PermissionError: [Errno 13] Permission denied` when running docker-compose

**Solutions:**
```bash
# 1. Add user to docker group
sudo usermod -aG docker $USER

# 2. Apply group changes
newgrp docker

# 3. Test Docker access
docker ps

# 4. If still failing, check groups
groups $USER

# 5. Create docker group if missing
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker

# 6. Restart Docker daemon
sudo systemctl restart docker
```

#### 8. PM2 Process Management Issues

**Problem:** PM2 processes not starting or crashing

**Solutions:**
```bash
# 1. Check PM2 status
pm2 status

# 2. View logs
pm2 logs <process-name>

# 3. Restart specific process
pm2 restart <process-name>

# 4. Delete and restart all
pm2 delete all
pm2 start scripts/deployment/ecosystem.config.js

# 5. Check system resources
pm2 monit
```

### Diagnostic Commands

#### Health Checks
```bash
# Check all services
pm2 status

# Check web-app accessibility
curl -s http://localhost:3000 | head -5

# Check API Gateway
curl -s http://localhost:3001/api/v1/health

# Check database services
docker ps

# Check port usage
lsof -ti:3000
lsof -ti:3001
```

#### Log Analysis
```bash
# View all logs
pm2 logs

# View specific service logs
pm2 logs web-app --lines 50
pm2 logs api-gateway --lines 50

# Follow logs in real-time
pm2 logs --follow
```

#### Environment Verification
```bash
# Check environment variables for specific process
pm2 env <process-id>

# Verify environment loading
pm2 logs | grep "Environment loaded"
```

---

## Maintenance Procedures

### Regular Maintenance

#### Daily Checks
```bash
# Check service status
pm2 status

# Check system resources
pm2 monit

# Check logs for errors
pm2 logs --lines 100 | grep -i error
```

#### Weekly Maintenance
```bash
# Update dependencies
pnpm update

# Clean build artifacts
pnpm clean

# Rebuild and restart
pnpm build
pm2 restart all
```

#### Monthly Maintenance
```bash
# Full system restart
pm2 delete all
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
pnpm build
pm2 start scripts/deployment/ecosystem.config.js
```

### Backup Procedures

#### Database Backups
```bash
# PostgreSQL backup
docker exec postgres-2d1l pg_dump -U postgres twodots1line > backup_$(date +%Y%m%d).sql

# Neo4j backup
docker exec neo4j-2d1l neo4j-admin dump --database=neo4j --to=/tmp/backup.dump
```

#### Configuration Backups
```bash
# Backup environment files
cp .env .env.backup.$(date +%Y%m%d)

# Backup PM2 configuration
pm2 save
```

### Performance Monitoring

#### Resource Monitoring
```bash
# Monitor system resources
pm2 monit

# Check memory usage
pm2 list

# Monitor logs for performance issues
pm2 logs | grep -i "memory\|cpu\|slow"
```

#### Database Performance
```bash
# Check database connections
docker exec postgres-2d1l psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory usage
docker exec redis-2d1l redis-cli info memory
```

---

## Quick Reference Commands

### Local Development
```bash
# Start development environment
pnpm start:dev

# Stop all services
pnpm stop:services

# Restart web-app only
pm2 restart web-app

# View logs
pm2 logs web-app
```

### VM Production
```bash
# Deploy to VM
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && git pull && pnpm build && pm2 restart all"

# Check VM status
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 status"

# View VM logs
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 logs web-app --lines 20"

# Test Socket.IO connection (CRITICAL for real-time features)
curl -v http://[VM_IP]:3002/health

# Verify firewall rule exists
gcloud compute firewall-rules list --filter="name~notification"
```

## **Branch Switching & Data Migration**

### **Switching Branches on VM**

#### **Option 1: Switch Branch on Existing Clone (Recommended)**

```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Navigate to project directory
cd ~/2D1L

# Stop services to avoid conflicts
pm2 stop all

# Switch to new branch
git fetch origin
git checkout <new-branch-name>
git pull origin <new-branch-name>

# Install any new dependencies
pnpm install

# Rebuild if necessary
pnpm build

# Restart services
pm2 start scripts/deployment/ecosystem.config.js
```

#### **Option 2: Automated Branch Switch**

```bash
# Use the provided script for automated branch switching
./scripts/migration/switch-vm-branch.sh <branch-name>

# Example:
./scripts/migration/switch-vm-branch.sh feature/new-feature
```

### **Data Migration**

#### **Export Local Data**

```bash
# Export all local data for VM migration
./scripts/migration/export-local-data.sh

# This creates a timestamped backup directory with:
# - PostgreSQL dump
# - Neo4j dump
# - Weaviate schema and data
# - Application files (uploads, covers, videos)
# - Configuration files
```

#### **Import Data to VM**

```bash
# Import exported data to VM
./scripts/migration/import-to-vm.sh backup_20241018_143022

# This will:
# - Upload backup to VM
# - Import all database data
# - Copy application files
# - Update configuration
```

#### **Manual Data Migration**

```bash
# PostgreSQL
docker exec postgres-2d1l pg_dump -U postgres twodots1line > backup.sql
gcloud compute scp backup.sql twodots-vm:~/ --zone=us-central1-a
gcloud compute ssh twodots-vm --zone=us-central1-a --command="docker exec -i postgres-2d1l psql -U postgres twodots1line < ~/backup.sql"

# Neo4j
docker exec neo4j-2d1l neo4j-admin dump --database=neo4j --to=/tmp/backup.dump
docker cp $(docker ps -q -f name=neo4j-2d1l):/tmp/backup.dump ./backup.dump
gcloud compute scp backup.dump twodots-vm:~/ --zone=us-central1-a

# Application files
gcloud compute scp --recurse ./apps/web-app/public/uploads twodots-vm:~/2D1L/apps/web-app/public/ --zone=us-central1-a
```

### Troubleshooting
```bash
# Quick health check
curl -s http://localhost:3000 && curl -s http://localhost:3001/api/v1/health

# Free up port 3000
lsof -ti:3000 | xargs -r kill -9

# Complete reset
pkill -f next && sleep 2 && pnpm build && pm2 restart web-app
```

---

## Environment-Specific Notes

### Local Development
- Use `ecosystem.dev.config.js` for hot reload
- Database services run in Docker containers
- Web-app runs in development mode with file watching
- API Gateway runs in cluster mode for performance

### VM Production
- Use `ecosystem.prod.config.js` for production deployment
- All services run in production mode
- Database services run in Docker containers
- PM2 provides process management and auto-restart

### Security Considerations
- Never commit `.env` files to git
- Use different API keys for different environments
- Regularly rotate API keys and secrets
- Monitor logs for security issues

---

## Persistent Fixes Applied

### Image Loading Fix (Permanent)

The following fixes have been applied to ensure image loading works correctly on VM rebuilds:

1. **`.gitignore` Updated**: Added `!apps/web-app/public/covers/` to include generated images in git
2. **Nginx Configuration**: Updated to route `/api/covers/` to Next.js app before general `/api/` routes  
3. **API Route**: Custom `/api/covers/[filename]` route ensures proper image serving

### New VM Deployment

For new VM deployments, use the automated setup script that includes all fixes:

```bash
# On the VM, run:
./scripts/deployment/setup-vm-with-fixes.sh
```

This script automatically applies all persistent fixes including:
- Correct Nginx configuration for image routing
- Proper service startup sequence
- All required environment configurations

---

## **Complete Startup Commands Reference**

### **First-Time Setup (Complete Process)**

```bash
# 1. Navigate to project directory
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L

# 2. Start database services
docker-compose -f docker-compose.dev.yml up -d

# 3. Build all packages
pnpm build

# 4. Start application services
pm2 start scripts/deployment/ecosystem.dev.config.js

# 5. Set up frontend environment (CRITICAL)
cd apps/web-app
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3001" > .env
echo "NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002" >> .env
cd ../..
cd apps/web-app && pnpm build && cd ../..
pm2 restart web-app

# 6. Create test user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "dev-user-123", "email": "dev@example.com", "password": "password123"}'

# 7. Access application
open http://localhost:3000/clear-cache.html
# Then go to: http://localhost:3000
# Login with: dev@example.com / password123
```

### **Daily Startup (After Initial Setup)**

```bash
# 1. Start databases
docker-compose -f docker-compose.dev.yml up -d

# 2. Start services
pm2 start scripts/deployment/ecosystem.dev.config.js

# 3. Check status
pm2 status
```

### **Stop Commands**

```bash
# Stop all services
pm2 delete all

# Stop databases
docker-compose -f docker-compose.dev.yml down
```

### **Troubleshooting Commands**

```bash
# If frontend stuck on "Verifying your session"
open http://localhost:3000/clear-cache.html

# If services fail to start
pm2 logs

# Complete reset
pkill -f next && sleep 2 && pnpm build && pm2 restart web-app

# Check service status
pm2 status
curl -s http://localhost:3001/api/v1/health
```

### **Quick Reference URLs**

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Clear Cache**: http://localhost:3000/clear-cache.html
- **Test User**: dev@example.com / password123

---

This guide provides a comprehensive framework for managing the 2D1L application across different environments. Keep it updated as the system evolves and new procedures are established.
