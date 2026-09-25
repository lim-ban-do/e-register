import React, { useState } from 'react';
import { User } from '../types';
import { updateUser } from '../services/storage';
import { UserCheck, KeyRound, Shield } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  onUserUpdated: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUserUpdated }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
    };

    updateUser(updatedUser);
    onUserUpdated(updatedUser);
    setMessage({ text: 'Profile details saved successfully.', type: 'success' });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 4) {
      setMessage({ text: 'New password must be at least 4 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    // Success simulation
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ text: 'Password has been changed successfully.', type: 'success' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <h1 className="text-xl font-bold text-blue-950">Account Profile & Security</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage your credentials, display name, and password for school system authentication.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 text-xs font-semibold rounded-xl border animate-in fade-in ${
            message.type === 'success'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Account Info */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-neutral-900">Personal Information</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Role Permission
            </label>
            <div className="p-2 text-xs font-bold text-blue-950 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              <span>{currentUser.role === 'ADMIN' ? 'Administrator' : 'Faculty Teacher'}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              System Username
            </label>
            <div className="p-2 text-xs font-mono text-neutral-600 bg-neutral-100 rounded-lg border border-neutral-200">
              {currentUser.username}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Update Profile
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-neutral-900">Change Password</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 4 characters"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
};
