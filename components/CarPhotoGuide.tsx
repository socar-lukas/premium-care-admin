'use client';

import { useRef, useState } from 'react';
import { compressImages } from '@/lib/image-compress';

// 차량 촬영 가이드 타입 (4방향 + 내부)
export type PhotoGuideType = 'front' | 'rear' | 'left' | 'right' | 'interior';

interface PhotoGuideConfig {
  type: PhotoGuideType;
  label: string;
  description: string;
}

export const EXTERIOR_GUIDES: PhotoGuideConfig[] = [
  { type: 'front', label: '전면', description: '차량 정면' },
  { type: 'right', label: '우측', description: '보조석 방향' },
  { type: 'rear', label: '후면', description: '차량 후면' },
  { type: 'left', label: '좌측', description: '운전석 방향' },
];

export const INTERIOR_GUIDE: PhotoGuideConfig = {
  type: 'interior',
  label: '실내',
  description: '실내/계기판/트렁크 등',
};

// 직관적인 차량 실루엣 SVG
const CarSilhouette = ({ angle }: { angle: PhotoGuideType }) => {
  const svgProps = {
    viewBox: "0 0 120 80",
    className: "w-full h-full",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  };

  switch (angle) {
    case 'front':
      return (
        <svg {...svgProps}>
          <rect x="20" y="45" width="80" height="25" rx="3" fill="#6b7280" />
          <rect x="25" y="35" width="70" height="15" rx="2" fill="#9ca3af" />
          <path d="M30 35 L35 20 Q60 15 85 20 L90 35" fill="#9ca3af" stroke="#6b7280" strokeWidth="1"/>
          <path d="M35 33 L38 22 Q60 18 82 22 L85 33" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
          <rect x="25" y="48" width="15" height="8" rx="2" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1"/>
          <rect x="80" y="48" width="15" height="8" rx="2" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1"/>
          <rect x="42" y="50" width="36" height="6" rx="1" fill="#374151"/>
          <rect x="45" y="60" width="30" height="8" rx="1" fill="#ffffff" stroke="#d1d5db" strokeWidth="1"/>
          <ellipse cx="28" cy="70" rx="8" ry="4" fill="#1f2937"/>
          <ellipse cx="92" cy="70" rx="8" ry="4" fill="#1f2937"/>
        </svg>
      );

    case 'rear':
      return (
        <svg {...svgProps}>
          <rect x="20" y="45" width="80" height="25" rx="3" fill="#6b7280" />
          <rect x="25" y="35" width="70" height="15" rx="2" fill="#9ca3af" />
          <path d="M30 35 L35 20 Q60 15 85 20 L90 35" fill="#9ca3af" stroke="#6b7280" strokeWidth="1"/>
          <path d="M38 33 L40 24 Q60 20 80 24 L82 33" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
          <rect x="22" y="48" width="12" height="10" rx="2" fill="#fca5a5" stroke="#ef4444" strokeWidth="1"/>
          <rect x="86" y="48" width="12" height="10" rx="2" fill="#fca5a5" stroke="#ef4444" strokeWidth="1"/>
          <rect x="38" y="48" width="44" height="12" rx="1" fill="#4b5563"/>
          <rect x="45" y="62" width="30" height="8" rx="1" fill="#ffffff" stroke="#d1d5db" strokeWidth="1"/>
          <ellipse cx="28" cy="70" rx="8" ry="4" fill="#1f2937"/>
          <ellipse cx="92" cy="70" rx="8" ry="4" fill="#1f2937"/>
        </svg>
      );

    case 'left':
    case 'right':
      const isLeft = angle === 'left';
      return (
        <svg {...svgProps}>
          <path
            d="M10 55 L15 55 L20 35 L35 25 L85 25 L95 35 L105 35 L110 55 L110 60 L10 60 Z"
            fill="#9ca3af"
            stroke="#6b7280"
            strokeWidth="1"
          />
          <path d="M35 25 L40 18 L80 18 L85 25" fill="#9ca3af" stroke="#6b7280" strokeWidth="1"/>
          <path d="M38 24 L42 19 L58 19 L58 24" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
          <rect x="60" y="19" width="18" height="6" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
          <line x1="58" y1="25" x2="58" y2="55" stroke="#6b7280" strokeWidth="1"/>
          <rect x={isLeft ? "48" : "62"} y="38" width="8" height="3" rx="1" fill="#4b5563"/>
          <circle cx="30" cy="60" r="12" fill="#1f2937" stroke="#374151" strokeWidth="2"/>
          <circle cx="30" cy="60" r="6" fill="#4b5563"/>
          <circle cx="90" cy="60" r="12" fill="#1f2937" stroke="#374151" strokeWidth="2"/>
          <circle cx="90" cy="60" r="6" fill="#4b5563"/>
          {isLeft ? (
            <>
              <rect x="103" y="40" width="5" height="8" rx="1" fill="#fef3c7" stroke="#fcd34d"/>
              <rect x="12" y="42" width="5" height="6" rx="1" fill="#fca5a5" stroke="#ef4444"/>
            </>
          ) : (
            <>
              <rect x="12" y="40" width="5" height="8" rx="1" fill="#fef3c7" stroke="#fcd34d"/>
              <rect x="103" y="42" width="5" height="6" rx="1" fill="#fca5a5" stroke="#ef4444"/>
            </>
          )}
          <ellipse cx={isLeft ? "98" : "22"} cy="28" rx="4" ry="3" fill="#6b7280"/>
        </svg>
      );

    case 'interior':
      return (
        <svg {...svgProps}>
          <rect x="10" y="40" width="100" height="30" rx="3" fill="#374151"/>
          <circle cx="35" cy="55" r="15" fill="none" stroke="#1f2937" strokeWidth="4"/>
          <circle cx="35" cy="55" r="6" fill="#1f2937"/>
          <rect x="18" y="42" width="30" height="10" rx="2" fill="#111827"/>
          <circle cx="26" cy="47" r="3" fill="#374151" stroke="#22c55e" strokeWidth="1"/>
          <circle cx="40" cy="47" r="3" fill="#374151" stroke="#3b82f6" strokeWidth="1"/>
          <rect x="55" y="42" width="25" height="15" rx="2" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1"/>
          <rect x="62" y="60" width="8" height="12" rx="2" fill="#1f2937"/>
          <rect x="85" y="45" width="20" height="8" rx="1" fill="#1f2937"/>
          <path d="M5 15 L10 40 L110 40 L115 15 Q60 5 5 15" fill="#e0f2fe" stroke="#93c5fd" strokeWidth="1"/>
          <rect x="55" y="12" width="10" height="5" rx="1" fill="#1f2937"/>
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <rect x="20" y="20" width="80" height="40" rx="5" fill="#e5e7eb"/>
        </svg>
      );
  }
};

