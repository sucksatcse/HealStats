import { useState } from "react"

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  staff: (
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
  ambulance: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1 6h10v7H1zM11 8h4l3 3v2h-7zM6 4v3M4.5 5.5h3"
      />
      <circle cx="5" cy="15" r="1.6" />
      <circle cx="14.5" cy="15" r="1.6" />
    </svg>
  ),
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
  minus: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" d="M3 8h10" />
    </svg>
  ),
  plus: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" d="M8 3v10M3 8h10" />
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
  check: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 8-8" />
    </svg>
  ),
  x: (
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
}

// ── Resource kinds ───────────────────────────────────────────────────────────────
type Kind = "staff" | "supplies" | "ambulances"

const KINDS: {
  key: Kind
  label: string
  unit: string
  icon: React.ReactNode
  accent: string
  barFull: string
}[] = [
  {
    key: "staff",
    label: "Medical Staff",
    unit: "personnel",
    icon: Icon.staff,
    accent: "text-teal-700",
    barFull: "bg-teal-500",
  },
  {
    key: "supplies",
    label: "Supply Kits",
    unit: "kits",
    icon: Icon.supply,
    accent: "text-violet-700",
    barFull: "bg-violet-500",
  },
  {
    key: "ambulances",
    label: "Ambulances",
    unit: "units",
    icon: Icon.ambulance,
    accent: "text-sky-700",
    barFull: "bg-sky-500",
  },
]

interface Zone {
  id: string
  name: string
  region: string
  severity: "Critical" | "Severe" | "Elevated"
  cause: string
  have: Record<Kind, number>
  need: Record<Kind, number>
}

const INITIAL_ZONES: Zone[] = [
  {
    id: "z1",
    name: "Diamou Riverside",
    region: "Kayes District",
    severity: "Critical",
    cause: "Flooding · displacement",
    have: { staff: 8, supplies: 14, ambulances: 1 },
    need: { staff: 22, supplies: 40, ambulances: 4 },
  },
  {
    id: "z2",
    name: "Yélimané North",
    region: "Kayes District",
    severity: "Severe",
    cause: "Cholera outbreak",
    have: { staff: 12, supplies: 30, ambulances: 3 },
    need: { staff: 20, supplies: 45, ambulances: 4 },
  },
  {
    id: "z3",
    name: "Sadiola Camp",
    region: "Kayes District",
    severity: "Elevated",
    cause: "Measles cluster",
    have: { staff: 6, supplies: 22, ambulances: 2 },
    need: { staff: 15, supplies: 28, ambulances: 2 },
  },
  {
    id: "z4",
    name: "Bafoulabé Ferry",
    region: "Kayes District",
    severity: "Severe",
    cause: "Boat capsize · trauma",
    have: { staff: 4, supplies: 9, ambulances: 0 },
    need: { staff: 14, supplies: 24, ambulances: 3 },
  },
]

const INITIAL_RESERVE: Record<Kind, number> = {
  staff: 34,
  supplies: 96,
  ambulances: 6,
}

const SEVERITY: Record<Zone["severity"], {
  chip: string
  edge: string
  dot: string
}> = {
  Critical: {
    chip: "bg-red-100 text-red-700 border-red-300",
    edge: "border-l-red-500",
    dot: "bg-red-500",
  },
  Severe: {
    chip: "bg-orange-100 text-orange-700 border-orange-300",
    edge: "border-l-orange-500",
    dot: "bg-orange-500",
  },
  Elevated: {
    chip: "bg-amber-100 text-amber-700 border-amber-300",
    edge: "border-l-amber-500",
    dot: "bg-amber-500",
  },
}

