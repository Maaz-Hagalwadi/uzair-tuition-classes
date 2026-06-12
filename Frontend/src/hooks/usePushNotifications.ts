import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, VAPID_KEY, isFirebaseConfigured } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

const FCM_TOKEN_KEY = 'fcm_registered_token';

async function getFirebaseSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
  if (existing) return existing;
  return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
}

export function usePushNotifications() {
  const user = useAuthStore(s => s.user);

  // ── 1. Foreground message handler ──────────────────────────────────────────
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    console.log('[FCM] subscribing to foreground messages');
    const unsubscribe = onMessage(messaging, async (payload) => {
      const title = payload.data?.title || payload.notification?.title || 'Uzair Tuition Classes';
      const body  = payload.data?.body  || payload.notification?.body  || '';
      console.log('[FCM] message received:', title);
      console.log('[FCM] Notification.permission:', Notification.permission);

      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' });
      }
    });

    return unsubscribe;
  }, [user]);

  // ── 2. Token registration ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    async function registerToken() {
      try {
        const permission = await Notification.requestPermission();
        console.log('[FCM] permission:', permission);
        if (permission !== 'granted') return;

        const swReg = await getFirebaseSW();
        console.log('[FCM] SW registered:', swReg.scope);

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
        console.log('[FCM] token:', token ? token.slice(0, 20) + '…' : 'NULL');
        if (!token) return;

        if (localStorage.getItem(FCM_TOKEN_KEY) !== token) {
          await api.post('/user/fcm-token', { token });
          localStorage.setItem(FCM_TOKEN_KEY, token);
          console.log('[FCM] token saved to backend ✅');
        } else {
          console.log('[FCM] token already registered');
        }
      } catch (err) {
        console.error('[FCM] registration error:', err);
      }
    }

    registerToken();
  }, [user]);
}
