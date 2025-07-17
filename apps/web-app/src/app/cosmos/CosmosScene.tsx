'use client';

import React, { useEffect } from 'react';
import { Graph3D } from '@2dots1line/ui-components';
import { useCosmosStore } from '../../stores/CosmosStore';
import { cosmosService } from '../../services/cosmosService';
import CosmosInfoPanel from '../../components/modal/CosmosInfoPanel';
import CosmosError from '../../components/modal/CosmosError';
import CosmosLoading from '../../components/modal/CosmosLoading';
import CosmosNodeModal from '../../components/modal/CosmosNodeModal';

const CosmosScene: React.FC = () => {
  const {
    graphData,
    isLoading,
    error,
    selectedNode,
    setGraphData,
    setLoading,
    setError,
    setSelectedNode,
  } = useCosmosStore();

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        const response = await cosmosService.getGraphProjection();
        if (response.success) {
          setGraphData(response.data);
        } else {
          setError(response.error.message || 'Failed to load graph data.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [setGraphData, setLoading, setError]);

  if (isLoading) {
    return <CosmosLoading />;
  }

  if (error) {
    return <CosmosError message={error} />;
  }

  const POSITION_SCALE = 250;
  const safeGraphData = {
    ...graphData,
    nodes: (graphData.nodes ?? []).map(node => ({
      ...node,
      x: node.position?.x ?? node.position?.[0] ?? 0,
      y: node.position?.y ?? node.position?.[1] ?? 0,
      z: node.position?.z ?? node.position?.[2] ?? 0,
      name: node.properties?.title ?? node.label ?? node.id,
      type: node.properties?.type ?? node.type,
    })),
    edges: graphData.edges ?? [],
    links: graphData.edges ?? [],
  };

  return (
    <div className="w-full h-full">
      <Graph3D
        graphData={safeGraphData}
        onNodeClick={(node) => setSelectedNode(node)}
      />
      <CosmosInfoPanel />
      {selectedNode && <CosmosNodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
};

export default CosmosScene;