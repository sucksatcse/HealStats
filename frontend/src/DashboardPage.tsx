import { useState, useEffect } from "react"
import AppNavbar from "./AppNavbar"
import { useLang } from "./LanguageContext"
import { useTheme } from "./ThemeContext"
import { useAuth } from "./AuthContext"
import { fetchAdminStats, fetchPatients, type AdminStats } from "./lib/adminService"
import { urgencyFromScore, shortId, initials as toInitials, type PatientWithLatestVisit } from "./lib/types"
import PatientsPage from "./PatientRecordsPage"
import NewPatientPage from "./NewPatientPage"
import VitalsPage from "./VitalsPage"
import TriagePage from "./TriagePage"
import PatientDetailPage from "./PatientDetailPage"
import StaffProfilePage from "./StaffProfilePage"
import DigitizePage from "./DigitizePage"
import SyncPage from "./SyncPage"
import EmergencyReportPage from "./EmergencyReportPage"
import EmergencyTriagePage from "./EmergencyTriagePage"

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
      <path d="M2 4.5A2.5 2.5 0 014.5 2h2A2.5 2.5 0 019 4.5v2A2.5 2.5 0 016.5 9h-2A2.5 2.5 0 012 6.5v-2zM11 4.5A2.5 2.5 0 0113.5 2h2A2.5 2.5 0 0118 4.5v2A2.5 2.5 0 0115.5 9h-2A2.5 2.5 0 0111 6.5v-2zM2 13.5A2.5 2.5 0 014.5 11h2A2.5 2.5 0 019 13.5v2A2.5 2.5 0 016.5 18h-2A2.5 2.5 0 012 15.5v-2zM11 13.5A2.5 2.5 0 0113.5 11h2A2.5 2.5 0 0118 13.5v2A2.5 2.5 0 0115.5 18h-2A2.5 2.5 0 0111 15.5v-2z" />
    </svg>
  ),
  patients: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 19v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  ),
  newPatient: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11a4 4 0 11-8 0 4 4 0 018 0zM12 7v8M8 11h8M2 19v-2a4 4 0 014-4h1"
      />
    </svg>
  ),
  sync: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  search: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"
      />
    </svg>
  ),
  bell: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  ),
  chevronRight: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  ),
  logout: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-9A2.25 2.25 0 002.25 5.25v9.5A2.25 2.25 0 004.5 17h9a2.25 2.25 0 002.25-2.25V11M10 9l3 3m0 0l-3 3m3-3H3.75"
      />
    </svg>
  ),
  menu: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.012C4.045 12.563 2 10.622 2 8a5 5 0 019.032-2.932A5 5 0 0118 8c0 2.622-2.045 4.563-3.885 6.208a22.04 22.04 0 01-2.582 2.012 19.946 19.946 0 01-1.162.682l-.019.01-.005.003h-.001l-.386.217-.387-.217h-.001z" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="w-3.5 h-3.5"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 4.5v3.75l2.5 1.5" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M.01 11.646a14.422 14.422 0 0119.98 0A.75.75 0 0019.16 13a12.922 12.922 0 00-17.32 0 .75.75 0 11-.992-1.124.75.75 0 01.162-.23zM3.22 14.86a9.42 9.42 0 0113.56 0 .75.75 0 01-1.08 1.044 7.92 7.92 0 00-11.4 0A.75.75 0 013.22 14.86zM6.44 18.07a4.42 4.42 0 017.12 0 .75.75 0 01-1.2.9 2.92 2.92 0 00-4.72 0 .75.75 0 01-1.2-.9zM10 20a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  noWifi: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM2.196 8.015a12.94 12.94 0 018.04-2.895L7.2 8.152A11.43 11.43 0 002.8 10.61a.75.75 0 11-1.04-1.08c.138-.133.283-.262.436-.515zM5.416 11.235a9.015 9.015 0 014.048-1.953l-1.5-1.5a10.518 10.518 0 00-3.626 1.852.75.75 0 00.978 1.14 9.42 9.42 0 01.1-.539zM10 20a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
}

