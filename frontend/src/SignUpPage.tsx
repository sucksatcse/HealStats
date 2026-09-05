import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"
import { fetchClinicsList } from "./lib/adminService"
import type { ClinicRow } from "./lib/types"

interface SignUpPageProps {
  onBack: () => void
  onGoToLogin: () => void
}

/**
 * Self-service registration. Creates a Supabase Auth user, then a linked row in
 * `staff` (role is always 'worker' — admin accounts are provisioned by an admin,
 * never via public signup). Clinic assignment is optional and can be set later
 * by an admin. No schema changes; uses the existing Supabase client.
 */
export default function SignUpPage({ onBack, onGoToLogin }: SignUpPageProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [clinicId, setClinicId] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [clinicsError, setClinicsError] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState<null | { needsConfirmation: boolean }>(null)

  useEffect(() => {
    let active = true
    fetchClinicsList().then((res) => {
      if (!active) return
      if (res.error) setClinicsError(true)
      else setClinics(res.data)
    })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) return setError("Please enter your full name.")
    if (!email.trim()) return setError("Please enter your email address.")
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    if (password !== confirm) return setError("Passwords do not match.")

    setLoading(true)

    // 1. Create the auth user.
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Supabase returns a user with no identities when the email already exists.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("An account with this email already exists. Please sign in instead.")
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setError("Could not create the account. Please try again.")
      setLoading(false)
      return
    }

    // 2. Create the linked staff profile (role always 'worker').
    const { error: staffError } = await supabase.from("staff").insert({
      name: name.trim(),
      email: email.trim(),
      role: "worker",
      clinic_id: clinicId || null,
      auth_user_id: userId,
    })
    if (staffError) {
      setError(`Account created, but profile setup failed: ${staffError.message}. Contact your clinic admin.`)
      setLoading(false)
      return
    }

    // 3. If a session was returned (email confirmation disabled), sign out so the
    //    user starts from a clean login and the staff profile loads correctly.
    const needsConfirmation = !data.session
    if (data.session) await supabase.auth.signOut()

    setLoading(false)
    setDone({ needsConfirmation })
  }

  // ── Success screen ──
  if (done) {
    return (
      <>
        <div className="an-atmosphere" aria-hidden="true" />
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--an-bg)", position: "relative", zIndex: 0 }}>
          <div className="w-full max-w-[440px] text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/25 mb-5 animate-success-pop">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-teal-950 dark:text-white mb-2">Account created</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-7 leading-relaxed">
              {done.needsConfirmation
                ? "Please check your email and confirm your address, then sign in to your worker account."
                : "Your worker account is ready. You can now sign in."}
            </p>
            <button
              onClick={onGoToLogin}
              className="w-full max-w-xs mx-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:-translate-y-0.5"
            >
              Continue to sign in
            </button>
          </div>
        </div>
      </>
    )
  }

  const inputCls =
    "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
  const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5"

  return (
    <>
      <div className="an-atmosphere" aria-hidden="true" />
      <div className="min-h-screen flex flex-col" style={{ background: "var(--an-bg)", position: "relative", zIndex: 0 }}>
        {/* Back link */}
        <div className="px-8 pt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-300 font-medium transition-colors group"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to home
          </button>
        </div>

        {/* Centered card */}
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-[440px]">
            {/* Logo + brand */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/25 mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <h1 className="font-display text-3xl text-teal-950 dark:text-white mb-1">
                Health<span className="text-teal-600">Stats</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Create your health worker account</p>
            </div>

            {/* Card */}
            <div className="rounded-3xl p-8" style={{ background: "var(--an-glass-bg)", backdropFilter: "blur(24px)", border: "1px solid var(--an-border)", boxShadow: "var(--an-glass-shadow-lg)" }}>
              <h2 className="text-lg font-semibold text-teal-950 dark:text-white mb-1">Sign up</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Register as a health worker. Admin accounts are created by your coordinator.
              </p>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5" role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Full name */}
                <div>
                  <label htmlFor="su-name" className={labelCls}>Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                    <input id="su-name" type="text" autoComplete="name" placeholder="e.g. Amara Diallo" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="su-email" className={labelCls}>Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.5h14a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7a1 1 0 011-1zm0 1l7 4.5 7-4.5" />
                      </svg>
                    </span>
                    <input id="su-email" type="email" autoComplete="email" placeholder="e.g. name@clinic.org" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                  </div>
                </div>

                {/* Clinic */}
                <div>
                  <label htmlFor="su-clinic" className={labelCls}>Clinic (optional)</label>
                  <select
                    id="su-clinic"
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  >
                    <option value="">{clinicsError ? "Could not load clinics — assign later" : "Select your clinic (or assign later)"}</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.zone ? ` — ${c.zone}` : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="su-password" className={labelCls}>Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input id="su-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls.replace("pr-4", "pr-11")} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="su-confirm" className={labelCls}>Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input id="su-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <button onClick={onGoToLogin} className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-semibold transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
