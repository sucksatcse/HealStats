import { useState } from "react"

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
    label: "Emergency Mode",
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
    label: "Sync",
    icon: Icon.sync,
    ring: "border-l-emerald-500",
    iconCls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
}

interface Alert {
  id: number
  kind: Kind
  title: string
  message: string
  time: string
  group: "Today" | "Yesterday" | "Earlier"
  read: boolean
  cta?: string
}

const INITIAL: Alert[] = [
  {
    id: 1,
    kind: "urgent",
    title: "New high-urgency patient flagged",
    message:
      "AI triage scored Rahima Begum (EMG-2041) at 97 — crush injury, heavy bleeding at Diamou Riverside. Immediate care required.",
    time: "2 min ago",
    group: "Today",
    read: false,
    cta: "Open triage queue",
  },
  {
    id: 2,
    kind: "emergency",
    title: "Emergency Mode activated",
    message:
      "Dr. Priya Suresh switched the district to Emergency Mode following the Bafoulabé ferry incident. Crisis dashboards are now live.",
    time: "18 min ago",
    group: "Today",
    read: false,
    cta: "View response",
  },
  {
    id: 3,
    kind: "urgent",
    title: "New high-urgency patient flagged",
    message:
      "Abdul Karim (EMG-2044), age 8 — near-drowning, unresponsive on arrival. Triage score 94.",
    time: "34 min ago",
    group: "Today",
    read: false,
    cta: "Open triage queue",
  },
  {
    id: 4,
    kind: "sync",
    title: "Sync completed",
    message:
      "218 queued records synced from 12 clinics. All local data is now up to date. No conflicts detected.",
    time: "1 hr ago",
    group: "Today",
    read: true,
  },
  {
    id: 5,
    kind: "staff",
    title: "Staff account created",
    message:
      "New health worker account for Nasrin Akter (HW-20489) was provisioned at Char Fasson clinic and is pending first login.",
    time: "3 hrs ago",
    group: "Today",
    read: true,
    cta: "Review account",
  },
  {
    id: 6,
    kind: "sync",
    title: "Sync completed",
    message:
      "Overnight batch sync finished for Sadiola Camp — 47 records uploaded.",
    time: "Yesterday, 23:10",
    group: "Yesterday",
    read: true,
  },
  {
    id: 7,
    kind: "staff",
    title: "Staff role changed",
    message:
      "Ibrahim Traoré was promoted from Health Worker to Clinic Admin at Kayes District Clinic by Dr. Priya Suresh.",
    time: "Yesterday, 16:42",
    group: "Yesterday",
    read: true,
    cta: "Review account",
  },
  {
    id: 8,
    kind: "staff",
    title: "Staff account deactivated",
    message:
      "Account for Sekou Bah (HW-20301) was deactivated after 90 days of inactivity. Records retained.",
    time: "Aug 26, 09:15",
    group: "Earlier",
    read: true,
  },
  {
    id: 9,
    kind: "sync",
    title: "Sync completed",
    message:
      "Weekly full backup completed successfully — 1.2M records verified, 99.98% integrity.",
    time: "Aug 25, 02:00",
    group: "Earlier",
    read: true,
  },
]

const FILTERS: { key: Kind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "urgent", label: "High-Urgency" },
  { key: "emergency", label: "Emergency" },
  { key: "staff", label: "Staff" },
  { key: "sync", label: "Sync" },
]

const GROUPS: Alert["group"][] = ["Today", "Yesterday", "Earlier"]

export default function AlertsCenterPage() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL)
  const [filter, setFilter] = useState<Kind | "all">("all")
  const [unreadOnly, setUnreadOnly] = useState(false)

  const unreadCount = alerts.filter((a) => !a.read).length

  const markAll = () =>
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
  const toggleRead = (id: number) =>
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: !a.read } : a)),
    )
  const dismiss = (id: number) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id))

  const visible = alerts.filter(
    (a) => (filter === "all" || a.kind === filter) && (!unreadOnly || !a.read),
  )

  return (
    <div className="max-w-3xl mx-auto pb-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center relative flex-shrink-0">
            {Icon.bell}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-50 dark:border-slate-950">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl text-teal-950 dark:text-white leading-tight">
              Notifications
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
        </div>
        <button
          onClick={markAll}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 disabled:text-slate-400 disabled:bg-slate-100 dark:text-teal-300 dark:hover:text-teal-200 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:disabled:text-slate-500 dark:disabled:bg-slate-800 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-colors"
        >
          {Icon.check} Mark all as read
        </button>
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
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
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
                              <button className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 transition-colors">
                                {a.cta} {Icon.arrow}
                              </button>
                            )}
                            <button
                              onClick={() => toggleRead(a.id)}
                              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                            >
                              {a.read ? "Mark unread" : "Mark read"}
                            </button>
                            <button
                              onClick={() => dismiss(a.id)}
                              className="text-xs font-medium text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