// ── Data ───────────────────────────────────────────────────────────────────────
// Recently-visited patients and quick stats are loaded live from Supabase in the
// component (see fetchPatients / fetchAdminStats). No mock data is kept here.

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  "follow-up": {
    label: "Follow-up",
    cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  },
  chronic: {
    label: "Chronic",
    cls: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
  },
  antenatal: {
    label: "Antenatal",
    cls: "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50",
  },
  acute: { label: "Acute", cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50" },
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
  { id: "patients", label: "Patients", icon: Icon.patients },
  { id: "new-patient", label: "New Patient", icon: Icon.newPatient },
  { id: "vitals", label: "Record Visit", icon: Icon.heart },
  { id: "triage", label: "AI Triage", icon: Icon.sync },
  { id: "patient-detail", label: "Patient Record", icon: Icon.patients },
  { id: "digitize", label: "Digitize Record", icon: Icon.newPatient },
  { id: "sync", label: "Sync Status", icon: Icon.sync },
  {
    id: "emergency",
    label: "Emergency Report",
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        className="w-4.5 h-4.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 7v3.5m0 3h.01M8.575 3.217L1.516 15a1.667 1.667 0 001.425 2.5h14.118A1.667 1.667 0 0018.484 15L11.425 3.217a1.667 1.667 0 00-2.85 0z"
        />
      </svg>
    ),
  },
  {
    id: "triage-queue",
    label: "Triage Queue",
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        className="w-4.5 h-4.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2 10h3l1.5-5 3 11 2.5-7 1.5 2h3.5"
        />
      </svg>
    ),
  },
]

// ── Localization ─────────────────────────────────────────────────────────────
type Lang = "en" | "bn"

// Nav item labels in Bangla, keyed by id
const NAV_BN: Record<string, string> = {
  dashboard: "ড্যাশবোর্ড",
  patients: "রোগী",
  "new-patient": "নতুন রোগী",
  vitals: "ভিজিট রেকর্ড",
  triage: "এআই ট্রায়াজ",
  "patient-detail": "রোগীর রেকর্ড",
  digitize: "রেকর্ড ডিজিটাইজ",
  sync: "সিঙ্ক অবস্থা",
  emergency: "জরুরি রিপোর্ট",
  "triage-queue": "ট্রায়াজ সারি",
}

const STATUS_LABELS_BN: Record<string, string> = {
  "follow-up": "ফলো-আপ",
  chronic: "দীর্ঘমেয়াদি",
  antenatal: "প্রসবপূর্ব",
  acute: "তীব্র",
}

// Clinical diagnoses in Bangla, keyed by patient id
const DIAGNOSIS_BN: Record<string, string> = {
  "PT-00412": "ম্যালেরিয়া (জটিলতাহীন)",
  "PT-00389": "টাইপ ২ ডায়াবেটিস",
  "PT-00401": "প্রসবপূর্ব সেবা (২৮ সপ্তাহ)",
  "PT-00376": "তীব্র শ্বাসতন্ত্রের সংক্রমণ",
  "PT-00365": "উচ্চ রক্তচাপ",
  "PT-00358": "ক্ষত ড্রেসিং / কাটা",
}

// Convert ASCII digits to Bangla numerals so numbers read natively
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]
const toBn = (s: string | number) =>
  String(s).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])

