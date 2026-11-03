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
  X,
  Phone,
  MapPin
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#12161A] w-[95vw] max-w-md max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border border-[#8C701B]/40 text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="bg-[#12161A] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-[#8C701B]/30 shrink-0">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-slate-200 font-brand">
              Check-In Completed
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body in Obsidian & Gold Theme */}
        <div id="printable-receipt" className="p-4 sm:p-5 bg-[#12161A] text-slate-100 overflow-y-auto flex-1 space-y-3.5 break-words">
          
          {/* Clinic Brand Header */}
          <div className="text-center p-3.5 bg-[#171C21] border border-[#8C701B]/30 rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#8C701B] via-[#E6D385] to-[#C5A028] mx-auto mb-2 shadow-sm flex items-center justify-center">
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
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-brand">
              Dr. Baldawa's Dwarka Clinic
            </h2>
            <p className="text-[10px] sm:text-xs font-bold text-[#C5A028] tracking-widest uppercase mt-0.5">
              Skin & Hair Care • Jaysingpur
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi
            </p>
            <p className="text-[10px] text-slate-500">Phone: 9822012345 / 9421198765</p>
          </div>

          {/* Details Table - Alternating Subtle Rows */}
          <div className="bg-[#1A2027]/50 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 text-xs sm:text-sm">
            
            <div className="flex justify-between items-center px-3 py-2 bg-[#171C21]/60">
              <span className="text-[#E6D385] flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-[#C5A028]" /> Patient ID
              </span>
              <span className="font-mono font-bold text-[#E6D385] bg-[#C5A028]/15 px-2 py-0.5 rounded border border-[#8C701B]/50">
                {patient.id}
              </span>
            </div>

            <div className="flex justify-between items-center px-3 py-2">
              <span className="text-[#E6D385] font-medium">Patient Name</span>
              <span className="font-semibold text-white text-right">{patient.name}</span>
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-[#171C21]/60">
              <span className="text-[#E6D385] flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
              </span>
              <span className="font-mono font-semibold text-white">{patient.phone}</span>
            </div>

            <div className="flex justify-between items-center px-3 py-2">
              <span className="text-[#E6D385] flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> City / Region
              </span>
              <span className="font-semibold text-white">{patient.city}</span>
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-[#171C21]/60">
              <span className="text-[#E6D385] flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Visit Date
              </span>
              <span className="font-semibold text-white">{formattedDate} ({formattedTime})</span>
            </div>

            <div className="flex justify-between items-center px-3 py-2">
              <span className="text-[#E6D385] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Shift
              </span>
              <span className="font-semibold text-white">{visit.shift} Shift</span>
            </div>

          </div>

          {/* Amount Paid Box in Luxury Gold-Bordered Container */}
          <div className="p-3 bg-[#1F262D] rounded-xl border border-[#C5A028] shadow-sm flex justify-between items-center">
            <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#C5A028]" /> Amount Paid ({visit.mode})
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#C5A028] tracking-tight">
              ₹{visit.amount}
            </span>
          </div>

          {/* Follow-Up Validity Box (Dark Emerald Tinted) */}
          <div className="p-3 bg-[#064E3B]/20 border border-[#059669]/50 rounded-xl text-emerald-200">
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-300">
                  Follow-Up Rate (₹100) Valid Until:
                </p>
                <p className="text-sm font-black text-emerald-200 mt-0.5 tracking-wide">
                  {formattedValidUntil}
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Visits within 30 days are ₹100. Subsequent visits renew at ₹200.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="bg-[#12161A] p-3 sm:p-4 border-t border-[#8C701B]/30 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="min-h-[44px] py-2.5 px-3 bg-[#1F262D] hover:bg-[#2A343D] text-[#E6D385] border border-[#8C701B]/50 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#C5A028] shrink-0" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="min-h-[44px] py-2.5 px-3 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 bg-gradient-to-r from-[#C5A028] to-[#D4AF37] hover:brightness-110 text-[#12161A] font-bold rounded-xl text-sm flex items-center justify-center space-x-1.5 shadow-lg shadow-[#C5A028]/20 transition active:scale-95 cursor-pointer"
          >
            <span>Next Check-In</span>
            <ArrowRight className="w-4 h-4 text-[#12161A]" />
          </button>
        </div>

      </div>
    </div>
  );
};