// 다중 사진 업로드 카드 컴포넌트
interface MultiPhotoUploadCardProps {
  guide: PhotoGuideConfig;
  photos: File[];
  onPhotosChange: (files: File[]) => void;
}

export function MultiPhotoUploadCard({ guide, photos, onPhotosChange }: MultiPhotoUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setCompressing(true);
      try {
        // 이미지 압축 (병렬 처리)
        const compressedFiles = await compressImages(files);
        const newPhotos = [...photos, ...compressedFiles];
        onPhotosChange(newPhotos);
        const newUrls = compressedFiles.map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...newUrls]);
      } catch (error) {
        console.error('Error compressing images:', error);
        // 압축 실패 시 원본 사용
        const newPhotos = [...photos, ...files];
        onPhotosChange(newPhotos);
        const newUrls = files.map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...newUrls]);
      } finally {
        setCompressing(false);
      }
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const photoCount = photos.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-1.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-700">{guide.label}</p>
        {photoCount > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded">{photoCount}</span>
        )}
      </div>

      <div className="aspect-square bg-gray-50 relative">
        {photoCount > 0 ? (
          <div className="w-full h-full relative">
            {/* 첫 번째 사진 미리보기 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrls[0]}
              alt={guide.label}
              className="w-full h-full object-cover"
            />
            {/* 여러 장일 때 배지 */}
            {photoCount > 1 && (
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                +{photoCount - 1}
              </div>
            )}
            {/* 삭제/추가 버튼 */}
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow text-xs"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleRemove(0)}
                className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={compressing}
            className="w-full h-full flex flex-col items-center justify-center p-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {compressing ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <div className="w-12 h-10 mb-1 opacity-50">
                  <CarSilhouette angle={guide.type} />
                </div>
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </>
            )}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// 통합 사진 촬영 섹션 (외부 4방향 + 내부 1개를 5칸 그리드로, 다중 사진 지원)
