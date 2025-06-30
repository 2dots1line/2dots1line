/**
 * AudioTranscribeTool.ts
 * Tool for transcribing audio content to text using Google Speech-to-Text
 */

import { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/tool-registry';
import * as fs from 'fs';

export interface AudioTranscribeInputPayload {
  /** Audio file path or buffer */
  audioData: Buffer | string;
  /** Audio format */
  format?: 'wav' | 'mp3' | 'flac' | 'webm' | 'ogg';
  /** Language code (e.g., 'en-US', 'zh-CN') */
  language?: string;
  /** Sample rate in Hz */
  sampleRate?: number;
}

export interface AudioTranscribeResult {
  /** Transcribed text */
  transcript: string;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Detected language */
  language?: string;
  /** Duration in seconds */
  duration?: number;
  /** Alternative transcriptions */
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export type AudioTranscribeToolInput = TToolInput<AudioTranscribeInputPayload>;
export type AudioTranscribeToolOutput = TToolOutput<AudioTranscribeResult>;

// Tool manifest for registry discovery
const manifest: IToolManifest<AudioTranscribeInputPayload, AudioTranscribeResult> = {
  name: 'audio.transcribe',
  description: 'Transcribe audio content to text using Google Speech-to-Text',
  version: '2.0.0',
  availableRegions: ['us', 'cn'],
  categories: ['audio', 'transcription', 'speech_processing'],
  capabilities: ['speech_to_text', 'audio_transcription'],
  validateInput: (input: AudioTranscribeToolInput) => {
    const valid = !!input?.payload?.audioData;
    return { 
      valid, 
      errors: valid ? [] : ['Missing audioData in payload'] 
    };
  },
  validateOutput: (output: AudioTranscribeToolOutput) => {
    const valid = !!output?.result?.transcript && typeof output.result.transcript === 'string';
    return { 
      valid, 
      errors: valid ? [] : ['Missing transcript in result'] 
    };
  },
  performance: {
    avgLatencyMs: 3000,
    isAsync: true,
    isIdempotent: true
  },
  limitations: [
    'Requires Google Cloud credentials',
    'Audio files should be under 60 seconds for sync processing',
    'Supported formats: WAV, MP3, FLAC, WEBM, OGG'
  ]
};

class AudioTranscribeToolImpl implements IExecutableTool<AudioTranscribeInputPayload, AudioTranscribeResult> {
  manifest = manifest;

  async execute(input: AudioTranscribeToolInput): Promise<AudioTranscribeToolOutput> {
    const startTime = Date.now();
    
    try {
      console.log('AudioTranscribeTool: Starting audio transcription...');
      
      // Check if Google Cloud credentials are available
      const hasGoogleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT;
      
      if (!hasGoogleCredentials) {
        console.warn('AudioTranscribeTool: Google Cloud credentials not found, using fallback transcription');
        return this.fallbackTranscription(input.payload, startTime);
      }
      
      // Use Google Speech-to-Text API
      const transcriptionResult = await this.transcribeWithGoogle(input.payload);
      
      const processingTime = Date.now() - startTime;
      
      return {
        status: 'success',
        result: transcriptionResult,
        metadata: {
          processing_time_ms: processingTime,
          api_used: 'google_speech_to_text'
        }
      };
      
    } catch (error) {
      console.error('AudioTranscribeTool error:', error);
      
      // Fallback to basic transcription on error
      try {
        console.warn('AudioTranscribeTool: API failed, using fallback transcription');
        return this.fallbackTranscription(input.payload, startTime);
      } catch (fallbackError) {
        const processingTime = Date.now() - startTime;
        
        return {
          status: 'error',
          error: {
            code: 'AUDIO_TRANSCRIPTION_ERROR',
            message: error instanceof Error ? error.message : 'Audio transcription failed',
            details: { 
              tool: this.manifest.name,
              fallback_attempted: true
            }
          },
          metadata: {
            processing_time_ms: processingTime
          }
        };
      }
    }
  }

  private async transcribeWithGoogle(payload: AudioTranscribeInputPayload): Promise<AudioTranscribeResult> {
    // Dynamic import for optional dependency with proper error handling
    let speech: any;
    try {
      // Use require for dynamic loading to avoid TypeScript compilation issues
      speech = require('@google-cloud/speech');
    } catch (importError) {
      console.warn('AudioTranscribeTool: @google-cloud/speech not available, falling back');
      throw new Error('Google Cloud Speech-to-Text library not installed');
    }
    
    const client = new speech.SpeechClient();
    
    // Prepare audio data
    let audioBytes: Buffer;
    if (typeof payload.audioData === 'string') {
      // Assume it's a file path
      audioBytes = fs.readFileSync(payload.audioData);
    } else {
      audioBytes = payload.audioData;
    }
    
    // Configure request
    const request = {
      audio: {
        content: audioBytes.toString('base64'),
      },
      config: {
        encoding: this.getGoogleEncoding(payload.format || 'wav'),
        sampleRateHertz: payload.sampleRate || 16000,
        languageCode: payload.language || 'en-US',
        enableAutomaticPunctuation: true,
        enableWordConfidence: true,
        maxAlternatives: 3,
      },
    };
    
    console.log('AudioTranscribeTool: Sending request to Google Speech-to-Text...');
    const [response] = await client.recognize(request);
    
    if (!response.results || response.results.length === 0) {
      throw new Error('No transcription results returned from Google Speech-to-Text');
    }
    
    const result = response.results[0];
    const bestAlternative = result.alternatives?.[0];
    
    if (!bestAlternative) {
      throw new Error('No transcription alternatives found');
    }
    
    // Extract alternatives with proper typing
    const alternatives = result.alternatives?.slice(1).map((alt: any) => ({
      transcript: alt.transcript || '',
      confidence: alt.confidence || 0
    })) || [];
    
    return {
      transcript: bestAlternative.transcript || '',
      confidence: bestAlternative.confidence || 0,
      language: payload.language || 'en-US',
      alternatives
    };
  }
  
  private getGoogleEncoding(format: string): any {
    // Map common formats to Google Speech-to-Text encoding types
    const encodingMap: Record<string, string> = {
      'wav': 'LINEAR16',
      'mp3': 'MP3',
      'flac': 'FLAC',
      'webm': 'WEBM_OPUS',
      'ogg': 'OGG_OPUS'
    };
    
    return encodingMap[format.toLowerCase()] || 'LINEAR16';
  }
  
  private async fallbackTranscription(
    payload: AudioTranscribeInputPayload, 
    startTime: number
  ): Promise<AudioTranscribeToolOutput> {
    // Simple fallback that returns a placeholder transcription
    console.log('AudioTranscribeTool: Using fallback transcription (placeholder)');
    
    const processingTime = Date.now() - startTime;
    
    // In a real implementation, this could use a local speech recognition library
    // or return a meaningful error message
    const fallbackText = "[Audio transcription unavailable - Google Cloud Speech-to-Text not configured]";
    
    return {
      status: 'success',
      result: {
        transcript: fallbackText,
        confidence: 0.1,
        language: payload.language || 'en-US',
        duration: 0
      },
      metadata: {
        processing_time_ms: processingTime,
        api_used: 'fallback',
        warnings: ['Google Cloud Speech-to-Text not available, using placeholder transcription']
      }
    };
  }
}

// Export the tool instance
export const AudioTranscribeTool: IExecutableTool<AudioTranscribeInputPayload, AudioTranscribeResult> = new AudioTranscribeToolImpl(); 