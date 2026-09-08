/**
 * PREPARED ONLY. Import/no args/--help has no network or database side effects.
 * See --help for separate opt-in disclosure and reviewed-write stages.
 */
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  atomicWriteJson,
  configFromEnv,
  createGeocoder,
  fetchJson,
  isPlaceResult,
  normalizeQuery,
  requireAdmin,
} from "../server/geocoding.mjs"

export const DEFAULT_INPUT = fileURLToPath(
  new URL("../.cache/clinic-geocoding.json", import.meta.url),
)
export const HELP = `PREPARE ONLY by default: no arguments or --help only prints this text.
Node 22+; invoke from repository root:
  node frontend/scripts/backfill-clinic-coordinates.mjs --help
  node frontend/scripts/backfill-clinic-coordinates.mjs --lookup --allow-clinic-address-sharing
  node frontend/scripts/backfill-clinic-coordinates.mjs --apply
Optional: --input /absolute/private/checkpoint.json (default frontend/.cache/clinic-geocoding.json).

--lookup explicitly reads clinics from Supabase and shares ONLY address + zone +
Bangladesh with the configured Nominatim provider. No database writes. It requires
--allow-clinic-address-sharing. Never use patient addresses or other medical data.
Each clinic is checkpointed BEFORE lookup; empty/error/pending/existing records are
not automatically retried. Pending means interrupted/uncertain; inspect manually.
Every candidate, even a single one, is needs_review. District/zone centroids are NOT
clinic GPS. Independently verify the actual clinic location before editing a record:
  reviewed: true, selectedId: <candidate id>, clinicLocationConfirmed: true,
  reviewedBy: <operator identifier>, reviewedAt: <ISO timestamp>.
Keep id, address, zone, query, candidates and status unchanged. This is an explicit
human attestation of clinic-level precision, NOT an automatic address-level match.

--apply explicitly authorizes DB PATCH writes of reviewed selected coordinates ONLY.
No geocoder calls. It rechecks current address/zone and uses conditional PATCH with
id, exact address/zone and BOTH coordinates IS NULL; existing GPS is never replaced.
An uncertain interrupted PATCH is marked applying/error, never automatically retried.
No migration is executed. Coordinate columns must already exist (operator-managed).

Operator environment (never VITE-prefixed secrets, never CLI credential arguments):
  SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_ACCESS_TOKEN (active admin session), OR
  SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (trusted backend operator only).
  NOMINATIM_URL, NOMINATIM_USER_AGENT, NOMINATIM_CACHE_PATH are optional.
Uses the proxy's cache, 1100ms queue, and exclusive lifetime disk lock. STOP THE PROXY
before either stage; all processes must use the SAME persistent NOMINATIM_CACHE_PATH.
One process across the app; no parallel hosts/replicas. Never delete a live lock.
After a crash, confirm the recorded owner PID is stopped before removing <cache>.lock.
Checkpoints/cache contain clinic addresses: keep private, outside served assets, and
out of Git. Default .cache paths are already gitignored. Custom paths are your duty.
Public Nominatim is only for a small one-time job, not recurring/systematic bulk work;
use an appropriate self-hosted/contracted provider for larger datasets.
`

function parseArgs(args) {
  if (!args.length || args.includes("--help")) return { help: true }
  let mode
  let sharing = false
  let input = DEFAULT_INPUT
  let hasInput = false
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === "--lookup" || arg === "--apply") {
      if (mode) throw new Error("Choose exactly one of --lookup and --apply.")
      mode = arg
    } else if (arg === "--allow-clinic-address-sharing") {
      if (sharing) throw new Error("Duplicate disclosure flag.")
      sharing = true
    } else if (arg === "--input") {
      if (hasInput || !args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error("Provide one --input path.")
      hasInput = true
      input = resolve(args[++index])
    } else throw new Error("Unknown argument; use --help.")
  }
  if (
    !mode ||
    (mode === "--lookup" && !sharing) ||
    (mode === "--apply" && sharing)
  ) {
    throw new Error(
      "Lookup requires --allow-clinic-address-sharing; apply must be a separate invocation.",
    )
  }
  return { mode, input }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const nullableText = (value) => value === null || typeof value === "string"

export function clinicQuery(clinic) {
  if (
    typeof clinic.address !== "string" ||
    !clinic.address.trim() ||
    typeof clinic.zone !== "string" ||
    !clinic.zone.trim()
  )
    return null
  return normalizeQuery(
    `${clinic.address.trim()}, ${clinic.zone.trim()}, Bangladesh`,
  )
}

