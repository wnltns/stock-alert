importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

try {
  firebase.initializeApp({
    apiKey: 'AIzaSyApvsPuKjaqFIuTEmAiHiq6QdysBmbVW2o',
    authDomain: 'stock-alert-eef16.firebaseapp.com',
    projectId: 'stock-alert-eef16',
    storageBucket: 'stock-alert-eef16.firebasestorage.app',
    messagingSenderId: '616640051193',
    appId: '1:616640051193:web:57e62401b94ef216636f28',
    measurementId: 'G-TYQGK34CX1'
  });
} catch (e) {
  // 이미 초기화되었거나 실패
}

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'StockAlert';
  const options = {
    body: payload.notification && payload.notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});


