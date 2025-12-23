import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFromGoogleDrive } from '@/lib/google-drive';
import fs from 'fs/promises';
import path from 'path';

// GET /api/photos/[id] - 사진 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await prisma.inspectionPhoto.findUnique({
      where: { id: params.id },
      include: {
        inspectionArea: {
          include: {
            inspection: {
              include: {
                vehicle: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/[id] - 사진 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await prisma.inspectionPhoto.findUnique({
      where: { id: params.id },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // 로컬 파일 삭제
    try {
      const localFilePath = path.join(
        process.cwd(),
        photo.filePath.replace(/^\//, '')
      );
      await fs.unlink(localFilePath);
    } catch (error) {
      console.warn('Failed to delete local file:', error);
    }

    // 구글 드라이브 파일 삭제
    if (photo.googleDriveFileId) {
      await deleteFromGoogleDrive(photo.googleDriveFileId);
    }

    // 데이터베이스에서 삭제
    await prisma.inspectionPhoto.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

