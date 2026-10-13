import { AudioItem, LanguageMode } from '@/types';

const DB_NAME = 'VoiceToTextDB';
const DB_VERSION = 1;
const STORE_NAME = 'saved_voices';

interface StoredVoiceRecord {
  id: string;
  name: string;
  size: number;
  blob: Blob;
  status: 'idle' | 'processing' | 'done' | 'error';
  transcription?: string;
  detectedLanguage?: string;
  modeUsed?: LanguageMode;
  error?: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save all audio items with their audio blobs and transcriptions
 */
export async function saveAudioItemsToStorage(items: AudioItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing to keep it synchronized with current queue state
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    // Insert all items
    for (const item of items) {
      const record: StoredVoiceRecord = {
        id: item.id,
        name: item.name,
        size: item.size,
        blob: item.file,
        status: item.status,
        transcription: item.transcription,
        detectedLanguage: item.detectedLanguage,
        modeUsed: item.modeUsed,
        error: item.error,
        timestamp: item.timestamp,
      };
      store.put(record);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save voices to storage:', err);
  }
}

/**
 * Load all saved audio items and restore their audio URLs
 */
export async function loadAudioItemsFromStorage(): Promise<AudioItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const records = await new Promise<StoredVoiceRecord[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    return records.map((record) => {
      const file = new File([record.blob], record.name, {
        type: record.blob.type || 'audio/mp3',
        lastModified: record.timestamp,
      });

      return {
        id: record.id,
        file,
        name: record.name,
        size: record.size,
        audioUrl: URL.createObjectURL(file),
        status: record.status,
        transcription: record.transcription,
        detectedLanguage: record.detectedLanguage,
        modeUsed: record.modeUsed,
        error: record.error,
        timestamp: record.timestamp,
      };
    });
  } catch (err) {
    console.error('Failed to load voices from storage:', err);
    return [];
  }
}

/**
 * Remove an individual audio item by ID
 */
export async function deleteAudioItemFromStorage(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.error('Failed to delete item from storage:', err);
  }
}

/**
 * Clear all saved voices and transcriptions from storage
 */
export async function clearAllAudioItemsFromStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
