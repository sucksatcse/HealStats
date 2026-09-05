import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "./ThemeContext"
import {
  fetchClinicMapData,
  type ClinicActivity,
  type ClinicMapEntry,
} from "./lib/adminService"

type TFunc = (key: string, opts?: Record<string, unknown>) => string

// ── Activity status visual config ─────────────────────────────────────────────
// Honest status derived from real visit recency (see ClinicActivity in types.ts).
type Filter = "all" | ClinicActivity

const S = {
  active: {
    fill: "#22c55e",
    label: "Active",
    dot: "bg-emerald-500",
    badge:
      "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400",
    card: "hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10",
    pulseR: "5;18;5",
    pulseDur: "3s",
  },
  recent: {
    fill: "#f59e0b",
    label: "Recent",
    dot: "bg-amber-400",
    badge:
      "text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400",
    card: "hover:bg-amber-50/40 dark:hover:bg-amber-900/10",
    pulseR: "5;16;5",
    pulseDur: "2.4s",
  },
  quiet: {
    fill: "#94a3b8",
    label: "Quiet",
    dot: "bg-slate-400",
    badge: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
    card: "hover:bg-slate-50 dark:hover:bg-slate-800/40",
    pulseR: "5;12;5",
    pulseDur: "3.4s",
  },
} satisfies Record<ClinicActivity, object>

// ── Bangladesh SVG paths (viewBox 0 0 380 450) ─────────────────────────────
const BD_PATH =
  "M 42,28 L 116,16 L 155,18 L 195,28 L 258,42 " +
  "Q 308,68 342,128 " +
  "L 344,190 L 347,238 L 336,274 L 322,310 " +
  "L 330,348 L 316,404 " +
  "C 299,416 284,422 275,422 " +
  "C 252,428 228,432 218,432 " +
  "C 195,428 175,424 165,422 " +
  "C 148,416 134,412 124,410 " +
  "C 106,402 96,394 88,390 " +
  "L 58,354 L 38,300 L 16,244 L 20,194 L 28,144 L 38,86 Z"

const RIVER_JAMUNA =
  "M 155,18 C 150,72 148,132 150,188 C 152,224 156,255 160,282"
const RIVER_PADMA = "M 16,244 C 58,244 98,248 138,252 C 168,257 194,264 220,274"
const RIVER_MEGHNA =
  "M 220,155 C 224,196 228,236 230,276 C 234,313 244,352 265,410"

// ── District → SVG coordinate lookup ───────────────────────────────────────
// Presentation-layer geocoding only. The database stores no coordinates, so
// clinics are placed on the map by matching their `zone` (or name) against known
// Bangladeshi district/division names. Clinics with no match are listed in the
// sidebar as "unmapped" rather than being given a fabricated location.
const DISTRICT_COORDS: Record<string, { x: number; y: number }> = {
  dhaka: { x: 193, y: 210 },
  narayanganj: { x: 215, y: 234 },
  gazipur: { x: 200, y: 190 },
  tangail: { x: 170, y: 186 },
  faridpur: { x: 152, y: 240 },
  chittagong: { x: 297, y: 318 },
  chattogram: { x: 297, y: 318 },
  coxsbazar: { x: 322, y: 390 },
  comilla: { x: 254, y: 256 },
  cumilla: { x: 254, y: 256 },
  noakhali: { x: 254, y: 300 },
  sylhet: { x: 314, y: 160 },
  moulvibazar: { x: 298, y: 192 },
  rajshahi: { x: 52, y: 186 },
  bogra: { x: 110, y: 144 },
  bogura: { x: 110, y: 144 },
  dinajpur: { x: 68, y: 102 },
  rangpur: { x: 92, y: 88 },
  khulna: { x: 118, y: 340 },
  jessore: { x: 88, y: 278 },
  jashore: { x: 88, y: 278 },
  barisal: { x: 192, y: 326 },
  barishal: { x: 192, y: 326 },
  mymensingh: { x: 193, y: 162 },
}

