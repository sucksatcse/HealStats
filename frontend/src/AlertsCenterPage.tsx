import { useState, useEffect, useCallback } from "react"
import { fetchLiveWeatherAlerts, RegionalWeatherHazard } from "./lib/weatherAlertService"
import { supabase, supabaseConfigured } from "./lib/supabase"

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  flag: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12s1-1 3.5-1 3.5 2 6 2 3.5-1 3.5-1V4s-1 1-3.5 1S13 3 10.5 3 7 4 7 4M4 3v14"
      />
    </svg>
  ),
  sync: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v4h.5m11 8v-4H15m1.4-2A6.5 6.5 0 004.6 6.5M3.6 11.5a6.5 6.5 0 0011.8 3"
      />
    </svg>
  ),
  staff: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 17v-1.5a3 3 0 00-3-3H6a3 3 0 00-3 3V17M8.5 9.5a3 3 0 100-6 3 3 0 000 6zM17 17v-1.5a3 3 0 00-2.3-2.9M13 3.6a3 3 0 010 5.8"
      />
    </svg>
  ),
  alert: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 7v3.5m0 3h.01M8.575 3.217L1.516 15a1.667 1.667 0 001.425 2.5h14.118A1.667 1.667 0 0018.484 15L11.425 3.217a1.667 1.667 0 00-2.85 0z"
      />
    </svg>
  ),
  bell: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.86 15.08a20 20 0 004.55-1.09A7.47 7.47 0 0117 8.13V7.5a5 5 0 00-10 0v.63a7.47 7.47 0 01-1.93 5.86 20 20 0 004.55 1.09m5.24 0a20.2 20.2 0 01-5.24 0m5.24 0a2.5 2.5 0 01-5.24 0"
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 8-8" />
    </svg>
  ),
  arrow: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8h10M9 4l4 4-4 4"
      />
    </svg>
  ),
  refresh: (
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
        d="M1.75 8a6.25 6.25 0 101.5-4.04M1.75 2v2.5H4.25"
      />
    </svg>
  ),
  cloud: (
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
        d="M5.5 14a3.5 3.5 0 01-.36-6.98 5 5 0 019.72-1.39A3.5 3.5 0 0116.5 14H5.5z"
      />
    </svg>
  ),
  inbox: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"
      />
    </svg>
  ),
}

// ── Alert types ──────────────────────────────────────────────────────────────────
type Kind = "urgent" | "sync" | "staff" | "emergency"

