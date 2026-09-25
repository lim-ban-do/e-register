import React, { useState } from 'react';
import { getAllPupils, getAllAttendance, getAllTeachers, getSchoolSettings } from '../services/storage';
import { Calendar, Download, Printer, CheckCircle2, XCircle } from 'lucide-react';

interface RegistersViewProps {
  isTeacher?: boolean;
}

export const RegistersView: React.FC<RegistersViewProps> = ({ isTeacher: _isTeacher = false }) => {
  const settings = getSchoolSettings();
  const pupils = getAllPupils().filter(p => p.status === 'ACTIVE');
  const attendance = getAllAttendance();
  const teachers = getAllTeachers();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  // Filter pupils by grade and class first
  const scopedPupils = pupils.filter(p => {
    const matchGrade = gradeFilter === 'ALL' || p.grade === gradeFilter;
    const matchClass = classFilter === 'ALL' || p.class.toUpperCase() === classFilter;
    return matchGrade && matchClass;
  });

  // Get attendance records for the selected date
  const dayAttendance = attendance.filter(a => a.date === selectedDate);

  // Build the complete register for all scoped pupils
  const registerEntries = scopedPupils.map(pupil => {
    const rec = dayAttendance.find(a => a.studentId.toUpperCase() === pupil.studentId.toUpperCase());
    const isPresent = Boolean(rec && rec.status === 'PRESENT');

    return {
      id: pupil.studentId,
      name: pupil.name,
      class: pupil.class,
      grade: pupil.grade,
      time: rec ? rec.time : '—',
      teacher: rec ? rec.teacherName : '—',
      teacherId: rec ? rec.teacherId : null,
      status: isPresent ? 'Present' : 'Absent',
    };
  });

  // Filter by teacher if specified
  const filteredRegister = registerEntries.filter(entry => {
    if (teacherFilter !== 'ALL' && entry.teacherId !== teacherFilter) {
      return false;
    }
    if (statusFilter !== 'ALL' && entry.status.toUpperCase() !== statusFilter) {
      return false;
    }
    return true;
  });

  // Metrics
  const totalInScope = scopedPupils.length;
  const presentCount = registerEntries.filter(e => e.status === 'Present').length;
  const absentCount = Math.max(0, totalInScope - presentCount);
  const attendancePercentage = totalInScope > 0 ? Math.round((presentCount / totalInScope) * 100) : 0;

  const allGrades = Array.from(new Set(pupils.map(p => p.grade))).sort();
  const allClasses = Array.from(new Set(pupils.map(p => p.class.toUpperCase()))).sort();

  const handleExportCsv = () => {
    const headers = ['Student ID', 'Pupil Name', 'Grade', 'Class', 'Date', 'Scan Time', 'Teacher', 'Status'];
    const rows = filteredRegister.map(r => [
      r.id,
      `"${r.name}"`,
      r.grade,
      r.class,
      selectedDate,
      r.time,
      `"${r.teacher}"`,
      r.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Register_${selectedDate}_Grade${gradeFilter}_Class${classFilter}.csv`);
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
              Daily Roll Call & Access Register
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500">{settings.schoolName}</span>
          </div>
          <h1 className="text-xl font-bold text-blue-950 tracking-tight mt-0.5">
            Official School Register
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Full pupil roster matched against gate scan records for {selectedDate}.
          </p>
        </div>
        <div className="flex items-center gap-2 no-print self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Register
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

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Total Pupils</span>
          <div className="text-2xl font-bold text-neutral-900 font-tabular mt-1">{totalInScope}</div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Enrolled in scope</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Present</span>
          <div className="text-2xl font-bold text-blue-950 font-tabular mt-1">{presentCount}</div>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
            Scanned at access gate
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Absent</span>
          <div className="text-2xl font-bold text-red-600 font-tabular mt-1">{absentCount}</div>
          <span className="text-[11px] text-red-500 font-semibold mt-0.5 block">
            No gate scan recorded
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Attendance Rate</span>
          <div className="text-2xl font-bold text-blue-600 font-tabular mt-1">
            {attendancePercentage}%
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Overall turn-out</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap items-center gap-3 no-print shadow-2xs">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-700">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="h-5 w-px bg-neutral-200 hidden sm:block" />

        {/* Grade Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-700">Grade:</span>
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
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-700">Class:</span>
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
        </div>

        {/* Teacher Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-700">Teacher:</span>
          <select
            value={teacherFilter}
            onChange={e => setTeacherFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
          >
            <option value="ALL">All Scanning Teachers</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs font-semibold text-neutral-700">Status:</span>
          <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                statusFilter === 'ALL' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'
              }`}
            >
              All ({registerEntries.length})
            </button>
            <button
              onClick={() => setStatusFilter('PRESENT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                statusFilter === 'PRESENT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setStatusFilter('ABSENT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                statusFilter === 'ABSENT' ? 'bg-red-600 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>
        </div>
      </div>

      {/* Printable Title Block */}
      <div className="hidden print:block mb-4 text-center border-b pb-3">
        <h2 className="text-lg font-bold uppercase tracking-wider text-blue-950">
          {settings.schoolName}
        </h2>
        <h3 className="text-sm font-semibold text-neutral-700">
          Daily Attendance Register — Date: {selectedDate}
        </h3>
        <div className="text-xs text-neutral-500 mt-1">
          Total Pupils: {totalInScope} · Present: {presentCount} · Absent: {absentCount} · Turnout: {attendancePercentage}%
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-950 text-white border-b border-blue-900 font-semibold">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Verified By</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRegister.map(entry => {
                const isPresent = entry.status === 'Present';
                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isPresent ? 'hover:bg-blue-50/40' : 'bg-red-50/30 hover:bg-red-50/60'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-950">
                      {entry.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {entry.name}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-700">
                      {entry.class}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-700">
                      {entry.grade}
                    </td>
                    <td className="px-4 py-3 font-mono font-tabular text-neutral-600">
                      {entry.time}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {entry.teacher}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                          <XCircle className="w-3 h-3 text-red-600" />
                          Absent
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRegister.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                    No pupils found for the selected register criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
