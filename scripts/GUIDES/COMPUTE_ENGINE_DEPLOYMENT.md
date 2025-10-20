# 2D1L Compute Engine Deployment Guide

This guide provides step-by-step instructions for deploying the 2D1L monorepo to Google Cloud Compute Engine using a single VM that mirrors your local development environment.

## Architecture Overview

**Single VM running:**
- **Docker Compose**: PostgreSQL, Neo4j, Weaviate, Redis, Python Dimension Reducer (5 containers)
- **PM2**: API Gateway + 10 workers + Web App (12 Node.js processes total)
- **Environment**: Production mode with optimized configurations

**Cost**: ~$53/month (e2-standard-4: 4 vCPU, 16GB RAM, 100GB SSD)

## Prerequisites

1. **Google Cloud Project**: `d1l-460112` (already set up)
2. **APIs Enabled**: Cloud SQL, Memorystore, Secret Manager, Cloud Build, Artifact Registry
3. **Secrets in Secret Manager**: JWT_SECRET, POSTGRES_PASSWORD, GOOGLE_API_KEY, PEXELS_API_KEY
4. **gcloud CLI**: Installed and authenticated on your local machine

## Quick Start

### Step 1: Create VM and Firewall Rules

Run the VM deployment script from your local machine:

```bash
./scripts/deployment/deploy-vm.sh
```

This script will:
- Create a Compute Engine VM (e2-standard-4, Ubuntu 22.04, 100GB SSD)
- Install Node.js, pnpm, PM2, Docker, Docker Compose, gcloud CLI
- Create firewall rules for ports 80, 443, 3000, 3001
- Display the VM's external IP

### Step 2: Deploy Application

SSH into the VM and run the application deployment script:

```bash
# SSH into the VM
gcloud compute ssh 2d1l-vm --zone=us-central1-a

# On the VM, run the deployment script
./scripts/deployment/deploy-app.sh
```

This script will:
- Clone your repository
- Fetch secrets from Secret Manager
- Create production `.env` file
- Install dependencies and build the monorepo
- Start Docker services (databases)
- Start PM2 services (API Gateway + workers + Web App)
- Configure auto-start services
- Setup health monitoring

### Step 3: Verify Deployment

After deployment, test the services:

```bash
# Check PM2 processes
pm2 status

# Check Docker containers
docker ps

# Test API Gateway
curl http://localhost:3001/api/v1/health

# Test frontend
curl http://localhost:3000
```

Access your application via the VM's external IP:
- **Frontend**: `http://[VM_IP]:3000`
- **API Gateway**: `http://[VM_IP]:3001`
- **Neo4j Browser**: `http://[VM_IP]:7474`
- **Weaviate**: `http://[VM_IP]:8080`

**IMPORTANT**: The most important verification is to **create a new user account** via the sign-up page and test the login and chat functionality. The commands above only verify that the services are running, not that they are working together correctly. See the "Post-Deployment Verification" section below for more detailed checks.

**CRITICAL**: After deployment, you must verify that Socket.IO connections are working for real-time features like HRT seed entities. See the "Socket.IO Connection Verification" section below.

## Post-Deployment Verification (Data Consistency)

After creating a new user (e.g., `test@example.com`), you can use these commands on the VM to verify that the data has been correctly written to the databases, adapting them from the `DATA_CONSISTENCY_CHECK_GUIDE.md`.

### 1. PostgreSQL Check

Verify the user exists in the `users` table. You will need to replace `[YOUR_POSTGRES_USER]` and `[YOUR_POSTGRES_DB]` with the values from your `.env` file.

```bash
docker exec postgres-2d1l psql -U [YOUR_POSTGRES_USER] -d [YOUR_POSTGRES_DB] -c "SELECT user_id, email, created_at FROM users WHERE email = 'test@example.com';"
```

### 2. Neo4j Check

Verify the corresponding `User` node was created in the graph. Replace `[YOUR_NEO4J_PASSWORD]` with the value from your `.env` file.

