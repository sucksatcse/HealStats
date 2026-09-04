import { useState } from "react"

// ── Icons ────────────────────────────────────────────────────────────────────────
const Icon = {
  download: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11"
      />
    </svg>
  ),
  trendUp: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-3 h-3"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 11l4-4 3 3 5-6M14 4h-3M14 4v3"
      />
    </svg>
  ),
  info: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-3.5 h-3.5"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 7.5v3.5M8 5h.01" />
    </svg>
  ),
}

// ── Palette ──────────────────────────────────────────────────────────────────────
const TEAL = "#0d9488"
const TEAL_SOFT = "#5eead4"
// Reserved severity/status ramp (ordered) — carried with labels + legend, never color-alone
const URGENCY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Moderate: "#d97706",
  Low: "#0891b2",
  Stable: "#059669",
}

// ── Data ───────────────────────────────────────────────────────────────────────
const WEEKLY = [
  { week: "Jul 7", label: "Wk 27", visits: 1180 },
  { week: "Jul 14", label: "Wk 28", visits: 1342 },
  { week: "Jul 21", label: "Wk 29", visits: 1275 },
  { week: "Jul 28", label: "Wk 30", visits: 1490 },
  { week: "Aug 4", label: "Wk 31", visits: 1610 },
  { week: "Aug 11", label: "Wk 32", visits: 1428 },
  { week: "Aug 18", label: "Wk 33", visits: 1702 },
  { week: "Aug 25", label: "Wk 34", visits: 1856 },
]

const DIAGNOSES = [
  { name: "Malaria", count: 428 },
  { name: "Acute Respiratory Infection", count: 356 },
  { name: "Hypertension", count: 291 },
  { name: "Type 2 Diabetes", count: 214 },
  { name: "Antenatal Care", count: 188 },
  { name: "Diarrhoeal Disease", count: 143 },
  { name: "Malnutrition", count: 97 },
]

const URGENCY = [
  { level: "Critical", count: 27 },
  { level: "High", count: 64 },
  { level: "Moderate", count: 138 },
  { level: "Low", count: 210 },
  { level: "Stable", count: 397 },
]

const VILLAGES = ["Diamou", "Sadiola", "Kéniéba", "Yélimané", "Nioro"]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
// Visit intensity per village per day (0-100)
const HEATMAP: number[][] = [
  [72, 88, 54, 91, 96, 61, 40],
  [45, 63, 78, 55, 82, 48, 30],
  [90, 74, 66, 88, 100, 70, 52],
  [38, 52, 44, 60, 71, 40, 25],
  [58, 69, 81, 73, 85, 55, 36],
]

