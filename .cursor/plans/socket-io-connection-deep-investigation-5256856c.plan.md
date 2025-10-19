<!-- 5256856c-2e87-4281-8195-7fb69c1bbf2f e7483dcc-8835-4ec1-bf59-9e5c9a74c903 -->
# Socket.IO Connection Investigation & Environment Variable Management

## Critical Finding: Next.js Environment Variable Handling

### Can apps/web-app/.env Be Deleted? NO

**Definitive Answer: apps/web-app/.env CANNOT be deleted.**

**Reason**: Next.js has a special requirement for client-side environment variables:

- Variables prefixed with `NEXT_PUBLIC_` must be present in `.env` file at BUILD TIME
- PM2 environment variables (from ecosystem config) are only available to Node.js server-side code
- Next.js bakes `NEXT_PUBLIC_*` variables into the client-side JavaScript bundle during build
- These variables are NOT available from `process.env` in the browser at runtime unless they were embedded during build

**Evidence from Codebase**:

1. `scripts/deployment/ecosystem.config.js:189-193` sets environment for web-app:
```javascript
env: {
  ...baseEnv,
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001',
  NODE_ENV: 'development',
}
```

2. BUT Next.js documentation states: "In order to expose a variable to the browser you have to prefix the variable with `NEXT_PUBLIC_`" and "these variables will be embedded in the JavaScript bundle at build time"

3. Current frontend code uses these variables:

                                                - `apps/web-app/src/hooks/useNotificationConnection.ts:37`: `process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL`
                                                - `apps/web-app/src/stores/UserStore.ts:41`: `process.env.NEXT_PUBLIC_API_BASE_URL`
                                                - `apps/web-app/src/services/cosmosService.ts:3`: `process.env.NEXT_PUBLIC_API_BASE_URL`

## Root Cause of Socket.IO Issue

### Critical Issue: Missing NEXT_PUBLIC_NOTIFICATION_SERVICE_URL

**Problem**: The variable is not defined in `apps/web-app/.env`, so it defaults to hardcoded `'http://localhost:3002'`

**Current State**:

- Root `.env` has: `NOTIFICATION_SERVICE_URL=http://localhost:3002` (no NEXT_PUBLIC_ prefix)
- `apps/web-app/.env` has: Only `NEXT_PUBLIC_API_BASE_URL` variables, no notification service URL
- Ecosystem config does NOT set `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` (missing from lines 189-203)

**Why This Breaks**:

1. Frontend code tries to connect to Socket.IO using undefined variable
2. Falls back to hardcoded `http://localhost:3002`
3. If Next.js doesn't have the variable at build time, it's `undefined` in browser
4. Connection may work by luck with fallback, but won't work in production or different environments

## Solution Strategy

### Option 1: Add to apps/web-app/.env (Recommended)

**Action**: Add `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` to `apps/web-app/.env`

**Pros**:

- Follows Next.js best practices
- Variables are embedded at build time
- Works consistently across all environments
- Can have environment-specific values

**Implementation**:

```bash
# apps/web-app/.env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002
```

### Option 2: Add to Ecosystem Config AND apps/web-app/.env (Most Robust)

**Action**: Add variable to both locations

**Pros**:

- Provides redundancy
- Ensures variable is available both at build time and runtime
- PM2 can override for different environments

**Implementation**:

1. Update `scripts/deployment/ecosystem.config.js:189-203`:
```javascript
env: {
  ...baseEnv,
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001',
  NEXT_PUBLIC_NOTIFICATION_SERVICE_URL: 'http://localhost:3002', // ADD THIS
  NODE_ENV: 'development',
},
env_production: {
  NODE_ENV: 'production',
  ...baseEnv,
  NEXT_PUBLIC_API_BASE_URL: 'http://34.136.210.47:3001',
  NEXT_PUBLIC_NOTIFICATION_SERVICE_URL: 'http://34.136.210.47:3002', // ADD THIS
},
```

2. Update `scripts/deployment/ecosystem.dev.config.js:169-178`:
```javascript
env: {
  ...baseEnv,
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001',
  NEXT_PUBLIC_NOTIFICATION_SERVICE_URL: 'http://localhost:3002', // ADD THIS
  NODE_ENV: 'development',
},
```

3. Add to `apps/web-app/.env`:
```bash
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002
```


