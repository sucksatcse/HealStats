import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchHighRiskPatients, fetchStaff } from "./lib/adminService";
import { urgencyFromScore, type UrgencyLevel, type PatientWithLatestVisit } from "./lib/types";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 1.5l1.9 4.3 4.6.5-3.5 3.1 1 4.6L10 11.7 5.9 14l1-4.6L3.4 6.3l4.6-.5L10 1.5z" />
    </svg>
  ),
  doctor: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14v-1a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-3.5 h-3.5">
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 4.5v3.75l2.5 1.5" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a5 5 0 015-5c2.1 0 3.8 1.2 4.6 3M13 8a5 5 0 01-5 5c-2.1 0-3.8-1.2-4.6-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v3h-3M3 13v-3h3" />
    </svg>
  ),
};

// ── Urgency config ────────────────────────────────────────────────────────────
type Level = "Critical" | "High" | "Moderate";
const LEVEL_FILTERS: (Level | "All")[] = ["All", "Critical", "High", "Moderate"];

const LEVEL_META: Record<Level, { chip: string; bar: string; ring: string; scoreText: string }> = {
  Critical: { chip: "bg-red-50 text-red-700 border-red-200",    bar: "bg-red-500",    ring: "border-l-red-500",    scoreText: "text-red-600" },
  High:     { chip: "bg-orange-50 text-orange-700 border-orange-200", bar: "bg-orange-500", ring: "border-l-orange-500", scoreText: "text-orange-600" },
  Moderate: { chip: "bg-amber-50 text-amber-700 border-amber-200",  bar: "bg-amber-500",  ring: "border-l-amber-500",  scoreText: "text-amber-600" },
};

