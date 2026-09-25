export type Role = 'ADMIN' | 'TEACHER';

export type ScanMethod = 'QR_CODE' | 'FACE_RECOGNITION' | 'MANUAL';

export interface User {
  id: string;
  name: string;
  username: string; // or email
  email: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastLogin?: string;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
  subject?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  scanCount: number;
}

export interface Pupil {
  id: string;
  studentId: string; // e.g. STU-000001
  name: string;
  class: string; // e.g. A, B, C
  grade: string; // e.g. 10, 11, 12
  status: 'ACTIVE' | 'INACTIVE';
  photo?: string; // Base64 data URL or photo URL
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  pupilName: string;
  class: string;
  grade: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  teacherId: string;
  teacherName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  createdAt: string;
  scanMethod?: ScanMethod;
  confidence?: number;
}

export interface ScanLog {
  id: string;
  scanTime: string;
  rawPayload: string;
  studentId?: string;
  pupilName?: string;
  teacherId: string;
  teacherName: string;
  outcome: 'SUCCESS' | 'DUPLICATE_PREVENTED' | 'INVALID_ID';
  message: string;
  scanMethod?: ScanMethod;
  confidence?: number;
}

export interface SchoolSettings {
  schoolName: string;
  schoolMotto: string;
  academicYear: string;
  duplicateScanCooldownSeconds: number;
  audioFeedbackEnabled: boolean;
  allowTeacherEditPupil: boolean;
}

export interface ProcessScanResult {
  success: boolean;
  status: 'SUCCESS' | 'DUPLICATE_PREVENTED' | 'INVALID_ID';
  pupil?: Pupil;
  attendance?: AttendanceRecord;
  message: string;
  scannedAt: string;
  scanMethod?: ScanMethod;
  confidence?: number;
  faceSnapshot?: string;
}
