# Source Code Cleanup Guide - Complete Documentation

**Last Updated**: 2025-10-31  
**Status**: ✅ Production Ready - Tested on VM

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What Gets Removed/Preserved](#what-gets-removedpreserved)
3. [Safety Guarantees](#safety-guarantees)
4. [Usage](#usage)
5. [Service Recovery](#service-recovery)
6. [Backup Management](#backup-management)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

### Purpose

The `cleanup-source-code.sh` script enhances production security by removing source code from the VM after deployment, while preserving all runtime requirements.

**Benefits:**
- 🔒 **Security**: Reduces attack surface (no source code exposure)
- 💾 **Space Savings**: Frees ~200-850 MB of disk space
- ✅ **Compliance**: Meets security standards requiring no source on production

### Key Features

- ✅ Pre-flight safety checks (verifies build completion)
- ✅ Automatic backup before deletion
- ✅ GitHub/local machine detection and abort
- ✅ Dry-run mode for testing
- ✅ Comprehensive logging
- ✅ Preserves all runtime artifacts and recovery scripts

---

## What Gets Removed/Preserved

### ✅ Removed (Security Risk)

1. **Source Code**
   - `packages/*/src/`, `services/*/src/`, `workers/*/src/`, `apps/*/src/`
   - `*.ts`, `*.tsx` files (except runtime configs)

2. **Build Configurations**
   - `tsconfig.json`, `tsconfig.*.json`, `turbo.json`, `*.tsbuildinfo`

3. **Development Files**
   - `.git/` directory
   - `config/` directory
   - Development scripts (preserves `scripts/deployment/` and `scripts/GUIDES/`)

4. **Documentation**
   - `DevLog/`, `docs/`, `infrastructure/`, `archive/`
   - Root-level `.md` files (keeps `README.md`)

5. **Migration Artifacts**
   - `migration-*/` directories
   - `migration-weaviate.log`

6. **Old Logs**
   - Logs older than 7 days

### ✅ Preserved (Runtime Required)

1. **Build Artifacts**
   - `dist/` directories (compiled JavaScript)
   - `apps/web-app/.next/` (Next.js production build)
   - `apps/web-app/public/` (static assets)

2. **Runtime Dependencies**
   - `node_modules/`
   - `package.json`, `pnpm-lock.yaml`

3. **Configuration**
   - `scripts/deployment/ecosystem.prod.config.js` (PM2 config)
   - `docker-compose.dev.yml`
   - `.env`
   - `apps/web-app/next.config.js`

4. **Recovery Scripts** (CRITICAL)
   - `scripts/trigger-*.js` (root level)
   - `scripts/GUIDES/trigger-*.js` (enhanced triggers)
   - `scripts/deployment/*.sh` (deployment scripts)

---

## Safety Guarantees

### 🔒 GitHub Repository Protection

**The script CANNOT affect your GitHub repository:**

- ✅ **Automatic Detection**: Detects GitHub repository and **aborts immediately**
- ✅ **Local Machine Protection**: Detects local development machine and **aborts**
- ✅ **Requires Explicit Override**: Only proceeds with `FORCE_CLEANUP_ON_LOCAL=1`
- ✅ **Multiple Safety Layers**: GitHub remote URL, `.git/` directory, git config checks

### How Detection Works

**VM Detection:**
- Checks for `/etc/google-cloud-env`
- Checks for `GOOGLE_CLOUD_PROJECT` environment variable
- Checks `.env` for VM/PRODUCTION indicators

**Local/GitHub Detection:**
- Checks for `${HOME}/.gitconfig`
- Checks for `${PROJECT_ROOT}/.git` directory
- Checks git remote for "github.com"
- **If ALL present → Abort for safety**

### Pre-flight Checks

Before any deletion:
- ✅ Verifies build artifacts exist (`dist/`, `.next/`)
- ✅ Checks critical runtime files are present
- ✅ Validates sufficient disk space for backup
- ✅ Creates timestamped backup

---

## Usage

### Quick Start

```bash
# 1. SSH into VM interactively (IMPORTANT: Don't use gcloud --command for timeout reasons)
gcloud compute ssh twodots-vm --zone=us-central1-a

# 2. Navigate to project
cd ~/2D1L

# 3. Test first with dry-run
./scripts/deployment/cleanup-source-code.sh --dry-run

# 4. Run actual cleanup
./scripts/deployment/cleanup-source-code.sh
```

### Options

```bash
# Dry-run (recommended first)
./scripts/deployment/cleanup-source-code.sh --dry-run

# Skip backup (NOT recommended - removes rollback capability)
./scripts/deployment/cleanup-source-code.sh --no-backup

# Verbose output
./scripts/deployment/cleanup-source-code.sh --verbose

# Help
./scripts/deployment/cleanup-source-code.sh --help
```

### Important Notes

⚠️ **Execution Method**: Always use **interactive SSH session** (not `gcloud ssh --command`) to avoid timeout issues during backup.

---

## Service Recovery

### What Happens When Services Restart?

**Good News**: Services restart **automatically** using compiled code - **NO source code needed!**

1. **PM2 uses compiled code**
   - Workers: `workers/*/dist/index.js`
   - API Gateway: `apps/api-gateway/dist/server.js`
   - Web App: `apps/web-app/.next/`

2. **PM2 ecosystem config preserved**
   - `scripts/deployment/ecosystem.prod.config.js` defines all services
   - References compiled `dist/` files, not source

3. **Environment variables preserved**
   - `.env` file intact
   - Required for services to start

### Manual Recovery Operations

**All trigger scripts are preserved** for manual operations:

```bash
# Trigger ingestion worker
node scripts/trigger-ingestion.js "conversation-id"

# Trigger insight worker (basic)
node scripts/GUIDES/trigger-insight.js

# Trigger insight worker (enhanced with monitoring)
node scripts/GUIDES/trigger-insight-enhanced.js --monitor

# Trigger graph projection
node scripts/trigger-graph-projection.js "entity-id"

# Trigger ontology optimization
node scripts/trigger-ontology-worker.js
```

### Service Disruption Scenarios

#### Scenario 1: PM2 Process Crash
- PM2 automatically restarts using `dist/index.js`
- No manual intervention needed

#### Scenario 2: VM Reboot
```bash
# Restart services after reboot
cd ~/2D1L
source .env
pm2 start scripts/deployment/ecosystem.prod.config.js
pm2 save
```

#### Scenario 3: Worker Job Failure
```bash
# Re-trigger failed job
node scripts/trigger-ingestion.js "failed-conversation-id"
```

#### Scenario 4: Complete Service Failure
```bash
# Check status
pm2 status
docker ps

# Restart all services
cd ~/2D1L
source .env
pm2 delete all
pm2 start scripts/deployment/ecosystem.prod.config.js

# Verify
pm2 status
curl http://localhost:3001/api/v1/health
```

### Recovery Scripts Inventory

**Root-Level Scripts:**
- `scripts/trigger-ingestion.js`
- `scripts/trigger-graph-projection.js`
- `scripts/trigger-ontology-worker.js`
- `scripts/trigger-notification.js`
- `scripts/trigger-projection.js`
- `scripts/force-umap-learning.js`
- `scripts/simple-trigger-ontology.js`

**GUIDES Scripts:**
- `scripts/GUIDES/trigger-insight.js`
- `scripts/GUIDES/trigger-insight-enhanced.js`
- `scripts/GUIDES/trigger-graph-projection.js`
- `scripts/GUIDES/trigger-maintenance.js`

**Deployment Scripts:**
- `scripts/deployment/ecosystem.prod.config.js`
- `scripts/deployment/start-web-app.sh`
- `scripts/deployment/cleanup-source-code.sh`

---

## Backup Management

### Backup Creation

The script automatically creates a timestamped backup:
- **Location**: `.backup-before-cleanup-YYYYMMDD-HHMMSS/`
- **Contains**: All removed directories (packages, services, workers, apps, config, .git, etc.)
- **Size**: ~7.5MB

### ⚠️ Security Risk: Remove Backup After Verification

**CRITICAL**: The backup contains **ALL source code** that was removed for security. Keeping it **defeats the security purpose**.

### Backup Removal Procedure

**After verifying services work (24-48 hours):**

```bash
# 1. Verify services are healthy
pm2 status  # Should show 13/13 online
curl http://localhost:3001/api/v1/health  # Should return {"success":true}
curl https://2d1l.com/api/v1/health  # Production should be healthy

# 2. Verify runtime files exist
ls apps/api-gateway/dist/server.js
ls workers/*/dist/index.js

# 3. Remove backup
rm -rf .backup-before-cleanup-*

# 4. Verify removal
ls -d .backup-before-cleanup-* 2>/dev/null || echo "✅ Backup removed"

# 5. Final verification - services still work
pm2 status | grep -c online  # Should show 13
curl http://localhost:3001/api/v1/health  # Should still work
```

### Rollback Strategy

If you need to restore source code:

**Option 1: Pull from GitHub** (Recommended)
```bash
cd ~/2D1L
git fetch origin
git pull origin mobile-dev-new
pnpm install
pnpm build
```

**Option 2: Restore from Backup** (Only if backup still exists)
```bash
cp -r .backup-before-cleanup-*/packages/* packages/
cp -r .backup-before-cleanup-*/services/* services/
# ... etc
```

**Option 3: Rebuild from Scratch**
```bash
git fetch origin
git pull origin mobile-dev-new
pnpm install
pnpm build
```

---

## Troubleshooting

### Issue: Script Stops During Backup

**Symptom**: Script stops after "Backing up packages..." message

**Cause**: SSH command timeout (when using `gcloud ssh --command`)

**Solution**: Use interactive SSH session instead
```bash
# Instead of:
gcloud compute ssh twodots-vm --zone=us-central1-a --command="./script.sh"

# Use:
gcloud compute ssh twodots-vm --zone=us-central1-a
# Then run script interactively
./scripts/deployment/cleanup-source-code.sh
```

### Issue: Script Aborts with "SAFETY CHECK FAILED"

**Symptom**: Script exits with local/GitHub repository detection

**Cause**: Script detected you're running on local machine or GitHub repo

**Solution**: This is **CORRECT BEHAVIOR** - script protects your source code
- If you really need to run on local (NOT recommended): `FORCE_CLEANUP_ON_LOCAL=1 ./script.sh`
- Script should ONLY run on production VM

### Issue: Services Fail After Cleanup

**Symptom**: PM2 services show "errored" status

**Possible Causes:**
1. Missing runtime files
2. Environment variables not loaded
3. Build artifacts corrupted

**Solution:**
```bash
# 1. Check if runtime files exist
ls apps/api-gateway/dist/server.js
ls workers/*/dist/index.js

# 2. Restart with environment
cd ~/2D1L
source .env
pm2 delete all
pm2 start scripts/deployment/ecosystem.prod.config.js

# 3. Check logs
pm2 logs --lines 50

# 4. If runtime files missing, restore from backup or rebuild
```

### Issue: Trigger Scripts Don't Work

**Symptom**: `node scripts/trigger-*.js` fails

**Possible Causes:**
1. Scripts were accidentally removed
2. Node modules missing

**Solution:**
```bash
# 1. Check if scripts exist
ls scripts/trigger-*.js
ls scripts/GUIDES/trigger-*.js

# 2. If missing, pull from GitHub
git fetch origin
git pull origin mobile-dev-new

# 3. Verify node_modules
ls node_modules | head -5
```

### Issue: Disk Space Low After Cleanup

**Symptom**: Low disk space warnings

**Solution:**
```bash
# 1. Remove backup (if services verified)
rm -rf .backup-before-cleanup-*

# 2. Clean old logs manually
find logs -type f -mtime +7 -delete

# 3. Clean Docker (if needed)
docker system prune -a --volumes
```

---

## Best Practices

### Before Cleanup

1. ✅ **Verify build completed**: `pnpm build`
2. ✅ **Test with dry-run**: `./cleanup-source-code.sh --dry-run`
3. ✅ **Use interactive SSH**: Avoid timeout issues
4. ✅ **Check disk space**: Ensure at least 1GB free for backup

### During Cleanup

1. ✅ **Monitor progress**: Watch for any error messages
2. ✅ **Keep SSH session open**: Don't close during execution
3. ✅ **Let backup complete**: Don't interrupt backup process

### After Cleanup

1. ✅ **Verify services**: Check PM2 status and health endpoints
2. ✅ **Test trigger scripts**: Verify manual operations work
3. ✅ **Wait 24-48 hours**: Ensure services are stable
4. ✅ **Remove backup**: Complete security hardening
5. ✅ **Document any issues**: Update this guide if needed

### Execution Recommendations

**✅ DO:**
- Use interactive SSH session
- Run dry-run first
- Monitor script execution
- Verify services after cleanup
- Remove backup after verification

**❌ DON'T:**
- Run via `gcloud ssh --command` (timeout risk)
- Skip dry-run on first execution
- Interrupt during backup
- Keep backup longer than 48 hours
- Run on local machine (script will abort)

---

## Quick Reference

### Essential Commands

```bash
# Test cleanup
./scripts/deployment/cleanup-source-code.sh --dry-run

# Run cleanup
./scripts/deployment/cleanup-source-code.sh

# Check services
pm2 status
curl http://localhost:3001/api/v1/health

# Trigger manual operations
node scripts/trigger-ingestion.js "conversation-id"
node scripts/GUIDES/trigger-insight-enhanced.js --status

# Remove backup (after verification)
rm -rf .backup-before-cleanup-*
```

### Verification Checklist

After cleanup, verify:
- [ ] All 13 PM2 services online
- [ ] API health check returns `{"success":true}`
- [ ] Production site (2d1l.com) healthy
- [ ] Runtime files exist (`dist/`, `.next/`)
- [ ] Trigger scripts work
- [ ] Backup removed (after 24-48 hours)

---

## Summary

**What This Script Does:**
- ✅ Removes source code for security
- ✅ Preserves all runtime artifacts
- ✅ Preserves recovery scripts
- ✅ Creates backup for rollback

**Safety:**
- ✅ Cannot affect GitHub repository
- ✅ Aborts on local machine
- ✅ Multiple safety checks
- ✅ Pre-flight verification

**Recovery:**
- ✅ Services restart automatically (no source needed)
- ✅ Trigger scripts available for manual operations
- ✅ Backup can restore if needed
- ✅ GitHub can restore source code

**Result:**
- ✅ VM contains only runtime artifacts
- ✅ Security attack surface reduced
- ✅ Production app unaffected
- ✅ All recovery tools available

---

**For questions or issues, refer to this guide or check the script logs: `logs/source-cleanup-*.log`**

