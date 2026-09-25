import React, { useState } from 'react';
import { getAllPupils, getAllAttendance, getSchoolSettings } from '../services/storage';
import { apiExport } from '../services/api';
import { AiAttendanceAssistant } from '../components/AiAttendanceAssistant';
import { Calendar, Filter, Printer, Download, TrendingUp, CheckCircle, XCircle, Database } from 'lucide-react';

interface ReportsViewProps {
  isTeacher?: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ isTeacher: _isTeacher = false }) => {
  const settings = getSchoolSettings();
  const pupils = getAllPupils().filter(p => p.status === 'ACTIVE');
  const allAttendance = getAllAttendance();

  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Filter pupils
  const scopedPupils = pupils.filter(p => {
    const matchGrade = gradeFilter === 'ALL' || p.grade === gradeFilter;
    const matchClass = classFilter === 'ALL' || p.class.toUpperCase() === classFilter;
    return matchGrade && matchClass;
  });

  // Calculate dates based on reportType
  const getRelevantDates = (): string[] => {
    const baseDate = new Date(selectedDate);
    if (isNaN(baseDate.getTime())) return [todayStr];

    if (reportType === 'DAILY') {
      return [selectedDate];
    } else if (reportType === 'WEEKLY') {
      // 7 days ending at selectedDate
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    } else {
      // MONTHLY: all days of the month of selectedDate
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dates: string[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    }
  };

  const datesInRange = getRelevantDates();

  // Aggregate attendance stats
  const totalPupils = scopedPupils.length;

  // Calculate attendance per pupil across range
  const pupilStats = scopedPupils.map(p => {
    const pupilScans = allAttendance.filter(
      a => a.studentId.toUpperCase() === p.studentId.toUpperCase() && datesInRange.includes(a.date)
    );
    const presentDays = new Set(pupilScans.map(s => s.date)).size;
    const totalDays = datesInRange.length;
    const absentDays = Math.max(0, totalDays - presentDays);
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      studentId: p.studentId,
      name: p.name,
      grade: p.grade,
      class: p.class,
      presentDays,
      absentDays,
      rate,
      scans: pupilScans,
    };
  });

  // Daily turnout breakdown
  const dailyBreakdown = datesInRange.map(d => {
    const dayScans = allAttendance.filter(
      a => a.date === d && scopedPupils.some(p => p.studentId.toUpperCase() === a.studentId.toUpperCase())
    );
    const presentCount = new Set(dayScans.map(s => s.studentId.toUpperCase())).size;
    const absentCount = Math.max(0, totalPupils - presentCount);
    const rate = totalPupils > 0 ? Math.round((presentCount / totalPupils) * 100) : 0;
    return {
      date: d,
      presentCount,
      absentCount,
      rate,
    };
  });

  // Aggregate summary
  const totalPossibleAttendances = totalPupils * datesInRange.length;
  const totalActualPresent = pupilStats.reduce((sum, p) => sum + p.presentDays, 0);
  const totalActualAbsent = totalPossibleAttendances - totalActualPresent;
  const overallAttendanceRate =
    totalPossibleAttendances > 0 ? Math.round((totalActualPresent / totalPossibleAttendances) * 100) : 0;

  const allGrades = Array.from(new Set(pupils.map(p => p.grade))).sort();
  const allClasses = Array.from(new Set(pupils.map(p => p.class.toUpperCase()))).sort();

  const handleExportCsv = () => {
    const headers = [
      'Student ID',
      'Pupil Name',
      'Grade',
      'Class',
      `Days Present (out of ${datesInRange.length})`,
      'Days Absent',
      'Attendance Rate %',
    ];
    const rows = pupilStats.map(p => [
      p.studentId,
      `"${p.name}"`,
      p.grade,
      p.class,
      p.presentDays,
      p.absentDays,
      `${p.rate}%`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_Attendance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Institutional Reporting
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500">{settings.schoolName}</span>
          </div>
          <h1 className="text-xl font-bold text-blue-950 tracking-tight mt-0.5">
            Attendance & Access Reports
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generate printable roll call summaries, weekly attendance cycles, and monthly registers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print self-start sm:self-auto">
          {!_isTeacher && (
            <a
              href={apiExport.downloadBackupUrl()}
              download
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
              title="Download complete SQLite database JSON backup"
            >
              <Database className="w-3.5 h-3.5 text-amber-700" />
              <span>Full System Backup (JSON)</span>
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Gemini AI Attendance Intelligence Module */}
      {!_isTeacher && (
        <div className="no-print">
          <AiAttendanceAssistant />
        </div>
      )}

      {/* Report Period Selector Tabs */}
      <div className="bg-white p-2 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 no-print shadow-2xs">
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button
            onClick={() => setReportType('DAILY')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              reportType === 'DAILY' ? 'bg-white text-blue-950 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Daily Attendance Report
          </button>
          <button
            onClick={() => setReportType('WEEKLY')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              reportType === 'WEEKLY' ? 'bg-white text-blue-950 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Weekly Report (7 Days)
          </button>
          <button
            onClick={() => setReportType('MONTHLY')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              reportType === 'MONTHLY' ? 'bg-white text-blue-950 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Monthly Report (Full Month)
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 pr-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-700">Reference Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono border border-neutral-300 rounded-lg bg-white"
          />
        </div>
      </div>

      {/* Filtering Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap items-center gap-3 no-print shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span>Filters:</span>
        </div>

        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
        >
          <option value="ALL">All Grades</option>
          {allGrades.map(g => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>

        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
        >
          <option value="ALL">All Classes</option>
          {allClasses.map(c => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>

        <div className="text-xs text-neutral-500 ml-auto">
          Scope: <strong>{scopedPupils.length} pupils</strong> across <strong>{datesInRange.length} day(s)</strong>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Total Pupils</span>
          <div className="text-2xl font-bold text-neutral-900 font-tabular mt-1">{totalPupils}</div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Active enrollment</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">
            {reportType === 'DAILY' ? 'Present' : 'Total Present Instances'}
          </span>
          <div className="text-2xl font-bold text-blue-950 font-tabular mt-1">
            {totalActualPresent}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
            Successful gate scans
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">
            {reportType === 'DAILY' ? 'Absent' : 'Total Absent Instances'}
          </span>
          <div className="text-2xl font-bold text-red-600 font-tabular mt-1">
            {totalActualAbsent}
          </div>
          <span className="text-[11px] text-red-500 font-semibold mt-0.5 block">
            Unrecorded days
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Attendance %</span>
          <div className="text-2xl font-bold text-blue-600 font-tabular mt-1">
            {overallAttendanceRate}%
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Average turnout rate</span>
        </div>
      </div>

      {/* Daily Progress Breakdown Bar (For Weekly and Monthly views) */}
      {reportType !== 'DAILY' && (
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Turnout Distribution Across Period</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {dailyBreakdown.map(day => (
              <div
                key={day.date}
                className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between text-center"
              >
                <div className="text-[10px] font-mono text-neutral-500">{day.date}</div>
                <div className="my-1.5">
                  <span className="text-sm font-bold font-tabular text-blue-950 block">
                    {day.rate}%
                  </span>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${day.rate}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-neutral-500">
                  <span className="text-blue-700 font-semibold">{day.presentCount}P</span> ·{' '}
                  <span className="text-red-600 font-semibold">{day.absentCount}A</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pupil-by-Pupil Breakdown Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              {reportType === 'DAILY' ? 'Pupil Daily Attendance Status' : 'Pupil Attendance Breakdown'}
            </h2>
            <p className="text-[11px] text-neutral-500">
              Report for {datesInRange[0]} {datesInRange.length > 1 ? `to ${datesInRange[datesInRange.length - 1]}` : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Pupil Name</th>
                <th className="px-4 py-3">Grade & Class</th>
                {reportType === 'DAILY' ? (
                  <>
                    <th className="px-4 py-3">Scan Time</th>
                    <th className="px-4 py-3">Teacher</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Days Present</th>
                    <th className="px-4 py-3">Days Absent</th>
                    <th className="px-4 py-3 text-right">Attendance Rate</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {pupilStats.map(pupil => {
                const isPresentDaily = pupil.presentDays > 0;
                const dailyScan = pupil.scans[0];

                return (
                  <tr key={pupil.studentId} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-950">
                      {pupil.studentId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {pupil.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      Grade {pupil.grade} · Class {pupil.class}
                    </td>

                    {reportType === 'DAILY' ? (
                      <>
                        <td className="px-4 py-3 font-mono text-neutral-600">
                          {dailyScan ? dailyScan.time : '—'}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {dailyScan ? dailyScan.teacherName : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isPresentDaily ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-3 h-3 text-red-600" />
                              Absent
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-900">
                          {pupil.presentDays} / {datesInRange.length}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-600">
                          {pupil.absentDays}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              pupil.rate >= 80
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : pupil.rate >= 50
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {pupil.rate}%
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
