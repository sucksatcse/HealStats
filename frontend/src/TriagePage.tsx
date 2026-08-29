import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type UrgencyLevel = "Low" | "Medium" | "High";

interface TriageScenario {
  level: UrgencyLevel;
  confidence: number;
  headline: string;
  summary: string;
  factors: { label: string; value: string; status: "ok" | "warn" | "critical"; detail: string }[];
  recommendation: string;
  escalationNote: string;
  nextReview: string;
}

// ── Demo scenarios ─────────────────────────────────────────────────────────────
const SCENARIOS: Record<UrgencyLevel, TriageScenario> = {
  Low: {
    level: "Low",
    confidence: 91,
    headline: "Routine care appropriate",
    summary:
      "Vitals are within expected ranges for this patient's age and condition profile. Reported symptoms are mild and consistent with a self-limiting illness. No red-flag indicators detected.",
    factors: [
      { label: "Blood Pressure",      value: "118/76 mmHg",  status: "ok",       detail: "Within normal range (systolic 90–120)" },
      { label: "Temperature",         value: "37.1 °C",      status: "ok",       detail: "Afebrile — no fever detected" },
      { label: "Pulse Rate",          value: "74 bpm",       status: "ok",       detail: "Regular and within normal limits" },
      { label: "SpO₂",               value: "98%",          status: "ok",       detail: "Normal oxygen saturation" },
      { label: "Chief Complaint",     value: "Mild cough",   status: "ok",       detail: "Duration < 3 days, no haemoptysis" },
      { label: "Critical Symptoms",   value: "None reported",status: "ok",       detail: "No convulsions, bleeding, or chest pain" },
    ],
    recommendation:
      "Schedule for standard outpatient consultation. No immediate intervention required. Patient may wait in general queue. Reassess if symptoms worsen or fever develops within 48 hours.",
    escalationNote: "Escalation not currently indicated. Contact duty clinician if patient reports worsening respiratory symptoms.",
    nextReview: "48 hours or sooner if condition changes",
  },
  Medium: {
    level: "Medium",
    confidence: 83,
    headline: "Elevated concern — prioritise today",
    summary:
      "Two vital parameters are outside normal ranges and reported symptoms suggest active infection. Patient should be seen before routine cases. Close monitoring of temperature and hydration status is recommended.",
    factors: [
      { label: "Blood Pressure",      value: "142/91 mmHg",  status: "warn",     detail: "Stage 1 hypertension — systolic above threshold" },
      { label: "Temperature",         value: "38.4 °C",      status: "warn",     detail: "Moderate fever — active infection likely" },
      { label: "Pulse Rate",          value: "102 bpm",      status: "warn",     detail: "Mild tachycardia — may reflect fever" },
      { label: "SpO₂",               value: "96%",          status: "ok",       detail: "Borderline normal — monitor closely" },
      { label: "Chief Complaint",     value: "Fever + chills + headache", status: "warn", detail: "Symptom triad consistent with malaria or typhoid" },
      { label: "Critical Symptoms",   value: "None reported",status: "ok",       detail: "No convulsions, bleeding, or chest pain" },
    ],
    recommendation:
      "Prioritise ahead of routine cases. Perform malaria RDT immediately. Begin hydration and paracetamol for fever management while awaiting clinician review. Monitor vitals every 30 minutes.",
    escalationNote: "Escalate to duty clinician if temperature exceeds 39.5 °C, pulse exceeds 120 bpm, or patient reports altered consciousness.",
    nextReview: "30 minutes",
  },
  High: {
    level: "High",
    confidence: 97,
    headline: "Immediate clinical attention required",
    summary:
      "Critical vital signs detected alongside high-risk reported symptoms. This presentation requires immediate clinician assessment. Do not leave the patient unattended. Prepare for urgent referral if stabilisation is not possible at this facility.",
    factors: [
      { label: "Blood Pressure",      value: "185/118 mmHg", status: "critical", detail: "Hypertensive crisis — systolic ≥ 180 mmHg" },
      { label: "Temperature",         value: "39.8 °C",      status: "critical", detail: "High-grade fever — systemic infection risk" },
      { label: "Pulse Rate",          value: "128 bpm",      status: "critical", detail: "Significant tachycardia — haemodynamic instability possible" },
      { label: "SpO₂",               value: "91%",          status: "critical", detail: "Below 92% — supplemental oxygen required" },
      { label: "Chief Complaint",     value: "Chest pain + shortness of breath", status: "critical", detail: "High-risk symptom combination requiring immediate workup" },
      { label: "Critical Symptoms",   value: "Chest pain reported", status: "critical", detail: "WHO red-flag symptom — immediate assessment mandatory" },
    ],
    recommendation:
      "Alert senior clinician immediately. Administer supplemental oxygen if available. Establish IV access. Do not send patient home. Prepare urgent referral documentation for district hospital. Notify ambulance coordinator if transfer is required.",
    escalationNote: "ESCALATE NOW — senior clinician must assess within 10 minutes. If patient deteriorates before clinician arrives, initiate emergency protocol.",
    nextReview: "Continuous monitoring",
  },
};

