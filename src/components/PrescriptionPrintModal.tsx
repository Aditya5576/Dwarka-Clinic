import React, { useEffect } from 'react';
import {
  Printer,
  Share2,
  X,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { type ClinicalPrescription } from '../types';
import { formatIndianDisplayDate } from '../utils/clinicalUtils';
import { lockBodyScroll } from '../utils/scrollLock';
import { sendSilentWhatsAppMessage, buildPrescriptionWhatsAppText } from '../services/whatsappService';

interface PrescriptionPrintModalProps {
  prescription: ClinicalPrescription;
  tokenNumber?: number | string;
  onClose: () => void;
}

export const PrescriptionPrintModal: React.FC<PrescriptionPrintModalProps> = ({
  prescription,
  tokenNumber,
  onClose
}) => {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = React.useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = React.useState<string | null>(null);

  const formattedDate = formatIndianDisplayDate(prescription.consultationDate);
  const formattedFollowUp = formatIndianDisplayDate(prescription.nextFollowUpDate);

  // Universal scroll locking while modal is active
  useEffect(() => {
    const unlock = lockBodyScroll();
    return () => {
      unlock();
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    setWhatsAppStatus(null);
    try {
      const text = buildPrescriptionWhatsAppText(prescription);
      const res = await sendSilentWhatsAppMessage({
        phone: prescription.patientPhone,
        message: text,
        mediaBase64: prescription.paperRxPhoto
      });
      setWhatsAppStatus(res.message);
    } catch (err: any) {
      setWhatsAppStatus(err.message || 'Failed to dispatch via WhatsApp');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overscroll-contain overflow-hidden print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-[#12161A] w-[96vw] max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-[#8C701B]/40 text-slate-100 overflow-hidden print:w-full print:max-w-none print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">

        {/* Modal Screen-Only Header */}
        <div className="bg-[#1A2027] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-[#8C701B]/30 shrink-0 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C5A028]/20 border border-[#8C701B]/50 flex items-center justify-center text-[#E6D385]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-brand font-bold text-sm tracking-wide text-white">
                Clinical Prescription Slip
              </span>
              <span className="text-[10px] text-[#C5A028] block font-mono">
                {prescription.patientId} • Token #{tokenNumber || '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#C5A028] text-black text-xs font-bold hover:bg-[#E6D385] transition-all cursor-pointer shadow-md whitespace-nowrap min-h-[40px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              disabled={isSendingWhatsApp}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all cursor-pointer shadow-md disabled:opacity-50 whitespace-nowrap min-h-[40px]"
            >
              <Share2 className="w-4 h-4" />
              <span>{isSendingWhatsApp ? 'Sending...' : 'WhatsApp'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status notification if WhatsApp triggered */}
        {whatsAppStatus && (
          <div className="bg-[#C5A028]/15 border-b border-[#C5A028]/30 px-4 py-2.5 text-xs text-[#E6D385] flex items-center space-x-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{whatsAppStatus}</span>
          </div>
        )}

        {/* Printable Prescription Body */}
        <div className="overflow-y-auto overscroll-contain flex-1 touch-pan-y p-5 sm:p-7 space-y-5 print:p-6 print:overflow-visible text-slate-200 print:text-black bg-gradient-to-b from-[#12161A] to-[#0A0D0F] print:bg-white">

          {/* Clinic Header */}
          <div className="border-b-2 border-[#C5A028] pb-3 text-center print:border-black">
            <h1 className="font-brand font-bold text-xl sm:text-2xl text-white tracking-wide print:text-black">
              DR. BALDAWA'S DWARKA CLINIC
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#E6D385] tracking-wider uppercase mt-0.5 print:text-black">
              SKIN & HAIR CARE SPECIALIST
            </p>
            <p className="text-[11px] text-slate-300 print:text-slate-700 mt-1">
              <strong>Dr. Sandeep Baldawa</strong> (M.B.B.S., D.D.V.) • Reg. No: 88123
            </p>
            <p className="text-[10px] text-slate-400 print:text-slate-600">
              Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi, Jaysingpur - 416101 • Ph: +91 9822012345
            </p>
            <div className="flex justify-between items-center text-[10px] text-slate-400 print:text-black mt-2 pt-1 border-t border-slate-800 print:border-slate-300 font-mono">
              <span>Shift: 11:00 AM – 2:00 PM & 5:00 PM – 8:30 PM</span>
              <span>Dwarka Clinic EMR</span>
            </div>
          </div>

          {/* Patient Details Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-[#1A2027] border border-slate-800 print:bg-slate-50 print:border-slate-300 print:text-black text-xs">
            <div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold">Patient Name</span>
              <span className="font-bold text-white print:text-black text-sm">{prescription.patientName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold">Patient ID / Token</span>
              <span className="font-mono font-bold text-[#E6D385] print:text-black">
                {prescription.patientId} {tokenNumber ? `(#${tokenNumber})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold">Place & Mobile</span>
              <span className="font-medium text-slate-200 print:text-black">{prescription.patientCity} • {prescription.patientPhone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold">Consultation Date</span>
              <span className="font-semibold text-slate-200 print:text-black">{formattedDate} ({prescription.shift})</span>
            </div>
          </div>

          {/* Diagnosis / Clinical Notes (if any) */}
          {prescription.diagnosisNotes && prescription.diagnosisNotes.trim() && (
            <div className="p-3.5 rounded-xl bg-[#161B21] border border-slate-800/80 print:bg-white print:border-slate-300">
              <span className="text-[10px] font-bold tracking-wider text-[#C5A028] print:text-black uppercase block mb-1">
                Clinical Diagnosis / Instructions:
              </span>
              <p className="text-xs text-slate-200 print:text-black whitespace-pre-line leading-relaxed">
                {prescription.diagnosisNotes}
              </p>
            </div>
          )}

          {/* Prescription Symbol (Rx) and Medication Table */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-serif text-2xl font-bold text-[#C5A028] print:text-black leading-none">
                ℞
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-300 print:text-black">
                Prescribed Medications
              </span>
            </div>

            {prescription.medications && prescription.medications.length > 0 ? (
              <div className="border border-slate-800 rounded-xl overflow-hidden print:border-black">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1A2027] print:bg-slate-100 text-slate-300 print:text-black border-b border-slate-800 print:border-black">
                      <th className="py-2.5 px-2.5 w-8 text-center font-bold">#</th>
                      <th className="py-2.5 px-3 font-bold">Medicine Name & Formulation</th>
                      <th className="py-2.5 px-3 font-bold">Dosage</th>
                      <th className="py-2.5 px-3 font-bold">Timing / Instructions</th>
                      <th className="py-2.5 px-3 font-bold text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                    {prescription.medications.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 print:hover:bg-transparent">
                        <td className="py-2.5 px-2.5 text-center text-slate-400 print:text-black font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white print:text-black block text-xs">
                            {med.name}
                          </span>
                          <span className="text-[10px] text-[#C5A028] print:text-slate-600 font-semibold uppercase">
                            [{med.type}]
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 print:text-black font-medium">
                          {med.dosage || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 print:text-black">
                          {med.timing || 'As directed'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#E6D385] print:text-black">
                          {med.duration || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3.5 text-center text-xs text-slate-400 print:text-slate-600 italic border border-dashed border-slate-800 rounded-xl">
                No digital medications entered. See handwritten slip below.
              </div>
            )}
          </div>

          {/* In-Clinic Procedures & Minor Surgeries (if present) */}
          {prescription.procedures && prescription.procedures.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[#C5A028] print:text-black">
                  In-Clinic Procedures &amp; Surgeries
                </span>
              </div>
              <div className="border border-slate-800 rounded-xl overflow-hidden print:border-black">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1A2027] print:bg-slate-100 text-slate-300 print:text-black border-b border-slate-800 print:border-black">
                      <th className="py-2.5 px-2.5 w-8 text-center font-bold">#</th>
                      <th className="py-2.5 px-3 font-bold">Procedure Name</th>
                      <th className="py-2.5 px-2.5 font-bold">Category</th>
                      <th className="py-2.5 px-3 font-bold">Clinical Notes</th>
                      <th className="py-2.5 px-3 font-bold text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                    {prescription.procedures.map((proc, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 print:hover:bg-transparent">
                        <td className="py-2.5 px-2.5 text-center text-slate-400 print:text-black font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white print:text-black">
                          {proc.name}
                        </td>
                        <td className="py-2.5 px-2.5 text-[10px] uppercase font-bold text-[#C5A028] print:text-slate-600">
                          {proc.category}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 print:text-black">
                          {proc.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#E6D385] print:text-black font-mono">
                          ₹{proc.fee}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#1A2027] print:bg-slate-50 font-bold border-t border-slate-700 print:border-black">
                      <td colSpan={4} className="py-2 px-3 text-right text-slate-300 print:text-black">
                        Procedure Charges Total:
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400 print:text-black font-mono">
                        ₹{prescription.procedureFeeTotal || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attached Handwritten Paper Rx Photo (if present) */}
          {prescription.paperRxPhoto && (
            <div className="mt-4 pt-3.5 border-t border-slate-800 print:border-slate-300">
              <span className="text-[11px] font-bold text-[#E6D385] print:text-black uppercase tracking-wider block mb-2">
                Handwritten Paper Rx Copy:
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-700 print:border-black max-h-[420px] print:max-h-[500px] bg-black flex items-center justify-center">
                <img
                  src={prescription.paperRxPhoto}
                  alt="Dr. Baldawa Handwritten Rx"
                  className="w-full h-auto max-h-[420px] print:max-h-[500px] object-contain print:contrast-125"
                />
              </div>
            </div>
          )}

          {/* Footer: Follow-up Date & Doctor Signature */}
          <div className="pt-4 border-t-2 border-slate-800 print:border-black grid grid-cols-2 gap-4 items-end">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Next Follow-Up Date:
              </span>
              <span className="text-sm font-bold text-[#E6D385] print:text-black block font-mono">
                {formattedFollowUp} ({prescription.followUpDays} Days)
              </span>
              <span className="text-[9px] text-slate-400 print:text-slate-600 italic block mt-0.5">
                *Follow-up discount rate (₹100) valid for 30 calendar days from visit.
              </span>
              {prescription.procedureFeeTotal ? (
                <div className="mt-2 text-[11px] font-mono print:text-black text-slate-300">
                  <span>Total Bill: Consultation ₹{prescription.doctorFee} + Procedures ₹{prescription.procedureFeeTotal} = <strong>₹{prescription.doctorFee + prescription.procedureFeeTotal}</strong></span>
                </div>
              ) : null}
            </div>

            <div className="text-right">
              <div className="h-10 print:h-12 flex items-end justify-end">
                <div className="w-36 border-b border-dashed border-slate-600 print:border-black"></div>
              </div>
              <span className="text-[11px] font-bold text-white print:text-black block mt-1">
                Dr. Sandeep Baldawa
              </span>
              <span className="text-[9px] text-slate-400 print:text-slate-600 block">
                Consultant Dermatologist & Trichologist
              </span>
            </div>
          </div>
        </div>

        {/* Modal Screen-Only Footer */}
        <div className="bg-[#1A2027] px-4 py-3 sm:px-6 flex items-center justify-between border-t border-[#8C701B]/30 shrink-0 print:hidden">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Consultation: <strong className="text-white font-mono">₹{prescription.doctorFee}</strong></span>
            {prescription.procedureFeeTotal ? (
              <>
                <span>•</span>
                <span>Procedures: <strong className="text-emerald-400 font-mono">₹{prescription.procedureFeeTotal}</strong></span>
                <span>•</span>
                <span>Total: <strong className="text-[#E6D385] font-mono text-sm">₹{prescription.doctorFee + prescription.procedureFeeTotal}</strong></span>
              </>
            ) : null}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#C5A028] text-black text-xs font-bold hover:bg-[#E6D385] transition-all cursor-pointer shadow-md flex items-center space-x-1 whitespace-nowrap min-h-[40px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
