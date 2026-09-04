import { useState } from "react";

// ── Data ───────────────────────────────────────────────────────────────────────
const PATIENT = {
  id: "PT-00412",
  name: "Mariama Kouyaté",
  age: 34,
  sex: "Female",
  dob: "12 Mar 1992",
  village: "Dialafara",
  phone: "+223 76 43 21 08",
  bloodType: "O+",
  allergies: ["Penicillin (rash)", "Sulfonamides"],
  registeredDate: "14 Jan 2024",
  initials: "MK",
  status: "Active — Follow-up",
  emergencyContact: "Amadou Kouyaté (Spouse) · +223 76 11 22 33",
  conditions: ["Hypertension", "Recurrent Malaria"],
  weight: "64.5 kg",
  totalVisits: 6,
};

// 6-visit vitals trend (oldest → newest)
const VITALS_HISTORY = [
  { date: "10 Jul",  systolic: 120, diastolic: 78, temp: 36.8, pulse: 74, weight: 64.0, spo2: 99 },
  { date: "24 Jul",  systolic: 124, diastolic: 80, temp: 37.0, pulse: 76, weight: 63.5, spo2: 99 },
  { date: "7 Aug",   systolic: 128, diastolic: 82, temp: 36.9, pulse: 78, weight: 63.0, spo2: 98 },
  { date: "14 Aug",  systolic: 135, diastolic: 85, temp: 37.2, pulse: 82, weight: 63.5, spo2: 98 },
  { date: "21 Aug",  systolic: 138, diastolic: 88, temp: 38.1, pulse: 98, weight: 64.0, spo2: 97 },
  { date: "28 Aug",  systolic: 142, diastolic: 91, temp: 38.4, pulse: 102, weight: 64.5, spo2: 96 },
];

const VISITS = [
  {
    date: "28 Aug 2026",
    time: "09:14",
    clinician: "Sr. Amara Diallo",
    complaint: "High fever for 2 days with chills and body aches.",
    diagnosis: "Malaria (uncomplicated) + Stage 1 Hypertension",
    treatment: "Artemether-lumefantrine 20/120 mg × 6 doses. Continue Amlodipine 5 mg daily. Paracetamol 500 mg PRN.",
    outcome: "Treated & reviewed",
    urgency: "Medium",
    synced: true,
  },
  {
    date: "21 Aug 2026",
    time: "11:30",
    clinician: "Sr. Amara Diallo",
    complaint: "Routine BP check. Mild headache.",
    diagnosis: "Hypertension — partially controlled",
    treatment: "Amlodipine 5 mg daily continued. Dietary sodium restriction reinforced.",
    outcome: "Follow-up booked",
    urgency: "Low",
    synced: true,
  },
  {
    date: "14 Aug 2026",
    time: "10:05",
    clinician: "Dr. Ibrahima Coulibaly",
    complaint: "Dizziness on standing. BP check.",
    diagnosis: "Hypertension — stable. Possible orthostatic hypotension.",
    treatment: "Advised to rise slowly. Continue current antihypertensives. Rehydration.",
    outcome: "Discharged — routine follow-up",
    urgency: "Low",
    synced: true,
  },
  {
    date: "7 Aug 2026",
    time: "08:50",
    clinician: "Sr. Amara Diallo",
    complaint: "Scheduled monthly review.",
    diagnosis: "Hypertension — controlled. No acute illness.",
    treatment: "Continue Amlodipine 5 mg. Lifestyle counselling provided.",
    outcome: "Stable",
    urgency: "Low",
    synced: true,
  },
  {
    date: "24 Jul 2026",
    time: "14:20",
    clinician: "Sr. Amara Diallo",
    complaint: "Fever 2 days. Loss of appetite.",
    diagnosis: "Malaria (uncomplicated) — RDT positive",
    treatment: "Artemether-lumefantrine course completed. Oral rehydration.",
    outcome: "Treated — resolved",
    urgency: "Medium",
    synced: true,
  },
  {
    date: "10 Jul 2026",
    time: "09:00",
    clinician: "Dr. Ibrahima Coulibaly",
    complaint: "First registration & baseline assessment.",
    diagnosis: "Hypertension (new diagnosis). BMI 24.1.",
    treatment: "Amlodipine 5 mg OD initiated. Diet and exercise counselling. Monthly reviews scheduled.",
    outcome: "Enrolled in hypertension programme",
    urgency: "Routine",
    synced: true,
  },
];

