/**
 * EdgeControls Component
 * Provides controls for edge visibility and styling in the Cosmos view
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Settings, Palette, Zap } from 'lucide-react';

interface EdgeControlsProps {
  showEdges: boolean;
  edgeOpacity: number;
  edgeWidth: number;
  animatedEdges: boolean;
  onToggleEdges: (show: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onWidthChange: (width: number) => void;
  onAnimatedChange: (animated: boolean) => void;
  className?: string;
}

export const EdgeControls: React.FC<EdgeControlsProps> = ({
  showEdges,
  edgeOpacity,
  edgeWidth,
  animatedEdges,
  onToggleEdges,
  onOpacityChange,
  onWidthChange,
  onAnimatedChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`edge-controls ${className}`}>
      {/* Main toggle button */}
      <button
        onClick={() => onToggleEdges(!showEdges)}
        className={`p-3 rounded-lg transition-all duration-200 ${
          showEdges 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
        } hover:bg-white/10`}
        title={showEdges ? 'Hide edges' : 'Show edges'}
      >
        {showEdges ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>

      {/* Settings button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors"
        title="Edge settings"
      >
        <Settings size={20} />
      </button>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 min-w-64">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Palette size={16} />
            Edge Settings
          </h3>
          
          {/* Opacity control */}
          <div className="mb-4">
            <label className="block text-white/70 text-sm mb-2">
              Opacity: {Math.round(edgeOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={edgeOpacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Width control */}
          <div className="mb-4">
            <label className="block text-white/70 text-sm mb-2">
              Width: {edgeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={edgeWidth}
              onChange={(e) => onWidthChange(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Animation toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={animatedEdges}
                onChange={(e) => onAnimatedChange(e.target.checked)}
                className="w-4 h-4 text-green-500 bg-white/10 border-white/20 rounded focus:ring-green-500"
              />
              <Zap size={16} />
              Animated edges
            </label>
          </div>

          {/* Edge type legend */}
          <div className="pt-3 border-t border-white/20">
            <h4 className="text-white/70 text-sm mb-2">Edge Types</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-400"></div>
                <span className="text-white/60">Related</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-orange-400"></div>
                <span className="text-white/60">Temporal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-400"></div>
                <span className="text-white/60">Semantic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-pink-400"></div>
                <span className="text-white/60">Hierarchical</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified version for basic toggle
export const EdgeToggle: React.FC<{
  showEdges: boolean;
  onToggle: (show: boolean) => void;
  className?: string;
}> = ({ showEdges, onToggle, className = '' }) => {
  return (
    <button
      onClick={() => onToggle(!showEdges)}
      className={`p-2 rounded-lg transition-all duration-200 ${
        showEdges 
          ? 'bg-green-500/20 text-green-300' 
          : 'bg-gray-500/20 text-gray-300'
      } hover:bg-white/10 ${className}`}
      title={showEdges ? 'Hide edges' : 'Show edges'}
    >
      {showEdges ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  );
}; 