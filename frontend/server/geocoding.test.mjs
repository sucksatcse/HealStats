import test, { after, before, mock } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  atomicWriteJson,
  createGeocoder,
  createGeocodingMiddleware,
  DEFAULT_USER_AGENT,
  normalizeQuery,
  parseCache,
  parseNominatimResults,
  requireAdmin,
} from "./geocoding.mjs"

// An accidental un-injected fetch fails locally; this suite never opens sockets.
before(() =>
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected real network attempt")
  }),
)
after(() => mock.restoreAll())

const rawPlace = {
  osm_type: "node",
  osm_id: 123,
  display_name: "Example address, Dhaka, Bangladesh",
  lat: "23.8",
  lon: "90.4",
  address: { country_code: "bd" },
}
const place = {
  id: "node/123",
  label: rawPlace.display_name,
  latitude: 23.8,
  longitude: 90.4,
}
const json = (value, status = 200, headers = {}) =>
  new Response(JSON.stringify(value), { status, headers })

async function fixture(t, fetchImpl, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), "healstats-geocoding-test-"))
  const cachePath = join(dir, "cache.json")
  const clock = { time: 100000 }
  const config = {
    cachePath,
    fetchImpl,
    now: () => clock.time,
    wait: async (ms) => {
      clock.time += ms
    },
    ...options,
  }
  const geocoder = createGeocoder(config)
  t.after(async () => {
    await geocoder.close()
    await rm(dir, { recursive: true, force: true })
  })
  return { geocoder, config, cachePath, clock }
}

test("normalizes explicit queries and rejects empty, controls and excessive length", () => {
  assert.equal(normalizeQuery("  Dhaka   clinic  "), "Dhaka clinic")
  for (const query of ["", "a", "a".repeat(201), "Dhaka\nclinic", null]) {
    assert.throws(() => normalizeQuery(query), { status: 400 })
  }
})

test("accepts only finite Bangladesh country-coded coordinates within the bounded envelope", () => {
  const invalid = [
    { lat: "" },
    { lon: null },
    { lat: "Infinity" },
    { lat: "NaN" },
    { lat: "27" },
    { lon: "87.9" },
    { lon: "92.8" },
    { address: { country_code: "in" } },
    { address: {} },
    { display_name: "" },
    { osm_type: "bad" },
    { osm_id: null },
  ]
  assert.deepEqual(
    parseNominatimResults([
      rawPlace,
      ...invalid.map((change) => ({ ...rawPlace, ...change })),
    ]),
    [place],
  )
  assert.deepEqual(parseNominatimResults([rawPlace, rawPlace]), [place])
  assert.throws(() =>
    parseNominatimResults({ error: "private upstream error" }),
  )
})

test("serializes concurrent requests, spaces actual starts >=1100ms and caches duplicate/empty results", async (t) => {
  const starts = []
  const urls = []
  const f = await fixture(t, async (url, options) => {
    starts.push(f.clock.time)
    urls.push(url)
    assert.equal(options.headers["User-Agent"], DEFAULT_USER_AGENT)
    assert.equal(options.headers.Authorization, undefined)
    assert.equal(options.headers.apikey, undefined)
    assert.equal(options.redirect, "error")
    return json(url.searchParams.get("q") === "No match" ? [] : [rawPlace])
  })
  const results = await Promise.all([
    f.geocoder.search("Dhaka clinic"),
    f.geocoder.search("  DHAKA  clinic "),
    f.geocoder.search("No match"),
    f.geocoder.search("no match"),
    f.geocoder.search("Another clinic"),
  ])
  assert.deepEqual(results, [[place], [place], [], [], [place]])
  assert.equal(starts.length, 3)
  assert.ok(
    starts.every((time, index) => !index || time - starts[index - 1] >= 1100),
  )
  assert.equal(urls[0].searchParams.get("countrycodes"), "bd")
  assert.equal(urls[0].searchParams.get("bounded"), "1")
  assert.equal(urls[0].searchParams.get("viewbox"), "88,26.7,92.7,20.5")
  assert.equal(urls[0].searchParams.get("addressdetails"), "1")
  assert.equal(urls[0].searchParams.get("limit"), "5")
  assert.equal(
    parseCache(await readFile(f.cachePath, "utf8")).entries.length,
    3,
  )
  assert.equal((await stat(f.cachePath)).mode & 0o777, 0o600)
  results[0][0].latitude = 0
  assert.deepEqual(await f.geocoder.search("Dhaka clinic"), [place])
})

