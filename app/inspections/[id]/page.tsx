'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BlackLabelLogo from '@/components/BlackLabelLogo';

interface InspectionDetails {
  contamination?: string;
  exteriorDamage?: string;
  tires?: {
    frontLeft: string;
    frontRight: string;
    rearLeft: string;
    rearRight: string;
  };
  interiorContamination?: string[];
  carWash?: string;
  battery?: string;
  wiperWasher?: string[];
  warningLights?: string[];
}

interface InspectionPhoto {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  googleDriveUrl: string | null;
  description: string | null;
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
  completedAt: string | null;
  inspectionType: string;
  overallStatus: string;
  inspector: string | null;
  memo: string | null;
  details: InspectionDetails | null;
  areas: InspectionArea[];
  vehicle: {
    id: string;
    vehicleNumber: string;
    ownerName: string;
    manufacturer: string | null;
    model: string | null;
  };
}

export default function InspectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 50%, #A3D1FF 100%)' }}>
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 50%, #A3D1FF 100%)' }}>
        <div className="text-gray-500">점검 기록을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const details = inspection.details;

  // 상태 색상 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case '상':
      case '파손':
      case '방전':
        return 'bg-red-100 text-red-700';
      case '중':
      case '경미':
      case '전압낮음':
        return 'bg-yellow-100 text-yellow-700';
      case '하':
      case '이상없음':
      case '정상':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 50%, #A3D1FF 100%)' }}>
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between h-14 items-center">
            <Link href="/" className="flex items-center gap-2">
              <BlackLabelLogo />
              <span className="text-sm font-black tracking-tight">
                <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Black</span>
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Label</span>
                <span className="text-gray-500 font-medium ml-0.5">Admin</span>
              </span>
            </Link>
            <Link
              href={`/vehicles/${inspection.vehicle.id}`}
              className="text-sm text-blue-600 font-medium"
            >
              차량 상세
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-4 md:py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {/* 헤더 */}
          <div className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">세차·점검 기록</h1>
                <p className="text-sm text-gray-500">{inspection.vehicle.vehicleNumber}</p>
              </div>
            </div>

            {/* 시간 정보 */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">점검 시작</p>
                <p className="font-medium text-gray-900">
                  {new Date(inspection.inspectionDate).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">점검 완료</p>
                <p className="font-medium text-gray-900">
                  {inspection.completedAt
                    ? new Date(inspection.completedAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'}
                </p>
              </div>
            </div>

            {/* 담당자 */}
            {inspection.inspector && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-gray-500">담당자:</span>
                <span className="font-medium text-gray-900">{inspection.inspector}</span>
              </div>
            )}
          </div>

          {details ? (
            <>
              {/* 차량 상태 점검 */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">차량 상태 점검</h3>

                {/* 반납차량 오염도 */}
                {details.contamination && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">반납차량 오염도</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(details.contamination)}`}>
                      {details.contamination === '상' ? '상 (심함)' : details.contamination === '중' ? '중 (보통)' : '하 (깨끗)'}
                    </span>
                  </div>
                )}

                {/* 외관이상 유형 */}
                {details.exteriorDamage && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">외관이상 유형</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(details.exteriorDamage.includes('파손') ? '파손' : details.exteriorDamage.includes('경미') ? '경미' : '이상없음')}`}>
                      {details.exteriorDamage}
                    </span>
                  </div>
                )}

                {/* 타이어 상태 */}
                {details.tires && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">타이어 상태</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'frontLeft', label: '앞바퀴 (좌)' },
                        { key: 'frontRight', label: '앞바퀴 (우)' },
                        { key: 'rearLeft', label: '뒷바퀴 (좌)' },
                        { key: 'rearRight', label: '뒷바퀴 (우)' },
                      ].map((tire) => (
                        <div key={tire.key} className="bg-gray-50 rounded-lg p-2 flex justify-between items-center">
                          <span className="text-xs text-gray-500">{tire.label}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(details.tires![tire.key as keyof typeof details.tires])}`}>
                            {details.tires![tire.key as keyof typeof details.tires]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 내부 오염 위치 */}
                {details.interiorContamination && details.interiorContamination.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">내부 오염 위치</p>
                    <div className="flex flex-wrap gap-1.5">
                      {details.interiorContamination.map((location) => (
                        <span key={location} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 조치 사항 */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">조치 사항</h3>

                {/* 세차 */}
                {details.carWash && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">세차</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {details.carWash}
                    </span>
                  </div>
                )}

                {/* 배터리 상태 */}
                {details.battery && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">배터리 상태</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(details.battery)}`}>
                      {details.battery}
                    </span>
                  </div>
                )}

                {/* 와이퍼/워셔액 */}
                {details.wiperWasher && details.wiperWasher.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">와이퍼/워셔액</p>
                    <div className="flex flex-wrap gap-1.5">
                      {details.wiperWasher.map((item) => (
                        <span key={item} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${item === '정상' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 경고등 */}
                {details.warningLights && details.warningLights.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">경고등</p>
                    <div className="flex flex-wrap gap-1.5">
                      {details.warningLights.map((item) => (
                        <span key={item} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${item === '없음' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              상세 점검 데이터가 없습니다.
            </div>
          )}

          {/* 특이사항 */}
          {inspection.memo && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">특이사항</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{inspection.memo}</p>
            </div>
          )}

          {/* 첨부 사진 */}
          {inspection.areas && inspection.areas.length > 0 && (() => {
            const allPhotos = inspection.areas.flatMap(area => area.photos || []);
            if (allPhotos.length === 0) return null;

            // 사진을 점검 전/후로 분류
            const beforePhotos = allPhotos.filter(p => p.description?.startsWith('before_'));
            const afterPhotos = allPhotos.filter(p => p.description?.startsWith('after_'));
            const otherPhotos = allPhotos.filter(p => !p.description?.startsWith('before_') && !p.description?.startsWith('after_'));

            const getPhotoLabel = (description: string | null) => {
              if (!description) return '';
              const parts = description.replace('before_', '').replace('after_', '').split('_');
              const type = parts[0];
              const labels: Record<string, string> = {
                front: '전면',
                rear: '후면',
                left: '좌측',
                right: '우측',
                interior: '실내',
              };
              return labels[type] || type;
            };

            const renderPhotoGrid = (photos: InspectionPhoto[], title: string) => {
              if (photos.length === 0) return null;
              return (
                <div>
                  <p className="text-xs text-gray-500 mb-2">{title} ({photos.length}장)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo) => {
                      const imageUrl = photo.googleDriveUrl ||
                        (photo.filePath?.startsWith('http') ? photo.filePath : null);
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity relative group"
                        >
                          {imageUrl ? (
                            <>
                              <div className="absolute inset-0 bg-gray-200 animate-pulse group-has-[img[data-loaded]]:hidden"></div>
                              <img
                                src={imageUrl}
                                alt={photo.originalFileName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')}
                              />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-1">
                              {photo.originalFileName}
                            </div>
                          )}
                          {photo.description && (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-0.5 text-center">
                              {getPhotoLabel(photo.description)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  첨부 사진 ({allPhotos.length}장)
                </h3>
                {renderPhotoGrid(beforePhotos, '점검 전')}
                {renderPhotoGrid(afterPhotos, '점검 후')}
                {renderPhotoGrid(otherPhotos, '기타')}
              </div>
            );
          })()}

          {/* 하단 버튼 */}
          <div className="pt-4 border-t border-gray-100">
            <Link
              href={`/vehicles/${inspection.vehicle.id}`}
              className="block w-full py-3 text-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-all"
            >
              차량 정보로 돌아가기
            </Link>
          </div>
        </div>
      </main>

      {/* 사진 확대 모달 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedPhoto.googleDriveUrl || selectedPhoto.filePath}
            alt={selectedPhoto.originalFileName}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {selectedPhoto.description && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {selectedPhoto.description.replace('before_', '점검 전 - ').replace('after_', '점검 후 - ').replace(/_\d+$/, '')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
