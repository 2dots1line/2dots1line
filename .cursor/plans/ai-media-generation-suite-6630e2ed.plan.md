<!-- 6630e2ed-e1e9-49c7-874e-9f96415b472d ef61dce3-aae0-4335-9986-df9c0e623668 -->
# AI Media & Multimodal Interaction Suite

## Architecture Overview

This plan implements **Option A: Full Media Generation Suite** with extended multimodal capabilities:

- **Image Generation**: Nano-Banana (low-cost) + Imagen 4 (quality)
- **Video Generation**: Veo 3 + Veo 3 Fast for background videos
- **Live Voice Interaction**: Real-time bidirectional voice chat with human-like responses
- **Video Input**: Upload or real-time webcam capture for AI understanding
- **Search Grounding**: Up-to-date information via Google Search integration
- **Agent Capability Framework**: All features accessible via conversational prompting

---

## Phase 1: Foundation - Configuration & Service Layer (2 days)

### 1.1 Create Media Generation Configuration

**File**: `config/media_generation.json` (NEW)

```json
{
  "version": "1.0",
  "models": {
    "image": {
      "nano_banana": {
        "name": "gemini-2.5-flash-image",
        "cost_per_image": "$0.001",
        "use_cases": ["card_covers_auto", "thumbnails", "previews"],
        "quality": "medium",
        "speed": "fast"
      },
      "imagen_4": {
        "name": "imagen-4.0-generate-001",
        "cost_per_image": "$0.04",
        "use_cases": ["card_covers_manual", "hero_images", "high_quality"],
        "quality": "high",
        "speed": "medium"
      },
      "imagen_4_fast": {
        "name": "imagen-4.0-fast-generate-001",
        "cost_per_image": "$0.02",
        "use_cases": ["card_covers_batch", "rapid_iteration"],
        "quality": "medium-high",
        "speed": "fast"
      }
    },
    "video": {
      "veo_3": {
        "name": "veo-3.0-generate-001",
        "cost_per_second": "$0.75",
        "cost_per_8s_video": "$6.00",
        "use_cases": ["cinematic_backgrounds", "premium_content"],
        "quality": "high",
        "latency_range": "30s-6min"
      },
      "veo_3_fast": {
        "name": "veo-3.0-fast-generate-001",
        "cost_per_second": "$0.50",
        "cost_per_8s_video": "$4.00",
        "use_cases": ["background_videos", "rapid_prototyping"],
        "quality": "medium-high",
        "latency_range": "11s-2min"
      }
    },
    "live": {
      "gemini_live_native_audio": {
        "name": "gemini-live-2.5-flash-preview-native-audio",
        "input_cost": "$1.00 per 1M tokens",
        "output_cost": "$3.00 per 1M tokens",
        "capabilities": ["voice_input", "voice_output", "video_input", "interruption"],
        "languages": 24
      }
    }
  },
  "default_models": {
    "card_cover_auto": "nano_banana",
    "card_cover_manual": "imagen_4",
    "background_video": "veo_3_fast",
    "voice_chat": "gemini_live_native_audio"
  },
  "prompt_templates": {
    "card_cover": {
      "base": "Create a simple centered silhouette cover image for: \"{motif}\".",
      "style_modifiers": {
        "minimal": "Clean, minimalist design with negative space.",
        "abstract": "Abstract geometric patterns, modern aesthetic.",
        "nature": "Organic forms inspired by nature, flowing lines.",
        "cosmic": "Ethereal, space-inspired, mystical colors."
      },
      "constraints": ["No text", "No watermark", "High contrast", "Clean background"]
    },
    "background_video": {
      "base": "Create a looping 8-second background video: {description}.",
      "cinematography": "Slow, smooth camera movement. Cinematic framing.",
      "mood_presets": {
        "calm": "Gentle, peaceful atmosphere. Soft lighting. Tranquil ambiance.",
        "energetic": "Dynamic movement. Vibrant colors. Uplifting energy.",
        "mysterious": "Moody lighting. Ethereal fog. Enigmatic atmosphere.",
        "focused": "Clean, organized space. Neutral tones. Minimal distraction."
      }
    }
  }
}
```

### 1.2 Create Unified Media Generation Service

**File**: `services/media-generation-service/src/MediaGenerationService.ts` (NEW PACKAGE)

