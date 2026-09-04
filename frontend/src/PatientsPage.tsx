import { useState, useMemo } from "react"

// ── Types ──────────────────────────────────────────────────────────────────────
type Urgency = "High" | "Medium" | "Low" | "Routine"
type Filter = "all" | "recent" | "flagged"
type SortKey = "name" | "age" | "lastVisit" | "urgency"

interface Patient {
  id: string
  name: string
  age: number
  sex: "M" | "F"
  village: string
  lastVisit: string // ISO date string
  urgency: Urgency
  condition: string
  initials: string
}

// ── Urgency config ─────────────────────────────────────────────────────────────
const URGENCY_CONFIG: Record<Urgency, {
  badge: string
  dot: string
  order: number
}> = {
  High: {
    badge: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
    order: 0,
  },
  Medium: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
    order: 1,
  },
  Low: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    order: 2,
  },
  Routine: {
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
    order: 3,
  },
}

// ── Patient data ───────────────────────────────────────────────────────────────
const ALL_PATIENTS: Patient[] = [
  {
    id: "PT-00412",
    name: "Mariama Kouyaté",
    age: 34,
    sex: "F",
    village: "Dialafara",
    lastVisit: "2026-08-28",
    urgency: "Medium",
    condition: "Malaria (uncomplicated)",
    initials: "MK",
  },
  {
    id: "PT-00389",
    name: "Ibrahim Traoré",
    age: 52,
    sex: "M",
    village: "Sandaré",
    lastVisit: "2026-08-28",
    urgency: "High",
    condition: "Uncontrolled Type 2 Diabetes",
    initials: "IT",
  },
  {
    id: "PT-00401",
    name: "Fanta Diallo",
    age: 27,
    sex: "F",
    village: "Kayes Centre",
    lastVisit: "2026-08-27",
    urgency: "Low",
    condition: "Antenatal Care (28 wks)",
    initials: "FD",
  },
  {
    id: "PT-00376",
    name: "Oumar Coulibaly",
    age: 8,
    sex: "M",
    village: "Bafoulabé",
    lastVisit: "2026-08-27",
    urgency: "Medium",
    condition: "Acute Respiratory Infection",
    initials: "OC",
  },
  {
    id: "PT-00365",
    name: "Kadiatou Baldé",
    age: 61,
    sex: "F",
    village: "Kéniéba",
    lastVisit: "2026-08-26",
    urgency: "High",
    condition: "Hypertension — BP 185/110",
    initials: "KB",
  },
  {
    id: "PT-00358",
    name: "Sekou Bah",
    age: 19,
    sex: "M",
    village: "Dialafara",
    lastVisit: "2026-08-25",
    urgency: "Routine",
    condition: "Wound dressing / laceration",
    initials: "SB",
  },
  {
    id: "PT-00344",
    name: "Aminata Camara",
    age: 43,
    sex: "F",
    village: "Mahina",
    lastVisit: "2026-08-24",
    urgency: "Low",
    condition: "Post-partum check (6 wks)",
    initials: "AC",
  },
  {
    id: "PT-00331",
    name: "Moussa Sidibé",
    age: 70,
    sex: "M",
    village: "Toukoto",
    lastVisit: "2026-08-22",
    urgency: "High",
    condition: "Suspected TB — referral pending",
    initials: "MS",
  },
  {
    id: "PT-00319",
    name: "Hawa Keïta",
    age: 16,
    sex: "F",
    village: "Sandaré",
    lastVisit: "2026-08-21",
    urgency: "Medium",
    condition: "Severe anaemia",
    initials: "HK",
  },
  {
    id: "PT-00307",
    name: "Demba Dembélé",
    age: 38,
    sex: "M",
    village: "Kéniéba",
    lastVisit: "2026-08-20",
    urgency: "Routine",
    condition: "Seasonal influenza",
    initials: "DD",
  },
  {
    id: "PT-00294",
    name: "Rokia Sylla",
    age: 29,
    sex: "F",
    village: "Bafoulabé",
    lastVisit: "2026-08-19",
    urgency: "Low",
    condition: "Family planning consult",
    initials: "RS",
  },
  {
    id: "PT-00281",
    name: "Boubacar Sangaré",
    age: 55,
    sex: "M",
    village: "Kayes Centre",
    lastVisit: "2026-08-18",
    urgency: "Medium",
    condition: "Chronic lower back pain",
    initials: "BS",
  },
  {
    id: "PT-00268",
    name: "Nene Konaté",
    age: 24,
    sex: "F",
    village: "Mahina",
    lastVisit: "2026-08-16",
    urgency: "High",
    condition: "Eclampsia risk — 36 wks",
    initials: "NK",
  },
  {
    id: "PT-00255",
    name: "Adama Diarra",
    age: 47,
    sex: "M",
    village: "Toukoto",
    lastVisit: "2026-08-15",
    urgency: "Routine",
    condition: "Routine dental referral",
    initials: "AD",
  },
  {
    id: "PT-00242",
    name: "Fatoumata Traoré",
    age: 12,
    sex: "F",
    village: "Dialafara",
    lastVisit: "2026-08-14",
    urgency: "Medium",
    condition: "Typhoid fever",
    initials: "FT",
  },
  {
    id: "PT-00229",
    name: "Lassana Coulibaly",
    age: 63,
    sex: "M",
    village: "Kéniéba",
    lastVisit: "2026-08-12",
    urgency: "High",
    condition: "Chest pain — cardiac workup",
    initials: "LC",
  },
  {
    id: "PT-00216",
    name: "Mariam Diallo",
    age: 31,
    sex: "F",
    village: "Sandaré",
    lastVisit: "2026-08-10",
    urgency: "Low",
    condition: "Vitamin D deficiency",
    initials: "MD",
  },
  {
    id: "PT-00203",
    name: "Youssouf Kouyaté",
    age: 22,
    sex: "M",
    village: "Bafoulabé",
    lastVisit: "2026-08-08",
    urgency: "Routine",
    condition: "Malaria — follow-up (clear)",
    initials: "YK",
  },
  {
    id: "PT-00190",
    name: "Djeneba Bah",
    age: 58,
    sex: "F",
    village: "Kayes Centre",
    lastVisit: "2026-08-06",
    urgency: "Medium",
    condition: "Type 2 Diabetes — controlled",
    initials: "DB",
  },
  {
    id: "PT-00177",
    name: "Cheick Diallo",
    age: 41,
    sex: "M",
    village: "Mahina",
    lastVisit: "2026-08-04",
    urgency: "Routine",
    condition: "Hypertension — stable",
    initials: "CD",
  },
  {
    id: "PT-00164",
    name: "Aissatou Baldé",
    age: 35,
    sex: "F",
    village: "Toukoto",
    lastVisit: "2026-08-02",
    urgency: "Low",
    condition: "Iron-deficiency anaemia",
    initials: "AB",
  },
  {
    id: "PT-00151",
    name: "Mamadou Camara",
    age: 78,
    sex: "M",
    village: "Dialafara",
    lastVisit: "2026-07-30",
    urgency: "High",
    condition: "COPD exacerbation",
    initials: "MC",
  },
]

