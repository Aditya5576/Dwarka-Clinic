import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  IndianRupee, 
  Sun, 
  Moon,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { type Visit, type Patient } from '../types';
import { db } from '../services/db';
import { exportVisitsToCSV } from '../utils/csvExport';

export const Reports: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [visits, patients] = await Promise.all([
      db.visits.toArray(),
      db.patients.toArray()
    ]);
    setAllVisits(visits);
    setAllPatients(patients);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter visits by selected calendar date
  const filteredVisits = allVisits.filter(v => {
    const visitDate = new Date(v.date).toISOString().split('T')[0];
    return visitDate === selectedDate;
  });

  // Shift Calculations
  const morningVisits = filteredVisits.filter(v => v.shift === 'Morning');
  const morningCash = morningVisits.filter(v => v.mode === 'Cash').reduce((sum, v) => sum + v.amount, 0);
  const morningUPI = morningVisits.filter(v => v.mode === 'UPI').reduce((sum, v) => sum + v.amount, 0);
  const morningTotal = morningCash + morningUPI;

  const eveningVisits = filteredVisits.filter(v => v.shift === 'Evening');
  const eveningCash = eveningVisits.filter(v => v.mode === 'Cash').reduce((sum, v) => sum + v.amount, 0);
  const eveningUPI = eveningVisits.filter(v => v.mode === 'UPI').reduce((sum, v) => sum + v.amount, 0);
  const eveningTotal = eveningCash + eveningUPI;

  const grandCash = morningCash + eveningCash;
  const grandUPI = morningUPI + eveningUPI;
  const grandTotal = grandCash + grandUPI;
  const totalVisitsCount = filteredVisits.length;

  const handleExportCSV = () => {
    exportVisitsToCSV(allVisits, allPatients);
  };

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      
      {/* 1. TOP SECTION: Date Picker & Primary Summary Overview */}
      <div className="bg-[#171C21] rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#C5A028]/15 rounded-xl text-[#C5A028] border border-[#8C701B]/40 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-brand">
                Financial Reports & Shift Performance
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active tally for <span className="text-[#E6D385] font-semibold">{formattedSelectedDate}</span> • Real-time IndexedDB persistence
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full sm:w-auto h-11 px-5 bg-[#C5A028] hover:bg-[#B38F1E] text-black font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#C5A028]/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 shrink-0 text-black" />
            <span>Export CSV Report</span>
          </button>
        </div>

        {/* Date Filter Controls */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-[#C5A028] shrink-0" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none h-11 px-3.5 bg-[#1A2027] border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white outline-none focus:border-[#C5A028] cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-semibold text-[#E6D385] hover:underline self-start sm:self-auto py-1.5 cursor-pointer"
          >
            Reset to Today
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm">
          Loading report data...
        </div>
      ) : (
        <>
          {/* 2. MIDDLE SECTION: Granular Shift Breakdown Cards */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider font-brand px-1">
              Shift Breakdown & Operational Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Morning Shift Card */}
              <div className="bg-[#171C21] rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/60">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base font-brand">Morning Shift</h4>
                      <p className="text-[11px] text-slate-400">11:00 AM – 2:00 PM</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#E6D385] bg-[#C5A028]/15 px-3 py-1 rounded-full border border-[#8C701B]/40">
                    {morningVisits.length} Patients
                  </span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Cash Received:</span>
                    <span className="font-bold text-emerald-400">₹{morningCash}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">UPI Received:</span>
                    <span className="font-bold text-[#E6D385]">₹{morningUPI}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 bg-[#1A2027] px-3.5 rounded-xl border border-slate-700/80 font-bold">
                    <span className="text-slate-200">Morning Shift Total:</span>
                    <span className="text-base font-black text-[#E6D385]">₹{morningTotal}</span>
                  </div>
                </div>
              </div>

              {/* Evening Shift Card */}
              <div className="bg-[#171C21] rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-950/60 text-indigo-400 rounded-xl border border-indigo-800/60">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base font-brand">Evening Shift</h4>
                      <p className="text-[11px] text-slate-400">5:00 PM – 8:30 PM</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#E6D385] bg-[#C5A028]/15 px-3 py-1 rounded-full border border-[#8C701B]/40">
                    {eveningVisits.length} Patients
                  </span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Cash Received:</span>
                    <span className="font-bold text-emerald-400">₹{eveningCash}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">UPI Received:</span>
                    <span className="font-bold text-[#E6D385]">₹{eveningUPI}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 bg-[#1A2027] px-3.5 rounded-xl border border-slate-700/80 font-bold">
                    <span className="text-slate-200">Evening Shift Total:</span>
                    <span className="text-base font-black text-[#E6D385]">₹{eveningTotal}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. LOWER SECTION: Professionally Renamed Summary Stat Tiles */}
          <div className="mt-8 border-t border-[#8C701B]/20 pt-6 space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider font-brand px-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#C5A028]" />
              <span>Daily Financial Summary Overview</span>
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Tile 1: Net Daily Revenue */}
              <div className="bg-gradient-to-tr from-[#8C701B] via-[#C5A028] to-[#B38F1E] p-4 rounded-xl border border-[#E6D385]/60 shadow-lg min-w-0 flex flex-col justify-between">
                <span className="text-[10px] font-black text-black/80 uppercase tracking-wider block truncate">
                  Net Daily Revenue
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-lg sm:text-2xl font-black text-black truncate">
                    ₹{grandTotal}
                  </span>
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" />
                </div>
                <span className="text-[10px] font-semibold text-black/80 mt-1 block truncate">
                  {totalVisitsCount} Consultations
                </span>
              </div>

              {/* Tile 2: Payment Distribution */}
              <div className="bg-[#171C21] p-4 rounded-xl border border-slate-800 shadow-sm min-w-0 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    Payment Distribution
                  </span>
                  <CreditCard className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
                </div>
                <div className="mt-1.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cash:</span>
                    <span className="font-bold text-emerald-400">₹{grandCash}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">UPI:</span>
                    <span className="font-bold text-[#E6D385]">₹{grandUPI}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block truncate">
                  Cash vs UPI Breakdown
                </span>
              </div>

              {/* Tile 3: Morning Shift Collection */}
              <div className="bg-[#171C21] p-4 rounded-xl border border-slate-800 shadow-sm min-w-0 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    Morning Shift Collection
                  </span>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
                <div className="mt-1.5">
                  <span className="text-base sm:text-xl font-black text-white truncate block">
                    ₹{morningTotal}
                  </span>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    💵 ₹{morningCash} • 📱 ₹{morningUPI}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block truncate">
                  11:00 AM – 2:00 PM ({morningVisits.length} Patients)
                </span>
              </div>

              {/* Tile 4: Evening Shift Collection */}
              <div className="bg-[#171C21] p-4 rounded-xl border border-slate-800 shadow-sm min-w-0 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    Evening Shift Collection
                  </span>
                  <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </div>
                <div className="mt-1.5">
                  <span className="text-base sm:text-xl font-black text-white truncate block">
                    ₹{eveningTotal}
                  </span>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    💵 ₹{eveningCash} • 📱 ₹{eveningUPI}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block truncate">
                  5:00 PM – 8:30 PM ({eveningVisits.length} Patients)
                </span>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
};
