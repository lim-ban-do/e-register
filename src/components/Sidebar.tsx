import React from 'react';
import { Role } from '../types';
import { LimbandoLogo } from './LimbandoLogo';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  PlusCircle,
  QrCode,
  ScanLine,
  ClipboardCheck,
  FileSpreadsheet,
  BarChart3,
  History,
  Settings,
  UserCircle,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentPage,
  onNavigate,
  onLogout,
  isOpen,
  onClose,
}) => {
  const adminLinks = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-scan', label: 'Gate Scanner', icon: ScanLine, highlight: true },
    { id: 'admin-teachers', label: 'Teachers', icon: Users },
    { id: 'admin-add-teacher', label: 'Add Teacher', icon: UserPlus },
    { id: 'admin-pupils', label: 'Pupils', icon: GraduationCap },
    { id: 'admin-add-pupil', label: 'Add Pupil', icon: PlusCircle },
    { id: 'admin-id-cards', label: 'Student ID Cards', icon: QrCode },
    { id: 'admin-attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'admin-registers', label: 'Registers', icon: FileSpreadsheet },
    { id: 'admin-reports', label: 'Reports', icon: BarChart3 },
    { id: 'admin-scan-history', label: 'Scan History', icon: History },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'admin-settings', label: 'Settings', icon: Settings },
  ];

  const teacherLinks = [
    { id: 'teacher-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'teacher-scan', label: 'Gate Scanner', icon: ScanLine, highlight: true },
    { id: 'teacher-pupils', label: 'Pupils', icon: GraduationCap },
    { id: 'teacher-register', label: 'Register', icon: FileSpreadsheet },
    { id: 'teacher-reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  const links = role === 'ADMIN' ? adminLinks : teacherLinks;

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-blue-950 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print border-r border-blue-900/60`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <LimbandoLogo size={36} />
            <div>
              <div className="font-bold text-sm text-white tracking-tight leading-tight">
                Limbando School
              </div>
              <div className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold">
                {role === 'ADMIN' ? 'Administrator' : 'Teacher Portal'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isHighlighted = Boolean('highlight' in item && item.highlight);

            return (
              <button
                key={item.id}
                onClick={() => handleLinkClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isHighlighted
                    ? 'bg-blue-900/90 text-amber-300 hover:bg-blue-900 border border-amber-300/40 shadow-xs'
                    : 'text-blue-100/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-amber-300' : ''}`} />
                <span className="truncate">{item.label}</span>
                {isHighlighted && !isActive && (
                  <span className="ml-auto text-[9px] bg-amber-400 text-blue-950 px-1.5 py-0.5 rounded-full font-bold uppercase">
                    Scan
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
