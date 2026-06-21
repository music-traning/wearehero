const CACHE_NAME = 'hero-pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // 必要に応じて画像ファイル名もここに追加します
   './icon-192.png',
   './icon-512.png'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// ネットワークリクエスト時の処理（キャッシュ優先）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返し、なければネットワークへリクエスト
        return response || fetch(event.request);
      })
  );
});