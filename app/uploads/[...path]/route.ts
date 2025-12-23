import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Vercel 환경 체크
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// 정적 파일 서빙을 위한 라우트
// /uploads/vehicles/차량번호/날짜/파일명 경로로 접근
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Vercel 환경에서는 로컬 파일 서빙 불가 (Google Drive만 사용)
  if (isVercel) {
    return NextResponse.json(
      { error: 'Local file serving not available on Vercel. Please use Google Drive URL.' },
      { status: 404 }
    );
  }

  try {
    // params.path는 ['vehicles', '차량번호', '날짜', '파일명'] 형식
    const filePath = path.join(
      process.cwd(),
      'uploads',
      ...params.path
    );

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      console.error('Requested path:', params.path);
      console.error('Full path:', filePath);
      return NextResponse.json(
        { error: 'File not found', path: filePath, requested: params.path },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    console.error('Requested path:', params.path);
    return NextResponse.json(
      { error: 'Failed to serve file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


