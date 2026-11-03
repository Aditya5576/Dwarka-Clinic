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
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-4 sm:mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-clinic-50 rounded-xl text-clinic-600 border border-clinic-200 shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                Patient Intake & Visit Logs
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Complete historical record of patient intakes, fee receipts & shifts
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 bg-clinic-600 hover:bg-clinic-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-clinic-600/20 transition active:scale-95"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download CSV Log</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone or ID..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-clinic-500 outline-none transition min-h-[44px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Shift:</span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-clinic-500 min-h-[44px]"
            >
              <option value="All">All Shifts</option>
              <option value="Morning">Morning (11am - 2pm)</option>
              <option value="Evening">Evening (5pm - 8:30pm)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-clinic-500 min-h-[44px]"
            >
              <option value="All">All Payment Modes</option>
              <option value="Cash">Cash Only</option>
              <option value="UPI">UPI Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-sm">
            Loading patient logs...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-sm">
            No matching patient intake records found.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-0.5">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 sm:px-4">Patient ID</th>
                  <th className="py-3 px-3 sm:px-4">Patient Name</th>
                  <th className="py-3 px-3 sm:px-4">Mobile</th>
                  <th className="py-3 px-3 sm:px-4">Visit Date & Time</th>
                  <th className="py-3 px-3 sm:px-4">Shift</th>
                  <th className="py-3 px-3 sm:px-4">Fee Paid</th>
                  <th className="py-3 px-3 sm:px-4">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800 whitespace-nowrap">
                {filteredVisits.map((v) => {
                  const dateObj = new Date(v.date);
                  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 sm:px-4 font-mono font-bold text-clinic-700">
                        {v.patientId}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-bold text-slate-900">
                        {v.patientName}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-600 font-mono">
                        {v.phone}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-600">
                        {dateStr} <span className="text-[11px] text-slate-400">({timeStr})</span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          v.shift === 'Morning' 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}>
                          {v.shift}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-black text-slate-900">
                        ₹{v.amount}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          v.mode === 'Cash'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-clinic-50 text-clinic-800 border border-clinic-200'
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