// ── Palette ────────────────────────────────────────────────────────────────────
const PALETTE: Record<UrgencyLevel, {
  bg: string; border: string; text: string; muted: string;
  badgeBg: string; badgeText: string; ring: string; glow: string;
  factorWarn: string; factorCrit: string; factorOk: string;
  btnEscalate: string; dotPulse: string;
}> = {
  Low: {
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900",
    muted: "text-emerald-700", badgeBg: "bg-emerald-600", badgeText: "text-white",
    ring: "#10b981", glow: "shadow-emerald-200", factorWarn: "", factorCrit: "",
    factorOk: "bg-emerald-50 border-emerald-100",
    btnEscalate: "border-emerald-300 text-emerald-700 hover:bg-emerald-100",
    dotPulse: "bg-emerald-400",
  },
  Medium: {
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900",
    muted: "text-amber-700", badgeBg: "bg-amber-500", badgeText: "text-white",
    ring: "#f59e0b", glow: "shadow-amber-200", factorWarn: "bg-amber-50 border-amber-200",
    factorCrit: "", factorOk: "bg-white border-slate-100",
    btnEscalate: "border-amber-300 text-amber-700 hover:bg-amber-100",
    dotPulse: "bg-amber-400",
  },
  High: {
    bg: "bg-red-50", border: "border-red-200", text: "text-red-900",
    muted: "text-red-700", badgeBg: "bg-red-600", badgeText: "text-white",
    ring: "#ef4444", glow: "shadow-red-200", factorWarn: "bg-amber-50 border-amber-200",
    factorCrit: "bg-red-50 border-red-200", factorOk: "bg-white border-slate-100",
    btnEscalate: "border-red-400 bg-red-600 text-white hover:bg-red-700",
    dotPulse: "bg-red-500",
  },
};

const FACTOR_STATUS_ICON = {
  ok:       { icon: "✓", cls: "text-emerald-600 bg-emerald-50" },
  warn:     { icon: "!", cls: "text-amber-600 bg-amber-50" },
  critical: { icon: "✕", cls: "text-red-600 bg-red-50" },
};

// ── Confidence ring (SVG) ──────────────────────────────────────────────────────
function ConfidenceRing({ pct, color, animate }: { pct: number; color: string; animate: boolean }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!animate) { setDisplayed(pct); return; }
    setDisplayed(0);
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * pct));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pct, animate]);

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
      <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (circ * displayed) / 100}
        style={{ transition: animate ? "none" : "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
      {/* Centre text rendered in a foreignObject to avoid rotation weirdness */}
    </svg>
  );
}

// ── Typewriter ─────────────────────────────────────────────────────────────────
function useTypewriter(text: string, active: boolean) {
  const [out, setOut] = useState("");
  const prev = useRef("");
  useEffect(() => {
    if (!active) { setOut(""); prev.current = ""; return; }
    if (prev.current === text) return;
    prev.current = text;
    setOut("");
    let i = 0;
    const t = setInterval(() => {
      if (i < text.length) setOut(text.slice(0, ++i));
      else clearInterval(t);
    }, 14);
    return () => clearInterval(t);
  }, [text, active]);
  return out;
}

