'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { syncOfflineFeedback } from '@/lib/feedback-manager';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []);

  useEffect(() => {
    // 1. Handle Android Native Back Button
    if (Capacitor.isNativePlatform()) {
      const setupBackListener = async () => {
        const listener = await App.addListener('backButton', (data) => {
          if (data.canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
        return listener;
      };
      const listenerPromise = setupBackListener();
      return () => {
        listenerPromise.then(l => l.remove());
      };
    }
  }, []);

  useEffect(() => {
    // 2. Handle Global Offline Feedback Sync
    const handleOnline = () => syncOfflineFeedback();
    window.addEventListener('online', handleOnline);
    
    // Initial sync check
    if (navigator.onLine) {
        syncOfflineFeedback();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
