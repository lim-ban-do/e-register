import React, { useState } from 'react';
import { getAllAttendance, getAllTeachers } from '../services/storage';
import { Search, Calendar, CheckCircle2, Download, Printer } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const attendance = getAllAttendance();
  const teachers = getAllTeachers();

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Filter records
  const filteredRecords = attendance.filter(rec => {
    const q = search.toLowerCase();
    const matchQuery =
      rec.pupilName.toLowerCase().includes(q) ||
      rec.studentId.toLowerCase().includes(q) ||
      rec.teacherName.toLowerCase().includes(q);

    const matchDate = !selectedDate || rec.date === selectedDate;
    const matchTeacher = teacherFilter === 'ALL' || rec.teacherId === teacherFilter;
    const matchGrade = gradeFilter === 'ALL' || rec.grade === gradeFilter;
    const matchClass = classFilter === 'ALL' || rec.class.toUpperCase() === classFilter;

    return matchQuery && matchDate && matchTeacher && matchGrade && matchClass;
  });

  const allGrades = Array.from(new Set(attendance.map(a => a.grade))).sort();
  const allClasses = Array.from(new Set(attendance.map(a => a.class.toUpperCase()))).sort();

  const exportCsv = () => {
    const headers = ['Record ID', 'Student ID', 'Pupil Name', 'Grade', 'Class', 'Date', 'Time', 'Teacher', 'Status'];
    const rows = filteredRecords.map(r => [
      r.id,
      r.studentId,
      `"${r.pupilName}"`,
      r.grade,
      r.class,
      r.date,
      r.time,
      `"${r.teacherName}"`,
      r.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Log_${selectedDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 no-print shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-blue-950">Attendance & Access Records</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Log of pupil gate entries verified by teacher QR scans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Log
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap items-center gap-3 no-print shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student or teacher..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-neutral-400 hover:text-neutral-600 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <select
          value={teacherFilter}
          onChange={e => setTeacherFilter(e.target.value)}
          className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
        >
          <option value="ALL">All Teachers</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
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
          className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
        >
          <option value="ALL">All Classes</option>
          {allClasses.map(c => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Pupil Name</th>
                <th className="px-4 py-3">Class & Grade</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Scanned By Teacher</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">
                    {record.id}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-950">
                    {record.studentId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {record.pupilName}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    Grade {record.grade} · Class {record.class}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600">
                    {record.date}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-neutral-800">
                    {record.time}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 font-medium">
                    {record.teacherName}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      PRESENT
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-neutral-500">
                    No attendance records found matching criteria.
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
