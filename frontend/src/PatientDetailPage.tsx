import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { SYMPTOM_CATEGORIES, URGENCY_LEVELS } from "./VitalsPage"

// ── Types (mirror supabase/migrations/20260831000000_initial_schema.sql) ──────
type Patient = {
  id: string
  name: string
  age: number | null
  sex: string | null
  village: string | null
  created_at: string
  clinics: { name: string } | null
}

type Vitals = Partial<
  Record<
    | "systolic"
    | "diastolic"
    | "temperature"
    | "pulse"
    | "weight"
    | "spo2"
    | "respRate"
    | "muac",
    number
  >
>

type Visit = {
  id: string
  created_at: string
  vitals: Vitals | null
  symptoms: string | null
  symptom_category: string | null
  diagnosis: string | null
  urgency_score: number | null
  synced_at: string | null
  staff: { name: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const shortId = (id: string) => id.split("-")[0].toUpperCase()
const sexLabel = (s: string | null) =>
  s === "F" ? "Female" : s === "M" ? "Male" : (s ?? "—")
const fmtDate = (iso: string, withYear = true) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  })
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
const categoryLabel = (v: string | null) =>
  SYMPTOM_CATEGORIES.find((c) => c.value === v)?.label ?? v ?? "—"
const urgencyLabel = (score: number | null) =>
  URGENCY_LEVELS.find((u) => u.score === score)?.label ??
  (score !== null && score >= 5 ? "Critical" : null)
const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return (
    parts.length > 1 ? parts[0][0] + parts[1][0] : name.substring(0, 2)
  ).toUpperCase()
}

// ── Sparkline SVG ──────────────────────────────────────────────────────────────
function Sparkline({
  data,
  color,
  minVal,
  maxVal,
  height = 48,
  width = 200,
}: {
  data: number[]
  color: string
  minVal: number
  maxVal: number
  height?: number
  width?: number
}) {
  const pad = { x: 8, y: 6 }
  const w = width - pad.x * 2
  const h = height - pad.y * 2
  const range = maxVal - minVal || 1

  const pts = data.map((v, i) => ({
    x: pad.x + (i / (data.length - 1)) * w,
    y: pad.y + h - ((v - minVal) / range) * h,
  }))

  const path = pts.reduce(
    (acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`),
    "",
  )

  const fillPath = `${path} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={`grad-${color.replace(/[^a-z]/gi, "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#grad-${color.replace(/[^a-z]/gi, "")})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}

// ── Urgency badge ──────────────────────────────────────────────────────────────
const URGENCY_BADGE_CLS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
  High: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
  Low: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50",
  Stable: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
}

function UrgencyBadge({ score }: { score: number | null }) {
  const label = urgencyLabel(score)
  const cls = label
    ? URGENCY_BADGE_CLS[label]
    : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800"
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cls}`}
    >
      {label ?? "Unscored"}
    </span>
  )
}

// ── Tab bar ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "vitals", label: "Vitals History" },
  { id: "visits", label: "Visit History" },
  { id: "diagnosis", label: "Diagnoses" },
]

