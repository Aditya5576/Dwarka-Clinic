import React from 'react';
import { 
  UserCheck, 
  BarChart3, 
  ClipboardList, 
  Bell, 
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
  // Ordered: Check-In -> Reports -> Logs -> Reminders
  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'checkin', label: 'Check-In', icon: UserCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: ClipboardList },
    { id: 'reminders', label: 'Reminders', icon: Bell, badge: pendingRemindersCount },
  ];

  return (
    <>
      {/* Elevated Top Header */}
      <header className="sticky top-0 z-40 h-16 sm:h-18 px-3 sm:px-6 backdrop-blur-md bg-[#0F1316]/95 border-b border-[#8C701B]/30 shadow-lg flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          
          {/* Logo & Brand Typography */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden ring-1 ring-[#C5A028] shadow-md shrink-0 bg-[#0F1316] flex items-center justify-center p-0.5">
              <img
                src="/logo.png"
                alt="Dwarka Clinic Logo"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-brand font-bold tracking-wide text-sm sm:text-lg text-white truncate leading-tight">
                Dr. Baldawa's Dwarka Clinic
              </h1>
              <span className="text-[9px] sm:text-[10px] text-[#E6D385]/80 tracking-widest uppercase font-semibold block truncate">
                SKIN & HAIR CARE • JAYSINGPUR
              </span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5 sm:space-x-4 shrink-0">
            
            {/* Receptionist Indicator Pill */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1A2027] border border-slate-700/80 text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden xs:inline">Reception Desk</span>
              <span className="xs:hidden">Reception</span>
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
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
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
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-transparent hover:border-rose-900/40 cursor-pointer"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Reordered: Check-In -> Reports -> Logs -> Reminders) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#12161A]/95 backdrop-blur border-t border-slate-800 px-1 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-4 gap-0.5 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-0.5 min-w-0 rounded-xl transition-colors relative cursor-pointer ${
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
                <span className="text-[10px] mt-0.5 tracking-tight truncate w-full text-center block font-medium">
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
