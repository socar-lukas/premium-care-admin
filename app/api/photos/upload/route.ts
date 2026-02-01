import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile } from '@/lib/file-upload';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { backupPhotoToGoogleDrive } from '@/lib/google-drive';
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
    const photoPhase = formData.get('photoPhase') as 'before' | 'after' | null;
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

      // 파일 정보 준비 - 항상 고유한 파일명 생성
      const fileExtension = path.extname(file.name);
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cloudinaryFileName = `${baseFileName}_${uniqueId}${fileExtension}`;

      // 파일을 Buffer로 변환
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || 'image/jpeg';

      // Cloudinary에 업로드
      const inspectionDateStr = inspectionDateObj.toISOString().split('T')[0];
      const cloudinaryResult = await uploadBufferToCloudinary(
        buffer,
        cloudinaryFileName,
        vehicle.vehicleNumber,
        mimeType,
        inspectionDateStr,
        photoPhase || undefined
      );

      // Google Drive 백업 (필수)
      const googleDriveResult = await backupPhotoToGoogleDrive(
        buffer,
        cloudinaryFileName,
        vehicle.vehicleNumber,
        inspectionDateStr,
        mimeType
      );

      // 로컬 저장 (로컬 개발 환경에서만)
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
      let localFilePath = '';
      
      if (!isVercel) {
        const fileInfo = await saveUploadedFile(
          file,
          vehicle.vehicleNumber,
          inspectionDate
        );
        localFilePath = fileInfo.filePath;
      }

      // 데이터베이스에 저장
      // Cloudinary URL을 우선 사용, 없으면 로컬 경로 사용
      const finalFilePath = cloudinaryResult?.url || localFilePath;
      
      const photo = await prisma.inspectionPhoto.create({
        data: {
          inspectionAreaId,
          fileName: cloudinaryFileName,
          originalFileName: file.name,
          filePath: finalFilePath,
          googleDriveFileId: cloudinaryResult?.publicId || null, // publicId를 여기에 저장 (나중에 삭제용)
          googleDriveUrl: cloudinaryResult?.url || null, // Cloudinary URL을 여기에 저장
          fileSize: buffer.length,
          mimeType: mimeType,
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