export function parseCheckpoint(text) {
  const data = JSON.parse(text)
  if (data?.version !== 1 || !Array.isArray(data.records))
    throw new Error("Invalid checkpoint.")
  const ids = new Set()
  const statuses = [
    "pending",
    "needs_review",
    "empty",
    "skipped",
    "error",
    "stale",
    "applying",
    "applied",
  ]
  for (const record of data.records) {
    if (
      !record ||
      !uuid.test(record.id) ||
      ids.has(record.id) ||
      !nullableText(record.zone) ||
      !nullableText(record.address) ||
      !nullableText(record.query) ||
      !statuses.includes(record.status) ||
      !Array.isArray(record.candidates) ||
      record.candidates.length > 5 ||
      !record.candidates.every(isPlaceResult) ||
      new Set(record.candidates.map((candidate) => candidate.id)).size !==
        record.candidates.length
    ) {
      throw new Error("Invalid checkpoint record.")
    }
    ids.add(record.id)
  }
  return data
}

export function selectedReviewedPlace(record) {
  if (
    record.status !== "needs_review" ||
    record.reviewed !== true ||
    record.clinicLocationConfirmed !== true ||
    typeof record.reviewedBy !== "string" ||
    !record.reviewedBy.trim() ||
    typeof record.reviewedAt !== "string" ||
    !Number.isFinite(Date.parse(record.reviewedAt)) ||
    record.query !== clinicQuery(record)
  )
    return null
  const selected = record.candidates.find(
    (candidate) => candidate.id === record.selectedId,
  )
  return isPlaceResult(selected) ? selected : null
}