const AVATAR_COLOURS = [
  "bg-teal-100 text-teal-700", "bg-violet-100 text-violet-700", "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700",   "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700", "bg-fuchsia-100 text-fuchsia-700",
];
function avatarColour(name: string): string {
  return AVATAR_COLOURS[(name.charCodeAt(0) || 0) % AVATAR_COLOURS.length];
}
function initials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}
function formatAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000); // minutes
  if (diff < 1)   return "Just now";
  if (diff < 60)  return `${diff} min ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24)   return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/** Map numeric urgency score to a displayable Level. Only shows Moderate+ in this view. */
function toLevel(score: number | null | undefined): Level | null {
  const l = urgencyFromScore(score) as UrgencyLevel;
  if (l === "Critical" || l === "High" || l === "Moderate") return l as Level;
  return null;
}

// ── Assign dropdown ───────────────────────────────────────────────────────────
function AssignMenu({
  assigned,
  coordinators,
  onAssign,
}: {
  assigned: string | null;
  coordinators: string[];
  onAssign: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (assigned) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
          {Icon.check}
        </span>
        {assigned}
      </span>
    );
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
              {coordinators.length > 0 ? "Available coordinators" : "No admin staff found"}
            </p>
            {coordinators.map((c) => (
              <button
                key={c}
                onClick={() => { onAssign(c); setOpen(false); }}
                className="w-full text-left text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 px-3.5 py-2 transition-colors"
              >
                {c}
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
      {[160, 120, 220, 80, 100].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-100 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FlaggedPatientsPage() {
  const { profile } = useAuth();

  const [filter, setFilter]           = useState<Level | "All">("All");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [reviewed, setReviewed]       = useState<Set<string>>(new Set()); // UI-only
  const [toast, setToast]             = useState("");

  const [patients, setPatients]       = useState<PatientWithLatestVisit[]>([]);
  const [coordinators, setCoordinators] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  // ── Load high-risk patients + admin staff (coordinators) ────────────────────
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchHighRiskPatients(profile?.clinic_id ?? null),
      fetchStaff(profile?.clinic_id ?? null),
    ]).then(([patientsResult, staffResult]) => {
      setPatients(patientsResult.data);
      setError(patientsResult.error);
      // Use admin-role staff as "available coordinators" (no doctor role in schema)
      setCoordinators(
        staffResult.data
          .filter((s) => s.role === "admin" && (s.is_active ?? true))
          .map((s) => s.name),
      );
      setLoading(false);
    });
  }, [profile?.clinic_id]);

  useEffect(() => { load(); }, [load]);

  // ── Filter & derive display rows ────────────────────────────────────────────
  const rows = patients.filter((p) => {
    const level = toLevel(p.latest_visit?.urgency_score);
    if (!level) return false;
    if (filter === "All") return true;
    return level === filter;
  });

  const assign = (patientId: string, name: string, coordinator: string) => {
    setAssignments((prev) => ({ ...prev, [patientId]: coordinator }));
    flash(`${name} assigned to ${coordinator}`);
  };

  const markReviewed = (id: string, name: string) => {
    setReviewed((prev) => { const s = new Set(prev); s.add(id); return s; });
    flash(`${name} marked as reviewed`);
  };

  const criticalCount   = patients.filter((p) => toLevel(p.latest_visit?.urgency_score) === "Critical").length;
  const unassignedCount = rows.filter((p) => !assignments[p.id]).length;

  return (
    <div className="space-y-6">

      {/* Alert banner */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
          {Icon.alert}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl text-red-950 leading-tight">High-Risk Patients</h1>
          <p className="text-sm text-red-700/80 mt-0.5">
            {loading ? "Loading…" : (
              <>{patients.length} patients with Moderate+ urgency score · <span className="font-semibold">{criticalCount} critical</span> · {unassignedCount} awaiting assignment</>
            )}
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
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-1">Urgency</span>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {LEVEL_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  filter === f
                    ? f === "Critical" ? "bg-red-500 text-white shadow-sm"
                    : f === "High"     ? "bg-orange-500 text-white shadow-sm"
                    : f === "Moderate" ? "bg-amber-500 text-white shadow-sm"
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
          Showing <span className="font-semibold text-slate-600">{rows.length}</span> flagged patient{rows.length !== 1 ? "s" : ""}
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
                {["Patient", "Urgency Score", "Symptoms / Vitals", "Flagged"].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {col}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : rows.map((p) => {
                    const score    = p.latest_visit?.urgency_score ?? 0;
                    const level    = toLevel(score) ?? "Moderate";
                    const meta     = LEVEL_META[level];
                    const assigned = assignments[p.id] ?? null;
                    const isReviewed = reviewed.has(p.id);
                    const colour   = avatarColour(p.name);
                    const inits    = initials(p.name);

                    return (
                      <tr
                        key={p.id}
                        className={`group hover:bg-slate-50/60 transition-colors border-l-4 ${
                          isReviewed ? "border-l-emerald-400 opacity-75" : assigned ? "border-l-emerald-400 opacity-85" : meta.ring
                        }`}
                      >
                        {/* Patient */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${colour}`}>
                              {inits}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {p.age != null ? `${p.age} yrs` : "—"} · {p.sex ?? "—"} · {p.village ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Urgency score */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 w-40">
                            <div className="flex items-baseline gap-1 w-12 flex-shrink-0">
                              <span className={`font-display text-2xl leading-none ${meta.scoreText}`}>{score}</span>
                            </div>
                            <div className="flex-1">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${meta.chip}`}>
                                {level}
                              </span>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${meta.bar}`} style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Symptoms / vitals */}
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-sm text-slate-700 leading-snug">
                            {p.latest_visit?.symptoms ?? <span className="text-slate-400 italic">No symptoms recorded</span>}
                          </p>
                          {p.latest_visit?.symptom_category && (
                            <p className={`text-[11px] font-medium mt-1 flex items-center gap-1.5 ${meta.scoreText}`}>
                              <span>{Icon.spark}</span>
                              {p.latest_visit.symptom_category}
                            </p>
                          )}
                        </td>
                        {/* Flagged time */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                            {Icon.clock}
                            {p.latest_visit?.created_at ? formatAgo(p.latest_visit.created_at) : "—"}
                          </span>
                        </td>
                        {/* Action */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-end gap-1.5">
                            <AssignMenu
                              assigned={assigned}
                              coordinators={coordinators}
                              onAssign={(coord) => assign(p.id, p.name, coord)}
                            />
                            {!isReviewed && (
                              <button
                                onClick={() => markReviewed(p.id, p.name)}
                                className="text-[11px] font-semibold text-slate-400 hover:text-emerald-600 transition-colors whitespace-nowrap"
                              >
                                Mark reviewed ✓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && !error && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-emerald-500">
              {Icon.check}
            </div>
            <p className="text-sm font-medium text-slate-500">No patients at this urgency level</p>
            <p className="text-xs text-slate-400 mt-1">Adjust the filter to see other flagged cases</p>
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
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">{Icon.check}</span>
          {toast}
        </div>
      )}
    </div>
  );
}
