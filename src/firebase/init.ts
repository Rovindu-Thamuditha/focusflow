'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore 
} from 'firebase/firestore';

// Cache the Firestore instance to prevent multiple initialization errors during HMR or Strict Mode
let cachedFirestore: Firestore | null = null;

/**
 * Initializes Firebase services with offline persistence.
 */
export function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  if (!cachedFirestore) {
    // Enable offline persistence for Firestore
    cachedFirestore = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: cachedFirestore
  };
}
