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
        video.play().catch((err) => {
          console.log('Video play error:', err);
          // 자동 재생 실패해도 비디오는 표시
          setIsLoaded(true);
        });
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
        video.play().catch(() => {
          // 자동 재생 실패해도 비디오는 표시
          setIsLoaded(true);
        });
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlay);
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

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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
                display: isLoaded ? 'block' : 'none',
                backgroundColor: 'transparent',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
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
