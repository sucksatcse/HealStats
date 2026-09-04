import { useState } from "react"

// A small set of muted particles — teal/amber/slate, no bright primaries — placed
// around the badge. Each gets a randomized offset, delay, drift, and spin.
const PARTICLES = [
  {
    left: "12%",
    color: "bg-teal-400",
    size: "w-2 h-2",
    delay: "0.5s",
    spin: "220deg",
  },
  {
    left: "24%",
    color: "bg-amber-300",
    size: "w-1.5 h-1.5",
    delay: "0.65s",
    spin: "-180deg",
  },
  {
    left: "38%",
    color: "bg-teal-500",
    size: "w-2 h-2 rounded-sm",
    delay: "0.55s",
    spin: "160deg",
  },
  {
    left: "50%",
    color: "bg-emerald-300",
    size: "w-1.5 h-1.5",
    delay: "0.75s",
    spin: "-240deg",
  },
  {
    left: "62%",
    color: "bg-teal-300",
    size: "w-2 h-2 rounded-sm",
    delay: "0.6s",
    spin: "200deg",
  },
  {
    left: "76%",
    color: "bg-amber-300",
    size: "w-1.5 h-1.5",
    delay: "0.7s",
    spin: "-160deg",
  },
  {
    left: "88%",
    color: "bg-teal-400",
    size: "w-2 h-2",
    delay: "0.5s",
    spin: "260deg",
  },
]

export default function SuccessConfirmationPage({
  onDone,
  onSaveAnother,
}: {
  onDone?: () => void
  onSaveAnother?: () => void
}) {
  // `run` keys the animated subtree so "Save another" replays the whole sequence.
  const [run, setRun] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 via-white to-white flex items-center justify-center px-4 font-[Work_Sans,system-ui,sans-serif]">
      <div key={run} className="w-full max-w-md text-center">
        {/* Badge + particles */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          {/* Confetti particles drift down from the top of the badge zone */}
          <div className="pointer-events-none absolute -inset-x-8 -top-4 bottom-0">
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className={`animate-confetti absolute top-0 rounded-full ${p.size} ${p.color}`}
                style={{
                  left: p.left,
                  animationDelay: p.delay,
                  ["--spin" as string]: p.spin,
                }}
              />
            ))}
          </div>

          {/* Rippling ring */}
          <span className="animate-success-ring absolute inset-0 rounded-full border-2 border-teal-400" />

          {/* Teal circle */}
          <div className="animate-success-pop relative w-32 h-32 rounded-full bg-teal-600 shadow-lg shadow-teal-600/30 flex items-center justify-center">
            <svg viewBox="0 0 52 52" className="w-16 h-16" fill="none">
              <path
                className="animate-check-draw"
                d="M14 27l8 8 16-18"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Copy */}
        <h1
          className="font-display text-3xl text-teal-950 mb-2 animate-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          Record Saved Successfully
        </h1>
        <p
          className="text-slate-500 leading-relaxed mb-1 animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          Mariama Kouyaté&apos;s visit has been stored on this device.
        </p>
        <p
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-8 animate-slide-up"
          style={{ animationDelay: "0.65s" }}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 text-amber-500"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9zm1-4a1 1 0 100 2 1 1 0 000-2z"
              clipRule="evenodd"
            />
          </svg>
          Will sync automatically when back online · Ref PT-00412
        </p>

        {/* Actions */}
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up"
          style={{ animationDelay: "0.75s" }}
        >
          <button
            onClick={onDone}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-teal-600 text-white shadow-sm shadow-teal-600/20 transition-all duration-150 hover:bg-teal-700 hover:scale-[1.03] active:bg-teal-800 active:scale-[0.97]"
          >
            View Patient Record
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 4l4 4-4 4"
              />
            </svg>
          </button>
          <button
            onClick={() =>
              onSaveAnother ? onSaveAnother() : setRun((r) => r + 1)
            }
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-teal-700 border border-teal-300 transition-all duration-150 hover:bg-teal-50 hover:border-teal-400 hover:scale-[1.03] active:bg-teal-100 active:scale-[0.97]"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 4v12M4 10h12"
              />
            </svg>
            Add Another Patient
          </button>
        </div>
      </div>
    </div>
  )
}
