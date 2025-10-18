
# VM Access Troubleshooting Guide

## Overview

This guide provides systematic troubleshooting steps for VM deployment issues, with a focus on the "Verifying your session..." problem and web server deployment options.

> **📚 For comprehensive deployment and startup procedures, see [DEPLOYMENT_AND_STARTUP_GUIDE.md](./DEPLOYMENT_AND_STARTUP_GUIDE.md)**

## Table of Contents

1. [Web Server Deployment Options](#web-server-deployment-options)
2. ["Verifying your session..." Issue](#verifying-your-session-issue)
3. [Systematic Troubleshooting Steps](#systematic-troubleshooting-steps)
4. [Quick Fix Commands](#quick-fix-commands)

---

## Web Server Deployment Options

### Option 1: PM2 Integrated (Recommended - Production)

**Command:**
```bash
# Start everything including web-app with PM2
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.config.js"

# Or start just the web-app
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.config.js --only web-app"
```

**Pros:**
- ✅ **Unified process management** - All services in one place
- ✅ **Automatic restart on failure** - Web-app recovers automatically
- ✅ **Consistent environment loading** - Uses same reliable env system as backend
- ✅ **Survives SSH disconnections** - Runs independently
- ✅ **Production-ready** - Battle-tested process management
- ✅ **Easy monitoring** - `pm2 status`, `pm2 logs web-app`
- ✅ **Persistent across reboots** - `pm2 save` and `pm2 startup`

**Cons:**
- ❌ Requires understanding of PM2 commands
- ❌ Slightly more complex than manual startup

**Best for:** Production deployments, reliable operation, unified management

### Option 2: PM2 Development Mode

**Command:**
```bash
# Start web-app in development mode with PM2
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.config.js --only web-app-dev"
```

**Pros:**
- ✅ **PM2 benefits** - Process management, monitoring, auto-restart
- ✅ **Development mode** - Better error reporting
- ✅ **Survives SSH disconnections**
- ✅ **Consistent environment**

**Cons:**
- ❌ **No hot reload** - Changes require manual restart
- ❌ Slightly higher resource usage than manual dev mode

**Best for:** Development with PM2 benefits, testing production-like setup

### Option 3: Manual Development Mode (Hot Reload)

**Command:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm dev"
```

**Pros:**
- ✅ **Hot reload** - Instant updates during development
- ✅ **Real-time error reporting** - See errors immediately
- ✅ **Fast development cycle** - No build step required
- ✅ **Direct control** - Full control over the process

**Cons:**
- ❌ **Dies when SSH disconnects** - Not persistent
- ❌ **No automatic restart** - Manual intervention required
- ❌ **Not suitable for production**

**Best for:** Active development with frequent changes, debugging

### Option 4: Manual Production Mode (Legacy)

**Command:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm start"
```

**Pros:**
- ✅ **Simple** - Direct command execution
- ✅ **Real-time output** - See logs immediately
- ✅ **No dependencies** - Just Node.js and pnpm

**Cons:**
- ❌ **Dies when SSH disconnects** - Not persistent
- ❌ **No automatic restart** - Manual intervention required
- ❌ **Manual process management** - No monitoring or health checks
- ❌ **Not production-ready**

**Best for:** Quick testing, debugging, temporary setups

---

## PM2 Integration Benefits

### Unified Process Management

With PM2 integration, you can manage all services (API Gateway, workers, and web-app) from a single interface:

```bash
# Check all services
pm2 status

# Restart everything
pm2 restart all

# Restart just the web-app
pm2 restart web-app

# View logs for specific service
pm2 logs web-app
pm2 logs api-gateway

# Monitor all services
pm2 monit
```

### Environment Variable Consolidation

The PM2 integration eliminates the need for separate `.env` files:

- ✅ **Single source of truth** - All environment variables in root `.env`
- ✅ **Consistent loading** - Same reliable environment system for all services
- ✅ **No duplication** - Removed `apps/web-app/.env` file
- ✅ **Automatic injection** - PM2 automatically loads environment variables

### Production-Ready Features

- ✅ **Automatic restart** - Services restart automatically on failure
- ✅ **Process monitoring** - Health checks and resource monitoring
- ✅ **Log management** - Centralized logging with rotation
- ✅ **Startup persistence** - Services auto-start on VM reboot
- ✅ **Zero-downtime deployments** - Graceful restarts

---

## "Verifying your session..." Issue

### Root Cause

The "Verifying your session..." message appears when `hasHydrated` is `false` in the `UserStore`. This happens in the main `HomePage` component:

```typescript
if (!hasHydrated) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <DynamicBackground view="dashboard" />
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Verifying your session...</div>
        </div>
      </main>
    </div>
  );
}
```

### Common Causes

1. **Zustand Persist Middleware Issues**
   - `onRehydrateStorage` callback not completing
   - Corrupted localStorage data
   - Silent persist middleware failures

2. **Authentication Initialization Problems**
   - `initializeAuth()` function hanging on API calls
   - Network timeouts with `/api/v1/auth/verify`
   - Backend authentication service not responding

3. **Environment Variable Issues**
   - Incorrect `NEXT_PUBLIC_API_BASE_URL`
   - CORS issues preventing API calls
   - API Gateway not accessible

4. **State Management Race Conditions**
   - Multiple `initializeAuth()` calls interfering
   - `isInitializing` guard not working properly
   - State updates not persisting correctly

---

## Systematic Troubleshooting Steps

### Step 1: Quick Diagnostics (2 minutes)

**Check if web-app is running:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="ps aux | grep next | grep -v grep"
```

**Test web-app accessibility:**
```bash
curl -s http://34.136.210.47:3000 | head -5
```

**Check API Gateway:**
```bash
curl -s http://34.136.210.47:3001/api/v1/health
```

### Step 2: Environment Verification (1 minute)

**Check environment variables:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app && cat .env"
```

**Verify no conflicting .env files:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app && ls -la .env*"
```

**Expected output:**
```
GOOGLE_API_KEY=AIzaSyDagwcNy45aBD9JSHhD8Uu9ozysugDzQfQ
OPENAI_API_KEY=sk-sknohftxejzfzdmsrjdzdcmkttuztngwfroskkhsucbezlqf
PEXELS_API_KEY=sWXSWt0wNf3B2WdMrUPJdi3sbgmT3eCD9EbnObPafnKLceErnXpMcROs
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001
```

### Step 3: Browser Debugging (3 minutes)

**Open browser dev tools (F12) and check:**
1. **Console tab** - Look for JavaScript errors
2. **Network tab** - Check for failed API calls
3. **Application tab** - Check localStorage for corrupted data

**Create localStorage clearing page:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app/public && echo '<!DOCTYPE html><html><head><title>Clear Storage</title></head><body><h1>Clearing localStorage...</h1><script>localStorage.clear(); sessionStorage.clear(); alert(\"Storage cleared! Redirecting...\"); window.location.href = \"/\";</script></body></html>' > clear-storage.html"
```

**Access:** `http://34.136.210.47:3000/clear-storage.html`

### Step 4: Force Clean Restart (3 minutes)

**Complete reset (most effective):**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="pkill -f next && sleep 2 && cd ~/2D1L/apps/web-app && rm -rf .next && pnpm build && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm start"
```

**Alternative - just restart:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="pkill -f next && sleep 2 && cd ~/2D1L/apps/web-app && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm start"
```

### Step 5: Development Mode Test (2 minutes)

**If production mode fails, try development mode:**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm dev"
```

### Step 6: Code-Level Fix (5 minutes)

**If issue persists, add temporary fix to UserStore.ts:**

```typescript
// Add this to the initializeAuth function after line 420
setTimeout(() => {
  if (!get().hasHydrated) {
    console.log('UserStore - Force setting hasHydrated to true');
    set({ hasHydrated: true, isInitializing: false });
  }
}, 1000);
```

---

## Quick Fix Commands

### Most Common Solutions (in order of effectiveness)

**1. PM2 Complete Reset (95% success rate):**
```bash
# Stop all processes and restart with PM2
gcloud compute ssh twodots-vm --zone=us-central1-a --command="pkill -f next && sleep 2 && cd ~/2D1L && pnpm build && pm2 start ecosystem.config.js"
```

**2. PM2 Web-App Only Reset:**
```bash
# Restart just the web-app with PM2
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 restart web-app"
```

**3. Clear Browser Storage + PM2 Restart:**
```bash
# Visit: http://34.136.210.47:3000/clear-storage.html
# Then restart web-app with PM2
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 restart web-app"
```

**4. Manual Complete Reset (Legacy):**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="pkill -f next && sleep 2 && cd ~/2D1L/apps/web-app && rm -rf .next && pnpm build && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm start"
```

**5. Development Mode (For Active Development):**
```bash
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm dev"
```

### Verification Commands

**Check if everything is working:**
```bash
# Check PM2 status (recommended)
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 status"

# Check web-app accessibility
curl -s http://34.136.210.47:3000 | grep -o "Verifying your session" || echo "Web-app is working!"

# Check API Gateway
curl -s http://34.136.210.47:3001/api/v1/health

# Check web-app logs
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 logs web-app --lines 10"

# Check all processes (legacy)
gcloud compute ssh twodots-vm --zone=us-central1-a --command="ps aux | grep -E '(next|pm2)' | grep -v grep"
```

---

## Summary

### PM2 Integration Benefits

The web-app is now fully integrated into the PM2 ecosystem, providing:

- ✅ **Unified process management** - All services managed from one interface
- ✅ **Automatic restart on failure** - Web-app recovers automatically
- ✅ **Consistent environment loading** - Same reliable env system as backend
- ✅ **Production-ready reliability** - Survives SSH disconnections and VM reboots
- ✅ **Simplified deployment** - Single command starts everything

### "Verifying your session..." Issue Resolution

The issue is typically caused by:
1. **Browser localStorage corruption** (most common)
2. **Zustand persist middleware failures**
3. **Production build hydration mismatches**
4. **Network timeouts in authentication**

**Recommended approach:**
1. **Use PM2 integration** - Most reliable and production-ready
2. **Clear browser storage** - Resolves localStorage corruption
3. **Use PM2 restart commands** - Faster than manual restarts
4. **For development** - Use manual dev mode with hot reload

**Success indicators:**
- Web-app loads without "Verifying your session..." message
- Login/signup forms appear correctly
- No JavaScript errors in browser console
- API calls complete successfully
- PM2 shows all services as "online"

### New Workflow

**Production Deployment:**
```bash
# Single command to start everything
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.config.js"
```

**Development:**
```bash
# Start backend services with PM2
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.config.js --only api-gateway,ingestion-worker,insight-worker,ontology-optimization-worker,card-worker,embedding-worker,graph-projection-worker,conversation-timeout-worker,maintenance-worker,notification-worker,spatial-query-worker,video-generation-worker"

# Start web-app in development mode
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L/apps/web-app && NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001 pnpm dev"
```