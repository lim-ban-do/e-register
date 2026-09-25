import React, { useState } from 'react';
import { Pupil } from '../types';
import { getAllPupils, addPupil, updatePupil, deletePupil, getSchoolSettings } from '../services/storage';
import { PupilModal } from './PupilModal';
import { PupilIdCard } from '../components/PupilIdCard';
import { BulkImportModal } from '../components/BulkImportModal';
import {
  PlusCircle,
  Search,
  Filter,
  QrCode,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Printer,
  Upload,
} from 'lucide-react';

interface PupilsListProps {
  onNavigateToCards?: () => void;
  openAddDirectly?: boolean;
}

export const PupilsList: React.FC<PupilsListProps> = ({
  onNavigateToCards,
  openAddDirectly = false,
}) => {
  const settings = getSchoolSettings();
  const [pupils, setPupils] = useState<Pupil[]>(getAllPupils());
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(openAddDirectly);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingPupil, setEditingPupil] = useState<Pupil | null>(null);
  const [selectedPupilForCard, setSelectedPupilForCard] = useState<Pupil | null>(null);

  const refreshPupils = () => {
    setPupils(getAllPupils());
  };

  const handleOpenAdd = () => {
    setEditingPupil(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pupil: Pupil) => {
    setEditingPupil(pupil);
    setIsModalOpen(true);
  };

  const handleSavePupil = (data: {
    name: string;
    class: string;
    grade: string;
    status?: 'ACTIVE' | 'INACTIVE';
    photo?: string;
  }) => {
    if (editingPupil) {
      updatePupil({
        ...editingPupil,
        name: data.name,
        class: data.class,
        grade: data.grade,
        status: data.status || editingPupil.status,
        photo: data.photo !== undefined ? data.photo : editingPupil.photo,
      });
    } else {
      const newPupil = addPupil(data);
      setSelectedPupilForCard(newPupil);
    }
    refreshPupils();
  };

  const handleDelete = (pupil: Pupil) => {
    const confirm = window.confirm(
      `Are you sure you want to remove pupil "${pupil.name}" (${pupil.studentId})?`
    );
    if (confirm) {
      deletePupil(pupil.id);
      refreshPupils();
    }
  };

  const handleToggleStatus = (pupil: Pupil) => {
    const newStatus = pupil.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updatePupil({
      ...pupil,
      status: newStatus,
    });
    refreshPupils();
  };

  // Filtering
  const filteredPupils = pupils.filter(p => {
    const q = search.toLowerCase();
    const matchQuery =
      p.name.toLowerCase().includes(q) ||
      p.studentId.toLowerCase().includes(q) ||
      p.class.toLowerCase().includes(q) ||
      p.grade.toLowerCase().includes(q);

    const matchGrade = gradeFilter === 'ALL' || p.grade === gradeFilter;
    const matchClass = classFilter === 'ALL' || p.class.toUpperCase() === classFilter;

    return matchQuery && matchGrade && matchClass;
  });

  const allGrades = Array.from(new Set(pupils.map(p => p.grade))).sort();
  const allClasses = Array.from(new Set(pupils.map(p => p.class.toUpperCase()))).sort();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-blue-950">Pupils & Student ID Directory</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage student registrations, automatic ID assignment, and QR access cards.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onNavigateToCards && (
            <button
              onClick={onNavigateToCards}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Batch ID Cards
            </button>
          )}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            Bulk Import
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Pupil
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or ID (e.g. Kenneth or STU-000001)..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Grade & Class Filters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
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
            className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
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

      {/* Pupils Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Pupil Full Name</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Class Section</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions & ID Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPupils.map(pupil => {
                const isActive = pupil.status === 'ACTIVE';
                return (
                  <tr key={pupil.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-950">
                      {pupil.studentId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full border border-neutral-300 bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {pupil.photo ? (
                            <img
                              src={pupil.photo}
                              alt={pupil.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] font-bold text-blue-900">
                              {pupil.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span>{pupil.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-700">
                      Grade {pupil.grade}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-700">
                      Class {pupil.class}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(pupil)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedPupilForCard(pupil)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                        title="View & Print ID Card"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-800" />
                        <span>Print ID</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(pupil)}
                        className="p-1.5 text-neutral-500 hover:text-blue-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                        title="Edit pupil details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(pupil)}
                        className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete pupil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPupils.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-neutral-500">
                    No pupils found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pupil Add / Edit Modal */}
      <PupilModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePupil}
        initialData={editingPupil}
      />

      {/* Single Pupil Card Viewer Modal */}
      {selectedPupilForCard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 relative print:p-0 print:border-none print:shadow-none print:max-w-none">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4 no-print">
              <div>
                <h3 className="text-sm font-bold text-blue-950">
                  Student Identification Card
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Ready to print, export badge image, or scan gate access
                </p>
              </div>
              <button
                onClick={() => setSelectedPupilForCard(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render Standard Card */}
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
      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportSuccess={() => {
          refreshPupils();
        }}
      />
    </div>
  );
};
