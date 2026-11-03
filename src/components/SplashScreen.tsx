import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    // 4.5 seconds total
    const totalDuration = 4500;
    const intervalTime = 45;
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
    }, 4000);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, totalDuration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const handleSkip = () => {
    setIsFading(true);
    // Instant clean unmount with microscopic RAF tick for CSS fade trigger
    requestAnimationFrame(() => {
      onDismiss();
    });
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0F1316] text-white select-none will-change-[opacity,transform] ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        transform: 'translateZ(0)',
        transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundImage: 'radial-gradient(circle at 50% 38%, rgba(197, 160, 40, 0.16) 0%, rgba(15, 19, 22, 0.95) 65%, #0F1316 100%)'
      }}
    >
      {/* Top Bar with Skip Button */}
      <div className="w-full flex justify-end p-4 sm:p-6">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-semibold tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full transition active:scale-95 cursor-pointer"
        >
          Skip &rarr;
        </button>
      </div>

      {/* Center Emblem & Typography */}
      <div className="flex flex-col items-center justify-center px-4 -mt-8">
        
        {/* Emblem Halo Container */}
        <div className="relative mb-6">
          {/* Subtle Outer Radial Glow */}
          <div className="absolute inset-0 rounded-full bg-[#C5A028] opacity-25 blur-xl animate-pulse-subtle pointer-events-none" />
          
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-[#8C701B] via-[#E6D385] to-[#C5A028] shadow-[0_0_35px_rgba(197,160,40,0.3)] animate-pulse-subtle">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0F1316] flex items-center justify-center relative">
              
              {/* Instant 0ms SVG Fallback (Always ready, no network wait) */}
              <div className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${imgLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <img
                  src="/logo.svg"
                  alt="Dwarka Clinic Emblem"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Preloaded PNG for ultra-high resolution photo-fidelity */}
              <img
                src="/logo.png"
                onLoad={() => setImgLoaded(true)}
                alt="Dr. Baldawa's Dwarka Clinic Emblem"
                className={`w-full h-full object-cover relative z-10 transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </div>
        </div>

        {/* Branding Typography */}
        <div className="text-center space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest uppercase font-serif text-[#C5A028]">
            <span className="block text-sm sm:text-base font-semibold tracking-[0.25em] text-[#E6D385] mb-0.5">
              DR. BALDAWA'S
            </span>
            <span className="gold-gradient-text tracking-[0.15em]">
              DWARKA CLINIC
            </span>
          </h1>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-[#C5A028] to-transparent my-2" />
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-[#E6D385]/80 font-medium">
            Skin & Hair Care • Jaysingpur
          </p>
          <p className="text-[10px] tracking-wider text-slate-500 uppercase mt-0.5">
            Estd 2009
          </p>
        </div>

      </div>

      {/* Bottom Progress Bar & Status */}
      <div className="w-full max-w-xs px-6 pb-8 text-center space-y-3">
        <div className="w-full bg-white/10 h-0.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#8C701B] via-[#E6D385] to-[#C5A028] transition-all duration-75 ease-linear rounded-full"
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
