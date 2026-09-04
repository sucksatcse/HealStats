import { useState, useMemo, useEffect } from "react"
import { fetchStaff, createStaffRecord, setStaffActive, type StaffWithClinic } from "./lib/adminService"
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
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.5 3.5l3 3M2.5 15.5l1-3.5 8-8 3 3-8 8-4 .5z"
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
}

// ── Data helpers ───────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700",
]

function roleLabel(role: string): string {
  if (role === "admin") return "Administrator"
  return "Health Worker"
}

function roleCls(role: string): string {
  return role === "admin"
    ? "bg-violet-50 text-violet-700 border-violet-200"
    : "bg-teal-50 text-teal-700 border-teal-200"
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}




// ── Add Staff modal ──────────────────────────────────────────────────────────────────────
function AddStaffModal({
  clinicId,
  onClose,
  onAdded,
}: {
  clinicId: string | null
  onClose: () => void
  onAdded: (s: StaffWithClinic) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"worker" | "admin">("worker")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)


  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.")
      return
    }
    setSaving(true)
    setError("")
    const { data, error: apiError } = await createStaffRecord({
      name: name.trim(),
      email: email.trim(),
      role,
      clinic_id: clinicId,
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
        className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-display text-xl text-teal-950">
              Add New Staff
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a healthcare worker account
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            {Icon.close}
          </button>
        </div>

        <form onSubmit={submit} noValidate className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="e.g. Amara Diallo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              placeholder="name@clinic.org"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "worker" | "admin")}
                className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="worker">Health Worker</option>
                <option value="admin">Administrator</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                {Icon.chevronDown}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Adding…" : "Add Staff Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { profile } = useAuth()
  const [staff, setStaff] = useState<StaffWithClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all")
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    setIsLoading(true)
    fetchStaff(profile?.clinic_id ?? null)
      .then(({ data, error }) => {
        if (error) setFetchError(error)
        else setStaff(data ?? [])
      })
      .finally(() => setIsLoading(false))
  }, [profile?.clinic_id])

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2600)
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    const s = staff.find((x) => x.id === id)
    if (!s) return
    const { error } = await setStaffActive(id, !currentActive)
    if (error) {
      flash(`Error: ${error}`)
    } else {
      setStaff((prev) => prev.map((x) => x.id === id ? { ...x, is_active: !currentActive } : x))
      flash(currentActive ? `${s.name} deactivated` : `${s.name} reactivated`)
    }
  }

  const handleAdded = (s: StaffWithClinic) => {
    setStaff((prev) => [s, ...prev])
    setShowModal(false)
    flash(`${s.name} added successfully`)
  }

  const filtered = useMemo(
    () =>
      staff.filter((s) => {
        const matchesQuery =
          query === "" ||
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.role.toLowerCase().includes(query.toLowerCase()) ||
          (s.email ?? "").toLowerCase().includes(query.toLowerCase())
        const active = s.is_active ?? true
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" ? active : !active)
        return matchesQuery && matchesStatus
      }),
    [staff, query, statusFilter],
  )

  const activeCount = staff.filter((s) => s.is_active ?? true).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
            Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? "Loading…" : `${staff.length} staff members · ${activeCount} active`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5"
        >
          {Icon.plus}
          Add New Staff
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {Icon.search}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === f
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / error */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading staff…</p>
        </div>
      )}
      {!isLoading && fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <strong>Error loading staff:</strong> {fetchError}
        </div>
      )}

      {/* Table */}
      {!isLoading && !fetchError && (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {[
                  { label: "Name", w: "" },
                  { label: "Role", w: "" },
                  { label: "Assigned Clinic", w: "" },
                  { label: "Status", w: "" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                      {col.label}
                      <span className="text-slate-300">{Icon.sort}</span>
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className={`group hover:bg-teal-50/40 transition-colors ${
                    !(s.is_active ?? true) ? "opacity-70" : ""
                  }`}
                >
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[s.id.charCodeAt(0) % AVATAR_COLORS.length]}`}
                      >
                        {initials(s.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {s.email} · {s.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-5 py-4">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${roleCls(s.role)}`}
                    >
                      {roleLabel(s.role)}
                    </span>
                  </td>
                  {/* Clinic / Zone */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">
                      {s.clinics?.zone ?? s.clinics?.name ?? "—"}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        (s.is_active ?? true)
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          (s.is_active ?? true) ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {(s.is_active ?? true) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(s.id, s.is_active ?? true)}
                        className={`p-2 rounded-lg transition-colors ${
                          (s.is_active ?? true)
                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={(s.is_active ?? true) ? "Deactivate" : "Reactivate"}
                      >
                        {(s.is_active ?? true) ? Icon.deactivate : Icon.reactivate}
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
              No staff match your filters
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try a different search or status
            </p>
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length}
              </span>{" "}
              of {staff.length} staff
            </p>
            <div className="flex items-center gap-1">
              <button
                className="text-xs font-semibold text-slate-400 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                disabled
              >
                Previous
              </button>
              <button className="text-xs font-semibold text-white bg-teal-600 w-7 h-7 rounded-lg">
                1
              </button>
              <button className="text-xs font-semibold text-slate-500 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      )} {/* end !isLoading && !fetchError */}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-teal-950 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            {Icon.check}
          </span>
          {toast}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddStaffModal
          clinicId={profile?.clinic_id ?? null}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}
