import { User, Teacher, Pupil, AttendanceRecord, ScanLog, SchoolSettings, ProcessScanResult, ScanMethod } from '../types';
import { queueScanOffline, flushQueuedScansToServer } from './offlineQueue';

const TOKEN_KEY = 'limbando_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Helper to make authenticated fetch requests
async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {
      // not JSON
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

// 1. Auth API
export const apiAuth = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const data = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  getMe: async (): Promise<User> => {
    const data = await apiFetch<{ user: User }>('/api/auth/me');
    return data.user;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout: () => {
    setStoredToken(null);
  },
};

// 2. Pupils API
export const apiPupils = {
  getAll: async (): Promise<Pupil[]> => {
    return apiFetch<Pupil[]>('/api/pupils');
  },

  getById: async (id: string): Promise<Pupil> => {
    return apiFetch<Pupil>(`/api/pupils/${id}`);
  },

  create: async (pupilData: {
    name: string;
    grade: string;
    class: string;
    status?: 'ACTIVE' | 'INACTIVE';
    photo?: string;
    studentId?: string;
  }): Promise<Pupil> => {
    return apiFetch<Pupil>('/api/pupils', {
      method: 'POST',
      body: JSON.stringify(pupilData),
    });
  },

  update: async (
    id: string,
    pupilData: Partial<Pupil>
  ): Promise<Pupil> => {
    return apiFetch<Pupil>(`/api/pupils/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pupilData),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/api/pupils/${id}`, {
      method: 'DELETE',
    });
  },

  bulkImport: async (
    pupils: Array<{ name: string; grade: string; class: string; studentId?: string; photo?: string }>
  ): Promise<{ importedCount: number; errorCount: number; errors: any[] }> => {
    return apiFetch('/api/pupils/bulk', {
      method: 'POST',
      body: JSON.stringify({ pupils }),
    });
  },
};

// 3. Teachers API
export const apiTeachers = {
  getAll: async (): Promise<Teacher[]> => {
    return apiFetch<Teacher[]>('/api/teachers');
  },

  getById: async (id: string): Promise<Teacher> => {
    return apiFetch<Teacher>(`/api/teachers/${id}`);
  },

  create: async (data: {
    name: string;
    email: string;
    username: string;
    phone?: string;
    subject?: string;
    password?: string;
  }): Promise<Teacher> => {
    return apiFetch<Teacher>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Teacher>): Promise<Teacher> => {
    return apiFetch<Teacher>(`/api/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/api/teachers/${id}`, {
      method: 'DELETE',
    });
  },
};

// 4. Attendance API
export const apiAttendance = {
  getRecords: async (filters?: {
    date?: string;
    grade?: string;
    class?: string;
    studentId?: string;
  }): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.set('date', filters.date);
    if (filters?.grade) params.set('grade', filters.grade);
    if (filters?.class) params.set('class', filters.class);
    if (filters?.studentId) params.set('studentId', filters.studentId);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<AttendanceRecord[]>(`/api/attendance${query}`);
  },

  getToday: async (): Promise<AttendanceRecord[]> => {
    return apiFetch<AttendanceRecord[]>('/api/attendance/today');
  },

  getStats: async (): Promise<{
    totalPupils: number;
    totalTeachers: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    attendanceRate: number;
    date: string;
  }> => {
    return apiFetch('/api/attendance/stats');
  },

  markManual: async (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'LATE',
    date?: string
  ): Promise<AttendanceRecord> => {
    return apiFetch<AttendanceRecord>('/api/attendance/manual', {
      method: 'POST',
      body: JSON.stringify({ studentId, status, date }),
    });
  },

  saveRegisterBatch: async (
    records: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }>,
    date?: string
  ): Promise<{ success: boolean; count: number }> => {
    return apiFetch('/api/attendance/register-batch', {
      method: 'POST',
      body: JSON.stringify({ records, date }),
    });
  },
};

