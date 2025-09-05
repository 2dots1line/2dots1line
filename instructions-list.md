# 2D1L Project Setup & Run Bible

Complete step-by-step guide to start the entire 2D1L project from a fresh computer boot.

## Prerequisites
- Docker Desktop installed and running
- Node.js and pnpm installed
- PostgreSQL installed locally at `D:\postgre`
- PM2 installed globally (`npm install -g pm2`)

---

## Mandatory Files to Fix for Windows Compatibility

**⚠️ CRITICAL:** When pulling from Mac/Unix repositories, these files MUST be fixed for Windows compatibility before running `pnpm build`.

### ✅ **COMPLETED FIXES** (Reference List)

#### 1. **packages/ui-components/package.json** ✅ FIXED
- **Issue:** Unix commands in `copy:css` script (`find`, `while read`, `mkdir -p`, `cp`)
- **Fix Applied:** Replaced with `copyfiles` command
- **Before:** `"copy:css": "find src -name '*.css' | while read file; do mkdir -p \"dist/$(dirname \"$file\")\"; cp \"$file\" \"dist/$file\"; done"`
- **After:** `"copy:css": "copyfiles 'src/**/*.css' dist --up 1"`
- **Dependencies Added:** `copyfiles` as devDependency

#### 2. **packages/tools/package.json** ✅ FIXED
- **Issue:** Missing `@google/generative-ai` dependency
- **Fix Applied:** Added dependency
- **Added:** `"@google/generative-ai": "^0.21.0"`

#### 3. **packages/tools/src/ai/LLMChatTool.ts** ✅ FIXED
- **Issue:** TypeScript errors - `Property 'usageMetadata' does not exist on type 'EnhancedGenerateContentResponse'`
- **Fix Applied:** Used type assertions and optional chaining
- **Lines Fixed:** Multiple instances where `response.usageMetadata` was accessed
- **Solution:** Changed to `(response as any).usageMetadata?.propertyName || defaultValue`

#### 4. **packages/shared-types/package.json** ✅ FIXED
- **Issue:** `rm -rf` in clean script
- **Fix Applied:** Replaced with `rimraf`
- **Before:** `"clean": "rm -rf dist"`
- **After:** `"clean": "rimraf dist"`

#### 5. **packages/tool-registry/package.json** ✅ FIXED
- **Issue:** `rm -rf` in clean script
- **Fix Applied:** Replaced with `rimraf`
- **Before:** `"clean": "rm -rf dist"`
- **After:** `"clean": "rimraf dist"`

#### 6. **packages/database/package.json** ✅ FIXED
- **Issue:** `rm -rf` in clean script
- **Fix Applied:** Replaced with `rimraf`
- **Before:** `"clean": "rm -rf dist"`
- **After:** `"clean": "rimraf dist"`

#### 7. **apps/web-app/package.json** ✅ FIXED
- **Issue:** `rm -rf` in clean script
- **Fix Applied:** Replaced with `rimraf`
- **Before:** `"clean": "rm -rf .next dist"`
- **After:** `"clean": "rimraf .next dist"`

#### 8. **services/pexels-service/package.json** ✅ FIXED
- **Issue:** `rm -rf` in clean script
- **Fix Applied:** Replaced with `rimraf`
- **Before:** `"clean": "rm -rf dist"`
- **After:** `"clean": "rimraf dist"`

#### 9. **package.json (root)** ✅ FIXED
- **Issue:** Unix commands in `clean-install` script (`rm -rf`, `find`)
- **Fix Applied:** Replaced with `rimraf`
- **Before:** `"clean-install": "rm -rf node_modules pnpm-lock.yaml && find . -name 'node_modules' -type d -prune -exec rm -rf {} + && find . -name 'dist' -type d -not -path './node_modules/*' -exec rm -rf {} + && pnpm install"`
- **After:** `"clean-install": "rimraf node_modules pnpm-lock.yaml && rimraf '**/node_modules' && rimraf '**/dist' && pnpm install"`

### 📋 **SUMMARY**

**Total Files Fixed:** 9 files

**Fix Categories:**
- **Unix Command Replacements:** 8 files (replaced `rm -rf` with `rimraf`, Unix `find`/`cp`/`mkdir` with `copyfiles`)
- **Missing Dependencies:** 1 file (`@google/generative-ai` added to tools)
- **TypeScript Compatibility:** 1 file (usageMetadata type assertions)

**Dependencies Added:**
- `copyfiles` (dev dependency for ui-components)
- `@google/generative-ai` (dependency for tools)
- `rimraf` (implied for clean scripts)

