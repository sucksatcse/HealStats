import { useState, useEffect, useRef } from "react"

// ── Icons ────────────────────────────────────────────────────────────────────────
const Icon = {
  sync: (
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
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  online: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M.01 11.646a14.422 14.422 0 0119.98 0A.75.75 0 0119.16 13a12.922 12.922 0 00-17.32 0 .75.75 0 11-.992-1.124.75.75 0 01.162-.23zM3.22 14.86a9.42 9.42 0 0113.56 0 .75.75 0 01-1.08 1.044 7.92 7.92 0 00-11.4 0A.75.75 0 013.22 14.86zM6.44 18.07a4.42 4.42 0 017.12 0 .75.75 0 01-1.2.9 2.92 2.92 0 00-4.72 0 .75.75 0 01-1.2-.9zM10 20a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  offline: (
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
        d="M2 2l16 16M8.5 8.6A3 3 0 0111.4 11.5M5 5.2A9 9 0 002 8s3 5.5 8 5.5M13.5 6.2A9 9 0 0118 8M10 16.5h.01"
      />
    </svg>
  ),
  device: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-4 h-4"
    >
      <rect x="5" y="2" width="10" height="16" rx="2.5" />
      <path strokeLinecap="round" d="M9 15.5h2" />
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
  stack: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 2l6 3-6 3-6-3 6-3zM2 8l6 3 6-3M2 11l6 3 6-3"
      />
    </svg>
  ),
}

// ── Data ───────────────────────────────────────────────────────────────────────
type DeviceStatus = "online" | "syncing" | "offline"

type Worker = {
  id: string
  name: string
  zone: string
  device: string
  status: DeviceStatus
  lastSync: string
  pending: number
  battery: number
  initials: string
  color: string
}

const INITIAL: Worker[] = [
  {
    id: "HW-20451",
    name: "Sr. Amara Diallo",
    zone: "Kayes District",
    device: "Tablet · A-114",
    status: "online",
    lastSync: "Just now",
    pending: 0,
    battery: 82,
    initials: "AD",
    color: "bg-teal-100 text-teal-700",
  },
  {
    id: "HW-20388",
    name: "Ibrahim Traoré",
    zone: "Sikasso Rural",
    device: "Phone · P-207",
    status: "syncing",
    lastSync: "Syncing…",
    pending: 6,
    battery: 54,
    initials: "IT",
    color: "bg-violet-100 text-violet-700",
  },
  {
    id: "HW-20502",
    name: "Dr. Fanta Diallo",
    zone: "Ségou Centre",
    device: "Tablet · A-089",
    status: "online",
    lastSync: "3 min ago",
    pending: 2,
    battery: 91,
    initials: "FD",
    color: "bg-sky-100 text-sky-700",
  },
  {
    id: "HW-20219",
    name: "Kadiatou Baldé",
    zone: "Mopti Outreach",
    device: "Phone · P-142",
    status: "offline",
    lastSync: "6 hrs ago",
    pending: 28,
    battery: 12,
    initials: "KB",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "HW-20477",
    name: "Sekou Bah",
    zone: "Dhading Community",
    device: "Tablet · A-201",
    status: "online",
    lastSync: "8 min ago",
    pending: 1,
    battery: 67,
    initials: "SB",
    color: "bg-rose-100 text-rose-700",
  },
  {
    id: "HW-20344",
    name: "Oumar Coulibaly",
    zone: "Kayes District",
    device: "Phone · P-318",
    status: "offline",
    lastSync: "1 day ago",
    pending: 41,
    battery: 0,
    initials: "OC",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "HW-20515",
    name: "Aminata Sané",
    zone: "Ségou Centre",
    device: "Tablet · A-156",
    status: "syncing",
    lastSync: "Syncing…",
    pending: 14,
    battery: 45,
    initials: "AS",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "HW-20291",
    name: "Mariama Kouyaté",
    zone: "Sikasso Rural",
    device: "Phone · P-093",
    status: "online",
    lastSync: "22 min ago",
    pending: 3,
    battery: 78,
    initials: "MK",
    color: "bg-pink-100 text-pink-700",
  },
]

