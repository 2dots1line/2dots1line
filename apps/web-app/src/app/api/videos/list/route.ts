import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface VideoFile {
  id: string; // Relative path from /videos/
  label: string; // Display name
  path: string; // Full URL path
  directory: string; // 'root' | 'generated' | etc
  size?: number;
  createdAt?: string;
}

function scanDirectory(dir: string, relativePath: string = '', videos: VideoFile[]) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          scanDirectory(fullPath, relPath, videos);
        } else if (entry.isFile() && /\.(mp4|webm|mov)$/i.test(entry.name)) {
          const stats = fs.statSync(fullPath);
          const dirName = relativePath || 'root';
          
          videos.push({
            id: relPath,
            label: entry.name.replace(/\.[^/.]+$/, ''), // Remove extension
            path: `/videos/${relPath}`,
            directory: dirName,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
          });
        }
      }
    }

export async function GET() {
  try {
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    const videos: VideoFile[] = [];

    scanDirectory(videosDir, '', videos);
    
    // Sort: generated videos first (newest first), then others
    videos.sort((a, b) => {
      const aIsGenerated = a.directory.includes('generated');
      const bIsGenerated = b.directory.includes('generated');
      
      if (aIsGenerated && !bIsGenerated) return -1;
      if (!aIsGenerated && bIsGenerated) return 1;
      
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });

    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error('Error scanning videos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scan videos' },
      { status: 500 }
    );
  }
}

