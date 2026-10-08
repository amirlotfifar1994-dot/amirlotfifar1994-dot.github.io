/* Kavico Service Worker (v434)
   Goals:
   - Prevent stale JS/CSS/HTML during development.
   - Keep light caching for images/fonts in production.
   - Safe update + easy reset via ?reset=1 (handled in app.sw.js).
*/
const HOST = (self.location && self.location.hostname) ? self.location.hostname : '';
const IS_LOCAL_DEV =
  (HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '0.0.0.0' ||
   HOST.endsWith('.local') || /^192\.168\./.test(HOST) || /^10\./.test(HOST) ||
   /^172\.(1[6-9]|2\d|3[0-1])\./.test(HOST));

const SEARCH = (self.location && self.location.search) ? self.location.search : '';
const DEV_MODE = IS_LOCAL_DEV || /\bdev=434\b/.test(SEARCH);

const VERSION = 'kavico-v434';
const RUNTIME = 'runtime-' + VERSION;
const IMG_CACHE = 'img-' + VERSION;
const FONT_CACHE = 'font-' + VERSION;

const SCOPE = (self.registration && self.registration.scope) ? self.registration.scope : self.location.href;
const OFFLINE_FA_URL = new URL('offline/index.html', SCOPE).toString();
const OFFLINE_EN_URL = new URL('en/offline/index.html', SCOPE).toString();

self.addEventListener('message', (event) => {
  try{
    if(event && event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
    if(event && event.data && event.data.type === 'CLEAR_CACHES'){
      event.waitUntil((async()=>{
        const keys = await caches.keys();
        await Promise.all(keys.map(k=>caches.delete(k)));
      })());
    }
  }catch(e){}
});

self.addEventListener('install', (event) => {
  // Keep dev iteration snappy: do NOT precache app HTML/CSS/JS.
  // We only precache the offline fallback so document navigation has a reliable last resort.
  event.waitUntil((async()=>{
    try{
      const cache = await caches.open(RUNTIME);
      await cache.addAll([OFFLINE_FA_URL, OFFLINE_EN_URL]);
    }catch(e){}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async()=>{
    // Cleanup old caches
    const keys = await caches.keys();
    await Promise.all(keys.map((k)=>{
      if(![RUNTIME, IMG_CACHE, FONT_CACHE].includes(k)) return caches.delete(k);
    }));
    try{ if(self.registration.navigationPreload) await self.registration.navigationPreload.enable(); }catch(e){}
    await self.clients.claim();
  })());
});

function isCacheableImage(req){
  return req.destination === 'image' || /\.(png|jpg|jpeg|webp|avif|gif|svg)$/i.test(req.url);
}
function isCacheableFont(req){
  return req.destination === 'font' || /\.(woff2?|ttf|otf)$/i.test(req.url);
}
function isDoc(req){ return req.mode === 'navigate' || req.destination === 'document'; }
function isScriptOrStyle(req){ return req.destination === 'script' || req.destination === 'style'; }
function isVersionedBundle(url){ return url.pathname.startsWith('/assets/js/bundles/') || url.pathname.startsWith('/assets/css/bundles/'); }
function requestAllowsCache(req,url){
  if(url.search) return false;
  if(req.headers.get('Range') || req.headers.get('Authorization')) return false;
  return true;
}
function responseAllowsCache(res,kind){
  if(!(res && res.status === 200)) return false;
  const cc=res.headers.get('Cache-Control') || '';
  if(/\b(?:no-store|private)\b/i.test(cc) || res.headers.get('Set-Cookie')) return false;
  const ct=(res.headers.get('Content-Type') || '').toLowerCase();
  if(kind==='image' && !ct.startsWith('image/')) return false;
  if(kind==='font' && !(ct.includes('font') || ct.includes('woff') || ct.includes('octet-stream'))) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests. Never intercept form POSTs or API writes.
  if(url.origin !== self.location.origin || req.method !== 'GET') return;
  if(url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) return;

  // Dev mode: never cache HTML/CSS/JS; always go to network
  if(DEV_MODE && (isDoc(req) || isScriptOrStyle(req))){
    event.respondWith(fetch(req, {cache:'no-store'}).catch(()=>fetch(req)));
    return;
  }

  // Documents: network-first with fallback (no long-term cache)
  if(isDoc(req)){
    event.respondWith((async()=>{
      try{
        const fresh = (await event.preloadResponse) || await fetch(req);
        return fresh;
      }catch(e){
        // Try a cached copy only if available
        const cached = await caches.match(req);
        if(cached) return cached;
        // Last resort: offline page if exists
        const preferredOffline = url.pathname === '/en' || url.pathname.startsWith('/en/') ? OFFLINE_EN_URL : OFFLINE_FA_URL;
        const off = await caches.match(preferredOffline) || await caches.match(OFFLINE_FA_URL);
        return off || Response.error();
      }
    })());
    return;
  }

  // Scripts/styles: cache only versioned public bundles. Mutable source assets stay network-only.
  if(isScriptOrStyle(req)){
    if(!requestAllowsCache(req,url)){ event.respondWith(fetch(req,{cache:'no-cache'})); return; }
    if(!isVersionedBundle(url)){
      event.respondWith(fetch(req, {cache:'no-cache'}));
      return;
    }
    event.respondWith((async()=>{
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((fresh)=>{
        try{ if(responseAllowsCache(fresh,'asset')) cache.put(req, fresh.clone()); }catch(e){}
        return fresh;
      }).catch(()=>null);

      if(cached) {
        fetchPromise;
        return cached;
      }
      const res = await fetchPromise;
      return res || Response.error();
    })());
    return;
  }

  // Images: stale-while-revalidate. Fast repeat loads without pinning same-name images forever.
  if(isCacheableImage(req)){
    if(!requestAllowsCache(req,url)){ event.respondWith(fetch(req,{cache:'no-cache'})); return; }
    event.respondWith((async()=>{
      const cache = await caches.open(IMG_CACHE);
      const hit = await cache.match(req);
      const freshPromise = fetch(req).then((res)=>{
        try{ if(responseAllowsCache(res,'image')) cache.put(req,res.clone()); }catch(_e){}
        return res;
      }).catch(()=>null);
      if(hit){ freshPromise; return hit; }
      return (await freshPromise) || Response.error();
    })());
    return;
  }

  // Fonts: cache-first
  if(isCacheableFont(req)){
    if(!requestAllowsCache(req,url)){ event.respondWith(fetch(req,{cache:'no-cache'})); return; }
    event.respondWith((async()=>{
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(req);
      if(hit) return hit;
      const res = await fetch(req);
      if(responseAllowsCache(res,'font')) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Default: network
  event.respondWith(fetch(req));
});
