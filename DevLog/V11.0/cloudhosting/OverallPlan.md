# GCP Single VM Deployment Guide for Seed Testing

## Overview

Deploy your entire 2dots1line V11.0 stack to a single Google Cloud VM, replicating your current local Docker Compose + PM2 setup. This approach uses your free trial credits ($300) and requires minimal code changes.

**Estimated Setup Time**: 2-3 hours

**Monthly Cost**: $0 (using free trial credits)

**Post-Trial Cost**: ~$50-80/month

---

## Prerequisites

- Google Cloud account with active free trial
- Local terminal with `gcloud` CLI installed
- SSH key for Git access to your repository
- Your `.env` file with all API keys

---

## Step 1: Install Google Cloud SDK

```bash
# macOS
brew install --cask google-cloud-sdk

# Initialize and authenticate
gcloud init
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

---

## Step 2: Create VM Instance

### Recommended VM Configuration for Seed Testing

```bash
# Create the VM
gcloud compute instances create 2d1l-production \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --boot-disk-size=100GB \
  --boot-disk-type=pd-balanced \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server,https-server \
  --metadata=startup-script='#!/bin/bash
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
  '
```

**Machine Type Breakdown**:

- `e2-standard-4`: 4 vCPUs, 16GB RAM (~$100/month, but free with trial)
- Alternative: `e2-standard-2` (2 vCPUs, 8GB) if you want to conserve credits (~$50/month)

### Create Firewall Rules

```bash
# Allow HTTP traffic (port 80)
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# Allow HTTPS traffic (port 443)
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags https-server

# Allow Next.js dev server (port 3000) - for testing
gcloud compute firewall-rules create allow-nextjs \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# Allow API Gateway (port 3001)
gcloud compute firewall-rules create allow-api \
  --allow tcp:3001 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server
```

---

## Step 3: SSH into VM and Install Dependencies

```bash
# SSH into your VM
gcloud compute ssh 2d1l-production --zone=us-central1-a

# Once inside the VM, run the following:
```

### Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### Install Node.js & pnpm

```bash
# Install Node.js 18.x via NVM (easier version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Verify
node --version
pnpm --version
```

### Install PM2 Globally

```bash
pnpm add -g pm2

# Set PM2 to start on system reboot
pm2 startup
# Run the command it outputs (usually involves sudo)
```

### Install Git

```bash
sudo apt-get update
sudo apt-get install -y git
```

---

## Step 4: Clone Your Repository

```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository
git clone YOUR_REPOSITORY_URL 2D1L
cd 2D1L

# If using SSH, set up your SSH key first:
# ssh-keygen -t ed25519 -C "your_email@example.com"
# cat ~/.ssh/id_ed25519.pub
# Add the public key to your GitHub/GitLab account
```

---

## Step 5: Configure Environment Variables

```bash
# Create .env file (copy from your local)
nano .env

# Paste your .env contents
# Important: Update these values for production:
# - Set NODE_ENV=production
# - Update database hosts if needed (localhost should work)
# - Ensure all API keys are present
```

**Key Environment Variables to Verify**:

```env
NODE_ENV=production

# Database connections (localhost since running on same VM)
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=2d1l

NEO4J_URI=bolt://localhost:7688
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

WEAVIATE_URL=http://localhost:8080
REDIS_HOST=localhost
REDIS_PORT=6379

# API Keys
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# API Gateway
API_GATEWAY_PORT=3001

# Frontend URL (use VM's external IP)
NEXT_PUBLIC_API_URL=http://YOUR_VM_EXTERNAL_IP:3001
```

---

## Step 6: Build the Project

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@2dots1line/database db:generate

# Build all packages
pnpm build

# This will take 5-10 minutes
```

---

## Step 7: Start Database Services

```bash
# Start all database containers
docker-compose -f docker-compose.dev.yml up -d

# Verify all containers are running
docker ps

# Check logs if any issues
docker logs postgres-2d1l
docker logs neo4j-2d1l
docker logs weaviate-2d1l
docker logs redis-2d1l
docker logs dimension-reducer
```

### Wait for Databases to Initialize

```bash
# Wait for PostgreSQL to be ready
until docker exec postgres-2d1l pg_isready -U your_user; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Wait for Neo4j to be ready (check port 7474)
until curl -s http://localhost:7474 > /dev/null; do
  echo "Waiting for Neo4j..."
  sleep 2
done

echo "All databases ready!"
```

