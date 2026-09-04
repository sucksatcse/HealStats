import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchStaff,
  createStaffRecord,
  updateStaffRecord,
  setStaffActive,
  type StaffWithClinic,
  type CreateStaffInput,
} from "./lib/adminService";
import { initials, type StaffRole } from "./lib/types";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  search: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 3.5l3 3M2.5 15.5l1-3.5 8-8 3 3-8 8-4 .5z" />
    </svg>
  ),
  deactivate: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
      <circle cx="9" cy="9" r="6.5" />
      <path strokeLinecap="round" d="M4.5 4.5l9 9" />
    </svg>
  ),
  reactivate: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a6 6 0 016-6c2.5 0 4.6 1.5 5.5 3.7M15 3v3h-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9a6 6 0 01-6 6c-2.5 0-4.6-1.5-5.5-3.7M3 15v-3h3" />
    </svg>
  ),
  sort: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4.5L6 2.5l2 2M4 7.5l2 2 2-2" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a5 5 0 015-5c2.1 0 3.8 1.2 4.6 3M13 8a5 5 0 01-5 5c-2.1 0-3.8-1.2-4.6-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v3h-3M3 13v-3h3" />
    </svg>
  ),
};

// ── Badge config (actual schema roles: worker | admin) ────────────────────────
const ROLE_CLS: Record<StaffRole, string> = {
  worker: "bg-teal-50 text-teal-700 border-teal-200",
  admin:  "bg-violet-50 text-violet-700 border-violet-200",
};

const AVATAR_COLOURS = [
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
];
function avatarColour(name: string): string {
  return AVATAR_COLOURS[(name.charCodeAt(0) || 0) % AVATAR_COLOURS.length];
}

