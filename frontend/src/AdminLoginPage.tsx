import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"

interface AdminLoginPageProps {
  onBack: () => void
  onLogin: () => void
}

// ── Left panel illustration pieces ────────────────────────────────────────────
function ClinicIllustration() {
  return (
    <svg viewBox="0 0 420 320" fill="none" className="w-full max-w-sm mx-auto">
      {/* Ground */}
      <ellipse
        cx="210"
        cy="295"
        rx="180"
        ry="14"
        fill="#0f766e"
        opacity=".25"
      />

      {/* Clinic building */}
      <rect x="120" y="140" width="180" height="140" rx="4" fill="#ccfbf1" />
      <rect x="120" y="140" width="180" height="22" rx="4" fill="#14b8a6" />
      {/* Red cross on building */}
      <rect x="200" y="148" width="20" height="6" rx="2" fill="white" />
      <rect x="207" y="141" width="6" height="20" rx="2" fill="white" />
      {/* Door */}
      <rect x="188" y="230" width="44" height="50" rx="3" fill="#0d9488" />
      <circle cx="226" cy="257" r="3" fill="#99f6e4" />
      {/* Windows */}
      <rect
        x="133"
        y="175"
        width="36"
        height="28"
        rx="3"
        fill="#0d9488"
        opacity=".7"
      />
      <rect
        x="251"
        y="175"
        width="36"
        height="28"
        rx="3"
        fill="#0d9488"
        opacity=".7"
      />
      <rect
        x="133"
        y="215"
        width="36"
        height="28"
        rx="3"
        fill="#0d9488"
        opacity=".5"
      />
      <rect
        x="251"
        y="215"
        width="36"
        height="28"
        rx="3"
        fill="#0d9488"
        opacity=".5"
      />

      {/* Solar panel on roof */}
      <rect
        x="150"
        y="128"
        width="120"
        height="16"
        rx="2"
        fill="#5eead4"
        opacity=".6"
      />
      <line
        x1="150"
        y1="136"
        x2="270"
        y2="136"
        stroke="#0d9488"
        strokeWidth="1"
      />
      <line
        x1="180"
        y1="128"
        x2="180"
        y2="144"
        stroke="#0d9488"
        strokeWidth="1"
      />
      <line
        x1="210"
        y1="128"
        x2="210"
        y2="144"
        stroke="#0d9488"
        strokeWidth="1"
      />
      <line
        x1="240"
        y1="128"
        x2="240"
        y2="144"
        stroke="#0d9488"
        strokeWidth="1"
      />

      {/* Tree left */}
      <rect
        x="70"
        y="220"
        width="10"
        height="60"
        rx="3"
        fill="#0f766e"
        opacity=".5"
      />
      <ellipse cx="75" cy="210" rx="26" ry="22" fill="#14b8a6" opacity=".55" />
      <ellipse cx="75" cy="200" rx="18" ry="16" fill="#5eead4" opacity=".45" />

      {/* Tree right */}
      <rect
        x="344"
        y="235"
        width="8"
        height="45"
        rx="3"
        fill="#0f766e"
        opacity=".5"
      />
      <ellipse cx="348" cy="224" rx="22" ry="18" fill="#14b8a6" opacity=".55" />
      <ellipse cx="348" cy="215" rx="14" ry="12" fill="#5eead4" opacity=".45" />

      {/* Walking health worker */}
      <circle cx="80" cy="257" r="9" fill="#ccfbf1" />
      <rect x="74" y="266" width="12" height="20" rx="3" fill="#0d9488" />
      {/* Bag */}
      <rect x="85" y="270" width="9" height="7" rx="2" fill="#5eead4" />
      <rect x="88" y="271" width="3" height="2" rx=".5" fill="white" />
      <rect x="86.5" y="270" width="5" height="2" rx=".5" fill="white" />
      {/* Legs */}
      <rect x="75" y="285" width="4" height="14" rx="2" fill="#0f766e" />
      <rect x="82" y="283" width="4" height="14" rx="2" fill="#0f766e" />

      {/* Signal / connectivity waves */}
      <path
        d="M340 100 Q350 90 360 100"
        stroke="#5eead4"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".8"
      />
      <path
        d="M333 93 Q350 78 367 93"
        stroke="#5eead4"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".55"
      />
      <path
        d="M326 86 Q350 65 374 86"
        stroke="#5eead4"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".3"
      />
      <circle cx="350" cy="107" r="3.5" fill="#5eead4" />

      {/* Tablet in hand of second figure far right */}
      <circle cx="365" cy="250" r="8" fill="#ccfbf1" />
      <rect x="359" y="258" width="12" height="20" rx="3" fill="#0d9488" />
      <rect x="355" y="264" width="9" height="6" rx="1.5" fill="#5eead4" />
      <rect x="357" y="266" width="5" height="1.5" rx=".5" fill="#0f766e" />
      <rect x="357" y="268.5" width="3" height="1" rx=".5" fill="#0f766e" />
      <rect x="370" y="278" width="4" height="13" rx="2" fill="#0f766e" />
      <rect x="363" y="276" width="4" height="15" rx="2" fill="#0f766e" />

      {/* Data lines / network */}
      <path
        d="M100 80 L175 60"
        stroke="#5eead4"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity=".4"
      />
      <path
        d="M175 60 L280 55"
        stroke="#5eead4"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity=".4"
      />
      <path
        d="M280 55 L350 107"
        stroke="#5eead4"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity=".4"
      />
      <circle cx="100" cy="80" r="4" fill="#5eead4" opacity=".5" />
      <circle cx="175" cy="60" r="4" fill="#5eead4" opacity=".5" />
      <circle cx="280" cy="55" r="4" fill="#5eead4" opacity=".5" />

      {/* Cloud / server */}
      <ellipse cx="175" cy="56" rx="22" ry="14" fill="#0d9488" opacity=".3" />
      <ellipse cx="162" cy="62" rx="14" ry="10" fill="#0d9488" opacity=".3" />
      <ellipse cx="188" cy="63" rx="13" ry="9" fill="#0d9488" opacity=".3" />
      <rect
        x="162"
        y="64"
        width="26"
        height="10"
        rx="2"
        fill="#0d9488"
        opacity=".3"
      />
    </svg>
  )
}