const DIAGNOSIS_NOTES = [
  {
    condition: "Hypertension",
    icd: "I10",
    since: "10 Jul 2026",
    status: "Ongoing — partially controlled",
    medications: [
      { name: "Amlodipine", dose: "5 mg", freq: "Once daily (morning)", started: "10 Jul 2026" },
    ],
    notes: "BP trending upward over past 6 weeks. Dietary compliance inconsistent. Consider increasing Amlodipine to 10 mg at next visit if BP remains > 140/90.",
  },
  {
    condition: "Recurrent Malaria",
    icd: "B50.9",
    since: "24 Jul 2026",
    status: "Treated — 2nd episode this year",
    medications: [
      { name: "Artemether-lumefantrine", dose: "20/120 mg", freq: "BD × 3 days (acute episodes only)", started: "28 Aug 2026" },
    ],
    notes: "Two episodes within 5 weeks. Recommend chemoprevention review with district malaria officer. Ensure bed net usage confirmed at next visit.",
  },
];

// ── Sparkline SVG ──────────────────────────────────────────────────────────────
function Sparkline({
  data, color, minVal, maxVal, height = 48, width = 200,
}: {
  data: number[]; color: string; minVal: number; maxVal: number; height?: number; width?: number;
}) {
  const pad = { x: 8, y: 6 };
  const w = width - pad.x * 2;
  const h = height - pad.y * 2;
  const range = maxVal - minVal || 1;

  const pts = data.map((v, i) => ({
    x: pad.x + (i / (data.length - 1)) * w,
    y: pad.y + h - ((v - minVal) / range) * h,
  }));

  const path = pts.reduce(
    (acc, p, i) =>
      i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`,
    ""
  );

  const fillPath = `${path} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#grad-${color.replace(/[^a-z]/gi, "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
}

// ── Urgency badge ──────────────────────────────────────────────────────────────
function UrgencyBadge({ level }: { level: string }) {
  const cls =
    level === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
    level === "High"   ? "bg-red-50 text-red-700 border-red-200" :
                         "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cls}`}>
      {level}
    </span>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "vitals",    label: "Vitals History" },
  { id: "visits",   label: "Visit History" },
  { id: "diagnosis", label: "Diagnosis & Treatment" },
];

