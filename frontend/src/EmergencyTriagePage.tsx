import { useState, useEffect } from "react"

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  pulse: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12h4l2-7 4 14 3-9 2 2h5"
      />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 4.5v3.75l2.5 1.5" />
    </svg>
  ),
  chevron: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M8 0l1.6 4.8L14 6.4l-4.4 1.6L8 12l-1.6-4L2 6.4l4.4-1.6L8 0z" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M11 2L3 11h5l-1 7 8-9h-5l1-7z" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 8-8" />
    </svg>
  ),
}

// ── Triage bands ─────────────────────────────────────────────────────────────────
const BANDS = {
  red: {
    label: "Immediate",
    rowBg: "bg-red-50/70 hover:bg-red-50",
    edge: "bg-red-500",
    badge: "bg-red-600 text-white",
    dot: "bg-red-500",
    score: "text-red-700",
    ring: "stroke-red-500",
    btn: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-red-600/30",
  },
  yellow: {
    label: "Urgent",
    rowBg: "bg-amber-50/50 hover:bg-amber-50",
    edge: "bg-amber-400",
    badge: "bg-amber-400 text-amber-950",
    dot: "bg-amber-400",
    score: "text-amber-600",
    ring: "stroke-amber-400",
    btn: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30",
  },
  green: {
    label: "Delayed",
    rowBg: "bg-white hover:bg-emerald-50/40",
    edge: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-400",
    score: "text-emerald-600",
    ring: "stroke-emerald-400",
    btn: "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-none",
  },
} as const

type Band = keyof typeof BANDS

interface Patient {
  id: string
  name: string
  age: number
  gender: "M" | "F"
  score: number
  band: Band
  complaint: string
  vitals: string
  waited: number // minutes
  arrival: string
  initials: string
}

const INITIAL: Patient[] = [
  {
    id: "EMG-2041",
    name: "Rahima Begum",
    age: 62,
    gender: "F",
    score: 97,
    band: "red",
    complaint: "Crush injury, left leg — heavy bleeding",
    vitals: "HR 128 · BP 84/52 · SpO₂ 89%",
    waited: 2,
    arrival: "10:41",
    initials: "RB",
  },
  {
    id: "EMG-2044",
    name: "Abdul Karim",
    age: 8,
    gender: "M",
    score: 94,
    band: "red",
    complaint: "Near-drowning, unconscious on arrival",
    vitals: "HR 140 · SpO₂ 84% · unresponsive",
    waited: 1,
    arrival: "10:43",
    initials: "AK",
  },
  {
    id: "EMG-2039",
    name: "Shahida Khatun",
    age: 34,
    gender: "F",
    score: 88,
    band: "red",
    complaint: "Head trauma, disoriented",
    vitals: "HR 112 · BP 148/96 · GCS 12",
    waited: 6,
    arrival: "10:36",
    initials: "SK",
  },
  {
    id: "EMG-2046",
    name: "Jamal Uddin",
    age: 47,
    gender: "M",
    score: 71,
    band: "yellow",
    complaint: "Open forearm fracture, stable",
    vitals: "HR 98 · BP 132/84 · SpO₂ 97%",
    waited: 4,
    arrival: "10:39",
    initials: "JU",
  },
  {
    id: "EMG-2038",
    name: "Nurjahan Akter",
    age: 29,
    gender: "F",
    score: 66,
    band: "yellow",
    complaint: "Smoke inhalation, coughing",
    vitals: "HR 104 · SpO₂ 94% · alert",
    waited: 9,
    arrival: "10:33",
    initials: "NA",
  },
  {
    id: "EMG-2047",
    name: "Faruk Hossain",
    age: 55,
    gender: "M",
    score: 58,
    band: "yellow",
    complaint: "Chest pain, dehydrated",
    vitals: "HR 92 · BP 138/88 · SpO₂ 96%",
    waited: 5,
    arrival: "10:38",
    initials: "FH",
  },
  {
    id: "EMG-2035",
    name: "Mizanur Rahman",
    age: 41,
    gender: "M",
    score: 34,
    band: "green",
    complaint: "Minor lacerations, forearm",
    vitals: "HR 82 · BP 122/78 · SpO₂ 99%",
    waited: 14,
    arrival: "10:28",
    initials: "MR",
  },
  {
    id: "EMG-2033",
    name: "Ayesha Siddiqua",
    age: 23,
    gender: "F",
    score: 22,
    band: "green",
    complaint: "Ankle sprain, ambulatory",
    vitals: "HR 76 · BP 118/74 · SpO₂ 99%",
    waited: 18,
    arrival: "10:24",
    initials: "AS",
  },
]

