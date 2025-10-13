/**
 * MediaGenerationService.ts
 * Provider-agnostic media generation service for 2dots1line V11.0
 * Supports Gemini (Imagen, Veo, Nano-Banana) and OpenAI (DALL-E 3)
 */

import { EnvironmentModelConfigService } from '@2dots1line/config-service';
import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import fs from 'fs';
import path from 'path';

export interface ImageGenerationParams {
  motif: string;
  styleHints?: string[];
  quality?: 'low' | 'medium' | 'high';
}

export interface ImageGenerationResult {
  imageUrl: string;
  provider: string;
  model: string;
}

export interface VideoGenerationParams {
  prompt: string;
  quality?: 'fast' | 'standard';
  mood?: string;
  cinematography?: string;
}

export interface VideoGenerationResult {
  operationId: string;
  estimatedCost: string;
  model: string;
}

export interface VideoOperationResult {
  done: boolean;
  videoUrl?: string;
  videoBytes?: Buffer;
}

export class MediaGenerationService {
  private modelConfig: EnvironmentModelConfigService;
  private provider: 'gemini' | 'openai';
  private geminiClient: GoogleGenAI | null = null;
  private openaiClient: OpenAI | null = null;
  private promptConfig: any;

  constructor() {
    this.modelConfig = EnvironmentModelConfigService.getInstance();
    this.provider = this.modelConfig.getProvider();
    this.initializeClients();
    this.loadPromptConfiguration();
  }

  private initializeClients(): void {
    if (this.provider === 'gemini') {
      const apiKey = environmentLoader.get('GOOGLE_API_KEY');
      if (!apiKey) throw new Error('GOOGLE_API_KEY required for Gemini provider');
      this.geminiClient = new GoogleGenAI({ apiKey });
    } else if (this.provider === 'openai') {
      const apiKey = environmentLoader.get('OPENAI_API_KEY');
      const baseURL = environmentLoader.get('OPENAI_BASE_URL');
      if (!apiKey) throw new Error('OPENAI_API_KEY required for OpenAI provider');
      this.openaiClient = new OpenAI({ apiKey, baseURL });
    }
    console.log(`📱 MediaGenerationService: provider=${this.provider}`);
  }

  private loadPromptConfiguration(): void {
    try {
      // Find monorepo root by looking for config directory
      let configPath = path.join(process.cwd(), 'config', 'media_generation_prompts.json');
      
      // If not found in current directory, try parent directories (for Next.js context)
      if (!fs.existsSync(configPath)) {
        const possiblePaths = [
          path.join(process.cwd(), '../../config/media_generation_prompts.json'), // From apps/web-app
          path.join(process.cwd(), '../config/media_generation_prompts.json'),    // From services
          path.join(process.cwd(), 'config/media_generation_prompts.json')        // From root
        ];
        
        for (const testPath of possiblePaths) {
          if (fs.existsSync(testPath)) {
            configPath = testPath;
            break;
          }
        }
      }
      
      this.promptConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log(`✅ Media generation prompt configuration loaded from: ${configPath}`);
    } catch (error) {
      console.error('❌ Failed to load media_generation_prompts.json:', error);
      throw new Error('Media generation configuration not found');
    }
  }

  /**
   * Generate an image using the configured provider
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const model = this.modelConfig.getModelForUseCase('image');
    console.log(`🎨 Generating image: ${this.provider}/${model}`);
    
    if (this.provider === 'gemini') {
      return this.generateImageGemini(model, params);
    } else {
      return this.generateImageOpenAI(model, params);
    }
  }

  private async generateImageGemini(model: string, params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const prompt = this.buildImagePrompt(params);
    
    const response = await this.geminiClient!.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1 }
    });
    
    if (!response?.generatedImages || response.generatedImages.length === 0) {
      throw new Error('No image generated from Gemini');
    }
    
    const imageBytes = response.generatedImages[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error('No image bytes in Gemini response');
    }
    
    return {
      imageUrl: `data:image/png;base64,${imageBytes}`,
      provider: 'gemini',
      model
    };
  }

  private async generateImageOpenAI(model: string, params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const prompt = this.buildImagePrompt(params);
    
    const response = await this.openaiClient!.images.generate({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: params.quality === 'high' ? 'hd' : 'standard'
    });
    
    if (!response?.data || response.data.length === 0 || !response.data[0]?.url) {
      throw new Error('No image URL in OpenAI response');
    }
    
    return {
      imageUrl: response.data[0].url,
      provider: 'openai',
      model
    };
  }

  /**
   * Generate a video using Gemini Veo 3
   */
  async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    if (this.provider !== 'gemini') {
      throw new Error('Video generation only supported with Gemini provider (Veo 3)');
    }
    