```bash
docker exec neo4j-2d1l cypher-shell -u neo4j -p [YOUR_NEO4J_PASSWORD] "MATCH (n:User {email: 'test@example.com'}) RETURN n.user_id, n.email, n.created_at;"
```

### 3. Weaviate Check

After the new user has a conversation, you can verify that `UserKnowledgeItem` objects are being created for them.

```bash
# First, get the user_id from PostgreSQL
USER_ID=$(docker exec postgres-2d1l psql -U [USER] -d [DB] -t -c "SELECT user_id FROM users WHERE email = 'test@example.com';" | xargs)

# Then, query Weaviate for items associated with that user_id
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d "{\"query\": \"{ Get { UserKnowledgeItem(where: { path: [\\\"userId\\\"], operator: Equal, valueString: \\\"$USER_ID\\\" }) { _additional { id }, title, userId } } }\"}" | jq
```

## Socket.IO Connection Verification

**CRITICAL**: After deployment, you must verify that Socket.IO connections are working for real-time features like HRT seed entities, video notifications, and insight generation notifications.

### 1. Verify Notification Worker is Accessible

```bash
# Test notification worker health endpoint from external access
curl -v http://[VM_IP]:3002/health

# Should return:
# {"status":"healthy","service":"notification-worker","timestamp":"...","uptime":...}
```

### 2. Verify Frontend Environment Variables

```bash
# SSH into VM and check apps/web-app/.env
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && cat apps/web-app/.env | grep NEXT_PUBLIC_NOTIFICATION_SERVICE_URL"

# Should show:
# NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://[VM_IP]:3002
```

### 3. Test Socket.IO Connection in Browser

1. Open the VM's frontend: `http://[VM_IP]:3000`
2. Open browser developer console (F12)
3. Check for Socket.IO connection logs:
   - ✅ **Success**: `[Socket.IO] ✅ Connection established successfully`
   - ❌ **Failure**: `WebSocket connection to 'ws://[VM_IP]:3002/socket.io/...' failed`

### 4. Test HRT Seed Entities

1. Navigate to the Cosmos view: `http://[VM_IP]:3000/cosmos`
2. Send a message like "search memory" or "tell me about my childhood"
3. Check if seed entities appear at the bottom of the cosmos view
4. If not working, check browser console for Socket.IO errors

**Test Card Cover Generation:**
1. Navigate to any card or entity detail modal
2. Click "Generate Cover" button
3. Verify cover image appears instead of question mark placeholder
4. Check browser console for 404 errors on cover image URLs
5. If 404 errors, verify API route is working: `curl -I http://[VM_IP]:3000/api/covers/[filename].png`

### 5. Verify Firewall Rules

```bash
# List all firewall rules for the VM
gcloud compute firewall-rules list --filter="name~2d1l OR name~notification" --format="table(name,direction,priority,sourceRanges.list():label=SRC_RANGES,allowed[].map().firewall_rule().list():label=ALLOW,targetTags.list():label=TARGET_TAGS)"

# Should include:
# allow-notification-2d1l  INGRESS  1000  0.0.0.0/0  tcp:3002  twodots-server
```

### Common Socket.IO Issues and Solutions

#### Issue: "WebSocket connection failed: WebSocket is closed before the connection is established"

**Root Cause**: Missing firewall rule for port 3002

**Solution**:
```bash
# Create the missing firewall rule
gcloud compute firewall-rules create allow-notification-2d1l \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:3002 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=twodots-server \
    --description="Allow external access to notification worker on port 3002"
```

#### Issue: "NEXT_PUBLIC_NOTIFICATION_SERVICE_URL is undefined"

**Root Cause**: Missing environment variable in `apps/web-app/.env`

**Solution**:
```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Add missing environment variable
cd ~/2D1L
echo "NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://[VM_IP]:3002" >> apps/web-app/.env

# Rebuild Next.js (REQUIRED after env var changes)
cd apps/web-app
pnpm build
cd ../..

# Restart web-app
pm2 restart web-app
```

#### Issue: Notification worker not running

**Solution**:
```bash
# Check if notification worker is running
pm2 list | grep notification-worker

# If not running, start it
pm2 start scripts/deployment/ecosystem.prod.config.js --only notification-worker

# Check logs
pm2 logs notification-worker --lines 20
```

#### Issue: Card Cover Images Return 404 (Generated but Not Accessible)

**Problem**: Card cover generation works (files are created), but images return 404 when accessed via browser

**Root Causes**:
1. **Missing Images on VM**: Generated images only exist locally, not deployed to VM
2. **Nginx Routing Issue**: `/api/covers/` routes incorrectly sent to API Gateway instead of Next.js app
3. **Cloudflare Caching**: 404 responses cached by Cloudflare CDN

**Symptoms**:
- Console shows: `Failed to load resource: the server responded with a status of 404 (Not Found)`
- URLs like: `https://2d1l.com/api/covers/cardId-timestamp.png` return 404
- Files exist locally in `apps/web-app/public/covers/` directory but not on VM
- Question mark placeholders appear instead of cover images

**Complete Solution**:

**Step 1: Deploy Generated Images to VM**
```bash
# 1. Allow covers directory in .gitignore
# Edit .gitignore to include: !apps/web-app/public/covers/

# 2. Add images to git and commit
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
EOF

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx
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

**Why This Happens**:
- **Local Development**: Next.js dev server automatically serves static files from `public` directory
- **VM Production**: Generated images must be deployed to VM, and Nginx must route correctly
- **Generated Files**: Cover images are created at runtime, not at build time, so they need custom serving logic
- **Nginx Priority**: More specific routes (`/api/covers/`) must come before general routes (`/api/`)

**Prevention**: 
1. **Persistent Fix**: The `.gitignore` change ensures images are always deployed
2. **Nginx Config**: The updated configuration is persistent and will work on rebuilds
3. **API Route**: The custom API route at `/api/covers/[filename]` ensures proper serving

## Key Lessons Learned: VM vs Local Development Differences

### Critical VM-Specific Issues

Both the Socket.IO connection issue and card cover serving issue highlight important differences between local development and VM production deployments:

#### 1. Network Configuration
- **Local**: Services bind to `localhost` by default
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

### Prevention Checklist for New VM Deployments

When setting up a new VM environment, always verify:

- [ ] **Firewall Rules**: All required ports (3000, 3001, 3002) are open
- [ ] **Network Binding**: Services bind to `0.0.0.0` not `localhost`
- [ ] **Environment Variables**: All `NEXT_PUBLIC_*` variables are in `apps/web-app/.env`
- [ ] **Static File Serving**: Custom API routes exist for runtime-generated content
- [ ] **Image Deployment**: Generated images are committed to git and deployed to VM
- [ ] **Nginx Configuration**: `/api/covers/` routes to Next.js app, not API Gateway
- [ ] **Socket.IO Connection**: Test real-time features work end-to-end
- [ ] **Cover Generation**: Test AI-generated content displays properly

### Debugging Strategy

When features work locally but fail on VM:

1. **Check Network Access**: Test external connectivity to all services
2. **Verify File Serving**: Ensure static files are accessible via HTTP
3. **Test Real-time Features**: Verify Socket.IO connections work
4. **Check Environment Variables**: Confirm all required variables are set
5. **Review Build Output**: Ensure all API routes are included in production build

## Manual Deployment Steps

If you prefer to run the commands manually:

### 1. Create VM

```bash
gcloud compute instances create 2d1l-vm \
    --zone=us-central1-a \
    --machine-type=e2-standard-4 \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-ssd \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=2d1l-server
```

### 2. Create Firewall Rules

```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http-2d1l \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server

# Allow HTTPS
gcloud compute firewall-rules create allow-https-2d1l \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server

# Allow frontend
gcloud compute firewall-rules create allow-frontend-2d1l \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server

# Allow API Gateway
gcloud compute firewall-rules create allow-api-2d1l \
    --allow tcp:3001 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server

# Allow Notification Worker (Socket.IO) - CRITICAL for real-time features
gcloud compute firewall-rules create allow-notification-2d1l \
    --allow tcp:3002 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server
