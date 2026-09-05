import { useState, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fetchAdminStats, fetchOutbreakAnalysis, type AdminStats, type OutbreakAnalysisResult } from "./lib/adminService";
import { supabase } from "./lib/supabase";
import { offlineDb } from "./lib/offlineDb";
import AppNavbar from "./AppNavbar";
import { useLang } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import StaffPage from "./StaffPage";
import PatientRecordsPage from "./PatientRecordsPage";
import PatientDetailPage from "./PatientDetailPage";
import SyncMonitorPage from "./SyncMonitorPage";
import FlaggedPatientsPage from "./FlaggedPatientsPage";
import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SettingsPage";
import EmergencyDashboard from "./EmergencyDashboard";
import ResourceAllocationPage from "./ResourceAllocationPage";
import AlertsCenterPage from "./AlertsCenterPage";
import ClinicOpsPanel from "./ClinicOpsPanel";
import OutbreakDetectionPage from "./OutbreakDetectionPage";
import EmergencyTriagePage from "./EmergencyTriagePage";

// ── Icons (lucide-style, matching DashboardPage) ────────────────────────────────
const Icon = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
      <path d="M2 4.5A2.5 2.5 0 014.5 2h2A2.5 2.5 0 019 4.5v2A2.5 2.5 0 016.5 9h-2A2.5 2.5 0 012 6.5v-2zM11 4.5A2.5 2.5 0 0113.5 2h2A2.5 2.5 0 0118 4.5v2A2.5 2.5 0 0115.5 9h-2A2.5 2.5 0 0111 6.5v-2zM2 13.5A2.5 2.5 0 014.5 11h2A2.5 2.5 0 019 13.5v2A2.5 2.5 0 016.5 18h-2A2.5 2.5 0 012 15.5v-2zM11 13.5A2.5 2.5 0 0113.5 11h2A2.5 2.5 0 0118 13.5v2A2.5 2.5 0 0115.5 18h-2A2.5 2.5 0 0111 15.5v-2z" />
    </svg>
  ),
  patients: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 19v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  staff: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3.5 17.5a6.5 6.5 0 0113 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5l1.3 1.3 2.2-2.6" />
    </svg>
  ),
  sync: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17V3m0 14h14M6.5 14l3-3.5 2.5 2 3.5-4.5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4.5 h-4.5">
      <circle cx="10" cy="10" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-9A2.25 2.25 0 002.25 5.25v9.5A2.25 2.25 0 004.5 17h9a2.25 2.25 0 002.25-2.25V11M10 9l3 3m0 0l-3 3m3-3H3.75" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  ),
  arrowUp: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13V3M4 7l4-4 4 4" />
    </svg>
  ),
  arrowDown: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M4 9l4 4 4-4" />
    </svg>
  ),
  usersStat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 19v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M10 9a4 4 0 100-8 4 4 0 000 8zM22 19v-2a4 4 0 00-3-3.87M16 1.13a4 4 0 010 7.75" />
    </svg>
  ),
  fileStat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  cloudStat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v5M9.5 14.5L12 12l2.5 2.5" />
    </svg>
  ),
  alertStat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
  { id: "patients", label: "Patients", icon: Icon.patients },
  { id: "staff", label: "Staff", icon: Icon.staff },
  { id: "sync", label: "Sync Status", icon: Icon.sync },
  { id: "analytics", label: "Analytics", icon: Icon.analytics },
  { id: "outbreak", label: "Outbreak Radar", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <circle cx="10" cy="10" r="8" strokeDasharray="2 3" />
      <circle cx="10" cy="10" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18" />
    </svg>
  ) },
  { id: "resources", label: "Resource Ops", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l7-4 7 4v6l-7 4-7-4V7zM3 7l7 4 7-4M10 11v6" />
    </svg>
  ), badge: "SOS" },
  { id: "ops-map", label: "Ops Map", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17A8 8 0 109 1a8 8 0 000 16zm0-11v3.5l2.5 2" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
    </svg>
  ) },
  { id: "alerts", label: "Notifications", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.86 15.08a20 20 0 004.55-1.09A7.47 7.47 0 0117 8.13V7.5a5 5 0 00-10 0v.63a7.47 7.47 0 01-1.93 5.86 20 20 0 004.55 1.09m5.24 0a20.2 20.2 0 01-5.24 0m5.24 0a2.5 2.5 0 01-5.24 0" />
    </svg>
  ), badge: "3" },
  { id: "settings", label: "Settings", icon: Icon.settings },
];

