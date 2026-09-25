import React from 'react';
import { Role } from '../types';
import { LayoutDashboard, ScanLine, FileSpreadsheet, GraduationCap, UserCircle, QrCode, Menu } from 'lucide-react';

interface MobileNavProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  role,
  currentPage,
  onNavigate,
  onOpenMenu,
}) => {
  if (role === 'TEACHER') {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-2 py-1.5 flex items-center justify-around shadow-lg no-print">
        <button
          onClick={() => onNavigate('teacher-dashboard')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
            currentPage === 'teacher-dashboard' ? 'text-blue-600 font-bold' : 'text-neutral-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('teacher-register')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
            currentPage === 'teacher-register' ? 'text-blue-600 font-bold' : 'text-neutral-500'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Register</span>
        </button>

        {/* Big Prominent Center Scan Button */}
        <button
          onClick={() => onNavigate('teacher-scan')}
          className="relative -top-3 flex flex-col items-center cursor-pointer group"
        >
          <div className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg border-4 border-white group-active:scale-95 transition-all">
            <ScanLine className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-blue-900 mt-0.5">Quick Scan</span>
        </button>

        <button
          onClick={() => onNavigate('teacher-pupils')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
            currentPage === 'teacher-pupils' ? 'text-blue-600 font-bold' : 'text-neutral-500'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Pupils</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
            currentPage === 'profile' ? 'text-blue-600 font-bold' : 'text-neutral-500'
          }`}
        >
          <UserCircle className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>
    );
  }

  // Admin Mobile Nav
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-3 py-1.5 flex items-center justify-around shadow-lg no-print">
      <button
        onClick={() => onNavigate('admin-dashboard')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
          currentPage === 'admin-dashboard' ? 'text-blue-900 font-bold' : 'text-neutral-500'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => onNavigate('admin-pupils')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
          currentPage === 'admin-pupils' || currentPage === 'admin-add-pupil'
            ? 'text-blue-900 font-bold'
            : 'text-neutral-500'
        }`}
      >
        <GraduationCap className="w-4 h-4" />
        <span>Pupils</span>
      </button>

      <button
        onClick={() => onNavigate('admin-id-cards')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
          currentPage === 'admin-id-cards' ? 'text-blue-900 font-bold' : 'text-neutral-500'
        }`}
      >
        <QrCode className="w-4 h-4" />
        <span>ID Cards</span>
      </button>

      <button
        onClick={() => onNavigate('admin-registers')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold cursor-pointer ${
          currentPage === 'admin-registers' ? 'text-blue-900 font-bold' : 'text-neutral-500'
        }`}
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Register</span>
      </button>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-1 p-1 text-[10px] font-semibold text-neutral-500 cursor-pointer"
      >
        <Menu className="w-4 h-4" />
        <span>More</span>
      </button>
    </div>
  );
};
