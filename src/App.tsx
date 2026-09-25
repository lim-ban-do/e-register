import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getSchoolSettings,
  getAllUsers,
  updateUser,
} from './services/storage';
import { apiAuth, apiScans, subscribeToRealtimeEvents } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeachersList } from './pages/TeachersList';
import { PupilsList } from './pages/PupilsList';
import { PupilIdCardsView } from './pages/PupilIdCardsView';
import { AttendanceView } from './pages/AttendanceView';
import { RegistersView } from './pages/RegistersView';
import { ReportsView } from './pages/ReportsView';
import { ScanHistoryView } from './pages/ScanHistoryView';
import { AdminSettingsView } from './pages/AdminSettingsView';
import { ProfileView } from './pages/ProfileView';

import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherScanPage } from './pages/TeacherScanPage';
import { TeacherPupilsView } from './pages/TeacherPupilsView';

export default function App() {
  const [currentUser, setUser] = useState<User | null>(() => getCurrentUser());
  const [currentPage, setCurrentPage] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(() => getSchoolSettings());
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  // 1. Recover session from JWT token on page reload
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const user = await apiAuth.getMe();
        if (user) {
          setUser(user);
          setCurrentUser(user);
        }
      } catch (err) {
        // Token expired or server unreachable, fallback to cached user
      }
    };
    recoverSession();
  }, []);

  // 2. Real-time Multi-Device EventSource (SSE) Sync
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToRealtimeEvents(event => {
      if (event.type === 'attendance_scan') {
        const pupilName = event.payload?.pupil?.name || 'A pupil';
        const method = event.payload?.scanMethod === 'FACE_RECOGNITION' ? 'Face Match' : 'ID QR';
        setRealtimeNotice(`Live Entrance: ${pupilName} checked in via ${method}`);
        setTimeout(() => setRealtimeNotice(null), 4500);
      } else if (event.type === 'attendance_updated') {
        setRealtimeNotice('Attendance register updated across school network.');
        setTimeout(() => setRealtimeNotice(null), 3000);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Offline Resilience: Auto-flush offline scan queue when back online
  useEffect(() => {
    const handleOnline = async () => {
      try {
        const res = await apiScans.syncOfflineQueue();
        if (res.synced > 0) {
          setRealtimeNotice(`Reconnected! Synced ${res.synced} offline gate scans to server.`);
          setTimeout(() => setRealtimeNotice(null), 5000);
        }
      } catch (err) {
        console.warn('Auto offline sync failed:', err);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Initialize starting page according to role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') {
        if (!currentPage || currentPage.startsWith('teacher-')) {
          setCurrentPage('admin-dashboard');
        }
      } else {
        if (!currentPage || currentPage.startsWith('admin-')) {
          setCurrentPage('teacher-dashboard');
        }
      }
    }
  }, [currentUser]);

  // Sync settings periodically or on focus
  useEffect(() => {
    const sync = () => setSettings(getSchoolSettings());
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    setCurrentUser(user);
    if (user.role === 'ADMIN') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('teacher-dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
    setCurrentPage('');
    setSidebarOpen(false);
  };

  const handleUserUpdated = (updated: User) => {
    setUser(updated);
    setCurrentUser(updated);
  };

  // Quick switch role (demo convenience)
  const handleQuickSwitchRole = (targetRole: Role) => {
    if (!currentUser) return;
    if (currentUser.role === targetRole) return;

    const all = getAllUsers();
    const candidate = all.find(u => u.role === targetRole && u.status === 'ACTIVE');
    if (candidate) {
      setUser(candidate);
      setCurrentUser(candidate);
      setCurrentPage(targetRole === 'ADMIN' ? 'admin-dashboard' : 'teacher-dashboard');
    }
  };

  // Role-Based Authorization Guard
  const handleNavigate = (page: string) => {
    if (!currentUser) return;

    // A Teacher must NEVER be able to access Admin pages
    if (currentUser.role === 'TEACHER' && page.startsWith('admin-')) {
      setCurrentPage('teacher-dashboard');
      return;
    }

    setCurrentPage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-[#222222]">
      {/* Sidebar Navigation */}
      <Sidebar
        role={currentUser.role}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          settings={settings}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onQuickSwitchRole={handleQuickSwitchRole}
        />

        {/* Live Multi-Device Real-Time Entrance Toast */}
        {realtimeNotice && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-3 p-3 bg-blue-950 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg border border-amber-300/30 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{realtimeNotice}</span>
            </div>
            <button
              onClick={() => setRealtimeNotice(null)}
              className="text-blue-300 hover:text-white text-[11px] px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {/* ADMIN PAGES */}
          {currentUser.role === 'ADMIN' && (
            <>
              {currentPage === 'admin-dashboard' && (
                <AdminDashboard onNavigate={handleNavigate} />
              )}
              {currentPage === 'admin-scan' && (
                <TeacherScanPage
                  currentUser={currentUser}
                  onNavigateToRegister={() => handleNavigate('admin-registers')}
                />
              )}
              {currentPage === 'admin-teachers' && <TeachersList />}
              {currentPage === 'admin-add-teacher' && <TeachersList />}
              {currentPage === 'admin-pupils' && (
                <PupilsList onNavigateToCards={() => handleNavigate('admin-id-cards')} />
              )}
              {currentPage === 'admin-add-pupil' && (
                <PupilsList
                  onNavigateToCards={() => handleNavigate('admin-id-cards')}
                  openAddDirectly={true}
                />
              )}
              {currentPage === 'admin-id-cards' && <PupilIdCardsView />}
              {currentPage === 'admin-attendance' && <AttendanceView />}
              {currentPage === 'admin-registers' && <RegistersView isTeacher={false} />}
              {currentPage === 'admin-reports' && <ReportsView isTeacher={false} />}
              {currentPage === 'admin-scan-history' && <ScanHistoryView />}
              {currentPage === 'admin-settings' && <AdminSettingsView />}
              {currentPage === 'profile' && (
                <ProfileView currentUser={currentUser} onUserUpdated={handleUserUpdated} />
              )}
            </>
          )}

          {/* TEACHER PAGES */}
          {currentUser.role === 'TEACHER' && (
            <>
              {currentPage === 'teacher-dashboard' && (
                <TeacherDashboard currentUser={currentUser} onNavigate={handleNavigate} />
              )}
              {currentPage === 'teacher-scan' && (
                <TeacherScanPage
                  currentUser={currentUser}
                  onNavigateToRegister={() => handleNavigate('teacher-register')}
                />
              )}
              {currentPage === 'teacher-pupils' && <TeacherPupilsView />}
              {currentPage === 'teacher-register' && <RegistersView isTeacher={true} />}
              {currentPage === 'teacher-reports' && <ReportsView isTeacher={true} />}
              {currentPage === 'profile' && (
                <ProfileView currentUser={currentUser} onUserUpdated={handleUserUpdated} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        role={currentUser.role}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenMenu={() => setSidebarOpen(true)}
      />
    </div>
  );
}
