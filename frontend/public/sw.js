/*
 * HealthStats service worker — minimal offline app-shell support.
 *
 * Strategy: network-first with a cache fallback. Online behaviour is identical
 * to having no service worker (every request hits the network first), so it does
 * not risk serving stale content; responses are cached only as an offline
 * fallback. Navigations fall back to the cached app shell when offline.
 */
const CACHE = "healstats-v1"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  // Only same-origin GET requests are handled; everything else is untouched.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req)
        if (fresh && fresh.status === 200 && fresh.type === "basic") {
          const cache = await caches.open(CACHE)
          cache.put(req, fresh.clone())
        }
        return fresh
      } catch (err) {
        const cached = await caches.match(req)
        if (cached) return cached
        if (req.mode === "navigate") {
          const shell = (await caches.match("/index.html")) || (await caches.match("/"))
          if (shell) return shell
        }
        throw err
      }
    })(),
  )
})
