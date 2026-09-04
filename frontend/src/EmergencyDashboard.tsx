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
}

// ── Data ───────────────────────────────────────────────────────────────────────
const ZONES = [
  {
    name: "Yélimané North",
    cases: 84,
    trend: "+12",
    severity: "Severe",
    cause: "Cholera outbreak",
    eta: "Team en route",
  },
  {
    name: "Diamou Riverside",
    cases: 51,
    trend: "+7",
    severity: "Critical",
    cause: "Flooding · displacement",
    eta: "On site",
  },
  {
    name: "Sadiola Camp",
    cases: 33,
    trend: "+3",
    severity: "Elevated",
    cause: "Measles cluster",
    eta: "Team en route",
  },
]

const SEVERITY: Record<string, { chip: string bar: string dot: string }> = {
  Critical: {
    chip: "bg-red-100 text-red-700 border-red-300",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
  Severe: {
    chip: "bg-orange-100 text-orange-700 border-orange-300",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
  },
  Elevated: {
    chip: "bg-amber-100 text-amber-700 border-amber-300",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
}

const TRIAGE = [
  {
    id: "PT-00376",
    name: "Oumar Coulibaly",
    age: 8,
    zone: "Diamou Riverside",
    complaint: "Severe dehydration, unresponsive",
    score: 97,
    level: "Critical",
    wait: "2 min",
    initials: "OC",
  },
  {
    id: "PT-00251",
    name: "Hawa Camara",
    age: 41,
    zone: "Yélimané North",
    complaint: "Profuse vomiting, low BP",
    score: 93,
    level: "Critical",
    wait: "4 min",
    initials: "HC",
  },
  {
    id: "PT-00331",
    name: "Modibo Keïta",
    age: 70,
    zone: "Yélimané North",
    complaint: "Collapse, rapid pulse",
    score: 90,
    level: "Critical",
    wait: "6 min",
    initials: "MK",
  },
  {
    id: "PT-00318",
    name: "Rokia Cissé",
    age: 3,
    zone: "Diamou Riverside",
    complaint: "High fever, lethargy",
    score: 81,
    level: "Severe",
    wait: "9 min",
    initials: "RC",
  },
  {
    id: "PT-00292",
    name: "Assitan Doumbia",
    age: 29,
    zone: "Sadiola Camp",
    complaint: "Rash, respiratory distress",
    score: 74,
    level: "Severe",
    wait: "12 min",
    initials: "AD",
  },
]

const LEVEL_CLS: Record<string, string> = {
  Critical: "bg-red-500 text-white",
  Severe: "bg-orange-500 text-white",
}

const RESOURCES = [
  {
    zone: "Yélimané North",
    volunteers: 12,
    volNeed: 20,
    supplies: 45,
    beds: "8 / 30",
  },
  {
    zone: "Diamou Riverside",
    volunteers: 18,
    volNeed: 18,
    supplies: 72,
    beds: "14 / 24",
  },
  {
    zone: "Sadiola Camp",
    volunteers: 6,
    volNeed: 15,
    supplies: 28,
    beds: "5 / 16",
  },
]

const supplyTone = (v: number) =>
  v < 35 ? "bg-red-500" : v < 60 ? "bg-orange-500" : "bg-emerald-500"

// ── Component ──────────────────────────────────────────────────────────────────
export default function EmergencyDashboard() {
  const totalCases = ZONES.reduce((s, z) => s + z.cases, 0)
  const criticalInQueue = TRIAGE.filter((t) => t.level === "Critical").length

  return (
    <div className="space-y-6">
      {/* Crisis summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Zones",
            value: ZONES.length,
            note: "under emergency response",
            icon: Icon.pin,
          },
          {
            label: "Total Cases",
            value: totalCases,
            note: "+22 in last hour",
            icon: Icon.pulse,
          },
          {
            label: "Critical in Queue",
            value: criticalInQueue,
            note: "awaiting immediate care",
            icon: Icon.clock,
          },
          {
            label: "Responders Deployed",
            value: 36,
            note: "across 3 zones",
            icon: Icon.users,
          },
        ].map(({ label, value, note, icon }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              {icon}
            </div>
            <p className="font-display text-3xl text-red-950 leading-none">
              {value}
            </p>
            <p className="text-sm font-medium text-slate-700 mt-1.5">{label}</p>
            <p className="text-xs text-red-500 font-medium mt-0.5">{note}</p>
          </div>
        ))}
      </div>

      {/* Active zones */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-600">{Icon.pin}</span>
          <h2 className="font-semibold text-red-950 text-base">
            Active Emergency Zones
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {ZONES.map((z) => {
            const s = SEVERITY[z.severity]
            return (
              <div
                key={z.name}
                className="bg-white rounded-2xl border-l-4 border border-red-100 border-l-red-500 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {z.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{z.cause}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border ${s.chip}`}
                  >
                    {z.severity}
                  </span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="font-display text-3xl text-red-950 leading-none">
                      {z.cases}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      active cases
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    ▲ {z.trend}/hr
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`}
                  />
                  {z.eta}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Triage queue + resources */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Triage queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-red-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50/60">
            <div className="flex items-center gap-2">
              <span className="text-red-600">{Icon.pulse}</span>
              <h2 className="font-semibold text-red-950 text-base">
                Triage Queue
              </h2>
              <span className="text-[11px] font-semibold text-red-700 bg-white border border-red-200 px-2 py-0.5 rounded-full">
                {TRIAGE.length} waiting · sorted by urgency
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {TRIAGE.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-red-50/40 transition-colors"
              >
                <span className="font-display text-lg text-red-300 w-5 flex-shrink-0">
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {t.name}{" "}
                    <span className="font-normal text-slate-400 text-xs">
                      · {t.age}y · {t.zone}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {t.complaint}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="font-display text-xl text-red-600 leading-none">
                    {t.score}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                    {Icon.clock} {t.wait}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${LEVEL_CLS[t.level]}`}
                >
                  {t.level}
                </span>
                <button className="flex items-center gap-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors flex-shrink-0">
                  Dispatch
                  {Icon.arrowRight}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resource allocation */}
        <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100 bg-red-50/60">
            <span className="text-red-600">{Icon.supply}</span>
            <h2 className="font-semibold text-red-950 text-base">
              Resource Allocation
            </h2>
          </div>
          <div className="p-5 space-y-5">
            {RESOURCES.map((r) => {
              const volPct = Math.min(
                100,
                Math.round((r.volunteers / r.volNeed) * 100),
              )
              const volShort = r.volunteers < r.volNeed
              return (
                <div key={r.zone}>
                  <p className="text-sm font-semibold text-slate-800 mb-2.5">
                    {r.zone}
                  </p>
                  {/* Volunteers */}
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        {Icon.users} Volunteers
                      </span>
                      <span
                        className={`font-semibold ${
                          volShort ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {r.volunteers}/{r.volNeed}
                        {volShort
                          ? ` · need ${r.volNeed - r.volunteers}`
                          : " · full"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          volShort ? "bg-orange-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${volPct}%` }}
                      />
                    </div>
                  </div>
                  {/* Supplies */}
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        {Icon.supply} Supplies
                      </span>
                      <span className="font-semibold text-slate-600">
                        {r.supplies}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${supplyTone(r.supplies)}`}
                        style={{ width: `${r.supplies}%` }}
                      />
                    </div>
                  </div>
                  {/* Beds */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Beds occupied</span>
                    <span className="font-semibold text-slate-600">
                      {r.beds}
                    </span>
                  </div>
                </div>
              )
            })}
            <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 py-2.5 rounded-xl transition-colors mt-1">
              Request Reinforcements
              {Icon.arrowRight}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