test("positive and empty caches survive process replacement; endpoint switches use separate keys", async (t) => {
  const f = await fixture(t, async (url) =>
    json(url.searchParams.get("q") === "Empty place" ? [] : [rawPlace]),
  )
  await f.geocoder.search("Dhaka clinic")
  await f.geocoder.search("Empty place")
  await f.geocoder.close()
  const replacement = createGeocoder({
    ...f.config,
    fetchImpl: async () => {
      assert.fail("Cache hit contacted provider")
    },
  })
  try {
    assert.deepEqual(await replacement.search("Dhaka clinic"), [place])
    assert.deepEqual(await replacement.search("Empty place"), [])
  } finally {
    await replacement.close()
  }
  let calls = 0
  const switched = createGeocoder({
    ...f.config,
    endpoint: "https://provider.invalid/search",
    fetchImpl: async (url) => {
      assert.equal(url.hostname, "provider.invalid")
      calls++
      return json([])
    },
  })
  try {
    await switched.search("Dhaka clinic")
    assert.equal(calls, 1)
  } finally {
    await switched.close()
  }
})

test("corrupt cache fails closed instead of repeating previous queries", async (t) => {
  const f = await fixture(t, async () => {
    assert.fail("Invalid cache contacted provider")
  })
  await atomicWriteJson(f.cachePath, {
    version: 1,
    lastStartedAt: 0,
    blockedUntil: 0,
    entries: [
      {
        key: JSON.stringify(["https://provider.invalid", "dhaka"]),
        countryCode: "in",
        results: [place],
      },
    ],
  })
  await assert.rejects(f.geocoder.search("Dhaka"), { status: 503 })
  assert.throws(() => parseCache("{bad json"))
  assert.throws(() => parseCache(JSON.stringify({ version: 8, entries: [] })))
  const entry = {
    key: JSON.stringify(["https://provider.invalid", "dhaka"]),
    countryCode: "bd",
    results: [place],
  }
  for (const entries of [
    [entry, entry],
    [{ ...entry, results: [{ ...place, latitude: 40 }] }],
    [{ ...entry, key: "bad-json" }],
  ]) {
    assert.throws(() =>
      parseCache(
        JSON.stringify({
          version: 1,
          lastStartedAt: 0,
          blockedUntil: 0,
          entries,
        }),
      ),
    )
  }
})

test("provider cooldown remains in force after restarting the process", async (t) => {
  const f = await fixture(t, async () => json({}, 429))
  await assert.rejects(f.geocoder.search("Dhaka clinic"), { status: 429 })
  await f.geocoder.close()
  const replacement = createGeocoder({
    ...f.config,
    fetchImpl: async () => {
      assert.fail("Cooldown contacted provider")
    },
  })
  try {
    await assert.rejects(replacement.search("Other clinic"), { status: 429 })
  } finally {
    await replacement.close()
  }
})

test("shared disk lock denies overlapping proxy/backfill processes", async (t) => {
  const f = await fixture(t, async () => json([]))
  await f.geocoder.open()
  const second = createGeocoder(f.config)
  try {
    await assert.rejects(second.open(), { status: 503 })
  } finally {
    await second.close()
  }
  assert.deepEqual(await f.geocoder.search("Dhaka clinic"), []) // Losing lock cannot remove owner's lock.
})

for (const status of [429, 503, 500, 403]) {
  test(`upstream ${status} is sanitized, never retried; 429/503 cool down queued queries`, async (t) => {
    let calls = 0
    const f = await fixture(t, async () => {
      calls++
      return json({ secret: "must not escape" }, status, {
        "retry-after": "120",
      })
    })
    await assert.rejects(f.geocoder.search("Dhaka clinic"), {
      status: status === 429 || status === 503 ? status : 502,
      message: status === 429 ? "map:rateLimited" : "map:placeSearchError",
    })
    assert.equal(calls, 1)
    if (status === 429 || status === 503) {
      await assert.rejects(f.geocoder.search("Other clinic"), { status: 429 })
      assert.equal(calls, 1)
      const state = parseCache(await readFile(f.cachePath, "utf8"))
      assert.equal(state.entries.length, 0)
      assert.ok(state.blockedUntil >= f.clock.time + 120000)
    }
  })
}

test("aborts a hung upstream and does not retry", async (t) => {
  let calls = 0
  const f = await fixture(
    t,
    async (_url, { signal }) => {
      calls++
      return new Promise((_resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => reject(new Error("private timeout details")),
          { once: true },
        ),
      )
    },
    { timeoutMs: 5 },
  )
  await assert.rejects(f.geocoder.search("Dhaka clinic"), {
    status: 502,
    message: "map:placeSearchError",
  })
  assert.equal(calls, 1)
})

test("bounded queue rejects excess work without contacting provider", async (t) => {
  const f = await fixture(t, async () => json([]), { maxQueue: 1 })
  const first = f.geocoder.search("Dhaka clinic")
  await assert.rejects(f.geocoder.search("Another clinic"), { status: 429 })
  await first
})

