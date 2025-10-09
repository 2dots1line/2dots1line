/**
 * Reusable lookup controls component
 * Used by both CosmosLookupScene and LiveQuestScene
 */

import React from 'react';
import { GlassmorphicPanel } from '@2dots1line/ui-components';

export interface LookupControlsProps {
  similarityThreshold: number;
  onSimilarityChange: (value: number) => void;
  graphHops: number;
  onGraphHopsChange: (value: number) => void;
  enableGraphHops: boolean;
  onEnableGraphHopsChange: (enabled: boolean) => void;
  semanticSimilarLimit: number;
  onSemanticSimilarLimitChange: (value: number) => void;
  showAdvanced?: boolean;
  className?: string;
}

export const LookupControls: React.FC<LookupControlsProps> = ({
  similarityThreshold,
  onSimilarityChange,
  graphHops,
  onGraphHopsChange,
  enableGraphHops,
  onEnableGraphHopsChange,
  semanticSimilarLimit,
  onSemanticSimilarLimitChange,
  showAdvanced = false,
  className = ""
}) => {
  return (
    <div className={`${className}`}>
      <GlassmorphicPanel className="p-3">
        <div className="flex items-center space-x-4 text-sm">
          {/* Similarity Threshold */}
          <div className="flex items-center space-x-2">
            <label className="text-white/70">Similarity:</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={similarityThreshold}
              onChange={(e) => onSimilarityChange(parseFloat(e.target.value))}
              className="w-16"
            />
            <span className="text-white/60 w-8">{similarityThreshold.toFixed(1)}</span>
          </div>
          
          {/* Graph Hops */}
          <div className="flex items-center space-x-2">
            <label className="text-white/70">Hops:</label>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={graphHops}
              onChange={(e) => onGraphHopsChange(parseInt(e.target.value))}
              className="w-12"
            />
            <span className="text-white/60 w-4">{graphHops}</span>
          </div>

          {/* Advanced Controls */}
          {showAdvanced && (
            <>
              {/* Semantic Similar Limit */}
              <div className="flex items-center space-x-2">
                <label className="text-white/70">Limit:</label>
                <input
                  type="number"
                  value={semanticSimilarLimit}
                  onChange={(e) => onSemanticSimilarLimitChange(parseInt(e.target.value) || 20)}
                  className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                  min="1"
                  max="100"
                />
              </div>

              {/* Enable Graph Hops Toggle */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1 text-white/70 text-xs">
                  <input
                    type="checkbox"
                    checked={enableGraphHops}
                    onChange={(e) => onEnableGraphHopsChange(e.target.checked)}
                    className="rounded"
                  />
                  <span>Graph Hops</span>
                </label>
              </div>
            </>
          )}
        </div>
      </GlassmorphicPanel>
    </div>
  );
};

/**
 * Minimalist version for LiveQuestScene
 */
export const MinimalistLookupControls: React.FC<{
  similarityThreshold: number;
  onSimilarityChange: (value: number) => void;
  graphHops: number;
  onGraphHopsChange: (value: number) => void;
  className?: string;
}> = ({
  similarityThreshold,
  onSimilarityChange,
  graphHops,
  onGraphHopsChange,
  className = ""
}) => {
  return (
    <div className={`${className}`}>
      <GlassmorphicPanel className="p-3">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <label className="text-white/70">Similarity:</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={similarityThreshold}
              onChange={(e) => onSimilarityChange(parseFloat(e.target.value))}
              className="w-16"
            />
            <span className="text-white/60 w-8">{similarityThreshold.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-white/70">Hops:</label>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={graphHops}
              onChange={(e) => onGraphHopsChange(parseInt(e.target.value))}
              className="w-12"
            />
            <span className="text-white/60 w-4">{graphHops}</span>
          </div>
        </div>
      </GlassmorphicPanel>
    </div>
  );
};
