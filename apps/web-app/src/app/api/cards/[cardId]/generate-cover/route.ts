export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MediaGenerationService } from '@2dots1line/media-generation-service';
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

    // Use provider-agnostic MediaGenerationService
    const mediaService = new MediaGenerationService();
    
    const { imageUrl, provider, model } = await mediaService.generateImage({
      motif: body.motif,
      styleHints: body.style_pack ? [body.style_pack] : undefined,
      quality: body.export?.quality || 'medium'
    });

    console.log(`✅ Image generated: provider=${provider}, model=${model}`);

    // Save to disk under public/covers
    const publicDir = path.join(process.cwd(), 'public');
    const coversDir = path.join(publicDir, 'covers');
    ensureDir(coversDir);

    // filename: <cardId>-<timestamp>.png
    const filename = `${cardId}-${Date.now()}.png`;
    const filePath = path.join(coversDir, filename);

    const { buffer, mime } = dataUrlToBuffer(imageUrl);
    // Only allow PNG/JPEG for safety, default to .png naming
    if (!/^image\/(png|jpeg|jpg)$/.test(mime)) {
      console.warn(`[cards/generate-cover] Unexpected mime type from generator: ${mime}, saving as png`);
    }

    fs.writeFileSync(filePath, buffer);

    // URL consumed by the client and also stored in Postgres via cardService
    const image_url = `/covers/${filename}`;

    return NextResponse.json({ 
      success: true, 
      image_url, 
      provider,
      model
    }, { status: 200 });
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