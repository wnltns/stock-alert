// PWA Service Worker
const CACHE_NAME = 'stock-alert-v1';
const urlsToCache = [
  '/',
  '/login',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열기');
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에서 찾으면 반환
        if (response) {
          return response;
        }
        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(event.request);
      }
    )
  );
});

// Firebase 메시징 설정 (기존 기능 유지)
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
