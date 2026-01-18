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
  const observerTarget = useRef<HTMLDivElement>(null);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);

  // 데이터 새로고침 함수 (디바운스 적용)
  const refreshData = useCallback((force = false) => {
    const now = Date.now();
    // 5초 이내에 이미 fetch 했거나 현재 fetching 중이면 스킵
    if (!force && (isFetching.current || now - lastFetchTime.current < 5000)) {
      return;
    }
    lastFetchTime.current = now;
    setPage(1);
    setVehicles([]);
    setHasMore(true);
    fetchVehicles(1, true);
    fetchStats();
  }, []);

  // 초기 로드
  useEffect(() => {
    refreshData(true);
  }, []);

  // 검색어가 변경되면 페이지 리셋하고 새로 fetch
  useEffect(() => {
    if (search !== '') {
      refreshData(true);
    }
  }, [search, refreshData]);

  // 페이지가 변경되면 추가 데이터 fetch
  useEffect(() => {
    if (page > 1) {
      fetchVehicles(page, false);
    }
  }, [page]);

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

  const fetchVehicles = async (pageNum: number, isReset: boolean) => {
    if (isFetching.current && isReset) return;

    try {
      isFetching.current = true;
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', pageNum.toString());
      params.append('limit', '15');

      const res = await fetch(`/api/vehicles?${params}`);
      const data = await res.json();
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

      const vehiclesData = await vehiclesRes.json();
      const inspectionsData = await inspectionsRes.json();

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
                세차·점검 기록 등록
              </Link>
              <Link
                href="/maintenance/new"
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
              >
                소모품·경정비 기록 등록
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
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
          <div className="stat-card rounded-2xl p-5 md:p-7 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl" style={{ background: 'rgba(102, 176, 255, 0.25)' }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-600">전체 차량</h3>
              </div>
              <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {loading && stats.totalVehicles === 0 ? <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span> : stats.totalVehicles}
              </p>
            </div>
          </div>
          <div className="stat-card rounded-2xl p-5 md:p-7 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl" style={{ background: 'rgba(51, 147, 255, 0.2)' }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3393FF 0%, #0078FF 100%)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-600">오늘 점검</h3>
              </div>
              <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent" style={{ background: 'linear-gradient(135deg, #3393FF 0%, #0078FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {loading && stats.recentInspections === 0 ? <span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span> : stats.recentInspections}
              </p>
            </div>
          </div>
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
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
              차량 목록 ({stats.totalVehicles}대)
            </h2>
            {loading ? (
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
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 차량이 없습니다.
              </div>
            ) : (
              <>
                {/* 모바일: 카드 형태 - 스크롤 컨테이너 */}
                <div className="md:hidden space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {vehicles.map((vehicle, index) => (
                    <Link
                      key={vehicle.id}
                      href={`/vehicles/${vehicle.id}`}
                      className="block glass-card rounded-xl p-4 border border-white/30 active:scale-[0.98] transition-all duration-200"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base mb-1">
                            {vehicle.vehicleNumber}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            {vehicle.manufacturer} {vehicle.model}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      {vehicle.inspections[0] && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          최근 점검: {new Date(
                            vehicle.inspections[0].inspectionDate
                          ).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </Link>
                  ))}

                  {/* 무한 스크롤 트리거 (모바일) */}
                  <div ref={observerTarget} className="h-4" />

                  {/* 로딩 인디케이터 */}
                  {loadingMore && (
                    <div className="text-center py-4 text-gray-500">
                      더 불러오는 중...
                    </div>
                  )}

                  {/* 모든 데이터 로드 완료 */}
                  {!hasMore && vehicles.length > 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      모든 차량을 불러왔습니다
                    </div>
                  )}
                </div>

                {/* 데스크톱: 테이블 형태 - 스크롤 컨테이너 */}
                <div className="hidden md:block max-h-[60vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          차량번호
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제조사/모델
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          최근 점검일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vehicle.vehicleNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.manufacturer} {vehicle.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.inspections[0]
                              ? new Date(
                                  vehicle.inspections[0].inspectionDate
                                ).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/vehicles/${vehicle.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              상세보기
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 무한 스크롤 트리거 (데스크톱) */}
                  <div ref={observerTarget} className="h-4" />

                  {/* 로딩 인디케이터 */}
                  {loadingMore && (
                    <div className="text-center py-4 text-gray-500">
                      더 불러오는 중...
                    </div>
                  )}

                  {/* 모든 데이터 로드 완료 */}
                  {!hasMore && vehicles.length > 0 && (
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


