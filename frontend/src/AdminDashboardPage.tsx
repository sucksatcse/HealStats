import { useState, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fetchAdminStats, type AdminStats } from "./lib/adminService";
import AppNavbar from "./AppNavbar";
import { useLang } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import StaffPage from "./StaffPage";
import PatientRecordsPage from "./PatientRecordsPage";
import SyncMonitorPage from "./SyncMonitorPage";
import FlaggedPatientsPage from "./FlaggedPatientsPage";
import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SettingsPage";
import EmergencyDashboard from "./EmergencyDashboard";
import ResourceAllocationPage from "./ResourceAllocationPage";
import AlertsCenterPage from "./AlertsCenterPage";
import ClinicOpsPanel from "./ClinicOpsPanel";

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
  { id: "sync", label: "Sync Status", icon: Icon.sync, badge: "14" },
  { id: "analytics", label: "Analytics", icon: Icon.analytics },
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

// ── Weekly visits data ───────────────────────────────────────────────────────────
const WEEK = [
  { day: "Mon", date: "Aug 22", visits: 312 },
  { day: "Tue", date: "Aug 23", visits: 389 },
  { day: "Wed", date: "Aug 24", visits: 274 },
  { day: "Thu", date: "Aug 25", visits: 421 },
  { day: "Fri", date: "Aug 26", visits: 468 },
  { day: "Sat", date: "Aug 27", visits: 356 },
  { day: "Sun", date: "Aug 28", visits: 436 },
];

// ── Clinic breakdown for right column ──────────────────────────────────────────────
const CLINICS = [
  { name: "Kayes District Clinic", visits: 128, share: 92, status: "online" },
  { name: "Dhading Community Hosp.", visits: 96, share: 71, status: "online" },
  { name: "Sikasso Rural Post", visits: 74, share: 54, status: "syncing" },
  { name: "Ségou Health Centre", visits: 61, share: 44, status: "offline" },
  { name: "Mopti Outreach Unit", visits: 38, share: 27, status: "offline" },
];

const CLINIC_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  online: { label: "Online", cls: "text-emerald-600", dot: "bg-emerald-500" },
  syncing: { label: "Syncing", cls: "text-teal-600", dot: "bg-teal-500 animate-pulse" },
  offline: { label: "Offline", cls: "text-slate-400", dot: "bg-slate-300" },
};

// ── Line chart ─────────────────────────────────────────────────────────────────────
function VisitsLineChart() {
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 260;
  const padX = 44;
  const padTop = 24;
  const padBottom = 40;

  const values = WEEK.map((d) => d.visits);
  const maxV = 500;
  const minV = 200;

  const geometry = useMemo(() => {
    const innerW = W - padX * 2;
    const innerH = H - padTop - padBottom;
    return WEEK.map((d, i) => {
      const x = padX + (innerW * i) / (WEEK.length - 1);
      const y = padTop + innerH * (1 - (d.visits - minV) / (maxV - minV));
      return { x, y, ...d };
    });
  }, []);

  const linePath = geometry.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${geometry[geometry.length - 1].x},${H - padBottom} L${geometry[0].x},${H - padBottom} Z`;

  const gridLines = [200, 275, 350, 425, 500];
  const innerH = H - padTop - padBottom;

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
        <path d={areaPath} fill="url(#visitsArea)" />
        <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* X labels + hit areas + points */}
        {geometry.map((p, i) => (
          <g key={p.day}>
            <text x={p.x} y={H - padBottom + 20} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="11.5" fontWeight={hover === i ? 700 : 500}>
              {p.day}
            </text>
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
              x={p.x - (W - padX * 2) / (WEEK.length - 1) / 2}
              y={0}
              width={(W - padX * 2) / (WEEK.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-teal-950 text-white rounded-lg px-3 py-2 shadow-lg"
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

  useEffect(() => {
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.clinic_id]);

  const totalWeek = WEEK.reduce((s, d) => s + d.visits, 0);
  const avgWeek = Math.round(totalWeek / WEEK.length);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-[Work_Sans,system-ui,sans-serif] transition-colors">

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
          {NAV_ITEMS.map(({ id, label, icon, badge }) => {
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
              PS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Dr. Priya Suresh</p>
              <p className="text-[10px] text-teal-400">District Health Officer</p>
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
          isOnline={true}
          onlineText="12 clinics online"
          onNotifications={() => setActiveNav("alerts")}
          notificationCount={1}
          userInitials="PS"
          userColor="violet"
          breadcrumb={
            activeNav === "staff" ? "Staff"
            : activeNav === "patients" ? "Patients"
            : activeNav === "sync" ? "Sync Status"
            : activeNav === "flagged" ? "High-Risk Patients"
            : activeNav === "analytics" ? "Analytics"
            : activeNav === "resources" ? "Resource Ops"
            : activeNav === "alerts" ? "Notifications"
            : activeNav === "settings" ? "Settings"
            : activeNav === "ops-map" ? "Ops Map"
            : "Overview"
          }
        />

        {/* Ops map: full-height panel, no padding wrapper */}
        {activeNav === "ops-map" && <ClinicOpsPanel />}

        {/* All other content views */}
        {activeNav !== "ops-map" && (
        <main className={`flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6 transition-colors duration-500 ${
          emergency && !["staff", "patients", "sync", "flagged", "analytics", "resources", "alerts", "settings"].includes(activeNav)
            ? "bg-gradient-to-b from-red-50 to-slate-50"
            : ""
        }`}>

          {activeNav === "staff" && <StaffPage />}
          {activeNav === "patients" && <PatientRecordsPage />}
          {activeNav === "sync" && <SyncMonitorPage />}
          {activeNav === "flagged" && <FlaggedPatientsPage />}
          {activeNav === "analytics" && <AnalyticsPage />}
          {activeNav === "resources" && <ResourceAllocationPage />}
          {activeNav === "alerts" && <AlertsCenterPage />}
          {activeNav === "settings" && <SettingsPage />}

          {!["staff", "patients", "sync", "flagged", "analytics", "resources", "alerts", "settings"].includes(activeNav) && (<>

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
              className={`flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5 ${
                emergency ? "bg-red-600 hover:bg-red-700 shadow-red-600/25" : "bg-teal-600 hover:bg-teal-700 shadow-teal-600/25"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11" />
              </svg>
              {emergency ? "Export Situation Report" : "Export Report"}
            </button>
          </div>

          {emergency ? <EmergencyDashboard /> : (<>

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
                    <span className="font-display text-2xl text-teal-950 dark:text-white">{totalWeek.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">total this week · avg {avgWeek}/day</span>
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

              <VisitsLineChart />

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-3 h-0.5 rounded-full bg-teal-600" />
                  Daily visits (all clinics)
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">Peak: Fri, 468 visits</span>
              </div>
            </div>

            {/* Clinic breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 lg:p-6 transition-colors">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Top Clinics Today</h2>
                <button className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 transition-colors">
                  All
                  {Icon.chevronRight}
                </button>
              </div>
              <div className="space-y-4">
                {CLINICS.map((c) => {
                  const s = CLINIC_STATUS[c.status];
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{c.name}</p>
                          <span className={`flex items-center gap-1.5 text-[11px] font-medium mt-0.5 ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                        <span className="font-display text-lg text-teal-950 dark:text-white flex-shrink-0 ml-3">{c.visits}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${c.share}%` }} />
                      </div>
                    </div>
                  );
                })}
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