---

## Step 8: Run Database Migrations

```bash
# Run Prisma migrations (if needed)
pnpm --filter=@2dots1line/database db:migrate:deploy

# Or push schema (for development)
pnpm --filter=@2dots1line/database db:push
```

---

## Step 9: Start PM2 Services

```bash
# Start all services with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs --lines 50

# Save PM2 configuration (so it persists after reboot)
pm2 save
```

### Verify All Services Are Running

```bash
# Check API Gateway
curl http://localhost:3001/api/v1/health

# Check individual worker logs
pm2 logs api-gateway --lines 20
pm2 logs ingestion-worker --lines 20
```

---

## Step 10: Deploy Frontend (Next.js)

### Option A: Run Next.js on VM (Simple)

```bash
# In a separate terminal/screen session
cd ~/apps/2D1L/apps/web-app

# Build for production
pnpm build

# Start production server
pnpm start
# This runs on port 3000
```

### Option B: Use PM2 for Next.js (Recommended)

Add to `ecosystem.config.js`:

```javascript
{
  name: 'web-app',
  script: 'pnpm',
  args: 'start',
  cwd: './apps/web-app',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PORT: 3000,
  },
}
```

Then:

```bash
pm2 restart ecosystem.config.js
pm2 save
```

---

## Step 11: Get VM External IP

```bash
# From your local machine
gcloud compute instances describe 2d1l-production \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Example output: 34.123.45.67
```

---

## Step 12: Test Your Deployment

```bash
# From your local machine

# Test API Gateway
curl http://YOUR_VM_IP:3001/api/v1/health

# Test Frontend
open http://YOUR_VM_IP:3000

# Test full conversation flow
curl -X POST http://YOUR_VM_IP:3001/api/v1/conversations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "dev-user-123"}'
```

---

## Step 13: Set Up Domain (Optional)

If you have a domain, point it to your VM's external IP:

```bash
# Create a static IP address (so it doesn't change)
gcloud compute addresses create 2d1l-static-ip --region=us-central1

# Assign it to your VM
gcloud compute instances delete-access-config 2d1l-production \
  --zone=us-central1-a --access-config-name="external-nat"

gcloud compute instances add-access-config 2d1l-production \
  --zone=us-central1-a \
  --access-config-name="external-nat" \
  --address=2d1l-static-ip
```

Then update your DNS A record to point to the static IP.

---

## Monitoring & Maintenance

### View Logs

```bash
# SSH into VM
gcloud compute ssh 2d1l-production --zone=us-central1-a

# PM2 logs
pm2 logs
pm2 logs api-gateway --lines 100

# Docker logs
docker logs -f postgres-2d1l
docker logs -f redis-2d1l

# System resources
pm2 monit
```

### Restart Services

```bash
# Restart all PM2 services
pm2 restart all

# Restart specific service
pm2 restart api-gateway

# Restart databases
docker-compose -f docker-compose.dev.yml restart
```

### Update Code

```bash
# SSH into VM
cd ~/apps/2D1L

# Pull latest changes
git pull

# Rebuild
pnpm build

# Restart services
pm2 restart all
```

---

## Cost Management with Free Trial

Your free trial includes **$300 in credits** valid for **90 days**.

**Estimated Usage**:

- e2-standard-4 VM: ~$100/month (~$3.30/day)
- 100GB SSD: ~$16/month (~$0.53/day)
- Network egress: ~$10/month (for testing)
- **Total**: ~$4-5/day or ~$120-150/month

**Your $300 credits will last ~60-75 days** with this setup.

### Monitor Spending

```bash
# View current billing
gcloud beta billing accounts list
gcloud billing projects list

# Set up budget alerts in GCP Console:
# 1. Go to Billing > Budgets & alerts
# 2. Create budget for $50, $100, $150 alerts
```

---

## Optimization Tips

### Use a Smaller VM (if needed)

```bash
# Stop the VM
gcloud compute instances stop 2d1l-production --zone=us-central1-a

# Change machine type to smaller size
gcloud compute instances set-machine-type 2d1l-production \
  --zone=us-central1-a \
  --machine-type=e2-standard-2

# Start the VM
gcloud compute instances start 2d1l-production --zone=us-central1-a
```

