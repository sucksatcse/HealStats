import { useState } from "react"

// ── Swatch data ──────────────────────────────────────────────────────────────────
const PRIMARY = [
  { name: "teal-50", hex: "#f0fdfa" },
  { name: "teal-100", hex: "#ccfbf1" },
  { name: "teal-200", hex: "#99f6e4" },
  { name: "teal-500", hex: "#14b8a6" },
  { name: "teal-600", hex: "#0d9488" },
  { name: "teal-700", hex: "#0f766e", note: "Primary" },
  { name: "teal-900", hex: "#134e4a" },
  { name: "teal-950", hex: "#042f2c" },
]

const NEUTRALS = [
  { name: "white", hex: "#ffffff" },
  { name: "slate-50", hex: "#f8fafc" },
  { name: "slate-100", hex: "#f1f5f9" },
  { name: "slate-200", hex: "#e2e8f0" },
  { name: "slate-400", hex: "#94a3b8" },
  { name: "slate-500", hex: "#64748b" },
  { name: "slate-700", hex: "#334155" },
  { name: "slate-900", hex: "#0f172a" },
]

const STATUS = [
  {
    name: "Critical / Danger",
    hex: "#dc2626",
    cls: "bg-red-600",
    chip: "bg-red-50 text-red-700 border-red-200",
    label: "red-600",
  },
  {
    name: "Warning / Pending",
    hex: "#f59e0b",
    cls: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    label: "amber-500",
  },
  {
    name: "Healthy / Success",
    hex: "#10b981",
    cls: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "emerald-500",
  },
]

const TYPE_SCALE = [
  {
    label: "Display / H1",
    cls: "font-display text-5xl text-teal-950",
    spec: "DM Serif Display · 48px",
    sample: "Records that never stop",
  },
  {
    label: "Heading / H2",
    cls: "font-display text-3xl text-teal-950",
    spec: "DM Serif Display · 30px",
    sample: "Everything a clinic needs",
  },
  {
    label: "Heading / H3",
    cls: "font-display text-xl text-teal-950",
    spec: "DM Serif Display · 20px",
    sample: "Offline-first by design",
  },
  {
    label: "Body Large",
    cls: "text-lg text-slate-600",
    spec: "Work Sans · 18px · 400",
    sample: "Capture visits and triage patients, online or off.",
  },
  {
    label: "Body",
    cls: "text-sm text-slate-600",
    spec: "Work Sans · 14px · 400",
    sample: "All data is stored locally and synced automatically.",
  },
  {
    label: "Label / Caption",
    cls: "text-xs font-semibold uppercase tracking-widest text-teal-600",
    spec: "Work Sans · 12px · 600",
    sample: "Built for the field",
  },
]

const SECTIONS = [
  { id: "colors", label: "Colors" },
  { id: "type", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "cards", label: "Cards" },
  { id: "badges", label: "Badges" },
]