```typescript
import { GoogleGenAI } from '@google/genai';
import { environmentLoader } from '@2dots1line/core-utils';
import fs from 'fs';
import path from 'path';

interface ImageGenParams {
  motif: string;
  model?: 'nano_banana' | 'imagen_4' | 'imagen_4_fast';
  styleHints?: string[];
  palette?: Record<string, string>;
}

interface VideoGenParams {
  prompt: string;
  model?: 'veo_3' | 'veo_3_fast';
  startingImage?: Buffer;
  mood?: 'calm' | 'energetic' | 'mysterious' | 'focused';
}

export class MediaGenerationService {
  private client: GoogleGenAI;
  private config: any;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: environmentLoader.get('GOOGLE_API_KEY')
    });
    this.config = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'config', 'media_generation.json'), 'utf-8')
    );
  }

  /**
   * Generate image with configurable model selection
   */
  async generateImage(params: ImageGenParams): Promise<{
    imageUrl: string;
    provider: string;
    cost: string;
  }> {
    const modelKey = params.model || 'nano_banana';
    const modelConfig = this.config.models.image[modelKey];
    
    const prompt = this.buildImagePrompt(params);
    
    const response = await this.client.models.generateImages({
      model: modelConfig.name,
      prompt,
      config: { numberOfImages: 1 }
    });

    const imageBytes = response.generatedImages[0].image.imageBytes;
    const dataUrl = `data:image/png;base64,${imageBytes}`;

    return {
      imageUrl: dataUrl,
      provider: modelKey,
      cost: modelConfig.cost_per_image
    };
  }

  /**
   * Generate video with Veo 3
   */
  async generateVideo(params: VideoGenParams): Promise<{
    operationId: string;
    estimatedCost: string;
  }> {
    const modelKey = params.model || 'veo_3_fast';
    const modelConfig = this.config.models.video[modelKey];
    
    const prompt = this.buildVideoPrompt(params);
    
    const operation = await this.client.models.generateVideos({
      model: modelConfig.name,
      prompt,
      ...(params.startingImage && { image: params.startingImage })
    });

    return {
      operationId: operation.name,
      estimatedCost: modelConfig.cost_per_8s_video
    };
  }

  /**
   * Poll video generation operation
   */
  async pollVideoOperation(operationId: string): Promise<{
    done: boolean;
    videoUrl?: string;
    videoBytes?: Buffer;
  }> {
    const operation = await this.client.operations.get(operationId);
    
    if (operation.done) {
      const video = operation.response.generatedVideos[0];
      return {
        done: true,
        videoUrl: video.video.uri,
        videoBytes: Buffer.from(video.video.videoBytes, 'base64')
      };
    }
    
    return { done: false };
  }

  private buildImagePrompt(params: ImageGenParams): string {
    const template = this.config.prompt_templates.card_cover;
    let prompt = template.base.replace('{motif}', params.motif);
    
    if (params.styleHints) {
      const styles = params.styleHints.map(hint => 
        template.style_modifiers[hint] || hint
      ).join(' ');
      prompt += ` ${styles}`;
    }
    
    if (params.palette) {
      const paletteStr = Object.entries(params.palette)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      prompt += ` Color palette: ${paletteStr}.`;
    }
    
    prompt += ` ${template.constraints.join(', ')}.`;
    return prompt;
  }

  private buildVideoPrompt(params: VideoGenParams): string {
    const template = this.config.prompt_templates.background_video;
    let prompt = template.base.replace('{description}', params.prompt);
    prompt += ` ${template.cinematography}`;
    
    if (params.mood) {
      prompt += ` ${template.mood_presets[params.mood]}`;
    }
    
    return prompt;
  }
}
```

**Dependencies**: Update `services/media-generation-service/package.json`:

```json
{
  "name": "@2dots1line/media-generation-service",
  "dependencies": {
    "@google/genai": "^0.31.0",
    "@2dots1line/core-utils": "workspace:*"
  }
}
```

---

## Phase 2: Image Generation Integration (1.5 days)

### 2.1 Refactor Existing Image Generation Routes

**File**: `apps/web-app/src/app/api/cards/[cardId]/generate-cover/route.ts`

**Changes**:

```typescript
import { MediaGenerationService } from '@2dots1line/media-generation-service';

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  try {
    const cardId = params.cardId;
    const body = await req.json();
    
    // NEW: Use MediaGenerationService instead of hardcoded logic
    const mediaService = new MediaGenerationService();
    
    const { imageUrl, provider, cost } = await mediaService.generateImage({
      motif: body.motif,
      model: body.model || 'nano_banana', // Default to low-cost
      styleHints: body.style_pack ? [body.style_pack] : undefined,
      palette: body.palette
    });
    
    // Save to disk (existing logic)
    const { buffer } = dataUrlToBuffer(imageUrl);
    const filename = `${cardId}-${Date.now()}.png`;
    const filePath = path.join(process.cwd(), 'public', 'covers', filename);
    fs.writeFileSync(filePath, buffer);
    
    return NextResponse.json({
      success: true,
      image_url: `/covers/${filename}`,
      provider,
      cost
    });
  } catch (error) {
    // Error handling...
  }
}
```

### 2.2 Add Agent Capability for Image Generation

**File**: `config/agent_capabilities.json`

**Add to `capability_categories`**:

```json
{
  "media_generation": {
    "description": "Generate images and videos using AI",
    "capabilities": [
      {
        "id": "generate_card_image",
        "name": "Generate card cover image",
        "trigger_patterns": [
          "generate an image",
          "create a cover",
          "visualize this",
          "design a background",
          "make an image for"
        ],
        "question_template": "Would you like me to generate a cover image for this card?",
        "available_from": ["chat", "cards"],
        "requires_consent": true,
        "execution_type": "backend_api",
        "target_endpoint": "/api/cards/{cardId}/generate-cover",
        "parameters": {
          "motif": "string (extracted from conversation)",
          "model": "string? (nano_banana|imagen_4|imagen_4_fast)",
          "style_pack": "string? (minimal|abstract|nature|cosmic)"
        },
        "cost_warning": "Low-cost: $0.001, High-quality: $0.04",
        "success_message": "Image generated successfully! Check your card."
      }
    ]
  }
}
```

### 2.3 Update PromptBuilder for Image Generation

**File**: `services/dialogue-service/src/PromptBuilder.ts`

**Add method**:

```typescript
private formatMediaGenerationCapabilities(viewContext?: ViewContext): string {
  const mediaConfig = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'config', 'media_generation.json'),
      'utf-8'
    )
  );

  const capabilities = this.filterCapabilitiesByView(
    'media_generation',
    viewContext?.currentView || 'chat'
  );

  return Mustache.render(this.templates.media_capabilities_template, {
    available_capabilities: capabilities,
    image_models: Object.entries(mediaConfig.models.image).map(([key, config]: [string, any]) => ({
      id: key,
      name: config.name,
      cost: config.cost_per_image,
      quality: config.quality,
      use_cases: config.use_cases.join(', ')
    }))
  });
}
```

**Integrate into `buildPrompt`**:

```typescript
// In buildPrompt method, after view context formatting:
const mediaCapabilitiesSection = this.formatMediaGenerationCapabilities(effectiveViewContext);
```

### 2.4 Add Prompt Template

**File**: `config/prompt_templates.yaml`

**Add**:

```yaml
media_capabilities_template: |
  **MEDIA GENERATION CAPABILITIES**
  
  You can generate images for cards using AI image models:
  
  {{#image_models}}
  - **{{id}}**: {{quality}} quality, {{cost}} per image
    Use for: {{use_cases}}
  {{/image_models}}
  
  **When to suggest image generation:**
  - User creates a card and mentions wanting a visual representation
  - User describes a concept that would benefit from imagery
  - User explicitly asks to "visualize" or "create an image"
  
  **How to generate the prompt:**
  1. Extract the core motif from user's description
  2. Suggest appropriate style (minimal, abstract, nature, cosmic)
  3. Ask for confirmation with cost estimate
  
  **Example:**
  User: "I want to create a card about my meditation practice"
  Your response: Include ui_action with action="generate_card_image", motif="meditation practice", style_pack="minimal"
```

---

## Phase 3: Video Generation Worker & Queue (2 days)

### 3.1 Create Video Generation Worker

**File**: `workers/video-generation-worker/src/VideoGenerationWorker.ts` (NEW PACKAGE)