### 🔧 **Quick Windows Build Fix Sequence**

```powershell
# 1. Set UTF-8 encoding
chcp 65001

# 2. Install missing dependencies
pnpm add -w -D copyfiles rimraf
cd packages\tools
pnpm add @google/generative-ai
cd ..\..

# 3. Install all dependencies
pnpm install

# 4. Build with increased memory if needed
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm build
```

### 🔍 **Verification Commands**

```powershell
# Verify build success
pnpm build

# Check for remaining Unix commands
findstr /r /s "rm -rf\|find.*-type\|mkdir -p" package.json

# Check for TypeScript errors
pnpm --filter=@2dots1line/tools build
```

---

## 0. Checkout Correct Branch and Setup Environment

**Step:** Switch to v11-refactoring branch and create environment file
**Directory:** `c:\Users\mrluf\Desktop\0829\2D1L0606`
```powershell
cd "c:\Users\mrluf\Desktop\0829\2D1L0606"
git checkout v11-refactoring
```

**Create .env file in root directory:**
```powershell
# Create .env file with exact configuration
@"
# =============================================================================
# 2D1L Environment Variables Configuration
# =============================================================================

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# PostgreSQL Database for Prisma
DATABASE_URL="postgresql://danniwang:password123@localhost:5432/twodots1line?schema=public"

# PostgreSQL Container Environment Variables
POSTGRES_USER=danniwang
POSTGRES_PASSWORD=password123
POSTGRES_DB=twodots1line

# Neo4j Graph Database
NEO4J_URI=bolt://localhost:7688
NEO4J_URI_HOST=bolt://localhost:7688
NEO4J_URI_DOCKER=bolt://localhost:7688
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123

# Weaviate Vector Database
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=

# Redis Cache
REDIS_URL=redis://localhost:6379

# =============================================================================
# MICROSERVICE PORTS
# =============================================================================

API_GATEWAY_PORT=3001
USER_SERVICE_PORT=3005
CARD_SERVICE_PORT=3002
CONFIG_SERVICE_PORT=3003
DIALOGUE_SERVICE_PORT=3004

# =============================================================================
# EXTERNAL APIS
# =============================================================================

MODEL_REGION=global

LLM_CHAT_MODEL=gemini-2.5-flash
LLM_VISION_MODEL=gemini-2.5-flash
LLM_EMBEDDING_MODEL=text-embedding-004
LLM_FALLBACK_MODEL=gemini-2.0-flash-exp

# Google Cloud Services
# DO NOT PUT REAL KEYS IN REPO. Set this in a local .env file only.
GOOGLE_API_KEY=<SET_IN_.ENV_OR_SYSTEM_ENV>
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-credentials.json
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id

# Pexels API
# DO NOT PUT REAL KEYS IN REPO. Set this in a local .env file only.
PEXELS_API_KEY=<SET_IN_.ENV_OR_SYSTEM_ENV>

# For China Region: deepseek-ai/DeepSeek-R1-0528-Qwen3-8B
# DO NOT PUT REAL KEYS IN REPO. Set this in a local .env file only.
DEEPSEEK_API_KEY=<SET_IN_.ENV_OR_SYSTEM_ENV>

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here

# =============================================================================
# DEPLOYMENT ENVIRONMENT
# =============================================================================

NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

---

## 1. Start Local PostgreSQL Database

**Step:** Boot Local PostgreSQL Server
**Directory:** `D:\postgre\bin`
```powershell
cd "D:\postgre\bin"
& "D:\postgre\bin\postgres.exe" -D "D:\postgre\data" -p 5432
```

**Verify PostgreSQL is running:**
```powershell
# From: D:\postgre\bin
cd "D:\postgre\bin"
.\pg_ctl.exe -D "D:\postgre\data" status
```

---

## 2. Start Prisma Studio

**Step:** Launch Database Management Interface
**Directory:** `c:\Users\mrluf\Desktop\0829\2D1L0606`
```powershell
$env:DATABASE_URL="postgresql://danniwang:password123@localhost:5432/twodots1line?schema=public"; cd packages\database; pnpm db:studio
```
*Access at: http://localhost:5555*

**Note:** This command sets the DATABASE_URL environment variable and navigates to the correct directory before starting Prisma Studio to ensure proper database connectivity.

---

## 3. Start Docker Services

**Step:** Start Neo4j, Weaviate, Redis, and Dimension Reducer
**Directory:** `c:\Users\mrluf\Desktop\0823\2D1L0606`

**Option A: If Docker Desktop does NOT auto-start containers:**
```powershell
cd "c:\Users\mrluf\Desktop\0823\2D1L0606"
docker-compose up -d neo4j weaviate redis dimension-reducer
```

**Option B: If Docker Desktop auto-starts containers, verify they're running:**
```powershell
cd "c:\Users\mrluf\Desktop\0823\2D1L0606"
docker ps
```

**Expected containers:**
- `redis-2d1l` (port 6379)
- `weaviate-2d1l` (port 8080)
- `neo4j-2d1l` (ports 7474, 7687)
- `dimension-reducer-2d1l` (port 8000)

**Additional verification commands:**
```powershell
# Check detailed status
docker-compose ps

