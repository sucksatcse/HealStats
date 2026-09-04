import { useState, useEffect } from "react";
import AppNavbar from "./AppNavbar";
import { useLang } from "./LanguageContext";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";
import AdminLoginPage from "./AdminLoginPage";
import AdminDashboardPage from "./AdminDashboardPage";
import RoleSelectionPage from "./RoleSelectionPage";
import PatientLookupPage from "./PatientLookupPage";
import EmptyStatesShowcase from "./EmptyStates";
import StyleGuidePage from "./StyleGuidePage";
import NavbarPreviewPage from "./NavbarPreviewPage";
import SkeletonStatesPage from "./SkeletonStatesPage";
import ButtonStatesPage from "./ButtonStatesPage";
import SuccessConfirmationPage from "./SuccessConfirmationPage";
import SyncProgressPage from "./SyncProgressPage";
import ClinicsMapSection from "./ClinicsMapSection";
import ChatWidget from "./ChatWidget";
import { useAuth } from "./AuthContext";

/* ══════════════════════════════════════════════════════════════════════════════
   Landing page translations — en / bn
   ══════════════════════════════════════════════════════════════════════════════ */
const LANDING = {
  en: {
    hero: {
      badge: "Offline-first EHR",
      h1a: "Healthcare records", h1b: "that never stop", h1c: "working.",
      body: "HealthStats is an offline-first electronic health record system built for rural clinics across Bangladesh. Capture visits, triage patients, and stay coordinated through floods and outages — online or off.",
      ctaPrimary: "Get Started Free", ctaSecondary: "Log In to Your Clinic",
      trust: ["WHO Digital Health certified", "Free for NGO and public health use", "30-second setup"],
      offlineMode: "Offline mode active", recordsQueued: "14 records queued for sync",
      lastSynced: "Last synced: 2 hrs ago · Will sync automatically",
      activeToday: "Active today", visits: "847 visits",
      activeSub: "across 12 clinics · no connectivity needed",
    },
    stats: [
      { value: "340+",   label: "Clinics served" },
      { value: "1.2M",   label: "Patient records" },
      { value: "99.98%", label: "Data integrity rate" },
      { value: "48 hrs", label: "Avg. offline durability" },
    ],
    features: {
      eyebrow: "Built for the field",
      h2: "Everything a rural clinic needs, nothing it doesn't.",
      body: "Designed around the real constraints of rural Bangladesh: intermittent connectivity, shared devices, high patient volumes during monsoon season, and limited IT support.",
      cards: [
        { title: "Offline-First",   desc: "Register patients, record visits, and pull full histories with zero connectivity. Everything syncs automatically the moment a signal returns — no record is ever lost between the char and the upazila hospital." },
        { title: "AI Triage",       desc: "Every intake is scored for urgency in seconds. On-device machine learning flags high-risk symptoms so overstretched health workers see the sickest patients first — even before the queue reaches a doctor." },
        { title: "Disaster-Ready",  desc: "Built for cyclone and monsoon-flood response. Switch to Emergency Mode to surface triage queues, active zones, and resource allocation across shelters — keeping care coordinated when infrastructure goes down." },
      ],
    },
    howItWorks: {
      eyebrow: "How it works", h2: "Connect when you can. Work when you can't.",
      syncTime: "Sync time", syncValue: "<2 min", syncSub: "for 500 queued records",
      steps: [
        { step: "01", title: "Install once, use anywhere",          body: "HealthStats installs as a Progressive Web App directly on your device. No native app store required. Works on any modern browser." },
        { step: "02", title: "Record visits without internet",      body: "All data is stored locally. Clinicians enter patient data, diagnoses, and prescriptions exactly as they would online." },
        { step: "03", title: "Sync automatically on reconnect",     body: "The moment connectivity resumes, HealthStats pushes queued records to your central server with conflict resolution built in." },
      ],
    },
    testimonials: {
      eyebrow: "From the field",
      h2: "Trusted by health workers across rural Bangladesh.",
      items: [
        { quote: "During the last cyclone our network was gone for four days. HealthStats kept working — every patient we saw at the shelter was already in the system when the signal came back.", author: "Nasrin Akter", role: "Community Health Worker, Char Fasson, Bhola" },
        { quote: "The AI triage flags the sick children before they reach me. In a queue of eighty patients, that has changed how quickly we respond.", author: "Dr. Rafiqul Islam", role: "Medical Officer, Sunamganj Upazila Health Complex" },
      ],
    },
    cta: {
      h2: "Ready to bring reliable records to your clinic?",
      body: "Set up takes under 30 seconds. No IT team required. Free for public health and NGO use.",
      primary: "Get Started Free", secondary: "Book a Demo",
    },
  },
  bn: {
    hero: {
      badge: "অফলাইন-প্রথম ইএইচআর",
      h1a: "স্বাস্থ্যসেবা রেকর্ড", h1b: "যা কখনো থামে না।", h1c: "",
      body: "HealthStats বাংলাদেশের গ্রামীণ ক্লিনিকগুলোর জন্য তৈরি একটি অফলাইন-প্রথম ইলেকট্রনিক স্বাস্থ্য রেকর্ড সিস্টেম। বন্যা ও বিদ্যুৎ বিভ্রাটের মধ্যেও রোগী ভর্তি, ট্রায়াজ এবং সমন্বয় বজায় রাখুন।",
      ctaPrimary: "বিনামূল্যে শুরু করুন", ctaSecondary: "আপনার ক্লিনিকে লগ ইন করুন",
      trust: ["ডব্লিউএইচও ডিজিটাল স্বাস্থ্য সার্টিফাইড", "এনজিও ও জনস্বাস্থ্য ব্যবহারের জন্য বিনামূল্যে", "৩০ সেকেন্ডে সেটআপ"],
      offlineMode: "অফলাইন মোড সক্রিয়", recordsQueued: "১৪টি রেকর্ড সিঙ্কের জন্য অপেক্ষায়",
      lastSynced: "শেষ সিঙ্ক: ২ ঘণ্টা আগে · স্বয়ংক্রিয়ভাবে সিঙ্ক হবে",
      activeToday: "আজ সক্রিয়", visits: "৮৪৭ ভিজিট",
      activeSub: "১২টি ক্লিনিকে · ইন্টারনেট ছাড়াই",
    },
    stats: [
      { value: "৩৪০+",    label: "সেবিত ক্লিনিক" },
      { value: "১২ লক্ষ", label: "রোগীর রেকর্ড" },
      { value: "৯৯.৯৮%",  label: "ডেটা অখণ্ডতার হার" },
      { value: "৪৮ ঘণ্টা", label: "গড় অফলাইন স্থায়িত্ব" },
    ],
    features: {
      eyebrow: "মাঠের জন্য তৈরি",
      h2: "গ্রামীণ ক্লিনিকের যা দরকার, অতিরিক্ত কিছুই নয়।",
      body: "বাংলাদেশের গ্রামীণ পরিবেশের বাস্তব সীমাবদ্ধতা মাথায় রেখে তৈরি: বিরতিহীন ইন্টারনেট, ভাগাভাগি ডিভাইস, বর্ষায় অধিক রোগীর চাপ এবং সীমিত আইটি সহায়তা।",
      cards: [
        { title: "অফলাইন-প্রথম",   desc: "শূন্য সংযোগেও রোগী নিবন্ধন, ভিজিট রেকর্ড ও সম্পূর্ণ ইতিহাস দেখুন। সংকেত ফিরলেই সব স্বয়ংক্রিয়ভাবে সিঙ্ক হয় — চর থেকে উপজেলা হাসপাতাল পর্যন্ত কোনো রেকর্ড হারায় না।" },
        { title: "এআই ট্রায়াজ",    desc: "প্রতিটি ভর্তিকে সেকেন্ডে জরুরিত্ব অনুযায়ী মূল্যায়ন করা হয়। অন-ডিভাইস মেশিন লার্নিং ঝুঁকিপূর্ণ লক্ষণ চিহ্নিত করে, যাতে ব্যস্ত স্বাস্থ্যকর্মীরা সবচেয়ে অসুস্থ রোগীকে আগে দেখতে পারেন।" },
        { title: "দুর্যোগ-প্রস্তুত", desc: "ঘূর্ণিঝড় ও বন্যার প্রতিক্রিয়ার জন্য তৈরি। জরুরি মোডে আশ্রয়কেন্দ্র জুড়ে ট্রায়াজ কিউ, সক্রিয় অঞ্চল ও সম্পদ বরাদ্দ দেখুন — অবকাঠামো বিপর্যস্ত হলেও সেবা সমন্বিত থাকে।" },
      ],
    },
    howItWorks: {
      eyebrow: "কীভাবে কাজ করে", h2: "পারলে সংযুক্ত হন। না পারলেও কাজ করুন।",
      syncTime: "সিঙ্কের সময়", syncValue: "<২ মিনিট", syncSub: "৫০০ কিউ রেকর্ডের জন্য",
      steps: [
        { step: "০১", title: "একবার ইনস্টল, যেকোনো জায়গায় ব্যবহার",        body: "HealthStats সরাসরি আপনার ডিভাইসে প্রোগ্রেসিভ ওয়েব অ্যাপ হিসেবে ইনস্টল হয়। কোনো অ্যাপ স্টোর লাগে না। যেকোনো আধুনিক ব্রাউজারে কাজ করে।" },
        { step: "০২", title: "ইন্টারনেট ছাড়াই ভিজিট রেকর্ড করুন",          body: "সমস্ত ডেটা স্থানীয়ভাবে সংরক্ষিত হয়। চিকিৎসকরা ঠিক অনলাইনের মতোই রোগীর তথ্য, রোগ নির্ণয় ও ওষুধ লিখতে পারেন।" },
        { step: "০৩", title: "পুনরায় সংযুক্ত হলে স্বয়ংক্রিয়ভাবে সিঙ্ক করুন", body: "সংযোগ ফিরে আসার সাথে সাথে HealthStats কিউ রেকর্ডগুলো কেন্দ্রীয় সার্ভারে পাঠায়, বিরোধ নিষ্পত্তি সহ।" },
      ],
    },
    testimonials: {
      eyebrow: "মাঠ থেকে",
      h2: "বাংলাদেশের গ্রামীণ স্বাস্থ্যকর্মীদের বিশ্বাস।",
      items: [
        { quote: "শেষ ঘূর্ণিঝড়ে চার দিন নেটওয়ার্ক ছিল না। HealthStats চলতে থাকল — আশ্রয়কেন্দ্রে যে রোগী দেখলাম, সংকেত ফেরার পর সবাই সিস্টেমে ছিল।", author: "নাসরিন আক্তার", role: "কমিউনিটি স্বাস্থ্যকর্মী, চর ফ্যাশন, ভোলা" },
        { quote: "এআই ট্রায়াজ অসুস্থ শিশুদের আমার কাছে পৌঁছানোর আগেই চিহ্নিত করে। আশিজনের লাইনে এটি আমাদের প্রতিক্রিয়া বদলে দিয়েছে।", author: "ডা. রফিকুল ইসলাম", role: "মেডিকেল অফিসার, সুনামগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স" },
      ],
    },
    cta: {
      h2: "আপনার ক্লিনিকে নির্ভরযোগ্য রেকর্ড আনতে প্রস্তুত?",
      body: "সেটআপ মাত্র ৩০ সেকেন্ড। কোনো আইটি দল লাগবে না। জনস্বাস্থ্য ও এনজিও ব্যবহারের জন্য বিনামূল্যে।",
      primary: "বিনামূল্যে শুরু করুন", secondary: "ডেমো বুক করুন",
    },
  },
} as const;

