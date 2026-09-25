import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'school.db');

let dbInstance: SqlJsDatabase | null = null;

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error loading existing school.db, initializing fresh database:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Run schema migrations and initial seed
  await initSchemaAndSeed(dbInstance);
  persistDb();

  return dbInstance;
}

export function persistDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error persisting database to disk:', err);
  }
}

// Helper to run query returning array of objects
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

// Helper to run query returning single object or null
export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const all = queryAll<T>(sql, params);
  return all.length > 0 ? all[0] : null;
}

// Helper to run insert/update/delete
export function execute(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  persistDb();
}

// Schema migration & initial seed
async function initSchemaAndSeed(db: SqlJsDatabase): Promise<void> {
  // 1. Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_login TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      username TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      scan_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pupils (
      id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      grade TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      photo TEXT,
      face_descriptor_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      pupil_name TEXT NOT NULL,
      class TEXT NOT NULL,
      grade TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      status TEXT NOT NULL,
      scan_method TEXT DEFAULT 'QR_CODE',
      confidence REAL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scan_logs (
      id TEXT PRIMARY KEY,
      scan_time TEXT NOT NULL,
      raw_payload TEXT NOT NULL,
      student_id TEXT,
      pupil_name TEXT,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      outcome TEXT NOT NULL,
      message TEXT NOT NULL,
      scan_method TEXT DEFAULT 'QR_CODE',
      confidence REAL
    );

    CREATE TABLE IF NOT EXISTS school_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      school_name TEXT NOT NULL,
      school_motto TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      duplicate_cooldown_seconds INTEGER DEFAULT 60,
      audio_feedback_enabled INTEGER DEFAULT 1,
      allow_teacher_edit_pupil INTEGER DEFAULT 1
    );
  `);

  // 2. Check if users are seeded
  const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0]?.[0] || 0;

  if (Number(userCount) === 0) {
    console.log('[DB] Seeding initial users, teachers, pupils, and settings...');

    const defaultAdminHash = await bcrypt.hash('admin123', 10);
    const defaultTeacherHash = await bcrypt.hash('teacher123', 10);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Seed Admin
    db.run(
      `INSERT INTO users (id, name, username, email, password_hash, role, status, last_login, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr-admin-01',
        'Dr. Arthur Hastings',
        'admin',
        'admin@oakridge.edu',
        defaultAdminHash,
        'ADMIN',
        'ACTIVE',
        now,
        now,
        now,
      ]
    );

    // Seed Teachers
    const teachersData = [
      {
        userId: 'usr-tch-01',
        teacherId: 'tch-001',
        name: 'Mr. Mwila Tembo',
        username: 'mwila',
        email: 'mwila@oakridge.edu',
        phone: '+260 97 123 4567',
        subject: 'Mathematics & Science',
        scanCount: 142,
      },
      {
        userId: 'usr-tch-02',
        teacherId: 'tch-002',
        name: 'Mrs. Mutale Phiri',
        username: 'mutale',
        email: 'mutale@oakridge.edu',
        phone: '+260 97 234 5678',
        subject: 'English & Literature',
        scanCount: 98,
      },
      {
        userId: 'usr-tch-03',
        teacherId: 'tch-003',
        name: 'Mr. Joseph Banda',
        username: 'banda',
        email: 'banda@oakridge.edu',
        phone: '+260 97 345 6789',
        subject: 'History & Civics',
        scanCount: 65,
      },
    ];

    for (const t of teachersData) {
      db.run(
        `INSERT INTO users (id, name, username, email, password_hash, role, status, last_login, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.userId, t.name, t.username, t.email, defaultTeacherHash, 'TEACHER', 'ACTIVE', now, now, now]
      );

      db.run(
        `INSERT INTO teachers (id, user_id, name, email, username, phone, subject, status, scan_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.teacherId, t.userId, t.name, t.email, t.username, t.phone, t.subject, 'ACTIVE', t.scanCount, now]
      );
    }

    // Seed Pupils (with avatars)
    const pupilsData = [
      { id: 'pup-001', studentId: 'STU-000001', name: 'Kenneth Limbando', class: 'A', grade: '12' },
      { id: 'pup-002', studentId: 'STU-000002', name: 'John Banda', class: 'A', grade: '12' },
      { id: 'pup-003', studentId: 'STU-000003', name: 'Chileshe Mwape', class: 'B', grade: '12' },
      { id: 'pup-004', studentId: 'STU-000004', name: 'Thandiwe Mwanza', class: 'A', grade: '11' },
      { id: 'pup-005', studentId: 'STU-000005', name: 'Emmanuel Musonda', class: 'A', grade: '11' },
      { id: 'pup-006', studentId: 'STU-000006', name: 'Natasha Lungu', class: 'B', grade: '11' },
      { id: 'pup-007', studentId: 'STU-000007', name: 'Patrick Sakala', class: 'A', grade: '10' },
      { id: 'pup-008', studentId: 'STU-000008', name: 'Bwalya Mulenga', class: 'B', grade: '10' },
      { id: 'pup-009', studentId: 'STU-000009', name: 'Esther Chilufya', class: 'B', grade: '12' },
      { id: 'pup-010', studentId: 'STU-000010', name: 'David Kasonde', class: 'A', grade: '10' },
      { id: 'pup-011', studentId: 'STU-000011', name: 'Mary Siame', class: 'B', grade: '11' },
      { id: 'pup-012', studentId: 'STU-000012', name: 'Kelvin Chisamba', class: 'A', grade: '12' },
    ];

    for (let i = 0; i < pupilsData.length; i++) {
      const p = pupilsData[i];
      const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const hues = ['#0C4A34', '#1E3A8A', '#0F766E', '#312E81', '#14532D'];
      const bg = hues[i % hues.length];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120"><rect width="100" height="120" fill="${bg}"/><circle cx="50" cy="40" r="21" fill="#F8FAFC"/><path d="M 20 115 C 20 80 34 70 50 70 C 66 70 80 80 80 115 Z" fill="#F8FAFC" fill-opacity="0.9"/><polygon points="50,70 44,90 50,100 56,90" fill="#EAB308"/><text x="50" y="47" font-family="sans-serif" font-size="14" font-weight="900" fill="${bg}" text-anchor="middle">${initials}</text></svg>`;
      const photoUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

      db.run(
        `INSERT INTO pupils (id, student_id, name, class, grade, status, photo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.studentId, p.name, p.class, p.grade, 'ACTIVE', photoUrl, now, now]
      );
    }

    // Seed Settings
    db.run(
      `INSERT INTO school_settings (id, school_name, school_motto, academic_year, duplicate_cooldown_seconds, audio_feedback_enabled, allow_teacher_edit_pupil)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      ['Limbando Private School', 'Knowledge · Discipline · Success', '2026 - 2027 Academic Year', 60, 1, 1]
    );

    // Seed initial attendance history
    const todayStr = new Date().toISOString().split('T')[0];
    const pastRecords = [
      { studentId: 'STU-000001', name: 'Kenneth Limbando', class: 'A', grade: '12', time: '07:42:15' },
      { studentId: 'STU-000002', name: 'John Banda', class: 'A', grade: '12', time: '07:45:32' },
      { studentId: 'STU-000004', name: 'Thandiwe Mwanza', class: 'A', grade: '11', time: '07:49:10' },
      { studentId: 'STU-000005', name: 'Emmanuel Musonda', class: 'A', grade: '11', time: '07:51:04' },
      { studentId: 'STU-000007', name: 'Patrick Sakala', class: 'A', grade: '10', time: '07:53:48' },
      { studentId: 'STU-000008', name: 'Bwalya Mulenga', class: 'B', grade: '10', time: '07:55:20' },
      { studentId: 'STU-000010', name: 'David Kasonde', class: 'A', grade: '10', time: '07:58:11' },
      { studentId: 'STU-000012', name: 'Kelvin Chisamba', class: 'A', grade: '12', time: '08:02:45' },
    ];

    pastRecords.forEach((r, idx) => {
      db.run(
        `INSERT INTO attendance_records (id, student_id, pupil_name, class, grade, date, time, teacher_id, teacher_name, status, scan_method, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `att-seed-${idx}`,
          r.studentId,
          r.name,
          r.class,
          r.grade,
          todayStr,
          r.time,
          'tch-001',
          'Mr. Mwila Tembo',
          'PRESENT',
          idx % 2 === 0 ? 'FACE_RECOGNITION' : 'QR_CODE',
          idx % 2 === 0 ? 97.4 : null,
          `${todayStr} ${r.time}`,
        ]
      );
    });

    console.log('[DB] Seeding completed successfully!');
  }
}
