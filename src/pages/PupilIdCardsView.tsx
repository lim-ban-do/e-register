import React, { useState } from 'react';
import { getAllPupils, getSchoolSettings } from '../services/storage';
import { PupilIdCard } from '../components/PupilIdCard';
import { Printer, Filter, Search } from 'lucide-react';

export const PupilIdCardsView: React.FC = () => {
  const pupils = getAllPupils();
  const settings = getSchoolSettings();
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const allGrades = Array.from(new Set(pupils.map(p => p.grade))).sort();
  const allClasses = Array.from(new Set(pupils.map(p => p.class.toUpperCase()))).sort();

  const filteredPupils = pupils.filter(p => {
    const q = search.toLowerCase();
    const matchQuery =
      p.name.toLowerCase().includes(q) ||
      p.studentId.toLowerCase().includes(q);

    const matchGrade = gradeFilter === 'ALL' || p.grade === gradeFilter;
    const matchClass = classFilter === 'ALL' || p.class.toUpperCase() === classFilter;

    return matchQuery && matchGrade && matchClass;
  });

  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const handlePrintBatch = () => {
    try {
      window.print();
    } catch (err: any) {
      console.warn('Batch print blocked by sandbox:', err);
      setPrintStatus('Direct batch print was blocked by your browser. You can click "Print ID Card" or "Save Badge" on each student card below.');
      setTimeout(() => setPrintStatus(null), 8000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 no-print shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-blue-950">Student Identification Cards</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Official QR credentials for school entrance scanning and access control.
          </p>
        </div>
        <button
          onClick={handlePrintBatch}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Filtered Cards ({filteredPupils.length})
        </button>
      </div>

      {printStatus && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl no-print">
          {printStatus}
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print shadow-2xs">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Class Filter:</span>
          </div>

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
      </div>

      {/* Print Instructions Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-center justify-between no-print">
        <span>
          Click <strong>Print Card</strong> on any individual card or <strong>Print Filtered Cards</strong> to print a batch on cardstock.
        </span>
        <span className="font-semibold text-blue-900">
          {filteredPupils.length} cards in current view
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
        {filteredPupils.map(pupil => (
          <PupilIdCard key={pupil.id} pupil={pupil} settings={settings} />
        ))}

        {filteredPupils.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-xl border border-neutral-200 text-neutral-500 text-xs">
            No student records found matching the specified filters.
          </div>
        )}
      </div>
    </div>
  );
};
