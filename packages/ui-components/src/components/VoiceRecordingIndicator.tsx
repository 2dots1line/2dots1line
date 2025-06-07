/**
 * Voice Recording Indicator Component
 * Provides visual feedback during voice recording with animated pulse effect
 */

import React from 'react';

export interface VoiceRecordingIndicatorProps {
  isRecording: boolean;
  isListening?: boolean;
  error?: string;
  interimTranscript?: string;
  className?: string;
}

export const VoiceRecordingIndicator: React.FC<VoiceRecordingIndicatorProps> = ({
  isRecording,
  isListening = false,
  error,
  interimTranscript,
  className = ''
}) => {
  if (!isRecording && !error && !interimTranscript) {
    return null;
  }

  return (
    <div className={`voice-recording-indicator ${className}`}>
      {/* Recording Status */}
      {isRecording && (
        <div className="recording-status">
          <div className="recording-dot-container">
            <div className="recording-dot" />
            <div className="recording-pulse" />
          </div>
          <span className="recording-text">
            {isListening ? 'Listening...' : 'Recording...'}
          </span>
        </div>
      )}

      {/* Interim Transcript */}
      {interimTranscript && (
        <div className="interim-transcript">
          <span className="transcript-label">Hearing:</span>
          <span className="transcript-text">{interimTranscript}</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="recording-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecordingIndicator; 