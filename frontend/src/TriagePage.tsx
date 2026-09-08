import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

// ── Types ──────────────────────────────────────────────────────────────────────
type UrgencyLevel = "Low" | "Medium" | "High"

type FactorKey = "bp" | "temp" | "pulse" | "spo2" | "complaint" | "critical"
type FactorStatus = "ok" | "warn" | "critical"

const FACTOR_KEYS: FactorKey[] = ["bp", "temp", "pulse", "spo2", "complaint", "critical"]

const CONFIDENCE: Record<UrgencyLevel, number> = {
  Low: 91,
  Medium: 83,
  High: 97,
}

const FACTOR_STATUS: Record<UrgencyLevel, Record<FactorKey, FactorStatus>> = {
  Low: { bp: "ok", temp: "ok", pulse: "ok", spo2: "ok", complaint: "ok", critical: "ok" },
  Medium: { bp: "warn", temp: "warn", pulse: "warn", spo2: "ok", complaint: "warn", critical: "ok" },
  High: { bp: "critical", temp: "critical", pulse: "critical", spo2: "critical", complaint: "critical", critical: "critical" },
}


// ── Palette ────────────────────────────────────────────────────────────────────
const PALETTE: Record<UrgencyLevel, {
  bg: string
  border: string
  text: string
  muted: string
  badgeBg: string
  badgeText: string
  ring: string
  glow: string
  factorWarn: string
  factorCrit: string
  factorOk: string
  btnEscalate: string
  dotPulse: string
}> = {
  Low: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900/50",
    text: "text-emerald-900 dark:text-emerald-300",
    muted: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    ring: "#10b981",
    glow: "shadow-emerald-200",
    factorWarn: "",
    factorCrit: "",
    factorOk: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/50",
    btnEscalate: "border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/40",
    dotPulse: "bg-emerald-400",
  },
  Medium: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900/50",
    text: "text-amber-900 dark:text-amber-300",
    muted: "text-amber-700 dark:text-amber-400",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    ring: "#f59e0b",
    glow: "shadow-amber-200",
    factorWarn: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50",
    factorCrit: "",
    factorOk: "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800",
    btnEscalate: "border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/40",
    dotPulse: "bg-amber-400",
  },
  High: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900/50",
    text: "text-red-900 dark:text-red-300",
    muted: "text-red-700 dark:text-red-400",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    ring: "#ef4444",
    glow: "shadow-red-200",
    factorWarn: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50",
    factorCrit: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900/50",
    factorOk: "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800",
    btnEscalate: "border-red-400 bg-red-600 text-white hover:bg-red-700",
    dotPulse: "bg-red-500",
  },
}

