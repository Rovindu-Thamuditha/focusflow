// IMPORTANT: This file is only intended to be used by server-side code.
// It uses the Firebase Admin SDK, which has privileged access to your data.

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Decode the Base64 encoded service account key from environment variables
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

// Check if the app is already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf8')))
    });
    console.log("Firebase Admin SDK initialized.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error: ", error.stack);
    throw new Error('Failed to initialize Firebase Admin SDK. Please check your service account credentials.');
  }
}

const firestoreAdmin = getFirestore();

export { admin, firestoreAdmin };
