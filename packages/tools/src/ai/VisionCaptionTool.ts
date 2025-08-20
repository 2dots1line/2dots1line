/**
 * Vision Caption Tool (Enhanced Implementation)
 * Extracts captions and descriptions from images using Google Gemini Vision
 */

import { TToolInput, TToolOutput, VisionCaptionInputPayload, VisionCaptionResult } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/shared-types';
import { ModelConfigService } from '@2dots1line/config-service';

export type VisionCaptionToolInput = TToolInput<VisionCaptionInputPayload>;
export type VisionCaptionToolOutput = TToolOutput<VisionCaptionResult>;

// Tool manifest for registry discovery
const manifest: IToolManifest<VisionCaptionInputPayload, VisionCaptionResult> = {
  name: 'vision.caption',
  description: 'Extract captions and descriptions from images using Google Gemini Vision',
  version: '1.0.0',
  availableRegions: ['us', 'cn'],
  categories: ['vision', 'ai', 'image_processing'],
  capabilities: ['image_captioning', 'object_detection', 'scene_analysis'],
  validateInput: (input: VisionCaptionToolInput) => {
    const valid = !!input?.payload?.imageUrl && typeof input.payload.imageUrl === 'string';
    return { 
      valid, 
      errors: valid ? [] : ['Missing or invalid imageUrl in payload'] 
    };
  },
  validateOutput: (output: VisionCaptionToolOutput) => {
    const valid = !!(output?.result?.caption && typeof output.result.caption === 'string');
    return { 
      valid, 
      errors: valid ? [] : ['Missing caption in result'] 
    };
  },
  performance: {
    avgLatencyMs: 2000,
    isAsync: true,
    isIdempotent: true
  },
  limitations: [
    'Requires GOOGLE_API_KEY environment variable',
    'Falls back to descriptive analysis if API unavailable'
  ]
};

class VisionCaptionToolImpl implements IExecutableTool<VisionCaptionInputPayload, VisionCaptionResult> {
  manifest = manifest;
  private genAI: any;
  private isInitialized: boolean = false;
  private modelConfigService: any;
  private currentModelName: string = '';

