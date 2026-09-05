import { useState, useEffect, useRef } from "react"

// ── Types ──────────────────────────────────────────────────────────────────────
type SyncStatus = "queued" | "syncing" | "synced" | "failed"

interface SyncRecord {
  id: string
  type: "New Patient" | "Visit Record" | "Vitals Entry" | "Digitized Record" | "AI Triage"
  patient: string
  patientId: string
  createdAt: string
  sizeKB: number
  status: SyncStatus
  retries?: number
  syncedAt?: string
}

// ── Data ───────────────────────────────────────────────────────────────────────
const INITIAL_RECORDS: SyncRecord[] = [
  {
    id: "R001",
    type: "Visit Record",
    patient: "Mariama Kouyaté",
    patientId: "PT-00412",
    createdAt: "Today, 09:14",
    sizeKB: 12,
    status: "queued",
  },
  {
    id: "R002",
    type: "Vitals Entry",
    patient: "Ibrahim Traoré",
    patientId: "PT-00389",
    createdAt: "Today, 08:40",
    sizeKB: 4,
    status: "queued",
  },
  {
    id: "R003",
    type: "AI Triage",
    patient: "Mariama Kouyaté",
    patientId: "PT-00412",
    createdAt: "Today, 09:16",
    sizeKB: 7,
    status: "queued",
  },
  {
    id: "R004",
    type: "Digitized Record",
    patient: "Kadiatou Sylla",
    patientId: "PT-00398",
    createdAt: "Today, 08:05",
    sizeKB: 340,
    status: "queued",
  },
  {
    id: "R005",
    type: "Visit Record",
    patient: "Oumar Coulibaly",
    patientId: "PT-00376",
    createdAt: "Yesterday, 15:20",
    sizeKB: 9,
    status: "failed",
    retries: 2,
  },
  {
    id: "R006",
    type: "New Patient",
    patient: "Fatoumata Baldé",
    patientId: "PT-00421",
    createdAt: "Yesterday, 14:55",
    sizeKB: 18,
    status: "queued",
  },
  {
    id: "R007",
    type: "Vitals Entry",
    patient: "Fanta Diallo",
    patientId: "PT-00401",
    createdAt: "Yesterday, 11:30",
    sizeKB: 4,
    status: "synced",
    syncedAt: "Yesterday, 18:02",
  },
  {
    id: "R008",
    type: "Visit Record",
    patient: "Kadiatou Baldé",
    patientId: "PT-00365",
    createdAt: "Aug 26, 10:30",
    sizeKB: 11,
    status: "synced",
    syncedAt: "Aug 26, 20:14",
  },
  {
    id: "R009",
    type: "AI Triage",
    patient: "Sekou Bah",
    patientId: "PT-00358",
    createdAt: "Aug 25, 14:15",
    sizeKB: 6,
    status: "synced",
    syncedAt: "Aug 25, 22:07",
  },
  {
    id: "R010",
    type: "New Patient",
    patient: "Aminata Camara",
    patientId: "PT-00344",
    createdAt: "Aug 24, 09:00",
    sizeKB: 15,
    status: "synced",
    syncedAt: "Aug 24, 19:55",
  },
  {
    id: "R011",
    type: "Visit Record",
    patient: "Moussa Sidibé",
    patientId: "PT-00331",
    createdAt: "Aug 22, 11:45",
    sizeKB: 13,
    status: "synced",
    syncedAt: "Aug 22, 21:30",
  },
  {
    id: "R012",
    type: "Digitized Record",
    patient: "Hawa Keïta",
    patientId: "PT-00319",
    createdAt: "Aug 21, 16:00",
    sizeKB: 280,
    status: "synced",
    syncedAt: "Aug 21, 22:15",
  },
]