const TYPE_META: Record<Kind, {
  label: string
  icon: React.ReactNode
  ring: string
  iconCls: string
  dot: string
}> = {
  urgent: {
    label: "High-Urgency Patient",
    icon: Icon.flag,
    ring: "border-l-red-500",
    iconCls: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    dot: "bg-red-500",
  },
  emergency: {
    label: "Disaster & Weather Risk",
    icon: Icon.alert,
    ring: "border-l-orange-500",
    iconCls: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  staff: {
    label: "Staff Account",
    icon: Icon.staff,
    ring: "border-l-violet-500",
    iconCls: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  sync: {
    label: "Sync & Queue",
    icon: Icon.sync,
    ring: "border-l-emerald-500",
    iconCls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
}

export interface Alert {
  id: string | number
  kind: Kind
  title: string
  message: string
  time: string
  group: "Today" | "Yesterday" | "Earlier"
  read: boolean
  cta?: string
  actionUrl?: string
}

const BASE_FALLBACK_ALERTS: Alert[] = [
  {
    id: "fb-1",
    kind: "urgent",
    title: "High-urgency patient protocol active",
    message:
      "Triage radar actively monitors patient intakes for urgency scores 4-5 across all connected rural stations.",
    time: "Ongoing",
    group: "Today",
    read: false,
    cta: "Open triage queue",
    actionUrl: "emergency-triage",
  },
  {
    id: "fb-2",
    kind: "sync",
    title: "Sync Engine online & resilient",
    message:
      "Background sync monitors network connectivity. Queued patient visits in Dexie upload automatically on reconnect.",
    time: "1 hr ago",
    group: "Today",
    read: true,
    cta: "View sync monitor",
    actionUrl: "sync-monitor",
  },
]

const FILTERS: { key: Kind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "urgent", label: "High-Urgency" },
  { key: "emergency", label: "Disaster & Weather" },
  { key: "staff", label: "Staff" },
  { key: "sync", label: "Sync" },
]

const GROUPS: Alert["group"][] = ["Today", "Yesterday", "Earlier"]

export default function AlertsCenterPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [alerts, setAlerts] = useState<Alert[]>(BASE_FALLBACK_ALERTS)
  const [weatherHazards, setWeatherHazards] = useState<RegionalWeatherHazard[]>([])
  const [filter, setFilter] = useState<Kind | "all">("all")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<string>("")

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch live meteorological & disaster hazard feeds
      const hazards = await fetchLiveWeatherAlerts()
      setWeatherHazards(hazards)

      const liveAlerts: Alert[] = []

      // Convert critical/warning weather hazards into emergency alerts
      hazards.forEach((h) => {
        if (h.riskLevel !== "normal") {
          liveAlerts.push({
            id: `weather-${h.id}`,
            kind: "emergency",
            title: h.hazardTitle,
            message: `${h.advisoryText} (Recorded: Wind ${h.windSpeed}km/h, Rain ${h.precipitation}mm, Temp ${h.temperature}°C).`,
            time: "Live meteorological feed",
            group: "Today",
            read: false,
            cta: "View emergency mode",
            actionUrl: "emergency-triage",
          })
        }
      })

      // 1b. Live field emergency reports submitted by clinic nurses/workers
      try {
        const savedReports = localStorage.getItem("healstats_emergency_reports")
        if (savedReports) {
          const reports = JSON.parse(savedReports)
          reports.slice(0, 10).forEach((rep: any) => {
            liveAlerts.push({
              id: `field-report-${rep.id}`,
              kind: "emergency",
              title: `Field SOS: ${rep.incidentType} · ${rep.location}`,
              message: `Ref: ${rep.reference} · Severity: ${rep.severity.toUpperCase()} · ${rep.affected} people affected${rep.locationCoords ? ` · GPS: [${rep.locationCoords.lat.toFixed(4)}°, ${rep.locationCoords.lng.toFixed(4)}°]` : ""}${rep.notes ? ` · Notes: ${rep.notes}` : ""}`,
              time: rep.displayDate || "Recent field report",
              group: "Today",
              read: false,
              cta: "View in Ops Map",
              actionUrl: "ops-map",
            })
          })
        }
      } catch {
        // ignore
      }

      // 2. Fetch live clinical alerts from Supabase if configured and online
      if (supabaseConfigured && navigator.onLine) {
        try {
          // A. High-urgency recent visits (urgency_score >= 4)
          const { data: visits } = await supabase
            .from("visits")
            .select("id, urgency_score, symptoms, diagnosis, created_at, patients(name, village)")
            .gte("urgency_score", 4)
            .order("created_at", { ascending: false })
            .limit(6)

          if (visits && visits.length > 0) {
            visits.forEach((v: any) => {
              const p = Array.isArray(v.patients) ? v.patients[0] : v.patients
              const pName = p?.name ?? "Patient"
              const village = p?.village ? ` (${p.village})` : ""
              liveAlerts.push({
                id: `visit-${v.id}`,
                kind: "urgent",
                title: `Urgent Case: ${pName}${village} · Urgency ${v.urgency_score}/5`,
                message: `Symptoms: ${v.symptoms || "High-risk indicator"}. Diagnosis: ${v.diagnosis || "Under clinical evaluation"}. Immediate attention flagged.`,
                time: new Date(v.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                group: "Today",
                read: false,
                cta: "Review triage queue",
                actionUrl: "emergency-triage",
              })
            })
          }

          // B. Recent sync log entries
          const { data: syncs } = await supabase
            .from("sync_log")
            .select("id, status, timestamp, device_id")
            .order("timestamp", { ascending: false })
            .limit(3)

          if (syncs && syncs.length > 0) {
            syncs.forEach((s: any) => {
              liveAlerts.push({
                id: `sync-${s.id}`,
                kind: "sync",
                title: `Sync Batch ${s.status === "completed" ? "Successfully Uploaded" : "Reported: " + s.status}`,
                message: `Device ${s.device_id || "Field station"} completed sync cycle. Records verified in Supabase cluster.`,
                time: new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                group: "Today",
                read: true,
                cta: "View sync monitor",
                actionUrl: "sync-monitor",
              })
            })
          }
        } catch (dbErr) {
          console.warn("[HealStats] Error querying Supabase alerts:", dbErr)
        }
      }

      // Merge with fallback baseline so screen is never blank
      const merged = [
        ...liveAlerts,
        ...BASE_FALLBACK_ALERTS.filter((fb) => !liveAlerts.some((l) => l.title === fb.title)),
      ]

      setAlerts(merged)
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    } catch (err) {
      console.error("[HealStats] Failed to load alerts:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const unreadCount = alerts.filter((a) => !a.read).length

  const markAll = () =>
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))

  const toggleRead = (id: string | number) =>
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: !a.read } : a)),
    )

  const dismiss = (id: string | number) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id))

  const visible = alerts.filter(
    (a) => (filter === "all" || a.kind === filter) && (!unreadOnly || !a.read),
  )

  const activeHazardsCount = weatherHazards.filter((h) => h.riskLevel !== "normal").length

  return (
    <div className="max-w-3xl mx-auto pb-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center relative flex-shrink-0 shadow-sm shadow-teal-600/20">
            {Icon.bell}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-50 dark:border-slate-950">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-teal-950 dark:text-white leading-tight">
                Alerts & Notifications
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up"}
              {lastRefreshed && ` · Refreshed at ${lastRefreshed}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            title="Refresh feeds"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition-all hover:shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span className={isLoading ? "animate-spin" : ""}>{Icon.refresh}</span>
            Refresh
          </button>
          <button
            onClick={markAll}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 disabled:text-slate-400 disabled:bg-slate-100 dark:text-teal-300 dark:hover:text-teal-200 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:disabled:text-slate-500 dark:disabled:bg-slate-800 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            {Icon.check} Mark all as read
          </button>
        </div>
      </div>

      {/* ── Live Weather & Meteorological Radar Bar ── */}
      <div className="mb-6 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 bg-gradient-to-r from-teal-50/70 via-cyan-50/40 to-slate-50 dark:from-teal-950/30 dark:via-cyan-950/20 dark:to-slate-900 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              {Icon.cloud}
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 dark:text-white">
                Live Environmental & Climate Hazards Radar
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct meteorological sensor stream for Bangladesh coastal & riverine clinics
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              activeHazardsCount > 0
                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
            }`}
          >
            {activeHazardsCount > 0 ? `${activeHazardsCount} Active Hazard Advisory` : "All Stations Calm"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {weatherHazards.map((h) => {
            const isWarn = h.riskLevel === "warning" || h.riskLevel === "critical"
            return (
              <div
                key={h.id}
                className={`p-3 rounded-xl border transition-all ${
                  isWarn
                    ? "bg-white/90 dark:bg-slate-900 border-orange-300 dark:border-orange-900/60 shadow-xs"
                    : "bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <span className="truncate" title={h.region}>
                    {h.region}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      h.riskLevel === "critical"
                        ? "bg-red-500 animate-ping"
                        : h.riskLevel === "warning"
                          ? "bg-orange-500"
                          : h.riskLevel === "advisory"
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                    }`}
                  />
                </div>
                <div className="flex items-baseline justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{h.temperature}°C</span>
                  <span>{h.windSpeed} km/h wind</span>
                  <span>{h.precipitation} mm rain</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-1">
                  {h.zone}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => {
          const active = filter === f.key
          const count =
            f.key === "all"
              ? alerts.length
              : alerts.filter((a) => a.kind === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                active
                  ? "bg-teal-600 border-teal-600 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-teal-700 dark:hover:text-teal-300"
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] ${
                  active ? "text-teal-100" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 ml-auto cursor-pointer select-none">
          <span className="relative inline-flex">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            <span className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 peer-checked:bg-teal-500 transition-colors" />
            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </span>
          Unread only
        </label>
      </div>

      {/* ── List ── */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600 flex items-center justify-center mx-auto mb-3">
            {Icon.inbox}
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nothing here</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            No notifications match this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const items = visible.filter((a) => a.group === group)
            if (items.length === 0) return null
            return (
              <div key={group}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 px-1">
                  {group}
                </p>
                <div className="space-y-2.5">
                  {items.map((a) => {
                    const m = TYPE_META[a.kind]
                    return (
                      <div
                        key={a.id}
                        className={`group relative bg-white rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 border-l-4 ${m.ring} px-4 py-3.5 flex gap-3.5 transition-all hover:shadow-md ${
                          a.read ? "" : "ring-1 ring-teal-500/10"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.iconCls}`}
                        >
                          {m.icon}
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p
                              className={`text-sm leading-snug ${
                                a.read
                                  ? "font-medium text-slate-700 dark:text-slate-200"
                                  : "font-bold text-slate-900 dark:text-white"
                              }`}
                            >
                              {a.title}
                            </p>
                            {!a.read && (
                              <span
                                className={`w-2 h-2 rounded-full ${m.dot} flex-shrink-0 mt-1.5`}
                              />
                            )}
                            <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0 mt-0.5">
                              {a.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                            {a.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2.5">
                            {a.cta && (
                              <button
                                onClick={() => a.actionUrl && onNavigate?.(a.actionUrl)}
                                className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 transition-colors cursor-pointer"
                              >
                                {a.cta} {Icon.arrow}
                              </button>
                            )}
                            <button
                              onClick={() => toggleRead(a.id)}
                              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            >
                              {a.read ? "Mark unread" : "Mark read"}
                            </button>
                            <button
                              onClick={() => dismiss(a.id)}
                              className="text-xs font-medium text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
