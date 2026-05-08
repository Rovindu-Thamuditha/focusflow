'use client';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface UpdateInfo {
  latestVersion: string;
  apkUrl: string;
  releaseNotes?: string;
}

/**
 * Checks if a new APK version is available by fetching version.json.
 * Only runs on native platforms (Android/iOS).
 * Ensure version.json is hosted at your public web root.
 */
export async function checkAppUpdate(): Promise<UpdateInfo | null> {
  // Only run check on native apps
  if (!Capacitor.isNativePlatform()) return null;
  
  // Skip if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  try {
    const info = await App.getInfo();
    const currentVersion = info.version;

    // Fetch the version metadata from your server
    // Change this to an absolute URL if needed (e.g., https://your-site.com/version.json)
    const response = await fetch('/version.json', { cache: 'no-store' });
    
    if (!response.ok) return null;

    const data = (await response.json()) as UpdateInfo;
    
    // Compare versions (simple equality check)
    if (data.latestVersion && data.latestVersion !== currentVersion) {
      return data;
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
  
  return null;
}
