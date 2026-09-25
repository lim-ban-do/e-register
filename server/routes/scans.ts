import { Router } from 'express';
import type { Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { broadcastEvent } from './events.ts';

export const scansRouter = Router();

// Process single scan
scansRouter.post('/process', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { payload, method = 'QR_CODE', confidence, faceSnapshot } = req.body;
    const user = req.user!;

    if (!payload) {
      res.status(400).json({ error: 'Scan payload or student ID is required.' });
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = now.toISOString().split('T')[0];
    const fullTimestamp = `${dateStr} ${timeStr}`;

    // Clean payload
    let cleanId = String(payload).trim();
    if (cleanId.includes('student_id=')) {
      const match = cleanId.match(/student_id=([A-Za-z0-9-_]+)/);
      if (match) cleanId = match[1];
    } else if (cleanId.startsWith('{')) {
      try {
        const parsed = JSON.parse(cleanId);
        if (parsed.studentId) cleanId = parsed.studentId;
        else if (parsed.id) cleanId = parsed.id;
      } catch {
        // Not JSON
      }
    }

    // Find pupil
    const pupil = queryOne(
      'SELECT * FROM pupils WHERE UPPER(student_id) = UPPER(?) OR id = ?',
      [cleanId, cleanId]
    );

    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (!pupil) {
      execute(
        `INSERT INTO scan_logs (id, scan_time, raw_payload, student_id, pupil_name, teacher_id, teacher_name, outcome, message, scan_method, confidence)
         VALUES (?, ?, ?, ?, NULL, ?, ?, 'INVALID_ID', ?, ?, ?)`,
        [logId, fullTimestamp, payload, cleanId, user.id, user.name, `Student not found in database: "${cleanId}"`, method, confidence || null]
      );

      res.json({
        success: false,
        status: 'INVALID_ID',
        message: `INVALID STUDENT ID: "${cleanId}" not found.`,
        scannedAt: timeStr,
        scanMethod: method,
        confidence,
        faceSnapshot,
      });
      return;
    }

    if (pupil.status === 'INACTIVE') {
      execute(
        `INSERT INTO scan_logs (id, scan_time, raw_payload, student_id, pupil_name, teacher_id, teacher_name, outcome, message, scan_method, confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'INVALID_ID', ?, ?, ?)`,
        [logId, fullTimestamp, payload, pupil.student_id, pupil.name, user.id, user.name, `Pupil is inactive: ${pupil.name}`, method, confidence || null]
      );

      res.json({
        success: false,
        status: 'INVALID_ID',
        pupil: {
          id: pupil.id,
          studentId: pupil.student_id,
          name: pupil.name,
          class: pupil.class,
          grade: pupil.grade,
          status: pupil.status,
          photo: pupil.photo,
        },
        message: `PUPIL INACTIVE: Student ${pupil.name} (${pupil.student_id}) is deactivated.`,
        scannedAt: timeStr,
        scanMethod: method,
        confidence,
        faceSnapshot,
      });
      return;
    }

    // Check duplicate cooldown
    const settings = queryOne('SELECT duplicate_cooldown_seconds FROM school_settings WHERE id = 1');
    const cooldownSeconds = settings?.duplicate_cooldown_seconds || 60;

    const existingRecord = queryOne(
      'SELECT * FROM attendance_records WHERE UPPER(student_id) = UPPER(?) AND date = ?',
      [pupil.student_id, dateStr]
    );

    if (existingRecord) {
      const [recH, recM, recS] = existingRecord.time.split(':').map(Number);
      const [nowH, nowM, nowS] = timeStr.split(':').map(Number);
      const recSeconds = recH * 3600 + recM * 60 + (recS || 0);
      const nowSeconds = nowH * 3600 + nowM * 60 + (nowS || 0);
      const diff = Math.abs(nowSeconds - recSeconds);

      if (diff < cooldownSeconds) {
        execute(
          `INSERT INTO scan_logs (id, scan_time, raw_payload, student_id, pupil_name, teacher_id, teacher_name, outcome, message, scan_method, confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'DUPLICATE_PREVENTED', ?, ?, ?)`,
          [
            logId,
            fullTimestamp,
            payload,
            pupil.student_id,
            pupil.name,
            user.id,
            user.name,
            `Prevented duplicate check-in within ${cooldownSeconds}s cooldown (recorded ${existingRecord.time})`,
            method,
            confidence || null,
          ]
        );

        res.json({
          success: false,
          status: 'DUPLICATE_PREVENTED',
          pupil: {
            id: pupil.id,
            studentId: pupil.student_id,
            name: pupil.name,
            class: pupil.class,
            grade: pupil.grade,
            photo: pupil.photo,
          },
          attendance: {
            id: existingRecord.id,
            studentId: existingRecord.student_id,
            pupilName: existingRecord.pupil_name,
            date: existingRecord.date,
            time: existingRecord.time,
            status: existingRecord.status,
          },
          message: `DUPLICATE CHECK-IN PREVENTED: ${pupil.name} was already recorded PRESENT at ${existingRecord.time} today.`,
          scannedAt: timeStr,
          scanMethod: method,
          confidence,
          faceSnapshot,
        });
        return;
      }
    }

    // Record attendance
    let attendanceId = existingRecord ? existingRecord.id : `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    if (existingRecord) {
      execute(
        `UPDATE attendance_records
         SET time = ?, teacher_id = ?, teacher_name = ?, scan_method = ?, confidence = ?
         WHERE id = ?`,
        [timeStr, user.id, user.name, method, confidence || null, attendanceId]
      );
    } else {
      execute(
        `INSERT INTO attendance_records (id, student_id, pupil_name, class, grade, date, time, teacher_id, teacher_name, status, scan_method, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PRESENT', ?, ?, ?)`,
        [attendanceId, pupil.student_id, pupil.name, pupil.class, pupil.grade, dateStr, timeStr, user.id, user.name, method, confidence || null, fullTimestamp]
      );

      // Increment teacher scan count
      execute('UPDATE teachers SET scan_count = scan_count + 1 WHERE user_id = ?', [user.id]);
    }

    const methodLabel =
      method === 'FACE_RECOGNITION'
        ? `Biometric Face Recognition (${confidence ? `${confidence}% match` : 'Matched'})`
        : method === 'QR_CODE'
        ? 'Student QR ID Card'
        : 'Manual Entry';

    // Log scan
    execute(
      `INSERT INTO scan_logs (id, scan_time, raw_payload, student_id, pupil_name, teacher_id, teacher_name, outcome, message, scan_method, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'SUCCESS', ?, ?, ?)`,
      [logId, fullTimestamp, payload, pupil.student_id, pupil.name, user.id, user.name, `Attendance recorded via ${methodLabel} as PRESENT at ${timeStr}`, method, confidence || null]
    );

    const scanResult = {
      success: true,
      status: 'SUCCESS',
      pupil: {
        id: pupil.id,
        studentId: pupil.student_id,
        name: pupil.name,
        class: pupil.class,
        grade: pupil.grade,
        photo: pupil.photo,
      },
      attendance: {
        id: attendanceId,
        studentId: pupil.student_id,
        pupilName: pupil.name,
        class: pupil.class,
        grade: pupil.grade,
        date: dateStr,
        time: timeStr,
        status: 'PRESENT',
        scanMethod: method,
        confidence,
      },
      message: `PUPIL LOGGED IN: Attendance recorded via ${methodLabel} at ${timeStr}.`,
      scannedAt: timeStr,
      scanMethod: method,
      confidence,
      faceSnapshot,
    };

    // Broadcast real-time scan event to all connected dashboards and registers
    broadcastEvent('attendance_scan', scanResult);

    res.json(scanResult);
  } catch (err: any) {
    console.error('Process scan error:', err);
    res.status(500).json({ error: 'Failed to process scan.' });
  }
});