export default function StyleGuidePage({ onBack }: { onBack?: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex)
    } catch {
      /* ignore */
    }
    setCopied(hex)
    setTimeout(() => setCopied(null), 1400)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-[Work_Sans,system-ui,sans-serif] text-slate-800">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-teal-100">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
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
            <div>
              <p className="font-display text-lg text-teal-900 leading-none">
                HealthStats
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Design System</p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
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
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-10 flex gap-10">
        {/* ── Section nav ── */}
        <nav className="hidden lg:block w-44 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
              On this page
            </p>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-white hover:text-teal-700 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* Intro */}
          <div>
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 mb-3">
              Design System
            </p>
            <h1 className="font-display text-4xl lg:text-5xl text-teal-950 leading-tight mb-3">
              The HealthStats look & feel
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
              A calm, high-clarity system built for rural clinics: a trustworthy
              teal core, quiet neutrals, and a clear red / yellow / green status
              language for triage and sync.
            </p>
          </div>

          {/* ── Colors ── */}
          <Section
            id="colors"
            title="Color Palette"
            desc="Tap any swatch to copy its hex value."
          >
            <ColorGroup
              title="Primary — Teal"
              swatches={PRIMARY}
              copied={copied}
              onCopy={copy}
            />
            <ColorGroup
              title="Neutrals — White & Slate"
              swatches={NEUTRALS}
              copied={copied}
              onCopy={copy}
            />

            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">
                Status Colors
              </h4>
              <div className="grid sm:grid-cols-3 gap-4">
                {STATUS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => copy(s.hex)}
                    className="text-left bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className={`h-16 rounded-xl ${s.cls} mb-3`} />
                    <p className="text-sm font-semibold text-slate-800">
                      {s.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400 font-mono">
                        {copied === s.hex ? "Copied!" : s.hex}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.chip}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Typography ── */}
          <Section
            id="type"
            title="Typography"
            desc="DM Serif Display for headlines, Work Sans for everything else."
          >
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {TYPE_SCALE.map((t) => (
                <div
                  key={t.label}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 px-5 py-5"
                >
                  <div className="w-40 flex-shrink-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {t.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{t.spec}</p>
                  </div>
                  <p className={`${t.cls} min-w-0 truncate`}>{t.sample}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Buttons ── */}
          <Section
            id="buttons"
            title="Buttons"
            desc="Primary for the main action, secondary for alternates, danger for destructive or emergency actions."
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="grid sm:grid-cols-3 gap-8">
                {/* Primary */}
                <ButtonSpec name="Primary">
                  <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm shadow-teal-600/20 transition-colors">
                    Save Patient
                  </button>
                  <button
                    className="w-full bg-teal-400 text-white font-semibold text-sm px-5 py-3 rounded-xl cursor-not-allowed"
                    disabled
                  >
                    Disabled
                  </button>
                </ButtonSpec>
                {/* Secondary */}
                <ButtonSpec name="Secondary">
                  <button className="w-full bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 hover:border-teal-300 font-semibold text-sm px-5 py-3 rounded-xl transition-colors">
                    View Records
                  </button>
                  <button className="w-full text-teal-700 hover:text-teal-900 font-semibold text-sm px-5 py-3 rounded-xl transition-colors">
                    Ghost / Text
                  </button>
                </ButtonSpec>
                {/* Danger */}
                <ButtonSpec name="Danger">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm shadow-red-600/20 transition-colors">
                    Emergency Report
                  </button>
                  <button className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold text-sm px-5 py-3 rounded-xl transition-colors">
                    Delete Record
                  </button>
                </ButtonSpec>
              </div>
            </div>
          </Section>

          {/* ── Cards ── */}
          <Section
            id="cards"
            title="Cards"
            desc="Rounded, softly bordered containers — the backbone of every screen."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Stat card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="text-xs text-slate-400 font-medium mb-2">
                  Patients Today
                </p>
                <p className="font-display text-3xl text-teal-700 mb-1">23</p>
                <p className="text-xs text-slate-400">+4 since morning</p>
              </div>
              {/* Patient card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    MK
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      Mariama Kouyaté
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      34 yrs · Female · PT-00412
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                    Follow-up
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                    Diagnosis
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    Malaria (uncomplicated)
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              rounded-2xl · border-slate-100 · p-5 · hover:shadow-md
            </p>
          </Section>

          {/* ── Badges ── */}
          <Section
            id="badges"
            title="Badges & Status Pills"
            desc="Compact status labels used across triage, sync, and patient lists."
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <BadgeRow label="Triage urgency">
                <Badge cls="bg-red-600 text-white">Immediate</Badge>
                <Badge cls="bg-amber-400 text-amber-950">Urgent</Badge>
                <Badge cls="bg-emerald-100 text-emerald-700">Delayed</Badge>
              </BadgeRow>
              <BadgeRow label="Patient status">
                <Badge cls="bg-blue-50 text-blue-600 border border-blue-200">
                  Follow-up
                </Badge>
                <Badge cls="bg-violet-50 text-violet-600 border border-violet-200">
                  Chronic
                </Badge>
                <Badge cls="bg-pink-50 text-pink-600 border border-pink-200">
                  Antenatal
                </Badge>
                <Badge cls="bg-amber-50 text-amber-600 border border-amber-200">
                  Acute
                </Badge>
              </BadgeRow>
              <BadgeRow label="Connectivity">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                  Online
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-slate-100 border-slate-200 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{" "}
                  Offline
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />{" "}
                  Syncing
                </span>
              </BadgeRow>
              <BadgeRow label="Counts">
                <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">
                  14
                </span>
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  SOS
                </span>
                <span className="text-[10px] font-bold bg-teal-600 text-white px-1.5 py-0.5 rounded-full">
                  3
                </span>
              </BadgeRow>
            </div>
          </Section>

          <p className="text-center text-xs text-slate-400 pt-4 pb-8">
            HealthStats Design System · teal core · built for the field
          </p>
        </main>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────────
function Section({
  id,
  title,
  desc,
  children,
}: {
  id: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="font-display text-2xl text-teal-950">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function ColorGroup({
  title,
  swatches,
  copied,
  onCopy,
}: {
  title: string
  swatches: { name: string hex: string note?: string }[]
  copied: string | null
  onCopy: (hex: string) => void
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-700 mb-3">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {swatches.map((s) => (
          <button
            key={s.name}
            onClick={() => onCopy(s.hex)}
            className="text-left group"
          >
            <div
              className="h-16 rounded-xl border border-slate-200/70 mb-2 transition-transform group-hover:-translate-y-0.5"
              style={{ backgroundColor: s.hex }}
            />
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-700 truncate">
                {s.name}
              </span>
              {s.note && (
                <span className="text-[9px] font-bold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                  {s.note}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {copied === s.hex ? "Copied!" : s.hex}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ButtonSpec({
  name,
  children,
}: {
  name: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
        {name}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function BadgeRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <p className="w-32 flex-shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function Badge({ cls, children }: { cls: string children: React.ReactNode }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${cls}`}
    >
      {children}
    </span>
  )
}
