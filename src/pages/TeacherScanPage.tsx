import React, { useState, useCallback, useRef } from 'react';
import { User, ProcessScanResult, ScanMethod } from '../types';
import { processPupilScan, getSchoolSettings } from '../services/storage';
import { playSuccessChime, playWarningBeep, playErrorBuzz } from '../services/sound';
import { CameraScanner } from '../components/CameraScanner';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ScanLine,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  ScanFace,
  QrCode,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface TeacherScanPageProps {
  currentUser: User;
  onNavigateToRegister: () => void;
}

export const TeacherScanPage: React.FC<TeacherScanPageProps> = ({
  currentUser,
  onNavigateToRegister,
}) => {
  const settings = getSchoolSettings();
  const [scanResult, setScanResult] = useState<ProcessScanResult | null>(null);
  const [isScannerPaused, setIsScannerPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(settings.audioFeedbackEnabled);
  const [, setSessionScans] = useState<ProcessScanResult[]>([]);
  const lastScanTimestamp = useRef<number>(0);

  const handleScanDetected = useCallback(
    (
      decodedText: string,
      metadata?: {
        method: ScanMethod;
        confidence?: number;
        faceSnapshot?: string;
      }
    ) => {
      // Throttle scans: at least 1.8 seconds between processing triggers to give visual feedback
      const now = Date.now();
      if (now - lastScanTimestamp.current < 1800) {
        return;
      }
      lastScanTimestamp.current = now;

      // Temporary pause camera analysis while processing
      setIsScannerPaused(true);

      const result = processPupilScan(
        decodedText,
        {
          id: currentUser.id,
          name: currentUser.name,
        },
        metadata
      );

      setScanResult(result);
      setSessionScans(prev => [result, ...prev.slice(0, 15)]);

      // Audio feedback
      if (soundEnabled) {
        if (result.status === 'SUCCESS') {
          playSuccessChime();
        } else if (result.status === 'DUPLICATE_PREVENTED') {
          playWarningBeep();
        } else {
          playErrorBuzz();
        }
      }

      // Auto-resume camera scanning after 4 seconds if left untouched
      setTimeout(() => {
        setIsScannerPaused(false);
      }, 4000);
    },
    [currentUser, soundEnabled]
  );

  const handleResumeScan = () => {
    setIsScannerPaused(false);
    setScanResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0C4A34] text-white shadow-xs">
            <ScanFace className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-blue-950">
                Gate Access & Pupil Biometric Scanner
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                Face + QR Active
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pupils can check in via <strong>Face Recognition</strong> or by holding their <strong>ID Card QR</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-neutral-100 border-neutral-200 text-neutral-500'
            }`}
            title="Toggle Scan Audio"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-600" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Scan Interaction Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera Scanner */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <CameraScanner onScan={handleScanDetected} paused={isScannerPaused} />
        </div>

        {/* Right Column: Instant Scan Verification Card Display */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          {scanResult ? (
            <div
              className={`rounded-2xl border-2 p-5 shadow-lg transition-all animate-in fade-in zoom-in-95 duration-200 ${
                scanResult.status === 'SUCCESS'
                  ? 'bg-blue-50/80 border-[#0C4A34]'
                  : scanResult.status === 'DUPLICATE_PREVENTED'
                  ? 'bg-amber-50/80 border-amber-400'
                  : 'bg-red-50/80 border-red-400'
              }`}
            >
              {/* Scan Status Title */}
              <div className="flex items-center justify-between pb-3 border-b border-black/10">
                <div className="flex items-center gap-2.5">
                  {scanResult.status === 'SUCCESS' && (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-[#0C4A34] shrink-0" />
                      <div>
                        <h2 className="text-base font-extrabold text-blue-950 tracking-wide">
                          PUPIL CHECKED IN
                        </h2>
                        <span className="text-[11px] font-semibold text-emerald-800">
                          Gate Access Verified & Attendance Logged
                        </span>
                      </div>
                    </>
                  )}

                  {scanResult.status === 'DUPLICATE_PREVENTED' && (
                    <>
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                      <div>
                        <h2 className="text-base font-extrabold text-amber-900 tracking-wide">
                          ALREADY CHECKED IN
                        </h2>
                        <span className="text-[11px] font-semibold text-amber-700">
                          Duplicate scan prevented by cooldown
                        </span>
                      </div>
                    </>
                  )}

                  {scanResult.status === 'INVALID_ID' && (
                    <>
                      <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                      <div>
                        <h2 className="text-base font-extrabold text-red-700 tracking-wide">
                          UNRECOGNIZED PUPIL
                        </h2>
                        <span className="text-[11px] font-semibold text-red-600">
                          Record not found in school database
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Scan Method Pill */}
                {scanResult.scanMethod && (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      scanResult.scanMethod === 'FACE_RECOGNITION'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {scanResult.scanMethod === 'FACE_RECOGNITION' ? (
                      <>
                        <ScanFace className="w-3 h-3 text-emerald-700" />
                        <span>Face Match</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-3 h-3 text-blue-700" />
                        <span>ID Card QR</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Pupil Information */}
              {scanResult.pupil ? (
                <div className="py-4 space-y-3">
                  {/* Photo & Name Row */}
                  <div className="flex items-center gap-3.5 bg-white p-3 rounded-xl border border-black/5 shadow-2xs">
                    <div className="w-16 h-18 rounded-xl overflow-hidden bg-neutral-100 border-2 border-[#0C4A34] shrink-0 relative">
                      {scanResult.pupil.photo ? (
                        <img
                          src={scanResult.pupil.photo}
                          alt={scanResult.pupil.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400">
                          {scanResult.pupil.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-[#0C4A34]/90 text-[8px] font-bold text-white text-center py-0.5 uppercase">
                        Pupil
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Verified Student
                      </span>
                      <h3 className="text-base font-extrabold text-neutral-900 truncate">
                        {scanResult.pupil.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold text-[#0C4A34] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {scanResult.pupil.studentId}
                        </span>
                        {scanResult.confidence && scanResult.confidence > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                            {scanResult.confidence}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white/80 p-3 rounded-xl border border-black/5">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                        Grade Level
                      </span>
                      <span className="text-sm font-bold text-neutral-800">
                        Grade {scanResult.pupil.grade}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                        Class Section
                      </span>
                      <span className="text-sm font-bold text-neutral-800">
                        Class {scanResult.pupil.class}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/90 border border-black/5 text-xs text-neutral-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      {scanResult.status === 'SUCCESS'
                        ? `Attendance logged at ${scanResult.scannedAt} by ${currentUser.name}.`
                        : scanResult.message}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-600">
                  <p className="font-semibold text-red-600 mb-1">
                    Unrecognized Face / ID Payload
                  </p>
                  <p className="font-mono text-[11px] bg-white p-2 rounded border border-red-200">
                    {scanResult.message}
                  </p>
                </div>
              )}

              {/* Action: Next Scan / View Register */}
              <div className="pt-3 border-t border-black/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResumeScan}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-[#0C4A34] hover:bg-[#083827] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Next Pupil</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="py-2 px-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-300 transition-colors cursor-pointer"
                >
                  View Register
                </button>
              </div>
            </div>
          ) : (
            /* Standby Card when no scan is active */
            <div className="h-full bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#0C4A34] flex items-center justify-center mb-4 border border-emerald-100">
                <ScanFace className="w-8 h-8 animate-pulse text-[#0C4A34]" />
              </div>
              <h3 className="text-base font-bold text-blue-950">Scanner Active & Waiting</h3>
              <p className="text-xs text-neutral-500 max-w-xs mt-1">
                Pupil can stand in front of the camera for <strong>Face Recognition</strong>, or hold up their <strong>ID Card QR Code</strong>.
              </p>

              <div className="mt-6 flex flex-col gap-2.5 text-left w-full text-xs text-neutral-600 bg-[#F9F9F9] p-3.5 rounded-xl border border-neutral-200">
                <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0C4A34]" />
                  <span>How Pupil Check-In Works:</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-800">1.</span>
                  <span><strong>Without ID:</strong> Pupil looks at camera. System automatically identifies face and logs attendance.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-800">2.</span>
                  <span><strong>With ID Card:</strong> Present physical ID card or badge QR code to instant scanner.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-800">3.</span>
                  <span>System validates cooldown to prevent accidental duplicate entries.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