// ── Main ───────────────────────────────────────────────────────────────────────
export default function PatientDetailPage({
  patientId,
  onNewVisit,
}: {
  patientId?: string | null
  onNewVisit?: (patientId: string) => void
}) {
  const [tab, setTab] = useState<"vitals" | "visits" | "diagnosis">("vitals")
  const [visitExpanded, setVisitExpanded] = useState<number | null>(0)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setPatient(null)
      setVisits([])
      try {
        const [pRes, vRes] = await Promise.all([
          supabase
            .from("patients")
            .select("id, name, age, sex, village, created_at, clinics ( name )")
            .eq("id", patientId)
            .maybeSingle(),
          supabase
            .from("visits")
            .select(
              "id, created_at, vitals, symptoms, symptom_category, diagnosis, urgency_score, synced_at, staff ( name )",
            )
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false }),
        ])
        if (pRes.error) throw pRes.error
        if (vRes.error) throw vRes.error
        if (cancelled) return
        setPatient((pRes.data as unknown as Patient) ?? null)
        setVisits((vRes.data as unknown as Visit[]) ?? [])
        setVisitExpanded(0)
      } catch (err: any) {
        console.error(err)
        if (!cancelled) setError(err.message || "Failed to load patient.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [patientId])

  // Oldest → newest, only visits that captured vitals
  const vitalsHistory = visits
    .filter((v) => v.vitals && Object.keys(v.vitals).length > 0)
    .slice()
    .reverse()
  const latestVitals = vitalsHistory[vitalsHistory.length - 1]?.vitals ?? null
  const latestVisit = visits[0] ?? null
  const diagnosed = visits.filter((v) => v.diagnosis && v.diagnosis.trim())

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-5xl mx-auto w-full">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          No patient selected
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Open a record from the Patients list, or register a new patient to
          view their history here.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-5xl mx-auto w-full">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-teal-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
          Loading patient record...
        </p>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 flex flex-col items-center justify-center py-20 max-w-5xl mx-auto w-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-12 h-12 mb-4 text-red-400 dark:text-red-500"
        >
          <circle cx="12" cy="12" r="10" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01"
          />
        </svg>
        <p className="font-semibold text-lg">
          {error ? "Failed to load patient" : "Patient not found"}
        </p>
        <p className="text-sm mt-1">
          {error ?? "This record may have been removed or belongs to another clinic."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10 w-full">
      {/* ── Patient header card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Teal accent bar */}
        <div className="h-2 bg-gradient-to-r from-teal-500 to-teal-700" />

        <div className="px-6 py-5 flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-display text-2xl shadow-md shadow-teal-600/20">
              {initialsOf(patient.name)}
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl text-teal-950 dark:text-white leading-tight">
                  {patient.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {patient.age ?? "—"} yrs
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {sexLabel(patient.sex)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {patient.village ?? "—"}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {shortId(patient.id)}
                  </span>
                </div>
                {latestVisit && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <UrgencyBadge score={latestVisit.urgency_score} />
                    {latestVisit.symptom_category && (
                      <span className="text-[11px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full">
                        {categoryLabel(latestVisit.symptom_category)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {onNewVisit && (
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    onClick={() => onNewVisit(patient.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:-translate-y-0.5"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 3v10M3 8h10"
                      />
                    </svg>
                    New Visit
                  </button>
                </div>
              )}
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {[
                { label: "Registered", value: fmtDate(patient.created_at) },
                {
                  label: "Total Visits",
                  value: `${visits.length} visit${visits.length === 1 ? "" : "s"}`,
                },
                {
                  label: "Last Visit",
                  value: latestVisit ? fmtDate(latestVisit.created_at) : "—",
                },
                { label: "Clinic", value: patient.clinics?.name ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div role="tablist" className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id as typeof tab)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              tab === id
                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB 1 — Vitals History
      ══════════════════════════════════════════════ */}
      {tab === "vitals" && vitalsHistory.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No vitals recorded yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Measurements entered during a visit will appear here.
          </p>
        </div>
      )}
      {tab === "vitals" && vitalsHistory.length > 0 && latestVitals && (
        <div className="flex flex-col gap-4">
          {/* Sparkline cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                {
                  key: "systolic",
                  label: "Systolic BP",
                  unit: "mmHg",
                  color: "#ef4444",
                  min: 80,
                  max: 180,
                  flag: (n: number) => n >= 140,
                  flagLabel: "High",
                },
                {
                  key: "temperature",
                  label: "Temperature",
                  unit: "°C",
                  color: "#f59e0b",
                  min: 35,
                  max: 40,
                  flag: (n: number) => n >= 38,
                  flagLabel: "Elevated",
                },
                {
                  key: "pulse",
                  label: "Pulse Rate",
                  unit: "bpm",
                  color: "#8b5cf6",
                  min: 40,
                  max: 140,
                  flag: (n: number) => n > 100,
                  flagLabel: "High",
                },
                {
                  key: "spo2",
                  label: "SpO₂",
                  unit: "%",
                  color: "#0d9488",
                  min: 85,
                  max: 100,
                  flag: (n: number) => n < 95,
                  flagLabel: "Low",
                },
              ] as const
            ).map(({ key, label, unit, color, min, max, flag, flagLabel }) => {
              const series = vitalsHistory.filter(
                (v) => typeof v.vitals?.[key] === "number",
              )
              const data = series.map((v) => v.vitals![key] as number)
              const lv = data[data.length - 1]
              const status =
                lv === undefined ? null : flag(lv) ? flagLabel : "Normal"
              return (
                <div
                  key={label}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 pt-4 pb-3 flex flex-col gap-2 overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {label}
                    </p>
                    {status && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          status === "Normal"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl text-slate-900 dark:text-white">
                      {lv ?? "—"}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {unit}
                    </span>
                  </div>
                  <div className="h-12 -mx-1 flex items-center justify-center">
                    {data.length >= 2 ? (
                      <Sparkline
                        data={data}
                        color={color}
                        minVal={Math.min(min, ...data)}
                        maxVal={Math.max(max, ...data)}
                        height={48}
                        width={180}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {data.length === 0
                          ? "Not recorded"
                          : "Trend needs 2+ readings"}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                    <span>
                      {series[0] ? fmtDate(series[0].created_at, false) : ""}
                    </span>
                    {data.length >= 2 && <span>Trend</span>}
                    <span>
                      {series.length > 1
                        ? fmtDate(series[series.length - 1].created_at, false)
                        : ""}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detailed vitals table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                All Readings — {vitalsHistory.length} visit
                {vitalsHistory.length === 1 ? "" : "s"}
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">Oldest → newest</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    {[
                      "Date",
                      "Sys / Dia (mmHg)",
                      "Temp (°C)",
                      "Pulse (bpm)",
                      "Weight (kg)",
                      "SpO₂ (%)",
                      "Resp (/min)",
                      "MUAC (cm)",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vitalsHistory.map((v, i) => {
                    const isLatest = i === vitalsHistory.length - 1
                    const vt = v.vitals ?? {}
                    const cell = (
                      n: number | undefined,
                      warn?: boolean,
                    ) => (
                      <span
                        className={
                          warn
                            ? "text-amber-600 dark:text-amber-400 font-semibold"
                            : "text-slate-700 dark:text-slate-200"
                        }
                      >
                        {n ?? "—"}
                      </span>
                    )
                    return (
                      <tr
                        key={v.id}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          isLatest ? "bg-teal-50/50 dark:bg-teal-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        } transition-colors`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {fmtDate(v.created_at)}
                          </span>
                          {isLatest && (
                            <span className="ml-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-full">
                              Latest
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${
                              (vt.systolic ?? 0) >= 140
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {vt.systolic ?? "—"}/{vt.diastolic ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {cell(vt.temperature, (vt.temperature ?? 0) >= 38)}
                        </td>
                        <td className="px-4 py-3">
                          {cell(vt.pulse, (vt.pulse ?? 0) > 100)}
                        </td>
                        <td className="px-4 py-3">{cell(vt.weight)}</td>
                        <td className="px-4 py-3">
                          {cell(
                            vt.spo2,
                            vt.spo2 !== undefined && vt.spo2 < 96,
                          )}
                        </td>
                        <td className="px-4 py-3">{cell(vt.respRate)}</td>
                        <td className="px-4 py-3">{cell(vt.muac)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 2 — Visit History
      ══════════════════════════════════════════════ */}
      {tab === "visits" && visits.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No visits recorded yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Use “New Visit” to record vitals and symptoms for this patient.
          </p>
        </div>
      )}
      {tab === "visits" && visits.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {visits.length} recorded visit{visits.length === 1 ? "" : "s"}
            </p>
            {visits.every((v) => v.synced_at) ? (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                All synced ✓
              </span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {visits.filter((v) => !v.synced_at).length} pending sync
              </span>
            )}
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex flex-col gap-3">
              {visits.map((v, i) => {
                const open = visitExpanded === i
                return (
                  <div key={v.id} className="flex gap-4">
                    {/* Timeline node */}
                    <div className="flex-shrink-0 flex flex-col items-center mt-4">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold z-10 border-2 ${
                          i === 0
                            ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20"
                            : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {visits.length - i}
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setVisitExpanded(open ? null : i)}
                        aria-expanded={open}
                        className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                              {fmtDate(v.created_at)}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {fmtTime(v.created_at)}
                            </span>
                            <UrgencyBadge score={v.urgency_score} />
                            {v.symptom_category && (
                              <span className="text-[10px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full">
                                {categoryLabel(v.symptom_category)}
                              </span>
                            )}
                            {v.synced_at ? (
                              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                ✓ Synced
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                Pending sync
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {v.symptoms?.split("\n")[0] || "No symptoms recorded"}
                          </p>
                        </div>
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className={`w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform mt-0.5 ${
                            open ? "rotate-180" : ""
                          }`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6l4 4 4-4"
                          />
                        </svg>
                      </button>

                      {open && (
                        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 grid sm:grid-cols-2 gap-4">
                          {[
                            {
                              label: "Clinician",
                              value: v.staff?.name ?? "—",
                            },
                            {
                              label: "Symptom Category",
                              value: categoryLabel(v.symptom_category),
                            },
                            {
                              label: "Symptoms",
                              value: v.symptoms || "—",
                              wide: true,
                            },
                            {
                              label: "Diagnosis",
                              value: v.diagnosis || "Not recorded",
                              wide: true,
                            },
                          ].map(({ label, value, wide }) => (
                            <div key={label} className={wide ? "sm:col-span-2" : ""}>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                                {label}
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                                {value}
                              </p>
                            </div>
                          ))}
                          {v.vitals && Object.keys(v.vitals).length > 0 && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                                Vitals
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(
                                  [
                                    ["systolic", "Sys", "mmHg"],
                                    ["diastolic", "Dia", "mmHg"],
                                    ["temperature", "Temp", "°C"],
                                    ["pulse", "Pulse", "bpm"],
                                    ["spo2", "SpO₂", "%"],
                                    ["respRate", "Resp", "/min"],
                                    ["weight", "Weight", "kg"],
                                    ["muac", "MUAC", "cm"],
                                  ] as const
                                )
                                  .filter(([k]) => v.vitals?.[k] !== undefined)
                                  .map(([k, lbl, unit]) => (
                                    <span
                                      key={k}
                                      className="text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200"
                                    >
                                      <span className="text-slate-400 dark:text-slate-500 font-medium mr-1">
                                        {lbl}
                                      </span>
                                      <span className="font-semibold">
                                        {v.vitals![k]}
                                      </span>
                                      <span className="text-slate-400 dark:text-slate-500 ml-0.5">
                                        {unit}
                                      </span>
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 3 — Diagnoses (from visits.diagnosis)
      ══════════════════════════════════════════════ */}
      {tab === "diagnosis" && diagnosed.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No diagnoses recorded yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Diagnoses entered on the visit form will be listed here.
          </p>
        </div>
      )}
      {tab === "diagnosis" && diagnosed.length > 0 && (
        <div className="flex flex-col gap-4">
          {diagnosed.map((v) => (
            <div
              key={v.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                      {fmtDate(v.created_at)}
                    </h3>
                    <UrgencyBadge score={v.urgency_score} />
                    {v.symptom_category && (
                      <span className="text-[10px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full">
                        {categoryLabel(v.symptom_category)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {fmtTime(v.created_at)} · {v.staff?.name ?? "Unknown clinician"}
                  </p>
                </div>
              </div>
              <div className="px-5 py-4 grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                    Diagnosis / Assessment
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {v.diagnosis}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                    Presenting Symptoms
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-3 whitespace-pre-line">
                    {v.symptoms || "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
