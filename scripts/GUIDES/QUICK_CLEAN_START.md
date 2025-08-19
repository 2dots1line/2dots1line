Manual cleansing:
# Use faster, quieter removal approach
rm -rf node_modules pnpm-lock.yaml 2>/dev/null || true

# Remove other artifacts silently
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true  
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Force remove any remaining nested node_modules (background)
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null &

echo "   2c. Pruning pnpm store..."
pnpm store prune


# Install dependencies
pnpm install
```

### 3. Verify Installation
```bash
# Check for successful installation
pnpm ls --depth=0 | head -10
```
### 2. Start Database Services
```bash
# Start all database services using development compose
docker-compose -f docker-compose.dev.yml up -d

# Verify services are starting
docker-compose -f docker-compose.dev.yml ps

echo "=== 2D1L Port Status Check ==="
ports=(3000 3001 5555 5433 6379 7475 7688 8080)
for port in "${ports[@]}"; do
  echo "Port $port:"
  lsof -i :$port 2>/dev/null | head -3
  echo "---"
done

#### Generate Prisma Client
```bash
cd packages/database
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
pnpm prisma generate
cd ../..
```

#### Apply Database Schema
```bash
cd packages/database
pnpm prisma db push
cd ../..
```

pnpm build

### 2. V11.0 Service Startup

#### Start All Services (Recommended)
```bash
# Start databases (if not already running)
pnpm start:db

# Start all Node.js services and workers via PM2

pm2 start ecosystem.config.js

# Start frontend development server
cd apps/web-app && pnpm dev &
cd ../..

# Start Prisma Studio
npx prisma studio --schema=./packages/database/prisma/schema.prisma
```

#### Alternative: Step-by-Step Startup
```bash
# 1. Start databases
docker-compose -f docker-compose.dev.yml up -d

# 2. Start PM2 services (API Gateway + Workers + Python services)
pm2 start ecosystem.config.js

# 3. Start frontend
cd apps/web-app
pnpm dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../../.frontend-pid
cd ../..

# 4. Start Prisma Studio
cd packages/database
pnpm prisma studio --port 5555 &
PRISMA_PID=$!
echo $PRISMA_PID > ../../.prisma-studio-pid
cd ../..
```
or
npx prisma studio --schema=./packages/database/prisma/schema.prisma

pnpm lint

# Test with curl cosmos graph projection
curl -H "Authorization: Bearer dev-token" http://localhost:3001/api/v1/graph-projection/latest



node scripts/trigger-graph-projection.js

Read file: py-services/dimension-reducer/app.py
Read file: py-services/dimension-reducer/app.py


Find the function:
```python
def _reduce_with_umap(X: np.ndarray, request: DimensionReductionRequest) -> np.ndarray:
```
and the block:
```python
reducer = umap.UMAP(
    n_components=request.target_dimensions,
    n_neighbors=n_neighbors,
    min_dist=request.min_dist or 0.1,
    random_state=request.random_state or 42,
    metric='cosine',  # Good for embeddings
    verbose=False
)
```

---

## **Recommended Parameter Changes**

- **Increase `min_dist`** for more spread (try `0.5` or `0.8`).
- **Add `spread` parameter** (try `2.0` or `3.0`).
- **Optionally, allow these to be set via the API request for easy tuning.**

---

## **Edit Example**

Replace the block with:

```python
reducer = umap.UMAP(
    n_components=request.target_dimensions,
    n_neighbors=n_neighbors,
    min_dist=request.min_dist if request.min_dist is not None else 0.8,  # default to 0.8 for more spread
    spread=3.0,  # add this line for more global separation
    random_state=request.random_state or 42,
    metric='cosine',
    verbose=False
)
```

---

## **Optional: Make `spread` Configurable via API**

Add to your `DimensionReductionRequest` model:
```python
spread: Optional[float] = Field(default=3.0, ge=0.1, le=10.0, description="Spread for UMAP")
```
And then use:
```python
spread=request.spread if request.spread is not None else 3.0,
```

---

## **After Editing**

1. **Rebuild and restart the Docker container:**
   ```bash
   docker-compose -f docker-compose.dev.yml build dimension-reducer
   docker-compose -f docker-compose.dev.yml up -d dimension-reducer
   ```

2. **Trigger a new graph projection job for `dev-user-123`.**


pm2 logs graph-projection-worker --lines 50
3. **Reload your frontend and observe the new layout.**

---

## Postgre accessibility issue resolution


I can see the issue! Prisma Studio is trying to connect to the database but can't reach it at `localhost:5433`. This is a common issue when the PostgreSQL database isn't running or the connection details are incorrect. Let me help you resolve this.

```bash
docker ps
```
Great! I can see that PostgreSQL is running on port 5433. Let me check the database connection details and verify the Prisma configuration:

Read file: packages/database/prisma/schema.prisma
```bash
echo $DATABASE_URL
```
The `DATABASE_URL` environment variable is not set! Let me check the environment configuration and set it up properly:

