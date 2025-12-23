import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/photos/inspection/[inspectionId] - 점검별 사진 목록
export async function GET(
  request: NextRequest,
  { params }: { params: { inspectionId: string } }
) {
  try {
    const photos = await prisma.inspectionPhoto.findMany({
      where: {
        inspectionArea: {
          inspectionId: params.inspectionId,
        },
      },
      include: {
        inspectionArea: {
          select: {
            id: true,
            areaName: true,
            areaCategory: true,
          },
        },
      },
      orderBy: { uploadedAt: 'asc' },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}


