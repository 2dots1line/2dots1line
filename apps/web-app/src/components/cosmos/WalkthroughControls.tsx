import React, { useState, useEffect } from 'react';
import { WalkthroughStep } from '@2dots1line/shared-types';

interface WalkthroughControlsProps {
  walkthroughScript: WalkthroughStep[];
  reflectiveQuestion: string;
  onStepChange?: (step: WalkthroughStep) => void;
  onCameraMove?: (position: [number, number, number], target: [number, number, number]) => void;
  onEntityHighlight?: (entityId: string, color: string) => void;
}

const WalkthroughControls: React.FC<WalkthroughControlsProps> = ({
  walkthroughScript,
  reflectiveQuestion,
  onStepChange,
  onCameraMove,
  onEntityHighlight
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = walkthroughScript[currentStepIndex];

  // Auto-play walkthrough
  useEffect(() => {
    if (isPlaying && currentStep && !isCompleted) {
      const timer = setTimeout(() => {
        // Trigger camera movement
        if (onCameraMove && currentStep.camera_position && currentStep.camera_target) {
          onCameraMove(currentStep.camera_position, currentStep.camera_target);
        }

        // Trigger entity highlighting
        if (onEntityHighlight && currentStep.focus_entity_id && currentStep.highlight_color) {
          onEntityHighlight(currentStep.focus_entity_id, currentStep.highlight_color);
        }

        // Notify step change
        if (onStepChange) {
          onStepChange(currentStep);
        }

        // Move to next step
        if (currentStepIndex < walkthroughScript.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsCompleted(true);
          setIsPlaying(false);
        }
      }, currentStep.duration_seconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStepIndex, currentStep, walkthroughScript.length, onCameraMove, onEntityHighlight, onStepChange, isCompleted]);

  const startWalkthrough = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setIsCompleted(false);
  };

  const pauseWalkthrough = () => {
    setIsPlaying(false);
  };

  const resumeWalkthrough = () => {
    setIsPlaying(true);
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    setIsPlaying(false);
    
    const step = walkthroughScript[stepIndex];
    if (step) {
      if (onCameraMove && step.camera_position && step.camera_target) {
        onCameraMove(step.camera_position, step.camera_target);
      }
      if (onEntityHighlight && step.focus_entity_id && step.highlight_color) {
        onEntityHighlight(step.focus_entity_id, step.highlight_color);
      }
      if (onStepChange) {
        onStepChange(step);
      }
    }
  };

  const resetWalkthrough = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setIsCompleted(false);
  };

  if (walkthroughScript.length === 0) {
    return null;
  }

  return (
    <div className="walkthrough-controls bg-black/40 backdrop-blur-md rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🎬 Interactive Walkthrough</h3>
        <div className="flex space-x-2">
          {!isPlaying && !isCompleted && (
            <button
              onClick={startWalkthrough}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
            >
              ▶️ Start Tour
            </button>
          )}
          {isPlaying && (
            <button
              onClick={pauseWalkthrough}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition-colors"
            >
              ⏸️ Pause
            </button>
          )}
          {!isPlaying && !isCompleted && currentStepIndex > 0 && (
            <button
              onClick={resumeWalkthrough}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
            >
              ▶️ Resume
            </button>
          )}
          <button
            onClick={resetWalkthrough}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Step {currentStepIndex + 1} of {walkthroughScript.length}</span>
          <span>{isCompleted ? 'Completed' : isPlaying ? 'Playing...' : 'Paused'}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / walkthroughScript.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step Display */}
      {currentStep && (
        <div className="mb-4 p-3 bg-white/10 rounded-lg">
          <h4 className="font-semibold text-blue-300 mb-2">{currentStep.title}</h4>
          <p className="text-sm text-white/90 mb-2">{currentStep.description}</p>
          {currentStep.focus_entity_id && currentStep.focus_entity_id !== 'overview' && (
            <div className="text-xs text-blue-200">
              🎯 Focusing on: {currentStep.focus_entity_id}
            </div>
          )}
          {currentStep.duration_seconds && (
            <div className="text-xs text-white/60 mt-1">
              ⏱️ Duration: {currentStep.duration_seconds}s
            </div>
          )}
        </div>
      )}

      {/* Step Navigation */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {walkthroughScript.map((step, index) => (
            <button
              key={step.step_number}
              onClick={() => goToStep(index)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                index === currentStepIndex
                  ? 'bg-blue-600 text-white'
                  : index < currentStepIndex
                  ? 'bg-green-600/50 text-white'
                  : 'bg-white/20 text-white/70 hover:bg-white/30'
              }`}
            >
              {step.step_number}. {step.title}
            </button>
          ))}
        </div>
      </div>

      {/* Reflective Question */}
      {isCompleted && reflectiveQuestion && (
        <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
          <h4 className="font-semibold text-purple-300 mb-2">🤔 Reflection</h4>
          <p className="text-sm text-white/90">{reflectiveQuestion}</p>
        </div>
      )}
    </div>
  );
};

export default WalkthroughControls;
