'use client';

import { useEffect, useRef, useState } from 'react';

export default function BlackLabelLogo({ className = '' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handleLoadedData = () => {
        setIsLoaded(true);
        setHasError(false);
        setTimeout(() => {
          video.play().catch(() => {
            setIsLoaded(true);
          });
        }, 100);
      };

      const handleCanPlay = () => {
        setIsLoaded(true);
        setHasError(false);
        video.play().catch(() => {
          setIsLoaded(true);
        });
      };

      const handleError = () => {
        setHasError(true);
        setIsLoaded(false);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      if (video.readyState >= 2) {
        handleLoadedData();
      } else {
        video.load();
      }

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
        video.removeEventListener('error', handleError);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('click', handleUserInteraction);
      };
    }
  }, []);

  return (
    <div className={`relative ${className} flex items-center`}>
      {/* 쏘카 심볼 비디오 로고 */}
      <div className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 overflow-hidden rounded-full bg-white flex-shrink-0 shadow-sm border border-gray-200">
        {!hasError ? (
          <>
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
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 rounded-full">
            <span className="text-white font-bold text-xs">BL</span>
          </div>
        )}
      </div>
    </div>
  );
}
