import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { useAuth } from "./AuthContext"
import { initials, shortId } from "./lib/types"

/**
 * Read-only "My Profile" for the signed-in staff member. All identity data comes
 * from the authenticated staff record (AuthContext) — nothing is hardcoded. The
 * clinic name and account email are resolved best-effort from Supabase.
 */
const roleLabel = (role: string | undefined) =>
  role === "admin" ? "Administrator" : role === "worker" ? "Health Worker" : "—"

export default function StaffProfilePage() {
  const { profile } = useAuth()
  const [clinicName, setClinicName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        // Best-effort account email from the real staff row (may not exist for demo).
        if (profile?.id) {
          const { data } = await supabase
            .from("staff")
            .select("email")
            .eq("id", profile.id)
            .maybeSingle()
          if (!cancelled && data?.email) setEmail(data.email)
        }
        if (profile?.clinic_id) {
          const { data } = await supabase
            .from("clinics")
            .select("name")
            .eq("id", profile.clinic_id)
            .maybeSingle()
          if (!cancelled) setClinicName(data?.name ?? null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [profile?.id, profile?.clinic_id])

  if (!profile) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-24 text-center max-w-3xl mx-auto w-full"
      >
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          You are not signed in.
        </p>
      </div>
    )
  }

  const clinicDisplay =
    profile.clinic_id === null
      ? "All clinics (system-level)"
      : loading
        ? "Loading…"
        : (clinicName ?? "—")

  const rows: { label: string; value: string }[] = [
    { label: "Full name", value: profile.name },
    { label: "Role", value: roleLabel(profile.role) },
    { label: "Assigned clinic", value: clinicDisplay },
    { label: "Staff ID", value: shortId(profile.id) },
  ]
  if (email) rows.push({ label: "Account email", value: email })

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto pb-10 w-full">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-teal-500 to-teal-700" />
        <div className="px-6 py-5 flex flex-col sm:flex-row items-start gap-5">
          <div
            className="w-20 h-20 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-display text-2xl shadow-md shadow-teal-600/20 flex-shrink-0"
            aria-hidden="true"
          >
            {initials(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-teal-950 dark:text-white leading-tight">
              {profile.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full">
                {roleLabel(profile.role)}
              </span>
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {shortId(profile.id)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account details */}
      <section
        aria-labelledby="profile-account-heading"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-5"
      >
        <h2
          id="profile-account-heading"
          className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4"
        >
          Account details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {label}
              </dt>
              <dd className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5 break-words">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-5">
          This information comes from your staff record. To change your name,
          role or clinic assignment, contact your clinic administrator.
        </p>
      </section>
    </div>
  )
}
