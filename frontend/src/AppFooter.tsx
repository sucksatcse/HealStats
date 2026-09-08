import React from "react"

interface AppFooterProps {
  onNavigate?: (page: string) => void
  activePage?: string
}

export default function AppFooter({ onNavigate, activePage }: AppFooterProps) {
  const handleNav = (target: string, e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(target)
    }
  }

  return (
    <footer
      style={{
        background: "#0a1f1d",
        borderTop: "1px solid rgba(148,163,184,0.12)",
      }}
      className="text-slate-300 py-14"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <button
              type="button"
              onClick={(e) => handleNav("landing", e)}
              className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1 -m-1 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth={2.2}
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <span className="font-display text-lg text-white font-semibold tracking-tight">
                HealStats
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Offline-first electronic health records for the world{"'"}s underserved clinics.
          </p>
        </div>

        {[
          {
            heading: "Product",
            links: [
              { label: "Features", href: "/#features", target: "features" },
              { label: "Security", href: "#", target: "" },
            ],
          },
          {
            heading: "Organization",
            links: [
              { label: "About", href: "#", target: "" },
              { label: "Blog", href: "#", target: "" },
              { label: "Careers", href: "/careers", target: "careers" },
              { label: "Contact", href: "#", target: "" },
              { label: "Privacy Policy", href: "/privacy", target: "privacy" },
            ],
          },
        ].map(({ heading, links }) => (
          <div key={heading}>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-4">
              {heading}
            </p>
            <ul className="space-y-2.5">
              {links.map((link) => {
                const isNavButton = link.target === "careers" || link.target === "privacy"
                const isActive = activePage === link.target

                if (isNavButton) {
                  return (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={(e) => handleNav(link.target, e)}
                        className={`text-sm transition-colors text-left focus-visible:outline-none focus-visible:underline cursor-pointer ${
                          isActive
                            ? "text-teal-400 font-semibold underline"
                            : "text-teal-300 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </button>
                    </li>
                  )
                }

                if (link.target === "features") {
                  return (
                    <li key={link.label}>
                      <a
                        href="/#features"
                        onClick={(e) => {
                          if (activePage !== "landing" && onNavigate) {
                            handleNav("landing", e)
                            setTimeout(() => {
                              const el = document.getElementById("features")
                              if (el) el.scrollIntoView({ behavior: "smooth" })
                            }, 100)
                          }
                        }}
                        className="text-sm text-teal-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  )
                }

                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-teal-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-12 pt-6 border-t border-teal-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
        <p className="text-xs text-slate-400">
          © 2026 HealStats. Open-source under the MPL 2.0 license.
        </p>
        <p className="text-xs text-slate-400">
          Built for healthcare workers who keep going, no matter what.
        </p>
      </div>
    </footer>
  )
}
