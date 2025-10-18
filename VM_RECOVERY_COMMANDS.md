# VM Recovery Commands - Exact Working Steps

This document contains the exact commands that successfully fixed the VM deployment issues. These commands can be copied and pasted to replicate the fix from scratch.

## Prerequisites

- VM name: `twodots-vm`
- Zone: `us-central1-a`
- Project: `d1l-460112`

## Step 1: Connect to VM and Diagnose

```bash
# Connect to the VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Check current state
pwd
ls -la ~/2D1L
git status
git branch -a

# Check services
pm2 status
sudo docker ps
```

## Step 2: Fix Prisma Client Import Issue

The main issue was that `graph-projection-worker` was importing `@prisma/client` directly instead of through the database package. This is the **correct architectural pattern** - all Prisma types should be imported through `@2dots1line/database`.

```bash
# Navigate to the problematic worker
cd ~/2D1L/workers/graph-projection-worker

# Fix the import statement (replace direct Prisma import with database package import)
sed -i 's/import { Prisma } from '\''@prisma\/client'\'';/import { Prisma } from '\''@2dots1line\/database'\'';/' src/GraphProjectionWorker.ts

# Verify the change
head -25 src/GraphProjectionWorker.ts
```

**Note**: This fix has been applied to the source code, so future deployments won't need this step.

## Step 3: Fix Ontology-Core Package Build Issue

The `ontology-core` package was missing its dist directory, causing build failures.

```bash
# Navigate to ontology-core package
cd ~/2D1L/packages/ontology-core

# Clean and rebuild the package
rm -rf dist tsconfig.tsbuildinfo
pnpm build

# Verify dist directory was created
ls -la dist/
```

## Step 4: Force Reinstall Dependencies

This ensures all package symlinks are properly established.

```bash
# Navigate to project root
cd ~/2D1L

# Force reinstall all dependencies
pnpm install --force
```

## Step 5: Build the Project

```bash
# Build the entire monorepo
pnpm build
```

Expected output: All 28 packages should build successfully with no errors.

## Step 6: Start All Services

```bash
# Start PM2 services
pm2 start scripts/deployment/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Start frontend
cd apps/web-app
pm2 start 'pnpm start' --name 'web-app'

# Save PM2 configuration again
pm2 save
```

## Step 7: Verify Services

```bash
# Check PM2 status
pm2 status

# Check Docker containers
sudo docker ps

# Test API Gateway
curl -s http://localhost:3001/api/v1/health

# Test frontend
curl -s http://localhost:3000 | head -5

# Get VM external IP
gcloud compute instances describe twodots-vm --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

## Complete One-Line Commands for Copy-Paste

If you want to run everything in sequence, here are the exact commands:

### From Local Machine (to connect and run all fixes):

```bash
# Connect and run all fixes in one go
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/workers/graph-projection-worker && sed -i 's/import { Prisma } from '\''@prisma\/client'\'';/import { Prisma } from '\''@2dots1line\/database'\'';/' src/GraphProjectionWorker.ts && cd ~/2D1L/packages/ontology-core && rm -rf dist tsconfig.tsbuildinfo && pnpm build && cd ~/2D1L && pnpm install --force && pnpm build && pm2 start scripts/deployment/ecosystem.config.js && pm2 save && cd apps/web-app && pm2 start 'pnpm start' --name 'web-app' && pm2 save"
```

### Verify Everything Works:

```bash
# Check all services
gcloud compute ssh twodots-vm --zone=us-central1-a --command="pm2 status && echo '---' && sudo docker ps && echo '---' && curl -s http://localhost:3001/api/v1/health && echo '---' && curl -s http://localhost:3000 | head -3"
```

## Key Lessons Learned

1. **Prisma Import Issue**: Workers should import Prisma types through `@2dots1line/database`, not directly from `@prisma/client`
2. **Package Build Order**: Some packages (like `ontology-core`) need to be built before others that depend on them
3. **Dependency Symlinks**: Force reinstalling dependencies (`pnpm install --force`) fixes broken package symlinks
4. **Build Cache Issues**: Sometimes clearing build artifacts (`rm -rf dist tsconfig.tsbuildinfo`) is necessary
5. **Service Startup Order**: Docker containers must be running before starting PM2 services

## Why It Works Locally But Not on VM

### **Local Development:**
- More permissive TypeScript configuration
- `@prisma/client` available in workspace root `node_modules`
- TypeScript can resolve imports even with incorrect patterns
- Build process is more forgiving with module resolution

### **VM Production Environment:**
- Stricter build environment and TypeScript settings
- Package symlinks may not be properly established
- TypeScript is more strict about module resolution
- Build fails when it can't find direct `@prisma/client` imports

### **The Correct Pattern:**
All Prisma types should be imported through the database package:
```typescript
// ❌ Wrong (works locally, fails on VM)
import { Prisma } from '@prisma/client';