```typescript
import { Worker, Job, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { MediaGenerationService } from '@2dots1line/media-generation-service';
import fs from 'fs';
import path from 'path';

interface VideoJobData {
  userId: string;
  prompt: string;
  viewContext: 'chat' | 'cards' | 'dashboard';
  model?: 'veo_3' | 'veo_3_fast';
  mood?: string;
  useImageSeed?: boolean;
  imageSeedMotif?: string;
}

export class VideoGenerationWorker {
  private worker: Worker;
  private mediaService: MediaGenerationService;
  private notificationQueue: Queue;
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });

    this.mediaService = new MediaGenerationService();

    this.notificationQueue = new Queue('notification-queue', {
      connection: this.redis
    });

    this.worker = new Worker('video-generation-queue', this.processJob.bind(this), {
      connection: this.redis,
      concurrency: 2, // Max 2 simultaneous video generations
      limiter: {
        max: 10,
        duration: 60000 // 10 videos per minute max
      }
    });

    console.log('✅ VideoGenerationWorker initialized');
  }

  private async processJob(job: Job<VideoJobData>): Promise<void> {
    const { userId, prompt, viewContext, model, mood, useImageSeed, imageSeedMotif } = job.data;
    
    console.log(`🎬 Starting video generation for user ${userId}`);
    
    try {
      // Step 1: Optionally generate starting image
      let startingImage: Buffer | undefined;
      if (useImageSeed && imageSeedMotif) {
        console.log(`📸 Generating seed image: ${imageSeedMotif}`);
        const { imageUrl } = await this.mediaService.generateImage({
          motif: imageSeedMotif,
          model: 'nano_banana' // Use low-cost for seed
        });
        
        // Convert data URL to buffer
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        startingImage = Buffer.from(base64Data, 'base64');
      }

      // Step 2: Generate video
      const { operationId, estimatedCost } = await this.mediaService.generateVideo({
        prompt,
        model: model || 'veo_3_fast',
        mood: mood as any,
        startingImage
      });

      console.log(`⏳ Video generation in progress. Operation ID: ${operationId}`);
      
      // Update job progress
      await job.updateProgress(10);

      // Step 3: Poll until complete (max 6 minutes)
      const maxPolls = 36;
      const pollInterval = 10000; // 10 seconds
      
      for (let i = 0; i < maxPolls; i++) {
        await this.sleep(pollInterval);
        
        const result = await this.mediaService.pollVideoOperation(operationId);
        
        // Update progress
        const progress = Math.min(90, 10 + (i / maxPolls) * 80);
        await job.updateProgress(progress);
        
        if (result.done && result.videoBytes) {
          console.log(`✅ Video generation complete!`);
          
          // Step 4: Save video to disk
          const filename = `${userId}-${viewContext}-${Date.now()}.mp4`;
          const videoDir = path.join(process.cwd(), 'public', 'videos', 'generated');
          
          if (!fs.existsSync(videoDir)) {
            fs.mkdirSync(videoDir, { recursive: true });
          }
          
          const filePath = path.join(videoDir, filename);
          fs.writeFileSync(filePath, result.videoBytes);
          
          const publicUrl = `/videos/generated/${filename}`;
          
          // Step 5: Notify user via notification queue
          await this.notificationQueue.add('video_generation_complete', {
            type: 'video_generation_complete',
            userId,
            videoUrl: publicUrl,
            viewContext,
            cost: estimatedCost,
            message: `Your background video is ready!`
          });
          
          await job.updateProgress(100);
          
          console.log(`📤 Notification sent to user ${userId}`);
          return;
        }
      }
      
      throw new Error('Video generation timed out after 6 minutes');
      
    } catch (error) {
      console.error(`❌ Video generation failed:`, error);
      
      // Notify user of failure
      await this.notificationQueue.add('video_generation_failed', {
        type: 'video_generation_failed',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async start(): Promise<void> {
    console.log('🚀 VideoGenerationWorker started');
  }

  async stop(): Promise<void> {
    await this.worker.close();
    await this.redis.quit();
    console.log('🛑 VideoGenerationWorker stopped');
  }
}
```

### 3.2 Add Video Generation Capability

**File**: `config/agent_capabilities.json`

**Add to `media_generation.capabilities`**:

```json
{
  "id": "generate_background_video",
  "name": "Generate background video",
  "trigger_patterns": [
    "generate a video background",
    "create a video",
    "animate the background",
    "make the background come alive",
    "change the video background"
  ],
  "question_template": "Would you like me to generate a custom 8-second background video? (Cost: ~$4-6)",
  "available_from": ["chat", "cards", "dashboard"],
  "requires_consent": true,
  "execution_type": "async_backend_worker",
  "target_worker": "VideoGenerationWorker",
  "parameters": {
    "prompt": "string (LLM-generated from conversation)",
    "viewContext": "string (chat|cards|dashboard)",
    "mood": "string? (calm|energetic|mysterious|focused)",
    "model": "string? (veo_3|veo_3_fast)",
    "useImageSeed": "boolean (generate starting image for consistency)"
  },
  "async_notification": true,
  "estimated_duration": "30 seconds to 6 minutes",
  "cost_estimate": "$4.00-6.00 per video"
}
```

### 3.3 Add API Endpoint to Trigger Video Generation

**File**: `apps/api-gateway/src/controllers/media.controller.ts`

**Add method**:

```typescript
public generateBackgroundVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { prompt, viewContext, mood, model, useImageSeed } = req.body;

    // Add job to video generation queue
    await this.videoGenerationQueue.add('generate_video', {
      userId,
      prompt,
      viewContext,
      mood,
      model: model || 'veo_3_fast',
      useImageSeed: useImageSeed || false,
      imageSeedMotif: useImageSeed ? `Static frame: ${prompt}` : undefined
    });

    res.status(202).json({
      success: true,
      message: 'Video generation started. You will be notified when complete.',
      estimatedTime: '30 seconds to 6 minutes'
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to start video generation' });
  }
};
```

---

## Phase 4: Live API - Real-Time Voice Interaction (2.5 days)

### 4.1 Create Live API Service

**File**: `services/live-api-service/src/LiveAPIService.ts` (NEW PACKAGE)

