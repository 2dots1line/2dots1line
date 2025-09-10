export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

type Payload = {
  motif: string;
  style_pack?: string;
  constraints?: string[];
  palette?: Record<string, string>;
  export?: {
    // Accept upstream-allowed strings and keep number for backward compatibility
    size?: number | 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
    background?: 'transparent' | 'white' | 'black';
    quality?: 'low' | 'medium' | 'high';
  };
};

// top-level module scope
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

// Simple deterministic SVG fallback to use on insufficient_balance / 429
function makeFallbackCoverDataUrl(motif: string, width: number, height: number): string {
  const text = (motif || 'motif').slice(0, 80);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  const c1 = `hsl(${hue}, 55%, 60%)`;
  const c2 = `hsl(${(hue + 30) % 360}, 55%, 45%)`;
  const ink = `hsl(${(hue + 180) % 360}, 10%, 18%)`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <g fill="${ink}" opacity="0.88">
        <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.28}"/>
      </g>
    </svg>`;

  const b64 = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${b64}`;
}

// POST /api/covers/generate
export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();

    if (!body?.motif || typeof body.motif !== 'string' || !body.motif.trim()) {
      return NextResponse.json({ error: 'motif is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('[covers/generate] Missing GOOGLE_API_KEY');
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 503 });
    }

    const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-4.0-generate-001';
    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildPrompt(body);

    // Single attempt — no retries or fallbacks
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
      },
    });

    const first = response?.generatedImages?.[0];
    const imgBytesB64 = first?.image?.imageBytes;
    if (!imgBytesB64) {
      console.error('[covers/generate] No image data returned from Gemini/Imagen');
      return NextResponse.json({ error: 'No image data returned from Gemini' }, { status: 502 });
    }

    const dataUrl = `data:image/png;base64,${imgBytesB64}`;
    return NextResponse.json({ image: dataUrl, provider: 'gemini' }, { status: 200 });
  } catch (err: any) {
    const detail = {
      name: err?.name,
      message: err?.message,
      status: err?.status,
      code: err?.code,
      type: err?.type,
      response: err?.response
        ? { status: err.response.status, statusText: err.response.statusText, data: err.response.data }
        : undefined,
    };
    console.error('[covers/generate] Error detail (Gemini):', detail);
    const httpStatus = detail.status && Number.isInteger(detail.status) ? detail.status : 500;

    // Try to extract a suggested retry delay in seconds from the Gemini error message
    let retryAfterSec: number | undefined = undefined;
    if (httpStatus === 429 && typeof detail.message === 'string') {
      try {
        const parsed = JSON.parse(detail.message);
        const infoArr = parsed?.error?.details || [];
        const retryInfo = Array.isArray(infoArr) ? infoArr.find((d: any) => d?.['@type']?.includes('RetryInfo')) : undefined;
        const retryDelay: string | undefined = retryInfo?.retryDelay;
        if (retryDelay) {
          const m = retryDelay.match(/(\d+)\s*s/);
          if (m) retryAfterSec = Math.max(1, parseInt(m[1], 10));
        }
      } catch {
        // ignore parse errors
      }
    }

    const headers: HeadersInit = retryAfterSec ? { 'Retry-After': String(retryAfterSec) } : {};
    return NextResponse.json({ error: 'cover_generation_failed', detail }, { status: httpStatus, headers });
  }
}

// Add GET to quickly verify route is wired
export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/covers/generate' }, { status: 200 });
}