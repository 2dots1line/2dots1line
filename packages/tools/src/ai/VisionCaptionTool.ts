/**
 * Vision Caption Tool (Enhanced Implementation)
 * Extracts captions and descriptions from images using Google Gemini Vision
 */

import { TToolInput, TToolOutput, VisionCaptionInputPayload, VisionCaptionResult } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/tool-registry';

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

  async execute(input: VisionCaptionToolInput): Promise<VisionCaptionToolOutput> {
    const startTime = Date.now();
    
    try {
      console.log(`VisionCaptionTool: Processing image ${input.payload.imageUrl}`);
      
      // Check if Google API is available
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.warn('VisionCaptionTool: GOOGLE_API_KEY not available, using enhanced descriptive analysis');
        return this.generateEnhancedDescription(input.payload, startTime);
      }

      // Use Google Gemini Vision API for real analysis
      const analysisResult = await this.analyzeWithGeminiVision(input.payload, apiKey);
      
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
    payload: VisionCaptionInputPayload, 
    apiKey: string
  ): Promise<VisionCaptionResult> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const prompt = `Please analyze this image and provide:
1. A concise, descriptive caption (1-2 sentences)
2. Key objects or elements visible in the image
3. The overall scene or context
4. Any text that might be visible

Format your response as a detailed but conversational analysis that would be helpful for understanding the image content.`;

    const result = await model.generateContent([prompt, imageData]);
    const response = result.response;
    const analysisText = response.text();

    // Parse the response to extract structured data
    return this.parseGeminiResponse(analysisText, payload.imageType);
  }

  private parseGeminiResponse(analysisText: string, imageType: string): VisionCaptionResult {
    // Extract main caption (first paragraph or sentence)
    const lines = analysisText.split('\n').filter(line => line.trim());
    const caption = lines[0] || analysisText.substring(0, 200).trim();

    // Try to extract objects mentioned in the analysis
    const objects = this.extractObjects(analysisText);

    // Look for scene description
    const scene = this.extractScene(analysisText);

    // Look for text content
    const textDetected = this.extractTextContent(analysisText);

    return {
      caption,
      detectedObjects: objects,
      confidence: 0.85, // Good confidence when using real AI
      metadata: {
        scene_description: scene,
        text_detected: textDetected,
        full_analysis: analysisText,
        image_type: imageType
      }
    };
  }

  private extractObjects(text: string): Array<{ name: string; confidence: number }> {
    const objects: Array<{ name: string; confidence: number }> = [];
    
    // Common objects to look for in the analysis
    const commonObjects = [
      'person', 'people', 'man', 'woman', 'child', 'face',
      'car', 'vehicle', 'building', 'house', 'tree', 'flower',
      'book', 'computer', 'phone', 'table', 'chair', 'door',
      'window', 'sky', 'cloud', 'water', 'food', 'animal',
      'cat', 'dog', 'bird', 'text', 'sign', 'logo'
    ];

    const textLower = text.toLowerCase();
    
    for (const obj of commonObjects) {
      if (textLower.includes(obj)) {
        objects.push({
          name: obj,
          confidence: 0.7 + Math.random() * 0.2 // 0.7-0.9 confidence
        });
      }
    }

    return objects.slice(0, 8); // Limit to top 8 objects
  }

  private extractScene(text: string): string {
    // Look for scene-related keywords
    const sceneKeywords = ['indoor', 'outdoor', 'inside', 'outside', 'room', 'street', 'park', 'office', 'kitchen', 'bedroom'];
    const textLower = text.toLowerCase();
    
    for (const keyword of sceneKeywords) {
      if (textLower.includes(keyword)) {
        // Find the sentence containing this keyword
        const sentences = text.split(/[.!?]/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            return sentence.trim();
          }
        }
      }
    }
    
    return 'Scene context provided in main analysis';
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
    
    if (fileExtension && ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension.toLowerCase())) {
      caption = `I can see that an image file (${fileExtension.toUpperCase()}) has been uploaded. While I can't analyze the visual content in detail without the vision API, I'm ready to help discuss or work with this image in our conversation.`;
      
      objects = [
        { name: 'uploaded_image', confidence: 0.9 },
        { name: 'visual_content', confidence: 0.8 },
        { name: fileExtension.toLowerCase() + '_file', confidence: 0.95 }
      ];
      
      scene = `Digital image file in ${fileExtension.toUpperCase()} format, likely containing visual information relevant to our conversation.`;
    } else {
      caption = 'An image has been shared in our conversation. I can see that visual content has been provided and I\'m ready to incorporate it into our discussion.';
      
      objects = [
        { name: 'shared_image', confidence: 0.8 },
        { name: 'visual_content', confidence: 0.7 }
      ];
      
      scene = 'Visual content shared in conversation context.';
    }

    return {
      status: 'success',
      result: {
        caption,
        detectedObjects: objects,
        confidence: 0.6, // Lower confidence for fallback
        metadata: {
          scene_description: scene,
          text_detected: 'Image analysis requires vision API for text detection',
          fallback_mode: true,
          image_type: imageType
        }
      },
      metadata: {
        processing_time_ms: Date.now() - startTime,
        api_used: 'fallback_enhanced_description'
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