// Bulk offline queue sync (Module 6)
scansRouter.post('/bulk', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { scans: queuedScans } = req.body;
    const user = req.user!;

    if (!Array.isArray(queuedScans) || queuedScans.length === 0) {
      res.status(400).json({ error: 'Expected non-empty scans array.' });
      return;
    }

    const processedResults: any[] = [];

    queuedScans.forEach((scan: any) => {
      const payload = scan.payload || scan.studentId;
      if (!payload) return;

      const cleanId = String(payload).trim();
      const pupil = queryOne(
        'SELECT * FROM pupils WHERE UPPER(student_id) = UPPER(?) OR id = ?',
        [cleanId, cleanId]
      );
      if (!pupil || pupil.status === 'INACTIVE') return;

      const scanTime = scan.timestamp || new Date().toISOString();
      const dateStr = scanTime.split('T')[0];
      const timeStr = scanTime.split('T')[1]?.substring(0, 8) || '08:00:00';

      const existing = queryOne(
        'SELECT id FROM attendance_records WHERE UPPER(student_id) = UPPER(?) AND date = ?',
        [pupil.student_id, dateStr]
      );

      if (!existing) {
        const id = `att-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        execute(
          `INSERT INTO attendance_records (id, student_id, pupil_name, class, grade, date, time, teacher_id, teacher_name, status, scan_method, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PRESENT', ?, ?, ?)`,
          [id, pupil.student_id, pupil.name, pupil.class, pupil.grade, dateStr, timeStr, user.id, user.name, scan.method || 'OFFLINE_SYNC', scan.confidence || null, `${dateStr} ${timeStr}`]
        );
        processedResults.push({ pupil: pupil.name, studentId: pupil.student_id, date: dateStr, time: timeStr });
      }
    });

    if (processedResults.length > 0) {
      broadcastEvent('attendance_updated', { action: 'offline_queue_synced', count: processedResults.length });
    }

    res.json({
      success: true,
      syncedCount: processedResults.length,
      processed: processedResults,
    });
  } catch (err: any) {
    console.error('Bulk scans sync error:', err);
    res.status(500).json({ error: 'Failed to process queued scans.' });
  }
});

// Scan logs (audit history)
scansRouter.get('/logs', requireAuth, (req, res) => {
  const { outcome, search, limit = 200 } = req.query;

  let sql = `
    SELECT id, scan_time as scanTime, raw_payload as rawPayload,
           student_id as studentId, pupil_name as pupilName,
           teacher_id as teacherId, teacher_name as teacherName,
           outcome, message, scan_method as scanMethod, confidence
    FROM scan_logs
    WHERE 1=1
  `;
  const params: any[] = [];

  if (outcome && outcome !== 'ALL') {
    sql += ' AND outcome = ?';
    params.push(outcome);
  }

  if (search) {
    sql += ' AND (pupil_name LIKE ? OR student_id LIKE ? OR raw_payload LIKE ? OR message LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY scan_time DESC LIMIT ?';
  params.push(Number(limit));

  const logs = queryAll(sql, params);
  res.json(logs);
});
