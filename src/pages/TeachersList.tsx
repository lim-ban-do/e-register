import React, { useState } from 'react';
import { Teacher } from '../types';
import { getAllTeachers, addTeacher, updateTeacher, deleteTeacher } from '../services/storage';
import { TeacherModal } from './TeacherModal';
import { UserPlus, Search, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface TeachersListProps {
  openAddDirectly?: boolean;
}

export const TeachersList: React.FC<TeachersListProps> = ({ openAddDirectly = false }) => {
  const [teachers, setTeachers] = useState<Teacher[]>(getAllTeachers());
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(openAddDirectly);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const refreshTeachers = () => {
    setTeachers(getAllTeachers());
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleSaveTeacher = (data: {
    name: string;
    username: string;
    email: string;
    phone?: string;
    subject?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }) => {
    if (editingTeacher) {
      updateTeacher({
        ...editingTeacher,
        ...data,
      });
    } else {
      addTeacher(data);
    }
    refreshTeachers();
  };

  const handleDelete = (teacher: Teacher) => {
    const confirm = window.confirm(
      `Are you sure you want to remove teacher "${teacher.name}"? This will deactivate their login and scanning access.`
    );
    if (confirm) {
      deleteTeacher(teacher.id);
      refreshTeachers();
    }
  };

  const handleToggleStatus = (teacher: Teacher) => {
    const newStatus = teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateTeacher({
      ...teacher,
      status: newStatus,
    });
    refreshTeachers();
  };

  const filteredTeachers = teachers.filter(t => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.subject && t.subject.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-blue-950">Faculty Teachers Directory</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage teaching staff credentials, access scanner authorization, and accounts.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Teacher
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teacher by name, email, or subject..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Teacher Name</th>
                <th className="px-4 py-3">Username & Email</th>
                <th className="px-4 py-3">Subject / Role</th>
                <th className="px-4 py-3">Total Scans</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredTeachers.map(teacher => {
                const isActive = teacher.status === 'ACTIVE';
                return (
                  <tr key={teacher.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-neutral-900">{teacher.name}</div>
                      {teacher.phone && (
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {teacher.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-xs font-semibold text-blue-900">
                        @{teacher.username}
                      </div>
                      <div className="text-neutral-500 text-[11px]">{teacher.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700">
                      {teacher.subject || 'Class Teacher'}
                    </td>
                    <td className="px-4 py-3.5 font-tabular font-semibold text-neutral-900">
                      {teacher.scanCount || 0} scans
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(teacher)}
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
                            Deactivated
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 text-neutral-500 hover:text-blue-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                        title="Edit teacher"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher)}
                        className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete teacher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-neutral-500">
                    No teachers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <TeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTeacher}
        initialData={editingTeacher}
      />
    </div>
  );
};
