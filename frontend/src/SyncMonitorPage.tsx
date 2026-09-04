import { useState, useEffect } from "react"
import { offlineDb, PendingRecord } from "./lib/offlineDb"
import { syncService } from "./lib/syncService"

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
  check: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4 4L16 6" />
    </svg>
  ),
  alert: (
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
        d="M10 3.5L1.7 17.5h16.6L10 3.5zM10 8v4.5M10 15h.01"
      />
    </svg>
  ),
}

export default function SyncMonitorPage() {
  const [records, setRecords] = useState<PendingRecord[]>([])
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [toast, setToast] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "syncing" | "failed">("all")

  // Load records from local Dexie database
  const loadRecords = async () => {
    try {
      const list = await offlineDb.pendingRecords
        .orderBy("createdAt")
        .reverse()
        .toArray()
      setRecords(list)
    } catch (err) {
      console.error("[SyncMonitorPage] Error loading pending records:", err)
    }
  }

  useEffect(() => {
    loadRecords()

    const handleOnline = () => {
      setIsOnline(true)
      loadRecords()
    }
    const handleOffline = () => {
      setIsOnline(false)
      loadRecords()
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Polling interval to reflect background sync completion
    const interval = setInterval(loadRecords, 3000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  const pendingCount = records.filter((r) => r.status === "pending").length
  const syncingCount = records.filter((r) => r.status === "syncing").length
  const failedCount = records.filter((r) => r.status === "failed").length
  const totalCount = records.length

  const filteredRecords = records.filter((r) => {
    if (filter === "all") return true
    return r.status === filter
  })

  // Trigger sync via syncService
  const handleForceSync = async () => {
    if (isSyncing || !isOnline) return
    setIsSyncing(true)
    try {
      await syncService.syncPendingRecords()
      await loadRecords()
      setToast("Sync process completed.")
    } catch (err: any) {
      setToast(err?.message ?? "Sync encountered an error.")
    } finally {
      setIsSyncing(false)
      setTimeout(() => setToast(""), 3500)
    }
  }

  // Retry an individual failed record
  const handleRetryRecord = async (id: string) => {
    try {
      await offlineDb.pendingRecords.update(id, { status: "pending" })
      await loadRecords()
      if (isOnline) {
        syncService.syncPendingRecords().then(loadRecords)
      }
    } catch (err) {
      console.error("[SyncMonitorPage] Retry failed:", err)
    }
  }

  const formatTime = (ms: number) => {
    const diff = Date.now() - ms
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return "Just now"
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(ms).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950 dark:text-white">
            Sync Monitor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            IndexedDB offline queue status · {totalCount} local record{totalCount === 1 ? "" : "s"} waiting for Supabase sync
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceSync}
            disabled={isSyncing || !isOnline || totalCount === 0}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
          >
            <span className={isSyncing ? "animate-spin" : ""}>{Icon.sync}</span>
            {isSyncing ? "Syncing queue…" : "Force Sync Queue"}
          </button>
        </div>
      </div>

      {/* Summary + network strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-4 transition-colors">
        {/* Network Status */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOnline
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {isOnline ? Icon.online : Icon.offline}
          </div>
          <div>
            <p className="font-display text-base text-teal-950 dark:text-white leading-none">
              {isOnline ? "Network Connected" : "Offline Mode"}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {isOnline ? "Online — Ready to sync" : "Offline — Changes saved locally"}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />

        {/* Counts */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div>
              <p className="font-display text-xl text-teal-950 dark:text-white leading-none">
                {pendingCount}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Pending</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <div>
              <p className="font-display text-xl text-teal-950 dark:text-white leading-none">
                {syncingCount}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Syncing</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div>
              <p className="font-display text-xl text-teal-950 dark:text-white leading-none">
                {failedCount}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Failed</p>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />

        {/* Total Queued */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            {Icon.stack}
          </span>
          <div>
            <p className="font-display text-xl text-teal-950 dark:text-white leading-none">
              {totalCount}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Total in Queue</p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 ml-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {(["all", "pending", "syncing", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 rounded-lg capitalize transition-all ${
                filter === f
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Queue items list */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            {Icon.check}
          </div>
          <h3 className="font-display text-lg text-teal-950 dark:text-white">
            Sync Queue is Clear
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md mx-auto mt-1">
            {filter === "all"
              ? "All offline records are fully synced to Supabase. Any new records created offline will queue here automatically."
              : `No records currently with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
              Queued Offline Records ({filteredRecords.length})
            </h3>
            <span className="text-xs text-slate-400">IndexedDB: pendingRecords</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRecords.map((rec) => {
              const isPatient = rec.type === "patient"
              const payload = rec.payload || {}
              const label = isPatient
                ? payload.name || "Unnamed Patient"
                : `Visit for patient ${payload.patient_id?.slice(0, 8) ?? "—"}`

              const subtitle = isPatient
                ? `Age: ${payload.age ?? "—"} · Gender: ${payload.sex ?? "—"} · Village: ${payload.village ?? "—"}`
                : `Urgency: ${payload.urgency_score ?? "—"} · Symptoms: ${payload.symptoms ?? "None recorded"}`

              return (
                <div
                  key={rec.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isPatient
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                          : "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                      }`}
                    >
                      {isPatient ? "PT" : "VT"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {label}
                        </p>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            rec.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                              : rec.status === "syncing"
                                ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 animate-pulse"
                                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {subtitle}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        ID: <code className="font-mono text-[10px]">{rec.id.slice(0, 12)}…</code> · Queued {formatTime(rec.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {rec.status === "failed" && (
                      <button
                        onClick={() => handleRetryRecord(rec.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-teal-950 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            {Icon.check}
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
