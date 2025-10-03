import React, { useMemo, useState, useCallback } from 'react';
import { Graph3D } from './Graph3D';
import { useQuestConnection } from '../../hooks/useQuestConnection';
import { useCosmosStore } from '../../stores/CosmosStore';
import CosmosInfoPanel from '../modal/CosmosInfoPanel';
import CosmosError from '../modal/CosmosError';
import CosmosLoading from '../modal/CosmosLoading';
import CosmosNodeModal from '../modal/CosmosNodeModal';
import { NodeLabelControls } from './NodeLabelControls';

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
  
  // Local state for additional edge controls
  const [edgeOpacity, setEdgeOpacity] = useState(0.5);
  const [edgeWidth, setEdgeWidth] = useState(1);
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
        questType: 'exploration'
      })
    });
    const j = await res.json();
    const execId = j?.data?.executionId;
    if (execId) joinQuest(execId);
  };

  const viz = questState.visualization_stages;
  const POSITION_SCALE = 10;
  
  // Process nodes with proper labels and properties (like CosmosLookupScene)
  const nodes = [
    ...viz.stage1,
    ...viz.stage2,
    ...viz.stage3,
  ].map((e: any, index: number) => {
    const x = e.position[0] * POSITION_SCALE;
    const y = e.position[1] * POSITION_SCALE;
    const z = e.position[2] * POSITION_SCALE;
    
    return {
      id: e.entityId,
      type: e.entityType,
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
        type: e.entityType,
        starTexture: e.starTexture,
        relevanceScore: e.relevanceScore,
        connectionType: e.connectionType,
        connectedTo: e.connectedTo
      },
      // Add metadata for proper display
      metadata: {
        title: e.title || e.entityId,
        type: e.entityType,
        content: e.content || '',
        importance: e.relevanceScore || 1,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };
  });

  // Process edges from walkthrough connections
  const edges: any[] = [];
  viz.stage2?.forEach((entity: any) => {
    if (entity.connectedTo && entity.connectedTo.length > 0) {
      entity.connectedTo.forEach((targetId: string) => {
        edges.push({
          id: `${entity.entityId}-${targetId}`,
          source: entity.entityId,
          target: targetId,
          type: entity.connectionType || 'related',
          weight: entity.relevanceScore || 1.0,
          strength: entity.relevanceScore || 1.0
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

  return (
    <div className="w-full h-full relative p-4 text-white">
      <div className="absolute top-4 left-4 z-10 w-96">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">⚡ Live Cosmos Quest</h3>
          <form onSubmit={startLiveQuest} className="space-y-3">
            <input
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your memories..."
              disabled={questState.isProcessing}
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              disabled={questState.isProcessing}
            >
              {questState.isProcessing ? 'Processing…' : 'Start Live Quest'}
            </button>
          </form>

          {questState.key_phrases.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-white/80 mb-2">Key Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {questState.key_phrases.map((c: any, i: number) => (
                  <span key={i} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: c.color + '33', border: `1px solid ${c.color}66` }}>
                    {c.phrase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Edge Controls Panel */}
          <div className="mt-4 border-t border-white/20 pt-3">
            <h4 className="text-sm font-medium text-white/80 mb-2">Visualization Controls</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-white/70">Show Edges</label>
                <input
                  type="checkbox"
                  checked={showEdges}
                  onChange={(e) => setShowEdges(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-white/70">Animated Edges</label>
                <input
                  type="checkbox"
                  checked={animatedEdges}
                  onChange={(e) => setAnimatedEdges(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div>
                <label className="block text-white/70 mb-1">Edge Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={edgeOpacity}
                  onChange={(e) => setEdgeOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-white/50 text-xs">{edgeOpacity.toFixed(1)}</span>
              </div>
              
              <div>
                <label className="block text-white/70 mb-1">Edge Width</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={edgeWidth}
                  onChange={(e) => setEdgeWidth(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-white/50 text-xs">{edgeWidth.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-3 text-white">
          <button
            onClick={() => window.location.href = '/cosmos/lookup'}
            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-400 rounded text-sm font-medium transition-colors"
          >
            ← Entity Lookup
          </button>
        </div>
      </div>

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
      />
      
      {/* Node Label Controls */}
      <NodeLabelControls />
      
      {/* Modals */}
      <CosmosInfoPanel />
      {selectedNode && <CosmosNodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}

      {/* Final response + walkthrough */}
      {questState.response && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md rounded-lg p-4">
          <div className="text-sm mb-2">{questState.response}</div>
          {questState.walkthrough_script?.length > 0 && (
            <div className="text-xs text-white/80">
              <div className="font-semibold mb-1">Walkthrough Steps:</div>
              <ol className="list-decimal pl-5 space-y-1">
                {questState.walkthrough_script.slice(0, 3).map((s: any, index: number) => (
                  <li key={s.step_number || index}>
                    <strong>{s.title}:</strong> {s.description}
                    {s.focus_entity_id && (
                      <span className="text-blue-300 ml-2">(Focus: {s.focus_entity_id})</span>
                    )}
                  </li>
                ))}
              </ol>
              {questState.reflective_question && (
                <div className="mt-2 text-white/70">{questState.reflective_question}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveQuestScene;