```

### 3. SSH and Install Dependencies

```bash
gcloud compute ssh 2d1l-vm --zone=us-central1-a
```

On the VM:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y git curl wget unzip build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm and PM2
npm install -g pnpm@8.14.1
npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### 4. Clone and Build Application

```bash
# Clone repository
cd ~
git clone https://github.com/2dots1line/2dots1line.git 2D1L
cd 2D1L
git checkout compute-engine-deployment

# Fetch secrets and create .env
# (See deploy-app.sh for the complete .env template)

# Install dependencies and build
pnpm setup
pnpm build
```

### 4.1. Install Docker Compose (if not already installed)

```bash
# Update package list
sudo apt update

# Install docker-compose
sudo apt install docker-compose -y

# Verify installation
docker-compose --version
```

### 4.2. Fix Docker Permissions

**CRITICAL:** The default user needs permission to access Docker daemon.

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the group changes (you can either logout/login or use newgrp)
newgrp docker

# Test if you can run docker without sudo
docker ps
```

**If you still get permission errors:**
```bash
# Check if docker group exists
getent group docker

# Check your groups
groups $USER

# If docker group doesn't exist, create it
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker

# Restart Docker daemon if needed
sudo systemctl restart docker
```

### 4.5. Initialize Databases

**CRITICAL:** For a fresh deployment, the databases inside the Docker containers will be empty. You must initialize the PostgreSQL schema before starting the application services. This command is taken from `scripts/GUIDES/QUICK_CLEAN_START.md`.

```bash
# From the project root directory (e.g., /home/user/2D1L)
cd packages/database
pnpm prisma db push
cd ../..
```

### 5. Start Services

```bash
# Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
sleep 30

# Start all services using production configuration
pnpm start:prod
pm2 save
```

## PM2 Ecosystem Configurations

The project uses three different PM2 ecosystem configurations:

### 1. `scripts/deployment/ecosystem.config.js` (Original Full Configuration)
- **Use for:** VM deployment with all services
- **Services:** API Gateway + All Workers + Web App
- **Environment:** Production
- **Command:** `pnpm start:services`

### 2. `scripts/deployment/ecosystem.dev.config.js` (Development Configuration)
- **Use for:** Local development
- **Services:** API Gateway + Web App (dev mode with hot reload)
- **Environment:** Development with file watching
- **Command:** `pnpm start:dev`

### 3. `scripts/deployment/ecosystem.prod.config.js` (Production Configuration)
- **Use for:** VM production deployment
- **Services:** API Gateway + All Workers + Web App (production mode)
- **Environment:** Production
- **Command:** `pnpm start:prod`

**For VM deployment, use `pnpm start:prod` which automatically:**
- Starts Docker services
- Starts all PM2 services using `ecosystem.prod.config.js`
- Includes the Web App in production mode

## Environment Configuration

The production `.env` file differs from local development in these key ways:

```bash
# Environment
NODE_ENV=production

# Database URLs (localhost since Docker runs on same VM)
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5433/twodots1line
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7688
WEAVIATE_URL=http://localhost:8080

# Application URLs (use VM external IP)
FRONTEND_URL=http://[VM_EXTERNAL_IP]:3000
NEXT_PUBLIC_API_BASE_URL=http://[VM_EXTERNAL_IP]:3001
NEXT_PUBLIC_WEAVIATE_URL=http://[VM_EXTERNAL_IP]:8080
```

## Auto-Start Configuration

### PM2 Startup

```bash
pm2 startup systemd
# Follow the command shown in the output
pm2 save
```

### Docker Compose Service

Create `/etc/systemd/system/2d1l-docker.service`:

```ini
[Unit]
Description=2D1L Docker Compose Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/[USER]/2D1L
ExecStart=/usr/bin/docker-compose -f docker-compose.dev.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.dev.yml down
User=[USER]

[Install]
WantedBy=multi-user.target
```

Enable the service:

