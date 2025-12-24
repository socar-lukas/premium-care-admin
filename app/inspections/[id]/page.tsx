'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SocarLogo from '@/components/SocarLogo';

interface InspectionPhoto {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  googleDriveUrl: string | null;
  description: string | null;
  uploadedAt: string;
}

interface InspectionArea {
  id: string;
  areaCategory: string;
  areaName: string;
  status: string;
  memo: string | null;
  photos: InspectionPhoto[];
}

interface Inspection {
  id: string;
  inspectionDate: string;
  inspectionType: string;
  overallStatus: string;
  inspector: string | null;
  memo: string | null;
  vehicle: {
    id: string;
    vehicleNumber: string;
    ownerName: string;
  };
  areas: InspectionArea[];
}

export default function InspectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<InspectionPhoto | null>(null);

  useEffect(() => {
    fetchInspection();
  }, [params.id]);

  const fetchInspection = async () => {
    try {
      const res = await fetch(`/api/inspections/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInspection(data);
      }
    } catch (error) {
      console.error('Error fetching inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">점검 기록을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              href={`/vehicles/${inspection.vehicle.id}`}
              className="flex items-center gap-3"
            >
              <SocarLogo />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                프리미엄 차량 관리
              </span>
            </Link>
            <div className="flex gap-4">
              <Link
                href={`/vehicles/${inspection.vehicle.id}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                차량 상세로
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 점검 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {inspection.vehicle.vehicleNumber} - {inspection.vehicle.ownerName}
              </h1>
              <p className="text-gray-500">
                {new Date(inspection.inspectionDate).toLocaleString('ko-KR')}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded text-sm font-medium ${
                inspection.overallStatus === '우수'
                  ? 'bg-green-100 text-green-800'
                  : inspection.overallStatus === '양호'
                  ? 'bg-blue-100 text-blue-800'
                  : inspection.overallStatus === '보통'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {inspection.overallStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500">점검 유형</span>
              <p className="font-medium">{inspection.inspectionType}</p>
            </div>
            {inspection.inspector && (
              <div>
                <span className="text-sm text-gray-500">담당자</span>
                <p className="font-medium">{inspection.inspector}</p>
              </div>
            )}
          </div>

          {inspection.memo && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <span className="text-sm text-gray-500">메모</span>
              <p className="mt-1">{inspection.memo}</p>
            </div>
          )}
        </div>

        {/* 점검 부위 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">점검 부위</h2>
          </div>
          <div className="p-6">
            {inspection.areas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 점검 부위가 없습니다.
              </div>
            ) : (
              <div className="space-y-6">
                {inspection.areas.map((area) => (
                  <div
                    key={area.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{area.areaName}</h3>
                        <p className="text-sm text-gray-500">{area.areaCategory}</p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded text-sm ${
                            area.status === '우수'
                              ? 'bg-green-100 text-green-800'
                              : area.status === '양호'
                              ? 'bg-blue-100 text-blue-800'
                              : area.status === '보통'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {area.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedArea(area.id);
                            setShowPhotoUpload(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          사진 추가
                        </button>
                      </div>
                    </div>

                    {area.memo && (
                      <p className="text-sm text-gray-600 mb-4">{area.memo}</p>
                    )}

                    {area.photos && area.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {area.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            {(() => {
                              // Vercel 환경에서는 Google Drive URL 우선 사용
                              const imageUrl = photo.googleDriveUrl || 
                                (photo.filePath?.startsWith('http') ? photo.filePath : null) ||
                                (photo.filePath && !photo.filePath.startsWith('/uploads') ? photo.filePath : null);
                              
                              if (imageUrl) {
                                return (
                                  <img
                                    src={imageUrl}
                                    alt={photo.originalFileName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Google Drive URL이 있으면 시도
                                      if (photo.googleDriveUrl && e.currentTarget.src !== photo.googleDriveUrl) {
                                        e.currentTarget.src = photo.googleDriveUrl;
                                      } else if (photo.filePath && photo.filePath.startsWith('http') && e.currentTarget.src !== photo.filePath) {
                                        e.currentTarget.src = photo.filePath;
                                      } else {
                                        e.currentTarget.style.display = 'none';
                                      }
                                    }}
                                  />
                                );
                              }
                              return (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  {photo.originalFileName}
                                </div>
                              );
                            })()}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm opacity-0 group-hover:opacity-100">
                                클릭하여 확대
                              </span>
                            </div>
                            {photo.description && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                                {photo.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showPhotoUpload && selectedArea && (
        <PhotoUploadModal
          inspectionAreaId={selectedArea}
          onClose={() => {
            setShowPhotoUpload(false);
            setSelectedArea(null);
            fetchInspection();
          }}
        />
      )}

      {selectedPhoto && (
        <PhotoViewerModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}

function PhotoUploadModal({
  inspectionAreaId,
  onClose,
}: {
  inspectionAreaId: string;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles([...files, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('inspectionAreaId', inspectionAreaId);
      if (description) formData.append('description', description);
      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onClose();
      } else {
        const error = await res.json();
        alert(error.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl max-w-2xl w-full h-[95vh] md:h-auto md:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">사진 업로드</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사진 선택 (다중 선택 가능)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {previews.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                미리보기 ({previews.length}개)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 md:w-6 md:h-6 flex items-center justify-center text-sm md:text-xs shadow-lg"
                      aria-label="삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택사항)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="사진에 대한 설명을 입력하세요"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 justify-end pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="w-full sm:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-base md:text-sm"
            >
              {uploading ? '업로드 중...' : `${files.length}개 사진 업로드`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PhotoViewerModal({
  photo,
  onClose,
}: {
  photo: InspectionPhoto;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="max-w-5xl w-full">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10"
          >
            ✕
          </button>
          {(() => {
            // Google Drive URL 우선 사용
            const imageUrl = photo.googleDriveUrl || 
              (photo.filePath?.startsWith('http') ? photo.filePath : null);
            
            if (imageUrl) {
              return (
                <img
                  src={imageUrl}
                  alt={photo.originalFileName}
                  className="w-full h-auto max-h-[90vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    // 대체 URL 시도
                    if (photo.filePath && photo.filePath.startsWith('http') && e.currentTarget.src !== photo.filePath) {
                      e.currentTarget.src = photo.filePath;
                    } else {
                      e.currentTarget.style.display = 'none';
                    }
                  }}
                />
              );
            }
            return (
              <div className="w-full h-full flex items-center justify-center text-white">
                이미지를 불러올 수 없습니다: {photo.originalFileName}
              </div>
            );
          })()}
          {photo.description && (
            <div className="mt-4 bg-white bg-opacity-90 rounded p-4">
              <p className="text-gray-900">{photo.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(photo.uploadedAt).toLocaleString('ko-KR')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


