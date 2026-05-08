'use client';

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'gridfocus_offline_db';
const DB_VERSION = 1;

interface OfflineDB {
  general_data: {
    key: string;
    value: any;
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      path: string;
      operation: 'set' | 'update' | 'add' | 'delete';
      data?: any;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('general_data');
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function saveLocal(key: string, value: any) {
  const db = await getDB();
  if (!db) return;
  return db.put('general_data', value, key);
}

export async function getLocal(key: string) {
  const db = await getDB();
  if (!db) return null;
  return db.get('general_data', key);
}

export async function addPendingSync(data: Omit<OfflineDB['sync_queue']['value'], 'id' | 'timestamp'>) {
  const db = await getDB();
  if (!db) return;
  const syncItem = {
    ...data,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  return db.add('sync_queue', syncItem);
}

export async function getPendingSyncs() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('sync_queue');
}

export async function deletePendingSync(id: string) {
  const db = await getDB();
  if (!db) return;
  return db.delete('sync_queue', id);
}