import { useState } from "react"
import AppNavbar from "./AppNavbar"
import AppFooter from "./AppFooter"
import { useLang } from "./LanguageContext"
import { useAuth } from "./AuthContext"

interface PrivacyPolicyPageProps {
  onBack?: () => void
  onNavigate: (page: string) => void
}

export default function PrivacyPolicyPage({ onBack, onNavigate }: PrivacyPolicyPageProps) {
  const { lang } = useLang()
  const { profile, signOut } = useAuth()
  const [activeSection, setActiveSection] = useState("overview")

  const t = {
    en: {
      badge: "Health Data Governance & Privacy",
      title: "Privacy Policy & Data Protection",
      subtitle:
        "How HealStats safeguards electronic health records, community clinic data, and patient confidentiality across rural Bangladesh.",
      lastUpdated: "Effective: September 2026 · Version 1.2",
      backHome: "Back to Home",
      tocTitle: "Table of Contents",
      toc: [
        { id: "overview", label: "1. Overview & Open-Source Mission" },
        { id: "data-collected", label: "2. Health Information We Process" },
        { id: "offline-storage", label: "3. Offline-First Storage & Sync" },
        { id: "ocr-privacy", label: "4. On-Device OCR Digitization" },
        { id: "access-control", label: "5. Role-Based Access & Clinic Scoping" },
        { id: "ai-triage", label: "6. Grounded AI & Triage Scoring" },
        { id: "emergency-data", label: "7. Disaster & Outbreak Intelligence" },
        { id: "data-rights", label: "8. Patient Rights & Data Retention" },
        { id: "contact", label: "9. Security & Governance Contact" },
      ],
      highlights: [
        {
          title: "Zero Commercialization",
          desc: "Patient health data is never sold, brokered, monetized, or shared with commercial advertisers.",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          ),
        },
        {
          title: "100% On-Device OCR",
          desc: "Paper record scans are processed entirely in browser WebAssembly (Tesseract.js)—never sent to external cloud AI.",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          ),
        },
        {
          title: "Strict Clinic Scoping",
          desc: "Community health workers access only patient records registered within their authorized physical clinic.",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 17.5V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12.5M19 17.5H1m18 0h2M1 17.5h4m0 0v-4a2 2 0 012-2h4a2 2 0 012 2v4m-8 0h8M9 7h2m-2 4h2" />
            </svg>
          ),
        },
        {
          title: "Sandboxed Local Storage",
          desc: "Offline records in IndexedDB are sandboxed to the device origin and synced over TLS-encrypted pipelines upon reconnection.",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ),
        },
      ],
    },
    bn: {
      badge: "স্বাস্থ্য তথ্যের গোপনীয়তা ও সুরক্ষা",
      title: "গোপনীয়তা নীতি ও স্বাস্থ্য তথ্য সুরক্ষা",
      subtitle:
        "গ্রামীণ ও দুর্যোগকবলিত এলাকায় রোগীদের ইলেকট্রনিক স্বাস্থ্য রেকর্ড এবং চিকিৎসা তথ্যের সর্বোচ্চ গোপনীয়তা ও সুরক্ষা নিশ্চিতকরণ।",
      lastUpdated: "কার্যকর: সেপ্টেম্বর ২০২৬ · সংস্করণ ১.২",
      backHome: "হোমে ফিরে যান",
      tocTitle: "সূচিপত্র",
      toc: [
        { id: "overview", label: "১. প্ল্যাটফর্ম পরিচিতি ও উদ্দেশ্য" },
        { id: "data-collected", label: "২. সংগৃহীত স্বাস্থ্য তথ্যসমূহ" },
        { id: "offline-storage", label: "৩. অফলাইন স্টোরেজ ও সিঙ্ক ব্যবস্থা" },
        { id: "ocr-privacy", label: "৪. অন-ডিভাইস ওসিআর প্রযুক্তি" },
        { id: "access-control", label: "৫. পদমর্যাদা ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ" },
        { id: "ai-triage", label: "৬. চিকিৎসায় এআই ও ট্রায়াজ স্কোর" },
        { id: "emergency-data", label: "৭. দুর্যোগ ব্যবস্থাপনা ও মহামারি নজরদারি" },
        { id: "data-rights", label: "৮. রোগীর অধিকার ও তথ্য সংরক্ষণ" },
        { id: "contact", label: "৯. নিরাপত্তা ও তথ্য সুরক্ষা যোগাযোগ" },
      ],
      highlights: [
        {
          title: "বাণিজ্যিকীকরণ সম্পূর্ণ নিষিদ্ধ",
          desc: "রোগীর স্বাস্থ্য তথ্য কোনো অবস্থাতেই বিজ্ঞাপনদাতা বা বাণিজ্যিক প্রতিষ্ঠানের কাছে বিক্রি বা লেনদেন করা হয় না।",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          ),
        },
        {
          title: "ডিভাইস-কেন্দ্রিক ওসিআর",
          desc: "কাগজের রেকর্ডের ছবি সরাসরি ব্রাউজারে প্রক্রিয়াজাত হয় (Tesseract.js)—বাইরের ক্লাউডে কখনো আপলোড হয় না।",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          ),
        },
        {
          title: "ক্লিনিক-নির্দিষ্ট সীমাবদ্ধতা",
          desc: "স্বাস্থ্যকর্মীরা শুধুমাত্র তাদের নির্ধারিত অনুমোদিত ক্লিনিকের আওতাভুক্ত রোগীর তথ্য দেখতে ও সম্পাদনা করতে পারেন।",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 17.5V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12.5M19 17.5H1m18 0h2M1 17.5h4m0 0v-4a2 2 0 012-2h4a2 2 0 012 2v4m-8 0h8M9 7h2m-2 4h2" />
            </svg>
          ),
        },
        {
          title: "সুরক্ষিত স্থানীয় তথ্যভাণ্ডার",
          desc: "নেটওয়ার্কবিহীন সময়ে IndexedDB-তে সংরক্ষিত তথ্য ডিভাইসে সুরক্ষিত থাকে এবং সংযোগ পাওয়া মাত্র এনক্রিপ্ট হয়ে সিঙ্ক হয়।",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ),
        },
      ],
    },
  }[lang === "bn" ? "bn" : "en"]

  const scrollTo = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] dark:bg-[#061513] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* ── Fixed Atmosphere ── */}
      <div className="an-atmosphere" aria-hidden="true" />

      {/* ── Navbar ── */}
      <AppNavbar
        variant="landing"
        onGetStarted={() => onNavigate("signup")}
        onLogin={() => onNavigate("login")}
        onSignUp={() => onNavigate("signup")}
        onPatientLookup={() => onNavigate("patient-lookup")}
        onDashboard={() => {
          if (profile?.designation === "nurse") onNavigate("nurse")
          else if (profile?.designation === "clinical_officer") onNavigate("clinical-officer")
          else if (profile?.role === "admin") onNavigate("admin-dashboard")
          else onNavigate("dashboard")
        }}
        onLogout={async () => {
          await signOut()
          onNavigate("landing")
        }}
      />

      <main className="flex-1">
        {/* ── Hero Banner ── */}
        <section className="relative pt-24 pb-14 lg:pt-32 lg:pb-16 border-b border-slate-200/80 dark:border-teal-950/60 overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] pointer-events-none opacity-30 dark:opacity-15 blur-3xl -z-10"
            style={{
              background:
                "radial-gradient(circle, rgba(13,148,136,0.35) 0%, rgba(20,184,166,0.12) 50%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
            {/* Breadcrumb button */}
            <div className="inline-flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => onNavigate("landing")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/60 px-3 py-1.5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-2xs"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10H5m0 0l4-4m-4 4l4 4" />
                </svg>
                <span>{t.backHome}</span>
              </button>
            </div>

            {/* Eyebrow */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.16em] uppercase bg-teal-600/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                {t.badge}
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white font-bold tracking-tight max-w-3xl mx-auto leading-tight mb-4">
              {t.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
              {t.subtitle}
            </p>

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.lastUpdated}
            </p>
          </div>
        </section>

        {/* ── Highlights Grid ── */}
        <section className="max-w-6xl mx-auto px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.highlights.map((item) => (
              <div
                key={item.title}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-teal-950/70 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 border border-teal-200/50 dark:border-teal-800/50">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Policy Body with TOC Sidebar ── */}
        <section className="max-w-6xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sidebar Sticky Table of Contents */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-28 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-teal-950/70 rounded-2xl p-5 shadow-sm space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  {t.tocTitle}
                </p>
                <nav className="space-y-1" aria-label={lang === "bn" ? "গোপনীয়তা বিভাগসমূহ" : "Privacy sections"}>
                  {t.toc.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-colors cursor-pointer block truncate ${
                        activeSection === item.id
                          ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold border-l-2 border-teal-600"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Policy Content */}
            <div className="lg:col-span-8 space-y-12 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
              {/* Section 1 */}
              <article id="overview" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  1. Overview & Open-Source Mission
                </h2>
                <p>
                  <strong>HealStats</strong> is an open-source electronic health record (EHR) and crisis disaster-response system engineered specifically for rural community clinics in Bangladesh facing extreme infrastructure constraints—including intermittent internet connectivity, severe monsoon floods, and extended electrical blackouts.
                </p>
                <p>
                  Licensed under the <strong>Mozilla Public License 2.0 (MPL 2.0)</strong>, HealStats is committed to digital sovereignty, data integrity, and strict healthcare confidentiality. Our core mandate is to ensure health workers can register patients and record vital signs when the network is completely down, while guaranteeing that clinical information is handled in accordance with the World Health Organization (WHO) Digital Health Guidelines and the Bangladesh Ministry of Health & Family Welfare (MOHFW) standards.
                </p>
              </article>

              {/* Section 2 */}
              <article id="data-collected" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  2. Health Information We Process
                </h2>
                <p>
                  To fulfill primary clinical and epidemic surveillance functions, HealStats processes only strictly necessary medical and administrative records:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Patient Demographic Information:</strong> Full name, age, biological sex, village/community name, emergency contact details, and assigned community clinic ID.
                  </li>
                  <li>
                    <strong>Encounter & Clinical Data:</strong> Chief medical complaint, recorded symptoms, clinical symptom category (e.g., gastrointestinal/diarrhea, fever, respiratory illness, skin infection), clinical assessment/diagnosis, and urgency score (1 to 5 scale).
                  </li>
                  <li>
                    <strong>Vital Signs:</strong> Blood pressure (systolic/diastolic), body temperature, heart rate/pulse, respiratory rate, oxygen saturation (SpO₂), body weight, and Mid-Upper Arm Circumference (MUAC).
                  </li>
                  <li>
                    <strong>Healthcare Worker & Facility Accounts:</strong> Authorized worker name, verified clinic email, assigned clinic facility, clinical designation (*Community Health Worker*, *Staff Nurse*, *Clinical Officer*, *Clinic Administrator*), and cryptographic authentication records.
                  </li>
                </ul>
                <p className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 p-4 rounded-xl text-teal-900 dark:text-teal-200 text-xs">
                  <strong>Notice:</strong> HealStats does not request or store commercial billing instruments, financial payment cards, or advertising tracking cookies.
                </p>
              </article>

              {/* Section 3 */}
              <article id="offline-storage" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  3. Offline-First Storage & Synchronization Protocol
                </h2>
                <p>
                  Because connectivity across rural coastal islands (*Char Fasson*, *Hatiya*, *Monpura*, *Sandwip*) is frequently severed by tropical cyclones, HealStats utilizes an **offline-first local database architecture**:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Local Sandbox (Dexie / IndexedDB):</strong> When offline, patient registrations and medical encounter notes are stored directly within the local browser sandbox (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">offlineDb.pendingRecords</code>). This data is sandboxed under standard browser origin isolation policies and cannot be accessed by external domains.
                  </li>
                  <li>
                    <strong>Automatic Encrypted Background Sync:</strong> The client sync manager (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">syncService.ts</code>) monitors device network interfaces (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">navigator.onLine</code>). As soon as an active internet connection is restored, pending records are transmitted over an encrypted TLS 1.3 pipeline directly to the central PostgreSQL database.
                  </li>
                  <li>
                    <strong>Synchronization Logs:</strong> Device synchronization events and timestamps are logged to prevent data duplication and maintain clinical audit trails.
                  </li>
                </ul>
              </article>

              {/* Section 4 */}
              <article id="ocr-privacy" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  4. On-Device OCR Digitization Privacy
                </h2>
                <p>
                  HealStats includes paper record digitization capabilities via our Digitize module. To maintain uncompromising patient confidentiality:
                </p>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-teal-950/70 p-5 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Zero External Cloud OCR Transmission
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Optical Character Recognition is executed 100% on-device using client-side WebAssembly (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">Tesseract.js</code>). Photos of handwritten health logs or paper prescriptions remain on the worker&apos;s physical tablet/laptop and are <strong>never</strong> transmitted to third-party vision models or cloud providers.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Furthermore, OCR output is treated purely as assistive drafting: the system strictly requires human healthcare worker inspection, review, and verification before any digitized field is committed to a patient record.
                  </p>
                </div>
              </article>

              {/* Section 5 */}
              <article id="access-control" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  5. Role-Based Access Control & Clinic Scoping
                </h2>
                <p>
                  Healthcare data within HealStats is subject to strict structural boundaries:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Clinic Scoping:</strong> Community health workers and clinical staff are linked to a single verified community clinic facility (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">clinic_id</code>). All patient lookups, visit registrations, and demographic records are strictly filtered at both the application layer and database level to prevent unauthorized cross-clinic visibility.
                  </li>
                  <li>
                    <strong>Role Boundaries:</strong>
                    <ul className="list-circle pl-5 mt-1 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <li><strong>Community Health Worker:</strong> Permitted to register patients, record vitals, and queue emergency incident reports.</li>
                      <li><strong>Staff Nurse:</strong> Permitted to intake patient vitals, maintain queues, and record triage observations.</li>
                      <li><strong>Clinical Officer / Doctor:</strong> Authorized to formulate clinical diagnoses and prescribe therapeutic courses.</li>
                      <li><strong>District Administrator:</strong> Authorized for operational logistics, staff directory management, and epidemic alerts without altering clinical records.</li>
                    </ul>
                  </li>
                </ul>
              </article>

              {/* Section 6 */}
              <article id="ai-triage" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  6. Grounded AI & Triage Scoring
                </h2>
                <p>
                  HealStats incorporates an on-device AI Urgency Check and an intelligent conversational assistant:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>No Generative Hallucination on Patient Records:</strong> The built-in assistant is a deterministic, grounded intent engine that queries verified, clinic-scoped metrics. It does not synthesize or invent medical diagnoses.
                  </li>
                  <li>
                    <strong>No Model Training on Private PHI:</strong> Patient clinical histories are never fed into training corpuses of public commercial Large Language Models.
                  </li>
                  <li>
                    <strong>Human Clinical Oversight:</strong> Urgency calculations (1 Stable through 5 Critical) are algorithmic recommendations designed to triage overflowing disaster shelters. The certified health worker possesses unrestricted override authority.
                  </li>
                </ul>
              </article>

              {/* Section 7 */}
              <article id="emergency-data" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  7. Disaster Coordination & Outbreak Intelligence
                </h2>
                <p>
                  During active cyclones, tidal surges, or waterborne disease outbreaks, district coordinators need macro-level situational awareness:
                </p>
                <p>
                  HealStats aggregates clinical intake signals into **anonymized epidemic clusters** (e.g., elevated acute watery diarrhea presentations within an upazila). These aggregate counts are shared across authorized crisis monitors (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">OutbreakDetectionPage.tsx</code>) and emergency incident pipelines to dispatch medical supplies and water-purification kits without exposing patient names or identifiable identities.
                </p>
              </article>

              {/* Section 8 */}
              <article id="data-rights" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  8. Patient Rights & Data Retention
                </h2>
                <p>
                  Every patient receiving care through the HealStats network has enforceable confidentiality rights:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Right to Inspect:</strong> Patients may review their recorded health vitals and clinical encounter history at any participating clinic facility.</li>
                  <li><strong>Right to Correction:</strong> Patients may request corrections to demographic records, village names, or emergency contacts through their attending health worker.</li>
                  <li><strong>Data Retention:</strong> Encrypted medical records are retained in compliance with national public health statutory requirements to guarantee continuity of care during climate migrations.</li>
                </ul>
              </article>

              {/* Section 9 */}
              <article id="contact" className="scroll-mt-28 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  9. Security & Governance Contact
                </h2>
                <p>
                  For security vulnerability disclosures, regulatory inquiries, or questions regarding data processing compliance:
                </p>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-teal-950/70 p-5 rounded-2xl text-xs space-y-2">
                  <p><strong>HealthStats Open-Source Initiative</strong></p>
                  <p>Governance & Information Security: <a href="mailto:security@healstats.org" className="text-teal-600 dark:text-teal-400 font-semibold underline">security@healstats.org</a></p>
                  <p>Open Source Repository: <a href="https://github.com/sucksatcse/HealStats" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 font-semibold underline">github.com/sucksatcse/HealStats</a></p>
                  <p className="text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Complies with WHO Digital Health Standards & Bangladesh Ministry of Health & Family Welfare Digital Healthcare Guidelines.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer with Privacy Highlight ── */}
      <AppFooter activePage="privacy" onNavigate={onNavigate} />
    </div>
  )
}
