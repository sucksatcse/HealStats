import { useState } from "react"

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  alert: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  ),
  pin: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  users: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  ),
  camera: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
      />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  send: (
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
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      className="w-8 h-8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  ),
  x: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
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
}

// ── Data ───────────────────────────────────────────────────────────────────────
const INCIDENT_TYPES = [
  "Cyclone / Storm surge",
  "Monsoon flood",
  "Building collapse",
  "Road traffic accident (mass)",
  "Boat / ferry capsize",
  "Fire",
  "Disease outbreak cluster",
  "Chemical / industrial exposure",
  "Other emergency",
]

const SEVERITY_LEVELS = [
  {
    id: "critical",
    label: "Critical",
    desc: "Mass casualties, lives at immediate risk",
    dot: "bg-red-600",
    ring: "peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:ring-red-500/20 dark:peer-checked:bg-red-950/40",
    text: "peer-checked:text-red-800 dark:peer-checked:text-red-300",
  },
  {
    id: "severe",
    label: "Severe",
    desc: "Multiple serious injuries, urgent care needed",
    dot: "bg-orange-500",
    ring: "peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:ring-orange-500/20 dark:peer-checked:bg-orange-950/40",
    text: "peer-checked:text-orange-800 dark:peer-checked:text-orange-300",
  },
  {
    id: "moderate",
    label: "Moderate",
    desc: "Injuries present, situation contained",
    dot: "bg-amber-400",
    ring: "peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:ring-amber-400/20 dark:peer-checked:bg-amber-950/40",
    text: "peer-checked:text-amber-800 dark:peer-checked:text-amber-300",
  },
]

// Approximate coastal / delta clinic pins for the mock map
const MAP_PINS = [
  { id: "char-fasson", label: "Char Fasson", x: 38, y: 58 },
  { id: "hatiya", label: "Hatiya Island", x: 55, y: 68 },
  { id: "sandwip", label: "Sandwip", x: 64, y: 74 },
  { id: "monpura", label: "Monpura", x: 46, y: 72 },
  { id: "kutubdia", label: "Kutubdia", x: 72, y: 84 },
]

