import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"
import { useAuth } from "./AuthContext"

interface LoginPageProps {
  onBack: () => void
  onLogin: () => void
}

export default function LoginPage({ onBack, onLogin }: LoginPageProps) {
  const { loginDemoUser } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }
    setError("")
    setLoading(true)

    if (email.trim() === "worker@clinic.org" && password === "password123") {
      // Demo bypass for local testing without Supabase Admin setup
      loginDemoUser()
      onLogin()
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      onLogin() // will trigger redirect in App.tsx
    }
  }

  return (
    <>
      <div className="an-atmosphere" aria-hidden="true" />
      <div className="min-h-screen flex flex-col" style={{background: 'var(--an-bg)', position: 'relative', zIndex: 0}}>
      {/* ─── Offline/Online badge ─── */}
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-sm border backdrop-blur-sm transition-all ${
            isOnline
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {isOnline ? "Online" : "Offline — local login available"}
        </div>
      </div>

      {/* ─── Back link ─── */}
      <div className="px-8 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-300 font-medium transition-colors group"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to home
        </button>
      </div>

      {/* ─── Centered card ─── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          {/* Logo + brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/25 mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-teal-950 dark:text-white mb-1">
              Health<span className="text-teal-600">Stats</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Healthcare Worker Portal</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8" style={{background: 'var(--an-glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--an-border)', boxShadow: 'var(--an-glass-shadow-lg)'}}>
            <h2 className="text-lg font-semibold text-teal-950 dark:text-white mb-1">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">
              {isOnline
                ? "Enter your credentials to access the portal."
                : "You're offline. Your local records are still accessible."}
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Worker ID / Email */}
              <div>
                <label
                  htmlFor="workerId"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      className="w-4.5 h-4.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </span>
                  <input
                    id="workerId"
                    type="email"
                    autoComplete="username"
                    placeholder="e.g. name@clinic.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      className="w-4.5 h-4.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        className="w-4.5 h-4.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        className="w-4.5 h-4.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 group-hover:border-teal-400 peer-checked:border-teal-600 peer-checked:bg-teal-600 transition-all" />
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth={2}
                    className="absolute inset-0 w-4 h-4 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2 6l3 3 5-5"
                    />
                  </svg>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 select-none">
                  Keep me signed in on this device
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait flex items-center justify-center gap-2"
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
                  "Sign In"
                )}
              </button>
            </form>

            {/* Offline mode notice */}
            {!isOnline && (
              <div className="mt-5 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  <strong>Offline mode:</strong> Your locally cached records are
                  accessible after login. Changes will sync when connectivity is
                  restored.
                </p>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-3.5 h-3.5 text-teal-400"
                >
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.536 4.464a5 5 0 010 7.072 5 5 0 01-7.072-7.072A5 5 0 0111.536 5.464zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                256-bit TLS encryption
              </span>
              <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <span className="flex items-center gap-1">
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-3.5 h-3.5 text-teal-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 1a.5.5 0 01.45.28l1.396 2.832 3.125.455a.5.5 0 01.277.852L10.9 7.63l.534 3.11a.5.5 0 01-.726.527L8 9.792l-2.708 1.474a.5.5 0 01-.726-.527l.534-3.11-2.348-2.29a.5.5 0 01.277-.853l3.125-.455L7.55 1.28A.5.5 0 018 1z"
                    clipRule="evenodd"
                  />
                </svg>
                WHO-certified platform
              </span>
              <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <span>Works offline</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              New to HealthStats?{" "}
              <a
                href="#"
                className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium transition-colors"
              >
                Contact your clinic admin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
