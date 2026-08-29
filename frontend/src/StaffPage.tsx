import { useState, useMemo } from "react";

// ── Icons ────────────────────────────────────────────────────────────────────────
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
};

// ── Data ───────────────────────────────────────────────────────────────────────
type Staff = {
  id: string;
  name: string;
  email: string;
  role: "Nurse" | "Community Health Worker" | "Clinical Officer" | "Midwife" | "Pharmacist" | "Lab Technician";
  zone: string;
  active: boolean;
  lastSync: string;
  syncTone: "recent" | "stale" | "never";
  initials: string;
  color: string;
};

const INITIAL_STAFF: Staff[] = [
  { id: "HW-20451", name: "Sr. Amara Diallo", email: "a.diallo@kayes.health", role: "Nurse", zone: "Kayes District", active: true, lastSync: "12 min ago", syncTone: "recent", initials: "AD", color: "bg-teal-100 text-teal-700" },
  { id: "HW-20388", name: "Ibrahim Traoré", email: "i.traore@kayes.health", role: "Community Health Worker", zone: "Sikasso Rural", active: true, lastSync: "1 hr ago", syncTone: "recent", initials: "IT", color: "bg-violet-100 text-violet-700" },
  { id: "HW-20502", name: "Dr. Fanta Diallo", email: "f.diallo@segou.health", role: "Clinical Officer", zone: "Ségou Centre", active: true, lastSync: "3 hrs ago", syncTone: "stale", initials: "FD", color: "bg-sky-100 text-sky-700" },
  { id: "HW-20219", name: "Kadiatou Baldé", email: "k.balde@mopti.health", role: "Midwife", zone: "Mopti Outreach", active: false, lastSync: "6 days ago", syncTone: "never", initials: "KB", color: "bg-amber-100 text-amber-700" },
  { id: "HW-20477", name: "Sekou Bah", email: "s.bah@dhading.health", role: "Pharmacist", zone: "Dhading Community", active: true, lastSync: "28 min ago", syncTone: "recent", initials: "SB", color: "bg-rose-100 text-rose-700" },
  { id: "HW-20344", name: "Oumar Coulibaly", email: "o.coulibaly@kayes.health", role: "Lab Technician", zone: "Kayes District", active: true, lastSync: "2 hrs ago", syncTone: "stale", initials: "OC", color: "bg-emerald-100 text-emerald-700" },
  { id: "HW-20291", name: "Mariama Kouyaté", email: "m.kouyate@sikasso.health", role: "Nurse", zone: "Sikasso Rural", active: false, lastSync: "12 days ago", syncTone: "never", initials: "MK", color: "bg-pink-100 text-pink-700" },
  { id: "HW-20515", name: "Aminata Sané", email: "a.sane@segou.health", role: "Community Health Worker", zone: "Ségou Centre", active: true, lastSync: "44 min ago", syncTone: "recent", initials: "AS", color: "bg-indigo-100 text-indigo-700" },
];