### Use Preemptible VM (60% cheaper, may restart)

```bash
# Create preemptible instance
gcloud compute instances create 2d1l-production-preempt \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --preemptible \
  --boot-disk-size=100GB \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud
```

**Note**: Preemptible VMs can be terminated by GCP with 30 seconds notice. Not ideal for production, but fine for testing.

---

## Troubleshooting

### Build Fails

```bash
# Clear caches and rebuild
pnpm clean-install
pnpm build
```

### Out of Memory

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build
```

### Database Connection Errors

```bash
# Check if containers are running
docker ps

# Check container logs
docker logs postgres-2d1l
docker logs neo4j-2d1l

# Restart containers
docker-compose -f docker-compose.dev.yml restart
```

### PM2 Services Not Starting

```bash
# Check PM2 logs
pm2 logs --err

# Verify build output exists
ls -la apps/api-gateway/dist/
ls -la workers/*/dist/

# Rebuild specific package
cd apps/api-gateway
pnpm build
cd ../..
pm2 restart api-gateway
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001

# Kill process
kill -9 PID
```

---

## Potential Compatibility Risks & Mitigation

### Risk 1: OS Differences (macOS → Linux)

**Issue**: Your local is macOS, GCP VM is Ubuntu Linux

**Potential Problems**:

- File path case sensitivity (Linux is case-sensitive, macOS is not by default)
- Line ending differences (CRLF vs LF)
- File permissions on Docker volumes

**Mitigation**:

```bash
# Before deploying, check your code for case-sensitive path issues
# In your local repo:
git ls-files | grep -E '[A-Z]'  # Find files with uppercase

# On VM, Docker volumes may have permission issues
# Fix with:
sudo chown -R $USER:$USER ~/apps/2D1L
chmod -R 755 ~/apps/2D1L
```

**Risk Level**: LOW - Docker abstracts most OS differences

---

### Risk 2: Memory Limitations During Build

**Issue**: `pnpm build` may consume more memory than available

**Potential Problems**:

- Build process killed by OOM (Out of Memory)
- TypeScript compilation fails
- Next.js build fails

**Mitigation**:

```bash
# Use e2-standard-4 (16GB RAM) instead of e2-standard-2 (8GB)
# Or increase Node.js heap size:
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm build

# If still failing, build locally and copy dist folders:
# On local:
pnpm build
tar -czf dist.tar.gz apps/*/dist workers/*/dist packages/*/dist

# Copy to VM and extract
```

**Risk Level**: MEDIUM - Can be solved with more RAM or pre-built artifacts

---

### Risk 3: Docker Network Configuration

**Issue**: Docker networking behaves differently on Linux

**Potential Problems**:

- Services can't reach `localhost` from within containers
- Port mappings don't work as expected
- Container-to-container communication fails

**Mitigation**:

```bash
# Verify docker-compose.dev.yml uses correct network mode
# Your current file uses bridge mode - this should work fine

# Test connectivity after starting:
docker network inspect 2d1l_network
docker exec postgres-2d1l ping redis-2d1l

# If services need to reach host from container:
# Use: host.docker.internal (works on Linux with recent Docker)
# Or: 172.17.0.1 (default Docker bridge IP)
```

**Risk Level**: LOW - Your docker-compose already uses proper networking

---

### Risk 4: Environment Variables

**Issue**: Missing or incorrect .env values for production

**Potential Problems**:

- Database connection strings pointing to wrong hosts
- API keys not set
- CORS issues with frontend pointing to wrong API URL
- Next.js build-time env vars not available

**Mitigation**:

```bash
# Create a checklist for .env migration:
# 1. Update NEXT_PUBLIC_API_URL to VM's external IP
# 2. Verify all database hosts are correct (localhost or container names)
# 3. Ensure NODE_ENV=production
# 4. Keep all API keys from local .env

# Test env vars are loaded:
pm2 logs api-gateway --lines 50 | grep "Environment loaded"
```

**Risk Level**: MEDIUM - Most common deployment issue, easy to fix

---

### Risk 5: File Upload Paths

**Issue**: `uploads/` directory and other file system paths

**Potential Problems**:

- File uploads fail due to missing directories
- Permission denied errors
- Absolute paths hardcoded

**Mitigation**:

```bash
# Create necessary directories:
mkdir -p ~/apps/2D1L/uploads
mkdir -p ~/apps/2D1L/generated-images
mkdir -p ~/apps/2D1L/logs