// ── Saved / escalated toast ───────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-teal-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl animate-slide-up">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4 text-teal-300 flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 8-8" />
      </svg>
      {message}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TriagePage() {
  const [level, setLevel] = useState<UrgencyLevel>("Medium");
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [saved, setSaved] = useState(false);

  const s = SCENARIOS[level];
  const p = PALETTE[level];
  const typed = useTypewriter(s.summary, true);

  const switchLevel = (next: UrgencyLevel) => {
    if (next === level) return;
    setAnimating(true);
    setLevel(next);
    setTimeout(() => setAnimating(false), 1200);
  };

  const handleSave = () => {
    setSaved(true);
    setToast("Record saved locally — will sync when connected");
  };

  const handleEscalate = () => {
    setEscalated(true);
    setToast("Escalation alert sent to duty clinician");
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-10 relative">

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">AI Triage Result</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Generated for{" "}
            <span className="font-semibold text-teal-700">Mariama Kouyaté</span>
            <span className="text-slate-300 mx-1.5">·</span>
            <span className="font-mono text-xs text-slate-400">PT-00412</span>
            <span className="text-slate-300 mx-1.5">·</span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })},{" "}
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </p>
        </div>
        {/* Demo switcher */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(["Low", "Medium", "High"] as UrgencyLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => switchLevel(l)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                level === l ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero urgency card ── */}
      <div className={`${p.bg} ${p.border} border rounded-3xl px-6 py-8 transition-all duration-500`}>
        <div className="flex flex-col sm:flex-row items-center gap-8">

          {/* Ring + badge */}
          <div className="relative flex-shrink-0 flex flex-col items-center gap-3">
            <div className="relative">
              <ConfidenceRing pct={s.confidence} color={p.ring} animate={animating} />
              {/* Centre overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-display text-3xl font-bold transition-all ${p.text}`}>
                  {s.confidence}%
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${p.muted}`}>
                  confidence
                </span>
              </div>
            </div>
            {/* Urgency badge */}
            <div className={`inline-flex items-center gap-2 ${p.badgeBg} ${p.badgeText} px-5 py-2 rounded-2xl shadow-lg ${p.glow} shadow-md`}>
              <span className={`w-2 h-2 rounded-full bg-white/60 ${level === "High" ? "animate-ping" : ""}`} />
              <span className="text-sm font-bold uppercase tracking-wider">{level} Urgency</span>
            </div>
          </div>

          {/* Text panel */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className={`font-display text-2xl lg:text-[26px] leading-tight mb-3 ${p.text}`}>
              {s.headline}
            </h2>
            <p className={`text-sm leading-relaxed ${p.muted} min-h-[4rem]`}>
              {typed}
              <span className="animate-pulse opacity-60">|</span>
            </p>

            {/* Next review */}
            <div className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-xl border text-xs font-semibold ${p.border} ${p.muted} bg-white/60`}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <circle cx="7" cy="7" r="5.5" />
                <path strokeLinecap="round" d="M7 4v3.5l2 1.5" />
              </svg>
              Next review: {s.nextReview}
            </div>
          </div>
        </div>
      </div>

      {/* ── Factor breakdown ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h12M2 8h8M2 12h5" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Why this score was given</h2>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {s.factors.filter(f => f.status !== "ok").length > 0
              ? `${s.factors.filter(f => f.status !== "ok").length} flag${s.factors.filter(f => f.status !== "ok").length > 1 ? "s" : ""} detected`
              : "All clear"}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {s.factors.map(({ label, value, status, detail }) => {
            const ic = FACTOR_STATUS_ICON[status];
            const rowCls =
              status === "critical" ? p.factorCrit || "bg-red-50 border-red-200" :
              status === "warn"     ? p.factorWarn || "bg-amber-50 border-amber-200" :
                                     p.factorOk   || "bg-slate-50 border-slate-100";
            return (
              <div key={label} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${rowCls}`}>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${ic.cls}`}>
                  {ic.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className={`text-sm font-semibold ${
                      status === "critical" ? "text-red-700" : status === "warn" ? "text-amber-700" : "text-slate-800"
                    }`}>{value}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Clinical recommendation ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-teal-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3.5v9M4.5 7h7" />
              <rect x="1.5" y="1.5" width="13" height="13" rx="2" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Clinical Recommendation</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">{s.recommendation}</p>

        {/* Escalation threshold note */}
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
          level === "High"
            ? "bg-red-50 border-red-200"
            : level === "Medium"
            ? "bg-amber-50 border-amber-200"
            : "bg-slate-50 border-slate-200"
        }`}>
          <svg viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
            level === "High" ? "text-red-500" : level === "Medium" ? "text-amber-500" : "text-slate-400"
          }`}>
            <path fillRule="evenodd" d="M6.457 1.047a.75.75 0 011.086 0l6.857 7.5a.75.75 0 01-.543 1.953H2.143a.75.75 0 01-.543-1.953l6.857-7.5zM8 4.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zm.5 7a.5.5 0 11-1 0 .5.5 0 011 0z" clipRule="evenodd" />
          </svg>
          <p className={`text-xs leading-relaxed ${
            level === "High" ? "text-red-800" : level === "Medium" ? "text-amber-800" : "text-slate-600"
          }`}>
            <strong>Escalation note: </strong>{s.escalationNote}
          </p>
        </div>
      </div>

      {/* ── Model info strip ── */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {[
          { label: "Model", value: "HealthStats Triage v2.1" },
          { label: "Data sources", value: "WHO ICD-11 + MSF clinical protocols" },
          { label: "Threshold set", value: "Sub-Saharan Africa (rural)" },
          { label: "Processed", value: "On-device · No internet used" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}:</span>
            <span className="text-[11px] text-slate-500 font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Action buttons ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex flex-col sm:flex-row items-center gap-3">

        {/* Disclaimer */}
        <p className="text-[11px] text-slate-400 leading-relaxed flex-1">
          This AI assessment is a clinical decision-support tool only. It does not replace the judgement of a trained health worker or clinician.
        </p>

        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          {/* Save Record */}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
              saved
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default"
                : "bg-white border-slate-300 text-slate-700 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50"
            }`}
          >
            {saved ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 8-8" />
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 11v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2M8 2v8m-3-3l3 3 3-3" />
                </svg>
                Save Record
              </>
            )}
          </button>

          {/* Escalate to Doctor */}
          <button
            onClick={handleEscalate}
            disabled={escalated}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
              escalated
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-default"
                : level === "High"
                ? "bg-red-600 border-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/25 hover:-translate-y-0.5"
                : level === "Medium"
                ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/25 hover:-translate-y-0.5"
                : "border-slate-300 text-slate-700 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50"
            }`}
          >
            {escalated ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 8-8" />
                </svg>
                Alert Sent
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 1v6m0 0l-2.5-2.5M8 7l2.5-2.5M3 10a5 5 0 0010 0" />
                </svg>
                Escalate to Doctor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
