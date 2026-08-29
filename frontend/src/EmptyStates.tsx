import { useState } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   Reusable empty / error state components for HealthStats.
   Each is self-contained, illustrated with hand-crafted SVG, teal-themed.
   Drop any of them into a page body — they fill their container and center.
   ══════════════════════════════════════════════════════════════════════════════ */

// ── Shared shell ───────────────────────────────────────────────────────────────
function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col items-center text-center px-6 py-12 font-[Work_Sans,system-ui,sans-serif]">
      <div className="max-w-sm flex flex-col items-center">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. No internet connection — offline mode reassurance
   ───────────────────────────────────────────────────────────────────────────── */
export function OfflineState({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <StateShell>
      {/* Illustration: a cloud with a soft "off" slash, and a safe local device */}
      <div className="relative mb-7">
        <svg viewBox="0 0 200 160" className="w-56 h-44">
          {/* soft backdrop */}
          <ellipse cx="100" cy="140" rx="70" ry="10" fill="#ccfbf1" />
          {/* dashed cloud (disconnected) */}
          <path d="M60 70a26 26 0 0151-7 20 20 0 0125 19 18 18 0 01-4 35H62a24 24 0 01-2-47z"
            fill="#f0fdfa" stroke="#5eead4" strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round" />
          {/* device / phone saving locally */}
          <rect x="78" y="78" width="44" height="62" rx="8" fill="#0d9488" />
          <rect x="84" y="86" width="32" height="42" rx="3" fill="#f0fdfa" />
          {/* checkmark = data safe */}
          <path d="M92 106l6 6 12-13" fill="none" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="100" cy="134" r="2.5" fill="#99f6e4" />
          {/* gentle "no signal" mark */}
          <g stroke="#14b8a6" strokeWidth="4" strokeLinecap="round">
            <line x1="142" y1="44" x2="158" y2="60" />
            <line x1="158" y1="44" x2="142" y2="60" />
          </g>
        </svg>
      </div>

      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
        Offline mode
      </span>
      <h2 className="font-display text-2xl text-teal-950 mb-2.5">You're working offline</h2>
      <p className="text-slate-500 leading-relaxed mb-6">
        No internet right now — and that's okay. Keep registering patients and recording visits.
        Everything is saved safely on this device and will sync automatically when you're back online.
      </p>

      <div className="w-full bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center gap-3 text-left mb-6">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-teal-600 flex-shrink-0">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4 4 8-8" />
          </svg>
        </div>
        <p className="text-sm text-teal-800"><span className="font-semibold">14 records</span> saved locally and queued for sync</p>
      </div>

      {onDismiss && (
        <button onClick={onDismiss} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm transition-colors">
          Continue working
        </button>
      )}
    </StateShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. No patients found — search empty state
   ───────────────────────────────────────────────────────────────────────────── */
export function NoPatientsState({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <StateShell>
      {/* Illustration: magnifying glass over an empty patient card */}
      <div className="relative mb-7">
        <svg viewBox="0 0 200 160" className="w-56 h-44">
          <ellipse cx="100" cy="140" rx="66" ry="10" fill="#ccfbf1" />
          {/* patient card */}
          <rect x="52" y="42" width="96" height="74" rx="10" fill="#f0fdfa" stroke="#99f6e4" strokeWidth="3" />
          <circle cx="76" cy="66" r="9" fill="#99f6e4" />
          <rect x="92" y="60" width="42" height="6" rx="3" fill="#5eead4" />
          <rect x="92" y="72" width="30" height="6" rx="3" fill="#99f6e4" />
          <rect x="64" y="92" width="72" height="6" rx="3" fill="#ccfbf1" />
          <rect x="64" y="102" width="52" height="6" rx="3" fill="#ccfbf1" />
          {/* magnifier */}
          <circle cx="128" cy="104" r="24" fill="#ffffff" stroke="#0d9488" strokeWidth="5" />
          <line x1="146" y1="122" x2="164" y2="140" stroke="#0d9488" strokeWidth="7" strokeLinecap="round" />
          {/* subtle question inside */}
          <path d="M124 98a4 4 0 118 .5c0 2.5-4 3-4 5.5" fill="none" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" />
          <circle cx="128" cy="112" r="1.8" fill="#5eead4" />
        </svg>
      </div>

      <h2 className="font-display text-2xl text-teal-950 mb-2.5">No patients found</h2>
      <p className="text-slate-500 leading-relaxed mb-6">
        {query
          ? <>We couldn't find anyone matching <span className="font-semibold text-slate-700">"{query}"</span>. Try a different name, patient ID, or diagnosis.</>
          : <>No patients match your search. Try a different name, patient ID, or diagnosis.</>}
      </p>

      <div className="w-full text-left bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">Try searching by</p>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>· Full or partial name (e.g. "Mariama")</li>
          <li>· Patient ID (e.g. "PT-00412")</li>
          <li>· Diagnosis (e.g. "Malaria")</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onClear && (
          <button onClick={onClear} className="border border-teal-300 text-teal-800 hover:bg-teal-50 font-semibold text-sm px-5 py-3 rounded-xl transition-colors">
            Clear search
          </button>
        )}
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-colors">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.9} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a4 4 0 11-8 0 4 4 0 018 0zM10 7v8M6 11h8M3 18v-1a4 4 0 014-4" />
          </svg>
          Register new patient
        </button>
      </div>
    </StateShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. Sync failed, retrying — recoverable error state
   ───────────────────────────────────────────────────────────────────────────── */
export function SyncFailedState({ onRetry }: { onRetry?: () => void }) {
  const [retrying, setRetrying] = useState(false);
  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => setRetrying(false), 2400);
    onRetry?.();
  };

  return (
    <StateShell>
      {/* Illustration: cloud with circular retry arrows */}
      <div className="relative mb-7">
        <svg viewBox="0 0 200 160" className="w-56 h-44">
          <ellipse cx="100" cy="140" rx="68" ry="10" fill="#fef3c7" />
          {/* cloud */}
          <path d="M58 78a26 26 0 0151-7 20 20 0 0125 19 18 18 0 01-4 35H60a24 24 0 01-2-47z"
            fill="#fffbeb" stroke="#fcd34d" strokeWidth="3" />
          {/* retry arrows spinning */}
          <g className={retrying ? "animate-spin" : ""} style={{ transformOrigin: "100px 96px" }}>
            <path d="M100 76a20 20 0 0117 30" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
            <path d="M100 116a20 20 0 01-17-30" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
            <path d="M117 106l1 8 8-3" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M83 86l-1-8-8 3" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* small alert badge */}
          <circle cx="138" cy="58" r="14" fill="#f59e0b" />
          <path d="M138 52v6M138 63v.5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>

      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-4">
        <span className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${retrying ? "animate-pulse" : ""}`} />
        {retrying ? "Retrying now" : "Sync paused"}
      </span>
      <h2 className="font-display text-2xl text-teal-950 mb-2.5">
        {retrying ? "Trying again…" : "Sync didn't finish"}
      </h2>
      <p className="text-slate-500 leading-relaxed mb-6">
        We couldn't reach the server on the last attempt. Don't worry — your records are safe on this device
        and nothing was lost. We'll keep retrying automatically in the background.
      </p>

      <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3 text-left mb-6">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-amber-500 flex-shrink-0">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-4.5 h-4.5">
            <circle cx="8" cy="8" r="6.5" /><path strokeLinecap="round" d="M8 4.5v3.75l2.5 1.5" />
          </svg>
        </div>
        <p className="text-sm text-amber-800">
          {retrying ? "Reconnecting to the sync server…" : <>Next automatic retry in <span className="font-semibold">30 seconds</span> · 14 records queued</>}
        </p>
      </div>

      <button
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.9} className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v4h.5m11 8v-4H15m1.4-2A6.5 6.5 0 004.6 6.5M3.6 11.5a6.5 6.5 0 0011.8 3" />
        </svg>
        {retrying ? "Retrying…" : "Retry now"}
      </button>
    </StateShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Showcase page — view all three states
   ───────────────────────────────────────────────────────────────────────────── */
const TABS = [
  { key: "offline", label: "No Connection" },
  { key: "empty", label: "No Patients Found" },
  { key: "sync", label: "Sync Failed" },
] as const;

type Tab = typeof TABS[number]["key"];

export default function EmptyStatesShowcase({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>("offline");

  return (
    <div className="min-h-screen bg-slate-50 font-[Work_Sans,system-ui,sans-serif]">
      <header className="bg-white border-b border-teal-100">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-lg text-teal-900 leading-none">HealthStats</p>
              <p className="text-[10px] text-slate-400 mt-0.5">System States</p>
            </div>
          </div>
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
              </svg>
              Home
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl text-teal-950 mb-2">Empty & Error States</h1>
          <p className="text-slate-500">Friendly, reassuring states that keep health workers calm and moving.</p>
        </div>

        {/* Segmented control */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1 gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                  tab === t.key ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:text-teal-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[520px] flex items-center">
          {tab === "offline" && <OfflineState onDismiss={() => {}} />}
          {tab === "empty" && <NoPatientsState query="Kadidia" onClear={() => {}} />}
          {tab === "sync" && <SyncFailedState />}
        </div>
      </main>
    </div>
  );
}
