// This is the "Offline page" service worker

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwabuilder-page-v2";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = [
  '/public/views/offline.html',
  '/public/pwabuilder-sw.js',
  '/public/js/bundel/app-bundel.js',
  '/public/js/FileSaver.js',
  '/public/js/peerjs.js',
  '/public/js/kakao/kakao.js',
  '/public/js/jszip/jszip.min.js',
  '/public/img/kakaolink_btn.png',
  '/public/img/logo.png',
  '/public/img/telegram_ico.png'
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//       caches.match(event.request).then(function(response) {
//           return response || fetch(event.request);
//       })
//   );
// });
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});
