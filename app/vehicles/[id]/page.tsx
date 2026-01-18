'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SocarLogo from '@/components/SocarLogo';
import { useAuth } from '@/contexts/AuthContext';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  ownerName: string;
  model: string | null;
  manufacturer: string | null;
  year: number | null;
  contact: string | null;
  vehicleType: string | null;
  engine: string | null;
  fuel: string | null;
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
}

export default function VehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAllInspections, setShowAllInspections] = useState(false);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);

  // 세차·점검 기록과 소모품·경정비 기록 분리
  const carWashInspections = inspections.filter(i => i.inspectionType !== '소모품·경정비');
  const maintenanceRecords = inspections.filter(i => i.inspectionType === '소모품·경정비');

  const handleDeleteInspection = async (inspectionId: string) => {
    if (!confirm('정말 이 점검 기록을 삭제하시겠습니까?')) {
      return;
    }

    setDeleting(inspectionId);
    try {
      const adminPin = sessionStorage.getItem('adminPin');
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-pin': adminPin || '',
        },
      });

      if (res.ok) {
        setInspections(inspections.filter((i) => i.id !== inspectionId));
      } else {
        const error = await res.json();
        alert(error.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting inspection:', error);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(null);
    }
  };

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 50%, #A3D1FF 100%)' }}>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-3">
              <SocarLogo />
              <span className="text-base md:text-lg font-bold text-gray-900">
                Socar Premium Admin
              </span>
            </Link>
            <div className="flex gap-2 md:gap-4">
              <Link
                href="/"
                className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                대시보드
              </Link>
              <Link
                href={`/inspections/new?vehicleId=${vehicle.id}&vehicleNumber=${encodeURIComponent(vehicle.vehicleNumber)}&manufacturer=${encodeURIComponent(vehicle.manufacturer || '')}&model=${encodeURIComponent(vehicle.model || '')}`}
                className="px-3 md:px-4 py-2 text-white rounded-md text-xs md:text-sm font-medium transition-all duration-200" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}
              >
                세차·점검 기록 등록
              </Link>
              <Link
                href={`/maintenance/new?vehicleId=${vehicle.id}&vehicleNumber=${encodeURIComponent(vehicle.vehicleNumber)}&manufacturer=${encodeURIComponent(vehicle.manufacturer || '')}&model=${encodeURIComponent(vehicle.model || '')}`}
                className="px-3 md:px-4 py-2 text-white rounded-md text-xs md:text-sm font-medium transition-all duration-200" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
              >
                소모품·경정비 기록 등록
              </Link>
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
              <span className="text-sm text-gray-500">제조사/모델명</span>
              <p className="text-lg font-medium">
                {vehicle.manufacturer && vehicle.model
                  ? `${vehicle.manufacturer}/${vehicle.model}`
                  : vehicle.manufacturer || vehicle.model || '-'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">엔진</span>
              <p className="text-lg font-medium">{vehicle.engine || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">연식</span>
              <p className="text-lg font-medium">{vehicle.year || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">연료</span>
              <p className="text-lg font-medium">{vehicle.fuel || '-'}</p>
            </div>
            {vehicle.contact && (
              <div>
                <span className="text-sm text-gray-500">연락처</span>
                <p className="text-lg font-medium">{vehicle.contact}</p>
              </div>
            )}
            {vehicle.vehicleType && (
              <div>
                <span className="text-sm text-gray-500">차량 유형</span>
                <p className="text-lg font-medium">{vehicle.vehicleType}</p>
              </div>
            )}
            {vehicle.memo && (
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500">메모</span>
                <p className="text-lg font-medium">{vehicle.memo}</p>
              </div>
            )}
          </div>
        </div>

        {/* 세차·점검기록 목록 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">세차·점검 기록</h2>
          </div>
          <div className="p-6">
            {carWashInspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 세차·점검 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllInspections ? carWashInspections : carWashInspections.slice(0, 3)).map((inspection) => {
                  const details = inspection.details;
                  const hasCarWashMemo = inspection.memo && inspection.memo.trim().length > 0;
                  const hasExteriorIssue = details?.exteriorDamage && details.exteriorDamage !== '이상없음';
                  const hasPhotos = inspection.areas?.some(area => area.photos && area.photos.length > 0);

                  // 모든 사진 수집
                  const allPhotos = inspection.areas?.flatMap(area => area.photos || []) || [];

                  return (
                    <div
                      key={inspection.id}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* 상단 요약 정보 */}
                      <div className="p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm text-gray-500">
                              {inspection.completedAt
                                ? new Date(inspection.completedAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : new Date(inspection.inspectionDate).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                              {' 완료'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/inspections/${inspection.id}`}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              상세보기
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteInspection(inspection.id)}
                                disabled={deleting === inspection.id}
                                className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                              >
                                {deleting === inspection.id ? '삭제 중...' : '삭제'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 태그 형태의 요약 정보 */}
                        <div className="flex flex-wrap gap-2">
                          {/* 세차 타입 */}
                          {details?.carWash && (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                              {details.carWash}
                            </span>
                          )}

                          {/* 세차 특이사항 */}
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            hasCarWashMemo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            세차 특이사항 {hasCarWashMemo ? 'O' : 'X'}
                          </span>

                          {/* 외관 특이사항 */}
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            hasExteriorIssue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            외관 특이사항 {hasExteriorIssue ? 'O' : 'X'}
                          </span>

                          {/* 사진 첨부 */}
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            hasPhotos ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            사진첨부 {hasPhotos ? 'O' : 'X'}
                          </span>

                          {/* 담당자 */}
                          {inspection.inspector && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                              담당: {inspection.inspector}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 하단 상세 내용 (메모 및 사진) */}
                      {(inspection.memo || allPhotos.length > 0) && (
                        <div className="p-4 border-t border-gray-100">
                          {/* 특이사항 메모 */}
                          {inspection.memo && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">특이사항</p>
                              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                {inspection.memo}
                              </p>
                            </div>
                          )}

                          {/* 사진 미리보기 (3장만) */}
                          {allPhotos.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">첨부 사진 ({allPhotos.length}장)</p>
                              <div className="flex gap-2">
                                {allPhotos.slice(0, 3).map((photo) => (
                                  <div
                                    key={photo.id}
                                    className="w-16 h-16 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100"
                                  >
                                    {(() => {
                                      const imageUrl = photo.googleDriveUrl ||
                                        (photo.filePath?.startsWith('http') ? photo.filePath : null);

                                      if (imageUrl) {
                                        return (
                                          <img
                                            src={imageUrl}
                                            alt={photo.originalFileName}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
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
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                                          {photo.originalFileName}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ))}
                                {allPhotos.length > 3 && (
                                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-500 font-medium">
                                    +{allPhotos.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 더보기 버튼 */}
                {carWashInspections.length > 3 && !showAllInspections && (
                  <button
                    onClick={() => setShowAllInspections(true)}
                    className="w-full py-3 text-center text-blue-600 hover:text-blue-800 font-medium text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    더보기 ({carWashInspections.length - 3}개 더)
                  </button>
                )}

                {/* 접기 버튼 */}
                {carWashInspections.length > 3 && showAllInspections && (
                  <button
                    onClick={() => setShowAllInspections(false)}
                    className="w-full py-3 text-center text-gray-500 hover:text-gray-700 font-medium text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    접기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 소모품·경정비 기록 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">소모품·경정비 기록</h2>
          </div>
          <div className="p-6">
            {maintenanceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 소모품·경정비 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllMaintenance ? maintenanceRecords : maintenanceRecords.slice(0, 3)).map((record) => {
                  const details = record.details as { consumables?: string[]; repairs?: string[]; accidentRepairs?: string[] } | null;
                  const hasPhotos = record.areas?.some(area => area.photos && area.photos.length > 0);
                  const allPhotos = record.areas?.flatMap(area => area.photos || []) || [];

                  return (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm text-gray-500">
                              {record.completedAt
                                ? new Date(record.completedAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : new Date(record.inspectionDate).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                              {' 완료'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/inspections/${record.id}`}
                              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                            >
                              상세보기
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteInspection(record.id)}
                                disabled={deleting === record.id}
                                className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                              >
                                {deleting === record.id ? '삭제 중...' : '삭제'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 작업 항목 태그 */}
                        <div className="flex flex-wrap gap-2">
                          {details?.consumables && details.consumables.length > 0 && (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                              소모품 {details.consumables.length}건
                            </span>
                          )}
                          {details?.repairs && details.repairs.length > 0 && (
                            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                              경정비 {details.repairs.length}건
                            </span>
                          )}
                          {details?.accidentRepairs && details.accidentRepairs.length > 0 && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                              사고수리 {details.accidentRepairs.length}건
                            </span>
                          )}
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            hasPhotos ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            사진첨부 {hasPhotos ? 'O' : 'X'}
                          </span>
                          {record.inspector && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                              담당: {record.inspector}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 상세 내용 */}
                      {(record.memo || allPhotos.length > 0 || details?.consumables || details?.repairs || details?.accidentRepairs) && (
                        <div className="p-4 border-t border-gray-100">
                          {/* 작업 항목 상세 */}
                          {details?.consumables && details.consumables.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">소모품 교체</p>
                              <p className="text-sm text-gray-700">{details.consumables.join(', ')}</p>
                            </div>
                          )}
                          {details?.repairs && details.repairs.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">경정비</p>
                              <p className="text-sm text-gray-700">{details.repairs.join(', ')}</p>
                            </div>
                          )}
                          {details?.accidentRepairs && details.accidentRepairs.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">사고수리</p>
                              <p className="text-sm text-gray-700">{details.accidentRepairs.join(', ')}</p>
                            </div>
                          )}

                          {record.memo && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">특이사항</p>
                              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{record.memo}</p>
                            </div>
                          )}

                          {allPhotos.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">첨부 사진 ({allPhotos.length}장)</p>
                              <div className="flex gap-2">
                                {allPhotos.slice(0, 3).map((photo) => (
                                  <div
                                    key={photo.id}
                                    className="w-16 h-16 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100"
                                  >
                                    {(() => {
                                      const imageUrl = photo.googleDriveUrl ||
                                        (photo.filePath?.startsWith('http') ? photo.filePath : null);

                                      if (imageUrl) {
                                        return (
                                          <img
                                            src={imageUrl}
                                            alt={photo.originalFileName}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        );
                                      }
                                      return (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                                          {photo.originalFileName}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ))}
                                {allPhotos.length > 3 && (
                                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-500 font-medium">
                                    +{allPhotos.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 더보기 버튼 */}
                {maintenanceRecords.length > 3 && !showAllMaintenance && (
                  <button
                    onClick={() => setShowAllMaintenance(true)}
                    className="w-full py-3 text-center text-amber-600 hover:text-amber-800 font-medium text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    더보기 ({maintenanceRecords.length - 3}개 더)
                  </button>
                )}

                {/* 접기 버튼 */}
                {maintenanceRecords.length > 3 && showAllMaintenance && (
                  <button
                    onClick={() => setShowAllMaintenance(false)}
                    className="w-full py-3 text-center text-gray-500 hover:text-gray-700 font-medium text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    접기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      </div>
  );
}
