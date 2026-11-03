import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Share2, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Phone, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { type Patient } from '../types';
import { db } from '../services/db';

interface ReminderPatient {
  patient: Patient;
  diffDays: number;
  daysRemaining: number;
  validUntil: string;
}

export const Reminders: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReminders = async () => {
    setLoading(true);
    const allPatients = await db.patients.toArray();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const list: ReminderPatient[] = [];

    for (const p of allPatients) {
      if (!p.lastVisitDate) continue;
      const lastVisitTime = new Date(p.lastVisitDate).getTime();
      const diffDays = Math.floor((now - lastVisitTime) / dayMs);

      // Between 25 and 30 days ago
      if (diffDays >= 25 && diffDays <= 30) {
        const daysRemaining = 30 - diffDays;
        const validUntil = new Date(lastVisitTime + 30 * dayMs).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

        list.push({
          patient: p,
          diffDays,
          daysRemaining,
          validUntil
        });
      }
    }

    // Sort by urgent (least days remaining first)
    list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    setReminders(list);
    setLoading(false);
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleSendWhatsAppReminder = (item: ReminderPatient) => {
    const cleanPhone = item.patient.phone.replace(/\D/g, '');
    const message = `*Dr. Baldawa's Dwarka Clinic — Jaysingpur*
Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi

Namaskar *${item.patient.name}* ji,
This is a gentle reminder regarding your health follow-up at Dr. Baldawa's Dwarka Clinic (Patient ID: *${item.patient.id}*).

Your subsidized follow-up consultation rate of *₹100* is valid for *${item.daysRemaining} more day${item.daysRemaining > 1 ? 's' : ''}* (until *${item.validUntil}*).
Visits after this date will be considered renewal at ₹200.

Clinic Timings:
- Morning: 11:00 AM – 2:00 PM
- Evening: 5:00 PM – 8:30 PM

_Wish you good health & speedy recovery!_`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/91${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const filteredReminders = reminders.filter(r => 
    r.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient.phone.includes(searchQuery) ||
    r.patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      
      {/* Top Card with Generous Breathing Room */}
      <div className="bg-[#171C21] rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#C5A028]/15 rounded-xl text-[#C5A028] border border-[#8C701B]/40 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-brand">
                30-Day Follow-Up Reminders
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Patients visited 25–30 days ago eligible for ₹100 follow-up before renewal fee applies
            </p>
          </div>

          <div className="self-start sm:self-auto px-3.5 py-1.5 bg-[#C5A028]/15 border border-[#8C701B]/40 rounded-xl text-xs font-bold text-[#E6D385] flex items-center gap-1.5 shrink-0">
            <Clock className="w-4 h-4 text-[#C5A028]" />
            <span>{reminders.length} Patients Due</span>
          </div>
        </div>

        {/* Search Filter */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone or Patient ID..."
              className="w-full h-11 pl-10 pr-4 bg-[#1A2027] border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:border-[#C5A028] outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Reminder Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm">
          Loading reminder queue...
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="bg-[#171C21] rounded-2xl p-8 border border-slate-800 text-center space-y-2.5 shadow-md">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white font-brand">All Reminders Up To Date</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No patients currently have their 30-day subsidized follow-up expiring in the next 1–5 days.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((item) => (
            <div
              key={item.patient.id}
              className="bg-[#171C21] rounded-xl p-4 sm:p-5 border border-slate-800 hover:border-[#8C701B]/60 shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#E6D385] bg-[#C5A028]/15 px-2 py-0.5 rounded border border-[#8C701B]/40 shrink-0">
                    {item.patient.id}
                  </span>
                  <h3 className="font-bold text-white text-sm sm:text-base truncate font-brand">
                    {item.patient.name}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
                    {item.patient.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Visited: {new Date(item.patient.lastVisitDate).toLocaleDateString('en-IN')} (Day {item.diffDays})
                  </span>
                </div>

                <div className="inline-flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#E6D385] bg-[#C5A028]/15 px-3 py-1 rounded-lg border border-[#8C701B]/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#C5A028] shrink-0" />
                  <span>Subsidized ₹100 Rate expires on: {item.validUntil}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
                  <span className="text-base sm:text-lg font-black text-[#E6D385]">
                    {item.daysRemaining} Day{item.daysRemaining > 1 ? 's' : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReminder(item)}
                  className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-95 shrink-0 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
