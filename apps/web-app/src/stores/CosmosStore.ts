import { UserGraphProjection } from '@2dots1line/shared-types';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface GraphNode {
    id: string;
    type: 'Concept' | 'MemoryUnit' | 'DerivedArtifact';
    label: string;
    position: [number, number, number];
    community_id: string;
    metadata?: Record<string, any>;
}

interface CosmosStoreState {
  graphData: UserGraphProjection;
  isLoading: boolean;
  error: string | null;
  selectedNode: GraphNode | null;
  setGraphData: (data: UserGraphProjection) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
}

export const useCosmosStore: import('zustand').UseBoundStore<import('zustand').StoreApi<CosmosStoreState>> = create<CosmosStoreState>()(
  immer((set) => ({
    graphData: { version: '', createdAt: '', nodeCount: 0, edgeCount: 0, nodes: [], edges: [], communities: [], metadata: { dimension_reduction_algorithm: '', vector_dimensionality: '', semantic_similarity_threshold: 0, communities: [] } },
    isLoading: true,
    error: null,
    selectedNode: null,
    setGraphData: (data) =>
      set((state) => {
        state.graphData = data;
      }),
    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),
    setError: (error) =>
      set((state) => {
        state.error = error;
      }),
    setSelectedNode: (node) =>
      set((state) => {
        state.selectedNode = node;
      }),
  }))
);