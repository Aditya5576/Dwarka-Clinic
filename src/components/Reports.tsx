import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  IndianRupee, 
  Sun, 
  Moon
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

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4 space-y-3.5">
      
      {/* Header and Controls Card */}
      <div className="bg-[#171C21] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#C5A028]/15 rounded-lg text-[#C5A028] border border-[#8C701B]/40 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Financial Reports & Shift Tallies
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time daily collection breakdown (Cash vs UPI) and CSV export
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full sm:w-auto min-h-[42px] py-2 px-4 bg-[#C5A028] hover:bg-[#B38F1E] text-black font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#C5A028]/20 transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0 text-black" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-[#C5A028] shrink-0" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider shrink-0">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-[#1A2027] border border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-white outline-none focus:border-[#C5A028] min-h-[38px] cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-semibold text-[#E6D385] hover:underline self-start sm:self-auto py-1 cursor-pointer"
          >
            Reset to Today
          </button>
        </div>
      </div>

      {/* Financial Overview Cards - Tight 2x2 on Mobile, 4 Cols on Desktop */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm">
          Loading report data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            
            {/* Tile 1: Total Revenue */}
            <div className="bg-gradient-to-tr from-[#8C701B] via-[#C5A028] to-[#B38F1E] p-3 sm:p-3.5 rounded-xl border border-[#E6D385]/60 shadow-md min-w-0 flex flex-col justify-between">
              <span className="text-[10px] font-black text-black/80 uppercase tracking-wider block truncate">
                Total Revenue
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg sm:text-2xl font-black text-black truncate">
                  ₹{grandTotal}
                </span>
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" />
              </div>
              <span className="text-[10px] font-semibold text-black/75 mt-1 block truncate">
                {totalVisitsCount} Patients
              </span>
            </div>

            {/* Tile 2: Total Cash vs UPI */}
            <div className="bg-[#171C21] p-3 sm:p-3.5 rounded-xl border border-slate-800 shadow-sm min-w-0 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                Cash vs UPI
              </span>
              <div className="mt-1 space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Cash:</span>
                  <span className="font-bold text-emerald-400">₹{grandCash}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">UPI:</span>
                  <span className="font-bold text-[#E6D385]">₹{grandUPI}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block truncate">
                Modes Tally
              </span>
            </div>

            {/* Tile 3: Morning Shift */}
            <div className="bg-[#171C21] p-3 sm:p-3.5 rounded-xl border border-slate-800 shadow-sm min-w-0 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Morning Shift
                </span>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <div className="mt-1">
                <span className="text-base sm:text-xl font-black text-white truncate block">
                  ₹{morningTotal}
                </span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  💵 ₹{morningCash} • 📱 ₹{morningUPI}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block truncate">
                {morningVisits.length} Patients (11-2 PM)
              </span>
            </div>

            {/* Tile 4: Evening Shift */}
            <div className="bg-[#171C21] p-3 sm:p-3.5 rounded-xl border border-slate-800 shadow-sm min-w-0 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Evening Shift
                </span>
                <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </div>
              <div className="mt-1">
                <span className="text-base sm:text-xl font-black text-white truncate block">
                  ₹{eveningTotal}
                </span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  💵 ₹{eveningCash} • 📱 ₹{eveningUPI}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block truncate">
                {eveningVisits.length} Patients (5-8:30 PM)
              </span>
            </div>

          </div>

          {/* Detailed Shift Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
            
            {/* Morning Shift Card */}
            <div className="bg-[#171C21] rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-950/60 text-amber-400 rounded-lg border border-amber-800/60">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm">Morning Shift</h3>
                    <p className="text-[10px] text-slate-400">11:00 AM – 2:00 PM</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#E6D385] bg-[#C5A028]/15 px-2.5 py-0.5 rounded-full border border-[#8C701B]/40">
                  {morningVisits.length} Patients
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Cash Received:</span>
                  <span className="font-bold text-emerald-400">₹{morningCash}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">UPI Received:</span>
                  <span className="font-bold text-[#E6D385]">₹{morningUPI}</span>
                </div>
                <div className="flex justify-between py-2 bg-[#1A2027] px-3 rounded-xl border border-slate-700/80 font-bold">
                  <span className="text-slate-200">Morning Shift Total:</span>
                  <span className="text-sm font-black text-[#E6D385]">₹{morningTotal}</span>
                </div>
              </div>
            </div>

            {/* Evening Shift Card */}
            <div className="bg-[#171C21] rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-950/60 text-indigo-400 rounded-lg border border-indigo-800/60">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm">Evening Shift</h3>
                    <p className="text-[10px] text-slate-400">5:00 PM – 8:30 PM</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#E6D385] bg-[#C5A028]/15 px-2.5 py-0.5 rounded-full border border-[#8C701B]/40">
                  {eveningVisits.length} Patients
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Cash Received:</span>
                  <span className="font-bold text-emerald-400">₹{eveningCash}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">UPI Received:</span>
                  <span className="font-bold text-[#E6D385]">₹{eveningUPI}</span>
                </div>
                <div className="flex justify-between py-2 bg-[#1A2027] px-3 rounded-xl border border-slate-700/80 font-bold">
                  <span className="text-slate-200">Evening Shift Total:</span>
                  <span className="text-sm font-black text-[#E6D385]">₹{eveningTotal}</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
