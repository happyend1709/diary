// Service Worker：实现离线缓存。
// 策略：
//  - 页面（导航请求）→ 网络优先，失败才回退缓存：保证每次打开都是最新版
//  - 静态资源（js/css/图标等）→ 缓存优先，命中直接用，否则回源并缓存
// 每次发布新版本时，把 CACHE_NAME 的版本号 +1，即可让所有设备自动更新到新缓存。
const CACHE_NAME = "diary-pwa-v2";
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // 导航请求（HTML 页面）：网络优先，保证页面始终最新
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkRes;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 静态资源：缓存优先，命中直接用，否则回源并缓存
  event.respondWith(
    caches.match(event.request).then((res) => {
      return (
        res ||
        fetch(event.request).then((networkRes) => {
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
