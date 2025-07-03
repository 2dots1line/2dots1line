/**
 * useVoiceRecording Hook
 * Based on legacy voice-recognition.js but modernized for React/TypeScript
 * Provides voice-to-text functionality with error handling and browser compatibility
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// TypeScript declarations for SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface VoiceRecordingState {
  isRecording: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isInitializing: boolean;
}

interface VoiceRecordingControls {
  startRecording: () => void;
  stopRecording: () => void;
  abortRecording: () => void;
  toggleRecording: () => void;
  clearTranscript: () => void;
  appendToInput: (inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export interface UseVoiceRecordingOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxDuration?: number; // in milliseconds
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): VoiceRecordingState & VoiceRecordingControls {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    maxDuration = 120000, // 2 minutes
    onResult,
    onError
  } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isInitializing: true
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const maxAttempts = 3;

  // Check browser support and initialize
  useEffect(() => {
    console.log('🎤 useVoiceRecording - Initializing...');
    
    const initializeSpeechRecognition = async () => {
      try {
        setState(prev => ({ ...prev, isInitializing: true }));

        // Check browser support first
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          throw new Error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
        }

        // Check microphone permissions
        try {
          console.log('🎤 useVoiceRecording - Checking microphone permissions...');
          
          if ('permissions' in navigator) {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            console.log('🎤 useVoiceRecording - Permission status:', permissionStatus.state);
            
            if (permissionStatus.state === 'denied') {
              throw new Error('Microphone access is denied. Please enable microphone permissions in your browser settings and refresh the page.');
            }
          }
        } catch (permError) {
          console.warn('🎤 useVoiceRecording - Could not check permissions:', permError);
          // Continue anyway - we'll handle the error when starting recording
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        // Configure recognition settings
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;

        // Set up event handlers
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started successfully');
          setState(prev => ({ ...prev, isRecording: true, error: null }));
          
          // Set timeout for auto-stop
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            stopRecording();
            const errorMsg = `Recording automatically stopped after ${maxDuration / 1000} seconds`;
            setState(prev => ({ ...prev, error: errorMsg }));
            onError?.(errorMsg);
          }, maxDuration);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('🎤 Speech recognition error:', event.error, event);
          
          let errorMessage = '';
          let isRetryable = false;
          
          switch(event.error) {
            case 'not-allowed':
            case 'permission-denied':
              errorMessage = 'Microphone access was denied. Please check your browser permissions and try again.';
              break;
            case 'no-speech':
              errorMessage = 'No speech was detected. Please try again.';
              isRetryable = true;
              break;
            case 'audio-capture':
              errorMessage = 'No microphone was found. Please ensure your microphone is connected.';
              break;
            case 'network':
              errorMessage = 'Network error occurred. Please check your internet connection.';
              isRetryable = true;
              break;
            case 'aborted':
              errorMessage = 'Recording was aborted. Please try again.';
              isRetryable = true;
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service is not allowed. Please enable it in browser settings.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
              isRetryable = true;
          }
          
          console.log(`🎤 Error details - Code: ${event.error}, Retryable: ${isRetryable}, Attempts: ${attemptCountRef.current}`);
          
          setState(prev => ({ 
            ...prev, 
            isRecording: false, 
            error: errorMessage,
            interimTranscript: ''
          }));
          onError?.(errorMessage);
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };

        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          setState(prev => ({ 
            ...prev, 
            isRecording: false,
            interimTranscript: '' 
          }));
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setState(prev => ({
            ...prev,
            transcript: prev.transcript + finalTranscript,
            interimTranscript
          }));

          if (finalTranscript) {
            console.log('🎤 Final transcript:', finalTranscript);
            onResult?.(finalTranscript, true);
            
            // Reset attempt counter on successful recognition
            attemptCountRef.current = 0;
          } else if (interimTranscript) {
            console.log('🎤 Interim transcript:', interimTranscript);
            onResult?.(interimTranscript, false);
          }
        };

        recognitionRef.current = recognition;
        setState(prev => ({
          ...prev,
          isSupported: true,
          isInitializing: false,
          error: null
        }));

        console.log('🎤 useVoiceRecording - Initialization complete');

      } catch (error) {
        console.error('🎤 Error initializing speech recognition:', error);
        setState(prev => ({
          ...prev,
          isSupported: false,
          isInitializing: false,
          error: `Failed to initialize speech recognition: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    };

    initializeSpeechRecognition();

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [continuous, interimResults, language, maxDuration, onResult, onError]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current || !state.isSupported || state.isRecording) {
      return;
    }

    if (attemptCountRef.current >= maxAttempts) {
      const errorMsg = `Maximum recording attempts (${maxAttempts}) reached. Please refresh the page.`;
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      return;
    }

    try {
      attemptCountRef.current++;
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      const errorMsg = `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
    }
  }, [state.isSupported, state.isRecording, onError]);

  const stopRecording = useCallback(() => {
    console.log('🎤 stopRecording called, current recognitionRef:', !!recognitionRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('🎤 Recognition.stop() called successfully');
      } catch (error) {
        console.error('🎤 Error stopping recognition:', error);
        // Force state update even if stop() fails
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          interimTranscript: '' 
        }));
      }
    } else {
      console.warn('🎤 No recognition instance to stop');
      // Force state reset if no recognition instance
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        interimTranscript: '' 
      }));
    }
    
    // Clear timeout regardless
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []); // Remove dependency on state.isRecording

  const abortRecording = useCallback(() => {
    console.log('🎤 abortRecording called - Force stopping');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        console.log('🎤 Recognition.abort() called successfully');
      } catch (error) {
        console.error('🎤 Error aborting recognition:', error);
      }
    }
    
    // Force state reset
    setState(prev => ({ 
      ...prev, 
      isRecording: false,
      interimTranscript: '',
      error: null
    }));
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const toggleRecording = useCallback(() => {
    console.log('🎤 toggleRecording called, current state:', {
      isRecording: state.isRecording,
      isSupported: state.isSupported,
      hasRecognition: !!recognitionRef.current
    });
    
    if (state.isRecording) {
      console.log('🎤 toggleRecording - Currently recording, will stop');
      stopRecording();
    } else {
      console.log('🎤 toggleRecording - Not recording, will start');
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null
    }));
  }, []);

  const appendToInput = useCallback((inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    if (inputRef.current && state.transcript) {
      const currentValue = inputRef.current.value;
      const newValue = currentValue + (currentValue ? ' ' : '') + state.transcript;
      inputRef.current.value = newValue;
      
      // Trigger change event
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
      
      clearTranscript();
    }
  }, [state.transcript, clearTranscript]);

  return {
    ...state,
    startRecording,
    stopRecording,
    abortRecording,
    toggleRecording,
    clearTranscript,
    appendToInput
  };
}

export default useVoiceRecording; 