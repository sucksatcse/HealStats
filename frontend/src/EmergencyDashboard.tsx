import { useState, useEffect } from "react"
import {
  fetchEmergencyMetrics,
  type EmergencyMetrics,
} from "./lib/adminService"
import { useAuth } from "./AuthContext"

// ── Icons ────────────────────────────────────────────────────────────────────────
const Icon = {
  pin: (
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
        d="M10 18s6-5.3 6-10a6 6 0 10-12 0c0 4.7 6 10 6 10z"
      />
      <circle cx="10" cy="8" r="2.2" />
    </svg>
  ),
  users: (
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
        d="M14 17v-1.5a3 3 0 00-3-3H6a3 3 0 00-3 3V17M8.5 9.5a3 3 0 100-6 3 3 0 000 6zM17 17v-1.5a3 3 0 00-2.3-2.9M13 3.6a3 3 0 010 5.8"
      />
    </svg>
  ),
  supply: (
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
        d="M3 7l7-4 7 4v6l-7 4-7-4V7zM3 7l7 4 7-4M10 11v6"
      />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-3.5 h-3.5"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 4.5v3.75l2.5 1.5" />
    </svg>
  ),
  arrowRight: (
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
  pulse: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 10h3l2-5 3 10 2-7 1.5 2H18"
      />
    </svg>
  ),
  bell: (
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
        d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
      />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
    </svg>
  ),
}

const SEVERITY_CONFIG: Record<
  string,
  { chip: string; bar: string; dot: string; border: string }
> = {
  Critical: {
    chip: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/60",
    bar: "bg-red-500",
    dot: "bg-red-500",
    border: "border-l-red-500",
  },
  Severe: {
    chip: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900/60",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
    border: "border-l-orange-500",
  },
  Elevated: {
    chip: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    border: "border-l-amber-500",
  },
  Stable: {
    chip: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
  },
}

const LEVEL_CLS: Record<string, string> = {
  Critical: "bg-red-500 text-white",
  Severe: "bg-orange-500 text-white",
  Elevated: "bg-amber-500 text-white",
}

const supplyTone = (v: number) =>
  v < 35 ? "bg-red-500" : v < 60 ? "bg-orange-500" : "bg-emerald-500"

