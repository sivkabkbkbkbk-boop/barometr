// Барометр неба — работа без интернета
const SHELL = "barometr-shell-v2";
const DATA = "barometr-data-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // приложение: сначала из кэша, в фоне обновляем
  if (url.origin === location.origin) {
    e.respondWith(caches.open(SHELL).then(async c => {
      const hit = await c.match(e.request, {ignoreSearch: true});
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // шрифты: из кэша
  if (url.host.includes("fonts.g")) {
    e.respondWith(caches.open(SHELL).then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; })));
  }
  // данные погоды: приложение само хранит их на телефоне, поэтому сеть напрямую
});