// ── Stat card skeleton ────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="w-14 h-6 rounded-full bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="h-8 w-24 rounded bg-slate-100 dark:bg-slate-800 mb-2" />
      <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export interface VisitChartPoint {
  day: string;
  date: string;
  visits: number;
}

// ── Dynamic Line chart (Task 10: Supabase-backed) ──────────────────────────────────
function VisitsLineChart({ data, loading }: { data: VisitChartPoint[]; loading: boolean }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 260;
  const padX = 44;
  const padTop = 24;
  const padBottom = 40;

  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const values = data.map((d) => d.visits);
  const maxVal = Math.max(...values, 0);
  const maxV = Math.max(Math.ceil(maxVal / 5) * 5, 10);
  const minV = 0;

  const geometry = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, i) => {
      const x = padX + (innerW * i) / Math.max(data.length - 1, 1);
      const y = padTop + innerH * (1 - (d.visits - minV) / (maxV - minV));
      return { x, y, ...d };
    });
  }, [data, innerW, innerH, maxV]);

  if (loading) {
    return (
      <div className="h-[260px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          Loading visit analytics…
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
        No visit data available for this time range.
      </div>
    );
  }

  const linePath = geometry.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = geometry.length > 0
    ? `${linePath} L${geometry[geometry.length - 1].x},${H - padBottom} L${geometry[0].x},${H - padBottom} Z`
    : "";

  const gridLines = [0, Math.round(maxV * 0.25), Math.round(maxV * 0.5), Math.round(maxV * 0.75), maxV];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="visitsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid + labels */}
        {gridLines.map((g) => {
          const y = padTop + innerH * (1 - (g - minV) / (maxV - minV));
          return (
            <g key={g}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" strokeDasharray="3 4" />
              <text x={padX - 12} y={y + 3.5} textAnchor="end" className="fill-slate-400 dark:fill-slate-500" fontSize="11">
                {g}
              </text>
            </g>
          );
        })}

        {/* Area + line */}
        {areaPath && <path d={areaPath} fill="url(#visitsArea)" />}
        {linePath && <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {/* X labels + hit areas + points */}
        {geometry.map((p, i) => (
          <g key={p.date + i}>
            {p.day && (
              <text x={p.x} y={H - padBottom + 20} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="11" fontWeight={hover === i ? 700 : 500}>
                {p.day}
              </text>
            )}
            {hover === i && (
              <line x1={p.x} y1={padTop} x2={p.x} y2={H - padBottom} stroke="#0d9488" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 6 : 4}
              stroke="#0d9488"
              strokeWidth="2.5"
              className="transition-all fill-white dark:fill-slate-900"
            />
            {/* Invisible wide hit target */}
            <rect
              x={p.x - (innerW / Math.max(geometry.length - 1, 1)) / 2}
              y={0}
              width={innerW / Math.max(geometry.length - 1, 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hover !== null && geometry[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-teal-950 text-white rounded-lg px-3 py-2 shadow-lg z-10"
          style={{
            left: `${(geometry[hover].x / W) * 100}%`,
            top: `${(geometry[hover].y / H) * 100}%`,
            marginTop: "-10px",
          }}
        >
          <p className="text-[10px] uppercase tracking-wide text-teal-300 font-semibold whitespace-nowrap">{geometry[hover].date}</p>
          <p className="font-display text-lg leading-none mt-0.5">{geometry[hover].visits} <span className="text-xs font-sans text-teal-200">visits</span></p>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────────
interface AdminDashboardPageProps {
  onLogout: () => void;
}

export default function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [emergency, setEmergency] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetailReturnNav, setPatientDetailReturnNav] = useState<"patients" | "flagged" | "emergency" | "outbreak" | "emergency-triage">("patients");

  /* Global lang + dark from context */
  const { dark } = useTheme();
  const { lang } = useLang();
  const { profile } = useAuth();

  /* ── Live dashboard stats (Task 10) ──────────────────────────────────────── */
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = () => {
    setStatsLoading(true);
    fetchAdminStats(profile?.clinic_id ?? null)
      .then((result) => { setStats(result); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  };

  /* ── Live Outbreak Cluster Surveillance (Task 14.5) ────────────────────────── */
  const [outbreakAnalysis, setOutbreakAnalysis] = useState<OutbreakAnalysisResult | null>(null);

  const loadOutbreak = () => {
    fetchOutbreakAnalysis({ clinicId: profile?.clinic_id ?? null, hours: 168 })
      .then((res) => {
        if (res.data) setOutbreakAnalysis(res.data);
      })
      .catch((err) => console.error("[AdminDashboard] loadOutbreak error:", err));
  };

  useEffect(() => {
    loadStats();
    loadOutbreak();
    const iv = setInterval(loadOutbreak, 30000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.clinic_id]);

  /* ── Live offline sync badge count (Task 10 Step 7) ───────────────────────── */
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);

  useEffect(() => {
    const checkOfflineCount = async () => {
      try {
        const count = await offlineDb.pendingRecords.where("status").equals("pending").count();
        setOfflinePendingCount(count);
      } catch {
        // ignore
      }
    };
    checkOfflineCount();
    const iv = setInterval(checkOfflineCount, 3000);
    return () => clearInterval(iv);
  }, []);

  const navItems = useMemo(() => {
    return NAV_ITEMS.map((item) => {
      if (item.id === "sync") {
        return {
          ...item,
          badge: offlinePendingCount > 0 ? String(offlinePendingCount) : undefined,
        };
      }
      if (item.id === "outbreak") {
        const cCount = outbreakAnalysis?.clusters.length ?? 0;
        return {
          ...item,
          badge: cCount > 0 ? String(cCount) : undefined,
        };
      }
      return item;
    });
  }, [offlinePendingCount, outbreakAnalysis]);

  /* ── Live visit analytics chart (Task 10 Step 8) ─────────────────────────── */
  const [chartData, setChartData] = useState<VisitChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchChartData = async () => {
      setChartLoading(true);
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - (days - 1));

      try {
        const res = profile?.clinic_id
          ? await supabase
              .from("visits")
              .select("created_at, patients!inner(clinic_id)")
              .eq("patients.clinic_id", profile.clinic_id)
              .gte("created_at", startDate.toISOString())
              .order("created_at", { ascending: true })
          : await supabase
              .from("visits")
              .select("created_at")
              .gte("created_at", startDate.toISOString())
              .order("created_at", { ascending: true });

        if (cancelled) return;
        const data = res.data;

        const counts = new Map<string, number>();
        if (data) {
          for (const v of data) {
            if (v.created_at) {
              const d = v.created_at.slice(0, 10);
              counts.set(d, (counts.get(d) ?? 0) + 1);
            }
          }
        }

        const points: VisitChartPoint[] = [];
        for (let i = 0; i < days; i++) {
          const cur = new Date(startDate);
          cur.setDate(cur.getDate() + i);
          const key = cur.toISOString().slice(0, 10);
          const dayName = cur.toLocaleDateString("en-US", { weekday: "short" });
          const dateLabel = cur.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          points.push({
            day: days > 14 ? (i % Math.ceil(days / 6) === 0 ? dateLabel : "") : dayName,
            date: dateLabel,
            visits: counts.get(key) ?? 0,
          });
        }
        setChartData(points);
      } catch (err) {
        console.error("[AdminDashboard] Error fetching chart data:", err);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    fetchChartData();
    return () => {
      cancelled = true;
    };
  }, [range, profile?.clinic_id]);

  /* ── Live top clinics today (Task 10 Step 9) ───────────────────────────────── */
  interface ClinicActivity {
    id: string;
    name: string;
    zone: string | null;
    visits: number;
    share: number;
  }
  const [clinicsActivity, setClinicsActivity] = useState<ClinicActivity[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadClinicsActivity = async () => {
      setClinicsLoading(true);
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [clinicsRes, visitsRes] = await Promise.all([
          supabase.from("clinics").select("id, name, zone"),
          supabase
            .from("visits")
            .select("id, patients!inner(clinic_id)")
            .gte("created_at", todayStart.toISOString()),
        ]);

        if (cancelled) return;
        const clinicList = clinicsRes.data ?? [];
        const visitsList = visitsRes.data ?? [];

        const countMap = new Map<string, number>();
        for (const v of visitsList) {
          const cId = (v as any).patients?.clinic_id;
          if (cId) {
            countMap.set(cId, (countMap.get(cId) ?? 0) + 1);
          }
        }

        const maxVisits = Math.max(...clinicList.map((c) => countMap.get(c.id) ?? 0), 1);

        const combined: ClinicActivity[] = clinicList.map((c) => {
          const visits = countMap.get(c.id) ?? 0;
          const share = Math.round((visits / maxVisits) * 100);
          return {
            id: c.id,
            name: c.name,
            zone: c.zone ?? null,
            visits,
            share,
          };
        });

        combined.sort((a, b) => b.visits - a.visits);
        setClinicsActivity(combined.slice(0, 6));
      } catch (err) {
        console.error("[AdminDashboard] Error loading clinics activity:", err);
      } finally {
        if (!cancelled) setClinicsLoading(false);
      }
    };

    loadClinicsActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRangeVisits = chartData.reduce((s, d) => s + d.visits, 0);
  const avgRangeVisits = chartData.length > 0 ? Math.round(totalRangeVisits / chartData.length) : 0;
  const peakDay = chartData.reduce(
    (max, d) => (d.visits > max.visits ? d : max),
    chartData[0] ?? { day: "—", date: "—", visits: 0 },
  );
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-screen overflow-hidden font-[Work_Sans,system-ui,sans-serif] transition-colors" style={{background: 'var(--an-bg)'}}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-teal-950 dark:bg-slate-900 dark:border-r dark:border-slate-800 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-5 py-5 border-b border-teal-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div>
            <p className="font-display text-base text-white leading-none">HealthStats</p>
            <p className="text-[10px] text-teal-400 mt-0.5">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500 px-3 mb-3">Management</p>
          {navItems.map(({ id, label, icon, badge }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  active ? "bg-teal-600 text-white shadow-sm" : "text-teal-300 hover:bg-teal-800/60 hover:text-white"
                }`}
              >
                <span className={active ? "text-white" : "text-teal-400"}>{icon}</span>
                {label}
                {badge && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge === "SOS" ? "bg-red-500 text-white" : "bg-amber-400 text-amber-900"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-teal-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teal-800/60 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {profile?.name
                ? profile.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
                : "SA"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.name ?? "System Admin"}</p>
              <p className="text-[10px] text-teal-400">
                {profile?.role === "admin" ? "Administrator" : "Health Staff"}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="text-teal-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Log out"
            >
              {Icon.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top navbar */}
        <AppNavbar
          variant="app"
          onSidebarOpen={() => setSidebarOpen(true)}
          searchValue={adminSearch}
          onSearchChange={setAdminSearch}
          searchPlaceholder="Search clinics, staff, records…"
          isOnline={typeof navigator !== "undefined" ? navigator.onLine : true}
          onlineText={typeof navigator !== "undefined" && navigator.onLine ? "System Connected" : "Offline"}
          onNotifications={() => setActiveNav("alerts")}
          notificationCount={1}
          userInitials={profile?.name
            ? profile.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
            : "SA"}
          userColor="violet"
          breadcrumb={
            activeNav === "staff" ? "Staff"
            : activeNav === "patients" ? "Patients"
            : activeNav === "patient-detail" ? "Patient Details"
            : activeNav === "sync" ? "Sync Status"
            : activeNav === "flagged" ? "High-Risk Patients"
            : activeNav === "analytics" ? "Analytics"
            : activeNav === "resources" ? "Resource Ops"
            : activeNav === "alerts" ? "Notifications"
            : activeNav === "settings" ? "Settings"
            : activeNav === "ops-map" ? "Ops Map"
            : activeNav === "outbreak" ? "Outbreak Radar"
            : "Overview"
          }
        />

        {/* Ops map: full-height panel, no padding wrapper */}
        {activeNav === "ops-map" && <ClinicOpsPanel />}

        {/* All other content views */}
        {activeNav !== "ops-map" && (
        <main className={`flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6 transition-colors duration-500 ${
          emergency && !["staff", "patients", "patient-detail", "sync", "flagged", "analytics", "resources", "alerts", "settings", "outbreak"].includes(activeNav)
            ? "bg-gradient-to-b from-red-50 to-slate-50"
            : ""
        }`}>

          {activeNav === "staff" && <StaffPage />}
          {activeNav === "patients" && (
            <PatientRecordsPage
              onViewPatient={(id) => {
                setSelectedPatientId(id);
                setPatientDetailReturnNav("patients");
                setActiveNav("patient-detail");
              }}
            />
          )}
          {activeNav === "patient-detail" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveNav(patientDetailReturnNav)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {patientDetailReturnNav === "flagged"
                  ? "Back to High-Risk Patients"
                  : patientDetailReturnNav === "emergency"
                  ? "Back to Emergency Response"
                  : patientDetailReturnNav === "emergency-triage"
                  ? "Back to Emergency Triage Queue"
                  : patientDetailReturnNav === "outbreak"
                  ? "Back to Outbreak Radar"
                  : "Back to Patient Directory"}
              </button>
              <PatientDetailPage
                patientId={selectedPatientId}
                onNewVisit={() => {}}
              />
            </div>
          )}
          {activeNav === "sync" && <SyncMonitorPage />}
          {activeNav === "flagged" && (
            <FlaggedPatientsPage
              onViewPatient={(id) => {
                setSelectedPatientId(id);
                setPatientDetailReturnNav("flagged");
                setActiveNav("patient-detail");
              }}
            />
          )}
          {activeNav === "analytics" && <AnalyticsPage />}
          {activeNav === "outbreak" && (
            <OutbreakDetectionPage
              clinicId={profile?.clinic_id}
              onViewPatient={(id) => {
                setSelectedPatientId(id);
                setPatientDetailReturnNav("outbreak");
                setActiveNav("patient-detail");
              }}
            />
          )}
          {activeNav === "resources" && <ResourceAllocationPage />}
          {activeNav === "alerts" && <AlertsCenterPage />}
          {activeNav === "settings" && <SettingsPage />}
          {activeNav === "emergency-triage" && (
            <EmergencyTriagePage
              onViewPatient={(id) => {
                setSelectedPatientId(id);
                setPatientDetailReturnNav("emergency-triage");
                setActiveNav("patient-detail");
              }}
              onBack={() => setActiveNav("dashboard")}
            />
          )}

          {!["staff", "patients", "patient-detail", "sync", "flagged", "analytics", "outbreak", "resources", "alerts", "settings", "emergency-triage"].includes(activeNav) && (<>

          {/* Outbreak Surveillance Alert Banner (Task 14.5) */}
          {outbreakAnalysis && outbreakAnalysis.clusters.length > 0 && (
            <div
              className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all ${
                outbreakAnalysis.highestRiskLevel === "critical"
                  ? "bg-red-500/10 border-red-500/30 dark:bg-red-950/40 dark:border-red-800"
                  : "bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/40 dark:border-amber-800"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                    outbreakAnalysis.highestRiskLevel === "critical" ? "bg-red-600 animate-pulse" : "bg-amber-600"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
                    <circle cx="12" cy="12" r="4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      Epidemic Early-Warning Alert: {outbreakAnalysis.clusters[0].syndromeName}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        outbreakAnalysis.highestRiskLevel === "critical" ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                      }`}
                    >
                      {outbreakAnalysis.highestRiskLevel === "critical" ? "CRITICAL OUTBREAK" : "WARNING CLUSTER"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {outbreakAnalysis.clusters.length} active cluster(s) flagged across {outbreakAnalysis.clusters.map((c) => c.zone).filter((v, i, a) => a.indexOf(v) === i).join(", ")}. Primary symptoms: {outbreakAnalysis.clusters[0].dominantSymptoms.slice(0, 3).join(", ")}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNav("outbreak")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all flex-shrink-0 cursor-pointer ${
                  outbreakAnalysis.highestRiskLevel === "critical" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                <span>Investigate in Outbreak Radar</span>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
                </svg>
              </button>
            </div>
          )}

          {/* Emergency Mode toggle bar */}
          <div
            className={`rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all duration-500 ${
              emergency
                ? "bg-gradient-to-r from-red-600 to-orange-600 border-red-700 shadow-lg shadow-red-600/25"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                emergency ? "bg-white/20 text-white" : "bg-red-50 text-red-600"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-6 h-6 ${emergency ? "animate-pulse" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-base ${emergency ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>Emergency Mode</p>
                {emergency && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white bg-white/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Active
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${emergency ? "text-red-100" : "text-slate-400 dark:text-slate-500"}`}>
                {emergency
                  ? "Crisis response view is live — zones, triage queue, and resources shown below."
                  : "Activate to switch the dashboard to crisis response mode."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emergency}
              onClick={() => setEmergency((v) => !v)}
              className={`relative w-14 h-7 rounded-full flex-shrink-0 transition-colors ${emergency ? "bg-white/30" : "bg-slate-200 dark:bg-slate-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-sm transition-transform ${emergency ? "translate-x-7 bg-white" : "translate-x-0 bg-white"}`} />
            </button>
          </div>

          {/* Header row */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className={`font-display text-2xl lg:text-3xl ${emergency ? "text-red-950" : "text-teal-950 dark:text-white"}`}>
                {emergency ? "Emergency Response" : "Clinic Overview"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{today} · Kayes Health District</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const reportData = [
                  ["HealStats Emergency Situation Report", today],
                  ["District", "Kayes Health District"],
                  ["Emergency Mode Status", emergency ? "ACTIVE EMERGENCY" : "STANDARD SURVEILLANCE"],
                  ["Generated At", new Date().toISOString()],
                  [],
                  ["Total Registered Patients", stats?.totalPatients ?? "—"],
                  ["Visits Today", stats?.recordsToday ?? "—"],
                  ["Pending Sync Records", stats?.pendingSync ?? "—"],
                  ["High-Risk Cases Flagged", stats?.highRiskFlagged ?? "—"],
                ];
                const csvContent = reportData.map((row) => row.join(",")).join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `healstats_situation_report_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className={`flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${
                emergency ? "bg-red-600 hover:bg-red-700 shadow-red-600/25" : "bg-teal-600 hover:bg-teal-700 shadow-teal-600/25"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11" />
              </svg>
              {emergency ? "Export Situation Report" : "Export Report"}
            </button>
          </div>

          {emergency ? (
            <EmergencyDashboard
              onViewPatient={(id) => {
                setSelectedPatientId(id);
                setPatientDetailReturnNav("emergency");
                setActiveNav("patient-detail");
              }}
              onOpenTriageQueue={() => setActiveNav("emergency-triage")}
            />
          ) : (<>

          {/* Summary cards — Task 10: Live Supabase data */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
            </div>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1. Total Patients */}
            <button
              type="button"
              className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md cursor-default transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-50 text-teal-600">{Icon.usersStat}</div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">Live</span>
              </div>
              {stats?.errors.totalPatients ? (
                <p className="font-display text-xl text-red-400">—</p>
              ) : (
                <p className="font-display text-3xl text-teal-950 dark:text-white leading-none">
                  {(stats?.totalPatients ?? 0).toLocaleString()}
                </p>
              )}
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1.5">Total Patients</p>
              <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-500">registered in your clinic</p>
            </button>

            {/* 2. Records Today */}
            <button
              type="button"
              className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md cursor-default transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600">{Icon.fileStat}</div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">Today</span>
              </div>
              {stats?.errors.recordsToday ? (
                <p className="font-display text-xl text-red-400">—</p>
              ) : (
                <p className="font-display text-3xl text-teal-950 dark:text-white leading-none">
                  {(stats?.recordsToday ?? 0).toLocaleString()}
                </p>
              )}
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1.5">Records Today</p>
              <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-500">visits created since midnight UTC</p>
            </button>

            {/* 3. Pending Sync */}
            <button
              type="button"
              className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md cursor-default transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">{Icon.cloudStat}</div>
                {(stats?.pendingSync ?? 0) > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                    {Icon.arrowUp} Pending
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                    {Icon.arrowDown} Synced
                  </span>
                )}
              </div>
              {stats?.errors.pendingSync ? (
                <p className="font-display text-xl text-red-400">—</p>
              ) : (
                <p className="font-display text-3xl text-teal-950 dark:text-white leading-none">
                  {(stats?.pendingSync ?? 0).toLocaleString()}
                </p>
              )}
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1.5">Pending Sync</p>
              <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-500">visits awaiting synchronisation</p>
            </button>

            {/* 4. High-Risk Flagged — clickable → Flagged Patients view */}
            <button
              type="button"
              onClick={() => setActiveNav("flagged")}
              className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-500/30 p-5 hover:border-rose-300 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">{Icon.alertStat}</div>
                {(stats?.highRiskFlagged ?? 0) > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600">
                    {Icon.arrowUp} High
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">Live</span>
                )}
              </div>
              {stats?.errors.highRiskFlagged ? (
                <p className="font-display text-xl text-red-400">—</p>
              ) : (
                <p className="font-display text-3xl text-teal-950 dark:text-white leading-none">
                  {(stats?.highRiskFlagged ?? 0).toLocaleString()}
                </p>
              )}
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1.5">High-Risk Flagged</p>
              <p className="text-xs mt-0.5 text-rose-500 font-medium">View flagged patients →</p>
            </button>

          </div>
          )}

          {/* Chart + clinic breakdown */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Line chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 lg:p-6 transition-colors">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Patient Visits</h2>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="font-display text-2xl text-teal-950 dark:text-white">{totalRangeVisits.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      total in {range === "7d" ? "past 7 days" : range === "30d" ? "past 30 days" : "past 90 days"} · avg {avgRangeVisits}/day
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  {(["7d", "30d", "90d"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                        range === r ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
                    </button>
                  ))}
                </div>
              </div>

              <VisitsLineChart data={chartData} loading={chartLoading} />

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-3 h-0.5 rounded-full bg-teal-600" />
                  Daily visits ({profile?.clinic_id ? "Assigned clinic" : "All clinics"})
                </span>
                {peakDay && peakDay.visits > 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                    Peak: {peakDay.date}, {peakDay.visits} visits
                  </span>
                )}
              </div>
            </div>

            {/* Clinic breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 lg:p-6 transition-colors">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Top Clinics Today</h2>
                <button
                  onClick={() => setActiveNav("ops-map")}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
                >
                  Ops Map
                  {Icon.chevronRight}
                </button>
              </div>
              <div className="space-y-4">
                {clinicsLoading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="animate-pulse space-y-1.5">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : clinicsActivity.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No clinics recorded in system.
                  </div>
                ) : (
                  clinicsActivity.map((c) => {
                    return (
                      <div key={c.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{c.name}</p>
                            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {c.zone ?? "Zone not specified"}
                            </span>
                          </div>
                          <span className="font-display text-lg text-teal-950 dark:text-white flex-shrink-0 ml-3">
                            {c.visits}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all"
                            style={{ width: `${Math.max(c.share, c.visits > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="h-2" />
          </>)}
          </>)}
        </main>
        )}
      </div>
    </div>
  );
}
