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
  if (!error && !interimTranscript) {
    return null;
  }

  return (
    <div className={`voice-recording-indicator ${className}`}>
      {/* Interim Transcript - Only show when there's actual transcription */}
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