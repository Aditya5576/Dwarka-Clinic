import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Bell, 
  BarChart3, 
  ClipboardList, 
  Wifi, 
  WifiOff, 
  LogOut
} from 'lucide-react';
import { type ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  pendingRemindersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  pendingRemindersCount = 0
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'checkin', label: 'Check-In', icon: UserCheck },
    { id: 'reminders', label: 'Reminders', icon: Bell, badge: pendingRemindersCount },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: ClipboardList },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#12161A]/95 backdrop-blur border-b border-slate-800 px-3 py-2 sm:px-6 sm:py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo & Title (Address Removed) */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#8C701B] shadow-sm shrink-0 bg-[#0F1316] flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Dwarka Clinic Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
            <h1 className="font-semibold tracking-wide text-sm sm:text-base text-white truncate">
              Dr. Baldawa's Dwarka Clinic
            </h1>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {/* Receptionist Indicator Pill */}
            <div className="hidden xs:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1A2027] border border-slate-700/70 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">Reception Desk</span>
            </div>

            {/* Network Badge */}
            <div 
              className={`flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${
                isOnline 
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' 
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/80 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 bg-[#1A2027] p-1 rounded-lg border border-slate-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all relative ${
                      isActive
                        ? 'bg-[#C5A028]/20 text-[#E6D385] border border-[#8C701B]/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-[#C5A028] text-black text-[10px] rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Logout Receptionist"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#12161A]/95 backdrop-blur border-t border-slate-800 px-1 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-4 gap-0.5 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 min-w-0 rounded-xl transition-colors relative ${
                  isActive
                    ? 'text-[#E6D385] font-bold bg-[#C5A028]/15 border border-[#8C701B]/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2] text-[#C5A028]' : 'stroke-[1.8]'}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#C5A028] text-black text-[9px] flex items-center justify-center rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate w-full text-center block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
