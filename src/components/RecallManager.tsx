import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Search,
  Phone,
  RefreshCw,
  Clock,
  Activity,
  Check,
  X
} from 'lucide-react';
import { type FollowUpDefaulter } from '../types';
import { getFollowUpDefaulters, getTodayIST, seedSampleRecallPatients } from '../services/db';
import { sendSilentWhatsAppMessage, buildFollowUpRecallWhatsAppText } from '../services/whatsappService';
import { formatIndianDisplayDate } from '../utils/clinicalUtils';

type FilterType = 'ALL' | 'WEEK' | 'OVERDUE' | 'PROCEDURES';

export const RecallManager: React.FC = () => {
  const [defaulters, setDefaulters] = useState<FollowUpDefaulter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [sendingMap, setSendingMap] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const todayIST = useMemo(() => getTodayIST(), []);

  const loadDefaulters = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getFollowUpDefaulters(todayIST, 30);
      setDefaulters(list);
    } catch (err) {
      console.error('Failed to load follow-up defaulters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [todayIST]);

  useEffect(() => {
    loadDefaulters();
  }, [loadDefaulters]);

  const handleSeedTestRecalls = async () => {
    setIsLoading(true);
    try {
      await seedSampleRecallPatients();
      await loadDefaulters();
      setToastMessage('Seeded test recall patients (8208064879 & 7019905146) successfully!');
    } catch (err) {
      console.error('Failed to seed test recall patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Derived Metrics
  const totalDefaulters = defaulters.length;
  const dueThisWeek = useMemo(() => defaulters.filter(d => d.overdueDays >= 1 && d.overdueDays <= 7).length, [defaulters]);
  const procedureRecalls = useMemo(() => defaulters.filter(d => d.hasProcedures).length, [defaulters]);
  const criticalOverdue = useMemo(() => defaulters.filter(d => d.overdueDays > 7).length, [defaulters]);

  // Filtered List
  const filteredList = useMemo(() => {
    return defaulters.filter(item => {
      // Search matching
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        item.patientName.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.patientId.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        (item.doctorNotes && item.doctorNotes.toLowerCase().includes(q)) ||
        (item.procedureNames && item.procedureNames.some(p => p.toLowerCase().includes(q)))
      );

      if (!matchesSearch) return false;

      // Category tab filter
      if (activeFilter === 'WEEK') return item.overdueDays >= 1 && item.overdueDays <= 7;
      if (activeFilter === 'OVERDUE') return item.overdueDays > 7;
      if (activeFilter === 'PROCEDURES') return !!item.hasProcedures;
      return true;
    });
  }, [defaulters, searchQuery, activeFilter]);

  // Send WhatsApp Action
  const handleSendReminder = async (item: FollowUpDefaulter) => {
    setSendingMap(prev => ({ ...prev, [item.patientId]: 'sending' }));

    const message = buildFollowUpRecallWhatsAppText({
      patientName: item.patientName,
      patientId: item.patientId,
      expectedFollowUpDate: item.expectedFollowUpDate,
      overdueDays: item.overdueDays,
      doctorNotes: item.doctorNotes,
      hasProcedures: item.hasProcedures
    });

    try {
      const result = await sendSilentWhatsAppMessage({
        phone: item.phone,
        message
      });

      setSendingMap(prev => ({ ...prev, [item.patientId]: 'sent' }));
      setToastMessage(
        result.channel === 'daemon'
          ? `Recall notice sent silently to ${item.patientName} via WhatsApp daemon!`
          : `Opened WhatsApp Web recall chat for ${item.patientName}.`
      );

      // Auto clear toast after 4s
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to dispatch recall WhatsApp:', err);
      setSendingMap(prev => ({ ...prev, [item.patientId]: 'error' }));
      setToastMessage(`Error sending WhatsApp reminder to ${item.patientName}.`);
    }
  };

  return (
    <div data-testid="recall-manager-view" className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          data-testid="recall-toast"
          className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 shadow-xl flex items-center justify-between text-emerald-200 text-xs sm:text-sm font-semibold animate-in slide-in-from-top-2"
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-emerald-300 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner: Obsidian & Gold Branding */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#12161A] border border-[#8C701B]/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A028]/15 border border-[#C5A028]/50 flex items-center justify-center text-[#E6D385] shadow-md shrink-0">
            <CalendarClock className="w-6 h-6 text-[#C5A028]" />
          </div>
          <div>
            <h2 data-testid="recall-header-title" className="text-base sm:text-lg font-black tracking-tight text-white font-brand">
              Patient Recall &amp; Defaulter Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track patients overdue for clinical follow-up • Dispatch polite WhatsApp recovery reminders
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 self-start sm:self-auto flex-wrap gap-y-2">
          <span className="text-[11px] font-mono text-[#E6D385] bg-[#1A2027] border border-[#8C701B]/30 px-3 py-1.5 rounded-xl">
            Today: {formatIndianDisplayDate(todayIST)}
          </span>
          <button
            type="button"
            data-testid="btn-seed-test-recalls"
            onClick={handleSeedTestRecalls}
            disabled={isLoading}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#C5A028]/15 hover:bg-[#C5A028]/25 text-[#E6D385] text-xs font-semibold border border-[#8C701B]/40 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            title="Seed Test Recall Patients (8208064879 & 7019905146)"
          >
            <span>+ Seed Test Recalls</span>
          </button>
          <button
            type="button"
            data-testid="btn-refresh-recalls"
            onClick={loadDefaulters}
            disabled={isLoading}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Defaulters List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Executive Metric Cards Ribbon */}
      <div data-testid="recall-metrics-ribbon" className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Metric 1: Total Defaulters */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#171C21] border border-slate-800/90 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Defaulters
            </span>
            <span className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-900/40">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span data-testid="metric-total-defaulters" className="text-2xl sm:text-3xl font-black text-white font-mono">
              {totalDefaulters}
            </span>
            <span className="text-xs text-slate-400 font-medium">Overdue 1–30 Days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Patients who missed scheduled clinical return dates
          </p>
        </div>

        {/* Metric 2: Due This Week */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#171C21] border border-slate-800/90 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Due This Week
            </span>
            <span className="p-1.5 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-900/40">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span data-testid="metric-due-this-week" className="text-2xl sm:text-3xl font-black text-[#E6D385] font-mono">
              {dueThisWeek}
            </span>
            <span className="text-xs text-amber-300 font-medium">1–7 Days Overdue</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Prime recall window with highest follow-up conversion
          </p>
        </div>

        {/* Metric 3: Peel & Procedure Follow-ups */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#171C21] border border-slate-800/90 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Peel / Procedure Recalls
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span data-testid="metric-procedure-recalls" className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {procedureRecalls}
            </span>
            <span className="text-xs text-emerald-300 font-medium">Clinical Priority</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Chemical peels, comedone extraction, or post-procedure checks
          </p>
        </div>

      </div>

      {/* Search & Filter Controls */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161B21] border border-slate-800/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            data-testid="recall-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search defaulter by Name, Phone, Patient ID (DC-...), or Diagnosis..."
            className="w-full bg-[#1A2027] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="filter-tab-all"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-[#C5A028] text-black shadow-md'
                : 'bg-[#1A2027] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({totalDefaulters})
          </button>

          <button
            type="button"
            data-testid="filter-tab-week"
            onClick={() => setActiveFilter('WEEK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
              activeFilter === 'WEEK'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-[#1A2027] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Due This Week ({dueThisWeek})
          </button>

          <button
            type="button"
            data-testid="filter-tab-overdue"
            onClick={() => setActiveFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
              activeFilter === 'OVERDUE'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-[#1A2027] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Overdue &gt; 7d ({criticalOverdue})
          </button>

          <button
            type="button"
            data-testid="filter-tab-procedures"
            onClick={() => setActiveFilter('PROCEDURES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
              activeFilter === 'PROCEDURES'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'bg-[#1A2027] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Procedures ({procedureRecalls})
          </button>
        </div>

      </div>

      {/* Defaulter Table & Card List */}
      <div data-testid="defaulter-list-container" className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#161B21] rounded-2xl border border-slate-800">
            <div className="w-8 h-8 border-2 border-[#C5A028] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Analyzing patient visit records &amp; follow-up calendar...
          </div>
        ) : filteredList.length === 0 ? (
          <div data-testid="empty-defaulters-notice" className="p-12 text-center bg-[#161B21] rounded-2xl border border-dashed border-slate-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Follow-Up Defaulters Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery
                ? `No defaulters match "${searchQuery}". Try clearing search filter.`
                : 'All clinic patients are within their scheduled follow-up periods. Zero defaulters in current filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block bg-[#161B21] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#12161A] text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Patient Token / ID</th>
                    <th className="py-3 px-4">Patient Name &amp; Place</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Last Visit</th>
                    <th className="py-3 px-4">Expected Follow-Up</th>
                    <th className="py-3 px-4">Status / Overdue</th>
                    <th className="py-3 px-4">Diagnosis / Procedure</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredList.map((item) => {
                    const sendState = sendingMap[item.patientId] || 'idle';
                    const isDueThisWeek = item.overdueDays <= 7;

                    return (
                      <tr
                        key={item.patientId}
                        data-testid={`defaulter-row-${item.patientId}`}
                        className="hover:bg-[#1A2027]/60 transition-colors"
                      >
                        {/* Token / ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[#E6D385]">
                          <span className="px-2 py-1 rounded bg-[#C5A028]/15 border border-[#8C701B]/40">
                            {item.patientId}
                          </span>
                        </td>

                        {/* Name & City */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block text-sm">
                            {item.patientName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.city}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4">
                          <a
                            href={`tel:${item.phone}`}
                            className="font-mono text-slate-300 hover:text-[#E6D385] flex items-center space-x-1"
                          >
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{item.phone}</span>
                          </a>
                        </td>

                        {/* Last Visit */}
                        <td className="py-3.5 px-4 text-slate-300">
                          {formatIndianDisplayDate(item.lastVisitDate)}
                        </td>

                        {/* Expected Follow-up */}
                        <td className="py-3.5 px-4 font-mono text-slate-200">
                          {formatIndianDisplayDate(item.expectedFollowUpDate)}
                        </td>

                        {/* Days Overdue Pill */}
                        <td className="py-3.5 px-4">
                          <span
                            data-testid={`overdue-pill-${item.patientId}`}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 border ${
                              isDueThisWeek
                                ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                                : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                            }`}
                          >
                            <span>⚠️ {item.overdueDays} day{item.overdueDays > 1 ? 's' : ''} overdue</span>
                          </span>
                        </td>

                        {/* Diagnosis / Procedure */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className="text-slate-300 text-[11px] block truncate" title={item.doctorNotes || 'NA'}>
                            {item.doctorNotes || 'Routine consultation'}
                          </span>
                          {item.hasProcedures && item.procedureNames && item.procedureNames.length > 0 && (
                            <span className="inline-block mt-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded truncate max-w-full">
                              ⚡ {item.procedureNames[0]}
                            </span>
                          )}
                        </td>

                        {/* Action: Send WhatsApp Reminder */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            data-testid="btn-send-recall-whatsapp"
                            onClick={() => handleSendReminder(item)}
                            disabled={sendState === 'sending'}
                            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1.5 shadow-md cursor-pointer ${
                              sendState === 'sent'
                                ? 'bg-emerald-600 text-white'
                                : sendState === 'sending'
                                ? 'bg-slate-700 text-slate-300 opacity-60'
                                : 'bg-[#25D366] hover:bg-[#20bd5a] text-white'
                            }`}
                          >
                            {sendState === 'sent' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Sent ✓</span>
                              </>
                            ) : sendState === 'sending' ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WhatsApp Reminder</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 768px) */}
            <div className="md:hidden space-y-3">
              {filteredList.map((item) => {
                const sendState = sendingMap[item.patientId] || 'idle';
                const isDueThisWeek = item.overdueDays <= 7;

                return (
                  <div
                    key={item.patientId}
                    data-testid={`mobile-defaulter-card-${item.patientId}`}
                    className="p-4 rounded-2xl bg-[#161B21] border border-slate-800/90 shadow-md space-y-3"
                  >
                    {/* Top Row: Token ID + Overdue Pill */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#E6D385] bg-[#C5A028]/15 border border-[#8C701B]/40 px-2 py-0.5 rounded">
                          {item.patientId}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.city}
                        </span>
                      </div>
                      <span
                        data-testid={`mobile-overdue-pill-${item.patientId}`}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDueThisWeek
                            ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                            : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                        }`}
                      >
                        ⚠️ {item.overdueDays}d overdue
                      </span>
                    </div>

                    {/* Patient Name & Phone Link */}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {item.patientName}
                      </h4>
                      <a
                        href={`tel:${item.phone}`}
                        className="text-xs font-mono text-[#E6D385] hover:underline flex items-center space-x-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{item.phone}</span>
                      </a>
                    </div>

                    {/* Timeline Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-[#1A2027] border border-slate-800">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Last Visit</span>
                        <span className="text-slate-300 font-medium">
                          {formatIndianDisplayDate(item.lastVisitDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Expected Return</span>
                        <span className="text-slate-200 font-bold font-mono">
                          {formatIndianDisplayDate(item.expectedFollowUpDate)}
                        </span>
                      </div>
                    </div>

                    {/* Diagnosis / Notes if present */}
                    {item.doctorNotes && (
                      <p className="text-[11px] text-slate-300">
                        <strong className="text-slate-500">Advice:</strong> {item.doctorNotes}
                      </p>
                    )}

                    {/* Procedure badge if present */}
                    {item.hasProcedures && item.procedureNames && item.procedureNames.length > 0 && (
                      <div className="pt-0.5">
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded inline-block">
                          ⚡ Procedure: {item.procedureNames.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Mobile Action Button (Touch Target >= 44px) */}
                    <button
                      type="button"
                      data-testid="btn-send-recall-whatsapp"
                      onClick={() => handleSendReminder(item)}
                      disabled={sendState === 'sending'}
                      className={`min-h-[44px] w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                        sendState === 'sent'
                          ? 'bg-emerald-600 text-white'
                          : sendState === 'sending'
                          ? 'bg-slate-700 text-slate-300 opacity-60'
                          : 'bg-[#25D366] hover:bg-[#20bd5a] text-white'
                      }`}
                    >
                      {sendState === 'sent' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Recall Reminder Sent ✓</span>
                        </>
                      ) : sendState === 'sending' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending WhatsApp...</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>Send WhatsApp Reminder</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
};
