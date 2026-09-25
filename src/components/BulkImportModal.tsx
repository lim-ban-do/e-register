import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { apiPupils } from '../services/api';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ParsedRow {
  name: string;
  grade: string;
  class: string;
  studentId?: string;
  valid: boolean;
  error?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: any[] } | null>(null);

  if (!isOpen) return null;

  const parseCsvContent = (text: string) => {
    setCsvText(text);
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Check if first line is header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('name') || firstLineLower.includes('grade');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows: ParsedRow[] = dataLines.map((line, idx) => {
      // Split by comma or semicolon or tab
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      const name = parts[0] || '';
      const grade = parts[1] || '';
      const pupilClass = (parts[2] || 'A').toUpperCase();
      const studentId = parts[3] || undefined;

      const valid = Boolean(name && grade);
      const error = !name ? 'Missing pupil name' : !grade ? 'Missing grade level' : undefined;

      return {
        name,
        grade,
        class: pupilClass,
        studentId,
        valid,
        error,
      };
    });

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) parseCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sample = `Full Name,Grade Level,Class Section,Student ID (Optional)
Moses Musonda,10,A,
Grace Chileshe,11,B,
Lubasi Mwiya,12,A,
Chipo Phiri,10,B,
Blessing Mwamba,11,A,
Taonga Tembo,12,B,`;
    parseCsvContent(sample);
  };

  const handleExecuteImport = async () => {
    const validOnes = parsedRows.filter(r => r.valid);
    if (validOnes.length === 0) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      const res = await apiPupils.bulkImport(
        validOnes.map(r => ({
          name: r.name,
          grade: r.grade,
          class: r.class,
          studentId: r.studentId,
        }))
      );

      setImportResult({ imported: res.importedCount, errors: res.errors });
      onImportSuccess();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0C4A34] text-white">
              <Upload className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Bulk Pupil Import Wizard</h2>
              <p className="text-xs text-neutral-500">Admit cohorts of pupils from CSV or spreadsheet data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {importResult ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-[#0C4A34] mx-auto" />
              <h3 className="text-base font-bold text-emerald-950">Bulk Admission Complete!</h3>
              <p className="text-xs text-emerald-800">
                Successfully admitted <strong>{importResult.imported}</strong> pupils into the school database.
                Student IDs and biometric QR credentials were automatically generated.
              </p>
              {importResult.errors.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg text-left text-xs text-amber-900 border border-amber-200">
                  <div className="font-bold mb-1">Skipped {importResult.errors.length} rows with issues:</div>
                  {importResult.errors.map((e, i) => (
                    <div key={i}>Row {e.row}: {e.reason}</div>
                  ))}
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0C4A34] text-white rounded-lg text-xs font-bold hover:bg-[#083827] cursor-pointer"
                >
                  Done & View Directory
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File upload & template load */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-center">
                <div className="flex items-center gap-3 text-left">
                  <FileText className="w-8 h-8 text-neutral-400" />
                  <div>
                    <div className="text-xs font-bold text-neutral-800">Choose CSV File from Computer</div>
                    <div className="text-[11px] text-neutral-500">Supports comma-separated (Name, Grade, Class)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950 cursor-pointer">
                    Browse File
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
                  >
                    Paste Sample
                  </button>
                </div>
              </div>

              {/* Paste Textbox */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Or Paste CSV Rows (Format: <code>Name, Grade, Class, [StudentId]</code>)
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={e => parseCsvContent(e.target.value)}
                  placeholder="John Banda, 12, A&#10;Mary Phiri, 11, B"
                  className="w-full p-2.5 text-xs font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-neutral-800">
                      Parsed Rows ({parsedRows.length})
                    </span>
                    <div className="flex gap-2 text-[11px]">
                      <span className="text-emerald-700 font-semibold">{validCount} Ready</span>
                      {invalidCount > 0 && <span className="text-red-600 font-semibold">{invalidCount} Invalid</span>}
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-100 text-neutral-600 font-semibold">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Grade</th>
                          <th className="p-2">Class</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className={r.valid ? 'hover:bg-neutral-50' : 'bg-red-50/50'}>
                            <td className="p-2 font-medium">{r.name || '—'}</td>
                            <td className="p-2">{r.grade || '—'}</td>
                            <td className="p-2">{r.class || '—'}</td>
                            <td className="p-2">
                              {r.valid ? (
                                <span className="text-emerald-700 text-[10px] font-bold">Valid</span>
                              ) : (
                                <span className="text-red-600 text-[10px] font-bold">{r.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {validCount > 0 ? `${validCount} pupils will be admitted` : 'Enter or upload CSV data'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/60 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={validCount === 0 || isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0C4A34] hover:bg-[#083827] rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Admitting Cohort...</span>
                  </>
                ) : (
                  <>
                    <span>Admit {validCount} Pupils</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
