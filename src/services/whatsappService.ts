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
