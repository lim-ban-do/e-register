import React, { useState } from 'react';
import { Pupil } from '../types';
import { getAllPupils, updatePupil, getSchoolSettings } from '../services/storage';
import { PupilIdCard } from '../components/PupilIdCard';
import { Search, Filter, QrCode, Edit2, X, CheckCircle2, Printer } from 'lucide-react';

export const TeacherPupilsView: React.FC = () => {
  const settings = getSchoolSettings();
  const [pupils, setPupils] = useState<Pupil[]>(getAllPupils());
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [selectedPupilForCard, setSelectedPupilForCard] = useState<Pupil | null>(null);
  const [editingPupil, setEditingPupil] = useState<Pupil | null>(null);
  const [editClass, setEditClass] = useState('');
  const [editGrade, setEditGrade] = useState('');

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

  const handleOpenEdit = (p: Pupil) => {
    setEditingPupil(p);
    setEditClass(p.class);
    setEditGrade(p.grade);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPupil) return;
    updatePupil({
      ...editingPupil,
      class: editClass.trim().toUpperCase(),
      grade: editGrade.trim(),
    });
    setEditingPupil(null);
    setPupils(getAllPupils());
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <h1 className="text-xl font-bold text-blue-950">Pupil Directory</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          View registered school pupils, classroom assignments, and student QR identification.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search pupils by name or student ID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg bg-white font-medium"
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
            className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg bg-white font-medium"
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

      {/* Pupils Grid Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Pupil Name</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">View / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPupils.map(p => (
                <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-blue-950">
                    {p.studentId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full border border-neutral-300 bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.photo ? (
                          <img
                            src={p.photo}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] font-bold text-blue-900">
                            {p.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">Grade {p.grade}</td>
                  <td className="px-4 py-3 text-neutral-700">Class {p.class}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <button
                      onClick={() => setSelectedPupilForCard(p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                      title="View & Print ID Card"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-800" />
                      <span>Print ID</span>
                    </button>

                    {settings.allowTeacherEditPupil && (
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-600 hover:text-blue-900 hover:bg-neutral-100 rounded-md border border-neutral-200 transition-colors cursor-pointer"
                        title="Edit classroom details"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Class</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pupil ID Card Preview Modal */}
      {selectedPupilForCard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 relative print:p-0 print:border-none print:shadow-none print:max-w-none">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4 no-print">
              <div>
                <h3 className="text-sm font-bold text-blue-950">
                  Student Identification Card
                </h3>
                <p className="text-[11px] text-neutral-500">Official QR credential & printing</p>
              </div>
              <button
                onClick={() => setSelectedPupilForCard(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <PupilIdCard pupil={selectedPupilForCard} settings={settings} />

            <div className="mt-4 pt-3 border-t border-neutral-200 text-center no-print">
              <button
                onClick={() => setSelectedPupilForCard(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limited Pupil Edit Modal for Teacher */}
      {editingPupil && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-sm font-bold text-blue-950">
                Edit Pupil Classroom ({editingPupil.studentId})
              </h3>
              <button
                onClick={() => setEditingPupil(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-semibold text-neutral-800 mb-3">
              Pupil: {editingPupil.name}
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Grade
                </label>
                <select
                  value={editGrade}
                  onChange={e => setEditGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Class Section
                </label>
                <select
                  value={editClass}
                  onChange={e => setEditClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                  <option value="D">Class D</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingPupil(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
