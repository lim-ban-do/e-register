import { Pupil, SchoolSettings } from '../types';
import { generateQrDataUrl } from './qr';

// SVG markup for the official Limbando School Crest for high-resolution rendering
export const LIMBANDO_CREST_SVG = `
<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B3C2B" />
      <stop offset="100%" stop-color="#06261A" />
    </linearGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#EAB308" />
      <stop offset="100%" stop-color="#CA8A04" />
    </linearGradient>
    <linearGradient id="goldDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EAB308" />
      <stop offset="100%" stop-color="#A16207" />
    </linearGradient>
  </defs>
  <!-- Laurel Wreath -->
  <g stroke="url(#goldGradient)" stroke-width="1.8" fill="#15803D" stroke-linecap="round">
    <path d="M 60 102 C 38 100 24 82 24 58 C 24 44 32 30 40 22" fill="none" stroke="url(#goldDark)" stroke-width="2" />
    <path d="M 28 88 C 20 84 18 76 24 73 C 28 72 32 78 28 88 Z" fill="#166534" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 23 75 C 16 70 14 62 20 59 C 24 58 27 64 23 75 Z" fill="#15803D" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 21 61 C 15 54 16 46 22 43 C 26 42 28 50 21 61 Z" fill="#166534" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 24 47 C 18 40 21 32 27 30 C 31 30 32 37 24 47 Z" fill="#15803D" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 31 35 C 26 28 30 21 36 20 C 40 20 40 27 31 35 Z" fill="#166534" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 40 25 C 37 19 44 14 49 16 C 52 17 50 24 40 25 Z" fill="#15803D" stroke="url(#goldGradient)" stroke-width="1" />
    <!-- Right side -->
    <path d="M 60 102 C 82 100 96 82 96 58 C 96 44 88 30 80 22" fill="none" stroke="url(#goldDark)" stroke-width="2" />
    <path d="M 92 88 C 100 84 102 76 96 73 C 92 72 88 78 92 88 Z" fill="#166534" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 97 75 C 104 70 106 62 100 59 C 96 58 93 64 97 75 Z" fill="#15803D" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 99 61 C 105 54 104 46 98 43 C 94 42 92 50 99 61 Z" fill="#166534" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 96 47 C 102 40 99 32 93 30 C 89 30 88 37 96 47 Z" fill="#15803D" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 89 35 C 94 28 90 21 84 20 C 80 20 80 27 89 35 Z" fill="#166534" stroke="url(#goldGradient)" stroke-width="1" />
    <path d="M 80 25 C 83 19 76 14 71 16 C 68 17 70 24 80 25 Z" fill="#15803D" stroke="url(#goldGradient)" stroke-width="1" />
  </g>
  <!-- Shield Outer Gold Rim -->
  <path d="M 60 20 Q 82 20 82 35 C 82 66 72 86 60 94 C 48 86 38 66 38 35 Q 38 20 60 20 Z" fill="url(#goldGradient)" stroke="#854D0E" stroke-width="1.5" />
  <!-- Shield Inner Dark Body -->
  <path d="M 60 23 Q 79 23 79 36 C 79 64 70 82 60 90 C 50 82 41 64 41 36 Q 41 23 60 23 Z" fill="url(#shieldBg)" stroke="url(#goldGradient)" stroke-width="1.5" />
  <!-- Golden Star -->
  <path d="M 60 28 L 61.2 31.5 L 64.8 31.5 L 61.8 33.6 L 63 37 L 60 34.8 L 57 37 L 58.2 33.6 L 55.2 31.5 L 58.8 31.5 Z" fill="url(#goldGradient)" stroke="#713F12" stroke-width="0.5" />
  <!-- Open Book -->
  <g transform="translate(0, 4)">
    <path d="M 60 52 C 54 48 48 48 44 50 L 44 68 C 48 66 54 66 60 70 C 66 66 72 66 76 68 L 76 50 C 72 48 66 48 60 52 Z" fill="#CBD5E1" />
    <path d="M 60 50 C 55 46 49 46 45 48 L 45 66 C 49 64 55 64 60 68 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="0.8" />
    <path d="M 60 50 C 65 46 71 46 75 48 L 75 66 C 71 64 65 64 60 68 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="0.8" />
    <line x1="60" y1="50" x2="60" y2="68" stroke="#CA8A04" stroke-width="1.5" />
    <line x1="48" y1="53" x2="56" y2="52" stroke="#94A3B8" stroke-width="1" stroke-linecap="round" />
    <line x1="48" y1="57" x2="56" y2="56" stroke="#94A3B8" stroke-width="1" stroke-linecap="round" />
    <line x1="48" y1="61" x2="54" y2="60" stroke="#94A3B8" stroke-width="1" stroke-linecap="round" />
    <line x1="64" y1="52" x2="72" y2="53" stroke="#94A3B8" stroke-width="1" stroke-linecap="round" />
    <line x1="64" y1="56" x2="72" y2="57" stroke="#94A3B8" stroke-width="1" stroke-linecap="round" />
    <line x1="66" y1="60" x2="72" y2="61" stroke="#94A3B8" stroke-width="1" stroke-linecap="round" />
    <path d="M 60 68 L 60 76 L 62 74 L 64 76 L 64 68 Z" fill="url(#goldGradient)" stroke="#854D0E" stroke-width="0.5" />
  </g>
</svg>
`;