// ── Left panel stats ───────────────────────────────────────────────────────────
const PANEL_STATS = [
  { value: "340+", label: "Clinics managed" },
  { value: "12", label: "Districts covered" },
  { value: "1.2M", label: "Patient records" },
]

export default function AdminLoginPage({
  onBack,
  onLogin,
}: AdminLoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [forgotSent, setForgotSent] = useState(false)

  // Simulate "forgot password" flow
  const handleForgot = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Enter your email first, then click Forgot Password.")
      return
    }
    setForgotSent(true)
    setTimeout(() => setForgotSent(false), 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError("Please enter your admin email and password.")
      return
    }
    setError("")
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      onLogin() // App.tsx handles the actual role routing
    }
  }

  // subtle floating-dot animation offset
  const dots = Array.from({ length: 18 }, (_, i) => ({
    cx: 30 + (i % 6) * 70,
    cy: 30 + Math.floor(i / 6) * 90,
    r: 1.5 + (i % 3) * 0.8,
    opacity: 0.08 + (i % 4) * 0.04,
  }))

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="relative lg:w-[52%] bg-teal-800 flex flex-col justify-between px-10 py-12 overflow-hidden min-h-[320px] lg:min-h-screen">
        {/* Dot-grid texture */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid slice"
        >
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={`${d.cx}`}
              cy={`${d.cy}`}
              r={d.r}
              fill="white"
              opacity={d.opacity}
            />
          ))}
        </svg>

        {/* Radial glow bottom-right */}
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-teal-600/30 blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="white"
              strokeWidth={1.9}
              className="w-4.5 h-4.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 3.5C10 3.5 5.5 6.5 5.5 10.5a4.5 4.5 0 009 0C14.5 6.5 10 3.5 10 3.5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 16.5v-3"
              />
            </svg>
          </div>
          <div>
            <span className="font-display text-xl text-white leading-none">
              Health<span className="text-teal-300">Stats</span>
            </span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-teal-300 align-middle">
              Admin
            </span>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-8 lg:py-0">
          <ClinicIllustration />
        </div>

        {/* Headline + stats */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl text-white leading-tight mb-3">
              Manage every clinic,
              <br />
              from one dashboard.
            </h1>
            <p className="text-sm text-teal-200 leading-relaxed max-w-sm">
              The HealthStats admin portal gives district health officers a
              real-time view of sync status, patient volumes, and clinical
              activity — online or offline.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-6 pt-2 border-t border-white/10">
            {PANEL_STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-2xl text-white">{value}</p>
                <p className="text-[11px] text-teal-300 font-medium mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div className="flex-1 flex flex-col justify-between px-8 sm:px-12 lg:px-16 py-10 bg-white">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700 transition-colors group"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 4L6 8l4 4"
              />
            </svg>
            Worker portal
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Admin access only
          </span>
        </div>

        {/* Form area — vertically centred */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-10">
          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-4 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
              <svg
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="w-3.5 h-3.5 text-teal-600"
              >
                <rect x="2" y="6" width="10" height="7" rx="1.5" />
                <path strokeLinecap="round" d="M4.5 6V4.5a2.5 2.5 0 015 0V6" />
              </svg>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Admin Portal
              </span>
            </div>
            <h2 className="font-display text-3xl text-teal-950 mb-1.5">
              Sign in to admin
            </h2>
            <p className="text-sm text-slate-500">
              Authorized district health officers only.
            </p>
          </div>

          {/* Forgot-password confirmation */}
          {forgotSent && (
            <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-2xl px-4 py-3 mb-5">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4 flex-shrink-0 mt-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 8l4 4 8-8"
                />
              </svg>
              Password reset link sent to{" "}
              <strong className="ml-1">{email}</strong>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-5">
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400"
              >
                <path
                  fillRule="evenodd"
                  d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5"
              >
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    className="w-4 h-4"
                  >
                    <rect x="1.5" y="3.5" width="15" height="11" rx="2" />
                    <path strokeLinecap="round" d="M1.5 6.5l7.5 5 7.5-5" />
                  </svg>
                </span>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@healthdistrict.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold uppercase tracking-widest text-slate-500"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    className="w-4 h-4"
                  >
                    <rect x="3" y="8" width="12" height="9" rx="2" />
                    <path strokeLinecap="round" d="M6 8V6a3 3 0 016 0v2" />
                  </svg>
                </span>
                <input
                  id="admin-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <svg
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        d="M2 2l14 14M7.5 7.6A3 3 0 0110.4 10.5M4.2 4.3A8.5 8.5 0 001.5 9s2.7 5 7.5 5c1.5 0 2.8-.4 3.9-1.1M8.1 3.1C8.6 3 9 3 9.5 3c4.8 0 7.5 5 7.5 5a9.3 9.3 0 01-1.6 2.2"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        d="M1.5 9s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z"
                      />
                      <circle cx="9" cy="9" r="2.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* MFA note */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Multi-factor authentication may be required for admin accounts.
              Check your authenticator app after submitting.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-wait text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-teal-600/25 hover:shadow-lg hover:shadow-teal-600/30 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="w-4 h-4"
                  >
                    <rect x="1.5" y="3.5" width="9" height="9" rx="1.5" />
                    <path strokeLinecap="round" d="M10.5 5.5l4-1.5v8l-4-1.5" />
                    <path
                      strokeLinecap="round"
                      d="M7 8h4M9.5 6.5l2 1.5-2 1.5"
                    />
                  </svg>
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[11px] text-slate-400 font-medium">
                or
              </span>
            </div>
          </div>

          {/* SSO placeholder */}
          <button className="w-full flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/50 py-3 rounded-xl transition-all">
            <svg viewBox="0 0 18 18" fill="none" className="w-4.5 h-4.5">
              <circle
                cx="9"
                cy="9"
                r="7.5"
                stroke="#4285F4"
                strokeWidth="1.5"
              />
              <path
                d="M9 4.5A4.5 4.5 0 019 13.5"
                stroke="#4285F4"
                strokeWidth="1.5"
              />
              <path
                d="M4.5 9h9"
                stroke="#4285F4"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M5.2 6h7.6M5.2 12h7.6"
                stroke="#4285F4"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity=".5"
              />
            </svg>
            Continue with Organisation SSO
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400">
            © 2026 HealthStats · Admin Portal v3.2.1
          </p>
          <div className="flex items-center gap-3">
            {["Privacy", "Terms", "Support"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[11px] text-slate-400 hover:text-teal-600 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
