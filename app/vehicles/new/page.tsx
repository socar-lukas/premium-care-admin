'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SocarLogo from '@/components/SocarLogo';

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    ownerName: '',
    model: '',
    manufacturer: '',
    year: '',
    contact: '',
    vehicleType: '',
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : undefined,
      };

      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const vehicle = await res.json();
        // 성공 후 대시보드로 이동 (데이터 새로고침을 위해)
        router.push('/');
        // 또는 차량 상세 페이지로 이동
        // router.push(`/vehicles/${vehicle.id}`);
      } else {
        const error = await res.json();
        const errorMessage = error.error || error.message || '등록에 실패했습니다.';
        const details = error.details ? `\n\n상세: ${JSON.stringify(error.details, null, 2)}` : '';
        alert(`${errorMessage}${details}`);
        console.error('Server error:', error);
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      const errorMessage = error instanceof Error ? error.message : '등록에 실패했습니다.';
      alert(`오류 발생: ${errorMessage}\n\n콘솔을 확인해주세요.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 50%, #A3D1FF 100%)' }}>
      <nav className="glass-card sticky top-0 z-30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center">
            <Link href="/vehicles" className="flex items-center gap-3">
              <SocarLogo />
              <span className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Socar Premium Admin
              </span>
            </Link>
            <Link
              href="/vehicles"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-white/50 transition-all duration-200"
            >
              목록으로
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="glass-card rounded-2xl shadow-xl p-6 md:p-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">차량 등록</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  차량번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleNumber: e.target.value })
                  }
                  className="modern-input w-full px-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소유자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  className="modern-input w-full px-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제조사
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  className="modern-input w-full px-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  모델
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="modern-input w-full px-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연식
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="modern-input w-full px-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="modern-input w-full px-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  차량 유형
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleType: e.target.value })
                  }
                  className="modern-input w-full px-4 py-3 md:py-3 text-base md:text-sm rounded-xl"
                >
                  <option value="">선택하세요</option>
                  <option value="승용차">승용차</option>
                  <option value="SUV">SUV</option>
                  <option value="트럭">트럭</option>
                  <option value="버스">버스</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모/특이사항
              </label>
              <textarea
                value={formData.memo}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 justify-end pt-6 border-t border-white/20">
              <Link
                href="/vehicles"
                className="w-full sm:w-auto px-6 py-3 text-center border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-white/80 hover:border-gray-300 font-semibold transition-all duration-200"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="gradient-button-primary w-full sm:w-auto px-8 py-3 text-white rounded-xl disabled:opacity-50 font-semibold text-base md:text-sm"
              >
                {loading ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


