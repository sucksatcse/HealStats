import { useState, useEffect, useCallback } from "react";
import PatientFormPage, { type PatientRecord } from "./PatientFormPage";
import { useAuth } from "./AuthContext";
import { fetchPatients } from "./lib/adminService";
import { urgencyFromScore, shortId, initials, type UrgencyLevel, type PatientWithLatestVisit } from "./lib/types";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  search: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4l-4 4 4 4" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  ),
  sort: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4.5L6 2.5l2 2M4 7.5l2 2 2-2" />
    </svg>
  ),
  view: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 9s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z" />
      <circle cx="9" cy="9" r="2.5" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5L2 3z" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a5 5 0 015-5c2.1 0 3.8 1.2 4.6 3M13 8a5 5 0 01-5 5c-2.1 0-3.8-1.2-4.6-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v3h-3M3 13v-3h3" />
    </svg>
  ),
};

// ── Urgency badge config ───────────────────────────────────────────────────────
const URGENCY_CLS: Record<UrgencyLevel, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High:     "bg-orange-50 text-orange-700 border-orange-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Low:      "bg-sky-50 text-sky-700 border-sky-200",
  Stable:   "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const URGENCY_DOT: Record<UrgencyLevel, string> = {
  Critical: "bg-red-500",
  High:     "bg-orange-500",
  Moderate: "bg-amber-500",
  Low:      "bg-sky-500",
  Stable:   "bg-emerald-500",
};

const URGENCY_OPTIONS: (UrgencyLevel | "All")[] = ["All", "Critical", "High", "Moderate", "Low", "Stable"];
const PAGE_SIZE = 8;

// ── Avatar colour palette (deterministic from first char of name) ──────────────
const AVATAR_COLOURS = [
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-orange-100 text-orange-700",
];
function avatarColour(name: string): string {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLOURS.length;
  return AVATAR_COLOURS[idx];
}

/** Format a visit date relative to now. */
function formatVisitDate(iso: string | undefined): string {
  if (!iso) return "No visits";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return `${diff} days ago`;
  if (diff < 14) return "1 week ago";
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return `${Math.floor(diff / 30)} month${Math.floor(diff / 30) > 1 ? "s" : ""} ago`;
}

// ── Filter dropdown ───────────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
          value !== "All" ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
        }`}
      >
        <span className="text-slate-400">{Icon.filter}</span>
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{label}:</span>
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
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left text-sm px-3.5 py-2 flex items-center justify-between transition-colors ${
                  value === opt ? "text-teal-700 font-semibold bg-teal-50/60" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt}
                {value === opt && (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {[40, 140, 60, 80, 80, 90, 32].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-100 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PatientRecordsPage() {
  const { profile } = useAuth();

  const [query, setQuery]       = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [urgency, setUrgency]   = useState<UrgencyLevel | "All">("All");
  const [page, setPage]         = useState(1);
  const [form, setForm]         = useState<{ mode: "add" } | { mode: "edit"; patient: PatientRecord } | null>(null);
  const [toast, setToast]       = useState("");

  // Data state
  const [rows, setRows]     = useState<PatientWithLatestVisit[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [urgency]);

  // ── Fetch patients ──────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    fetchPatients({
      clinicId: profile?.clinic_id ?? null,
      query: debouncedQuery,
      urgencyFilter: urgency,
      page,
      pageSize: PAGE_SIZE,
    }).then(({ data, count, error: err }) => {
      setRows(data);
      setTotal(count);
      setError(err);
      setLoading(false);
    });
  }, [profile?.clinic_id, debouncedQuery, urgency, page]);

  useEffect(() => { load(); }, [load]);

  // ── Edit handler ────────────────────────────────────────────────────────────
  const openEdit = (p: PatientWithLatestVisit) => setForm({
    mode: "edit",
    patient: {
      id: p.id,
      name: p.name,
      age: p.age ?? 0,
      gender: p.sex === "Female" || p.sex === "F" ? "Female" : "Male",
      village: p.village ?? "",
      urgency: urgencyFromScore(p.latest_visit?.urgency_score),
    },
  });

  if (form) {
    return (
      <PatientFormPage
        patient={form.mode === "edit" ? form.patient : null}
        onCancel={() => setForm(null)}
        onSave={(rec) => {
          setForm(null);
          flash(`${rec.name || "Record"} ${form.mode === "edit" ? "updated" : "created"}`);
          load();
        }}
      />
    );
  }

  const totalPages   = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilters = (urgency !== "All" ? 1 : 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">Patient Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${total.toLocaleString()} record${total !== 1 ? "s" : ""} found`}
            {urgency !== "All" && ` · filtered by ${urgency}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700 bg-white px-4 py-2.5 rounded-xl transition-all"
          >
            {Icon.refresh}
            Refresh
          </button>
          <button
            onClick={() => setForm({ mode: "add" })}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
            </svg>
            Add Patient
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icon.search}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
        <Dropdown label="Urgency" value={urgency} options={URGENCY_OPTIONS} onChange={(v) => setUrgency(v as UrgencyLevel | "All")} />
        {activeFilters > 0 && (
          <button
            onClick={() => { setUrgency("All"); }}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-2.5 transition-colors"
          >
            Clear filters ({activeFilters})
          </button>
        )}
        {urgency !== "All" && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
            Urgency filter fetches all matching patients — pagination counts reflect filtered results.
          </p>
        )}
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
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Patient ID", "Name", "Age", "Village", "Last Visit", "Urgency Level"].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      {col}
                      <span className="text-slate-300">{Icon.sort}</span>
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                : rows.map((p) => {
                    const level  = urgencyFromScore(p.latest_visit?.urgency_score);
                    const colour = avatarColour(p.name);
                    const inits  = initials(p.name);
                    return (
                      <tr key={p.id} className="group hover:bg-teal-50/40 transition-colors">
                        {/* ID */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono font-semibold text-slate-500">{shortId(p.id)}</span>
                        </td>
                        {/* Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${colour}`}>
                              {inits}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="text-[11px] text-slate-400">{p.sex ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        {/* Age */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">{p.age != null ? `${p.age} yrs` : "—"}</span>
                        </td>
                        {/* Village */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">{p.village ?? "—"}</span>
                        </td>
                        {/* Last Visit */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-500">{formatVisitDate(p.latest_visit?.created_at)}</span>
                        </td>
                        {/* Urgency */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${URGENCY_CLS[level]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[level]}`} />
                            {level}
                            {p.latest_visit?.urgency_score != null && (
                              <span className="opacity-60">· {p.latest_visit.urgency_score}</span>
                            )}
                          </span>
                        </td>
                        {/* View */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="View / edit record"
                            >
                              {Icon.view}
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

        {/* Empty state */}
        {!loading && !error && rows.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              {Icon.search}
            </div>
            <p className="text-sm font-medium text-slate-500">No records match your search</p>
            <p className="text-xs text-slate-400 mt-1">Try a different name or clear your filters</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex-wrap gap-3">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{(page - 1) * PAGE_SIZE + 1}</span>–
              <span className="font-semibold text-slate-600">{Math.min(page * PAGE_SIZE, total)}</span> of{" "}
              <span className="font-semibold text-slate-600">{total.toLocaleString()}</span> records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                {Icon.chevronLeft}
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`text-xs font-semibold w-7 h-7 rounded-lg transition-colors ${
                    p === page ? "bg-teal-600 text-white" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 7 && <span className="text-slate-400 text-xs px-1">…{totalPages}</span>}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
            </svg>
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}
