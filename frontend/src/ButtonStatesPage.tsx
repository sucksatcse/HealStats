import { useState } from "react"

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

const plusIcon = (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-4 h-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12M4 10h12" />
  </svg>
)

// ── State definitions ────────────────────────────────────────────────────────
// Each state is rendered as a *forced* static visual so all five sit side by side.
// The real interactive specimen at the bottom proves the transitions actually fire.
type Variant = "primary" | "secondary"

const STATES: {
  id: string
  label: string
  note: string
  classes: Record<Variant, string>
  content: (v: Variant) => React.ReactNode
  disabled?: boolean
}[] = [
  {
    id: "default",
    label: "Default",
    note: "Resting state. Solid teal fill (primary) or teal outline on white (secondary).",
    classes: {
      primary: "bg-teal-600 text-white shadow-sm shadow-teal-600/20",
      secondary: "bg-white text-teal-700 border border-teal-300",
    },
    content: () => <>{plusIcon}New Patient</>,
  },
  {
    id: "hover",
    label: "Hover",
    note: "Darkens one step and lifts with a 1.03× scale + deeper shadow. 150ms ease-out.",
    classes: {
      primary:
        "bg-teal-700 text-white shadow-md shadow-teal-700/30 scale-[1.03]",
      secondary: "bg-teal-50 text-teal-800 border border-teal-400 scale-[1.03]",
    },
    content: () => <>{plusIcon}New Patient</>,
  },
  {
    id: "active",
    label: "Active / Pressed",
    note: "Presses in — darkest teal, scales down to 0.97×, shadow collapses inward.",
    classes: {
      primary: "bg-teal-800 text-white shadow-inner scale-[0.97]",
      secondary:
        "bg-teal-100 text-teal-900 border border-teal-500 scale-[0.97]",
    },
    content: () => <>{plusIcon}New Patient</>,
  },
  {
    id: "disabled",
    label: "Disabled",
    note: "Non-interactive. Desaturated, 55% opacity, not-allowed cursor, no shadow.",
    classes: {
      primary:
        "bg-teal-600 text-white opacity-55 cursor-not-allowed shadow-none",
      secondary:
        "bg-white text-slate-400 border border-slate-200 cursor-not-allowed",
    },
    content: () => <>{plusIcon}New Patient</>,
    disabled: true,
  },
  {
    id: "loading",
    label: "Loading",
    note: "Awaiting a response. Spinner replaces the icon; label shifts to progress copy.",
    classes: {
      primary: "bg-teal-600 text-white shadow-sm cursor-wait",
      secondary: "bg-white text-teal-700 border border-teal-300 cursor-wait",
    },
    content: () => (
      <>
        <Spinner className="w-4 h-4" />
        Saving…
      </>
    ),
  },
]

// ── Interactive specimen (real transitions) ──────────────────────────────────
function LiveButton({ variant }: { variant: Variant }) {
  const [loading, setLoading] = useState(false)

  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"

  const look =
    variant === "primary"
      ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20 hover:bg-teal-700 hover:scale-[1.03] hover:shadow-md active:bg-teal-800 active:scale-[0.97] disabled:opacity-55 disabled:cursor-wait disabled:hover:scale-100"
      : "bg-white text-teal-700 border border-teal-300 hover:bg-teal-50 hover:border-teal-400 hover:scale-[1.03] active:bg-teal-100 active:border-teal-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait disabled:hover:scale-100"

  return (
    <button
      className={`${base} ${look}`}
      disabled={loading}
      onClick={() => {
        setLoading(true)
        setTimeout(() => setLoading(false), 1800)
      }}
    >
      {loading ? <Spinner className="w-4 h-4" /> : plusIcon}
      {loading ? "Saving…" : "New Patient"}
    </button>
  )
}

// ── Row of static specimens for one variant ──────────────────────────────────
function VariantRow({ variant }: { variant: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {STATES.map((s) => (
        <div
          key={s.id}
          className="flex flex-col items-center text-center gap-3"
        >
          <div className="h-20 flex items-center justify-center w-full">
            <button
              className={`${base} ${s.classes[variant]}`}
              disabled={s.disabled}
              tabIndex={-1}
            >
              {s.content(variant)}
            </button>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{s.label}</p>
            <span className="mt-1 inline-block text-[10px] font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
              :{s.id}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ButtonStatesPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 font-[Work_Sans,system-ui,sans-serif]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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

        {/* Header */}
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 mb-3">
          Micro-interactions
        </p>
        <h1 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-3 max-w-2xl">
          Button states, annotated
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
          Every button in HealthStats moves through the same five states.
          Consistent, legible feedback matters most when a health worker is
          tapping quickly between patients.
        </p>

        {/* Primary sheet */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            <h2 className="font-semibold text-slate-800">Primary button</h2>
            <span className="text-xs text-slate-400">
              — main call to action, one per view
            </span>
          </div>
          <VariantRow variant="primary" />
        </section>

        {/* Secondary sheet */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-teal-500" />
            <h2 className="font-semibold text-slate-800">Secondary button</h2>
            <span className="text-xs text-slate-400">
              — supporting actions, sits beside the primary
            </span>
          </div>
          <VariantRow variant="secondary" />
        </section>

        {/* Annotations */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 mb-6">
          <h2 className="font-semibold text-slate-800 mb-5">
            State annotations
          </h2>
          <div className="space-y-3">
            {STATES.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0"
              >
                <span className="mt-0.5 text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded w-24 flex-shrink-0 text-center">
                  :{s.id}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {s.label}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {s.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live specimen */}
        <section className="bg-gradient-to-br from-teal-50 to-white rounded-2xl border border-teal-100 p-6 lg:p-8">
          <h2 className="font-semibold text-slate-800 mb-1">Try it live</h2>
          <p className="text-sm text-slate-500 mb-6">
            Hover, press, and click — clicking triggers the loading state for ~2
            seconds.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <LiveButton variant="primary" />
            <LiveButton variant="secondary" />
          </div>
        </section>
      </div>
    </div>
  )
}
