import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Exactly 3.0 seconds total splash duration
    const totalDuration = 3000;
    const intervalTime = 30;
    const step = 100 / (totalDuration / intervalTime);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, intervalTime);

    // Trigger smooth fade-out 500ms before total duration
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, totalDuration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div 
      data-testid="splash-screen"
      onClick={onDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0F1316] text-white select-none cursor-pointer will-change-[opacity,transform] ${
        isFading ? 'opacity-0 pointer-events-none transition-opacity duration-500 ease-in-out' : 'opacity-100'
      }`}
      style={{
        transform: 'translateZ(0)',
        backgroundImage: 'radial-gradient(circle at 50% 38%, rgba(197, 160, 40, 0.15) 0%, rgba(15, 19, 22, 0.95) 65%, #0F1316 100%)'
      }}
    >
      {/* Top Spacer for vertical balance */}
      <div className="w-full h-8 sm:h-12" />

      {/* Center Emblem & Typography */}
      <div 
        className={`flex flex-col items-center justify-center px-4 -mt-4 transition-all duration-700 ease-out ${
          isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Emblem Halo Container */}
        <div className="relative mb-6">
          {/* Subtle Outer Radial Glow */}
          <div className="absolute inset-0 rounded-full bg-[#C5A028] opacity-25 blur-xl animate-pulse pointer-events-none" />
          
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-[#8C701B] via-[#E6D385] to-[#C5A028] shadow-[0_0_35px_rgba(197,160,40,0.3)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0F1316] flex items-center justify-center p-0.5">
              <img
                src="/logo.png"
                alt="Dr. Baldawa's Dwarka Clinic Emblem"
                data-testid="splash-logo-img"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
          </div>
        </div>

        {/* Branding Typography */}
        <div className="text-center space-y-1.5">
          <h1 className="text-lg sm:text-2xl font-black tracking-widest uppercase font-serif text-[#C5A028]">
            <span className="block text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#E6D385] mb-0.5">
              DR. BALDAWA'S
            </span>
            <span className="gold-gradient-text tracking-[0.15em]">
              DWARKA CLINIC
            </span>
          </h1>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-[#C5A028] to-transparent my-2" />
          <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E6D385]/90 font-medium">
            Skin &amp; Hair Care • Jaysingpur
          </p>
          <p className="text-[10px] tracking-wider text-slate-500 uppercase mt-0.5">
            Estd 2009
          </p>
        </div>

      </div>

      {/* Bottom Progress Bar & Status */}
      <div className="w-full max-w-xs px-6 pb-8 text-center space-y-3">
        <div className="w-full bg-white/10 h-[2px] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#C5A028] transition-all duration-75 ease-out rounded-full shadow-[0_0_8px_#C5A028]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
          Initializing Reception Desk...
        </p>
      </div>

    </div>
  );
};
