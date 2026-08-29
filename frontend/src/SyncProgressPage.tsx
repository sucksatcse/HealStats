import { useEffect, useState } from "react";

// Geometry for the circular progress ring
const SIZE = 176;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function SyncProgressPage({ onDone }: { onDone?: () => void }) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  // Count upward with slightly irregular steps so it feels like real work,
  // easing off near the end the way a genuine transfer does.
  useEffect(() => {
    if (done) return;
    if (pct >= 100) {
      const t = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(t);
    }
    const step = pct > 85 ? 1 : pct > 60 ? 2 : 4;
    const t = setTimeout(() => setPct((p) => Math.min(100, p + step)), 90);
    return () => clearTimeout(t);
  }, [pct, done]);

  const total = 14;
  const synced = Math.round((pct / 100) * total);
  const offset = CIRC - (pct / 100) * CIRC;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 via-white to-white flex items-center justify-center px-4 font-[Work_Sans,system-ui,sans-serif]">
      <div className="w-full max-w-md text-center">
        {/* Ring + center */}
        <div className="relative mx-auto mb-8" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            {/* Track */}
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#e2f0ee" strokeWidth={STROKE} />
            {/* Progress */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={done ? "#059669" : "#0d9488"}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.4s ease" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {done ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.6} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </>
            ) : (
              <>
                {/* Rotating sync icon */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth={2}
                  className="w-7 h-7 mb-1 animate-spin"
                  style={{ animationDuration: "1.4s" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-display text-4xl text-teal-900 tabular-nums leading-none">{pct}%</span>
                <span className="text-[11px] font-medium text-slate-400 mt-1">
                  {synced} of {total} records
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status line */}
        {done ? (
          <>
            <h1 className="font-display text-3xl text-teal-950 mb-2">All records synced</h1>
            <p className="text-slate-500 leading-relaxed mb-8">
              {total} patient records are safely backed up to the district server.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl text-teal-950 mb-2 flex items-center justify-center">
              Syncing records
              <span className="inline-flex ml-0.5">
                <span className="animate-dot" style={{ animationDelay: "0s" }}>.</span>
                <span className="animate-dot" style={{ animationDelay: "0.2s" }}>.</span>
                <span className="animate-dot" style={{ animationDelay: "0.4s" }}>.</span>
              </span>
            </h1>
            <p className="text-slate-500 leading-relaxed mb-8">
              Keep this device connected — your work is being backed up safely.
              You can leave this screen; syncing continues in the background.
            </p>
          </>
        )}

        {/* Connection chip */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-3 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          Connected · District Server
        </div>

        {/* Action */}
        {done && (
          <div>
            <button
              onClick={onDone}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-teal-600 text-white shadow-sm shadow-teal-600/20 transition-all duration-150 hover:bg-teal-700 hover:scale-[1.03] active:bg-teal-800 active:scale-[0.97]"
            >
              Done
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