```bash
sudo systemctl enable 2d1l-docker.service
sudo systemctl start 2d1l-docker.service
```

## Health Monitoring

### Health Check Script

The `scripts/deployment/health-check.sh` script monitors all services and restarts them if needed:

```bash
# Make executable
chmod +x scripts/deployment/health-check.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$USER/scripts/deployment/health-check.sh") | crontab -
```

### Log Rotation

Create `/etc/logrotate.d/2d1l`:

```
/home/[USER]/2D1L/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

## Branch Switching & Data Migration

### Switching Branches on VM

#### Automated Branch Switch
```bash
# Use the provided script for automated branch switching
./scripts/migration/switch-vm-branch.sh <branch-name>

# Example:
./scripts/migration/switch-vm-branch.sh feature/new-feature
```

#### Manual Branch Switch
```bash
# SSH into VM
gcloud compute ssh 2d1l-vm --zone=us-central1-a

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
pnpm start:prod
```

### Data Migration

#### Export Local Data
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

#### Import Data to VM
```bash
# Import exported data to VM
./scripts/migration/import-to-vm.sh backup_20241018_143022

# This will:
# - Upload backup to VM
# - Import all database data
# - Copy application files
# - Update configuration
```

For detailed migration procedures, see `scripts/migration/README.md`.

## Troubleshooting

### Common Issues

1. **Services not starting**: Check logs with `pm2 logs` and `docker-compose logs`
2. **Registration/Login Fails**: This is often because the database schema was not initialized. Make sure you ran the `pnpm prisma db push` command (see step 4.5) after starting the Docker containers for the first time.
3. **Database connection issues**: Verify Docker containers are running with `docker ps`
4. **Port conflicts**: Check if ports are already in use with `lsof -i :PORT`
5. **Permission issues**: Ensure user is in docker group with `groups $USER`

### Useful Commands

```bash
# Check PM2 status
pm2 status
pm2 logs

# Check Docker containers
docker ps
docker-compose logs

# Restart services (using new commands)
pnpm restart:services  # Restart all PM2 services
pnpm stop:services     # Stop all PM2 services
pnpm start:prod        # Start all services (Docker + PM2)

# Alternative manual commands
pm2 restart all
docker-compose -f docker-compose.dev.yml restart

# Check system resources
htop
df -h
free -h

# Free up port conflicts
lsof -ti:3000 | xargs -r kill -9  # Free port 3000
lsof -ti:3001 | xargs -r kill -9  # Free port 3001

# Complete system reset
pnpm stop:services && docker-compose -f docker-compose.dev.yml down && pnpm start:prod
```

### Log Locations

- **PM2 logs**: `/home/[USER]/2D1L/logs/`
- **Docker logs**: `docker-compose logs [service-name]`
- **System logs**: `/var/log/syslog`
- **Health check logs**: `/home/[USER]/2D1L/logs/health-check.log`

## Security Considerations

1. **Firewall**: Only necessary ports are exposed (80, 443, 3000, 3001, 3002)
2. **Secrets**: All sensitive data stored in Google Secret Manager
3. **Updates**: Regular system updates via `apt-get upgrade`
4. **Monitoring**: Health checks and log rotation configured

## Scaling

### Vertical Scaling (More Resources)

To upgrade the VM:

```bash
gcloud compute instances stop 2d1l-vm --zone=us-central1-a
gcloud compute instances set-machine-type 2d1l-vm \
    --machine-type=e2-standard-8 \
    --zone=us-central1-a
