import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('reception@dwarkaclinic.com');
  const [password, setPassword] = useState('reception123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (email === 'reception@dwarkaclinic.com' && password === 'reception123') {
      onLoginSuccess(email);
    } else {
      setError('Invalid receptionist credentials. Please check your email and password.');
    }
  };

  const handleQuickFill = () => {
    setEmail('reception@dwarkaclinic.com');
    setPassword('reception123');
    setError(null);
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden flex items-center justify-center p-3 sm:p-4 bg-[#0F1316] select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(197, 160, 40, 0.12) 0%, rgba(15, 19, 22, 0.98) 60%, #0F1316 100%)'
      }}
    >
      <div className="w-full max-w-md bg-[#171C21] rounded-2xl shadow-2xl border border-slate-800/90 p-5 sm:p-7">
        
        <div className="text-center mb-5">
          <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#8C701B] via-[#E6D385] to-[#C5A028] mx-auto mb-3 shadow-lg shadow-[#C5A028]/20 flex items-center justify-center">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0F1316] flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Dr. Baldawa's Dwarka Clinic"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Dr. Baldawa's Dwarka Clinic
          </h2>
          <p className="text-[11px] text-[#C5A028] font-bold tracking-widest uppercase mt-0.5">
            Skin & Hair Care • Jaysingpur
          </p>
          <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 bg-[#C5A028]/15 text-[#E6D385] text-xs font-semibold rounded-full border border-[#8C701B]/40">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
            <span>Receptionist Management Portal</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-start space-x-2 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Reception Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#1A2027] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] outline-none transition font-medium min-h-[44px]"
                placeholder="reception@dwarkaclinic.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#1A2027] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] outline-none transition font-medium min-h-[44px]"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3 bg-gradient-to-r from-[#8C701B] via-[#C5A028] to-[#B38F1E] hover:from-[#C5A028] hover:to-[#E6D385] text-black font-black text-sm sm:text-base rounded-xl shadow-lg shadow-[#C5A028]/20 flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
          >
            <span>Open Reception Desk</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 mb-1.5">
            Default credentials: <code className="text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded">reception123</code>
          </p>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-xs font-semibold text-[#E6D385] hover:text-[#C5A028] hover:underline cursor-pointer"
          >
            Auto-fill Reception Credentials
          </button>
        </div>
      </div>
    </div>
  );
};