const STATUS_META: Record<DeviceStatus, {
  label: string
  text: string
  dot: string
  ring: string
  chip: string
}> = {
  online: {
    label: "Online",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "border-emerald-200",
    chip: "bg-emerald-50 text-emerald-700",
  },
  syncing: {
    label: "Syncing",
    text: "text-teal-700",
    dot: "bg-teal-500 animate-pulse",
    ring: "border-teal-200",
    chip: "bg-teal-50 text-teal-700",
  },
  offline: {
    label: "Offline",
    text: "text-slate-500",
    dot: "bg-slate-400",
    ring: "border-slate-200",
    chip: "bg-slate-100 text-slate-500",
  },
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SyncMonitorPage() {
  const [workers, setWorkers] = useState<Worker[]>(INITIAL)
  const [forcing, setForcing] = useState(false)
  const [toast, setToast] = useState("")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const onlineCount = workers.filter((w) => w.status === "online").length
  const syncingCount = workers.filter((w) => w.status === "syncing").length
  const offlineCount = workers.filter((w) => w.status === "offline").length
  const totalPending = workers.reduce((s, w) => s + w.pending, 0)

  const forceSyncAll = () => {
    if (forcing) return
    setForcing(true)
    // Mark every non-offline worker as syncing
    setWorkers((prev) =>
      prev.map((w) =>
        w.status === "offline"
          ? w
          : { ...w, status: "syncing", lastSync: "Syncing…" },
      ),
    )
    const t = setTimeout(() => {
      setWorkers((prev) =>
        prev.map((w) =>
          w.status === "offline"
            ? w
            : { ...w, status: "online", lastSync: "Just now", pending: 0 },
        ),
      )
      setForcing(false)
      setToast("Sync complete for all reachable devices")
      const t2 = setTimeout(() => setToast(""), 2800)
      timers.current.push(t2)
    }, 2400)
    timers.current.push(t)
  }

  const syncOne = (id: string) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === id && w.status !== "offline"
          ? { ...w, status: "syncing", lastSync: "Syncing…" }
          : w,
      ),
    )
    const t = setTimeout(() => {
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === id && w.status === "syncing"
            ? { ...w, status: "online", lastSync: "Just now", pending: 0 }
            : w,
        ),
      )
    }, 1600)
    timers.current.push(t)
  }

  const batteryColor = (b: number) =>
    b === 0
      ? "bg-red-400"
      : b < 20
        ? "bg-red-400"
        : b < 50
          ? "bg-amber-400"
          : "bg-emerald-500"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
            Sync Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time sync status across {workers.length} field devices ·{" "}
            {totalPending} records pending
          </p>
        </div>
        <button
          onClick={forceSyncAll}
          disabled={forcing}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-wait text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
        >
          <span className={forcing ? "animate-spin" : ""}>{Icon.sync}</span>
          {forcing ? "Syncing all devices…" : "Force Sync All"}
        </button>
      </div>

      {/* Summary + legend strip */}
      <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-4">
        {/* Counts */}
        <div className="flex items-center gap-6">
          {[
            { label: "Online", count: onlineCount, dot: "bg-emerald-500" },
            { label: "Syncing", count: syncingCount, dot: "bg-teal-500" },
            { label: "Offline", count: offlineCount, dot: "bg-slate-400" },
          ].map(({ label, count, dot }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <div>
                <p className="font-display text-xl text-teal-950 leading-none">
                  {count}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="h-8 w-px bg-slate-100 hidden sm:block" />

        {/* Pending total */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            {Icon.stack}
          </span>
          <div>
            <p className="font-display text-xl text-teal-950 leading-none">
              {totalPending}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Records queued
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 ml-auto text-[11px] font-medium text-slate-500">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Legend
          </span>
          {(["online", "syncing", "offline"] as DeviceStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Worker card grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {workers.map((w) => {
          const meta = STATUS_META[w.status]
          return (
            <div
              key={w.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                w.status === "offline" ? "border-slate-100" : meta.ring
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${w.color}`}
                >
                  {w.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {w.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {w.zone} · {w.id}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${meta.chip}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>

              {/* Device + battery */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-slate-400">{Icon.device}</span>
                  {w.device}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <span
                      className={`block h-full rounded-full ${batteryColor(w.battery)}`}
                      style={{ width: `${w.battery}%` }}
                    />
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 w-8 text-right">
                    {w.battery}%
                  </span>
                </span>
              </div>

              {/* Sync detail */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-slate-400">{Icon.clock}</span>
                  {w.lastSync}
                </span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    w.pending === 0
                      ? "text-emerald-600"
                      : w.pending > 20
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                >
                  <span
                    className={
                      w.pending === 0 ? "text-emerald-400" : "text-slate-400"
                    }
                  >
                    {Icon.stack}
                  </span>
                  {w.pending === 0 ? "All synced" : `${w.pending} pending`}
                </span>
              </div>

              {/* Action */}
              <button
                onClick={() => syncOne(w.id)}
                disabled={w.status !== "online" || w.pending === 0}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all ${
                  w.status === "offline"
                    ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                    : w.status === "syncing"
                      ? "bg-teal-50 text-teal-600 cursor-wait"
                      : w.pending === 0
                        ? "bg-emerald-50 text-emerald-600 cursor-default"
                        : "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                }`}
              >
                {w.status === "syncing" ? (
                  <>
                    <span className="animate-spin">{Icon.sync}</span> Syncing…
                  </>
                ) : w.status === "offline" ? (
                  <>
                    <span>{Icon.offline}</span> Device unreachable
                  </>
                ) : w.pending === 0 ? (
                  <>Up to date</>
                ) : (
                  <>
                    <span>{Icon.sync}</span> Sync now
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-teal-950 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
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
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
