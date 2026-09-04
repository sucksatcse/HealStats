import { useState, useMemo, useEffect } from "react"
import PatientFormPage, { type PatientRecord } from "./PatientFormPage"
import { supabase } from "./lib/supabase"
import { useAuth } from "./AuthContext"

// ── Icons ────────────────────────────────────────────────────────────────────────
const Icon = {
  search: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"
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
  chevronLeft: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4l-4 4 4 4" />
    </svg>
  ),
  chevronRight: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  ),
  sort: (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-3 h-3"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4.5L6 2.5l2 2M4 7.5l2 2 2-2"
      />
    </svg>
  ),
  view: (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.5 9s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z"
      />
      <circle cx="9" cy="9" r="2.5" />
    </svg>
  ),
  filter: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5L2 3z"
      />
    </svg>
  ),
}

// ── Data ───────────────────────────────────────────────────────────────────────
type Urgency = "Critical" | "High" | "Moderate" | "Low" | "Stable"

type PatientRow = {
  id: string
  name: string
  age: number
  gender: "F" | "M"
  village: string
  lastVisit: string
  lastVisitSort: number
  urgency: Urgency
  initials: string
  color: string
  rawId: string
}

function getUrgencyFromScore(score?: number): Urgency {
  if (score === undefined || score === null) return "Stable"
  if (score >= 5) return "Critical"
  if (score === 4) return "High"
  if (score === 3) return "Moderate"
  if (score === 2) return "Low"
  return "Stable"
}

const URGENCY_CLS: Record<Urgency, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-sky-50 text-sky-700 border-sky-200",
  Stable: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const URGENCY_DOT: Record<Urgency, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Moderate: "bg-amber-500",
  Low: "bg-sky-500",
  Stable: "bg-emerald-500",
}

const URGENCY_OPTIONS: (Urgency | "All")[] = [
  "All",
  "Critical",
  "High",
  "Moderate",
  "Low",
  "Stable",
]
// Village options are computed dynamically
const PAGE_SIZE = 8

