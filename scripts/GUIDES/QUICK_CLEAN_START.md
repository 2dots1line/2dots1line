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

**Would you like me to generate the exact code diff for your file, or do you want to make these changes and try them out?**