export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MediaGenerationService } from '@2dots1line/media-generation-service';
import { GeneratedMediaRepository } from '@2dots1line/database';
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
  const startTime = Date.now();
  
  try {
    const cardId = params.cardId;
    const body: Payload = await req.json();

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ error: 'cardId is required in path' }, { status: 400 });
    }
    if (!body?.motif || typeof body.motif !== 'string' || !body.motif.trim()) {
      return NextResponse.json({ error: 'motif is required' }, { status: 400 });
    }

    // Extract userId from Authorization header (JWT token)
    let userId: string | null = null;
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Decode JWT token to get userId
        // For dev-token, we'll use dev-user-123
        if (token === 'dev-token') {
          userId = 'dev-user-123';
        } else {
          // In production, decode actual JWT
          const base64Payload = token.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          userId = payload.user_id || payload.sub || payload.userId;
        }
      }
    } catch (authError) {
      console.warn('[generate-cover] Failed to extract userId:', authError);
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
    // Use API route for serving covers to ensure proper static file serving
    const image_url = `/api/covers/${filename}`;

    // Save to database if userId was extracted
    if (userId) {
      try {
        const generatedMediaRepo = new GeneratedMediaRepository();
        const generationDurationSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        await generatedMediaRepo.createGeneratedMedia({
          userId,
          mediaType: 'image',
          fileUrl: image_url,
          filePath,
          prompt: body.motif,
          viewContext: 'cards',
          generationCost: model.includes('nano-banana') || model.includes('flash') ? 0.001 : (model.includes('fast') ? 0.02 : 0.04),
          generationDurationSeconds,
          provider,
          model,
          metadata: {
            cardId,
            style_pack: body.style_pack,
            quality: body.export?.quality
          }
        });
        console.log(`✅ Image metadata saved to database for user ${userId}`);
      } catch (dbError) {
        console.error('[generate-cover] Failed to save to database:', dbError);
        // Continue anyway - image file is saved
      }
    }

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