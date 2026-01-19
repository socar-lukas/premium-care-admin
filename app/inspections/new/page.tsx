'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SocarLogo from '@/components/SocarLogo';
import {
  PhotoGuideType,
  PhotoSection,
} from '@/components/CarPhotoGuide';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  model: string | null;
  manufacturer: string | null;
}

// 담당자 목록 (로컬 스토리지에 저장)
const INSPECTORS_KEY = 'premium_care_inspectors';

export default function NewInspectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">로딩 중...</div></div>}>
      <InspectionForm />
    </Suspense>
  );
}

function InspectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(new Date());
  const [startTimeDisplay, setStartTimeDisplay] = useState('');

  // 차량 검색
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleSuggestions, setVehicleSuggestions] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const vehicleInputRef = useRef<HTMLInputElement>(null);

  // URL 파라미터로 전달된 차량 정보 자동 선택
  useEffect(() => {
    const vehicleId = searchParams.get('vehicleId');
    const vehicleNumber = searchParams.get('vehicleNumber');
    if (vehicleId && vehicleNumber) {
      setSelectedVehicle({
        id: vehicleId,
        vehicleNumber: vehicleNumber,
        manufacturer: searchParams.get('manufacturer') || null,
        model: searchParams.get('model') || null,
      });
    }
  }, [searchParams]);

  // 담당자
  const [inspectors, setInspectors] = useState<string[]>([]);
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [selectedInspector, setSelectedInspector] = useState('');
  const [showInspectorDropdown, setShowInspectorDropdown] = useState(false);

  // 점검 항목
  const [contamination, setContamination] = useState<string>(''); // 반납차량 오염도
  const [exteriorDamage, setExteriorDamage] = useState<string>(''); // 외관이상 유형
  const [tires, setTires] = useState({
    frontLeft: '',
    frontRight: '',
    rearLeft: '',
    rearRight: '',
  });
  const [interiorContamination, setInteriorContamination] = useState<string[]>([]); // 내부 오염 위치

  // 조치 항목
  const [carWash, setCarWash] = useState<string>(''); // 세차
  const [battery, setBattery] = useState<string>(''); // 배터리 상태
  const [wiperWasher, setWiperWasher] = useState<string[]>([]); // 와이퍼/워셔액
  const [warningLights, setWarningLights] = useState<string[]>([]); // 경고등
  const [memo, setMemo] = useState(''); // 특이사항

  // 사진 촬영 (점검 전/후 동일 포맷: 전/후/좌/우 + 내부, 각 부위별 다중 사진)
  const [beforePhotos, setBeforePhotos] = useState<Record<PhotoGuideType, File[]>>({
    front: [],
    rear: [],
    left: [],
    right: [],
    interior: [],
  });
  const [afterPhotos, setAfterPhotos] = useState<Record<PhotoGuideType, File[]>>({
    front: [],
    rear: [],
    left: [],
    right: [],
    interior: [],
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // 담당자 목록 로드 & 시작 시간 표시 (클라이언트에서만)
  useEffect(() => {
    const saved = localStorage.getItem(INSPECTORS_KEY);
    if (saved) {
      setInspectors(JSON.parse(saved));
    }
    setStartTimeDisplay(startTime.toLocaleString('ko-KR'));
  }, [startTime]);

  // 담당자 저장
  const saveInspectors = (list: string[]) => {
    localStorage.setItem(INSPECTORS_KEY, JSON.stringify(list));
    setInspectors(list);
  };

  // 담당자 추가 (검색창 입력값 사용)
  const addInspector = () => {
    const name = inspectorSearch.trim();
    if (name && !inspectors.includes(name)) {
      const updated = [...inspectors, name];
      saveInspectors(updated);
      setSelectedInspector(name);
      setInspectorSearch('');
      setShowInspectorDropdown(false);
    } else if (name && inspectors.includes(name)) {
      // 이미 있는 이름이면 그냥 선택
      setSelectedInspector(name);
      setInspectorSearch('');
      setShowInspectorDropdown(false);
    }
  };

  // 차량 검색
  useEffect(() => {
    if (vehicleSearch.length >= 2) {
      const fetchVehicles = async () => {
        try {
          const res = await fetch(`/api/vehicles?search=${encodeURIComponent(vehicleSearch)}&limit=10`);
          const data = await res.json();
          setVehicleSuggestions(data.vehicles || []);
          setShowVehicleDropdown(true);
        } catch (error) {
          console.error('Error fetching vehicles:', error);
        }
      };
      fetchVehicles();
    } else {
      setVehicleSuggestions([]);
      setShowVehicleDropdown(false);
    }
  }, [vehicleSearch]);

  // 필터된 담당자 목록
  const filteredInspectors = inspectors.filter(name =>
    name.toLowerCase().includes(inspectorSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) {
      alert('차량을 선택해주세요.');
      return;
    }
    if (!selectedInspector) {
      alert('담당자를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    const endTime = new Date();

    try {
      // 사진이 있는지 확인
      const hasPhotos = Object.values(beforePhotos).some(arr => arr.length > 0) ||
                       Object.values(afterPhotos).some(arr => arr.length > 0);

      // 점검 데이터 구성
      const inspectionData = {
        vehicleId: selectedVehicle.id,
        inspectionDate: startTime.toISOString(),
        completedAt: endTime.toISOString(),
        inspectionType: '세차점검',
        overallStatus: exteriorDamage === '파손(운행불가)' ? '불량' : exteriorDamage === '경미(운행가능)' ? '보통' : '양호',
        inspector: selectedInspector,
        memo: memo || undefined,
        // 상세 점검 데이터
        details: {
          contamination,
          exteriorDamage,
          tires,
          interiorContamination,
          carWash,
          battery,
          wiperWasher,
          warningLights,
        },
        // 사진이 있으면 기본 영역 생성
        areas: hasPhotos ? [
          {
            areaCategory: '사진',
            areaName: '점검 사진',
            status: '완료',
          }
        ] : undefined,
      };

      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectionData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || '등록에 실패했습니다.');
        setSubmitting(false);
        return;
      }

      const inspection = await res.json();

      // 사진 업로드 (각 부위별 다중 사진 지원)
      const allPhotos: { type: string; file: File }[] = [];

      // 점검 전 사진들
      Object.entries(beforePhotos).forEach(([type, files]) => {
        files.forEach((file, index) => {
          allPhotos.push({ type: `before_${type}_${index + 1}`, file });
        });
      });

      // 점검 후 사진들
      Object.entries(afterPhotos).forEach(([type, files]) => {
        files.forEach((file, index) => {
          allPhotos.push({ type: `after_${type}_${index + 1}`, file });
        });
      });

      if (allPhotos.length > 0 && inspection.areas && inspection.areas.length > 0) {
        setUploadingPhotos(true);

        // 사진 영역 ID (기본 영역 사용)
        const photoAreaId = inspection.areas[0].id;

        for (const { type: photoType, file } of allPhotos) {
          const formData = new FormData();
          formData.append('inspectionAreaId', photoAreaId);
          formData.append('files', file);
          formData.append('description', photoType);
          // 점검전/점검후 구분
          const photoPhase = photoType.startsWith('before_') ? 'before' : 'after';
          formData.append('photoPhase', photoPhase);

          try {
            await fetch('/api/photos/upload', {
              method: 'POST',
              body: formData,
            });
          } catch (photoError) {
            console.error(`Error uploading photo ${photoType}:`, photoError);
          }
        }
      }

      router.push(`/vehicles/${selectedVehicle.id}`);
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  // 선택 버튼 컴포넌트 (3가지 색상: blue-일반, green-좋음, red-나쁨)
  const SelectButton = ({
    selected,
    onClick,
    children,
    color = 'blue'
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    color?: 'blue' | 'green' | 'red';
  }) => {
    const colors = {
      blue: selected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300',
      green: selected ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-300',
      red: selected ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-300',
    };

    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 ${colors[color]}`}
      >
        {children}
      </button>
    );
  };

  // 폼 유효성 검사
  const isFormValid =
    selectedVehicle &&
    selectedInspector &&
    contamination &&
    exteriorDamage &&
    tires.frontLeft && tires.frontRight && tires.rearLeft && tires.rearRight &&
    interiorContamination.length > 0 &&
    carWash &&
    battery;

  // 멀티 선택 토글
  const toggleMultiSelect = (value: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  // 점검 전 사진 변경 핸들러
  const handleBeforePhotoChange = (type: PhotoGuideType, files: File[]) => {
    setBeforePhotos(prev => ({ ...prev, [type]: files }));
  };

  // 점검 후 사진 변경 핸들러
  const handleAfterPhotoChange = (type: PhotoGuideType, files: File[]) => {
    setAfterPhotos(prev => ({ ...prev, [type]: files }));
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 50%, #A3D1FF 100%)' }}>
      <nav className="glass-card sticky top-0 z-30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center">
            <Link href="/" className="flex items-center gap-3">
              <SocarLogo />
              <span className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Socar Premium Admin
              </span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-white/50 transition-all duration-200"
            >
              대시보드
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="glass-card rounded-2xl shadow-xl p-6 md:p-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">세차·점검 기록 등록</h1>
              <p className="text-xs text-gray-500">시작: {startTimeDisplay || '-'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 차량번호 & 담당자 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 차량번호 검색 */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  차량번호 <span className="text-red-500">*</span>
                </label>
                {selectedVehicle ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div>
                      <p className="font-bold text-gray-900">{selectedVehicle.vehicleNumber}</p>
                      <p className="text-xs text-gray-500">
                        {selectedVehicle.manufacturer}/{selectedVehicle.model}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVehicle(null);
                        setVehicleSearch('');
                      }}
                      className="text-blue-600 text-sm font-medium"
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      ref={vehicleInputRef}
                      type="text"
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      onFocus={() => vehicleSearch.length >= 2 && setShowVehicleDropdown(true)}
                      placeholder="차량번호 입력..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {showVehicleDropdown && vehicleSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {vehicleSuggestions.map((vehicle) => (
                          <button
                            key={vehicle.id}
                            type="button"
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowVehicleDropdown(false);
                              setVehicleSearch('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="font-medium">{vehicle.vehicleNumber}</p>
                            <p className="text-xs text-gray-500">{vehicle.manufacturer}/{vehicle.model}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 담당자 검색 */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당자 <span className="text-red-500">*</span>
                </label>
                {selectedInspector ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="font-bold text-gray-900">{selectedInspector}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInspector('');
                        setInspectorSearch('');
                      }}
                      className="text-blue-600 text-sm font-medium"
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={inspectorSearch}
                      onChange={(e) => setInspectorSearch(e.target.value)}
                      onFocus={() => setShowInspectorDropdown(true)}
                      placeholder="담당자 이름 입력..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {showInspectorDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {filteredInspectors.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setSelectedInspector(name);
                              setShowInspectorDropdown(false);
                              setInspectorSearch('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                          >
                            {name}
                          </button>
                        ))}
                        {inspectorSearch.trim() && (
                          <button
                            type="button"
                            onClick={addInspector}
                            className="w-full text-left px-4 py-3 text-blue-600 font-medium hover:bg-blue-50 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            &quot;{inspectorSearch.trim()}&quot; 추가
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 차량 상태 점검 섹션 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">차량 상태 점검</h3>

              {/* 반납차량 오염도 */}
              <div className="pl-1">
                <label className="block text-sm text-gray-600 mb-2">반납차량 오염도 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  <SelectButton selected={contamination === '상'} onClick={() => setContamination('상')} color="red">
                    상 (심함)
                  </SelectButton>
                  <SelectButton selected={contamination === '중'} onClick={() => setContamination('중')} color="blue">
                    중 (보통)
                  </SelectButton>
                  <SelectButton selected={contamination === '하'} onClick={() => setContamination('하')} color="green">
                    하 (깨끗)
                  </SelectButton>
                </div>
              </div>

              {/* 외관이상 유형 */}
              <div className="pl-1">
                <label className="block text-sm text-gray-600 mb-2">외관이상 유형 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  <SelectButton selected={exteriorDamage === '이상없음'} onClick={() => setExteriorDamage('이상없음')} color="green">
                    이상없음
                  </SelectButton>
                  <SelectButton selected={exteriorDamage === '경미(운행가능)'} onClick={() => setExteriorDamage('경미(운행가능)')} color="blue">
                    경미
                  </SelectButton>
                  <SelectButton selected={exteriorDamage === '파손(운행불가)'} onClick={() => setExteriorDamage('파손(운행불가)')} color="red">
                    파손
                  </SelectButton>
                </div>
              </div>
            </div>

            {/* 타이어 상태 */}
            <div className="pl-1">
              <label className="block text-sm text-gray-600 mb-2">타이어 상태 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {/* 앞바퀴 좌 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">앞바퀴 (좌)</p>
                  <div className="flex gap-1">
                    {['정상', '경미', '파손'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setTires({ ...tires, frontLeft: status })}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                          tires.frontLeft === status
                            ? status === '정상' ? 'bg-green-500 text-white' : status === '경미' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                            : 'bg-white border border-gray-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 앞바퀴 우 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">앞바퀴 (우)</p>
                  <div className="flex gap-1">
                    {['정상', '경미', '파손'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setTires({ ...tires, frontRight: status })}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                          tires.frontRight === status
                            ? status === '정상' ? 'bg-green-500 text-white' : status === '경미' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                            : 'bg-white border border-gray-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 뒷바퀴 좌 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">뒷바퀴 (좌)</p>
                  <div className="flex gap-1">
                    {['정상', '경미', '파손'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setTires({ ...tires, rearLeft: status })}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                          tires.rearLeft === status
                            ? status === '정상' ? 'bg-green-500 text-white' : status === '경미' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                            : 'bg-white border border-gray-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 뒷바퀴 우 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">뒷바퀴 (우)</p>
                  <div className="flex gap-1">
                    {['정상', '경미', '파손'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setTires({ ...tires, rearRight: status })}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                          tires.rearRight === status
                            ? status === '정상' ? 'bg-green-500 text-white' : status === '경미' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                            : 'bg-white border border-gray-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 내부 오염 위치 */}
            <div className="pl-1">
              <label className="block text-sm text-gray-600 mb-2">내부 오염 위치 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-1.5">
                {['깨끗함', '운전석', '조수석', '뒷좌석', '트렁크', '컵홀더', '기타'].map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => toggleMultiSelect(location, interiorContamination, setInteriorContamination)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${
                      interiorContamination.includes(location)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>

            {/* 점검 전 사진 촬영 */}
            <PhotoSection
              title="점검 전 사진 (전/후/좌/우 + 내부)"
              photos={beforePhotos}
              onPhotoChange={handleBeforePhotoChange}
            />

            {/* 조치 섹션 */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">조치 사항</h3>

              {/* 세차 */}
              <div className="pl-1">
                <label className="block text-sm text-gray-600 mb-2">세차 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <SelectButton selected={carWash === '약식세차'} onClick={() => setCarWash('약식세차')}>
                    약식세차
                  </SelectButton>
                  <SelectButton selected={carWash === '정밀세차'} onClick={() => setCarWash('정밀세차')}>
                    정밀세차
                  </SelectButton>
                </div>
              </div>

              {/* 배터리 상태 */}
              <div className="pl-1">
                <label className="block text-sm text-gray-600 mb-2">배터리 상태 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: '정상', color: 'green' as const },
                    { value: '전압낮음', color: 'blue' as const },
                    { value: '방전', color: 'red' as const },
                  ].map((item) => (
                    <SelectButton
                      key={item.value}
                      selected={battery === item.value}
                      onClick={() => setBattery(item.value)}
                      color={item.color}
                    >
                      {item.value}
                    </SelectButton>
                  ))}
                </div>
              </div>

              {/* 와이퍼/워셔액 */}
              <div className="pl-1">
                <label className="block text-sm text-gray-600 mb-2">와이퍼/워셔액</label>
                <div className="flex flex-wrap gap-1.5">
                  {['정상', '와이퍼 불량', '워셔액 보충', '워셔액통 파손'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMultiSelect(item, wiperWasher, setWiperWasher)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${
                        wiperWasher.includes(item)
                          ? item === '정상' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 경고등 */}
              <div className="pl-1">
                <label className="block text-sm text-gray-600 mb-2">경고등</label>
                <div className="flex flex-wrap gap-1.5">
                  {['없음', '엔진', '공기압', '주유', '라이트'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMultiSelect(item, warningLights, setWarningLights)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${
                        warningLights.includes(item)
                          ? item === '없음' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 점검 후 사진 촬영 */}
              <PhotoSection
                title="점검 후 사진 (전/후/좌/우 + 내부)"
                photos={afterPhotos}
                onPhotoChange={handleAfterPhotoChange}
              />
            </div>

            {/* 특이사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">특이사항</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="특이사항을 입력하세요..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <Link
                href="/"
                className="flex-1 py-3 text-center border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting || uploadingPhotos || !isFormValid}
                className="flex-1 py-3 text-white rounded-xl font-medium disabled:opacity-40 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}
              >
                {uploadingPhotos ? '사진 업로드 중...' : submitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* 플로팅 문열기 버튼 */}
      {selectedVehicle && (
        <a
          href={`https://okstra.socarcorp.co.kr/car?s_id=&s_keyword_type=car_num&s_keyword=${encodeURIComponent(selectedVehicle.vehicleNumber)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-green-500 text-white px-5 py-3 rounded-full shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center gap-2 font-bold z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          문열기
        </a>
      )}
    </div>
  );
}
