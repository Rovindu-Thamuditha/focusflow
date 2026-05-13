'use client';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import packageJson from '../../package.json';

/**
 * EXACT format required by the update system:
 * {
 *   "latestVersion": "1.0.5",
 *   "apkUrl": "https://gridfocus.vercel.app/downloads/gridfocus.apk",
 *   "message": "New fixes and improvements available."
 * }
 */
export interface UpdateInfo {
  latestVersion: string;
  apkUrl: string;
  message?: string;
}

// ALWAYS use full absolute URLs to prevent resolution errors in the APK environment
const VERSION_CHECK_URL = 'https://gridfocus.vercel.app/version.json';

/**
 * Checks for updates by comparing local version with remote version.json.
 * Works on Native Android (APK) and Web.
 */
export async function checkAppUpdate(): Promise<UpdateInfo | null> {
  // Graceful exit if offline to avoid false error popups
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('Update Check: Offline. Skipping.');
    return null;
  }

  try {
    // 1. Get Local Version
    let currentVersion = packageJson.version;
    if (Capacitor.isNativePlatform()) {
      const info = await App.getInfo();
      currentVersion = info.version;
    }

    console.log(`Update Check: Current local version is ${currentVersion}`);

    // 2. Fetch Remote Version with timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(VERSION_CHECK_URL, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = (await response.json()) as UpdateInfo;
    
    // 3. Compare (Simple string comparison, works for semver if formatted consistently)
    if (data.latestVersion && data.latestVersion !== currentVersion) {
      console.log(`Update Check: Update available! ${currentVersion} -> ${data.latestVersion}`);
      return data;
    }

    console.log('Update Check: App is up to date.');
    return null;
  } catch (error) {
    // Log detailed debug info but don't crash or show false "No Internet" UI
    console.error('Update Check: Failed to reach update server.', error);
    return null;
  }
}
