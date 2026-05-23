const CACHE_NAME = "wallst-pool-bar-v2";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/Logo.jpg",
  "./assets/Wall.jpg",
  "./assets/Pool mesa.jpg",
  "./assets/Pool tele.jpg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match("./index.html");
      })
    );
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      const networkFetch = fetch(event.request)
        .then(function (networkResponse) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clonedResponse);
          });
          return networkResponse;
        })
        .catch(function () {
          return cachedResponse;
        });

      return cachedResponse || networkFetch;
    })
  );
});