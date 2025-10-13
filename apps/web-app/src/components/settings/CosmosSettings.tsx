import React from 'react';
import { useCosmosStore } from '../../stores/CosmosStore';
import { Eye, EyeOff, GitBranch } from 'lucide-react';

export const CosmosSettings: React.FC = () => {
  const { showNodeLabels, setShowNodeLabels, showEdges, setShowEdges } = useCosmosStore();
  
  return (
    <div className="space-y-3">
      {/* Node Labels Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80 flex items-center gap-2">
          {showNodeLabels ? <Eye size={14} /> : <EyeOff size={14} />}
          Node Labels
        </span>
        <button
          onClick={() => setShowNodeLabels(!showNodeLabels)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            showNodeLabels ? 'bg-blue-600' : 'bg-white/20'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            showNodeLabels ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
      
      {/* Edges Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80 flex items-center gap-2">
          <GitBranch size={14} />
          Show Edges
        </span>
        <button
          onClick={() => setShowEdges(!showEdges)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            showEdges ? 'bg-blue-600' : 'bg-white/20'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            showEdges ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
      
      {/* Edge appearance - collapsed under edges toggle */}
      {showEdges && (
        <div className="pl-4 space-y-2 border-l-2 border-white/20">
          <div className="text-xs text-white/60 font-brand">
            Edge appearance settings can be added here
          </div>
        </div>
      )}
    </div>
  );
};

