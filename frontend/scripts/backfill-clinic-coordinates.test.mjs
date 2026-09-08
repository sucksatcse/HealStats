import test, { after, before, mock } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { atomicWriteJson, createGeocoder } from "../server/geocoding.mjs"
import {
  clinicQuery,
  parseCheckpoint,
  runBackfill,
  selectedReviewedPlace,
} from "./backfill-clinic-coordinates.mjs"

before(() =>
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected real network attempt")
  }),
)
after(() => mock.restoreAll())
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status })
const clinic = {
  id: "00000000-0000-0000-0000-000000000001",
  zone: "Dhaka",
  address: "Example road",
  latitude: null,
  longitude: null,
}
const place = {
  id: "node/1",
  label: "Example location",
  latitude: 23.8,
  longitude: 90.4,
}
const record = {
  id: clinic.id,
  zone: clinic.zone,
  address: clinic.address,
  query: clinicQuery(clinic),
  candidates: [place],
  status: "needs_review",
  reviewed: true,
  selectedId: place.id,
  clinicLocationConfirmed: true,
  reviewedBy: "test-operator",
  reviewedAt: "2026-09-08T00:00:00Z",
}

async function fixture(t, fetchImpl) {
  const dir = await mkdtemp(join(tmpdir(), "healstats-backfill-test-"))
  t.after(() => rm(dir, { recursive: true, force: true }))
  let clock = 100000
  const options = {
    env: {
      SUPABASE_URL: "https://supabase.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "fake-backend-key",
      NOMINATIM_CACHE_PATH: join(dir, "cache.json"),
    },
    fetchImpl,
    log: () => {},
    geocoderOptions: {
      now: () => clock,
      wait: async (ms) => {
        clock += ms
      },
    },
  }
  const input = join(dir, "checkpoint.json")
  return { input, options, args: ["--input", input] }
}

test("no args/help do not access credentials, disk, auth, database or geocoder", async () => {
  const env = new Proxy({}, {
    get() {
      assert.fail("Help read environment")
    },
  })
  for (const args of [[], ["--help"]]) {
    let output = ""
    await runBackfill(args, {
      env,
      fetchImpl: async () => {
        assert.fail("Help used network")
      },
      log: (text) => {
        output = text
      },
    })
    assert.match(output, /PREPARE ONLY/)
  }
})

test("requires explicit, separate stages and disclosure; never falls back to VITE credentials", async () => {
  for (const args of [
    ["--lookup"],
    ["--lookup", "--apply"],
    ["--apply", "--allow-clinic-address-sharing"],
    ["--unknown"],
  ]) {
    await assert.rejects(runBackfill(args, { env: {}, log: () => {} }))
  }
  await assert.rejects(
    runBackfill(["--apply"], {
      env: {
        VITE_SUPABASE_URL: "https://supabase.invalid",
        VITE_SUPABASE_ANON_KEY: "fake",
      },
    }),
  )
})

test("lookup paginates missing GPS only, shares address+zone only, checkpoints candidates/empty and never writes DB", async (t) => {
  const second = {
    ...clinic,
    id: "00000000-0000-0000-0000-000000000002",
    address: "Other road",
  }
  let reads = 0
  let geocodes = 0
  const f = await fixture(t, async (url, options) => {
    assert.ok(!options.method || options.method === "GET")
    if (url.hostname === "supabase.invalid") {
      assert.equal(url.pathname, "/rest/v1/clinics")
      assert.equal(url.searchParams.get("latitude"), "is.null")
      assert.equal(url.searchParams.get("longitude"), "is.null")
      reads++
      if (!url.searchParams.has("id")) return json([clinic])
      return json(
        url.searchParams.get("id") === `gt.${clinic.id}` ? [second] : [],
      )
    }
    geocodes++
    assert.equal(options.headers.Authorization, undefined)
    assert.ok(
      [clinicQuery(clinic), clinicQuery(second)].includes(
        url.searchParams.get("q"),
      ),
    )
    // The pending checkpoint precedes the external request.
    const saved = parseCheckpoint(await readFile(f.input, "utf8"))
    assert.equal(saved.records.at(-1).status, "pending")
    return json(
      geocodes === 1
        ? [
            {
              osm_type: "node",
              osm_id: 1,
              display_name: "District centroid",
              lat: "23.8",
              lon: "90.4",
              address: { country_code: "bd" },
            },
          ]
        : [],
    )
  })
  await runBackfill(
    ["--lookup", "--allow-clinic-address-sharing", ...f.args],
    f.options,
  )
  const checkpoint = parseCheckpoint(await readFile(f.input, "utf8"))
  assert.equal(reads, 3)
  assert.equal(geocodes, 2)
  assert.deepEqual(
    checkpoint.records.map((r) => r.status),
    ["needs_review", "empty"],
  )
  assert.equal(checkpoint.records[0].reviewed, false)
  assert.equal(selectedReviewedPlace(checkpoint.records[0]), null)
  await runBackfill(
    ["--lookup", "--allow-clinic-address-sharing", ...f.args],
    f.options,
  )
  assert.equal(geocodes, 2) // Successful and empty results processed only once.
})

test("all results require explicit clinic-location review, including single district centroids", () => {
  assert.deepEqual(selectedReviewedPlace(record), place)
  for (const change of [
    { reviewed: false },
    { clinicLocationConfirmed: false },
    { reviewedBy: "" },
    { reviewedAt: null },
    { selectedId: "missing" },
    { query: "different address" },
    { status: "applied" },
  ]) {
    assert.equal(selectedReviewedPlace({ ...record, ...change }), null)
  }
})

