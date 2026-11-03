import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Download
} from 'lucide-react';
import { type Visit, type Patient, type ShiftType, type PaymentMode } from '../types';
import { db } from '../services/db';
import { exportVisitsToCSV } from '../utils/csvExport';

export const Logs: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState<ShiftType | 'All'>('All');
  const [selectedMode, setSelectedMode] = useState<PaymentMode | 'All'>('All');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [allVisits, allPatients] = await Promise.all([
      db.visits.reverse().toArray(),
      db.patients.toArray()
    ]);
    setVisits(allVisits);
    setPatients(allPatients);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    exportVisitsToCSV(visits, patients);
  };

  // Filter visits
  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      v.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery);

    const matchesShift = selectedShift === 'All' || v.shift === selectedShift;
    const matchesMode = selectedMode === 'All' || v.mode === selectedMode;

    return matchesSearch && matchesShift && matchesMode;
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      
      {/* Top Banner with Generous Breathing Room */}
      <div className="bg-[#171C21] rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#C5A028]/15 rounded-xl text-[#C5A028] border border-[#8C701B]/40 shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-brand">
                Patient Intake & Visit Logs
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Complete historical record of patient intakes, fee receipts & shifts
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full sm:w-auto h-11 px-5 bg-[#C5A028] hover:bg-[#B38F1E] text-black font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#C5A028]/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 shrink-0 text-black" />
            <span>Download CSV Log</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone or ID..."
              className="w-full h-11 pl-10 pr-3.5 bg-[#1A2027] border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:border-[#C5A028] outline-none transition"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0">Shift:</span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="w-full h-11 px-3.5 bg-[#1A2027] border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-white outline-none focus:border-[#C5A028] cursor-pointer"
            >
              <option value="All" className="bg-[#171C21]">All Shifts</option>
              <option value="Morning" className="bg-[#171C21]">Morning (11am - 2pm)</option>
              <option value="Evening" className="bg-[#171C21]">Evening (5pm - 8:30pm)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="w-full h-11 px-3.5 bg-[#1A2027] border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-white outline-none focus:border-[#C5A028] cursor-pointer"
            >
              <option value="All" className="bg-[#171C21]">All Payment Modes</option>
              <option value="Cash" className="bg-[#171C21]">Cash Only</option>
              <option value="UPI" className="bg-[#171C21]">UPI Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-[#171C21] rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm">
            Loading patient logs...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm">
            No matching patient intake records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#12161A] border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap">
                  <th className="py-3.5 px-4">Patient ID</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Visit Date & Time</th>
                  <th className="py-3.5 px-4">Shift</th>
                  <th className="py-3.5 px-4">Fee Paid</th>
                  <th className="py-3.5 px-4">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium text-slate-200 whitespace-nowrap">
                {filteredVisits.map((v) => {
                  const dateObj = new Date(v.date);
                  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E6D385]">
                        {v.patientId}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {v.patientName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {v.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {dateStr} <span className="text-[10px] text-slate-500">({timeStr})</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.shift === 'Morning' 
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/70'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/70'
                        }`}>
                          {v.shift}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-white">
                        ₹{v.amount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.mode === 'Cash'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                            : 'bg-[#C5A028]/15 text-[#E6D385] border-[#8C701B]/50'
                        }`}>
                          {v.mode}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
