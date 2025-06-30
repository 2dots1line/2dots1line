/**
 * Document Extract Tool (Real Implementation)
 * Extracts text and metadata from documents using Node.js libraries
 */

import { TToolInput, TToolOutput, DocumentExtractInputPayload, DocumentExtractResult } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/shared-types';
import * as fs from 'fs';
import * as path from 'path';

export type DocumentExtractToolInput = TToolInput<DocumentExtractInputPayload>;
export type DocumentExtractToolOutput = TToolOutput<DocumentExtractResult>;

// Tool manifest for registry discovery
const manifest: IToolManifest<DocumentExtractInputPayload, DocumentExtractResult> = {
  name: 'document.extract',
  description: 'Extract text and metadata from documents (PDF, DOCX, DOC, TXT)',
  version: '2.0.0',
  availableRegions: ['us', 'cn'],
  categories: ['document', 'extraction', 'text_processing'],
  capabilities: ['text_extraction', 'document_processing', 'metadata_extraction'],
  validateInput: (input: DocumentExtractToolInput) => {
    const valid = !!input?.payload?.documentUrl && typeof input.payload.documentUrl === 'string';
    return { 
      valid, 
      errors: valid ? [] : ['Missing or invalid documentUrl in payload'] 
    };
  },
  validateOutput: (output: DocumentExtractToolOutput) => {
    const valid = !!(output?.result?.extractedText && typeof output.result.extractedText === 'string');
    return { 
      valid, 
      errors: valid ? [] : ['Missing extractedText in result'] 
    };
  },
  performance: {
    avgLatencyMs: 1200,
    isAsync: true,
    isIdempotent: true
  },
  limitations: [
    'Requires document libraries to be installed',
    'PDF extraction quality depends on document structure',
    'Large documents may take longer to process'
  ]
};

class DocumentExtractToolImpl implements IExecutableTool<DocumentExtractInputPayload, DocumentExtractResult> {
  manifest = manifest;

  async execute(input: DocumentExtractToolInput): Promise<DocumentExtractToolOutput> {
    const startTime = Date.now();
    
    try {
      console.log(`DocumentExtractTool: Processing document ${input.payload.documentUrl}`);
      
      // Validate file exists
      if (!fs.existsSync(input.payload.documentUrl)) {
        throw new Error(`Document file not found: ${input.payload.documentUrl}`);
      }
      
      // Get file stats and extension
      const stats = fs.statSync(input.payload.documentUrl);
      const extension = path.extname(input.payload.documentUrl).toLowerCase();
      const fileName = path.basename(input.payload.documentUrl);
      
      console.log(`DocumentExtractTool: File ${fileName}, size: ${stats.size} bytes, type: ${extension}`);
      
      // Extract text based on file type
      let extractedText = '';
      let metadata: any = {
        fileName,
        fileSize: stats.size,
        createdDate: stats.birthtime.toISOString(),
        modifiedDate: stats.mtime.toISOString(),
        extractedAt: new Date().toISOString()
      };
      
      switch (extension) {
        case '.pdf':
          const pdfResult = await this.extractFromPDF(input.payload.documentUrl);
          extractedText = pdfResult.text;
          metadata = { ...metadata, ...pdfResult.metadata };
          break;
          
        case '.docx':
        case '.doc':
          const docResult = await this.extractFromWord(input.payload.documentUrl);
          extractedText = docResult.text;
          metadata = { ...metadata, ...docResult.metadata };
          break;
          
        case '.txt':
          extractedText = await this.extractFromText(input.payload.documentUrl);
          metadata.language = this.detectLanguage(extractedText);
          break;
          
        default:
          throw new Error(`Unsupported document type: ${extension}. Supported types: PDF, DOCX, DOC, TXT`);
      }
      
      // Clean up extracted text
      extractedText = this.cleanText(extractedText);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }
      
      console.log(`DocumentExtractTool: Extracted ${extractedText.length} characters from ${fileName}`);
      console.log(`DocumentExtractTool: Preview - ${extractedText.substring(0, 200)}...`);
      
      const processingTime = Date.now() - startTime;
      
      return {
        status: 'success',
        result: {
          extractedText,
          metadata: {
            ...metadata,
            wordCount: this.countWords(extractedText),
            characterCount: extractedText.length,
            language: metadata.language || this.detectLanguage(extractedText)
          },
          extractedImages: [] // Could be extended for image extraction
        },
        metadata: {
          processing_time_ms: processingTime
        }
      };
      
    } catch (error) {
      console.error('DocumentExtractTool error:', error);
      
      const processingTime = Date.now() - startTime;
      
      return {
        status: 'error',
        error: {
          code: 'DOCUMENT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Document processing failed',
          details: { 
            tool: this.manifest.name,
            file: input.payload.documentUrl,
            documentType: input.payload.documentType
          }
        },
        metadata: {
          processing_time_ms: processingTime
        }
      };
    }
  }

  private async extractFromPDF(filePath: string): Promise<{ text: string; metadata: any }> {
    try {
      // Dynamic import for optional dependency
      const pdf = await import('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      
      console.log(`DocumentExtractTool: Parsing PDF with pdf-parse library...`);
      const data = await pdf.default(buffer);
      
      return {
        text: data.text,
        metadata: {
          title: data.info?.Title || 'Unknown',
          author: data.info?.Author || 'Unknown',
          creator: data.info?.Creator || 'Unknown',
          pageCount: data.numpages,
          language: 'auto-detect'
        }
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractFromWord(filePath: string): Promise<{ text: string; metadata: any }> {
    try {
      // Dynamic import for optional dependency
      const mammoth = await import('mammoth');
      const buffer = fs.readFileSync(filePath);
      
      console.log(`DocumentExtractTool: Parsing Word document with mammoth library...`);
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('DocumentExtractTool: Word extraction warnings:', result.messages);
      }
      
      return {
        text: result.value,
        metadata: {
          title: path.basename(filePath, path.extname(filePath)),
          author: 'Unknown',
          language: 'auto-detect',
          hasWarnings: result.messages.length > 0,
          warnings: result.messages.map((m: any) => m.message)
        }
      };
    } catch (error) {
      console.error('Word document extraction error:', error);
      throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractFromText(filePath: string): Promise<string> {
    try {
      console.log(`DocumentExtractTool: Reading plain text file...`);
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error('Text file extraction error:', error);
      throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')        // Normalize line endings
      .replace(/\r/g, '\n')          // Convert remaining \r to \n
      .replace(/\n{3,}/g, '\n\n')    // Collapse multiple newlines
      .replace(/[ \t]{2,}/g, ' ')    // Collapse multiple spaces/tabs
      .trim();                       // Remove leading/trailing whitespace
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    const sample = text.substring(0, 1000).toLowerCase();
    
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(sample)) {
      return 'zh';
    }
    
    // Japanese characters (Hiragana, Katakana)
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) {
      return 'ja';
    }
    
    // Korean characters
    if (/[\uac00-\ud7af]/.test(sample)) {
      return 'ko';
    }
    
    // Arabic characters
    if (/[\u0600-\u06ff]/.test(sample)) {
      return 'ar';
    }
    
    // Russian/Cyrillic characters
    if (/[\u0400-\u04ff]/.test(sample)) {
      return 'ru';
    }
    
    // Default to English for Latin scripts
    return 'en';
  }
}

export const DocumentExtractTool = new DocumentExtractToolImpl();
export default DocumentExtractTool; 