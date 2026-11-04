import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import bundledFirebaseConfig from '../../firebase-applet-config.json';

// The bundled web config keeps existing installs compatible. To use a Firebase
// project selected through Render/Vercel, set ALL required VITE_FIREBASE_* vars.
// Client-side VITE_ variables are public after build: never place private keys here.
const requiredOverrides = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};
const usingEnv = Object.values(requiredOverrides).some((value) => Boolean(value));
if (usingEnv) {
  const missing = Object.entries(requiredOverrides)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Thiếu biến Firebase trên Hosting: ${missing.join(', ')}. Hãy nhập đủ bộ cấu hình.`);
  }
}

const appConfig: FirebaseOptions = usingEnv
  ? {
      apiKey: requiredOverrides.VITE_FIREBASE_API_KEY,
      authDomain: requiredOverrides.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: requiredOverrides.VITE_FIREBASE_PROJECT_ID,
      appId: requiredOverrides.VITE_FIREBASE_APP_ID,
      messagingSenderId: requiredOverrides.VITE_FIREBASE_MESSAGING_SENDER_ID,
      storageBucket: requiredOverrides.VITE_FIREBASE_STORAGE_BUCKET,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
    }
  : bundledFirebaseConfig;

// Do NOT reuse the bundled named DB ID when overriding to another Firebase project.
// For another project, VITE_FIRESTORE_DATABASE_ID defaults to '(default)'.
const databaseId = usingEnv
  ? (import.meta.env.VITE_FIRESTORE_DATABASE_ID || '(default)')
  : bundledFirebaseConfig.firestoreDatabaseId;

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(appConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = databaseId && databaseId !== '(default)'
  ? getFirestore(app, databaseId)
  : getFirestore(app);