/** Normalize a location string for matching: lowercase, strip non-alphanumerics. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/** Resolve a clinic to base map coordinates via its zone, then its name. */
function resolveCoords(entry: ClinicMapEntry): { x: number; y: number } | null {
  const candidates = [entry.zone, entry.name].filter(Boolean) as string[]
  for (const raw of candidates) {
    const n = normalize(raw)
    for (const key of Object.keys(DISTRICT_COORDS)) {
      if (n.includes(key) || key.includes(n)) return DISTRICT_COORDS[key]
    }
  }
  return null
}

interface PositionedClinic extends ClinicMapEntry {
  x: number
  y: number
}

/**
 * Assign map coordinates, spreading clinics that share a district apart with a
 * deterministic golden-angle spiral so pins never perfectly overlap.
 */
function positionClinics(entries: ClinicMapEntry[]): {
  mapped: PositionedClinic[]
  unmapped: ClinicMapEntry[]
} {
  const mapped: PositionedClinic[] = []
  const unmapped: ClinicMapEntry[] = []
  const seen = new Map<string, number>()

  for (const entry of entries) {
    const base = resolveCoords(entry)
    if (!base) {
      unmapped.push(entry)
      continue
    }
    const bucket = `${base.x},${base.y}`
    const i = seen.get(bucket) ?? 0
    seen.set(bucket, i + 1)
    let x = base.x
    let y = base.y
    if (i > 0) {
      const angle = i * 2.399963 // golden angle in radians
      const radius = 9 + Math.floor((i - 1) / 8) * 7
      x = base.x + Math.cos(angle) * radius
      y = base.y + Math.sin(angle) * radius
    }
    mapped.push({ ...entry, x, y })
  }
  return { mapped, unmapped }
}

