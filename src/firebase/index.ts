import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-7270880107-59937",
  "appId": "1:679818752988:web:e0826847ebd8af845f9519",
  "apiKey": "AIzaSyDmu0dAjKMRympfmB2fe2HdY6Iom-A2Z84",
  "authDomain": "studio-7270880107-59937.firebaseapp.com",
  "storageBucket": "studio-7270880107-59937.appspot.com",
  "messagingSenderId": "679818752988",
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  const apps = getApps();
  if (!apps.length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0];
  }
  auth = getAuth(app);
  firestore = getFirestore(app);

  return { app, auth, firestore };
}

export { initializeFirebase };
