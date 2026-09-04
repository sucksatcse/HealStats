import { useState, useMemo } from "react"

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  alert: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4M12 17h.01"
      />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 1.5l1.9 4.3 4.6.5-3.5 3.1 1 4.6L10 11.7 5.9 14l1-4.6L3.4 6.3l4.6-.5L10 1.5z" />
    </svg>
  ),
  doctor: (
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
        d="M8 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14v-1a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l3.5 3.5L13 4"
      />
    </svg>
  ),
  chevronDown: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-3.5 h-3.5"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 4.5v3.75l2.5 1.5" />
    </svg>
  ),
}

// ── Data ───────────────────────────────────────────────────────────────────────
type Level = "Critical" | "High" | "Moderate"

type Flagged = {
  id: string
  name: string
  age: number
  gender: "F" | "M"
  village: string
  score: number // 0-100 AI urgency
  level: Level
  symptoms: string
  vitals: string
  flaggedAt: string
  initials: string
  color: string
}

const INITIAL: Flagged[] = [
  {
    id: "PT-00376",
    name: "Oumar Coulibaly",
    age: 8,
    gender: "M",
    village: "Diamou",
    score: 94,
    level: "Critical",
    symptoms: "High fever (40.1°C), rapid breathing, chest indrawing",
    vitals: "RR 48 · SpO₂ 89%",
    flaggedAt: "4 min ago",
    initials: "OC",
    color: "bg-sky-100 text-sky-700",
  },
  {
    id: "PT-00331",
    name: "Modibo Keïta",
    age: 70,
    gender: "M",
    village: "Yélimané",
    score: 91,
    level: "Critical",
    symptoms: "Chest pain radiating to arm, sweating, shortness of breath",
    vitals: "BP 178/104 · HR 112",
    flaggedAt: "12 min ago",
    initials: "MK",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "PT-00251",
    name: "Hawa Camara",
    age: 41,
    gender: "F",
    village: "Kéniéba",
    score: 88,
    level: "Critical",
    symptoms: "Severe abdominal pain, vomiting blood, dizziness",
    vitals: "BP 88/56 · HR 128",
    flaggedAt: "26 min ago",
    initials: "HC",
    color: "bg-rose-100 text-rose-700",
  },
  {
    id: "PT-00412",
    name: "Mariama Kouyaté",
    age: 34,
    gender: "F",
    village: "Diamou",
    score: 79,
    level: "High",
    symptoms: "Persistent high fever, chills, confirmed malaria smear",
    vitals: "Temp 39.4°C · HR 104",
    flaggedAt: "38 min ago",
    initials: "MK",
    color: "bg-violet-100 text-violet-700",
  },
  {
    id: "PT-00365",
    name: "Kadiatou Baldé",
    age: 61,
    gender: "F",
    village: "Yélimané",
    score: 74,
    level: "High",
    symptoms: "Uncontrolled hypertension, blurred vision, headache",
    vitals: "BP 192/110",
    flaggedAt: "1 hr ago",
    initials: "KB",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "PT-00281",
    name: "Yacouba Sidibé",
    age: 56,
    gender: "M",
    village: "Yélimané",
    score: 71,
    level: "High",
    symptoms: "Diabetic, non-healing foot ulcer with early necrosis",
    vitals: "Glucose 21 mmol/L",
    flaggedAt: "1 hr ago",
    initials: "YS",
    color: "bg-lime-100 text-lime-700",
  },
  {
    id: "PT-00318",
    name: "Rokia Cissé",
    age: 3,
    gender: "F",
    village: "Diamou",
    score: 68,
    level: "High",
    symptoms: "Dehydration from acute diarrhoea, lethargy, sunken eyes",
    vitals: "Weight -8% · HR 138",
    flaggedAt: "2 hrs ago",
    initials: "RC",
    color: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    id: "PT-00292",
    name: "Assitan Doumbia",
    age: 29,
    gender: "F",
    village: "Kéniéba",
    score: 61,
    level: "Moderate",
    symptoms: "3rd-trimester pregnancy, elevated BP, mild oedema",
    vitals: "BP 148/94 · 34 wks",
    flaggedAt: "3 hrs ago",
    initials: "AD",
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "PT-00240",
    name: "Adama Fofana",
    age: 24,
    gender: "M",
    village: "Yélimané",
    score: 57,
    level: "Moderate",
    symptoms: "Deep laceration, signs of local infection, low-grade fever",
    vitals: "Temp 38.1°C",
    flaggedAt: "4 hrs ago",
    initials: "AF",
    color: "bg-teal-100 text-teal-700",
  },
]

const DOCTORS = [
  "Dr. Priya Suresh",
  "Dr. Fanta Diallo",
  "Dr. Kwame Osei",
  "Dr. Lina Haddad",
]

