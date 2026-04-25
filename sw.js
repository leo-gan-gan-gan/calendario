// Leogan's Calendar — Service Worker
// Compito principale: abilitare le notifiche su mobile e mantenere la PWA installabile
const CACHE_NAME = 'leogan-cal-v1';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).catch((err) => console.warn('[SW] Cache addAll error:', err))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first: la connessione a Supabase deve essere sempre fresca
// Cache-fallback solo per file statici locali in caso di offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Lascia passare TUTTO ciò che non è dello stesso origine (Supabase, fonts, ecc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Click su notifica → apri/focalizza la PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