```typescript
import { GoogleGenAI } from '@google/genai';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface LiveSessionConfig {
  userId: string;
  conversationId: string;
  systemPrompt?: string;
  enableVideoInput?: boolean;
}

export class LiveAPIService extends EventEmitter {
  private client: GoogleGenAI;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;

  constructor() {
    super();
    this.client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    });
  }

  /**
   * Start a new live session with bidirectional streaming
   */
  async startSession(config: LiveSessionConfig): Promise<string> {
    const model = 'gemini-live-2.5-flash-preview-native-audio';
    
    // Create WebSocket connection to Gemini Live API
    const wsUrl = `wss://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${process.env.GOOGLE_API_KEY}`;
    
    this.ws = new WebSocket(wsUrl);
    this.sessionId = `live-${config.userId}-${Date.now()}`;

    this.ws.on('open', () => {
      console.log(`✅ Live session started: ${this.sessionId}`);
      
      // Send initial system prompt if provided
      if (config.systemPrompt) {
        this.sendMessage({
          type: 'system',
          content: config.systemPrompt
        });
      }
      
      this.emit('session_started', { sessionId: this.sessionId });
    });

    this.ws.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());
      this.handleIncomingMessage(message);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    this.ws.on('close', () => {
      console.log(`🛑 Live session closed: ${this.sessionId}`);
      this.emit('session_ended');
    });

    return this.sessionId;
  }

  /**
   * Send audio chunk to Gemini (from user's microphone)
   */
  sendAudioChunk(audioData: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'audio_input',
      data: audioData.toString('base64')
    }));
  }

  /**
   * Send video frame (from webcam or screen capture)
   */
  sendVideoFrame(frameData: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'video_input',
      data: frameData.toString('base64')
    }));
  }

  /**
   * Send text message (user typing in chat)
   */
  sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'text_input',
      content: text
    }));
  }

  /**
   * Interrupt AI response (user starts speaking)
   */
  interrupt(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'interrupt'
    }));
  }

  /**
   * Handle incoming messages from Gemini
   */
  private handleIncomingMessage(message: any): void {
    switch (message.type) {
      case 'audio_output':
        // AI voice response
        const audioBuffer = Buffer.from(message.data, 'base64');
        this.emit('audio_output', audioBuffer);
        break;

      case 'text_output':
        // AI text response
        this.emit('text_output', message.content);
        break;

      case 'thinking':
        // AI is processing (show loading indicator)
        this.emit('thinking');
        break;

      case 'function_call':
        // AI wants to execute a function
        this.emit('function_call', message.function, message.parameters);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Close the live session
   */
  closeSession(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.sessionId = null;
    }
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

### 4.2 Create Frontend Voice Interface Component

**File**: `apps/web-app/src/components/VoiceInterface.tsx` (NEW)

```typescript
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/ChatStore';

export const VoiceInterface: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const startVoiceSession = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Connect to backend WebSocket
      const ws = new WebSocket(`ws://localhost:3001/api/v1/live-session`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Voice session connected');
        setIsListening(true);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleIncomingMessage(message);
      };

      // Send audio chunks to backend
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then(buffer => {
            ws.send(JSON.stringify({
              type: 'audio_chunk',
              data: Array.from(new Uint8Array(buffer))
            }));
          });
        }
      };

      mediaRecorderRef.current.start(100); // Send chunks every 100ms

    } catch (error) {
      console.error('Failed to start voice session:', error);
    }
  };

  const handleIncomingMessage = (message: any) => {
    switch (message.type) {
      case 'audio_output':
        // Play AI voice response
        playAudioResponse(message.data);
        break;

      case 'text_output':
        // Show text in chat
        useChatStore.getState().addMessage({
          id: `ai-${Date.now()}`,
          type: 'bot',
          content: message.content,
          timestamp: new Date()
        });
        break;

      case 'thinking':
        setIsAISpeaking(true);
        break;
    }
  };

  const playAudioResponse = async (audioData: number[]) => {
    if (!audioContextRef.current) return;

    setIsAISpeaking(true);
    
    const audioBuffer = new Uint8Array(audioData).buffer;
    const decodedAudio = await audioContextRef.current.decodeAudioData(audioBuffer);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setIsAISpeaking(false);
    };
    
    source.start();
  };

  const stopVoiceSession = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsListening(false);
    setIsAISpeaking(false);
  };

  return (
    <div className="fixed bottom-20 right-4 flex flex-col items-center gap-2">
      {isListening && (
        <div className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full">
          {isAISpeaking ? 'AI Speaking...' : 'Listening...'}
        </div>
      )}
      
      <button
        onClick={isListening ? stopVoiceSession : startVoiceSession}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isListening ? (
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="6" y="6" width="4" height="12" />
            <rect x="14" y="6" width="4" height="12" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </div>
  );
};
```

### 4.3 Add Live Session WebSocket Endpoint

**File**: `apps/api-gateway/src/routes/v1/live-session.route.ts` (NEW)

```typescript
import { Router } from 'express';
import { WebSocket } from 'ws';
import { LiveAPIService } from '@2dots1line/live-api-service';