// ✅ Correct (works everywhere)
import { Prisma } from '@2dots1line/database';
```

This follows the monorepo architecture where the database package is the single source of truth for all database-related types and services.

## Expected Final State

After running these commands, you should have:

- ✅ All 28 packages built successfully
- ✅ 12 PM2 processes running (API Gateway + 11 workers + frontend)
- ✅ 5 Docker containers running (PostgreSQL, Neo4j, Weaviate, Redis, Python service)
- ✅ API Gateway responding at `http://[VM_IP]:3001/api/v1/health`
- ✅ Frontend serving at `http://[VM_IP]:3000`

## Access URLs

Replace `[VM_IP]` with your VM's external IP (get it with the command in Step 7):

- **Frontend**: http://[VM_IP]:3000
- **API Gateway**: http://[VM_IP]:3001
- **Neo4j Browser**: http://[VM_IP]:7474
- **Weaviate**: http://[VM_IP]:8080

## Troubleshooting

If any step fails:

1. **Build fails**: Check for TypeScript errors in the specific package
2. **PM2 services not starting**: Check logs with `pm2 logs [service-name]`
3. **Docker containers not running**: Check with `sudo docker ps` and restart with `sudo docker-compose -f ~/2D1L/docker-compose.dev.yml up -d`
4. **Permission issues**: Ensure user is in docker group with `groups $USER`

## Database Schema Setup

After the build is complete, you need to apply the database schemas:

### PostgreSQL Schema (Prisma)
```bash
# Apply PostgreSQL schema
cd ~/2D1L/packages/database
export DATABASE_URL='postgresql://postgres:@V%26H%25%3C%5Eu%5BbY6eXd5@localhost:5433/twodots1line'
pnpm prisma db push
```

### Neo4j Schema
```bash
# Apply Neo4j schema
cd ~/2D1L
sudo docker exec neo4j-2d1l cypher-shell -u neo4j -p 'password123' < packages/database/schemas/neo4j.cypher
```

### Weaviate Schema
```bash
# Create basic Weaviate class
curl -X POST http://localhost:8080/v1/schema -H 'Content-Type: application/json' -d '{"class": "UserKnowledgeItem", "description": "A unified searchable item representing textual content from any source entity.", "vectorizer": "none"}'
```

## Using Prisma Studio on VM

### Start Prisma Studio
```bash
# Set environment variables and start Prisma Studio (correct command from QUICK_CLEAN_START.md)
cd ~/2D1L
export DATABASE_URL='postgresql://postgres:@V%26H%25%3C%5Eu%5BbY6eXd5@localhost:5433/twodots1line'
npx prisma studio --schema=./packages/database/prisma/schema.prisma
```

### Access Prisma Studio

**Option 1: SSH Port Forwarding (Recommended)**
```bash
# From your local machine, set up port forwarding
gcloud compute ssh twodots-vm --zone=us-central1-a -- -L 5555:localhost:5555 -N

# Then access Prisma Studio at: http://localhost:5555
```

**Option 2: Direct SSH Access**
```bash
# SSH into VM and access locally
gcloud compute ssh twodots-vm --zone=us-central1-a
# Then open http://localhost:5555 in a browser on the VM
```

**Note**: Prisma Studio runs on localhost inside the VM, so you need SSH port forwarding to access it from your local machine.

