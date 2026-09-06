import { useState, useMemo, useEffect } from "react"
import {
  fetchHighRiskPatients,
  fetchStaff,
  fetchClinicsList,
  type StaffWithClinic,
} from "./lib/adminService"
import { urgencyFromScore, type ClinicRow } from "./lib/types"
import { useAuth } from "./AuthContext"

// ── Icons ────────────────────────────────────────────────────────────────────────
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
  search: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"
      />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
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
  eye: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 10C3.732 5.943 6.523 3 10 3s6.268 2.943 7.542 7c-1.274 4.057-5.065 7-7.542 7s-6.268-2.943-7.542-7z"
      />
    </svg>
  ),
  download: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h9.5A2.25 2.25 0 0017 18.75V16.5M7.5 12L10 14.5m0 0l2.5-2.5M10 14.5V3"
      />
    </svg>
  ),
  userRemove: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" d="M4 4l8 8m0-8l-8 8" />
    </svg>
  ),
}

// ── Types ───────────────────────────────────────────────────────────────────────
type Level = "Critical" | "High" | "Moderate"

type FlaggedPatient = {
  id: string          // Short ID (8 hex)
  rawId: string       // Full UUID
  name: string
  age: number
  gender: "F" | "M"
  village: string
  clinicName: string
  clinicZone: string
  clinicId: string
  recordedBy: string
  score: number       // 1–5 scale
  level: Level
  symptoms: string
  symptomCategory: string
  diagnosis: string
  vitals: string
  flaggedAt: string
  flaggedTimestamp: number
  initials: string
  color: string
}

const AVATAR_COLORS = [
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
]

function toFlaggedPatient(
  p: import("./lib/types").PatientWithLatestVisit,
  colorIndex: number
): FlaggedPatient | null {
  const visit = p.latest_visit
  const level = urgencyFromScore(visit?.urgency_score)
  // Only show Moderate, High, Critical (score >= 3)
  if (level === "Stable" || level === "Low") return null

  const parts = p.name.trim().split(/\s+/)
  const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : p.name.slice(0, 2)).toUpperCase()

  // Format relative time from created_at
  let flaggedAt = "Unknown"
  let flaggedTimestamp = 0
  if (visit?.created_at) {
    flaggedTimestamp = new Date(visit.created_at).getTime()
    const diff = Date.now() - flaggedTimestamp
    const mins = Math.floor(diff / 60000)
    if (mins < 60) flaggedAt = `${Math.max(1, mins)}m ago`
    else if (mins < 1440) flaggedAt = `${Math.floor(mins / 60)}h ago`
    else flaggedAt = `${Math.floor(mins / 1440)}d ago`
  }

  // Format vitals summary from JSONB
  const vitalsStr = visit?.vitals
    ? Object.entries(visit.vitals as Record<string, unknown>)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
    : ""

  return {
    id: p.id.slice(0, 8).toUpperCase(),
    rawId: p.id,
    name: p.name,
    age: p.age ?? 0,
    gender: p.sex === "F" || p.sex === "Female" ? "F" : "M",
    village: p.village ?? "—",
    clinicName: p.clinics?.name ?? "General Clinic",
    clinicZone: p.clinics?.zone ?? "",
    clinicId: p.clinic_id ?? "",
    recordedBy: p.staff?.name ?? "Field Staff",
    score: visit?.urgency_score ?? 3,
    level: level as Level,
    symptoms: visit?.symptoms ?? "No symptom description recorded.",
    symptomCategory: visit?.symptom_category ?? "",
    diagnosis: visit?.diagnosis ?? "",
    vitals: vitalsStr,
    flaggedAt,
    flaggedTimestamp,
    initials,
    color: AVATAR_COLORS[colorIndex % AVATAR_COLORS.length],
  }
}

const LEVEL_META: Record<
  Level,
  {
    chip: string
    bar: string
    ring: string
    scoreText: string
  }
> = {
  Critical: {
    chip: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
    bar: "bg-red-500",
    ring: "border-l-red-500",
    scoreText: "text-red-600 dark:text-red-400",
  },
  High: {
    chip: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50",
    bar: "bg-orange-500",
    ring: "border-l-orange-500",
    scoreText: "text-orange-600 dark:text-orange-400",
  },
  Moderate: {
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    bar: "bg-amber-500",
    ring: "border-l-amber-500",
    scoreText: "text-amber-600 dark:text-amber-400",
  },
}

