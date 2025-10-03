import React, { useMemo, useState, useCallback } from 'react';
import { Graph3D } from './Graph3D';
import { useQuestConnection } from '../../hooks/useQuestConnection';
import { useCosmosStore } from '../../stores/CosmosStore';
import CosmosInfoPanel from '../modal/CosmosInfoPanel';
import CosmosError from '../modal/CosmosError';
import CosmosLoading from '../modal/CosmosLoading';
import CosmosNodeModal from '../modal/CosmosNodeModal';
import { NodeLabelControls } from './NodeLabelControls';
import WalkthroughControls from './WalkthroughControls';
import { LookupCameraController } from './LookupCameraController';

const LiveQuestScene: React.FC = () => {
  const [question, setQuestion] = useState('What do you know about my skating experience?');
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'dev-token' : null;
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('user_id') || 'dev-user-123') : null;
  const { questState, joinQuest } = useQuestConnection(authToken, userId);
  
  // Cosmos store for node selection and basic edge controls
  const {
    selectedNode,
    setSelectedNode,
    showEdges,
    setShowEdges
  } = useCosmosStore();

  // Local edge control state
  const [edgeOpacity, setEdgeOpacity] = useState(0.5);
  const [edgeWidth, setEdgeWidth] = useState(1.0);
  const [animatedEdges, setAnimatedEdges] = useState(true);

  const startLiveQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/v1/quest/process', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken || 'dev-token'}`
      },
      body: JSON.stringify({ 
        userQuestion: question, 
        conversationId: `quest-${Date.now()}`,
        questType: 'exploration',
        userId: userId || 'dev-user-123' 
      })
    });
    const j = await res.json();
    const execId = j?.data?.executionId;
    if (execId) joinQuest(execId);
  };

  // Process visualization data
  const viz = questState.visualization_stages;
  const POSITION_SCALE = 10;
  
  // Map entity types from CosmosQuestAgent format to API format
  const mapEntityType = (entityType: string): string => {
    const mapping: Record<string, string> = {
      'Concept': 'concept',
      'MemoryUnit': 'memoryunit', 
      'Artifact': 'derivedartifact'
    };
    return mapping[entityType] || 'concept';
  };

  // Process nodes with proper labels and properties (like CosmosLookupScene)
  const nodes = [
    ...viz.stage1,
    ...viz.stage2,
    ...viz.stage3,
  ].map((e: any, index: number) => {
    const x = e.position[0] * POSITION_SCALE;
    const y = e.position[1] * POSITION_SCALE;
    const z = e.position[2] * POSITION_SCALE;
    
    const apiEntityType = mapEntityType(e.entityType);
    
    return {
      id: e.entityId,
      type: apiEntityType, // Use mapped type for API compatibility
      entity_type: apiEntityType, // Also add entity_type field for API
      label: e.title || e.entityId, // Proper label mapping
      name: e.title || e.entityId, // Fallback for name
      x,
      y,
      z,
      position: [x, y, z] as [number, number, number],
      title: e.title,
      content: e.content || '',
      properties: { 
        title: e.title || e.entityId,
        type: apiEntityType, // Use mapped type
        starTexture: e.starTexture,
        relevanceScore: e.relevanceScore,
        connectionType: e.connectionType,
        connectedTo: e.connectedTo
      },
      // Add metadata for proper display
      metadata: {
        title: e.title || e.entityId,
        type: apiEntityType, // Use mapped type
        content: e.content || '',
        importance: e.relevanceScore || 1,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };
  });

  // Function to focus camera on a specific entity
  const focusCameraOnEntity = useCallback((entityId: string) => {
    const entity = nodes.find(node => node.id === entityId);
    if (entity) {
      const x = entity.x || 0;
      const y = entity.y || 0;
      const z = entity.z || 0;
      
      // Dispatch camera focus event
      const event = new CustomEvent('camera-focus-request', {
        detail: {
          position: { x, y, z },
          entity: {
            id: entity.id,
            title: entity.name || entity.label || entity.id,
            type: entity.type || 'unknown'
          }
        }
      });
      
      window.dispatchEvent(event);
      console.log('🎥 LiveQuestScene: Focusing camera on entity:', entityId, 'at position:', { x, y, z });
    } else {
      console.warn('🎥 LiveQuestScene: Entity not found for focus:', entityId);
    }
  }, [nodes]);

  // Process edges from walkthrough connections
  const edges: any[] = [];
  viz.stage2?.forEach((entity: any) => {
    if (entity.connectedTo && entity.connectedTo.length > 0) {
      entity.connectedTo.forEach((targetId: string) => {
        edges.push({
          id: `${entity.entityId}-${targetId}`,
          source: entity.entityId,
          target: targetId,
          type: '1_hop',
          animated: animatedEdges
        });
      });
    }
  });

  viz.stage3?.forEach((entity: any) => {
    if (entity.connectedTo && entity.connectedTo.length > 0) {
      entity.connectedTo.forEach((targetId: string) => {
        edges.push({
          id: `${entity.entityId}-${targetId}`,
          source: entity.entityId,
          target: targetId,
          type: '2_hop',
          animated: animatedEdges
        });
      });
    }
  });

  const graphData = { nodes, edges };

  // Compute cluster center for camera positioning
  const center = useMemo(() => {
    if (!nodes.length) return { x: 0, y: 0, z: 0 };
    const sum = nodes.reduce((acc: any, n: any) => ({ x: acc.x + n.x, y: acc.y + n.y, z: acc.z + n.z }), { x: 0, y: 0, z: 0 });
    return { x: sum.x / nodes.length, y: sum.y / nodes.length, z: sum.z / nodes.length };
  }, [nodes]);

  // Show loading state
  if (questState.isProcessing) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Processing Quest</h3>
            <p className="text-white/70">Exploring your memories...</p>
          </div>
        </div>
        <Graph3D
          graphData={{ nodes: [], edges: [] }}
          onNodeClick={() => {}}
          showEdges={false}
          edgeOpacity={0}
          edgeWidth={1}
          animatedEdges={false}
          modalOpen={false}
          customCameraPosition={[0, 0, 100]}
          customCameraTarget={{ x: 0, y: 0, z: 0 }}
          customTargetDistance={100}
          customCameraController={LookupCameraController}
        />
      </div>
    );
  }

  // Show error state
  if (questState.error) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-red-900/80 backdrop-blur-md rounded-lg p-8 text-center max-w-md">
            <h3 className="text-xl font-semibold text-white mb-2">Quest Error</h3>
            <p className="text-red-200 mb-4">{questState.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
        <Graph3D
          graphData={{ nodes: [], edges: [] }}
          onNodeClick={() => {}}
          showEdges={false}
          edgeOpacity={0}
          edgeWidth={1}
          animatedEdges={false}
          modalOpen={false}
          customCameraPosition={[0, 0, 100]}
          customCameraTarget={{ x: 0, y: 0, z: 0 }}
          customTargetDistance={100}
          customCameraController={LookupCameraController}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative text-white">
      {/* Top Controls - Edge Controls Only */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        {/* Left: Empty space */}
        <div></div>

        {/* Center: Edge Controls */}
        <div className="flex items-center space-x-4 text-sm bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
          <label className="flex items-center space-x-2 text-white/70">
            <input
              type="checkbox"
              checked={showEdges}
              onChange={(e) => setShowEdges(e.target.checked)}
              className="rounded"
            />
            <span>Edges</span>
          </label>
          <label className="flex items-center space-x-2 text-white/70">
            <input
              type="checkbox"
              checked={animatedEdges}
              onChange={(e) => setAnimatedEdges(e.target.checked)}
              className="rounded"
            />
            <span>Animate</span>
          </label>
        </div>

        {/* Right: Navigation */}
        <button
          onClick={() => window.location.href = '/cosmos/lookup'}
          className="px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-black/50 transition-colors text-sm"
        >
          ← Entity Lookup
        </button>
      </div>

      {/* Quest Input - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <form onSubmit={startLiveQuest} className="flex items-center space-x-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about your memories..."
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              disabled={questState.isProcessing}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              disabled={questState.isProcessing}
            >
              {questState.isProcessing ? 'Processing…' : 'Start Quest'}
            </button>
          </form>
        </div>
      </div>

      {/* Key Phrases - Compact Display */}
      {questState.key_phrases && questState.key_phrases.length > 0 && (
        <div className="absolute top-16 left-4 z-20">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-white/10">
            <div className="flex flex-wrap gap-1">
              {questState.key_phrases.map((phrase: any, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 text-blue-200 text-xs rounded border border-blue-400/30"
                >
                  {phrase.phrase || phrase}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3D Visualization */}
      <Graph3D
        graphData={graphData}
        onNodeClick={(node) => setSelectedNode(node)}
        showEdges={showEdges}
        edgeOpacity={edgeOpacity}
        edgeWidth={edgeWidth}
        animatedEdges={animatedEdges}
        modalOpen={!!selectedNode}
        isSearchResult={true}
        customCameraPosition={[center.x + 200, center.y + 200, center.z - 150]}
        customCameraTarget={center}
        customTargetDistance={80}
        customCameraController={LookupCameraController}
      />
      
      {/* Node Label Controls */}
      <NodeLabelControls />
      
      {/* Modals */}
      <CosmosInfoPanel />
      {selectedNode && <CosmosNodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}

      {/* Walkthrough - Bottom Right */}
      {questState.response && questState.walkthrough_script?.length > 0 && (
        <div className="absolute bottom-4 right-4 z-20 max-w-xs">
          <WalkthroughControls
            walkthroughScript={questState.walkthrough_script}
            reflectiveQuestion={questState.reflective_question || ''}
            onStepChange={(step) => {
              console.log('Walkthrough step changed:', step);
              if (step?.focus_entity_id) {
                focusCameraOnEntity(step.focus_entity_id);
              }
            }}
            onCameraMove={(position, target) => {
              console.log('Camera move requested:', { position, target });
              // Camera movement is handled by the LookupCameraController
            }}
            onEntityHighlight={(entityId, color) => {
              console.log('Entity highlight requested:', { entityId, color });
              if (entityId) {
                focusCameraOnEntity(entityId);
              }
            }}
          />
        </div>
      )}

      {/* Response Display - Bottom Center (only if no walkthrough) */}
      {questState.response && (!questState.walkthrough_script || questState.walkthrough_script.length === 0) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 max-w-sm">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="text-sm text-white/90">{questState.response}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveQuestScene;