import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile } from '@/lib/file-upload';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { backupPhotoToGoogleDrive } from '@/lib/google-drive';
import { updatePhotoCount } from '@/lib/google-sheets';
import { sendPhotosEmail, EmailAttachment } from '@/lib/email';
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
    const inspectionDateStr = inspectionDateObj.toISOString().split('T')[0];
    const baseFileName = `${vehicle.vehicleNumber} - ${vehicle.ownerName}, ${formatDate(inspectionDateObj)}, ${inspection.overallStatus}, ${inspection.inspectionType}${inspection.inspector ? `, ${inspection.inspector}` : ''}`;

    const uploadedPhotos = [];
    const emailAttachments: EmailAttachment[] = [];

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
      const cloudinaryResult = await uploadBufferToCloudinary(
        buffer,
        cloudinaryFileName,
        vehicle.vehicleNumber,
        mimeType,
        inspectionDateStr,
        photoPhase || undefined
      );

      // Google Drive 백업 (필수)
      console.log(`[Photo Upload] Google Drive 백업 시작 - 파일: ${cloudinaryFileName}, 버퍼 크기: ${buffer.length}`);

      const googleDriveResult = await backupPhotoToGoogleDrive(
        buffer,
        cloudinaryFileName,
        vehicle.vehicleNumber,
        inspectionDateStr,
        mimeType,
        inspection.inspectionType // '반납상태' 또는 '세차점검'
      );

      console.log(`[Photo Upload] Google Drive 결과:`, googleDriveResult);

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

      // 이메일 첨부용으로 저장
      emailAttachments.push({
        filename: cloudinaryFileName,
        content: buffer,
        contentType: mimeType,
      });
    }

    // 사진수 업데이트 (해당 점검의 전체 사진 수)
    if (uploadedPhotos.length > 0) {
      const totalPhotoCount = await prisma.inspectionPhoto.count({
        where: {
          inspectionArea: {
            inspectionId: inspection.id,
          },
        },
      });

      console.log(`[Photo Upload] 총 사진 수: ${totalPhotoCount}, 점검 ID: ${inspection.id}, 유형: ${inspection.inspectionType}`);

      // Google Sheets 사진수 업데이트 (필수)
      try {
        const updateResult = await updatePhotoCount(inspection.id, inspection.inspectionType, totalPhotoCount);
        console.log(`[Photo Upload] 사진수 업데이트 결과: ${updateResult}`);
      } catch (err) {
        console.error('[Google Sheets] 사진수 업데이트 실패:', err);
      }

      // 이메일로 사진 백업 발송
      if (emailAttachments.length > 0) {
        try {
          const emailResult = await sendPhotosEmail(
            vehicle.vehicleNumber,
            vehicle.ownerName,
            inspection.inspectionType,
            inspectionDateStr,
            emailAttachments
          );
          console.log(`[Photo Upload] 이메일 발송 결과: ${emailResult}`);
        } catch (err) {
          console.error('[Email] 사진 이메일 발송 실패:', err);
        }
      }
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

