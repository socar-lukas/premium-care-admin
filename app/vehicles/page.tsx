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
  year: number | null;
  contact: string | null;
  inspections: Array<{ inspectionDate: Date }>;
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVehicles();
  }, [search, page]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await fetch(`/api/vehicles?${params}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API error:', res.status, errorData);
        alert(`차량 목록을 불러오는데 실패했습니다: ${errorData.error || res.statusText}`);
        return;
      }

      const data = await res.json();
      console.log('Fetched vehicles:', data);
      
      if (data.vehicles) {
        setVehicles(data.vehicles);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.warn('No vehicles array in response:', data);
        setVehicles([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      alert('차량 목록을 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
      setVehicles([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, vehicleNumber: string) => {
    if (!confirm(`차량 ${vehicleNumber}를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchVehicles();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="glass-card sticky top-0 z-30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center">
            <Link href="/" className="flex items-center gap-3">
              <SocarLogo />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Socar Premium Admin
              </span>
            </Link>
            <div className="hidden md:flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-white/50 transition-all duration-200"
              >
                대시보드
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
        <div className="glass-card rounded-2xl shadow-xl animate-fade-in-up">
          <div className="p-5 md:p-6 border-b border-white/20">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-5">차량 목록</h1>
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="modern-input w-full pl-12 pr-4 py-3 text-base md:text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="p-4 md:p-6">
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
                    <div
                      key={vehicle.id}
                      className="glass-card rounded-xl p-4 border border-white/30"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base mb-1">
                            {vehicle.vehicleNumber}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">{vehicle.ownerName}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/vehicles/${vehicle.id}`}
                            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-lg font-semibold shadow-md"
                          >
                            상세
                          </Link>
                          <button
                            onClick={() => handleDelete(vehicle.id, vehicle.vehicleNumber)}
                            className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-lg font-semibold shadow-md"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-50 rounded-md text-blue-700 text-xs font-medium">
                            {vehicle.manufacturer} {vehicle.model}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {vehicle.year && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {vehicle.year}
                            </span>
                          )}
                          {vehicle.contact && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {vehicle.contact}
                            </span>
                          )}
                        </div>
                        {vehicle.inspections[0] && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            최근 점검: {new Date(
                              vehicle.inspections[0].inspectionDate
                            ).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </div>
                    </div>
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
                          연식
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          연락처
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
                            {vehicle.year || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.contact || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.inspections[0]
                              ? new Date(
                                  vehicle.inspections[0].inspectionDate
                                ).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Link
                              href={`/vehicles/${vehicle.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              상세
                            </Link>
                            <button
                              onClick={() => handleDelete(vehicle.id, vehicle.vehicleNumber)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-5 py-2 border-2 border-gray-200 rounded-xl disabled:opacity-50 hover:bg-white/80 hover:border-gray-300 transition-all duration-200 font-medium"
                    >
                      이전
                    </button>
                    <span className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-5 py-2 border-2 border-gray-200 rounded-xl disabled:opacity-50 hover:bg-white/80 hover:border-gray-300 transition-all duration-200 font-medium"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


