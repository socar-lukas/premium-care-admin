'use client';

import { useEffect, useRef, useState } from 'react';

export default function SocarLogo({ className = '' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 비디오가 로드되면 재생
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedData = () => {
        setIsLoaded(true);
        video.play().catch(() => {
          // 자동 재생 실패 시 무시
        });
      };

      const handleCanPlay = () => {
        video.play().catch(() => {
          // 자동 재생 실패 시 무시
        });
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      
      // 이미 로드된 경우
      if (video.readyState >= 2) {
        handleLoadedData();
      }

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, []);

  return (
    <div className={`relative ${className} flex items-center`}>
      {/* 쏘카 심볼 비디오 로고 */}
      <div className="relative h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 overflow-hidden rounded-full bg-transparent flex-shrink-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
          style={{
            display: 'block',
            backgroundColor: 'transparent',
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <source 
            src="https://brand.socar.kr/assets/video_logo-symbol-white-RoyvyP6G.mp4" 
            type="video/mp4" 
          />
        </video>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