export default function EmergencyReportPage() {
  const [incidentType, setIncidentType] = useState("")
  const [location, setLocation] = useState<string | null>(null)
  const [affected, setAffected] = useState("")
  const [severity, setSeverity] = useState("critical")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const now = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const canSubmit = incidentType !== "" && location !== null && affected !== ""

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).map((f) => f.name)
    setPhotos((prev) => [...prev, ...next].slice(0, 6))
  }

  if (submitted) {
    const pinLabel = MAP_PINS.find((p) => p.id === location)?.label ?? "Unknown"
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-red-100 dark:border-red-900/50 shadow-xl shadow-red-900/5 overflow-hidden">
          <div className="bg-gradient-to-br from-red-600 to-orange-600 px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white mx-auto mb-4">
              {Icon.check}
            </div>
            <h2 className="font-display text-3xl text-white">
              Emergency report dispatched
            </h2>
            <p className="text-red-50 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Queued locally and broadcasting to the District Coordination
              Centre. It will resend automatically until acknowledged.
            </p>
          </div>
          <div className="px-8 py-6 space-y-3">
            {[
              ["Reference", "EMG-2026-0834"],
              ["Incident", incidentType],
              ["Location", pinLabel],
              ["People affected", affected],
              [
                "Severity",
                SEVERITY_LEVELS.find((s) => s.id === severity)?.label,
              ],
              ["Filed", now],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-slate-400 dark:text-slate-500 font-medium">{k}</span>
                <span className="text-slate-800 dark:text-slate-100 font-semibold text-right">
                  {v}
                </span>
              </div>
            ))}
          </div>
          <div className="px-8 pb-8">
            <button
              onClick={() => {
                setSubmitted(false)
                setIncidentType("")
                setLocation(null)
                setAffected("")
                setSeverity("critical")
                setNotes("")
                setPhotos([])
              }}
              className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
            >
              File another report
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto pb-4">
      {/* Disaster-mode banner */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 mb-6 flex items-center gap-4 shadow-lg shadow-red-900/10 relative overflow-hidden">
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
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/20 rounded-full px-2 py-0.5">
              Disaster Mode
            </span>
            <span className="flex items-center gap-1 text-[11px] text-red-50 font-medium">
              {Icon.clock} {now}
            </span>
          </div>
          <h1 className="font-display text-2xl text-white mt-1.5 leading-tight">
            Emergency Incident Report
          </h1>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        Report a mass-casualty or emergency event. Fields marked{" "}
        <span className="text-red-600 dark:text-red-400 font-semibold">*</span> are required to
        dispatch. Reports are stored offline and broadcast the moment any signal
        returns.
      </p>

      <div className="space-y-6">
        {/* Incident type */}
        <Field label="Incident Type" required icon={Icon.alert}>
          <div className="relative">
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className={`w-full appearance-none rounded-xl border bg-white dark:bg-slate-900 pl-4 pr-10 py-3.5 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-red-500/15 focus:border-red-400 ${
                incidentType
                  ? "border-slate-300 text-slate-800 dark:border-slate-700 dark:text-slate-100"
                  : "border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500"
              }`}
            >
              <option value="" disabled>
                Select incident type…
              </option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {Icon.chevron}
            </span>
          </div>
        </Field>

        {/* Location map pin selector */}
        <Field label="Location" required icon={Icon.pin}>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40">
            <div className="relative aspect-[16/9] bg-gradient-to-br from-sky-50 to-teal-50">
              <svg
                viewBox="0 0 100 56"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >
                {/* water */}
                <rect width="100" height="56" fill="#e6f4f6" />
                {/* delta landmass */}
                <path
                  d="M0 0 H100 V30 C88 33 80 30 70 36 C60 42 52 40 44 46 C36 52 24 50 14 54 C8 56 4 54 0 56 Z"
                  fill="#dcefe3"
                />
                {/* rivers */}
                <path
                  d="M30 0 C34 14 26 22 32 34 C36 44 30 50 34 56"
                  stroke="#bfe3ea"
                  strokeWidth="1.6"
                  fill="none"
                />
                <path
                  d="M62 0 C58 12 66 20 60 30 C56 38 62 46 58 56"
                  stroke="#bfe3ea"
                  strokeWidth="1.6"
                  fill="none"
                />
              </svg>

              {/* pins */}
              {MAP_PINS.map((p) => {
                const active = location === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLocation(p.id)}
                    className="absolute -translate-x-1/2 -translate-y-full group focus:outline-none"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    aria-label={`Select ${p.label}`}
                  >
                    {active && (
                      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500/25 animate-ping" />
                    )}
                    <span
                      className={`relative block transition-all ${
                        active
                          ? "text-red-600 scale-125"
                          : "text-slate-400 group-hover:text-red-400 group-hover:scale-110"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 drop-shadow"
                      >
                        <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z" />
                        <circle cx="12" cy="9" r="2.5" fill="white" />
                      </svg>
                    </span>
                    <span
                      className={`absolute left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap text-[10px] font-semibold px-1.5 py-0.5 rounded transition-opacity ${
                        active
                          ? "bg-red-600 text-white opacity-100"
                          : "bg-white/90 text-slate-500 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {p.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
              {location ? (
                <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold">
                  <span className="text-red-500">{Icon.pin}</span>
                  {MAP_PINS.find((p) => p.id === location)?.label} selected
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">
                  Tap a pin to mark the incident location
                </span>
              )}
            </div>
          </div>
        </Field>

        {/* Number affected + Severity */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label="People Affected" required icon={Icon.users}>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={affected}
              onChange={(e) => setAffected(e.target.value)}
              placeholder="e.g. 45"
              className="w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all focus:outline-none focus:ring-4 focus:ring-red-500/15 focus:border-red-400"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {["1–5", "6–20", "21–50", "50+"].map((r, i) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAffected(["3", "12", "35", "60"][i])}
                  className="text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-full px-2.5 py-1 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Severity" required icon={Icon.alert}>
            <div className="space-y-2">
              {SEVERITY_LEVELS.map((s) => (
                <label key={s.id} className="block cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    className="peer sr-only"
                    checked={severity === s.id}
                    onChange={() => setSeverity(s.id)}
                  />
                  <div
                    className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3.5 py-2.5 transition-all peer-focus-visible:ring-4 ${s.ring}`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`}
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold text-slate-700 dark:text-slate-200 ${s.text}`}
                      >
                        {s.label}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* Photo upload */}
        <Field label="Photo Evidence" icon={Icon.camera}>
          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/40 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-red-800 dark:hover:bg-red-950/20 transition-colors py-8 cursor-pointer text-center">
            <span className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-red-500">
              {Icon.camera}
            </span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tap to add photos
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Compressed and stored offline · up to 6 images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {photos.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg pl-2.5 pr-1.5 py-1.5"
                >
                  <span className="text-red-500">{Icon.camera}</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[120px] truncate">
                    {name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors p-0.5"
                    aria-label="Remove photo"
                  >
                    {Icon.x}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        {/* Notes */}
        <Field label="Situation Notes" icon={Icon.alert}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Access routes, resources needed, hazards on site…"
            className="w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none transition-all focus:outline-none focus:ring-4 focus:ring-red-500/15 focus:border-red-400"
          />
        </Field>

        {/* Submit */}
        <div className="pt-2 sticky bottom-0">
          <button
            onClick={() => canSubmit && setSubmitted(true)}
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-base font-bold uppercase tracking-wide transition-all ${
              canSubmit
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-xl shadow-red-600/30 hover:shadow-2xl hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0"
                : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            {Icon.send}
            Submit Emergency Report
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2.5">
              Complete incident type, location, and people affected to dispatch.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Field wrapper ────────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string
  required?: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
        <span className="text-red-500">{icon}</span>
        {label}
        {required && <span className="text-red-600 dark:text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
