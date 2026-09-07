/**
 * Node 22+, built-ins only. Importing this module performs no I/O or requests.
 * Run: node frontend/server/geocoding.mjs (PORT=4600, HOST=127.0.0.1).
 * Required: SUPABASE_URL, SUPABASE_ANON_KEY. Optional: NOMINATIM_URL,
 * NOMINATIM_USER_AGENT (include operator contact), NOMINATIM_CACHE_PATH.
 * Production must route /api/geocode to ONE process for the entire application,
 * with persistent private disk. Vite preview deliberately has no backend.
 * Stop the proxy before backfill. All processes MUST use the same cache path.
 * A crash leaves <cache>.lock: remove it manually ONLY after confirming no owner
 * is running. Never use replicas, ephemeral caches, or autocomplete with this API.
 * Query strings are clinic/place addresses only, never patient information.
 */
import { mkdir, open, readFile, rename, rm } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createServer } from "node:http"
import { randomUUID } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"

export const DEFAULT_CACHE_PATH = fileURLToPath(
  new URL("../.cache/nominatim.json", import.meta.url),
)
export const MAX_QUERY_LENGTH = 200
export const DEFAULT_USER_AGENT =
  "HealStats/1.0 (+https://github.com/sucksatcse/HealStats)"
export const DEFAULT_ENDPOINT = "https://nominatim.openstreetmap.org/search"

export class GeocodingError extends Error {
  constructor(status = 502, key = "map:placeSearchError") {
    super(key)
    this.status = status
  }
}

export function normalizeQuery(query) {
  if (
    typeof query !== "string" ||
    query.length > MAX_QUERY_LENGTH ||
    /[\u0000-\u001f\u007f]/u.test(query)
  ) {
    throw new GeocodingError(400)
  }
  const normalized = query.normalize("NFC").trim().replace(/\s+/gu, " ")
  if (normalized.length < 2 || normalized.length > MAX_QUERY_LENGTH)
    throw new GeocodingError(400)
  return normalized
}

export function isPlaceResult(place) {
  return (
    place !== null &&
    typeof place === "object" &&
    typeof place.id === "string" &&
    place.id.length > 0 &&
    place.id.length <= 200 &&
    typeof place.label === "string" &&
    place.label.trim().length > 0 &&
    place.label.length <= 2000 &&
    Number.isFinite(place.latitude) &&
    place.latitude >= 20.5 &&
    place.latitude <= 26.7 &&
    Number.isFinite(place.longitude) &&
    place.longitude >= 88 &&
    place.longitude <= 92.7
  )
}

export function parseNominatimResults(payload) {
  if (!Array.isArray(payload)) throw new GeocodingError()
  const seen = new Set()
  return payload
    .flatMap((item) => {
      if (
        !item ||
        item.address?.country_code !== "bd" ||
        !["node", "way", "relation"].includes(item.osm_type) ||
        !/^[0-9]+$/.test(String(item.osm_id)) ||
        !["string", "number"].includes(typeof item.lat) ||
        !["string", "number"].includes(typeof item.lon) ||
        String(item.lat).trim() === "" ||
        String(item.lon).trim() === ""
      )
        return []
      const place = {
        id: `${item.osm_type}/${item.osm_id}`,
        label: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      }
      if (!isPlaceResult(place) || seen.has(place.id)) return []
      seen.add(place.id)
      return [place]
    })
    .slice(0, 5)
}

/** Atomic private checkpoint, synced before rename and directory sync. */
export async function atomicWriteJson(file, value) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${randomUUID()}.tmp`
  try {
    const handle = await open(temporary, "wx", 0o600)
    try {
      await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`)
      await handle.sync()
    } finally {
      await handle.close()
    }
    await rename(temporary, file)
    const directory = await open(dirname(file), "r")
    try {
      await directory.sync()
    } finally {
      await directory.close()
    }
  } finally {
    await rm(temporary, { force: true })
  }
}

export function parseCache(text) {
  const state = JSON.parse(text)
  if (
    state?.version !== 1 ||
    !Number.isFinite(state.lastStartedAt) ||
    !Number.isFinite(state.blockedUntil) ||
    !Array.isArray(state.entries)
  )
    throw new GeocodingError(503)
  const keys = new Set()
  for (const entry of state.entries) {
    if (
      !entry ||
      typeof entry.key !== "string" ||
      keys.has(entry.key) ||
      entry.countryCode !== "bd" ||
      !Array.isArray(entry.results) ||
      entry.results.length > 5 ||
      !entry.results.every(isPlaceResult)
    )
      throw new GeocodingError(503)
    const key = JSON.parse(entry.key)
    if (
      !Array.isArray(key) ||
      key.length !== 2 ||
      typeof key[0] !== "string" ||
      normalizeQuery(key[1]).toLowerCase() !== key[1]
    )
      throw new GeocodingError(503)
    keys.add(entry.key)
  }
  return state
}