// ── Relative-time helper ─────────────────────────────────────────────────────
function timeAgo(iso: string | null, t: TFunc): string {
  if (!iso) return t("map:timeNoVisits")
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t("map:timeJustNow")
  if (mins < 60) return t("map:timeMinutes", { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t("map:timeHours", { count: hrs })
  const days = Math.floor(hrs / 24)
  return t("map:timeDays", { count: days })
}

// ── Component ───────────────────────────────────────────────────────────────
export default function ClinicOpsPanel() {
  const { dark } = useTheme()
  const { t } = useTranslation()
  const [spotlight, setSpotlight] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [hovId, setHovId] = useState<string | null>(null)
  const [selId, setSelId] = useState<string | null>(null)

  const [entries, setEntries] = useState<ClinicMapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedAt, setLoadedAt] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetchClinicMapData()
    if (res.error) {
      setError(res.error)
      setEntries([])
    } else {
      setEntries(res.clinics)
    }
    setLoadedAt(Date.now())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { mapped, unmapped } = useMemo(() => positionClinics(entries), [entries])

  const counts = useMemo(
    () => ({
      active: entries.filter((c) => c.activity === "active").length,
      recent: entries.filter((c) => c.activity === "recent").length,
      quiet: entries.filter((c) => c.activity === "quiet").length,
    }),
    [entries],
  )
  const quietCount = counts.quiet

  const displayList = useMemo(
    () =>
      entries
        .filter((c) => filter === "all" || c.activity === filter)
        .sort((a, b) => {
          const ord: Record<ClinicActivity, number> = { active: 0, recent: 1, quiet: 2 }
          const d = ord[a.activity] - ord[b.activity]
          if (d !== 0) return d
          return b.patientCount - a.patientCount
        }),
    [entries, filter],
  )

  const hovClinic = mapped.find((c) => c.id === hovId) ?? null
  const selClinic = entries.find((c) => c.id === selId) ?? null

  // SVG map color scheme
  const mc = dark
    ? {
        country: "#152f29",
        border: "#2d6b62",
        river: "#1d4ed8",
        div: "#1a4a42",
        sea: "#0a1628",
      }
    : {
        country: "#d1ede8",
        border: "#5eada0",
        river: "#60a5fa",
        div: "#a7d4cd",
        sea: "#dbeffe",
      }

  function tipTransform(c: PositionedClinic) {
    const goLeft = c.x > 225
    const goBelow = c.y < 115
    if (goBelow) return goLeft ? "translate(-108%, 16%)" : "translate(-5%, 16%)"
    return goLeft ? "translate(-108%, -125%)" : "translate(-5%, -125%)"
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      {/* ── Sidebar ── */}
      <aside className="w-[272px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {loading ? t("common:loading") : t("map:clinicsCount", { count: entries.length })}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {t("map:network")}
              </p>
            </div>
            {/* Spotlight quiet clinics */}
            <button
              onClick={() => setSpotlight((m) => !m)}
              disabled={loading || !!error}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                spotlight
                  ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20 hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3.5 h-3.5 flex-shrink-0"
              >
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z" />
              </svg>
              {spotlight ? t("common:clear") : t("map:quiet")}
            </button>
          </div>

          {/* Activity summary pills */}
          <div className="flex gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              {counts.active}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/25 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {counts.recent}
            </span>
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
                spotlight
                  ? "text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-700"
                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              {counts.quiet}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          {(["all", "active", "recent", "quiet"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {f === "all" ? t("common:all") : t(`map:${f}`)}
            </button>
          ))}
        </div>

        {/* Clinic list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                {t("map:loadError")}
              </p>
              <button
                onClick={load}
                className="mt-3 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                {t("common:retry")}
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {t("map:noClinics")}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {t("map:noClinicsDesc")}
              </p>
            </div>
          ) : (
            <>
              {displayList.map((clinic) => {
                const cfg = S[clinic.activity]
                const isSel = selId === clinic.id
                const isSpotlit = spotlight && clinic.activity === "quiet"
                return (
                  <button
                    key={clinic.id}
                    onClick={() => setSelId(isSel ? null : clinic.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-all duration-150 flex items-start gap-3 ${
                      isSpotlit
                        ? "bg-slate-100 dark:bg-slate-800/60"
                        : isSel
                          ? "bg-teal-50 dark:bg-teal-900/20"
                          : cfg.card
                    }`}
                  >
                    {/* Activity dot */}
                    <div className="mt-1 flex-shrink-0 relative">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${
                          clinic.activity === "active" ? "" : "animate-pulse"
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
                          {clinic.name}
                        </p>
                        {clinic.pendingSync > 0 && (
                          <span className="text-[9px] font-extrabold tracking-wider text-white bg-amber-500 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                            {t("map:queued", { count: clinic.pendingSync })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {clinic.zone || t("map:unzoned")} · {timeAgo(clinic.lastVisitAt, t)}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.badge}`}
                        >
                          {t(`map:${clinic.activity}`)}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {clinic.patientCount} {t("common:patientsUnit")}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Unmapped clinics (no district match — shown honestly, not pinned) */}
              {unmapped.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    {t("map:notOnMap", { count: unmapped.length })}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t("map:notOnMapDesc", { names: unmapped.map((c) => c.name).join(", ") })}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Map area ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Map toolbar */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M9 17A8 8 0 109 1a8 8 0 000 16zm-1-10a1 1 0 011-1h.01a1 1 0 010 2H9a1 1 0 01-1-1zm0 3a1 1 0 012 0v3a1 1 0 01-2 0v-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {t("map:title")}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("map:subtitleLive")}
                {loadedAt
                  ? ` · ${t("map:updated", { time: timeAgo(new Date(loadedAt).toISOString(), t) })}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 px-2.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              {t("common:live")}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="w-8 h-8 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 dark:hover:border-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("map:refreshAria")}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v4h.582m15.356 2A8.001 8.001 0 004.582 8m0 0H9m11 11v-4h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Spotlight info banner */}
        {spotlight && !loading && !error && (
          <div className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-semibold tracking-wide flex-1">
              {t("map:spotlightBanner", { count: quietCount })}
            </p>
            <button
              onClick={() => setSpotlight(false)}
              className="text-xs font-bold underline hover:no-underline opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              {t("common:clear")}
            </button>
          </div>
        )}

        {/* SVG Map */}
        <div
          className="flex-1 flex items-center justify-center p-6 overflow-hidden relative"
          style={{ background: mc.sea }}
        >
          {/* Subtle ambient gradients */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: dark
                ? "radial-gradient(ellipse at 20% 80%, #0f2a45 0%, transparent 50%), radial-gradient(ellipse at 80% 15%, #0a2a22 0%, transparent 45%)"
                : "radial-gradient(ellipse at 20% 80%, #bae6fd 0%, transparent 50%), radial-gradient(ellipse at 80% 15%, #99f6e4 0%, transparent 45%)",
            }}
          />

          {/* Map canvas (ratio-locked so %-based tooltip positions work) */}
          <div
            className="relative h-full"
            style={{
              aspectRatio: "380 / 450",
              maxHeight: "100%",
              maxWidth: "100%",
            }}
          >
            <svg
              viewBox="0 0 380 450"
              className="w-full h-full drop-shadow-2xl"
              aria-label={t("map:ariaMap")}
            >
              <defs>
                <pattern
                  id="ops-dots"
                  x="0"
                  y="0"
                  width="16"
                  height="16"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="0.8"
                    fill={dark ? "#1e3a5c" : "#bae6fd"}
                    opacity="0.5"
                  />
                </pattern>
              </defs>

              {/* Sea texture */}
              <rect width="380" height="450" fill="url(#ops-dots)" />

              {/* Country body */}
              <path
                d={BD_PATH}
                fill={mc.country}
                stroke={mc.border}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Division hints */}
              <path
                d="M 150,188 L 160,282"
                fill="none"
                stroke={mc.div}
                strokeWidth="0.9"
                strokeDasharray="5 5"
                opacity="0.7"
              />
              <path
                d="M 220,155 L 265,410"
                fill="none"
                stroke={mc.div}
                strokeWidth="0.9"
                strokeDasharray="5 5"
                opacity="0.7"
              />

              {/* Rivers */}
              <path
                d={RIVER_JAMUNA}
                fill="none"
                stroke={mc.river}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d={RIVER_PADMA}
                fill="none"
                stroke={mc.river}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d={RIVER_MEGHNA}
                fill="none"
                stroke={mc.river}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Spotlight: rings around quiet clinics */}
              {spotlight &&
                mapped
                  .filter((c) => c.activity === "quiet")
                  .map((c) => (
                    <circle
                      key={`zone-${c.id}`}
                      cx={c.x}
                      cy={c.y}
                      r="30"
                      fill="rgba(100,116,139,0.08)"
                      stroke="rgba(100,116,139,0.4)"
                      strokeWidth="1"
                      strokeDasharray="6 4"
                    />
                  ))}

              {/* Clinic pins */}
              {mapped.map((clinic, i) => {
                const cfg = S[clinic.activity]
                const fill = cfg.fill as string
                const isSel = selId === clinic.id
                const isHov = hovId === clinic.id

                return (
                  <g
                    key={clinic.id}
                    onMouseEnter={() => setHovId(clinic.id)}
                    onMouseLeave={() => setHovId(null)}
                    onClick={() => setSelId(isSel ? null : clinic.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Animated pulse ring */}
                    <circle cx={clinic.x} cy={clinic.y} r="5" fill={fill} opacity="0">
                      <animate
                        attributeName="r"
                        values={cfg.pulseR as string}
                        dur={cfg.pulseDur as string}
                        repeatCount="indefinite"
                        begin={`${(i % 8) * 0.3}s`}
                      />
                      <animate
                        attributeName="opacity"
                        values="0.35;0;0.35"
                        dur={cfg.pulseDur as string}
                        repeatCount="indefinite"
                        begin={`${(i % 8) * 0.3}s`}
                      />
                    </circle>

                    {/* Selected: white selection ring */}
                    {isSel && (
                      <circle
                        cx={clinic.x}
                        cy={clinic.y}
                        r="11"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Hover glow */}
                    {isHov && (
                      <circle cx={clinic.x} cy={clinic.y} r="13" fill={`${fill}22`} />
                    )}

                    {/* Pin body */}
                    <circle
                      cx={clinic.x}
                      cy={clinic.y}
                      r={isHov || isSel ? 8 : 6}
                      fill={fill}
                      stroke="white"
                      strokeWidth={1.5}
                    />

                    {/* Active checkmark */}
                    {clinic.activity === "active" && (
                      <path
                        d={`M ${clinic.x - 2.5},${clinic.y} L ${clinic.x - 0.5},${clinic.y + 2} L ${clinic.x + 2.8},${clinic.y - 2}`}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Recent dash */}
                    {clinic.activity === "recent" && (
                      <line
                        x1={clinic.x - 3}
                        y1={clinic.y}
                        x2={clinic.x + 3}
                        y2={clinic.y}
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Quiet dot */}
                    {clinic.activity === "quiet" && (
                      <circle cx={clinic.x} cy={clinic.y} r="1.6" fill="white" />
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Floating tooltip */}
            {hovClinic && (
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: `${(hovClinic.x / 380) * 100}%`,
                  top: `${(hovClinic.y / 450) * 100}%`,
                  transform: tipTransform(hovClinic),
                }}
              >
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-3.5 py-2.5 min-w-[170px]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${S[hovClinic.activity].dot} ${
                        hovClinic.activity === "active" ? "" : "animate-pulse"
                      }`}
                    />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {hovClinic.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                    {hovClinic.zone || t("map:unzoned")} · {timeAgo(hovClinic.lastVisitAt, t)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${S[hovClinic.activity].badge}`}
                    >
                      {t(`map:${hovClinic.activity}`)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {hovClinic.patientCount} {t("common:patients")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="w-4 h-4 animate-spin"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v4h.582m15.356 2A8.001 8.001 0 004.582 8m0 0H9m11 11v-4h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t("map:loadingClinics")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected clinic detail bar */}
        {selClinic && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center gap-x-6 gap-y-1.5 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${S[selClinic.activity].dot}`} />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {selClinic.name}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {selClinic.zone || t("map:unzoned")}
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
              <span><strong className="text-slate-800 dark:text-slate-100">{selClinic.patientCount}</strong> {t("map:detailPatients")}</span>
              <span><strong className="text-slate-800 dark:text-slate-100">{selClinic.visitsLast7d}</strong> {t("map:detailVisits7d")}</span>
              <span><strong className="text-slate-800 dark:text-slate-100">{selClinic.highRisk}</strong> {t("map:detailHighRisk")}</span>
              <span><strong className="text-slate-800 dark:text-slate-100">{selClinic.pendingSync}</strong> {t("map:detailPendingSync")}</span>
              <span>{t("map:detailLastVisit", { time: timeAgo(selClinic.lastVisitAt, t) })}</span>
            </div>
            <button
              onClick={() => setSelId(null)}
              className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {t("common:close")}
            </button>
          </div>
        )}

        {/* Status legend */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-6 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t("map:legend")}
          </span>
          <div className="flex items-center gap-5 flex-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("map:legendActive")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("map:legendRecent")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 flex-shrink-0" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("map:legendQuiet")}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            {t("map:activeOf", { active: counts.active, total: entries.length })}
          </div>
        </div>
      </main>
    </div>
  )
}