const LEVEL_META: Record<Level, {
  chip: string
  bar: string
  ring: string
  scoreText: string
}> = {
  Critical: {
    chip: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
    ring: "border-l-red-500",
    scoreText: "text-red-600",
  },
  High: {
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    bar: "bg-orange-500",
    ring: "border-l-orange-500",
    scoreText: "text-orange-600",
  },
  Moderate: {
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-500",
    ring: "border-l-amber-500",
    scoreText: "text-amber-600",
  },
}

const LEVEL_FILTERS: (Level | "All")[] = ["All", "Critical", "High", "Moderate"]

// ── Assign dropdown ──────────────────────────────────────────────────────────────
function AssignMenu({
  assigned,
  onAssign,
}: {
  assigned: string | null
  onAssign: (doctor: string) => void
}) {
  const [open, setOpen] = useState(false)

  if (assigned) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
          {Icon.check}
        </span>
        {assigned}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-lg shadow-sm transition-colors whitespace-nowrap"
      >
        {Icon.doctor}
        Assign
        {Icon.chevronDown}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-52 bg-white rounded-xl border border-slate-100 shadow-xl py-1.5 animate-slide-up">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3.5 py-1.5">
              Available doctors
            </p>
            {DOCTORS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  onAssign(d)
                  setOpen(false)
                }}
                className="w-full text-left text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 px-3.5 py-2 transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function FlaggedPatientsPage() {
  const [filter, setFilter] = useState<Level | "All">("All")
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [toast, setToast] = useState("")

  const assign = (id: string, name: string, doctor: string) => {
    setAssignments((prev) => ({ ...prev, [id]: doctor }))
    setToast(`${name} assigned to ${doctor}`)
    setTimeout(() => setToast(""), 2800)
  }

  const rows = useMemo(
    () => INITIAL.filter((r) => filter === "All" || r.level === filter),
    [filter],
  )

  const criticalCount = INITIAL.filter((r) => r.level === "Critical").length
  const unassignedCount = rows.filter((r) => !assignments[r.id]).length

  return (
    <div className="space-y-6">
      {/* Alert header banner */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
          {Icon.alert}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl text-red-950 leading-tight">
            High-Risk Patients
          </h1>
          <p className="text-sm text-red-700/80 mt-0.5">
            {INITIAL.length} patients flagged by on-device AI triage ·{" "}
            <span className="font-semibold">{criticalCount} critical</span> ·{" "}
            {unassignedCount} awaiting assignment
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={load} className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-red-700 bg-white/70 border border-red-200 px-3 py-1.5 rounded-full hover:bg-white transition-colors">
            {Icon.refresh} Refresh
          </button>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-red-700 bg-white/70 border border-red-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live feed
          </span>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-1">
            Urgency
          </span>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {LEVEL_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  filter === f
                    ? f === "Critical"
                      ? "bg-red-500 text-white shadow-sm"
                      : f === "High"
                        ? "bg-orange-500 text-white shadow-sm"
                        : f === "Moderate"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-600">{rows.length}</span>{" "}
          flagged patient{rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
          <button onClick={load} className="ml-3 font-semibold underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {[
                  "Patient",
                  "Urgency Score",
                  "Symptoms Summary",
                  "Flagged",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const meta = LEVEL_META[r.level]
                const assigned = assignments[r.id]
                return (
                  <tr
                    key={r.id}
                    className={`group hover:bg-slate-50/60 transition-colors border-l-4 ${
                      assigned ? "border-l-emerald-400 opacity-80" : meta.ring
                    }`}
                  >
                    {/* Patient */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${r.color}`}
                        >
                          {r.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {r.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {r.age} yrs · {r.gender === "F" ? "F" : "M"} ·{" "}
                            {r.village} · {r.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Urgency score */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 w-40">
                        <div className="flex items-baseline gap-1 w-12 flex-shrink-0">
                          <span
                            className={`font-display text-2xl leading-none ${meta.scoreText}`}
                          >
                            {r.score}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${meta.chip}`}
                          >
                            {r.level}
                          </span>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meta.bar}`}
                              style={{ width: `${r.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Symptoms */}
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm text-slate-700 leading-snug">
                        {r.symptoms}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className={meta.scoreText}>{Icon.spark}</span>
                        {r.vitals}
                      </p>
                    </td>
                    {/* Flagged time */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                        {Icon.clock}
                        {r.flaggedAt}
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <AssignMenu
                          assigned={assigned || null}
                          onAssign={(d) => assign(r.id, r.name, d)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && !error && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-emerald-500">
              {Icon.check}
            </div>
            <p className="text-sm font-medium text-slate-500">
              No patients at this urgency level
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Adjust the filter to see other flagged cases
            </p>
          </div>
        )}
      </div>

      {/* UI-only disclaimer for Mark Reviewed */}
      <p className="text-xs text-slate-400 text-center">
        "Mark reviewed" status is session-only — no database field exists yet. Assignments are also not persisted.
      </p>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-teal-950 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            {Icon.check}
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