interface PhotoSectionProps {
  title: string;
  photos: Record<PhotoGuideType, File[]>;
  onPhotoChange: (type: PhotoGuideType, files: File[]) => void;
}

export function PhotoSection({ title, photos, onPhotoChange }: PhotoSectionProps) {
  const ALL_GUIDES = [...EXTERIOR_GUIDES, INTERIOR_GUIDE];

  const totalPhotos = Object.values(photos).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        {totalPhotos > 0 && (
          <span className="text-xs text-blue-600">{totalPhotos}장</span>
        )}
      </div>

      {/* 5칸 그리드 (전/우/후/좌/실내) */}
      <div className="grid grid-cols-5 gap-1.5">
        {ALL_GUIDES.map((guide) => (
          <MultiPhotoUploadCard
            key={guide.type}
            guide={guide}
            photos={photos[guide.type]}
            onPhotosChange={(files) => onPhotoChange(guide.type, files)}
          />
        ))}
      </div>
    </div>
  );
}

// 외관 사진 전용 섹션 (전/우/후/좌 4칸만)
interface ExteriorPhotoSectionProps {
  title: string;
  photos: Record<'front' | 'right' | 'rear' | 'left', File[]>;
  onPhotoChange: (type: 'front' | 'right' | 'rear' | 'left', files: File[]) => void;
}

export function ExteriorPhotoSection({ title, photos, onPhotoChange }: ExteriorPhotoSectionProps) {
  const totalPhotos = Object.values(photos).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        {totalPhotos > 0 && (
          <span className="text-xs text-blue-600">{totalPhotos}장</span>
        )}
      </div>

      {/* 4칸 그리드 (전/우/후/좌) */}
      <div className="grid grid-cols-4 gap-2">
        {EXTERIOR_GUIDES.map((guide) => (
          <MultiPhotoUploadCard
            key={guide.type}
            guide={guide}
            photos={photos[guide.type as 'front' | 'right' | 'rear' | 'left']}
            onPhotosChange={(files) => onPhotoChange(guide.type as 'front' | 'right' | 'rear' | 'left', files)}
          />
        ))}
      </div>
    </div>
  );
}

// 내부 사진 통합 업로드 섹션 (발매트, 컵홀더 등 여러 장)
interface InteriorMultiPhotoSectionProps {
  title: string;
  photos: File[];
  onPhotosChange: (files: File[]) => void;
}

export function InteriorMultiPhotoSection({ title, photos, onPhotosChange }: InteriorMultiPhotoSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setCompressing(true);
      try {
        const compressedFiles = await compressImages(files);
        const newPhotos = [...photos, ...compressedFiles];
        onPhotosChange(newPhotos);
        const newUrls = compressedFiles.map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...newUrls]);
      } catch (error) {
        console.error('Error compressing images:', error);
        const newPhotos = [...photos, ...files];
        onPhotosChange(newPhotos);
        const newUrls = files.map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...newUrls]);
      } finally {
        setCompressing(false);
      }
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        {photos.length > 0 && (
          <span className="text-xs text-blue-600">{photos.length}장</span>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        {/* 업로드된 사진 미리보기 */}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`내부 사진 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 업로드 버튼 */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={compressing}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {compressing ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm text-gray-500">사진 추가</span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
