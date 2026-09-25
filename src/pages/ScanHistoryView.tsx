import React, { useState } from 'react';
import { getScanLogs } from '../services/storage';
import { Search, Filter, CheckCircle2, AlertTriangle, XCircle, Download } from 'lucide-react';

export const ScanHistoryView: React.FC = () => {
  const logs = getScanLogs();
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const matchQuery =
      (log.pupilName && log.pupilName.toLowerCase().includes(q)) ||
      (log.studentId && log.studentId.toLowerCase().includes(q)) ||
      log.rawPayload.toLowerCase().includes(q) ||
      log.teacherName.toLowerCase().includes(q) ||
      log.message.toLowerCase().includes(q);

    const matchOutcome = outcomeFilter === 'ALL' || log.outcome === outcomeFilter;
    return matchQuery && matchOutcome;
  });

  const exportLogsCsv = () => {
    const headers = ['Scan ID', 'Timestamp', 'Raw Payload', 'Student ID', 'Pupil Name', 'Teacher', 'Outcome', 'System Log Message'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.scanTime,
      `"${l.rawPayload}"`,
      l.studentId || '',
      `"${l.pupilName || ''}"`,
      `"${l.teacherName}"`,
      l.outcome,
      `"${l.message}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Scan_Audit_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-blue-950">Scan Verification History</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Immutable log of all QR scans, verification successes, duplicate preventions, and invalid IDs.
          </p>
        </div>
        <button
          onClick={exportLogsCsv}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Scan Logs
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student, payload, teacher, or details..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-700">Outcome:</span>
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value)}
            className="px-2.5 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Success Only</option>
            <option value="DUPLICATE_PREVENTED">Duplicates Blocked</option>
            <option value="INVALID_ID">Invalid Scans</option>
          </select>
        </div>
      </div>

      {/* Scan Logs Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Payload / Student ID</th>
                <th className="px-4 py-3">Pupil Name</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-tabular text-neutral-600">
                    {log.scanTime}
                  </td>
                  <td className="px-4 py-3">
                    {log.scanMethod === 'FACE_RECOGNITION' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Face Biometric
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        ID Card QR
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-950">
                    {log.studentId || log.rawPayload}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {log.pupilName || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 font-medium">
                    {log.teacherName}
                  </td>
                  <td className="px-4 py-3">
                    {log.outcome === 'SUCCESS' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        SUCCESS
                      </span>
                    )}
                    {log.outcome === 'DUPLICATE_PREVENTED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        DUPLICATE
                      </span>
                    )}
                    {log.outcome === 'INVALID_ID' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3 h-3 text-red-500" />
                        INVALID
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 text-[11px]">
                    {log.message}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                    No scan logs found matching criteria.
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
