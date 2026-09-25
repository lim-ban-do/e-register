import { Router } from 'express';
import type { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { queryAll, queryOne } from '../db/database.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export const exportRouter = Router();

// Full JSON Backup
exportRouter.get('/backup', requireAuth, requireRole('ADMIN'), (req, res) => {
  const users = queryAll('SELECT id, name, username, email, role, status, last_login, created_at FROM users');
  const teachers = queryAll('SELECT * FROM teachers');
  const pupils = queryAll('SELECT * FROM pupils');
  const attendance = queryAll('SELECT * FROM attendance_records');
  const scanLogs = queryAll('SELECT * FROM scan_logs ORDER BY scan_time DESC LIMIT 500');
  const settings = queryOne('SELECT * FROM school_settings WHERE id = 1');

  const backupData = {
    exportedAt: new Date().toISOString(),
    school: settings?.school_name || 'Limbando Private School',
    version: '2.0-fullstack',
    database: {
      users,
      teachers,
      pupils,
      attendance,
      scanLogs,
      settings,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Limbando_School_Backup_${new Date().toISOString().split('T')[0]}.json"`
  );
  res.json(backupData);
});

// Download Raw SQLite File (.db)
exportRouter.get('/db-file', requireAuth, requireRole('ADMIN'), (req, res) => {
  const dbPath = path.resolve(process.cwd(), 'data', 'school.db');
  if (!fs.existsSync(dbPath)) {
    res.status(404).json({ error: 'Database file not found on disk.' });
    return;
  }
  res.download(dbPath, `school_${new Date().toISOString().split('T')[0]}.db`);
});

// List Database Tables and Row Counts
exportRouter.get('/tables', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const tables = [
      { name: 'pupils', description: 'Enrolled student records and biometric profiles' },
      { name: 'teachers', description: 'Teacher educator profiles and scan metrics' },
      { name: 'attendance_records', description: 'Daily attendance check-ins and roll calls' },
      { name: 'scan_logs', description: 'Audit history of all gate biometric and QR scans' },
      { name: 'users', description: 'System credentials and administrative accounts' },
      { name: 'school_settings', description: 'School identity, cooldowns, and operational rules' },
    ];

    const result = tables.map(t => {
      const countRow = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${t.name}`);
      return {
        ...t,
        rowCount: countRow?.count || 0,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Execute Read-Only SQL Query
exportRouter.post('/sql-query', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      res.status(400).json({ error: 'SQL query string is required.' });
      return;
    }

    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    // Security safeguard: only allow read-only queries from the query console
    if (!upper.startsWith('SELECT') && !upper.startsWith('PRAGMA') && !upper.startsWith('EXPLAIN')) {
      res.status(403).json({ error: 'Only read-only queries (SELECT, PRAGMA) are allowed from the database console.' });
      return;
    }

    const startTime = Date.now();
    const rows = queryAll(trimmed);
    const durationMs = Date.now() - startTime;

    res.json({
      sql: trimmed,
      rowCount: rows.length,
      durationMs,
      rows: rows.slice(0, 100), // Cap at 100 rows for display
      totalFound: rows.length,
    });
  } catch (err: any) {
    res.status(400).json({ error: `SQL execution error: ${err.message}` });
  }
});

// Export Pupils CSV
exportRouter.get('/pupils-csv', requireAuth, (req, res) => {
  const pupils = queryAll('SELECT student_id, name, grade, class, status, created_at FROM pupils ORDER BY grade DESC, class ASC, name ASC');

  const headers = ['Student ID', 'Full Name', 'Grade Level', 'Class Section', 'Status', 'Admission Date'];
  const rows = pupils.map(p => [
    p.student_id,
    `"${p.name.replace(/"/g, '""')}"`,
    p.grade,
    p.class,
    p.status,
    p.created_at,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Pupils_Roster_${new Date().toISOString().split('T')[0]}.csv"`
  );
  res.send(csv);
});

// Export Attendance CSV
exportRouter.get('/attendance-csv', requireAuth, (req, res) => {
  const { date } = req.query;
  let sql = 'SELECT * FROM attendance_records';
  const params: any[] = [];
  if (date) {
    sql += ' WHERE date = ?';
    params.push(date);
  }
  sql += ' ORDER BY date DESC, time DESC';

  const records = queryAll(sql, params);
  const headers = ['Record ID', 'Student ID', 'Pupil Name', 'Grade', 'Class', 'Date', 'Time', 'Teacher', 'Status', 'Scan Method', 'Confidence'];
  const rows = records.map(r => [
    r.id,
    r.student_id,
    `"${r.pupil_name.replace(/"/g, '""')}"`,
    r.grade,
    r.class,
    r.date,
    r.time,
    `"${r.teacher_name.replace(/"/g, '""')}"`,
    r.status,
    r.scan_method || 'QR_CODE',
    r.confidence || '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Attendance_Records_${new Date().toISOString().split('T')[0]}.csv"`
  );
  res.send(csv);
});
