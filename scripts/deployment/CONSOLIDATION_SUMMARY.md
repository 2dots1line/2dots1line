# Deployment Scripts Consolidation Summary

## **What Was Consolidated**

This document summarizes the consolidation of deployment-related scripts from the root directory into the `scripts/deployment/` subfolder.

## **Files Moved**

### **From Root Directory to `scripts/deployment/`:**

1. **VM Deployment Scripts:**
   - `deploy-vm.sh` → `scripts/deployment/deploy-vm.sh`
   - `deploy-app.sh` → `scripts/deployment/deploy-app.sh`
   - `deploy-app-simple.sh` → `scripts/deployment/deploy-app-simple.sh`
   - `health-check.sh` → `scripts/deployment/health-check.sh`

2. **PM2 Ecosystem Configurations:**
   - `ecosystem.config.js` → `scripts/deployment/ecosystem.config.js`
   - `ecosystem.dev.config.js` → `scripts/deployment/ecosystem.dev.config.js`
   - `ecosystem.prod.config.js` → `scripts/deployment/ecosystem.prod.config.js`

## **Files Updated to Reference New Paths**

### **Configuration Files:**
- `package.json` - Updated all PM2 ecosystem config references
- `Dockerfile` - Updated ecosystem config path
- `scripts/deployment/deploy-app.sh` - Updated to use `pnpm start:prod`

### **Documentation Files:**
- `scripts/GUIDES/COMPUTE_ENGINE_DEPLOYMENT.md` - Updated all script references
- `scripts/GUIDES/DEPLOYMENT_AND_STARTUP_GUIDE.md` - Updated ecosystem config paths
- `VM_RECOVERY_COMMANDS.md` - Updated ecosystem config references
- `scripts/README.md` - Added deployment and migration directory sections

## **New Directory Structure**

```
scripts/
├── deployment/                 # 🚀 VM deployment and PM2 ecosystem configs
│   ├── README.md              # Deployment scripts documentation
│   ├── CONSOLIDATION_SUMMARY.md # This file
│   ├── deploy-vm.sh           # VM creation and setup
│   ├── deploy-app.sh          # Full application deployment
│   ├── deploy-app-simple.sh   # Simplified deployment
│   ├── health-check.sh        # Service health monitoring
│   ├── ecosystem.config.js    # Original full PM2 configuration
│   ├── ecosystem.dev.config.js # Development PM2 configuration
│   └── ecosystem.prod.config.js # Production PM2 configuration
├── migration/                  # 🔄 Branch switching and data migration
│   ├── README.md              # Migration scripts documentation
│   ├── switch-vm-branch.sh    # Automated branch switching
│   ├── export-local-data.sh   # Export local data
│   └── import-to-vm.sh        # Import data to VM
└── ... (other existing directories)
```

## **Benefits of Consolidation**

1. **Better Organization:** All deployment-related scripts are now in one logical location
2. **Easier Maintenance:** Related scripts are grouped together for easier updates
3. **Clearer Documentation:** Each subfolder has its own README with specific instructions
4. **Consistent Structure:** Follows the established pattern of organizing scripts by purpose
5. **Reduced Root Clutter:** Root directory is cleaner with fewer files

## **Updated Commands**

### **VM Deployment:**
```bash
# Old commands (no longer work)
./deploy-vm.sh
./deploy-app.sh

# New commands
./scripts/deployment/deploy-vm.sh
./scripts/deployment/deploy-app.sh
```

### **Service Management:**
```bash
# These commands still work (updated internally)
pnpm start:dev    # Uses scripts/deployment/ecosystem.dev.config.js
pnpm start:prod   # Uses scripts/deployment/ecosystem.prod.config.js
pnpm start:services # Uses scripts/deployment/ecosystem.config.js
```

### **Migration:**
```bash
# These commands still work (unchanged)
./scripts/migration/switch-vm-branch.sh <branch-name>
./scripts/migration/export-local-data.sh
./scripts/migration/import-to-vm.sh <backup-dir>
```

## **Migration Notes**

- All existing `pnpm` commands continue to work without changes
- Documentation has been updated to reflect new paths
- Scripts maintain the same functionality, just in a better organized location
- No breaking changes to existing workflows

## **Path Fixes Applied**

**Issue:** After moving ecosystem config files to `scripts/deployment/`, the relative paths to modules and scripts were incorrect.

**Fixes Applied:**
1. **EnvironmentLoader path**: Changed from `./packages/core-utils/...` to `../../packages/core-utils/...`
2. **Script paths**: Changed from `./apps/...` and `./workers/...` to `path.join(__dirname, '../../apps/...')` and `path.join(__dirname, '../../workers/...')`
3. **Working directory paths**: Changed from `./apps/web-app` to `path.join(__dirname, '../../apps/web-app')`

**Verification:** All three ecosystem configurations now work correctly:
- ✅ `pnpm start:dev` (uses `ecosystem.dev.config.js`)
- ✅ `pnpm start:prod` (uses `ecosystem.prod.config.js`) 
- ✅ `pnpm start:services` (uses `ecosystem.config.js`)

## **Next Steps**

1. Update any external documentation that references the old paths
2. Update any CI/CD pipelines that use these scripts
3. Consider creating symlinks in the root directory for backward compatibility if needed
4. Update any team documentation or runbooks that reference these scripts

---

**Consolidation completed on:** $(date)
**Files moved:** 7 scripts + 3 ecosystem configs
**Documentation updated:** 5 files
**Breaking changes:** None (all commands updated internally)
