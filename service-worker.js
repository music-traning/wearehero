// アップデートのトリガーとなるバージョン管理
const CACHE_VERSION = 'v5'; 
const CACHE_NAME = `hero-pwa-cache-${CACHE_VERSION}`;

// キャッシュ対象の静的アセット
const urlsToCache = [
  './',
  './index.html',
  './data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico'
];

// 1. インストール処理：新規キャッシュの作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] キャッシュを保存しました:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. アクティベート処理：古いキャッシュの確実な削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 古いキャッシュを削除しました:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. フェッチ処理：ネットワークファースト戦略
self.addEventListener('fetch', event => {
  // 【重要修正】GETリクエスト以外（Vercel InsightsのPOST通信など）はキャッシュ処理をバイパスする
  if (event.request.method !== 'GET') {
      return;
  }

  // ブラウザの拡張機能など、http/https以外のリクエストは除外
  if (!(event.request.url.startsWith('http:') || event.request.url.startsWith('https:'))) {
      return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});