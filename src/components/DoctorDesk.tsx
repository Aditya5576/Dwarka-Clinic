import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Stethoscope,
  Users,
  Search,
  Camera,
  Upload,
  Trash2,
  Maximize2,
  X,
  Plus,
  Share2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Activity,
  Edit3
} from 'lucide-react';
import {
  type Patient,
  type Visit,
  type ClinicalPrescription,
  type PrescriptionItem,
  type CustomMedication,
  type MedicationType,
  type ClinicalProcedure
} from '../types';
import {
  db,
  getAutomaticShiftInfo,
  getLocalDateKey,
  saveClinicalPrescription,
  saveCustomMedication,
  getAllMedicationCatalog,
  getPrescriptionByVisitId,
  getPatientPrescriptions,
  getAllProcedureCatalog,
  saveCustomProcedure
} from '../services/db';
import {
  subscribeToIntakeBroadcast,
  requestNotificationPermission,
  dispatchDesktopNotification,
  playArrivalChime,
  type IntakeNotificationMessage
} from '../services/notificationService';
import {
  calculateNextFollowUpDate,
  calculateDaysBetween,
  calculateElapsedDays,
  resolveDoctorFee,
  formatIndianDisplayDate,
  QUICK_FOLLOW_UP_DAYS
} from '../utils/clinicalUtils';
import { fuzzyFilter } from '../utils/fuzzySearch';
import { compressPaperRxImage, getBase64SizeInKB } from '../utils/imageCompressor';
import { lockBodyScroll } from '../utils/scrollLock';
import { sendSilentWhatsAppMessage, buildPrescriptionWhatsAppText } from '../services/whatsappService';
import { PrescriptionPrintModal } from './PrescriptionPrintModal';

interface QueueItem {
  tokenNumber: number;
  visit: Visit;
  patient: Patient;
  hasPrescription: boolean;
}

