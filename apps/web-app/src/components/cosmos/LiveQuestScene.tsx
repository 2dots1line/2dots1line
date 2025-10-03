import React, { useMemo, useState } from 'react';
import { Graph3D } from './Graph3D';
import { useQuestConnection } from '../../hooks/useQuestConnection';

const LiveQuestScene: React.FC = () => {
  const [question, setQuestion] = useState('What do you know about my skating experience?');
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'dev-token' : null;
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('user_id') || 'dev-user-123') : null;
  const { questState, joinQuest } = useQuestConnection(authToken, userId);

  const startLiveQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/v1/quest/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userQuestion: question, userId: userId || 'dev-user-123' })
    });
    const j = await res.json();
    const execId = j?.data?.executionId;
    if (execId) joinQuest(execId);
  };

  const viz = questState.visualization_stages;
  const nodes = [
    ...viz.stage1,
    ...viz.stage2,
    ...viz.stage3,
  ].map((e: any) => ({
    id: e.entityId,
    type: e.entityType,
    name: e.title,
    x: e.position[0] * 10,
    y: e.position[1] * 10,
    z: e.position[2] * 10,
    properties: { title: e.title, starTexture: e.starTexture },
  }));

  const graphData = { nodes, edges: [] } as any;

  // Compute cluster center and suggest a reasonable camera
  const POSITION_SCALE = 1; // already scaled above
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
        </div>
      </div>

      <Graph3D
        graphData={graphData}
        onNodeClick={() => {}}
        showEdges={false}
        edgeOpacity={0.5}
        edgeWidth={1}
        animatedEdges={false}
        modalOpen={false}
        isSearchResult={true}
        customCameraPosition={[center.x + 200, center.y + 200, center.z - 150]}
        customCameraTarget={center}
        customTargetDistance={80}
      />

      {/* Final response + walkthrough */}
      {questState.response && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md rounded-lg p-4">
          <div className="text-sm mb-2">{questState.response}</div>
          {questState.walkthrough_script?.length > 0 && (
            <div className="text-xs text-white/80">
              <div className="font-semibold mb-1">Walkthrough Steps:</div>
              <ol className="list-decimal pl-5 space-y-1">
                {questState.walkthrough_script.slice(0, 3).map((s: any) => (
                  <li key={s.step_id}>{s.narrative}</li>
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