const TYPE_ICON: Record<SyncRecord["type"], React.ReactNode> = {
  "New Patient": (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7a3 3 0 100-6 3 3 0 000 6zM1 13a7 7 0 0114 0"
      />
      <path strokeLinecap="round" d="M12 10v4M10 12h4" />
    </svg>
  ),
  "Visit Record": (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <rect x="2" y="1.5" width="12" height="13" rx="1.5" />
      <path strokeLinecap="round" d="M5 5.5h6M5 8h6M5 10.5h3" />
    </svg>
  ),
  "Vitals Entry": (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1 8h2.5l2-4 2.5 8 2-4.5 1.5 2.5H15"
      />
    </svg>
  ),
  "Digitized Record": (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <rect x="3" y="2" width="10" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
      <path strokeLinecap="round" d="M9 2v3l2-1.5" />
    </svg>
  ),
  "AI Triage": (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 1l1.5 3.5L13 5.5 10.5 8l.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-1L8 1z"
      />
    </svg>
  ),
}

const STATUS_CONFIG: Record<SyncStatus, {
  icon: React.ReactNode
  label: string
  row: string
  badge: string
}> = {
  queued: {
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="w-4 h-4 text-slate-400 dark:text-slate-500"
      >
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 2.5v3.25l2.5 1.5.5-.87-2-1.19V5.5h-1z" />
      </svg>
    ),
    label: "Queued",
    row: "hover:bg-slate-50 dark:hover:bg-slate-800",
    badge: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
  syncing: {
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-4 h-4 text-violet-500 dark:text-violet-400 animate-spin"
      >
        <path strokeLinecap="round" d="M8 2a6 6 0 016 6M2 8a6 6 0 016-6" />
        <path
          strokeLinecap="round"
          d="M14 8a6 6 0 01-6 6M8 14a6 6 0 01-6-6"
          strokeOpacity=".3"
        />
      </svg>
    ),
    label: "Syncing…",
    row: "bg-violet-50/40 hover:bg-violet-50 dark:bg-violet-950/40 dark:hover:bg-violet-950/40",
    badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/50",
  },
  synced: {
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4 text-emerald-500 dark:text-emerald-400"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 8l2.5 2.5 4-4"
        />
      </svg>
    ),
    label: "Synced",
    row: "hover:bg-slate-50 dark:hover:bg-slate-800 opacity-70",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
  },
  failed: {
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4 text-red-500 dark:text-red-400"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path strokeLinecap="round" d="M8 5v4m0 2v.5" />
      </svg>
    ),
    label: "Failed",
    row: "bg-red-50/50 hover:bg-red-50 dark:bg-red-950/40 dark:hover:bg-red-950/40",
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
  },
}

