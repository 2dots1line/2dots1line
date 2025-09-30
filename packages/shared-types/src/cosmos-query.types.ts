/**
 * V11.0 Cosmos Query Types
 * Unified query system for interactive cosmos navigation
 */

export interface CosmosQuery {
  // Attribute-based filters (MECE Category 1)
  attributeFilters?: {
    entityTypes?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    importanceRange?: {
      min: number;
      max: number;
    };
    status?: string[];
  };

  // Spatial filters (MECE Category 2)
  spatialFilters?: {
    viewport?: {
      min: [number, number, number];
      max: [number, number, number];
    };
    radius?: {
      center: [number, number, number];
      radius: number;
    };
    center?: [number, number, number];
  };

  // Set-based filters (MECE Category 3)
  setFilters?: {
    nodeIds?: string[];
    excludeIds?: string[];
  };

  // Time travel parameters
  timeTravel?: {
    timestamp: Date;
    direction?: 'forward' | 'backward';
  };

  // Query options
  options?: {
    limit?: number;
    offset?: number;
    includeEdges?: boolean;
    sortBy?: 'importance' | 'created_at' | 'distance';
    sortOrder?: 'asc' | 'desc';
  };
}

export interface CosmosQueryResponse {
  success: boolean;
  data?: {
    nodes: CosmosQueryNode[];
    edges?: CosmosEdge[];
    metadata: {
      totalNodes: number;
      totalEdges?: number;
      queryTime: number;
      viewportBounds?: {
        min: [number, number, number];
        max: [number, number, number];
      };
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface CosmosQueryNode {
  id: string;
  entity_id: string;
  entity_type: string;
  title: string;
  content: string;
  type: string;
  status: string;
  created_at: Date;
  updated_at?: Date;
  importance_score?: number;
  // 3D coordinates
  position_x: number;
  position_y: number;
  position_z: number;
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface CosmosEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  created_at: Date;
  metadata?: Record<string, any>;
}

// Query type for SpatialQueryWorker
export type SpatialQueryType = 'viewport' | 'time-travel' | 'filtered';

export interface SpatialQueryJob {
  query: CosmosQuery;
  userId: string;
  queryType: SpatialQueryType;
  requestId?: string;
}

// Viewport calculation helpers
export interface ViewportBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface CameraState {
  position: [number, number, number];
  rotation: [number, number, number];
  fov: number;
  aspect: number;
  near: number;
  far: number;
}