  constructor() {
    // Initialize Google API client at construction time, like LLMChatTool
    const apiKey = process.env.GOOGLE_API_KEY;
    this.modelConfigService = new ModelConfigService();
    
    if (apiKey) {
      // Get the appropriate model from configuration
      this.currentModelName = this.modelConfigService.getModelForUseCase('vision');
      
      console.log(`✅ VisionCaptionTool: Initializing with Google API key (length: ${apiKey.length})`);
      console.log(`📱 VisionCaptionTool: Using model ${this.currentModelName} for vision analysis`);
      
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.isInitialized = true;
        console.log(`✅ VisionCaptionTool: Successfully initialized Google AI client`);
      } catch (error) {
        console.warn(`⚠️ VisionCaptionTool: Failed to initialize Google AI client:`, error);
        this.isInitialized = false;
      }
    } else {
      console.warn(`⚠️ VisionCaptionTool: No GOOGLE_API_KEY found during initialization`);
      this.isInitialized = false;
    }
  }

  async execute(input: VisionCaptionToolInput): Promise<VisionCaptionToolOutput> {
    const startTime = Date.now();
    
    try {
      console.log(`VisionCaptionTool: Processing image ${input.payload.imageUrl}`);
      console.log(`🔍 VisionCaptionTool: Initialization status - ${this.isInitialized ? 'READY' : 'NOT READY'}`);
      
      if (!this.isInitialized || !this.genAI) {
        console.warn('VisionCaptionTool: Google API client not initialized, using enhanced descriptive analysis');
        return this.generateEnhancedDescription(input.payload, startTime);
      }

      console.log(`✅ VisionCaptionTool: Using Google Gemini Vision API for analysis`);

      // Use Google Gemini Vision API for real analysis
      const analysisResult = await this.analyzeWithGeminiVision(input.payload);
      
      return {
        status: 'success',
        result: analysisResult,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          api_used: 'google_gemini_vision'
        }
      };
      
    } catch (error) {
      console.error('VisionCaptionTool error:', error);
      
      // Fallback to enhanced description on error
      try {
        console.warn('VisionCaptionTool: API failed, falling back to enhanced description');
        return this.generateEnhancedDescription(input.payload, startTime);
      } catch (fallbackError) {
        return {
          status: 'error',
          error: {
            code: 'VISION_PROCESSING_ERROR',
            message: error instanceof Error ? error.message : 'Vision processing failed',
            details: { tool: this.manifest.name, fallback_attempted: true }
          },
          metadata: {
            processing_time_ms: Date.now() - startTime
          }
        };
      }
    }
  }

  private async analyzeWithGeminiVision(
    payload: VisionCaptionInputPayload
  ): Promise<VisionCaptionResult> {
    // Use the pre-initialized Google AI client with configured model
    const generationConfig = this.modelConfigService.getGenerationConfig(this.currentModelName);
    const model = this.genAI.getGenerativeModel({ 
      model: this.currentModelName,
      generationConfig
    });

    // Prepare the image for analysis
    let imageData: any;
    
    if (payload.imageUrl.startsWith('data:')) {
      // Handle base64 data URL
      const [mimeType, base64Data] = payload.imageUrl.split(';base64,');
      imageData = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType.replace('data:', '')
        }
      };
    } else if (payload.imageUrl.startsWith('http')) {
      // For HTTP URLs, we'd need to fetch and convert to base64
      // For now, fallback to enhanced description
      throw new Error('HTTP image URLs not yet supported, please upload image directly');
    } else {
      throw new Error('Unsupported image format');
    }

    // Enhanced prompt engineering for comprehensive analysis
    const prompt = `Please provide a comprehensive analysis of this image. I need you to be thorough and observant, capturing all important details that would help someone understand the full context and meaning of the image.

**CRITICAL: Please be extremely detailed and include ALL of the following:**

1. **People & Living Beings**: Describe any people, animals, or living creatures in detail. Include their appearance, clothing, actions, expressions, age, gender, and what they're doing.

2. **Setting & Environment**: Describe the location, environment, and physical setting. Is it indoor/outdoor? What type of place is it? Include details about the background, landscape, or architectural elements.

3. **Weather & Atmosphere**: Describe the weather conditions, lighting, time of day, and overall mood/atmosphere of the scene.

4. **Objects & Elements**: List all significant objects, structures, or elements visible in the image.

5. **Actions & Activities**: Describe what's happening in the image - any movement, activities, or interactions.

6. **Colors & Visual Elements**: Mention prominent colors, textures, or visual qualities.

7. **Overall Context**: What story does this image tell? What's the purpose or meaning of this scene?

**Format your response as follows:**
COMPREHENSIVE_DESCRIPTION: [Provide a detailed 3-4 sentence description that captures the essence and all important elements]

DETAILED_ANALYSIS:
- People/Animals: [List and describe any people, animals, or living beings]
- Setting: [Describe the location and environment]
- Weather/Atmosphere: [Describe weather, lighting, mood]
- Objects: [List all significant objects and elements]
- Activities: [Describe any actions or activities happening]
- Visual Elements: [Colors, textures, composition notes]
- Context/Story: [What story or meaning does this convey]

Please be thorough and observant - don't miss important details like people, animals, weather conditions, or the overall context of the scene.`;

    const result = await model.generateContent([prompt, imageData]);
    const response = result.response;
    const analysisText = response.text();

    // Enhanced parsing with better extraction
    return this.parseEnhancedGeminiResponse(analysisText, payload.imageType);
  }

  private parseEnhancedGeminiResponse(analysisText: string, imageType: string): VisionCaptionResult {
    console.log('🔍 Full Gemini response:', analysisText);

    // Extract the comprehensive description
    let caption = '';
    const comprehensiveMatch = analysisText.match(/COMPREHENSIVE_DESCRIPTION:\s*(.*?)(?=\n\nDETAILED_ANALYSIS:|$)/s);
    if (comprehensiveMatch) {
      caption = comprehensiveMatch[1].trim();
    } else {
      // Fallback: use first substantial paragraph
      const paragraphs = analysisText.split('\n\n').filter(p => p.trim().length > 50);
      caption = paragraphs[0] || analysisText.substring(0, 300).trim();
    }

    // Enhanced object detection from the full analysis
    const objects = this.extractObjectsEnhanced(analysisText);

    // Enhanced scene description
    const scene = this.extractSceneEnhanced(analysisText);

    // Text detection
    const textDetected = this.extractTextContent(analysisText);

    return {
      caption,
      detectedObjects: objects,
      confidence: 0.9, // Higher confidence with better model and prompt
      metadata: {
        scene_description: scene,
        text_detected: textDetected,
        full_analysis: analysisText,
        image_type: imageType,
        model_used: this.currentModelName,
        enhanced_parsing: true
      }
    };
  }

  private extractObjectsEnhanced(text: string): Array<{ name: string; confidence: number }> {
    const objects: Array<{ name: string; confidence: number }> = [];
    const textLower = text.toLowerCase();
    
    // Enhanced object detection categories
    const objectCategories = {
      people: ['person', 'people', 'man', 'woman', 'child', 'boy', 'girl', 'individual', 'figure', 'human'],
      animals: ['bird', 'seagull', 'seagulls', 'gull', 'gulls', 'dog', 'cat', 'animal', 'creature', 'wildlife'],
      nature: ['tree', 'trees', 'flower', 'flowers', 'plant', 'plants', 'ocean', 'sea', 'water', 'beach', 'sky', 'cloud', 'clouds'],
      structures: ['building', 'house', 'boardwalk', 'walkway', 'bridge', 'dock', 'pier', 'path', 'sidewalk', 'street', 'road'],
      weather: ['cloudy', 'overcast', 'sunny', 'rainy', 'foggy', 'clear', 'stormy'],
      objects: ['boat', 'ship', 'car', 'vehicle', 'sign', 'bench', 'table', 'chair']
    };

    // Look for objects mentioned in the analysis
    for (const [category, items] of Object.entries(objectCategories)) {
      for (const item of items) {
        const regex = new RegExp(`\\b${item}s?\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          // Higher confidence for more specific mentions
          const confidence = 0.8 + (matches.length * 0.05);
          objects.push({
            name: item,
            confidence: Math.min(confidence, 0.95)
          });
        }
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueObjects = objects.reduce((acc, obj) => {
      const existing = acc.find(o => o.name === obj.name);
      if (!existing || existing.confidence < obj.confidence) {
        acc = acc.filter(o => o.name !== obj.name);
        acc.push(obj);
      }
      return acc;
    }, [] as Array<{ name: string; confidence: number }>);

    return uniqueObjects.sort((a, b) => b.confidence - a.confidence).slice(0, 15);
  }

  private extractSceneEnhanced(text: string): string {
    const textLower = text.toLowerCase();
    
    // Look for setting/environment descriptions
    const settingMatch = text.match(/Setting[:\-]\s*(.*?)(?=\n|$)/i);
    if (settingMatch) {
      return settingMatch[1].trim();
    }

    // Look for comprehensive scene descriptions
    const scenePatterns = [
      /this (?:image|photo|picture) shows (.*?)(?=\.|,|\n)/i,
      /the scene (?:shows|depicts|features) (.*?)(?=\.|,|\n)/i,
      /(?:located|situated|set) (?:in|at|on) (.*?)(?=\.|,|\n)/i,
      /(?:outdoor|indoor|coastal|urban|rural|natural) (?:scene|setting|environment) (.*?)(?=\.|,|\n)/i
    ];

    for (const pattern of scenePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback to extracting from weather/atmosphere section
    const weatherMatch = text.match(/Weather\/Atmosphere[:\-]\s*(.*?)(?=\n|$)/i);
    if (weatherMatch) {
      return `Scene: ${weatherMatch[1].trim()}`;
    }

    return 'Detailed scene analysis provided in full description';
  }

  private extractTextContent(text: string): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('text') || textLower.includes('writing') || textLower.includes('words')) {
      // Try to find what text was mentioned
      const sentences = text.split(/[.!?]/);
      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        if (sentenceLower.includes('text') || sentenceLower.includes('writing') || sentenceLower.includes('says')) {
          return sentence.trim();
        }
      }
      return 'Text detected in image';
    }
    
    return 'No visible text detected';
  }

  private async generateEnhancedDescription(
    payload: VisionCaptionInputPayload, 
    startTime: number
  ): Promise<VisionCaptionToolOutput> {
    // Enhanced fallback that provides more contextual information
    const imageType = payload.imageType || 'unknown';
    const fileExtension = this.getFileExtension(payload.imageUrl);
    
    let caption: string;
    let objects: Array<{ name: string; confidence: number }>;
    let scene: string;
    
    // Be honest about limitations when API key is not available
    caption = `🚫 Image uploaded successfully, but detailed analysis is not available. Google Vision API key is required for image content analysis. I can see that an image file has been shared, but cannot describe its specific contents.`;
    
    objects = [
      { name: 'uploaded_image', confidence: 1.0 },
      { name: 'requires_api_key', confidence: 1.0 }
    ];
    
    scene = `Image analysis unavailable - Google Vision API key not configured. Please set GOOGLE_API_KEY environment variable for image content analysis.`;

    return {
      status: 'success',
      result: {
        caption,
        detectedObjects: objects,
        confidence: 0.0, // Zero confidence for fallback without real analysis
        metadata: {
          scene_description: scene,
          text_detected: 'Text detection requires Google Vision API',
          fallback_mode: true,
          api_key_missing: true,
          image_type: imageType,
          requires_setup: 'Please configure GOOGLE_API_KEY environment variable'
        }
      },
      metadata: {
        processing_time_ms: Date.now() - startTime,
        api_used: 'fallback_no_api_key',
        warning: 'Google Vision API key not configured'
      }
    };
  }

  private getFileExtension(url: string): string | null {
    try {
      if (url.startsWith('data:image/')) {
        const mimeType = url.split(';')[0].replace('data:image/', '');
        return mimeType;
      }
      
      const urlParts = url.split('.');
      return urlParts.length > 1 ? urlParts[urlParts.length - 1] : null;
    } catch {
      return null;
    }
  }
}

export const VisionCaptionTool = new VisionCaptionToolImpl();
export default VisionCaptionTool; 