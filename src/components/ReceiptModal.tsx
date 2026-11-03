import React from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Share2, 
  ArrowRight, 
  Calendar, 
  CreditCard, 
  Clock,
  User,
  ShieldCheck,
  X
} from 'lucide-react';
import { type Patient, type Visit } from '../types';

interface ReceiptModalProps {
  visit: Visit;
  patient: Patient;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visit,
  patient,
  onClose
}) => {
  const visitDate = new Date(visit.date);
  const formattedDate = visitDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = visitDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Calculate 30-day valid follow-up date
  const validUntilDate = new Date(visitDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const formattedValidUntil = validUntilDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // WhatsApp Message Composer
  const handleSendWhatsApp = () => {
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const message = `*Dr. Baldawa's Dwarka Clinic — Jaysingpur*
Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi, Jaysingpur

*PATIENT VISIT RECEIPT*
--------------------------------
*Patient ID:* ${patient.id}
*Name:* ${patient.name}
*Date:* ${formattedDate} (${formattedTime})
*Shift:* ${visit.shift}
*Amount Paid:* ₹${visit.amount} (${visit.mode})
--------------------------------
*Next Follow-Up Rate (₹100) Valid Until:*
*${formattedValidUntil}* (Next 30 Days)
(Visits after ${formattedValidUntil} will be renewed at ₹200)

_Thank you for visiting Dr. Baldawa's Dwarka Clinic. Take care!_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#171C21] w-[94vw] max-w-md max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="bg-[#12161A] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-slate-200">Check-In Completed</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-4 sm:p-6 bg-white overflow-y-auto flex-1 break-words">
          <div className="text-center pb-3 sm:pb-4 border-b border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#B38F1E] via-[#E6D385] to-[#C5A028] mx-auto mb-2 shadow-sm flex items-center justify-center">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#12161A] flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Dwarka Clinic Emblem"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Dr. Baldawa's Dwarka Clinic
            </h2>
            <p className="text-[11px] font-bold text-[#C5A028] tracking-widest uppercase mt-0.5">
              Skin & Hair Care • Jaysingpur
            </p>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi
            </p>
            <p className="text-[11px] text-slate-500">Phone: 9822012345 / 9421198765</p>
          </div>

          {/* Details Table */}
          <div className="py-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" /> Patient ID
              </span>
              <span className="font-mono font-bold text-clinic-800 bg-clinic-50 px-2 py-0.5 rounded border border-clinic-200">
                {patient.id}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Patient Name</span>
              <span className="font-bold text-slate-900 text-right">{patient.name}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Phone Number</span>
              <span className="font-semibold text-slate-800">{patient.phone}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">City / Region</span>
              <span className="font-semibold text-slate-800">{patient.city}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Visit Date
              </span>
              <span className="font-semibold text-slate-800">{formattedDate} ({formattedTime})</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Shift
              </span>
              <span className="font-semibold text-slate-800">{visit.shift} Shift</span>
            </div>

            <div className="flex justify-between items-center py-1.5 bg-slate-50 px-2.5 rounded-lg border border-slate-200 mt-2">
              <span className="text-slate-700 font-bold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-clinic-600" /> Amount Paid ({visit.mode})
              </span>
              <span className="text-base font-black text-slate-900">
                ₹{visit.amount}
              </span>
            </div>
          </div>

          {/* 30-Day Follow-Up Guarantee Box */}
          <div className="mt-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Follow-Up Rate (₹100) Valid Until:
                </p>
                <p className="text-sm font-black text-emerald-700 mt-0.5">
                  {formattedValidUntil}
                </p>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Visits within 30 days are ₹100. Subsequent visits renew at ₹200.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-[#12161A] p-3 sm:p-4 border-t border-slate-800 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="min-h-[44px] py-2.5 px-3 bg-[#1A2027] hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#C5A028] shrink-0" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="min-h-[44px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-1.5 shadow-sm shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 bg-gradient-to-r from-[#8C701B] via-[#C5A028] to-[#B38F1E] hover:from-[#C5A028] hover:to-[#E6D385] text-black font-black text-sm rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-[#C5A028]/20 transition active:scale-95 cursor-pointer"
          >
            <span>Next Check-In</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>

      </div>
    </div>
  );
};