/**
 * Builds standalone HTML for printing an individual pupil card.
 * Includes inline CSS so background colors, borders, and layouts render perfectly.
 */
export async function generatePrintableCardHtml(
  pupil: Pupil,
  settings: SchoolSettings,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): Promise<string> {
  const qrUrl = await generateQrDataUrl(pupil.studentId);
  const schoolName = settings.schoolName || 'LIMBANDO PRIVATE SCHOOL';
  const academicYear = settings.academicYear ? settings.academicYear.split(' ')[0] : '2026/27';
  const motto = settings.schoolMotto || 'Knowledge · Discipline · Success';

  // Photo markup
  const photoHtml = pupil.photo
    ? `<img src="${pupil.photo}" alt="${pupil.name}" class="student-photo-img" />`
    : `<div class="student-photo-placeholder">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0C4A34" stroke-width="2">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span style="font-size: 8px; font-weight: bold; color: #0C4A34; text-transform: uppercase; margin-top: 4px;">PUPIL</span>
      </div>`;

  if (orientation === 'vertical') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student ID - ${pupil.name} (${pupil.studentId})</title>
  <style>
    @page {
      size: auto;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #ffffff;
    }
    .print-instructions {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 15px;
      text-align: center;
    }
    .card-trim-container {
      border: 1px dashed #cbd5e1;
      padding: 10px;
      border-radius: 24px;
      background: #fafafa;
    }
    .id-card-vert {
      width: 280px;
      background: #ffffff;
      border: 2px solid #0C4A34;
      border-radius: 20px;
      overflow: hidden;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      position: relative;
    }
    .lanyard-slot {
      padding-top: 8px;
      padding-bottom: 4px;
      display: flex;
      justify-content: center;
      background: #0C4A34;
    }
    .lanyard-hole {
      width: 40px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
    }
    .card-header {
      background: #0C4A34;
      padding: 4px 12px 10px;
      color: #ffffff;
      border-bottom: 2px solid #EAB308;
    }
    .crest-container {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
    }
    .crest-container svg {
      width: 38px;
      height: 38px;
    }
    .school-title {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ffffff;
      line-height: 1.2;
    }
    .pass-type {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #FDE047;
      margin-top: 2px;
    }
    .card-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .photo-box {
      width: 88px;
      height: 102px;
      border: 2px solid #0C4A34;
      border-radius: 12px;
      background: #f1f5f9;
      overflow: hidden;
      position: relative;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .student-photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .student-photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #f8fafc;
    }
    .student-name {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 2px;
    }
    .student-id {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      color: #0C4A34;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .student-grade-badge {
      display: inline-block;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 10px;
    }
    .qr-box {
      width: 110px;
      height: 110px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #ffffff;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .qr-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .gate-label {
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0C4A34;
    }
    .card-footer {
      background: rgba(12, 74, 52, 0.05);
      border-top: 1px solid rgba(12, 74, 52, 0.15);
      padding: 6px 10px;
      font-size: 8px;
      font-weight: 600;
      color: #475569;
    }
    @media print {
      .print-instructions {
        display: none !important;
      }
      .card-trim-container {
        border: 1px dashed #94a3b8;
        background: transparent;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-instructions">Limbando Private School · Official Student ID Badge · Print on Cardstock</div>
  <div class="card-trim-container">
    <div class="id-card-vert">
      <div class="lanyard-slot"><div class="lanyard-hole"></div></div>
      <div class="card-header">
        <div class="crest-container">${LIMBANDO_CREST_SVG}</div>
        <div class="school-title">${schoolName}</div>
        <div class="pass-type">Student Identity Pass</div>
      </div>
      <div class="card-body">
        <div class="photo-box">
          ${photoHtml}
        </div>
        <div class="student-name">${pupil.name}</div>
        <div class="student-id">${pupil.studentId}</div>
        <div class="student-grade-badge">Grade ${pupil.grade} · Class ${pupil.class}</div>
        <div class="qr-box">
          <img src="${qrUrl}" alt="QR Code" class="qr-img" />
        </div>
        <div class="gate-label">Gate Entrance Pass</div>
      </div>
      <div class="card-footer">
        ${academicYear} · ${motto}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // Standard Horizontal CR80 Pocket Card
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student ID - ${pupil.name} (${pupil.studentId})</title>
  <style>
    @page {
      size: auto;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #ffffff;
    }
    .print-instructions {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 15px;
      text-align: center;
    }
    .card-trim-container {
      border: 1px dashed #cbd5e1;
      padding: 10px;
      border-radius: 20px;
      background: #fafafa;
    }
    .id-card-horiz {
      width: 370px;
      min-height: 228px;
      background: #ffffff;
      border: 2px solid #0C4A34;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      position: relative;
    }
    .lanyard-slot {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
    }
    .lanyard-hole {
      width: 40px;
      height: 5px;
      background: rgba(226, 232, 240, 0.9);
      border-radius: 10px;
      border: 1px solid #cbd5e1;
    }
    .card-header {
      background: #0C4A34;
      padding: 12px 14px 8px;
      color: #ffffff;
      border-bottom: 2px solid #EAB308;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .crest-container svg {
      width: 32px;
      height: 32px;
    }
    .school-title {
      font-size: 11.5px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ffffff;
      line-height: 1.15;
    }
    .pass-type {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #FDE047;
      margin-top: 1px;
    }
    .year-badge {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 8.5px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.05em;
    }
    .card-body {
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    .photo-col {
      flex-shrink: 0;
    }
    .photo-box {
      width: 72px;
      height: 86px;
      border: 2px solid #0C4A34;
      border-radius: 10px;
      background: #f1f5f9;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .student-photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .student-photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #f8fafc;
    }
    .photo-ribbon {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(12, 74, 52, 0.9);
      color: #ffffff;
      font-size: 7px;
      font-weight: 900;
      text-align: center;
      padding: 1px 0;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .details-col {
      flex: 1;
      min-width: 0;
      text-align: left;
    }
    .label {
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 1px;
    }
    .student-name {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-bottom: 4px;
    }
    .value {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }
    .id-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 2px;
    }
    .student-id {
      font-family: monospace;
      font-size: 11px;
      font-weight: 900;
      color: #0C4A34;
      letter-spacing: 0.05em;
    }
    .status-badge {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 8px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .qr-col {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .qr-box {
      width: 74px;
      height: 74px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #ffffff;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .gate-label {
      font-size: 7px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0C4A34;
      margin-top: 3px;
    }
    .card-footer {
      background: rgba(12, 74, 52, 0.04);
      border-top: 1px solid rgba(12, 74, 52, 0.12);
      padding: 5px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8px;
    }
    .footer-motto {
      font-weight: 700;
      color: #0C4A34;
    }
    .footer-note {
      font-family: monospace;
      font-size: 7.5px;
      color: #64748b;
    }
    @media print {
      .print-instructions {
        display: none !important;
      }
      .card-trim-container {
        border: 1px dashed #94a3b8;
        background: transparent;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-instructions">Limbando Private School · Official Student ID Badge · Print on Cardstock</div>
  <div class="card-trim-container">
    <div class="id-card-horiz">
      <div class="lanyard-slot"><div class="lanyard-hole"></div></div>
      <div class="card-header">
        <div class="header-left">
          <div class="crest-container">${LIMBANDO_CREST_SVG}</div>
          <div>
            <div class="school-title">${schoolName}</div>
            <div class="pass-type">Official Student Identity Pass</div>
          </div>
        </div>
        <div class="year-badge">${academicYear}</div>
      </div>
      <div class="card-body">
        <div class="photo-col">
          <div class="photo-box">
            ${photoHtml}
            <div class="photo-ribbon">PUPIL</div>
          </div>
        </div>
        <div class="details-col">
          <div>
            <span class="label">Pupil Full Name</span>
            <div class="student-name">${pupil.name}</div>
          </div>
          <div class="grid-info">
            <div>
              <span class="label">Grade Level</span>
              <div class="value">Grade ${pupil.grade}</div>
            </div>
            <div>
              <span class="label">Class Section</span>
              <div class="value">Class ${pupil.class}</div>
            </div>
          </div>
          <div class="id-row">
            <div>
              <span class="label">Student ID</span>
              <span class="student-id">${pupil.studentId}</span>
            </div>
            <div class="status-badge">${pupil.status || 'ACTIVE'}</div>
          </div>
        </div>
        <div class="qr-col">
          <div class="qr-box">
            <img src="${qrUrl}" alt="QR" class="qr-img" />
          </div>
          <div class="gate-label">Gate Access</div>
        </div>
      </div>
      <div class="card-footer">
        <span class="footer-motto">${motto}</span>
        <span class="footer-note">Non-Transferable ID</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates a high-definition 300-DPI canvas render of the ID card and downloads it as PNG.
 * Perfect fallback when print dialogs are blocked or when printing directly to card printers.
 */
export async function downloadPupilBadgeImage(
  pupil: Pupil,
  settings: SchoolSettings,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): Promise<string> {
  const qrUrl = await generateQrDataUrl(pupil.studentId);
  const schoolName = settings.schoolName || 'LIMBANDO PRIVATE SCHOOL';
  const academicYear = settings.academicYear ? settings.academicYear.split(' ')[0] : '2026/27';
  const motto = settings.schoolMotto || 'Knowledge · Discipline · Success';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  if (orientation === 'horizontal') {
    // CR80 standard card proportions at ~300 DPI
    canvas.width = 1110;
    canvas.height = 690;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(15, 15, 1080, 660, 28);
    ctx.fill();

    // Outer Border
    ctx.strokeStyle = '#0C4A34';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#0C4A34';
    ctx.beginPath();
    ctx.roundRect(15, 15, 1080, 160, [28, 28, 0, 0]);
    ctx.fill();

    // Gold separator line
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(15, 172, 1080, 6);

    // School Name & Header Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(schoolName.toUpperCase(), 140, 82);

    ctx.fillStyle = '#FDE047';
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('OFFICIAL STUDENT IDENTITY PASS', 140, 122);

    // Academic Year Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(880, 56, 180, 52, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(academicYear, 970, 90);
    ctx.textAlign = 'left';

    // Draw School Crest in Header (using simple shield icon vector on canvas)
    drawCrestOnCanvas(ctx, 45, 42, 75);

    // Load and draw pupil photo
    const photoX = 55;
    const photoY = 210;
    const photoW = 210;
    const photoH = 260;

    // Photo frame
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 16);
    ctx.fill();
    ctx.strokeStyle = '#0C4A34';
    ctx.lineWidth = 4;
    ctx.stroke();

    if (pupil.photo) {
      try {
        const img = await loadImage(pupil.photo);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, 16);
        ctx.clip();
        ctx.drawImage(img, photoX, photoY, photoW, photoH);
        ctx.restore();
      } catch {
        drawDefaultAvatar(ctx, photoX, photoY, photoW, photoH);
      }
    } else {
      drawDefaultAvatar(ctx, photoX, photoY, photoW, photoH);
    }

    // "PUPIL" banner on photo
    ctx.fillStyle = 'rgba(12, 74, 52, 0.95)';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY + photoH - 40, photoW, 40, [0, 0, 16, 16]);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PUPIL', photoX + photoW / 2, photoY + photoH - 14);
    ctx.textAlign = 'left';

    // Pupil Details Info
    const textX = 300;
    // Pupil Name
    ctx.fillStyle = '#64748B';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PUPIL FULL NAME', textX, 235);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(pupil.name, textX, 275);

    // Grade and Class
    ctx.fillStyle = '#64748B';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('GRADE LEVEL', textX, 330);
    ctx.fillText('CLASS SECTION', textX + 220, 330);

    ctx.fillStyle = '#1E293B';
    ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Grade ${pupil.grade}`, textX, 368);
    ctx.fillText(`Class ${pupil.class}`, textX + 220, 368);

    // Student ID & Status
    ctx.fillStyle = '#64748B';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('STUDENT ID', textX, 425);

    ctx.fillStyle = '#0C4A34';
    ctx.font = '900 32px monospace';
    ctx.fillText(pupil.studentId, textX, 465);

    // Status Pill
    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.roundRect(textX + 310, 435, 120, 36, 8);
    ctx.fill();
    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = '800 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pupil.status || 'ACTIVE', textX + 370, 460);
    ctx.textAlign = 'left';

    // QR Code
    if (qrUrl) {
      try {
        const qrImg = await loadImage(qrUrl);
        const qrX = 810;
        const qrY = 210;
        const qrSize = 240;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 18);
        ctx.fill();
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.drawImage(qrImg, qrX + 10, qrY + 10, qrSize - 20, qrSize - 20);

        ctx.fillStyle = '#0C4A34';
        ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GATE ACCESS', qrX + qrSize / 2, qrY + qrSize + 28);
        ctx.textAlign = 'left';
      } catch (e) {
        console.error('Failed to load QR onto canvas', e);
      }
    }

    // Bottom Footer Bar
    ctx.fillStyle = 'rgba(12, 74, 52, 0.05)';
    ctx.beginPath();
    ctx.roundRect(15, 600, 1080, 75, [0, 0, 28, 28]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(12, 74, 52, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0C4A34';
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(motto, 45, 646);

    ctx.fillStyle = '#64748B';
    ctx.font = '600 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('OFFICIAL NON-TRANSFERABLE ID', 1060, 646);
    ctx.textAlign = 'left';

  } else {
    // Vertical Lanyard Badge Proportions (~300 DPI)
    canvas.width = 720;
    canvas.height = 1080;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(15, 15, 690, 1050, 32);
    ctx.fill();
    ctx.strokeStyle = '#0C4A34';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Header
    ctx.fillStyle = '#0C4A34';
    ctx.beginPath();
    ctx.roundRect(15, 15, 690, 230, [32, 32, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(15, 245, 690, 6);

    // Lanyard slot simulation
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(300, 24, 120, 14, 7);
    ctx.fill();

    // Crest
    drawCrestOnCanvas(ctx, 310, 50, 100);

    // School Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(schoolName.toUpperCase(), 360, 185);

    ctx.fillStyle = '#FDE047';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('STUDENT IDENTITY CARD', 360, 220);

    // Student Photo
    const photoX = 240;
    const photoY = 280;
    const photoW = 240;
    const photoH = 290;

    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 18);
    ctx.fill();
    ctx.strokeStyle = '#0C4A34';
    ctx.lineWidth = 4;
    ctx.stroke();

    if (pupil.photo) {
      try {
        const img = await loadImage(pupil.photo);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, 18);
        ctx.clip();
        ctx.drawImage(img, photoX, photoY, photoW, photoH);
        ctx.restore();
      } catch {
        drawDefaultAvatar(ctx, photoX, photoY, photoW, photoH);
      }
    } else {
      drawDefaultAvatar(ctx, photoX, photoY, photoW, photoH);
    }

    // Name and Details
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(pupil.name, 360, 620);

    ctx.fillStyle = '#0C4A34';
    ctx.font = '900 30px monospace';
    ctx.fillText(pupil.studentId, 360, 665);

    // Grade / Class Pill
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(220, 685, 280, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Grade ${pupil.grade} • Class ${pupil.class}`, 360, 715);

    // QR Code
    if (qrUrl) {
      try {
        const qrImg = await loadImage(qrUrl);
        const qrSize = 220;
        const qrX = 360 - qrSize / 2;
        const qrY = 750;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 16);
        ctx.fill();
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);

        ctx.fillStyle = '#0C4A34';
        ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('GATE PASS', 360, qrY + qrSize + 28);
      } catch (e) {
        console.error('Failed to load QR code on canvas', e);
      }
    }

    // Footer
    ctx.fillStyle = 'rgba(12, 74, 52, 0.05)';
    ctx.beginPath();
    ctx.roundRect(15, 1010, 690, 55, [0, 0, 32, 32]);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${academicYear} • ${motto}`, 360, 1045);
    ctx.textAlign = 'left';
  }

  // Convert to downloadable data URL and trigger download
  const dataUrl = canvas.toDataURL('image/png');
  const filename = `Student_ID_${pupil.studentId}_${pupil.name.replace(/\s+/g, '_')}`;

  const downloadLink = document.createElement('a');
  downloadLink.href = dataUrl;
  downloadLink.download = `${filename}.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  return dataUrl;
}

/**
 * Robust print function that prints an ID card with full color, proper scaling,
 * and zero interference from background pages or modal backdrops.
 */
export async function printPupilCard(
  pupil: Pupil,
  settings: SchoolSettings,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): Promise<{ success: boolean; fallbackTriggered?: boolean; message?: string }> {
  try {
    const htmlContent = await generatePrintableCardHtml(pupil, settings, orientation);

    // Method 1: Hidden Iframe Print (cleanest, prints ONLY the card document)
    let iframe = document.getElementById('card-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'card-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Give images, SVG, and fonts time to paint
      await new Promise(resolve => setTimeout(resolve, 350));

      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        return { success: true };
      } catch (iframeErr) {
        console.warn('Iframe print failed or blocked by sandbox. Trying DOM print portal...', iframeErr);
      }
    }

    // Method 2: DOM Print Portal Fallback
    // Insert clean printable container at document body level
    let printPortal = document.getElementById('print-portal-card');
    if (!printPortal) {
      printPortal = document.createElement('div');
      printPortal.id = 'print-portal-card';
      document.body.appendChild(printPortal);
    }

    printPortal.innerHTML = htmlContent;
    document.body.classList.add('print-single-card-active');

    try {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-single-card-active');
        if (printPortal) printPortal.innerHTML = '';
      }, 1000);
      return { success: true };
    } catch (windowPrintErr) {
      document.body.classList.remove('print-single-card-active');
      if (printPortal) printPortal.innerHTML = '';
      console.warn('window.print() also blocked by sandbox. Downloading badge PNG...', windowPrintErr);

      // Method 3: Automatic High-Res Badge Image Download Fallback
      await downloadPupilBadgeImage(pupil, settings, orientation);
      return {
        success: true,
        fallbackTriggered: true,
        message: 'Browser sandbox blocked direct printer. Downloaded printable ID badge image instead.',
      };
    }
  } catch (err: any) {
    console.error('Printing pupil card error:', err);
    // Even if everything fails, download the high-res badge image
    try {
      await downloadPupilBadgeImage(pupil, settings, orientation);
      return {
        success: true,
        fallbackTriggered: true,
        message: 'Downloaded printable ID badge image (PNG).',
      };
    } catch (innerErr: any) {
      return {
        success: false,
        message: innerErr?.message || 'Unable to print or generate ID badge.',
      };
    }
  }
}