# If containers are not running, start them
docker-compose up -d neo4j weaviate redis dimension-reducer
```
**Verify Docker services:**
```powershell
# From: c:\Users\mrluf\Desktop\0823\2D1L0606
docker ps
```

---

## 4. Install Dependencies (Optional)

**Step:** Install All Project Dependencies
**Directory:** `c:\Users\mrluf\Desktop\0823\2D1L0606`

**⚠️ Only required when:**
- New dependencies added to `package.json` files
- `pnpm-lock.yaml` has changed
- Fresh clone/checkout of repository
- Node modules deleted or corrupted

```powershell
cd "c:\Users\mrluf\Desktop\0823\2D1L0606"
pnpm install
```

---

## 5. Generate Prisma Client (Optional)

**Step:** Generate Prisma Client for Database Access
**Directory:** `c:\Users\mrluf\Desktop\0823\2D1L0606`

**⚠️ Only required when:**
- Prisma schema files (`schema.prisma`) have changed
- Database models/fields added/modified/removed
- Prisma version updated
- Fresh clone/checkout of repository
- `node_modules/@prisma/client` missing

```powershell
cd "c:\Users\mrluf\Desktop\0823\2D1L0606"
pnpm prisma generate --schema "c:\Users\mrluf\Desktop\0823\2D1L0606\packages\database\prisma\schema.prisma"
```
command to reset the database (prefered if to start cleanly)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606"
pnpm prisma migrate reset --schema=packages/database/prisma/schema.prisma
pnpm prisma db push --schema=packages/database/prisma/schema.prisma
or to force recreate db
pnpm prisma db push --force-reset --schema=packages/database/prisma/schema.prisma
---

## 6. Run Database Migrations (Optional)

**Step:** Apply Database Schema Migrations
**Directory:** `c:\Users\mrluf\Desktop\0823\2D1L0606`

**⚠️ Only required when:**
- New migration files created (`prisma/migrations/` folder)
- Database schema changes need to be applied
- Fresh database setup
- Database reset/recreated
- Migration rollback/forward needed

```powershell
cd "c:\Users\mrluf\Desktop\0823\2D1L0606"
pnpm prisma migrate deploy --schema "c:\Users\mrluf\Desktop\0823\2D1L0606\packages\database\prisma\schema.prisma"
```

## 6B. CREATE THE TEST USER (for existing dev user token)

& "D:\postgre\bin\psql.exe" -U danniwang -d twodots1line -c "INSERT INTO users (user_id, email, name, region, timezone, language_preference, account_status, created_at, last_active_at, preferences) VALUES ('dev-user-123', 'dev@example.com', 'Developer User', 'us', 'UTC', 'en', 'active', NOW(), NOW(), '{}');"

''' Verification
& "D:\postgre\bin\psql.exe" -U danniwang -d twodots1line -c "SELECT user_id, email, name, account_status FROM users WHERE user_id = 'dev-user-123';"

when prompted for password: password123

---

## 7. Start PM2 Processes (Including API Gateway)

**Step:** Launch All Background Workers, Services, and API Gateway
**Directory:** `c:\Users\mrluf\Desktop\0823\2D1L0606`
```powershell
cd "c:\Users\mrluf\Desktop\0823\2D1L0606"
pm2 start ecosystem.config.js
```

**Verify PM2 processes:**
```powershell
# From: c:\Users\mrluf\Desktop\0823\2D1L0606
pm2 status
pm2 logs
```

**View logs for specific processes:**
```powershell
# API Gateway logs
pm2 logs api-gateway --lines 20

# Worker logs
pm2 logs ingestion-worker --lines 20
pm2 logs insight-worker --lines 20
pm2 logs card-worker --lines 20
pm2 logs embedding-worker --lines 20
pm2 logs graph-projection-worker --lines 20
pm2 logs conversation-timeout-worker --lines 20
pm2 logs maintenance-worker --lines 20
pm2 logs notification-worker --lines 20

# View all logs with timestamps
pm2 logs --timestamp

