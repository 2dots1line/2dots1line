# VM Restart Manual - Error-Proof Process

## 🎯 **Complete VM Deployment Process**

This manual contains the **final, tested sequence** for deploying from GitHub to VM. Use this when you've made changes locally, pushed to GitHub, and need to deploy to the VM.

---

## **Phase 0: SSH into VM and Navigate to Project**

```bash
# SSH into VM using gcloud
gcloud compute ssh twodots-vm --zone=us-central1-a

# Navigate to project directory
cd ~/2D1L
```

---

## **Phase 1: Pull Latest Code from GitHub (CRITICAL FIX)**

```bash
# CRITICAL: Use fetch + pull to ensure latest changes are retrieved
git fetch origin
git pull origin compute-engine-deployment

# Verify you're on the right branch
git branch

# Check if there are any uncommitted changes
git status

# Verify the pull worked by checking recent commits
git log --oneline -3
```

**⚠️ IMPORTANT:** The simple `git pull` command sometimes fails to fetch the latest changes. Always use `git fetch origin` first, then `git pull origin compute-engine-deployment` to ensure you get all updates.

---

## **Phase 2: Install Dependencies (If Needed)**

```bash
# Install any new dependencies
pnpm install

# Build all packages from project root
pnpm build
```

---

## **Phase 3: Complete Cleanup (Prevent All Conflicts)**

```bash
# Kill ALL processes that could conflict
pkill -f "next start" || true
pkill -f "next-server" || true
pm2 delete all || true

# CRITICAL: Use fuser to kill zombie processes holding ports
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 3001/tcp 2>/dev/null || true

# Backup cleanup methods
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Wait for cleanup
sleep 3
```

**⚠️ CRITICAL FIX:** The `fuser -k` command is essential for killing zombie processes that `lsof` and `pkill` miss. This prevents the web-app crash loop.

**🔧 IMPROVED WEB-APP STARTUP:** The `start-web-app.sh` script now includes built-in cleanup to prevent zombie processes from occurring in the first place.

---

## **Phase 4: Verify Clean State**

```bash
# Confirm ports are free using multiple methods
lsof -ti:3000 || echo "✅ Port 3000 is free"
lsof -ti:3001 || echo "✅ Port 3001 is free"

# Double-check with fuser (more reliable)
sudo fuser 3000/tcp 2>/dev/null || echo "✅ Port 3000 confirmed free"
sudo fuser 3001/tcp 2>/dev/null || echo "✅ Port 3001 confirmed free"

# Confirm no PM2 processes
pm2 list
```

---

## **Phase 5: Fresh Web-App Build (CRITICAL STEP)**

```bash
# Remove any existing builds
rm -rf .next apps/web-app/.next

# Build from the CORRECT directory (this was the missing step!)
cd apps/web-app && pnpm build
cd ../..

# Verify build exists
ls -la .next/BUILD_ID && cat .next/BUILD_ID
```

**⚠️ CRITICAL:** The web-app build MUST be done from `apps/web-app` directory, not project root. This is why previous deployments failed.

---

## **Phase 6: Start Services (Sequential)**

```bash
# Start Docker services first
docker-compose -f docker-compose.dev.yml up -d

# Wait for databases to be ready
sleep 10

# Start all PM2 services
pnpm start:prod

# Wait for services to stabilize
sleep 15
```

---

## **Phase 7: Verification (Must Pass)**

```bash
# API health check
API_STATUS=$(curl -s http://localhost:3001/api/v1/health | jq -r '.success // false')
if [ "$API_STATUS" != "true" ]; then
    echo "❌ API health check failed"
    exit 1
fi

# Frontend health check
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" != "200" ]; then
    echo "❌ Frontend health check failed (HTTP $FRONTEND_STATUS)"
    exit 1
fi

# Final PM2 status check
pm2 status

echo "✅ All services healthy - Deployment successful!"
```

---

## **⚡ ULTRA-FAST PATH (Docker Already Running)**

**When to use:** Docker services are healthy, you just need to rebuild and restart PM2 services.

