// The old single-festival host (tantra-festival.kindship-ai.workers.dev)
// 301-redirects everything to the multi-festival host — except /sw.js.
//
// /sw.js must NOT redirect: service-worker script fetches reject redirects,
// so installed tantra PWAs would keep their old worker forever and serve the
// frozen July app offline. Instead we serve a kill-switch worker that
// unregisters itself, clears caches, and reloads open tabs (which then hit
// the 301 and land on the new host).
const TARGET = 'https://angsbacka.kindship-ai.workers.dev';

const KILL_SW = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
`;

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/sw.js') {
      return new Response(KILL_SW, {
        headers: {
          'content-type': 'text/javascript;charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }
    return Response.redirect(TARGET + url.pathname + url.search, 301);
  },
};