### Database Access URLs
- **PostgreSQL**: `postgresql://postgres:@V%26H%25%3C%5Eu%5BbY6eXd5@34.136.210.47:5433/twodots1line`
- **Neo4j Browser**: http://34.136.210.47:7474 (username: neo4j, password: password123)
- **Weaviate**: http://34.136.210.47:8080

### API Keys Setup for AI Features
```bash
# Create .env file in web-app directory for AI cover generation
cd ~/2D1L/apps/web-app
cat > .env << 'EOF'
GOOGLE_API_KEY=AIzaSyDagwcNy45aBD9JSHhD8Uu9ozysugDzQfQ
OPENAI_API_KEY=sk-sknohftxejzfzdmsrjdzdcmkttuztngwfroskkhsucbezlqf
PEXELS_API_KEY=sWXSWt0wNf3B2WdMrUPJdi3sbgmT3eCD9EbnObPafnKLceErnXpMcROs
EOF
```

**Note**: These API keys are required for:
- AI cover generation (Google/OpenAI)
- Background video generation (Pexels)
- The web-app needs its own .env file because Next.js loads environment variables from the app directory

## Code Change Deployment Process

### **Process for Applying Code Changes: Local → VM**

#### **Step 1: Apply Changes Locally**
```bash
# 1. Make your changes locally
# 2. Test locally to ensure everything works
cd ~/Documents/GitHub/202506062D1L/2D1L

# Build the project
pnpm build

# Restart backend services
pm2 restart all

# Kill any existing web-app processes
pkill -f "next-server" || true
pkill -f "next dev" || true

# Start web-app in development mode
cd apps/web-app
pnpm dev

# 3. Test locally, then commit your changes
git add <modified-files>
git commit -m "fix: description of your changes"
```

#### **Step 2: Push to GitHub**
```bash
# Push to your current branch
git push origin compute-engine-deployment
```

#### **Step 3: Apply Changes on VM**
```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Pull the latest changes
cd ~/2D1L
git pull origin compute-engine-deployment

# Build the project on VM
pnpm build

# Restart services to pick up the changes
pm2 restart all

# Kill any existing web-app processes and restart
pkill -f "next-server" || true
pkill -f "next dev" || true

# Start web-app in development mode
cd apps/web-app
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm dev
```

#### **Why This Process?**
1. **Local Testing First**: Always test changes locally where you have full control
2. **Git as Source of Truth**: Use GitHub as the bridge between local and VM
3. **Service Restart**: Prompt template changes require service restarts to take effect

#### **Best Practice Workflow:**
1. **Local Development** → Test → Commit → Push
2. **VM Deployment** → Pull → Restart Services
3. **Verify** → Test on VM to ensure changes work

This ensures your local repo, GitHub, and VM all stay in sync, and you have proper version control of all changes.

## Best Practice: Terminal Setup for Development

### **Recommended: Multiple Terminal Setup**

#### **Terminal 1: Local Development**
```bash
# Keep this terminal at your local project root
cd ~/Documents/GitHub/202506062D1L/2D1L
# Use this for: git operations, local builds, commits
```

#### **Terminal 2: VM SSH Session (Persistent)**
```bash
# Establish a persistent SSH connection
gcloud compute ssh twodots-vm --zone=us-central1-a

# Once connected, you're in the VM and can run multiple commands
cd ~/2D1L
# Use this for: VM builds, service restarts, testing
```

#### **Terminal 3: VM Port Forwarding (Optional)**
```bash
# Keep this running for Prisma Studio access
gcloud compute ssh twodots-vm --zone=us-central1-a -- -L 5555:localhost:5555 -N
```

### **Why This Approach is Better:**

#### **❌ Avoid: Repeated SSH Commands**
```bash
# DON'T do this - inefficient and slow
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pnpm build"
gcloud compute ssh twodots-vm --zone=us-central1-a --command="pm2 restart all"
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd apps/web-app && pnpm dev"
```

#### **✅ Do: Persistent SSH Session**
```bash
# Establish connection once
gcloud compute ssh twodots-vm --zone=us-central1-a

# Then run multiple commands in the same session
cd ~/2D1L
pnpm build
pm2 restart all
cd apps/web-app
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm dev
```

