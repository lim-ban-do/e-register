import React, { useEffect, useState, useRef } from 'react';
import { Pupil, SchoolSettings } from '../types';
import { generateQrDataUrl, downloadQrCodeImage } from '../services/qr';
import { printPupilCard, downloadPupilBadgeImage } from '../services/cardPrintService';
import { LimbandoLogo } from './LimbandoLogo';
import { Printer, Download, QrCode, User, ShieldCheck, Sparkles, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface PupilIdCardProps {
  pupil: Pupil;
  settings: SchoolSettings;
  compact?: boolean;
}

export const PupilIdCard: React.FC<PupilIdCardProps> = ({
  pupil,
  settings,
  compact = false,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [cardOrientation, setCardOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isSavingBadge, setIsSavingBadge] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    generateQrDataUrl(pupil.studentId).then(url => {
      if (mounted) setQrUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, [pupil.studentId]);

  const handlePrintCard = async () => {
    setIsPrinting(true);
    setStatusMsg({ type: 'info', text: 'Preparing ID card for printer...' });

    try {
      const result = await printPupilCard(pupil, settings, cardOrientation);
      if (result.fallbackTriggered) {
        setStatusMsg({
          type: 'info',
          text: result.message || 'Printer dialog blocked; downloaded high-resolution badge image.',
        });
      } else if (result.success) {
        setStatusMsg({ type: 'success', text: 'Print dialog opened successfully!' });
      }
    } catch (err: any) {
      console.error('Print card error:', err);
      // Fallback to direct image download
      try {
        await downloadPupilBadgeImage(pupil, settings, cardOrientation);
        setStatusMsg({
          type: 'info',
          text: 'Direct print unavailable in this browser; downloaded printable ID badge.',
        });
      } catch {
        setStatusMsg({ type: 'info', text: 'Could not trigger print. Please use Save Badge.' });
      }
    } finally {
      setIsPrinting(false);
      setTimeout(() => {
        setStatusMsg(null);
      }, 5000);
    }
  };

  const handleSaveBadge = async () => {
    setIsSavingBadge(true);
    try {
      await downloadPupilBadgeImage(pupil, settings, cardOrientation);
      setStatusMsg({ type: 'success', text: 'Printable ID badge image downloaded!' });
    } catch (err) {
      console.error('Save badge error:', err);
      setStatusMsg({ type: 'info', text: 'Failed to generate badge image.' });
    } finally {
      setIsSavingBadge(false);
      setTimeout(() => {
        setStatusMsg(null);
      }, 4000);
    }
  };

  const handleDownloadQr = () => {
    if (qrUrl) {
      downloadQrCodeImage(qrUrl, `QR_${pupil.studentId}_${pupil.name.replace(/\s+/g, '_')}`);
      setStatusMsg({ type: 'success', text: 'QR code downloaded!' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className={`flex flex-col items-center ${compact ? 'w-full' : 'max-w-[420px] w-full mx-auto'}`}>
      {/* Physical ID Card Container */}
      {cardOrientation === 'horizontal' ? (
        /* HORIZONTAL STANDARD CR80 WALLET / POCKET BADGE FORMAT */
        <div
          ref={cardRef}
          id={`id-card-${pupil.studentId}`}
          className="relative w-full max-w-[370px] bg-white border-2 border-[#0C4A34] rounded-[18px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden text-neutral-900 print:shadow-none print:border-2 print-break-inside-avoid select-none transition-all"
          style={{ minHeight: '228px' }}
        >
          {/* Lanyard punch slot simulation at top center */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-1.5 bg-neutral-200/90 rounded-full border border-neutral-300 shadow-inner" />
          </div>

          {/* Official Top Banner */}
          <div className="bg-[#0C4A34] pt-3 pb-2 px-3.5 text-white border-b-2 border-[#EAB308] relative">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LimbandoLogo size={28} className="shrink-0" />
                <div className="text-left">
                  <div className="text-[11.5px] font-black tracking-[0.14em] uppercase text-white leading-tight">
                    {settings.schoolName || 'LIMBANDO PRIVATE SCHOOL'}
                  </div>
                  <div className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-amber-300 leading-none mt-0.5">
                    Official Student Identity Pass
                  </div>
                </div>
              </div>

              <div className="shrink-0 bg-white/10 px-2 py-0.5 rounded-full border border-white/20 text-[8.5px] font-semibold tracking-wider text-white uppercase">
                {settings.academicYear ? settings.academicYear.split(' ')[0] : '2026/27'}
              </div>
            </div>
          </div>

          {/* Card Body - 3 Columns (Photo | Student Details | QR Code) */}
          <div className="p-3 bg-gradient-to-b from-white to-[#F8FAFC]">
            <div className="flex items-center justify-between gap-3">
              {/* 1. Student Portrait Photo */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-[72px] h-[86px] rounded-xl border-2 border-[#0C4A34] bg-neutral-100 overflow-hidden shadow-xs relative flex items-center justify-center">
                  {pupil.photo ? (
                    <img
                      src={pupil.photo}
                      alt={pupil.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 w-full h-full bg-slate-50">
                      <User className="w-7 h-7 text-[#0C4A34]/50 mb-0.5" />
                      <span className="text-[8px] font-bold text-[#0C4A34] uppercase tracking-tighter">
                        Limbando
                      </span>
                    </div>
                  )}
                  {/* Subtle student photo corner seal */}
                  <div className="absolute bottom-0 inset-x-0 bg-[#0C4A34]/90 text-white text-[7.5px] font-extrabold tracking-widest text-center py-0.5 uppercase">
                    PUPIL
                  </div>
                </div>
              </div>

              {/* 2. Pupil Details Info */}
              <div className="flex-1 min-w-0 text-left space-y-1">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                    Pupil Full Name
                  </span>
                  <span className="text-xs font-black text-neutral-900 block leading-tight truncate mt-0.5">
                    {pupil.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                      Grade Level
                    </span>
                    <span className="text-[11px] font-bold text-neutral-800 leading-tight">
                      Grade {pupil.grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                      Class Section
                    </span>
                    <span className="text-[11px] font-bold text-neutral-800 leading-tight">
                      Class {pupil.class}
                    </span>
                  </div>
                </div>

                <div className="pt-0.5 flex items-center justify-between">
                  <div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                      Student ID
                    </span>
                    <span className="font-mono text-[11px] font-black text-[#0C4A34] tracking-wider block">
                      {pupil.studentId}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-tight">
                      {pupil.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Scannable QR Code */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="p-1 bg-white rounded-xl border border-neutral-300 shadow-2xs w-[74px] h-[74px] flex items-center justify-center">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt={`QR code for ${pupil.name}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <QrCode className="w-6 h-6 animate-pulse text-[#0C4A34]" />
                  )}
                </div>
                <span className="text-[7px] font-black uppercase tracking-wider text-[#0C4A34] mt-1">
                  Gate Access
                </span>
              </div>
            </div>
          </div>

          {/* Micro Footer Bar with Motto & Security Notice */}
          <div className="bg-[#0C4A34]/5 px-3 py-1.5 border-t border-[#0C4A34]/15 flex items-center justify-between text-[8px] text-neutral-600">
            <span className="font-semibold text-[#0C4A34]">
              {settings.schoolMotto || 'Knowledge · Discipline · Success'}
            </span>
            <span className="font-mono text-neutral-500 text-[7.5px]">
              Non-Transferable ID
            </span>
          </div>
        </div>
      ) : (
        /* VERTICAL LANYARD BADGE FORMAT */
        <div
          ref={cardRef}
          id={`id-card-vert-${pupil.studentId}`}
          className="relative w-full max-w-[270px] bg-white border-2 border-[#0C4A34] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden text-neutral-900 print:shadow-none print:border-2 print-break-inside-avoid select-none text-center transition-all"
        >
          {/* Lanyard punch slot */}
          <div className="pt-2 pb-1 flex justify-center bg-[#0C4A34]">
            <div className="w-10 h-1.5 bg-neutral-200/90 rounded-full border border-neutral-300 shadow-inner" />
          </div>

          {/* Header */}
          <div className="bg-[#0C4A34] pb-2.5 px-3 text-white border-b-2 border-[#EAB308]">
            <div className="flex justify-center mb-1">
              <LimbandoLogo size={32} />
            </div>
            <h3 className="text-[12px] font-black tracking-[0.14em] uppercase text-white leading-tight">
              {settings.schoolName || 'LIMBANDO PRIVATE SCHOOL'}
            </h3>
            <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-amber-300 mt-0.5">
              STUDENT IDENTITY CARD
            </p>
          </div>

          {/* Body */}
          <div className="p-3.5 flex flex-col items-center">
            {/* Photo */}
            <div className="w-[84px] h-[98px] rounded-xl border-2 border-[#0C4A34] bg-neutral-100 overflow-hidden shadow-xs relative flex items-center justify-center mb-2">
              {pupil.photo ? (
                <img
                  src={pupil.photo}
                  alt={pupil.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <User className="w-8 h-8 text-[#0C4A34]/50 mb-1" />
                  <span className="text-[8px] font-bold text-[#0C4A34] uppercase">Student</span>
                </div>
              )}
            </div>

            <div className="text-center w-full mb-2">
              <div className="text-[13px] font-black text-neutral-900 leading-tight">
                {pupil.name}
              </div>
              <div className="font-mono text-xs font-bold text-[#0C4A34] mt-0.5">
                {pupil.studentId}
              </div>
              <div className="inline-block bg-neutral-100 px-2 py-0.5 rounded text-[10px] font-bold text-neutral-700 mt-1">
                Grade {pupil.grade} • Class {pupil.class}
              </div>
            </div>

            {/* QR code */}
            <div className="p-1.5 bg-white rounded-xl border border-neutral-300 shadow-2xs w-28 h-28 flex items-center justify-center mb-1.5">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR code for ${pupil.name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-8 h-8 animate-pulse text-[#0C4A34]" />
              )}
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-[#0C4A34]">
              Scan for Gate Access
            </span>
          </div>

          {/* Footer */}
          <div className="bg-[#0C4A34]/5 px-3 py-1.5 border-t border-[#0C4A34]/15 text-[8px] font-medium text-neutral-600">
            {settings.academicYear || '2026 - 2027'} • {settings.schoolMotto || 'Knowledge · Discipline · Success'}
          </div>
        </div>
      )}

      {/* Card Action Controls */}
      {!compact && (
        <div className="mt-3.5 no-print w-full flex flex-col items-center gap-2">
          {/* Format Selector Pills */}
          <div className="inline-flex p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setCardOrientation('horizontal')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                cardOrientation === 'horizontal'
                  ? 'bg-white text-[#0C4A34] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Pocket Card (Horizontal)
            </button>
            <button
              type="button"
              onClick={() => setCardOrientation('vertical')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                cardOrientation === 'vertical'
                  ? 'bg-white text-[#0C4A34] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Lanyard Badge (Vertical)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handlePrintCard}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0C4A34] hover:bg-[#083827] active:scale-95 disabled:opacity-60 rounded-lg transition-all shadow-xs cursor-pointer"
              title="Print official student ID card directly to printer"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Print...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print ID Card</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveBadge}
              disabled={isSavingBadge}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 active:scale-95 disabled:opacity-60 rounded-lg transition-all shadow-2xs cursor-pointer"
              title="Download high-resolution 300-DPI ID card image ready to print on plastic PVC card printer"
            >
              {isSavingBadge ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Save Badge (PNG)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 active:scale-95 rounded-lg transition-all shadow-2xs cursor-pointer"
              title="Download gate pass QR code image"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>QR Code</span>
            </button>
          </div>

          {/* Feedback Status Alert */}
          {statusMsg && (
            <div
              className={`text-center text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all animate-fadeIn ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}
            >
              {statusMsg.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
