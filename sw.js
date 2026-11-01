// Offline shell. Bump VERSION whenever any cached file changes.
const VERSION = "pmf1-v4";
const ASSETS = [
  "./", "./index.html", "./style.css", "./form.js", "./app.js", "./pdf.js",
  "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png",
  "./vendor/jspdf.umd.min.js", "./vendor/jspdf.plugin.autotable.min.js",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});
