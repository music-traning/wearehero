// アップデートのトリガーとなるバージョン管理（デプロイのたびに必ず変更すること）
const CACHE_VERSION = 'v4'; // バージョンを進める
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
      .then(() => {
        // 新しいService Workerを即座に待機状態からアクティブにする
        return self.skipWaiting();
      })
  );
});

// 2. アクティベート処理：古いキャッシュの確実な削除（最重要ロジック）
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 現在のバージョンと一致しない古いキャッシュをすべて破棄
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 古いキャッシュを削除しました:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // コントロール下のクライアント（開いているブラウザタブ）を即座に更新に同期させる
      return self.clients.claim();
    })
  );
});

// 3. フェッチ処理：ネットワークファースト戦略（HTML等の最新化を優先）
self.addEventListener('fetch', event => {
  // ブラウザの拡張機能など、http/https以外のリクエストは除外
  if (!(event.request.url.startsWith('http:') || event.request.url.startsWith('https:'))) {
      return;
  }

  event.respondWith(
    // まずネットワークへリクエストを送り、最新のデータを取得しにいく
    fetch(event.request)
      .then(response => {
        // ネットワークから正常に取得できた場合は、キャッシュを最新化して返す
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
        // オフライン時、またはネットワークエラー時はキャッシュから返す（フォールバック）
        return caches.match(event.request);
      })
  );
});