# Set proper permissions:
chmod -R 755 ~/apps/2D1L/uploads
chmod -R 755 ~/apps/2D1L/generated-images
chmod -R 755 ~/apps/2D1L/logs

# In your code, ensure you use relative paths or process.cwd()
```

**Risk Level**: LOW - Just need to create directories

---

### Risk 6: Database Persistence & Initialization

**Issue**: Databases need proper initialization and data persistence

**Potential Problems**:

- Docker volumes not persisting data
- Prisma migrations not running
- Neo4j requires initial password setup
- Database containers crash on startup

**Mitigation**:

```bash
# Verify docker volumes are created:
docker volume ls | grep 2d1l

# Check if postgres_data, neo4j_data, etc. directories exist:
ls -la ~/apps/2D1L/ | grep data

# For Neo4j first-time setup, verify password in .env matches:
docker logs neo4j-2d1l | grep password

# Run migrations explicitly:
pnpm --filter=@2dots1line/database db:push
```

**Risk Level**: MEDIUM - Critical for data persistence

---

### Risk 7: Port Conflicts

**Issue**: Ports already in use on VM

**Potential Problems**:

- Docker can't bind to ports (5433, 7688, 8080, 6379)
- PM2 services fail to start (3000, 3001)

**Mitigation**:

```bash
# Check for port conflicts before starting:
sudo netstat -tlnp | grep -E ':(3000|3001|5433|7688|8080|6379)'

# Or use:
sudo lsof -i :3001

# Kill conflicting processes:
sudo kill -9 <PID>
```

**Risk Level**: LOW - Fresh VM unlikely to have conflicts

---

### Risk 8: PM2 Process Management

**Issue**: PM2 environment variables and script paths

**Potential Problems**:

- PM2 can't find built JavaScript files
- Environment variables not loaded properly
- Scripts reference wrong paths

**Mitigation**:

```bash
# Verify built files exist before starting PM2:
ls -la apps/api-gateway/dist/server.js
ls -la workers/ingestion-worker/dist/index.js

# Test PM2 config without starting:
pm2 prettylist

# Check PM2 environment:
pm2 env 0  # Shows env vars for first process

# If paths are wrong, update ecosystem.config.js
```

**Risk Level**: MEDIUM - Your EnvironmentLoader may need adjustment

---

### Risk 9: External IP vs Localhost

**Issue**: Frontend needs to call API via external IP, but locally uses localhost

**Potential Problems**:

- CORS errors
- Frontend can't reach API
- WebSocket connections fail

**Mitigation**:

```bash
# Update .env before building frontend:
NEXT_PUBLIC_API_URL=http://YOUR_VM_IP:3001

# In API Gateway, ensure CORS allows your VM IP:
# apps/api-gateway/src/server.ts should have:
# cors({ origin: '*' }) for testing, or specific origins

# Test from outside VM:
curl http://YOUR_VM_IP:3001/api/v1/health
```

**Risk Level**: MEDIUM - Requires correct configuration

---

### Risk 10: Timezone & Locale

**Issue**: Server timezone may differ from local

**Potential Problems**:

- Timestamp inconsistencies
- Date formatting issues
- Scheduled jobs run at wrong times

**Mitigation**:

```bash
# Set timezone on VM:
sudo timedatectl set-timezone America/New_York  # or your timezone

# Verify:
timedatectl