// 5. Scans API (with offline queue fallback)
export const apiScans = {
  processScan: async (
    payload: string,
    method: ScanMethod = 'QR_CODE',
    confidence?: number,
    faceSnapshot?: string
  ): Promise<ProcessScanResult> => {
    // If browser is offline, queue locally and return simulated pending result
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await queueScanOffline(payload, method, confidence);
      const timeStr = new Date().toTimeString().split(' ')[0];
      return {
        success: true,
        status: 'SUCCESS',
        message: `OFFLINE SCAN: Attendance logged locally and queued for cloud sync.`,
        scannedAt: timeStr,
        scanMethod: method,
        confidence,
        faceSnapshot,
      };
    }

    try {
      return await apiFetch<ProcessScanResult>('/api/scans/process', {
        method: 'POST',
        body: JSON.stringify({ payload, method, confidence, faceSnapshot }),
      });
    } catch (networkErr: any) {
      // If network request failed unexpectedly, queue locally
      console.warn('Network error while scanning, saving to offline queue:', networkErr);
      await queueScanOffline(payload, method, confidence);
      const timeStr = new Date().toTimeString().split(' ')[0];
      return {
        success: true,
        status: 'SUCCESS',
        message: `OFFLINE SCAN: Attendance queued locally. Will sync when server reconnected.`,
        scannedAt: timeStr,
        scanMethod: method,
        confidence,
        faceSnapshot,
      };
    }
  },

  syncOfflineQueue: async (): Promise<{ synced: number }> => {
    const token = getStoredToken();
    if (!token) return { synced: 0 };
    return flushQueuedScansToServer(token);
  },

  getLogs: async (filters?: { outcome?: string; search?: string }): Promise<ScanLog[]> => {
    const params = new URLSearchParams();
    if (filters?.outcome) params.set('outcome', filters.outcome);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<ScanLog[]>(`/api/scans/logs${query}`);
  },
};

// 6. Settings API
export const apiSettings = {
  get: async (): Promise<SchoolSettings> => {
    return apiFetch<SchoolSettings>('/api/settings');
  },

  update: async (settings: Partial<SchoolSettings>): Promise<SchoolSettings> => {
    return apiFetch<SchoolSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// 7. Gemini AI API
export const apiAi = {
  getExecutiveSummary: async (): Promise<{
    summary: string;
    metrics: any;
    aiGenerated: boolean;
  }> => {
    return apiFetch('/api/ai/executive-summary', {
      method: 'POST',
    });
  },

  getTruancyRisk: async (): Promise<{
    atRiskCount: number;
    highRiskCount: number;
    moderateRiskCount: number;
    pupils: any[];
    aiEvaluation: string;
  }> => {
    return apiFetch('/api/ai/truancy-risk', {
      method: 'POST',
    });
  },

  query: async (queryText: string): Promise<{
    query: string;
    answer: string;
    aiGenerated: boolean;
  }> => {
    return apiFetch('/api/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query: queryText }),
    });
  },
};

// 8. Real-Time Multi-Device Sync (SSE)
export function subscribeToRealtimeEvents(onEvent: (event: { type: string; payload: any }) => void): () => void {
  const token = getStoredToken();
  if (!token || typeof window === 'undefined') {
    return () => {};
  }

  const eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

  eventSource.onmessage = e => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {
      // heartbeat or non-json comment
    }
  };

  eventSource.onerror = err => {
    console.warn('[SSE] EventSource connection interrupted, auto-reconnecting...', err);
  };

  return () => {
    eventSource.close();
  };
}

// 9. Export & Backups
export const apiExport = {
  downloadBackupUrl: () => `/api/export/backup`,
  downloadPupilsCsvUrl: () => `/api/export/pupils-csv`,
  downloadAttendanceCsvUrl: (date?: string) => (date ? `/api/export/attendance-csv?date=${date}` : `/api/export/attendance-csv`),
};