// ── Main ───────────────────────────────────────────────────────────────────────
export default function PatientDetailPage({ patientId }: { patientId?: string | null }) {
  const [tab, setTab] = useState<"vitals" | "visits" | "diagnosis">("vitals");
  const [editing, setEditing] = useState(false);
  const [visitExpanded, setVisitExpanded] = useState<number | null>(0);

  const latest = VITALS_HISTORY[VITALS_HISTORY.length - 1];

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10 w-full">

      {/* ── Patient header card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Teal accent bar */}
        <div className="h-2 bg-gradient-to-r from-teal-500 to-teal-700" />

        <div className="px-6 py-5 flex flex-col sm:flex-row items-start gap-5">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-display text-2xl shadow-md shadow-teal-600/20">
              {PATIENT.initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white" title="Active patient" />
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl text-teal-950 leading-tight">{PATIENT.name}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-sm text-slate-500">{PATIENT.age} yrs</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-sm text-slate-500">{PATIENT.sex}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-sm text-slate-500">{PATIENT.village}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{PATIENT.id}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PATIENT.conditions.map((c) => (
                    <span key={c} className="text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 px-3.5 py-2 rounded-xl transition-all"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 2.5a2.121 2.121 0 013 3L5 15l-4 1 1-4L11.5 2.5z" />
                  </svg>
                  Edit
                </button>
                <button className="flex items-center gap-1.5 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:-translate-y-0.5">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
                  </svg>
                  New Visit
                </button>
              </div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              {[
                { label: "DOB",          value: PATIENT.dob },
                { label: "Blood Type",   value: PATIENT.bloodType },
                { label: "Total Visits", value: `${PATIENT.totalVisits} visits` },
                { label: "Registered",   value: PATIENT.registeredDate },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Allergy / emergency banner */}
        {PATIENT.allergies.length > 0 && (
          <div className="mx-6 mb-5 flex flex-wrap items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-0.5 flex-shrink-0">⚠ Allergies</span>
            <div className="flex flex-wrap gap-1.5">
              {PATIENT.allergies.map((a) => (
                <span key={a} className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              tab === id
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB 1 — Vitals History
      ══════════════════════════════════════════════ */}
      {tab === "vitals" && (
        <div className="flex flex-col gap-4">

          {/* Sparkline cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Systolic BP", unit: "mmHg", color: "#ef4444",
                data: VITALS_HISTORY.map((v) => v.systolic),
                latest: latest.systolic,
                min: 100, max: 160,
                status: latest.systolic >= 140 ? "High" : "Normal",
              },
              {
                label: "Temperature", unit: "°C", color: "#f59e0b",
                data: VITALS_HISTORY.map((v) => v.temp),
                latest: latest.temp,
                min: 36, max: 40,
                status: latest.temp >= 38 ? "Elevated" : "Normal",
              },
              {
                label: "Pulse Rate", unit: "bpm", color: "#8b5cf6",
                data: VITALS_HISTORY.map((v) => v.pulse),
                latest: latest.pulse,
                min: 60, max: 130,
                status: latest.pulse > 100 ? "High" : "Normal",
              },
              {
                label: "SpO₂", unit: "%", color: "#0d9488",
                data: VITALS_HISTORY.map((v) => v.spo2),
                latest: latest.spo2,
                min: 90, max: 100,
                status: latest.spo2 < 95 ? "Low" : "Normal",
              },
            ].map(({ label, unit, color, data, latest: lv, min, max, status }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 pt-4 pb-3 flex flex-col gap-2 overflow-hidden">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    status === "Normal" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}>{status}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl text-slate-900">{lv}</span>
                  <span className="text-xs text-slate-400 font-medium">{unit}</span>
                </div>
                <div className="h-12 -mx-1">
                  <Sparkline data={data} color={color} minVal={min} maxVal={max} height={48} width={180} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>{VITALS_HISTORY[0].date}</span>
                  <span>↑ Trend</span>
                  <span>{VITALS_HISTORY[VITALS_HISTORY.length - 1].date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed vitals table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">All Readings — Last 6 Visits</h3>
              <span className="text-xs text-slate-400">Oldest → newest</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Date", "Sys / Dia (mmHg)", "Temp (°C)", "Pulse (bpm)", "Weight (kg)", "SpO₂ (%)"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VITALS_HISTORY.map((v, i) => {
                    const isLatest = i === VITALS_HISTORY.length - 1;
                    return (
                      <tr key={v.date} className={`border-b border-slate-100 last:border-0 ${isLatest ? "bg-teal-50/50" : "hover:bg-slate-50"} transition-colors`}>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700">{v.date}</span>
                          {isLatest && <span className="ml-2 text-[10px] font-bold text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full">Latest</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${v.systolic >= 140 ? "text-amber-600" : "text-slate-700"}`}>
                            {v.systolic}/{v.diastolic}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={v.temp >= 38 ? "text-amber-600 font-semibold" : "text-slate-700"}>{v.temp}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={v.pulse > 100 ? "text-amber-600 font-semibold" : "text-slate-700"}>{v.pulse}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{v.weight}</td>
                        <td className="px-4 py-3">
                          <span className={v.spo2 < 96 ? "text-amber-600 font-semibold" : "text-slate-700"}>{v.spo2}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 2 — Visit History
      ══════════════════════════════════════════════ */}
      {tab === "visits" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{VISITS.length} recorded visits</p>
            <span className="text-xs text-teal-600 font-medium">All synced ✓</span>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-200" />

            <div className="flex flex-col gap-3">
              {VISITS.map((v, i) => {
                const open = visitExpanded === i;
                return (
                  <div key={i} className="flex gap-4">
                    {/* Timeline node */}
                    <div className="flex-shrink-0 flex flex-col items-center mt-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold z-10 border-2 ${
                        i === 0
                          ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20"
                          : "bg-white text-slate-500 border-slate-200"
                      }`}>
                        {VISITS.length - i}
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setVisitExpanded(open ? null : i)}
                        className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-800">{v.date}</span>
                            <span className="text-xs text-slate-400">{v.time}</span>
                            <UrgencyBadge level={v.urgency} />
                            {v.synced && (
                              <span className="text-[10px] font-medium text-emerald-600">✓ Synced</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{v.complaint}</p>
                        </div>
                        <svg
                          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
                          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform mt-0.5 ${open ? "rotate-180" : ""}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                        </svg>
                      </button>

                      {open && (
                        <div className="border-t border-slate-100 px-5 py-4 grid sm:grid-cols-2 gap-4">
                          {[
                            { label: "Clinician",   value: v.clinician },
                            { label: "Diagnosis",   value: v.diagnosis },
                            { label: "Treatment",   value: v.treatment },
                            { label: "Outcome",     value: v.outcome },
                          ].map(({ label, value }) => (
                            <div key={label} className={label === "Treatment" || label === "Diagnosis" ? "sm:col-span-2" : ""}>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
                            </div>
                          ))}
                          <div className="sm:col-span-2 flex gap-2 pt-1">
                            <button className="text-xs font-semibold text-teal-600 hover:text-teal-800 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-all">
                              View full notes
                            </button>
                            <button className="text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-all">
                              Print summary
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 3 — Diagnosis & Treatment
      ══════════════════════════════════════════════ */}
      {tab === "diagnosis" && (
        <div className="flex flex-col gap-4">

          {/* Active conditions */}
          {DIAGNOSIS_NOTES.map((d, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Condition header */}
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-slate-800">{d.condition}</h3>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{d.icd}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Since {d.since} · {d.status}</p>
                </div>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 border border-slate-200 hover:border-teal-200 px-3 py-1.5 rounded-lg transition-all">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2.5a2 2 0 012.828 2.828L4 13.657l-3 .343.343-3z" />
                  </svg>
                  Edit
                </button>
              </div>

              <div className="px-5 py-4 grid sm:grid-cols-2 gap-5">
                {/* Medications */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Current Medications</p>
                  <div className="space-y-2">
                    {d.medications.map((m, j) => (
                      <div key={j} className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth={1.8} className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h4l1 2.5H4L5 3zM2.5 5.5h9l-.857 6H3.357L2.5 5.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-teal-900">{m.name} <span className="font-normal text-teal-700">{m.dose}</span></p>
                          <p className="text-[11px] text-teal-600 mt-0.5">{m.freq}</p>
                          <p className="text-[10px] text-teal-500 mt-0.5">Started {m.started}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical notes */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Clinician Notes</p>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl border border-slate-100 px-3 py-3">{d.notes}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Allergies & contraindications */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-[10px] font-black">!</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Allergies & Contraindications</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {PATIENT.allergies.map((a) => (
                <div key={a} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-red-700">{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency contact */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Emergency Contact</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 3.5A1.5 1.5 0 013.5 2h1.172a1.5 1.5 0 011.395.944l.69 1.726a1.5 1.5 0 01-.344 1.627L5.5 7.207A11.037 11.037 0 008.793 10.5l.91-.913a1.5 1.5 0 011.627-.344l1.726.69A1.5 1.5 0 0114 11.328V12.5A1.5 1.5 0 0112.5 14H11C5.477 14 1 9.523 1 4v-1l.5-1h.5z" />
                </svg>
              </div>
              <p className="text-sm text-slate-700 font-medium">{PATIENT.emergencyContact}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