# In your code, always use UTC or explicit timezones
```

**Risk Level**: LOW - Usually not critical for testing

---

## Pre-Deployment Checklist

Before deploying, verify these on your local setup:

- [ ] All file paths use relative paths (not absolute `/Users/...`)
- [ ] No hardcoded `localhost` URLs in frontend code (use env vars)
- [ ] All imports use consistent casing (check with `eslint`)
- [ ] `.env` has no local-specific paths
- [ ] `docker-compose.dev.yml` works locally
- [ ] `pnpm build` completes successfully
- [ ] All tests pass

---

## Testing Plan for VM Deployment

Once deployed, test in this order:

1. **Database connectivity**:
```bash
docker ps  # All 5 containers running
docker logs postgres-2d1l | grep "ready to accept connections"
docker logs neo4j-2d1l | grep "Started"
```

2. **API Gateway health**:
```bash
curl http://localhost:3001/api/v1/health
```

3. **Worker status**:
```bash
pm2 status  # All services "online"
pm2 logs api-gateway --lines 20
```

4. **Database connectivity from services**:
```bash
pm2 logs api-gateway | grep -i "database connected"
pm2 logs ingestion-worker | grep -i "redis connected"
```

5. **Frontend build**:
```bash
cd ~/apps/2D1L/apps/web-app
pnpm build  # Should complete without errors
```

6. **End-to-end test from external**:
```bash
# From your local machine
curl http://YOUR_VM_IP:3001/api/v1/health
open http://YOUR_VM_IP:3000
```


---

## Most Likely Issues (Ranked by Probability)

1. **Environment variables misconfigured** (60% chance)

   - Fix: Double-check .env file, especially NEXT_PUBLIC_API_URL

2. **Build runs out of memory** (30% chance)

   - Fix: Use e2-standard-4 (16GB) or export NODE_OPTIONS="--max-old-space-size=8192"

3. **Database connection timing issues** (20% chance)

   - Fix: Wait for databases to fully initialize before starting PM2

4. **File permissions on uploads/** (15% chance)

   - Fix: `chmod -R 755 uploads/` and ensure directory exists

5. **CORS issues** (10% chance)

   - Fix: Update CORS config in API Gateway to allow external IP

---

## Rollback Strategy

If deployment fails, you can quickly rollback:

```bash
# Stop all services
pm2 delete all
docker-compose -f docker-compose.dev.yml down

# Delete VM
gcloud compute instances delete 2d1l-production --zone=us-central1-a

# Your local environment remains unchanged
# Free trial credits are refunded for stopped VMs (after a few hours)
```

---

## Success Indicators

You'll know deployment is successful when:

- ✅ All Docker containers show "Up" status
- ✅ All PM2 processes show "online" status
- ✅ `curl http://localhost:3001/api/v1/health` returns 200 OK
- ✅ `curl http://YOUR_VM_IP:3001/api/v1/health` returns 200 OK from outside
- ✅ Frontend loads at `http://YOUR_VM_IP:3000`
- ✅ Can create conversation and send messages successfully
- ✅ PM2 logs show no errors
- ✅ Docker logs show no errors

---

## Security Considerations for Seed Testing

Since this is for seed testing only, we're keeping things simple. For production, you'd want:

1. **SSL/TLS**: Set up HTTPS with Let's Encrypt
2. **Firewall**: Restrict access to specific IPs
3. **Secrets**: Use GCP Secret Manager instead of .env
4. **Backups**: Set up automated database backups
5. **Monitoring**: Enable Cloud Monitoring and Logging

---

## Next Steps After Seed Testing

Once you validate with seed users and need to scale:

1. **Enable auto-backups** for databases
2. **Move to Cloud SQL** for PostgreSQL (managed, auto-backups)
3. **Add load balancer** if traffic increases
4. **Separate frontend** to Cloud Run or Firebase Hosting
5. **Implement CI/CD** with Cloud Build
6. **Add monitoring** with Cloud Monitoring

---

## Quick Reference Commands

```bash
# SSH into VM
gcloud compute ssh 2d1l-production --zone=us-central1-a

# Check all services
pm2 status
docker ps

# View logs
pm2 logs --lines 50
docker logs -f postgres-2d1l

# Restart everything
pm2 restart all
docker-compose -f docker-compose.dev.yml restart

# Update code
git pull
pnpm build
pm2 restart all

# Stop everything
pm2 stop all
docker-compose -f docker-compose.dev.yml down

# Start everything
docker-compose -f docker-compose.dev.yml up -d
pm2 start ecosystem.config.js
```

---

## Summary

You now have a complete deployment on a single GCP VM that:

- ✅ Replicates your local development environment
- ✅ Runs all databases in Docker containers
- ✅ Manages workers with PM2
- ✅ Serves your Next.js frontend
- ✅ Uses your free trial credits (no cost for ~2 months)
- ✅ Ready for seed user testing

**Access your app at**: `http://YOUR_VM_IP:3000`

**API endpoint**: `http://YOUR_VM_IP:3001`

**Estimated setup time**: 2-3 hours

**Monthly cost**: $0 (free trial) → $50-80/month after trial