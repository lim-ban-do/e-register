import {
  User,
  Teacher,
  Pupil,
  AttendanceRecord,
  ScanLog,
  SchoolSettings,
  ProcessScanResult,
  ScanMethod,
} from '../types';
import {
  db,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  FirebaseUser,
} from './firebase';

// Helper to asynchronously sync documents to Firestore
export async function syncToFirestore(collectionName: string, id: string, data: any) {
  try {
    await setDoc(doc(db, collectionName, id), data, { merge: true });
  } catch (err) {
    console.warn(`Firestore sync error [${collectionName}/${id}]:`, err);
  }
}

// Helper to delete document from Firestore
export async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    console.warn(`Firestore delete error [${collectionName}/${id}]:`, err);
  }
}

const STORAGE_KEYS = {
  CURRENT_USER: 'limbando_current_user',
  USERS: 'limbando_users',
  TEACHERS: 'limbando_teachers',
  PUPILS: 'limbando_pupils',
  ATTENDANCE: 'limbando_attendance',
  SCAN_LOGS: 'limbando_scan_logs',
  SETTINGS: 'limbando_settings',
  INITIALIZED: 'limbando_school_init_v6',
};

export function makeDefaultPupilAvatar(name: string, seedIndex: number = 0): string {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const hues = [
    { bg: '#0C4A34', fg: '#F8FAFC', collar: '#EAB308' },
    { bg: '#1E3A8A', fg: '#F8FAFC', collar: '#F59E0B' },
    { bg: '#0F766E', fg: '#F8FAFC', collar: '#FBBF24' },
    { bg: '#312E81', fg: '#F8FAFC', collar: '#FDE047' },
    { bg: '#14532D', fg: '#F8FAFC', collar: '#EAB308' },
  ];
  const theme = hues[seedIndex % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
    <rect width="100" height="120" fill="${theme.bg}"/>
    <circle cx="50" cy="40" r="21" fill="${theme.fg}" fill-opacity="0.95"/>
    <path d="M 20 115 C 20 80 34 70 50 70 C 66 70 80 80 80 115 Z" fill="${theme.fg}" fill-opacity="0.9"/>
    <polygon points="50,70 44,90 50,100 56,90" fill="${theme.collar}"/>
    <text x="50" y="47" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="${theme.bg}" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'Limbando Private School',
  schoolMotto: 'Knowledge · Discipline · Success',
  academicYear: '2026 - 2027 Academic Year',
  duplicateScanCooldownSeconds: 60,
  audioFeedbackEnabled: true,
  allowTeacherEditPupil: true,
};

function getTodayDateStr(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getYesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getTwoDaysAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().split('T')[0];
}

function seedDatabase() {
  const users: User[] = [
    {
      id: 'usr-admin-01',
      name: 'Dr. Arthur Hastings',
      username: 'admin',
      email: 'admin@oakridge.edu',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-01-10 08:00:00',
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
    },
    {
      id: 'usr-tch-01',
      name: 'Mr. Mwila Tembo',
      username: 'mwila',
      email: 'mwila@oakridge.edu',
      role: 'TEACHER',
      status: 'ACTIVE',
      createdAt: '2026-01-15 08:00:00',
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
    },
    {
      id: 'usr-tch-02',
      name: 'Mrs. Mutale Phiri',
      username: 'mutale',
      email: 'mutale@oakridge.edu',
      role: 'TEACHER',
      status: 'ACTIVE',
      createdAt: '2026-01-18 09:30:00',
    },
    {
      id: 'usr-tch-03',
      name: 'Mr. Joseph Banda',
      username: 'banda',
      email: 'banda@oakridge.edu',
      role: 'TEACHER',
      status: 'ACTIVE',
      createdAt: '2026-01-20 08:15:00',
    },
  ];

  const teachers: Teacher[] = [
    {
      id: 'tch-001',
      userId: 'usr-tch-01',
      name: 'Mr. Mwila Tembo',
      email: 'mwila@oakridge.edu',
      username: 'mwila',
      phone: '+260 97 123 4567',
      subject: 'Mathematics & Science',
      status: 'ACTIVE',
      createdAt: '2026-01-15 08:00:00',
      scanCount: 142,
    },
    {
      id: 'tch-002',
      userId: 'usr-tch-02',
      name: 'Mrs. Mutale Phiri',
      email: 'mutale@oakridge.edu',
      username: 'mutale',
      phone: '+260 97 234 5678',
      subject: 'English & Literature',
      status: 'ACTIVE',
      createdAt: '2026-01-18 09:30:00',
      scanCount: 98,
    },
    {
      id: 'tch-003',
      userId: 'usr-tch-03',
      name: 'Mr. Joseph Banda',
      email: 'banda@oakridge.edu',
      username: 'banda',
      phone: '+260 97 345 6789',
      subject: 'History & Civics',
      status: 'ACTIVE',
      createdAt: '2026-01-20 08:15:00',
      scanCount: 65,
    },
  ];

  const pupils: Pupil[] = [
    { id: 'pup-001', studentId: 'STU-000001', name: 'Kenneth Limbando', class: 'A', grade: '12', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Kenneth Limbando', 0), createdAt: '2026-01-12 09:00:00', updatedAt: '2026-01-12 09:00:00' },
    { id: 'pup-002', studentId: 'STU-000002', name: 'John Banda', class: 'A', grade: '12', status: 'ACTIVE', photo: makeDefaultPupilAvatar('John Banda', 1), createdAt: '2026-01-12 09:05:00', updatedAt: '2026-01-12 09:05:00' },
    { id: 'pup-003', studentId: 'STU-000003', name: 'Chileshe Mwape', class: 'B', grade: '12', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Chileshe Mwape', 2), createdAt: '2026-01-12 09:10:00', updatedAt: '2026-01-12 09:10:00' },
    { id: 'pup-004', studentId: 'STU-000004', name: 'Thandiwe Mwanza', class: 'A', grade: '11', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Thandiwe Mwanza', 3), createdAt: '2026-01-12 09:15:00', updatedAt: '2026-01-12 09:15:00' },
    { id: 'pup-005', studentId: 'STU-000005', name: 'Emmanuel Musonda', class: 'A', grade: '11', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Emmanuel Musonda', 4), createdAt: '2026-01-12 09:20:00', updatedAt: '2026-01-12 09:20:00' },
    { id: 'pup-006', studentId: 'STU-000006', name: 'Natasha Lungu', class: 'B', grade: '11', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Natasha Lungu', 0), createdAt: '2026-01-12 09:25:00', updatedAt: '2026-01-12 09:25:00' },
    { id: 'pup-007', studentId: 'STU-000007', name: 'Patrick Sakala', class: 'A', grade: '10', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Patrick Sakala', 1), createdAt: '2026-01-12 09:30:00', updatedAt: '2026-01-12 09:30:00' },
    { id: 'pup-008', studentId: 'STU-000008', name: 'Bwalya Mulenga', class: 'B', grade: '10', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Bwalya Mulenga', 2), createdAt: '2026-01-12 09:35:00', updatedAt: '2026-01-12 09:35:00' },
    { id: 'pup-009', studentId: 'STU-000009', name: 'Esther Chilufya', class: 'B', grade: '12', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Esther Chilufya', 3), createdAt: '2026-01-12 09:40:00', updatedAt: '2026-01-12 09:40:00' },
    { id: 'pup-010', studentId: 'STU-000010', name: 'David Kasonde', class: 'A', grade: '10', status: 'ACTIVE', photo: makeDefaultPupilAvatar('David Kasonde', 4), createdAt: '2026-01-12 09:45:00', updatedAt: '2026-01-12 09:45:00' },
    { id: 'pup-011', studentId: 'STU-000011', name: 'Mary Siame', class: 'B', grade: '11', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Mary Siame', 0), createdAt: '2026-01-12 09:50:00', updatedAt: '2026-01-12 09:50:00' },
    { id: 'pup-012', studentId: 'STU-000012', name: 'Kelvin Chisamba', class: 'A', grade: '12', status: 'ACTIVE', photo: makeDefaultPupilAvatar('Kelvin Chisamba', 1), createdAt: '2026-01-12 09:55:00', updatedAt: '2026-01-12 09:55:00' },
  ];

  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();
  const twoDaysAgo = getTwoDaysAgoStr();

  const attendance: AttendanceRecord[] = [
    // Today's attendance
    { id: 'att-t-01', studentId: 'STU-000001', pupilName: 'Kenneth Limbando', class: 'A', grade: '12', date: today, time: '07:42:15', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${today} 07:42:15` },
    { id: 'att-t-02', studentId: 'STU-000002', pupilName: 'John Banda', class: 'A', grade: '12', date: today, time: '07:45:32', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${today} 07:45:32` },
    { id: 'att-t-03', studentId: 'STU-000004', pupilName: 'Thandiwe Mwanza', class: 'A', grade: '11', date: today, time: '07:49:10', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${today} 07:49:10` },
    { id: 'att-t-04', studentId: 'STU-000005', pupilName: 'Emmanuel Musonda', class: 'A', grade: '11', date: today, time: '07:51:04', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${today} 07:51:04` },
    { id: 'att-t-05', studentId: 'STU-000007', pupilName: 'Patrick Sakala', class: 'A', grade: '10', date: today, time: '07:53:48', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${today} 07:53:48` },
    { id: 'att-t-06', studentId: 'STU-000008', pupilName: 'Bwalya Mulenga', class: 'B', grade: '10', date: today, time: '07:55:20', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${today} 07:55:20` },
    { id: 'att-t-07', studentId: 'STU-000010', pupilName: 'David Kasonde', class: 'A', grade: '10', date: today, time: '07:58:11', teacherId: 'tch-003', teacherName: 'Mr. Joseph Banda', status: 'PRESENT', createdAt: `${today} 07:58:11` },
    { id: 'att-t-08', studentId: 'STU-000012', pupilName: 'Kelvin Chisamba', class: 'A', grade: '12', date: today, time: '08:02:45', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${today} 08:02:45` },

    // Yesterday's attendance
    { id: 'att-y-01', studentId: 'STU-000001', pupilName: 'Kenneth Limbando', class: 'A', grade: '12', date: yesterday, time: '07:38:00', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${yesterday} 07:38:00` },
    { id: 'att-y-02', studentId: 'STU-000002', pupilName: 'John Banda', class: 'A', grade: '12', date: yesterday, time: '07:41:20', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${yesterday} 07:41:20` },
    { id: 'att-y-03', studentId: 'STU-000003', pupilName: 'Chileshe Mwape', class: 'B', grade: '12', date: yesterday, time: '07:44:12', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${yesterday} 07:44:12` },
    { id: 'att-y-04', studentId: 'STU-000004', pupilName: 'Thandiwe Mwanza', class: 'A', grade: '11', date: yesterday, time: '07:48:50', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${yesterday} 07:48:50` },
    { id: 'att-y-05', studentId: 'STU-000005', pupilName: 'Emmanuel Musonda', class: 'A', grade: '11', date: yesterday, time: '07:50:33', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${yesterday} 07:50:33` },
    { id: 'att-y-06', studentId: 'STU-000006', pupilName: 'Natasha Lungu', class: 'B', grade: '11', date: yesterday, time: '07:52:19', teacherId: 'tch-003', teacherName: 'Mr. Joseph Banda', status: 'PRESENT', createdAt: `${yesterday} 07:52:19` },
    { id: 'att-y-07', studentId: 'STU-000007', pupilName: 'Patrick Sakala', class: 'A', grade: '10', date: yesterday, time: '07:54:05', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${yesterday} 07:54:05` },
    { id: 'att-y-08', studentId: 'STU-000008', pupilName: 'Bwalya Mulenga', class: 'B', grade: '10', date: yesterday, time: '07:56:40', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${yesterday} 07:56:40` },
    { id: 'att-y-09', studentId: 'STU-000009', pupilName: 'Esther Chilufya', class: 'B', grade: '12', date: yesterday, time: '07:59:15', teacherId: 'tch-003', teacherName: 'Mr. Joseph Banda', status: 'PRESENT', createdAt: `${yesterday} 07:59:15` },
    { id: 'att-y-10', studentId: 'STU-000010', pupilName: 'David Kasonde', class: 'A', grade: '10', date: yesterday, time: '08:01:10', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${yesterday} 08:01:10` },
    { id: 'att-y-11', studentId: 'STU-000011', pupilName: 'Mary Siame', class: 'B', grade: '11', date: yesterday, time: '08:03:00', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${yesterday} 08:03:00` },

    // Two days ago attendance
    { id: 'att-2-01', studentId: 'STU-000001', pupilName: 'Kenneth Limbando', class: 'A', grade: '12', date: twoDaysAgo, time: '07:40:10', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${twoDaysAgo} 07:40:10` },
    { id: 'att-2-02', studentId: 'STU-000002', pupilName: 'John Banda', class: 'A', grade: '12', date: twoDaysAgo, time: '07:43:00', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${twoDaysAgo} 07:43:00` },
    { id: 'att-2-03', studentId: 'STU-000003', pupilName: 'Chileshe Mwape', class: 'B', grade: '12', date: twoDaysAgo, time: '07:46:18', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${twoDaysAgo} 07:46:18` },
    { id: 'att-2-04', studentId: 'STU-000004', pupilName: 'Thandiwe Mwanza', class: 'A', grade: '11', date: twoDaysAgo, time: '07:50:11', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${twoDaysAgo} 07:50:11` },
    { id: 'att-2-05', studentId: 'STU-000005', pupilName: 'Emmanuel Musonda', class: 'A', grade: '11', date: twoDaysAgo, time: '07:52:00', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${twoDaysAgo} 07:52:00` },
    { id: 'att-2-06', studentId: 'STU-000007', pupilName: 'Patrick Sakala', class: 'A', grade: '10', date: twoDaysAgo, time: '07:55:12', teacherId: 'tch-003', teacherName: 'Mr. Joseph Banda', status: 'PRESENT', createdAt: `${twoDaysAgo} 07:55:12` },
    { id: 'att-2-07', studentId: 'STU-000008', pupilName: 'Bwalya Mulenga', class: 'B', grade: '10', date: twoDaysAgo, time: '07:57:40', teacherId: 'tch-001', teacherName: 'Mr. Mwila Tembo', status: 'PRESENT', createdAt: `${twoDaysAgo} 07:57:40` },
    { id: 'att-2-08', studentId: 'STU-000012', pupilName: 'Kelvin Chisamba', class: 'A', grade: '12', date: twoDaysAgo, time: '08:00:22', teacherId: 'tch-002', teacherName: 'Mrs. Mutale Phiri', status: 'PRESENT', createdAt: `${twoDaysAgo} 08:00:22` },
  ];

  const scanLogs: ScanLog[] = [
    {
      id: 'log-01',
      scanTime: `${today} 07:42:15`,
      rawPayload: 'STU-000001',
      studentId: 'STU-000001',
      pupilName: 'Kenneth Limbando',
      teacherId: 'tch-001',
      teacherName: 'Mr. Mwila Tembo',
      outcome: 'SUCCESS',
      message: 'Recorded PRESENT at gate entrance',
    },
    {
      id: 'log-02',
      scanTime: `${today} 07:45:32`,
      rawPayload: 'STU-000002',
      studentId: 'STU-000002',
      pupilName: 'John Banda',
      teacherId: 'tch-001',
      teacherName: 'Mr. Mwila Tembo',
      outcome: 'SUCCESS',
      message: 'Recorded PRESENT at gate entrance',
    },
    {
      id: 'log-03',
      scanTime: `${today} 07:46:05`,
      rawPayload: 'STU-000002',
      studentId: 'STU-000002',
      pupilName: 'John Banda',
      teacherId: 'tch-001',
      teacherName: 'Mr. Mwila Tembo',
      outcome: 'DUPLICATE_PREVENTED',
      message: 'Blocked duplicate scan within cooldown window (33s ago)',
    },
    {
      id: 'log-04',
      scanTime: `${today} 07:49:10`,
      rawPayload: 'STU-000004',
      studentId: 'STU-000004',
      pupilName: 'Thandiwe Mwanza',
      teacherId: 'tch-001',
      teacherName: 'Mr. Mwila Tembo',
      outcome: 'SUCCESS',
      message: 'Recorded PRESENT at main hall',
    },
    {
      id: 'log-05',
      scanTime: `${today} 07:50:22`,
      rawPayload: 'UNKNOWN-BARCODE-999',
      teacherId: 'tch-001',
      teacherName: 'Mr. Mwila Tembo',
      outcome: 'INVALID_ID',
      message: 'Student not found in database',
    },
  ];

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  localStorage.setItem(STORAGE_KEYS.PUPILS, JSON.stringify(pupils));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  localStorage.setItem(STORAGE_KEYS.SCAN_LOGS, JSON.stringify(scanLogs));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[0])); // default admin
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

export function initStorage() {
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    seedDatabase();
  } else {
    try {
      const rawPupils = localStorage.getItem(STORAGE_KEYS.PUPILS);
      if (rawPupils) {
        const pupils: Pupil[] = JSON.parse(rawPupils);
        let updated = false;
        pupils.forEach((p, idx) => {
          if (!p.photo) {
            p.photo = makeDefaultPupilAvatar(p.name, idx);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.PUPILS, JSON.stringify(pupils));
        }
      }
    } catch (e) {
      console.error('Pupil migration error:', e);
    }
  }
}

export function resetDatabase() {
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  seedDatabase();
}

// User & Auth
export function getCurrentUser(): User | null {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function getAllUsers(): User[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  return raw ? JSON.parse(raw) : [];
}

export function authenticateUser(loginInput: string, passwordInput: string): { user: User; error?: string } | { user?: null; error: string } {
  initStorage();
  const users = getAllUsers();
  const normalized = loginInput.trim().toLowerCase();
  
  // Find user by username or email
  const user = users.find(u => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized);
  if (!user) {
    return { error: 'Account not found. Please verify your username or email.' };
  }
  if (user.status === 'INACTIVE') {
    return { error: 'This account has been deactivated by administration.' };
  }

  // Simplified demo auth check: passwords default to role123 or admin123 or password
  if (passwordInput.length < 3) {
    return { error: 'Invalid password.' };
  }

  // Update last login
  user.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 19);
  updateUser(user);
  setCurrentUser(user);

  return { user };
}

export function updateUser(updated: User): void {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === updated.id);
  if (index !== -1) {
    users[index] = updated;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
  const current = getCurrentUser();
  if (current && current.id === updated.id) {
    setCurrentUser(updated);
  }
  syncToFirestore('users', updated.id, updated);
}

// Handle Google User Authentication via Firebase Auth
export function handleGoogleSignInUser(firebaseUser: FirebaseUser): User {
  initStorage();
  const users = getAllUsers();
  const email = (firebaseUser.email || '').toLowerCase();
  let existing = users.find(u => u.email.toLowerCase() === email);

  if (!existing) {
    const isAdminEmail =
      email.includes('admin') ||
      email.includes('head') ||
      email === 'limbando203@gmail.com' ||
      users.length === 0;

    existing = {
      id: `usr-g-${firebaseUser.uid}`,
      name: firebaseUser.displayName || 'Google Staff Member',
      username: email ? email.split('@')[0] : `user_${Date.now()}`,
      email: email,
      role: isAdminEmail ? 'ADMIN' : 'TEACHER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    users.push(existing);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    syncToFirestore('users', existing.id, existing);
  } else {
    existing.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (firebaseUser.displayName) existing.name = firebaseUser.displayName;
    updateUser(existing);
  }

  setCurrentUser(existing);
  return existing;
}

// Teachers
export function getAllTeachers(): Teacher[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
  return raw ? JSON.parse(raw) : [];
}

export function getTeacherById(id: string): Teacher | undefined {
  return getAllTeachers().find(t => t.id === id);
}

export function addTeacher(teacherData: { name: string; username: string; email: string; phone?: string; subject?: string }): Teacher {
  const teachers = getAllTeachers();
  const users = getAllUsers();

  const newUserId = `usr-tch-${Date.now()}`;
  const newTeacherId = `tch-${String(teachers.length + 1).padStart(3, '0')}`;

  const newUser: User = {
    id: newUserId,
    name: teacherData.name.trim(),
    username: teacherData.username.trim().toLowerCase(),
    email: teacherData.email.trim().toLowerCase(),
    role: 'TEACHER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  syncToFirestore('users', newUser.id, newUser);

  const newTeacher: Teacher = {
    id: newTeacherId,
    userId: newUserId,
    name: teacherData.name.trim(),
    email: teacherData.email.trim().toLowerCase(),
    username: teacherData.username.trim().toLowerCase(),
    phone: teacherData.phone?.trim() || '',
    subject: teacherData.subject?.trim() || 'General Educator',
    status: 'ACTIVE',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    scanCount: 0,
  };
  teachers.unshift(newTeacher);
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  syncToFirestore('teachers', newTeacher.id, newTeacher);

  return newTeacher;
}

export function updateTeacher(teacher: Teacher): void {
  const teachers = getAllTeachers();
  const index = teachers.findIndex(t => t.id === teacher.id);
  if (index !== -1) {
    teachers[index] = teacher;
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    syncToFirestore('teachers', teacher.id, teacher);
  }
  // Sync with user
  const users = getAllUsers();
  const uIdx = users.findIndex(u => u.id === teacher.userId);
  if (uIdx !== -1) {
    users[uIdx].name = teacher.name;
    users[uIdx].email = teacher.email;
    users[uIdx].username = teacher.username;
    users[uIdx].status = teacher.status;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    syncToFirestore('users', users[uIdx].id, users[uIdx]);
  }
}

export function deleteTeacher(teacherId: string): void {
  const teachers = getAllTeachers();
  const target = teachers.find(t => t.id === teacherId);
  if (!target) return;

  const filteredTeachers = teachers.filter(t => t.id !== teacherId);
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(filteredTeachers));
  deleteFromFirestore('teachers', teacherId);

  const users = getAllUsers().filter(u => u.id !== target.userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  deleteFromFirestore('users', target.userId);
}

// Pupils
export function getAllPupils(): Pupil[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PUPILS);
  return raw ? JSON.parse(raw) : [];
}

export function getPupilByStudentId(studentId: string): Pupil | undefined {
  const normalized = studentId.trim().toUpperCase();
  return getAllPupils().find(p => p.studentId.toUpperCase() === normalized);
}

export function getNextStudentId(): string {
  const pupils = getAllPupils();
  let maxNum = 0;
  for (const p of pupils) {
    const match = p.studentId.match(/STU-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  return `STU-${String(nextNum).padStart(6, '0')}`;
}

export function addPupil(data: { name: string; class: string; grade: string; photo?: string; status?: 'ACTIVE' | 'INACTIVE' }): Pupil {
  const pupils = getAllPupils();
  const studentId = getNextStudentId();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const newPupil: Pupil = {
    id: `pup-${Date.now()}`,
    studentId,
    name: data.name.trim(),
    class: data.class.trim().toUpperCase(),
    grade: data.grade.trim(),
    status: data.status || 'ACTIVE',
    photo: data.photo || undefined,
    createdAt: now,
    updatedAt: now,
  };

  pupils.unshift(newPupil);
  localStorage.setItem(STORAGE_KEYS.PUPILS, JSON.stringify(pupils));
  syncToFirestore('pupils', newPupil.id, newPupil);
  return newPupil;
}

export function updatePupil(updated: Pupil): void {
  const pupils = getAllPupils();
  const index = pupils.findIndex(p => p.id === updated.id);
  if (index !== -1) {
    updated.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    pupils[index] = updated;
    localStorage.setItem(STORAGE_KEYS.PUPILS, JSON.stringify(pupils));
    syncToFirestore('pupils', updated.id, updated);
  }
}

export function deletePupil(pupilId: string): void {
  const pupils = getAllPupils();
  const filtered = pupils.filter(p => p.id !== pupilId);
  localStorage.setItem(STORAGE_KEYS.PUPILS, JSON.stringify(filtered));
  deleteFromFirestore('pupils', pupilId);
}

// Attendance
export function getAllAttendance(): AttendanceRecord[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  return raw ? JSON.parse(raw) : [];
}

export function getTodayAttendance(): AttendanceRecord[] {
  const today = getTodayDateStr();
  return getAllAttendance().filter(a => a.date === today);
}

export function getScanLogs(): ScanLog[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.SCAN_LOGS);
  return raw ? JSON.parse(raw) : [];
}

export function addScanLog(log: Omit<ScanLog, 'id'>): ScanLog {
  const logs = getScanLogs();
  const newLog: ScanLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.SCAN_LOGS, JSON.stringify(logs.slice(0, 200)));
  return newLog;
}

// Record Scan Process
export function processPupilScan(
  payloadOrId: string,
  teacher: { id: string; name: string },
  options: {
    method?: ScanMethod;
    confidence?: number;
    faceSnapshot?: string;
  } = {}
): ProcessScanResult {
  const method = options.method || 'QR_CODE';
  const confidence = options.confidence;
  const faceSnapshot = options.faceSnapshot;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const dateStr = now.toISOString().split('T')[0];
  const fullTimestamp = `${dateStr} ${timeStr}`;

  // Clean raw payload (could be raw ID or JSON or URL containing ID)
  let cleanId = payloadOrId.trim();
  if (cleanId.includes('student_id=')) {
    const match = cleanId.match(/student_id=([A-Za-z0-9-_]+)/);
    if (match) cleanId = match[1];
  } else if (cleanId.startsWith('{')) {
    try {
      const parsed = JSON.parse(cleanId);
      if (parsed.studentId) cleanId = parsed.studentId;
      else if (parsed.id) cleanId = parsed.id;
    } catch {
      // not json
    }
  }

  // 1. Find pupil
  const pupil = getPupilByStudentId(cleanId);
  if (!pupil) {
    addScanLog({
      scanTime: fullTimestamp,
      rawPayload: payloadOrId,
      teacherId: teacher.id,
      teacherName: teacher.name,
      outcome: 'INVALID_ID',
      message: 'Student not found in database',
      scanMethod: method,
      confidence,
    });

    return {
      success: false,
      status: 'INVALID_ID',
      message: `INVALID STUDENT ID: "${cleanId}" not found.`,
      scannedAt: timeStr,
      scanMethod: method,
      confidence,
      faceSnapshot,
    };
  }

  // Check if pupil is active
  if (pupil.status === 'INACTIVE') {
    return {
      success: false,
      status: 'INVALID_ID',
      pupil,
      message: `PUPIL INACTIVE: Student ${pupil.name} (${pupil.studentId}) is deactivated.`,
      scannedAt: timeStr,
      scanMethod: method,
      confidence,
      faceSnapshot,
    };
  }

  // 2. Check for duplicate scan today & cooldown
  const settings = getSchoolSettings();
  const cooldownSeconds = settings.duplicateScanCooldownSeconds || 60;
  const todayAttendance = getTodayAttendance();
  const existingRecord = todayAttendance.find(a => a.studentId.toUpperCase() === pupil.studentId.toUpperCase());

  if (existingRecord) {
    // Check time diff in seconds
    const [recHours, recMins, recSecs] = existingRecord.time.split(':').map(Number);
    const [nowHours, nowMins, nowSecs] = timeStr.split(':').map(Number);
    const recSeconds = recHours * 3600 + recMins * 60 + (recSecs || 0);
    const nowSeconds = nowHours * 3600 + nowMins * 60 + (nowSecs || 0);
    const diff = Math.abs(nowSeconds - recSeconds);

    if (diff < cooldownSeconds) {
      addScanLog({
        scanTime: fullTimestamp,
        rawPayload: payloadOrId,
        studentId: pupil.studentId,
        pupilName: pupil.name,
        teacherId: teacher.id,
        teacherName: teacher.name,
        outcome: 'DUPLICATE_PREVENTED',
        message: `Prevented duplicate scan within ${cooldownSeconds}s cooldown (recorded ${existingRecord.time})`,
        scanMethod: method,
        confidence,
      });

      return {
        success: false,
        status: 'DUPLICATE_PREVENTED',
        pupil,
        attendance: existingRecord,
        message: `DUPLICATE CHECK-IN PREVENTED: ${pupil.name} was already recorded PRESENT at ${existingRecord.time} today.`,
        scannedAt: timeStr,
        scanMethod: method,
        confidence,
        faceSnapshot,
      };
    }
  }

  // 3. If no record existed or cooldown has passed, record attendance
  let newAttendance: AttendanceRecord;
  const allAtt = getAllAttendance();

  if (existingRecord) {
    newAttendance = existingRecord;
  } else {
    newAttendance = {
      id: `att-${Date.now()}`,
      studentId: pupil.studentId,
      pupilName: pupil.name,
      class: pupil.class,
      grade: pupil.grade,
      date: dateStr,
      time: timeStr,
      teacherId: teacher.id,
      teacherName: teacher.name,
      status: 'PRESENT',
      createdAt: fullTimestamp,
      scanMethod: method,
      confidence,
    };
    allAtt.unshift(newAttendance);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allAtt));

    // Update teacher scan count
    const teachers = getAllTeachers();
    const tIdx = teachers.findIndex(t => t.id === teacher.id);
    if (tIdx !== -1) {
      teachers[tIdx].scanCount = (teachers[tIdx].scanCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    }
  }

  const methodLabel =
    method === 'FACE_RECOGNITION'
      ? `Biometric Face Recognition (${confidence ? `${confidence}% match` : 'Matched'})`
      : method === 'QR_CODE'
      ? 'Student QR ID Card'
      : 'Manual Entry';

  addScanLog({
    scanTime: fullTimestamp,
    rawPayload: payloadOrId,
    studentId: pupil.studentId,
    pupilName: pupil.name,
    teacherId: teacher.id,
    teacherName: teacher.name,
    outcome: 'SUCCESS',
    message: `Attendance logged via ${methodLabel} as PRESENT at ${timeStr}`,
    scanMethod: method,
    confidence,
  });

  syncToFirestore('attendance', newAttendance.id, newAttendance);

  return {
    success: true,
    status: 'SUCCESS',
    pupil,
    attendance: newAttendance,
    message: `PUPIL LOGGED IN: Attendance recorded via ${methodLabel} at ${timeStr}.`,
    scannedAt: timeStr,
    scanMethod: method,
    confidence,
    faceSnapshot,
  };
}

export function processQrScan(payload: string, teacher: { id: string; name: string }): ProcessScanResult {
  return processPupilScan(payload, teacher, { method: 'QR_CODE' });
}

// Settings
export function getSchoolSettings(): SchoolSettings {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export function updateSchoolSettings(settings: SchoolSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  syncToFirestore('settings', 'schoolConfig', settings);
}

// Continuous real-time synchronization with Firestore
export function initFirestoreSync() {
  try {
    // 1. Sync pupils
    onSnapshot(collection(db, 'pupils'), snapshot => {
      if (!snapshot.empty) {
        const remotePupils: Pupil[] = [];
        snapshot.forEach(docSnap => {
          remotePupils.push(docSnap.data() as Pupil);
        });
        if (remotePupils.length > 0) {
          localStorage.setItem(STORAGE_KEYS.PUPILS, JSON.stringify(remotePupils));
        }
      }
    }, err => console.warn('Firestore pupils listener:', err));

    // 2. Sync attendance
    onSnapshot(collection(db, 'attendance'), snapshot => {
      if (!snapshot.empty) {
        const remoteAttendance: AttendanceRecord[] = [];
        snapshot.forEach(docSnap => {
          remoteAttendance.push(docSnap.data() as AttendanceRecord);
        });
        if (remoteAttendance.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(remoteAttendance));
        }
      }
    }, err => console.warn('Firestore attendance listener:', err));

    // 3. Sync settings
    onSnapshot(doc(db, 'settings', 'schoolConfig'), docSnap => {
      if (docSnap.exists()) {
        const remoteSettings = docSnap.data() as SchoolSettings;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remoteSettings));
      }
    }, err => console.warn('Firestore settings listener:', err));

    // 4. Sync scan logs
    onSnapshot(collection(db, 'scanLogs'), snapshot => {
      if (!snapshot.empty) {
        const remoteLogs: ScanLog[] = [];
        snapshot.forEach(docSnap => {
          remoteLogs.push(docSnap.data() as ScanLog);
        });
        if (remoteLogs.length > 0) {
          localStorage.setItem(STORAGE_KEYS.SCAN_LOGS, JSON.stringify(remoteLogs.slice(0, 200)));
        }
      }
    }, err => console.warn('Firestore scan logs listener:', err));

    // Seed database if Firestore has not been initialized yet
    seedFirestoreIfEmpty().catch(e => console.warn('Firestore seed error:', e));
  } catch (err) {
    console.warn('Could not initialize Firestore real-time sync:', err);
  }
}

// Seed initial database into Firestore if empty
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'pupils'));
    if (snap.empty) {
      console.info('Firestore is empty. Seeding initial school records to Firestore...');
      const pupils = getAllPupils();
      for (const p of pupils) {
        await syncToFirestore('pupils', p.id, p);
      }
      const teachers = getAllTeachers();
      for (const t of teachers) {
        await syncToFirestore('teachers', t.id, t);
      }
      const settings = getSchoolSettings();
      await syncToFirestore('settings', 'schoolConfig', settings);
      const att = getAllAttendance();
      for (const a of att.slice(0, 10)) {
        await syncToFirestore('attendance', a.id, a);
      }
      const logs = getScanLogs();
      for (const l of logs.slice(0, 10)) {
        await syncToFirestore('scanLogs', l.id, l);
      }
      console.info('Firebase Firestore seeding complete.');
    }
  } catch (e) {
    console.warn('seedFirestoreIfEmpty check:', e);
  }
}
