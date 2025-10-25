import React from 'react';
import { useCosmosStore } from '../../stores/CosmosStore';
import { Eye, EyeOff, GitBranch, Settings } from 'lucide-react';

export const CosmosSettings: React.FC = () => {
  const { 
    showNodeLabels, 
    setShowNodeLabels, 
    showEdges, 
    setShowEdges,
    edgeWidth,
    setEdgeWidth,
    nodeSizeMultiplier,
    setNodeSizeMultiplier
  } = useCosmosStore();
  
  return (
    <div className="space-y-4">
      {/* Node Labels Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-brand text-white/90">Show node labels</span>
        <button
          onClick={() => setShowNodeLabels(!showNodeLabels)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            showNodeLabels ? 'bg-blue-600' : 'bg-white/20'
          }`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            showNodeLabels ? 'translate-x-5' : 'translate-x-1'
          }`} />
        </button>
      </div>
      
      {/* Edges Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-brand text-white/90">Show connections</span>
        <button
          onClick={() => setShowEdges(!showEdges)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            showEdges ? 'bg-blue-600' : 'bg-white/20'
          }`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            showEdges ? 'translate-x-5' : 'translate-x-1'
          }`} />
        </button>
      </div>
      
      {/* Edge appearance - collapsed under edges toggle */}
      {showEdges && (
        <div className="pl-4 space-y-3 border-l-2 border-white/20">
          {/* Edge Width Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-brand text-white/70">Edge width</span>
              <span className="text-xs text-white/50">{edgeWidth.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={edgeWidth}
              onChange={(e) => setEdgeWidth(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((edgeWidth - 0.5) / 4.5) * 100}%, rgba(255,255,255,0.2) ${((edgeWidth - 0.5) / 4.5) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        </div>
      )}
      
      {/* Node Size Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-brand text-white/90">Node size</span>
          <span className="text-xs text-white/50">{nodeSizeMultiplier.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={nodeSizeMultiplier}
          onChange={(e) => setNodeSizeMultiplier(parseFloat(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((nodeSizeMultiplier - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.2) ${((nodeSizeMultiplier - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.2) 100%)`
          }}
        />
      </div>
    </div>
  );
};