export function createLiveSessionRoute(wss: WebSocket.Server) {
  const router = Router();

  // Map of user sessions
  const userSessions = new Map<string, LiveAPIService>();

  wss.on('connection', async (ws, req) => {
    const userId = req.url?.split('userId=')[1];
    if (!userId) {
      ws.close(1008, 'Missing userId');
      return;
    }

    console.log(`🎤 Live session connection from user: ${userId}`);

    // Create new Live API service
    const liveService = new LiveAPIService();
    userSessions.set(userId, liveService);

    // Start Gemini Live session
    const sessionId = await liveService.startSession({
      userId,
      conversationId: `live-${Date.now()}`,
      systemPrompt: 'You are a helpful, empathetic AI assistant having a natural voice conversation.'
    });

    // Forward audio chunks from client to Gemini
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'audio_chunk':
          const audioBuffer = Buffer.from(message.data);
          liveService.sendAudioChunk(audioBuffer);
          break;

        case 'text_message':
          liveService.sendTextMessage(message.content);
          break;

        case 'interrupt':
          liveService.interrupt();
          break;
      }
    });

    // Forward responses from Gemini to client
    liveService.on('audio_output', (audioBuffer) => {
      ws.send(JSON.stringify({
        type: 'audio_output',
        data: Array.from(audioBuffer)
      }));
    });

    liveService.on('text_output', (text) => {
      ws.send(JSON.stringify({
        type: 'text_output',
        content: text
      }));
    });

    liveService.on('thinking', () => {
      ws.send(JSON.stringify({
        type: 'thinking'
      }));
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      console.log(`👋 Live session closed for user: ${userId}`);
      liveService.closeSession();
      userSessions.delete(userId);
    });
  });

  return router;
}
```

---

## Phase 5: Video Input & Understanding (1 day)

### 5.1 Add Video Upload Capability

**File**: `apps/web-app/src/components/VideoInputModal.tsx` (NEW)

```typescript
'use client';

import React, { useState, useRef } from 'react';

interface VideoInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoAnalyzed: (analysis: string) => void;
}

export const VideoInputModal: React.FC<VideoInputModalProps> = ({
  isOpen,
  onClose,
  onVideoAnalyzed
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('Describe what you see in this video');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('prompt', analysisPrompt);

      const response = await fetch('/api/v1/media/analyze-video', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        onVideoAnalyzed(data.analysis);
        onClose();
      }
    } catch (error) {
      console.error('Video analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Analyze Video</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Video File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/mpeg,video/mov,video/avi"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              What would you like to know about this video?
            </label>
            <textarea
              value={analysisPrompt}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="E.g., Describe the main events in this video"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={isAnalyzing}
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 5.2 Add Video Analysis API Endpoint

**File**: `apps/api-gateway/src/controllers/media.controller.ts`

**Add method**:

```typescript
public analyzeVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const videoFile = req.file; // Uploaded via multer
    const prompt = req.body.prompt || 'Describe what you see in this video';

    if (!videoFile) {
      res.status(400).json({ success: false, error: 'No video file provided' });
      return;
    }

    // Use Gemini to analyze video
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    
    const videoBuffer = fs.readFileSync(videoFile.path);
    const videoBase64 = videoBuffer.toString('base64');

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { 
            inlineData: {
              mimeType: videoFile.mimetype,
              data: videoBase64
            }
          }
        ]
      }]
    });

    const analysis = response.response.text();

    // Clean up temp file
    fs.unlinkSync(videoFile.path);

    res.json({
      success: true,
      analysis,
      videoMetadata: {
        filename: videoFile.originalname,
        size: videoFile.size,
        mimeType: videoFile.mimetype
      }
    });

  } catch (error) {
    console.error('Video analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze video' });
  }
};
```

---

## Phase 6: Grounding with Google Search (0.5 days)

### 6.1 Add Search Grounding to Agent Prompts

**File**: `services/dialogue-service/src/DialogueAgent.ts`

**Modify LLM call to enable grounding**:

```typescript
// In performSingleSynthesisCall method
const llmToolInput = {
  payload: {
    // ... existing fields ...
    
    // NEW: Enable grounding with Google Search
    tools: [{
      googleSearch: {
        dynamicRetrievalConfig: {
          mode: 'MODE_DYNAMIC',
          dynamicThreshold: 0.3 // Only ground when confidence is low
        }
      }
    }],
    
    // Tell LLM when to use search
    systemPrompt: promptOutput.systemPrompt + `\n\n**GROUNDING:**\nWhen user asks about current events, recent news, or factual information you're uncertain about, use Google Search to provide accurate, up-to-date answers. Always cite sources when grounding responses.`
  }
};
```

### 6.2 Add Configuration for Search Grounding

**File**: `config/agent_capabilities.json`

**Add capability**:

```json
{
  "id": "search_and_ground",
  "name": "Search for current information",
  "trigger_patterns": [
    "what's the latest",
    "current news about",
    "search for",
    "look up",
    "what's happening with"
  ],
  "available_from": ["chat"],
  "requires_consent": false,
  "execution_type": "integrated_tool",
  "tool_name": "googleSearch",
  "cost_per_request": "$0.035",
  "description": "Automatically grounds responses with real-time Google Search when discussing current events or uncertain facts"
}
```

---

## Phase 7: Integration & Testing (1.5 days)

### 7.1 Update Main App to Include All Components

**File**: `apps/web-app/src/app/page.tsx`

**Add components**:

```typescript
import { VoiceInterface } from '../components/VoiceInterface';
import { VideoInputModal } from '../components/VideoInputModal';

// In component:
const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

return (
  <>
    {/* Existing content */}
    
    {/* NEW: Voice interface */}
    <VoiceInterface />
    
    {/* NEW: Video input modal */}
    <VideoInputModal
      isOpen={isVideoModalOpen}
      onClose={() => setIsVideoModalOpen(false)}
      onVideoAnalyzed={(analysis) => {
        // Add analysis to chat
        addMessage({
          id: `video-analysis-${Date.now()}`,
          type: 'bot',
          content: analysis,
          timestamp: new Date()
        });
      }}
    />
  </>
);
```

### 7.2 Update PM2 Ecosystem for New Workers

**File**: `ecosystem.config.js`

**Add**:

```javascript
{
  name: 'video-generation-worker',
  script: 'workers/video-generation-worker/dist/index.js',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379
  }
}
```

### 7.3 Add Environment Variables

**File**: `.env`

**Add**:

```bash
# Existing
GOOGLE_API_KEY=your_key_here