// ── SOS Broadcast Modal ────────────────────────────────────────────────────────
function BroadcastModal({
  zones,
  onClose,
  onDispatched,
}: {
  zones: string[]
  onClose: () => void
  onDispatched: (msg: string) => void
}) {
  const [incidentType, setIncidentType] = useState("Monsoon Flash Flood")
  const [targetZone, setTargetZone] = useState(zones[0] || "All District Zones")
  const [message, setMessage] = useState(
    "High flood waters rising rapidly. Transition to SOS triage protocol. Prioritize dehydration and hypothermia cases."
  )
  const [sending, setSending] = useState(false)

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    const alertItem = {
      id: Date.now().toString(),
      type: incidentType,
      zone: targetZone,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      const existing = localStorage.getItem("healstats_emergency_broadcasts")
      const list = existing ? JSON.parse(existing) : []
      localStorage.setItem("healstats_emergency_broadcasts", JSON.stringify([alertItem, ...list]))
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSending(false)
      onDispatched(`Emergency broadcast sent: ${incidentType} (${targetZone})`)
      onClose()
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/60 w-full max-w-md animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-950/40">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
              {Icon.bell}
            </span>
            <div>
              <h3 className="font-display text-lg text-red-950 dark:text-red-200">
                Broadcast SOS Alert
              </h3>
              <p className="text-xs text-red-700/80 dark:text-red-400">
                Transmit instant crisis advisory to field clinics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            {Icon.close}
          </button>
        </div>

        <form onSubmit={handleBroadcast} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Incident Classification
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="Monsoon Flash Flood">Monsoon Flash Flood</option>
              <option value="Cyclone Warning">Cyclone Warning & Evacuation</option>
              <option value="Waterborne Outbreak">Waterborne Outbreak (Cholera/Diarrhea)</option>
              <option value="Medical Supply Shortage">Critical Medical Supplies Exhausted</option>
              <option value="Mass Casualty Incident">Mass Casualty Incident</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Target Emergency Zone
            </label>
            <select
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="All District Zones">All District Zones (Broadcast Wide)</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Advisory Directives
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
            />
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
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md shadow-red-600/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              {sending ? "Transmitting…" : "Broadcast Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Emergency Dashboard ───────────────────────────────────────────────────
export default function EmergencyDashboard({
  onViewPatient,
  onOpenTriageQueue,
}: {
  onViewPatient?: (patientId: string) => void
  onOpenTriageQueue?: () => void
} = {}) {
  const { profile } = useAuth()
  const [data, setData] = useState<EmergencyMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [toast, setToast] = useState("")

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3200)
  }

  const loadMetrics = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const res = await fetchEmergencyMetrics(profile?.clinic_id ?? null)
      if (res.error) {
        setFetchError(res.error)
      } else {
        setData(res.data)
      }
    } catch (err) {
      console.error("[EmergencyDashboard] Error:", err)
      setFetchError("Failed to connect to live crisis monitoring service.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [profile?.clinic_id])

  return (
    <div className="space-y-6">
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-5 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60" />
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800" />
        </div>
      )}

      {/* Error Banner */}
      {!isLoading && fetchError && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-5 py-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Crisis Data Unavailable
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">{fetchError}</p>
          </div>
          <button
            type="button"
            onClick={loadMetrics}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Live Crisis Data */}
      {!isLoading && !fetchError && data && (
        <>
          {/* Crisis summary strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Active Zones",
                value: data.activeZonesCount,
                note: "under crisis response",
                icon: Icon.pin,
              },
              {
                label: "Total Cases (48h)",
                value: data.totalCases,
                note: "acute presentations",
                icon: Icon.pulse,
              },
              {
                label: "Critical in Queue",
                value: data.criticalInQueueCount,
                note: "awaiting immediate care",
                icon: Icon.clock,
              },
              {
                label: "Responders Deployed",
                value: data.respondersDeployed,
                note: "across clinic zones",
                icon: Icon.users,
              },
            ].map(({ label, value, note, icon }) => (
              <div
                key={label}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-5 shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <p className="font-display text-3xl text-red-950 dark:text-red-200 leading-none font-bold">
                  {value}
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1.5">
                  {label}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
                  {note}
                </p>
              </div>
            ))}
          </div>

          {/* Active zones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400">{Icon.pin}</span>
                <h2 className="font-semibold text-red-950 dark:text-red-200 text-base">
                  Active Emergency Zones & Clinics
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {data.zones.length} zones monitored
              </span>
            </div>

            {data.zones.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
                No active crisis zones detected in the district.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {data.zones.map((z) => {
                  const s = SEVERITY_CONFIG[z.severity] || SEVERITY_CONFIG.Stable
                  return (
                    <div
                      key={z.zone}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border-l-4 border border-red-100 dark:border-red-950/60 ${s.border} p-5 shadow-sm`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                            {z.zone}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            {z.clinicName} · {z.cause}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${s.chip}`}
                        >
                          {z.severity}
                        </span>
                      </div>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="font-display text-3xl text-red-950 dark:text-red-200 leading-none font-bold">
                            {z.cases}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">active cases</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-1 rounded-full">
                          ▲ {z.trend} this shift
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
                        {z.eta}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Triage queue + resources */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Triage queue */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-950/60 bg-red-50/60 dark:bg-red-950/30">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 dark:text-red-400">{Icon.pulse}</span>
                  <h2 className="font-semibold text-red-950 dark:text-red-200 text-base">
                    Triage Priority Queue
                  </h2>
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-full">
                    {data.triageQueue.length} priority · sorted by urgency
                  </span>
                </div>
                {onOpenTriageQueue && (
                  <button
                    type="button"
                    onClick={onOpenTriageQueue}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Full Triage Queue</span>
                    {Icon.arrowRight}
                  </button>
                )}
              </div>

              {data.triageQueue.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    {Icon.check}
                  </div>
                  No high-risk patients currently waiting in the triage queue.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.triageQueue.map((t, i) => (
                    <div
                      key={t.id + i}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-colors flex-wrap sm:flex-nowrap"
                    >
                      <span className="font-display text-lg text-red-300 dark:text-red-700 w-5 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {t.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {t.name}{" "}
                          <span className="font-normal text-slate-400 text-xs">
                            · {t.age}y · {t.gender} · {t.zone}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {t.complaint}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="font-display text-xl text-red-600 dark:text-red-400 leading-none font-bold">
                          {t.score}/5
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          {Icon.clock} {t.wait}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                          LEVEL_CLS[t.level] || "bg-red-500 text-white"
                        }`}
                      >
                        {t.level}
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewPatient?.(t.patientId)}
                        className="flex items-center gap-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-xl transition-colors flex-shrink-0 cursor-pointer shadow-sm"
                      >
                        Dispatch
                        {Icon.arrowRight}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resource allocation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-950/60 bg-red-50/60 dark:bg-red-950/30">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">{Icon.supply}</span>
                    <h2 className="font-semibold text-red-950 dark:text-red-200 text-base">
                      Resource Deployment
                    </h2>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {data.resources.map((r) => {
                    const volPct = Math.min(
                      100,
                      Math.round((r.volunteers / r.volNeed) * 100)
                    )
                    const volShort = r.volunteers < r.volNeed
                    return (
                      <div key={r.zone} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                          {r.zone}
                        </p>
                        {/* Responders */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              {Icon.users} Deployed Staff
                            </span>
                            <span
                              className={`font-semibold ${
                                volShort ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {r.volunteers}/{r.volNeed} staff
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                volShort ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${volPct}%` }}
                            />
                          </div>
                        </div>
                        {/* Supplies */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              {Icon.supply} Emergency Stock
                            </span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {r.supplies}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${supplyTone(r.supplies)}`}
                              style={{ width: `${r.supplies}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  {Icon.bell}
                  Broadcast SOS Protocol
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SOS Broadcast Modal */}
      {showBroadcastModal && data && (
        <BroadcastModal
          zones={data.zones.map((z) => z.zone)}
          onClose={() => setShowBroadcastModal(false)}
          onDispatched={flash}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            {Icon.check}
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
