// 클라이언트 사이드 이미지 압축 유틸리티
// 더 강한 압축으로 업로드 속도 개선

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const QUALITY = 0.5;

export async function compressImage(file: File): Promise<File> {
  // 이미 작은 이미지는 압축하지 않음
  if (file.size < 200 * 1024) { // 200KB 이하
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Object URL 정리
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // 비율 유지하며 리사이즈
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        resolve(file);
        return;
      }

      // 흰색 배경 (투명 PNG 대응)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 변환 (압축)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 고유한 파일명 생성 (원본명 + 타임스탬프 + 랜덤)
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const fileName = `${baseName}_${uniqueId}.jpg`;
            const compressedFile = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // 에러 시 원본 반환
    };

    img.src = objectUrl;
  });
}

// 여러 이미지 병렬 압축
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
