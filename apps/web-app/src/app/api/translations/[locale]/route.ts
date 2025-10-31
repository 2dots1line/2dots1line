export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SUPPORTED_LOCALES = new Set(['en', 'zh-CN']);

export async function GET(_req: Request, { params }: { params: { locale: string } }) {
  const { locale } = params;

  if (!SUPPORTED_LOCALES.has(locale)) {
    return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 });
  }

  try {
    const translationsPath = path.join(process.cwd(), '..', '..', 'config', 'translations', `${locale}.json`);
    const contents = await fs.readFile(translationsPath, 'utf-8');
    const data = JSON.parse(contents);

    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (err: any) {
    const isNotFound = err?.code === 'ENOENT';
    return NextResponse.json(
      { error: isNotFound ? 'Translations file not found' : 'Failed to read translations' },
      { status: isNotFound ? 404 : 500 }
    );
  }
}