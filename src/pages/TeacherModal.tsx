import React, { useState } from 'react';
import { Teacher } from '../types';
import { X } from 'lucide-react';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: { name: string; username: string; email: string; phone?: string; subject?: string; status?: 'ACTIVE' | 'INACTIVE' }) => void;
  initialData?: Teacher | null;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData ? initialData.name : '');
  const [username, setUsername] = useState(initialData ? initialData.username : '');
  const [email, setEmail] = useState(initialData ? initialData.email : '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initialData?.status || 'ACTIVE');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      setError('Please fill out Name, Username, and Email.');
      return;
    }
    onSave({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-4">
          <h3 className="text-base font-bold text-blue-950">
            {initialData ? 'Edit Teacher Details' : 'Add New Teacher'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mr. Mwila Tembo"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. mwila"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Subject / Role
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. mwila@oakridge.edu"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+260 97 000 0000"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {initialData && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="ACTIVE">Active (Can log in & scan)</option>
                <option value="INACTIVE">Deactivated (Access revoked)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {initialData ? 'Update Teacher' : 'Create Teacher Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
