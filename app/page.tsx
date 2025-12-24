'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileNav from '@/components/MobileNav';
import SocarLogo from '@/components/SocarLogo';

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalVehicles: 0,
    recentInspections: 0,
  });

  useEffect(() => {
    fetchVehicles();
    fetchStats();
  }, [search]);

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      fetchVehicles();
      fetchStats();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 페이지 로드 시 데이터 새로고침 (다른 페이지에서 돌아왔을 때)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchVehicles();
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '10');

      const res = await fetch(`/api/vehicles?${params}`);
      const data = await res.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="glass-card sticky top-0 z-30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center">
            <div className="flex items-center gap-3">
              <SocarLogo />
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                프리미엄 차량 관리
              </h1>
            </div>
            <div className="hidden md:flex gap-3">
              <Link
                href="/vehicles"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-white/50 transition-all duration-200"
              >
                차량 목록
              </Link>
              <Link
                href="/vehicles/new"
                className="gradient-button-primary px-5 py-2 text-white rounded-lg text-sm font-semibold shadow-lg"
              >
                + 차량 등록
              </Link>
            </div>
            <div className="md:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
          <div className="stat-card rounded-2xl p-5 md:p-7 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-600">전체 차량</h3>
              </div>
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stats.totalVehicles}
              </p>
            </div>
          </div>
          <div className="stat-card rounded-2xl p-5 md:p-7 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-600">오늘 점검</h3>
              </div>
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.recentInspections}
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
                placeholder="차량번호 또는 소유자명으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="modern-input w-full pl-12 pr-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
              최근 등록 차량
            </h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 차량이 없습니다.
              </div>
            ) : (
              <>
                {/* 모바일: 카드 형태 */}
                <div className="md:hidden space-y-3">
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
                            {vehicle.ownerName}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <span className="px-2 py-1 bg-blue-50 rounded-md text-blue-700 font-medium">
                          {vehicle.manufacturer} {vehicle.model}
                        </span>
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
                </div>

                {/* 데스크톱: 테이블 형태 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          차량번호
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          소유자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          모델
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
                            {vehicle.ownerName}
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
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


