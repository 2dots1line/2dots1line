<!-- 457531a9-a23b-4301-86d3-5791496b3400 931b413a-fddf-418b-b85e-37ef00370f57 -->
# LiDAR Point Cloud Integration Plan

## Architecture Overview

This feature adds native iOS/iPad LiDAR scanning capability and point cloud visualization to the Cosmos 3D space. When users scan an object (e.g., a cat) and associate it with an entity, clicking that entity's node will render the point cloud in the 3D scene.

## Implementation Strategy

### Phase 1: Database & Backend Infrastructure

**1. Create Point Cloud Assets Table**

- New table: `point_cloud_assets` in `packages/database/prisma/schema.prisma`
- Fields: `id`, `user_id`, `entity_id`, `entity_type`, `file_url` (cloud storage), `file_path`, `metadata` (file size, point count, bounds), `created_at`, `status`
- Indexes on `user_id`, `entity_id` for fast lookups

**2. Cloud Storage Integration**

- Add Google Cloud Storage configuration to `config/` directory
- Create storage service in `packages/core-utils/src/storage/` for upload/download
- Set up signed URL generation for secure access
- Configure CORS for direct browser uploads from mobile devices

**3. API Endpoints** (in `apps/api-gateway/src/controllers/`)

- `POST /api/v1/point-clouds/upload` - Handle point cloud file uploads
- `GET /api/v1/point-clouds/:entityId` - Fetch point cloud data for entity
- `POST /api/v1/point-clouds/associate` - Link point cloud to entity
- `DELETE /api/v1/point-clouds/:id` - Remove point cloud

**4. Repository Layer**

- Create `PointCloudRepository.ts` in `packages/database/src/repositories/`
- Methods: `create()`, `findByEntityId()`, `findByUserId()`, `delete()`, `updateStatus()`

### Phase 2: iOS/iPad Native LiDAR Scanning

**5. Native Scanning Module**

- Create `apps/mobile-scanner/` directory for React Native or native iOS code
- Implement ARKit + LiDAR scanning using `ARSession` with `ARWorldTrackingConfiguration`
- Export scans as `.ply` format (standard point cloud format)
- Real-time preview during scanning with point accumulation

**6. WebView Bridge** (if using React Native)

- Create bidirectional bridge between native scanner and web app
- Events: `scan-started`, `scan-progress`, `scan-completed`, `scan-cancelled`
- Pass point cloud data from native → web via file URL or direct buffer

**7. Scanning UI Components**

- Scanner activation button in Cosmos interface
- Real-time scan preview overlay
- Scan controls: start/stop, capture, cancel
- Progress indicator (points captured, coverage %)

### Phase 3: Point Cloud Rendering in Cosmos

**8. Point Cloud Loader**

- Create `packages/canvas-core/src/loaders/PointCloudLoader.ts`
- Parse `.ply` files using Three.js `PLYLoader`
- Convert to `THREE.Points` with `PointsMaterial`
- Implement LOD (Level of Detail) for performance
- Color/size mapping from point cloud attributes

**9. Point Cloud Component** (React Three Fiber)

- Create `apps/web-app/src/components/cosmos/PointCloud.tsx`
- Props: `url`, `position`, `scale`, `visible`, `onLoad`, `onError`
- Use `useLoader` hook from R3F to load `.ply` files
- Implement fade-in animation when loaded
- Support interaction (click, hover) for metadata display

**10. Integrate with CosmosScene**

- Modify `CosmosScene.tsx` to detect entities with point cloud data
- When node clicked, check if `point_cloud_url` exists
- Render `PointCloud` component at entity's position
- Add toggle to show/hide point clouds
- Handle multiple point clouds in scene simultaneously

**11. Camera & Interaction Enhancements**

- Update `CameraController` to focus on point cloud when displayed
- Add point cloud bounding box calculation for proper framing
- Implement "inspect mode" for close-up viewing

### Phase 4: User Workflow & UI

**12. Entity Association Flow**

- After scanning, show entity selection modal
- Search/filter entities in user's cosmos
- Preview entity details before association
- Confirm and upload point cloud to cloud storage

**13. Point Cloud Management UI**

- Add point cloud indicator icon on nodes with scans
- Settings panel: toggle point cloud visibility, adjust point size
- Entity detail modal: show point cloud thumbnail, option to remove
- Point cloud library view (optional): gallery of all user scans

**14. Mobile-Specific Optimizations**

- Detect iOS/iPad devices for scanner availability
- Show/hide scanner UI based on device capabilities
- Responsive layout for mobile scanning interface
- Handle device orientation changes during scan

### Phase 5: Performance & Polish

**15. Optimization**

- Implement point cloud compression (e.g., Draco compression)
- Lazy loading: only fetch point clouds when needed
- Cache loaded point clouds in memory
- Set max point count limits (e.g., 1M points) for performance

**16. Error Handling**

- Handle failed uploads with retry logic
- Validate `.ply` file format before processing
- Display user-friendly error messages
- Fallback to node-only display if point cloud fails to load

**17. Testing**

- Test on iPhone 12 Pro+ (LiDAR capable devices)
- Test various point cloud sizes (10K - 1M points)
- Test multiple simultaneous point clouds in scene
- Test network conditions (slow/offline)

## Key Files to Modify

- `apps/web-app/src/app/cosmos/CosmosScene.tsx` - Add point cloud rendering logic
- `apps/web-app/src/components/cosmos/Graph3D.tsx` - Pass point cloud props to nodes
- `apps/web-app/src/stores/CosmosStore.ts` - Add point cloud state management
- `packages/database/prisma/schema.prisma` - Add point_cloud_assets table
- `apps/api-gateway/src/index.ts` - Register point cloud routes

## Dependencies to Add

```json
{
  "three-stdlib": "^2.28.0",  // Includes PLYLoader
  "@react-three/drei": "^9.105.6"  // Already installed, includes useLoader
}
```

For native iOS (if going React Native route):

```json
{
  "react-native": "^0.73.0",
  "react-native-webview": "^13.6.0",
  "@react-native-community/cameraroll": "^5.7.0"
}
```

## Migration Strategy

1. Add database table via Prisma migration
2. Deploy backend API endpoints
3. Implement native scanner (can be tested independently)
4. Add frontend rendering components
5. Connect all pieces and test end-to-end
6. Rollout to beta users on iOS devices first

## Future Enhancements (Out of Scope)

- Gaussian splatting upgrade path (Phase 2 optimization)
- Android LiDAR support (limited device availability)
- Point cloud editing/cropping tools
- Automatic entity detection from scans via ML
- Multi-user collaborative scanning

### To-dos

- [ ] Create point_cloud_assets table in Prisma schema with cloud storage URL fields
- [ ] Set up Google Cloud Storage bucket and access configuration
- [ ] Create storage service for file uploads/downloads with signed URLs
- [ ] Create PointCloudRepository with CRUD operations
- [ ] Implement REST API endpoints for point cloud management
- [ ] Implement iOS/iPad LiDAR scanner using ARKit
- [ ] Create native-to-web communication bridge for scan data
- [ ] Create PLY file loader utility with Three.js PLYLoader
- [ ] Build React Three Fiber PointCloud component
- [ ] Integrate point cloud rendering into CosmosScene when nodes are clicked
- [ ] Build scanning UI with controls and real-time preview
- [ ] Implement entity association flow after scanning
- [ ] Update EntityDetailModal to show point cloud info and management
- [ ] Implement performance optimizations (compression, lazy loading, caching)
- [ ] Test on LiDAR-capable devices with various point cloud sizes