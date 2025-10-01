/**
 * CosmosNavigationControls - Navigation controls for 3D cosmos view
 * V11.0 - Camera controls and navigation helpers
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Move3D,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Home,
  Search,
  Filter,
  Settings,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Play,
  Square,
  Pause,
  Info
} from 'lucide-react';
import { CosmosNavigationState } from '@2dots1line/shared-types';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';

interface CosmosNavigationControlsProps {
  // Navigation state
  cameraMode: 'free' | 'orbit' | 'follow' | 'cinematic';
  isFlying: boolean;
  isOrbiting: boolean;
  flySpeed: number;
  orbitSpeed: number;
  
  // Controls
  onCameraModeChange: (mode: 'free' | 'orbit' | 'follow' | 'cinematic') => void;
  onFlySpeedChange: (speed: number) => void;
  onOrbitSpeedChange: (speed: number) => void;
  onResetCamera: () => void;
  onStopAllMovement: () => void;
  onToggleAutoOrbit: () => void;
  
  // Movement commands
  onFlyToPosition: (position: [number, number, number]) => void;
  onMoveCamera: (direction: [number, number, number]) => void;
  
  // UI state
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  showHelp?: boolean;
  onToggleHelp?: () => void;
  
  className?: string;
  debug?: boolean;
}

export const CosmosNavigationControls: React.FC<CosmosNavigationControlsProps> = ({
  cameraMode,
  isFlying,
  isOrbiting,
  flySpeed,
  orbitSpeed,
  onCameraModeChange,
  onFlySpeedChange,
  onOrbitSpeedChange,
  onResetCamera,
  onStopAllMovement,
  onToggleAutoOrbit,
  onFlyToPosition,
  onMoveCamera,
  position = 'top-left',
  isMinimized = false,
  onToggleMinimize,
  showHelp = false,
  onToggleHelp,
  className = '',
  debug = false,
}) => {
  const [activePanel, setActivePanel] = useState<'main' | 'speed' | 'presets' | 'help'>('main');
  const [keyboardShortcuts, setKeyboardShortcuts] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
  });

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Handle keyboard state display
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keyboardShortcuts) {
        setKeyboardShortcuts(prev => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keyboardShortcuts) {
        setKeyboardShortcuts(prev => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardShortcuts]);

  // Movement handlers
  const handleDirectionalMove = useCallback((direction: [number, number, number]) => {
    onMoveCamera(direction);
    if (debug) console.log('🎮 CosmosNavigationControls: Directional move', direction);
  }, [onMoveCamera, debug]);

  // Quick position presets
  const positionPresets = [
    { name: 'Overview', position: [0, 500, 1000] as [number, number, number], icon: Eye },
    { name: 'Close', position: [0, 100, 200] as [number, number, number], icon: ZoomIn },
    { name: 'Side', position: [1000, 0, 0] as [number, number, number], icon: Move3D },
    { name: 'Top', position: [0, 1000, 0] as [number, number, number], icon: Info },
  ];

  // Camera mode configs
  const cameraModes = [
    { id: 'free', label: 'Free', icon: Eye, description: 'Free camera movement' },
    { id: 'orbit', label: 'Orbit', icon: RotateCcw, description: 'Orbit around target' },
    { id: 'follow', label: 'Follow', icon: EyeOff, description: 'Follow selected node' },
    { id: 'cinematic', label: 'Cinematic', icon: Info, description: 'Cinematic camera paths' },
  ] as const;

  if (isMinimized) {
    return (
      <div className={`fixed z-40 ${positionClasses[position]} ${className}`}>
        <GlassButton
          onClick={onToggleMinimize}
          className="p-3 hover:bg-white/20"
        >
          <Minimize2 size={20} className="stroke-current" />
        </GlassButton>
      </div>
    );
  }

  return (
    <div className={`fixed z-40 ${positionClasses[position]} ${className}`}>
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="lg"
        padding="sm"
        className="w-64 max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Minimize2 size={18} className="text-white/70" />
            <span className="text-sm font-medium text-white">Navigation</span>
          </div>
          <div className="flex items-center gap-1">
            {onToggleHelp && (
              <GlassButton
                onClick={onToggleHelp}
                className={`p-1 ${showHelp ? 'text-white' : 'text-white/70'} hover:bg-white/20`}
              >
                <Info size={14} className="stroke-current" />
              </GlassButton>
            )}
            {onToggleMinimize && (
              <GlassButton
                onClick={onToggleMinimize}
                className="p-1 text-white/70 hover:bg-white/20"
              >
                <Settings size={14} className="stroke-current" />
              </GlassButton>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
            isFlying ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/70'
          }`}>
            <Play size={12} />
            <span>Flying</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
            isOrbiting ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/70'
          }`}>
            <RotateCcw size={12} />
            <span>Orbiting</span>
          </div>
        </div>

        {/* Panel Content */}
        <div className="space-y-3">
          {/* Main Panel */}
          {activePanel === 'main' && (
            <>
              {/* Camera Mode */}
              <div>
                <label className="text-xs text-white/70 mb-2 block">Camera Mode</label>
                <div className="grid grid-cols-2 gap-1">
                  {cameraModes.map((mode) => (
                    <GlassButton
                      key={mode.id}
                      onClick={() => onCameraModeChange(mode.id)}
                      className={`p-2 text-xs ${
                        cameraMode === mode.id
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <mode.icon size={14} className="mb-1" />
                      <span>{mode.label}</span>
                    </GlassButton>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="text-xs text-white/70 mb-2 block">Quick Actions</label>
                <div className="grid grid-cols-3 gap-1">
                  <GlassButton
                    onClick={onResetCamera}
                    className="p-2 text-xs text-white/70 hover:bg-white/20"
                  >
                    <Home size={14} className="mb-1" />
                    <span>Reset</span>
                  </GlassButton>
                  <GlassButton
                    onClick={onStopAllMovement}
                    className="p-2 text-xs text-white/70 hover:bg-white/20"
                  >
                    <Square size={14} className="mb-1" />
                    <span>Stop</span>
                  </GlassButton>
                  <GlassButton
                    onClick={onToggleAutoOrbit}
                    className="p-2 text-xs text-white/70 hover:bg-white/20"
                  >
                    <Pause size={14} className="mb-1" />
                    <span>Auto</span>
                  </GlassButton>
                </div>
              </div>

              {/* Panel Navigation */}
              <div className="flex gap-1">
                <GlassButton
                  onClick={() => setActivePanel('speed')}
                  className="flex-1 p-2 text-xs text-white/70 hover:bg-white/20"
                >
                  Speed
                </GlassButton>
                <GlassButton
                  onClick={() => setActivePanel('presets')}
                  className="flex-1 p-2 text-xs text-white/70 hover:bg-white/20"
                >
                  Presets
                </GlassButton>
                <GlassButton
                  onClick={() => setActivePanel('help')}
                  className="flex-1 p-2 text-xs text-white/70 hover:bg-white/20"
                >
                  Help
                </GlassButton>
              </div>
            </>
          )}

          {/* Speed Panel */}
          {activePanel === 'speed' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white">Speed Settings</span>
                <GlassButton
                  onClick={() => setActivePanel('main')}
                  className="p-1 text-white/70 hover:bg-white/20"
                >
                  <Minimize2 size={14} />
                </GlassButton>
              </div>

              {/* Fly Speed */}
              <div>
                <label className="text-xs text-white/70 mb-2 block">
                  Fly Speed: {flySpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={flySpeed}
                  onChange={(e) => onFlySpeedChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Orbit Speed */}
              <div>
                <label className="text-xs text-white/70 mb-2 block">
                  Orbit Speed: {orbitSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={orbitSpeed}
                  onChange={(e) => onOrbitSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Speed Presets */}
              <div className="grid grid-cols-3 gap-1">
                <GlassButton
                  onClick={() => onFlySpeedChange(0.5)}
                  className="p-2 text-xs text-white/70 hover:bg-white/20"
                >
                  Slow
                </GlassButton>
                <GlassButton
                  onClick={() => onFlySpeedChange(2)}
                  className="p-2 text-xs text-white/70 hover:bg-white/20"
                >
                  Normal
                </GlassButton>
                <GlassButton
                  onClick={() => onFlySpeedChange(5)}
                  className="p-2 text-xs text-white/70 hover:bg-white/20"
                >
                  Fast
                </GlassButton>
              </div>
            </>
          )}

          {/* Presets Panel */}
          {activePanel === 'presets' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white">Position Presets</span>
                <GlassButton
                  onClick={() => setActivePanel('main')}
                  className="p-1 text-white/70 hover:bg-white/20"
                >
                  <Minimize2 size={14} />
                </GlassButton>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {positionPresets.map((preset) => (
                  <GlassButton
                    key={preset.name}
                    onClick={() => onFlyToPosition(preset.position)}
                    className="p-2 text-xs text-white/70 hover:bg-white/20"
                  >
                    <preset.icon size={14} className="mb-1" />
                    <span>{preset.name}</span>
                  </GlassButton>
                ))}
              </div>

              {/* Manual Position Input */}
              <div>
                <label className="text-xs text-white/70 mb-2 block">Manual Position</label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    placeholder="X"
                    className="p-1 text-xs bg-white/10 text-white rounded border border-white/20 focus:border-white/40"
                  />
                  <input
                    type="number"
                    placeholder="Y"
                    className="p-1 text-xs bg-white/10 text-white rounded border border-white/20 focus:border-white/40"
                  />
                  <input
                    type="number"
                    placeholder="Z"
                    className="p-1 text-xs bg-white/10 text-white rounded border border-white/20 focus:border-white/40"
                  />
                </div>
              </div>
            </>
          )}

          {/* Help Panel */}
          {activePanel === 'help' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white">Keyboard Shortcuts</span>
                <GlassButton
                  onClick={() => setActivePanel('main')}
                  className="p-1 text-white/70 hover:bg-white/20"
                >
                  <Minimize2 size={14} />
                </GlassButton>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Movement:</span>
                  <div className="flex gap-1">
                    {['w', 'a', 's', 'd'].map((key) => (
                      <span
                        key={key}
                        className={`px-2 py-1 rounded ${
                          keyboardShortcuts[key as keyof typeof keyboardShortcuts]
                            ? 'bg-white/30 text-white'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {key.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/70">Vertical:</span>
                  <div className="flex gap-1">
                    {['q', 'e'].map((key) => (
                      <span
                        key={key}
                        className={`px-2 py-1 rounded ${
                          keyboardShortcuts[key as keyof typeof keyboardShortcuts]
                            ? 'bg-white/30 text-white'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {key.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 mt-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">Reset Camera:</span>
                    <span className="text-white/70">R</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Stop Movement:</span>
                    <span className="text-white/70">ESC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Double-click Node:</span>
                    <span className="text-white/70">Fly To</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </GlassmorphicPanel>
    </div>
  );
}; 