```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && git fetch origin && git pull origin compute-engine-deployment && pnpm install && pnpm build && pm2 delete all && sudo fuser -k 3000/tcp 2>/dev/null || true; sudo fuser -k 3001/tcp 2>/dev/null || true; sleep 2; cd apps/web-app && pnpm build && cd ../..; pnpm start:prod; sleep 10; curl -s http://localhost:3001/api/v1/health | jq -r '.success' && curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000 && pm2 status"
```

**What's different:**
- ✅ Skips Docker commands entirely
- ✅ Skips Docker wait time (5s saved)
- ✅ ~1.5-2 minutes total time
- ✅ Perfect for code-only changes

---

## **🚀 FAST PATH (For Experienced Users)**

**When to use:** You've made code changes, pushed to GitHub, and want a quick deployment without full cleanup.

```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && git fetch origin && git pull origin compute-engine-deployment && pnpm install && pnpm build && pm2 delete all && sudo fuser -k 3000/tcp 2>/dev/null || true; sudo fuser -k 3001/tcp 2>/dev/null || true; sleep 2; cd apps/web-app && pnpm build && cd ../..; docker-compose -f docker-compose.dev.yml up -d; sleep 5; pnpm start:prod; sleep 10; curl -s http://localhost:3001/api/v1/health | jq -r '.success' && curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000 && pm2 status"
```

**What's different from prudent path:**
- ✅ Skips individual process killing (relies on improved scripts)
- ✅ Skips port verification steps (scripts handle it)
- ✅ Shorter wait times (5s Docker, 10s PM2 vs 10s, 15s)
- ✅ Skips BUILD_ID verification (assumes it works)
- ✅ Relies on enhanced `start-web-app.sh` for cleanup

---

## **🛡️ PRUDENT PATH (For Critical Deployments)**

**When to use:** First-time setup, troubleshooting, or when you want maximum reliability.

```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && git fetch origin && git pull origin compute-engine-deployment && pnpm install && pnpm build && pkill -f \"next start\" || true; pkill -f \"next-server\" || true; pm2 delete all || true; sudo fuser -k 3000/tcp 2>/dev/null || true; sudo fuser -k 3001/tcp 2>/dev/null || true; lsof -ti:3000 | xargs kill -9 2>/dev/null || true; lsof -ti:3001 | xargs kill -9 2>/dev/null || true; sleep 3; rm -rf .next apps/web-app/.next; cd apps/web-app && pnpm build && cd ../..; ls -la .next/BUILD_ID; docker-compose -f docker-compose.dev.yml up -d; sleep 10; pnpm start:prod; sleep 15; curl -s http://localhost:3001/api/v1/health | jq -r '.success' && curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000 && pm2 status"
```

---

## **🎯 Which Path Should You Use?**

### **⚡ Use ULTRA-FAST PATH when:**
- ✅ Docker services are already running and healthy
- ✅ You've made code-only changes (no infrastructure changes)
- ✅ You want maximum speed
- ✅ You're doing frequent development iterations
- ✅ You've verified Docker services are working

### **🚀 Use FAST PATH when:**
- ✅ You've made small code changes
- ✅ You've tested locally and everything works
- ✅ You're doing regular development deployments
- ✅ You want speed over maximum safety
- ✅ The system was working fine before your changes

### **🛡️ Use PRUDENT PATH when:**
- ⚠️ First-time VM setup
- ⚠️ You're troubleshooting issues
- ⚠️ You've made significant architectural changes
- ⚠️ You're deploying to production
- ⚠️ Previous deployments had issues
- ⚠️ You want maximum reliability

### **⚡ Speed Comparison:**
- **Ultra-Fast Path**: ~1.5-2 minutes
- **Fast Path**: ~2-3 minutes
- **Prudent Path**: ~4-5 minutes
- **Manual Step-by-Step**: ~6-8 minutes

---

## **Key Lessons Learned**

