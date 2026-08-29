import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type RangeStatus = "normal" | "low" | "high" | "critical" | "empty";

interface VitalField {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
  normal: string;
  low: number;
  high: number;
  critical_low?: number;
  critical_high?: number;
  step?: number;
  isSplit?: boolean;
}

// ── Vitals config ──────────────────────────────────────────────────────────────
const VITALS: VitalField[] = [
  {
    key: "systolic", label: "Blood Pressure (Sys.)", unit: "mmHg",
    placeholder: "120", normal: "90–120", low: 90, high: 139, critical_low: 70, critical_high: 180,
  },
  {
    key: "diastolic", label: "Blood Pressure (Dia.)", unit: "mmHg",
    placeholder: "80", normal: "60–80", low: 60, high: 89, critical_low: 40, critical_high: 120,
  },
  {
    key: "temperature", label: "Temperature", unit: "°C",
    placeholder: "36.8", normal: "36.1–37.2", low: 35.5, high: 37.9, critical_low: 34, critical_high: 39.5, step: 0.1,
  },
  {
    key: "pulse", label: "Pulse Rate", unit: "bpm",
    placeholder: "72", normal: "60–100", low: 55, high: 100, critical_low: 40, critical_high: 130,
  },
  {
    key: "weight", label: "Weight", unit: "kg",
    placeholder: "65.0", normal: "varies by patient", low: 0, high: Infinity, step: 0.1,
  },
  {
    key: "spo2", label: "SpO₂", unit: "%",
    placeholder: "98", normal: "95–100", low: 95, high: 100, critical_low: 90, critical_high: 100,
  },
  {
    key: "respRate", label: "Respiratory Rate", unit: "/min",
    placeholder: "16", normal: "12–20", low: 12, high: 20, critical_low: 8, critical_high: 30,
  },
  {
    key: "muac", label: "MUAC", unit: "cm",
    placeholder: "25", normal: "≥ 12.5 cm", low: 12.5, high: Infinity, critical_low: 11, critical_high: Infinity,
  },
];

const SYMPTOM_CHIPS = [
  "Fever", "Chills", "Headache", "Cough", "Shortness of breath",
  "Nausea / Vomiting", "Diarrhoea", "Abdominal pain", "Chest pain",
  "Dizziness", "Fatigue", "Loss of appetite", "Joint pain", "Rash",
  "Bleeding", "Convulsions", "Altered consciousness", "Swelling (oedema)",
  "Painful urination", "Eye discharge",
];

const VISIT_STEPS = [
  { n: 1, label: "Patient", sub: "Select patient" },
  { n: 2, label: "Vitals", sub: "Measurements" },
  { n: 3, label: "Diagnosis", sub: "Assessment & plan" },
];

// ── AI result lines (simulated) ────────────────────────────────────────────────
function buildAIResult(vals: Record<string, string>, chips: string[], complaint: string) {
  const sys = parseFloat(vals.systolic);
  const temp = parseFloat(vals.temperature);
  const pulse = parseFloat(vals.pulse);
  const spo2 = parseFloat(vals.spo2);

  let urgency: "High" | "Medium" | "Low" = "Low";
  const flags: string[] = [];
  const actions: string[] = [];

  if (sys >= 180 || sys < 80) { flags.push(`Systolic BP ${sys} mmHg — outside safe range`); urgency = "High"; }
  else if (sys >= 140) { flags.push(`Systolic BP ${sys} mmHg — Stage 2 hypertension`); if (urgency !== "High") urgency = "Medium"; }

  if (temp >= 39.5) { flags.push(`Temperature ${temp}°C — high-grade fever`); urgency = "High"; }
  else if (temp >= 38) { flags.push(`Temperature ${temp}°C — moderate fever`); if (urgency !== "High") urgency = "Medium"; }
  else if (temp < 35.5) { flags.push(`Temperature ${temp}°C — hypothermia`); urgency = "High"; }

  if (!isNaN(pulse) && (pulse > 120 || pulse < 45)) { flags.push(`Pulse ${pulse} bpm — abnormal rate`); urgency = "High"; }
  if (!isNaN(spo2) && spo2 < 92) { flags.push(`SpO₂ ${spo2}% — possible hypoxia`); urgency = "High"; }

  if (chips.includes("Convulsions") || chips.includes("Altered consciousness") || chips.includes("Chest pain")) {
    urgency = "High";
    flags.push("Reported critical symptom requiring immediate assessment");
  }
  if (chips.includes("Bleeding")) { if (urgency !== "High") urgency = "Medium"; flags.push("Reported bleeding"); }

  if (flags.length === 0) {
    flags.push("All measured vitals within normal limits");
    flags.push("No critical symptoms reported");
  }

  if (urgency === "High") {
    actions.push("Escalate immediately — alert senior clinician");
    actions.push("Do not leave patient unattended");
    actions.push("Prepare for urgent referral if needed");
  } else if (urgency === "Medium") {
    actions.push("Prioritise ahead of routine cases today");
    actions.push("Monitor vitals every 30 minutes");
    actions.push("Document and flag for clinician review");
  } else {
    actions.push("Routine clinical assessment");
    actions.push("Standard follow-up schedule");
  }

  return { urgency, flags, actions };
}

