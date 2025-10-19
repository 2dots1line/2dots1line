import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    
    // Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Only allow PNG and JPEG files
    if (!/\.(png|jpeg|jpg)$/i.test(filename)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    // Construct file path
    const publicDir = path.join(process.cwd(), 'public');
    const coversDir = path.join(publicDir, 'covers');
    const filePath = path.join(coversDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type based on file extension
    const contentType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[covers] Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