# NEW: Image model preference
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image  # Nano-Banana by default

# NEW: Video model preference
GEMINI_VIDEO_MODEL=veo-3.0-fast-generate-001  # Fast by default

# NEW: Enable Live API
ENABLE_LIVE_API=true
LIVE_API_MODEL=gemini-live-2.5-flash-preview-native-audio

# NEW: Enable grounding
ENABLE_SEARCH_GROUNDING=true
```

---

## Implementation Checklist

### Phase 1: Foundation (2 days)

- [ ] Create `config/media_generation.json` with all model configurations
- [ ] Create `services/media-generation-service` package
- [ ] Implement `MediaGenerationService` class with image and video methods
- [ ] Add service to monorepo workspace
- [ ] Unit test image generation with Nano-Banana
- [ ] Unit test video generation with Veo 3 Fast

### Phase 2: Image Generation (1.5 days)

- [ ] Refactor `/api/cards/[cardId]/generate-cover` to use MediaGenerationService
- [ ] Add `generate_card_image` capability to agent_capabilities.json
- [ ] Update PromptBuilder with media capabilities formatting
- [ ] Add `media_capabilities_template` to prompt_templates.yaml
- [ ] Test agent-triggered image generation via chat
- [ ] Test cost differences between Nano-Banana and Imagen 4

### Phase 3: Video Generation (2 days)

- [ ] Create `workers/video-generation-worker` package
- [ ] Implement VideoGenerationWorker with polling logic
- [ ] Add `generate_background_video` capability to config
- [ ] Create `/api/v1/media/generate-video` endpoint
- [ ] Implement WebSocket notification on video completion
- [ ] Test full video generation flow (prompt → queue → poll → notify)

### Phase 4: Live API (2.5 days)

- [ ] Create `services/live-api-service` package
- [ ] Implement LiveAPIService with WebSocket handling
- [ ] Create VoiceInterface.tsx component
- [ ] Add `/api/v1/live-session` WebSocket route
- [ ] Implement audio streaming (mic → Gemini → speaker)
- [ ] Test voice interruption feature
- [ ] Test 24-language support

### Phase 5: Video Input (1 day)

- [ ] Create VideoInputModal.tsx component
- [ ] Add `/api/v1/media/analyze-video` endpoint
- [ ] Implement video upload with multer
- [ ] Test video analysis with various formats
- [ ] Test real-time webcam capture integration

### Phase 6: Grounding (0.5 days)

- [ ] Enable Google Search grounding in DialogueAgent
- [ ] Add `search_and_ground` capability to config
- [ ] Update system prompt to guide search usage
- [ ] Test grounding with current events questions

### Phase 7: Integration (1.5 days)

- [ ] Add VoiceInterface to main app
- [ ] Add VideoInputModal to main app
- [ ] Update PM2 ecosystem.config.js
- [ ] Add all environment variables
- [ ] End-to-end testing of all features
- [ ] Cost tracking and monitoring setup

---

## Testing Strategy

### Unit Tests

- MediaGenerationService methods (image, video, polling)
- LiveAPIService WebSocket handling
- VideoGenerationWorker job processing

### Integration Tests                            

- Image generation → save → display on card
- Video generation → notify → update background
- Voice session → audio streaming → response playback
- Video upload → analysis → chat display

### User Acceptance Tests

1. **Image Generation**: User says "create a card with a meditation image" → card created with Nano-Banana image
2. **Video Generation**: User says "make my chat background a peaceful beach sunset" → 8-second video generated and applied
3. **Voice Chat**: User clicks voice button → speaks "what's the weather like?" → hears natural voice response
4. **Video Analysis**: User uploads workout video → receives detailed analysis in chat
5. **Grounded Search**: User asks "what's the latest on AI regulation?" → receives current info with citations

---

## Cost Tracking & Monitoring

**File**: `services/media-generation-service/src/CostTracker.ts` (NEW)

```typescript
export class MediaCostTracker {
  private redis: Redis;

