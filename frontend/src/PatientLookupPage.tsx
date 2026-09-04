import { useState } from "react"

// ── Icons (large, simple) ────────────────────────────────────────────────────────
const Icon = {
  heart: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-full h-full"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.8 6.6a5.5 5.5 0 00-7.8 0L12 7.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 23l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"
      />
    </svg>
  ),
  calendar: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-full h-full"
    >
      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
      <path strokeLinecap="round" d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  ),
  clipboard: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-full h-full"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5h6M9 4.5a2 2 0 00-2 2H6a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2v-11a2 2 0 00-2-2h-1a2 2 0 00-2-2M8.5 13l2 2 4-4"
      />
    </svg>
  ),
  next: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-full h-full"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </svg>
  ),
  search: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      className="w-6 h-6"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  ),
  person: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-full h-full"
    >
      <circle cx="12" cy="8" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"
      />
    </svg>
  ),
  back: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      className="w-5 h-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
    </svg>
  ),
  warning: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-8 h-8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4.5m0 3.5h.01M10.3 3.9L2.4 17.3a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
      />
    </svg>
  ),
  phone: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 16.5v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 011.1 3.7 2 2 0 013 1.5h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.8-1.1a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"
      />
    </svg>
  ),
}

// ── Mock records ─────────────────────────────────────────────────────────────────
interface VisitRecord {
  name: string
  lastVisit: string
  clinic: string
  diagnosis: string
  advice: string
  status: "well" | "followup"
  nextVisit: string
}

const RECORDS: Record<string, VisitRecord> = {
  "PT-00412": {
    name: "Mariama Kouyaté",
    lastVisit: "Monday, 25 August 2026",
    clinic: "Kayes District Clinic",
    diagnosis: "Malaria",
    advice: "Take all medicine. Rest and drink water.",
    status: "followup",
    nextVisit: "Monday, 8 September 2026",
  },
  "PT-00389": {
    name: "Ibrahim Traoré",
    lastVisit: "Tuesday, 26 August 2026",
    clinic: "Kayes District Clinic",
    diagnosis: "Diabetes (sugar disease)",
    advice: "Take medicine every day. Eat less sugar.",
    status: "followup",
    nextVisit: "Saturday, 20 September 2026",
  },
  "PT-00358": {
    name: "Sekou Bah",
    lastVisit: "Sunday, 24 August 2026",
    clinic: "Char Fasson Clinic",
    diagnosis: "Small cut on arm",
    advice: "Keep the cut clean and dry. You are healing well.",
    status: "well",
    nextVisit: "No visit needed. You are well.",
  },
}

interface PatientLookupPageProps {
  onBack: () => void
}

