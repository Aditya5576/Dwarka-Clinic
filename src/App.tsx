import React, { useState, useEffect, useCallback } from 'react';
import { type ActiveTab, type UserSession } from './types';
import { db, seedInitialDataIfNeeded } from './services/db';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { CheckIn } from './components/CheckIn';
import { Reminders } from './components/Reminders';
import { Reports } from './components/Reports';
import { Logs } from './components/Logs';
import { SplashScreen } from './components/SplashScreen';

const SESSION_STORAGE_KEY = 'dwarka_reception_session';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('checkin');
  const [pendingRemindersCount, setPendingRemindersCount] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const updateRemindersCount = useCallback(async () => {
    try {
      const allPatients = await db.patients.toArray();
      const nowDate = new Date();
      const nowMidnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
      let count = 0;

      for (const p of allPatients) {
        if (!p.lastVisitDate) continue;
        const lastDate = new Date(p.lastVisitDate);
        if (isNaN(lastDate.getTime())) continue;

        const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
        const elapsedDays = Math.round((nowMidnight - lastMidnight) / 86400000);
        if (elapsedDays >= 25 && elapsedDays <= 30) {
          count++;
        }
      }
      setPendingRemindersCount(count);
    } catch (e) {
      console.error('Error counting reminders:', e);
    }
  }, []);

  // Initialize DB and Seed Data
  useEffect(() => {
    const initApp = async () => {
      try {
        await seedInitialDataIfNeeded();
        await updateRemindersCount();
      } catch (err) {
        console.error('Failed to initialize database:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [session, updateRemindersCount]);

  const handleLoginSuccess = (email: string) => {
    const newSession: UserSession = {
      role: 'reception',
      email,
      isLoggedIn: true
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  // Instant zero-lag tab changer
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Refresh counts in background microtask without blocking tab UI
    setTimeout(updateRemindersCount, 100);
  };

  if (isInitializing && !showSplash) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0F1316] text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#C5A028] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Loading Dwarka Clinic...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}

      {(!session || !session.isLoggedIn) ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0F1316] text-slate-100 font-sans">
          <Navbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={handleLogout}
            pendingRemindersCount={pendingRemindersCount}
          />

          <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-3 pt-2">
            <div key={activeTab} className="animate-fade-in w-full">
              {activeTab === 'checkin' && <CheckIn onCheckInSuccess={updateRemindersCount} />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'logs' && <Logs />}
              {activeTab === 'reminders' && <Reminders />}
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default App;
