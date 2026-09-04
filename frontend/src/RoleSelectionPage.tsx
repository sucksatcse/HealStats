import { useState } from "react"

type Role = "health-worker" | "clinic-admin" | "district-coordinator"

interface Props {
  onSelect: (role: Role) => void
  onBack: () => void
}

const ROLES: {
  id: Role
  label: string
  tagline: string
  desc: string
  icon: React.ReactNode
  accent: string
  accentLight: string
}[] = [
  {
    id: "health-worker",
    label: "Health Worker",
    tagline: "Field & clinic care",
    desc: "Register patients, record vitals, run AI triage, and manage visit histories — works fully offline at the point of care.",
    accent: "text-teal-700",
    accentLight: "bg-teal-50 group-hover:bg-teal-100",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    id: "clinic-admin",
    label: "Clinic Admin",
    tagline: "Facility management",
    desc: "Oversee patient records, manage staff, monitor sync status, review high-risk flags, and configure facility settings.",
    accent: "text-teal-700",
    accentLight: "bg-teal-50 group-hover:bg-teal-100",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    id: "district-coordinator",
    label: "District Coordinator",
    tagline: "Regional oversight",
    desc: "Track health outcomes across multiple facilities, review analytics and trends, coordinate emergency response across the district.",
    accent: "text-teal-700",
    accentLight: "bg-teal-50 group-hover:bg-teal-100",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6.75v6.75" />
      </svg>
    ),
  },
]

export default function RoleSelectionPage({ onSelect, onBack }: Props) {
  const [hovered, setHovered] = useState<Role | null>(null)
  const [selecting, setSelecting] = useState<Role | null>(null)

  const handleSelect = (id: Role) => {
    setSelecting(id)
    setTimeout(() => onSelect(id), 320)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          {/* HealthStats logo mark */}
          <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 20 20" fill="none" className="w-4.5 h-4.5">
              <path
                d="M10 3v5M7.5 5.5h5M4 10.5a6 6 0 1012 0 6 6 0 00-12 0z"
                stroke="white"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-display text-teal-900 text-lg leading-none tracking-tight">
            HealthStats
          </span>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 transition-colors group"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 -translate-x-0 group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back to login
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Heading block */}
        <div className="text-center mb-12 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase mb-5">
            <svg
              viewBox="0 0 12 12"
              fill="currentColor"
              className="w-2 h-2 rounded-full"
            >
              <circle cx="6" cy="6" r="6" />
            </svg>
            Logged in successfully
          </div>
          <h1 className="font-display text-4xl text-teal-950 leading-tight mb-3">
            How are you using HealthStats today?
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Select your role to enter the right workspace. You can switch roles
            any time from your account settings.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-3 gap-5 w-full max-w-3xl">
          {ROLES.map(
            ({ id, label, tagline, desc, icon, accentLight, accent }) => {
              const isHovered = hovered === id
              const isSelecting = selecting === id

              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group relative text-left bg-white rounded-2xl border-2 p-7 flex flex-col gap-5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                    isSelecting
                      ? "border-teal-600 shadow-xl shadow-teal-100 scale-[0.98]"
                      : isHovered
                        ? "border-teal-400 shadow-lg shadow-teal-100 -translate-y-1"
                        : "border-teal-100 shadow-sm hover:border-teal-300"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${accent} ${accentLight} transition-colors`}
                  >
                    {icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="text-xs font-bold tracking-[0.12em] uppercase text-teal-500 mb-1.5">
                      {tagline}
                    </p>
                    <h2 className="font-display text-xl text-teal-950 leading-snug mb-2.5">
                      {label}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  {/* CTA arrow */}
                  <div
                    className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                      isHovered || isSelecting
                        ? "text-teal-700"
                        : "text-teal-400"
                    }`}
                  >
                    {isSelecting ? (
                      <>
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 animate-spin"
                        >
                          <path
                            d="M8 2a6 6 0 100 12A6 6 0 008 2z"
                            strokeDasharray="28"
                            strokeDashoffset="10"
                          />
                        </svg>
                        Entering workspace…
                      </>
                    ) : (
                      <>
                        Enter workspace
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`w-4 h-4 transition-transform ${
                            isHovered ? "translate-x-1" : ""
                          }`}
                        >
                          <path d="M3 8h10M9 4l4 4-4 4" />
                        </svg>
                      </>
                    )}
                  </div>

                  {/* Active indicator dot — top-right corner */}
                  {isSelecting && (
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                  )}
                </button>
              )
            },
          )}
        </div>

        {/* Footer hint */}
        <p className="mt-10 text-xs text-slate-400 text-center">
          Your session is encrypted and stored locally.{" "}
          <span className="text-teal-500 font-medium">Works offline.</span>
        </p>
      </main>

      {/* Subtle bottom decoration */}
      <div className="h-1.5 bg-gradient-to-r from-teal-600 via-teal-400 to-teal-700" />
    </div>
  )
}
