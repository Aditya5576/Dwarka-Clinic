import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (role: 'reception' | 'doctor', email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [roleMode, setRoleMode] = useState<'reception' | 'doctor'>('reception');

  // Receptionist state
  const [email, setEmail] = useState('reception@dwarkaclinic.com');
  const [password, setPassword] = useState('reception123');
  const [receptionError, setReceptionError] = useState<string | null>(null);

  // Doctor state
  const [doctorEmail, setDoctorEmail] = useState('drbaldawa@dwarkaclinic.com');
  const [doctorPassword, setDoctorPassword] = useState('doctor2009');
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  const handleReceptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReceptionError(null);

    if (email === 'reception@dwarkaclinic.com' && password === 'reception123') {
      onLoginSuccess('reception', email);
    } else {
      setReceptionError('Invalid receptionist credentials. Default password is reception123.');
    }
  };

  const handleQuickFillReception = () => {
    setEmail('reception@dwarkaclinic.com');
    setPassword('reception123');
    setReceptionError(null);
  };

  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorError(null);
    const cleanPassword = doctorPassword.trim();
    if (cleanPassword === 'doctor2009' || cleanPassword === 'doc2009' || cleanPassword === '2009') {
      onLoginSuccess('doctor', doctorEmail.trim() || 'drbaldawa@dwarkaclinic.com');
    } else {
      setDoctorError('Incorrect Doctor Consultation Password. (Default: doctor2009)');
    }
  };

  const handleQuickFillDoctor = () => {
    setDoctorEmail('drbaldawa@dwarkaclinic.com');
    setDoctorPassword('doctor2009');
    setDoctorError(null);
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden flex items-center justify-center p-3 sm:p-4 bg-[#0F1316] select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(197, 160, 40, 0.12) 0%, rgba(15, 19, 22, 0.98) 60%, #0F1316 100%)'
      }}
    >
      <div className="w-full max-w-md bg-[#171C21] rounded-2xl shadow-2xl border border-slate-800/90 p-5 sm:p-7 space-y-5">
        
        {/* Clinic Header Branding */}
        <div className="text-center">
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
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight font-brand">
            Dr. Baldawa's Dwarka Clinic
          </h2>
          <p className="text-[11px] text-[#C5A028] font-bold tracking-widest uppercase mt-0.5">
            Skin & Hair Care • Jaysingpur
          </p>
        </div>

        {/* Dedicated Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#12161A] rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            data-testid="tab-reception-login"
            onClick={() => {
              setRoleMode('reception');
              setReceptionError(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              roleMode === 'reception'
                ? 'bg-[#2A343D] text-white shadow-md ring-1 ring-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Reception Desk</span>
          </button>

          <button
            type="button"
            data-testid="tab-doctor-login"
            onClick={() => {
              setRoleMode('doctor');
              setDoctorError(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              roleMode === 'doctor'
                ? 'bg-[#C5A028] text-black shadow-md ring-1 ring-[#E6D385]'
                : 'text-slate-400 hover:text-[#E6D385]'
            }`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span className="truncate">Doctor Consultation</span>
          </button>
        </div>

        {/* Tab 1: Receptionist Access Form */}
        {roleMode === 'reception' && (
          <form onSubmit={handleReceptionSubmit} className="space-y-4 animate-fade-in">
            <div className="text-center pb-1">
              <span className="text-xs text-slate-300 font-semibold flex items-center justify-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A028]" />
                <span>Patient Intake & Billing Portal</span>
              </span>
            </div>

            {receptionError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{receptionError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
              <span>Login to Reception Desk</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickFillReception}
                className="text-xs font-semibold text-[#E6D385] hover:text-[#C5A028] hover:underline cursor-pointer"
              >
                Auto-fill Reception Credentials
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Doctor Consultation Access Form */}
        {roleMode === 'doctor' && (
          <form onSubmit={handleDoctorSubmit} className="space-y-4 animate-fade-in">
            <div className="text-center pb-1">
              <span className="text-xs text-[#E6D385] font-semibold flex items-center justify-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C5A028]" />
                <span>Dr. Sandeep Baldawa Clinical Desk</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your doctor credentials to unlock clinical EMR mode.
              </p>
            </div>

            {doctorError && (
              <div className="p-3 bg-amber-950/60 border border-[#C5A028]/60 rounded-xl flex items-start space-x-2 text-[#E6D385] text-xs shadow-md">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#C5A028]" />
                <span>{doctorError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Doctor Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  data-testid="doctor-email-input"
                  required
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1A2027] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] outline-none transition font-medium min-h-[44px]"
                  placeholder="drbaldawa@dwarkaclinic.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showDoctorPassword ? 'text' : 'password'}
                  data-testid="doctor-password-input"
                  required
                  value={doctorPassword}
                  onChange={(e) => setDoctorPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#1A2027] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] outline-none transition font-medium min-h-[44px]"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showDoctorPassword ? 'Hide password' : 'Show password'}
                >
                  {showDoctorPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              data-testid="btn-unlock-doctor-desk"
              className="w-full min-h-[48px] py-3 bg-[#C5A028] hover:bg-[#E6D385] text-black font-black text-sm sm:text-base rounded-xl shadow-lg shadow-[#C5A028]/20 flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
            >
              <span>Enter Doctor Consultation Desk</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickFillDoctor}
                className="text-xs font-semibold text-[#E6D385] hover:text-[#C5A028] hover:underline cursor-pointer"
              >
                Auto-fill Doctor Credentials (doctor2009)
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
