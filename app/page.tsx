'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileNav from '@/components/MobileNav';
import BlackLabelLogo from '@/components/BlackLabelLogo';
import AdminLoginModal from '@/components/AdminLoginModal';
import BulkUpload from '@/components/BulkUpload';
import { useAuth } from '@/contexts/AuthContext';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  ownerName: string;
  model: string | null;
  manufacturer: string | null;
  inspections: Array<{ inspectionDate: Date }>;
}

interface ReservationStatsResponse {
  inUseCount?: number;
  upcomingReservationsCount?: number;
  needsInspectionCount?: number;
  needsInspection72HCount?: number;
  inUseCarNums?: string[];
  upcomingCarNums?: string[];
  needsInspectionCarNums?: string[];
  needsInspection72HCarNums?: string[];
  vehicleStatusMap?: Record<string, { status: '운행중' | '대기중'; needsInspection: boolean; needs72HInspection: boolean; carName: string; reservationStart?: string; nextReservationStart?: string; reservationEnd?: string; lastReturnDate?: string }>;
}

// 요일 배열
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// 날짜 포맷팅 (M/D(요일) HH시MM분)
function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day}(${dayName}) ${hours}시${minutes}분`;
}

interface VehiclesResponse {
  vehicles?: Vehicle[];
  pagination?: {
    total?: number;
    totalPages?: number;
  };
}

interface InspectionsResponse {
  inspections?: Array<{ id: string }>;
}

// 안전한 JSON 파싱 헬퍼
async function safeJsonParse<T>(response: Response, defaultValue: T): Promise<T> {
  try {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON:', await response.text());
      return defaultValue;
    }
    return await response.json() as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

export default function Home() {
  const router = useRouter();
  const { isAdmin, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    recentInspections: 0,
  });
  const [reservationStats, setReservationStats] = useState({
    inUseCount: 0,
    upcomingReservationsCount: 0,
    needsInspectionCount: 0,
    needsInspection72HCount: 0,
    inUseCarNums: [] as string[],
    upcomingCarNums: [] as string[],
    needsInspectionCarNums: [] as string[],
    needsInspection72HCarNums: [] as string[],
    vehicleStatusMap: {} as Record<string, { status: '운행중' | '대기중'; needsInspection: boolean; needs72HInspection: boolean; carName: string; reservationStart?: string; nextReservationStart?: string; reservationEnd?: string; lastReturnDate?: string }>,
  });
  const [activeFilter, setActiveFilter] = useState<'all' | 'inUse' | 'upcoming' | 'needsInspection' | 'needsInspection72H'>('all');
  const [sortOrder, setSortOrder] = useState<'departure' | 'return'>('departure');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);
  const currentSearchRef = useRef<string>(''); // 현재 검색어 추적

  // 점검필요 차량번호 목록을 ref로 관리 (최신 상태 유지)
  const needsInspectionCarNumsRef = useRef<string[]>([]);

  // 데이터 새로고침 함수 (디바운스 적용)
  const refreshData = useCallback(async (force = false) => {
    const now = Date.now();
    // 5초 이내에 이미 fetch 했거나 현재 fetching 중이면 스킵
    if (!force && (isFetching.current || now - lastFetchTime.current < 5000)) {
      return;
    }
    lastFetchTime.current = now;
    currentSearchRef.current = ''; // 검색어 초기화
    setPage(1);
    setVehicles([]);
    setHasMore(true);

    // 통계 먼저 로드
    fetchStats();

    // 예약 통계를 먼저 로드하여 점검필요 차량 목록 확보
    let priorityNums: string[] = [];
    try {
      const res = await fetch('/api/reservations/stats');
      if (res.ok) {
        const data = await safeJsonParse<ReservationStatsResponse>(res, {});
        priorityNums = data.needsInspectionCarNums || [];
        needsInspectionCarNumsRef.current = priorityNums;
        setReservationStats({
          inUseCount: data.inUseCount || 0,
          upcomingReservationsCount: data.upcomingReservationsCount || 0,
          needsInspectionCount: data.needsInspectionCount || 0,
          needsInspection72HCount: data.needsInspection72HCount || 0,
          inUseCarNums: data.inUseCarNums || [],
          upcomingCarNums: data.upcomingCarNums || [],
          needsInspectionCarNums: priorityNums,
          needsInspection72HCarNums: data.needsInspection72HCarNums || [],
          vehicleStatusMap: data.vehicleStatusMap || {},
        });
      }
    } catch (error) {
      console.error('Error fetching reservation stats:', error);
    } finally {
      setStatsLoaded(true);
    }

    // 점검필요 차량을 우선순위로 차량 목록 로드
    fetchVehicles(1, true, priorityNums);
  }, []);

  // 초기 로드
  useEffect(() => {
    refreshData(true);
  }, []);

  // 검색어가 변경되면 페이지 리셋하고 새로 fetch
  useEffect(() => {
    // 현재 검색어 저장 (이전 요청 결과 무시용)
    currentSearchRef.current = search;

    if (search !== '') {
      setActiveFilter('all'); // 검색 시 필터 해제
      setPage(1);
      setVehicles([]);
      setHasMore(true);
      fetchVehicles(1, true, [], search);  // 검색어를 직접 전달
    } else {
      // 검색어 지우면 전체 목록 새로고침
      refreshData(true);
    }
  }, [search]);

  // 페이지가 변경되면 추가 데이터 fetch
  useEffect(() => {
    if (page > 1) {
      fetchVehicles(page, false, search ? [] : needsInspectionCarNumsRef.current, search || undefined);
    }
  }, [page, search]);

  // 페이지 visibility 변경 시 데이터 새로고침 (다른 페이지에서 돌아왔을 때)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshData]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const fetchVehicles = async (pageNum: number, isReset: boolean, priorityCarNums: string[] = [], searchQuery?: string) => {
    // 검색 중에는 스킵하지 않음 (빠른 타이핑 대응)
    const isSearching = searchQuery !== undefined && searchQuery !== '';
    if (isFetching.current && isReset && !isSearching) return;

    // 이 요청의 검색어 저장 (결과 적용 시 확인용)
    const requestSearchQuery = searchQuery !== undefined ? searchQuery : search;

    try {
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (requestSearchQuery) {
        params.append('search', requestSearchQuery);
      } else if (priorityCarNums.length > 0) {
        // 검색이 아닐 때만 우선순위 정렬 적용
        params.append('priorityCarNums', priorityCarNums.join(','));
      }
      params.append('page', pageNum.toString());
      params.append('limit', '15');

      isFetching.current = true;
      const res = await fetch(`/api/vehicles?${params}`);

      // 검색어가 변경되었으면 이 결과 무시 (더 최신 검색이 진행 중)
      if (requestSearchQuery !== currentSearchRef.current) {
        return;
      }

      if (!res.ok) {
        console.error('Vehicle fetch failed:', res.status, res.statusText);
        return;
      }
      const data = await safeJsonParse<VehiclesResponse>(res, { vehicles: [], pagination: { totalPages: 1 } });

      // 다시 한번 검색어 확인 (응답 처리 중 변경되었을 수 있음)
      if (requestSearchQuery !== currentSearchRef.current) {
        return;
      }

      const newVehicles = data.vehicles || [];
      const totalPages = data.pagination?.totalPages || 1;

      if (isReset) {
        setVehicles(newVehicles);
      } else {
        setVehicles((prev) => [...prev, ...newVehicles]);
      }

      setHasMore(pageNum < totalPages);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      isFetching.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const [vehiclesRes, inspectionsRes] = await Promise.all([
        fetch('/api/vehicles?limit=1'),
        fetch(`/api/inspections?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`),
      ]);

      const vehiclesData = vehiclesRes.ok ? await safeJsonParse<VehiclesResponse>(vehiclesRes, {}) : {};
      const inspectionsData = inspectionsRes.ok ? await safeJsonParse<InspectionsResponse>(inspectionsRes, {}) : {};

      setStats({
        totalVehicles: vehiclesData.pagination?.total || 0,
        recentInspections: inspectionsData.inspections?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // 오류 발생 시에도 기본값 설정
      setStats({
        totalVehicles: vehicles.length,
        recentInspections: 0,
      });
    }
  };

  // 필터 차량번호로 차량 목록 조회
  const fetchFilteredVehicles = async (vehicleNumbers: string[], statusMap: typeof reservationStats.vehicleStatusMap) => {
    if (vehicleNumbers.length === 0) {
      setFilteredVehicles([]);
      return;
    }

    setLoadingFiltered(true);
    try {
      const params = new URLSearchParams();
      params.append('vehicleNumbers', vehicleNumbers.join(','));
      params.append('limit', '100'); // 필터된 차량은 전체 조회

      const res = await fetch(`/api/vehicles?${params}`);
      if (!res.ok) {
        console.error('Filtered vehicles fetch failed:', res.status);
        setFilteredVehicles([]);
        return;
      }
      const data = await safeJsonParse<VehiclesResponse>(res, { vehicles: [] });
      const dbVehicles: Vehicle[] = data.vehicles || [];

      // DB에 있는 차량번호 Set
      const dbVehicleNumbers = new Set(dbVehicles.map(v => v.vehicleNumber));

      // DB에 없지만 필터에 있는 차량 추가 (Google Sheets에만 있는 차량)
      const placeholderVehicles: Vehicle[] = vehicleNumbers
        .filter(num => !dbVehicleNumbers.has(num))
        .map(num => ({
          id: `placeholder-${num}`,
          vehicleNumber: num,
          ownerName: '',
          model: statusMap[num]?.carName || null,
          manufacturer: null,
          inspections: [],
        }));

      // 모든 차량 합치기 및 정렬
      const allVehicles = [...dbVehicles, ...placeholderVehicles];
      setFilteredVehicles(sortVehicles(allVehicles, statusMap));
    } catch (error) {
      console.error('Error fetching filtered vehicles:', error);
      setFilteredVehicles([]);
    } finally {
      setLoadingFiltered(false);
    }
  };

  // 필터 변경 시 해당 차량 조회
  useEffect(() => {
    const statusMap = reservationStats.vehicleStatusMap;
    if (activeFilter === 'inUse') {
      fetchFilteredVehicles(reservationStats.inUseCarNums, statusMap);
    } else if (activeFilter === 'upcoming') {
      fetchFilteredVehicles(reservationStats.upcomingCarNums, statusMap);
    } else if (activeFilter === 'needsInspection') {
      fetchFilteredVehicles(reservationStats.needsInspectionCarNums, statusMap);
    } else if (activeFilter === 'needsInspection72H') {
      fetchFilteredVehicles(reservationStats.needsInspection72HCarNums, statusMap);
    } else {
      setFilteredVehicles([]);
    }
  }, [activeFilter, reservationStats, sortOrder]);

  // 차량 정렬 함수
  const sortVehicles = (vehicleList: Vehicle[], statusMap: typeof reservationStats.vehicleStatusMap) => {
    return vehicleList.sort((a, b) => {
      const aStatus = statusMap[a.vehicleNumber];
      const bStatus = statusMap[b.vehicleNumber];
      const aNeedsInspection = aStatus?.needsInspection || false;
      const bNeedsInspection = bStatus?.needsInspection || false;
      const aIsInUse = aStatus?.status === '운행중';
      const bIsInUse = bStatus?.status === '운행중';
      const aStart = aStatus?.reservationStart;
      const bStart = bStatus?.reservationStart;
      const aNextStart = aStatus?.nextReservationStart;
      const bNextStart = bStatus?.nextReservationStart;
      const aEnd = aStatus?.reservationEnd;
      const bEnd = bStatus?.reservationEnd;

      // 출차 시간 계산 (운행중이면 다음예약, 대기중이면 현재예약)
      const aTargetTime = aIsInUse ? aNextStart : aStart;
      const bTargetTime = bIsInUse ? bNextStart : bStart;

      if (sortOrder === 'return') {
        // 복귀예정순: 운행중 차량의 복귀예정 시간이 빠른 순
        // 1순위: 운행중 차량 (복귀예정 시간 빠른 순)
        if (aIsInUse && !bIsInUse) return -1;
        if (!aIsInUse && bIsInUse) return 1;

        // 둘 다 운행중이면 복귀예정 시간 빠른 순
        if (aIsInUse && bIsInUse) {
          if (aEnd && bEnd) {
            return new Date(aEnd).getTime() - new Date(bEnd).getTime();
          }
          if (aEnd && !bEnd) return -1;
          if (!aEnd && bEnd) return 1;
        }

        // 나머지는 차량번호 순
        return a.vehicleNumber.localeCompare(b.vehicleNumber, 'ko');
      }

      // 출차시간순 (기본): 점검필요 > 운행중+다음예약 > 운행중 > 그외
      // 점검필요 여부 + 다음 예약 유무로 우선순위 결정
      const aHasUpcoming = aNeedsInspection || (aIsInUse && aNextStart);
      const bHasUpcoming = bNeedsInspection || (bIsInUse && bNextStart);

      // 1순위: 점검필요 차량 (출차까지 남은 시간 순)
      if (aNeedsInspection && !bNeedsInspection) return -1;
      if (!aNeedsInspection && bNeedsInspection) return 1;

      // 둘 다 점검필요면 출차시간 임박 순
      if (aNeedsInspection && bNeedsInspection) {
        if (aTargetTime && bTargetTime) {
          return new Date(aTargetTime).getTime() - new Date(bTargetTime).getTime();
        }
        if (aTargetTime && !bTargetTime) return -1;
        if (!aTargetTime && bTargetTime) return 1;
      }

      // 2순위: 운행중 + 다음예약 있는 차량 (출차시간 임박 순)
      const aInUseWithNext = aIsInUse && aNextStart;
      const bInUseWithNext = bIsInUse && bNextStart;
      if (aInUseWithNext && !bInUseWithNext) return -1;
      if (!aInUseWithNext && bInUseWithNext) return 1;
      if (aInUseWithNext && bInUseWithNext) {
        return new Date(aNextStart).getTime() - new Date(bNextStart).getTime();
      }

      // 3순위: 운행중 차량 (다음예약 없는)
      if (aIsInUse && !bIsInUse) return -1;
      if (!aIsInUse && bIsInUse) return 1;

      // 4순위: 나머지는 차량번호 순
      return a.vehicleNumber.localeCompare(b.vehicleNumber, 'ko');
    });
  };

  // 전체 목록용 차량 계산 (DB 차량 + 미등록 점검필요 차량)
  const getAllVehiclesWithPlaceholders = () => {
    const statusMap = reservationStats.vehicleStatusMap;
    const dbVehicleNumbers = new Set(vehicles.map(v => v.vehicleNumber));

    // 중복 제거된 DB 차량
    const uniqueDbVehicles: Vehicle[] = [];
    const seenNumbers = new Set<string>();
    for (const v of vehicles) {
      if (!seenNumbers.has(v.vehicleNumber)) {
        seenNumbers.add(v.vehicleNumber);
        uniqueDbVehicles.push(v);
      }
    }

    // 점검필요 차량 중 DB에 없는 차량 추가 (placeholder) - 검색 중에는 추가하지 않음
    const placeholderVehicles: Vehicle[] = search ? [] : reservationStats.needsInspectionCarNums
      .filter(num => !dbVehicleNumbers.has(num))
      .map(num => ({
        id: `placeholder-${num}`,
        vehicleNumber: num,
        ownerName: '',
        model: statusMap[num]?.carName || null,
        manufacturer: null,
        inspections: [],
      }));

    // 합치기 및 정렬
    const allVehicles = [...uniqueDbVehicles, ...placeholderVehicles];
    return sortVehicles(allVehicles, statusMap);
  };

  const displayVehicles = activeFilter !== 'all' ? filteredVehicles : getAllVehiclesWithPlaceholders();

  // 차량 선택 토글
  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const selectableVehicles = displayVehicles.filter(v => !v.id.startsWith('placeholder-'));
    if (selectedVehicleIds.size === selectableVehicles.length) {
      setSelectedVehicleIds(new Set());
    } else {
      setSelectedVehicleIds(new Set(selectableVehicles.map(v => v.id)));
    }
  };

  // 일괄 삭제 핸들러
  const handleBulkDelete = async () => {
    if (selectedVehicleIds.size === 0) {
      alert('삭제할 차량을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedVehicleIds.size}대의 차량을 삭제하시겠습니까?\n\n관련된 모든 점검 기록과 사진도 함께 삭제됩니다.`)) {
      return;
    }

    setBulkDeleting(true);
    const adminPin = sessionStorage.getItem('adminPin');
    let successCount = 0;
    let failCount = 0;

    for (const vehicleId of selectedVehicleIds) {
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}`, {
          method: 'DELETE',
          headers: {
            'x-admin-pin': adminPin || '',
          },
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setBulkDeleting(false);
    setSelectedVehicleIds(new Set());

    if (failCount === 0) {
      alert(`${successCount}대의 차량이 삭제되었습니다.`);
    } else {
      alert(`${successCount}대 삭제 완료, ${failCount}대 삭제 실패`);
    }

    // 목록 새로고침
    refreshData(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 50%, #A3D1FF 100%)' }}>
      <nav className="glass-card sticky top-0 z-30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center">
            <div className="flex items-center gap-3">
              <BlackLabelLogo />
              <h1 className="text-base md:text-lg font-black tracking-tight">
                <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">Black</span>
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Label</span>
                <span className="text-gray-500 font-medium ml-1">Admin</span>
              </h1>
            </div>
            <div className="hidden md:flex gap-3 items-center">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                  >
                    차량 일괄 등록
                  </button>
                  <Link
                    href="/vehicles/new"
                    className="px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
                  >
                    차량 수기 등록
                  </Link>
                </>
              )}
              <Link
                href="/inspections/new?mode=return"
                className="gradient-button-primary px-5 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
              >
                반납상태 등록
              </Link>
              <Link
                href="/inspections/new?mode=carwash"
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
              >
                세차·점검 등록
              </Link>
              <Link
                href="/maintenance/new"
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
              >
                소모품·경정비 등록
              </Link>
              {isAdmin ? (
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200"
                >
                  로그아웃
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#0078FF] rounded-lg hover:bg-[#EBF5FF] transition-all duration-200 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  관리자
                </button>
              )}
            </div>
            <div className="md:hidden">
              <MobileNav onBulkUpload={() => setShowBulkUpload(true)} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8">
        {/* 통계 카드 - 5개 컴팩트 */}
        <div className="grid grid-cols-5 gap-2 md:gap-3 mb-6 md:mb-8 animate-fade-in-up">
          {/* 1. 전체 */}
          <button
            onClick={() => {
              setActiveFilter('all');
              setSearch('');
            }}
            className={`stat-card rounded-xl p-3 md:p-4 relative overflow-hidden group text-center transition-all ${activeFilter === 'all' && !search ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
          >
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="8" cy="8" r="3" />
                  <circle cx="16" cy="8" r="3" />
                </svg>
              </div>
              <h3 className="text-[10px] md:text-xs font-medium text-gray-500 mb-0.5">전체</h3>
              <p className="text-xl md:text-2xl font-bold" style={{ color: '#0078FF' }}>
                {loading && stats.totalVehicles === 0 ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span> : stats.totalVehicles}
              </p>
            </div>
          </button>

          {/* 2. 운행중 */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'inUse' ? 'all' : 'inUse')}
            className={`stat-card rounded-xl p-3 md:p-4 relative overflow-hidden group text-center transition-all ${activeFilter === 'inUse' ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
          >
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-[10px] md:text-xs font-medium text-gray-500 mb-0.5">운행중</h3>
              <p className="text-xl md:text-2xl font-bold" style={{ color: '#16A34A' }}>
                {reservationStats.inUseCount}
              </p>
            </div>
          </button>

          {/* 3. 24H점검 */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'needsInspection' ? 'all' : 'needsInspection')}
            className={`stat-card rounded-xl p-3 md:p-4 relative overflow-hidden group text-center transition-all ${activeFilter === 'needsInspection' ? 'ring-2 ring-yellow-500 ring-offset-1' : ''}`}
          >
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' }}>
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-[10px] md:text-xs font-medium text-gray-500 mb-0.5">24H점검</h3>
              <p className="text-xl md:text-2xl font-bold" style={{ color: '#F59E0B' }}>
                {reservationStats.needsInspectionCount}
              </p>
            </div>
          </button>

          {/* 4. 24H출차 */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'upcoming' ? 'all' : 'upcoming')}
            className={`stat-card rounded-xl p-3 md:p-4 relative overflow-hidden group text-center transition-all ${activeFilter === 'upcoming' ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}
          >
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-[10px] md:text-xs font-medium text-gray-500 mb-0.5">24H출차</h3>
              <p className="text-xl md:text-2xl font-bold" style={{ color: '#EA580C' }}>
                {reservationStats.upcomingReservationsCount}
              </p>
            </div>
          </button>

          {/* 5. 72H점검 */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'needsInspection72H' ? 'all' : 'needsInspection72H')}
            className={`stat-card rounded-xl p-3 md:p-4 relative overflow-hidden group text-center transition-all ${activeFilter === 'needsInspection72H' ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
          >
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}>
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[10px] md:text-xs font-medium text-gray-500 mb-0.5">72H점검</h3>
              <p className="text-xl md:text-2xl font-bold" style={{ color: '#DC2626' }}>
                {reservationStats.needsInspection72HCount}
              </p>
            </div>
          </button>
        </div>

        {/* 검색 및 최근 차량 */}
        <div className="glass-card rounded-2xl shadow-xl animate-fade-in-up">
          <div className="p-5 md:p-6 border-b border-white/20">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="차량 번호 또는 모델로 검색하기"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="modern-input w-full pl-12 pr-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <input
                    type="checkbox"
                    checked={selectedVehicleIds.size > 0 && selectedVehicleIds.size === displayVehicles.filter(v => !v.id.startsWith('placeholder-')).length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                )}
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  차량 목록 {activeFilter !== 'all' ? `(${displayVehicles.length}대)` : `(${stats.totalVehicles}대)`}
                  {isAdmin && selectedVehicleIds.size > 0 && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
                      {selectedVehicleIds.size}대 선택됨
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && selectedVehicleIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {bulkDeleting ? '삭제 중...' : '일괄 삭제'}
                  </button>
                )}
                {activeFilter !== 'all' && (
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    style={{
                      background: activeFilter === 'inUse' ? 'rgba(34, 197, 94, 0.1)' : activeFilter === 'upcoming' ? 'rgba(249, 115, 22, 0.1)' : activeFilter === 'needsInspection72H' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: activeFilter === 'inUse' ? '#16A34A' : activeFilter === 'upcoming' ? '#EA580C' : activeFilter === 'needsInspection72H' ? '#9333EA' : '#DC2626'
                    }}
                  >
                    <span>{activeFilter === 'inUse' ? '운행중' : activeFilter === 'upcoming' ? '24H출차' : activeFilter === 'needsInspection72H' ? '72H점검' : '24H점검'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {/* 정렬 드롭다운 */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'departure' | 'return')}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="departure">출차시간순</option>
                  <option value="return">복귀예정순</option>
                </select>
              </div>
            </div>
            {(loading || loadingFiltered) ? (
              <div className="space-y-3">
                {/* 스켈레톤 로딩 */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse glass-card rounded-xl p-4 border border-white/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-32"></div>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayVehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {activeFilter !== 'all' ? '해당 조건의 차량이 없습니다.' : '등록된 차량이 없습니다.'}
              </div>
            ) : (
              <>
                {/* 모바일: 카드 형태 - 스크롤 컨테이너 */}
                <div className={`md:hidden space-y-3 pr-1 ${activeFilter === 'all' ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
                  {displayVehicles.map((vehicle, index) => {
                    const vehicleStatus = reservationStats.vehicleStatusMap[vehicle.vehicleNumber];
                    const isInUse = vehicleStatus?.status === '운행중';
                    const needsInspection = vehicleStatus?.needsInspection;
                    const isPlaceholder = vehicle.id.startsWith('placeholder-');
                    const isSelected = selectedVehicleIds.has(vehicle.id);

                    return (
                    <div
                      key={vehicle.id}
                      className={`flex items-start gap-3 glass-card rounded-xl p-4 border ${isPlaceholder ? 'border-orange-200 bg-orange-50/50' : isSelected ? 'border-blue-400 bg-blue-50/50' : 'border-white/30'}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {isAdmin && !isPlaceholder && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleVehicleSelection(vehicle.id)}
                          className="w-5 h-5 mt-1 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                        />
                      )}
                      <Link
                        href={isPlaceholder ? '#' : `/vehicles/${vehicle.id}`}
                        className={`flex-1 ${isPlaceholder ? 'pointer-events-none' : ''}`}
                        onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-base mb-1">
                              {vehicle.vehicleNumber}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">
                              {vehicle.model || '차량 정보 없음'}
                            </p>
                          </div>
                          {isPlaceholder ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">
                              미등록
                            </span>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* 상태 태그 - 상단으로 이동 */}
                        <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                          {vehicleStatus && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isInUse
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isInUse ? '운행중' : '대기중'}
                            </span>
                          )}
                          {needsInspection && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              점검필요
                            </span>
                          )}
                        </div>
                        {/* 상태별 정보 표시 */}
                        <div className="space-y-1.5 text-sm">
                          {isInUse ? (
                            /* 운행중: 최근 점검 - 복귀 예정 - 다음 출차 */
                            <>
                              {vehicle.inspections && vehicle.inspections[0] && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 w-16 flex-shrink-0">최근점검</span>
                                  <span className="text-gray-700">{formatDateTime(vehicle.inspections[0].inspectionDate)}</span>
                                </div>
                              )}
                              {vehicleStatus?.reservationEnd && (
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-500 w-16 flex-shrink-0 font-medium">복귀예정</span>
                                  <span className="text-blue-600 font-medium">{formatDateTime(vehicleStatus.reservationEnd)}</span>
                                </div>
                              )}
                              {vehicleStatus?.nextReservationStart && (
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-500 w-16 flex-shrink-0 font-medium">다음출차</span>
                                  <span className="text-orange-600 font-medium">
                                    {formatDateTime(new Date(new Date(vehicleStatus.nextReservationStart).getTime() - 4 * 60 * 60 * 1000))}
                                  </span>
                                  {(() => {
                                    const deadline = new Date(vehicleStatus.nextReservationStart).getTime() - 4 * 60 * 60 * 1000;
                                    const remaining = deadline - Date.now();
                                    if (remaining > 0) {
                                      const hours = Math.floor(remaining / (60 * 60 * 1000));
                                      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                                      return (
                                        <span className={`text-xs font-bold ${hours < 2 ? 'text-red-600' : 'text-blue-600'}`}>
                                          ({hours}시간 {mins}분)
                                        </span>
                                      );
                                    }
                                    return <span className="text-xs font-bold text-red-600">(마감)</span>;
                                  })()}
                                </div>
                              )}
                            </>
                          ) : needsInspection ? (
                            /* 대기중 + 점검필요: 최근 점검 - 최근 복귀 - 출차시간 */
                            <>
                              {vehicle.inspections && vehicle.inspections[0] && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 w-16 flex-shrink-0">최근점검</span>
                                  <span className="text-gray-700">{formatDateTime(vehicle.inspections[0].inspectionDate)}</span>
                                </div>
                              )}
                              {vehicleStatus?.lastReturnDate && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 w-16 flex-shrink-0">최근복귀</span>
                                  <span className="text-gray-700">{formatDateTime(vehicleStatus.lastReturnDate)}</span>
                                </div>
                              )}
                              {vehicleStatus?.reservationStart && (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-500 w-16 flex-shrink-0 font-medium">출차시간</span>
                                  <span className="text-red-600 font-medium">
                                    {formatDateTime(new Date(new Date(vehicleStatus.reservationStart).getTime() - 4 * 60 * 60 * 1000))}
                                  </span>
                                  {(() => {
                                    const deadline = new Date(vehicleStatus.reservationStart).getTime() - 4 * 60 * 60 * 1000;
                                    const remaining = deadline - Date.now();
                                    if (remaining > 0) {
                                      const hours = Math.floor(remaining / (60 * 60 * 1000));
                                      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                                      return (
                                        <span className={`text-xs font-bold ${hours < 2 ? 'text-red-600' : 'text-orange-500'}`}>
                                          ({hours}시간 {mins}분)
                                        </span>
                                      );
                                    }
                                    return <span className="text-xs font-bold text-red-600">(마감)</span>;
                                  })()}
                                </div>
                              )}
                            </>
                          ) : (
                            /* 대기중 (점검불필요): 최근 복귀 - 최근 점검 - 출차시간 */
                            <>
                              {vehicleStatus?.lastReturnDate && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 w-16 flex-shrink-0">최근복귀</span>
                                  <span className="text-gray-700">{formatDateTime(vehicleStatus.lastReturnDate)}</span>
                                </div>
                              )}
                              {vehicle.inspections && vehicle.inspections[0] && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 w-16 flex-shrink-0">최근점검</span>
                                  <span className="text-gray-700">{formatDateTime(vehicle.inspections[0].inspectionDate)}</span>
                                </div>
                              )}
                              {vehicleStatus?.reservationStart && (
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-500 w-16 flex-shrink-0 font-medium">출차시간</span>
                                  <span className="text-orange-600 font-medium">
                                    {formatDateTime(new Date(new Date(vehicleStatus.reservationStart).getTime() - 4 * 60 * 60 * 1000))}
                                  </span>
                                  {(() => {
                                    const deadline = new Date(vehicleStatus.reservationStart).getTime() - 4 * 60 * 60 * 1000;
                                    const remaining = deadline - Date.now();
                                    if (remaining > 0) {
                                      const hours = Math.floor(remaining / (60 * 60 * 1000));
                                      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                                      return (
                                        <span className={`text-xs font-bold ${hours < 2 ? 'text-red-600' : 'text-blue-600'}`}>
                                          ({hours}시간 {mins}분)
                                        </span>
                                      );
                                    }
                                    return <span className="text-xs font-bold text-red-600">(마감)</span>;
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                  })}

                  {/* 무한 스크롤 트리거 (모바일) - 필터 비활성화일 때만 */}
                  {activeFilter === 'all' && <div ref={observerTarget} className="h-4" />}

                  {/* 로딩 인디케이터 */}
                  {loadingMore && activeFilter === 'all' && (
                    <div className="text-center py-4 text-gray-500">
                      더 불러오는 중...
                    </div>
                  )}

                  {/* 모든 데이터 로드 완료 */}
                  {!hasMore && displayVehicles.length > 0 && activeFilter === 'all' && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      모든 차량을 불러왔습니다
                    </div>
                  )}
                </div>

                {/* 데스크톱: 테이블 형태 - 스크롤 컨테이너 */}
                <div className={`hidden md:block ${activeFilter === 'all' ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {isAdmin && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              checked={selectedVehicleIds.size > 0 && selectedVehicleIds.size === displayVehicles.filter(v => !v.id.startsWith('placeholder-')).length}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          차량번호
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제조사/모델
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          최근 점검일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          복귀시간
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          출차시간
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          출차까지 남은 시간
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayVehicles.map((vehicle) => {
                        const vehicleStatus = reservationStats.vehicleStatusMap[vehicle.vehicleNumber];
                        const isInUse = vehicleStatus?.status === '운행중';
                        const needsInspection = vehicleStatus?.needsInspection;
                        const isPlaceholder = vehicle.id.startsWith('placeholder-');
                        const isSelected = selectedVehicleIds.has(vehicle.id);

                        return (
                        <tr key={vehicle.id} className={`hover:bg-gray-50 ${isPlaceholder ? 'bg-orange-50/50' : isSelected ? 'bg-blue-50' : ''}`}>
                          {isAdmin && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              {!isPlaceholder && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleVehicleSelection(vehicle.id)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                              )}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vehicle.vehicleNumber}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.manufacturer} {vehicle.model || (isPlaceholder ? '차량 정보 없음' : '')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.inspections && vehicle.inspections[0] ? (
                              formatDateTime(vehicle.inspections[0].inspectionDate)
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(() => {
                              // 운행중: 복귀 예정 시간 (파란색), 대기중: 최근 복귀 시간 (기본)
                              const returnTime = isInUse
                                ? vehicleStatus?.reservationEnd
                                : vehicleStatus?.lastReturnDate;
                              if (!returnTime) return <span className="text-gray-400">-</span>;
                              return <span className={isInUse ? 'text-blue-600' : ''}>{formatDateTime(returnTime)}</span>;
                            })()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600">
                            {(() => {
                              // 운행중이면 다음 예약, 아니면 현재 예약
                              const targetReservation = isInUse
                                ? vehicleStatus?.nextReservationStart
                                : vehicleStatus?.reservationStart;
                              if (!targetReservation) return <span className="text-gray-400">-</span>;
                              return formatDateTime(new Date(new Date(targetReservation).getTime() - 4 * 60 * 60 * 1000));
                            })()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {(() => {
                              // 운행중이면 다음 예약, 대기중이면 현재 예약
                              const targetReservation = isInUse
                                ? vehicleStatus?.nextReservationStart
                                : vehicleStatus?.reservationStart;
                              if (!targetReservation) return <span className="text-gray-400">-</span>;
                              // 운행중인데 다음 예약이 없거나, 대기중인데 점검필요가 아니면 표시 안함
                              if (!isInUse && !needsInspection) return <span className="text-gray-400">-</span>;
                              const deadline = new Date(targetReservation).getTime() - 4 * 60 * 60 * 1000;
                              const remaining = deadline - Date.now();
                              if (remaining > 0) {
                                const hours = Math.floor(remaining / (60 * 60 * 1000));
                                const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                                return (
                                  <span className={`font-medium ${hours < 2 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {hours}시간 {mins}분
                                  </span>
                                );
                              } else {
                                return <span className="font-medium text-red-600">마감</span>;
                              }
                            })()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-1">
                              {vehicleStatus && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isInUse
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {isInUse ? '운행중' : '대기중'}
                                </span>
                              )}
                              {needsInspection && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  점검필요
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            {isPlaceholder ? (
                              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">
                                미등록
                              </span>
                            ) : (
                              <Link
                                href={`/vehicles/${vehicle.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                상세보기
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>

                  {/* 무한 스크롤 트리거 (데스크톱) - 필터 비활성화일 때만 */}
                  {activeFilter === 'all' && <div ref={observerTarget} className="h-4" />}

                  {/* 로딩 인디케이터 */}
                  {loadingMore && activeFilter === 'all' && (
                    <div className="text-center py-4 text-gray-500">
                      더 불러오는 중...
                    </div>
                  )}

                  {/* 모든 데이터 로드 완료 */}
                  {!hasMore && displayVehicles.length > 0 && activeFilter === 'all' && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      모든 차량을 불러왔습니다
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* 일괄 등록 모달 */}
      {showBulkUpload && (
        <BulkUpload
          onComplete={() => {
            setPage(1);
            setVehicles([]);
            setHasMore(true);
            fetchVehicles(1, true);
            fetchStats();
          }}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
}