// Helper: load image safely with promise
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}

// Helper: draw default pupil silhouette on canvas
function drawDefaultAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#94A3B8';
  // Head
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.38, w * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.82, w * 0.36, h * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Helper: draw school crest on canvas
function drawCrestOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 100;
  ctx.scale(scale, scale);

  // Shield base
  ctx.fillStyle = '#CA8A04';
  ctx.beginPath();
  ctx.moveTo(50, 10);
  ctx.quadraticCurveTo(80, 10, 80, 30);
  ctx.bezierCurveTo(80, 60, 70, 80, 50, 92);
  ctx.bezierCurveTo(30, 80, 20, 60, 20, 30);
  ctx.quadraticCurveTo(20, 10, 50, 10);
  ctx.fill();

  // Shield inner dark green
  ctx.fillStyle = '#06261A';
  ctx.beginPath();
  ctx.moveTo(50, 14);
  ctx.quadraticCurveTo(76, 14, 76, 32);
  ctx.bezierCurveTo(76, 58, 67, 76, 50, 87);
  ctx.bezierCurveTo(33, 76, 24, 58, 24, 32);
  ctx.quadraticCurveTo(24, 14, 50, 14);
  ctx.fill();

  // Gold Star
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(50, 26, 6, 0, Math.PI * 2);
  ctx.fill();

  // Book in center
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(36, 42, 28, 20);
  ctx.fillStyle = '#CA8A04';
  ctx.fillRect(49, 42, 2, 20);

  ctx.restore();
}
