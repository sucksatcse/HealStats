import { useState } from "react"

// ── Skeleton primitive ───────────────────────────────────────────────────────
// A single shimmering block. `.skeleton` (in index.css) paints the teal-tinted
// base + moving sheen; utility classes control size and shape.
function Bar({
  className = "",
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return <div className={`skeleton ${className}`} style={style} />
}

// ── Patient list skeleton ────────────────────────────────────────────────────
// Mirrors the real patient table: search bar, column header, and shimmering rows
// with avatar, name/meta lines, a status pill, and a chevron.
function PatientListSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <Bar className="h-9 flex-1 max-w-sm rounded-xl" />
        <Bar className="h-9 w-24 rounded-xl" />
        <Bar className="h-9 w-9 rounded-xl ml-auto" />
      </div>

      {/* Column header */}
      <div className="hidden sm:flex items-center gap-4 px-5 py-3 bg-slate-50/70 border-b border-slate-100">
        <Bar className="h-2.5 w-28 !bg-slate-200" />
        <Bar className="h-2.5 w-40 !bg-slate-200 ml-auto" />
        <Bar className="h-2.5 w-20 !bg-slate-200" />
        <Bar className="h-2.5 w-16 !bg-slate-200" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Bar className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Bar
                className="h-3 rounded-md"
                style={{ width: `${52 + ((i * 7) % 28)}%` }}
              />
              <Bar className="h-2.5 w-1/3 rounded-md" />
            </div>
            <Bar className="hidden sm:block h-3 w-36 rounded-md" />
            <Bar className="hidden md:block h-5 w-16 rounded-full" />
            <Bar className="w-5 h-5 rounded-md flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard skeleton ───────────────────────────────────────────────────────
// Mirrors the health-worker overview: greeting, sync banner, quick actions,
// four stat cards, a chart outline, and the recent-patients card grid.
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2.5">
          <Bar className="h-7 w-64 rounded-lg" />
          <Bar className="h-3 w-48 rounded-md" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <Bar className="h-2.5 w-36 rounded-md" />
          <Bar className="h-2.5 w-24 rounded-md" />
        </div>
      </div>

      {/* Sync banner */}
      <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 flex items-center gap-4">
        <Bar className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Bar className="h-3 w-52 rounded-md" />
          <Bar className="h-2.5 w-72 max-w-full rounded-md" />
        </div>
        <Bar className="h-9 w-28 rounded-xl flex-shrink-0" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Bar className="h-11 w-36 rounded-xl" />
        <Bar className="h-11 w-40 rounded-xl" />
        <Bar className="h-11 w-32 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3"
          >
            <Bar className="h-2.5 w-24 rounded-md" />
            <Bar className="h-8 w-16 rounded-lg" />
            <Bar className="h-2.5 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Chart outline */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-2">
            <Bar className="h-3.5 w-40 rounded-md" />
            <Bar className="h-2.5 w-28 rounded-md" />
          </div>
          <Bar className="h-8 w-28 rounded-lg" />
        </div>
        {/* Plot area: baseline + shimmering bars of varying height */}
        <div className="relative h-44 flex items-end gap-2 sm:gap-3 border-l border-b border-slate-100 pl-3 pb-0">
          {[52, 74, 40, 88, 63, 96, 58, 80, 46, 70, 60, 84].map((h, i) => (
            <Bar
              key={i}
              className="flex-1 rounded-t-md rounded-b-none"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-3 px-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-2 w-8 rounded-sm !bg-slate-200" />
          ))}
        </div>
      </div>

      {/* Recent patients grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Bar className="h-4 w-52 rounded-md" />
          <Bar className="h-3 w-24 rounded-md" />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <Bar className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-3 w-28 rounded-md" />
                  <Bar className="h-2.5 w-36 rounded-md" />
                </div>
                <Bar className="h-5 w-14 rounded-full" />
              </div>
              <Bar className="h-14 w-full rounded-xl mb-4" />
              <div className="flex items-center justify-between">
                <Bar className="h-2.5 w-24 rounded-md" />
                <Bar className="h-2.5 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Showcase shell ───────────────────────────────────────────────────────────
type View = "dashboard" | "patients"

export default function SkeletonStatesPage({
  onBack,
}: {
  onBack?: () => void
}) {
  const [view, setView] = useState<View>("dashboard")

  const TABS: { id: View label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "patients", label: "Patient List" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-[Work_Sans,system-ui,sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors mb-6"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 6l-6 6 6 6"
              />
            </svg>
            Home
          </button>
        )}

        {/* Header + toggle */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 mb-3">
              Loading States
            </p>
            <h1 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-3 max-w-2xl">
              Never a blank screen
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              While records sync over a slow rural connection, HealthStats shows
              the shape of what's coming — a teal-tinted shimmer instead of an
              empty page.
            </p>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-sm font-semibold">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === tab.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-teal-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-3 py-1.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          Loading {view === "dashboard" ? "dashboard" : "patient records"}…
        </div>

        {/* Skeleton */}
        <div aria-busy="true" aria-live="polite">
          {view === "dashboard" ? (
            <DashboardSkeleton />
          ) : (
            <PatientListSkeleton />
          )}
        </div>
      </div>
    </div>
  )
}