const TYPE_COLOR: Record<SyncRecord["type"], string> = {
  "New Patient": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  "Visit Record": "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  "Vitals Entry": "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  "Digitized Record": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "AI Triage": "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtKB(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

// ── Subcomponents ──────────────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  sub,
  color,
}: {
  value: string | number
  label: string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
        {label}
      </p>
      <p className={`font-display text-3xl font-bold ${color} mb-0.5`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SyncPage() {
  const [records, setRecords] = useState<SyncRecord[]>(INITIAL_RECORDS)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState("Today, 07:30")
  const [filter, setFilter] = useState<"all" | SyncStatus>("all")
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  const pending = records.filter(
    (r) => r.status === "queued" || r.status === "failed",
  )
  const syncing = records.filter((r) => r.status === "syncing")
  const synced = records.filter((r) => r.status === "synced")
  const failed = records.filter((r) => r.status === "failed")
  const totalKB = pending.reduce((s, r) => s + r.sizeKB, 0)

  const handleSync = () => {
    if (!isOnline || isSyncing || pending.length === 0) return
    setIsSyncing(true)

    const queue = [...pending.map((r) => r.id)]
    let idx = 0

    const processNext = () => {
      if (idx >= queue.length) {
        const now = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
        setLastSynced(`Today, ${now}`)
        setIsSyncing(false)
        return
      }
      const id = queue[idx]

      // mark as syncing
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "syncing" } : r)),
      )

      const delay = 600 + Math.random() * 900
      syncRef.current = setTimeout(() => {
        const now = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: "synced", syncedAt: `Today, ${now}` }
              : r,
          ),
        )
        idx++
        setTimeout(processNext, 200)
      }, delay)
    }

    processNext()
  }

  const handleRetry = (id: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "queued", retries: 0 } : r,
      ),
    )
  }

  const handleDismiss = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  useEffect(
    () => () => {
      if (syncRef.current) clearTimeout(syncRef.current)
    },
    [],
  )

  const displayed =
    filter === "all" ? records : records.filter((r) => r.status === filter)

  const FILTERS: { id: "all" | SyncStatus; label: string; count: number }[] = [
    { id: "all", label: "All", count: records.length },
    {
      id: "queued",
      label: "Queued",
      count: records.filter((r) => r.status === "queued").length,
    },
    { id: "syncing", label: "Syncing", count: syncing.length },
    { id: "synced", label: "Synced", count: synced.length },
    { id: "failed", label: "Failed", count: failed.length },
  ]

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10 w-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950 dark:text-white">
            Sync Status
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Last synced:{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">{lastSynced}</span>
            <span className="mx-2 text-slate-200 dark:text-slate-700">·</span>
            Kayes District Clinic · HW-20451
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={!isOnline || isSyncing || pending.length === 0}
          className={`flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl shadow-sm transition-all ${
            !isOnline
              ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
              : isSyncing
                ? "bg-violet-500 text-white cursor-wait shadow-violet-500/20"
                : pending.length === 0
                  ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:-translate-y-0.5 hover:shadow-md"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
          >
            <path strokeLinecap="round" d="M13.5 2.5v4h-4" />
            <path strokeLinecap="round" d="M2.5 13.5v-4h4" />
            <path
              strokeLinecap="round"
              d="M13.5 6.5A6 6 0 008 2.5a6 6 0 00-5.1 2.9"
            />
            <path
              strokeLinecap="round"
              d="M2.5 9.5A6 6 0 008 13.5a6 6 0 005.1-2.9"
            />
          </svg>
          {isSyncing
            ? "Syncing…"
            : pending.length === 0
              ? "All synced"
              : `Sync Now (${pending.length})`}
        </button>
      </div>

      {/* ── Connectivity banner ── */}
      <div
        className={`rounded-2xl border px-5 py-4 flex flex-wrap items-start gap-4 transition-all ${
          isOnline
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isOnline ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-amber-100 dark:bg-amber-950/40"
          }`}
        >
          {isOnline ? (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
            >
              <path
                fillRule="evenodd"
                d="M.01 11.646a14.422 14.422 0 0119.98 0A.75.75 0 0119.16 13a12.922 12.922 0 00-17.32 0 .75.75 0 11-.992-1.124.75.75 0 01.162-.23zM3.22 14.86a9.42 9.42 0 0113.56 0 .75.75 0 01-1.08 1.044 7.92 7.92 0 00-11.4 0A.75.75 0 013.22 14.86zM6.44 18.07a4.42 4.42 0 017.12 0 .75.75 0 01-1.2.9 2.92 2.92 0 00-4.72 0 .75.75 0 01-1.2-.9zM10 20a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
            >
              <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM10 20a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold mb-0.5 ${
              isOnline ? "text-emerald-900 dark:text-emerald-300" : "text-amber-900 dark:text-amber-300"
            }`}
          >
            {isOnline
              ? "Connected — ready to sync"
              : "Offline — data saved locally"}
          </p>
          <p
            className={`text-xs leading-relaxed ${
              isOnline ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {isOnline
              ? `All ${pending.length} pending record${
                  pending.length !== 1 ? "s" : ""
                } (${fmtKB(totalKB)}) will sync securely to the central server. Your data is end-to-end encrypted.`
              : "Your records are safely stored on this device. No data will be lost. Sync will resume automatically the moment internet connectivity is detected — no action required from you."}
          </p>
        </div>
        {isOnline && pending.length > 0 && !isSyncing && (
          <div
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0 self-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {fmtKB(totalKB)} ready
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={pending.length}
          label="Pending"
          sub="queued + failed"
          color="text-slate-700"
        />
        <StatCard
          value={syncing.length}
          label="In Progress"
          sub="currently syncing"
          color="text-violet-600"
        />
        <StatCard
          value={synced.length}
          label="Synced Today"
          sub="successfully sent"
          color="text-emerald-600"
        />
        <StatCard
          value={failed.length}
          label="Failed"
          sub="need attention"
          color={failed.length > 0 ? "text-red-600" : "text-slate-400"}
        />
      </div>

      {/* ── Records table card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Table toolbar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map(({ id, label, count }) =>
              count > 0 || id === "all" ? (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                    filter === id
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-700 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-teal-700 dark:hover:text-teal-300"
                  }`}
                >
                  {label}
                  <span
                    className={`text-[10px] font-bold min-w-[18px] text-center px-1 py-0.5 rounded-full ${
                      filter === id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ) : null,
            )}
          </div>

          {/* Total size */}
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
            {fmtKB(records.reduce((s, r) => s + r.sizeKB, 0))} total ·{" "}
            {displayed.length} record{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                {[
                  "Record Type",
                  "Patient",
                  "Created",
                  "Size",
                  "Status",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${
                      h === "" ? "w-10" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          All clear
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          No records match this filter
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((record) => {
                  const sc = STATUS_CONFIG[record.status]
                  return (
                    <tr
                      key={record.id}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${sc.row}`}
                    >
                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[record.type]}`}
                          >
                            {TYPE_ICON[record.type]}
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {record.type}
                          </span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {record.patient}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {record.patientId}
                        </p>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {record.createdAt}
                        </span>
                        {record.syncedAt && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            ↑ {record.syncedAt}
                          </p>
                        )}
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {fmtKB(record.sizeKB)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold ${sc.badge}`}
                        >
                          {sc.icon}
                          {sc.label}
                          {record.retries && record.retries > 0 ? (
                            <span className="text-[10px] opacity-70">
                              · {record.retries} retr
                              {record.retries > 1 ? "ies" : "y"}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {record.status === "failed" && (
                            <button
                              onClick={() => handleRetry(record.id)}
                              title="Retry"
                              className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-all"
                            >
                              Retry
                            </button>
                          )}
                          {(record.status === "failed" ||
                            record.status === "synced") && (
                            <button
                              onClick={() => handleDismiss(record.id)}
                              title="Remove from list"
                              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <svg
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                className="w-3.5 h-3.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  d="M3 3l8 8M11 3L3 11"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Records are encrypted with AES-256 before leaving this device.
          </p>
          <div className="flex items-center gap-3">
            {synced.length > 0 && (
              <button
                onClick={() =>
                  setRecords((prev) =>
                    prev.filter((r) => r.status !== "synced"),
                  )
                }
                className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Clear synced
              </button>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Auto-sync:{" "}
              <span className="font-semibold text-teal-600 dark:text-teal-400">enabled</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Legend + explainer ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Status legend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
            Status Reference
          </p>
          <div className="space-y-2.5">
            {([
              {
                status: "queued",
                desc: "Saved locally, waiting for connection",
              },
              {
                status: "syncing",
                desc: "Currently uploading to central server",
              },
              {
                status: "synced",
                desc: "Confirmed received and stored centrally",
              },
              {
                status: "failed",
                desc: "Upload failed — tap Retry to try again",
              },
            ] as { status: SyncStatus; desc: string }[]).map(
              ({ status, desc }) => {
                const sc = STATUS_CONFIG[status]
                return (
                  <div key={status} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">{sc.icon}</div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {sc.label}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">
                        {desc}
                      </span>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </div>

        {/* How sync works */}
        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500 dark:text-teal-400 mb-3">
            How automatic sync works
          </p>
          <div className="space-y-2.5">
            {[
              {
                step: "1",
                text: "Records are saved instantly to your device — no internet needed.",
              },
              {
                step: "2",
                text: "When connectivity is detected, HealthStats syncs in the background automatically.",
              },
              {
                step: "3",
                text: "Each record is verified on the server before being marked Synced.",
              },
              {
                step: "4",
                text: "Failed records are retried up to 5 times before requiring manual action.",
              },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
