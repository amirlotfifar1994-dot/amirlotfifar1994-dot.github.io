// Retirement worker for the old root KAVICO preview, including /sw.js?v=400.
// No fetch handler: requests go directly to the network.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.scope === new URL('/', self.location.origin).href) {
      await self.registration.unregister();
    }
  })());
});