const PAGE_SIZE = 10

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  })
}

function isRecent(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) <= 7
}

// ── Icons (inline, lucide-style) ───────────────────────────────────────────────
const SearchIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    className="w-4.5 h-4.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"
    />
  </svg>
)
const SortIcon = ({ active, dir }: { active: boolean; dir: "asc" | "desc" }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={`w-3.5 h-3.5 transition-all ${
      active ? "text-teal-600" : "text-slate-300"
    }`}
  >
    {dir === "asc" || !active ? (
      <path strokeLinecap="round" d="M8 3v10M4 9l4 4 4-4" />
    ) : (
      <path strokeLinecap="round" d="M8 13V3M4 7l4-4 4 4" />
    )}
  </svg>
)
const ChevronIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d={dir === "left" ? "M10 4L6 8l4 4" : "M6 4l4 4-4 4"}
    />
  </svg>
)
const FlagIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M3 1.5A.5.5 0 013.5 1H9a.5.5 0 01.354.146L10.5 2.293V1.5A.5.5 0 0111 1h1a.5.5 0 010 1h-.5v8h.5a.5.5 0 010 1H3.5A.5.5 0 013 10.5V1.5z" />
    <path d="M3.5 2v8h7V2.707L9.793 2H3.5z" />
    <path d="M3 13.5a.5.5 0 011 0v1a.5.5 0 01-1 0v-1z" />
  </svg>
)
const ExternalIcon = () => (
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
      d="M9 2h5v5M14 2L8 8M3 4H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-1"
    />
  </svg>
)
const ClearIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-3.5 h-3.5"
  >
    <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
  </svg>
)

