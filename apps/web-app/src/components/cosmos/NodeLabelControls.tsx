import React from 'react';
import { useCosmosStore } from '../../stores/CosmosStore';
import { Eye, EyeOff, GitBranch } from 'lucide-react';

export const NodeLabelControls: React.FC = () => {
  const { showNodeLabels, setShowNodeLabels, showEdges, setShowEdges } = useCosmosStore();

  const handleLabelsToggle = () => {
    setShowNodeLabels(!showNodeLabels);
  };

  const handleEdgesToggle = () => {
    setShowEdges(!showEdges);
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
        <div className="flex items-center space-x-3">
          {/* Labels Toggle */}
          <button
            onClick={handleLabelsToggle}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
              showNodeLabels
                ? 'bg-blue-600/80 text-white hover:bg-blue-600'
                : 'bg-gray-600/80 text-gray-200 hover:bg-gray-600'
            }`}
            title={showNodeLabels ? 'Hide all node labels' : 'Show all node labels'}
          >
            {showNodeLabels ? (
              <>
                <Eye size={16} />
                <span className="text-sm font-medium">Labels On</span>
              </>
            ) : (
              <>
                <EyeOff size={16} />
                <span className="text-sm font-medium">Labels Off</span>
              </>
            )}
          </button>

          {/* Edges Toggle */}
          <button
            onClick={handleEdgesToggle}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
              showEdges
                ? 'bg-green-600/80 text-white hover:bg-green-600'
                : 'bg-gray-600/80 text-gray-200 hover:bg-gray-600'
            }`}
            title={showEdges ? 'Hide edges' : 'Show edges'}
          >
            {showEdges ? (
              <>
                <GitBranch size={16} />
                <span className="text-sm font-medium">Edges On</span>
              </>
            ) : (
              <>
                <GitBranch size={16} />
                <span className="text-sm font-medium">Edges Off</span>
              </>
            )}
          </button>
          
          <div className="text-xs text-gray-300 max-w-32">
            {showNodeLabels 
              ? 'All labels visible' 
              : 'Labels show on hover + connected nodes'
            }
          </div>
        </div>
      </div>
    </div>
  );
};
