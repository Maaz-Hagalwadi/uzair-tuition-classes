importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Replace all REPLACE_ME values with your Firebase project config.
// These are PUBLIC keys — safe to commit. Security is via Firebase rules, not these keys.
// Find them at: Firebase Console → Project Settings → Your Apps → Web App → Config
firebase.initializeApp({
  apiKey:            'AIzaSyCGINr3jGly1-lnazztoRNk0cxMcu_4MWs',
  authDomain:        'utclasses-1c260.firebaseapp.com',
  projectId:         'utclasses-1c260',
  storageBucket:     'utclasses-1c260.firebasestorage.app',
  messagingSenderId: '548537427044',
  appId:             '1:548537427044:web:f3fd5855828ad4a3c8ab71',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.data && payload.data.title) || (payload.notification && payload.notification.title) || 'Uzair Tuition Classes';
  const body  = (payload.data && payload.data.body)  || (payload.notification && payload.notification.body)  || '';
  self.registration.showNotification(title, {
    body,
    icon:  '/favicon.svg',
    badge: '/favicon.svg',
    tag:   'uzair-notification',
  });
});
