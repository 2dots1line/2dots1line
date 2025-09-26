/**
 * HRT Control Panel Component
 * Provides UI controls for adjusting Hybrid Retrieval Tool parameters
 */

import React, { useState, useEffect } from 'react';
import './HRTControlPanel.css';
import { useHRTParametersStore } from '../../stores/HRTParametersStore';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { Save, RotateCcw, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  description?: string;
  unit?: string;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
  unit = '',
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">
          {label}
        </label>
        <span className="text-sm text-white/70">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.2) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.2) 100%)`
        }}
      />
      {description && (
        <p className="text-xs text-white/60">{description}</p>
      )}
    </div>
  );
};

interface ParameterToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

const ParameterToggle: React.FC<ParameterToggleProps> = ({
  label,
  value,
  onChange,
  description,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">
          {label}
        </label>
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-white/20'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {description && (
        <p className="text-xs text-white/60">{description}</p>
      )}
    </div>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  description?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, description }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
        {description && (
          <p className="text-sm text-white/70">{description}</p>
        )}
      </div>
      <div className="space-y-4 pl-4 border-l-2 border-white/20">
        {children}
      </div>
    </div>
  );
};

export const HRTControlPanel: React.FC = () => {
  const {
    parameters,
    isModified,
    lastSaved,
    updateWeaviateParams,
    updateNeo4jParams,
    updateScoringParams,
    updateScoringWeights,
    updatePerformanceParams,
    updateQualityFilters,
    resetToDefaults,
    saveParameters,
    loadParameters,
    setModified,
  } = useHRTParametersStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load parameters on component mount
  useEffect(() => {
    const loadParams = async () => {
      setIsLoading(true);
      try {
        await loadParameters();
      } catch (error) {
        console.error('Failed to load parameters:', error);
        setSaveStatus('error');
        setErrorMessage('Failed to load parameters from server');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadParams();
  }, [loadParameters]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    
    try {
      await saveParameters();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Failed to save parameters:', error);
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save parameters');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
  };

  const validateScoringWeights = () => {
    const { alphaSemanticSimilarity, betaRecency, gammaImportanceScore } = parameters.scoringWeights;
    const total = alphaSemanticSimilarity + betaRecency + gammaImportanceScore;
    return Math.abs(total - 1.0) < 0.01; // Allow small floating point errors
  };

  const weightsValid = validateScoringWeights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Hybrid Retrieval Tool (HRT) Parameters</h3>
          <p className="text-sm text-white/70">
            Configure how the system retrieves and processes your memories
          </p>
          {isLoading && (
            <p className="text-sm text-blue-400 mt-1">Loading parameters...</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Status indicators */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle size={16} />
              <span>Saved successfully</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <XCircle size={16} />
              <span>Save failed</span>
            </div>
          )}
          {isModified && saveStatus === 'idle' && (
            <div className="flex items-center gap-1 text-amber-400 text-sm">
              <AlertTriangle size={16} />
              <span>Unsaved changes</span>
            </div>
          )}
          
          <GlassButton
            onClick={handleSave}
            disabled={!isModified || isSaving || isLoading}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </GlassButton>
        </div>
      </div>

      {/* Error message */}
      {saveStatus === 'error' && errorMessage && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Vector Search Parameters */}
      <Section
        title="Vector Search (Weaviate)"
        description="Controls how the system finds semantically similar content"
      >
        <ParameterSlider
          label="Results per Key Phrase"
          value={parameters.weaviate.resultsPerPhrase}
          min={1}
          max={10}
          step={1}
          onChange={(value) => updateWeaviateParams({ resultsPerPhrase: value })}
          description="Number of similar entities found for each key phrase"
        />
        
        <ParameterSlider
          label="Similarity Threshold"
          value={parameters.weaviate.similarityThreshold}
          min={0.01}
          max={1.0}
          step={0.01}
          onChange={(value) => updateWeaviateParams({ similarityThreshold: value })}
          description="Minimum similarity score (0.1 = 10% similarity)"
          unit=""
        />
        
        <ParameterSlider
          label="Search Timeout"
          value={parameters.weaviate.timeoutMs}
          min={1000}
          max={30000}
          step={500}
          onChange={(value) => updateWeaviateParams({ timeoutMs: value })}
          description="Maximum time to wait for vector search results"
          unit="ms"
        />
      </Section>

      {/* Graph Traversal Parameters */}
      <Section
        title="Graph Traversal (Neo4j)"
        description="Controls how the system explores relationships between entities"
      >
        <ParameterSlider
          label="Max Result Limit"
          value={parameters.neo4j.maxResultLimit}
          min={10}
          max={500}
          step={10}
          onChange={(value) => updateNeo4jParams({ maxResultLimit: value })}
          description="Maximum number of entities to retrieve from graph traversal"
        />
        
        <ParameterSlider
          label="Max Graph Hops"
          value={parameters.neo4j.maxGraphHops}
          min={1}
          max={5}
          step={1}
          onChange={(value) => updateNeo4jParams({ maxGraphHops: value })}
          description="How many relationship steps to traverse from seed entities"
        />
        
        <ParameterSlider
          label="Max Seed Entities"
          value={parameters.neo4j.maxSeedEntities}
          min={1}
          max={20}
          step={1}
          onChange={(value) => updateNeo4jParams({ maxSeedEntities: value })}
          description="Maximum number of seed entities to start traversal from"
        />
        
        <ParameterSlider
          label="Query Timeout"
          value={parameters.neo4j.queryTimeoutMs}
          min={1000}
          max={30000}
          step={500}
          onChange={(value) => updateNeo4jParams({ queryTimeoutMs: value })}
          description="Maximum time to wait for graph traversal results"
          unit="ms"
        />
      </Section>

      {/* Scoring Parameters */}
      <Section
        title="Scoring & Prioritization"
        description="Controls how entities are ranked and selected for final results"
      >
        <ParameterSlider
          label="Final Entities to Keep"
          value={parameters.scoring.topNCandidatesForHydration}
          min={5}
          max={50}
          step={1}
          onChange={(value) => updateScoringParams({ topNCandidatesForHydration: value })}
          description="Number of top-scored entities passed to the LLM"
        />
        
        <ParameterSlider
          label="Recency Decay Rate"
          value={parameters.scoring.recencyDecayRate}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(value) => updateScoringParams({ recencyDecayRate: value })}
          description="How quickly older content loses relevance (higher = faster decay)"
        />
        
        <ParameterSlider
          label="Diversity Threshold"
          value={parameters.scoring.diversityThreshold}
          min={0.1}
          max={1.0}
          step={0.1}
          onChange={(value) => updateScoringParams({ diversityThreshold: value })}
          description="Minimum similarity difference between selected entities"
        />
      </Section>

      {/* Scoring Weights */}
      <Section
        title="Scoring Weights"
        description="Balance between different scoring factors (must sum to 1.0)"
      >
        {!weightsValid && (
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-4">
            <AlertTriangle size={16} />
            <span>Warning: Scoring weights must sum to 1.0</span>
          </div>
        )}
        
        <ParameterSlider
          label="Semantic Similarity Weight"
          value={parameters.scoringWeights.alphaSemanticSimilarity}
          min={0.0}
          max={1.0}
          step={0.05}
          onChange={(value) => updateScoringWeights({ alphaSemanticSimilarity: value })}
          description="How much to prioritize semantic similarity"
        />
        
        <ParameterSlider
          label="Recency Weight"
          value={parameters.scoringWeights.betaRecency}
          min={0.0}
          max={1.0}
          step={0.05}
          onChange={(value) => updateScoringWeights({ betaRecency: value })}
          description="How much to prioritize recent content"
        />
        
        <ParameterSlider
          label="Importance Score Weight"
          value={parameters.scoringWeights.gammaImportanceScore}
          min={0.0}
          max={1.0}
          step={0.05}
          onChange={(value) => updateScoringWeights({ gammaImportanceScore: value })}
          description="How much to prioritize high-importance content"
        />
      </Section>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <Info size={16} />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
        </button>
        
        {showAdvanced && (
          <div className="space-y-6 pl-4 border-l-2 border-white/20">
            {/* Performance Tuning */}
            <Section
              title="Performance Tuning"
              description="Advanced performance and caching options"
            >
              <ParameterSlider
                label="Max Retrieval Time"
                value={parameters.performance.maxRetrievalTimeMs}
                min={1000}
                max={30000}
                step={500}
                onChange={(value) => updatePerformanceParams({ maxRetrievalTimeMs: value })}
                description="Maximum total time for entire retrieval process"
                unit="ms"
              />
              
              <ParameterToggle
                label="Enable Parallel Processing"
                value={parameters.performance.enableParallelProcessing}
                onChange={(value) => updatePerformanceParams({ enableParallelProcessing: value })}
                description="Process multiple stages simultaneously for faster results"
              />
              
              <ParameterToggle
                label="Cache Results"
                value={parameters.performance.cacheResults}
                onChange={(value) => updatePerformanceParams({ cacheResults: value })}
                description="Cache retrieval results for repeated queries"
              />
            </Section>

            {/* Quality Filters */}
            <Section
              title="Quality Filters"
              description="Filters to improve result quality"
            >
              <ParameterSlider
                label="Minimum Relevance Score"
                value={parameters.qualityFilters.minimumRelevanceScore}
                min={0.01}
                max={1.0}
                step={0.01}
                onChange={(value) => updateQualityFilters({ minimumRelevanceScore: value })}
                description="Minimum final score to include in results"
              />
              
              <ParameterToggle
                label="Deduplicate Similar Results"
                value={parameters.qualityFilters.dedupeSimilarResults}
                onChange={(value) => updateQualityFilters({ dedupeSimilarResults: value })}
                description="Remove highly similar entities from results"
              />
              
              <ParameterToggle
                label="Boost Recent Content"
                value={parameters.qualityFilters.boostRecentContent}
                onChange={(value) => updateQualityFilters({ boostRecentContent: value })}
                description="Give higher scores to recently created content"
              />
            </Section>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-white/20">
        <div className="text-sm text-white/60">
          {lastSaved && (
            <span>Last saved: {lastSaved.toLocaleString()}</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Reset to defaults?</span>
              <GlassButton
                onClick={handleReset}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400"
              >
                Confirm
              </GlassButton>
              <GlassButton
                onClick={() => setShowResetConfirm(false)}
                className="bg-white/10 hover:bg-white/20"
              >
                Cancel
              </GlassButton>
            </div>
          ) : (
            <GlassButton
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20"
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </GlassButton>
          )}
        </div>
      </div>
    </div>
  );
};