const COPY = {
  en: {
    navigation: "Navigation",
    portal: "Worker Portal",
    searchPlaceholder: "Search patients, IDs, diagnoses…",
    online: "Online",
    offline: "Offline",
    clinic: "Community Health Clinic",
    workerId: "Worker ID",
    name: "Health Worker",
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    lastSyncInit: "—",
    justNow: "Just now",
    connected: "Connected — sync available",
    connectedSub: (last: string, count: string) =>
      `${count} record(s) queued locally · Last synced: ${last}`,
    offlineTitle: "Offline mode active",
    offlineSub: (count: string) =>
      `${count} record(s) queued · Will sync automatically when connection is restored`,
    syncNow: "Sync Now",
    syncing: "Syncing…",
    quickActions: "Quick Actions",
    newPatient: "New Patient",
    searchPatient: "Search Patient",
    recentTitle: "Recently Visited Patients",
    viewAll: "View all patients",
    showing: (n: number, q: string) =>
      `Showing ${n} result${n !== 1 ? "s" : ""} for "${q}"`,
    noMatch: (q: string) => `No patients match "${q}"`,
    tryHint: "Try a name, ID, or diagnosis",
    diagnosis: "Diagnosis",
    female: "Female",
    male: "Male",
    yrs: "yrs",
    visit: (n: number) => `${n} visit${n !== 1 ? "s" : ""}`,
    openRecord: "Open patient record",
  },
  bn: {
    navigation: "ন্যাভিগেশন",
    portal: "কর্মী পোর্টাল",
    searchPlaceholder: "রোগী, আইডি, রোগ নির্ণয় খুঁজুন…",
    online: "অনলাইন",
    offline: "অফলাইন",
    clinic: "কমিউনিটি স্বাস্থ্য ক্লিনিক",
    workerId: "কর্মী আইডি",
    name: "স্বাস্থ্যকর্মী",
    greetingMorning: "শুভ সকাল",
    greetingAfternoon: "শুভ অপরাহ্ন",
    greetingEvening: "শুভ সন্ধ্যা",
    lastSyncInit: "—",
    justNow: "এইমাত্র",
    connected: "সংযুক্ত — সিঙ্ক উপলব্ধ",
    connectedSub: (last: string, count: string) =>
      `স্থানীয়ভাবে ${count}টি রেকর্ড সারিবদ্ধ · সর্বশেষ সিঙ্ক: ${last}`,
    offlineTitle: "অফলাইন মোড সক্রিয়",
    offlineSub: (count: string) =>
      `${count}টি রেকর্ড সারিবদ্ধ · সংযোগ ফিরে এলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে`,
    syncNow: "এখন সিঙ্ক",
    syncing: "সিঙ্ক হচ্ছে…",
    quickActions: "দ্রুত কাজ",
    newPatient: "নতুন রোগী",
    searchPatient: "রোগী খুঁজুন",
    recentTitle: "সম্প্রতি দেখা রোগী",
    viewAll: "সব রোগী দেখুন",
    showing: (n: number, q: string) => `"${q}" এর জন্য ${toBn(n)}টি ফলাফল`,
    noMatch: (q: string) => `"${q}" এর সাথে কোনো রোগী মেলেনি`,
    tryHint: "নাম, আইডি বা রোগ নির্ণয় চেষ্টা করুন",
    diagnosis: "রোগ নির্ণয়",
    female: "মহিলা",
    male: "পুরুষ",
    yrs: "বছর",
    visit: (n: number) => `${toBn(n)} ভিজিট`,
    openRecord: "রোগীর রেকর্ড খুলুন",
  },
}

// Translate the relative-time tokens inside stored visit timestamps
const localizeVisit = (s: string, lang: Lang) => {
  if (lang === "en") return s
  const months: Record<string, string> = {
    Jan: "জানু",
    Feb: "ফেব",
    Mar: "মার্চ",
    Apr: "এপ্রিল",
    May: "মে",
    Jun: "জুন",
    Jul: "জুলাই",
    Aug: "আগস্ট",
    Sep: "সেপ্ট",
    Oct: "অক্টো",
    Nov: "নভে",
    Dec: "ডিসে",
  }
  let out = s.replace("Today", "আজ").replace("Yesterday", "গতকাল")
  for (const [en, bn] of Object.entries(months)) out = out.replace(en, bn)
  return toBn(out)
}