/* Feature card icons (not translatable) */
const FEATURE_ICONS = [
  <svg key="offline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
  <svg key="ai" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>,
  <svg key="disaster" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
];

/* ══════════════════════════════════════════════════════════════════════════════
   App root — page router + landing page
   ══════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState<
    "landing" | "login" | "admin-login" | "role-selection" | "dashboard" |
    "admin-dashboard" | "patient-lookup" | "system-states" | "design-system" |
    "navbar-demo" | "loading-states" | "button-states" | "record-saved" | "sync-progress"
  >("landing");

  /* Global language from context — drives all landing page text */
  const { lang } = useLang();
  const t = LANDING[lang];
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = [
      "dashboard", "admin-dashboard", "patient-lookup", "record-saved", "sync-progress"
    ].includes(page);

    if (isProtectedRoute && !session) {
      setPage("login");
    }

    if (session && profile && (page === "login" || page === "admin-login" || page === "role-selection" || page === "landing")) {
       setPage(profile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    }
  }, [page, session, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <svg className="animate-spin w-8 h-8 text-teal-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      </div>
    );
  }

  if (page === "navbar-demo")     return <NavbarPreviewPage onBack={() => setPage("landing")} />;
  if (page === "loading-states")  return <SkeletonStatesPage onBack={() => setPage("landing")} />;
  if (page === "button-states")   return <ButtonStatesPage onBack={() => setPage("landing")} />;
  if (page === "record-saved")    return <SuccessConfirmationPage onDone={() => setPage("landing")} />;
  if (page === "sync-progress")   return <SyncProgressPage onDone={() => setPage("landing")} />;
  if (page === "design-system")   return <StyleGuidePage onBack={() => setPage("landing")} />;
  if (page === "system-states")   return <EmptyStatesShowcase onBack={() => setPage("landing")} />;
  if (page === "patient-lookup")  return <PatientLookupPage onBack={() => setPage("landing")} />;
  if (page === "login")           return <LoginPage onBack={() => setPage("landing")} onLogin={() => {}} />;
  if (page === "admin-login")     return <AdminLoginPage onBack={() => setPage("landing")} onLogin={() => {}} />;
  if (page === "dashboard")       return <><DashboardPage onLogout={() => setPage("landing")} /><ChatWidget /></>;
  if (page === "admin-dashboard") return <><AdminDashboardPage onLogout={() => setPage("landing")} /><ChatWidget /></>;

  /* ── Landing page ── */
  return (
    <>
    <div className={`min-h-full bg-white dark:bg-slate-900 text-[#0f2724] dark:text-slate-100 transition-colors duration-200 ${lang === "bn" ? "lang-bn" : ""}`}>

      {/* ─── Navbar ─── */}
      <AppNavbar
        onPatientLookup={() => setPage("patient-lookup")}
        onAdminLogin={() => setPage("admin-login")}
        onLogin={() => setPage("login")}
      />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[1fr_1fr] gap-0 min-h-[calc(100vh-64px)]">

          {/* Left: copy */}
          <div className="flex flex-col justify-center py-16 lg:py-24 lg:pr-16 z-10">
            <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-700 rounded-full px-3 py-1.5 mb-8 w-fit">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 tracking-wide uppercase">{t.hero.badge}</span>
            </div>

            <h1 className="font-display text-5xl lg:text-6xl xl:text-[68px] leading-[1.08] text-teal-950 dark:text-white mb-6">
              {t.hero.h1a}<br />
              <em className="not-italic text-teal-600 dark:text-teal-400">{t.hero.h1b}</em>
              {t.hero.h1c && <><br />{t.hero.h1c}</>}
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mb-10">
              {t.hero.body}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#get-started"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:shadow-lg hover:shadow-teal-600/30 hover:-translate-y-0.5"
              >
                {t.hero.ctaPrimary}
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
              </a>
              <button
                onClick={() => setPage("login")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-600 dark:hover:text-teal-100 border border-teal-200 dark:border-teal-700 hover:border-teal-400 dark:hover:border-teal-500 px-6 py-3.5 rounded-xl transition-all"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-5 mt-10 pt-8 border-t border-teal-100 dark:border-teal-800">
              {[
                { icon: <path fillRule="evenodd" d="M8 1a.5.5 0 01.45.28l1.396 2.832 3.125.455a.5.5 0 01.277.852L10.9 7.63l.534 3.11a.5.5 0 01-.726.527L8 9.792l-2.708 1.474a.5.5 0 01-.726-.527l.534-3.11-2.348-2.29a.5.5 0 01.277-.853l3.125-.455L7.55 1.28A.5.5 0 018 1z" clipRule="evenodd" /> },
                { icon: <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.83 5.17l-4.5 4.5a.5.5 0 01-.707 0l-2-2a.5.5 0 01.707-.707L7 8.646l4.123-4.123a.5.5 0 11.707.707z" /> },
                { icon: <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 2.5v3.25l2.5 1.5.5-.87-2-1.19V5.5h-1z" /> },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-teal-500">{s.icon}</svg>
                  {t.hero.trust[i]}
                </div>
              ))}
            </div>
          </div>

          {/* Right: image panel */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-teal-600" />
            <img
              src="https://images.unsplash.com/photo-1621353880071-4752fa42cbc7?w=900&h=1000&fit=crop&auto=format"
              alt="Healthcare worker consulting with a patient at a rural clinic"
              className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-700/80 via-teal-600/60 to-teal-800/90" />

            {/* Floating offline card */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-teal-600 dark:text-teal-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-teal-900 dark:text-white">{t.hero.offlineMode}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.hero.recordsQueued}</p>
                </div>
                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
              </div>
              <div className="h-1.5 bg-teal-100 dark:bg-teal-900/40 rounded-full overflow-hidden">
                <div className="h-full w-[62%] bg-teal-500 rounded-full" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{t.hero.lastSynced}</p>
            </div>

            {/* Top-right label */}
            <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-100 mb-1">{t.hero.activeToday}</p>
              <p className="text-2xl font-display text-white">{t.hero.visits}</p>
              <p className="text-xs text-teal-200 mt-0.5">{t.hero.activeSub}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section className="bg-teal-900 dark:bg-slate-800 py-14" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-teal-700 dark:lg:divide-slate-700">
            {t.stats.map(({ value, label }) => (
              <div key={label} className="text-center lg:px-8">
                <p className="font-display text-4xl lg:text-5xl text-white mb-1">{value}</p>
                <p className="text-sm text-teal-300 dark:text-slate-400 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 bg-teal-50 dark:bg-slate-950" id="features">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 dark:text-teal-400 mb-3">{t.features.eyebrow}</p>
            <h2 className="font-display text-4xl lg:text-5xl text-teal-950 dark:text-white leading-tight mb-4">{t.features.h2}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{t.features.body}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.cards.map(({ title, desc }, i) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-teal-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg hover:shadow-teal-100 dark:hover:shadow-teal-900/20 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-900/40 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 transition-colors">
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="font-display text-xl text-teal-950 dark:text-white mb-2.5">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-24 bg-white dark:bg-slate-900" id="how-it-works-detail">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-teal-100 dark:bg-teal-900">
              <img
                src="https://images.unsplash.com/photo-1680759291617-2923935d803a?w=800&h=600&fit=crop&auto=format"
                alt="Healthcare team in a community clinic"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-900/50 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-teal-600 rounded-2xl p-5 shadow-xl text-white w-48">
              <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider mb-1">{t.howItWorks.syncTime}</p>
              <p className="font-display text-3xl">{t.howItWorks.syncValue}</p>
              <p className="text-xs text-teal-200 mt-1">{t.howItWorks.syncSub}</p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 dark:text-teal-400 mb-3">{t.howItWorks.eyebrow}</p>
            <h2 className="font-display text-4xl lg:text-5xl text-teal-950 dark:text-white leading-tight mb-6">{t.howItWorks.h2}</h2>
            <div className="space-y-6">
              {t.howItWorks.steps.map(({ step, title, body }) => (
                <div key={step} className="flex gap-5">
                  <span className="font-display text-2xl text-teal-200 dark:text-teal-700 font-bold w-8 flex-shrink-0 mt-0.5">{step}</span>
                  <div>
                    <h3 className="font-semibold text-teal-950 dark:text-white mb-1">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Coverage map ─── */}
      <ClinicsMapSection />

      {/* ─── Testimonials ─── */}
      <section className="py-24 bg-teal-50 dark:bg-slate-950" id="testimonials">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 dark:text-teal-400 mb-3">{t.testimonials.eyebrow}</p>
            <h2 className="font-display text-4xl text-teal-950 dark:text-white">{t.testimonials.h2}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {t.testimonials.items.map(({ quote, author, role }) => (
              <div key={author} className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-teal-100 dark:border-slate-800">
                <svg viewBox="0 0 32 24" fill="none" className="w-8 h-6 text-teal-200 dark:text-teal-800 mb-5">
                  <path d="M0 24V14.4C0 6.4 4.8 1.6 14.4 0L16 3.2C11.2 4.267 8.533 6.933 8 11.2H14.4V24H0zm17.6 0V14.4C17.6 6.4 22.4 1.6 32 0l1.6 3.2c-4.8 1.067-7.467 3.733-8 8H32V24H17.6z" fill="currentColor" />
                </svg>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 text-[15px]">{quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
                    {author.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-teal-950 dark:text-white">{author}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-teal-700 dark:bg-teal-900 py-24" id="get-started">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="lg:max-w-xl">
            <h2 className="font-display text-4xl lg:text-5xl text-white leading-tight mb-4">{t.cta.h2}</h2>
            <p className="text-teal-200 text-lg leading-relaxed">{t.cta.body}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0">
            <a href="#signup" className="bg-white text-teal-700 font-bold text-sm px-8 py-4 rounded-xl hover:bg-teal-50 transition-colors shadow-lg w-full sm:w-auto text-center">{t.cta.primary}</a>
            <a href="#demo" className="border border-teal-400 dark:border-teal-600 text-white font-semibold text-sm px-8 py-4 rounded-xl hover:bg-teal-600 dark:hover:bg-teal-800 transition-colors w-full sm:w-auto text-center">{t.cta.secondary}</a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-teal-950 text-teal-300 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              </div>
              <span className="font-display text-lg text-white">HealthStats</span>
            </div>
            <p className="text-sm text-teal-400 leading-relaxed">
              Offline-first electronic health records for the world{"'"}s underserved clinics.
            </p>
          </div>

          {[
            { heading: "Product",      links: ["Features", "Security", "Integrations", "Pricing", "Changelog"] },
            { heading: "Resources",    links: ["Documentation", "Navbar Demo", "Design System", "System States", "Loading States", "Button States", "Save Success", "Sync Progress"] },
            { heading: "Organization", links: ["About", "Blog", "Careers", "Contact", "Privacy Policy"] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-500 mb-4">{heading}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    {["System States","Design System","Navbar Demo","Loading States","Button States","Save Success","Sync Progress"].includes(link) ? (
                      <button
                        onClick={() => setPage(
                          link === "Design System"   ? "design-system"  :
                          link === "Navbar Demo"     ? "navbar-demo"    :
                          link === "Loading States"  ? "loading-states" :
                          link === "Button States"   ? "button-states"  :
                          link === "Save Success"    ? "record-saved"   :
                          link === "Sync Progress"   ? "sync-progress"  : "system-states"
                        )}
                        className="text-sm text-teal-400 hover:text-white transition-colors text-left"
                      >
                        {link}
                      </button>
                    ) : (
                      <a href="#" className="text-sm text-teal-400 hover:text-white transition-colors">{link}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-10 pt-6 border-t border-teal-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-teal-600">© 2026 HealthStats. Open-source under the MPL 2.0 license.</p>
          <p className="text-xs text-teal-600">Built for healthcare workers who keep going, no matter what.</p>
        </div>
      </footer>
    </div>
    <ChatWidget />
    </>
  );
}