Read file: scripts/GUIDES/QUICK_CLEAN_START.md
Perfect! I can see the correct database URL. Let me set the environment variable and start Prisma Studio properly:

```bash
export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
```
```bash
echo $DATABASE_URL
```
Great! Now let me test the database connection and then start Prisma Studio:

```bash
cd packages/database && pnpm prisma db pull
```
The database connection is still failing. Let me check if PostgreSQL is actually accessible and verify the connection details:

```bash
docker logs postgres-2d1l --tail 20
```
I can see the issue! The PostgreSQL container is running, but there are authentication errors. Let me check the docker-compose configuration to see the correct credentials:

Read file: docker-compose.dev.yml
The docker-compose file uses environment variables. Let me check what environment variables are set:

```bash
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L && env | grep POSTGRES
```
The environment variables aren't set. Let me check if there's a `.env` file and load the environment:

```bash
ls -la | grep env
```
```bash
source .env && env | grep POSTGRES
```
Let me check the .env file directly to see the database configuration:

Read file: .env
```bash
head -20 .env
```
```bash
grep -i postgres .env
```
Perfect! Now I can see the issue. The environment variables are defined in the `.env` file, but they need to be loaded. Let me load them and test the connection:

```bash
export $(grep -v '^#' .env | xargs) && echo "POSTGRES_USER: $POSTGRES_USER" && echo "POSTGRES_DB: $POSTGRES_DB" && echo "DATABASE_URL: $DATABASE_URL"
```
The export command failed due to special characters. Let me set the variables manually:

```bash
export POSTGRES_USER=danniwang && export POSTGRES_PASSWORD="MaxJax2023@" && export POSTGRES_DB_NAME=twodots1line && export POSTGRES_DB=twodots1line && export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
```
Now let me test the database connection:

```bash
cd packages/database && pnpm prisma db pull
```
The connection is still failing. Let me test if I can connect to PostgreSQL directly using psql or telnet:

```bash
telnet localhost 5433
```
```bash
nc -zv localhost 5433
```
The port 5433 is not accessible! Even though the Docker container shows it's running, the port mapping might not be working correctly. Let me check the container status more carefully and restart it if needed:

```bash
docker ps -a | grep postgres
```
The container shows it's healthy and the port mapping looks correct (`0.0.0.0:5433->5432/tcp`). Let me try to restart the PostgreSQL container to fix any potential issues:

```bash
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L && docker restart postgres-2d1l
```
```bash
sleep 5 && docker ps | grep postgres
```
```bash
sleep 10 && docker ps | grep postgres
```
Great! Now PostgreSQL is healthy. Let me test the connection again:

```bash
nc -zv localhost 5433
```
Excellent! The port is now accessible. Let me test the Prisma connection:

```bash
cd packages/database && pnpm prisma db pull
```
Perfect! The database connection is working. Now let me generate the Prisma client and start Prisma Studio:

```bash
pnpm prisma generate
```
Excellent! Now let me start Prisma Studio:

```bash
pnpm prisma studio --port 5555
```
```bash
sleep 3 && curl -s http://localhost:5555 | head -5
```
Perfect! �� **Prisma Studio is now running successfully!**

## **✅ RESOLUTION SUMMARY**

### **�� Issues Fixed:**

1. **Environment Variables Not Set**: The `DATABASE_URL` and PostgreSQL credentials weren't loaded from the `.env` file
2. **PostgreSQL Container Issues**: The container was running but had connection problems
3. **Port Accessibility**: Port 5433 wasn't accessible due to container restart issues

### **��️ Steps Taken:**

1. **Set Environment Variables**:
   ```bash
   export POSTGRES_USER=danniwang
   export POSTGRES_PASSWORD="MaxJax2023@"
   export POSTGRES_DB_NAME=twodots1line
   export POSTGRES_DB=twodots1line
   export DATABASE_URL="postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line"
   ```

2. **Restarted PostgreSQL Container**:
   ```bash
   docker restart postgres-2d1l
   ```

3. **Verified Database Connection**:
   - ✅ Port 5433 accessible
   - ✅ Prisma can connect to database
   - ✅ Database introspection successful

4. **Generated Prisma Client**:
   ```bash
   pnpm prisma generate
   ```

5. **Started Prisma Studio**:
   ```bash
   pnpm prisma studio --port 5555
   ```

### **🌐 Access Prisma Studio:**

**Prisma Studio is now running at: http://localhost:5555**

You can now:
- ✅ Browse and edit your database tables
- ✅ View and modify data in the `cards`, `users`, `conversations`, etc. tables
- ✅ Execute queries and see results
- ✅ Manage your database schema

### **📝 For Future Reference:**

To avoid this issue in the future, you can use the environment loader script:

```bash
# Load environment variables
source scripts/AUTOMATION/environment-loader.sh

# Start Prisma Studio
cd packages/database && pnpm prisma studio --port 5555
```

The database connection is now fully functional and Prisma Studio should work without any errors! 🚀