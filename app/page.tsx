'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileNav from '@/components/MobileNav';
import SocarLogo from '@/components/SocarLogo';
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
  inUseCarNums?: string[];
  upcomingCarNums?: string[];
  needsInspectionCarNums?: string[];
  vehicleStatusMap?: Record<string, { status: '운행중' | '대기중'; needsInspection: boolean; carName: string }>;
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
    inUseCarNums: [] as string[],
    upcomingCarNums: [] as string[],
    needsInspectionCarNums: [] as string[],
    vehicleStatusMap: {} as Record<string, { status: '운행중' | '대기중'; needsInspection: boolean; carName: string }>,
  });
  const [activeFilter, setActiveFilter] = useState<'all' | 'inUse' | 'upcoming' | 'needsInspection'>('all');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);

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
          inUseCarNums: data.inUseCarNums || [],
          upcomingCarNums: data.upcomingCarNums || [],
          needsInspectionCarNums: priorityNums,
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
    if (search !== '') {
      setPage(1);
      setVehicles([]);
      setHasMore(true);
      fetchVehicles(1, true, []);  // 검색 시에는 우선순위 없이
    }
  }, [search]);

  // 페이지가 변경되면 추가 데이터 fetch
  useEffect(() => {
    if (page > 1) {
      fetchVehicles(page, false, search ? [] : needsInspectionCarNumsRef.current);
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

  const fetchVehicles = async (pageNum: number, isReset: boolean, priorityCarNums: string[] = []) => {
    if (isFetching.current && isReset) return;

    try {
      isFetching.current = true;
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      } else if (priorityCarNums.length > 0) {
        // 검색이 아닐 때만 우선순위 정렬 적용
        params.append('priorityCarNums', priorityCarNums.join(','));
      }
      params.append('page', pageNum.toString());
      params.append('limit', '15');

      const res = await fetch(`/api/vehicles?${params}`);
      if (!res.ok) {
        console.error('Vehicle fetch failed:', res.status, res.statusText);
        return;
      }
      const data = await safeJsonParse<VehiclesResponse>(res, { vehicles: [], pagination: { totalPages: 1 } });
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

      // 모든 차량 합치기
      const allVehicles = [...dbVehicles, ...placeholderVehicles];

      // 정렬: 점검필요 먼저, 그 다음 차량번호 오름차순
      allVehicles.sort((a, b) => {
        const aNeedsInspection = statusMap[a.vehicleNumber]?.needsInspection || false;
        const bNeedsInspection = statusMap[b.vehicleNumber]?.needsInspection || false;

        // 점검필요 차량 먼저
        if (aNeedsInspection && !bNeedsInspection) return -1;
        if (!aNeedsInspection && bNeedsInspection) return 1;

        // 그 다음 차량번호 오름차순
        return a.vehicleNumber.localeCompare(b.vehicleNumber, 'ko');
      });

      setFilteredVehicles(allVehicles);
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
    } else {
      setFilteredVehicles([]);
    }
  }, [activeFilter, reservationStats]);

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

    // 점검필요 차량 중 DB에 없는 차량 추가 (placeholder)
    const placeholderVehicles: Vehicle[] = reservationStats.needsInspectionCarNums
      .filter(num => !dbVehicleNumbers.has(num))
      .map(num => ({
        id: `placeholder-${num}`,
        vehicleNumber: num,
        ownerName: '',
        model: statusMap[num]?.carName || null,
        manufacturer: null,
        inspections: [],
      }));

    // 합치기
    const allVehicles = [...uniqueDbVehicles, ...placeholderVehicles];

    // 정렬: 점검필요 먼저, 그 다음 차량번호 오름차순
    return allVehicles.sort((a, b) => {
      const aNeedsInspection = statusMap[a.vehicleNumber]?.needsInspection || false;
      const bNeedsInspection = statusMap[b.vehicleNumber]?.needsInspection || false;

      if (aNeedsInspection && !bNeedsInspection) return -1;
      if (!aNeedsInspection && bNeedsInspection) return 1;

      return a.vehicleNumber.localeCompare(b.vehicleNumber, 'ko');
    });
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
              <SocarLogo />
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Socar Premium Admin
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
                href="/inspections/new"
                className="gradient-button-primary px-5 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
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
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 animate-fade-in-up">
          {/* 1. 전체 차량 */}
          <div className="stat-card rounded-2xl p-4 md:p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ background: 'rgba(102, 176, 255, 0.25)' }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-600">전체 차량</h3>
              </div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#0078FF' }}>
                {loading && stats.totalVehicles === 0 ? <span className="inline-block w-10 h-7 bg-gray-200 rounded animate-pulse"></span> : stats.totalVehicles}
              </p>
            </div>
          </div>

          {/* 2. 현재 운행중 */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'inUse' ? 'all' : 'inUse')}
            className={`stat-card rounded-2xl p-4 md:p-5 relative overflow-hidden group text-left transition-all ${activeFilter === 'inUse' ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ background: 'rgba(34, 197, 94, 0.2)' }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-600">운행중</h3>
              </div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#16A34A' }}>
                {reservationStats.inUseCount}
              </p>
            </div>
          </button>

          {/* 3. D+1 예약 */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'upcoming' ? 'all' : 'upcoming')}
            className={`stat-card rounded-2xl p-4 md:p-5 relative overflow-hidden group text-left transition-all ${activeFilter === 'upcoming' ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ background: 'rgba(249, 115, 22, 0.2)' }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-600">D+1 예약</h3>
              </div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#EA580C' }}>
                {reservationStats.upcomingReservationsCount}
              </p>
            </div>
          </button>

          {/* 4. 점검 필요 */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'needsInspection' ? 'all' : 'needsInspection')}
            className={`stat-card rounded-2xl p-4 md:p-5 relative overflow-hidden group text-left transition-all ${activeFilter === 'needsInspection' ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ background: 'rgba(239, 68, 68, 0.2)' }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}>
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-600">D+1 점검 필요</h3>
              </div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#DC2626' }}>
                {reservationStats.needsInspectionCount}
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
                      background: activeFilter === 'inUse' ? 'rgba(34, 197, 94, 0.1)' : activeFilter === 'upcoming' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: activeFilter === 'inUse' ? '#16A34A' : activeFilter === 'upcoming' ? '#EA580C' : '#DC2626'
                    }}
                  >
                    <span>{activeFilter === 'inUse' ? '운행중' : activeFilter === 'upcoming' ? 'D+1 예약' : 'D+1 점검 필요'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
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
                        {/* 최근 점검일 */}
                        {vehicle.inspections && vehicle.inspections[0] && (
                          <p className="text-xs text-gray-500 mt-1">
                            점검: {new Date(vehicle.inspections[0].inspectionDate).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                        {/* 상태 태그 */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
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
                          예약 상태
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          점검
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
                              new Date(vehicle.inspections[0].inspectionDate).toLocaleDateString('ko-KR')
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {vehicleStatus ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isInUse
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isInUse ? '운행중' : '대기중'}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {needsInspection ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                점검필요
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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


