/**
 * Real-Time Patient Intake Notification & Audio Broadcast Service
 * Enables immediate synchronization between Reception Desk check-ins
 * and Doctor Consultation Desk via BroadcastChannel, Web Audio, and OS Notifications.
 */

export interface IntakeNotificationMessage {
  type: 'NEW_PATIENT';
  patientName: string;
  patientId?: string;
  tokenNumber: number;
  shift: string;
  timestamp?: number;
}

const INTAKE_CHANNEL_NAME = 'dwarka_clinic_intake';

/**
 * Broadcast a new patient arrival event across all open tabs/windows
 */
export const broadcastNewPatientCheckIn = (payload: IntakeNotificationMessage): void => {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(INTAKE_CHANNEL_NAME);
      channel.postMessage({
        ...payload,
        timestamp: Date.now()
      });
      channel.close();
    }
  } catch (err) {
    console.warn('Failed to broadcast intake event via BroadcastChannel:', err);
  }
};

/**
 * Subscribe to intake events on Doctor Desk or secondary screens
 */
export const subscribeToIntakeBroadcast = (
  onNewPatient: (message: IntakeNotificationMessage) => void
): (() => void) => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return () => {};
  }

  const channel = new BroadcastChannel(INTAKE_CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'NEW_PATIENT') {
      onNewPatient(event.data as IntakeNotificationMessage);
    }
  };

  return () => {
    channel.close();
  };
};

/**
 * Request OS / Desktop Notification Permissions for Clinic Tab
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
};

/**
 * Trigger system-level desktop notification for patient arrival
 */
export const dispatchDesktopNotification = (patientName: string, token: number): void => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification("Dr. Baldawa's Dwarka Clinic", {
        body: `New Patient Checked In: ${patientName} (Token #${token})`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `patient-arrival-${token}`,
        silent: true // Web Audio chime handles audio playback
      });
    }
  } catch (err) {
    console.warn('Desktop notification dispatch blocked:', err);
  }
};

/**
 * Dual-Tone Pleasant Synthesized Chime using pure Web Audio API
 * Dual harmonic frequency: Note 1 (E5 - 659.25Hz), Note 2 (B5 - 987.77Hz)
 * Zero external mp3/wav audio file dependencies.
 */
export const playArrivalChime = (): void => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // First Tone: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.16, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second Tone: B5 (987.77 Hz) - elevated crisp harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.20, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (err) {
    // Fail silently if browser audio is not permitted yet
  }
};