export const DoctorDesk: React.FC = () => {
  const [shiftInfo] = useState(getAutomaticShiftInfo());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);
  const [filterShiftOnly, setFilterShiftOnly] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [queueStatusFilter, setQueueStatusFilter] = useState<'ALL' | 'WAITING' | 'DONE'>('ALL');
  const [globalSuccessToast, setGlobalSuccessToast] = useState<string | null>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);

  // Active Consultation State
  const [doctorFee, setDoctorFee] = useState<number>(200);
  const [followUpDays, setFollowUpDays] = useState<number>(15);
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(calculateNextFollowUpDate(undefined, 15));
  const [diagnosisNotes, setDiagnosisNotes] = useState<string>('');
  const [medications, setMedications] = useState<PrescriptionItem[]>([]);
  const [procedures, setProcedures] = useState<ClinicalProcedure[]>([]);
  const [paperRxPhoto, setPaperRxPhoto] = useState<string | undefined>(undefined);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [photoZoomOpen, setPhotoZoomOpen] = useState<boolean>(false);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);
  const [isReadOnlyReview, setIsReadOnlyReview] = useState<boolean>(false);
  const [showComparisonPreview, setShowComparisonPreview] = useState<boolean>(false);

  // Medication Catalog & Autocomplete State
  const [catalog, setCatalog] = useState<CustomMedication[]>([]);
  const [medSearchInput, setMedSearchInput] = useState<string>('');
  const [showCatalogDropdown, setShowCatalogDropdown] = useState<boolean>(false);
  const [activeMedicineSuggestionIndex, setActiveMedicineSuggestionIndex] = useState<number | null>(null);

  // In-Clinic Procedures Catalog & Autocomplete State
  const [procedureCatalog, setProcedureCatalog] = useState<ClinicalProcedure[]>([]);
  const [procSearchInput, setProcSearchInput] = useState<string>('');
  const [showProcDropdown, setShowProcDropdown] = useState<boolean>(false);

  // Real-Time Patient Intake Notification State
  const [arrivalNotification, setArrivalNotification] = useState<IntakeNotificationMessage | null>(null);

  // Executive Shift Analytics State
  const [shiftAnalytics, setShiftAnalytics] = useState<{
    waitingCount: number;
    consultedCount: number;
    totalCollections: number;
    consultationTotal: number;
    procedureTotal: number;
    cashTotal: number;
    upiTotal: number;
  }>({
    waitingCount: 0,
    consultedCount: 0,
    totalCollections: 0,
    consultationTotal: 0,
    procedureTotal: 0,
    cashTotal: 0,
    upiTotal: 0
  });

  // Native Inline Patient History State
  const [showHistoryInline, setShowHistoryInline] = useState<boolean>(false);
  const [patientHistory, setPatientHistory] = useState<ClinicalPrescription[]>([]);
  const [pastVisits, setPastVisits] = useState<Visit[]>([]);

  // Modals & Action Status
  const [printModalPrescription, setPrintModalPrescription] = useState<ClinicalPrescription | null>(null);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Universal scroll locking for active modals (photo zoom & print modal)
  useEffect(() => {
    if (photoZoomOpen || !!zoomPhotoUrl || !!printModalPrescription) {
      const unlock = lockBodyScroll();
      return () => {
        unlock();
      };
    }
  }, [photoZoomOpen, zoomPhotoUrl, printModalPrescription]);

  // Keyboard Esc shortcut to return from Consultation Room back to Waiting Queue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (photoZoomOpen || !!zoomPhotoUrl) {
          setPhotoZoomOpen(false);
          setZoomPhotoUrl(null);
          return;
        }
        if (selectedQueueItem && !printModalPrescription) {
          setSelectedQueueItem(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedQueueItem, photoZoomOpen, zoomPhotoUrl, printModalPrescription]);

  // Auto-dismiss global success toast after 5 seconds
  useEffect(() => {
    if (globalSuccessToast) {
      const timer = setTimeout(() => {
        setGlobalSuccessToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [globalSuccessToast]);

  // Load Medication & Procedure Catalogs
  const refreshCatalog = useCallback(async () => {
    const list = await getAllMedicationCatalog();
    setCatalog(list);
  }, []);

  const refreshProcedureCatalog = useCallback(async () => {
    const list = await getAllProcedureCatalog();
    setProcedureCatalog(list);
  }, []);

  useEffect(() => {
    refreshCatalog();
    refreshProcedureCatalog();
  }, [refreshCatalog, refreshProcedureCatalog]);

  // Load Today's Queue & Executive Shift Analytics
  const loadShiftQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const todayKey = getLocalDateKey();
      const allVisits = await db.visits.toArray();
      const todayVisits = allVisits
        .filter(v => getLocalDateKey(v.date) === todayKey)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const filtered = filterShiftOnly
        ? todayVisits.filter(v => v.shift === shiftInfo.shift)
        : todayVisits;

      const items: QueueItem[] = [];
      let tokenCounter = 1;

      let waiting = 0;
      let consulted = 0;
      let totalCol = 0;
      let consTotal = 0;
      let procTotal = 0;
      let cashTotal = 0;
      let upiTotal = 0;

      for (const visit of filtered) {
        totalCol += (visit.amount || 0);
        if (visit.mode === 'UPI') {
          upiTotal += (visit.amount || 0);
        } else {
          cashTotal += (visit.amount || 0);
        }

        const patient = await db.patients.get(visit.patientId);
        if (patient) {
          const existingRx = await getPrescriptionByVisitId(visit.id);
          const hasRx = !!existingRx;

          if (hasRx) {
            consulted++;
            consTotal += (existingRx.doctorFee ?? (visit.amount || 200));
            procTotal += (existingRx.procedureFeeTotal ?? 0);
          } else {
            waiting++;
            consTotal += (visit.amount || 200);
          }

          items.push({
            tokenNumber: tokenCounter++,
            visit,
            patient,
            hasPrescription: hasRx
          });
        }
      }

      setQueue(items);
      setShiftAnalytics({
        waitingCount: waiting,
        consultedCount: consulted,
        totalCollections: totalCol,
        consultationTotal: consTotal,
        procedureTotal: procTotal,
        cashTotal,
        upiTotal
      });
    } catch (err) {
      console.error('Error loading doctor queue:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, [filterShiftOnly, shiftInfo.shift]);

  useEffect(() => {
    loadShiftQueue();
  }, [loadShiftQueue]);

  // Real-Time Patient Intake Notification & Audio Broadcast Subscription
  useEffect(() => {
    requestNotificationPermission().catch(() => {});

    const unsubscribe = subscribeToIntakeBroadcast((msg) => {
      playArrivalChime();
      dispatchDesktopNotification(msg.patientName, msg.tokenNumber);
      setArrivalNotification(msg);
      loadShiftQueue();
    });

    return () => {
      unsubscribe();
    };
  }, [loadShiftQueue]);

  // Auto-dismiss floating arrival notification after 5 seconds
  useEffect(() => {
    if (arrivalNotification) {
      const timer = setTimeout(() => {
        setArrivalNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [arrivalNotification]);

  // Select patient and load any existing prescription or initialize clean slate
  const selectPatientForConsultation = async (item: QueueItem) => {
    setSelectedQueueItem(item);
    setActionStatus(null);
    setShowHistoryInline(false);

    // Preload history immediately for inline accordion
    try {
      const pId = item.patient.id;
      const history = await getPatientPrescriptions(pId);
      const visits = await db.visits.where('patientId').equals(pId).toArray();
      setPatientHistory(history);
      setPastVisits(visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      console.error('Error preloading patient history:', e);
    }

    const existingRx = await getPrescriptionByVisitId(item.visit.id);
    if (existingRx) {
      setDoctorFee(existingRx.doctorFee);
      setFollowUpDays(existingRx.followUpDays);
      setNextFollowUpDate(existingRx.nextFollowUpDate);
      setDiagnosisNotes(existingRx.diagnosisNotes || '');
      setMedications(existingRx.medications || []);
      setProcedures(existingRx.procedures || []);
      setPaperRxPhoto(existingRx.paperRxPhoto);
      setIsReadOnlyReview(true);
    } else {
      // Clean consultation setup
      setDoctorFee(item.visit.amount || 200);
      setFollowUpDays(15);
      const calculatedDate = calculateNextFollowUpDate(getLocalDateKey(item.visit.date), 15);
      setNextFollowUpDate(calculatedDate);
      setDiagnosisNotes('');
      setMedications([]);
      setProcedures([]);
      setPaperRxPhoto(undefined);
      setZoomPhotoUrl(null);
      setPhotoZoomOpen(false);
      setIsReadOnlyReview(false);
    }
  };

  // Follow-up chip click
  const handleSelectFollowUpDays = (days: number) => {
    setFollowUpDays(days);
    const baseDate = selectedQueueItem ? getLocalDateKey(selectedQueueItem.visit.date) : undefined;
    setNextFollowUpDate(calculateNextFollowUpDate(baseDate, days));
  };

  // Custom follow-up date change
  const handleCustomFollowUpDateChange = (dateStr: string) => {
    setNextFollowUpDate(dateStr);
    const baseDate = selectedQueueItem ? getLocalDateKey(selectedQueueItem.visit.date) : getLocalDateKey();
    const days = calculateDaysBetween(baseDate, dateStr);
    setFollowUpDays(days > 0 ? days : 0);
  };

  // Handle Photo Capture / Upload & Compression
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    setActionStatus(null);
    try {
      const compressedBase64 = await compressPaperRxImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.78,
        mimeType: 'image/jpeg'
      });
      setPaperRxPhoto(compressedBase64);
      setActionStatus({
        type: 'success',
        message: `Paper Rx photo compressed to ~${getBase64SizeInKB(compressedBase64)} KB and attached.`
      });
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: err.message || 'Failed to compress and attach image.'
      });
    } finally {
      setIsCompressingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Add Medication to Prescription
  const handleAddMedicationRow = (med?: CustomMedication) => {
    const newItem: PrescriptionItem = {
      name: med?.name || '',
      type: (med?.type as MedicationType) || 'Tablet',
      dosage: med?.defaultDosage || '1 Tab',
      timing: med?.defaultTiming || 'Morning & Night',
      duration: `${followUpDays} Days`
    };
    setMedications(prev => [...prev, newItem]);
    setMedSearchInput('');
    setShowCatalogDropdown(false);
  };

  // Add Custom Medication on-the-fly to clinic catalog
  const handleAddCustomDrugToCatalog = async () => {
    if (!medSearchInput.trim()) return;
    const trimmed = medSearchInput.trim();
    const saved = await saveCustomMedication({
      name: trimmed,
      type: 'Tablet',
      defaultDosage: '1 Tab',
      defaultTiming: 'Once daily after dinner',
      category: 'Custom Clinic Entry'
    });
    await refreshCatalog();
    handleAddMedicationRow(saved);
  };

  const handleUpdateMedication = (index: number, field: keyof PrescriptionItem, value: any) => {
    setMedications(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Repeat Last Prescription (Milestone 3)
  const handleRepeatLastPrescription = () => {
    if (!patientHistory || patientHistory.length === 0) return;
    const lastRx = patientHistory[0];
    if (!lastRx.medications || lastRx.medications.length === 0) {
      setGlobalSuccessToast(`No digital medications found in previous visit on ${formatIndianDisplayDate(lastRx.consultationDate)}.`);
      return;
    }

    const clonedMeds: PrescriptionItem[] = lastRx.medications.map((m) => ({
      name: m.name,
      type: m.type,
      dosage: m.dosage,
      timing: m.timing,
      duration: m.duration
    }));

    setMedications(clonedMeds);
    const consultDateStr = formatIndianDisplayDate(lastRx.consultationDate);
    setGlobalSuccessToast(`Copied ${clonedMeds.length} medication${clonedMeds.length > 1 ? 's' : ''} from visit on ${consultDateStr}`);
  };

  const handleSelectRowSuggestion = (index: number, med: CustomMedication) => {
    setMedications(prev => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = {
        ...copy[index],
        name: med.name,
        type: (med.type as MedicationType) || copy[index].type,
        dosage: med.defaultDosage || copy[index].dosage || '1 Tab',
        timing: med.defaultTiming || copy[index].timing || 'Morning & Night'
      };
      return copy;
    });
    setActiveMedicineSuggestionIndex(null);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(prev => prev.filter((_, idx) => idx !== index));
    if (activeMedicineSuggestionIndex === index) {
      setActiveMedicineSuggestionIndex(null);
    }
  };

  // Add Procedure to Prescription
  const handleAddProcedureRow = (proc: ClinicalProcedure) => {
    const newItem: ClinicalProcedure = {
      id: proc.id || `proc-${Date.now()}`,
      name: proc.name,
      category: proc.category,
      fee: Number(proc.fee) || 0,
      notes: proc.notes || ''
    };
    setProcedures(prev => [...prev, newItem]);
    setProcSearchInput('');
    setShowProcDropdown(false);
  };

  // Add Custom Procedure to Catalog
  const handleAddCustomProcedureToCatalog = async () => {
    if (!procSearchInput.trim()) return;
    const trimmed = procSearchInput.trim();
    const saved = await saveCustomProcedure({
      name: trimmed,
      category: 'Other',
      fee: 1000,
      notes: 'Custom procedure'
    });
    await refreshProcedureCatalog();
    handleAddProcedureRow(saved);
  };

  const handleUpdateProcedure = (index: number, field: keyof ClinicalProcedure, value: any) => {
    setProcedures(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveProcedure = (index: number) => {
    setProcedures(prev => prev.filter((_, idx) => idx !== index));
  };

  // Toggle Native Inline History Drawer
  const handleToggleHistoryInline = async () => {
    if (!showHistoryInline && selectedQueueItem) {
      try {
        const pId = selectedQueueItem.patient.id;
        const history = await getPatientPrescriptions(pId);
        const visits = await db.visits.where('patientId').equals(pId).toArray();
        setPatientHistory(history);
        setPastVisits(visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error('Error fetching patient history:', e);
      }
    }
    setShowHistoryInline(prev => !prev);
  };

  // Save Prescription to Dexie
  const handleSavePrescription = async (): Promise<ClinicalPrescription | null> => {
    if (!selectedQueueItem) return null;
    setIsSaving(true);
    setActionStatus(null);

    try {
      const { visit, patient } = selectedQueueItem;
      const procedureTotal = procedures.reduce((acc, p) => acc + (Number(p.fee) || 0), 0);

      const prescriptionData: ClinicalPrescription = {
        visitId: visit.id,
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientCity: patient.city,
        consultationDate: getLocalDateKey(visit.date),
        shift: visit.shift,
        doctorFee: resolveDoctorFee(visit.amount, doctorFee),
        followUpDays,
        nextFollowUpDate,
        paperRxPhoto,
        medications,
        procedures,
        procedureFeeTotal: procedureTotal,
        diagnosisNotes: diagnosisNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      const saved = await saveClinicalPrescription(prescriptionData);
      
      // Update local queue item status & refresh analytics
      setQueue(prev => prev.map(item => item.visit.id === visit.id ? { ...item, hasPrescription: true } : item));
      await loadShiftQueue();

      return saved;
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: err.message || 'Failed to save clinical prescription.'
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Save & Complete (No Slip)
  const handleSaveAndComplete = async () => {
    const saved = await handleSavePrescription();
    if (saved) {
      const name = saved.patientName;
      setSelectedQueueItem(null);
      setGlobalSuccessToast(`Consultation finalized for ${name}`);
    }
  };

  // Save & Open Print Slip
  const handleSaveAndPrint = async () => {
    const saved = await handleSavePrescription();
    if (saved) {
      setPrintModalPrescription(saved);
    }
  };

  // Save & Dispatch Silent WhatsApp
  const handleSaveAndWhatsApp = async () => {
    const saved = await handleSavePrescription();
    if (!saved || !selectedQueueItem) return;

    try {
      const messageText = buildPrescriptionWhatsAppText(saved);
      await sendSilentWhatsAppMessage({
        phone: saved.patientPhone,
        message: messageText,
        mediaBase64: saved.paperRxPhoto
      });

      const name = saved.patientName;
      setSelectedQueueItem(null);
      setGlobalSuccessToast(`Consultation finalized & WhatsApp sent to ${name}!`);
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: err.message || 'WhatsApp dispatch error.'
      });
    }
  };

  // Resend WhatsApp directly from Read-Only Consultation Review
  const handleResendWhatsAppFromReview = async () => {
    if (!selectedQueueItem) return;
    setIsSaving(true);
    setActionStatus(null);
    try {
      const rx = await getPrescriptionByVisitId(selectedQueueItem.visit.id);
      if (!rx) {
        setActionStatus({ type: 'error', message: 'No saved prescription found to resend.' });
        return;
      }
      const messageText = buildPrescriptionWhatsAppText(rx);
      const res = await sendSilentWhatsAppMessage({
        phone: rx.patientPhone,
        message: messageText,
        mediaBase64: rx.paperRxPhoto
      });
      if (res.success) {
        setActionStatus({ type: 'success', message: 'Prescription WhatsApp successfully resent to patient.' });
      } else {
        setActionStatus({ type: 'error', message: res.message || 'WhatsApp dispatch fallback triggered.' });
      }
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Failed to resend WhatsApp.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Print Modal directly from Read-Only Consultation Review
  const handlePrintFromReview = async () => {
    if (!selectedQueueItem) return;
    const rx = await getPrescriptionByVisitId(selectedQueueItem.visit.id);
    if (rx) {
      setPrintModalPrescription(rx);
    } else {
      setPrintModalPrescription({
        id: `rx-${selectedQueueItem.visit.id}`,
        visitId: selectedQueueItem.visit.id,
        patientId: selectedQueueItem.patient.id,
        patientName: selectedQueueItem.patient.name,
        patientPhone: selectedQueueItem.patient.phone,
        patientCity: selectedQueueItem.patient.city,
        consultationDate: getLocalDateKey(selectedQueueItem.visit.date),
        shift: selectedQueueItem.visit.shift,
        doctorFee,
        followUpDays,
        nextFollowUpDate,
        diagnosisNotes,
        medications,
        procedures,
        procedureFeeTotal: totalProcedureFee,
        paperRxPhoto,
        createdAt: new Date().toISOString()
      });
    }
  };

  // Next patient navigation helper
  const handleNextPatient = () => {
    if (!selectedQueueItem) return;
    const currentIndex = queue.findIndex(item => item.visit.id === selectedQueueItem.visit.id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      selectPatientForConsultation(queue[currentIndex + 1]);
    } else {
      setSelectedQueueItem(null);
      setGlobalSuccessToast('All consultations completed for this shift.');
    }
  };

  // Filtered catalog medicines based on search input (fuzzy with typo tolerance)
  const filteredCatalog = fuzzyFilter(
    catalog,
    medSearchInput,
    m => `${m.name} ${m.category || ''} ${m.type}`
  ).slice(0, 8);

  // Row-level active suggestions for dynamic medication rows
  const activeRowSuggestions = useMemo(() => {
    if (activeMedicineSuggestionIndex === null) return [];
    const targetItem = medications[activeMedicineSuggestionIndex];
    if (!targetItem) return [];
    const q = targetItem.name?.trim() || '';
    if (!q) {
      return catalog.slice(0, 6);
    }
    return fuzzyFilter(
      catalog,
      targetItem.name,
      m => `${m.name} ${m.category || ''} ${m.type}`
    ).slice(0, 6);
  }, [activeMedicineSuggestionIndex, medications, catalog]);

  // Filtered in-clinic procedures based on search input (fuzzy with typo tolerance)
  const filteredProcedureCatalog = fuzzyFilter(
    procedureCatalog,
    procSearchInput,
    p => `${p.name} ${p.category} ${p.notes || ''}`
  ).slice(0, 8);

  // Dynamic Procedure Total and Grand Total Bill
  const totalProcedureFee = procedures.reduce((acc, p) => acc + (Number(p.fee) || 0), 0);
  const grandTotalBill = doctorFee + totalProcedureFee;

  const filteredQueue = queue.filter(item => {
    const matchesSearch =
      item.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient.phone.includes(searchQuery) ||
      item.patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.patient.city && item.patient.city.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (queueStatusFilter === 'WAITING') return !item.hasPrescription;
    if (queueStatusFilter === 'DONE') return item.hasPrescription;
    return true;
  });

  const currentPatientIndex = selectedQueueItem
    ? queue.findIndex(item => item.visit.id === selectedQueueItem.visit.id)
    : -1;
  const hasNextPatient = currentPatientIndex >= 0 && currentPatientIndex < queue.length - 1;

  return (
    <div className="w-full space-y-6">

      {/* Success Toast Banner (Visible in Waiting Queue) */}
      {!selectedQueueItem && globalSuccessToast && (
        <div
          data-testid="doctor-success-toast"
          className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 shadow-xl flex items-center justify-between text-emerald-200 text-xs sm:text-sm font-semibold animate-in fade-in duration-150"
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{globalSuccessToast}</span>
          </div>
          <button
            onClick={() => setGlobalSuccessToast(null)}
            className="p-1 text-emerald-300 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: DOCTOR HOME / QUEUE DASHBOARD (!selectedQueueItem)
          ========================================================================= */}
      {!selectedQueueItem && (
        <div className="w-full space-y-6">
          {/* Top Banner: Doctor Desk Branding & Shift Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#161B21] via-[#1A2027] to-[#161B21] border border-[#8C701B]/40 shadow-xl">
            <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[#C5A028]/20 border border-[#C5A028]/50 flex items-center justify-center text-[#E6D385] shadow-inner shrink-0 mt-0.5 sm:mt-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 data-testid="doctor-desk-title" className="font-brand font-bold text-base sm:text-xl tracking-wide text-white">
                    DR. SANDEEP BALDAWA'S CONSULTATION DESK
                  </h1>
                  <span className="rounded-full bg-[#C5A028]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#E6D385] border border-[#8C701B]/40 whitespace-nowrap">
                    DOCTOR MODE
                  </span>
                </div>
                <p data-testid="doctor-desk-subtitle" className="mt-1 text-xs sm:text-sm text-slate-400 break-words leading-relaxed">
                  M.B.B.S., D.D.V. • Consultant Dermatologist &amp; Trichologist • Jaysingpur • Shift: <strong className="text-white">{shiftInfo.label}</strong>
                </p>
              </div>
            </div>

            {/* Quick Shift Filter Toggle & Refresh */}
            <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setFilterShiftOnly(!filterShiftOnly)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                  filterShiftOnly
                    ? 'bg-[#C5A028]/20 border-[#8C701B] text-[#E6D385]'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {filterShiftOnly ? 'Current Shift' : 'All Today'}
              </button>
              <button
                onClick={loadShiftQueue}
                title="Refresh Patient Queue"
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>


          {/* Real-Time Floating Patient Intake Arrival Banner */}
          {arrivalNotification && (
            <div
              data-testid="arrival-notification-toast"
              className="p-4 rounded-2xl bg-gradient-to-r from-[#1A2027] via-[#1E252E] to-[#1A2027] border-2 border-[#C5A028] shadow-2xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#C5A028]/20 border border-[#C5A028] text-[#E6D385] flex items-center justify-center font-bold text-sm shrink-0">
                  #{arrivalNotification.tokenNumber}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A028] bg-[#C5A028]/10 px-2 py-0.5 rounded">
                      New Patient Checked In
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {arrivalNotification.timestamp}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mt-0.5">
                    {arrivalNotification.patientName}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setArrivalNotification(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Doctor Shift Financial & Operational Summary Ribbon */}
          <div
            data-testid="doctor-shift-analytics"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#12161A] border border-slate-800 shadow-xl"
          >
            {/* Waiting in Queue */}
            <div className="p-3 rounded-xl bg-[#161B21] border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block mb-1">
                Patients Waiting
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {shiftAnalytics.waitingCount}
                </span>
                <span className="text-xs text-slate-400">in queue</span>
              </div>
            </div>

            {/* Completed Today */}
            <div className="p-3 rounded-xl bg-[#161B21] border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 block mb-1">
                Completed Today
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {shiftAnalytics.consultedCount}
                </span>
                <span className="text-xs text-slate-400">consulted</span>
              </div>
            </div>

            {/* Total Collections Today */}
            <div className="p-3 rounded-xl bg-[#161B21] border border-[#8C701B]/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E6D385] block mb-1">
                Total Collections
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#E6D385]">
                  ₹{shiftAnalytics.totalCollections}
                </span>
              </div>
            </div>

            {/* Financial Breakdown (Cons vs Proc & Cash vs UPI) */}
            <div className="p-3 rounded-xl bg-[#161B21] border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Cons / Proc:</span>
                <span className="font-mono font-bold text-white">₹{shiftAnalytics.consultationTotal} / ₹{shiftAnalytics.procedureTotal}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Cash / UPI:</span>
                <span className="font-mono font-bold text-[#E6D385]">₹{shiftAnalytics.cashTotal} / ₹{shiftAnalytics.upiTotal}</span>
              </div>
            </div>
          </div>

          {/* Live Shift Waiting Queue Dashboard Section */}
          <div className="bg-[#12161A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Users className="w-5 h-5 text-[#C5A028]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Shift Patient Waiting Queue ({filteredQueue.length})
                </h3>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center space-x-2 bg-[#161B21] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setQueueStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    queueStatusFilter === 'ALL'
                      ? 'bg-[#C5A028] text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({queue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQueueStatusFilter('WAITING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    queueStatusFilter === 'WAITING'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Waiting ({queue.filter(q => !q.hasPrescription).length})
                </button>
                <button
                  type="button"
                  onClick={() => setQueueStatusFilter('DONE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    queueStatusFilter === 'DONE'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Seen ({queue.filter(q => q.hasPrescription).length})
                </button>
              </div>
            </div>

            {/* Search Queue */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                data-testid="queue-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by name, phone, patient ID (e.g. DC-0001), or city..."
                className="w-full bg-[#1A2027] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
              />
            </div>

            {/* Responsive Queue Cards Grid */}
            {filteredQueue.length === 0 ? (
              <div className="p-12 text-center text-xs sm:text-sm text-slate-500 italic bg-[#161B21]/40 rounded-2xl border border-dashed border-slate-800">
                {isLoadingQueue ? 'Loading queue records...' : 'No patient records match your current filter.'}
              </div>
            ) : (
              <div
                data-testid="queue-cards-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredQueue.map((item) => (
                  <div
                    key={item.visit.id}
                    data-testid={`queue-card-${item.visit.id}`}
                    className="p-4 rounded-2xl bg-[#161B21] border border-slate-800 hover:border-[#8C701B]/50 transition-all flex flex-col justify-between space-y-3.5 shadow-lg group"
                  >
                    <div>
                      {/* Top Header Row in Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-xl bg-[#0F1316] border border-[#8C701B]/50 text-[#E6D385] text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-inner">
                            #{item.tokenNumber}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-[#E6D385] transition-colors">
                              {item.patient.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {item.patient.id}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {item.hasPrescription ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                            Rx Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 animate-pulse">
                            Waiting
                          </span>
                        )}
                      </div>

                      {/* Middle Details */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center space-x-1 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{item.patient.phone}</span>
                        </span>
                        <span className="flex items-center space-x-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{item.patient.city}</span>
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          Fee: <strong className="text-white font-mono">₹{item.visit.amount}</strong> ({item.visit.mode})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.visit.shift} Shift
                        </span>
                      </div>
                    </div>

                    {/* Primary CTA Button */}
                    <button
                      type="button"
                      data-testid="btn-start-consultation"
                      onClick={() => selectPatientForConsultation(item)}
                      className={`w-full min-h-[44px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                        item.hasPrescription
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-[#C5A028] hover:bg-[#E6D385] text-black font-extrabold shadow-lg'
                      }`}
                    >
                      <span>{item.hasPrescription ? 'Edit Consultation' : 'Start Consultation'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ACTIVE CONSULTATION ROOM (selectedQueueItem !== null)
          ========================================================================= */}
      {selectedQueueItem && (
        <div className="w-full space-y-4">
          {/* Top Sticky/Subheader Navigation & Patient Strip (Task 3: Solid Opaque Background) */}
          <div className="sticky top-0 z-30 bg-[#0F1316] pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#12161A] border border-[#8C701B]/40 shadow-xl">
              <button
                type="button"
                data-testid="btn-back-to-queue"
                onClick={() => setSelectedQueueItem(null)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center space-x-2 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-[#C5A028]" />
                <span>Back to Waiting Queue</span>
                <span className="hidden md:inline text-[10px] text-slate-400 font-mono">(Esc)</span>
              </button>

              <div className="min-w-0 flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-[#0F1316] border border-[#8C701B]/50 text-[#E6D385] text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-inner">
                  #{selectedQueueItem.tokenNumber}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm sm:text-base font-bold text-white truncate">
                      {selectedQueueItem.patient.name}
                    </h2>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-[#E6D385] font-mono font-bold shrink-0">
                      {selectedQueueItem.patient.id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{selectedQueueItem.patient.phone}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{selectedQueueItem.patient.city}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-[#E6D385] bg-[#C5A028]/10 border border-[#8C701B]/30 px-3 py-1.5 rounded-lg self-start sm:self-auto shrink-0">
                Token #{selectedQueueItem.tokenNumber} • {selectedQueueItem.visit.shift} Shift
              </div>
            </div>
          </div>

          {/* Active Consultation Toast Banner (e.g. after copying medications) */}
          {globalSuccessToast && (
            <div
              data-testid="doctor-success-toast"
              className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 shadow-xl flex items-center justify-between text-emerald-200 text-xs sm:text-sm font-semibold animate-in fade-in"
            >
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{globalSuccessToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalSuccessToast(null)}
                className="p-1 text-emerald-300 hover:text-white rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Consultation Workspace Body */}
          <div className="bg-[#12161A] border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">

            {/* Compact Professional Past Rx & Timeline Card (Task 2) */}
            <div className="space-y-3">
              <button
                type="button"
                data-testid="btn-toggle-history"
                onClick={handleToggleHistoryInline}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#12161A] border border-[#8C701B]/40 hover:border-[#C5A028] transition-all text-left group cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-[#C5A028]/10 text-[#C5A028] border border-[#8C701B]/30 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      CONSULTATION &amp; RX HISTORY
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {patientHistory.length === 0
                        ? 'First visit (No prior records)'
                        : `${patientHistory.length} previous visit(s) recorded • Tap to ${showHistoryInline ? 'collapse' : 'view'}`}
                    </p>
                  </div>
                </div>
                <span className="text-[#C5A028] font-bold text-xs flex items-center gap-1 group-hover:text-white transition-colors shrink-0">
                  {showHistoryInline ? 'Collapse ▲' : 'Expand ▼'}
                </span>
              </button>

              {showHistoryInline && (
                <div
                  data-testid="inline-history-card"
                  className="bg-[#12161A]/95 border border-[#8C701B]/30 rounded-xl p-3 sm:p-4 space-y-3 animate-in fade-in duration-200"
                >
                  {/* Top Collapse Control */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6D385]">
                      Patient Timeline ({patientHistory.length} Recorded Visits)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHistoryInline(false)}
                      className="text-[11px] text-[#C5A028] hover:text-[#E6D385] font-semibold cursor-pointer"
                    >
                      Collapse History ▲
                    </button>
                  </div>

                  {patientHistory.length === 0 && pastVisits.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 italic bg-[#161B21]/50 rounded-xl border border-dashed border-slate-800">
                      First visit — No prior consultation records found for this patient.
                    </div>
                  ) : (
                    <div className="max-h-[260px] sm:max-h-[300px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-slate-700 space-y-2.5">
                      {patientHistory.map((rx) => {
                        const elapsedDays = calculateElapsedDays(
                          rx.consultationDate,
                          selectedQueueItem ? selectedQueueItem.visit.date : new Date()
                        );
                        const isWithin30Days = elapsedDays <= 30;

                        return (
                          <div key={rx.id} className="p-3.5 rounded-xl bg-[#161B21] border border-slate-800/90 space-y-2 text-xs">
                            {/* Row 1: Date & Shift • Elapsed Days Pill & Renewal Policy Badge • Fee */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-white text-xs">
                                  Date: {formatIndianDisplayDate(rx.consultationDate)} ({rx.shift} Shift)
                                </span>
                                <span className="font-mono text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60">
                                  {elapsedDays === 0 ? 'Today' : `${elapsedDays} days ago`}
                                </span>
                                {isWithin30Days ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-700/50 text-emerald-300">
                                    ✓ Within 30-day window (₹100 valid)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 border border-amber-700/50 text-amber-300">
                                    ⚠ Over 30 days (₹200 renewal due)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 font-mono text-[11px]">
                                <span className="text-[#E6D385] font-bold">
                                  Fee: ₹{rx.doctorFee}
                                </span>
                                {rx.procedureFeeTotal ? (
                                  <span className="text-emerald-400 font-bold">
                                    • Proc: ₹{rx.procedureFeeTotal}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                          {/* Row 2: Diagnosis */}
                          <div className="text-slate-300 text-[11px]">
                            <strong className="text-slate-400">Diagnosis:</strong> {rx.diagnosisNotes || 'None recorded'}
                          </div>

                          {/* Row 3: Prescribed Meds */}
                          {rx.medications && rx.medications.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {rx.medications.map((m, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-[#1A2027] border border-slate-700/60 text-[10px] text-slate-200"
                                >
                                  <strong>{m.name}</strong> [{m.type}] • {m.dosage} ({m.duration})
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Row 4: Procedures if any */}
                          {rx.procedures && rx.procedures.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {rx.procedures.map((p, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-emerald-950/30 border border-emerald-800/40 text-[10px] text-emerald-300"
                                >
                                  ⚡ {p.name} (₹{p.fee})
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Compact 40x40 Photo Thumbnail with Tap-To-Zoom */}
                          {rx.paperRxPhoto && (
                            <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/60">
                              <span className="text-[10px] text-slate-400 font-semibold">Attached Slip:</span>
                              <div
                                className="relative group/thumb cursor-pointer w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-[#C5A028] shrink-0"
                                onClick={() => {
                                  setZoomPhotoUrl(rx.paperRxPhoto || null);
                                  setPhotoZoomOpen(true);
                                }}
                                title="Tap to zoom handwritten Rx"
                              >
                                <img
                                  src={rx.paperRxPhoto}
                                  alt="Past Rx Thumbnail"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white">
                                  <Maximize2 className="w-3.5 h-3.5 text-[#E6D385]" />
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 italic">Tap thumbnail to enlarge</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}

                  {/* Bottom Collapse Control */}
                  {patientHistory.length > 1 && (
                    <div className="pt-2 border-t border-slate-800 text-right">
                      <button
                        type="button"
                        onClick={() => setShowHistoryInline(false)}
                        className="text-[11px] text-[#C5A028] hover:text-[#E6D385] font-semibold cursor-pointer"
                      >
                        Collapse History ▲
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isReadOnlyReview ? (
              /* READ-ONLY CONSULTATION REVIEW VIEW (Task 3 & 5) */
              <div data-testid="readonly-consultation-card" className="space-y-5 animate-in fade-in duration-150">
                {/* Banner & Edit Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-950/25 border border-emerald-800/40">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white">Consultation Completed</h3>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">
                          Read-Only Summary
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Consultation record on file for {selectedQueueItem.patient.name}. Review prescription, print slip, or resend WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      data-testid="btn-edit-consultation"
                      onClick={() => setIsReadOnlyReview(false)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#C5A028] hover:bg-[#E6D385] text-black text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Consultation</span>
                    </button>
                  </div>
                </div>

                {/* Role-Based Fee Breakdown */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#161B21] border border-slate-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-[#C5A028]" />
                      <span>Role-Based Financial Breakdown</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Segregated Billing</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#1A2027] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Reception Intake</span>
                      <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                        ₹{selectedQueueItem.visit.amount}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Mode: {selectedQueueItem.visit.mode}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#1A2027] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Doctor Fee</span>
                      <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                        ₹{doctorFee}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Consultation
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#1A2027] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Procedures Total</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                        ₹{totalProcedureFee}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {procedures.length} procedure(s)
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#1A2027] border border-[#8C701B]/50 bg-[#C5A028]/5">
                      <span className="text-[10px] text-[#E6D385] block font-semibold uppercase">Grand Bill Total</span>
                      <span className="text-base font-bold font-mono text-[#E6D385] mt-0.5 block">
                        ₹{grandTotalBill}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Doc + Procedures
                      </span>
                    </div>
                  </div>
                </div>

                {/* Follow-up & Diagnosis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#161B21] border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Next Follow-Up Scheduled
                    </span>
                    <div className="flex items-center space-x-2 text-sm font-bold text-white">
                      <Calendar className="w-4 h-4 text-[#C5A028]" />
                      <span>{formatIndianDisplayDate(nextFollowUpDate)}</span>
                      <span className="text-xs font-normal text-slate-400">({followUpDays} Days)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#161B21] border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Clinical Diagnosis Notes / Advice
                    </span>
                    <p className="text-xs text-slate-200">
                      {diagnosisNotes || 'No specific clinical diagnosis notes recorded.'}
                    </p>
                  </div>
                </div>

                {/* Prescribed Medications Read-Only Summary */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#161B21] border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#C5A028]" />
                    <span>Prescribed Medications ({medications.length})</span>
                  </h4>

                  {medications.length > 0 ? (
                    <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                      {medications.map((m, idx) => (
                        <div key={idx} className="p-3 bg-[#1A2027]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs block truncate">
                              {idx + 1}. {m.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Dosage: <strong className="text-slate-200">{m.dosage}</strong> • Timing: <strong className="text-slate-200">{m.timing}</strong>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] font-bold text-[#E6D385] bg-[#C5A028]/15 border border-[#8C701B]/40 px-2 py-0.5 rounded uppercase">
                              {m.type}
                            </span>
                            <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {m.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No digital medications recorded.</p>
                  )}
                </div>

                {/* In-Clinic Procedures Read-Only Summary */}
                {procedures.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#161B21] border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-[#C5A028]" />
                        <span>In-Clinic Procedures ({procedures.length})</span>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">Total: ₹{totalProcedureFee}</span>
                    </h4>
                    <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                      {procedures.map((p, idx) => (
                        <div key={idx} className="p-3 bg-[#1A2027]/70 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[11px] text-slate-400 block">{p.category} {p.notes ? `• ${p.notes}` : ''}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded">
                            ₹{p.fee}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Paper Rx Slip */}
                {paperRxPhoto && (
                  <div className="p-4 rounded-2xl bg-[#161B21] border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-[#C5A028]" />
                      <span>Attached Handwritten Paper Slip</span>
                    </h4>
                    <div className="flex items-center space-x-4 bg-[#1A2027] p-3 rounded-xl border border-slate-700/80">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0">
                        <img src={paperRxPhoto} alt="Paper Rx" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block">Handwritten Rx Slip Attached</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Size: ~{getBase64SizeInKB(paperRxPhoto)} KB
                        </span>
                        <button
                          type="button"
                          data-testid="btn-review-enlarge-photo"
                          onClick={() => {
                            setZoomPhotoUrl(paperRxPhoto || null);
                            setPhotoZoomOpen(true);
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer flex items-center space-x-1.5"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-[#C5A028]" />
                          <span>🔍 Enlarge Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Status Message */}
                {actionStatus && (
                  <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
                    actionStatus.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {actionStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      )}
                      <span>{actionStatus.message}</span>
                    </div>
                  </div>
                )}

                {/* Review Mode Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    data-testid="btn-review-close"
                    onClick={() => setSelectedQueueItem(null)}
                    className="min-h-[46px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Close &amp; Return to Queue
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      data-testid="btn-review-edit"
                      onClick={() => setIsReadOnlyReview(false)}
                      className="min-h-[46px] flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#E6D385] text-xs font-bold border border-[#8C701B]/40 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Consultation</span>
                    </button>

                    <button
                      type="button"
                      data-testid="btn-review-print"
                      onClick={handlePrintFromReview}
                      className="min-h-[46px] flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#C5A028] hover:bg-[#E6D385] text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Rx Slip</span>
                    </button>

                    <button
                      type="button"
                      data-testid="btn-review-resend-whatsapp"
                      onClick={handleResendWhatsAppFromReview}
                      disabled={isSaving}
                      className="min-h-[46px] flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-50"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{isSaving ? 'Sending...' : 'Resend WhatsApp'}</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* INTERACTIVE CONSULTATION PRESCRIPTION FORM */
              <div className="space-y-6">
                {selectedQueueItem.hasPrescription && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#C5A028]/10 border border-[#8C701B]/40 text-xs">
                    <span className="text-[#E6D385] font-semibold">
                      Editing completed consultation. Changes will update the patient's existing record.
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReadOnlyReview(true)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel Edit &amp; Return to Review
                    </button>
                  </div>
                )}

                {/* Fee Override & Follow-Up Date Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-[#161B21] border border-slate-800/80">

                {/* Doctor Fee Override */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Doctor Consultation Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm font-bold text-[#C5A028]">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={doctorFee}
                      onChange={(e) => setDoctorFee(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-[#1A2027] border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">
                    Auto-calculated rate: ₹{selectedQueueItem.visit.amount} (editable by doctor)
                  </span>
                </div>

                {/* Quick Follow-Up Date Chips */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Next Follow-Up: <strong className="text-[#E6D385] font-mono">{nextFollowUpDate}</strong> ({followUpDays} Days)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {QUICK_FOLLOW_UP_DAYS.map((d) => (
                      <button
                        key={d}
                        onClick={() => handleSelectFollowUpDays(d)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          followUpDays === d
                            ? 'bg-[#C5A028] text-black shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => handleCustomFollowUpDateChange(e.target.value)}
                      className="min-h-[44px] bg-[#1A2027] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028]"
                    />
                  </div>
                </div>
              </div>

              {/* CRITICAL: Handwritten Paper Rx Photo Capture & Preview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#161B21] border border-slate-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-[#C5A028]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Handwritten Paper Rx Slip (Photo Snapshot)
                    </span>
                  </div>
                  {paperRxPhoto && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                      Attached (~{getBase64SizeInKB(paperRxPhoto)} KB)
                    </span>
                  )}
                </div>

                {/* Hidden File Inputs for Camera and Gallery */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                {paperRxPhoto ? (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-[#1A2027] p-3.5 rounded-2xl border border-slate-700">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-600 bg-black shrink-0">
                      <img
                        src={paperRxPhoto}
                        alt="Handwritten Rx Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white block truncate">
                        Handwritten Paper Slip Saved
                      </span>
                      <span className="text-xs text-slate-400 block mt-1">
                        Will be automatically included in thermal printouts and silent WhatsApp deliveries.
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button
                          type="button"
                          data-testid="btn-enlarge-photo"
                          onClick={() => {
                            setZoomPhotoUrl(paperRxPhoto || null);
                            setPhotoZoomOpen(true);
                          }}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer whitespace-nowrap flex items-center space-x-1.5"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-[#C5A028]" />
                          <span>🔍 Enlarge Photo</span>
                        </button>
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer whitespace-nowrap"
                        >
                          Retake
                        </button>
                        <button
                          onClick={() => setPaperRxPhoto(undefined)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold border border-rose-800/40 cursor-pointer whitespace-nowrap"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 p-5 border border-dashed border-slate-700 rounded-2xl bg-[#1A2027]/50 text-center">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isCompressingPhoto}
                      className="min-h-[46px] flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#C5A028] text-black text-xs font-bold hover:bg-[#E6D385] transition-all cursor-pointer shadow-md disabled:opacity-50 whitespace-nowrap"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isCompressingPhoto ? 'Compressing...' : 'Take Camera Photo'}</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressingPhoto}
                      className="min-h-[46px] flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Upload Paper Slip Image</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hybrid Digital Medication Prescriber */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#161B21] border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#C5A028]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Digital Medication Prescriber ({medications.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Indian Derma Master (~80 items)
                  </span>
                </div>

                {/* Milestone 3: Prescription Continuity & Repeat Bar */}
                {patientHistory.length > 0 && patientHistory[0].medications && patientHistory[0].medications.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#C5A028]/15 via-[#1E252E] to-[#161B21] border border-[#8C701B]/50 shadow-md">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-[#C5A028]/20 text-[#C5A028] border border-[#8C701B]/40 shrink-0">
                          📋
                        </span>
                        <div>
                          <span className="text-xs font-bold text-[#E6D385] block">
                            Previous Prescription Available ({formatIndianDisplayDate(patientHistory[0].consultationDate)})
                          </span>
                          <span className="text-[11px] text-slate-300">
                            {patientHistory[0].medications.length} medication(s) prescribed in last visit
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          data-testid="btn-toggle-comparison"
                          onClick={() => setShowComparisonPreview(prev => !prev)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <span>⚖️</span>
                          <span>{showComparisonPreview ? 'Hide Comparison ▲' : 'Compare Rx ⚖️'}</span>
                        </button>

                        <button
                          type="button"
                          data-testid="btn-repeat-last-rx"
                          onClick={handleRepeatLastPrescription}
                          className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#C5A028] hover:bg-[#E6D385] text-black text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>📋</span>
                          <span>Repeat Last Prescription</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Side-by-Side Comparison Preview */}
                    {showComparisonPreview && (
                      <div
                        data-testid="prescription-comparison-card"
                        className="p-4 rounded-xl bg-[#12161A] border border-[#8C701B]/40 shadow-inner space-y-3 animate-in fade-in duration-150"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6D385] flex items-center gap-1.5">
                            <span>⚖️</span>
                            <span>Prescription Comparison: Previous vs. Current Consultation</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowComparisonPreview(false)}
                            className="text-slate-400 hover:text-white text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Column 1: Prior Visit Prescription */}
                          <div className="p-3 rounded-lg bg-[#161B21] border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wide">
                                Prior Visit ({formatIndianDisplayDate(patientHistory[0].consultationDate)})
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {patientHistory[0].medications.length} Meds
                              </span>
                            </div>
                            <div className="divide-y divide-slate-800/80 space-y-1">
                              {patientHistory[0].medications.map((m, idx) => {
                                const isContinued = medications.some(
                                  cur => cur.name.trim().toLowerCase() === m.name.trim().toLowerCase()
                                );
                                return (
                                  <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-white block text-xs">{m.name}</span>
                                      <span className="text-[10px] text-slate-400">{m.dosage} • {m.timing}</span>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                      isContinued
                                        ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                                        : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}>
                                      {isContinued ? '✓ Continued' : 'Discontinued'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Column 2: Current Active Consultation */}
                          <div className="p-3 rounded-lg bg-[#161B21] border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#E6D385] text-[11px] uppercase tracking-wide">
                                Active Consultation (Today)
                              </span>
                              <span className="text-[10px] text-[#C5A028] font-mono">
                                {medications.length} Meds
                              </span>
                            </div>
                            {medications.length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic py-2">
                                No medications added yet. Click "Repeat Last Prescription" or search drugs below.
                              </p>
                            ) : (
                              <div className="divide-y divide-slate-800/80 space-y-1">
                                {medications.map((m, idx) => {
                                  const wasInPrior = patientHistory[0].medications.some(
                                    prev => prev.name.trim().toLowerCase() === m.name.trim().toLowerCase()
                                  );
                                  return (
                                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                                      <div>
                                        <span className="font-bold text-white block text-xs">{m.name}</span>
                                        <span className="text-[10px] text-slate-400">{m.dosage} • {m.timing}</span>
                                      </div>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                        wasInPrior
                                          ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                                          : 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                                      }`}>
                                        {wasInPrior ? '✓ Continued' : '+ Newly Added'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Medication Autocomplete Search Input (Task 4: Keyboard-Aware) */}
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      data-testid="medication-search-input"
                      value={medSearchInput}
                      onChange={(e) => {
                        setMedSearchInput(e.target.value);
                        setShowCatalogDropdown(true);
                      }}
                      onFocus={(e) => {
                        setShowCatalogDropdown(true);
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                      placeholder="Type medicine name (e.g. Isotretinoin, Tretinoin, Minoxidil, Itraconazole)..."
                      className="w-full bg-[#1A2027] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A028] min-h-[46px]"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showCatalogDropdown && medSearchInput.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-[60] bg-[#161B21] border border-[#C5A028]/40 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto divide-y divide-slate-800">
                      {filteredCatalog.map((med, idx) => (
                        <div
                          key={idx}
                          data-testid={`catalog-item-${idx}`}
                          onClick={() => handleAddMedicationRow(med)}
                          className="p-3 hover:bg-[#1E252E] transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {med.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {med.category || 'Dermatology'} • {med.defaultDosage || 'Standard dosage'} • {med.defaultTiming || ''}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#E6D385] bg-[#C5A028]/15 border border-[#8C701B]/40 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                            {med.type}
                          </span>
                        </div>
                      ))}

                      {/* 1-Click Add Custom Drug to Catalog if not present */}
                      <div
                        onClick={handleAddCustomDrugToCatalog}
                        className="p-3 bg-[#C5A028]/15 hover:bg-[#C5A028]/25 text-[#E6D385] text-xs font-bold flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Plus className="w-4 h-4" />
                          <span>Add "{medSearchInput.trim()}" to clinic catalog</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">Save New Medicine</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prescribed Medications: Responsive Display (Desktop Table / Mobile Stacked Cards) */}
                {medications.length > 0 ? (
                  <div className="space-y-3">
                    
                    {/* Desktop View (>= 1024px): Spacious Table */}
                    <div className="hidden lg:block border border-slate-800 rounded-2xl overflow-visible">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#1A2027] text-slate-400 border-b border-slate-800">
                            <th className="py-2.5 px-3 font-bold w-1/3">Medicine Name</th>
                            <th className="py-2.5 px-2.5 font-bold w-24">Form</th>
                            <th className="py-2.5 px-2.5 font-bold">Dosage</th>
                            <th className="py-2.5 px-2.5 font-bold">Timing</th>
                            <th className="py-2.5 px-2.5 font-bold w-24">Duration</th>
                            <th className="py-2.5 px-2 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {medications.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 relative">
                                <input
                                  type="text"
                                  data-testid={`table-med-name-input-${idx}`}
                                  value={item.name}
                                  placeholder="Search or type medicine name (e.g. Novanib, Minoxidil)..."
                                  onChange={(e) => {
                                    handleUpdateMedication(idx, 'name', e.target.value);
                                    setActiveMedicineSuggestionIndex(idx);
                                  }}
                                  onFocus={() => setActiveMedicineSuggestionIndex(idx)}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setActiveMedicineSuggestionIndex(curr => curr === idx ? null : curr);
                                    }, 200);
                                  }}
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                />
                                {activeMedicineSuggestionIndex === idx && activeRowSuggestions.length > 0 && (
                                  <div
                                    data-testid={`table-row-suggestions-${idx}`}
                                    className="absolute left-3 right-3 top-full mt-1 z-50 bg-[#161B21] border border-[#C5A028]/50 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800"
                                  >
                                    {activeRowSuggestions.map((sug, sIdx) => (
                                      <div
                                        key={sIdx}
                                        data-testid={`row-suggestion-item-${idx}-${sIdx}`}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleSelectRowSuggestion(idx, sug);
                                        }}
                                        className="p-2.5 hover:bg-[#1E252E] transition-colors cursor-pointer flex items-center justify-between"
                                      >
                                        <div className="min-w-0 pr-2">
                                          <span className="text-xs font-bold text-white block truncate">
                                            {sug.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 block truncate">
                                            {sug.category || 'Dermatology'} • {sug.defaultDosage || 'Standard dosage'}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#E6D385] bg-[#C5A028]/15 border border-[#8C701B]/40 px-1.5 py-0.5 rounded uppercase whitespace-nowrap shrink-0">
                                          {sug.type}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2.5">
                                <select
                                  value={item.type}
                                  onChange={(e) => handleUpdateMedication(idx, 'type', e.target.value as MedicationType)}
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                >
                                  {['Tablet', 'Capsule', 'Cream', 'Lotion', 'Gel', 'Shampoo', 'Serum', 'Soap', 'Drops', 'Powder'].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2.5 px-2.5">
                                <input
                                  type="text"
                                  value={item.dosage}
                                  onChange={(e) => handleUpdateMedication(idx, 'dosage', e.target.value)}
                                  placeholder="e.g. 1 Tab"
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                />
                              </td>
                              <td className="py-2.5 px-2.5">
                                <input
                                  type="text"
                                  value={item.timing}
                                  onChange={(e) => handleUpdateMedication(idx, 'timing', e.target.value)}
                                  placeholder="e.g. Night"
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                />
                              </td>
                              <td className="py-2.5 px-2.5">
                                <input
                                  type="text"
                                  value={item.duration}
                                  onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                                  placeholder="15 Days"
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => handleRemoveMedication(idx)}
                                  title="Remove Medicine"
                                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile & Tablet View (< 1024px): Stacked Touch-Friendly Cards */}
                    <div className="lg:hidden space-y-3.5">
                      {medications.map((item, idx) => (
                        <div
                          key={idx}
                          data-testid="mobile-rx-card"
                          className="bg-[#1A2027] p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold text-[#E6D385] flex items-center space-x-1.5">
                              <span className="w-5 h-5 rounded-full bg-[#C5A028]/20 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <span>Medicine Formulation</span>
                            </span>
                            <button
                              onClick={() => handleRemoveMedication(idx)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Medicine Name */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Medicine Name
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                data-testid={`mobile-med-name-input-${idx}`}
                                value={item.name}
                                placeholder="Search or type medicine name (e.g. Novanib, Minoxidil)..."
                                onChange={(e) => {
                                  handleUpdateMedication(idx, 'name', e.target.value);
                                  setActiveMedicineSuggestionIndex(idx);
                                }}
                                onFocus={(e) => {
                                  setActiveMedicineSuggestionIndex(idx);
                                  e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setActiveMedicineSuggestionIndex(curr => curr === idx ? null : curr);
                                  }, 200);
                                }}
                                className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                              />
                              {activeMedicineSuggestionIndex === idx && activeRowSuggestions.length > 0 && (
                                <div
                                  data-testid={`mobile-row-suggestions-${idx}`}
                                  className="absolute left-0 right-0 top-full mt-1 z-[60] bg-[#161B21] border border-[#C5A028]/40 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto divide-y divide-slate-800"
                                >
                                  {activeRowSuggestions.map((sug, sIdx) => (
                                    <div
                                      key={sIdx}
                                      data-testid={`mobile-suggestion-item-${idx}-${sIdx}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectRowSuggestion(idx, sug);
                                      }}
                                      className="p-3 hover:bg-[#1E252E] transition-colors cursor-pointer flex items-center justify-between"
                                    >
                                      <div className="min-w-0 pr-2">
                                        <span className="text-xs font-bold text-white block truncate">
                                          {sug.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          {sug.category || 'Dermatology'} • {sug.defaultDosage || 'Standard dosage'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold text-[#E6D385] bg-[#C5A028]/15 border border-[#8C701B]/40 px-1.5 py-0.5 rounded uppercase whitespace-nowrap shrink-0">
                                        {sug.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Type & Dosage 2-Column Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Form
                              </label>
                              <select
                                value={item.type}
                                onChange={(e) => handleUpdateMedication(idx, 'type', e.target.value as MedicationType)}
                                className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                              >
                                {['Tablet', 'Capsule', 'Cream', 'Lotion', 'Gel', 'Shampoo', 'Serum', 'Soap', 'Drops', 'Powder'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Dosage
                              </label>
                              <input
                                type="text"
                                value={item.dosage}
                                onChange={(e) => handleUpdateMedication(idx, 'dosage', e.target.value)}
                                placeholder="1 Tab"
                                className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                              />
                            </div>
                          </div>

                          {/* Timing & Duration 2-Column Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Timing / Schedule
                              </label>
                              <input
                                type="text"
                                value={item.timing}
                                onChange={(e) => handleUpdateMedication(idx, 'timing', e.target.value)}
                                placeholder="Morning & Night"
                                className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Duration
                              </label>
                              <input
                                type="text"
                                value={item.duration}
                                onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                                placeholder="15 Days"
                                className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Another Row Button */}
                    <button
                      type="button"
                      data-testid="btn-add-medicine-row"
                      onClick={() => handleAddMedicationRow()}
                      className="min-h-[44px] flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#C5A028]" />
                      <span>Add Another Medicine Row</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 italic bg-[#1A2027]/40 rounded-xl border border-dashed border-slate-800">
                    No digital medications added. Type in the search bar above or attach a handwritten paper Rx slip.
                  </div>
                )}

                {/* Optional Clinical Notes / Diagnosis */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Clinical Diagnosis Notes / Advice (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={diagnosisNotes}
                    onChange={(e) => setDiagnosisNotes(e.target.value)}
                    placeholder="e.g. Acne Vulgaris Grade II. Avoid oily foods, apply sunscreen daily..."
                    className="w-full bg-[#1A2027] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A028] min-h-[64px]"
                  />
                </div>
              </div>

              {/* In-Clinic Procedures & Minor Surgeries */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#161B21] border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#C5A028]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      In-Clinic Procedures & Minor Surgeries ({procedures.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#E6D385] font-mono font-bold">
                    Total: ₹{totalProcedureFee}
                  </span>
                </div>

                {/* Procedure Autocomplete Search Input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      data-testid="procedure-search-input"
                      value={procSearchInput}
                      onChange={(e) => {
                        setProcSearchInput(e.target.value);
                        setShowProcDropdown(true);
                      }}
                      onFocus={(e) => {
                        setShowProcDropdown(true);
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                      placeholder="Type procedure name (e.g. Salicylic Peel, Comedone Extraction, PRP, Wart Excision)..."
                      className="w-full bg-[#1A2027] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A028] min-h-[46px]"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showProcDropdown && procSearchInput.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-[60] bg-[#161B21] border border-[#C5A028]/40 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto divide-y divide-slate-800">
                      {filteredProcedureCatalog.map((proc, idx) => (
                        <div
                          key={idx}
                          data-testid={`procedure-catalog-item-${idx}`}
                          onClick={() => handleAddProcedureRow(proc)}
                          className="p-3 hover:bg-[#1E252E] transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {proc.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {proc.category} {proc.notes ? `• ${proc.notes}` : ''}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded whitespace-nowrap">
                            ₹{proc.fee}
                          </span>
                        </div>
                      ))}

                      {/* 1-Click Add Custom Procedure to Catalog if not present */}
                      <div
                        onClick={handleAddCustomProcedureToCatalog}
                        className="p-3 bg-[#C5A028]/15 hover:bg-[#C5A028]/25 text-[#E6D385] text-xs font-bold flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Plus className="w-4 h-4" />
                          <span>Add "{procSearchInput.trim()}" as Custom Procedure</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">Save & Add</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prescribed Procedures List */}
                {procedures.length > 0 ? (
                  <div data-testid="prescribed-procedures-list" className="space-y-3">
                    
                    {/* Desktop View (>= 1024px): Spacious Table */}
                    <div className="hidden lg:block border border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#1A2027] text-slate-400 border-b border-slate-800">
                            <th className="py-2.5 px-3 font-bold w-1/3">Procedure Name</th>
                            <th className="py-2.5 px-2.5 font-bold w-28">Category</th>
                            <th className="py-2.5 px-2.5 font-bold w-28">Fee (₹)</th>
                            <th className="py-2.5 px-2.5 font-bold">Clinical Notes</th>
                            <th className="py-2.5 px-2 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {procedures.map((proc, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  value={proc.name}
                                  onChange={(e) => handleUpdateProcedure(idx, 'name', e.target.value)}
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                />
                              </td>
                              <td className="py-2.5 px-2.5">
                                <span className="text-[10px] font-bold text-[#E6D385] bg-[#C5A028]/15 border border-[#8C701B]/40 px-2 py-1 rounded uppercase whitespace-nowrap inline-block">
                                  {proc.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-2.5">
                                <input
                                  type="number"
                                  value={proc.fee}
                                  onChange={(e) => handleUpdateProcedure(idx, 'fee', Number(e.target.value) || 0)}
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                />
                              </td>
                              <td className="py-2.5 px-2.5">
                                <input
                                  type="text"
                                  value={proc.notes || ''}
                                  onChange={(e) => handleUpdateProcedure(idx, 'notes', e.target.value)}
                                  placeholder="e.g. Session 1 of 3, left cheek"
                                  className="w-full bg-[#1A2027] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[42px]"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => handleRemoveProcedure(idx)}
                                  title="Remove Procedure"
                                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile & Tablet View (< 1024px): Stacked Touch Cards */}
                    <div className="lg:hidden space-y-3.5">
                      {procedures.map((proc, idx) => (
                        <div
                          key={idx}
                          data-testid="mobile-procedure-card"
                          className="bg-[#1A2027] p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold text-[#E6D385] flex items-center space-x-1.5">
                              <span className="w-5 h-5 rounded-full bg-[#C5A028]/20 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <span>Procedure Details</span>
                            </span>
                            <button
                              onClick={() => handleRemoveProcedure(idx)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Procedure Name
                            </label>
                            <input
                              type="text"
                              value={proc.name}
                              onChange={(e) => handleUpdateProcedure(idx, 'name', e.target.value)}
                              className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Category
                              </label>
                              <div className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-[#E6D385] font-bold min-h-[44px] flex items-center">
                                {proc.category}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Fee (₹)
                              </label>
                              <input
                                type="number"
                                value={proc.fee}
                                onChange={(e) => handleUpdateProcedure(idx, 'fee', Number(e.target.value) || 0)}
                                className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Clinical Notes
                            </label>
                            <input
                              type="text"
                              value={proc.notes || ''}
                              onChange={(e) => handleUpdateProcedure(idx, 'notes', e.target.value)}
                              placeholder="e.g. Session 1 of 3"
                              className="w-full bg-[#12161A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A028] min-h-[44px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Another Procedure Row Button */}
                    <button
                      type="button"
                      onClick={() => handleAddProcedureRow({
                        id: `proc-custom-${Date.now()}`,
                        name: 'General Clinic Procedure',
                        category: 'Other',
                        fee: 500,
                        notes: ''
                      })}
                      className="min-h-[44px] flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#C5A028]" />
                      <span>Add Another Procedure Row</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 italic bg-[#1A2027]/40 rounded-xl border border-dashed border-slate-800">
                    No in-clinic procedures recorded. Search above to add chemical peels, comedone extractions, electrocautery, or minor surgeries.
                  </div>
                )}
              </div>

              {/* Status Banner */}
              {actionStatus && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
                  actionStatus.type === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    {actionStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{actionStatus.message}</span>
                  </div>

                  {hasNextPatient && actionStatus.type === 'success' && (
                    <button
                      onClick={handleNextPatient}
                      className="ml-3 px-3 py-1.5 rounded-lg bg-[#C5A028] text-black text-xs font-bold hover:bg-[#E6D385] transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1"
                    >
                      <span>Next Patient</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="hidden md:inline">Intake: <strong className="text-slate-300 font-mono">₹{selectedQueueItem.visit.amount}</strong> ({selectedQueueItem.visit.mode}) | </span>
                  <span>Consultation: <strong className="text-white font-mono">₹{doctorFee}</strong></span>
                  {totalProcedureFee > 0 && (
                    <>
                      <span>+</span>
                      <span>Procedures: <strong className="text-emerald-400 font-mono">₹{totalProcedureFee}</strong></span>
                    </>
                  )}
                  <span className="text-slate-600">|</span>
                  <span className="text-sm font-bold text-[#E6D385]">
                    Total: <strong className="font-mono">₹{grandTotalBill}</strong>
                  </span>
                </div>

                <div className="flex flex-col xs:flex-row flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    data-testid="btn-save-complete"
                    onClick={handleSaveAndComplete}
                    disabled={isSaving}
                    className="min-h-[48px] w-full xs:w-auto flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-md disabled:opacity-50 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save & Complete (No Slip)</span>
                  </button>

                  <button
                    data-testid="btn-save-print"
                    onClick={handleSaveAndPrint}
                    disabled={isSaving}
                    className="min-h-[48px] w-full xs:w-auto flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-[#C5A028] text-black text-xs font-bold hover:bg-[#E6D385] transition-all cursor-pointer shadow-lg disabled:opacity-50 whitespace-nowrap"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save & Print Rx Slip'}</span>
                  </button>

                  <button
                    data-testid="btn-save-whatsapp"
                    onClick={handleSaveAndWhatsApp}
                    disabled={isSaving}
                    className="min-h-[48px] w-full xs:w-auto flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all cursor-pointer shadow-lg disabled:opacity-50 whitespace-nowrap"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Save & WhatsApp Rx</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    )}

      {/* Tap-To-Zoom Modal for Paper Rx Photo (Task 2 Architecture) */}
      {(photoZoomOpen || !!zoomPhotoUrl) && (zoomPhotoUrl || paperRxPhoto) && (
        <div
          data-testid="photo-zoom-modal"
          onClick={() => {
            setPhotoZoomOpen(false);
            setZoomPhotoUrl(null);
          }}
          className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/90 backdrop-blur-md touch-none overscroll-none select-none overflow-hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[88dvh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl bg-[#0F1316] border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
          >
            <button
              type="button"
              onClick={() => {
                setPhotoZoomOpen(false);
                setZoomPhotoUrl(null);
              }}
              data-testid="btn-close-zoom"
              className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Close Image Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-auto modal-scroll-body touch-pan-y overscroll-contain flex items-center justify-center p-2 sm:p-4 bg-slate-950/60">
              <img
                src={zoomPhotoUrl || paperRxPhoto}
                alt="Enlarged Rx Snapshot"
                className="block max-w-[92vw] max-h-[78dvh] w-auto h-auto object-contain mx-auto rounded-xl bg-white p-1 shadow-2xl"
              />
            </div>
            <div className="shrink-0 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3 bg-[#0F1316] border-t border-slate-800 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setPhotoZoomOpen(false);
                  setZoomPhotoUrl(null);
                }}
                className="min-h-[48px] px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Close Full Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {printModalPrescription && (
        <PrescriptionPrintModal
          prescription={printModalPrescription}
          tokenNumber={selectedQueueItem?.tokenNumber}
          onClose={() => {
            const patientName = printModalPrescription.patientName;
            setPrintModalPrescription(null);
            setSelectedQueueItem(null);
            setGlobalSuccessToast(`Consultation finalized and Rx printed for ${patientName}`);
          }}
        />
      )}

    </div>
  );
};
