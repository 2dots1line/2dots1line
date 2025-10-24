/**
 * Demo component for useTextToSpeech hook
 * Shows how to use the TTS functionality with both English and Chinese text
 */

import React, { useState } from 'react';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { GlassmorphicPanel, GlassButton } from '../index';

export const TextToSpeechDemo: React.FC = () => {
  const [selectedText, setSelectedText] = useState('english');
  
  const { speak, stop, isSpeaking, isSupported, availableVoices, selectedVoice } = useTextToSpeech({
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8
  });

  const sampleTexts = {
    english: "Hello! This is a demonstration of the text-to-speech functionality. The system can automatically detect the language and select the appropriate voice for reading the content aloud.",
    chinese: "你好！这是文本转语音功能的演示。系统可以自动检测语言并选择合适的声音来朗读内容。",
    mixed: "Hello 你好! This is a mixed language test 这是混合语言测试. The system should detect Chinese characters 系统应该检测中文字符 and use the appropriate voice 并使用合适的声音."
  };

  const handleSpeak = () => {
    const text = sampleTexts[selectedText as keyof typeof sampleTexts];
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  if (!isSupported) {
    return (
      <GlassmorphicPanel variant="glass-panel" rounded="lg" padding="lg">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white/90 mb-4">Text-to-Speech Demo</h3>
          <p className="text-white/70">
            Speech synthesis is not supported in this browser. 
            Please try Chrome, Safari, or Firefox.
          </p>
        </div>
      </GlassmorphicPanel>
    );
  }

  return (
    <GlassmorphicPanel variant="glass-panel" rounded="lg" padding="lg">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white/90 mb-2">Text-to-Speech Demo</h3>
          <p className="text-white/70 text-sm">
            Demonstrates automatic language detection and voice selection
          </p>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/80">Select sample text:</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(sampleTexts).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedText(key)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  selectedText === key
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sample Text Display */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Sample text:</label>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/90 text-sm leading-relaxed">
              {sampleTexts[selectedText as keyof typeof sampleTexts]}
            </p>
          </div>
        </div>

        {/* TTS Controls */}
        <div className="flex items-center justify-center space-x-4">
          <GlassButton
            onClick={handleSpeak}
            className="flex items-center gap-2 px-6 py-3"
          >
            {isSpeaking ? (
              <>
                <span>⏸️</span>
                <span>Pause</span>
              </>
            ) : (
              <>
                <span>▶️</span>
                <span>Listen</span>
              </>
            )}
          </GlassButton>
          
          {isSpeaking && (
            <GlassButton
              onClick={stop}
              className="flex items-center gap-2 px-4 py-2 text-sm"
            >
              <span>⏹️</span>
              <span>Stop</span>
            </GlassButton>
          )}
        </div>

        {/* Voice Information */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Voice information:</label>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/70 text-sm">
              <strong>Selected voice:</strong> {selectedVoice?.name || 'Auto-selected'}
            </p>
            <p className="text-white/70 text-sm">
              <strong>Available voices:</strong> {availableVoices.length}
            </p>
            <p className="text-white/70 text-sm">
              <strong>Language detection:</strong> Automatic based on text content
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-white/60 text-xs">
            The system automatically detects Chinese characters (中文字符) and selects 
            appropriate voices for English and Chinese content.
          </p>
        </div>
      </div>
    </GlassmorphicPanel>
  );
};
