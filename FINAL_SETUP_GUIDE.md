# Final Setup Guide - 2dots1line notification-worker Branch

## Overview
This guide provides the complete step-by-step process for setting up the 2dots1line project from the notification-worker branch on Windows systems. This guide is based on actual implementation and testing performed on January 2025.

## Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- Git
- Windows 10/11 with PowerShell

## Step-by-Step Setup Process

### 1. Clone the notification-worker Branch
```powershell
# Navigate to parent directory
cd C:\Users\mrluf\Desktop

# Clone only the notification-worker branch
git clone -b notification-worker --single-branch https://github.com/2dots1line/2dots1line.git notification

# Navigate to project directory
cd notification
```

### 2. Verify Branch Tracking
```powershell
# Check current branch and tracking
git branch -vv

# Set up proper branch tracking if needed
git branch --set-upstream-to=origin/notification-worker notification-worker
```

### 3. Install Dependencies
```powershell
pnpm install
```

### 4. Fix Windows Compatibility Issues

#### 4.1 Fix core-utils Package
Edit `packages\core-utils\package.json` and update the clean scripts:

```json
{
  "scripts": {
    "build": "pnpm clean && tsc -p tsconfig.build.json",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "jest",
    "clean": "rimraf dist tsconfig.build.tsbuildinfo",
    "clean:all": "rimraf dist node_modules tsconfig.build.tsbuildinfo"
  }
}
```

#### 4.2 Fix ui-components Package
Edit `packages\ui-components\package.json`:

1. Add copyfiles to devDependencies:
```json
{
  "devDependencies": {
    "@storybook/builder-vite": "^9.0.14",
    "@storybook/react": "^8.6.14",
    "@storybook/react-vite": "^8.6.14",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.2.0",
    "@types/three": "^0.164.1",
    "copyfiles": "^2.4.1",
    "react": "^18.3.1",
    "typescript": "^5.8.3"
  }
}
```

2. Update the copy:css script:
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json && npm run copy:css",
    "copy:css": "copyfiles 'src/**/*.css' dist --up 1",
    "dev": "tsc --watch",
    "lint": "eslint src --max-warnings 0",
    "test": "jest"
  }
}
```

#### 4.3 Fix tools Package
Edit `packages\tools\package.json` and add the missing dependency:

```json
{
  "dependencies": {
    "@2dots1line/config-service": "workspace:*",
    "@2dots1line/database": "workspace:*",
    "@2dots1line/shared-types": "workspace:*",
    "@google/generative-ai": "^0.21.0",
    "mammoth": "^1.9.1",
    "neo4j-driver": "^5.15.0",
    "pdf-parse": "^1.1.1",
    "weaviate-ts-client": "^2.0.0",
    "zod": "^3.22.4"
  }
}
```

### 5. Install Updated Dependencies
```powershell
pnpm install
```

### 6. **CRITICAL STEP: Manual CSS Copy (Required Before Build)**
```powershell
# Navigate to ui-components package
cd packages\ui-components

# Manually copy CSS files to dist directory
npx copyfiles "src/**/*.css" dist --up 1

# Return to project root
cd ..\..
```

**Note**: This step is mandatory and must be performed before running the build. The automated copyfiles in package.json scripts does not work reliably on Windows.

### 7. Build All Packages
```powershell
pnpm build
```

**Expected Result**: All 26 tasks should complete successfully.

### 8. Verification
```powershell
# Verify CSS files were copied correctly
dir packages\ui-components\dist\components\cards\*.css

# Check build artifacts
pnpm list --depth=0
```

## Troubleshooting

### Build Fails with CSS Module Errors
- **Cause**: CSS files not copied to dist directory
- **Solution**: Repeat step 6 (Manual CSS Copy)

### "Cannot find module '@google/generative-ai'" Error
- **Cause**: Missing dependency in tools package
- **Solution**: Verify step 4.3 was completed and run `pnpm install`

### TypeScript Compilation Errors
- **Cause**: Outdated dependencies or missing Prisma client
- **Solution**: Run `pnpm install` and ensure all package.json fixes are applied

## Key Differences from Original Windows Install Guide

1. **Manual CSS Copy is Mandatory**: The copyfiles command in package.json scripts doesn't work reliably, so manual copying is required before every build.

2. **Specific Branch Setup**: This guide is tailored for the notification-worker branch with proper git tracking.

3. **Verified Package Versions**: All dependency versions have been tested and confirmed working.

## Quick Setup Script

For future setups, you can use this PowerShell script after applying the package.json fixes:

```powershell
# Quick setup after git clone and package.json fixes
pnpm install
cd packages\ui-components
npx copyfiles "src/**/*.css" dist --up 1
cd ..\..
pnpm build
```

## Success Criteria

- ✅ Git tracking set to notification-worker branch
- ✅ All dependencies installed without errors
- ✅ CSS files present in `packages/ui-components/dist/components/cards/`
- ✅ `pnpm build` completes with 26/26 tasks successful
- ✅ No TypeScript compilation errors
- ✅ All package.json scripts use Windows-compatible commands

---

**Last Updated**: January 2025
**Tested On**: Windows 10/11 with PowerShell
**Branch**: notification-worker
**Build Status**: ✅ 26/26 tasks successful