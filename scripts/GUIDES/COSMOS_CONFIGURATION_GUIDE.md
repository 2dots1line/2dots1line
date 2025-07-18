# Cosmos 3D Visualization Configuration Guide

## Overview

This guide covers all configurable parameters for the Cosmos 3D knowledge graph visualization system. The system consists of three main components:

1. **Frontend (Next.js App)** - Data fetching and scene setup
2. **UI Components** - 3D rendering and interaction
3. **Dimension Reducer (Python)** - UMAP-based node positioning

## Table of Contents

- [Quick Start](#quick-start)
- [Frontend Configuration](#frontend-configuration)
- [UI Components Configuration](#ui-components-configuration)
- [Dimension Reducer Configuration](#dimension-reducer-configuration)
- [Manual Graph Projection](#manual-graph-projection)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Start All Services
```bash
# Start databases
docker-compose -f docker-compose.dev.yml up -d

# Start PM2 services (API Gateway + Workers)
pm2 start ecosystem.config.js

# Start frontend
cd apps/web-app && pnpm dev
```

### 2. Access Cosmos
- **URL**: `http://localhost:3000/cosmos`
- **Expected**: 67 nodes visible in 3D space with proper spacing

### 3. Manual Graph Projection
```bash
# Trigger new projection
node scripts/trigger-graph-projection.js

# Monitor worker logs
pm2 logs graph-projection-worker --lines 50
```

---

## Frontend Configuration

### File: `apps/web-app/src/app/cosmos/CosmosScene.tsx`

#### Position Scaling
Controls how far apart nodes are positioned in 3D space.

```typescript
const POSITION_SCALE = 10; // Adjust this value
```

**Recommended Values:**
- `1` - Nodes very close together (tight cluster)
- `5` - Moderate spacing
- `10` - Good balance (current)
- `25` - More spread out
- `50` - Very spread out
- `100+` - Extremely spread out

**Effect:** Higher values = more distance between nodes

#### Data Transformation
Controls how node data is processed for rendering.

```typescript
const scaledNode = {
  ...node,
  x: x * POSITION_SCALE,
  y: y * POSITION_SCALE,
  z: z * POSITION_SCALE,
  name: node.properties?.title ?? node.label ?? node.id,
  type: node.properties?.type ?? node.type,
};
```

#### Debug Logging
Enable detailed logging to understand node positioning:

```typescript
// Debug logging for first few nodes
if (node.id === graphData.nodes?.[0]?.id) {
  console.log('🔍 CosmosScene: First node data:', {
    original: { x, y, z },
    scaled: { x: scaledNode.x, y: scaledNode.y, z: scaledNode.z },
    name: scaledNode.name,
    type: scaledNode.type
  });
}
```

---

## UI Components Configuration

### File: `packages/ui-components/src/components/cosmos/Graph3D.tsx`

#### Camera Position
Controls the viewpoint of the 3D scene.

```typescript
<PerspectiveCamera 
  makeDefault 
  position={[0, 10, 20]} // [x, y, z] coordinates
  fov={75}               // Field of view (degrees)
  near={0.1}             // Near clipping plane
  far={10000}            // Far clipping plane
/>
```

**Recommended Camera Settings:**

| Scenario | Position | FOV | Description |
|----------|----------|-----|-------------|
| Close View | `[0, 5, 10]` | 90 | Very close, wide angle |
| Standard | `[0, 10, 20]` | 75 | Current setting |
| Medium Distance | `[0, 20, 40]` | 60 | Balanced view |
| Far View | `[0, 50, 100]` | 45 | Distant, narrow angle |

#### Lighting Configuration
Controls how nodes are illuminated.

```typescript
<ambientLight intensity={0.3} />
<directionalLight position={[10, 10, 5]} intensity={0.5} />
<pointLight position={[0, 0, 0]} intensity={0.2} />
```

**Lighting Parameters:**
- `ambientLight.intensity`: Overall scene brightness (0.1 - 1.0)
- `directionalLight.intensity`: Directional shadow/contrast (0.1 - 1.0)
- `pointLight.intensity`: Point source brightness (0.1 - 1.0)

### File: `packages/ui-components/src/components/cosmos/NodeMesh.tsx`

#### Node Size and Scale
Controls the visual size of nodes.

```typescript
<mesh
  scale={hovered ? 3 : 2.5}  // Base and hover scale
>
  <sphereGeometry args={[2, 16, 16]} />  // [radius, widthSegments, heightSegments]
  <meshBasicMaterial color="#00ff88" />
</mesh>
```

**Size Parameters:**
- `scale`: Overall node size multiplier
- `sphereGeometry.args[0]`: Base radius
- `sphereGeometry.args[1]`: Width segments (detail)
- `sphereGeometry.args[2]`: Height segments (detail)

**Recommended Sizes:**

| Node Count | Scale | Radius | Description |
|------------|-------|--------|-------------|
| < 50 | 3-4 | 2-3 | Large, prominent nodes |
| 50-100 | 2-3 | 1.5-2 | Medium size (current) |
| 100-500 | 1-2 | 1-1.5 | Smaller nodes |
| 500+ | 0.5-1 | 0.5-1 | Very small nodes |

#### Glow Effect
Controls the glow/aura around nodes.

```typescript
<mesh ref={glowRef} scale={4}>
  <sphereGeometry args={[2.5, 16, 16]} />
  <GlowMaterial color="#00ff66" hover={hovered} />
</mesh>
```

**Glow Parameters:**
- `scale`: Glow size multiplier
- `sphereGeometry.args[0]`: Glow radius
- `color`: Glow color (hex or CSS color)

#### Label Positioning
Controls where node labels appear.

```typescript
<NodeLabel 
  text={node.name} 
  position={new THREE.Vector3(0, 6, 0)}  // [x, y, z] offset from node
  hovered={hovered} 
/>
```

---

## Dimension Reducer Configuration

### File: `py-services/dimension-reducer/app.py`

#### UMAP Parameters
Controls how nodes are positioned in 3D space.

```python
reducer = umap.UMAP(
    n_components=request.target_dimensions,  # Usually 3 for 3D
    n_neighbors=n_neighbors,                 # Local neighborhood size
    min_dist=request.min_dist or 0.8,        # Minimum distance between points
    spread=3.0,                              # Global spread of the embedding
    random_state=request.random_state or 42, # For reproducible results
    metric='cosine',                         # Distance metric
    verbose=False
)
```

#### Key UMAP Parameters

| Parameter | Range | Default | Effect |
|-----------|-------|---------|--------|
| `min_dist` | 0.1 - 2.0 | 0.8 | Controls local clustering |
| `spread` | 1.0 - 10.0 | 3.0 | Controls global spread |
| `n_neighbors` | 5 - 100 | 15 | Controls local structure |
| `n_components` | 2 - 3 | 3 | Output dimensions |

#### Parameter Tuning Guide

**For Tighter Clustering:**
```python
min_dist=0.1,    # Very close points
spread=1.0,      # Minimal global spread
n_neighbors=10   # Smaller neighborhoods
```

**For Balanced Layout:**
```python
min_dist=0.8,    # Current setting
spread=3.0,      # Current setting
n_neighbors=15   # Current setting
```

**For Maximum Spread:**
```python
min_dist=1.5,    # Maximum separation
spread=8.0,      # Maximum global spread
n_neighbors=30   # Larger neighborhoods
```

#### Coordinate Normalization
Controls the final coordinate range.

```python
# Normalize coordinates to a specific range
normalization_factor = 50.0  # Adjust this value
coordinates = coordinates * normalization_factor
```

**Normalization Factors:**
- `10.0` - Very compact layout
- `25.0` - Compact layout
- `50.0` - Current setting
- `100.0` - Spread out layout
- `200.0` - Very spread out layout

---

## Manual Graph Projection

### Trigger New Projection

#### Method 1: Using the Script
```bash
# Navigate to project root
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L

# Run the trigger script
node scripts/trigger-graph-projection.js
```

#### Method 2: Manual Queue Job
```bash
# Using Node.js REPL
node

# In the REPL:
const { Queue } = require('bullmq');
const queue = new Queue('card-and-graph-queue', {
  connection: { host: 'localhost', port: 6379 }
});

const jobData = {
  type: "graph_ontology_updated",
  userId: "dev-user-123",
  source: "manual",
  timestamp: new Date().toISOString(),
  summary: {
    concepts_merged: 0,
    concepts_archived: 0,
    new_communities: 0,
    strategic_relationships_added: 0
  },
  affectedNodeIds: []
};

queue.add('graph-projection', jobData).then(job => {
  console.log('Job enqueued:', job.id);
  queue.close();
});
```

### Monitor Worker Progress

#### Check Worker Status
```bash
# List all PM2 processes
pm2 list

# Check graph projection worker specifically
pm2 show graph-projection-worker
```

#### View Worker Logs
```bash
# View recent logs
pm2 logs graph-projection-worker --lines 50

# Follow logs in real-time
pm2 logs graph-projection-worker --follow

# View all worker logs
pm2 logs --lines 100
```

#### Check Job Status
```bash
# Check Redis queue status
redis-cli
> LLEN bull:card-and-graph-queue:wait
> LLEN bull:card-and-graph-queue:active
> LLEN bull:card-and-graph-queue:completed
```

### Verify Projection Results

#### Check API Response
```bash
# Test the API endpoint
curl -H "Authorization: Bearer dev-token" \
  http://localhost:3001/api/v1/graph-projection/latest | jq '.data.projectionData.nodes | length'

# Get detailed node data
curl -H "Authorization: Bearer dev-token" \
  http://localhost:3001/api/v1/graph-projection/latest | jq '.data.projectionData.nodes[0:3]'
```

#### Check Database
```bash
# Connect to PostgreSQL
psql postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line

# Check projection table
SELECT projection_id, created_at, node_count, edge_count 
FROM user_graph_projections 
WHERE user_id = 'dev-user-123' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Troubleshooting

### Common Issues

#### 1. No Nodes Visible
**Symptoms:** "Nodes: 67" but no visual nodes
**Solutions:**
- Check position scaling (`POSITION_SCALE`)
- Verify camera position
- Check node size settings
- Ensure API is returning data

#### 2. Nodes Too Far Apart
**Symptoms:** Only 1-2 nodes visible, very spread out
**Solutions:**
- Reduce `POSITION_SCALE` (try 5 or 1)
- Adjust UMAP `min_dist` and `spread`
- Move camera closer

#### 3. Nodes Too Clustered
**Symptoms:** All nodes overlapping in center
**Solutions:**
- Increase `POSITION_SCALE`
- Adjust UMAP `min_dist` and `spread`
- Move camera further away

#### 4. Performance Issues
**Symptoms:** Slow rendering, lag
**Solutions:**
- Reduce node detail (sphereGeometry segments)
- Lower glow effect scale
- Reduce number of lights
- Check for Three.js version conflicts

#### 5. API Errors
**Symptoms:** 404 or authentication errors
**Solutions:**
- Verify API Gateway is running (`pm2 list`)
- Check authentication token
- Verify database connections

### Debug Commands

#### Check Service Status
```bash
# Check all services
pm2 list

# Check specific service
pm2 show api-gateway

# Check logs
pm2 logs --lines 50
```

#### Check Port Usage
```bash
# Check which ports are in use
lsof -i :3000  # Frontend
lsof -i :3001  # API Gateway
lsof -i :6379  # Redis
lsof -i :5433  # PostgreSQL
```

#### Restart Services
```bash
# Restart all services
pm2 restart all

# Restart specific service
pm2 restart api-gateway

# Restart frontend (kill and restart)
lsof -ti:3000 | xargs kill -9
cd apps/web-app && pnpm dev
```

### Performance Optimization

#### For Large Graphs (100+ nodes)
1. **Reduce Node Detail:**
   ```typescript
   <sphereGeometry args={[1, 8, 8]} />  // Lower segments
   ```

2. **Simplify Lighting:**
   ```typescript
   <ambientLight intensity={0.4} />
   // Remove directional and point lights
   ```

3. **Reduce Glow Effect:**
   ```typescript
   <mesh ref={glowRef} scale={2}>
     <sphereGeometry args={[1.5, 8, 8]} />
   </mesh>
   ```

4. **Optimize UMAP:**
   ```python
   n_neighbors=10,  # Smaller neighborhoods
   verbose=False,   # Disable verbose output
   ```

---

## Quick Reference

### Frontend Parameters
| Parameter | File | Default | Range |
|-----------|------|---------|-------|
| `POSITION_SCALE` | CosmosScene.tsx | 10 | 1-100 |
| Camera Position | Graph3D.tsx | [0,10,20] | [x,y,z] |
| Camera FOV | Graph3D.tsx | 75° | 45-90° |
| Node Scale | NodeMesh.tsx | 2.5 | 0.5-5 |
| Node Radius | NodeMesh.tsx | 2 | 0.5-5 |

### UMAP Parameters
| Parameter | File | Default | Range |
|-----------|------|---------|-------|
| `min_dist` | app.py | 0.8 | 0.1-2.0 |
| `spread` | app.py | 3.0 | 1.0-10.0 |
| `n_neighbors` | app.py | 15 | 5-100 |
| `normalization_factor` | app.py | 50.0 | 10-200 |

### Common Commands
```bash
# Trigger projection
node scripts/trigger-graph-projection.js

# Monitor logs
pm2 logs graph-projection-worker --lines 50

# Check API
curl -H "Authorization: Bearer dev-token" http://localhost:3001/api/v1/graph-projection/latest

# Restart frontend
lsof -ti:3000 | xargs kill -9 && cd apps/web-app && pnpm dev
``` 