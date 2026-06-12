import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
};

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

let _messaging: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (!isFirebaseConfigured) return null;
  if (!_messaging) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    _messaging = getMessaging(app);
  }
  return _messaging;
}
