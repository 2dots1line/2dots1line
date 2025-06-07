declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info?: {
      Title?: string;
      Author?: string;
      Creator?: string;
    };
  }
  function parse(buffer: Buffer): Promise<PDFData>;
  export = parse;
}

declare module 'mammoth' {
  interface ExtractResult {
    value: string;
    messages: Array<{ message: string; type: string }>;
  }
  export function extractRawText(options: { buffer: Buffer }): Promise<ExtractResult>;
} 