import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile } from '@/lib/file-upload';
import { uploadToGoogleDrive, uploadToGoogleDriveFromBuffer } from '@/lib/google-drive';
import { z } from 'zod';
import path from 'path';

const uploadSchema = z.object({
  inspectionAreaId: z.string().uuid(),
  description: z.string().optional(),
});

// POST /api/photos/upload - 사진 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inspectionAreaId = formData.get('inspectionAreaId') as string;
    const description = formData.get('description') as string | null;
    const files = formData.getAll('files') as File[];

    if (!inspectionAreaId || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 점검 부위 확인
    const area = await prisma.inspectionArea.findUnique({
      where: { id: inspectionAreaId },
      include: {
        inspection: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    if (!area) {
      return NextResponse.json(
        { error: 'Inspection area not found' },
        { status: 404 }
      );
    }

    const vehicle = area.inspection.vehicle;
    const inspection = area.inspection;
    const inspectionDate = inspection.inspectionDate.toISOString();

    // 구글 드라이브 파일명 생성: "차량번호 - 소유자명, 날짜시간, 상태, 점검유형, 담당자"
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${year}. ${month}. ${day}. ${ampm} ${displayHours}:${minutes}:00`;
    };

    const inspectionDateObj = new Date(inspectionDate);
    const baseFileName = `${vehicle.vehicleNumber} - ${vehicle.ownerName}, ${formatDate(inspectionDateObj)}, ${inspection.overallStatus}, ${inspection.inspectionType}${inspection.inspector ? `, ${inspection.inspector}` : ''}`;

    const uploadedPhotos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 파일 유효성 검사
      if (!file.type.startsWith('image/')) {
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        continue;
      }

      // 로컬 저장 (Vercel 환경에서는 스킵)
      const fileInfo = await saveUploadedFile(
        file,
        vehicle.vehicleNumber,
        inspectionDate
      );

      // 구글 드라이브 업로드
      const folderPath = vehicle.vehicleNumber;
      const fileExtension = path.extname(file.name);
      const driveFileName = files.length > 1 
        ? `${baseFileName}_${i + 1}${fileExtension}`
        : `${baseFileName}${fileExtension}`;
      
      // Vercel 환경에서는 메모리에서 직접 업로드, 로컬 환경에서는 파일 경로 사용
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
      let googleDriveResult;
      
      if (isVercel) {
        // Vercel: 메모리 버퍼에서 직접 업로드
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        googleDriveResult = await uploadToGoogleDriveFromBuffer(
          buffer,
          driveFileName,
          folderPath,
          fileInfo.mimeType
        );
      } else {
        // 로컬: 파일 경로 사용
        const localFilePath = path.join(
          process.cwd(),
          'uploads',
          'vehicles',
          vehicle.vehicleNumber,
          inspectionDate.split('T')[0],
          fileInfo.fileName
        );
        googleDriveResult = await uploadToGoogleDrive(
          localFilePath,
          driveFileName,
          folderPath,
          fileInfo.mimeType
        );
      }

      // 데이터베이스에 저장
      const photo = await prisma.inspectionPhoto.create({
        data: {
          inspectionAreaId,
          fileName: fileInfo.fileName,
          originalFileName: file.name,
          filePath: fileInfo.filePath,
          googleDriveFileId: googleDriveResult?.fileId || null,
          googleDriveUrl: googleDriveResult?.webViewLink || null,
          fileSize: fileInfo.fileSize,
          mimeType: fileInfo.mimeType,
          description: description || null,
        },
      });

      uploadedPhotos.push(photo);
    }

    return NextResponse.json(
      { photos: uploadedPhotos, count: uploadedPhotos.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}

