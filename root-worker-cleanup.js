// Retire only the accidentally installed root worker. Project workers keep their own scopes.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    const rootScope = new URL('/', location.origin).href;
    for (const registration of registrations) {
      const worker = registration.active || registration.waiting || registration.installing;
      if (registration.scope === rootScope && worker && new URL(worker.scriptURL).pathname === '/sw.js') {
        await registration.unregister();
      }
    }
  }).catch(() => {});
}
