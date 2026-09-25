import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  Play,
  Download,
  X,
  RefreshCw,
  Loader2,
  FileCode,
  HardDrive,
  Info,
  ChevronRight,
} from 'lucide-react';
import { getStoredToken } from '../services/api';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableInfo {
  name: string;
  description: string;
  rowCount: number;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({ isOpen, onClose }) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('pupils');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // SQL Query runner
  const [sqlQuery, setSqlQuery] = useState('SELECT student_id, name, grade, class, status FROM pupils ORDER BY grade DESC, class ASC LIMIT 20;');
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchTables = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch('/api/export/tables', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (err) {
      console.error('Failed to fetch table info:', err);
    }
  };

  const loadTableRecords = async (tableName: string) => {
    setSelectedTable(tableName);
    setLoadingTable(true);
    setQueryError(null);

    const query = `SELECT * FROM ${tableName} LIMIT 50;`;
    setSqlQuery(query);

    try {
      const token = getStoredToken();
      const res = await fetch('/api/export/sql-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sql: query }),
      });

      const data = await res.json();
      if (!res.ok) {
        setQueryError(data.error);
        setTableData([]);
      } else {
        setTableData(data.rows || []);
        setQueryResult(data);
      }
    } catch (err: any) {
      setQueryError(err.message);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleExecuteSql = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sqlQuery.trim()) return;

    setIsExecuting(true);
    setQueryError(null);

    try {
      const token = getStoredToken();
      const res = await fetch('/api/export/sql-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sql: sqlQuery.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setQueryError(data.error);
        setQueryResult(null);
      } else {
        setQueryResult(data);
        setTableData(data.rows || []);
      }
    } catch (err: any) {
      setQueryError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTables();
      loadTableRecords('pupils');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentColumns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-[#0C4A34] to-blue-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-amber-300 border border-white/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Interactive SQLite Database Console</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-blue-950 uppercase">
                  school.db
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Browse tables, inspect raw records, and run read-only SQL queries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/db-file"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-all cursor-pointer"
              title="Download raw SQLite .db file"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-300" />
              <span>Download .db File</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Tables List */}
          <div className="w-full md:w-64 bg-neutral-50 border-r border-neutral-200 p-3 sm:p-4 overflow-y-auto space-y-1.5 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-2">
              Database Tables
            </div>

            {tables.map(t => {
              const active = selectedTable === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => loadTableRecords(t.name)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-[#0C4A34] text-white shadow-xs font-bold'
                      : 'hover:bg-neutral-200/60 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Table className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-300' : 'text-neutral-400'}`} />
                    <span className="text-xs truncate">{t.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      active ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {t.rowCount}
                  </span>
                </button>
              );
            })}

            {/* Storage Info Card */}
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-950">
                <Info className="w-3.5 h-3.5 text-blue-700" />
                <span>Storage Details</span>
              </div>
              <p className="leading-tight text-neutral-600">
                Data persists in <code>data/school.db</code> on the server disk.
              </p>
              <div className="pt-1">
                <a
                  href="/api/export/backup"
                  download
                  className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Export JSON Dump</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Area: SQL Query Box & Table Data Grid */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* SQL Query Bar */}
            <div className="p-3 sm:p-4 border-b border-neutral-200 bg-neutral-50/50 space-y-2">
              <form onSubmit={handleExecuteSql} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={sqlQuery}
                    onChange={e => setSqlQuery(e.target.value)}
                    placeholder="Enter SQL SELECT query (e.g. SELECT * FROM pupils;)"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C4A34] text-neutral-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isExecuting || !sqlQuery.trim()}
                  className="px-4 py-2 bg-[#0C4A34] hover:bg-[#083827] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Run Query</span>
                </button>
              </form>

              {/* Status bar */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                <div className="flex items-center gap-3">
                  <span>
                    Viewing table: <strong className="text-neutral-800">{selectedTable}</strong>
                  </span>
                  {queryResult && (
                    <span>
                      Returned: <strong>{queryResult.rowCount} rows</strong> ({queryResult.durationMs}ms)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => loadTableRecords(selectedTable)}
                  className="text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {queryError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-mono">
                  {queryError}
                </div>
              )}
            </div>

            {/* Table Records Grid */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
              {loadingTable ? (
                <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0C4A34]" />
                  <span className="text-xs text-neutral-500 font-medium">Querying {selectedTable}...</span>
                </div>
              ) : tableData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-neutral-400">
                  <Table className="w-8 h-8 stroke-[1.5] mb-1.5 opacity-50" />
                  <span>No records found or empty table</span>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs divide-y divide-neutral-200">
                    <thead className="bg-neutral-100 text-neutral-700 font-bold sticky top-0">
                      <tr>
                        {currentColumns.map(col => (
                          <th key={col} className="p-2.5 font-mono uppercase text-[10px] tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white font-mono text-[11px]">
                      {tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                          {currentColumns.map(col => {
                            const val = row[col];
                            const isNull = val === null || val === undefined;
                            const isLong = typeof val === 'string' && val.length > 50;
                            return (
                              <td key={col} className="p-2.5 whitespace-nowrap text-neutral-700">
                                {isNull ? (
                                  <span className="text-neutral-300 italic">null</span>
                                ) : isLong ? (
                                  <span title={String(val)}>{String(val).substring(0, 47)}...</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
