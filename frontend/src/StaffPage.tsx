import { useState, useMemo, useEffect } from "react"
import {
  fetchStaff,
  createStaffRecord,
  updateStaffRecord,
  setStaffActive,
  fetchClinicsList,
  type StaffWithClinic,
} from "./lib/adminService"
import type { ClinicRow, StaffRole } from "./lib/types"
import { useAuth } from "./AuthContext"

// ── Icons ────────────────────────────────────────────────────────────────────────
const Icon = {
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
  plus: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
    </svg>
  ),
  edit: (
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
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      />
    </svg>
  ),
  deactivate: (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4 h-4"
    >
      <circle cx="9" cy="9" r="6.5" />
      <path strokeLinecap="round" d="M4.5 4.5l9 9" />
    </svg>
  ),
  reactivate: (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a6 6 0 016-6c2.5 0 4.6 1.5 5.5 3.7M15 3v3h-3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 9a6 6 0 01-6 6c-2.5 0-4.6-1.5-5.5-3.7M3 15v-3h3"
      />
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
  close: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
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
  info: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4 h-4"
    >
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M10 9v4m0-6h.01" />
    </svg>
  ),
}

// ── Visual Helpers ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
]

function roleLabel(role: string): string {
  return role === "admin" ? "Administrator" : "Health Worker"
}

