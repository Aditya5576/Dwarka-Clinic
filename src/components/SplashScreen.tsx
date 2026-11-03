import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // 4.5 seconds total = 4500ms
    const totalDuration = 4500;
    const intervalTime = 45; // 100 steps
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

    // Start fade-out at 4100ms so it completes at 4500ms
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 4100);

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
    setTimeout(() => {
      onDismiss();
    }, 150);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#12161A] text-white select-none transition-opacity duration-400 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(197, 160, 40, 0.15) 0%, rgba(18, 22, 26, 0.95) 70%, #12161A 100%)'
      }}
    >
      {/* Top Bar with Skip Button */}
      <div className="w-full flex justify-end p-4 sm:p-6">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-semibold tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full transition active:scale-95"
        >
          Skip &rarr;
        </button>
      </div>

      {/* Center Emblem & Typography */}
      <div className="flex flex-col items-center justify-center px-4 -mt-8">
        
        {/* Emblem Halo Container */}
        <div className="relative mb-6">
          {/* Subtle Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-[#C5A028] opacity-25 blur-xl animate-pulse-subtle" />
          
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-[#B38F1E] via-[#E6D385] to-[#C5A028] shadow-[0_0_30px_rgba(197,160,40,0.35)] animate-pulse-subtle">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#12161A] flex items-center justify-center">
              <img
                src={imgError ? "/logo.svg" : "/logo.png"}
                onError={() => setImgError(true)}
                alt="Dr. Baldawa's Dwarka Clinic Emblem"
                className="w-full h-full object-cover"
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
            className="h-full bg-gradient-to-r from-[#B38F1E] via-[#E6D385] to-[#C5A028] transition-all duration-75 ease-linear rounded-full"
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