// ── Line chart: weekly visits ────────────────────────────────────────────────────
function WeeklyLineChart() {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640,
    H = 240,
    padX = 44,
    padTop = 20,
    padBottom = 36
  const innerW = W - padX * 2,
    innerH = H - padTop - padBottom
  const maxV = 2000,
    minV = 1000
  const pts = WEEKLY.map((d, i) => ({
    x: padX + (innerW * i) / (WEEKLY.length - 1),
    y: padTop + innerH * (1 - (d.visits - minV) / (maxV - minV)),
    ...d,
  }))
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ")
  const area = `${line} L${pts[pts.length - 1].x},${H - padBottom} L${pts[0].x},${H - padBottom} Z`
  const grid = [1000, 1250, 1500, 1750, 2000]

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="wklyArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.2" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((g) => {
          const y = padTop + innerH * (1 - (g - minV) / (maxV - minV))
          return (
            <g key={g}>
              <line
                x1={padX}
                y1={y}
                x2={W - padX}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <text
                x={padX - 10}
                y={y + 3.5}
                textAnchor="end"
                className="fill-slate-400"
                fontSize="10.5"
              >
                {g >= 1000 ? `${g / 1000}k` : g}
              </text>
            </g>
          )
        })}
        <path d={area} fill="url(#wklyArea)" />
        <path
          d={line}
          fill="none"
          stroke={TEAL}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <g key={p.week}>
            <text
              x={p.x}
              y={H - padBottom + 18}
              textAnchor="middle"
              className="fill-slate-500"
              fontSize="10.5"
              fontWeight={hover === i ? 700 : 500}
            >
              {p.week}
            </text>
            {hover === i && (
              <line
                x1={p.x}
                y1={padTop}
                x2={p.x}
                y2={H - padBottom}
                stroke={TEAL}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 6 : 4}
              fill="white"
              stroke={TEAL}
              strokeWidth="2.5"
              className="transition-all"
            />
            <rect
              x={p.x - innerW / (WEEKLY.length - 1) / 2}
              y={0}
              width={innerW / (WEEKLY.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-teal-950 text-white rounded-lg px-3 py-2 shadow-lg"
          style={{
            left: `${(pts[hover].x / W) * 100}%`,
            top: `${(pts[hover].y / H) * 100}%`,
            marginTop: "-10px",
          }}
        >
          <p className="text-[10px] uppercase tracking-wide text-teal-300 font-semibold whitespace-nowrap">
            {pts[hover].label} · {pts[hover].week}
          </p>
          <p className="font-display text-lg leading-none mt-0.5">
            {pts[hover].visits.toLocaleString()}{" "}
            <span className="text-xs font-sans text-teal-200">visits</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ── Bar chart: common diagnoses ──────────────────────────────────────────────────
function DiagnosesBarChart() {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...DIAGNOSES.map((d) => d.count))
  return (
    <div className="space-y-3">
      {DIAGNOSES.map((d, i) => (
        <div
          key={d.name}
          className="group"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600 truncate">
              {d.name}
            </span>
            <span className="text-xs font-semibold text-slate-500 tabular-nums ml-2">
              {d.count}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(d.count / max) * 100}%`,
                background:
                  hover === i
                    ? TEAL
                    : `linear-gradient(90deg, ${TEAL}, ${TEAL_SOFT})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart: urgency distribution ────────────────────────────────────────────
function UrgencyDonut() {
  const [hover, setHover] = useState<number | null>(null)
  const total = URGENCY.reduce((s, u) => s + u.count, 0)
  const R = 70,
    r = 46,
    cx = 90,
    cy = 90
  const gap = 0.02 // radians — 2px-style surface gap between segments

  let angle = -Math.PI / 2
  const arcs = URGENCY.map((u) => {
    const frac = u.count / total
    const start = angle + gap / 2
    const end = angle + frac * Math.PI * 2 - gap / 2
    angle += frac * Math.PI * 2
    const large = end - start > Math.PI ? 1 : 0
    const x1 = cx + R * Math.cos(start),
      y1 = cy + R * Math.sin(start)
    const x2 = cx + R * Math.cos(end),
      y2 = cy + R * Math.sin(end)
    const x3 = cx + r * Math.cos(end),
      y3 = cy + r * Math.sin(end)
    const x4 = cx + r * Math.cos(start),
      y4 = cy + r * Math.sin(start)
    const d = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4} Z`
    return { d, ...u, frac }
  })

  return (
    <div className="flex items-center gap-6 flex-wrap justify-center">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 180 180" className="w-44 h-44">
          {arcs.map((a, i) => (
            <path
              key={a.level}
              d={a.d}
              fill={URGENCY_COLORS[a.level]}
              stroke="white"
              strokeWidth="1"
              className="transition-all cursor-pointer"
              style={{
                opacity: hover === null || hover === i ? 1 : 0.35,
                transformOrigin: "90px 90px",
                transform: hover === i ? "scale(1.04)" : "scale(1)",
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          <text
            x="90"
            y="84"
            textAnchor="middle"
            className="fill-teal-950 font-display"
            fontSize="26"
          >
            {hover !== null ? arcs[hover].count : total}
          </text>
          <text
            x="90"
            y="102"
            textAnchor="middle"
            className="fill-slate-400"
            fontSize="10"
            fontWeight={600}
          >
            {hover !== null ? arcs[hover].level : "TOTAL FLAGGED"}
          </text>
        </svg>
      </div>
      {/* Legend with direct labels + % (secondary encoding for the status ramp) */}
      <div className="space-y-2 min-w-[150px]">
        {arcs.map((a, i) => (
          <button
            key={a.level}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`w-full flex items-center gap-2.5 text-left rounded-lg px-2 py-1 transition-colors ${
              hover === i ? "bg-slate-50" : ""
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: URGENCY_COLORS[a.level] }}
            />
            <span className="text-sm text-slate-600 flex-1">{a.level}</span>
            <span className="text-sm font-semibold text-slate-700 tabular-nums">
              {Math.round(a.frac * 100)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Heatmap: village × day intensity ─────────────────────────────────────────────
function VillageHeatmap() {
  const [hover, setHover] = useState<{ v: number; d: number } | null>(null)
  // Sequential teal ramp (light→dark), monotonic lightness
  const shade = (v: number) => {
    if (v < 20) return "#f0fdfa"
    if (v < 40) return "#ccfbf1"
    if (v < 55) return "#5eead4"
    if (v < 70) return "#2dd4bf"
    if (v < 85) return "#14b8a6"
    return "#0d9488"
  }
  const textColor = (v: number) => (v >= 70 ? "text-white" : "text-teal-900")

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Day headers */}
          <div className="grid grid-cols-[92px_repeat(7,1fr)] gap-1.5 mb-1.5">
            <div />
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Rows */}
          {VILLAGES.map((village, vi) => (
            <div
              key={village}
              className="grid grid-cols-[92px_repeat(7,1fr)] gap-1.5 mb-1.5"
            >
              <div className="text-xs font-medium text-slate-600 flex items-center truncate pr-1">
                {village}
              </div>
              {DAYS.map((_, di) => {
                const val = HEATMAP[vi][di]
                const active = hover && hover.v === vi && hover.d === di
                return (
                  <div
                    key={di}
                    onMouseEnter={() => setHover({ v: vi, d: di })}
                    onMouseLeave={() => setHover(null)}
                    className={`relative aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-all ${textColor(val)} ${
                      active ? "ring-2 ring-teal-600 ring-offset-1 z-10" : ""
                    }`}
                    style={{ background: shade(val) }}
                  >
                    {val}
                    {active && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-teal-950 text-white rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap z-20">
                        <p className="text-[10px] text-teal-300 font-semibold">
                          {VILLAGES[vi]} · {DAYS[di]}
                        </p>
                        <p className="text-xs font-semibold">{val}% capacity</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Scale legend */}
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-[10px] text-slate-400 font-medium">Low</span>
        <div className="flex gap-0.5">
          {[
            "#f0fdfa",
            "#ccfbf1",
            "#5eead4",
            "#2dd4bf",
            "#14b8a6",
            "#0d9488",
          ].map((c) => (
            <span
              key={c}
              className="w-5 h-2.5 rounded-sm"
              style={{ background: c }}
            />
          ))}
        </div>
        <span className="text-[10px] text-slate-400 font-medium">High</span>
      </div>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────────
function ChartCard({
  title,
  subtitle,
  children,
  span,
  badge,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  span?: boolean
  badge?: React.ReactNode
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 p-5 lg:p-6 ${
        span ? "lg:col-span-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-slate-800 text-base">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>
      {children}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [range, setRange] = useState<"8w" | "6m" | "1y">("8w")
  const totalVisits = WEEKLY.reduce((s, w) => s + w.visits, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
            Analytics &amp; Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kayes Health District · trends across all clinics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(["8w", "6m", "1y"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  range === r
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r === "8w" ? "8 weeks" : r === "6m" ? "6 months" : "1 year"}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5">
            {Icon.download}
            Export Report
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Line chart — full width */}
        <ChartCard
          title="Patients Visited per Week"
          subtitle={`${totalVisits.toLocaleString()} total over 8 weeks · aggregated across 12 clinics`}
          span
          badge={
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {Icon.trendUp}
              +18.2% vs prior
            </span>
          }
        >
          <WeeklyLineChart />
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <span
              className="w-3 h-0.5 rounded-full"
              style={{ background: TEAL }}
            />
            <span className="text-xs text-slate-500">
              Weekly patient visits
            </span>
            <span className="text-xs text-slate-400 ml-auto">
              Peak: Wk 34, 1,856 visits
            </span>
          </div>
        </ChartCard>

        {/* Bar chart — common diagnoses */}
        <ChartCard
          title="Most Common Diagnoses"
          subtitle="By recorded visits this period"
        >
          <DiagnosesBarChart />
        </ChartCard>

        {/* Donut — urgency distribution */}
        <ChartCard
          title="Urgency-Level Distribution"
          subtitle="AI triage outcomes across all patients"
          badge={<span className="text-slate-300">{Icon.info}</span>}
        >
          <UrgencyDonut />
        </ChartCard>

        {/* Heatmap — full width */}
        <ChartCard
          title="Visit Intensity by Village"
          subtitle="Relative clinic load — village × day of week"
          span
          badge={
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              This week
            </span>
          }
        >
          <VillageHeatmap />
        </ChartCard>
      </div>
    </div>
  )
}
