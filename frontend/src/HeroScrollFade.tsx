import React, { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import AppNavbar from "./AppNavbar"
import { toBengaliNumerals } from "./lib/publicStatsService"

export interface HeroScrollFadeProps {
  onPatientLookup?: () => void
  onGetStarted?: () => void
  onLogin?: () => void
  onSignUp?: () => void
  onDashboard?: () => void
  onLogout?: () => void
  lang?: "en" | "bn"
  visitsCount?: number
}

export default function HeroScrollFade({
  onPatientLookup,
  onGetStarted,
  onLogin,
  onSignUp,
  onDashboard,
  onLogout,
  lang = "bn",
  visitsCount = 847,
}: HeroScrollFadeProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Scroll progress through the 150vh hero scroll track
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  // Headline transforms (0 -> 1 scroll progress)
  const rawHeadlineOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const rawHeadlineScale = useTransform(scrollYProgress, [0, 1], [1, 0.85])
  const rawHeadlineBlur = useTransform(scrollYProgress, [0, 1], [0, 6])
  const rawHeadlineLetterSpacing = useTransform(scrollYProgress, [0, 1], [0, 12])

  // Convert to CSS strings
  const headlineFilter = useTransform(rawHeadlineBlur, (b) =>
    shouldReduceMotion ? "none" : `blur(${b}px)`
  )
  const headlineLetterSpacing = useTransform(rawHeadlineLetterSpacing, (ls) =>
    shouldReduceMotion ? "0px" : `${ls}px`
  )
  const headlineOpacity = shouldReduceMotion ? 1 : rawHeadlineOpacity
  const headlineScale = shouldReduceMotion ? 1 : rawHeadlineScale

  // Navbar and CTA fade out faster (opacity 1 -> 0 by 60% scroll progress)
  const rawNavOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const navOpacity = shouldReduceMotion ? 1 : rawNavOpacity
  const ctaOpacity = navOpacity
  const ctaScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.94])

  // Disable pointer events when near invisible
  const navPointerEvents = useTransform(scrollYProgress, (v) =>
    v >= 0.58 ? "none" : "auto"
  )
  const ctaPointerEvents = useTransform(scrollYProgress, (v) =>
    v >= 0.58 ? "none" : "auto"
  )

  const visitsDisplay =
    lang === "bn" ? toBengaliNumerals(visitsCount) : visitsCount.toLocaleString()

  return (
    <div
      ref={heroRef}
      className="relative h-[150vh] w-full"
      style={{ willChange: "transform" }}
    >
      {/* ── Sticky Hero Viewport ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Full-width clinic/healthcare background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1920&auto=format&fit=crop&q=80"
            alt="Healthcare professionals caring for patients in a community health center"
            className="w-full h-full object-cover object-center"
          />
          {/* Calibrated dark/readable overlay for trustworthy medical visual tone */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(8, 28, 25, 0.78) 0%, rgba(13, 38, 35, 0.72) 45%, rgba(15, 23, 42, 0.92) 100%)",
            }}
          />
        </div>

        {/* ── Sticky Navbar with early fade ── */}
        <motion.div
          style={{
            opacity: navOpacity,
            pointerEvents: navPointerEvents as unknown as React.CSSProperties["pointerEvents"],
          }}
          className="relative z-30 w-full"
        >
          <AppNavbar
            onPatientLookup={onPatientLookup}
            onGetStarted={onGetStarted}
            onLogin={onLogin}
            onSignUp={onSignUp}
            onDashboard={onDashboard}
            onLogout={onLogout}
          />
        </motion.div>

        {/* ── Floating Live-Stat Chip (Top Right) ── */}
        <motion.div
          style={{
            opacity: navOpacity,
            pointerEvents: navPointerEvents as unknown as React.CSSProperties["pointerEvents"],
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.4 }}
          className="absolute top-20 sm:top-24 right-4 sm:right-8 lg:right-16 z-20"
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            className="flex items-center gap-2.5 bg-white/10 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xl text-white select-none"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              {lang === "bn"
                ? `আজ সক্রিয় · ${visitsDisplay} ভিজিট`
                : `Active today · ${visitsDisplay} visits`}
            </span>
          </motion.div>
        </motion.div>

        {/* ── Center Content: Scrubbing Headline + CTA ── */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4 sm:px-6 text-center max-w-4xl mx-auto w-full">
          {/* Main Centered Bengali Headline */}
          <motion.h1
            style={{
              opacity: headlineOpacity,
              scale: headlineScale,
              filter: headlineFilter,
              letterSpacing: headlineLetterSpacing,
            }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-bold text-white leading-[1.14] drop-shadow-md select-none text-center"
          >
            {lang === "bn" ? (
              "স্বাস্থ্যসেবা রেকর্ড যা কখনো থামে না।"
            ) : (
              <>
                Healthcare records
                <br />
                <span className="text-teal-300 font-normal italic">
                  that never stop working.
                </span>
              </>
            )}
          </motion.h1>

          {/* Subtitle / Plain language healthcare explanation */}
          <motion.p
            style={{
              opacity: ctaOpacity,
              pointerEvents: ctaPointerEvents as unknown as React.CSSProperties["pointerEvents"],
            }}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-200/90 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-sm select-none"
          >
            {lang === "bn"
              ? "বাংলাদেশের প্রত্যন্ত ক্লিনিকগুলোর জন্য নির্ভরযোগ্য অফলাইন-প্রথম ইলেকট্রনিক স্বাস্থ্য রেকর্ড ব্যবস্থা।"
              : "An offline-first electronic health record system engineered for rural clinics across Bangladesh."}
          </motion.p>

          {/* Hero CTA Buttons (Fade early with Navbar) */}
          <motion.div
            style={{
              opacity: ctaOpacity,
              scale: shouldReduceMotion ? 1 : ctaScale,
              pointerEvents: ctaPointerEvents as unknown as React.CSSProperties["pointerEvents"],
            }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onSignUp || onGetStarted}
              className="inline-flex items-center gap-2.5 bg-teal-500 hover:bg-teal-400 text-teal-950 font-semibold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg shadow-teal-500/25 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {lang === "bn" ? "বিনামূল্যে শুরু করুন" : "Get Started Free"}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:text-teal-200 border border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/15 backdrop-blur-sm px-6 py-3.5 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {lang === "bn" ? "আপনার ক্লিনিকে লগ ইন করুন" : "Log In to Your Clinic"}
            </button>
          </motion.div>
        </div>

        {/* ── Floating Offline Chip (Bottom Left) ── */}
        <motion.div
          style={{
            opacity: navOpacity,
            pointerEvents: navPointerEvents as unknown as React.CSSProperties["pointerEvents"],
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.6 }}
          className="absolute bottom-6 sm:bottom-10 left-4 sm:left-8 lg:left-16 z-20"
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: 0.6 }}
            className="bg-white/10 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xl text-white min-w-[190px] sm:min-w-[210px] select-none"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-400 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                {lang === "bn" ? "অফলাইন মোড সক্রিয়" : "Offline mode active"}
              </span>
            </div>
            {/* Thin progress bar */}
            <div className="mt-2.5 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-[65%]" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
