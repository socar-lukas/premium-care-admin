'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(pin);

    if (success) {
      setPin('');
      onClose();
    } else {
      setError('PIN 번호가 올바르지 않습니다.');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">관리자 로그인</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN 번호
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN 번호를 입력하세요"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="flex-1 px-4 py-3 text-white rounded-xl font-medium disabled:opacity-50 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}
            >
              {loading ? '확인 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