export default function PatientLookupPage({ onBack }: PatientLookupPageProps) {
  const [id, setId] = useState("")
  const [record, setRecord] = useState<VisitRecord | null>(null)
  const [notFound, setNotFound] = useState(false)

  const lookup = () => {
    const key = id.trim().toUpperCase()
    const found = RECORDS[key]
    if (found) {
      setRecord(found)
      setNotFound(false)
    } else {
      setRecord(null)
      setNotFound(true)
    }
  }

  const reset = () => {
    setRecord(null)
    setNotFound(false)
    setId("")
  }

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col font-[Work_Sans,system-ui,sans-serif]">
      {/* ── Simple top bar ── */}
      <header className="bg-white border-b border-teal-100">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2.2}
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <span className="font-display text-xl text-teal-900">
              Health<span className="text-teal-600">Stats</span>
            </span>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            {Icon.back} Home
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-8 sm:py-12">
        {!record ? (
          <>
            {/* ── Lookup form ── */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-5 p-5">
                {Icon.clipboard}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl text-teal-950 leading-tight mb-3">
                Check Your Visit
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-md mx-auto">
                Type your Patient ID number to see your last visit and your next
                visit date.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-teal-100 shadow-sm p-6 sm:p-8">
              <label
                htmlFor="pid"
                className="block text-lg font-semibold text-teal-950 mb-3"
              >
                Your Patient ID
              </label>
              <input
                id="pid"
                type="text"
                value={id}
                onChange={(e) => {
                  setId(e.target.value)
                  setNotFound(false)
                }}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
                placeholder="PT-00412"
                autoComplete="off"
                className="w-full text-center text-2xl sm:text-3xl font-bold tracking-wider uppercase text-teal-900 placeholder:text-slate-300 placeholder:font-normal border-2 border-teal-200 rounded-2xl px-4 py-5 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 transition-all"
              />
              <p className="text-sm text-slate-400 mt-3 text-center">
                Your ID is on your clinic card. It looks like{" "}
                <span className="font-semibold text-slate-500">PT-00412</span>.
              </p>

              {notFound && (
                <div className="mt-5 flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-4 text-amber-800">
                  <span className="text-amber-500 flex-shrink-0">
                    {Icon.warning}
                  </span>
                  <div>
                    <p className="font-bold text-lg leading-tight">
                      We could not find that ID
                    </p>
                    <p className="text-base mt-1 leading-snug">
                      Please check the number and try again, or ask a health
                      worker for help.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={lookup}
                disabled={id.trim() === ""}
                className="w-full mt-6 flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xl font-bold py-5 rounded-2xl shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                {Icon.search}
                Show My Visit
              </button>
            </div>

            {/* Try-it hint */}
            <p className="text-center text-sm text-slate-400 mt-6">
              Try:{" "}
              <button
                onClick={() => setId("PT-00412")}
                className="font-semibold text-teal-600 underline"
              >
                PT-00412
              </button>
              {" · "}
              <button
                onClick={() => setId("PT-00358")}
                className="font-semibold text-teal-600 underline"
              >
                PT-00358
              </button>
            </p>
          </>
        ) : (
          <>
            {/* ── Result ── */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center p-4 flex-shrink-0">
                {Icon.person}
              </div>
              <div>
                <p className="text-base text-slate-500">Visit summary for</p>
                <h1 className="font-display text-3xl text-teal-950 leading-tight">
                  {record.name}
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              {/* Last visit */}
              <SummaryCard
                icon={Icon.calendar}
                tone="teal"
                label="Your last visit"
                value={record.lastVisit}
                sub={`at ${record.clinic}`}
              />

              {/* Diagnosis */}
              <SummaryCard
                icon={Icon.clipboard}
                tone="violet"
                label="What we found"
                value={record.diagnosis}
                sub={record.advice}
              />

              {/* Next visit */}
              <SummaryCard
                icon={record.status === "well" ? Icon.heart : Icon.next}
                tone={record.status === "well" ? "green" : "amber"}
                label={
                  record.status === "well" ? "You are well" : "Come back on"
                }
                value={record.nextVisit}
                sub={
                  record.status === "well"
                    ? "No follow-up needed right now."
                    : "Please come to the clinic on this day."
                }
              />
            </div>

            {/* Help */}
            <div className="mt-6 bg-white rounded-2xl border border-teal-100 px-5 py-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                {Icon.phone}
              </span>
              <div>
                <p className="font-semibold text-teal-950 text-base leading-tight">
                  Need help?
                </p>
                <p className="text-sm text-slate-500">
                  Call your clinic or ask a health worker.
                </p>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full mt-6 flex items-center justify-center gap-2 border-2 border-teal-300 text-teal-800 hover:bg-white text-lg font-bold py-4 rounded-2xl transition-colors"
            >
              {Icon.back} Check Another ID
            </button>
          </>
        )}
      </main>

      <footer className="py-6 text-center">
        <p className="text-sm text-slate-400">
          Your information is private and safe.
        </p>
      </footer>
    </div>
  )
}

// ── Big readable summary card ──────────────────────────────────────────────────────
function SummaryCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  tone: "teal" | "violet" | "amber" | "green"
  label: string
  value: string
  sub: string
}) {
  const tones = {
    teal: { icon: "bg-teal-100 text-teal-700", edge: "border-l-teal-400" },
    violet: {
      icon: "bg-violet-100 text-violet-700",
      edge: "border-l-violet-400",
    },
    amber: { icon: "bg-amber-100 text-amber-700", edge: "border-l-amber-400" },
    green: {
      icon: "bg-emerald-100 text-emerald-700",
      edge: "border-l-emerald-400",
    },
  }[tone]

  return (
    <div
      className={`bg-white rounded-2xl border border-teal-100 border-l-8 ${tones.edge} p-5 sm:p-6 flex items-start gap-4`}
    >
      <span
        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 p-3.5 ${tones.icon}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-base text-slate-500 font-medium">{label}</p>
        <p className="text-2xl sm:text-[28px] font-bold text-teal-950 leading-tight mt-0.5">
          {value}
        </p>
        <p className="text-lg text-slate-600 leading-snug mt-1.5">{sub}</p>
      </div>
    </div>
  )
}
