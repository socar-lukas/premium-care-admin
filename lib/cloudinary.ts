import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Buffer에서 Cloudinary로 이미지 업로드
 * @param buffer 이미지 버퍼
 * @param fileName 파일명 (차량번호 - 소유자명, 날짜시간, 상태, 점검유형, 담당자 형식)
 * @param vehicleNumber 차량번호 (폴더 구조용)
 * @param mimeType MIME 타입
 * @param inspectionDate 점검 날짜 (YYYY-MM-DD 형식)
 * @param photoPhase 점검 단계 ('before' | 'after')
 * @returns 업로드된 이미지의 URL
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  fileName: string,
  vehicleNumber: string,
  mimeType: string,
  inspectionDate?: string,
  photoPhase?: 'before' | 'after'
): Promise<{ url: string; publicId: string } | null> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials not configured');
    return null;
  }

  try {
    // 폴더 구조: PremiumCare/차량번호/날짜/점검전 or 점검후/
    // 한국 시간 기준으로 날짜 생성
    const getKoreanDateString = () => {
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      return koreaTime.toISOString().split('T')[0];
    };
    const dateFolder = inspectionDate || getKoreanDateString();
    const phaseFolder = photoPhase === 'before' ? '점검전' : photoPhase === 'after' ? '점검후' : '';
    const folder = phaseFolder
      ? `PremiumCare/${vehicleNumber}/${dateFolder}/${phaseFolder}`
      : `PremiumCare/${vehicleNumber}/${dateFolder}`;
    
    // 파일명에서 확장자 제거하고 특수문자 정리
    const publicId = fileName
      .replace(/\.[^/.]+$/, '') // 확장자 제거
      .replace(/[^a-zA-Z0-9가-힣\s-]/g, '_') // 특수문자를 언더스코어로 변경
      .substring(0, 200); // 길이 제한

    // Base64로 변환
    const base64String = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64String}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
      use_filename: false, // public_id를 직접 사용
      unique_filename: true, // 중복 시 자동으로 고유 ID 추가
      // 성능 최적화
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
}

/**
 * MIME 타입에서 이미지 포맷 추출
 */
function getImageFormat(mimeType: string): string {
  const formatMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
  };
  return formatMap[mimeType.toLowerCase()] || 'jpg';
}

/**
 * Cloudinary에서 이미지 삭제
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