### Why Both Locations?

**At Build Time (requires .env file)**:

- Next.js reads `.env` and embeds `NEXT_PUBLIC_*` variables into JavaScript bundle
- This happens during `pnpm build` or `next build`
- Cannot be overridden at runtime in browser

**At Runtime (PM2 can override)**:

- PM2 environment can override for server-side Next.js code
- Useful for different deployment environments without rebuilding
- Only affects server-side `process.env` access

## Additional Investigation Findings

### Confirmed Working

1. Notification Worker running on port 3002
2. HRT sending seed entities via Redis
3. Redis pub/sub functioning
4. Backend event flow working correctly

### Potential Additional Issues

**Issue: Store Hydration Timing**

- `useNotificationConnection` hook executes before UserStore rehydrates
- May attempt connection without user authentication data

**Fix**: Add hydration check (as outlined in original plan Step 4)

**Issue: SSR/Client Mismatch**

- NotificationRoot renders in root layout during SSR
- Socket.IO is client-only, may cause hydration warnings

**Fix**: Add SSR guard if warnings occur

## Implementation Steps

### Step 1: Add Missing Environment Variable to apps/web-app/.env

```bash
echo "NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002" >> apps/web-app/.env
```

### Step 2: Add to Ecosystem Config Files

Update both `ecosystem.config.js` and `ecosystem.dev.config.js` to include the variable in web-app env sections.

### Step 3: Rebuild Next.js

```bash
cd apps/web-app
pnpm build
```

### Step 4: Restart Services

```bash
pm2 restart web-app
```

### Step 5: Verify in Browser Console

Open DevTools and check:

- `process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` value
- Socket.IO connection logs
- Connection to notification worker

## Documentation Updates Required

Update `DEPLOYMENT_AND_STARTUP_GUIDE.md` to clarify:

1. **Section "Environment Configurations" - Add Note**:
```markdown
### Important: Next.js Environment Variables

**CRITICAL**: Environment variables for Next.js frontend must follow special rules:

1. **Client-side variables** (browser JavaScript):
                           - MUST be prefixed with `NEXT_PUBLIC_`
                           - MUST be defined in `apps/web-app/.env`
                           - Are embedded at build time, cannot be changed at runtime
                           - PM2 environment variables do NOT affect client-side code

2. **Server-side variables** (Next.js API routes):
                           - Can use any name
                           - Available from PM2 ecosystem config
                           - Can be overridden at runtime

3. **Required frontend variables**:
                           - `NEXT_PUBLIC_API_BASE_URL` - API Gateway URL
                           - `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` - Socket.IO/Notification service URL
```

2. **Section "Local Development (.env)" - Add**:
```bash
# apps/web-app/.env (REQUIRED - do not delete)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002
```

3. **Section "VM Production (.env)" - Add**:
```bash
# apps/web-app/.env (REQUIRED - do not delete)
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://34.136.210.47:3002
```

4. **Add New Section "Why Can't I Delete apps/web-app/.env?"**:
```markdown
### Why Can't I Delete apps/web-app/.env?

Unlike backend services which get environment variables from PM2's ecosystem config, Next.js has special requirements:

1. **Build-time embedding**: Variables prefixed with `NEXT_PUBLIC_` are embedded into the client-side JavaScript bundle during build
2. **Not available at runtime**: These variables cannot be changed after build without rebuilding
3. **PM2 limitation**: PM2 environment variables only affect Node.js server-side code, not browser JavaScript
4. **Source of truth**: The `.env` file in `apps/web-app/` is the source of truth for client-side environment variables

**Therefore**: `apps/web-app/.env` must exist and contain all `NEXT_PUBLIC_*` variables needed by the frontend.
```


## Summary

**Answer to User's Question**: NO, you cannot delete `apps/web-app/.env`

**Reasons**:

1. Next.js requires `NEXT_PUBLIC_*` variables in `.env` file at build time
2. PM2 ecosystem config alone is insufficient for client-side variables
3. The current Socket.IO issue is partly caused by missing `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` in this file
4. Deleting it would break all client-side environment variable access

**Required Actions**:

1. Add `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:3002` to `apps/web-app/.env`
2. Optionally add to ecosystem configs for consistency
3. Update deployment guide to explain Next.js environment variable requirements
4. Rebuild and restart web-app