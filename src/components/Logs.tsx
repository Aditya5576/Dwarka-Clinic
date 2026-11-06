import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Download,
  Phone,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { type Visit, type Patient, type ShiftType, type PaymentMode } from '../types';
import { db, getLocalDateKey } from '../services/db';
import { exportVisitsToCSV } from '../utils/csvExport';
import { formatIndianDisplayDate } from '../utils/clinicalUtils';
import { ReceiptModal } from './ReceiptModal';

export const Logs: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState<ShiftType | 'All'>('All');
  const [selectedMode, setSelectedMode] = useState<PaymentMode | 'All'>('All');
  const [loading, setLoading] = useState(true);

  // Selected receipt modal state for viewing/reprinting from logs
  const [receiptModalItem, setReceiptModalItem] = useState<{ visit: Visit; patient: Patient } | null>(null);

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

  // Fast patient lookup map
  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach(p => map.set(p.id, p));
    return map;
  }, [patients]);

  // Chronological token number calculator per day
  const tokenMap = useMemo(() => {
    const map = new Map<string, number>();
    const byDate = new Map<string, Visit[]>();

    visits.forEach(v => {
      const d = getLocalDateKey(v.date);
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(v);
    });

    byDate.forEach((dayVisits) => {
      // Sort chronologically ascending
      const sorted = [...dayVisits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      sorted.forEach((v, idx) => {
        map.set(v.id, idx + 1);
      });
    });

    return map;
  }, [visits]);

  // Filter visits
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const patient = patientMap.get(v.patientId);
      const patientName = v.patientName || patient?.name || '';
      const city = patient?.city || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = 
        patientName.toLowerCase().includes(query) ||
        v.patientId.toLowerCase().includes(query) ||
        v.phone.includes(query) ||
        city.toLowerCase().includes(query);

      const matchesShift = selectedShift === 'All' || v.shift === selectedShift;
      const matchesMode = selectedMode === 'All' || v.mode === selectedMode;

      return matchesSearch && matchesShift && matchesMode;
    });
  }, [visits, patientMap, searchQuery, selectedShift, selectedMode]);

  return (
    <div data-testid="reception-logs-view" className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-5 space-y-4">
      
      {/* Top Banner: Obsidian-Gold Clinic Theme */}
      <div className="bg-[#161B21] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#C5A028]/15 rounded-xl text-[#C5A028] border border-[#8C701B]/40 shrink-0 shadow-inner">
                <ClipboardList className="w-5 h-5 text-[#C5A028]" />
              </div>
              <div className="min-w-0">
                <h2 data-testid="logs-header-title" className="text-base sm:text-lg font-bold text-white tracking-wide font-brand truncate">
                  Patient Intake &amp; Visit Logs
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Chronological records of patient intakes, fee receipts, shifts &amp; printouts
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-export-logs-csv"
            onClick={handleExportCSV}
            className="w-full sm:w-auto min-h-[44px] py-2 px-4 bg-[#C5A028] hover:bg-[#E6D385] text-black font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 shrink-0 text-black" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              data-testid="logs-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, city, or ID..."
              className="w-full pl-10 pr-3 py-2 bg-[#1A2027] border border-slate-700/80 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:border-[#C5A028] outline-none transition min-h-[44px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Shift:</span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#1A2027] border border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-white outline-none focus:border-[#C5A028] min-h-[44px] cursor-pointer"
            >
              <option value="All" className="bg-[#161B21]">All Shifts</option>
              <option value="Morning" className="bg-[#161B21]">Morning (11am - 2pm)</option>
              <option value="Evening" className="bg-[#161B21]">Evening (5pm - 8:30pm)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#1A2027] border border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-white outline-none focus:border-[#C5A028] min-h-[44px] cursor-pointer"
            >
              <option value="All" className="bg-[#161B21]">All Payment Modes</option>
              <option value="Cash" className="bg-[#161B21]">Cash Only</option>
              <option value="UPI" className="bg-[#161B21]">UPI Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Records Container */}
      <div className="bg-[#161B21] rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm">
            <div className="w-8 h-8 border-2 border-[#C5A028] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading patient logs...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div data-testid="empty-logs-notice" className="p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm space-y-1">
            <p className="text-white">No matching patient intake records found.</p>
            <p className="text-[11px] text-slate-500">Try adjusting your search query or shift/mode filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px): Structured Columns with overflow-x-auto */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#12161A] border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Time &amp; Shift</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Type &amp; Fees</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium text-slate-200">
                  {filteredVisits.map((v) => {
                    const patient = patientMap.get(v.patientId);
                    const patientName = v.patientName || patient?.name || 'Unknown Patient';
                    const city = patient?.city || 'Jaysingpur';
                    const tokenNumber = tokenMap.get(v.id) || 1;
                    const isFollowUp = v.amount === 100;

                    const dateObj = new Date(v.date);
                    const dateStr = formatIndianDisplayDate(v.date);
                    const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                    return (
                      <tr 
                        key={v.id} 
                        data-testid={`log-table-row-${v.id}`}
                        className="hover:bg-slate-800/40 transition"
                      >
                        {/* 1. Token & ID */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="w-8 h-8 rounded-xl bg-[#0F1316] border border-[#8C701B]/50 text-[#E6D385] text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-inner">
                              #{tokenNumber}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-bold block">
                              {v.patientId}
                            </span>
                          </div>
                        </td>

                        {/* 2. Time & Shift */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="text-white font-medium block">
                              {dateStr} <span className="text-[10px] text-slate-400 font-mono">({timeStr})</span>
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              v.shift === 'Morning' 
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/70'
                                : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/70'
                            }`}>
                              {v.shift} Shift
                            </span>
                          </div>
                        </td>

                        {/* 3. Patient Details */}
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="min-w-0">
                            <span className="font-bold text-white text-sm block truncate">
                              {patientName}
                            </span>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 truncate">
                              <a href={`tel:${v.phone}`} className="hover:text-[#E6D385] flex items-center space-x-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>{v.phone}</span>
                              </a>
                              <span>•</span>
                              <span className="truncate">{city}</span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Type & Fees */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                isFollowUp
                                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/70'
                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                              }`}>
                                {isFollowUp ? 'Follow-up ₹100' : 'Regular ₹200'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                v.mode === 'Cash'
                                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                                  : 'bg-[#C5A028]/15 text-[#E6D385] border-[#8C701B]/50'
                              }`}>
                                {v.mode}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-300 block">
                              Amount: <strong className="text-white">₹{v.amount}</strong>
                            </span>
                          </div>
                        </td>

                        {/* 5. Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/70">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Checked In</span>
                          </span>
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            data-testid={`btn-view-receipt-${v.id}`}
                            onClick={() => {
                              const p = patientMap.get(v.patientId) || {
                                id: v.patientId,
                                name: patientName,
                                phone: v.phone,
                                city,
                                createdAt: v.date,
                                lastVisitDate: v.date
                              };
                              setReceiptModalItem({ visit: v, patient: p });
                            }}
                            className="min-h-[36px] px-3 py-1.5 bg-[#1A2027] hover:bg-[#232B35] text-[#E6D385] border border-[#8C701B]/40 hover:border-[#C5A028] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                            title="View / Reprint Registration Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#C5A028]" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View (< 768px): Responsive Stacked Touch Cards */}
            <div className="md:hidden p-3 space-y-3">
              {filteredVisits.map((v) => {
                const patient = patientMap.get(v.patientId);
                const patientName = v.patientName || patient?.name || 'Unknown Patient';
                const city = patient?.city || 'Jaysingpur';
                const tokenNumber = tokenMap.get(v.id) || 1;
                const isFollowUp = v.amount === 100;

                const dateObj = new Date(v.date);
                const dateStr = formatIndianDisplayDate(v.date);
                const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                return (
                  <div
                    key={v.id}
                    data-testid={`mobile-log-card-${v.id}`}
                    className="p-3.5 rounded-2xl bg-[#1A2027] border border-slate-800 space-y-2.5 shadow-md"
                  >
                    {/* Top Row: Token ID + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-[#0F1316] border border-[#8C701B]/50 text-[#E6D385] text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-inner">
                          #{tokenNumber}
                        </span>
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-[#E6D385]">
                            {v.patientId}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {city}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/70 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Checked In</span>
                      </span>
                    </div>

                    {/* Patient Name & Contact */}
                    <div className="min-w-0 pt-1 border-t border-slate-800/80">
                      <h4 className="font-bold text-white text-sm truncate">
                        {patientName}
                      </h4>
                      <a href={`tel:${v.phone}`} className="text-xs font-mono text-slate-400 hover:text-[#E6D385] flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{v.phone}</span>
                      </a>
                    </div>

                    {/* Shift & Fee Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-[#161B21] border border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 font-bold block">Visit Timing</span>
                        <span className="text-white font-medium block truncate">
                          {dateStr}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {timeStr} • {v.shift}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 font-bold block">Intake Fee</span>
                        <span className="text-white font-bold font-mono block">
                          ₹{v.amount} ({v.mode})
                        </span>
                        <span className="text-[10px] text-blue-300">
                          {isFollowUp ? 'Follow-up' : 'Regular'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Action Button (Touch Target >= 44px) */}
                    <button
                      type="button"
                      data-testid={`btn-mobile-view-receipt-${v.id}`}
                      onClick={() => {
                        const p = patientMap.get(v.patientId) || {
                          id: v.patientId,
                          name: patientName,
                          phone: v.phone,
                          city,
                          createdAt: v.date,
                          lastVisitDate: v.date
                        };
                        setReceiptModalItem({ visit: v, patient: p });
                      }}
                      className="min-h-[44px] w-full py-2.5 px-4 bg-[#C5A028] hover:bg-[#E6D385] text-black rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-md active:scale-98"
                    >
                      <Printer className="w-4 h-4 text-black" />
                      <span>View &amp; Print Receipt</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Reprint Receipt Modal when triggered from logs */}
      {receiptModalItem && (
        <ReceiptModal
          visit={receiptModalItem.visit}
          patient={receiptModalItem.patient}
          onClose={() => setReceiptModalItem(null)}
        />
      )}

    </div>
  );
};
