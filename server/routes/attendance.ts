import { Router } from 'express';
import type { Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { broadcastEvent } from './events.ts';

export const attendanceRouter = Router();

// Get attendance records with filters
attendanceRouter.get('/', requireAuth, (req, res) => {
  const { date, grade, class: pupilClass, studentId } = req.query;

  let sql = `
    SELECT id, student_id as studentId, pupil_name as pupilName,
           class, grade, date, time, teacher_id as teacherId,
           teacher_name as teacherName, status, scan_method as scanMethod,
           confidence, created_at as createdAt
    FROM attendance_records
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }
  if (grade) {
    sql += ' AND grade = ?';
    params.push(grade);
  }
  if (pupilClass) {
    sql += ' AND UPPER(class) = UPPER(?)';
    params.push(pupilClass);
  }
  if (studentId) {
    sql += ' AND UPPER(student_id) = UPPER(?)';
    params.push(studentId);
  }

  sql += ' ORDER BY date DESC, time DESC';

  const records = queryAll(sql, params);
  res.json(records);
});

// Get today's attendance records
attendanceRouter.get('/today', requireAuth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const records = queryAll(
    `SELECT id, student_id as studentId, pupil_name as pupilName,
            class, grade, date, time, teacher_id as teacherId,
            teacher_name as teacherName, status, scan_method as scanMethod,
            confidence, created_at as createdAt
     FROM attendance_records
     WHERE date = ?
     ORDER BY time DESC`,
    [today]
  );
  res.json(records);
});

// Summary Stats
attendanceRouter.get('/stats', requireAuth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const totalPupils = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM pupils WHERE status = 'ACTIVE'")?.count || 0;
  const totalTeachers = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM teachers WHERE status = 'ACTIVE'")?.count || 0;

  const todayPresent = queryOne<{ count: number }>(
    "SELECT COUNT(DISTINCT student_id) as count FROM attendance_records WHERE date = ? AND status = 'PRESENT'",
    [today]
  )?.count || 0;

  const todayLate = queryOne<{ count: number }>(
    "SELECT COUNT(DISTINCT student_id) as count FROM attendance_records WHERE date = ? AND status = 'LATE'",
    [today]
  )?.count || 0;

  const absentToday = Math.max(0, totalPupils - todayPresent - todayLate);
  const attendanceRate = totalPupils > 0 ? Math.round(((todayPresent + todayLate) / totalPupils) * 100) : 0;

  res.json({
    totalPupils,
    totalTeachers,
    presentToday: todayPresent,
    lateToday: todayLate,
    absentToday,
    attendanceRate,
    date: today,
  });
});

// Manual Attendance Mark (for teacher roll-call / register)
attendanceRouter.post('/manual', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { studentId, date, status, notes } = req.body;
    const user = req.user!;

    if (!studentId || !status) {
      res.status(400).json({ error: 'studentId and status are required.' });
      return;
    }

    const pupil = queryOne('SELECT * FROM pupils WHERE UPPER(student_id) = UPPER(?)', [studentId]);
    if (!pupil) {
      res.status(404).json({ error: 'Pupil not found.' });
      return;
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const fullTimestamp = `${targetDate} ${timeStr}`;

    // Check existing record for date
    const existing = queryOne(
      'SELECT id FROM attendance_records WHERE UPPER(student_id) = UPPER(?) AND date = ?',
      [studentId, targetDate]
    );

    let recordId: string;
    if (existing) {
      recordId = existing.id;
      execute(
        `UPDATE attendance_records
         SET status = ?, time = ?, teacher_id = ?, teacher_name = ?, scan_method = 'MANUAL'
         WHERE id = ?`,
        [status, timeStr, user.id, user.name, recordId]
      );
    } else {
      recordId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      execute(
        `INSERT INTO attendance_records (id, student_id, pupil_name, class, grade, date, time, teacher_id, teacher_name, status, scan_method, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MANUAL', NULL, ?)`,
        [recordId, pupil.student_id, pupil.name, pupil.class, pupil.grade, targetDate, timeStr, user.id, user.name, status, fullTimestamp]
      );
    }

    const record = {
      id: recordId,
      studentId: pupil.student_id,
      pupilName: pupil.name,
      class: pupil.class,
      grade: pupil.grade,
      date: targetDate,
      time: timeStr,
      teacherId: user.id,
      teacherName: user.name,
      status,
      scanMethod: 'MANUAL',
      createdAt: fullTimestamp,
    };

    broadcastEvent('attendance_updated', { action: 'marked', record });

    res.json(record);
  } catch (err: any) {
    console.error('Manual attendance error:', err);
    res.status(500).json({ error: 'Failed to record attendance.' });
  }
});

// Batch Save Register
attendanceRouter.post('/register-batch', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { records: batchList, date } = req.body;
    const user = req.user!;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0];

    if (!Array.isArray(batchList)) {
      res.status(400).json({ error: 'records array is required.' });
      return;
    }

    const savedRecords: any[] = [];

    batchList.forEach((item: any) => {
      const pupil = queryOne('SELECT * FROM pupils WHERE UPPER(student_id) = UPPER(?)', [item.studentId]);
      if (!pupil) return;

      const existing = queryOne(
        'SELECT id FROM attendance_records WHERE UPPER(student_id) = UPPER(?) AND date = ?',
        [item.studentId, targetDate]
      );

      const status = item.status || 'PRESENT';

      if (existing) {
        execute(
          `UPDATE attendance_records
           SET status = ?, teacher_id = ?, teacher_name = ?, scan_method = 'MANUAL'
           WHERE id = ?`,
          [status, user.id, user.name, existing.id]
        );
        savedRecords.push({ ...existing, status });
      } else {
        const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        execute(
          `INSERT INTO attendance_records (id, student_id, pupil_name, class, grade, date, time, teacher_id, teacher_name, status, scan_method, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MANUAL', NULL, ?)`,
          [id, pupil.student_id, pupil.name, pupil.class, pupil.grade, targetDate, timeStr, user.id, user.name, status, `${targetDate} ${timeStr}`]
        );
        savedRecords.push({
          id,
          studentId: pupil.student_id,
          pupilName: pupil.name,
          class: pupil.class,
          grade: pupil.grade,
          date: targetDate,
          time: timeStr,
          status,
        });
      }
    });

    broadcastEvent('attendance_updated', { action: 'batch_saved', count: savedRecords.length, date: targetDate });

    res.json({ success: true, count: savedRecords.length });
  } catch (err: any) {
    console.error('Batch register error:', err);
    res.status(500).json({ error: 'Failed to save batch register.' });
  }
});
