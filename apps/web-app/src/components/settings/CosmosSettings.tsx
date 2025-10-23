import React from 'react';
import { useCosmosStore } from '../../stores/CosmosStore';
import { Eye, EyeOff, GitBranch } from 'lucide-react';

export const CosmosSettings: React.FC = () => {
  const { showNodeLabels, setShowNodeLabels, showEdges, setShowEdges } = useCosmosStore();
  
  return (
    <div className="space-y-4">
      {/* Node Labels Toggle */}
      <div>
        <label className="text-xs font-medium text-white/70 block mb-2 flex items-center gap-1">
          {showNodeLabels ? <Eye size={12} /> : <EyeOff size={12} />}
          Node Labels
        </label>
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
        <p className="text-xs text-white/50 mt-2">
          Display labels on graph nodes
        </p>
      </div>
      
      {/* Edges Toggle */}
      <div>
        <label className="text-xs font-medium text-white/70 block mb-2 flex items-center gap-1">
          <GitBranch size={12} />
          Show Edges
        </label>
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
        <p className="text-xs text-white/50 mt-2">
          Display connections between nodes
        </p>
      </div>
      
      {/* Edge appearance - collapsed under edges toggle */}
      {showEdges && (
        <div className="pl-4 space-y-2 border-l-2 border-white/20">
          <div className="text-xs text-white/50 font-brand">
            Edge appearance settings can be added here
          </div>
        </div>
      )}
    </div>
  );
};

