import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;
    
    // Join the path segments
    const filePath = join(process.cwd(), 'public', 'videos', 'generated', ...path);
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const extension = path[path.length - 1]?.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'mp4':
        contentType = 'video/mp4';
        break;
      case 'webm':
        contentType = 'video/webm';
        break;
      case 'avi':
        contentType = 'video/x-msvideo';
        break;
      case 'mov':
        contentType = 'video/quicktime';
        break;
    }
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving generated video:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
