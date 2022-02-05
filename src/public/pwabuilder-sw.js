// This is the "Offline page" service worker

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwabuilder-page-v4";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = [
  '/public/offline.html',
  '/public/img/kakaolink_btn.png',
  '/public/img/logo.png',
  '/public/img/telegram_ico.png',
  '/public/css/index.css',
  '/public/css/styles.css',
  '/public/css/reset.css',
  '/public/img/kakaolink_btn.png',
  '/public/img/telegram_ico.png', 
  '/public/img/logo.png', 
  '/public/img/icon/logo.ico',
  '/public/js/app.js'
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
  //   if (event.request.mode !== 'navigate') { // page navigation 제외
  //     return;
  //   }

  // event.respondWith(
  //     fetch(event.request)
  //         .catch(() => {
  //             return caches.open(CACHE)
  //                 .then((cache) => cache.match(offlineFallbackPage));
  //         }));
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
        console.log(`에러:${error}`);
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match('/public/offline.html');
        return cachedResp;
      }
    })());
  }
});
