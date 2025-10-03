import React, { useState } from 'react';
import { useMockQuest } from '../../hooks/useMockQuest';
import { Graph3D } from './Graph3D';

const MockQuestScene: React.FC = () => {
  const [question, setQuestion] = useState('What do you know about my skating experience?');
  const { questState, startQuest, resetQuest, isConnected } = useMockQuest();

  const visualizationStages = {
    stage1: questState.visualization_stages.stage1,
    stage2: questState.visualization_stages.stage2,
    stage3: questState.visualization_stages.stage3,
  } as any;

  // Deduplicate entities by entityId across stages, merging properties
  const nodeMap = new Map<string, any>();

  const addEntity = (e: any) => {
    const id = e.entityId;
    const existing = nodeMap.get(id);
    const base = {
      id,
      type: e.entityType,
      name: e.title,
      x: e.position[0] * 10,
      y: e.position[1] * 10,
      z: e.position[2] * 10,
      properties: {
        title: e.title,
        starTexture: e.starTexture,
        connectionType: e.connectionType,
      },
    };
    if (!existing) {
      nodeMap.set(id, base);
    } else {
      nodeMap.set(id, {
        ...existing,
        // Keep first position/type; merge descriptive properties
        properties: {
          ...existing.properties,
          title: existing.properties?.title || e.title,
          starTexture: existing.properties?.starTexture || e.starTexture,
          connectionType: existing.properties?.connectionType || e.connectionType,
        },
      });
    }
  };

  (visualizationStages.stage1 || []).forEach(addEntity);
  (visualizationStages.stage2 || []).forEach(addEntity);
  (visualizationStages.stage3 || []).forEach(addEntity);

  const graphData = {
    nodes: Array.from(nodeMap.values()),
    edges: [],
  };

  return (
    <div className="w-full h-full relative p-4 text-white">
      <div className="absolute top-4 left-4 z-10 w-96">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">🧪 Mock Cosmos Quest</h3>
          <p className="text-xs mb-2">Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!questState.isProcessing && question.trim()) startQuest(question.trim());
            }}
            className="space-y-3"
          >
            <input
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your memories..."
              disabled={questState.isProcessing}
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={questState.isProcessing || !question.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {questState.isProcessing ? 'Processing…' : 'Start Quest'}
              </button>
              <button
                type="button"
                onClick={resetQuest}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Reset
              </button>
            </div>
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
        </div>
      </div>

      <Graph3D
        graphData={graphData as any}
        onNodeClick={() => {}}
        showEdges={false}
        edgeOpacity={0.5}
        edgeWidth={1}
        animatedEdges={false}
        modalOpen={false}
      />

      {questState.response && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md rounded-lg p-4">
          <div className="text-sm mb-2">{questState.response}</div>
        </div>
      )}
    </div>
  );
};

export default MockQuestScene;


