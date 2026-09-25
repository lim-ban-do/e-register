import React from 'react';
import {
  getAllPupils,
  getTodayAttendance,
  getScanLogs,
  getSchoolSettings,
} from '../services/storage';
import { User } from '../types';
import {
  ScanLine,
  FileSpreadsheet,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: User;
  onNavigate: (page: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const settings = getSchoolSettings();
  const pupils = getAllPupils().filter(p => p.status === 'ACTIVE');
  const todayAttendance = getTodayAttendance();
  const allLogs = getScanLogs();

  const totalPupils = pupils.length;
  const presentPupils = todayAttendance.filter(a => a.status === 'PRESENT').length;
  const absentPupils = Math.max(0, totalPupils - presentPupils);
  const myScansToday = todayAttendance.filter(a => a.teacherId.includes(currentUser.id) || a.teacherName === currentUser.name).length;

  const recentScans = allLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome & Primary Quick Scan Hero Card */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-blue-500/30">
        {/* Subtle geometric background accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
              Teacher Scanning Terminal
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-blue-100/90 mt-1">
              Ready to record pupil access and verify student credentials at {settings.schoolName}.
            </p>
          </div>

          {/* Big, Prominent Quick Scan Button (Primary Focus of Teacher Dashboard) */}
          <button
            onClick={() => onNavigate('teacher-scan')}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-2 border-blue-400/40 shrink-0"
          >
            <ScanLine className="w-6 h-6 animate-pulse" />
            <div className="text-left">
              <div className="leading-tight">Quick Scan Pupil ID</div>
              <div className="text-[11px] font-normal text-blue-100">
                Launch camera / barcode reader
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3 Core Stats Required by Prompt:
          - Today's total scans
          - Present pupils
          - Absent pupils
      */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's total scans */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold text-neutral-500">Today's Total Scans</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-neutral-900 font-tabular">
            {todayAttendance.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            <span className="font-semibold text-blue-600 font-tabular">{myScansToday}</span> scans by you
          </div>
        </div>

        {/* Present pupils */}
        <div
          onClick={() => onNavigate('teacher-register')}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs hover:border-blue-500 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold text-neutral-500">Present Pupils</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-bold text-blue-950 font-tabular">{presentPupils}</div>
          <div className="text-xs text-blue-600 font-semibold mt-1">
            {totalPupils > 0 ? Math.round((presentPupils / totalPupils) * 100) : 0}% of student body
          </div>
        </div>

        {/* Absent pupils */}
        <div
          onClick={() => onNavigate('teacher-register')}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs hover:border-red-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold text-neutral-500">Absent Pupils</span>
            <XCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-bold text-red-600 font-tabular">{absentPupils}</div>
          <div className="text-xs text-red-500 font-semibold mt-1">
            Awaiting gate entry
          </div>
        </div>
      </div>

      {/* Two Action Buttons Required: View Register & Generate Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('teacher-register')}
          className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:border-blue-900 transition-colors shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-neutral-900">View Daily Register</div>
              <div className="text-xs text-neutral-500">Check present & absent pupils today</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-900 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('teacher-reports')}
          className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:border-blue-900 transition-colors shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-neutral-900">Generate Attendance Report</div>
              <div className="text-xs text-neutral-500">Daily, weekly & monthly summaries</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-900 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Recent Scans */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Recent Gate Scans</h2>
            <p className="text-[11px] text-neutral-500">Latest access verifications recorded</p>
          </div>
          <button
            onClick={() => onNavigate('teacher-scan')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
          >
            <span>Scan Next Pupil</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No scans recorded yet today. Click "Quick Scan Pupil ID" to begin.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentScans.map(log => (
              <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-neutral-50/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs">
                    {log.pupilName ? log.pupilName.charAt(0) : '?'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900">
                      {log.pupilName || log.studentId || log.rawPayload}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {log.studentId || 'No ID'} · {log.scanTime.split(' ')[1] || log.scanTime}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {log.outcome === 'SUCCESS' && (
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Present
                    </span>
                  )}
                  {log.outcome === 'DUPLICATE_PREVENTED' && (
                    <span className="text-xs font-semibold text-amber-600">
                      Already scanned
                    </span>
                  )}
                  {log.outcome === 'INVALID_ID' && (
                    <span className="text-xs font-semibold text-red-600">
                      Invalid ID
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-400 block">{log.teacherName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
