import { type ClinicalPrescription } from '../types';
import { formatWhatsAppNumber } from '../utils/phoneUtils';
import { formatIndianDisplayDate } from '../utils/clinicalUtils';

const DAEMON_API_URL = 'http://127.0.0.1:3001';

export interface WhatsAppSendPayload {
  phone: string;
  message: string;
  mediaBase64?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  channel: 'daemon' | 'browser_fallback';
  message: string;
}

/**
 * Builds formatted medical prescription text message for WhatsApp
 * Matches Dr. Baldawa's exact clinic standard layout.
 */
export function buildPrescriptionWhatsAppText(prescription: ClinicalPrescription): string {
  const formattedConsultDate = formatIndianDisplayDate(prescription.consultationDate);
  const formattedNextFollowUp = formatIndianDisplayDate(prescription.nextFollowUpDate);
  const notes = prescription.diagnosisNotes && prescription.diagnosisNotes.trim()
    ? prescription.diagnosisNotes.trim()
    : 'NA';

  let medicinesList = '';
  if (prescription.medications && prescription.medications.length > 0) {
    medicinesList = prescription.medications.map((med, idx) => {
      const dosage = med.dosage || 'As directed';
      const timing = med.timing || 'As directed';
      const duration = med.duration || 'As advised';
      return `${idx + 1}. *${med.name}* [${med.type}]\n   • Dosage: ${dosage}\n   • Timing: ${timing}\n   • Duration: ${duration}`;
    }).join('\n\n');
  } else if (prescription.paperRxPhoto) {
    medicinesList = '*(Handwritten Paper Rx attached)*';
  } else {
    medicinesList = 'NA';
  }

  let proceduresSection = '';
  if (prescription.procedures && prescription.procedures.length > 0) {
    const procItems = prescription.procedures.map((proc, idx) => {
      const noteStr = proc.notes ? ` (${proc.notes})` : '';
      return `${idx + 1}. *${proc.name}* [${proc.category}] — ₹${proc.fee}${noteStr}`;
    }).join('\n');
    proceduresSection = `--------------------------------\n*IN-CLINIC PROCEDURES:*\n\n${procItems}\n*Procedures Total:* ₹${prescription.procedureFeeTotal || 0}\n`;
  }

  const text = `*Dr. Baldawa's Dwarka Clinic — Jaysingpur*
*SKIN & HAIR CARE SPECIALIST*
Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi, Jaysingpur
Phone: 9822012345
--------------------------------
*CLINICAL PRESCRIPTION SUMMARY*
--------------------------------
*Patient ID:* ${prescription.patientId}
*Patient Name:* ${prescription.patientName}
*Place:* ${prescription.patientCity}
*Date:* ${formattedConsultDate} (${prescription.shift} Shift)
*Consultation Fee:* ₹${prescription.doctorFee}${prescription.procedureFeeTotal ? `\n*Procedure Charges:* ₹${prescription.procedureFeeTotal}\n*Total Fee:* ₹${prescription.doctorFee + prescription.procedureFeeTotal}` : ''}
*Doctor Notes / Diagnosis:* ${notes}
--------------------------------
*PRESCRIBED MEDICINES:*

${medicinesList}
${proceduresSection}--------------------------------
*NEXT FOLLOW-UP DATE:*
*${formattedNextFollowUp}* (${prescription.followUpDays} Days)
_Follow-up rate valid within 30 days._
_Wishing you a speedy recovery! Dr. Baldawa's Dwarka Clinic._`;

  return text;
}

/**
 * Builds polite clinical recall & defaulter message for WhatsApp
 */
