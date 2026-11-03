import React, { useState, useEffect } from 'react';
import { type ActiveTab, type UserSession } from './types';
import { db, seedInitialDataIfNeeded } from './services/db';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { CheckIn } from './components/CheckIn';
import { Reminders } from './components/Reminders';
import { Reports } from './components/Reports';
import { Logs } from './components/Logs';

const SESSION_STORAGE_KEY = 'dwarka_reception_session';

export const App: React.FC = () => {
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
  }, [session]);

  const updateRemindersCount = async () => {
    try {
      const allPatients = await db.patients.toArray();
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      let count = 0;

      for (const p of allPatients) {
        if (!p.lastVisitDate) continue;
        const diffDays = Math.floor((now - new Date(p.lastVisitDate).getTime()) / dayMs);
        if (diffDays >= 25 && diffDays <= 30) {
          count++;
        }
      }
      setPendingRemindersCount(count);
    } catch (e) {
      console.error('Error counting reminders:', e);
    }
  };

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

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-clinic-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Loading Dwarka Clinic Portal...</p>
        </div>
      </div>
    );
  }

  if (!session || !session.isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          updateRemindersCount();
        }}
        onLogout={handleLogout}
        pendingRemindersCount={pendingRemindersCount}
      />

      <main className="flex-1">
        {activeTab === 'checkin' && <CheckIn />}
        {activeTab === 'reminders' && <Reminders />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'logs' && <Logs />}
      </main>
    </div>
  );
};

export default App;

