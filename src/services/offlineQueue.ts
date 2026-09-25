export interface QueuedScan {
  id: string;
  payload: string;
  studentId?: string;
  method: 'QR_CODE' | 'FACE_RECOGNITION' | 'MANUAL';
  confidence?: number;
  timestamp: string;
  teacherId?: string;
}

const DB_NAME = 'LimbandoOfflineQueue';
const DB_VERSION = 1;
const STORE_NAME = 'queued_scans';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Queue a scan locally when network is unavailable
export async function queueScanOffline(
  payload: string,
  method: 'QR_CODE' | 'FACE_RECOGNITION' | 'MANUAL' = 'QR_CODE',
  confidence?: number,
  studentId?: string
): Promise<QueuedScan> {
  const scanItem: QueuedScan = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    payload,
    studentId,
    method,
    confidence,
    timestamp: new Date().toISOString(),
  };

  try {
    const db = await openIndexedDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add(scanItem);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log('[OfflineQueue] Queued scan locally:', scanItem);
  } catch (err) {
    console.warn('[OfflineQueue] IndexedDB write failed, falling back to localStorage queue:', err);
    const existing = JSON.parse(localStorage.getItem('limbando_offline_queue') || '[]');
    existing.push(scanItem);
    localStorage.setItem('limbando_offline_queue', JSON.stringify(existing));
  }

  return scanItem;
}

// Get all pending queued scans
export async function getQueuedScans(): Promise<QueuedScan[]> {
  try {
    const db = await openIndexedDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    const items = await new Promise<QueuedScan[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Also merge any localStorage fallbacks
    const local = JSON.parse(localStorage.getItem('limbando_offline_queue') || '[]');
    return [...items, ...local];
  } catch {
    return JSON.parse(localStorage.getItem('limbando_offline_queue') || '[]');
  }
}

// Clear flushed scans
export async function clearQueuedScans(): Promise<void> {
  try {
    const db = await openIndexedDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch {
    // ignore
  }
  localStorage.removeItem('limbando_offline_queue');
}

// Flush pending scans to server
export async function flushQueuedScansToServer(token: string): Promise<{ synced: number }> {
  const queued = await getQueuedScans();
  if (queued.length === 0) return { synced: 0 };

  try {
    const response = await fetch('/api/scans/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scans: queued }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`);
    }

    const data = await response.json();
    await clearQueuedScans();
    console.log(`[OfflineQueue] Successfully synced ${data.syncedCount || queued.length} queued scans to server.`);
    return { synced: data.syncedCount || queued.length };
  } catch (err) {
    console.warn('[OfflineQueue] Flush to server failed, will retry next online event:', err);
    throw err;
  }
}
