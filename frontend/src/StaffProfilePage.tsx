import { useEffect, useState, useCallback } from "react"
import { supabase } from "./lib/supabase"
import { useAuth } from "./AuthContext"
import { initials, shortId } from "./lib/types"
import { useTranslation } from "react-i18next"

interface StaffClinic {
  id?: string
  name: string
  zone?: string | null
  address?: string | null
}

interface StaffData {
  id: string
  name: string
  role: "worker" | "admin" | string
  clinic_id: string | null
  email: string | null
  auth_user_id?: string | null
  clinics?: StaffClinic | null
}

interface StaffProfilePageProps {
  staffId?: string | null
  onBack?: () => void
}

export default function StaffProfilePage({ staffId, onBack }: StaffProfilePageProps) {
  const { profile: authProfile } = useAuth()
  const { t } = useTranslation()

  const isSelfProfile = !staffId || staffId === authProfile?.id
  const effectiveStaffId = staffId || authProfile?.id

  const [staff, setStaff] = useState<StaffData | null>(() => {
    if (isSelfProfile && authProfile) {
      return {
        id: authProfile.id,
        name: authProfile.name,
        role: authProfile.role,
        clinic_id: authProfile.clinic_id,
        email: null,
      }
    }
    return null
  })
  const [clinic, setClinic] = useState<StaffClinic | null>(null)
  const [totalVisits, setTotalVisits] = useState<number | null>(null)
  const [lastVisitAt, setLastVisitAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !(isSelfProfile && authProfile))
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  const copyId = () => {
    if (!effectiveStaffId) return
    navigator.clipboard.writeText(effectiveStaffId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const loadProfile = useCallback(async () => {
    if (!effectiveStaffId) {
      setLoading(false)
      return
    }

    if (!(isSelfProfile && authProfile)) {
      setLoading(true)
    }
    setError(null)

    try {
      // 1. Load staff record & clinic info
      if (staffId && staffId !== authProfile?.id) {
        // Admin inspecting another staff member
        const { data, error: staffErr } = await supabase
          .from("staff")
          .select("id, name, role, clinic_id, auth_user_id, email, clinics ( id, name, zone, address )")
          .eq("id", staffId)
          .maybeSingle()

        if (staffErr) throw staffErr
        if (!data) throw new Error("Staff member record not found in the database.")

        setStaff(data as unknown as StaffData)
        if (data.clinics) {
          setClinic(data.clinics as unknown as StaffClinic)
        } else {
          setClinic(null)
        }
      } else if (authProfile) {
        // Self profile from auth context
        let currentStaff: StaffData = {
          id: authProfile.id,
          name: authProfile.name,
          role: authProfile.role,
          clinic_id: authProfile.clinic_id,
          email: null,
        }

        try {
          // Fetch clinic details & email for authenticated user
          const [staffRes, clinicRes] = await Promise.all([
            supabase
              .from("staff")
              .select("email, clinics ( id, name, zone, address )")
              .eq("id", authProfile.id)
              .maybeSingle(),
            authProfile.clinic_id
              ? supabase
                  .from("clinics")
                  .select("id, name, zone, address")
                  .eq("id", authProfile.clinic_id)
                  .maybeSingle()
              : Promise.resolve({ data: null, error: null }),
          ])

          if (staffRes.data?.email) {
            currentStaff.email = staffRes.data.email
          }
          if (staffRes.data?.clinics) {
            setClinic(staffRes.data.clinics as unknown as StaffClinic)
          } else if (clinicRes.data) {
            setClinic(clinicRes.data as unknown as StaffClinic)
          } else {
            setClinic(null)
          }
        } catch (enrichErr) {
          console.warn("Could not enrich staff profile details:", enrichErr)
        }

        setStaff(currentStaff)
      }

      // 2. Fetch clinical activity statistics for this staff member (read-only)
      try {
        const [countRes, lastVisitRes] = await Promise.all([
          supabase
            .from("visits")
            .select("id", { count: "exact", head: true })
            .eq("staff_id", effectiveStaffId),
          supabase
            .from("visits")
            .select("created_at")
            .eq("staff_id", effectiveStaffId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        if (countRes.count !== null && countRes.count !== undefined) {
          setTotalVisits(countRes.count)
        }
        if (lastVisitRes.data?.created_at) {
          setLastVisitAt(lastVisitRes.data.created_at)
        }
      } catch (statsErr) {
        console.warn("Could not retrieve staff visit metrics:", statsErr)
      }
    } catch (err: any) {
      console.error("Failed loading staff profile:", err)
      setError(err?.message || t("profile:failedLoadStaff", "Failed to load staff profile information."))
    } finally {
      setLoading(false)
    }
  }, [effectiveStaffId, staffId, authProfile, isSelfProfile])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const roleDisplay = (role: string | undefined) => {
    if (role === "admin") return t("profile:administrator", "Administrator")
    if (role === "worker") return t("profile:healthWorker", "Health Worker")
    return role || "—"
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return iso
    }
  }

  const fmtTime = (iso: string | null) => {
    if (!iso) return ""
    try {
      return new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return ""
    }
  }

  // ── Unauthenticated / Not signed in ───────────────────────────────────────
  if (!effectiveStaffId && !loading) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-24 text-center max-w-3xl mx-auto w-full px-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          {t("profile:notSignedIn", "You are not signed in")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          {t("profile:notSignedInBody", "Please sign in with your staff credentials to view your profile and clinic assignment.")}
        </p>
      </div>
    )
  }

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-10 px-2 sm:px-4 w-full animate-pulse" role="status" aria-label={t("profile:loadingStaff", "Loading staff profile")}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-28" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-48 shadow-sm" />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-48 shadow-sm" />
        </div>
      </div>
    )
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error || !staff) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto py-12 px-4 w-full">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="self-start inline-flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t("profile:backToStaff", "Back to Staff Management")}
          </button>
        )}
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 p-8 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center text-center shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-red-900 dark:text-red-200">
            {t("profile:unableLoadStaff", "Unable to load staff profile")}
          </h2>
          <p className="text-sm mt-1.5 max-w-md text-red-700 dark:text-red-300">
            {error || t("profile:staffRecordNotLoaded", "Staff record could not be loaded.")}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={loadProfile}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 8A6 6 0 1 1 8 2M14 2v6h-6" />
              </svg>
              {t("profile:retry", "Retry")}
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors cursor-pointer"
              >
                {t("profile:backToStaff", "Back to Staff Management")}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const clinicDisplay =
    staff.clinic_id === null
      ? t("profile:allClinics", "All clinics (district-level)")
      : clinic?.name
      ? clinic.name
      : (isSelfProfile && authProfile?.clinic_name)
      ? authProfile.clinic_name
      : t("profile:unassignedClinicStaff", "Unassigned Clinic")

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-12 px-2 sm:px-4 w-full">
      {/* ── Top Back Navigation (if provided) ── */}
      {onBack && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isSelfProfile ? t("profile:backToDashboard", "Back to Dashboard") : t("profile:backToStaff", "Back to Staff Management")}
          </button>
          <span className="text-xs text-slate-400">
            {isSelfProfile ? t("profile:myProfile", "My Profile") : t("profile:staffProfile", "Staff Profile")}
          </span>
        </div>
      )}

      {/* ── Section 1: Staff Header Card ── */}
      <header className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700" />
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar with Initials */}
          <div
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-display text-2xl shadow-md shadow-teal-600/25 flex-shrink-0 select-none"
            aria-hidden="true"
          >
            {initials(staff.name)}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl text-teal-950 dark:text-white leading-tight">
                  {staff.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {staff.email || t("profile:noEmailLinked", "No email linked")} · {t("profile:facilityLabel", "Facility")}: {clinicDisplay}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    staff.role === "admin"
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                      : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
                  }`}
                >
                  {roleDisplay(staff.role)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("profile:active", "Active")}
                </span>
              </div>
            </div>

            {/* Quick Identifier Pill Bar */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={copyId}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                title={t("profile:clickCopyUuid", { id: staff.id })}
              >
                <span>{t("profile:idShort", "ID")}: {shortId(staff.id)}</span>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" />
                  <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" />
                </svg>
                {copiedId && (
                  <span className="text-[10px] text-emerald-600 font-bold ml-1">
                    {t("profile:copied", "Copied")}
                  </span>
                )}
              </button>

              {clinic?.zone && (
                <span className="text-slate-500 dark:text-slate-400">
                  {t("profile:catchmentZone", "Catchment Zone")}: <strong className="text-slate-700 dark:text-slate-300">{clinic.zone}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Section 2: Professional Details & Account Information ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Professional Details Card */}
        <section
          aria-labelledby="prof-info-heading"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
        >
          <h2 id="prof-info-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
            {t("profile:professionalInfo", "Professional Information")}
          </h2>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-3 text-sm">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:staffId", "Staff ID")}
              </dt>
              <dd className="font-mono text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                {shortId(staff.id)}
              </dd>
            </div>

            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:clinicalRole", "Clinical Role")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {roleDisplay(staff.role)}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:accountEmail", "Account Email")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 break-words">
                {staff.email || t("profile:noEmailAssociated", "No email associated")}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:assignedFacility", "Assigned Health Facility / Clinic")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {clinicDisplay}
              </dd>
              {clinic?.address && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {clinic.address}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:staffDbUuid", "Staff Database UUID")}
              </dt>
              <dd className="font-mono text-[11px] text-slate-400 mt-0.5 break-all select-all">
                {staff.id}
              </dd>
            </div>
          </dl>
        </section>

        {/* Account & Security Card */}
        <section
          aria-labelledby="security-heading"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
        >
          <h2 id="security-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
            {t("profile:accountDetails", "Account details")}
          </h2>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-3 text-sm">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:authMethod", "Authentication Method")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {t("profile:authMethodVal", "Supabase Auth (Encrypted)")}
              </dd>
            </div>

            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:sessionStatus", "Session Status")}
              </dt>
              <dd className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t("profile:verifiedActive", "Verified Active")}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:dataAccessBoundary", "Data Access Boundary")}
              </dt>
              <dd className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {staff.role === "admin"
                  ? t("profile:boundaryAdmin", "District-wide oversight across all clinic catchments, outbreak surveillance radar, resource reallocation, and staff administration.")
                  : t("profile:boundaryWorker", { clinic: clinicDisplay })}
              </dd>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                {t("profile:dataSafetyNote", "🔒 HealthStats enforces strict data safety standards. Cryptographic keys and authentication secrets are never saved in local storage. For role changes or credential resets, please contact your district coordinator.")}
              </p>
            </div>
          </dl>
        </section>
      </div>

      {/* ── Section 3: Clinical Activity & Service Overview ── */}
      <section
        aria-labelledby="activity-heading"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 id="activity-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t("profile:clinicalActivity", "Clinical Activity Summary")}
          </h2>
          <span className="text-xs text-slate-400">
            {t("profile:liveMetrics", "Live Central Database Metrics")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("profile:totalRecordedVisits", "Total Recorded Visits")}
            </p>
            <p className="text-2xl font-display text-teal-900 dark:text-teal-300 mt-1">
              {totalVisits !== null ? totalVisits : "—"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t("profile:encountersUnderProvider", "Encounters filed under this provider")}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("profile:lastClinicalActivity", "Last Clinical Activity")}
            </p>
            <p className="text-lg font-display text-slate-800 dark:text-slate-100 mt-1">
              {lastVisitAt ? fmtDate(lastVisitAt) : t("profile:noEncountersRecorded", "No encounters recorded")}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lastVisitAt ? t("profile:atTime", { time: fmtTime(lastVisitAt) }) : t("profile:awaitingFirstEncounter", "Awaiting first encounter")}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("profile:operationalZone", "Operational Zone")}
            </p>
            <p className="text-lg font-display text-slate-800 dark:text-slate-100 mt-1">
              {clinic?.zone || t("profile:nationalNetwork", "National Network")}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t("profile:bdRuralHealth", "Bangladesh Rural Health Command")}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