function roleBadgeCls(role: string): string {
  return role === "admin"
    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50"
    : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50"
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

const PAGE_SIZE = 8

type SortField = "name" | "role" | "clinic" | "status"
type SortOrder = "asc" | "desc"

// ── Add Staff Modal ────────────────────────────────────────────────────────────
function AddStaffModal({
  clinics,
  defaultClinicId,
  onClose,
  onAdded,
}: {
  clinics: ClinicRow[]
  defaultClinicId: string | null
  onClose: () => void
  onAdded: (s: StaffWithClinic) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<StaffRole>("worker")
  const [clinicId, setClinicId] = useState<string>(defaultClinicId ?? (clinics[0]?.id ?? ""))
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Staff member name is required.")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      setError("A valid work email is required.")
      return
    }

    setSaving(true)
    setError("")
    const { data, error: apiError } = await createStaffRecord({
      name: name.trim(),
      email: email.trim(),
      role,
      clinic_id: clinicId || null,
    })
    setSaving(false)

    if (apiError || !data) {
      setError(apiError ?? "Failed to create staff record.")
      return
    }
    onAdded(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-display text-xl text-teal-950 dark:text-white">
              Add New Staff
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Register a health worker or administrator
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            {Icon.close}
          </button>
        </div>

        <form onSubmit={submit} noValidate className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          {/* Notice on Supabase Auth */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 text-xs text-sky-800 dark:text-sky-300">
            <span className="flex-shrink-0 mt-0.5 text-sky-600 dark:text-sky-400">
              {Icon.info}
            </span>
            <p>
              This creates the staff record in the database. To enable login, ensure an account with this email exists in Supabase Auth.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Full Name *
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="e.g. Dr. Ayesha Rahman"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Work Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              placeholder="staff@healstats.org"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Role *
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                >
                  <option value="worker">Health Worker</option>
                  <option value="admin">Administrator</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {Icon.chevronDown}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Assigned Clinic
              </label>
              <div className="relative">
                <select
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                >
                  <option value="">No Clinic (General)</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.zone ? `(${c.zone})` : ""}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {Icon.chevronDown}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Staff Modal ───────────────────────────────────────────────────────────
function EditStaffModal({
  staff,
  clinics,
  onClose,
  onSaved,
}: {
  staff: StaffWithClinic
  clinics: ClinicRow[]
  onClose: () => void
  onSaved: (s: StaffWithClinic) => void
}) {
  const [name, setName] = useState(staff.name)
  const [email, setEmail] = useState(staff.email ?? "")
  const [role, setRole] = useState<StaffRole>(staff.role)
  const [clinicId, setClinicId] = useState<string>(staff.clinic_id ?? "")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Staff name is required.")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      setError("A valid work email is required.")
      return
    }

    setSaving(true)
    setError("")
    const { data, error: apiError } = await updateStaffRecord(staff.id, {
      name: name.trim(),
      email: email.trim(),
      role,
      clinic_id: clinicId || null,
    })
    setSaving(false)

    if (apiError || !data) {
      setError(apiError ?? "Failed to update staff record.")
      return
    }
    onSaved(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-display text-xl text-teal-950 dark:text-white">
              Edit Staff Profile
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update details for {staff.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            {Icon.close}
          </button>
        </div>

        <form onSubmit={submit} noValidate className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Full Name *
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Work Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Role *
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                >
                  <option value="worker">Health Worker</option>
                  <option value="admin">Administrator</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {Icon.chevronDown}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Assigned Clinic
              </label>
              <div className="relative">
                <select
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                >
                  <option value="">No Clinic (General)</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.zone ? `(${c.zone})` : ""}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {Icon.chevronDown}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
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

// ── Main StaffPage ─────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { profile } = useAuth()
  const [staff, setStaff] = useState<StaffWithClinic[]>([])
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Filters
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "worker" | "admin">("all")
  const [clinicFilter, setClinicFilter] = useState<string>("all")

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [page, setPage] = useState(1)

  // Modals & Notifications
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffWithClinic | null>(null)
  const [toast, setToast] = useState("")

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2800)
  }

  const loadData = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const [staffRes, clinicsRes] = await Promise.all([
        fetchStaff(profile?.clinic_id ?? null),
        fetchClinicsList(),
      ])

      if (staffRes.error) {
        setFetchError(staffRes.error)
      } else {
        setStaff(staffRes.data ?? [])
      }

      if (clinicsRes.data) {
        setClinics(clinicsRes.data)
      }
    } catch (err) {
      console.error("[StaffPage] loadData error:", err)
      setFetchError("Failed to connect to staff database.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile?.clinic_id])

  // Soft Deactivate / Reactivate
  const toggleActive = async (s: StaffWithClinic) => {
    const currentActive = s.is_active ?? true
    const newActive = !currentActive

    // Optimistic UI update
    setStaff((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, is_active: newActive } : item))
    )

    const { error } = await setStaffActive(s.id, newActive)
    if (error) {
      // Rollback
      setStaff((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, is_active: currentActive } : item))
      )
      flash(`Error: ${error}`)
    } else {
      flash(newActive ? `${s.name} reactivated` : `${s.name} deactivated`)
    }
  }

  const handleAdded = (newStaff: StaffWithClinic) => {
    setStaff((prev) => [newStaff, ...prev])
    setShowAddModal(false)
    flash(`${newStaff.name} added successfully`)
  }

  const handleSaved = (updatedStaff: StaffWithClinic) => {
    setStaff((prev) =>
      prev.map((item) => (item.id === updatedStaff.id ? updatedStaff : item))
    )
    setEditingStaff(null)
    flash(`${updatedStaff.name} updated successfully`)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setPage(1)
  }

  // Filter and sort staff
  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = staff.filter((s) => {
      // Search
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.clinics?.name ?? "").toLowerCase().includes(q) ||
        (s.clinics?.zone ?? "").toLowerCase().includes(q)

      // Status
      const isActive = s.is_active ?? true
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? isActive : !isActive)

      // Role
      const matchesRole = roleFilter === "all" || s.role === roleFilter

      // Clinic
      const matchesClinic =
        clinicFilter === "all" || s.clinic_id === clinicFilter

      return matchesQuery && matchesStatus && matchesRole && matchesClinic
    })

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name)
      } else if (sortField === "role") {
        cmp = a.role.localeCompare(b.role)
      } else if (sortField === "clinic") {
        const cA = a.clinics?.name ?? ""
        const cB = b.clinics?.name ?? ""
        cmp = cA.localeCompare(cB)
      } else if (sortField === "status") {
        const sA = (a.is_active ?? true) ? 1 : 0
        const sB = (b.is_active ?? true) ? 1 : 0
        cmp = sA - sB
      }
      return sortOrder === "asc" ? cmp : -cmp
    })

    return result
  }, [staff, query, statusFilter, roleFilter, clinicFilter, sortField, sortOrder])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedStaff = filteredStaff.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  const activeCount = staff.filter((s) => s.is_active ?? true).length
  const inactiveCount = staff.length - activeCount

  const clearAllFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setRoleFilter("all")
    setClinicFilter("all")
    setPage(1)
  }

  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    roleFilter !== "all" ||
    clinicFilter !== "all"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950 dark:text-white">
            Staff Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isLoading
              ? "Loading staff directory…"
              : `${staff.length} total staff members · ${activeCount} active · ${inactiveCount} inactive`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          {Icon.plus}
          Add New Staff
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {Icon.search}
            </span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name, role, email, clinic…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setStatusFilter(f)
                  setPage(1)
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  statusFilter === f
                    ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Role filter dropdown */}
          <FilterDropdown
            label="Role"
            value={roleFilter}
            options={[
              { label: "All Roles", value: "all" },
              { label: "Health Worker", value: "worker" },
              { label: "Administrator", value: "admin" },
            ]}
            onChange={(val) => {
              setRoleFilter(val as "all" | "worker" | "admin")
              setPage(1)
            }}
          />

          {/* Clinic filter dropdown (shown for admins overseeing multiple clinics) */}
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
              onChange={(val) => {
                setClinicFilter(val)
                setPage(1)
              }}
            />
          )}

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
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-24" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error banner */}
      {!isLoading && fetchError && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-5 py-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Error loading staff records
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

      {/* Table & Empty States */}
      {!isLoading && !fetchError && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Empty State Case 1: Database has no staff records */}
          {staff.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                {Icon.search}
              </div>
              <h3 className="font-display text-lg text-teal-950 dark:text-white">
                No staff members registered
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No healthcare workers or administrators have been registered in the database yet.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-5 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {Icon.plus}
                Add First Staff Member
              </button>
            </div>
          )}

          {/* Empty State Case 2: Filter/search returns 0 results */}
          {staff.length > 0 && filteredStaff.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                {Icon.search}
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No staff members match your criteria
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Try searching a different name, role, email, or reset your active filters.
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

          {/* Table */}
          {paginatedStaff.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleSort("name")}
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        Staff Member
                        <span className={sortField === "name" ? "text-teal-600 dark:text-teal-400" : "text-slate-300 dark:text-slate-600"}>
                          {Icon.sort}
                        </span>
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleSort("role")}
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        Role
                        <span className={sortField === "role" ? "text-teal-600 dark:text-teal-400" : "text-slate-300 dark:text-slate-600"}>
                          {Icon.sort}
                        </span>
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleSort("clinic")}
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        Assigned Clinic
                        <span className={sortField === "clinic" ? "text-teal-600 dark:text-teal-400" : "text-slate-300 dark:text-slate-600"}>
                          {Icon.sort}
                        </span>
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleSort("status")}
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        Status
                        <span className={sortField === "status" ? "text-teal-600 dark:text-teal-400" : "text-slate-300 dark:text-slate-600"}>
                          {Icon.sort}
                        </span>
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStaff.map((s) => {
                    const isActive = s.is_active ?? true
                    const avatarColor = AVATAR_COLORS[s.id.charCodeAt(0) % AVATAR_COLORS.length]

                    return (
                      <tr
                        key={s.id}
                        className={`group hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors ${
                          !isActive ? "opacity-60" : ""
                        }`}
                      >
                        {/* Name + Email + ID */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor}`}
                            >
                              {getInitials(s.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {s.name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                {s.email ?? "No email"} · {s.id.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border ${roleBadgeCls(
                              s.role
                            )}`}
                          >
                            {roleLabel(s.role)}
                          </span>
                        </td>

                        {/* Clinic / Zone */}
                        <td className="px-5 py-4">
                          <div className="text-sm text-slate-700 dark:text-slate-300">
                            {s.clinics?.name ? (
                              <div className="flex items-center gap-1.5">
                                <span>{s.clinics.name}</span>
                                {s.clinics.zone && (
                                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                    {s.clinics.zone}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions: Edit & Soft Deactivate */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingStaff(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit staff profile"
                            >
                              {Icon.edit}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(s)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isActive
                                  ? "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              }`}
                              title={isActive ? "Deactivate staff" : "Reactivate staff"}
                            >
                              {isActive ? Icon.deactivate : Icon.reactivate}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredStaff.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex-wrap gap-3">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {(safePage - 1) * PAGE_SIZE + 1}
                </span>
                –
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {Math.min(safePage * PAGE_SIZE, filteredStaff.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {filteredStaff.length}
                </span>{" "}
                staff members
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  {Icon.chevronLeft}
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`text-xs font-semibold w-7 h-7 rounded-lg transition-colors cursor-pointer ${
                      p === safePage
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  Next
                  {Icon.chevronRight}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            {Icon.check}
          </span>
          {toast}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          clinics={clinics}
          defaultClinicId={profile?.clinic_id ?? null}
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          clinics={clinics}
          onClose={() => setEditingStaff(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