  async tra                                                                                                                                      ckImageGeneration(userId: string, model: string, cost: number): Promise<void> {
    const key = `cost:${userId}:images:${new Date().toISOString().slice(0, 10)}`;
    await this.redis.hincrby(key, model, 1);
    await this.redis.hincrbyfloat(key, 'total_cost', cost);
  }

  async trackVideoGeneration(userId: string, model: string, duration: number, cost: number): Promise<void> {
    const key = `cost:${userId}:videos:${new Date().toISOString().slice(0, 10)}`;
    await this.redis.hincrby(key, model, 1);
    await this.redis.hincrbyfloat(key, 'total_duration', duration);
    await this.redis.hincrbyfloat(key, 'total_cost', cost);
  }

  async getDailyCost(userId: string): Promise<{ images: number; videos: number; total: number }> {
    const today = new Date().toISOString().slice(0, 10);
    const imageKey = `cost:${userId}:images:${today}`;
    const videoKey = `cost:${userId}:videos:${today}`;

    const [imageCost, videoCost] = await Promise.all([
      this.redis.hget(imageKey, 'total_cost'),
      this.redis.hget(videoKey, 'total_cost')
    ]);

    return {
      images: parseFloat(imageCost || '0'),
      videos: parseFloat(videoCost || '0'),
      total: parseFloat(imageCost || '0') + parseFloat(videoCost || '0')
    };
  }
}
```

---

## Pricing Summary

| Feature | Model | Cost | Use Case |

|---------|-------|------|----------|

| **Image Generation** | Nano-Banana | $0.001/image | Card covers (auto) |

| | Imagen 4 Fast | $0.02/image | Rapid iteration |

| | Imagen 4 | $0.04/image | High-quality covers |

| **Video Generation** | Veo 3 Fast | $4.00/8s video | Background videos |

| | Veo 3 | $6.00/8s video | Premium content |

| **Live Voice** | Gemini Live | $1.00/1M input tokens, $3.00/1M output | Real-time chat |

| **Video Analysis** | Gemini 2.5 Flash | $0.30/1M tokens | Video understanding |

| **Search Grounding** | Google Search | $0.035/1000 requests | Current info |

**Estimated Monthly Cost for Moderate User**:

- 50 images/month (Nano-Banana): $0.05
- 10 videos/month (Veo 3 Fast): $40.00
- 100 voice minutes: ~$2.00
- 20 video analyses: ~$0.10
- **Total**: ~$42.15/month

---

## Success Criteria

1. ✅ All image generation uses MediaGenerationService (no hardcoded prompts)
2. ✅ Agent can trigger image generation via conversation
3. ✅ Users can generate custom background videos in <2 minutes
4. ✅ Voice interface allows natural conversation with interruption
5. ✅ Video upload and analysis works for all supported formats
6. ✅ Search grounding provides current information with citations
7. ✅ Cost tracking accurately monitors all API usage
8. ✅ All features integrated with agent capability framework

---

## Future Enhancements (Post-MVP)

1. **Image-to-Video Workflows**: Generate Imagen image → use as Veo starting frame
2. **Voice Cloning**: Custom voice profiles for different agent personalities
3. **Real-Time Webcam Integration**: Live video understanding during voice chat
4. **Multi-Language Voice**: Dynamic language switching in conversations
5. **Video Editing**: Chain multiple Veo generations for longer videos
6. **Cost Optimization**: Automatic model selection based on quality requirements
7. **A/B Testing**: Compare Nano-Banana vs Imagen 4 user preference
8. **Video Background Playlists**: Generate multiple videos for rotation

### To-dos

- [ ] Phase 1: Create configuration files and MediaGenerationService
- [ ] Phase 2: Refactor image generation and integrate with agent framework
- [ ] Phase 3: Implement VideoGenerationWorker and async queue
- [ ] Phase 4: Implement Live API with real-time voice interaction
- [ ] Phase 5: Add video upload and analysis capabilities
- [ ] Phase 6: Enable grounding with Google Search
- [ ] Phase 7: Full integration testing and monitoring setup