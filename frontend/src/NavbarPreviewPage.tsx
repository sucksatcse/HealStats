import { useState } from "react"
import AppNavbar from "./AppNavbar"
import PillNav, { PillNavItem } from "./PillNav"

/* ══════════════════════════════════════════════════════════════════════════════
   Navbar preview / showcase page.
   Showcases both the main AppNavbar with integrated PillNav and a standalone
   PillNav interactive playground showcasing worker, admin, and custom items.
   ══════════════════════════════════════════════════════════════════════════════ */

const WORKER_ITEMS: PillNavItem[] = [
  { id: "overview", label: "Dashboard", labelBn: "ড্যাশবোর্ড" },
  { id: "patients", label: "Patients", labelBn: "রোগী তালিকা" },
  { id: "vitals", label: "Visits", labelBn: "ভিজিট রেকর্ড" },
  { id: "offline-sync", label: "Sync", labelBn: "সিঙ্ক" },
  { id: "emergency", label: "Emergency", labelBn: "জরুরি মোড", badge: "SOS" },
]

const ADMIN_ITEMS: PillNavItem[] = [
  { id: "overview", label: "Overview", labelBn: "সংক্ষিপ্ত" },
  { id: "staff", label: "Staff", labelBn: "কর্মী" },
  { id: "analytics", label: "Analytics", labelBn: "বিশ্লেষণ" },
  { id: "resources", label: "Resources", labelBn: "সম্পদ" },
  { id: "alerts", label: "Alerts", labelBn: "সতর্কতা", badge: "Live" },
]

export default function NavbarPreviewPage({ onBack }: { onBack?: () => void }) {
  const [activeWorkerNav, setActiveWorkerNav] = useState("overview")
  const [activeAdminNav, setActiveAdminNav] = useState("analytics")
  const [activeLandingNav, setActiveLandingNav] = useState("features")
  const [demoLang, setDemoLang] = useState<"en" | "bn">("en")

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* ── Primary AppNavbar Showcase (Landing Variant with PillNav) ── */}
      <AppNavbar
        activeNav={activeLandingNav}
        onNavChange={setActiveLandingNav}
        onPatientLookup={() => alert("Patient Lookup clicked")}
        onGetStarted={() => alert("Get Started clicked")}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              className="w-4.5 h-4.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 6l-6 6 6 6"
              />
            </svg>
            Back to Home
          </button>
        )}

        <div>
          <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 dark:text-teal-400 mb-3">
            Pill Navigation System
          </p>
          <h1 className="font-display text-4xl lg:text-5xl text-slate-900 dark:text-white leading-tight mb-4 max-w-2xl">
            HealthStats Animated Pill Navigation
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Inspired by the React Bits PillNav interaction, adapted with Ashen
            Nebula healthcare aesthetics. Features circular expanding hover fills,
            subtle sliding text transitions, active indicators, and zero external
            animation dependencies.
          </p>
        </div>

        {/* ── Standalone Interactive PillNav Playground ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Interactive Component Playground
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Hover over the items to test the circular bottom-up fill and text slide.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Language:
              </span>
              <button
                onClick={() => setDemoLang("en")}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                  demoLang === "en"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setDemoLang("bn")}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                  demoLang === "bn"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* Worker Navigation Example */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Worker Dashboard PillNav
              </h3>
              <span className="text-xs text-slate-400">
                Active: <code className="text-teal-600 dark:text-teal-400 font-mono">{activeWorkerNav}</code>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-start overflow-x-auto">
              <PillNav
                items={WORKER_ITEMS}
                activeId={activeWorkerNav}
                onSelect={setActiveWorkerNav}
                lang={demoLang}
              />
            </div>
          </div>

          {/* Admin Navigation Example */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Admin Operations PillNav
              </h3>
              <span className="text-xs text-slate-400">
                Active: <code className="text-teal-600 dark:text-teal-400 font-mono">{activeAdminNav}</code>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-start overflow-x-auto">
              <PillNav
                items={ADMIN_ITEMS}
                activeId={activeAdminNav}
                onSelect={setActiveAdminNav}
                lang={demoLang}
              />
            </div>
          </div>

          {/* Mobile Drawer Example */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Mobile Drawer Vertical PillNav (Compact &lt; 768px Preview)
            </h3>
            <div className="max-w-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
              <PillNav
                variant="mobile"
                items={WORKER_ITEMS}
                activeId={activeWorkerNav}
                onSelect={setActiveWorkerNav}
                lang={demoLang}
              />
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              Circular Bottom-Up Fill
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              GPU-accelerated CSS circle expands from bottom-center on hover,
              respecting reduced-motion preferences automatically.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              Sliding Text Transitions
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Normal and hover text layers glide with fine-tuned cubic-bezier
              curves for an organic, responsive feel without overshoot or jitter.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              Accessible & Zero Bloat
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Native keyboard focus, aria-current indicators, full dark/light
              contrast, and zero runtime bundle overhead.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