gcloud compute instances start 2d1l-vm --zone=us-central1-a
```

### Horizontal Scaling (Multiple VMs)

For high availability, consider:
1. Load balancer in front of multiple VMs
2. Shared database (Cloud SQL) instead of containerized
3. Redis cluster for session management

## Cost Optimization

1. **Preemptible instances**: Use for development/testing (up to 80% savings)
2. **Committed use discounts**: 1-3 year commitments for 20-57% savings
3. **Right-sizing**: Monitor usage and adjust VM size accordingly
4. **Scheduled shutdowns**: Stop VM during non-business hours

## Backup Strategy

1. **Database backups**: Regular exports of PostgreSQL data
2. **VM snapshots**: Create snapshots before major updates
3. **Code backups**: Git repository serves as code backup
4. **Configuration backups**: Backup `.env` and systemd service files

## HTTPS and PWA Setup

### HTTPS Configuration (Completed)

The application now runs with HTTPS using a self-signed certificate and Nginx reverse proxy:

**Configuration:**
- **Nginx**: Reverse proxy handling HTTPS termination
- **SSL Certificate**: Self-signed certificate (valid for testing)
- **Ports**: HTTP (80) redirects to HTTPS (443)
- **Services**: All services accessible via HTTPS without port numbers

**Access URLs:**
- **Frontend**: `https://34.136.210.47`
- **API**: `https://34.136.210.47/api/`
- **Socket.IO**: `https://34.136.210.47/socket.io/`

**Benefits:**
- ✅ No more "Not secure" browser warnings
- ✅ Full PWA functionality enabled
- ✅ Professional appearance
- ✅ Secure data transmission

### PWA (Progressive Web App) Features

**Implemented Features:**
- **Web App Manifest**: Full-screen app experience
- **Install Prompt**: Automatic installation prompt for mobile users
- **App Icons**: Custom 192x192 and 512x512 icons
- **Theme Colors**: Black theme matching the cosmic aesthetic
- **Offline Ready**: PWA foundation for future offline features

**Mobile Benefits:**
- **Full-screen experience**: No browser UI on mobile
- **App-like feel**: Native mobile app experience
- **Home screen installation**: One-tap install from browser
- **Maximum screen space**: Perfect for cosmic backgrounds

### Production SSL Certificate (Optional)

For production use, replace the self-signed certificate with a Let's Encrypt certificate:

```bash
# Note: Requires a domain name (Let's Encrypt doesn't support IP addresses)
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@example.com
```

## Persistent Fixes Applied

### Image Loading Fix (Permanent)

The following fixes have been applied to ensure image loading works correctly on VM rebuilds:

1. **`.gitignore` Updated**: Added `!apps/web-app/public/covers/` to include generated images in git
2. **Nginx Configuration**: Updated to route `/api/covers/` to Next.js app before general `/api/` routes
3. **API Route**: Custom `/api/covers/[filename]` route ensures proper image serving

### Deployment Script for New VMs

To ensure these fixes are applied to new VM deployments, use this script:

```bash
#!/bin/bash
# scripts/deployment/setup-vm-with-fixes.sh

echo "🚀 Setting up VM with persistent fixes..."

# 1. Clone repository
git clone https://github.com/2dots1line/2dots1line.git 2D1L
cd 2D1L
git checkout compute-engine-deployment

# 2. Install dependencies
pnpm install
pnpm build

# 3. Setup Nginx with correct configuration
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
EOF

# 4. Enable site and test configuration
sudo ln -sf /etc/nginx/sites-available/2d1l /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Start services
docker-compose -f docker-compose.dev.yml up -d
sleep 30
pnpm start:prod

echo "✅ VM setup complete with all fixes applied!"
```

## Next Steps

1. **Domain setup**: Configure custom domain and SSL certificates (optional)
2. **Cloud Logging**: Ship logs to Google Cloud Logging
3. **Monitoring**: Set up Cloud Monitoring alerts
4. **CI/CD**: Automate deployments with Cloud Build
5. **Mobile optimization**: Implement mobile-specific UI improvements

## Related Documentation

- **Deployment and Startup Guide**: `scripts/GUIDES/DEPLOYMENT_AND_STARTUP_GUIDE.md` - Comprehensive guide for local vs VM deployment
- **Migration Scripts**: `scripts/migration/README.md` - Branch switching and data migration procedures
- **VM Access Troubleshooting**: `scripts/GUIDES/20251018_VM_Access_Troubleshooting.md` - Specific VM access issues

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check Google Cloud Console for VM status
4. Verify firewall rules and network connectivity
5. Consult the related documentation above for specific procedures
