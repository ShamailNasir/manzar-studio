/* Manzar Studio — service worker.

   This file deliberately does almost nothing, and that is the point.

   Chrome's autoplay policy has a small list of ways a site earns the
   right to start audible sound without a click. One of them is that the
   visitor has INSTALLED the site — "Add to Home screen" on mobile, or
   Install from the address bar on desktop. An installed site is exempt
   from the gate outright, on every visit, from the first second.

   Chrome will only offer that Install button for a site it considers
   installable, and that means a valid web app manifest plus a service
   worker with a fetch handler. So: a manifest (site.webmanifest, linked
   from every page) and this.

   What it must NOT do is cache. This project has already been bitten
   once by a browser serving a stale script — an mz-sound.js of 8,257
   bytes when the file on disk was 11,251 — and a caching service worker
   is that same failure with a much longer memory and no obvious way for
   a visitor to clear it. Every request below falls straight through to
   the network exactly as if this worker did not exist.

   skipWaiting + clients.claim mean a new version replaces the old one
   immediately rather than waiting for every tab to close, so this can
   never strand anyone on an old worker. */

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

/* A fetch handler has to exist for the install prompt to appear. It does
   not have to do anything: not calling respondWith() hands the request
   back to the browser's own networking, untouched and uncached. */
self.addEventListener('fetch', function () {
  /* intentionally empty — see above */
});
