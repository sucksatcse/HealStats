import { useState, useRef, useEffect } from "react"
import { useLang } from "./LanguageContext"
import { useTheme } from "./ThemeContext"
import { useAuth } from "./AuthContext"
import PillNav, { PillNavItem } from "./PillNav"

export type { PillNavItem }

/* ══════════════════════════════════════════════════════════════════════════════
   HealStats — single unified navbar used by every page.
   Now upgraded with premium animated PillNav interaction.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── Landing-page anchor links ── */
const LANDING_LINKS: PillNavItem[] = [
  { id: "features", label: "Features", labelBn: "বৈশিষ্ট্য", href: "#features" },
  { id: "how-it-works", label: "How It Works", labelBn: "কীভাবে কাজ করে", href: "#how-it-works-detail" },
  { id: "coverage", label: "Coverage", labelBn: "কভারেজ", href: "#coverage" },
  { id: "testimonials", label: "Testimonials", labelBn: "প্রশংসাপত্র", href: "#testimonials" },
]

/* ── Props ── */
interface AppNavbarProps {
  variant?: "landing" | "app"

  /* Pill navigation items & active selection */
  navItems?: PillNavItem[]
  activeNav?: string
  onNavChange?: (id: string) => void

  /* landing CTA callbacks — omit to hide the button */
  onPatientLookup?: () => void
  onGetStarted?: () => void
  onLogin?: () => void
  onSignUp?: () => void
  onDashboard?: () => void
  onLogout?: () => void

  /* app-header props */
  onSidebarOpen?: () => void
  onProfile?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  isOnline?: boolean
  onlineText?: string
  offlineText?: string
  onNotifications?: () => void
  notificationCount?: number
  userInitials?: string
  userColor?: "teal" | "violet"
  breadcrumb?: string
}

