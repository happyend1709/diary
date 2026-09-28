// Service Worker：实现离线缓存。首次访问时缓存全部静态资源，之后断网也能打开。
const CACHE_NAME = "diary-pwa-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./edit.html",
  "./tags.html",
  "./list.html",
  "./manifest.json",
  "./css/style.css",
  "./js/db.js",
  "./js/common.js",
  "./js/backup.js",
  "./js/calendar.js",
  "./js/edit.js",
  "./js/tags.js",
  "./js/list.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 缓存优先策略：命中缓存直接用，否则回源网络
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((res) => {
      return (
        res ||
        fetch(event.request).then((networkRes) => {
          // 仅缓存同源静态资源
          const url = new URL(event.request.url);
          if (url.origin === self.location.origin) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkRes;
        })
      );
    })
  );
});