function operatorConfig(env) {
  if (!env.SUPABASE_URL) throw new Error("Missing operator SUPABASE_URL.")
  const base = new URL(env.SUPABASE_URL)
  if (
    !["https:", "http:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new Error("Invalid operator URL.")
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const key = serviceKey || env.SUPABASE_ANON_KEY
  const token = serviceKey || env.SUPABASE_ACCESS_TOKEN
  if (!key || !token)
    throw new Error("Missing backend operator credentials; see --help.")
  return { base, key, token, serviceKey }
}

async function rest(config, fetchImpl, parameters, method = "GET", body) {
  const url = new URL("/rest/v1/clinics", config.base)
  url.search = new URLSearchParams(parameters).toString()
  try {
    const { response, data } = await fetchJson(fetchImpl, url, {
      method,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
        ...(method === "PATCH"
          ? {
              "Content-Type": "application/json",
              Prefer: "return=representation",
            }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!response.ok || !Array.isArray(data)) throw new Error()
    return data
  } catch {
    throw new Error(
      "Supabase operation failed; no automatic retry. Check credentials/schema privately.",
    )
  }
}

async function lookup(config, fetchImpl, geocoder, checkpoint, input) {
  let cursor
  let lookups = 0
  const started = Date.now()
  for (;;) {
    const rows = await rest(config, fetchImpl, {
      select: "id,zone,address,latitude,longitude",
      latitude: "is.null",
      longitude: "is.null",
      order: "id.asc",
      limit: "100",
      ...(cursor ? { id: `gt.${cursor}` } : {}),
    })
    if (rows.length === 0) break
    for (const clinic of rows) {
      if (
        !uuid.test(clinic.id) ||
        !nullableText(clinic.zone) ||
        !nullableText(clinic.address) ||
        clinic.latitude !== null ||
        clinic.longitude !== null ||
        (cursor && clinic.id <= cursor)
      ) {
        throw new Error("Unexpected clinic page; stopping safely.")
      }
      cursor = clinic.id
      if (checkpoint.records.some((record) => record.id === clinic.id)) continue
      if (lookups >= 1000 || Date.now() - started >= 23 * 60 * 60 * 1000) {
        throw new Error(
          "Small one-time lookup limit reached; use another provider for larger jobs.",
        )
      }
      let query = null
      try {
        query = clinicQuery(clinic)
      } catch {
        /* Overlong/invalid addresses require manual handling. */
      }
      const record = {
        id: clinic.id,
        zone: clinic.zone,
        address: clinic.address,
        query,
        status: query ? "pending" : "skipped",
        candidates: [],
        reviewed: false,
        selectedId: null,
        clinicLocationConfirmed: false,
        reviewedBy: null,
        reviewedAt: null,
      }
      checkpoint.records.push(record)
      await atomicWriteJson(input, checkpoint)
      if (!query) continue
      lookups++
      try {
        record.candidates = await geocoder.search(query)
        record.status = record.candidates.length ? "needs_review" : "empty"
      } catch {
        record.status = "error"
        await atomicWriteJson(input, checkpoint)
        throw new Error(
          "Geocoding failed; checkpoint saved. No retry performed.",
        )
      }
      await atomicWriteJson(input, checkpoint)
    }
  }
}

// PostgREST quoted literals avoid treating punctuation in addresses as filter syntax.
const exactTextFilter = (value) =>
  value === null ? "is.null" : `eq.${JSON.stringify(value)}`

async function apply(config, fetchImpl, checkpoint, input) {
  for (const record of checkpoint.records) {
    const selected = selectedReviewedPlace(record)
    if (!selected) continue
    const current = await rest(config, fetchImpl, {
      select: "id,zone,address,latitude,longitude",
      id: `eq.${record.id}`,
      limit: "2",
    })
    if (
      current.length !== 1 ||
      current[0].id !== record.id ||
      current[0].address !== record.address ||
      current[0].zone !== record.zone ||
      current[0].latitude !== null ||
      current[0].longitude !== null
    ) {
      record.status = "stale"
      await atomicWriteJson(input, checkpoint)
      continue
    }
    record.status = "applying"
    await atomicWriteJson(input, checkpoint) // Ambiguous interrupted writes must be reviewed, never retried.
    try {
      const updated = await rest(
        config,
        fetchImpl,
        {
          id: `eq.${record.id}`,
          latitude: "is.null",
          longitude: "is.null",
          address: exactTextFilter(record.address),
          zone: exactTextFilter(record.zone),
          select: "id,latitude,longitude",
        },
        "PATCH",
        { latitude: selected.latitude, longitude: selected.longitude },
      )
      if (
        updated.length > 1 ||
        (updated.length === 1 &&
          (updated[0].id !== record.id ||
            updated[0].latitude !== selected.latitude ||
            updated[0].longitude !== selected.longitude))
      ) {
        throw new Error("Unexpected update result.")
      }
      record.status = updated.length === 1 ? "applied" : "stale"
      await atomicWriteJson(input, checkpoint)
    } catch {
      record.status = "error"
      await atomicWriteJson(input, checkpoint)
      throw new Error(
        "Apply outcome may be uncertain; inspect privately before any manual retry.",
      )
    }
  }
}

/** Dependencies injectable for local mocked tests; never invoked on import. */
export async function runBackfill(
  args,
  {
    env = process.env,
    fetchImpl = globalThis.fetch,
    log = console.log,
    geocoderOptions = {},
  } = {},
) {
  const options = parseArgs(args)
  if (options.help) {
    log(HELP)
    return
  }
  const config = operatorConfig(env)
  const geocodingConfig = {
    ...configFromEnv(env),
    ...geocoderOptions,
    fetchImpl,
  }
  if (resolve(options.input) === resolve(geocodingConfig.cachePath))
    throw new Error("Checkpoint and geocoder cache must differ.")
  const geocoder = createGeocoder(geocodingConfig)
  try {
    // Both stages take the SAME proxy lock before auth/DB operations, including apply.
    await geocoder.open()
    let checkpoint
    try {
      checkpoint = parseCheckpoint(await readFile(options.input, "utf8"))
    } catch (error) {
      if (options.mode !== "--lookup" || error.code !== "ENOENT")
        throw new Error("Cannot read checkpoint; stopping safely.")
      checkpoint = { version: 1, records: [] }
    }
    if (!config.serviceKey) {
      await requireAdmin(config.token, {
        supabaseUrl: env.SUPABASE_URL,
        supabaseAnonKey: config.key,
        fetchImpl,
      })
    }
    if (options.mode === "--lookup")
      await lookup(config, fetchImpl, geocoder, checkpoint, options.input)
    else await apply(config, fetchImpl, checkpoint, options.input)
    log(
      "Stage finished. Review the private checkpoint; no automatic retries or additional stages were run.",
    )
  } finally {
    await geocoder.close()
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  runBackfill(process.argv.slice(2)).catch(() => {
    // Do not print upstream errors, URLs, address data, tokens or response bodies.
    console.error(
      "Backfill stopped safely. Inspect the private checkpoint and --help; no automatic retry.",
    )
    process.exitCode = 1
  })
}