// ── Component ──────────────────────────────────────────────────────────────────
interface DashboardPageProps {
  onLogout: () => void
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [activeNav, setActiveNav] = useState("dashboard")
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  )

  /* Global lang + dark from context — no local state needed */
  const { lang } = useLang()
  const { dark } = useTheme()
  const { profile } = useAuth()

  const t = COPY[lang]

  // Live worker-clinic data (replaces the previous static placeholders).
  const [liveStats, setLiveStats] = useState<AdminStats | null>(null)
  const [recent, setRecent] = useState<PatientWithLatestVisit[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    let active = true
    const clinicId = profile?.clinic_id ?? null
    setRecentLoading(true)
    Promise.all([
      fetchAdminStats(clinicId),
      fetchPatients({ clinicId, query: "", urgencyFilter: "All", page: 1, pageSize: 6 }),
    ])
      .then(([stats, patients]) => {
        if (!active) return
        setLiveStats(stats)
        setRecent(patients.data)
      })
      .catch(() => {
        if (active) setRecent([])
      })
      .finally(() => {
        if (active) setRecentLoading(false)
      })
    return () => {
      active = false
    }
  }, [profile?.clinic_id])

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  const handleSync = () => {
    if (!isOnline || syncing) return
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setSynced(true)
    }, 2200)
  }

  const lastSync = synced ? t.justNow : t.lastSyncInit
  const pendingCount = liveStats?.pendingSync ?? 0
  const pendingStr = lang === "bn" ? toBn(pendingCount) : String(pendingCount)
  const workerName = profile?.name ?? t.name
  // Real (shortened) staff identifier — no fabricated worker ID.
  const workerIdShort = profile?.id ? profile.id.slice(0, 8).toUpperCase() : "—"
  const workerInitials = toInitials(workerName)
  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? t.greetingMorning
      : hour < 17
        ? t.greetingAfternoon
        : t.greetingEvening
  const today = new Date().toLocaleDateString(
    lang === "bn" ? "bn-BD" : "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  )

  // Urgency badge styling (derived from real latest-visit urgency_score).
  const URGENCY_CARD: Record<string, string> = {
    Critical: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
    High: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
    Moderate: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    Low: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50",
    Stable: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  }
  const URGENCY_BN: Record<string, string> = {
    Critical: "জরুরি", High: "উচ্চ", Moderate: "মাঝারি", Low: "কম", Stable: "স্থিতিশীল",
  }
  const AVATAR_TINTS = [
    "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400",
    "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400",
    "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400",
    "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
    "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300",
    "bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400",
  ]
  const formatVisit = (iso: string | null): string => {
    if (!iso) return lang === "bn" ? "কোনো ভিজিট নেই" : "No visits yet"
    return new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    })
  }

  // Shape live patients into the card view-model used below.
  const recentCards = recent.map((p, i) => {
    const score = p.latest_visit?.urgency_score ?? null
    return {
      id: p.id,
      displayId: shortId(p.id),
      name: p.name,
      age: p.age,
      gender: p.sex,
      village: p.village,
      diagnosis: p.latest_visit?.diagnosis || p.latest_visit?.symptoms || null,
      lastVisitAt: p.latest_visit?.created_at ?? null,
      urgencyLevel: urgencyFromScore(score),
      initials: toInitials(p.name),
      color: AVATAR_TINTS[i % AVATAR_TINTS.length],
    }
  })

  const filteredPatients = recentCards.filter(
    (p) =>
      searchValue === "" ||
      p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      p.displayId.toLowerCase().includes(searchValue.toLowerCase()) ||
      (p.diagnosis ?? "").toLowerCase().includes(searchValue.toLowerCase()) ||
      (p.village ?? "").toLowerCase().includes(searchValue.toLowerCase()),
  )

  return (
    <div
      className={`${
        lang === "bn" ? "lang-bn" : ""
      } flex h-screen overflow-hidden font-[Work_Sans,system-ui,sans-serif] transition-colors`}
      style={{background: 'var(--an-bg)'}}
    >
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Left Sidebar ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-teal-950 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-teal-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2.2}
              className="w-4.5 h-4.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          <div>
            <p className="font-display text-base text-white leading-none">
              HealthStats
            </p>
            <p className="text-[10px] text-teal-400 mt-0.5">{t.portal}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500 px-3 mb-3">
            {t.navigation}
          </p>
          {NAV_ITEMS.map(({ id, label, icon }) => {
            const active = activeNav === id
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveNav(id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  active
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-teal-300 hover:bg-teal-800/60 hover:text-white"
                }`}
              >
                <span className={active ? "text-white" : "text-teal-400"}>
                  {icon}
                </span>
                {lang === "bn" ? (NAV_BN[id] ?? label) : label}
                {id === "sync" && pendingCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">
                    {pendingStr}
                  </span>
                )}
                {id === "emergency" && (
                  <span
                    className={`ml-auto text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                      active
                        ? "bg-white/25 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    SOS
                  </span>
                )}
                {id === "triage-queue" && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    SOS
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-teal-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teal-800/60 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {workerInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {workerName}
              </p>
              <p className="text-[10px] text-teal-400">{t.clinic}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-teal-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Log out"
            >
              {Icon.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Navbar ── */}
        <AppNavbar
          variant="app"
          onSidebarOpen={() => setSidebarOpen(true)}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder={t.searchPlaceholder}
          isOnline={isOnline}
          onlineText={t.online}
          offlineText={t.offline}
          onNotifications={() => {}}
          notificationCount={1}
          userInitials={workerInitials}
          userColor="teal"
          onProfile={() => setActiveNav("profile")}
        />

        {/* ── Scrollable content ── */}
        <main
          className={`flex-1 overflow-y-auto px-4 lg:px-8 py-6 ${
            activeNav === "patients" ? "flex flex-col min-h-0" : "space-y-6"
          }`}
        >
          {activeNav === "patients" && (
            <PatientsPage
              onNewPatient={() => setActiveNav("new-patient")}
              onViewPatient={(id) => {
                setSelectedPatientId(id)
                setActiveNav("patient-detail")
              }}
            />
          )}
          {activeNav === "new-patient" && (
            <NewPatientPage
              onSuccess={(id) => {
                setSelectedPatientId(id)
                setActiveNav("patient-detail")
              }}
            />
          )}
          {activeNav === "vitals" && (
            <VitalsPage
              patientId={selectedPatientId}
              onSaved={(id) => {
                setSelectedPatientId(id)
                setActiveNav("patient-detail")
              }}
              onBack={() =>
                setActiveNav(selectedPatientId ? "patient-detail" : "patients")
              }
            />
          )}
          {activeNav === "triage" && <TriagePage />}
          {activeNav === "patient-detail" && (
            <PatientDetailPage
              patientId={selectedPatientId}
              onNewVisit={(id) => {
                setSelectedPatientId(id)
                setActiveNav("vitals")
              }}
            />
          )}
          {activeNav === "digitize" && <DigitizePage />}
          {activeNav === "sync" && <SyncPage />}
          {activeNav === "emergency" && <EmergencyReportPage />}
          {activeNav === "profile" && <StaffProfilePage />}
          {activeNav === "triage-queue" && (
            <EmergencyTriagePage
              onViewPatient={(id) => {
                setSelectedPatientId(id)
                setActiveNav("patient-detail")
              }}
              onNewVisit={(id) => {
                setSelectedPatientId(id)
                setActiveNav("vitals")
              }}
              onBack={() => setActiveNav("dashboard")}
            />
          )}
          {![
            "patients",
            "new-patient",
            "vitals",
            "triage",
            "patient-detail",
            "digitize",
            "sync",
            "emergency",
            "triage-queue",
            "profile",
          ].includes(activeNav) && (
            <>
              {/* Greeting */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-display text-2xl lg:text-3xl text-teal-950 dark:text-white">
                    {greeting}, {workerName} 👋
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{today}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">
                    {t.clinic}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t.workerId}: {workerIdShort}</p>
                </div>
              </div>

              {/* Sync status banner */}
              <div
                className={`rounded-2xl border px-5 py-4 flex flex-wrap items-center gap-4 ${
                  isOnline
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isOnline
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isOnline ? Icon.wifi : Icon.noWifi}
                </div>
                <div className="flex-1 min-w-0">
                  {isOnline ? (
                    <>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        {t.connected}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {t.connectedSub(lastSync, pendingStr)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        {t.offlineTitle}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        {t.offlineSub(pendingStr)}
                      </p>
                    </>
                  )}
                </div>
                {isOnline && (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex-shrink-0"
                  >
                    <span className={syncing ? "animate-spin" : ""}>
                      {Icon.sync}
                    </span>
                    {syncing ? t.syncing : t.syncNow}
                  </button>
                )}
              </div>

              {/* Quick actions */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  {t.quickActions}
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    {
                      label: t.newPatient,
                      icon: Icon.newPatient,
                      color:
                        "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25",
                      action: () => setActiveNav("new-patient"),
                    },
                    {
                      label: t.searchPatient,
                      icon: Icon.search,
                      color:
                        "bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
                      action: () => {
                        const el = document.querySelector(
                          "input",
                        ) as HTMLInputElement
                        el?.focus()
                      },
                    },
                    {
                      label: t.syncNow,
                      icon: Icon.sync,
                      color: isOnline
                        ? "bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                        : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed",
                      action: handleSync,
                    },
                  ].map(({ label, icon, color, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${color}`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats row — live from the worker's clinic */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {[
                  { label: "Patients Today", labelBn: "আজকের রোগী", value: liveStats?.recordsToday ?? null, sub: "visits since midnight UTC", subBn: "মধ্যরাত থেকে ভিজিট", accent: "text-teal-700 dark:text-teal-300", err: !!liveStats?.errors.recordsToday },
                  { label: "Total Patients", labelBn: "মোট রোগী", value: liveStats?.totalPatients ?? null, sub: "registered in your clinic", subBn: "আপনার ক্লিনিকে নিবন্ধিত", accent: "text-slate-700 dark:text-slate-200", err: !!liveStats?.errors.totalPatients },
                  { label: "Pending Sync", labelBn: "সিঙ্ক বাকি", value: liveStats?.pendingSync ?? null, sub: "queued locally", subBn: "স্থানীয়ভাবে সারিবদ্ধ", accent: "text-amber-700 dark:text-amber-400", err: !!liveStats?.errors.pendingSync },
                  { label: "High-Risk", labelBn: "উচ্চ-ঝুঁকি", value: liveStats?.highRiskFlagged ?? null, sub: "flagged (urgency 4–5)", subBn: "চিহ্নিত (জরুরি ৪–৫)", accent: "text-violet-700 dark:text-violet-400", err: !!liveStats?.errors.highRiskFlagged },
                ].map(({ label, labelBn, value, sub, subBn, accent, err }) => {
                  const shown = err
                    ? "—"
                    : value === null
                      ? (recentLoading ? "…" : (lang === "bn" ? toBn(0) : "0"))
                      : (lang === "bn" ? toBn(value) : value.toLocaleString())
                  return (
                    <div
                      key={label}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
                    >
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-2">
                        {lang === "bn" ? labelBn : label}
                      </p>
                      <p className={`font-display text-3xl ${accent} mb-1`}>{shown}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {lang === "bn" ? subBn : sub}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Recent patients */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                      {t.recentTitle}
                    </h2>
                    {searchValue && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {t.showing(filteredPatients.length, searchValue)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveNav("patients")}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
                  >
                    {t.viewAll}
                    {Icon.chevronRight}
                  </button>
                </div>

                {filteredPatients.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 py-16 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
                      {Icon.search}
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t.noMatch(searchValue)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t.tryHint}</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:border-teal-200 dark:hover:border-teal-800 hover:shadow-md transition-all group cursor-pointer"
                      >
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${p.color}`}
                          >
                            {p.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {p.age !== null ? `${lang === "bn" ? toBn(p.age) : p.age} ${t.yrs} · ` : ""}
                              {p.gender === "F" ? t.female : p.gender === "M" ? t.male : "—"} · {p.displayId}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${URGENCY_CARD[p.urgencyLevel]}`}
                          >
                            {lang === "bn" ? URGENCY_BN[p.urgencyLevel] : p.urgencyLevel}
                          </span>
                        </div>

                        {/* Diagnosis */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5 mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
                            {t.diagnosis}
                          </p>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">
                            {p.diagnosis ?? (lang === "bn" ? "কোনো রোগ নির্ণয় নেই" : "No diagnosis recorded")}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                            {Icon.clock}
                            {formatVisit(p.lastVisitAt)}
                          </span>
                          {p.village && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[45%]">
                              <span className="text-teal-400">{Icon.heart}</span>
                              {p.village}
                            </span>
                          )}
                        </div>

                        {/* Hover action */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedPatientId(p.id)
                              setActiveNav("patient-detail")
                            }}
                            className="w-full text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center justify-center gap-1 transition-colors"
                          >
                            {t.openRecord}
                            {Icon.chevronRight}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom padding */}
              <div className="h-4" />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
