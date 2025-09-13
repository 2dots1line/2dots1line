export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

type Payload = {
  motif: string;
  style_pack?: string;
  constraints?: string[];
  palette?: Record<string, string>;
  export?: {
    size?: number | 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
    background?: 'transparent' | 'white' | 'black';
    quality?: 'low' | 'medium' | 'high';
  };
};

function buildPrompt(p: Payload): string {
  const parts: string[] = [];
  parts.push(`Create a simple centered silhouette cover image for the motif: "${p.motif}".`);
  if (p.style_pack) parts.push(`Style pack: ${p.style_pack}.`);
  if (p.constraints?.length) parts.push(`Constraints: ${p.constraints.join(', ')}.`);
  if (p.palette) {
    const palette = Object.entries(p.palette).map(([k, v]) => `${k}: ${v}`).join(', ');
    parts.push(`Color palette: ${palette}.`);
  }
  parts.push('No text, no watermark, high contrast, clean background.');
  return parts.join(' ');
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  return { buffer, mime };
}

// POST /api/cards/[cardId]/generate-cover
export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  try {
    const cardId = params.cardId;
    const body: Payload = await req.json();

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ error: 'cardId is required in path' }, { status: 400 });
    }
    if (!body?.motif || typeof body.motif !== 'string' || !body.motif.trim()) {
      return NextResponse.json({ error: 'motif is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('[cards/generate-cover] Missing GOOGLE_API_KEY');
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 503 });
    }

    const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-4.0-generate-001';
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(body);

    const response = await ai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1 },
    });

    const first = response?.generatedImages?.[0];
    const imgBytesB64 = first?.image?.imageBytes;
    if (!imgBytesB64) {
      console.error('[cards/generate-cover] No image data returned from Gemini/Imagen');
      return NextResponse.json({ error: 'No image data returned from Gemini' }, { status: 502 });
    }

    const dataUrl = `data:image/png;base64,${imgBytesB64}`;

    // Save to disk under public/covers
    const publicDir = path.join(process.cwd(), 'public');
    const coversDir = path.join(publicDir, 'covers');
    ensureDir(coversDir);

    // filename: <cardId>-<timestamp>.png
    const filename = `${cardId}-${Date.now()}.png`;
    const filePath = path.join(coversDir, filename);

    const { buffer, mime } = dataUrlToBuffer(dataUrl);
    // Only allow PNG/JPEG for safety, default to .png naming
    if (!/^image\/(png|jpeg|jpg)$/.test(mime)) {
      console.warn(`[cards/generate-cover] Unexpected mime type from generator: ${mime}, saving as png`);
    }

    fs.writeFileSync(filePath, buffer);

    // URL consumed by the client and also stored in Postgres via cardService
    const image_url = `/covers/${filename}`;

    return NextResponse.json({ success: true, image_url, provider: 'gemini' }, { status: 200 });
  } catch (err: any) {
    const detail = {
      name: err?.name,
      message: err?.message,
      status: err?.status,
      code: err?.code,
      type: err?.type,
    };
    console.error('[cards/generate-cover] Error detail:', detail);
    const httpStatus = detail.status && Number.isInteger(detail.status) ? detail.status : 500;
    return NextResponse.json({ error: 'cover_generation_failed', detail }, { status: httpStatus });
  }
}