    let model = this.modelConfig.getModelForUseCase('video');
    
    // Override model based on quality
    if (params.quality === 'standard') {
      model = 'veo-3.0-generate-001';
    }
    
    const prompt = this.buildVideoPrompt(params);
    
    console.log(`🎬 Generating video: ${model}`);
    console.log(`📝 Prompt: ${prompt}`);
    
    const operation: any = await this.geminiClient!.models.generateVideos({
      model,
      prompt
    });
    
    const operationId = operation?.name || operation?.id || 'unknown';
    
    return {
      operationId,
      estimatedCost: model.includes('fast') ? '$4.00' : '$6.00',
      model
    };
  }

  /**
   * Poll the status of a video generation operation
   */
  async pollVideoOperation(operationId: string): Promise<VideoOperationResult> {
    if (this.provider !== 'gemini' || !this.geminiClient) {
      throw new Error('Video polling only supported with Gemini provider');
    }
    
    const operation: any = await (this.geminiClient as any).operations.get({ name: operationId });
    
    if (operation?.done) {
      const response: any = operation.response;
      const video = response?.generatedVideos?.[0];
      
      if (!video) {
        throw new Error('No video in operation response');
      }
      
      return {
        done: true,
        videoUrl: video?.video?.uri || '',
        videoBytes: video?.video?.videoBytes ? Buffer.from(video.video.videoBytes, 'base64') : undefined
      };
    }
    
    return { done: false };
  }

  /**
   * Build image prompt from configuration and parameters
   */
  private buildImagePrompt(params: ImageGenerationParams): string {
    const config = this.promptConfig.image_generation;
    
    // Get style (default to 'minimal')
    const style = params.styleHints?.[0] || 'minimal';
    const styleConfig = config.styles[style] || config.styles.minimal;
    
    // Build base prompt
    let prompt = config.base_template
      .replace('{style}', styleConfig.description.toLowerCase())
      .replace('{motif}', params.motif);
    
    // Add style-specific suffix
    prompt += ` ${styleConfig.prompt_suffix}`;
    
    // Add constraints
    prompt += ` ${config.constraints.join(', ')}.`;
    
    return prompt;
  }

  /**
   * Build video prompt from configuration and parameters
   */
  private buildVideoPrompt(params: VideoGenerationParams): string {
    const config = this.promptConfig.video_generation;
    
    // Get cinematography style (default to 'cinematic')
    const cineStyle = params.cinematography || 'cinematic';
    const cinematography = config.cinematography_styles[cineStyle] || config.cinematography_styles.cinematic;
    
    // Build base prompt
    let prompt = config.base_template
      .replace('{description}', params.prompt)
      .replace('{cinematography}', cinematography);
    
    // Add mood preset if specified
    if (params.mood) {
      const moodConfig = config.mood_presets[params.mood];
      if (moodConfig) {
        prompt += ` ${moodConfig.prompt_suffix}`;
      }
    }
    
    return prompt;
  }

  /**
   * Get available image styles from configuration
   */
  getAvailableImageStyles(): string[] {
    return Object.keys(this.promptConfig.image_generation.styles);
  }

  /**
   * Get available video moods from configuration
   */
  getAvailableVideoMoods(): string[] {
    return Object.keys(this.promptConfig.video_generation.mood_presets);
  }

  /**
   * Get scene templates for video generation
   */
  getSceneTemplates(): any {
    return this.promptConfig.video_generation.scene_templates;
  }
}

export default MediaGenerationService;

