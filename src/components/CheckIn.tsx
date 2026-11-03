import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Phone
} from 'lucide-react';
import { 
  type Patient, 
  type Visit, 
  type PaymentMode, 
  type ShiftType, 
  REGIONS_LIST 
} from '../types';
import { 
  db, 
  calculateVisitFee, 
  detectCurrentShift, 
  getNextPatientId 
} from '../services/db';
import { ReceiptModal } from './ReceiptModal';

export const CheckIn: React.FC = () => {
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
  const [shift, setShift] = useState<ShiftType>(detectCurrentShift());

  // Modal and submission state
  const [completedVisit, setCompletedVisit] = useState<Visit | null>(null);
  const [completedPatient, setCompletedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update shift automatically periodically
  useEffect(() => {
    setShift(detectCurrentShift());
  }, []);

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
      // Auto-select if only one member
      selectPatient(results[0]);
    } else if (results.length > 1) {
      // Multiple family members: wait for receptionist choice
      setSelectedPatient(null);
      setIsRegisteringNew(false);
    } else {
      // No match: open new patient intake
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
      const now = new Date().toISOString();
      let patientRecord: Patient;

      if (selectedPatient) {
        // Existing Patient: update lastVisitDate
        patientRecord = {
          ...selectedPatient,
          name: patientName.trim(),
          city: finalCity,
          lastVisitDate: now
        };
        await db.patients.put(patientRecord);
      } else {
        // New Patient: assign new sequential ID
        const newId = await getNextPatientId();
        patientRecord = {
          id: newId,
          name: patientName.trim(),
          phone: phoneNumber,
          city: finalCity,
          createdAt: now,
          lastVisitDate: now
        };
        await db.patients.add(patientRecord);
      }

      // Record Visit
      const newVisit: Visit = {
        id: `visit-${Date.now()}`,
        patientId: patientRecord.id,
        patientName: patientRecord.name,
        phone: patientRecord.phone,
        date: now,
        amount: feeInfo.amount,
        mode: paymentMode,
        shift: shift
      };

      await db.visits.add(newVisit);

      // Trigger digital receipt
      setCompletedPatient(patientRecord);
      setCompletedVisit(newVisit);
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
    setShift(detectCurrentShift());
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-4 sm:mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-clinic-600 shrink-0" />
              <span>Patient Check-In & Fee Collection</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Rapid intake, 30-day automated fee calculation & WhatsApp slip
            </p>
          </div>

          {/* Current Shift Indicator */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-clinic-50 border border-clinic-200 px-3 py-1.5 rounded-xl text-xs font-bold text-clinic-800">
            <Clock className="w-4 h-4 text-clinic-600 shrink-0" />
            <span>Shift: {shift}</span>
            <button
              type="button"
              onClick={() => setShift(s => s === 'Morning' ? 'Evening' : 'Morning')}
              className="ml-1 text-[11px] text-clinic-600 underline font-semibold hover:text-clinic-900 p-0.5"
            >
              Toggle
            </button>
          </div>
        </div>

        {/* Step 1: 10-Digit Phone Lookup */}
        <div className="mt-4 sm:mt-5">
          <label className="block text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
            1. Enter 10-Digit Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4 text-clinic-600" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoFocus
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="e.g. 9822012345"
              className="w-full pl-10 pr-12 sm:pr-24 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base sm:text-lg font-bold text-slate-900 focus:bg-white focus:border-clinic-500 focus:ring-4 focus:ring-clinic-500/10 outline-none transition placeholder:text-slate-400 placeholder:font-normal min-h-[48px]"
            />
            {phoneNumber.length === 10 && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">10 Digits</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Family Member Cards If Multiple Matches */}
        {hasSearched && matchingPatients.length > 1 && !selectedPatient && !isRegisteringNew && (
          <div className="mt-4 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-clinic-600 shrink-0" />
                Found {matchingPatients.length} Patients for this Mobile:
              </span>
              <button
                type="button"
                onClick={startNewPatientIntake}
                className="text-xs font-bold text-clinic-600 hover:text-clinic-800 underline self-start sm:self-auto"
              >
                + Add New Family Member
              </button>
            </div>
            <div className="space-y-2.5">
              {matchingPatients.map((p) => {
                const fee = calculateVisitFee(p);
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-clinic-500 hover:shadow-sm transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-clinic-700 bg-clinic-50 px-1.5 py-0.5 rounded shrink-0">
                          {p.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm truncate">{p.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {p.city} • Last Visit: {new Date(p.lastVisitDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        fee.amount === 100 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        ₹{fee.amount}
                      </span>
                      <button
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 bg-clinic-600 hover:bg-clinic-700 text-white text-xs font-bold rounded-lg transition active:scale-95"
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
        <form onSubmit={handleSubmitCheckIn} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold truncate ${
                selectedPatient 
                  ? 'bg-clinic-50 text-clinic-700 border border-clinic-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {selectedPatient ? `Existing Patient (${selectedPatient.id})` : 'New Patient Intake'}
              </span>
            </div>
            {selectedPatient && matchingPatients.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0"
              >
                Change Member
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Ramesh Balasaheb Patil"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-clinic-500 focus:ring-2 focus:ring-clinic-500/20 outline-none transition"
            />
          </div>

          {/* City / Region Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> City / Region
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-clinic-500 outline-none transition"
              >
                {REGIONS_LIST.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            {selectedCity === 'Other' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specify Location
                </label>
                <input
                  type="text"
                  required
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Enter village / city name"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-clinic-500 outline-none transition"
                />
              </div>
            )}
          </div>

          {/* Fee Calculation Engine (SYSTEM-ENFORCED, READ-ONLY) */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-clinic-600 shrink-0" />
                <span>Automated Consultation Fee</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500 shrink-0">System Enforced</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
              <div className="space-y-1">
                <div className={`inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border ${
                  feeInfo.amount === 100
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{feeInfo.reason}</span>
                </div>
                {selectedPatient && (
                  <p className="text-[11px] text-slate-500">
                    Previous visit: {new Date(selectedPatient.lastVisitDate).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ₹{feeInfo.amount}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Select Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode('Cash')}
                className={`min-h-[48px] py-3 px-3 sm:px-4 rounded-xl border-2 font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition active:scale-95 ${
                  paymentMode === 'Cash'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>💵 Cash</span>
                {paymentMode === 'Cash' && <Check className="w-4 h-4 ml-0.5 sm:ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`min-h-[48px] py-3 px-3 sm:px-4 rounded-xl border-2 font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition active:scale-95 ${
                  paymentMode === 'UPI'
                    ? 'bg-clinic-600 border-clinic-600 text-white shadow-md shadow-clinic-600/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>📱 UPI</span>
                {paymentMode === 'UPI' && <Check className="w-4 h-4 ml-0.5 sm:ml-1" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[52px] py-3.5 px-4 bg-gradient-to-r from-clinic-600 to-clinic-700 hover:from-clinic-700 hover:to-clinic-800 disabled:opacity-50 text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-clinic-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span>{isSubmitting ? 'Recording Visit...' : `Confirm Intake & Collect ₹${feeInfo.amount}`}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </form>
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
