'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, persistentLocalCache } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    // Use initializeFirestore to enable offline persistence.
    // It gracefully fails to persistent cache if the platform doesn't support it.
    const firestore = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache(/*settings*/{}),
    });
    return getSdks(firebaseApp, firestore);
  }

  // If already initialized, return the SDKs with the already initialized App
  const app = getApp();
  const firestore = getFirestore(app);
  return getSdks(app, firestore);
}

export function getSdks(firebaseApp: FirebaseApp, firestore: any) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