export default function EmergencyTriagePage() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL)
  const [filter, setFilter] = useState<Band | "all">("all")
  const [treated, setTreated] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // Live clock + creeping wait times to feel "live"
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const sorted = [...patients].sort((a, b) => b.score - a.score)
  const visible =
    filter === "all" ? sorted : sorted.filter((p) => p.band === filter)

  const counts = {
    red: patients.filter((p) => p.band === "red").length,
    yellow: patients.filter((p) => p.band === "yellow").length,
    green: patients.filter((p) => p.band === "green").length,
  }

  const startTreatment = (id: string) => {
    setTreated(id)
    setTimeout(() => {
      setPatients((prev) => prev.filter((p) => p.id !== id))
      setTreated(null)
    }, 650)
  }

  return (
    <div className="pb-4">
      {/* ── Header ── */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 mb-6 flex flex-wrap items-center gap-4 shadow-lg shadow-red-900/10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0 12px, transparent 12px 24px)",
          }}
        />
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0 relative">
          <span className="absolute inset-0 rounded-xl bg-white/30 animate-ping" />
          <span className="relative">{Icon.pulse}</span>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/20 rounded-full px-2 py-0.5">
              Live Triage
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-red-50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{" "}
              Updating · {now}
            </span>
          </div>
          <h1 className="font-display text-2xl text-white mt-1.5 leading-tight">
            Emergency Triage Queue
          </h1>
        </div>
        {/* AI live indicator */}
        <div className="relative flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3.5 py-2.5 text-white">
          <span className="text-red-100">{Icon.spark}</span>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-wide text-red-100 font-semibold">
              AI Urgency Engine
            </p>
            <p className="text-xs font-semibold">
              On-device · scoring {patients.length} patients
            </p>
          </div>
        </div>
      </div>

      {/* ── Band summary / filters ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            key: "all" as const,
            label: "All Waiting",
            value: patients.length,
            dot: "bg-slate-400",
            accent: "text-slate-800",
          },
          {
            key: "red" as const,
            label: BANDS.red.label,
            value: counts.red,
            dot: BANDS.red.dot,
            accent: "text-red-700",
          },
          {
            key: "yellow" as const,
            label: BANDS.yellow.label,
            value: counts.yellow,
            dot: BANDS.yellow.dot,
            accent: "text-amber-600",
          },
          {
            key: "green" as const,
            label: BANDS.green.label,
            value: counts.green,
            dot: BANDS.green.dot,
            accent: "text-emerald-600",
          },
        ].map((b) => {
          const active = filter === b.key
          return (
            <button
              key={b.key}
              onClick={() => setFilter(b.key)}
              className={`text-left rounded-2xl border px-4 py-3.5 transition-all ${
                active
                  ? "border-red-300 bg-white shadow-md ring-2 ring-red-500/10"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${b.key === "all" ? "hidden sm:block" : ""}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {b.label}
                </span>
              </div>
              <p className={`font-display text-3xl ${b.accent}`}>{b.value}</p>
            </button>
          )
        })}
      </div>

      {/* ── Queue table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Column header (desktop) */}
        <div className="hidden lg:grid grid-cols-[64px_1.6fr_2fr_1.1fr_130px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          {[
            "Urgency",
            "Patient",
            "Chief Complaint & Vitals",
            "Waiting",
            "Action",
          ].map((h) => (
            <span
              key={h}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-400"
            >
              {h}
            </span>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              {Icon.check}
            </div>
            <p className="text-sm font-semibold text-slate-600">
              Queue clear for this band
            </p>
            <p className="text-xs text-slate-400 mt-1">
              No patients currently waiting.
            </p>
          </div>
        ) : (
          <ul>
            {visible.map((p, i) => {
              const b = BANDS[p.band]
              const isTreating = treated === p.id
              const wait = p.waited + Math.floor(tick / 60)
              return (
                <li
                  key={p.id}
                  className={`relative grid grid-cols-[8px_1fr] lg:grid-cols-[8px_56px_1.6fr_2fr_1.1fr_130px] gap-x-4 gap-y-2 items-center px-3 lg:px-5 py-4 border-b border-slate-100 last:border-0 transition-all duration-500 ${b.rowBg} ${
                    isTreating ? "opacity-0 -translate-x-4" : "opacity-100"
                  }`}
                >
                  {/* Urgency edge */}
                  <span
                    className={`hidden lg:block w-1 h-10 rounded-full ${b.edge}`}
                  />
                  <span
                    className={`lg:hidden w-1.5 h-full absolute left-0 top-0 rounded-l-lg ${b.edge}`}
                  />

                  {/* Score ring */}
                  <div className="hidden lg:flex flex-col items-center gap-1">
                    <div className="relative w-11 h-11">
                      <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className={b.ring}
                          strokeDasharray={2 * Math.PI * 16}
                          strokeDashoffset={
                            2 * Math.PI * 16 * (1 - p.score / 100)
                          }
                        />
                      </svg>
                      <span
                        className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${b.score}`}
                      >
                        {p.score}
                      </span>
                    </div>
                  </div>

                  {/* Patient */}
                  <div className="min-w-0 pl-2 lg:pl-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 flex-shrink-0 lg:hidden">
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {p.age} yrs · {p.gender === "F" ? "F" : "M"} · {p.id}
                        </p>
                      </div>
                    </div>
                    {/* Mobile badge + score */}
                    <span
                      className={`lg:hidden inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${b.badge}`}
                    >
                      {p.band === "red" && Icon.bolt} {b.label} · {p.score}
                    </span>
                  </div>

                  {/* Complaint & vitals */}
                  <div className="min-w-0 pl-2 lg:pl-0">
                    <span
                      className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1 ${b.badge}`}
                    >
                      {p.band === "red" && Icon.bolt}
                      {b.label}
                    </span>
                    <p className="text-sm text-slate-700 leading-snug">
                      {p.complaint}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {p.vitals}
                    </p>
                  </div>

                  {/* Waiting */}
                  <div className="pl-2 lg:pl-0">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        wait >= 10 ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      {Icon.clock}
                      {wait} min
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Arrived {p.arrival}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="pl-2 lg:pl-0 lg:justify-self-end">
                    <button
                      onClick={() => startTreatment(p.id)}
                      disabled={isTreating}
                      className={`w-full lg:w-auto flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 ${b.btn}`}
                    >
                      {isTreating ? (
                        <>{Icon.check} Started</>
                      ) : (
                        <>Start Treatment {Icon.chevron}</>
                      )}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1.5">
        <span className="text-red-400">{Icon.spark}</span>
        Urgency scores computed on-device · queue re-ranks automatically as new
        patients arrive
      </p>
    </div>
  )
}
