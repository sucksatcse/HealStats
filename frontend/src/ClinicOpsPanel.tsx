import { useState } from "react"
import { useTheme } from "./ThemeContext"

// ── Types ──────────────────────────────────────────────────────────────────
type Status = "online" | "delay" | "offline"
type Filter = "all" | Status

interface Clinic {
  id: number
  name: string
  district: string
  status: Status
  lastSync: string
  patients: number
  x: number
  y: number // SVG coords (viewBox 0 0 380 450)
}

// ── Clinic dataset (18 clinics, realistic BD distribution) ─────────────────
const CLINICS: Clinic[] = [
  {
    id: 1,
    name: "Dhaka Central Hub",
    district: "Dhaka",
    status: "online",
    lastSync: "2m ago",
    patients: 347,
    x: 193,
    y: 210,
  },
  {
    id: 2,
    name: "Chittagong Port Station",
    district: "Chittagong",
    status: "online",
    lastSync: "5m ago",
    patients: 218,
    x: 297,
    y: 318,
  },
  {
    id: 3,
    name: "Sylhet Highland Post",
    district: "Sylhet",
    status: "delay",
    lastSync: "42m ago",
    patients: 89,
    x: 314,
    y: 160,
  },
  {
    id: 4,
    name: "Rajshahi Rural Centre",
    district: "Rajshahi",
    status: "offline",
    lastSync: "3h ago",
    patients: 0,
    x: 52,
    y: 186,
  },
  {
    id: 5,
    name: "Khulna Delta Clinic",
    district: "Khulna",
    status: "online",
    lastSync: "1m ago",
    patients: 156,
    x: 118,
    y: 340,
  },
  {
    id: 6,
    name: "Barisal Riverside Post",
    district: "Barisal",
    status: "delay",
    lastSync: "28m ago",
    patients: 73,
    x: 192,
    y: 326,
  },
  {
    id: 7,
    name: "Mymensingh Community Hub",
    district: "Mymensingh",
    status: "online",
    lastSync: "3m ago",
    patients: 201,
    x: 193,
    y: 162,
  },
  {
    id: 8,
    name: "Comilla Eastern Station",
    district: "Comilla",
    status: "offline",
    lastSync: "5h ago",
    patients: 0,
    x: 254,
    y: 256,
  },
  {
    id: 9,
    name: "Rangpur Northern Post",
    district: "Rangpur",
    status: "online",
    lastSync: "7m ago",
    patients: 134,
    x: 92,
    y: 88,
  },
  {
    id: 10,
    name: "Jessore Border Clinic",
    district: "Jessore",
    status: "delay",
    lastSync: "1h ago",
    patients: 45,
    x: 88,
    y: 278,
  },
  {
    id: 11,
    name: "Faridpur Central Hub",
    district: "Faridpur",
    status: "online",
    lastSync: "12m ago",
    patients: 167,
    x: 152,
    y: 240,
  },
  {
    id: 12,
    name: "Noakhali Coastal Station",
    district: "Noakhali",
    status: "offline",
    lastSync: "8h ago",
    patients: 0,
    x: 254,
    y: 300,
  },
  {
    id: 13,
    name: "Cox's Bazar Beach Post",
    district: "Cox's Bazar",
    status: "online",
    lastSync: "4m ago",
    patients: 298,
    x: 322,
    y: 390,
  },
  {
    id: 14,
    name: "Dinajpur Frontier Clinic",
    district: "Dinajpur",
    status: "online",
    lastSync: "9m ago",
    patients: 88,
    x: 68,
    y: 102,
  },
  {
    id: 15,
    name: "Bogra District Centre",
    district: "Bogra",
    status: "delay",
    lastSync: "55m ago",
    patients: 112,
    x: 110,
    y: 144,
  },
  {
    id: 16,
    name: "Narayanganj Urban Hub",
    district: "Narayanganj",
    status: "online",
    lastSync: "1m ago",
    patients: 423,
    x: 215,
    y: 234,
  },
  {
    id: 17,
    name: "Tangail Road Station",
    district: "Tangail",
    status: "online",
    lastSync: "6m ago",
    patients: 94,
    x: 170,
    y: 186,
  },
  {
    id: 18,
    name: "Moulvibazar Tea Post",
    district: "Moulvibazar",
    status: "offline",
    lastSync: "12h ago",
    patients: 0,
    x: 298,
    y: 192,
  },
]

// ── Status visual config ────────────────────────────────────────────────────
const S = {
  online: {
    fill: "#22c55e",
    label: "Online",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    badge:
      "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400",
    card: "hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10",
    pulseR: "5;18;5",
    pulseDur: "3s",
  },
  delay: {
    fill: "#f59e0b",
    label: "Delay",
    dot: "bg-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    badge:
      "text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400",
    card: "hover:bg-amber-50/40 dark:hover:bg-amber-900/10",
    pulseR: "5;16;5",
    pulseDur: "2.2s",
  },
  offline: {
    fill: "#ef4444",
    label: "Offline",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    badge: "text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400",
    card: "hover:bg-rose-50/40 dark:hover:bg-rose-900/10",
    pulseR: "5;16;5",
    pulseDur: "1.8s",
  },
} satisfies Record<Status, object>

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

