import * as THREE from 'three';

export interface ClusterViewInput {
  nodes: Array<{ x: number; y: number; z: number }>; // positions already scaled for scene
  customTargetDistance?: number;
  isMobile?: boolean;
}

export interface ClusterViewResult {
  center: { x: number; y: number; z: number };
  bounds: { width: number; height: number; depth: number };
  optimalDistance: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[index];
}

/**
 * Compute consistent camera view (center and optimal distance) for a set of nodes.
 * Uses 5th/95th percentile bounds to avoid outliers. Applies mobile tweaks when requested.
 * 
 * For single entities: center is the entity position, bounds are 0, optimalDistance uses customTargetDistance or default 80.
 * For multiple entities: center is average position, bounds exclude outliers, optimalDistance scales with cluster size.
 */
export function computeClusterView(input: ClusterViewInput): ClusterViewResult {
  const { nodes, customTargetDistance, isMobile } = input;

  if (!nodes || nodes.length === 0) {
    return {
      center: { x: 0, y: 0, z: 0 },
      bounds: { width: 0, height: 0, depth: 0 },
      optimalDistance: customTargetDistance || 80
    };
  }

  const sum = nodes.reduce(
    (acc, n) => ({ x: acc.x + n.x, y: acc.y + n.y, z: acc.z + n.z }),
    { x: 0, y: 0, z: 0 }
  );
  const center = {
    x: sum.x / nodes.length,
    y: sum.y / nodes.length,
    z: sum.z / nodes.length
  };

  const xCoords = nodes.map(n => n.x).sort((a, b) => a - b);
  const yCoords = nodes.map(n => n.y).sort((a, b) => a - b);
  const zCoords = nodes.map(n => n.z).sort((a, b) => a - b);

  const bounds = {
    width: percentile(xCoords, 95) - percentile(xCoords, 5),
    height: percentile(yCoords, 95) - percentile(yCoords, 5),
    depth: percentile(zCoords, 95) - percentile(zCoords, 5)
  };

  const maxDimension = Math.max(bounds.width, bounds.height, bounds.depth);
  let optimalDistance = customTargetDistance || 80;

  // Mobile adjustments: ensure visibility given aspect; still clamp to desktop multiplier as baseline
  if (isMobile && typeof window !== 'undefined') {
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    const mobileMultiplier = screenAspectRatio < 0.6 ? 0.4 : 0.6;
    optimalDistance = Math.max(optimalDistance, maxDimension * mobileMultiplier);
    if (nodes.length <= 5) {
      optimalDistance = Math.max(optimalDistance, 30);
    }
  }

  // Unified baseline multiplier for depth perception
  const desktopMultiplier = 1.8;
  optimalDistance = Math.max(optimalDistance, maxDimension * desktopMultiplier);

  return { center, bounds, optimalDistance };
}


