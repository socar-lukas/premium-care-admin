'use client';

import { useEffect, useRef } from 'react';

export default function SocarLogo({ className = '' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 비디오가 로드되면 재생
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // 자동 재생 실패 시 무시
      });
    }
  }, []);

  return (
    <div className={`relative ${className} flex items-center`}>
      {/* 쏘카 심볼 비디오 로고 */}
      <div className="relative h-10 md:h-16 w-10 md:w-16 overflow-hidden rounded-full">
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
          }}
        >
          <source 
            src="https://brand.socar.kr/assets/video_logo-symbol-white-RoyvyP6G.mp4" 
            type="video/mp4" 
          />
        </video>
      </div>
    </div>
  );
}
