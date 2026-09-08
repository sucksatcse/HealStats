import { useState, useMemo, useEffect, useRef } from "react"
import AppNavbar from "./AppNavbar"
import AppFooter from "./AppFooter"
import { useLang } from "./LanguageContext"
import {
  fetchPublicStaffList,
  getStaffInitials,
  type PublicStaffMember,
} from "./lib/publicStaffService"
import { useAuth } from "./AuthContext"

interface CareersPageProps {
  onBack?: () => void
  onNavigate: (page: string) => void
}

// ── Deterministic Avatar Color Palette ──────────────────────────────────────────
const AVATAR_PALETTES = [
  "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60",
  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
  "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60",
  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/60",
  "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60",
  "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[idx]
}

const PAGE_SIZE = 16

export default function CareersPage({ onBack, onNavigate }: CareersPageProps) {
  const { lang } = useLang()
  const { profile, signOut } = useAuth()

  // State
  const [staffList, setStaffList] = useState<PublicStaffMember[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [availableClinics, setAvailableClinics] = useState<string[]>([])
  const [availableDesignations, setAvailableDesignations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<"all" | "worker" | "admin">("all")
  const [selectedDesignation, setSelectedDesignation] = useState("all")
  const [selectedClinic, setSelectedClinic] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Directory anchor for scroll on page change
  const directoryRef = useRef<HTMLDivElement>(null)

  // Copy email feedback
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  // Fetch staff data
  const loadStaff = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const res = await fetchPublicStaffList()
      if (res.error) {
        setFetchError(res.error)
      } else {
        setStaffList(res.data)
        setTotalCount(res.totalCount)
        setAvailableClinics(res.clinics)
        setAvailableDesignations(res.designations)
      }
    } catch (err) {
      console.error("[CareersPage] loadStaff failed:", err)
      setFetchError("We couldn’t load our team directory right now. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  // Filter & Search computation
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return staffList.filter((member) => {
      // Role filter
      if (selectedRole !== "all" && member.role !== selectedRole) {
        return false
      }

      // Designation filter
      if (selectedDesignation !== "all" && member.designation !== selectedDesignation) {
        return false
      }

      // Clinic filter
      if (selectedClinic !== "all" && member.clinicName !== selectedClinic) {
        return false
      }

      // Search query across name, role, designation, clinic, zone, email
      if (q) {
        const matchesName = member.name.toLowerCase().includes(q)
        const matchesDesignation = member.designation.toLowerCase().includes(q)
        const matchesRole = (member.role === "admin" ? "administrator" : "health worker").includes(q)
        const matchesClinic = member.clinicName.toLowerCase().includes(q)
        const matchesZone = member.clinicZone ? member.clinicZone.toLowerCase().includes(q) : false
        const matchesEmail = member.email ? member.email.toLowerCase().includes(q) : false

        if (!matchesName && !matchesDesignation && !matchesRole && !matchesClinic && !matchesZone && !matchesEmail) {
          return false
        }
      }

      return true
    })
  }, [staffList, searchQuery, selectedRole, selectedDesignation, selectedClinic])

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedRole, selectedDesignation, selectedClinic])

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE))
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredStaff.slice(start, start + PAGE_SIZE)
  }, [filteredStaff, currentPage])

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedRole !== "all" ||
    selectedDesignation !== "all" ||
    selectedClinic !== "all"

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedRole("all")
    setSelectedDesignation("all")
    setSelectedClinic("all")
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    if (directoryRef.current) {
      directoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const copyEmailToClipboard = (email: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  // Bilingual text dictionary
  const t = {
    en: {
      eyebrow: "OUR PEOPLE",
      title: "Meet the people behind better healthcare.",
      subtitle:
        "Meet the healthcare professionals and team members helping clinics deliver reliable care across underserved communities in Bangladesh.",
      statTeam: "Team Members",
      statClinics: "Clinics Served",
      statCoverage: "National Coverage",
      searchPlaceholder: "Search by name, role, designation, clinic...",
      allRoles: "All Roles",
      healthWorker: "Health Worker",
      administrator: "Administrator",
      allDesignations: "All Designations",
      allClinics: "All Clinics",
      clearFilters: "Clear Filters",
      showing: "Showing",
      of: "of",
      staffMembers: "staff members",
      results: "results",
      unassigned: "Unassigned",
      noClinic: "No clinic assigned",
      noResultsTitle: "No staff members match your search",
      noResultsSub: "Try adjusting your search keywords, role selection, or clinic filter.",
      errorTitle: "Unable to load team directory",
      errorSub: "We couldn't load our team right now. Please check your connection and try again.",
      retry: "Retry Connection",
      assignedClinic: "Assigned Clinic",
      role: "Role",
      emailCopied: "Email copied!",
      backHome: "Back to Home",
    },
    bn: {
      eyebrow: "আমাদের টিম",
      title: "উন্নত স্বাস্থ্যসেবায় নিয়োজিত আমাদের কর্মীরা।",
      subtitle:
        "গ্রামীণ ও প্রত্যন্ত কমিউনিটিতে নিরবচ্ছিন্ন স্বাস্থ্যসেবা নিশ্চিত করতে নিরলসভাবে কাজ করে যাচ্ছেন আমাদের পেশাদার স্বাস্থ্যকর্মীরা।",
      statTeam: "মোট স্বাস্থ্যকর্মী",
      statClinics: "সেবাপ্রাপ্ত ক্লিনিক",
      statCoverage: "জাতীয় কভারেজ",
      searchPlaceholder: "নাম, পদবি, ভূমিকা বা ক্লিনিক দিয়ে খুঁজুন...",
      allRoles: "সকল ভূমিকা",
      healthWorker: "স্বাস্থ্যকর্মী",
      administrator: "অ্যাডমিনিস্ট্রেটর",
      allDesignations: "সকল পদবি",
      allClinics: "সকল ক্লিনিক",
      clearFilters: "ফিল্টার মুছুন",
      showing: "প্রদর্শিত",
      of: "/",
      staffMembers: "জন কর্মী",
      results: "টি ফলাফল",
      unassigned: "নির্ধারিত নয়",
      noClinic: "কোনো ক্লিনিক নির্ধারিত নেই",
      noResultsTitle: "কোনো স্বাস্থ্যকর্মী পাওয়া যায়নি",
      noResultsSub: "অনুসন্ধানের শব্দ বা ফিল্টারের মান পরিবর্তন করে আবার চেষ্টা করুন।",
      errorTitle: "টিম তালিকা লোড করা সম্ভব হয়নি",
      errorSub: "তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      retry: "পুনরায় চেষ্টা করুন",
      assignedClinic: "দায়িত্বরত ক্লিনিক",
      role: "ভূমিকা",
      emailCopied: "ইমেইল কপি করা হয়েছে!",
      backHome: "হোমে ফিরে যান",
    },
  }[lang === "bn" ? "bn" : "en"]

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] dark:bg-[#061513] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* ── Fixed Atmosphere ── */}
      <div className="an-atmosphere" aria-hidden="true" />

      {/* ── Public App Navbar ── */}
      <AppNavbar
        variant="landing"
        onGetStarted={() => onNavigate("signup")}
        onLogin={() => onNavigate("login")}
        onSignUp={() => onNavigate("signup")}
        onPatientLookup={() => onNavigate("patient-lookup")}
        onDashboard={() => {
          if (profile?.designation === "nurse") {
            onNavigate("nurse")
          } else if (profile?.designation === "clinical_officer") {
            onNavigate("clinical-officer")
          } else if (profile?.role === "admin") {
            onNavigate("admin-dashboard")
          } else {
            onNavigate("dashboard")
          }
        }}
        onLogout={async () => {
          await signOut()
          onNavigate("landing")
        }}
      />

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 border-b border-slate-200/70 dark:border-teal-950/60 overflow-hidden">
          {/* Subtle background glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[340px] pointer-events-none opacity-40 dark:opacity-20 blur-3xl -z-10"
            style={{
              background:
                "radial-gradient(circle, rgba(13,148,136,0.3) 0%, rgba(20,184,166,0.1) 45%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
            {/* Back button breadcrumb */}
            <div className="inline-flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => onNavigate("landing")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/60 px-3 py-1.5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-2xs"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10H5m0 0l4-4m-4 4l4 4"
                  />
                </svg>
                <span>{t.backHome}</span>
              </button>
            </div>

            {/* Eyebrow badge */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.18em] uppercase bg-teal-600/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                {t.eyebrow}
              </span>
            </div>

            {/* Main heading */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white font-bold tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
              {t.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
              {t.subtitle}
            </p>

            {/* Key stats row */}
            <div className="inline-flex flex-wrap justify-center items-center gap-3 sm:gap-6 pt-2">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-teal-900/40 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {totalCount > 0 ? totalCount : 140}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.statTeam}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-teal-900/40 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {availableClinics.length > 0 ? availableClinics.length : "42+"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.statClinics}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-teal-900/40 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  64
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.statCoverage}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Directory Section ── */}
        <section
          ref={directoryRef}
          className="py-12 lg:py-16 max-w-7xl mx-auto px-6 lg:px-10"
          aria-labelledby="directory-heading"
        >
          {/* Section title & Filters Container */}
          <div className="space-y-6 mb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2
                  id="directory-heading"
                  className="font-display text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold tracking-tight"
                >
                  {lang === "bn" ? "টিম ডিরেক্টরি" : "Our Healthcare Team"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {!isLoading && (
                    <>
                      {t.showing}{" "}
                      <span className="font-semibold text-teal-700 dark:text-teal-300">
                        {filteredStaff.length}
                      </span>{" "}
                      {t.of} {totalCount} {t.staffMembers}
                    </>
                  )}
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="self-start md:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" d="M4 4l8 8m0-8l-8 8" />
                  </svg>
                  <span>{t.clearFilters}</span>
                </button>
              )}
            </div>

            {/* Filter Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-teal-950/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="w-4 h-4"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                    aria-label={lang === "bn" ? "কর্মী সদস্য খুঁজুন" : "Search staff members"}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={lang === "bn" ? "অনুসন্ধান মুছুন" : "Clear search"}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="w-3.5 h-3.5"
                      >
                        <path strokeLinecap="round" d="M4 4l8 8m0-8l-8 8" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 2. Role Filter */}
                <div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as "all" | "worker" | "admin")}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    aria-label={lang === "bn" ? "ভূমিকা অনুযায়ী ফিল্টার" : "Filter by role"}
                  >
                    <option value="all">{t.allRoles}</option>
                    <option value="worker">{t.healthWorker}</option>
                    <option value="admin">{t.administrator}</option>
                  </select>
                </div>

                {/* 3. Designation Filter */}
                <div>
                  <select
                    value={selectedDesignation}
                    onChange={(e) => setSelectedDesignation(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    aria-label={lang === "bn" ? "পদবি অনুযায়ী ফিল্টার" : "Filter by designation"}
                  >
                    <option value="all">{t.allDesignations}</option>
                    {availableDesignations.map((desig) => (
                      <option key={desig} value={desig}>
                        {desig}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Clinic Filter */}
                <div>
                  <select
                    value={selectedClinic}
                    onChange={(e) => setSelectedClinic(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    aria-label={lang === "bn" ? "ক্লিনিক অনুযায়ী ফিল্টার" : "Filter by clinic"}
                  >
                    <option value="all">{t.allClinics}</option>
                    <option value="Unassigned">{t.unassigned}</option>
                    {availableClinics.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Content States ── */}

          {/* 1. Loading Skeleton Grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-2xs"
                >
                  <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="w-32 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                  <div className="w-20 h-5 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                  <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="w-3/4 h-3.5 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                    <div className="w-1/2 h-3 bg-slate-100 dark:bg-slate-800/60 rounded mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && fetchError && (
            <div
              role="alert"
              className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-6 h-6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.errorTitle}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {t.errorSub}
              </p>
              <button
                type="button"
                onClick={loadStaff}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors cursor-pointer shadow-sm"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{t.retry}</span>
              </button>
            </div>
          )}

          {/* 3. Empty Search/Filter Results */}
          {!isLoading && !fetchError && filteredStaff.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-200/60 dark:border-teal-800/60">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="w-7 h-7"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  <line x1="8" y1="11" x2="14" y2="11" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.noResultsTitle}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t.noResultsSub}
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
              >
                {t.clearFilters}
              </button>
            </div>
          )}

          {/* 4. Staff Cards Grid */}
          {!isLoading && !fetchError && filteredStaff.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedStaff.map((member) => {
                  const initials = getStaffInitials(member.name)
                  const avatarColor = getAvatarColor(member.name)
                  const isUnassigned = member.clinicName === "Unassigned"
                  const roleIsAdmin = member.role === "admin"

                  return (
                    <article
                      key={member.key}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-teal-950/70 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-teal-500/50 group"
                    >
                      {/* Top Header & Avatar */}
                      <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-4">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.name}
                              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-800 shadow-sm transition-transform duration-200 group-hover:scale-105"
                              onError={(e) => {
                                // Fallback to initials if image link breaks
                                (e.currentTarget as HTMLElement).style.display = "none"
                              }}
                            />
                          ) : null}

                          {/* Initials Avatar Fallback */}
                          <div
                            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold font-display shadow-2xs border ring-4 ring-slate-100 dark:ring-slate-800/80 transition-transform duration-200 group-hover:scale-105 ${avatarColor} ${
                              member.photoUrl ? "hidden" : "flex"
                            }`}
                            aria-label={`Initials for ${member.name}`}
                          >
                            {initials}
                          </div>

                          {/* Active healthcare indicator badge */}
                          <span
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-2xs"
                            title={lang === "bn" ? "সক্রিয় স্বাস্থ্যসেবা পেশাদার" : "Active Healthcare Professional"}
                          >
                            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          </span>
                        </div>

                        {/* Name */}
                        <h3
                          className="font-display font-semibold text-lg text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors line-clamp-1 w-full"
                          title={member.name}
                        >
                          {member.name}
                        </h3>

                        {/* Clinical Designation */}
                        <p
                          className="text-sm font-medium text-teal-700 dark:text-teal-400 mt-1 line-clamp-1 w-full"
                          title={member.designation}
                        >
                          {member.designation}
                        </p>

                        {/* System Role Badge */}
                        <div className="mt-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              roleIsAdmin
                                ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60"
                                : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                roleIsAdmin ? "bg-violet-500" : "bg-teal-500"
                              }`}
                            />
                            {roleIsAdmin ? t.administrator : t.healthWorker}
                          </span>
                        </div>
                      </div>

                      {/* Card Details Divider & Metadata */}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                        {/* Clinic Assignment */}
                        <div className="flex items-start gap-2 text-left">
                          <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.7}
                              className="w-4 h-4"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 17.5V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12.5M19 17.5H1m18 0h2M1 17.5h4m0 0v-4a2 2 0 012-2h4a2 2 0 012 2v4m-8 0h8M9 7h2m-2 4h2"
                              />
                            </svg>
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-medium truncate ${
                                  isUnassigned
                                    ? "italic text-slate-400 dark:text-slate-500"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                                title={isUnassigned ? t.noClinic : member.clinicName}
                              >
                                {isUnassigned ? t.unassigned : member.clinicName}
                              </span>

                              {member.clinicZone && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                                  {member.clinicZone}
                                </span>
                              )}
                            </div>
                            {member.clinicAddress && (
                              <p
                                className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5"
                                title={member.clinicAddress}
                              >
                                {member.clinicAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Email Address */}
                        <div className="flex items-center gap-2 text-left">
                          <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.7}
                              className="w-4 h-4"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </span>
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                            {member.email ? (
                              <>
                                <a
                                  href={`mailto:${member.email}`}
                                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors truncate focus-visible:outline-none focus-visible:underline"
                                  title={member.email}
                                >
                                  {member.email}
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => copyEmailToClipboard(member.email!, e)}
                                  className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-1 rounded transition-colors flex-shrink-0 cursor-pointer"
                                  title={lang === "bn" ? "ইমেইল কপি করুন" : "Copy email"}
                                  aria-label={`Copy email for ${member.name}`}
                                >
                                  {copiedEmail === member.email ? (
                                    <svg
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                                    >
                                      <path strokeLinecap="round" d="M3 8.5l3.5 3.5 6.5-7" />
                                    </svg>
                                  ) : (
                                    <svg
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.7}
                                      className="w-3.5 h-3.5"
                                    >
                                      <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" />
                                      <path strokeLinecap="round" d="M3.5 11.5H3a1 1 0 01-1-1v-7a1 1 0 011-1h7a1 1 0 011 1v.5" />
                                    </svg>
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs italic text-slate-400 dark:text-slate-500">
                                Protected contact
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* ── Pagination Controls ── */}
              {totalPages > 1 && (
                <nav
                  aria-label={lang === "bn" ? "কর্মী ডিরেক্টরি পেজিনেশন" : "Staff directory pagination"}
                  className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80 dark:border-slate-800"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.showing}{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {(currentPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(currentPage * PAGE_SIZE, filteredStaff.length)}
                    </span>{" "}
                    {t.of} {filteredStaff.length} {t.staffMembers}
                  </p>

                  <div className="inline-flex items-center gap-1.5">
                    {/* Previous button */}
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {lang === "bn" ? "পূর্ববর্তী" : "Previous"}
                    </button>

                    {/* Page numbers with smart windowing */}
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1
                      const isSelected = pageNum === currentPage

                      // Window logic: always show 1, last, and around current
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-teal-600 text-white shadow-2xs"
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                            aria-current={isSelected ? "page" : undefined}
                          >
                            {pageNum}
                          </button>
                        )
                      }

                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span
                            key={pageNum}
                            className="px-1 text-slate-400 dark:text-slate-500 text-xs"
                          >
                            …
                          </span>
                        )
                      }

                      return null
                    })}

                    {/* Next button */}
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {lang === "bn" ? "পরবর্তী" : "Next"}
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </main>

      {/* ── Reusable Unified Footer ── */}
      <AppFooter activePage="careers" onNavigate={onNavigate} />
    </div>
  )
}
