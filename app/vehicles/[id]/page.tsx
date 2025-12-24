'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SocarLogo from '@/components/SocarLogo';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  ownerName: string;
  model: string | null;
  manufacturer: string | null;
  year: number | null;
  contact: string | null;
  vehicleType: string | null;
  memo: string | null;
}

interface InspectionArea {
  id: string;
  areaCategory: string;
  areaName: string;
  status: string;
  memo: string | null;
  photos: InspectionPhoto[];
}

interface InspectionPhoto {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  googleDriveUrl: string | null;
  description: string | null;
}

interface Inspection {
  id: string;
  inspectionDate: string;
  inspectionType: string;
  overallStatus: string;
  inspector: string | null;
  memo: string | null;
  areas: InspectionArea[];
}

export default function VehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  useEffect(() => {
    fetchVehicle();
  }, [params.id]);

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`/api/vehicles/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setVehicle(data);
        setInspections(data.inspections || []);
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
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

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">차량을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/vehicles" className="flex items-center gap-3">
              <SocarLogo />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                Socar Premium Admin
              </span>
            </Link>
            <div className="flex gap-4">
              <Link
                href="/vehicles"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                목록으로
              </Link>
              <button
                onClick={() => setShowInspectionForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                점검 기록 추가
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 차량 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">차량 정보</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">차량번호</span>
              <p className="text-lg font-medium">{vehicle.vehicleNumber}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">소유자</span>
              <p className="text-lg font-medium">{vehicle.ownerName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">제조사/모델</span>
              <p className="text-lg font-medium">
                {vehicle.manufacturer} {vehicle.model}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">연식</span>
              <p className="text-lg font-medium">{vehicle.year || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">연락처</span>
              <p className="text-lg font-medium">{vehicle.contact || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">차량 유형</span>
              <p className="text-lg font-medium">{vehicle.vehicleType || '-'}</p>
            </div>
            {vehicle.memo && (
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500">메모</span>
                <p className="text-lg font-medium">{vehicle.memo}</p>
              </div>
            )}
          </div>
        </div>

        {/* 점검 기록 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">점검 기록</h2>
          </div>
          <div className="p-6">
            {inspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 점검 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-6">
                {inspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {new Date(inspection.inspectionDate).toLocaleDateString(
                            'ko-KR'
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {inspection.inspectionType} | 상태: {inspection.overallStatus}
                          {inspection.inspector && ` | 담당자: ${inspection.inspector}`}
                        </p>
                      </div>
                      <Link
                        href={`/inspections/${inspection.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        상세보기 →
                      </Link>
                    </div>

                    {inspection.areas && inspection.areas.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          점검 부위
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {inspection.areas.map((area) => (
                            <div
                              key={area.id}
                              className="border border-gray-100 rounded p-3"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">{area.areaName}</p>
                                  <p className="text-xs text-gray-500">
                                    {area.areaCategory}
                                  </p>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
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
                              </div>
                              {area.photos && area.photos.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {area.photos.slice(0, 3).map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="w-16 h-16 relative rounded overflow-hidden bg-gray-100"
                                    >
                                      {(() => {
                                        // Google Drive URL 우선 사용
                                        const imageUrl = photo.googleDriveUrl || 
                                          (photo.filePath?.startsWith('http') ? photo.filePath : null);
                                        
                                        if (imageUrl) {
                                          return (
                                            <img
                                              src={imageUrl}
                                              alt={photo.originalFileName}
                                              className="w-full h-full object-cover"
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
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-1">
                                            {photo.originalFileName}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ))}
                                  {area.photos.length > 3 && (
                                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-500">
                                      +{area.photos.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showInspectionForm && (
        <InspectionFormModal
          vehicleId={vehicle.id}
          vehicleNumber={vehicle.vehicleNumber}
          onClose={() => {
            setShowInspectionForm(false);
            fetchVehicle();
          }}
        />
      )}
    </div>
  );
}

function InspectionFormModal({
  vehicleId,
  vehicleNumber,
  onClose,
}: {
  vehicleId: string;
  vehicleNumber: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().slice(0, 16),
    inspectionType: '세차전',
    overallStatus: '양호',
    inspector: '',
    memo: '',
  });
  const [areas, setAreas] = useState<
    Array<{
      areaCategory: string;
      areaName: string;
      status: string;
      memo: string;
      photos: File[];
      photoPreviews: string[];
    }>
  >([{ areaCategory: '외부', areaName: '', status: '양호', memo: '', photos: [], photoPreviews: [] }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validAreas = areas.filter((a) => a.areaName.trim() !== '');
      
      // 점검 기록 생성
      const payload = {
        vehicleId,
        inspectionDate: new Date(formData.inspectionDate).toISOString(),
        inspectionType: formData.inspectionType,
        overallStatus: formData.overallStatus,
        inspector: formData.inspector || undefined,
        memo: formData.memo || undefined,
        areas: validAreas.map((a) => ({
          areaCategory: a.areaCategory,
          areaName: a.areaName,
          status: a.status,
          memo: a.memo || undefined,
        })),
      };

      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || '등록에 실패했습니다.');
        setLoading(false);
        return;
      }

      const inspection = await res.json();

      // 각 부위별로 사진 업로드
      for (let i = 0; i < validAreas.length; i++) {
        const area = validAreas[i];
        const createdArea = inspection.areas[i];
        
        if (area.photos.length > 0 && createdArea) {
          const photoFormData = new FormData();
          photoFormData.append('inspectionAreaId', createdArea.id);
          area.photos.forEach((file) => {
            photoFormData.append('files', file);
          });

          try {
            const photoRes = await fetch('/api/photos/upload', {
              method: 'POST',
              body: photoFormData,
            });

            if (!photoRes.ok) {
              console.error(`부위 ${area.areaName}의 사진 업로드 실패`);
            }
          } catch (error) {
            console.error(`부위 ${area.areaName}의 사진 업로드 오류:`, error);
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addArea = () => {
    setAreas([...areas, { areaCategory: '외부', areaName: '', status: '양호', memo: '', photos: [], photoPreviews: [] }]);
  };

  const removeArea = (index: number) => {
    setAreas(areas.filter((_, i) => i !== index));
  };

  const updateArea = (index: number, field: string, value: string) => {
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], [field]: value };
    setAreas(newAreas);
  };

  const handlePhotoChange = (areaIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAreas = [...areas];
    const area = { ...newAreas[areaIndex] };
    
    // 파일 추가
    area.photos = [...area.photos, ...files];
    
    // 미리보기 생성
    const previewPromises = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then((previews) => {
      const updatedAreas = [...areas];
      updatedAreas[areaIndex] = {
        ...area,
        photoPreviews: [...area.photoPreviews, ...previews],
      };
      setAreas(updatedAreas);
    });

    // 파일 입력 초기화
    e.target.value = '';
  };

  const removePhoto = (areaIndex: number, photoIndex: number) => {
    const newAreas = [...areas];
    const area = newAreas[areaIndex];
    area.photos = area.photos.filter((_, i) => i !== photoIndex);
    area.photoPreviews = area.photoPreviews.filter((_, i) => i !== photoIndex);
    setAreas(newAreas);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl max-w-4xl w-full h-[95vh] md:h-auto md:max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">점검 기록 추가</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                점검 일자 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.inspectionDate}
                onChange={(e) =>
                  setFormData({ ...formData, inspectionDate: e.target.value })
                }
                className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                점검 유형 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.inspectionType}
                onChange={(e) =>
                  setFormData({ ...formData, inspectionType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="세차전">세차전</option>
                <option value="세차후">세차후</option>
                <option value="정기점검">정기점검</option>
                <option value="수리">수리</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전체 상태 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.overallStatus}
                onChange={(e) =>
                  setFormData({ ...formData, overallStatus: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="우수">우수</option>
                <option value="양호">양호</option>
                <option value="보통">보통</option>
                <option value="불량">불량</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자
              </label>
              <input
                type="text"
                value={formData.inspector}
                onChange={(e) =>
                  setFormData({ ...formData, inspector: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전체 메모
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">점검 부위</h3>
              <button
                type="button"
                onClick={addArea}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                부위 추가
              </button>
            </div>

            <div className="space-y-4">
              {areas.map((area, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        카테고리
                      </label>
                      <select
                        value={area.areaCategory}
                        onChange={(e) =>
                          updateArea(index, 'areaCategory', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="외부">외부</option>
                        <option value="내부">내부</option>
                        <option value="엔진실">엔진실</option>
                        <option value="타이어">타이어</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        부위명
                      </label>
                      <input
                        type="text"
                        value={area.areaName}
                        onChange={(e) =>
                          updateArea(index, 'areaName', e.target.value)
                        }
                        placeholder="예: 앞범퍼"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상태
                      </label>
                      <select
                        value={area.status}
                        onChange={(e) =>
                          updateArea(index, 'status', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="우수">우수</option>
                        <option value="양호">양호</option>
                        <option value="보통">보통</option>
                        <option value="불량">불량</option>
                        <option value="수리필요">수리필요</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeArea(index)}
                        className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      메모
                    </label>
                    <textarea
                      value={area.memo}
                      onChange={(e) =>
                        updateArea(index, 'memo', e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사진 추가
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(index, e)}
                      className="w-full px-3 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {area.photoPreviews.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {area.photoPreviews.map((preview, photoIndex) => (
                          <div key={photoIndex} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${photoIndex + 1}`}
                              className="w-full h-20 object-cover rounded border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index, photoIndex)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {area.photos.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {area.photos.length}개 사진 선택됨
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-base md:text-sm"
            >
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