// ── Component ──────────────────────────────────────────────────────────────────
export default function PatientsPage() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("lastVisit")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let list = ALL_PATIENTS

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.village.toLowerCase().includes(q) ||
          p.condition.toLowerCase().includes(q),
      )
    }

    if (filter === "recent") list = list.filter((p) => isRecent(p.lastVisit))
    if (filter === "flagged") list = list.filter((p) => p.urgency === "High")

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "age") cmp = a.age - b.age
      else if (sortKey === "lastVisit")
        cmp = a.lastVisit.localeCompare(b.lastVisit)
      else if (sortKey === "urgency")
        cmp = URGENCY_CONFIG[a.urgency].order - URGENCY_CONFIG[b.urgency].order
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [query, filter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filterCounts = useMemo(
    () => ({
      all: ALL_PATIENTS.length,
      recent: ALL_PATIENTS.filter((p) => isRecent(p.lastVisit)).length,
      flagged: ALL_PATIENTS.filter((p) => p.urgency === "High").length,
    }),
    [],
  )

  const FILTERS: { id: Filter; label: string; icon?: React.ReactNode }[] = [
    { id: "all", label: "All Patients" },
    { id: "recent", label: "Recent" },
    { id: "flagged", label: "High-Risk", icon: <FlagIcon /> },
  ]

  const COL_HEADERS: { key: SortKey | null; label: string; width: string }[] = [
    { key: "name", label: "Patient", width: "w-[22%]" },
    { key: "age", label: "Age", width: "w-[7%]" },
    { key: null, label: "Sex", width: "w-[6%]" },
    { key: null, label: "Village", width: "w-[15%]" },
    { key: null, label: "Condition", width: "w-[26%]" },
    { key: "lastVisit", label: "Last Visit", width: "w-[12%]" },
    { key: "urgency", label: "Urgency", width: "w-[12%]" },
  ]

  const AVATAR_COLORS = [
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-amber-100 text-amber-700",
    "bg-teal-100 text-teal-700",
    "bg-pink-100 text-pink-700",
  ]

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
            Patients
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {ALL_PATIENTS.length} total records · Kayes District Clinic
          </p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:-translate-y-0.5">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path strokeLinecap="round" d="M8 3v10M3 8h10" />
          </svg>
          New Patient
        </button>
      </div>

      {/* ── Search + filters row ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search name, ID, village, condition…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("")
                setPage(1)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(({ id, label, icon }) => {
            const active = filter === id
            const count = filterCounts[id]
            return (
              <button
                key={id}
                onClick={() => {
                  setFilter(id)
                  setPage(1)
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  active
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {icon && (
                  <span className={active ? "text-white" : "text-red-500"}>
                    {icon}
                  </span>
                )}
                {label}
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Results label */}
        {(query || filter !== "all") && (
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table card ── */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-sm border-collapse">
            {/* Head */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {COL_HEADERS.map(({ key, label, width }) => (
                  <th key={label} className={`${width} px-4 py-3 text-left`}>
                    {key ? (
                      <button
                        onClick={() => handleSort(key)}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-teal-700 transition-colors group"
                      >
                        {label}
                        <SortIcon
                          active={sortKey === key}
                          dir={sortKey === key ? sortDir : "asc"}
                        />
                      </button>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {label}
                      </span>
                    )}
                  </th>
                ))}
                <th className="w-[8%] px-4 py-3" />
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <SearchIcon />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          No patients found
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {query
                            ? `No results for "${query}"`
                            : "No patients in this filter"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setQuery("")
                          setFilter("all")
                        }}
                        className="text-xs text-teal-600 font-medium hover:text-teal-800 transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((p, i) => {
                  const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
                  const urg = URGENCY_CONFIG[p.urgency]
                  const isHovered = hoveredRow === p.id
                  return (
                    <tr
                      key={p.id}
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`border-b border-slate-100 transition-colors cursor-pointer ${
                        isHovered ? "bg-teal-50/60" : "bg-white"
                      } last:border-b-0`}
                    >
                      {/* Patient */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor}`}
                          >
                            {p.initials}
                          </div>
                          <div>
                            <p
                              className={`font-semibold text-sm transition-colors ${
                                isHovered ? "text-teal-700" : "text-slate-800"
                              }`}
                            >
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{p.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-700 font-medium">
                          {p.age}
                        </span>
                      </td>

                      {/* Sex */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            p.sex === "F"
                              ? "bg-pink-50 text-pink-600"
                              : "bg-sky-50 text-sky-600"
                          }`}
                        >
                          {p.sex === "F" ? "Female" : "Male"}
                        </span>
                      </td>

                      {/* Village */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.6}
                            className="w-3 h-3 text-slate-400 flex-shrink-0"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 8.5a2 2 0 100-4 2 2 0 000 4zM8 1a6 6 0 00-6 6c0 4 6 9 6 9s6-5 6-9a6 6 0 00-6-6z"
                            />
                          </svg>
                          <span className="text-sm text-slate-600">
                            {p.village}
                          </span>
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-600 leading-snug line-clamp-2">
                          {p.condition}
                        </span>
                      </td>

                      {/* Last Visit */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-sm font-medium ${
                            isRecent(p.lastVisit)
                              ? "text-teal-700"
                              : "text-slate-500"
                          }`}
                        >
                          {formatDate(p.lastVisit)}
                        </span>
                      </td>

                      {/* Urgency badge */}
                      <td className="px-4 py-3.5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${urg.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urg.dot}`}
                          />
                          {p.urgency}
                        </div>
                      </td>

                      {/* Row action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          className={`text-teal-500 hover:text-teal-700 transition-all ${
                            isHovered ? "opacity-100" : "opacity-0"
                          }`}
                          aria-label={`Open ${p.name}'s record`}
                        >
                          <ExternalIcon />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-600">
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-600">
              {filtered.length}
            </span>{" "}
            patients
          </p>

          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-teal-700 hover:bg-teal-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronIcon dir="left" />
              Prev
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
              )
              .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] as number > 1) acc.push("…")
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-xs text-slate-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      page === n
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-teal-700 hover:bg-teal-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              Next
              <ChevronIcon dir="right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