// ── Assign Doctor Dropdown ───────────────────────────────────────────────────────
function AssignMenu({
  assigned,
  staffList,
  onAssign,
  onUnassign,
}: {
  assigned: string | null
  staffList: StaffWithClinic[]
  onAssign: (doctor: string) => void
  onUnassign: () => void
}) {
  const [open, setOpen] = useState(false)

  if (assigned) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-2.5 py-1.5">
        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-[10px]">
          {Icon.check}
        </span>
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 max-w-[120px] truncate">
          {assigned}
        </span>
        <button
          type="button"
          onClick={onUnassign}
          title="Unassign coordinator"
          className="ml-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-0.5 cursor-pointer"
        >
          {Icon.userRemove}
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-xl shadow-sm transition-colors whitespace-nowrap cursor-pointer"
      >
        {Icon.doctor}
        Assign Doctor
        {Icon.chevronDown}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-60 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl py-1.5 animate-slide-up">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3.5 py-1.5">
              Available Staff & Doctors
            </p>
            {staffList.length === 0 ? (
              <p className="text-xs text-slate-400 px-3.5 py-2 italic">
                No active staff found
              </p>
            ) : (
              staffList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onAssign(s.name)
                    setOpen(false)
                  }}
                  className="w-full text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300 px-3.5 py-2 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="truncate">
                    <p className="font-semibold truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize truncate">
                      {s.role} {s.clinics?.name ? `· ${s.clinics.name}` : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Dropdown Helper ────────────────────────────────────────────────────────────
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (val: string) => void
}) {
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label ?? value

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
          value !== "all"
            ? "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide">
          {label}:
        </span>
        <span>{currentLabel}</span>
        <span className="text-slate-400">{Icon.chevronDown}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 w-52 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl py-1.5 animate-slide-up">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full text-left text-xs px-3.5 py-2 flex items-center justify-between transition-colors ${
                  value === opt.value
                    ? "text-teal-700 dark:text-teal-300 font-semibold bg-teal-50/60 dark:bg-teal-950/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && (
                  <span className="text-teal-600 dark:text-teal-400 font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function FlaggedPatientsPage({
  onViewPatient,
}: {
  onViewPatient?: (patientId: string) => void
} = {}) {
  const { profile } = useAuth()
  const [patients, setPatients] = useState<FlaggedPatient[]>([])
  const [staffList, setStaffList] = useState<StaffWithClinic[]>([])
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Filters
  const [query, setQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState<Level | "All">("All")
  const [clinicFilter, setClinicFilter] = useState<string>("all")
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all")

  // Doctor Assignments (stored in localStorage for persistent coordination)
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("healstats_flagged_assignments")
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [toast, setToast] = useState("")

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2800)
  }

  const loadData = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const [highRiskRes, staffRes, clinicsRes] = await Promise.all([
        fetchHighRiskPatients(profile?.clinic_id ?? null),
        fetchStaff(profile?.clinic_id ?? null),
        fetchClinicsList(),
      ])

      if (highRiskRes.error) {
        setFetchError(highRiskRes.error)
      } else {
        const mapped: FlaggedPatient[] = []
        highRiskRes.data.forEach((p, i) => {
          const f = toFlaggedPatient(p, i)
          if (f) mapped.push(f)
        })
        setPatients(mapped)
      }

      if (staffRes.data) {
        setStaffList(staffRes.data.filter((s) => s.is_active ?? true))
      }

      if (clinicsRes.data) {
        setClinics(clinicsRes.data)
      }
    } catch (err) {
      console.error("[FlaggedPatientsPage] loadData error:", err)
      setFetchError("Failed to connect to triage database.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile?.clinic_id])

  // Doctor Assignment
  const handleAssign = (patientId: string, patientName: string, doctorName: string) => {
    const updated = { ...assignments, [patientId]: doctorName }
    setAssignments(updated)
    try {
      localStorage.setItem("healstats_flagged_assignments", JSON.stringify(updated))
    } catch (err) {
      console.error("Storage error:", err)
    }
    flash(`${patientName} assigned to ${doctorName}`)
  }

  const handleUnassign = (patientId: string, patientName: string) => {
    const updated = { ...assignments }
    delete updated[patientId]
    setAssignments(updated)
    try {
      localStorage.setItem("healstats_flagged_assignments", JSON.stringify(updated))
    } catch (err) {
      console.error("Storage error:", err)
    }
    flash(`Unassigned ${patientName}`)
  }

  // Filter & Search
  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase()
    return patients.filter((r) => {
      // Search
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.rawId.toLowerCase().includes(q) ||
        r.village.toLowerCase().includes(q) ||
        r.symptoms.toLowerCase().includes(q) ||
        r.diagnosis.toLowerCase().includes(q) ||
        (assignments[r.rawId] ?? "").toLowerCase().includes(q)

      // Level
      const matchesLevel = levelFilter === "All" || r.level === levelFilter

      // Clinic
      const matchesClinic = clinicFilter === "all" || r.clinicId === clinicFilter

      // Assignment
      const isAssigned = Boolean(assignments[r.rawId])
      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" ? isAssigned : !isAssigned)

      return matchesQuery && matchesLevel && matchesClinic && matchesAssignment
    })
  }, [patients, query, levelFilter, clinicFilter, assignmentFilter, assignments])

  // Count Statistics
  const criticalCount = patients.filter((r) => r.level === "Critical").length
  const highCount = patients.filter((r) => r.level === "High").length
  const moderateCount = patients.filter((r) => r.level === "Moderate").length
  const unassignedTotal = patients.filter((r) => !assignments[r.rawId]).length

  const clearAllFilters = () => {
    setQuery("")
    setLevelFilter("All")
    setClinicFilter("all")
    setAssignmentFilter("all")
  }

  const hasActiveFilters =
    query.trim() !== "" ||
    levelFilter !== "All" ||
    clinicFilter !== "all" ||
    assignmentFilter !== "all"

  // Export CSV
  const exportCSV = () => {
    if (filteredPatients.length === 0) return
    const headers = [
      "Patient ID",
      "Full Name",
      "Age",
      "Gender",
      "Village",
      "Clinic",
      "Urgency Level",
      "Urgency Score",
      "Symptoms",
      "Diagnosis",
      "Assigned Coordinator",
    ]
    const rowsData = filteredPatients.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.age,
      p.gender,
      `"${p.village.replace(/"/g, '""')}"`,
      `"${p.clinicName.replace(/"/g, '""')}"`,
      p.level,
      p.score,
      `"${p.symptoms.replace(/"/g, '""')}"`,
      `"${p.diagnosis.replace(/"/g, '""')}"`,
      `"${assignments[p.rawId] || "Unassigned"}"`,
    ])

    const csvContent = [headers.join(","), ...rowsData.map((e) => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `healstats_flagged_patients_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    flash("High-risk patients exported to CSV")
  }

  return (
    <div className="space-y-6">
      {/* Alert Header Banner */}
      <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 dark:from-red-950/40 dark:via-orange-950/30 dark:to-amber-950/20 px-5 py-4.5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            {Icon.alert}
          </div>
          <div>
            <h1 className="font-display text-2xl text-red-950 dark:text-red-100 leading-tight">
              High-Risk & Flagged Patients
            </h1>
            {isLoading ? (
              <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-0.5">
                Querying clinical triage feed…
              </p>
            ) : fetchError ? (
              <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                {fetchError}
              </p>
            ) : (
              <p className="text-sm text-red-700/90 dark:text-red-300 mt-0.5">
                <span className="font-bold">{patients.length} total flagged</span> ·{" "}
                <span className="font-semibold text-red-700 dark:text-red-300">{criticalCount} critical</span> ·{" "}
                <span className="font-semibold text-orange-700 dark:text-orange-300">{highCount} high</span> ·{" "}
                <span className="font-semibold text-amber-700 dark:text-amber-300">{moderateCount} moderate</span> ·{" "}
                <span className="font-semibold">{unassignedTotal} awaiting assignment</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCSV}
            disabled={filteredPatients.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800/80 bg-white dark:bg-slate-900 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {Icon.download}
            Export CSV
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-700 dark:text-red-300 bg-white/80 dark:bg-slate-900/80 border border-red-200 dark:border-red-900/50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Priority Stream
          </span>
        </div>
      </div>

      {/* Toolbar: Search, Urgency Filters, Clinic Filter, Assignment Filter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search bar */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {Icon.search}
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, ID, village, symptoms…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Urgency Level filter buttons with counts */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setLevelFilter("All")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                levelFilter === "All"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              All ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("Critical")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                levelFilter === "Critical"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-red-600"
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("High")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                levelFilter === "High"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-orange-600"
              }`}
            >
              High ({highCount})
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("Moderate")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                levelFilter === "Moderate"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-amber-600"
              }`}
            >
              Moderate ({moderateCount})
            </button>
          </div>

          {/* Clinic filter dropdown */}
          {clinics.length > 0 && (
            <FilterDropdown
              label="Clinic"
              value={clinicFilter}
              options={[
                { label: "All Clinics", value: "all" },
                ...clinics.map((c) => ({
                  label: `${c.name} ${c.zone ? `(${c.zone})` : ""}`,
                  value: c.id,
                })),
              ]}
              onChange={setClinicFilter}
            />
          )}

          {/* Assignment filter dropdown */}
          <FilterDropdown
            label="Assignment"
            value={assignmentFilter}
            options={[
              { label: "All Cases", value: "all" },
              { label: "Unassigned", value: "unassigned" },
              { label: "Assigned", value: "assigned" },
            ]}
            onChange={(v) => setAssignmentFilter(v as "all" | "assigned" | "unassigned")}
          />

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 px-2 py-1 transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {filteredPatients.length}
          </span>{" "}
          priority patient{filteredPatients.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-28" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-xl w-28" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-5 py-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Error querying high-risk patients
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">{fetchError}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* High-Risk Patients Table */}
      {!isLoading && !fetchError && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Empty State Case 1: Database has zero high-risk patients */}
          {patients.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                {Icon.check}
              </div>
              <h3 className="font-display text-lg text-teal-950 dark:text-white">
                No High-Risk Patients Flagged
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                All patient visits currently in the database are within stable or low urgency thresholds (scores 1–2).
              </p>
            </div>
          )}

          {/* Empty State Case 2: Filters match zero patients */}
          {patients.length > 0 && filteredPatients.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                {Icon.search}
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No flagged patients match your filters
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Try searching a different keyword or resetting your urgency and clinic filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Table Body */}
          {filteredPatients.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Patient & Clinic
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Urgency Score
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Symptoms & Diagnosis
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Flagged Time
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                      Assignment & Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPatients.map((r) => {
                    const meta = LEVEL_META[r.level]
                    const assignedDoctor = assignments[r.rawId]

                    return (
                      <tr
                        key={r.rawId}
                        className={`group hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors border-l-4 ${
                          assignedDoctor
                            ? "border-l-emerald-500 opacity-90"
                            : meta.ring
                        }`}
                      >
                        {/* Patient Name, Demographics, Clinic */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onViewPatient?.(r.rawId)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-teal-400 transition-all ${r.color}`}
                              title="View Patient Details"
                            >
                              {r.initials}
                            </button>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => onViewPatient?.(r.rawId)}
                                className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left cursor-pointer"
                              >
                                {r.name}
                              </button>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                {r.age}y · {r.gender} · {r.village} · ID: {r.id}
                              </p>
                              <p className="text-[11px] font-medium text-teal-700 dark:text-teal-400 truncate mt-0.5">
                                {r.clinicName} {r.clinicZone ? `(${r.clinicZone})` : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Urgency Score on 1–5 Scale */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 w-40">
                            <div className="flex items-baseline gap-0.5 w-10 flex-shrink-0">
                              <span
                                className={`font-display text-2xl leading-none font-bold ${meta.scoreText}`}
                              >
                                {r.score}
                              </span>
                              <span className="text-xs text-slate-400">/5</span>
                            </div>
                            <div className="flex-1">
                              <span
                                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 ${meta.chip}`}
                              >
                                {r.level}
                              </span>
                              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${meta.bar}`}
                                  style={{ width: `${(r.score / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Symptoms Summary & Vitals */}
                        <td className="px-5 py-4 max-w-sm">
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
                            {r.symptoms}
                          </p>
                          {r.diagnosis && (
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1">
                              Dx: {r.diagnosis}
                            </p>
                          )}
                          {r.vitals && (
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                              <span className={meta.scoreText}>{Icon.spark}</span>
                              {r.vitals}
                            </p>
                          )}
                        </td>

                        {/* Flagged Time & Staff Intake */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                              {Icon.clock}
                              {r.flaggedAt}
                            </span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              Intake: {r.recordedBy}
                            </p>
                          </div>
                        </td>

                        {/* Actions: Assign Doctor & View Details */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <AssignMenu
                              assigned={assignedDoctor || null}
                              staffList={staffList}
                              onAssign={(doc) => handleAssign(r.rawId, r.name, doc)}
                              onUnassign={() => handleUnassign(r.rawId, r.name)}
                            />
                            {onViewPatient && (
                              <button
                                type="button"
                                onClick={() => onViewPatient(r.rawId)}
                                className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="View Patient Details"
                              >
                                {Icon.eye}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            {Icon.check}
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