/** Includes body parsing in the timeout; redirects never forward private headers. */
export async function fetchJson(
  fetchImpl,
  url,
  options = {},
  timeoutMs = 10000,
) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      ...options,
      redirect: "error",
      signal: controller.signal,
    })
    if (!response.ok) return { response, data: null }
    return { response, data: await response.json() }
  } finally {
    clearTimeout(timer)
  }
}

/** Lifetime disk lock + serial queue; even cached searches remain authenticated upstream. */
export function createGeocoder({
  endpoint = DEFAULT_ENDPOINT,
  userAgent = DEFAULT_USER_AGENT,
  cachePath = DEFAULT_CACHE_PATH,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  wait = delay,
  intervalMs = 1100,
  timeoutMs = 10000,
  maxQueue = 50,
} = {}) {
  let baseUrl
  try {
    baseUrl = new URL(endpoint)
  } catch {
    throw new GeocodingError(503)
  }
  if (
    !["http:", "https:"].includes(baseUrl.protocol) ||
    baseUrl.username ||
    baseUrl.password ||
    !userAgent?.trim() ||
    /[\r\n]/.test(userAgent) ||
    !Number.isFinite(intervalMs) ||
    intervalMs < 1100 ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  )
    throw new GeocodingError(503)
  const file = resolve(cachePath)
  const lock = `${file}.lock`
  let state
  let initialization
  let ownsLock = false
  let closed = false
  let failed = false
  let pending = 0
  let tail = Promise.resolve()

  async function initialize() {
    if (closed || failed) throw new GeocodingError(503)
    initialization ??= (async () => {
      await mkdir(dirname(file), { recursive: true, mode: 0o700 })
      await mkdir(lock, { mode: 0o700 }) // EEXIST fails closed; no unsafe stale-lock stealing.
      ownsLock = true
      await atomicWriteJson(`${lock}/owner.json`, { pid: process.pid })
      try {
        state = parseCache(await readFile(file, "utf8"))
      } catch (error) {
        if (error.code !== "ENOENT") throw error // Never silently discard a corrupt cache.
        state = { version: 1, lastStartedAt: 0, blockedUntil: 0, entries: [] }
      }
      // Also wait a full interval after acquiring ownership on a fresh/restarted process.
      state.lastStartedAt = Math.max(state.lastStartedAt, now())
    })().catch(() => {
      failed = true
      throw new GeocodingError(503)
    })
    return initialization
  }

  async function persist() {
    try {
      await atomicWriteJson(file, state)
    } catch {
      failed = true
      throw new GeocodingError(503)
    }
  }

  async function lookup(query) {
    await initialize()
    const key = JSON.stringify([baseUrl.href, query.toLowerCase()])
    const cached = state.entries.find((entry) => entry.key === key)
    if (cached) return structuredClone(cached.results) // Includes [] negative cache hits.
    if (state.blockedUntil > now())
      throw new GeocodingError(429, "map:rateLimited")
    while (now() - state.lastStartedAt < intervalMs) {
      await wait(intervalMs - (now() - state.lastStartedAt))
    }
    const url = new URL(baseUrl)
    url.search = new URLSearchParams({
      q: query,
      format: "jsonv2",
      countrycodes: "bd",
      bounded: "1",
      viewbox: "88,26.7,92.7,20.5",
      addressdetails: "1",
      limit: "5",
      "accept-language": "en,bn",
    }).toString()
    state.lastStartedAt = now()
    await persist() // Reserve durably before contacting the provider.
    state.lastStartedAt = now() // Actual request start; disk latency cannot shorten spacing.
    try {
      const { response, data } = await fetchJson(
        fetchImpl,
        url,
        {
          headers: { "User-Agent": userAgent, Accept: "application/json" },
        },
        timeoutMs,
      )
      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          const retry = response.headers.get("retry-after")
          const seconds = retry?.trim() ? Number(retry) : NaN
          const until = Number.isFinite(seconds)
            ? now() + seconds * 1000
            : Date.parse(retry ?? "")
          state.blockedUntil = Math.max(
            now() + 60000,
            Number.isFinite(until) ? until : 0,
          )
        }
        throw new GeocodingError(
          response.status === 429 ? 429 : response.status === 503 ? 503 : 502,
          response.status === 429 ? "map:rateLimited" : "map:placeSearchError",
        )
      }
      const results = parseNominatimResults(data)
      state.entries.push({ key, countryCode: "bd", results })
      return structuredClone(results)
    } catch (error) {
      if (error instanceof GeocodingError) throw error
      throw new GeocodingError(502)
    } finally {
      await persist() // Persist cooldown, actual start and positive/negative results.
    }
  }

  return {
    open: initialize,
    search(query) {
      try {
        query = normalizeQuery(query)
      } catch (error) {
        return Promise.reject(error)
      }
      if (closed || failed) return Promise.reject(new GeocodingError(503))
      if (pending >= maxQueue)
        return Promise.reject(new GeocodingError(429, "map:rateLimited"))
      pending++
      const result = tail.then(() => lookup(query))
      tail = result
        .catch(() => {})
        .finally(() => {
          pending--
        })
      return result
    },
    async close() {
      closed = true
      await tail
      await initialization?.catch(() => {})
      if (ownsLock) {
        await rm(lock, { recursive: true })
        ownsLock = false
      }
    },
  }
}

