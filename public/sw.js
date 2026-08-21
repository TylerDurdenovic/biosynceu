// Self-destructing service worker.
// If a returning customer's browser still has an OLD service worker registered
// at /sw.js (from a previous version of the site), the next time the browser
// checks for an update it fetches THIS file, sees it changed, installs it, and
// it immediately unregisters itself + wipes all caches + reloads the page with
// fresh content from the network. Harmless if no old SW exists.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        /* ignore */
      }
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((c) => c.navigate(c.url));
      } catch (e) {
        /* ignore */
      }
    })(),
  );
});