// ── Filter dropdown ──────────────────────────────────────────────────────────────
function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
          value !== "All"
            ? "border-teal-300 bg-teal-50 text-teal-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
        }`}
      >
        <span className="text-slate-400">{Icon.filter}</span>
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
          {label}:
        </span>
        {value}
        <span className="text-slate-400">{Icon.chevronDown}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 w-48 bg-white rounded-xl border border-slate-100 shadow-xl py-1.5 animate-slide-up">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`w-full text-left text-sm px-3.5 py-2 flex items-center justify-between transition-colors ${
                  value === opt
                    ? "text-teal-700 font-semibold bg-teal-50/60"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt}
                {value === opt && (
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
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PatientRecordsPage({
  onNewPatient,
  onViewPatient,
}: {
  onNewPatient?: () => void
  onViewPatient?: (patientId: string) => void
} = {}) {
  const { profile } = useAuth()
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [urgency, setUrgency] = useState("All")
  const [village, setVillage] = useState("All")
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<{ mode: "add" } | {
    mode: "edit"
    patient: PatientRecord
  } | null>(null)
  const [toast, setToast] = useState("")

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2800)
  }

  const openEdit = (r: PatientRow) =>
    setForm({
      mode: "edit",
      patient: {
        id: r.rawId,
        name: r.name,
        age: r.age,
        gender: r.gender === "F" ? "Female" : "Male",
        village: r.village,
        urgency: r.urgency,
      },
    })

  useEffect(() => {
    async function fetchPatients() {
      if (!profile) return
      setIsLoading(true)
      setError(null)
      try {
        let q = supabase
          .from("patients")
          .select(`
            id, name, age, sex, village, created_at,
            visits (
              id, created_at, urgency_score
            )
          `)
          .order("created_at", { foreignTable: "visits", ascending: false })

        if (profile.role === "worker" && profile.clinic_id) {
          q = q.eq("clinic_id", profile.clinic_id)
        }

        const { data, error: fetchError } = await q
        if (fetchError) throw fetchError

        const colors = [
          "bg-rose-100 text-rose-700",
          "bg-violet-100 text-violet-700",
          "bg-pink-100 text-pink-700",
          "bg-sky-100 text-sky-700",
          "bg-amber-100 text-amber-700",
          "bg-teal-100 text-teal-700",
          "bg-indigo-100 text-indigo-700",
          "bg-emerald-100 text-emerald-700",
          "bg-cyan-100 text-cyan-700",
        ]

        const formatted: PatientRow[] = (data || []).map((p: any) => {
          const recentVisit =
            p.visits && p.visits.length > 0 ? p.visits[0] : null
          let lastVisit = "No visits"
          let lastVisitSort = Infinity
          let ptUrgency: Urgency = "Stable"

          if (recentVisit && recentVisit.created_at) {
            const vDate = new Date(recentVisit.created_at)
            const diffDays = Math.floor(
              Math.abs(Date.now() - vDate.getTime()) / 86400000,
            )
            lastVisitSort = diffDays
            if (diffDays === 0) lastVisit = "Today"
            else if (diffDays === 1) lastVisit = "Yesterday"
            else lastVisit = `${diffDays} days ago`
            ptUrgency = getUrgencyFromScore(recentVisit.urgency_score)
          } else {
            const cDate = new Date(p.created_at)
            const diffDays = Math.floor(
              Math.abs(Date.now() - cDate.getTime()) / 86400000,
            )
            lastVisitSort = diffDays
            lastVisit =
              diffDays === 0
                ? "Registered Today"
                : `Registered ${diffDays} days ago`
          }

          const parts = p.name.split(" ")
          const initials =
            parts.length > 1
              ? parts[0][0] + (parts[1] ? parts[1][0] : "")
              : p.name.substring(0, 2)
          const cIndex = p.id ? p.id.charCodeAt(0) % colors.length : 0

          return {
            id: p.id ? p.id.split("-")[0].toUpperCase() : "UNKNOWN",
            name: p.name,
            age: p.age || 0,
            gender: p.sex === "Female" || p.sex === "F" ? "F" : "M",
            village: p.village || "Unknown",
            lastVisit,
            lastVisitSort,
            urgency: ptUrgency,
            initials: initials.toUpperCase(),
            color: colors[cIndex],
            rawId: p.id,
          }
        })

        formatted.sort((a, b) => a.lastVisitSort - b.lastVisitSort)
        setPatients(formatted)
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Failed to fetch patients.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchPatients()
  }, [profile])



  const VILLAGES = Array.from(new Set(patients.map((p) => p.village))).sort()
  const VILLAGE_OPTIONS = ["All", ...VILLAGES]

  const filtered = useMemo(() => {
    const result = patients.filter((r) => {
      const matchesQuery =
        query === "" ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.village.toLowerCase().includes(query.toLowerCase())
      const matchesUrgency = urgency === "All" || r.urgency === urgency
      const matchesVillage = village === "All" || r.village === village
      return matchesQuery && matchesUrgency && matchesVillage
    })
    return result
  }, [patients, query, urgency, village])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  // Reset to page 1 whenever filters change
  const resetPage = () => setPage(1)

  const criticalCount = patients.filter((r) => r.urgency === "Critical").length
  const activeFilters =
    (urgency !== "All" ? 1 : 0) + (village !== "All" ? 1 : 0)

  if (form) {
    return (
      <PatientFormPage
        patient={form.mode === "edit" ? form.patient : null}
        onCancel={() => setForm(null)}
        onSave={(rec) => {
          setForm(null)
          flash(
            `${rec.name || "Record"} ${
              form.mode === "edit" ? "updated" : "created"
            }`,
          )
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">
          Loading patient records...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center py-20">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-12 h-12 mb-4 text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01"
          />
        </svg>
        <p className="font-semibold text-lg">Failed to load patients</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          {Icon.search}
        </div>
        <h2 className="text-lg font-semibold text-slate-700">
          No patients found
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          It looks like there are no patient records for your clinic yet.
        </p>
        <button
          onClick={() => onNewPatient ? onNewPatient() : setForm({ mode: "add" })}
          className="mt-6 flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 3v10M3 8h10"
            />
          </svg>
          Add First Patient
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
            Patients
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {patients.length} records across {VILLAGES.length} villages ·{" "}
            {criticalCount} flagged critical
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700 bg-white px-4 py-2.5 rounded-xl transition-all">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => onNewPatient ? onNewPatient() : setForm({ mode: "add" })}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
            </svg>
            New Patient
          </button>
        </div>
      </div>

      {/* Toolbar: search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {Icon.search}
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetPage()
            }}
            placeholder="Search by name, patient ID, or village…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
        <Dropdown
          label="Urgency"
          value={urgency}
          options={URGENCY_OPTIONS}
          onChange={(v) => {
            setUrgency(v)
            resetPage()
          }}
        />
        <Dropdown
          label="Village"
          value={village}
          options={VILLAGE_OPTIONS}
          onChange={(v) => {
            setVillage(v)
            resetPage()
          }}
        />
        {activeFilters > 0 && (
          <button
            onClick={() => {
              setUrgency("All")
              setVillage("All")
              resetPage()
            }}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-2.5 transition-colors"
          >
            Clear filters ({activeFilters})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {[
                  "Patient ID",
                  "Name",
                  "Age",
                  "Village",
                  "Last Visit",
                  "Urgency Level",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                      {col}
                      <span className="text-slate-300">{Icon.sort}</span>
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((r) => (
                <tr
                  key={r.id}
                  className="group hover:bg-teal-50/40 transition-colors"
                >
                  {/* ID */}
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {r.id}
                    </span>
                  </td>
                  {/* Name */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onViewPatient?.(r.rawId)}
                      disabled={!onViewPatient}
                      className="flex items-center gap-3 text-left rounded-lg disabled:cursor-default enabled:hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      title={onViewPatient ? "Open patient record" : undefined}
                    >
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
                          {r.gender === "F" ? "Female" : "Male"}
                        </p>
                      </div>
                    </button>
                  </td>
                  {/* Age */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">{r.age} yrs</span>
                  </td>
                  {/* Village */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">{r.village}</span>
                  </td>
                  {/* Last Visit */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-500">
                      {r.lastVisit}
                    </span>
                  </td>
                  {/* Urgency */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${URGENCY_CLS[r.urgency]}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[r.urgency]}`}
                      />
                      {r.urgency}
                    </span>
                  </td>
                  {/* View */}
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit record"
                      >
                        {Icon.view}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              {Icon.search}
            </div>
            <p className="text-sm font-medium text-slate-500">
              No records match your search
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try a different name, ID, or clear your filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex-wrap gap-3">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {(safePage - 1) * PAGE_SIZE + 1}
              </span>
              –
              <span className="font-semibold text-slate-600">
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length}
              </span>{" "}
              records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                {Icon.chevronLeft}
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`text-xs font-semibold w-7 h-7 rounded-lg transition-colors ${
                    p === safePage
                      ? "bg-teal-600 text-white"
                      : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                Next
                {Icon.chevronRight}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-teal-950 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
