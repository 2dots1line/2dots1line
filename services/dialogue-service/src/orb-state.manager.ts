/**
 * Orb State Manager
 * Manages Orb visual and emotional state for DialogueAgent
 */

export type OrbVisualState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'processing' | 'error_pulse';
export type OrbEmotionalTone = 'neutral' | 'excited' | 'concerned' | 'empathetic' | 'curious' | 'supportive';

export interface OrbVisualStateData {
  visualState: OrbVisualState;
  emotionalTone: OrbEmotionalTone;
  isSpeaking: boolean;
  isProcessing: boolean;
  currentActivity: string | null;
  lastUpdate: string;
  metadata: Record<string, unknown>;
}

export interface OrbStateUpdate {
  visualState?: OrbVisualState;
  emotionalTone?: OrbEmotionalTone;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  currentActivity?: string | null;
  metadata?: Record<string, unknown>;
}

export class OrbStateManager {
  private currentState: OrbVisualStateData;
  private stateUpdateCallbacks: Array<(state: OrbVisualStateData) => void> = [];

  constructor(initialState?: Partial<OrbVisualStateData>) {
    this.currentState = {
      visualState: 'idle',
      emotionalTone: 'neutral',
      isSpeaking: false,
      isProcessing: false,
      currentActivity: null,
      lastUpdate: new Date().toISOString(),
      metadata: {},
      ...initialState
    };
  }

  /**
   * Update Orb state and notify listeners
   */
  updateState(update: OrbStateUpdate): OrbVisualStateData {
    const previousState = { ...this.currentState };
    
    this.currentState = {
      ...this.currentState,
      ...update,
      lastUpdate: new Date().toISOString(),
      metadata: {
        ...this.currentState.metadata,
        ...update.metadata
      }
    };

    // Log state changes for debugging
    console.log('OrbStateManager: State updated', {
      from: {
        visualState: previousState.visualState,
        emotionalTone: previousState.emotionalTone
      },
      to: {
        visualState: this.currentState.visualState,
        emotionalTone: this.currentState.emotionalTone
      },
      activity: this.currentState.currentActivity
    });

    // Notify all registered callbacks
    this.stateUpdateCallbacks.forEach(callback => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.error('Error in OrbState callback:', error);
      }
    });

    return { ...this.currentState };
  }

  /**
   * Get current state
   */
  getCurrentState(): OrbVisualStateData {
    return { ...this.currentState };
  }

  /**
   * Register callback for state updates
   */
  onStateUpdate(callback: (state: OrbVisualStateData) => void): () => void {
    this.stateUpdateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.stateUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Convenience methods for common state changes
   */
  setListening(): OrbVisualStateData {
    return this.updateState({
      visualState: 'listening',
      emotionalTone: 'curious',
      isProcessing: false,
      currentActivity: 'Listening to user input'
    });
  }

  setThinking(): OrbVisualStateData {
    return this.updateState({
      visualState: 'thinking',
      emotionalTone: 'neutral',
      isProcessing: true,
      currentActivity: 'Processing and understanding'
    });
  }

  setSpeaking(responseText?: string): OrbVisualStateData {
    return this.updateState({
      visualState: 'speaking',
      emotionalTone: 'supportive',
      isSpeaking: true,
      isProcessing: false,
      currentActivity: 'Responding to user',
      metadata: responseText ? { lastResponse: responseText.substring(0, 100) } : {}
    });
  }

  setProcessingFile(filename?: string): OrbVisualStateData {
    return this.updateState({
      visualState: 'processing',
      emotionalTone: 'curious',
      isProcessing: true,
      currentActivity: `Processing ${filename ? `file: ${filename}` : 'uploaded content'}`
    });
  }

  setError(errorMessage?: string): OrbVisualStateData {
    return this.updateState({
      visualState: 'error_pulse',
      emotionalTone: 'concerned',
      isProcessing: false,
      currentActivity: 'Encountered an issue',
      metadata: errorMessage ? { lastError: errorMessage } : {}
    });
  }

  setIdle(): OrbVisualStateData {
    return this.updateState({
      visualState: 'idle',
      emotionalTone: 'neutral',
      isSpeaking: false,
      isProcessing: false,
      currentActivity: null
    });
  }
} 