const ROLE_OPTIONS: StaffRole[] = ["worker", "admin"];

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {[160, 60, 100, 60, 80, 48].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-100 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Add Staff modal ───────────────────────────────────────────────────────────
interface AddStaffModalProps {
  clinicId: string | null;
  onClose: () => void;
  onCreated: (s: StaffWithClinic) => void;
}
function AddStaffModal({ clinicId, onClose, onCreated }: AddStaffModalProps) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole]   = useState<StaffRole>("worker");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setSaving(true);
    const input: CreateStaffInput = { name: name.trim(), email: email.trim(), role, clinic_id: clinicId };
    const { data, error: err } = await createStaffRecord(input);
    setSaving(false);
    if (err || !data) { setError(err ?? "Unexpected error."); return; }
    onCreated(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-display text-xl text-teal-950">Add New Staff</h3>
            <p className="text-xs text-slate-400 mt-0.5">Creates a staff row. Auth account must be set up separately in Supabase Dashboard.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">{Icon.close}</button>
        </div>

        <form onSubmit={submit} noValidate className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3.5 py-2.5">{error}</div>}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Amara Diallo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="name@clinic.health"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r === "worker" ? "Health Worker" : "Admin"}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{Icon.chevronDown}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-3.5 py-2.5">
            <strong>Note:</strong> A Supabase Auth account must be created separately in the Supabase Dashboard before this staff member can log in.
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all disabled:opacity-60"
            >
              {saving ? "Saving…" : <>{Icon.plus} Create Account</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Staff modal ──────────────────────────────────────────────────────────
interface EditStaffModalProps {
  staff: StaffWithClinic;
  onClose: () => void;
  onSaved: () => void;
}
function EditStaffModal({ staff, onClose, onSaved }: EditStaffModalProps) {
  const [name, setName]   = useState(staff.name);
  const [email, setEmail] = useState(staff.email ?? "");
  const [role, setRole]   = useState<StaffRole>(staff.role);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const { error: err } = await updateStaffRecord(staff.id, {
      name: name.trim(),
      email: email.trim() || undefined,
      role,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-display text-xl text-teal-950">Edit Staff</h3>
            <p className="text-xs text-slate-400 mt-0.5">{staff.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">{Icon.close}</button>
        </div>

        <form onSubmit={submit} noValidate className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3.5 py-2.5">{error}</div>}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r === "worker" ? "Health Worker" : "Admin"}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{Icon.chevronDown}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all disabled:opacity-60"
            >
              {saving ? "Saving…" : <>{Icon.check} Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { profile } = useAuth();

  const [staff, setStaff]           = useState<StaffWithClinic[]>([]);
  const [query, setQuery]           = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffWithClinic | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null); // id being deactivated
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [toast, setToast]           = useState("");

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  // ── Load staff ──────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    fetchStaff(profile?.clinic_id ?? null).then(({ data, error: err }) => {
      setStaff(data);
      setError(err);
      setLoading(false);
    });
  }, [profile?.clinic_id]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleToggleActive = async (s: StaffWithClinic) => {
    const newVal = !(s.is_active ?? true);
    setDeactivating(s.id);
    const { error: err } = await setStaffActive(s.id, newVal);
    setDeactivating(null);
    if (err) { flash(`Error: ${err}`); return; }
    flash(newVal ? `${s.name} reactivated` : `${s.name} deactivated`);
    // Optimistic update
    setStaff((prev) => prev.map((m) => m.id === s.id ? { ...m, is_active: newVal } : m));
  };

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = staff.filter((s) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.clinics?.name ?? "").toLowerCase().includes(q);
    const active = s.is_active ?? true;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? active : !active);
    return matchesQuery && matchesStatus;
  });

  const activeCount = staff.filter((s) => s.is_active ?? true).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${staff.length} healthcare workers · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700 bg-white px-4 py-2.5 rounded-xl transition-all"
          >
            {Icon.refresh}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5"
          >
            {Icon.plus}
            Add New Staff
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icon.search}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, email, or ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === f ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
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
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Name", "Role", "Clinic / Zone", "Status", "is_active"].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="inline-flex items-center gap-1">{col}<span className="text-slate-300">{Icon.sort}</span></span>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((s) => {
                    const active  = s.is_active ?? true;
                    const colour  = avatarColour(s.name);
                    const inits   = initials(s.name);
                    const isDeact = deactivating === s.id;
                    return (
                      <tr key={s.id} className={`group hover:bg-teal-50/40 transition-colors ${!active ? "opacity-70" : ""}`}>
                        {/* Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${colour}`}>
                              {inits}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">{s.email ?? "no email"} · {s.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_CLS[s.role]}`}>
                            {s.role === "worker" ? "Health Worker" : "Admin"}
                          </span>
                        </td>
                        {/* Clinic */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">
                            {s.clinics ? `${s.clinics.name}${s.clinics.zone ? ` · ${s.clinics.zone}` : ""}` : "—"}
                          </span>
                        </td>
                        {/* Status (is_active) */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {/* is_active field */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-400 font-mono">
                            {s.is_active === undefined ? "—" : String(s.is_active)}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditTarget(s)}
                              className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                              title="Edit"
                            >
                              {Icon.edit}
                            </button>
                            <button
                              onClick={() => handleToggleActive(s)}
                              disabled={isDeact}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                                active
                                  ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={active ? "Deactivate" : "Reactivate"}
                            >
                              {isDeact ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                                  <circle cx="8" cy="8" r="6" strokeOpacity={0.3} />
                                  <path d="M14 8a6 6 0 01-6 6" strokeLinecap="round" />
                                </svg>
                              ) : active ? Icon.deactivate : Icon.reactivate}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">{Icon.search}</div>
            <p className="text-sm font-medium text-slate-500">No staff match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search or status filter</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of {staff.length} staff
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-teal-950 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">{Icon.check}</span>
          {toast}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddStaffModal
          clinicId={profile?.clinic_id ?? null}
          onClose={() => setShowAddModal(false)}
          onCreated={(s) => {
            setShowAddModal(false);
            setStaff((prev) => [s, ...prev]);
            flash(`${s.name} added successfully`);
          }}
        />
      )}
      {editTarget && (
        <EditStaffModal
          staff={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            flash("Staff record updated");
            load();
          }}
        />
      )}
    </div>
  );
}