# Monitor specific process in real-time (use -f instead of --follow)
pm2 logs api-gateway -f

# Monitor all processes in real-time
pm2 logs -f
```

---

## 8. Start Web Application

**Step:** Launch Frontend Web Application
**Directory:** `c:\Users\mrluf\Desktop\0823\2D1L0606\apps\web-app`
```powershell
cd "c:\Users\mrluf\Desktop\0823\2D1L0606\apps\web-app"
pnpm dev
```
*Access at: http://localhost:3000*

---

## 9. Verify All Services

**Step:** Check All Services Are Running

**Database Services:**
```powershell
# Check PostgreSQL (from any directory)
psql -h localhost -p 5432 -U danniwang -d twodots1line -c "SELECT version();"

# Check Neo4j (from any directory)
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) RETURN count(n);"

# Check Weaviate (from any directory)
curl http://localhost:8080/v1/meta

# Check Redis (from any directory)
docker exec redis-2d1l redis-cli ping
```

**Application Services:**
```powershell
# Check API Gateway (from any directory)
curl http://localhost:3001/health

# Check Web App (from any directory)
curl http://localhost:3000
```

---

## Quick Commands Reference

### Database Management
```powershell
# Start PostgreSQL
cd "D:\postgre\bin" ; & "D:\postgre\bin\postgres.exe" -D "D:\postgre\data" -p 5432

# Stop PostgreSQL
cd "D:\postgre\bin" ; .\pg_ctl.exe -D "D:\postgre\data" stop

# Restart PostgreSQL
cd "D:\postgre\bin" ; .\pg_ctl.exe -D "D:\postgre\data" restart

# Connect to PostgreSQL (from any directory)
psql -h localhost -p 5432 -U danniwang -d twodots1line
```

### Docker Management
```powershell
# Start all Docker services (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; docker-compose up -d

# Stop all Docker services (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; docker-compose down

# View Docker logs (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; docker-compose logs -f

# Restart specific service (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; docker-compose restart neo4j
```

### PM2 Management
```powershell
# Start all processes (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; pm2 start ecosystem.config.js

# Stop all processes (from any directory)
pm2 stop all

# Restart all processes (from any directory)
pm2 restart all

# View logs (from any directory)
pm2 logs

# Monitor processes (from any directory)
pm2 monit
```

### Development Commands
```powershell
# Build all packages (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; pnpm build

# Run tests (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; pnpm test

# Lint code (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; pnpm lint

# Format code (from project root)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; pnpm format
```

---

## Troubleshooting

### PostgreSQL Issues
- **Port 5432 in use:** Check if another PostgreSQL instance is running
- **Permission denied:** Run PowerShell as Administrator
- **Data directory not found:** Verify `D:\postgre\data` exists

### Docker Issues
- **Port conflicts:** Check `docker ps` and stop conflicting containers
- **Memory issues:** Increase Docker Desktop memory allocation
- **Network issues:** Run `docker network prune`

### PM2 Issues
- **Processes not starting:** Check `pm2 logs` for errors
- **Port conflicts:** Verify ports in ecosystem.config.js are available
- **Memory issues:** Run `pm2 reload all`

### Application Issues
- **Dependencies:** Run `pnpm install` again from project root
- **Build errors:** Run `pnpm clean` then `pnpm build` from project root
- **Environment variables:** Verify `.env` file exists and is correct in project root

---

## Environment Configuration

**Important:** The root-level `.env` file at `c:\Users\mrluf\Desktop\0823\2D1L0606\.env` is the single source of truth for all environment variables.

**Key Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (local)
- `NEO4J_URI`: Neo4j connection (Docker)
- `WEAVIATE_URL`: Weaviate connection (Docker)
- `REDIS_URL`: Redis connection (Docker)
- `API_GATEWAY_PORT`: Main API port (3001)

---

## Daily Startup Sequence (Quick)

```powershell
# 1. Start PostgreSQL
cd "D:\postgre\bin" ; & "D:\postgre\bin\postgres.exe" -D "D:\postgre\data" -p 5432

# 2. Start Docker services
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; docker-compose up -d

# 3. Start PM2 processes (includes API Gateway)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606" ; pm2 start ecosystem.config.js

# 4. Start Web App (new terminal)
cd "c:\Users\mrluf\Desktop\0823\2D1L0606\apps\web-app" ; pnpm dev
```

**Total startup time:** ~2-3 minutes

**Access Points:**
- Web App: http://localhost:3000
- API Gateway: http://localhost:3001 (via PM2)
- Prisma Studio: http://localhost:5555
- Neo4j Browser: http://localhost:7474
- Weaviate: http://localhost:8080