'use client';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface UpdateInfo {
  latestVersion: string;
  apkUrl: string;
  releaseNotes?: string;
}

const UPDATE_METADATA_URL = 'https://gridfocu.vercel.app/version.json';

/**
 * Checks if a new APK version is available by fetching version.json from the Vercel site.
 * Only runs on native platforms (Android/iOS).
 */
export async function checkAppUpdate(): Promise<UpdateInfo | null> {
  // Only run check on native apps (APK/IPA)
  if (!Capacitor.isNativePlatform()) return null;
  
  // Skip if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  try {
    // Get the version of the currently installed APK
    const info = await App.getInfo();
    const currentVersion = info.version;

    // Fetch the version metadata from your hosted Vercel site
    const response = await fetch(UPDATE_METADATA_URL, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) return null;

    const data = (await response.json()) as UpdateInfo;
    
    // Compare versions. If server version is higher/different than local, trigger update.
    if (data.latestVersion && data.latestVersion !== currentVersion) {
      console.log(`Update detected: Installed ${currentVersion}, Latest ${data.latestVersion}`);
      return data;
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
  
  return null;
}
