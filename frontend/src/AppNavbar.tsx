import { useState } from "react";
import { useLang } from "./LanguageContext";
import { useTheme } from "./ThemeContext";

/* ══════════════════════════════════════════════════════════════════════════════
   HealthStats — single unified navbar used by every page.

   variant="landing"  (default)
     · Logo + marketing anchor links + optional CTA buttons on the right
     · Right controls: lang pill → dark-mode circle → user avatar

   variant="app"
     · Logo + mobile sidebar toggle + optional breadcrumb + search bar
     · Right controls: connectivity badge → lang pill → dark-mode circle → divider → notifications → user avatar

   Lang and dark mode are read from LanguageContext / ThemeContext (global state).
   No local lang/dark state; no localStorage calls — the contexts own all of that.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── Landing-page anchor links ── */
const LANDING_LINKS = [
  { en: "Features",      bn: "বৈশিষ্ট্য",   href: "#features" },
  { en: "How It Works",  bn: "কীভাবে কাজ করে", href: "#how-it-works-detail" },
  { en: "Testimonials",  bn: "প্রশংসাপত্র",  href: "#testimonials" },
  { en: "Pricing",       bn: "মূল্য",        href: "#pricing" },
];

/* ── Props ── */
interface AppNavbarProps {
  variant?: "landing" | "app";

  /* landing CTA callbacks — omit to hide the button */
  onPatientLookup?: () => void;
  onAdminLogin?: () => void;
  onLogin?: () => void;

  /* app-header props */
  onSidebarOpen?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  isOnline?: boolean;
  onlineText?: string;
  offlineText?: string;
  onNotifications?: () => void;
  notificationCount?: number;
  userInitials?: string;
  userColor?: "teal" | "violet";
  breadcrumb?: string;
}

/* ── Icons ── */
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-[18px] h-[18px]">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function AppNavbar({
  variant = "landing",
  onPatientLookup,
  onAdminLogin,
  onLogin,
  onSidebarOpen,
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
  const { lang, toggleLang } = useLang();
  const { dark, toggleDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isApp = variant === "app";

  /* Avatar styling — app shows initials, landing shows silhouette icon */
  const avatarBase = "w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-200 ring-2 ring-transparent shadow-sm flex-shrink-0";
  const avatarColor =
    userColor === "violet"
      ? "bg-violet-500 hover:bg-violet-600 hover:ring-violet-300 dark:hover:ring-violet-600 shadow-violet-500/20"
      : "bg-teal-600 hover:bg-teal-700 hover:ring-teal-300 dark:hover:ring-teal-600 shadow-teal-600/20";

  /* Shared right-side controls (both variants) */
  const rightControls = (
    <>
      {/* Connectivity badge — app only */}
      {isApp && isOnline !== undefined && (
        <div className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${
          isOnline
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          {isOnline ? onlineText : offlineText}
        </div>
      )}

      {/* ── Language pill ── */}
      <div role="group" aria-label="Select language" className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-[3px] border border-slate-200 dark:border-slate-700">
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

      {/* Notifications — app only */}
      {isApp && onNotifications && (
        <button
          onClick={onNotifications}
          className="relative text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors p-1 flex-shrink-0"
          aria-label="Notifications"
        >
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </button>
      )}

      {/* ── User avatar ── */}
      <button className={`${avatarBase} ${avatarColor}`} aria-label="Your profile">
        {isApp && userInitials ? (
          <span className="text-[11px] font-bold">{userInitials}</span>
        ) : (
          <UserIcon />
        )}
      </button>
    </>
  );

  /* ─── Shared logo ─── */
  const logo = (
    <a href="#" className="flex items-center gap-2.5 flex-shrink-0 group">
      <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm shadow-teal-600/25 group-hover:bg-teal-700 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </div>
      <span className="font-display text-xl tracking-tight text-teal-900 dark:text-white leading-none select-none">
        Health<span className="text-teal-600 dark:text-teal-400">Stats</span>
      </span>
    </a>
  );

  /* ─────────────── APP variant ─────────────── */
  if (isApp) {
    return (
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center gap-3 flex-shrink-0 z-20 transition-colors duration-200">
        {/* Mobile sidebar trigger */}
        <button
          onClick={onSidebarOpen}
          className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex-shrink-0"
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5">
            <path d="M4 7h16M4 12h10M4 17h14" />
          </svg>
        </button>

        {/* Optional breadcrumb */}
        {breadcrumb && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm flex-shrink-0">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Admin</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{breadcrumb}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
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

        <div className="flex items-center gap-2.5 ml-auto">
          {rightControls}
        </div>
      </header>
    );
  }

  /* ─────────────── LANDING variant ─────────────── */
  const hasCtas = onPatientLookup || onAdminLogin || onLogin;

  return (
    <header className="sticky top-0 z-50 bg-white/96 dark:bg-slate-900/96 backdrop-blur-md border-b border-teal-100 dark:border-slate-800 transition-colors duration-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center gap-4">
        {logo}

        {/* Desktop anchor links */}
        <ul className="hidden md:flex items-center gap-1 ml-4">
          {LANDING_LINKS.map(({ en, bn, href }) => (
            <li key={href}>
              <a
                href={href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {lang === "bn" ? bn : en}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5 ml-auto">
          {/* Landing CTA buttons */}
          {hasCtas && (
            <div className="hidden md:flex items-center gap-1.5 mr-1">
              {onPatientLookup && (
                <button onClick={onPatientLookup} className="text-sm font-medium text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 px-3 py-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors">
                  {lang === "bn" ? "ভিজিট দেখুন" : "Check My Visit"}
                </button>
              )}
              {onAdminLogin && (
                <button onClick={onAdminLogin} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:border-teal-300 rounded-lg transition-colors">
                  {lang === "bn" ? "অ্যাডমিন" : "Admin"}
                </button>
              )}
              {onLogin && (
                <button onClick={onLogin} className="text-sm font-medium text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 px-3 py-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors">
                  {lang === "bn" ? "লগ ইন" : "Log in"}
                </button>
              )}
              <a href="#get-started" className="text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20">
                {lang === "bn" ? "শুরু করুন" : "Get Started"}
              </a>
            </div>
          )}

          {hasCtas && <span className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />}

          {rightControls}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                <path strokeLinecap="round" d="M4 7h16M4 12h10M4 17h14" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-teal-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-0.5 animate-slide-up">
          {LANDING_LINKS.map(({ en, bn, href }) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {lang === "bn" ? bn : en}
            </a>
          ))}
          {hasCtas && (
            <>
              <hr className="border-teal-100 dark:border-slate-800 my-1" />
              {onPatientLookup && (
                <button onClick={() => { onPatientLookup(); setMenuOpen(false); }} className="px-3 py-2.5 text-sm font-medium text-teal-700 dark:text-teal-300 text-left rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors">
                  {lang === "bn" ? "ভিজিট দেখুন" : "Check My Visit"}
                </button>
              )}
              {onLogin && (
                <button onClick={() => { onLogin(); setMenuOpen(false); }} className="px-3 py-2.5 text-sm font-medium text-teal-700 dark:text-teal-300 text-left rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors">
                  {lang === "bn" ? "লগ ইন" : "Log in"}
                </button>
              )}
              <a href="#get-started" onClick={() => setMenuOpen(false)} className="mx-0 mt-1 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white text-center hover:bg-teal-700 transition-colors">
                {lang === "bn" ? "শুরু করুন" : "Get Started"}
              </a>
            </>
          )}
        </div>
      )}
    </header>
  );
}
