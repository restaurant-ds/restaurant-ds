const CACHE_NAME = "ds-restaurant-v1";
const URLS_TO_CACHE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Ne pas cacher Firebase, OSRM, ni les API externes
  if (url.hostname.includes("firebase") ||
      url.hostname.includes("googleapis") ||
      url.hostname.includes("osrm") ||
      url.hostname.includes("qrserver") ||
      url.hostname.includes("onesignal")) {
    return; // laisser passer
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(()=> caches.match("./index.html")))
  );
});

// Notifications push (si OneSignal ou FCM)
self.addEventListener("push", (event) => {
  let data = { title: "Restaurant D&S", body: "Nouvelle notification" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: "ds-notif",
      requireInteraction: true,
      vibrate: [200,100,200]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type:"window"}).then(list => {
      for (const c of list) { if (c.url.includes("restaurant-ds")) return c.focus(); }
      return clients.openWindow("./");
    })
  );
});
