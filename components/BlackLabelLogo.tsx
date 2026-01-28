'use client';

export default function BlackLabelLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center`}>
      {/* BlackLabel 로고 */}
      <div className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex-shrink-0 shadow-lg flex items-center justify-center">
        <span className="text-white font-black text-sm sm:text-base md:text-lg tracking-tight">BL</span>
      </div>
    </div>
  );
}