const ROLE_CLS: Record<Staff["role"], string> = {
  "Nurse": "bg-teal-50 text-teal-700 border-teal-200",
  "Community Health Worker": "bg-violet-50 text-violet-700 border-violet-200",
  "Clinical Officer": "bg-sky-50 text-sky-700 border-sky-200",
  "Midwife": "bg-pink-50 text-pink-700 border-pink-200",
  "Pharmacist": "bg-rose-50 text-rose-700 border-rose-200",
  "Lab Technician": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const SYNC_DOT: Record<Staff["syncTone"], string> = {
  recent: "bg-emerald-500",
  stale: "bg-amber-500",
  never: "bg-slate-300",
};

const ROLE_OPTIONS: Staff["role"][] = ["Nurse", "Community Health Worker", "Clinical Officer", "Midwife", "Pharmacist", "Lab Technician"];
const ZONE_OPTIONS = ["Kayes District", "Sikasso Rural", "Ségou Centre", "Mopti Outreach", "Dhading Community"];

// ── Add Staff modal ────────────────────────────────────────────────────────────
function AddStaffModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Staff) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Staff["role"]>("Nurse");
  const [zone, setZone] = useState(ZONE_OPTIONS[0]);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    const initials = name.trim().split(/\s+/).filter((w) => !/^(sr\.?|dr\.?|mr\.?|ms\.?)$/i.test(w)).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    onAdd({
      id: `HW-${20000 + Math.floor(Math.random() * 9999)}`,
      name: name.trim(),
      email: email.trim(),
      role,
      zone,
      active: true,
      lastSync: "Never",
      syncTone: "never",
      initials: initials || "NA",
      color: "bg-teal-100 text-teal-700",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-display text-xl text-teal-950">Add New Staff</h3>
            <p className="text-xs text-slate-400 mt-0.5">Create a healthcare worker account</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            {Icon.close}
          </button>
        </div>

        <form onSubmit={submit} noValidate className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3.5 py-2.5">{error}</div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Sr. Amara Diallo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="name@district.health"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Staff["role"])}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
                >
                  {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{Icon.chevronDown}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Zone</label>
              <div className="relative">
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
                >
                  {ZONE_OPTIONS.map((z) => <option key={z}>{z}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{Icon.chevronDown}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all">
              {Icon.plus}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  const toggleActive = (id: string) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        flash(s.active ? `${s.name} deactivated` : `${s.name} reactivated`);
        return { ...s, active: !s.active };
      })
    );
  };

  const addStaff = (s: Staff) => {
    setStaff((prev) => [s, ...prev]);
    setShowModal(false);
    flash(`${s.name} added to ${s.zone}`);
  };

  const filtered = useMemo(() =>
    staff.filter((s) => {
      const matchesQuery =
        query === "" ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.role.toLowerCase().includes(query.toLowerCase()) ||
        s.zone.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || (statusFilter === "active" ? s.active : !s.active);
      return matchesQuery && matchesStatus;
    }),
    [staff, query, statusFilter]
  );

  const activeCount = staff.filter((s) => s.active).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {staff.length} healthcare workers · {activeCount} active across 5 zones
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icon.search}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, zone, or ID…"
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {[
                  { label: "Name", w: "" },
                  { label: "Role", w: "" },
                  { label: "Assigned Zone", w: "" },
                  { label: "Status", w: "" },
                  { label: "Last Sync", w: "" },
                ].map((col) => (
                  <th key={col.label} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                      {col.label}
                      <span className="text-slate-300">{Icon.sort}</span>
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className={`group hover:bg-teal-50/40 transition-colors ${!s.active ? "opacity-70" : ""}`}>
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.color}`}>
                        {s.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{s.email} · {s.id}</p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_CLS[s.role]}`}>
                      {s.role}
                    </span>
                  </td>
                  {/* Zone */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">{s.zone}</span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        s.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Last Sync */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${SYNC_DOT[s.syncTone]}`} />
                      {s.lastSync}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => flash(`Editing ${s.name}`)}
                        className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        title="Edit"
                      >
                        {Icon.edit}
                      </button>
                      <button
                        onClick={() => toggleActive(s.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          s.active
                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={s.active ? "Deactivate" : "Reactivate"}
                      >
                        {s.active ? Icon.deactivate : Icon.reactivate}
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
            <p className="text-sm font-medium text-slate-500">No staff match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search or status</p>
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of {staff.length} staff
            </p>
            <div className="flex items-center gap-1">
              <button className="text-xs font-semibold text-slate-400 px-3 py-1.5 rounded-lg hover:bg-white transition-colors" disabled>
                Previous
              </button>
              <button className="text-xs font-semibold text-white bg-teal-600 w-7 h-7 rounded-lg">1</button>
              <button className="text-xs font-semibold text-slate-500 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
                Next
              </button>
            </div>
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

      {/* Modal */}
      {showModal && <AddStaffModal onClose={() => setShowModal(false)} onAdd={addStaff} />}
    </div>
  );
}
