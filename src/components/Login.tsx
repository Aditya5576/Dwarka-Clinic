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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-b from-slate-100 to-clinic-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-8">
        <div className="text-center mb-5 sm:mb-6">
          <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#B38F1E] via-[#E6D385] to-[#C5A028] mx-auto mb-3 shadow-lg shadow-[#C5A028]/25 flex items-center justify-center">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#12161A] flex items-center justify-center">
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
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Dr. Baldawa's Dwarka Clinic
          </h2>
          <p className="text-[11px] sm:text-xs text-[#C5A028] font-bold tracking-widest uppercase mt-0.5">
            Skin & Hair Care • Jaysingpur
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
            Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi
          </p>
          <div className="mt-2.5 sm:mt-3 inline-flex items-center space-x-1.5 px-3 py-1 bg-[#FBF7EE] text-[#B38F1E] text-[11px] sm:text-xs font-semibold rounded-full border border-[#E6D385]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
            <span>Receptionist Management Portal</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-clinic-500 focus:border-clinic-500 outline-none transition font-medium min-h-[44px]"
                placeholder="reception@dwarkaclinic.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-clinic-500 focus:border-clinic-500 outline-none transition font-medium min-h-[44px]"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3 bg-gradient-to-r from-clinic-600 to-clinic-700 hover:from-clinic-700 hover:to-clinic-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-clinic-600/25 flex items-center justify-center space-x-2 transition active:scale-[0.98]"
          >
            <span>Open Reception Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 mb-2">Default credentials: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">reception123</code></p>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-xs font-semibold text-clinic-600 hover:text-clinic-800 hover:underline"
          >
            Auto-fill Reception Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

