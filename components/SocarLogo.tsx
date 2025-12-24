'use client';

import { useEffect, useRef, useState } from 'react';

export default function SocarLogo({ className = '' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // 비디오가 로드되면 재생
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedData = () => {
        setIsLoaded(true);
        setHasError(false);
        // 약간의 지연 후 재생 시도 (모바일 호환성)
        setTimeout(() => {
          video.play().catch((err) => {
            console.log('Video play error:', err);
            // 자동 재생 실패해도 비디오는 표시
            setIsLoaded(true);
          });
        }, 100);
      };

      const handleCanPlay = () => {
        setIsLoaded(true);
        setHasError(false);
        video.play().catch((err) => {
          console.log('Video play error:', err);
          // 자동 재생 실패해도 비디오는 표시
          setIsLoaded(true);
        });
      };

      const handleCanPlayThrough = () => {
        setIsLoaded(true);
        setHasError(false);
        video.play().catch(() => {
          setIsLoaded(true);
        });
      };

      const handleError = (e: Event) => {
        console.error('Video load error:', e);
        setHasError(true);
        setIsLoaded(false);
      };

      const handleLoadStart = () => {
        setIsLoaded(false);
        setHasError(false);
      };

      const handleLoadedMetadata = () => {
        setIsLoaded(true);
        setHasError(false);
        // 메타데이터 로드 후 재생 시도
        setTimeout(() => {
          video.play().catch(() => {
            setIsLoaded(true);
          });
        }, 200);
      };

      // 이벤트 리스너 추가
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // 이미 로드된 경우
      if (video.readyState >= 2) {
        handleLoadedData();
      } else {
        // 강제로 로드 시도
        video.load();
      }

      // 사용자 상호작용 후 재생 시도 (모바일 브라우저 정책 대응)
      const handleUserInteraction = () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      };
      
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('click', handleUserInteraction, { once: true });

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('click', handleUserInteraction);
      };
    }
  }, []);

  return (
    <div className={`relative ${className} flex items-center`}>
      {/* 쏘카 심볼 비디오 로고 */}
      <div className="relative h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 overflow-hidden rounded-full bg-white flex-shrink-0 shadow-sm border border-gray-200">
        {!hasError ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              webkit-playsinline="true"
              x5-playsinline="true"
              className="h-full w-full object-cover"
              style={{
                display: 'block',
                backgroundColor: 'transparent',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
            >
              <source 
                src="https://brand.socar.kr/assets/video_logo-symbol-white-RoyvyP6G.mp4" 
                type="video/mp4" 
              />
            </video>
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full z-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 rounded-full">
            <span className="text-white font-bold text-xs sm:text-sm">SOCAR</span>
          </div>
        )}
      </div>
    </div>
  );
}
