// Offline companion for all festivals. One root-scope worker; each festival's
// shell is cached under its own path prefix ('/tantra/', '/sexsibility/').
const CACHE = 'angsbacka-v1';
// NOTE: never precache '/' — it is a cookie-varying redirect; a redirected
// response stored there would be rejected for navigations (SecurityError).
const PRECACHE = ['/manifest-tantra.webmanifest', '/manifest-sexsibility.webmanifest'];

const prefixOf = (pathname) => {
  const m = pathname.match(/^\/([a-z-]+)(\/|$)/);
  return m ? '/' + m[1] + '/' : null;
};

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigations: network-first; cache the shell per festival prefix. The
  // res.ok guard doubles as redirect-poisoning protection: navigations use
  // redirect:'manual', so the '/' 302 arrives as opaqueredirect (ok:false)
  // and is never cached. Do not weaken this check.
  if (req.mode === 'navigate') {
    const prefix = prefixOf(url.pathname);
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin && prefix) {
            const copy = res.clone();
            const stamped = copy.blob().then((body) => {
              const h = new Headers(copy.headers);
              h.set('x-sw-cached-at', String(Date.now()));
              return new Response(body, { status: 200, headers: h });
            });
            e.waitUntil(stamped.then((r) =>
              caches.open(CACHE).then((c) => c.put(prefix, r))));
          }
          return res;
        })
        .catch(async () => {
          if (prefix) {
            const hit = await caches.match(prefix);
            if (hit) return hit;
          }
          // Offline '/' (or unknown path): most recently cached festival shell.
          const c = await caches.open(CACHE);
          let best = null, bestAt = -1;
          for (const key of await c.keys()) {
            const p = prefixOf(new URL(key.url).pathname);
            if (!p || new URL(key.url).pathname !== p) continue;
            const res = await c.match(key);
            const at = +(res.headers.get('x-sw-cached-at') || 0);
            if (at > bestAt) { bestAt = at; best = res; }
          }
          return best || Response.error();
        })
    );
    return;
  }

  // data.json (per festival): network-first with cache fallback.
  if (url.origin === self.location.origin && /^\/[a-z-]+\/data\.json$/.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Static assets (backgrounds, portraits, icons, manifests) and Google
  // Fonts: cache-first, filled at runtime.
  const cacheable =
    (url.origin === self.location.origin &&
      /\.(jpg|jpeg|png|webp|webmanifest)$/.test(url.pathname)) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
  if (cacheable) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
          }
          return res;
        })
      )
    );
  }
});
