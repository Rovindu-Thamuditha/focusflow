'use client';

import { getPendingSyncs, deletePendingSync } from './offline-db';
import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc, Firestore } from 'firebase/firestore';

export async function processSyncQueue(db: Firestore, userId: string) {
  if (!navigator.onLine) return;

  const pending = await getPendingSyncs();
  if (pending.length === 0) return;

  console.log(`Processing ${pending.length} pending sync operations...`);

  for (const item of pending) {
    try {
      // Basic path parsing to handle collection vs doc
      // In a real app, this would be more robust
      if (item.operation === 'set') {
        await setDoc(doc(db, item.path), item.data, { merge: true });
      } else if (item.operation === 'update') {
        await updateDoc(doc(db, item.path), item.data);
      } else if (item.operation === 'delete') {
        await deleteDoc(doc(db, item.path));
      } else if (item.operation === 'add') {
        await addDoc(collection(db, item.path), item.data);
      }
      
      await deletePendingSync(item.id);
    } catch (error) {
      console.error('Failed to sync item:', item.id, error);
      // Keep in queue for next retry
    }
  }
}