const FACTOR_STATUS_ICON = {
  ok: { icon: "✓", cls: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40" },
  warn: { icon: "!", cls: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40" },
  critical: { icon: "✕", cls: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40" },
}

// ── Confidence ring (SVG) ──────────────────────────────────────────────────────
function ConfidenceRing({
  pct,
  color,
  animate,
}: {
  pct: number
  color: string
  animate: boolean
}) {
  const r = 52
  const circ = 2 * Math.PI * r
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (!animate) {
      setDisplayed(pct)
      return
    }
    setDisplayed(0)
    const start = performance.now()
    const duration = 1100
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(ease * pct))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [pct, animate])

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
      />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (circ * displayed) / 100}
        style={{
          transition: animate
            ? "none"
            : "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      {/* Centre text rendered in a foreignObject to avoid rotation weirdness */}
    </svg>
  )
}

// ── Typewriter ─────────────────────────────────────────────────────────────────
function useTypewriter(text: string, active: boolean) {
  const [out, setOut] = useState("")
  const prev = useRef("")
  useEffect(() => {
    if (!active) {
      setOut("")
      prev.current = ""
      return
    }
    if (prev.current === text) return
    prev.current = text
    setOut("")
    let i = 0
    const t = setInterval(() => {
      if (i < text.length) setOut(text.slice(0, ++i))
      else clearInterval(t)
    }, 14)
    return () => clearInterval(t)
  }, [text, active])
  return out
}

// ── Saved / escalated toast ───────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-teal-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl animate-slide-up">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        className="w-4 h-4 text-teal-300 flex-shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 8-8" />
      </svg>
      {message}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TriagePage() {
  const { t } = useTranslation()
  const [level, setLevel] = useState<UrgencyLevel>("Medium")
  const [animating, setAnimating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [escalated, setEscalated] = useState(false)
  const [saved, setSaved] = useState(false)

  const lk = level.toLowerCase()
  const p = PALETTE[level]
  const confidence = CONFIDENCE[level]
  const factors = FACTOR_KEYS.map((k) => ({
    key: k,
    label: t(`triage:factorLabel.${k}`),
    value: t(`triage:${lk}.f.${k}.value`),
    status: FACTOR_STATUS[level][k],
    detail: t(`triage:${lk}.f.${k}.detail`),
  }))
  const summary = t(`triage:${lk}.summary`)
  const headline = t(`triage:${lk}.headline`)
  const recommendation = t(`triage:${lk}.recommendation`)
  const escalationNote = t(`triage:${lk}.escalation`)
  const nextReview = t(`triage:${lk}.nextReview`)
  const levelLabel = t(`triage:lvl${level}`)
  const typed = useTypewriter(summary, true)

  const switchLevel = (next: UrgencyLevel) => {
    if (next === level) return
    setAnimating(true)
    setLevel(next)
    setTimeout(() => setAnimating(false), 1200)
  }

  const handleSave = () => {
    setSaved(true)
    setToast(t("triage:toastSaved"))
  }

  const handleEscalate = () => {
    setEscalated(true)
    setToast(t("triage:toastEscalated"))
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-10 relative">
      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950 dark:text-white">
            {t("triage:title")}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {t("triage:generatedFor")}{" "}
            <span className="font-semibold text-teal-700 dark:text-teal-300">Mariama Kouyaté</span>
            <span className="text-slate-300 dark:text-slate-600 mx-1.5">·</span>
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">PT-00412</span>
            <span className="text-slate-300 dark:text-slate-600 mx-1.5">·</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              ,{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
        {/* Demo switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(["Low", "Medium", "High"] as UrgencyLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => switchLevel(l)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                level === l
                  ? "bg-white shadow-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {t(`triage:lvl${l}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero urgency card ── */}
      <div
        className={`${p.bg} ${p.border} border rounded-3xl px-6 py-8 transition-all duration-500`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Ring + badge */}
          <div className="relative flex-shrink-0 flex flex-col items-center gap-3">
            <div className="relative">
              <ConfidenceRing
                pct={confidence}
                color={p.ring}
                animate={animating}
              />
              {/* Centre overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`font-display text-3xl font-bold transition-all ${p.text}`}
                >
                  {confidence}%
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${p.muted}`}
                >
                  {t("triage:confidence")}
                </span>
              </div>
            </div>
            {/* Urgency badge */}
            <div
              className={`inline-flex items-center gap-2 ${p.badgeBg} ${p.badgeText} px-5 py-2 rounded-2xl shadow-lg ${p.glow} shadow-md`}
            >
              <span
                className={`w-2 h-2 rounded-full bg-white/60 ${
                  level === "High" ? "animate-ping" : ""
                }`}
              />
              <span className="text-sm font-bold uppercase tracking-wider">
                {levelLabel} {t("triage:urgencySuffix")}
              </span>
            </div>
          </div>

          {/* Text panel */}
          <div className="flex-1 text-center sm:text-left">
            <h2
              className={`font-display text-2xl lg:text-[26px] leading-tight mb-3 ${p.text}`}
            >
              {headline}
            </h2>
            <p className={`text-sm leading-relaxed ${p.muted} min-h-[4rem]`}>
              {typed}
              <span className="animate-pulse opacity-60">|</span>
            </p>

            {/* Next review */}
            <div
              className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-xl border text-xs font-semibold ${p.border} ${p.muted} bg-white/60 dark:bg-slate-900/60`}
            >
              <svg
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="w-3.5 h-3.5"
              >
                <circle cx="7" cy="7" r="5.5" />
                <path strokeLinecap="round" d="M7 4v3.5l2 1.5" />
              </svg>
              {t("triage:nextReviewLabel")}: {nextReview}
            </div>
          </div>
        </div>
      </div>

      {/* ── Factor breakdown ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 4h12M2 8h8M2 12h5"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("triage:whyScore")}
          </h2>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {factors.filter((f) => f.status !== "ok").length > 0
              ? t("triage:flagsDetected", {
                  count: factors.filter((f) => f.status !== "ok").length,
                })
              : t("triage:allClear")}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {factors.map(({ key, label, value, status, detail }) => {
            const ic = FACTOR_STATUS_ICON[status]
            const rowCls =
              status === "critical"
                ? p.factorCrit || "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900/50"
                : status === "warn"
                  ? p.factorWarn || "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50"
                  : p.factorOk || "bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800"
            return (
              <div
                key={key}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${rowCls}`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${ic.cls}`}
                >
                  {ic.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {label}
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        status === "critical"
                          ? "text-red-700 dark:text-red-400"
                          : status === "warn"
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    {detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Clinical recommendation ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 3.5v9M4.5 7h7"
              />
              <rect x="1.5" y="1.5" width="13" height="13" rx="2" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("triage:clinicalRec")}
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
          {recommendation}
        </p>

        {/* Escalation threshold note */}
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            level === "High"
              ? "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900/50"
              : level === "Medium"
                ? "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50"
                : "bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              level === "High"
                ? "text-red-500 dark:text-red-400"
                : level === "Medium"
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <path
              fillRule="evenodd"
              d="M6.457 1.047a.75.75 0 011.086 0l6.857 7.5a.75.75 0 01-.543 1.953H2.143a.75.75 0 01-.543-1.953l6.857-7.5zM8 4.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zm.5 7a.5.5 0 11-1 0 .5.5 0 011 0z"
              clipRule="evenodd"
            />
          </svg>
          <p
            className={`text-xs leading-relaxed ${
              level === "High"
                ? "text-red-800 dark:text-red-300"
                : level === "Medium"
                  ? "text-amber-800 dark:text-amber-300"
                  : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <strong>{t("triage:escalationNoteLabel")}</strong>
            {escalationNote}
          </p>
        </div>
      </div>

      {/* ── Model info strip ── */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {[
          { label: t("triage:model"), value: t("triage:modelVal") },
          {
            label: t("triage:dataSources"),
            value: t("triage:dataSourcesVal"),
          },
          { label: t("triage:thresholdSet"), value: t("triage:thresholdVal") },
          { label: t("triage:processed"), value: t("triage:processedVal") },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {label}:
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Action buttons ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-5 flex flex-col sm:flex-row items-center gap-3">
        {/* Disclaimer */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed flex-1">
          {t("triage:disclaimer")}
        </p>

        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          {/* Save Record */}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
              saved
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400 cursor-default"
                : "bg-white border-slate-300 text-slate-700 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-teal-700 dark:hover:text-teal-300 dark:hover:bg-teal-950/40"
            }`}
          >
            {saved ? (
              <>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2 8l4 4 8-8"
                  />
                </svg>
                {t("triage:saved")}
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 11v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2M8 2v8m-3-3l3 3 3-3"
                  />
                </svg>
                {t("triage:saveRecord")}
              </>
            )}
          </button>

          {/* Escalate to Doctor */}
          <button
            onClick={handleEscalate}
            disabled={escalated}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
              escalated
                ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-500 cursor-default"
                : level === "High"
                  ? "bg-red-600 border-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/25 hover:-translate-y-0.5"
                  : level === "Medium"
                    ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/25 hover:-translate-y-0.5"
                    : "border-slate-300 text-slate-700 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-teal-700 dark:hover:text-teal-300 dark:hover:bg-teal-950/40"
            }`}
          >
            {escalated ? (
              <>
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
                    d="M2 8l4 4 8-8"
                  />
                </svg>
                {t("triage:alertSent")}
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 1v6m0 0l-2.5-2.5M8 7l2.5-2.5M3 10a5 5 0 0010 0"
                  />
                </svg>
                {t("triage:escalate")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
