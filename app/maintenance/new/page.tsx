'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SocarLogo from '@/components/SocarLogo';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  model: string | null;
  manufacturer: string | null;
}

// 담당자 목록 (로컬 스토리지에 저장)
const INSPECTORS_KEY = 'premium_care_inspectors';

// 기본 항목 목록
const DEFAULT_CONSUMABLES = ['에어컨필터(내부)', '에어컨필터(외부)', '와이퍼', '배터리', '전라이닝', '후라이닝', '엔진오일', '워셔액'];
const DEFAULT_REPAIRS = ['타이어 교체', '타이어 위치교환', '휠 얼라인먼트', '브레이크패드', '에어컨 수리'];
const DEFAULT_ACCIDENT_REPAIRS = ['범퍼 수리', '도어 수리', '유리 교체', '도색 작업', '판금 작업'];

export default function NewMaintenancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">로딩 중...</div></div>}>
      <MaintenanceForm />
    </Suspense>
  );
}

function MaintenanceForm() {
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

  // 소모품 교체 (기본 + 커스텀)
  const [consumables, setConsumables] = useState<string[]>([]);
  const [customConsumables, setCustomConsumables] = useState<string[]>([]);
  const [newConsumable, setNewConsumable] = useState('');

  // 경정비 (기본 + 커스텀)
  const [repairs, setRepairs] = useState<string[]>([]);
  const [customRepairs, setCustomRepairs] = useState<string[]>([]);
  const [newRepair, setNewRepair] = useState('');

  // 사고수리 (기본 + 커스텀)
  const [accidentRepairs, setAccidentRepairs] = useState<string[]>([]);
  const [customAccidentRepairs, setCustomAccidentRepairs] = useState<string[]>([]);
  const [newAccidentRepair, setNewAccidentRepair] = useState('');

  // 특이사항
  const [memo, setMemo] = useState('');

  // 사진 (단순 파일 배열)
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  // 사진 추가 핸들러
  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setPhotos(prev => [...prev, ...Array.from(files)]);
    }
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // 사진 삭제 핸들러
  const handlePhotoRemove = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // 커스텀 항목 추가 핸들러
  const addCustomItem = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    customList: string[],
    customSetter: React.Dispatch<React.SetStateAction<string[]>>,
    selectedList: string[],
    selectedSetter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (trimmed && !customList.includes(trimmed) && !DEFAULT_CONSUMABLES.includes(trimmed) && !DEFAULT_REPAIRS.includes(trimmed) && !DEFAULT_ACCIDENT_REPAIRS.includes(trimmed)) {
      customSetter([...customList, trimmed]);
      selectedSetter([...selectedList, trimmed]);
      setter('');
    }
  };

  // 모든 선택된 항목 (기본 + 커스텀)
  const allConsumables = [...consumables];
  const allRepairs = [...repairs];
  const allAccidentRepairs = [...accidentRepairs];

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
    if (allConsumables.length === 0 && allRepairs.length === 0 && allAccidentRepairs.length === 0) {
      alert('최소 하나의 항목을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    const endTime = new Date();

    try {
      // 사진이 있는지 확인
      const hasPhotos = photos.length > 0;

      // 점검 데이터 구성
      const maintenanceData = {
        vehicleId: selectedVehicle.id,
        inspectionDate: startTime.toISOString(),
        completedAt: endTime.toISOString(),
        inspectionType: '소모품·경정비',
        overallStatus: allAccidentRepairs.length > 0 ? '사고수리' : allRepairs.length > 0 ? '경정비' : '소모품교체',
        inspector: selectedInspector,
        memo: memo || undefined,
        details: {
          consumables: allConsumables,
          repairs: allRepairs,
          accidentRepairs: allAccidentRepairs,
        },
        // 사진이 있으면 기본 영역 생성
        areas: hasPhotos ? [
          {
            areaCategory: '사진',
            areaName: '정비 사진',
            status: '완료',
          }
        ] : undefined,
      };

      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || '등록에 실패했습니다.');
        setSubmitting(false);
        return;
      }

      const inspection = await res.json();

      // 사진 업로드
      if (photos.length > 0 && inspection.areas && inspection.areas.length > 0) {
        setUploadingPhotos(true);
        const photoAreaId = inspection.areas[0].id;

        for (let i = 0; i < photos.length; i++) {
          const formData = new FormData();
          formData.append('inspectionAreaId', photoAreaId);
          formData.append('files', photos[i]);
          formData.append('description', `maintenance_${i + 1}`);

          try {
            await fetch('/api/photos/upload', {
              method: 'POST',
              body: formData,
            });
          } catch (photoError) {
            console.error(`Error uploading photo ${i + 1}:`, photoError);
          }
        }
      }

      router.push(`/vehicles/${selectedVehicle.id}`);
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      alert('등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  // 선택 버튼 컴포넌트
  const SelectButton = ({
    selected,
    onClick,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 ${
          selected
            ? 'bg-amber-500 text-white border-amber-500'
            : 'bg-white text-gray-600 border-gray-300'
        }`}
      >
        {children}
      </button>
    );
  };

  // 폼 유효성 검사
  const isFormValid =
    selectedVehicle &&
    selectedInspector &&
    (allConsumables.length > 0 || allRepairs.length > 0 || allAccidentRepairs.length > 0);

  // 멀티 선택 토글
  const toggleMultiSelect = (value: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)' }}>
      <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-white/20">
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
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">소모품·경정비 기록 등록</h1>
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
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
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
                      className="text-amber-600 text-sm font-medium"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                            className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-gray-100 last:border-0"
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
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="font-bold text-gray-900">{selectedInspector}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInspector('');
                        setInspectorSearch('');
                      }}
                      className="text-amber-600 text-sm font-medium"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                            className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-gray-100 last:border-0"
                          >
                            {name}
                          </button>
                        ))}
                        {inspectorSearch.trim() && (
                          <button
                            type="button"
                            onClick={addInspector}
                            className="w-full text-left px-4 py-3 text-amber-600 font-medium hover:bg-amber-50 flex items-center gap-2"
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

            {/* 소모품 교체 섹션 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">소모품 교체</h3>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CONSUMABLES.map((item) => (
                  <SelectButton
                    key={item}
                    selected={consumables.includes(item)}
                    onClick={() => toggleMultiSelect(item, consumables, setConsumables)}
                  >
                    {item}
                  </SelectButton>
                ))}
                {customConsumables.map((item) => (
                  <SelectButton
                    key={item}
                    selected={consumables.includes(item)}
                    onClick={() => toggleMultiSelect(item, consumables, setConsumables)}
                  >
                    {item}
                  </SelectButton>
                ))}
              </div>
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={newConsumable}
                  onChange={(e) => setNewConsumable(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem(newConsumable, setNewConsumable, customConsumables, setCustomConsumables, consumables, setConsumables);
                    }
                  }}
                  placeholder="+ 직접입력"
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => addCustomItem(newConsumable, setNewConsumable, customConsumables, setCustomConsumables, consumables, setConsumables)}
                  className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200"
                >
                  추가
                </button>
              </div>
            </div>

            {/* 경정비 섹션 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">경정비</h3>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_REPAIRS.map((item) => (
                  <SelectButton
                    key={item}
                    selected={repairs.includes(item)}
                    onClick={() => toggleMultiSelect(item, repairs, setRepairs)}
                  >
                    {item}
                  </SelectButton>
                ))}
                {customRepairs.map((item) => (
                  <SelectButton
                    key={item}
                    selected={repairs.includes(item)}
                    onClick={() => toggleMultiSelect(item, repairs, setRepairs)}
                  >
                    {item}
                  </SelectButton>
                ))}
              </div>
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={newRepair}
                  onChange={(e) => setNewRepair(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem(newRepair, setNewRepair, customRepairs, setCustomRepairs, repairs, setRepairs);
                    }
                  }}
                  placeholder="+ 직접입력"
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => addCustomItem(newRepair, setNewRepair, customRepairs, setCustomRepairs, repairs, setRepairs)}
                  className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200"
                >
                  추가
                </button>
              </div>
            </div>

            {/* 사고수리 섹션 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">사고수리</h3>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ACCIDENT_REPAIRS.map((item) => (
                  <SelectButton
                    key={item}
                    selected={accidentRepairs.includes(item)}
                    onClick={() => toggleMultiSelect(item, accidentRepairs, setAccidentRepairs)}
                  >
                    {item}
                  </SelectButton>
                ))}
                {customAccidentRepairs.map((item) => (
                  <SelectButton
                    key={item}
                    selected={accidentRepairs.includes(item)}
                    onClick={() => toggleMultiSelect(item, accidentRepairs, setAccidentRepairs)}
                  >
                    {item}
                  </SelectButton>
                ))}
              </div>
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={newAccidentRepair}
                  onChange={(e) => setNewAccidentRepair(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem(newAccidentRepair, setNewAccidentRepair, customAccidentRepairs, setCustomAccidentRepairs, accidentRepairs, setAccidentRepairs);
                    }
                  }}
                  placeholder="+ 직접입력"
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => addCustomItem(newAccidentRepair, setNewAccidentRepair, customAccidentRepairs, setCustomAccidentRepairs, accidentRepairs, setAccidentRepairs)}
                  className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200"
                >
                  추가
                </button>
              </div>
            </div>

            {/* 사진 첨부 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">사진 첨부</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoAdd}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer py-4"
                >
                  <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">클릭하여 사진 추가</span>
                  <span className="text-xs text-gray-400 mt-1">여러 장 선택 가능</span>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`사진 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 특이사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">특이사항</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="특이사항을 입력하세요..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 선택된 항목 요약 */}
            {(allConsumables.length > 0 || allRepairs.length > 0 || allAccidentRepairs.length > 0) && (
              <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-amber-800">선택된 항목</p>
                {allConsumables.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-600 mb-1">소모품 교체 ({allConsumables.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {allConsumables.map((item) => (
                        <span key={item} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {allRepairs.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-600 mb-1">경정비 ({allRepairs.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {allRepairs.map((item) => (
                        <span key={item} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {allAccidentRepairs.length > 0 && (
                  <div>
                    <p className="text-xs text-red-600 mb-1">사고수리 ({allAccidentRepairs.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {allAccidentRepairs.map((item) => (
                        <span key={item} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
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
