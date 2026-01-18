'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminLoginModal from './AdminLoginModal';

interface MobileNavProps {
  onBulkUpload?: () => void;
}

export default function MobileNav({ onBulkUpload }: MobileNavProps) {
  const { isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 메뉴가 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // body 스크롤 방지
      document.body.style.overflow = 'hidden';
      // iOS Safari를 위한 추가 처리
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // 스크롤 복원
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      // 컴포넌트 언마운트 시 스크롤 복원
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 z-50 relative"
        aria-label="메뉴"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* 모바일 메뉴 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-80 z-[9998] md:hidden"
          onClick={() => setIsOpen(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* 모바일 메뉴 */}
      <div
        className={`fixed top-0 right-0 h-screen w-72 bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out md:hidden border-l border-gray-200 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          backgroundColor: '#ffffff',
          pointerEvents: 'auto',
          height: '100vh',
          maxHeight: '100vh',
        }}
      >
        <div className="p-5 border-b border-gray-200 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #D6EBFF 100%)' }}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">메뉴</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-700 hover:bg-white/50 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <nav className="p-4 space-y-2 bg-white flex-1 overflow-y-auto">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-gray-900 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-[#EBF5FF]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            대시보드
          </Link>
          <Link
            href="/inspections/new"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-gray-900 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-[#EBF5FF]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            세차·점검 기록 등록
          </Link>
          <Link
            href="/maintenance/new"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-gray-900 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-[#EBF5FF]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            소모품·경정비 기록 등록
          </Link>
          {isAdmin && (
            <>
              {onBulkUpload && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onBulkUpload();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-semibold shadow-lg mt-4 w-full"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  차량 일괄 등록
                </button>
              )}
              <Link
                href="/vehicles/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-semibold shadow-lg mt-2 w-full"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                차량 수기 등록
              </Link>
            </>
          )}

          <div className="border-t border-gray-200 mt-4 pt-4">
            {isAdmin ? (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-red-600 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-red-50 w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLoginModal(true);
                }}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-[#EBF5FF] w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                관리자 로그인
              </button>
            )}
          </div>
        </nav>
      </div>

      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