// ── Range status helper ────────────────────────────────────────────────────────
function getRangeStatus(v: VitalField, value: string): RangeStatus {
  if (!value) return "empty";
  const n = parseFloat(value);
  if (isNaN(n)) return "empty";
  if (v.critical_low !== undefined && n < v.critical_low) return "critical";
  if (v.critical_high !== undefined && n > v.critical_high) return "critical";
  if (n < v.low) return "low";
  if (n > v.high) return "high";
  return "normal";
}

const STATUS_STYLES: Record<RangeStatus, { ring: string; bg: string; text: string; dot: string; label: string }> = {
  normal:   { ring: "focus:ring-teal-500 border-slate-200",   bg: "bg-slate-50 focus:bg-white",  text: "",              dot: "bg-teal-400",   label: "Normal" },
  low:      { ring: "focus:ring-amber-400 border-amber-300",  bg: "bg-amber-50",                 text: "text-amber-700", dot: "bg-amber-400",  label: "Low" },
  high:     { ring: "focus:ring-amber-400 border-amber-300",  bg: "bg-amber-50",                 text: "text-amber-700", dot: "bg-amber-400",  label: "High" },
  critical: { ring: "focus:ring-red-400 border-red-300",      bg: "bg-red-50",                   text: "text-red-600",  dot: "bg-red-500",    label: "Critical" },
  empty:    { ring: "focus:ring-teal-500 border-slate-200",   bg: "bg-slate-50 focus:bg-white",  text: "",              dot: "bg-slate-300",  label: "" },
};

// ── AI typewriter hook ─────────────────────────────────────────────────────────
function useTypewriter(text: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, active, speed]);
  return displayed;
}

