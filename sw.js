// Einfacher Offline-Cache für die App-Hülle. Daten kommen immer live aus Supabase.
const CACHE = "hm-v18";
const SHELL = ["./", "index.html", "hm-platform.js", "hm-scan.js", "hm-v2.js", "hm-advent.js", "hm-v3.js", "hm-v4.js", "hm-v5.js", "zp-core.js", "hm-v6.js", "hm-v7.js", "hm-extra.css", "supabase.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Netz zuerst, damit Updates sofort ankommen; ohne Netz aus dem Cache
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