test("apply performs no geocoding and conditionally updates reviewed GPS only; rerunning never rewrites", async (t) => {
  const methods = []
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.hostname, "supabase.invalid") // Any provider call fails this test.
    assert.equal(url.pathname, "/rest/v1/clinics")
    methods.push(options.method)
    if (options.method === "GET") return json([clinic])
    assert.equal(options.method, "PATCH")
    assert.equal(url.searchParams.get("id"), `eq.${clinic.id}`)
    assert.equal(url.searchParams.get("latitude"), "is.null")
    assert.equal(url.searchParams.get("longitude"), "is.null")
    assert.equal(
      url.searchParams.get("address"),
      `eq.${JSON.stringify(clinic.address)}`,
    )
    assert.equal(
      url.searchParams.get("zone"),
      `eq.${JSON.stringify(clinic.zone)}`,
    )
    assert.deepEqual(JSON.parse(options.body), {
      latitude: place.latitude,
      longitude: place.longitude,
    })
    assert.equal(
      parseCheckpoint(await readFile(f.input, "utf8")).records[0].status,
      "applying",
    )
    return json([
      { id: clinic.id, latitude: place.latitude, longitude: place.longitude },
    ])
  })
  await atomicWriteJson(f.input, { version: 1, records: [record] })
  await runBackfill(["--apply", ...f.args], f.options)
  assert.deepEqual(methods, ["GET", "PATCH"])
  assert.equal(
    parseCheckpoint(await readFile(f.input, "utf8")).records[0].status,
    "applied",
  )
  await runBackfill(["--apply", ...f.args], f.options)
  assert.deepEqual(methods, ["GET", "PATCH"])
})

test("stale addresses or existing/partial coordinates never get patched", async (t) => {
  for (const change of [
    { address: "Changed" },
    { zone: "Changed" },
    { latitude: 23.8 },
    { longitude: 90.4 },
  ]) {
    const f = await fixture(t, async (_url, options) => {
      assert.equal(options.method, "GET")
      return json([{ ...clinic, ...change }])
    })
    await atomicWriteJson(f.input, { version: 1, records: [record] })
    await runBackfill(["--apply", ...f.args], f.options)
    assert.equal(
      parseCheckpoint(await readFile(f.input, "utf8")).records[0].status,
      "stale",
    )
  }
})

test("concurrent address/GPS changes cause a zero-row PATCH, not a false applied status", async (t) => {
  const f = await fixture(t, async (_url, options) =>
    json(options.method === "GET" ? [clinic] : []),
  )
  await atomicWriteJson(f.input, { version: 1, records: [record] })
  await runBackfill(["--apply", ...f.args], f.options)
  assert.equal(
    parseCheckpoint(await readFile(f.input, "utf8")).records[0].status,
    "stale",
  )
})

test("lookup failure is checkpointed once and stops without retries", async (t) => {
  let geocodes = 0
  const f = await fixture(t, async (url) => {
    if (url.hostname === "supabase.invalid")
      return json(url.searchParams.has("id") ? [] : [clinic])
    geocodes++
    return json({}, 503)
  })
  await assert.rejects(
    runBackfill(
      ["--lookup", "--allow-clinic-address-sharing", ...f.args],
      f.options,
    ),
  )
  assert.equal(
    parseCheckpoint(await readFile(f.input, "utf8")).records[0].status,
    "error",
  )
  await runBackfill(
    ["--lookup", "--allow-clinic-address-sharing", ...f.args],
    f.options,
  )
  assert.equal(geocodes, 1)
})

test("apply failure has uncertain status and is never automatically retried", async (t) => {
  let writes = 0
  const f = await fixture(t, async (_url, options) => {
    if (options.method === "GET") return json([clinic])
    writes++
    return json({}, 503)
  })
  await atomicWriteJson(f.input, { version: 1, records: [record] })
  await assert.rejects(runBackfill(["--apply", ...f.args], f.options))
  assert.equal(
    parseCheckpoint(await readFile(f.input, "utf8")).records[0].status,
    "error",
  )
  await runBackfill(["--apply", ...f.args], f.options)
  assert.equal(writes, 1)
})

test("proxy lock blocks backfill BEFORE any database/auth access", async (t) => {
  const f = await fixture(t, async () => {
    assert.fail("Locked backfill accessed network")
  })
  const proxy = createGeocoder({
    cachePath: f.options.env.NOMINATIM_CACHE_PATH,
  })
  await proxy.open()
  try {
    await assert.rejects(
      runBackfill(
        ["--lookup", "--allow-clinic-address-sharing", ...f.args],
        f.options,
      ),
    )
  } finally {
    await proxy.close()
  }
})

test("admin-session operator mode validates identity and active staff before clinic access", async (t) => {
  const calls = []
  const f = await fixture(t, async (url) => {
    calls.push(url.pathname)
    if (url.pathname === "/auth/v1/user") return json({ id: "user" })
    if (url.pathname === "/rest/v1/staff")
      return json([{ role: "worker", designation: "nurse", is_active: true }])
    assert.fail("Non-admin accessed clinics")
  })
  delete f.options.env.SUPABASE_SERVICE_ROLE_KEY
  Object.assign(f.options.env, {
    SUPABASE_ANON_KEY: "fake-public",
    SUPABASE_ACCESS_TOKEN: "fake-token",
  })
  await assert.rejects(
    runBackfill(
      ["--lookup", "--allow-clinic-address-sharing", ...f.args],
      f.options,
    ),
  )
  assert.deepEqual(calls, ["/auth/v1/user", "/rest/v1/staff"])
})
