import React, { useState } from 'react';
import {
  getAllPupils,
  getAllTeachers,
  getTodayAttendance,
  getScanLogs,
  getSchoolSettings,
} from '../services/storage';
import { DatabaseViewerModal } from '../components/DatabaseViewerModal';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  ScanLine,
  Database,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const pupils = getAllPupils();
  const teachers = getAllTeachers();
  const todayAttendance = getTodayAttendance();
  const recentLogs = getScanLogs().slice(0, 7);
  const settings = getSchoolSettings();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const totalPupils = pupils.length;
  const totalTeachers = teachers.length;
  const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;
  const absentToday = Math.max(0, totalPupils - presentToday);
  const attendanceRate = totalPupils > 0 ? Math.round((presentToday / totalPupils) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Date indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Administrative Overview
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500 font-medium">{settings.schoolName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950 tracking-tight mt-1">
            School Attendance & Access Command
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time pupil entrance tracking, live scanning status, and registers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors cursor-pointer"
            title="Browse SQLite tables and run SQL queries"
          >
            <Database className="w-3.5 h-3.5 text-neutral-700" />
            <span>Database Console</span>
          </button>
          <button
            onClick={() => onNavigate('admin-scan')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0C4A34] hover:bg-[#083827] rounded-lg transition-colors cursor-pointer shadow-xs border border-amber-300/30"
          >
            <ScanLine className="w-3.5 h-3.5 text-amber-300" />
            <span>Open Gate Scanner</span>
          </button>
          <button
            onClick={() => onNavigate('admin-add-pupil')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Pupil
          </button>
          <button
            onClick={() => onNavigate('admin-add-teacher')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-700" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* 6 Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Pupils */}
        <div
          onClick={() => onNavigate('admin-pupils')}
          className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold text-neutral-500">Total Pupils</span>
            <GraduationCap className="w-4 h-4 text-blue-900 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-tabular">{totalPupils}</div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>Enrolled pupils</span>
          </div>
        </div>

        {/* Total Teachers */}
        <div
          onClick={() => onNavigate('admin-teachers')}
          className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold text-neutral-500">Total Teachers</span>
            <Users className="w-4 h-4 text-blue-900 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-tabular">{totalTeachers}</div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>Staff members</span>
          </div>
        </div>

        {/* Today's Attendance Scans */}
        <div
          onClick={() => onNavigate('admin-attendance')}
          className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold text-neutral-500">Today's Scans</span>
            <Clock className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-tabular">
            {todayAttendance.length}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Recorded today</div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('admin-registers')}
          className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold text-neutral-500">Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-blue-950 font-tabular">{presentToday}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">{attendanceRate}% rate</div>
        </div>

        {/* Absent Today */}
        <div
          onClick={() => onNavigate('admin-registers')}
          className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold text-neutral-500">Absent Today</span>
            <XCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-tabular">{absentToday}</div>
          <div className="text-[11px] text-red-500 font-medium mt-1">Not yet scanned</div>
        </div>

        {/* Overall Health Card */}
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-[11px] font-semibold text-blue-900">System Status</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-blue-950">ONLINE</div>
          <div className="text-[11px] text-blue-700 mt-1">Gate scanners active</div>
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('admin-id-cards')}
          className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl hover:border-blue-500 transition-colors text-left group cursor-pointer shadow-2xs"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-900">Student ID Cards</div>
            <div className="text-[10px] text-neutral-500">View & print QR cards</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('admin-registers')}
          className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl hover:border-blue-500 transition-colors text-left group cursor-pointer shadow-2xs"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-900">Daily Registers</div>
            <div className="text-[10px] text-neutral-500">Present & absent lists</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('admin-reports')}
          className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl hover:border-blue-500 transition-colors text-left group cursor-pointer shadow-2xs"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-900">Generate Reports</div>
            <div className="text-[10px] text-neutral-500">Weekly & monthly trends</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('admin-scan-history')}
          className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl hover:border-blue-500 transition-colors text-left group cursor-pointer shadow-2xs"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-900">Scan History</div>
            <div className="text-[10px] text-neutral-500">Audit logs & verification</div>
          </div>
        </button>
      </div>

      {/* Recent Scans Table & Today's Attendance Log */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Recent Scans & Access Activity</h2>
            <p className="text-[11px] text-neutral-500">
              Live updates recorded at school gates and check-ins
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin-scan-history')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <span>Full Scan History</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No scans recorded yet today. Teachers can begin scanning pupil IDs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Pupil Name</th>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Status / Outcome</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-tabular text-neutral-600">
                        {log.scanTime.split(' ')[1] || log.scanTime}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-950">
                        {log.studentId || log.rawPayload}
                      </td>
                      <td className="px-4 py-3 font-semibold text-neutral-900">
                        {log.pupilName || '—'}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{log.teacherName}</td>
                      <td className="px-4 py-3">
                        {log.outcome === 'SUCCESS' && (
                          <span className="text-blue-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Present Recorded
                          </span>
                        )}
                        {log.outcome === 'DUPLICATE_PREVENTED' && (
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Duplicate Prevented
                          </span>
                        )}
                        {log.outcome === 'INVALID_ID' && (
                          <span className="text-red-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Invalid ID
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 text-[11px]">
                        {log.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Viewer Modal */}
      <DatabaseViewerModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};
