# Cosmos Visibility Testing Guide

## Current Changes Made

### 1. Camera Position
- **Before**: `[0, 10, 20]` with `fov={75}`
- **After**: `[0, 0, 10]` with `fov={75}`
- **Effect**: Camera moved closer to the scene

### 2. Node Size
- **Before**: Radius 2, scale 2.5-3
- **After**: Radius 5, scale 5-6
- **Effect**: Nodes are now 2.5x larger

### 3. Node Position Scaling
- **Added**: `position * 0.3` scaling
- **Effect**: Nodes are brought closer together

### 4. Edge Visibility
- **Before**: Width 2, opacity 0.6
- **After**: Width 8, opacity 1.0
- **Effect**: Edges are 4x thicker and fully opaque

## Testing Steps

### 1. Check Browser Console
Open browser dev tools and look for:
```
🔍 Graph3D: Received graph data: {nodeCount: 67, edgeCount: 78, ...}
🔍 First node position: {x: -50, y: -10, z: -3.9, scaledX: -15, ...}
```

### 2. Visual Verification
- **Nodes**: Should be large green glowing spheres
- **Edges**: Should be thick white lines connecting nodes
- **Labels**: Should show node titles like "Introduction to Neural Networks"

### 3. Camera Controls
- **Mouse**: Click and drag to rotate
- **Scroll**: Zoom in/out
- **WASD**: Move camera manually
- **Space**: Move up

## Expected Results

After these changes, you should see:
1. **Large, visible green nodes** scattered in 3D space
2. **Thick white lines** connecting the nodes
3. **Node labels** showing actual titles
4. **Interactive controls** for camera movement

## Troubleshooting

If still not visible:
1. **Check browser console** for errors
2. **Try zooming in** with mouse scroll
3. **Use WASD keys** to move camera around
4. **Check if web app is using updated components**

## Debug Commands

```bash
# Check API data
curl -H "Authorization: Bearer dev-token" http://localhost:3001/api/v1/graph-projection/latest | jq '.data.projectionData.nodes[0:3]'

# Check if web app is running
ps aux | grep "next\|web-app"

# Rebuild components
cd packages/ui-components && pnpm build
``` 