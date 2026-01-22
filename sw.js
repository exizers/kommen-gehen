/* =========================================================
   Kommen–Gehen–Rechner – Service Worker
   Cache-Version: v6
   ========================================================= */

const CACHE_NAME = "kommen-gehen-v7";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

/* ===== INSTALL ===== */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // sofort aktivieren
});

/* ===== ACTIVATE ===== */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // sofort Kontrolle übernehmen
});

/* ===== FETCH ===== */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Nur erfolgreiche Responses cachen
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

/* ===== PUSH ===== */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}

  const title = data.title || "Hinweis";
  const options = {
    body: data.body || "",
    tag: data.tag || "kg",
    renotify: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* ===== NOTIFICATION CLICK ===== */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    (event.notification.data && event.notification.data.url) ||
    "./";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes("exizers.github.io/kommen-gehen")) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});