// ── Components ─────────────────────────────────────────────────────────────────
function StepBar() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
      <div className="flex items-start gap-3">
        {VISIT_STEPS.map(({ n, label, sub }) => {
          const done = n < 2;
          const active = n === 2;
          return (
            <div key={n} className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  done ? "bg-teal-600 text-white" : active ? "bg-teal-600 text-white ring-4 ring-teal-100" : "bg-slate-100 text-slate-400"
                }`}>
                  {done ? (
                    <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth={2.5} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l3.5 3.5 6.5-7" />
                    </svg>
                  ) : n}
                </div>
                {n < 3 && (
                  <div className="flex-1 h-px mx-1">
                    <div className={`h-full ${done ? "bg-teal-500" : "bg-slate-200"}`} />
                  </div>
                )}
              </div>
              <div>
                <p className={`text-xs font-semibold ${active ? "text-teal-700" : done ? "text-teal-600" : "text-slate-400"}`}>{label}</p>
                <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">{sub}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-500 rounded-full w-1/2" />
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 text-right">Step 2 of 3</p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function VitalsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [chips, setChips] = useState<string[]>([]);
  const [complaint, setComplaint] = useState("");
  const [aiState, setAiState] = useState<"idle" | "loading" | "done">("idle");
  const [aiResult, setAiResult] = useState<ReturnType<typeof buildAIResult> | null>(null);
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const set = (key: string, val: string) => setValues((v) => ({ ...v, [key]: val }));
  const toggleChip = (c: string) => setChips((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const urgencySummary = aiResult
    ? `${aiResult.urgency} urgency. ${aiResult.flags[0]}. Recommended: ${aiResult.actions[0]}.`
    : "";

  const typewritten = useTypewriter(urgencySummary, aiState === "done");

  const runAI = () => {
    setAiState("loading");
    setAiResult(null);
    setTimeout(() => {
      const result = buildAIResult(values, chips, complaint);
      setAiResult(result);
      setAiState("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }, 2000);
  };

  const handleSave = () => {
    const t = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setSavedTime(t);
    setTimeout(() => setSavedTime(null), 3000);
  };

  const URGENCY_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    High:   { bg: "bg-red-50",     border: "border-red-200",   text: "text-red-800",   badge: "bg-red-600 text-white" },
    Medium: { bg: "bg-amber-50",   border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-500 text-white" },
    Low:    { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-600 text-white" },
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">Vitals & Symptoms</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Recording for{" "}
            <span className="font-semibold text-teal-700">Mariama Kouyaté</span>
            <span className="text-slate-300 mx-1.5">·</span>
            <span className="font-mono text-xs text-slate-400">PT-00412</span>
          </p>
        </div>
        {savedTime && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 8-8" />
            </svg>
            Saved locally at {savedTime}
          </div>
        )}
      </div>

      {/* Step bar */}
      <StepBar />

      {/* ── Vitals grid ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-teal-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3M8 11v3M2 8h3m6 0h3M4.22 4.22l2.12 2.12m3.54 3.54l2.12 2.12M4.22 11.78l2.12-2.12m3.54-3.54l2.12-2.12" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Measured Vitals</h2>
          <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {VITALS.map((v) => {
            const val = values[v.key] ?? "";
            const status = getRangeStatus(v, val);
            const s = STATUS_STYLES[status];
            return (
              <div key={v.key} className="flex flex-col gap-1.5">
                {/* Label + dot */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${s.dot}`} />
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 leading-none">
                    {v.label}
                  </label>
                </div>

                {/* Input */}
                <div className="relative">
                  <input
                    type="number"
                    step={v.step ?? 1}
                    placeholder={v.placeholder}
                    value={val}
                    onChange={(e) => set(v.key, e.target.value)}
                    className={`w-full pr-12 pl-3 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${s.ring} ${s.bg} ${s.text || "text-slate-800"}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                    {v.unit}
                  </span>
                </div>

                {/* Range info */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Normal: {v.normal}</span>
                  {status !== "empty" && status !== "normal" && (
                    <span className={`text-[10px] font-bold uppercase ${
                      status === "critical" ? "text-red-500" : "text-amber-500"
                    }`}>
                      {s.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* BP combined display */}
        {values.systolic && values.diastolic && (
          <div className="mt-4 flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-rose-400 flex-shrink-0">
              <path d="M8 14s-6-4.686-6-8a6 6 0 0112 0c0 3.314-6 8-6 8z" />
            </svg>
            <span className="text-xs text-slate-500 font-medium">Blood pressure reading:</span>
            <span className="font-display text-base text-teal-900 font-bold tracking-tight">
              {values.systolic}/{values.diastolic}
            </span>
            <span className="text-xs text-slate-400">mmHg</span>
          </div>
        )}
      </div>

      {/* ── Chief complaint + symptoms ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-rose-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m0 4h.01M14 8A6 6 0 112 8a6 6 0 0112 0z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Chief Complaint & Symptoms</h2>
        </div>

        {/* Chief complaint textarea */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Chief Complaint <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="In the patient's own words: what brings them in today? Include onset, duration, and severity.&#10;&#10;e.g. 'High fever for 2 days with shivering and body aches. Feels worse at night. No cough.'"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all resize-none leading-relaxed"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-slate-400">{complaint.length} characters</span>
          </div>
        </div>

        {/* Symptom chips */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
            Reported Symptoms <span className="text-slate-400 font-normal normal-case">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_CHIPS.map((c) => {
              const on = chips.includes(c);
              const isCritical = ["Convulsions", "Altered consciousness", "Chest pain", "Bleeding"].includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChip(c)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
                    on
                      ? isCritical
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : isCritical
                      ? "bg-white text-red-600 border-red-200 hover:border-red-400 hover:bg-red-50"
                      : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700"
                  }`}
                >
                  {on && <span className="mr-1 text-[10px]">✓</span>}
                  {c}
                </button>
              );
            })}
          </div>
          {chips.length > 0 && (
            <p className="text-[11px] text-teal-600 font-medium mt-2">
              {chips.length} symptom{chips.length > 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      </div>

      {/* ── AI Urgency Check ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-3.5 h-3.5 text-violet-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 1l1.5 3.5L13 5.5 10.5 8l.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-1L8 1z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-700">AI Urgency Check</h2>
              <span className="text-[10px] font-bold uppercase tracking-wide text-violet-500 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Analyses entered vitals and symptoms to suggest an urgency level. Works offline. Not a diagnostic tool — clinical judgement always takes priority.
            </p>
          </div>

          <button
            onClick={runAI}
            disabled={aiState === "loading"}
            className={`flex items-center gap-2.5 font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-all flex-shrink-0 ${
              aiState === "loading"
                ? "bg-violet-400 text-white cursor-wait"
                : "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20 hover:shadow-md hover:shadow-violet-600/30 hover:-translate-y-0.5"
            }`}
          >
            {aiState === "loading" ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Analysing…
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 1l1.5 3.5L13 5.5 10.5 8l.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-1L8 1z" />
                </svg>
                Run AI Urgency Check
              </>
            )}
          </button>
        </div>

        {/* Loading skeleton */}
        {aiState === "loading" && (
          <div className="mt-5 space-y-2 animate-pulse">
            {[80, 60, 70].map((w, i) => (
              <div key={i} className={`h-3 bg-slate-100 rounded-full`} style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* Result */}
        {aiState === "done" && aiResult && (
          <div ref={resultRef} className={`mt-5 rounded-2xl border p-5 ${URGENCY_STYLE[aiResult.urgency].bg} ${URGENCY_STYLE[aiResult.urgency].border}`}>
            {/* Urgency header */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${URGENCY_STYLE[aiResult.urgency].badge}`}>
                {aiResult.urgency} Urgency
              </span>
              <p className={`text-xs font-medium ${URGENCY_STYLE[aiResult.urgency].text}`}>
                {typewritten}
                <span className="animate-pulse">|</span>
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Observations */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${URGENCY_STYLE[aiResult.urgency].text} opacity-70`}>
                  Observations
                </p>
                <ul className="space-y-1.5">
                  {aiResult.flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        aiResult.urgency === "High" ? "bg-red-500" : aiResult.urgency === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <span className={`text-xs leading-snug ${URGENCY_STYLE[aiResult.urgency].text}`}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended actions */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${URGENCY_STYLE[aiResult.urgency].text} opacity-70`}>
                  Recommended Actions
                </p>
                <ul className="space-y-1.5">
                  {aiResult.actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${URGENCY_STYLE[aiResult.urgency].text}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l3.5 3.5 6.5-7" />
                      </svg>
                      <span className={`text-xs leading-snug ${URGENCY_STYLE[aiResult.urgency].text}`}>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className={`text-[10px] mt-4 pt-3 border-t opacity-60 ${URGENCY_STYLE[aiResult.urgency].text} border-current/20`}>
              AI assessment generated offline based on WHO clinical thresholds. Always apply clinical judgement.
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation buttons ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between gap-3">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-teal-700 transition-colors">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 4L6 8l4 4" />
          </svg>
          Back to Patient
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="text-sm font-semibold text-teal-700 border border-teal-200 hover:border-teal-400 hover:bg-teal-50 px-4 py-2.5 rounded-xl transition-all"
          >
            Save Draft
          </button>
          <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-sm shadow-teal-600/20 hover:shadow-md hover:shadow-teal-600/30 transition-all hover:-translate-y-0.5">
            Next: Diagnosis
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
