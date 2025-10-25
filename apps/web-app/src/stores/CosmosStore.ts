import { UserGraphProjection } from '@2dots1line/shared-types';
import { create } from 'zustand';

export interface GraphNode {
    id: string;
    type: 'Concept' | 'MemoryUnit' | 'DerivedArtifact';
    label?: string;
    title?: string;
    content?: string;
    importance?: number;
    // Support both flat structure (x, y, z) and nested structure (position array)
    x?: number;
    y?: number;
    z?: number;
    position?: [number, number, number];
    community_id?: string;
    metadata?: Record<string, any>;
}

interface CosmosStoreState {
  graphData: UserGraphProjection;
  isLoading: boolean;
  error: string | null;
  selectedNode: GraphNode | null;
  showNodeLabels: boolean; // New state for controlling node label visibility
  showEdges: boolean; // New state for controlling edge visibility
  edgeWidth: number; // Edge width control (0.5 - 5.0)
  nodeSizeMultiplier: number; // Node size multiplier (0.5 - 3.0)
  setGraphData: (data: UserGraphProjection) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setShowNodeLabels: (show: boolean) => void; // New action for toggling node labels
  setShowEdges: (show: boolean) => void; // New action for toggling edges
  setEdgeWidth: (width: number) => void; // New action for setting edge width
  setNodeSizeMultiplier: (multiplier: number) => void; // New action for setting node size
}

export const useCosmosStore = create<CosmosStoreState>()((set) => ({
  graphData: { 
    version: '', 
    createdAt: '', 
    nodeCount: 0, 
    edgeCount: 0, 
    nodes: [], 
    edges: [], 
    communities: [], 
    metadata: { 
      dimension_reduction_algorithm: '', 
      vector_dimensionality: '', 
      semantic_similarity_threshold: 0, 
      communities: [] 
    } 
  },
  isLoading: true,
  error: null,
  selectedNode: null,
  showNodeLabels: false, // Default to hiding labels for cleaner view
  showEdges: false, // Default to hiding edges for cleaner view
  edgeWidth: 1.0, // Default edge width
  nodeSizeMultiplier: 1.0, // Default node size multiplier
  setGraphData: (data) =>
    set({ graphData: data }),
  setLoading: (loading) =>
    set({ isLoading: loading }),
  setError: (error) =>
    set({ error }),
  setSelectedNode: (node) =>
    set({ selectedNode: node }),
  setShowNodeLabels: (show) =>
    set({ showNodeLabels: show }),
  setShowEdges: (show) =>
    set({ showEdges: show }),
  setEdgeWidth: (width) =>
    set({ edgeWidth: Math.max(0.5, Math.min(5.0, width)) }), // Clamp between 0.5 and 5.0
  setNodeSizeMultiplier: (multiplier) =>
    set({ nodeSizeMultiplier: Math.max(0.5, Math.min(3.0, multiplier)) }), // Clamp between 0.5 and 3.0
}));