export function buildFollowUpRecallWhatsAppText(defaulter: {
  patientName: string;
  patientId: string;
  expectedFollowUpDate: string;
  overdueDays: number;
  doctorNotes?: string;
  hasProcedures?: boolean;
}): string {
  const formattedDueDate = formatIndianDisplayDate(defaulter.expectedFollowUpDate);
  const procedureNote = defaulter.hasProcedures
    ? `\n*Note:* This follow-up includes your post-procedure clinical evaluation.`
    : '';

  return `*Dr. Baldawa's Dwarka Clinic — Jaysingpur*
*SKIN & HAIR CARE SPECIALIST*
Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi, Jaysingpur
Phone: 9822012345
--------------------------------
Namaskar *${defaulter.patientName}* ji,

This is a gentle health check-in from Dr. Baldawa's Dwarka Clinic (Patient ID: *${defaulter.patientId}*).

According to your treatment plan, your scheduled medical follow-up consultation was due on *${formattedDueDate}* (approx. ${defaulter.overdueDays} day${defaulter.overdueDays > 1 ? 's' : ''} ago).${procedureNote}

Timely evaluation ensures optimal response to treatment and prevents condition recurrence.

*Clinic Timings:*
- Morning: 11:00 AM – 2:00 PM
- Evening: 5:00 PM – 8:30 PM

Please visit at your earliest convenience. If you have already resumed or completed your recovery, you may let us know.

_Wishing you enduring skin & hair health!_
_Dr. Sandeep Baldawa_`;
}

/**
 * Builds formatted Patient Intake Receipt text for WhatsApp
 */
export function buildReceiptWhatsAppText(
  patient: { name: string; id: string; phone: string },
  visit: { date: string; shift: string; amount: number; mode: string }
): string {
  const visitDate = new Date(visit.date);
  const formattedDate = formatIndianDisplayDate(visit.date);
  const formattedTime = visitDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const validUntilDate = new Date(visitDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const formattedValidUntil = formatIndianDisplayDate(validUntilDate.toISOString());

  return `*Dr. Baldawa's Dwarka Clinic — Jaysingpur*
*SKIN & HAIR CARE SPECIALIST*
Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi, Jaysingpur

*PATIENT INTAKE RECEIPT*
--------------------------------
*Patient ID:* ${patient.id}
*Name:* ${patient.name}
*Date:* ${formattedDate} (${formattedTime})
*Shift:* ${visit.shift}
*Amount Paid:* ₹${visit.amount} (${visit.mode})
--------------------------------
*Next Follow-Up Rate (₹100) Valid Until:*
*${formattedValidUntil}* (Next 30 Days)

_Thank you for visiting Dr. Baldawa's Dwarka Clinic. Take care!_
_Dr. Sandeep Baldawa_`;
}

/**
 * Checks if the local background WhatsApp daemon is running and connected
 */
export async function checkWhatsAppDaemonStatus(): Promise<{ online: boolean; connected?: boolean; phone?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${DAEMON_API_URL}/api/status`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, connected: !!data.connected, phone: data.phone };
    }
    return { online: false };
  } catch {
    return { online: false };
  }
}

/**
 * Sends a message silently via the local WhatsApp daemon.
 * If daemon is offline, gracefully falls back to opening wa.me Web link.
 */
export async function sendSilentWhatsAppMessage(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> {
  const normalizedPhone = formatWhatsAppNumber(payload.phone);
  if (!normalizedPhone) {
    throw new Error('Invalid 10-digit Indian phone number.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${DAEMON_API_URL}/api/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: normalizedPhone,
        message: payload.message,
        mediaBase64: payload.mediaBase64
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          channel: 'daemon',
          message: 'Prescription sent silently via WhatsApp background daemon!'
        };
      }
    }
  } catch {
    // Daemon unreachable or timed out -> Graceful fallback to wa.me browser link
  }

  // Graceful browser fallback
  const encoded = encodeURIComponent(payload.message);
  const webUrl = `https://wa.me/${normalizedPhone}?text=${encoded}`;
  window.open(webUrl, '_blank');

  return {
    success: true,
    channel: 'browser_fallback',
    message: 'Local daemon offline. Opened WhatsApp Web in new tab.'
  };
}
