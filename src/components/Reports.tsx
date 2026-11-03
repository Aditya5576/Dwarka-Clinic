import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  IndianRupee, 
  Sun, 
  Moon, 
  Users
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6">
      
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-4 sm:mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-clinic-50 rounded-xl text-clinic-600 border border-clinic-200 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                Financial Reports & Shift Tallies
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Real-time daily collection breakdown (Cash vs UPI) and CSV export
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 bg-clinic-600 hover:bg-clinic-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-clinic-600/20 transition active:scale-95"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Export All Records (CSV)</span>
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">Date Filter:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-clinic-500 min-h-[40px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-bold text-clinic-600 hover:underline self-start sm:self-auto py-1"
          >
            Reset to Today
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-sm">
          Loading report data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Patients</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{totalVisitsCount}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cash Collection</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">₹{grandCash}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">💵</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">UPI Collection</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-clinic-600">₹{grandUPI}</span>
            <span className="text-xs font-bold text-clinic-700 bg-clinic-50 px-1.5 py-0.5 rounded">📱</span>
          </div>
        </div>

        <div className="bg-gradient-to-tr from-clinic-700 to-clinic-600 text-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md shadow-clinic-600/20 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-clinic-100 uppercase tracking-wider block">Grand Total</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black">₹{grandTotal}</span>
            <IndianRupee className="w-5 h-5 text-clinic-200" />
          </div>
        </div>
      </div>

      {/* Shift Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Morning Shift Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Morning Shift</h3>
                <p className="text-[11px] text-slate-500">11:00 AM – 2:00 PM</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              {morningVisits.length} Patients
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Cash Received:</span>
              <span className="font-bold text-emerald-700">₹{morningCash}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">UPI Received:</span>
              <span className="font-bold text-clinic-700">₹{morningUPI}</span>
            </div>
            <div className="flex justify-between py-2 bg-amber-50/50 px-3 rounded-xl border border-amber-200/60 font-bold">
              <span className="text-amber-900">Morning Shift Total:</span>
              <span className="text-base font-black text-amber-900">₹{morningTotal}</span>
            </div>
          </div>
        </div>

        {/* Evening Shift Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Evening Shift</h3>
                <p className="text-[11px] text-slate-500">5:00 PM – 8:30 PM</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              {eveningVisits.length} Patients
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Cash Received:</span>
              <span className="font-bold text-emerald-700">₹{eveningCash}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">UPI Received:</span>
              <span className="font-bold text-clinic-700">₹{eveningUPI}</span>
            </div>
            <div className="flex justify-between py-2 bg-indigo-50/50 px-3 rounded-xl border border-indigo-200/60 font-bold">
              <span className="text-indigo-900">Evening Shift Total:</span>
              <span className="text-base font-black text-indigo-900">₹{eveningTotal}</span>
            </div>
          </div>
        </div>

      </div>
      </>
      )}

    </div>
  );
};
