import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Check,
  Users,
  Clock,
  MapPin,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Phone,
  Sparkles,
  Printer,
  History,
  IndianRupee,
  FileText,
  X,
  CheckCircle2
} from 'lucide-react';
import {
  type Patient,
  type Visit,
  type PaymentMode,
  type ClinicalPrescription,
  REGIONS_LIST
} from '../types';
import {
  db,
  calculateVisitFee,
  getAutomaticShiftInfo,
  type ShiftInfo,
  processCheckInTransaction,
  getLocalDateKey,
  getPrescriptionByVisitId
} from '../services/db';
import { broadcastNewPatientCheckIn } from '../services/notificationService';
import { formatIndianDisplayDate } from '../utils/clinicalUtils';
import { lockBodyScroll } from '../utils/scrollLock';
import { ReceiptModal } from './ReceiptModal';

const TOP_HUBS = ['Jaysingpur', 'Purtiwadi', 'Shirol', 'Sangli', 'Miraj', 'Ichalkaranji'] as const;

interface RecentCheckInItem {
  visit: Visit;
  patient: Patient;
}

interface CheckInProps {
  onCheckInSuccess?: () => void;
}

export const CheckIn: React.FC<CheckInProps> = ({ onCheckInSuccess }) => {
  // Phone search state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [matchingPatients, setMatchingPatients] = useState<Patient[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected or new patient state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);

  // Form fields for registration / confirmation
  const [patientName, setPatientName] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('Jaysingpur');
  const [customCity, setCustomCity] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo>(getAutomaticShiftInfo());

  // Dashboard Context Counters & Recents
  const [todayVisitsCount, setTodayVisitsCount] = useState<number>(0);
  const [shiftRevenue, setShiftRevenue] = useState<number>(0);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckInItem[]>([]);

  // Modal and submission state
  const [completedVisit, setCompletedVisit] = useState<Visit | null>(null);
  const [completedPatient, setCompletedPatient] = useState<Patient | null>(null);
  const [reviewModalItem, setReviewModalItem] = useState<{ visit: Visit; patient: Patient; rx: ClinicalPrescription | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Universal scroll locking for reception review modal
  useEffect(() => {
    if (reviewModalItem) {
      const unlock = lockBodyScroll();
      return () => unlock();
    }
  }, [reviewModalItem]);

  // Periodically re-sync shift based on wall clock
  useEffect(() => {
    const updateShift = () => setShiftInfo(getAutomaticShiftInfo());
    updateShift();
    const interval = setInterval(updateShift, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayStats = useCallback(async () => {
    try {
      const todayKey = getLocalDateKey();
      const allVisits = await db.visits.toArray();
      const todayVisits = allVisits.filter(v => getLocalDateKey(v.date) === todayKey);

      setTodayVisitsCount(todayVisits.length);

      // Current shift revenue
      const currentShiftVisits = todayVisits.filter(v => v.shift === shiftInfo.shift);
      const currentShiftRev = currentShiftVisits.reduce((acc, v) => acc + v.amount, 0);
      setShiftRevenue(currentShiftRev);

      // Last 3 checked in patients today (newest first)
      const sorted = [...todayVisits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const top3 = sorted.slice(0, 3);

      const items: RecentCheckInItem[] = [];
      for (const v of top3) {
        const p = await db.patients.get(v.patientId);
        if (p) {
          items.push({ visit: v, patient: p });
        }
      }
      setRecentCheckIns(items);
    } catch (err) {
      console.error('Error loading today stats:', err);
    }
  }, [shiftInfo.shift]);

  useEffect(() => {
    loadTodayStats();
  }, [loadTodayStats]);

  // Search when phone number reaches 10 digits
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const val = rawVal.slice(0, 10);
    setPhoneNumber(val);
    setFormError(null);

    if (val.length === 10) {
      await searchPatientsByPhone(val);
    } else {
      setMatchingPatients([]);
      setHasSearched(false);
      setSelectedPatient(null);
      setIsRegisteringNew(false);
    }
  };

  const searchPatientsByPhone = async (phone: string) => {
    const results = await db.patients.where('phone').equals(phone).toArray();
    setMatchingPatients(results);
    setHasSearched(true);

    if (results.length === 1) {
      selectPatient(results[0]);
    } else if (results.length > 1) {
      setSelectedPatient(null);
      setIsRegisteringNew(false);
    } else {
      startNewPatientIntake();
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsRegisteringNew(false);
    setPatientName(patient.name);
    if (REGIONS_LIST.includes(patient.city as any)) {
      setSelectedCity(patient.city);
      setCustomCity('');
    } else {
      setSelectedCity('Other');
      setCustomCity(patient.city);
    }
  };

  const startNewPatientIntake = () => {
    setSelectedPatient(null);
    setIsRegisteringNew(true);
    setPatientName('');
    setSelectedCity('Jaysingpur');
    setCustomCity('');
  };

  // Compute Fee
  const feeInfo = calculateVisitFee(selectedPatient);

  // Submission Handler
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Immediate synchronous guard to prevent duplicate submission
    setFormError(null);

    if (phoneNumber.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!patientName.trim()) {
      setFormError('Please enter the patient full name.');
      return;
    }

    const finalCity = selectedCity === 'Other' ? (customCity.trim() || 'Other') : selectedCity;

    try {
      setIsSubmitting(true);
      const { patient: patientRecord, visit: newVisit } = await processCheckInTransaction({
        selectedPatient,
        patientName,
        phoneNumber,
        city: finalCity,
        amount: feeInfo.amount,
        paymentMode,
        shift: shiftInfo.shift
      });

      setCompletedPatient(patientRecord);
      setCompletedVisit(newVisit);

      // Real-time broadcast to Doctor Desk & external tabs
      broadcastNewPatientCheckIn({
        type: 'NEW_PATIENT',
        patientName: patientRecord.name,
        patientId: patientRecord.id,
        tokenNumber: todayVisitsCount + 1,
        shift: newVisit.shift
      });

      await loadTodayStats();
      onCheckInSuccess?.();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to complete check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setPhoneNumber('');
    setMatchingPatients([]);
    setHasSearched(false);
    setSelectedPatient(null);
    setIsRegisteringNew(false);
    setPatientName('');
    setSelectedCity('Jaysingpur');
    setCustomCity('');
    setPaymentMode('Cash');
    setCompletedVisit(null);
    setCompletedPatient(null);
    setFormError(null);
    setShiftInfo(getAutomaticShiftInfo());
    loadTodayStats();
  };

  const handleReprintSlip = (item: RecentCheckInItem) => {
    setCompletedPatient(item.patient);
    setCompletedVisit(item.visit);
  };

  const handleReviewConsultation = async (item: RecentCheckInItem) => {
    try {
      const rx = await getPrescriptionByVisitId(item.visit.id);
      setReviewModalItem({
        visit: item.visit,
        patient: item.patient,
        rx: rx || null
      });
    } catch (e) {
      console.error('Error fetching consultation summary for reception desk:', e);
      setReviewModalItem({
        visit: item.visit,
        patient: item.patient,
        rx: null
      });
    }
  };

  const remainingRegions = REGIONS_LIST.filter(r => !(TOP_HUBS as readonly string[]).includes(r));

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 sm:py-4 space-y-4">

      {/* 1. Live Shift & Registration Banner (Automatic Clock Detection) */}
      <div className="bg-[#171C21] p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          {/* Shift Details (Read-only Automatic Window Indicator) */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#C5A028]/15 rounded-md text-[#C5A028] border border-[#8C701B]/40">
                <Clock className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-white font-brand tracking-wide">
                {shiftInfo.isActive ? `${shiftInfo.label} Operations` : shiftInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                shiftInfo.isActive
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${shiftInfo.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{shiftInfo.isActive ? 'Active Window' : 'Off-Hours'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hours: {shiftInfo.hoursText}
            </p>
          </div>

          {/* Shift Live Metrics */}
          <div className="flex items-center gap-4 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Today's Intakes
              </span>
              <span className="text-base sm:text-lg font-black text-white flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-400 inline" />
                {todayVisitsCount}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Shift Tally
              </span>
              <span className="text-base sm:text-lg font-black text-[#E6D385] flex items-center gap-0.5 justify-end">
                <IndianRupee className="w-3.5 h-3.5 text-[#C5A028]" />
                {shiftRevenue}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Patient Intake Card */}
      <div className="bg-[#171C21] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl">

        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-800/80">
          <div className="p-1.5 bg-[#C5A028]/10 text-[#C5A028] rounded-lg border border-[#8C701B]/30">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide font-brand">
              Patient Check-In & Fee Engine
            </h2>
            <p className="text-[11px] text-slate-400">
              Fast intake, automated 30-day fee qualification & digital slip
            </p>
          </div>
        </div>

        {/* Step 1: 10-Digit Phone Lookup */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            1. Enter 10-Digit Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4 text-[#C5A028]" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoFocus
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="e.g. 9822012345"
              className="w-full pl-10 pr-24 py-3 bg-[#1A2027] border border-slate-700/80 rounded-xl text-base sm:text-lg font-bold text-white placeholder-slate-500 focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] outline-none transition min-h-[48px]"
            />
            {phoneNumber.length === 10 && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-800/80 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Valid</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Multiple Family Member Selection */}
        {hasSearched && matchingPatients.length > 1 && !selectedPatient && !isRegisteringNew && (
          <div className="mt-4 p-3.5 bg-[#1F262D] border border-slate-700/80 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#C5A028] shrink-0" />
                Found {matchingPatients.length} Patients for this Mobile:
              </span>
              <button
                type="button"
                onClick={startNewPatientIntake}
                className="text-xs font-bold text-[#E6D385] hover:underline self-start sm:self-auto cursor-pointer"
              >
                + Add New Family Member
              </button>
            </div>
            <div className="space-y-2">
              {matchingPatients.map((p) => {
                const fee = calculateVisitFee(p);
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-[#171C21] border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-[#8C701B] transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E6D385] bg-[#C5A028]/15 px-1.5 py-0.5 rounded border border-[#8C701B]/40 shrink-0 whitespace-nowrap">
                          {p.id}
                        </span>
                        <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {p.city} • Last Visit: {new Date(p.lastVisitDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border whitespace-nowrap ${
                        fee.amount === 100
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : 'bg-[#C5A028]/15 text-[#E6D385] border-[#8C701B]/50'
                      }`}>
                        ₹{fee.amount}
                      </span>
                      <button
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="px-3.5 py-1.5 bg-[#C5A028] hover:bg-[#B38F1E] text-black text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Patient Registration & Fee Confirmation Form */}
      {(selectedPatient || isRegisteringNew) && (
        <form onSubmit={handleSubmitCheckIn} className="bg-[#171C21] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap truncate ${
                selectedPatient
                  ? 'bg-[#C5A028]/15 text-[#E6D385] border-[#8C701B]/50'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              }`}>
                {selectedPatient ? `Existing Patient (${selectedPatient.id})` : 'New Patient Registration'}
              </span>
            </div>
            {selectedPatient && matchingPatients.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-slate-400 hover:text-white underline shrink-0 cursor-pointer"
              >
                Change Member
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-start gap-2 text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Patient Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Ramesh Balasaheb Patil"
              className="w-full px-3.5 py-2.5 bg-[#1A2027] border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] outline-none transition"
            />
          </div>

          {/* City / Region Selection with Quick-Select Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C5A028]" /> Region / City
            </label>

            {/* Quick Hub Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TOP_HUBS.map((hub) => {
                const isSelected = selectedCity === hub;
                return (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => {
                      setSelectedCity(hub);
                      setCustomCity('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#C5A028] text-black font-bold shadow-sm'
                        : 'bg-[#1A2027] text-slate-300 border border-slate-700/80 hover:border-slate-500'
                    }`}
                  >
                    {hub}
                  </button>
                );
              })}
            </div>

            {/* Extended Region Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <select
                value={(TOP_HUBS as readonly string[]).includes(selectedCity) ? '' : selectedCity}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedCity(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-[#1A2027] border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-white focus:border-[#C5A028] outline-none transition cursor-pointer"
              >
                <option value="" disabled>Other Taluka / Nearby Towns...</option>
                {remainingRegions.map((reg) => (
                  <option key={reg} value={reg} className="bg-[#171C21] text-white">
                    {reg}
                  </option>
                ))}
              </select>

              {selectedCity === 'Other' && (
                <input
                  type="text"
                  required
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Specify village or town name"
                  className="w-full px-3 py-2 bg-[#1A2027] border border-[#8C701B] rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:border-[#C5A028] outline-none transition"
                />
              )}
            </div>
          </div>

          {/* Automated Clinical Fee Engine (SYSTEM ENFORCED) */}
          <div className="p-3.5 sm:p-4 bg-[#1F262D] rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C5A028] shrink-0" />
                <span>Automated Consultation Fee</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400">System Enforced</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-1">
                {/* Clean Clinical Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                  feeInfo.amount === 100
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80'
                    : selectedPatient
                      ? 'bg-[#C5A028]/15 text-[#E6D385] border-[#8C701B]'
                      : 'bg-sky-950/70 text-sky-300 border-sky-800'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{feeInfo.reason}</span>
                </div>
                {selectedPatient && (
                  <p className="text-[11px] text-slate-400">
                    Previous visit: {new Date(selectedPatient.lastVisitDate).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ₹{feeInfo.amount}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-[#C5A028]" /> Select Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMode('Cash')}
                className={`min-h-[48px] py-2.5 px-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
                  paymentMode === 'Cash'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                    : 'bg-[#1A2027] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span>💵 Cash</span>
                {paymentMode === 'Cash' && <Check className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`min-h-[48px] py-2.5 px-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
                  paymentMode === 'UPI'
                    ? 'bg-[#C5A028] text-black border-[#E6D385] shadow-md shadow-[#C5A028]/20'
                    : 'bg-[#1A2027] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span>📱 UPI</span>
                {paymentMode === 'UPI' && <Check className="w-4 h-4 text-black" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[50px] py-3 px-4 bg-gradient-to-r from-[#8C701B] via-[#C5A028] to-[#B38F1E] hover:from-[#C5A028] hover:to-[#E6D385] disabled:opacity-50 text-black font-black text-sm sm:text-base rounded-xl shadow-lg shadow-[#C5A028]/20 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <span>{isSubmitting ? 'Recording Visit...' : `Confirm Intake & Collect ₹${feeInfo.amount}`}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </button>
          </div>

        </form>
      )}

      {/* 3. Recent Check-Ins Today List (Last 3 Patients) */}
      <div className="bg-[#171C21] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#C5A028]" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-brand tracking-wide">
              Recent Check-Ins Today
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            Last 3 Patients
          </span>
        </div>

        {recentCheckIns.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs font-medium">
            No patient check-ins recorded yet today.
          </div>
        ) : (
          <div className="space-y-2">
            {recentCheckIns.map(({ visit, patient }) => {
              const visitTime = new Date(visit.date).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });

              return (
                <div
                  key={visit.id}
                  className="bg-[#1A2027]/70 p-3 rounded-xl border border-slate-800 hover:border-[#8C701B]/50 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#E6D385] bg-[#C5A028]/15 px-1.5 py-0.5 rounded border border-[#8C701B]/40 shrink-0 whitespace-nowrap">
                        {patient.id}
                      </span>
                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                        {patient.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {visitTime} • {visit.shift} Shift • ₹{visit.amount} ({visit.mode})
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-testid={`btn-review-visit-${visit.id}`}
                      onClick={() => handleReviewConsultation({ visit, patient })}
                      className="px-2.5 py-1.5 bg-[#171C21] hover:bg-[#1E252E] text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Review Consultation & Registration Details"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#C5A028]" />
                      <span className="hidden sm:inline">Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReprintSlip({ visit, patient })}
                      className="px-2.5 py-1.5 bg-[#1F262D] hover:bg-[#2A343D] text-[#E6D385] border border-[#8C701B]/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
                      title="Reprint or Share Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#C5A028]" />
                      <span className="hidden sm:inline">Reprint Slip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reception Read-Only Consultation Review Modal (Task 3 & 5) */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overscroll-contain overflow-hidden">
          <div className="bg-[#12161A] w-[95vw] max-w-lg max-h-[88vh] flex flex-col rounded-2xl shadow-2xl border border-[#8C701B]/40 text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#161B21] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-[#8C701B]/30 shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#C5A028]" />
                <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-slate-200 font-brand">
                  Patient Intake &amp; Consultation Summary
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Patient Identity Strip */}
              <div className="p-3.5 rounded-xl bg-[#1A2027] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{reviewModalItem.patient.name}</span>
                    <span className="font-mono text-[10px] text-[#E6D385] bg-[#C5A028]/15 border border-[#8C701B]/40 px-1.5 py-0.5 rounded font-bold">
                      {reviewModalItem.patient.id}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {reviewModalItem.patient.phone} • {reviewModalItem.patient.city}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Shift</span>
                  <span className="text-xs font-bold text-white font-brand">{reviewModalItem.visit.shift}</span>
                </div>
              </div>

              {/* Role-Based Segregation: Reception Intake Fee */}
              <div className="p-3.5 rounded-xl bg-[#161B21] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Reception Intake Registration Fee
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    Desk Collection
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">
                    ₹{reviewModalItem.visit.amount}
                  </span>
                  <span className="text-xs text-[#E6D385] font-semibold">
                    Payment Mode: {reviewModalItem.visit.mode}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Follow-up fee rate (₹100) valid for 30 days from check-in date.
                </p>
              </div>

              {/* Clinical Consultation Status & Summary */}
              <div className="p-3.5 rounded-xl bg-[#161B21] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Doctor Consultation Status
                  </span>
                  {reviewModalItem.rx ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed by Dr. Baldawa</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
                      ⏳ Pending Consultation (In Queue)
                    </span>
                  )}
                </div>

                {reviewModalItem.rx ? (
                  <div className="space-y-2.5 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Doctor Fee:</span>
                      <span className="font-mono font-bold text-white">₹{reviewModalItem.rx.doctorFee}</span>
                    </div>

                    {reviewModalItem.rx.procedureFeeTotal ? (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">In-Clinic Procedures Total:</span>
                        <span className="font-mono font-bold text-emerald-400">₹{reviewModalItem.rx.procedureFeeTotal}</span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Next Follow-Up:</span>
                      <span className="font-semibold text-white">
                        {formatIndianDisplayDate(reviewModalItem.rx.nextFollowUpDate)} ({reviewModalItem.rx.followUpDays} Days)
                      </span>
                    </div>

                    {reviewModalItem.rx.diagnosisNotes && (
                      <div className="text-[11px] bg-[#1A2027] p-2.5 rounded-lg border border-slate-800">
                        <strong className="text-slate-400 block mb-0.5">Doctor Notes / Diagnosis:</strong>
                        <span className="text-slate-200">{reviewModalItem.rx.diagnosisNotes}</span>
                      </div>
                    )}

                    {reviewModalItem.rx.medications && reviewModalItem.rx.medications.length > 0 && (
                      <div>
                        <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Prescribed Medications ({reviewModalItem.rx.medications.length}) [Read-Only]
                        </strong>
                        <div className="space-y-1">
                          {reviewModalItem.rx.medications.map((m, idx) => (
                            <div key={idx} className="p-2 rounded bg-[#1A2027] border border-slate-800/80 text-[11px] flex items-center justify-between">
                              <span className="text-white font-medium">{idx + 1}. {m.name}</span>
                              <span className="text-slate-400">{m.dosage} • {m.timing}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {reviewModalItem.rx.paperRxPhoto && (
                      <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                        ✓ Handwritten paper Rx photo snapshot on file.
                      </div>
                    )}

                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 italic">
                      ℹ Clinical prescriptions are strictly read-only for reception staff and cannot be modified at this desk.
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Patient has checked in and is awaiting consultation with Dr. Baldawa. Prescriptions will appear here once finalized.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 sm:p-4 bg-[#161B21] border-t border-[#8C701B]/30 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setCompletedPatient(reviewModalItem.patient);
                  setCompletedVisit(reviewModalItem.visit);
                  setReviewModalItem(null);
                }}
                className="px-4 py-2 bg-[#C5A028] hover:bg-[#E6D385] text-black rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reprint Registration Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {completedVisit && completedPatient && (
        <ReceiptModal
          visit={completedVisit}
          patient={completedPatient}
          onClose={handleResetForm}
        />
      )}

    </div>
  );
};

