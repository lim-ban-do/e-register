import React from 'react';
import { User, SchoolSettings } from '../types';
import { LimbandoLogo } from './LimbandoLogo';
import { LogOut, Shield, GraduationCap, Menu } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  settings: SchoolSettings;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  onQuickSwitchRole?: (role: 'ADMIN' | 'TEACHER') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  onLogout,
  onToggleSidebar,
  onQuickSwitchRole,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 lg:px-6 py-3 flex items-center justify-between no-print shadow-2xs">
      {/* Zone 1: Brand & Sidebar Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <LimbandoLogo size={34} />
          <div>
            <span className="text-sm font-bold text-blue-950 tracking-tight block leading-tight">
              {settings.schoolName}
            </span>
            <span className="text-[11px] text-neutral-500 hidden sm:block">
              Access & Attendance Console
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: School Context & Quick Mode Toggle */}
      <div className="hidden md:flex items-center gap-3">
        <span className="text-xs text-neutral-500 font-medium bg-neutral-100 px-2.5 py-1 rounded-md">
          {settings.academicYear}
        </span>

        {/* Demo Role Switcher helper */}
        {onQuickSwitchRole && (
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
            <button
              onClick={() => onQuickSwitchRole('ADMIN')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                currentUser.role === 'ADMIN'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Shield className="w-3 h-3 text-blue-300" />
              Admin Mode
            </button>
            <button
              onClick={() => onQuickSwitchRole('TEACHER')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                currentUser.role === 'TEACHER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <GraduationCap className="w-3 h-3 text-blue-200" />
              Teacher Mode
            </button>
          </div>
        )}
      </div>

      {/* Zone 3: User Profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-right">
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-neutral-900 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
              {currentUser.role === 'ADMIN' ? 'Administrator' : 'Faculty Teacher'}
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
              currentUser.role === 'ADMIN' ? 'bg-blue-900' : 'bg-blue-600'
            }`}
          >
            {currentUser.name.charAt(0)}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-red-700 bg-neutral-100 hover:bg-red-50 rounded-lg transition-colors border border-neutral-200 cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
