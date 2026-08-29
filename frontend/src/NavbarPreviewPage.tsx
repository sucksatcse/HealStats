import AppNavbar from "./AppNavbar";

/* ══════════════════════════════════════════════════════════════════════════════
   Navbar preview / showcase page.
   AppNavbar is self-contained — it owns its own lang + dark state internally,
   applies .dark to <html>, and persists dark preference to localStorage.
   This page just mounts the navbar and provides context below it.
   ══════════════════════════════════════════════════════════════════════════════ */

export default function NavbarPreviewPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* The component under showcase */}
      <AppNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 transition-colors mb-8"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
            </svg>
            Back to Home
          </button>
        )}

        <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 dark:text-teal-400 mb-3">
          Navbar Component
        </p>
        <h1 className="font-display text-4xl lg:text-5xl text-slate-900 dark:text-white leading-tight mb-4 max-w-2xl">
          Top navigation, in any language or theme.
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed mb-10">
          The navbar is fully self-contained. Language and dark mode state live inside
          the component — no props needed. Dark preference persists across reloads via
          localStorage.
        </p>

        {/* Stat cards — respond to dark mode via the <html> .dark class */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mb-10">
          {[
            { label: "Patients Today", value: "23", color: "text-teal-600 dark:text-teal-400" },
            { label: "Pending Sync",   value: "14", color: "text-amber-600 dark:text-amber-400" },
            { label: "Flagged by AI",  value: "5",  color: "text-red-600 dark:text-red-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 transition-colors"
            >
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-2">{label}</p>
              <p className={`font-display text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-teal-500 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Try the EN | বাং pill and the circular sun/moon button on the right of the navbar above.
        </div>
      </main>
    </div>
  );
}
