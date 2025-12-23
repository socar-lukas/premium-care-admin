import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'vehicles');

// Vercel 환경 체크
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

export async function saveUploadedFile(
  file: File,
  vehicleNumber: string,
  inspectionDate: string
): Promise<{ fileName: string; filePath: string; fileSize: number; mimeType: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 파일명 생성 (UUID + 원본 확장자)
  const fileExtension = path.extname(file.name);
  const fileName = `${uuidv4()}${fileExtension}`;
  
  // Vercel 환경에서는 로컬 저장 스킵 (Google Drive만 사용)
  if (isVercel) {
    return {
      fileName,
      filePath: '', // 로컬 경로 없음 (Google Drive만 사용)
      fileSize: buffer.length,
      mimeType: file.type,
    };
  }
  
  // 로컬 개발 환경에서만 파일 저장
  const dateFolder = new Date(inspectionDate).toISOString().split('T')[0];
  const saveDir = path.join(UPLOAD_DIR, vehicleNumber, dateFolder);
  
  // 디렉토리 생성
  await mkdir(saveDir, { recursive: true });
  
  // 파일 저장
  const filePath = path.join(saveDir, fileName);
  await writeFile(filePath, buffer);

  return {
    fileName,
    filePath: `/uploads/vehicles/${vehicleNumber}/${dateFolder}/${fileName}`,
    fileSize: buffer.length,
    mimeType: file.type,
  };
}

export function getLocalFilePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}