export default function ResourceAllocationPage() {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES)
  const [reserve, setReserve] = useState<Record<Kind, number>>(INITIAL_RESERVE)
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<Kind, number>>({
    staff: 0,
    supplies: 0,
    ambulances: 0,
  })
  const [justAllocated, setJustAllocated] = useState<string | null>(null)

  const openAllocate = (z: Zone) => {
    // Pre-fill draft with the gap, capped by reserve
    const gap = (k: Kind) =>
      Math.max(0, Math.min(z.need[k] - z.have[k], reserve[k]))
    setDraft({
      staff: gap("staff"),
      supplies: gap("supplies"),
      ambulances: gap("ambulances"),
    })
    setActiveZone(z.id)
  }

  const adjust = (k: Kind, delta: number, zone: Zone) => {
    setDraft((d) => {
      const gap = zone.need[k] - zone.have[k]
      const max = Math.max(0, Math.min(gap, reserve[k]))
      return { ...d, [k]: Math.max(0, Math.min(max, d[k] + delta)) }
    })
  }

  const confirmAllocate = (zone: Zone) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zone.id
          ? {
              ...z,
              have: {
                staff: z.have.staff + draft.staff,
                supplies: z.have.supplies + draft.supplies,
                ambulances: z.have.ambulances + draft.ambulances,
              },
            }
          : z,
      ),
    )
    setReserve((r) => ({
      staff: r.staff - draft.staff,
      supplies: r.supplies - draft.supplies,
      ambulances: r.ambulances - draft.ambulances,
    }))
    setActiveZone(null)
    setJustAllocated(zone.id)
    setTimeout(() => setJustAllocated(null), 2200)
  }

  // Aggregate coverage across all zones for the summary
  const coverage = (k: Kind) => {
    const need = zones.reduce((s, z) => s + z.need[k], 0)
    const have = zones.reduce((s, z) => s + z.have[k], 0)
    return Math.round((have / need) * 100)
  }

  return (
    <div className="pb-4">
      {/* ── Header ── */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 mb-6 flex flex-wrap items-center gap-4 shadow-lg shadow-red-900/10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0 12px, transparent 12px 24px)",
          }}
        />
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0 relative">
          <span className="absolute inset-0 rounded-xl bg-white/30 animate-ping" />
          <span className="relative">{Icon.alert}</span>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/20 rounded-full px-2 py-0.5">
            Crisis Operations
          </span>
          <h1 className="font-display text-2xl text-white mt-1.5 leading-tight">
            Resource Allocation
          </h1>
        </div>
      </div>

      {/* ── Central reserve pool ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Central Reserve Pool
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kayes District Command · available for dispatch
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Depot online
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {KINDS.map((k) => {
            const cov = coverage(k.key)
            const low = reserve[k.key] <= 4
            return (
              <div
                key={k.key}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${k.accent}`}
                  >
                    {k.icon}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 leading-tight">
                    {k.label}
                  </span>
                </div>
                <p
                  className={`font-display text-3xl leading-none ${
                    low ? "text-red-600" : "text-slate-800"
                  }`}
                >
                  {reserve[k.key]}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {k.unit} in reserve
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Zone coverage</span>
                  <span
                    className={`font-bold ${
                      cov >= 90
                        ? "text-emerald-600"
                        : cov >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {cov}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Zone list ── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-600">{Icon.pin}</span>
        <h2 className="font-semibold text-slate-800 text-base">
          Affected Zones
        </h2>
        <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          {zones.length} under response
        </span>
      </div>

      <div className="space-y-4">
        {zones.map((z) => {
          const s = SEVERITY[z.severity]
          const isOpen = activeZone === z.id
          const allocated = justAllocated === z.id
          const fullyMet = KINDS.every((k) => z.have[k.key] >= z.need[k.key])
          return (
            <div
              key={z.id}
              className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${s.edge} overflow-hidden transition-shadow ${
                isOpen ? "shadow-lg" : "hover:shadow-md"
              }`}
            >
              {/* Zone header row */}
              <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">
                      {z.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.chip}`}
                    >
                      {z.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {z.region} · {z.cause}
                  </p>
                </div>

                {/* Needs-vs-available comparison bars */}
                <div className="flex-1 grid sm:grid-cols-3 gap-x-6 gap-y-3 min-w-[240px]">
                  {KINDS.map((k) => {
                    const have = z.have[k.key]
                    const need = z.need[k.key]
                    const pct = Math.min(100, Math.round((have / need) * 100))
                    const short = have < need
                    return (
                      <div key={k.key}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span
                            className={`flex items-center gap-1 font-medium ${k.accent}`}
                          >
                            {k.icon}
                            {k.label.split(" ")[k.label.split(" ").length - 1]}
                          </span>
                          <span
                            className={`font-bold ${
                              short ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {have}/{need}
                          </span>
                        </div>
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          {/* need marker via full track; fill = have */}
                          <div
                            className={`h-full rounded-full ${
                              short ? "bg-amber-400" : k.barFull
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p
                          className={`text-[10px] mt-1 font-medium ${
                            short ? "text-red-500" : "text-emerald-500"
                          }`}
                        >
                          {short ? `short ${need - have}` : "fully met"}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Allocate button */}
                <div className="flex-shrink-0">
                  {allocated ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                      {Icon.check} Dispatched
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        isOpen ? setActiveZone(null) : openAllocate(z)
                      }
                      disabled={fullyMet}
                      className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${
                        fullyMet
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : isOpen
                            ? "bg-slate-800 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 hover:-translate-y-0.5"
                      }`}
                    >
                      {fullyMet ? (
                        <>{Icon.check} Met</>
                      ) : isOpen ? (
                        <>{Icon.x} Close</>
                      ) : (
                        <>Allocate {Icon.arrow}</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Allocation drawer ── */}
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 animate-slide-up">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                    Dispatch from reserve to {z.name}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {KINDS.map((k) => {
                      const gap = z.need[k.key] - z.have[k.key]
                      const max = Math.max(0, Math.min(gap, reserve[k.key]))
                      const capped = draft[k.key] >= max && gap > reserve[k.key]
                      return (
                        <div
                          key={k.key}
                          className="bg-white rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center ${k.accent}`}
                            >
                              {k.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700 leading-tight">
                                {k.label}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {reserve[k.key]} in reserve
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => adjust(k.key, -1, z)}
                              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
                              disabled={draft[k.key] <= 0}
                            >
                              {Icon.minus}
                            </button>
                            <div className="text-center">
                              <p className="font-display text-2xl text-slate-800 leading-none">
                                +{draft[k.key]}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                of {gap} needed
                              </p>
                            </div>
                            <button
                              onClick={() => adjust(k.key, 1, z)}
                              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
                              disabled={draft[k.key] >= max}
                            >
                              {Icon.plus}
                            </button>
                          </div>
                          {capped && (
                            <p className="text-[10px] text-red-500 font-medium mt-2 text-center">
                              Reserve limits this dispatch
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                    <p className="text-xs text-slate-500">
                      Dispatching{" "}
                      <span className="font-semibold text-slate-700">
                        {draft.staff}
                      </span>{" "}
                      staff ·
                      <span className="font-semibold text-slate-700">
                        {" "}
                        {draft.supplies}
                      </span>{" "}
                      kits ·
                      <span className="font-semibold text-slate-700">
                        {" "}
                        {draft.ambulances}
                      </span>{" "}
                      ambulances
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveZone(null)}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => confirmAllocate(z)}
                        disabled={
                          draft.staff + draft.supplies + draft.ambulances === 0
                        }
                        className="flex items-center gap-1.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none"
                      >
                        {Icon.check} Confirm Dispatch
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