const authOptions = {
  supabaseUrl: "https://supabase.invalid",
  supabaseAnonKey: "test-public-key",
}
const admin = { role: "admin", designation: "administrator", is_active: true }

test("requires validated identity and exactly one active staff admin; metadata cannot grant access", async () => {
  await assert.rejects(requireAdmin(undefined, authOptions), { status: 401 })
  for (const rows of [
    [],
    [admin, admin],
    [{ ...admin, role: "worker" }],
    [{ ...admin, designation: "nurse" }],
    [{ ...admin, designation: "clinical_officer" }],
    [{ ...admin, is_active: false }],
    [{ ...admin, is_active: null }],
  ]) {
    const calls = []
    await assert.rejects(
      requireAdmin("test-token", {
        ...authOptions,
        fetchImpl: async (url, options) => {
          calls.push(url)
          assert.equal(options.headers.Authorization, "Bearer test-token")
          assert.equal(options.method, undefined) // GET only.
          return json(
            url.pathname === "/auth/v1/user"
              ? { id: "user-id", user_metadata: { role: "admin" } }
              : rows,
          )
        },
      }),
      { status: 403 },
    )
    assert.equal(calls.length, 2)
    assert.equal(calls[1].searchParams.get("auth_user_id"), "eq.user-id")
  }
})

test("invalid identity stops before staff or provider access; auth outages are sanitized", async () => {
  for (const status of [401, 500]) {
    let calls = 0
    await assert.rejects(
      requireAdmin("token", {
        ...authOptions,
        fetchImpl: async () => {
          calls++
          return json({ error: "private" }, status)
        },
      }),
      { status: status === 401 ? 401 : 503 },
    )
    assert.equal(calls, 1)
  }
})

async function request(
  middleware,
  { url = "/api/geocode?q=Dhaka", token = "token", method = "GET" } = {},
) {
  const headers = {}
  const res = {
    statusCode: 0,
    setHeader(key, value) {
      headers[key] = value
    },
    end(body) {
      this.body = body
    },
  }
  let next = false
  await middleware(
    { url, method, headers: token ? { authorization: `Bearer ${token}` } : {} },
    res,
    () => {
      next = true
    },
  )
  return { ...res, headers, next }
}

test("middleware protects cache hits, permits GET only and sets private headers", async (t) => {
  let providerCalls = 0
  let authCalls = 0
  let active = true
  const f = await fixture(t, async (url) => {
    if (url.pathname === "/auth/v1/user") {
      authCalls++
      return json({ id: "user" })
    }
    if (url.pathname === "/rest/v1/staff")
      return json([{ ...admin, is_active: active }])
    providerCalls++
    return json([rawPlace])
  })
  const middleware = createGeocodingMiddleware({ ...f.config, ...authOptions })
  t.after(() => middleware.close())
  assert.equal((await request(middleware, { token: "" })).statusCode, 401)
  assert.equal((await request(middleware, { method: "POST" })).statusCode, 405)
  assert.equal((await request(middleware, { url: "/other" })).next, true)
  assert.equal(providerCalls, 0)
  const first = await request(middleware)
  assert.equal(first.statusCode, 200)
  assert.deepEqual(JSON.parse(first.body), [place])
  assert.equal(first.headers["Cache-Control"], "private, no-store")
  assert.equal(first.headers.Vary, "Authorization")
  assert.equal((await request(middleware)).statusCode, 200)
  assert.equal(providerCalls, 1)
  active = false
  assert.equal((await request(middleware)).statusCode, 403)
  assert.equal(authCalls, 3)
  assert.equal(providerCalls, 1)
  // Close before fixture removes the directory (cleanup order is intentionally explicit).
  await middleware.close()
})

test("invalid/multiple queries do not reach geocoder; auth network errors never expose details", async (t) => {
  const f = await fixture(t, async (url) => {
    if (url.pathname === "/auth/v1/user") return json({ id: "user" })
    if (url.pathname === "/rest/v1/staff") return json([admin])
    assert.fail("Invalid query reached geocoder")
  })
  const middleware = createGeocodingMiddleware({ ...f.config, ...authOptions })
  assert.equal((await request(middleware, { url: "http://[" })).statusCode, 400)
  for (const url of [
    "/api/geocode",
    "/api/geocode?q=a&q=b",
    "/api/geocode?q=" + "x".repeat(201),
  ]) {
    assert.equal((await request(middleware, { url })).statusCode, 400)
  }
  await middleware.close()
  const broken = createGeocodingMiddleware({
    ...f.config,
    ...authOptions,
    fetchImpl: async () => {
      throw new Error("secret token")
    },
  })
  assert.equal((await request(broken)).body, '{"error":"map:placeSearchError"}')
  await broken.close()
})
