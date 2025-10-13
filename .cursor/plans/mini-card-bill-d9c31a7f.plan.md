<!-- d9c31a7f-20ab-474f-8789-b89fd9b18c04 6bdeebf8-a43f-4ab8-ae27-e5387343e1f4 -->
# Mini Card Billboards in Cosmos View

## Overview

Add mini card tiles next to cosmos nodes that appear based on camera distance, scale dynamically, handle overlaps intelligently, and open the entity detail modal when clicked.

## Technical Architecture

### 1. New Component: MiniCardBillboard

**File**: `apps/web-app/src/components/cosmos/MiniCardBillboard.tsx`

A React-three-fiber component that:

- Renders using HTML from `@react-three/drei` for billboard effect
- Displays an 80x80px card tile (at closest distance) with background image and text
- Fetches entity details via `useEntityDetails` hook when first visible
- Calculates distance to camera each frame using `useFrame`
- Handles visibility logic:
  - Show when distance < 120 units (based on POSITION_SCALE=10)
  - Hide when distance > 120 units or node out of viewport
  - Scale from 0.3 to 1.0 based on distance (closer = larger)
- Projects to screen space for overlap detection
- Accepts `onClick` callback to trigger EntityDetailModal

**Key props:**

```typescript
interface MiniCardBillboardProps {
  node: GraphNode;
  cameraPosition: THREE.Vector3;
  onCardClick: (node: GraphNode) => void;
  allVisibleCards: CardVisibilityInfo[]; // For overlap detection
  onVisibilityChange: (nodeId: string, isVisible: boolean, screenPos: {x,y,width,height}) => void;
}
```

### 2. Overlap Detection System

**File**: `apps/web-app/src/hooks/cosmos/useMiniCardOverlap.ts`

Custom hook that:

- Tracks all visible mini cards with screen positions (x, y, width, height)
- Each frame, checks for 2D rectangle overlap using screen coordinates
- For each overlapping group, calculates which node is closest to camera in 3D
- Returns set of `hiddenCardIds` that should be hidden due to overlap
- Re-evaluates when camera moves to show previously blocked cards

**Algorithm:**

```
1. Get all visible cards with screen rectangles
2. For each card, find overlapping cards
3. If overlap exists, compare 3D distances to camera
4. Hide all except the closest card in each overlap group
5. Update hidden set reactively
```

### 3. Integration with NodeMesh

**Modify**: `apps/web-app/src/components/cosmos/NodeMesh.tsx`

- Add `<MiniCardBillboard>` as child of the node's `<group>`
- Pass node data, camera position, and click handler
- Position billboard slightly offset from node (e.g., +5 units on Y axis)

### 4. Distance Thresholds

**Suggested values** (based on POSITION_SCALE=10 and typical camera distance of 80):

- **Appear threshold**: 120 units (nodes within this range show cards)
- **Disappear threshold**: 120 units (same as appear for clean behavior)
- **Scale formula**: `scale = lerp(0.3, 1.0, (120 - distance) / 120)`
  - At 120 units: scale = 0.3 (just appearing)
  - At 0 units: scale = 1.0 (full size, 80x80px)

### 5. Card Data Fetching

**Reuse**: `apps/web-app/src/hooks/cosmos/useEntityDetails.ts`

- Fetch entity details when card first becomes visible
- Cache results to avoid redundant API calls
- Show loading state on card while fetching
- Display title, type, and background image once loaded

### 6. Modal Integration

**Reuse**: `apps/web-app/src/components/modal/EntityDetailModal.tsx`

- When mini card is clicked, call same handler as node click
- Pass node data to `setSelectedNode` in CosmosScene
- Existing modal logic handles opening and displaying details

## Implementation Files

### Create:

1. `apps/web-app/src/components/cosmos/MiniCardBillboard.tsx` - Main billboard component
2. `apps/web-app/src/hooks/cosmos/useMiniCardOverlap.ts` - Overlap detection hook
3. `apps/web-app/src/hooks/cosmos/useVisibleMiniCards.ts` - Track visible cards state

### Modify:

1. `apps/web-app/src/components/cosmos/NodeMesh.tsx` - Add MiniCardBillboard child
2. `apps/web-app/src/components/cosmos/Graph3D.tsx` - Pass camera ref to nodes
3. `apps/web-app/src/app/cosmos/CosmosScene.tsx` - Handle card click events

## Key Technical Details

**Billboard using Html from drei:**

```typescript
<Html
  position={[0, 5, 0]} // Offset above node
  center
  distanceFactor={10}
  style={{ pointerEvents: isHidden ? 'none' : 'auto' }}
>
  <div className="mini-card" onClick={handleClick}>
    {/* Card tile content */}
  </div>
</Html>
```

**Screen space projection:**

```typescript
const vector = position.clone().project(camera);
const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
```

**Overlap check:**

```typescript
function rectanglesOverlap(r1, r2) {
  return !(r1.right < r2.left || r1.left > r2.right || 
           r1.bottom < r2.top || r1.top > r2.bottom);
}
```

## Performance Considerations

- Only render MiniCardBillboard for nodes, not edges
- Use `useMemo` for expensive calculations
- Throttle overlap detection to every 3-5 frames instead of every frame
- Lazy load entity details only when visible
- Clean up fetched data properly when cards become invisible

### To-dos

- [ ] Create MiniCardBillboard.tsx component with billboard effect, distance-based visibility/scaling, and entity details fetching
- [ ] Create useMiniCardOverlap.ts hook for hybrid 2D/3D overlap detection and resolution
- [ ] Create useVisibleMiniCards.ts hook to track all visible card states and screen positions
- [ ] Modify NodeMesh.tsx to include MiniCardBillboard as child component with proper positioning
- [ ] Update Graph3D.tsx to pass camera reference and visibility state to NodeMesh components
- [ ] Update CosmosScene.tsx to handle mini card click events and trigger EntityDetailModal
- [ ] Add CSS styling for mini cards matching CardTile appearance but optimized for 80x80px size
- [ ] Test performance with many visible nodes, optimize rendering and overlap detection throttling