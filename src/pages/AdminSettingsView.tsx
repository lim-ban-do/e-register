import React, { useState } from 'react';
import { getSchoolSettings, updateSchoolSettings, resetDatabase } from '../services/storage';
import { SchoolSettings } from '../types';
import { DatabaseViewerModal } from '../components/DatabaseViewerModal';
import { Save, RefreshCw, School, Clock, Database, HardDrive, Download, ExternalLink } from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSettings>(getSchoolSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    const confirm = window.confirm(
      'Reset system to default seed data? All added records and attendance scans will be reset to factory defaults.'
    );
    if (confirm) {
      resetDatabase();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <h1 className="text-xl font-bold text-blue-950">School System Configuration</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          General institutional parameters for Limbando Private School access and attendance operations.
        </p>
      </div>

      {/* Database Management & Direct Access Card */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0C4A34] text-white">
              <Database className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Database Engine & Direct Access</h2>
              <p className="text-xs text-neutral-500">Persistent SQLite storage in <code>/data/school.db</code></p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0C4A34] hover:bg-[#083827] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Open Database Console</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <a
            href="/api/export/db-file"
            download
            className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-between text-neutral-800 transition-all cursor-pointer font-semibold"
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Download Raw .db File</span>
            </div>
            <Download className="w-3.5 h-3.5 text-neutral-400" />
          </a>

          <a
            href="/api/export/backup"
            download
            className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-between text-neutral-800 transition-all cursor-pointer font-semibold"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Download JSON Backup</span>
            </div>
            <Download className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-blue-50 text-blue-900 text-xs font-semibold rounded-xl border border-blue-200 animate-in fade-in">
          System settings updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-5 shadow-xs">
        {/* School Name */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-blue-600" />
            <span>School Name (Printed on Student ID Cards)</span>
          </label>
          <input
            type="text"
            required
            value={settings.schoolName}
            onChange={e => setSettings({ ...settings, schoolName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* School Motto */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            School Motto
          </label>
          <input
            type="text"
            value={settings.schoolMotto}
            onChange={e => setSettings({ ...settings, schoolMotto: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Academic Year
          </label>
          <input
            type="text"
            value={settings.academicYear}
            onChange={e => setSettings({ ...settings, academicYear: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Duplicate Scan Cooldown */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Duplicate Scan Prevention Cooldown (Seconds)</span>
          </label>
          <input
            type="number"
            min="10"
            max="3600"
            value={settings.duplicateScanCooldownSeconds}
            onChange={e =>
              setSettings({
                ...settings,
                duplicateScanCooldownSeconds: parseInt(e.target.value, 10) || 60,
              })
            }
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
          <p className="text-[11px] text-neutral-500 mt-1">
            Prevents accidental rapid double-scans of the same pupil within this window.
          </p>
        </div>

        {/* Toggles */}
        <div className="pt-2 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.audioFeedbackEnabled}
              onChange={e => setSettings({ ...settings, audioFeedbackEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
            />
            <div>
              <span className="text-xs font-semibold text-neutral-800 block">
                Enable Audio Chimes on Scan
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Synthesizes success chimes and error tones via Web Audio API.
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowTeacherEditPupil}
              onChange={e => setSettings({ ...settings, allowTeacherEditPupil: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
            />
            <div>
              <span className="text-xs font-semibold text-neutral-800 block">
                Allow Teachers to Update Pupil Class / Grade
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Permits teachers to adjust classroom section assignments if students move class.
              </span>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-neutral-200 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save School Settings</span>
          </button>
        </div>
      </form>

      {/* Factory Reset Section */}
      <div className="bg-white p-6 rounded-2xl border border-red-200 space-y-3 shadow-xs">
        <div className="text-xs font-bold text-red-700 uppercase tracking-wider">
          Danger Zone
        </div>
        <div className="text-xs text-neutral-600">
          Reset all local records, teachers, pupils, and attendance history back to initial demonstration seed data.
        </div>
        <button
          type="button"
          onClick={handleResetData}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Demo Database
        </button>
      </div>

      {/* Database Viewer & Query Console Modal */}
      <DatabaseViewerModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};
