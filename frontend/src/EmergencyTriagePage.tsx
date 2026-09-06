import { useState, useEffect, useMemo, useCallback } from "react"
import { fetchEmergencyTriageQueue } from "./lib/adminService"
import type { EmergencyTriagePatient, TriageBand, TriageStatus } from "./lib/types"

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  pulse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h4l2-7 4 14 3-9 2 2h5" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 4.5v3.75l2.5 1.5" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M11 2L3 11h5l-1 7 8-9h-5l1-7z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 8-8" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path strokeLinecap="round" d="M10 10l4 4" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.65 2.35A7.5 7.5 0 1015.5 8h-2a5.5 5.5 0 11-1.39-3.61L10 6.5h5.5V1l-1.85 1.35z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="8" cy="5" r="3" />
      <path strokeLinecap="round" d="M3 14a5 5 0 0110 0" />
    </svg>
  ),
  arrowLeft: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 2.5h10v11H3zM5.5 6h5M5.5 9h5M5.5 12h3" />
    </svg>
  ),
}

// ── Urgency Scale Config (Authoritative 1–5 Scale) ────────────────────────────
const BANDS_CONFIG = {
  red: {
    label: "Immediate / Critical",
    description: "Urgency 4–5 · Life-threatening, immediate clinical intervention",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-900/60",
    badge: "bg-red-600 text-white shadow-red-600/30",
    dot: "bg-red-500",
    edge: "bg-red-500",
    scoreText: "text-red-600 dark:text-red-400",
    ring: "stroke-red-500",
    btn: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20",
  },
  yellow: {
    label: "Urgent / Priority",
    description: "Urgency 3 · Significant symptoms, rapid monitoring required",
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/60",
    badge: "bg-amber-500 text-white shadow-amber-500/30",
    dot: "bg-amber-400",
    edge: "bg-amber-400",
    scoreText: "text-amber-600 dark:text-amber-400",
    ring: "stroke-amber-400",
    btn: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
  },
  green: {
    label: "Delayed / Standard",
    description: "Urgency 1–2 · Ambulatory or mild presentation",
    bg: "bg-white dark:bg-slate-900",
    border: "border-slate-200 dark:border-slate-800",
    badge: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500",
    edge: "bg-emerald-400",
    scoreText: "text-emerald-600 dark:text-emerald-400",
    ring: "stroke-emerald-400",
    btn: "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  },
} as const

type FilterTab = TriageBand | "all" | "in_treatment"

interface EmergencyTriagePageProps {
  clinicId?: string | null
  onViewPatient?: (patientId: string) => void
  onNewVisit?: (patientId: string) => void
  onBack?: () => void
}

export default function EmergencyTriagePage({
  clinicId,
  onViewPatient,
  onNewVisit,
  onBack,
}: EmergencyTriagePageProps) {
  const [patients, setPatients] = useState<EmergencyTriagePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // ── Load Real Queue Data ──────────────────────────────────────────────────
  const loadQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    const result = await fetchEmergencyTriageQueue(clinicId)
    if (result.error) {
      setError(result.error)
    } else {
      setPatients(result.data || [])
    }

    setLoading(false)
    setRefreshing(false)
  }, [clinicId])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  // Periodic background refresh every 45s during emergency operations
  useEffect(() => {
    const timer = setInterval(() => {
      loadQueue(true)
    }, 45000)
    return () => clearInterval(timer)
  }, [loadQueue])

  // Clear toast
  useEffect(() => {
    if (!actionSuccess) return
    const t = setTimeout(() => setActionSuccess(null), 4000)
    return () => clearTimeout(t)
  }, [actionSuccess])

  // ── Update Local Status (waiting -> in_treatment -> discharged) ───────────
  const updatePatientStatus = (patient: EmergencyTriagePatient, newStatus: TriageStatus) => {
    const visitKey = patient.visitId || patient.id
    try {
      const saved = localStorage.getItem("healstats_triage_patient_status")
      const map: Record<string, TriageStatus> = saved ? JSON.parse(saved) : {}
      if (newStatus === "discharged") {
        delete map[visitKey]
      } else {
        map[visitKey] = newStatus
      }
      localStorage.setItem("healstats_triage_patient_status", JSON.stringify(map))
    } catch {
      // ignore
    }

    setPatients((prev) => {
      if (newStatus === "discharged") {
        return prev.filter((p) => (p.visitId || p.id) !== visitKey)
      }
      return prev.map((p) => {
        if ((p.visitId || p.id) === visitKey) {
          return { ...p, status: newStatus }
        }
        return p
      })
    })

    const actionLabel =
      newStatus === "in_treatment"
        ? `Admitted ${patient.name} to immediate clinical care`
        : newStatus === "discharged"
        ? `Discharged ${patient.name} from emergency queue`
        : `Reverted ${patient.name} to waiting queue`

    setActionSuccess(actionLabel)
  }

  // ── Filter & Search Logic ────────────────────────────────────────────────
  const counts = useMemo(() => {
    const waitingList = patients.filter((p) => p.status === "waiting")
    return {
      all: waitingList.length,
      red: waitingList.filter((p) => p.band === "red").length,
      yellow: waitingList.filter((p) => p.band === "yellow").length,
      green: waitingList.filter((p) => p.band === "green").length,
      in_treatment: patients.filter((p) => p.status === "in_treatment").length,
    }
  }, [patients])

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Filter tab
      if (filter === "in_treatment") {
        if (p.status !== "in_treatment") return false
      } else if (filter === "all") {
        if (p.status !== "waiting") return false
      } else {
        if (p.status !== "waiting" || p.band !== filter) return false
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchId = (p.id || "").toLowerCase().includes(q) || (p.patientId || "").toLowerCase().includes(q)
        const matchComplaint = (p.complaint || "").toLowerCase().includes(q)
        const matchVillage = (p.village || "").toLowerCase().includes(q)
        const matchClinic = (p.clinicName || "").toLowerCase().includes(q)
        if (!matchName && !matchId && !matchComplaint && !matchVillage && !matchClinic) {
          return false
        }
      }

      return true
    })
  }, [patients, filter, search])

  // ── CSV Export for Field Handovers ────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      "Priority Order",
      "Short ID",
      "Patient Name",
      "Age",
      "Gender",
      "Village",
      "Clinic",
      "Urgency Score (1-5)",
      "Triage Band",
      "Chief Complaint",
      "Vitals Summary",
      "Status",
      "Waiting Time",
      "Registered At",
    ]

    const rows = filteredPatients.map((p, idx) => [
      idx + 1,
      `"${p.id}"`,
      `"${p.name}"`,
      p.age ?? "",
      p.gender ?? "",
      `"${p.village || ""}"`,
      `"${p.clinicName || ""}"`,
      p.score,
      p.band.toUpperCase(),
      `"${(p.complaint || "").replace(/"/g, '""')}"`,
      `"${(p.vitalsSummary || "").replace(/"/g, '""')}"`,
      p.status,
      `"${p.wait}"`,
      `"${p.createdAt}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `healstats_emergency_triage_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="pb-10 space-y-6">
      {/* ── Banner / Header ── */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 px-6 py-5 text-white shadow-xl shadow-red-600/20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0 12px, transparent 12px 24px)",
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center text-white transition-all cursor-pointer"
                title="Return to Dashboard"
              >
                {Icon.arrowLeft}
              </button>
            )}
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0 relative">
              <span className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" />
              <span className="relative">{Icon.pulse}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/25 text-white rounded-full px-2.5 py-0.5">
                  Emergency Mode Active
                </span>
                <span className="flex items-center gap-1.5 text-xs text-red-50 font-medium">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live Pulse · {now}
                </span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl text-white font-bold mt-1 leading-tight">
                Emergency Mode Triage Queue
              </h1>
              <p className="text-xs text-red-100 mt-0.5">
                Real-time clinical prioritization using authoritative 1–5 urgency scale & emergency triage bands.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => loadQueue(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Queue"
            >
              <span className={refreshing ? "animate-spin" : ""}>{Icon.refresh}</span>
              <span>{refreshing ? "Refreshing..." : "Refresh Queue"}</span>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              disabled={filteredPatients.length === 0}
              className="inline-flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="Export Triage Sheet CSV"
            >
              {Icon.download}
              <span>Export Triage Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast Alert ── */}
      {actionSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-sm animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
              {Icon.check}
            </span>
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 text-base leading-none p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div role="alert" className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-4 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>Failed to load triage queue: {error}</span>
          <button
            type="button"
            onClick={() => loadQueue()}
            className="underline font-bold hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Triage Band Summary & Filter Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            key: "all" as FilterTab,
            label: "All Waiting",
            count: counts.all,
            dot: "bg-slate-500",
            border: "border-slate-300 dark:border-slate-700",
            textColor: "text-slate-800 dark:text-slate-100",
            desc: "Active in queue",
          },
          {
            key: "red" as FilterTab,
            label: "Immediate (Red)",
            count: counts.red,
            dot: BANDS_CONFIG.red.dot,
            border: "border-red-400 dark:border-red-800",
            textColor: "text-red-600 dark:text-red-400",
            desc: "Urgency 4–5 (Critical)",
          },
          {
            key: "yellow" as FilterTab,
            label: "Urgent (Yellow)",
            count: counts.yellow,
            dot: BANDS_CONFIG.yellow.dot,
            border: "border-amber-400 dark:border-amber-800",
            textColor: "text-amber-600 dark:text-amber-400",
            desc: "Urgency 3 (Moderate)",
          },
          {
            key: "green" as FilterTab,
            label: "Delayed (Green)",
            count: counts.green,
            dot: BANDS_CONFIG.green.dot,
            border: "border-emerald-400 dark:border-emerald-800",
            textColor: "text-emerald-600 dark:text-emerald-400",
            desc: "Urgency 1–2 (Stable)",
          },
          {
            key: "in_treatment" as FilterTab,
            label: "In Treatment",
            count: counts.in_treatment,
            dot: "bg-blue-500",
            border: "border-blue-400 dark:border-blue-800",
            textColor: "text-blue-600 dark:text-blue-400",
            desc: "Under clinical care",
          },
        ].map((tab) => {
          const active = filter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                active
                  ? "bg-white dark:bg-slate-800 shadow-md ring-2 ring-red-500/20 " + tab.border
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${tab.dot}`} />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                  {tab.label}
                </span>
              </div>
              <p className={`font-display text-3xl font-bold ${tab.textColor}`}>
                {tab.count}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                {tab.desc}
              </p>
            </button>
          )
        })}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {Icon.search}
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, ID, village, symptoms…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-start sm:self-center">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredPatients.length}</strong> patient
            {filteredPatients.length !== 1 ? "s" : ""}
          </span>
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="text-red-600 dark:text-red-400 underline ml-1 cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* ── Queue Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Table header (desktop) */}
        <div className="hidden lg:grid grid-cols-[70px_1.5fr_2fr_120px_1.2fr] gap-4 px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          <span>Urgency</span>
          <span>Patient Identity</span>
          <span>Chief Complaint & Vitals</span>
          <span>Waiting Time</span>
          <span className="text-right">Triage Actions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Loading Emergency Triage Queue...
            </p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              {Icon.check}
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Triage queue is clear for this selection
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? `No patients match "${search}". Try adjusting your search query.`
                : "No patients currently waiting under this triage band category."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPatients.map((p, idx) => {
              const bandConfig = BANDS_CONFIG[p.band] || BANDS_CONFIG.green
              const isInTreatment = p.status === "in_treatment"

              return (
                <li
                  key={p.visitId || p.id}
                  className={`relative grid grid-cols-1 lg:grid-cols-[70px_1.5fr_2fr_120px_1.2fr] gap-4 items-center px-5 lg:px-6 py-4 transition-colors ${
                    isInTreatment
                      ? "bg-blue-50/40 dark:bg-blue-950/10"
                      : bandConfig.bg
                  } hover:bg-slate-50/80 dark:hover:bg-slate-800/50`}
                >
                  {/* Left accent strip */}
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isInTreatment ? "bg-blue-500" : bandConfig.edge
                    }`}
                  />

                  {/* Urgency Score indicator */}
                  <div className="flex lg:flex-col items-center gap-2 lg:gap-1">
                    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 40 40" className="w-12 h-12 -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-700"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className={isInTreatment ? "stroke-blue-500" : bandConfig.ring}
                          strokeDasharray={2 * Math.PI * 16}
                          strokeDashoffset={2 * Math.PI * 16 * (1 - p.score / 5)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={`text-xs font-black leading-none ${bandConfig.scoreText}`}>
                          {p.score}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">/5</span>
                      </div>
                    </div>
                    <span className="lg:hidden text-xs font-bold text-slate-600 dark:text-slate-300">
                      Priority #{idx + 1}
                    </span>
                  </div>

                  {/* Patient Identity */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {p.name}
                      </p>
                      {isInTreatment ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex-shrink-0">
                          In Treatment
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${bandConfig.badge}`}
                        >
                          {p.band === "red" && <span className="inline-block mr-0.5">{Icon.bolt}</span>}
                          {p.level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {p.age != null ? `${p.age} yrs` : "Age N/A"} · {p.gender || "Sex N/A"} · ID: {p.id}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {p.village ? `Village: ${p.village}` : "Village unrecorded"} · {p.clinicName}
                    </p>
                  </div>

                  {/* Complaint & Vitals */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                      {p.complaint}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg w-fit">
                      <span className="text-red-500 font-bold">Vitals:</span>
                      <span className="truncate">{p.vitalsSummary || "No vitals registered"}</span>
                    </div>
                  </div>

                  {/* Waiting Time */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">{Icon.clock}</span>
                      <span>{p.wait}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Arrived {new Date(p.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Triage Actions */}
                  <div className="flex items-center justify-start lg:justify-end gap-2 flex-wrap">
                    {p.status === "waiting" ? (
                      <button
                        type="button"
                        onClick={() => updatePatientStatus(p, "in_treatment")}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer ${bandConfig.btn}`}
                      >
                        <span>Start Care</span>
                        {Icon.chevron}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => updatePatientStatus(p, "discharged")}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm cursor-pointer"
                          title="Mark patient treated and discharge from queue"
                        >
                          {Icon.check}
                          <span>Discharge</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePatientStatus(p, "waiting")}
                          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                        >
                          Revert
                        </button>
                      </>
                    )}

                    {onViewPatient && (
                      <button
                        type="button"
                        onClick={() => onViewPatient(p.patientId)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="View Full Patient Record"
                      >
                        {Icon.user}
                      </button>
                    )}

                    {onNewVisit && (
                      <button
                        type="button"
                        onClick={() => onNewVisit(p.patientId)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Record Clinical Visit & Symptoms"
                      >
                        {Icon.notes}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Footer advice */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 px-2 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Urgency scores calculated using authoritative clinical scoring algorithm (1: Low to 5: Critical).
        </span>
        <span>Patients admitted locally persist across reloads.</span>
      </div>
    </div>
  )
}
