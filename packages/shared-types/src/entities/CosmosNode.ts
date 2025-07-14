/**
 * CosmosNode Types - 3D node representation for knowledge graph visualization
 * V11.0 - Frontend-only types for 3D cosmos experience
 */

/**
 * 3D position in space
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 2D screen position for UI overlays
 */
export interface ScreenPosition {
  x: number;
  y: number;
}

/**
 * Connection between nodes in the knowledge graph
 */
export interface NodeConnection {
  id: string;
  target_node_id: string;
  connection_type: 'related' | 'derived' | 'contextual' | 'temporal' | 'hierarchical';
  strength: number; // 0-1, visual weight of connection
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Node appearance configuration
 */
export interface NodeAppearance {
  size: number; // Base size multiplier
  color: string; // Hex color
  opacity: number; // 0-1
  glow_intensity: number; // 0-1
  animation_speed: number; // Animation speed multiplier
  texture?: string; // Optional texture URL
}

/**
 * Node in the 3D cosmos visualization
 */
export interface CosmosNode {
  /** Unique identifier for the node */
  id: string;
  
  /** Node metadata */
  title: string;
  description?: string;
  category: string;
  
  /** 3D positioning */
  position: Vector3D;
  velocity?: Vector3D; // For physics simulation
  
  /** Screen position for UI overlays */
  screen_position?: ScreenPosition;
  
  /** Visual appearance */
  appearance: NodeAppearance;
  
  /** Node connections */
  connections: NodeConnection[];
  
  /** Related data */
  source_entity_id?: string;
  source_entity_type?: string;
  card_id?: string; // If this node represents a card
  
  /** Interactive state */
  is_selected: boolean;
  is_hovered: boolean;
  is_visible: boolean;
  
  /** Animation state */
  animation_phase?: number; // 0-1, for breathing/pulsing effects
  
  /** Metadata for 3D rendering */
  metadata?: {
    creation_date?: Date;
    last_interaction?: Date;
    interaction_count?: number;
    importance_score?: number; // 0-1, affects size and brightness
    tags?: string[];
  };
}

/**
 * Node cluster for hierarchical organization
 */
export interface NodeCluster {
  id: string;
  name: string;
  center_position: Vector3D;
  radius: number;
  node_ids: string[];
  color_theme: string;
  is_expanded: boolean;
}

/**
 * 3D cosmos scene configuration
 */
export interface CosmosScene {
  /** All nodes in the scene */
  nodes: CosmosNode[];
  
  /** Node clusters */
  clusters: NodeCluster[];
  
  /** Camera configuration */
  camera: {
    position: Vector3D;
    target: Vector3D;
    fov: number;
    near: number;
    far: number;
  };
  
  /** Scene bounds */
  bounds: {
    min: Vector3D;
    max: Vector3D;
  };
  
  /** Rendering settings */
  rendering: {
    background_color: string;
    ambient_light_intensity: number;
    particle_count: number;
    connection_visibility_threshold: number;
    node_lod_distance: number; // Level of detail distance
  };
  
  /** Physics settings */
  physics?: {
    gravity: Vector3D;
    damping: number;
    repulsion_force: number;
    attraction_force: number;
  };
}

/**
 * Node interaction event
 */
export interface NodeInteractionEvent {
  type: 'hover' | 'click' | 'select' | 'deselect';
  node_id: string;
  timestamp: Date;
  screen_position: ScreenPosition;
  world_position: Vector3D;
  modifier_keys?: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
  };
}

/**
 * Cosmos navigation state
 */
export interface CosmosNavigationState {
  camera_position: Vector3D;
  camera_target: Vector3D;
  zoom_level: number;
  rotation: Vector3D;
  is_animating: boolean;
  selected_node_id?: string;
  hovered_node_id?: string;
  filter_options: {
    category?: string;
    connection_type?: string;
    importance_threshold?: number;
    show_connections: boolean;
    show_labels: boolean;
  };
}

/**
 * Search result in 3D space
 */
export interface CosmosSearchResult {
  node_id: string;
  relevance_score: number;
  highlight_color: string;
  matched_fields: string[];
}

/**
 * Cosmos layout algorithm configuration
 */
export interface LayoutConfig {
  algorithm: 'force_directed' | 'hierarchical' | 'circular' | 'grid' | 'cluster';
  parameters: {
    iterations?: number;
    cooling_factor?: number;
    optimal_distance?: number;
    separation_distance?: number;
    clustering_threshold?: number;
  };
} 