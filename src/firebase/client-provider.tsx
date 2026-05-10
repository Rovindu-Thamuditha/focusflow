'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // Handle Android Native Back Button
    if (!Capacitor.isNativePlatform()) return;

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