### **Advanced: SSH Config (Even Better)**

Create `~/.ssh/config`:
```bash
Host twodots-vm
    HostName 34.136.210.47
    User your-username
    IdentityFile ~/.ssh/google_compute_engine
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Then you can simply:
```bash
ssh twodots-vm
```

### **Workflow Example:**

#### **Local Terminal:**
```bash
# Make changes, test locally
pnpm build
pm2 restart all
pkill -f "next dev"
cd apps/web-app && pnpm dev

# Commit and push
git add .
git commit -m "fix: prompt template changes"
git push origin compute-engine-deployment
```

#### **VM Terminal (persistent session):**
```bash
# Pull and deploy
git pull origin compute-engine-deployment
pnpm build
pm2 restart all
pkill -f "next dev"
cd apps/web-app
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm dev
```

### **Benefits:**
- **Faster**: No SSH connection overhead for each command
- **Context**: Stay in the right directory
- **Efficiency**: Run multiple commands in sequence
- **Debugging**: Easier to troubleshoot issues
- **History**: Command history persists in the session

## Recovery Time

Total time to fix: ~5-10 minutes
- Dependency fixes: ~2 minutes
- Build process: ~2-3 minutes  
- Service startup: ~1-2 minutes
- Database schema setup: ~1-2 minutes
- Verification: ~1 minute

## Latest Lessons Learned (October 2025)

### **Critical Environment Variable Issues**

#### **Problem: CORS Login Failures**
- **Symptoms**: Frontend shows "Login failed" with CORS errors in console
- **Console Error**: `Origin http://34.136.210.47:3000 is not allowed by Access-Control-Allow-Origin. XMLHttpRequest cannot load http://localhost:3001/api/v1/auth/login`
- **Root Cause**: Frontend making API calls to `localhost:3001` instead of `34.136.210.47:3001`

#### **Solution: Proper Environment File Management**
1. **NEVER create `.env.local` files on the VM** - they override `.env` files
2. **Use only `.env` files** in `apps/web-app/` directory
3. **Ensure correct API URL**: `NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001`

#### **Next.js Environment File Priority (CRITICAL)**
Next.js loads environment files in this order (highest to lowest priority):
1. `.env.local` (highest priority - **AVOID ON VM**)
2. `.env` (use this)
3. `.env.development` (avoid on VM)
4. `.env.production` (avoid on VM)

#### **Correct VM Environment Setup**
```bash
# In apps/web-app/.env (ONLY this file should exist)
GOOGLE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
PEXELS_API_KEY=your_key_here
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001
```

#### **What NOT to Do:**
- ❌ Don't create `.env.local` files on the VM
- ❌ Don't use `localhost` URLs in environment variables on VM
- ❌ Don't mix environment files (`.env` + `.env.local`)

#### **What TO Do:**
- ✅ Use only `.env` files on the VM
- ✅ Always use external IP addresses (`34.136.210.47`) in environment variables
- ✅ Verify environment variables are loaded correctly: `- Environments: .env`

#### **Verification Steps:**
1. Check Next.js startup logs: Should show `- Environments: .env` (not `.env.local, .env`)
2. Test API calls: Frontend should call `34.136.210.47:3001`, not `localhost:3001`
3. Check browser console: No CORS errors
4. Test login: Should work with proper credentials

#### **Quick Fix for Environment Issues:**
```bash
# Remove conflicting environment files
rm apps/web-app/.env.local
rm apps/web-app/.env.development
rm apps/web-app/.env.production

# Ensure only .env exists with correct API URL
echo "NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001" >> apps/web-app/.env

# Restart web-app
pkill -f next
cd apps/web-app && pnpm dev
```

### **Test User Creation**
When testing login functionality:
```bash
# Create test user via API
curl -X POST http://34.136.210.47:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com", "name": "Test User", "password": "testpassword123"}'

# Test login
curl -X POST http://34.136.210.47:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com", "password": "testpassword123"}'
```

### **Key Takeaway**
**Environment variable conflicts are the #1 cause of VM deployment issues.** Always use a single `.env` file with external IP addresses, never create `.env.local` files on the VM.