/* ── Icons ── */
function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="w-[18px] h-[18px]"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[18px] h-[18px]"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[18px] h-[18px]"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function AppNavbar({
  variant = "landing",
  navItems,
  activeNav,
  onNavChange,
  onPatientLookup,
  onGetStarted,
  onLogin,
  onSignUp,
  onDashboard,
  onLogout,
  onSidebarOpen,
  onProfile,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  isOnline,
  onlineText = "Online",
  offlineText = "Offline",
  onNotifications,
  notificationCount = 0,
  userInitials,
  userColor = "teal",
  breadcrumb,
}: AppNavbarProps) {
  const { lang, toggleLang } = useLang()
  const { dark, toggleDark } = useTheme()
  const { session, user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isApp = variant === "app"

  /* Avatar styling — app shows initials, landing shows initials or silhouette */
  const avatarBase =
    "w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-200 ring-2 ring-transparent shadow-sm flex-shrink-0 cursor-pointer"
  const avatarColor =
    userColor === "violet"
      ? "bg-violet-500 hover:bg-violet-600 hover:ring-violet-300 dark:hover:ring-violet-600 shadow-violet-500/20"
      : "bg-teal-600 hover:bg-teal-700 hover:ring-teal-300 dark:hover:ring-teal-600 shadow-teal-600/20"

  const derivedInitials =
    userInitials ||
    (profile?.name
      ? profile.name
          .split(" ")
          .map((p) => p[0])
          .filter(Boolean)
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : null)

  /* Shared right-side controls (both variants) */
  const rightControls = (
    <>
      {/* Connectivity badge — app only */}
      {isApp && isOnline !== undefined && (
        <div
          className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${
            isOnline
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {isOnline ? onlineText : offlineText}
        </div>
      )}

      {/* ── Language pill ── */}
      <div
        role="group"
        aria-label="Select language"
        className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-[3px] border border-slate-200 dark:border-slate-700"
      >
        <button
          onClick={() => lang !== "en" && toggleLang()}
          aria-pressed={lang === "en"}
          aria-label="English"
          className={`inline-flex items-center justify-center px-3 py-[5px] rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 leading-none ${
            lang === "en"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => lang !== "bn" && toggleLang()}
          aria-pressed={lang === "bn"}
          aria-label="বাংলা"
          className={`inline-flex items-center justify-center px-3 py-[5px] rounded-full text-[12px] font-bold transition-all duration-200 leading-none ${
            lang === "bn"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          বাং
        </button>
      </div>

      {/* ── Dark-mode circle ── */}
      <button
        onClick={toggleDark}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light mode" : "Dark mode"}
        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          dark
            ? "border-amber-400/60 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 hover:border-amber-400"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700"
        }`}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Divider */}
      <span className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

      {/* ── Unauthenticated / Guest state: Log In + Sign Up ── */}
      {!session ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onLogin && (
            <button
              onClick={onLogin}
              className="inline-flex items-center justify-center px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {lang === "bn" ? "লগ ইন" : "Log In"}
            </button>
          )}
          {(onSignUp || onGetStarted) && (
            <button
              onClick={onSignUp || onGetStarted}
              className="inline-flex items-center justify-center px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-sm shadow-teal-600/20 transition-all hover:shadow-md hover:shadow-teal-600/30 cursor-pointer"
            >
              {lang === "bn" ? "সাইন আপ" : "Sign Up"}
            </button>
          )}
        </div>
      ) : (
        /* ── Authenticated User Controls: Notifications + Avatar Menu ── */
        <>
          {/* Notifications — app only */}
          {isApp && onNotifications && (
            <button
              onClick={onNotifications}
              className="relative text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors p-1 flex-shrink-0 cursor-pointer"
              aria-label="Notifications"
            >
              <BellIcon />
              {notificationCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </button>
          )}

          {/* User Avatar button */}
          <div className="relative" ref={userMenuRef}>
            <button
              className={`${avatarBase} ${avatarColor}`}
              aria-label="Your profile"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              {derivedInitials ? (
                <span className="text-[11px] font-bold">{derivedInitials}</span>
              ) : (
                <UserIcon />
              )}
            </button>

            {/* Popover Menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl py-1.5 z-50 animate-slide-up shadow-xl"
                style={{
                  background: "var(--an-surface-raised)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid var(--an-border-strong)",
                  boxShadow: "var(--an-glass-shadow-lg)",
                }}
              >
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {profile?.name || user?.email || (lang === "bn" ? "ব্যবহারকারী" : "User")}
                  </p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium capitalize">
                    {profile?.role === "admin"
                      ? (lang === "bn" ? "অ্যাডমিনিস্ট্রেটর" : "Administrator")
                      : profile?.designation === "nurse"
                      ? (lang === "bn" ? "নার্স / ক্লিনিক্যাল ট্রায়াজ" : "Staff Nurse / Triage")
                      : profile?.designation === "clinical_officer"
                      ? (lang === "bn" ? "ক্লিনিক্যাল অফিসার" : "Clinical Officer")
                      : (lang === "bn" ? "স্বাস্থ্যকর্মী" : "Health Worker")}
                  </p>
                </div>

                {/* Role-specific Navigation: strictly isolated by role */}
                {profile?.designation === "nurse" ? (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", "/nurse")
                        window.dispatchEvent(new PopStateEvent("popstate"))
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="w-4 h-4 text-teal-600 dark:text-teal-400"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    {lang === "bn" ? "নার্স স্টেশন" : "Nurse Station"}
                  </button>
                ) : profile?.designation === "clinical_officer" ? (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", "/clinical-officer")
                        window.dispatchEvent(new PopStateEvent("popstate"))
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="w-4 h-4 text-teal-600 dark:text-teal-400"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {lang === "bn" ? "ক্লিনিক্যাল স্টেশন" : "Clinical Station"}
                  </button>
                ) : onDashboard ? (
                  <>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        onDashboard()
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="w-4 h-4 text-slate-500 dark:text-slate-400"
                      >
                        <rect x="3" y="3" width="6" height="6" rx="1.5" />
                        <rect x="11" y="3" width="6" height="6" rx="1.5" />
                        <rect x="3" y="11" width="6" height="6" rx="1.5" />
                        <rect x="11" y="11" width="6" height="6" rx="1.5" />
                      </svg>
                      {profile?.role === "admin"
                        ? (lang === "bn" ? "অ্যাডমিন কনসোল" : "Admin Console")
                        : (lang === "bn" ? "ড্যাশবোর্ড" : "Dashboard")}
                    </button>
                    {profile?.role === "admin" && (
                      <>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (typeof window !== "undefined") {
                              window.history.pushState(null, "", "/nurse")
                              window.dispatchEvent(new PopStateEvent("popstate"))
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-teal-600 dark:text-teal-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5v13M3.5 10h13" />
                          </svg>
                          {lang === "bn" ? "নার্স স্টেশন" : "Nurse Station"}
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (typeof window !== "undefined") {
                              window.history.pushState(null, "", "/clinical-officer")
                              window.dispatchEvent(new PopStateEvent("popstate"))
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-teal-600 dark:text-teal-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {lang === "bn" ? "ক্লিনিক্যাল স্টেশন" : "Clinical Station"}
                        </button>
                      </>
                    )}
                  </>
                ) : null}

                {onProfile && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      onProfile()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="w-4 h-4 text-slate-500 dark:text-slate-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 10a3 3 0 100-6 3 3 0 000 6zm-6 8a6 6 0 1112 0H4z"
                      />
                    </svg>
                    {lang === "bn" ? "আমার প্রোফাইল" : "My Profile"}
                  </button>
                )}

                <button
                  onClick={async () => {
                    setUserMenuOpen(false)
                    await signOut()
                    onLogout?.()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="w-4 h-4 text-red-500 dark:text-red-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  {lang === "bn" ? "লগ আউট" : "Log Out"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )

  /* ─── Shared logo with subtle hover animation (scale 1 -> 1.04) and initial reveal ─── */
  const logo = (
    <a href="#" className="hs-navbar-logo hs-animate-logo group flex items-center gap-2.5 flex-shrink-0">
      <div className="hs-navbar-logo-icon w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm shadow-teal-600/25 group-hover:bg-teal-700 transition-all">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2.2}
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </div>
      <span className="font-display text-xl tracking-tight text-teal-900 dark:text-white leading-none select-none">
        Heal<span className="text-teal-600 dark:text-teal-400">Stats</span>
      </span>
    </a>
  )

  /* ─────────────── APP variant ─────────────── */
  if (isApp) {
    return (
      <header className="h-14 glass-nav px-4 lg:px-6 flex items-center gap-3 flex-shrink-0 z-20 transition-all duration-200">
        {/* Mobile sidebar trigger */}
        <button
          onClick={onSidebarOpen}
          className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex-shrink-0"
          aria-label="Open sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="w-5 h-5"
          >
            <path d="M4 7h16M4 12h10M4 17h14" />
          </svg>
        </button>

        {/* Optional breadcrumb */}
        {breadcrumb && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm flex-shrink-0">
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              Admin
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {breadcrumb}
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        {/* Optional App PillNav for quick section switching */}
        {navItems && navItems.length > 0 && (
          <div className="hidden xl:flex items-center mx-2 flex-shrink-0">
            <PillNav
              items={navItems}
              activeId={activeNav}
              onSelect={onNavChange}
              lang={lang}
            />
          </div>
        )}

        <div className="flex items-center gap-2.5 ml-auto">{rightControls}</div>
      </header>
    )
  }

  /* ─────────────── LANDING variant ─────────────── */
  const landingNavItems: PillNavItem[] = navItems || [
    { id: "features", label: "Features", labelBn: "বৈশিষ্ট্য", href: "#features" },
    { id: "how-it-works", label: "How It Works", labelBn: "কীভাবে কাজ করে", href: "#how-it-works-detail" },
    { id: "coverage", label: "Coverage", labelBn: "কভারেজ", href: "#coverage" },
    { id: "testimonials", label: "Testimonials", labelBn: "প্রশংসাপত্র", href: "#testimonials" },
    ...(onPatientLookup
      ? [
          {
            id: "patient-lookup",
            label: "Check My Visit",
            labelBn: "ভিজিট দেখুন",
            onClick: onPatientLookup,
          },
        ]
      : []),
  ]

  return (
    <header className="sticky top-0 z-50 glass-nav transition-all duration-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* [HealthStats Logo] */}
        {logo}

        {/* [ Features | How It Works | Coverage | Testimonials | Check My Visit ] */}
        <div className="hs-desktop-pill-nav items-center mx-auto">
          <PillNav
            items={landingNavItems}
            activeId={activeNav}
            onSelect={onNavChange}
            lang={lang}
            animateReveal
          />
        </div>

        {/* [ Language ] [ Theme ] [ Auth Actions / Profile ] */}
        <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
          {rightControls}

          {/* Mobile animated hamburger (Visible only < 1024px, completely hidden on desktop) */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="hs-hamburger-btn border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="hs-hamburger-box" aria-hidden="true">
              <span className="hs-hamburger-line hs-hamburger-line-1" />
              <span className="hs-hamburger-line hs-hamburger-line-2" />
              <span className="hs-hamburger-line hs-hamburger-line-3" />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer with navigation and auth actions */}
      {menuOpen && (
        <div
          className="hs-mobile-menu-drawer lg:hidden border-t px-4 py-3.5 flex flex-col gap-3"
          style={{
            borderColor: "var(--an-nav-border)",
            background: "var(--an-nav-bg)",
            backdropFilter: "blur(20px)",
          }}
        >
          <PillNav
            variant="mobile"
            items={landingNavItems}
            activeId={activeNav}
            onSelect={(id) => {
              onNavChange?.(id)
              setMenuOpen(false)
            }}
            lang={lang}
          />

          {!session ? (
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-col gap-2">
              {onLogin && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onLogin()
                  }}
                  className="w-full py-2.5 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === "bn" ? "লগ ইন" : "Log In"}
                </button>
              )}
              {(onSignUp || onGetStarted) && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    if (onSignUp) onSignUp()
                    else if (onGetStarted) onGetStarted()
                  }}
                  className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {lang === "bn" ? "সাইন আপ" : "Sign Up"}
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-col gap-2">
              <div className="px-2 py-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {profile?.name || user?.email || (lang === "bn" ? "ব্যবহারকারী" : "User")}
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400 capitalize">
                  {profile?.role === "admin"
                    ? (lang === "bn" ? "অ্যাডমিনিস্ট্রেটর" : "Administrator")
                    : (lang === "bn" ? "স্বাস্থ্যকর্মী" : "Health Worker")}
                </p>
              </div>
              {onDashboard && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onDashboard()
                  }}
                  className="w-full py-2 px-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="w-4 h-4 text-slate-500 dark:text-slate-400"
                  >
                    <rect x="3" y="3" width="6" height="6" rx="1.5" />
                    <rect x="11" y="3" width="6" height="6" rx="1.5" />
                    <rect x="3" y="11" width="6" height="6" rx="1.5" />
                    <rect x="11" y="11" width="6" height="6" rx="1.5" />
                  </svg>
                  {lang === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}
                </button>
              )}
              {onProfile && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onProfile()
                  }}
                  className="w-full py-2 px-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="w-4 h-4 text-slate-500 dark:text-slate-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 10a3 3 0 100-6 3 3 0 000 6zm-6 8a6 6 0 1112 0H4z"
                    />
                  </svg>
                  {lang === "bn" ? "আমার প্রোফাইল" : "My Profile"}
                </button>
              )}
              <button
                onClick={async () => {
                  setMenuOpen(false)
                  await signOut()
                  onLogout?.()
                }}
                className="w-full py-2 px-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="w-4 h-4 text-red-500 dark:text-red-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                {lang === "bn" ? "লগ আউট" : "Log Out"}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