// ── Component ───────────────────────────────────────────────────────────────
export default function ClinicOpsPanel() {
  const { dark } = useTheme()
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [hovId, setHovId] = useState<number | null>(null)
  const [selId, setSelId] = useState<number | null>(null)

  const counts = {
    online: CLINICS.filter((c) => c.status === "online").length,
    delay: CLINICS.filter((c) => c.status === "delay").length,
    offline: CLINICS.filter((c) => c.status === "offline").length,
  }
  const offlineCount = counts.offline

  const displayList = CLINICS.filter(
    (c) => filter === "all" || c.status === filter,
  ).sort((a, b) => {
    const ord: Record<Status, number> = { offline: 0, delay: 1, online: 2 }
    return ord[a.status] - ord[b.status]
  })

  const hovClinic = CLINICS.find((c) => c.id === hovId) ?? null

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

  // Tooltip position (pins are inside a 380×450 SVG that fills a ratio-locked container)
  function tipTransform(c: Clinic) {
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
                {CLINICS.length} Clinics
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Bangladesh network
              </p>
            </div>
            {/* Emergency mode toggle */}
            <button
              onClick={() => setEmergencyMode((m) => !m)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 ${
                emergencyMode
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700"
                  : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              {emergencyMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping flex-shrink-0" />
              )}
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3.5 h-3.5 flex-shrink-0"
              >
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z" />
              </svg>
              {emergencyMode ? "Deactivate" : "Emergency"}
            </button>
          </div>

          {/* Status summary pills */}
          <div className="flex gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              {counts.online}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/25 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {counts.delay}
            </span>
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
                emergencyMode
                  ? "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/30 animate-pulse"
                  : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/25"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              {counts.offline}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          {(["all", "online", "delay", "offline"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "online"
                  ? "OK"
                  : f === "delay"
                    ? "Slow"
                    : "Down"}
            </button>
          ))}
        </div>

        {/* Clinic list */}
        <div className="flex-1 overflow-y-auto">
          {displayList.map((clinic) => {
            const cfg = S[clinic.status]
            const isSel = selId === clinic.id
            const isEmergencyOffline =
              emergencyMode && clinic.status === "offline"
            return (
              <button
                key={clinic.id}
                onClick={() => setSelId(isSel ? null : clinic.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-all duration-150 flex items-start gap-3 ${
                  isEmergencyOffline
                    ? "bg-rose-50 dark:bg-rose-950/30"
                    : isSel
                      ? "bg-teal-50 dark:bg-teal-900/20"
                      : cfg.card
                }`}
              >
                {/* Pulsing dot */}
                <div className="mt-1 flex-shrink-0 relative">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${
                      clinic.status !== "online" ? "animate-pulse" : ""
                    }`}
                  />
                  {isEmergencyOffline && (
                    <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {clinic.name}
                    </p>
                    {isEmergencyOffline && (
                      <span className="text-[9px] font-extrabold tracking-wider text-white bg-rose-600 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                        ALERT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {clinic.district} · {clinic.lastSync}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                    {clinic.patients > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {clinic.patients} pts
                      </span>
                    )}
                    {clinic.status === "offline" && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Unreachable
                      </span>
                    )}
                  </div>
                  {isEmergencyOffline && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="mt-2 w-full text-center text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 rounded-md transition-colors"
                    >
                      Dispatch Response
                    </button>
                  )}
                </div>
              </button>
            )
          })}
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
                Clinic Operations Map
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Real-time status · Updated 2m ago
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 px-2.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              LIVE
            </div>
            <button
              className="w-8 h-8 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
              aria-label="Refresh map"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v4h.582m15.356 2A8.001 8.001 0 004.582 8m0 0H9m11 11v-4h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-r border-slate-200 dark:border-slate-700 text-base leading-none">
                +
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-base leading-none">
                −
              </button>
            </div>
          </div>
        </div>

        {/* Emergency mode alert banner */}
        {emergencyMode && (
          <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="w-2 h-2 rounded-full bg-white absolute" />
            </div>
            <svg
              viewBox="0 0 20 20"
              fill="white"
              className="w-4 h-4 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-bold tracking-wide flex-1">
              EMERGENCY MODE ACTIVE —{" "}
              <span className="font-extrabold">
                {offlineCount} clinic{offlineCount !== 1 ? "s" : ""}
              </span>{" "}
              require immediate attention
            </p>
            <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap">
              Broadcast Alert
            </button>
            <button
              onClick={() => setEmergencyMode(false)}
              className="text-xs font-bold underline hover:no-underline opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              Deactivate
            </button>
          </div>
        )}

        {/* SVG Map */}
        <div
          className="flex-1 flex items-center justify-center p-6 overflow-hidden"
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
              aria-label="Bangladesh clinic operations map"
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

              {/* Emergency: zone circles around offline clinics */}
              {emergencyMode &&
                CLINICS.filter((c) => c.status === "offline").map((c) => (
                  <circle
                    key={`zone-${c.id}`}
                    cx={c.x}
                    cy={c.y}
                    r="42"
                    fill="rgba(239,68,68,0.07)"
                    stroke="rgba(239,68,68,0.3)"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                  />
                ))}

              {/* Clinic pins */}
              {CLINICS.map((clinic, i) => {
                const cfg = S[clinic.status]
                const fill = cfg.fill as string
                const isSel = selId === clinic.id
                const isHov = hovId === clinic.id
                const isEmergOff = emergencyMode && clinic.status === "offline"
                const pulseR = isEmergOff ? "6;26;6" : cfg.pulseR as string
                const pulseDur = isEmergOff ? "1.2s" : cfg.pulseDur as string

                return (
                  <g
                    key={clinic.id}
                    onMouseEnter={() => setHovId(clinic.id)}
                    onMouseLeave={() => setHovId(null)}
                    onClick={() => setSelId(isSel ? null : clinic.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Animated pulse ring */}
                    <circle
                      cx={clinic.x}
                      cy={clinic.y}
                      r="5"
                      fill={fill}
                      opacity="0"
                    >
                      <animate
                        attributeName="r"
                        values={pulseR}
                        dur={pulseDur}
                        repeatCount="indefinite"
                        begin={`${(i % 8) * 0.3}s`}
                      />
                      <animate
                        attributeName="opacity"
                        values={isEmergOff ? "0.5;0;0.5" : "0.35;0;0.35"}
                        dur={pulseDur}
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
                      <circle
                        cx={clinic.x}
                        cy={clinic.y}
                        r="13"
                        fill={`${fill}22`}
                      />
                    )}

                    {/* Pin body */}
                    <circle
                      cx={clinic.x}
                      cy={clinic.y}
                      r={isHov || isSel ? 8 : 6}
                      fill={fill}
                      stroke="white"
                      strokeWidth={clinic.status === "offline" ? 2 : 1.5}
                    />

                    {/* Offline X mark */}
                    {clinic.status === "offline" && (
                      <g stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <line
                          x1={clinic.x - 2.5}
                          y1={clinic.y - 2.5}
                          x2={clinic.x + 2.5}
                          y2={clinic.y + 2.5}
                        />
                        <line
                          x1={clinic.x + 2.5}
                          y1={clinic.y - 2.5}
                          x2={clinic.x - 2.5}
                          y2={clinic.y + 2.5}
                        />
                      </g>
                    )}

                    {/* Online checkmark */}
                    {clinic.status === "online" && (
                      <path
                        d={`M ${clinic.x - 2.5},${clinic.y} L ${clinic.x - 0.5},${clinic.y + 2} L ${clinic.x + 2.8},${clinic.y - 2}`}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Delay dash */}
                    {clinic.status === "delay" && (
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
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${S[hovClinic.status].dot} ${
                        hovClinic.status !== "online" ? "animate-pulse" : ""
                      }`}
                    />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {hovClinic.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                    {hovClinic.district} · {hovClinic.lastSync}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${S[hovClinic.status].badge}`}
                    >
                      {S[hovClinic.status].label}
                    </span>
                    {hovClinic.patients > 0 && (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {hovClinic.patients} patients
                      </span>
                    )}
                    {hovClinic.status === "offline" && (
                      <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold">
                        Unreachable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status legend */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-6 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Legend
          </span>
          <div className="flex items-center gap-5 flex-1">
            <div className="flex items-center gap-2">
              <div className="relative w-5 h-5">
                <svg viewBox="0 0 20 20" className="w-full h-full">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="#22c55e"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <path
                    d="M7,10 L9,12 L13,8"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Online / Synced
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-5 h-5">
                <svg viewBox="0 0 20 20" className="w-full h-full">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="#f59e0b"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <line
                    x1="7"
                    y1="10"
                    x2="13"
                    y2="10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Sync Delay
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-5 h-5">
                <svg viewBox="0 0 20 20" className="w-full h-full">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <line
                    x1="7.5"
                    y1="7.5"
                    x2="12.5"
                    y2="12.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="12.5"
                    y1="7.5"
                    x2="7.5"
                    y2="12.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Offline
              </span>
            </div>
            {emergencyMode && (
              <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                <div className="w-4 h-4 rounded-full border-2 border-dashed border-rose-500 opacity-70 flex-shrink-0" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                  Emergency Zone
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            {counts.online}/{CLINICS.length} online
          </div>
        </div>
      </main>
    </div>
  )
}