1. **CRITICAL: Use git fetch + pull**: Simple `git pull` sometimes fails to fetch latest changes. Always use `git fetch origin && git pull origin compute-engine-deployment`
2. **CRITICAL: Use fuser for port cleanup**: `sudo fuser -k 3000/tcp` is essential for killing zombie processes that `lsof` and `pkill` miss
3. **CRITICAL: Check IP Address Changes**: When Google Cloud restarts your VM (memory changes, machine type changes, etc.), it may assign a NEW external IP address. This will break your domain if DNS isn't updated.
4. **DNS Update Required**: If your external IP changes, you MUST update your Cloudflare DNS A records to point to the new IP address
5. **Install Dependencies**: Run `pnpm install` after pulling new code
6. **Build All Packages**: Run `pnpm build` from project root first
7. **Build Location Matters**: Next.js must build from `apps/web-app` directory, not project root
8. **Complete Cleanup First**: Always kill all processes before starting fresh - use BOTH fuser AND lsof methods
9. **Sequential Startup**: Docker → Build → PM2 → Verify
10. **Verify Everything**: Don't assume success, test each component
11. **Check Git Status**: Always verify `git status` and `git log --oneline -3` to confirm changes were pulled
12. **Web-App Crash Prevention**: The combination of `fuser -k` + `lsof` + `pkill` prevents the web-app crash loop

---

## **Troubleshooting**

### If Git Pull Doesn't Work:
```bash
# Check current commit vs remote
git log --oneline -3
git fetch origin
git log --oneline origin/compute-engine-deployment -3

# Force pull if needed
git reset --hard origin/compute-engine-deployment
```

### If Build Fails:
```bash
# Check if you're in the right directory
pwd  # Should show: /path/to/2D1L/apps/web-app

# Try building again
pnpm build
```

### If Port Conflicts Persist:
```bash
# CRITICAL: Use fuser first (most effective)
sudo fuser -k 3000/tcp
sudo fuser -k 3001/tcp

# Backup cleanup methods
sudo lsof -ti:3000 | xargs sudo kill -9
sudo lsof -ti:3001 | xargs sudo kill -9

# Nuclear option if still failing
sudo pkill -f node
sudo pkill -f next
```

### If PM2 Processes Keep Crashing:
```bash
# Check logs
pm2 logs web-app --lines 20

# Restart specific process
pm2 restart web-app
```

### If Changes Still Not Reflected:
```bash
# Verify files are actually updated
grep -n "your_search_term" config/prompt_templates.yaml

# Check if insight worker needs restart
pm2 restart insight-worker
```

### If Web-App Still Has Zombie Process Issues:
```bash
# Use the improved startup script (alternative approach)
pm2 delete web-app
pm2 start scripts/deployment/start-nextjs-direct.js --name web-app

# Or manually clean and restart
sudo fuser -k 3000/tcp
pm2 restart web-app
```

### If Login Fails After VM Restart (IP Address Change):
```bash
# Check current external IP
curl -s ifconfig.me

# Check what your domain resolves to
nslookup 2d1l.com

# If IPs don't match, update Cloudflare DNS:
# 1. Go to Cloudflare Dashboard → DNS → Records
# 2. Update A record for 2d1l.com to new IP
# 3. Update A record for www to new IP
# 4. Ensure both records are "Proxied" (orange cloud)

# Verify DNS propagation (may take a few minutes)
nslookup 2d1l.com
```

---

## **Success Indicators**

- ✅ All PM2 processes show `online` with 0 restarts
- ✅ API returns `{"success": true}` at `/api/v1/health`
- ✅ Frontend returns HTTP 200 at `http://localhost:3000`
- ✅ BUILD_ID file exists in `.next/BUILD_ID`
- ✅ No port conflicts (lsof shows no processes on 3000/3001)

---

**Last Updated:** October 20, 2025  
**Tested On:** VM deployment with capsule implementation, git sync fix, and web-app crash prevention  
**Status:** ✅ Proven to work consistently  
**Critical Fixes:** 
- Added `git fetch origin` before `git pull` to prevent sync issues
- Added `sudo fuser -k 3000/tcp` to prevent web-app crash loops
- Combined multiple cleanup methods for bulletproof port clearing