/** Read-only identity + authoritative staff lookup; never trust user metadata. */
export async function requireAdmin(
  token,
  {
    supabaseUrl,
    supabaseAnonKey,
    fetchImpl = globalThis.fetch,
    timeoutMs = 10000,
  },
) {
  if (
    typeof token !== "string" ||
    !token ||
    /\s/.test(token) ||
    token.length > 8192
  ) {
    throw new GeocodingError(401, "map:loginRequired")
  }
  if (!supabaseUrl || !supabaseAnonKey) throw new GeocodingError(503)
  try {
    const base = new URL(supabaseUrl)
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    )
      throw new GeocodingError(503)
    const headers = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }
    const identity = await fetchJson(
      fetchImpl,
      new URL("/auth/v1/user", base),
      { headers },
      timeoutMs,
    )
    if (!identity.response.ok) {
      throw new GeocodingError(
        identity.response.status < 500 ? 401 : 503,
        identity.response.status < 500
          ? "map:loginRequired"
          : "map:placeSearchError",
      )
    }
    if (typeof identity.data?.id !== "string" || !identity.data.id)
      throw new GeocodingError(401, "map:loginRequired")
    const url = new URL("/rest/v1/staff", base)
    url.search = new URLSearchParams({
      select: "role,designation,is_active",
      auth_user_id: `eq.${identity.data.id}`,
      limit: "2",
    }).toString()
    const staff = await fetchJson(fetchImpl, url, { headers }, timeoutMs)
    if (!staff.response.ok) throw new GeocodingError(503)
    if (
      !Array.isArray(staff.data) ||
      staff.data.length !== 1 ||
      staff.data[0]?.role !== "admin" ||
      staff.data[0].is_active !== true ||
      ["nurse", "clinical_officer"].includes(staff.data[0].designation)
    ) {
      throw new GeocodingError(403, "map:loginRequired")
    }
  } catch (error) {
    if (error instanceof GeocodingError) throw error
    throw new GeocodingError(503)
  }
}

export function configFromEnv(env = process.env) {
  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    endpoint: env.NOMINATIM_URL || DEFAULT_ENDPOINT,
    userAgent: env.NOMINATIM_USER_AGENT || DEFAULT_USER_AGENT,
    cachePath: env.NOMINATIM_CACHE_PATH || DEFAULT_CACHE_PATH,
  }
}

export function createGeocodingMiddleware(config = {}) {
  const options = { ...configFromEnv(), ...config }
  const geocoder = createGeocoder(options)
  const middleware = async (
    req,
    res,
    next = () => {
      res.statusCode = 404
      res.end()
    },
  ) => {
    let url
    try {
      url = new URL(req.url ?? "/", "http://localhost")
    } catch {
      res.statusCode = 400
      res.setHeader("Cache-Control", "private, no-store")
      res.setHeader("Content-Type", "application/json; charset=utf-8")
      res.end(JSON.stringify({ error: "map:placeSearchError" }))
      return
    }
    if (url.pathname !== "/api/geocode") return next()
    res.setHeader("Cache-Control", "private, no-store")
    res.setHeader("Vary", "Authorization")
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.setHeader("X-Content-Type-Options", "nosniff")
    try {
      if (req.method !== "GET") {
        res.setHeader("Allow", "GET")
        throw new GeocodingError(405)
      }
      const authorization = req.headers.authorization
      const token =
        typeof authorization === "string"
          ? /^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
          : undefined
      await requireAdmin(token, options) // Auth required on every call, including cache hits.
      if (url.searchParams.getAll("q").length !== 1)
        throw new GeocodingError(400)
      const results = await geocoder.search(url.searchParams.get("q"))
      res.statusCode = 200
      res.end(JSON.stringify(results))
    } catch (error) {
      res.statusCode = error instanceof GeocodingError ? error.status : 503
      res.end(
        JSON.stringify({
          error:
            error instanceof GeocodingError
              ? error.message
              : "map:placeSearchError",
        }),
      )
    }
  }
  middleware.close = () => geocoder.close()
  return middleware
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const middleware = createGeocodingMiddleware()
  const server = createServer((req, res) => {
    void middleware(req, res)
  })
  server.on("error", () => {
    console.error("Geocoding server could not start.")
    process.exitCode = 1
  })
  server.listen(
    Number(process.env.PORT || 4600),
    process.env.HOST || "127.0.0.1",
  )
  const shutdown = () =>
    server.close(() => {
      void middleware.close().catch(() => {
        process.exitCode = 1
      })
    })
  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)
}
