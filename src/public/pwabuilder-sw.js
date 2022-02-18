// This is the "Offline page" service worker

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwabuilder-page-v5";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = [
  '/offline.html',
];

self.addEventListener("message", (event) => {
  console.log(event);
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  console.log("서비스워커 설치함!");
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(offlineFallbackPage))
  );
});

// self.addEventListener('activate', function(e) {
//   e.waitUntil(
//     caches.keys().then(function(keyList) {
//           return Promise.all(keyList.map(function(key) {
//         if(offlineFallbackPage.indexOf(key) === -1) {
//           return caches.delete(key);
//         }
//       }));
//     })
//   );
// });

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}
// self.addEventListener('fetch', (event) => {
//   console.log("데이터 요청(fetch)!",event);
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
        const cachedResp = await cache.match("/offline.html");
        return cachedResp;
      }
    })());
  }
});
