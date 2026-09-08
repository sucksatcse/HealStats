import { useEffect, useState, useCallback } from "react"
import { supabase } from "./lib/supabase"
import { SYMPTOM_CATEGORIES, URGENCY_LEVELS } from "./VitalsPage"
import { offlineDb } from "./lib/offlineDb"
import { useTranslation } from "react-i18next"

// ── Types (mirror supabase schema) ──────────────────────────────────────────
type Patient = {
  id: string
  name: string
  age: number | null
  sex: string | null
  village: string | null
  created_at: string
  clinics: { name: string; zone?: string | null; address?: string | null } | null
  isOfflinePending?: boolean
}

type Vitals = Partial<
  Record<
    | "systolic"
    | "diastolic"
    | "temperature"
    | "pulse"
    | "weight"
    | "spo2"
    | "respRate"
    | "muac",
    number
  >
>

type Visit = {
  id: string
  created_at: string
  vitals: Vitals | null
  symptoms: string | null
  symptom_category: string | null
  diagnosis: string | null
  urgency_score: number | null
  synced_at: string | null
  staff: { name: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const shortId = (id: string) => id.split("-")[0].toUpperCase()

const fmtDate = (iso: string, withYear = true) => {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
    })
  } catch {
    return iso
  }
}

const fmtTime = (iso: string) => {
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

const CAT_KEY: Record<string, string> = {
  "diarrhea/gastrointestinal": "cat_gi",
  "fever": "cat_fever",
  "respiratory": "cat_respiratory",
  "skin/rash": "cat_skin",
  "other": "cat_other",
}

const categoryLabel = (v: string | null) =>
  SYMPTOM_CATEGORIES.find((c) => c.value === v)?.label ?? v ?? "—"

const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return (
    parts.length > 1 ? parts[0][0] + parts[1][0] : name.substring(0, 2)
  ).toUpperCase()
}

// ── Sparkline SVG ──────────────────────────────────────────────────────────────
function Sparkline({
  data,
  color,
  minVal,
  maxVal,
  height = 48,
  width = 200,
}: {
  data: number[]
  color: string
  minVal: number
  maxVal: number
  height?: number
  width?: number
}) {
  const pad = { x: 8, y: 6 }
  const w = width - pad.x * 2
  const h = height - pad.y * 2
  const range = maxVal - minVal || 1

  const pts = data.map((v, i) => ({
    x: pad.x + (i / Math.max(1, data.length - 1)) * w,
    y: pad.y + h - ((v - minVal) / range) * h,
  }))

  const path = pts.reduce(
    (acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`),
    "",
  )

  const fillPath = `${path} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient
          id={`grad-${color.replace(/[^a-z0-9]/gi, "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}

// ── Urgency Visual System (Section 15 of skill) ────────────────────────────────
function UrgencyBadge({
  score,
  size = "md",
}: {
  score: number | null
  size?: "sm" | "md" | "lg"
}) {
  const { t } = useTranslation()

  if (score === 5) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-red-600 text-white shadow-sm shadow-red-600/30 ${
          size === "sm"
            ? "text-[10px] px-2 py-0.5"
            : size === "lg"
            ? "text-xs px-3 py-1"
            : "text-[11px] px-2.5 py-0.5"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{t("profile:level", "Level")} 5 · {t("urgency:Critical", "Critical")}</span>
      </span>
    )
  }

  if (score === 4) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-orange-500 text-white shadow-sm shadow-orange-500/25 ${
          size === "sm"
            ? "text-[10px] px-2 py-0.5"
            : size === "lg"
            ? "text-xs px-3 py-1"
            : "text-[11px] px-2.5 py-0.5"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>{t("profile:level", "Level")} 4 · {t("urgency:High", "High")}</span>
      </span>
    )
  }

  if (score === 3) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 ${
          size === "sm"
            ? "text-[10px] px-2 py-0.5"
            : size === "lg"
            ? "text-xs px-3 py-1"
            : "text-[11px] px-2.5 py-0.5"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{t("profile:level", "Level")} 3 · {t("urgency:Moderate", "Moderate")}</span>
      </span>
    )
  }

  if (score === 2) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 ${
          size === "sm"
            ? "text-[10px] px-2 py-0.5"
            : size === "lg"
            ? "text-xs px-3 py-1"
            : "text-[11px] px-2.5 py-0.5"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>{t("profile:level", "Level")} 2 · {t("urgency:Low", "Low")}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${
        size === "sm"
          ? "text-[10px] px-2 py-0.5"
          : size === "lg"
          ? "text-xs px-3 py-1"
          : "text-[11px] px-2.5 py-0.5"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <span>{t("profile:level", "Level")} 1 · {t("urgency:Stable", "Stable")}</span>
    </span>
  )
}

// ── Tab bar definition ─────────────────────────────────────────────────────────
const TABS = [
  { id: "vitals", labelKey: "profile:vitalsHistory", defaultLabel: "Vitals History" },
  { id: "visits", labelKey: "profile:visitHistory", defaultLabel: "Visit History" },
  { id: "diagnosis", labelKey: "profile:diagnoses", defaultLabel: "Diagnoses" },
]

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10 w-full animate-pulse" role="status" aria-label="Loading patient record">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-64 shadow-sm" />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PatientDetailPage({
  patientId,
  onNewVisit,
  onBack,
}: {
  patientId?: string | null
  onNewVisit?: (patientId: string) => void
  onBack?: () => void
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<"vitals" | "visits" | "diagnosis">("vitals")
  const [visitExpanded, setVisitExpanded] = useState<number | null>(0)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedUuid, setCopiedUuid] = useState(false)

  const copyPatientUuid = () => {
    if (!patient?.id) return
    navigator.clipboard.writeText(patient.id)
    setCopiedUuid(true)
    setTimeout(() => setCopiedUuid(false), 2000)
  }

  const loadPatientData = useCallback(async () => {
    if (!patientId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. First attempt to fetch from central Supabase
      const [pRes, vRes] = await Promise.all([
        supabase
          .from("patients")
          .select("id, name, age, sex, village, created_at, clinics ( name, zone, address )")
          .eq("id", patientId)
          .maybeSingle(),
        supabase
          .from("visits")
          .select(
            "id, created_at, vitals, symptoms, symptom_category, diagnosis, urgency_score, synced_at, staff ( name )",
          )
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ])

      if (pRes.data) {
        setPatient((pRes.data as unknown as Patient) ?? null)
        setVisits((vRes.data as unknown as Visit[]) ?? [])
        setVisitExpanded(0)
        setLoading(false)
        return
      }

      // If patient not found on remote, check if there was a network failure
      if (pRes.error) {
        throw pRes.error
      }
    } catch (err: any) {
      console.warn("Remote fetch failed, inspecting offline cache for patient", patientId, err?.message)
    }

    // 2. Offline / Local fallback: check Dexie offlineDb for pending records
    try {
      const pendingPatients = await offlineDb.pendingRecords
        .where("type")
        .equals("patient")
        .toArray()

      const localPatientRecord = pendingPatients.find(
        (r) => r.id === patientId || r.payload?.id === patientId,
      )

      if (localPatientRecord) {
        const p = localPatientRecord.payload
        setPatient({
          id: p.id || localPatientRecord.id,
          name: p.name || t("profile:unnamedPatient", "Unnamed Patient"),
          age: p.age ?? null,
          sex: p.sex ?? null,
          village: p.village ?? null,
          created_at: p.created_at || new Date(localPatientRecord.createdAt).toISOString(),
          clinics: p.clinic_id ? { name: t("profile:localClinicPending", "Local Clinic (Pending Sync)") } : null,
          isOfflinePending: true,
        })

        // Also check for pending visits for this patient
        const pendingVisits = await offlineDb.pendingRecords
          .where("type")
          .equals("visit")
          .toArray()

        const localVisits = pendingVisits
          .filter((v) => v.payload?.patient_id === patientId)
          .map((v) => ({
            id: v.id,
            created_at: v.payload?.created_at || new Date(v.createdAt).toISOString(),
            vitals: v.payload?.vitals || null,
            symptoms: v.payload?.symptoms || null,
            symptom_category: v.payload?.symptom_category || null,
            diagnosis: v.payload?.diagnosis || null,
            urgency_score: v.payload?.urgency_score ?? null,
            synced_at: null,
            staff: { name: t("profile:youSavedLocally", "You (Saved locally)") },
          }))

        setVisits(localVisits)
        setVisitExpanded(0)
        setLoading(false)
        return
      }
    } catch (offlineErr) {
      console.error("Failed checking offline cache:", offlineErr)
    }

    // 3. Neither remote nor local record available
    if (!navigator.onLine) {
      setError(
        t(
          "profile.offlineNotice",
          "You are currently offline. This record is not stored locally and requires an active internet connection to load from Supabase.",
        ),
      )
    } else {
      setError(
        t(
          "profile:recordNotFound",
          "Patient record not found. This record may have been removed or belongs to a clinic outside your access scope.",
        ),
      )
    }
    setLoading(false)
  }, [patientId, t])

  useEffect(() => {
    loadPatientData()
  }, [loadPatientData])

  // Oldest → newest for sparklines & vitals table
  const vitalsHistory = visits
    .filter((v) => v.vitals && Object.keys(v.vitals).length > 0)
    .slice()
    .reverse()
  const latestVitals = vitalsHistory[vitalsHistory.length - 1]?.vitals ?? null
  const latestVisit = visits[0] ?? null
  const diagnosed = visits.filter((v) => v.diagnosis && v.diagnosis.trim())

  const sexDisplay = (s: string | null) => {
    if (s === "F") return t("profile:female", "Female")
    if (s === "M") return t("profile:male", "Male")
    return s || t("profile:unspecified", "Unspecified")
  }

  const catLabel = (v: string | null) =>
    v && CAT_KEY[v] ? t(`vitals:${CAT_KEY[v]}`) : categoryLabel(v)

  // ── No Patient Selected State ─────────────────────────────────────────────
  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-5xl mx-auto w-full px-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500 shadow-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-8 h-8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t("profile:noPatientSelected", "No patient selected")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
          {t("profile:noPatientSelectedBody", "Select a patient from the records directory or register a new intake to view their complete profile.")}
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
          >
            ← {t("profile:backToRecords", "Back to Records")}
          </button>
        )}
      </div>
    )
  }

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return <ProfileSkeleton />
  }

  // ── Error / Offline State ─────────────────────────────────────────────────
  if (error || !patient) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto py-12 px-4 w-full">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="self-start inline-flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t("profile:backToRecords", "Back to Records")}
          </button>
        )}
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 p-8 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center text-center shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-red-900 dark:text-red-200">
            {t("profile:unableToLoad", "Unable to load patient profile")}
          </h2>
          <p className="text-sm mt-1.5 max-w-md text-red-700 dark:text-red-300">
            {error || t("profile:recordNotRetrieved", "Record could not be retrieved from the central database.")}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={loadPatientData}
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
                {t("profile:backToRecords", "Back to Records")}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-12 px-2 sm:px-4 w-full">
      {/* ── Top Navigation Bar / Breadcrumb ── */}
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
            {t("profile:backToRecords", "Back to Records")}
          </button>
          {patient.isOfflinePending && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {t("profile:savedLocally", "Saved locally (Pending Sync)")}
            </span>
          )}
        </div>
      )}

      {/* ── Section 1: Patient Header Card ── */}
      <header className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Teal gradient accent top bar */}
        <div className="h-2 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700" />

        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar / Initials */}
          <div className="relative flex-shrink-0">
            <div
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-display text-2xl shadow-md shadow-teal-600/25 select-none"
              aria-hidden="true"
            >
              {initialsOf(patient.name)}
            </div>
            {patient.isOfflinePending && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900"
                title="Saved locally on device"
              />
            )}
          </div>

          {/* Identity & Header Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl text-teal-950 dark:text-white leading-tight">
                  {patient.name}
                </h1>

                {/* Sub-identity pill strip */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {patient.age ?? "—"} {t("profile:yrs", "yrs")}
                  </span>
                  <span>·</span>
                  <span>{sexDisplay(patient.sex)}</span>
                  <span>·</span>
                  <span>{patient.village ?? t("profile:villageUnrecorded", "Village unrecorded")}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={copyPatientUuid}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title={t("profile:clickCopyUuid", { id: patient.id })}
                  >
                    <span>{t("profile:idShort", "ID")}: {shortId(patient.id)}</span>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" />
                      <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" />
                    </svg>
                    {copiedUuid && (
                      <span className="text-[10px] text-emerald-600 font-bold ml-0.5">
                        {t("profile:copied", "Copied")}
                      </span>
                    )}
                  </button>
                </div>

                {/* Current Urgency & Symptom Category */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <UrgencyBadge score={latestVisit?.urgency_score ?? null} size="md" />
                  {latestVisit?.symptom_category && (
                    <span className="text-[11px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 px-2.5 py-0.5 rounded-full">
                      {catLabel(latestVisit.symptom_category)}
                    </span>
                  )}
                  {patient.clinics?.name && (
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      📍 {patient.clinics.name} {patient.clinics.zone ? `(${patient.clinics.zone})` : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Actions */}
              {onNewVisit && (
                <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => onNewVisit(patient.id)}
                    className="flex items-center gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
                    </svg>
                    {t("profile:newVisit", "New Visit")}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Meta Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t("profile:registered", "Registered")}
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {fmtDate(patient.created_at)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t("profile:totalVisits", "Total Visits")}
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {t("profile:visitsCount", { count: visits.length })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t("profile:lastVisit", "Last Visit")}
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {latestVisit ? fmtDate(latestVisit.created_at) : t("profile:noVisitsRecorded", "No visits recorded")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t("profile:clinic", "Clinic")}
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                  {patient.clinics?.name ?? t("profile:assignedClinic", "Assigned Clinic")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Section 2: Patient Information & Latest Health Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Demographics & Registration details */}
        <section
          aria-labelledby="patient-info-heading"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 id="patient-info-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t("profile:patientInfo", "Patient Information")}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              {shortId(patient.id)}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-sm">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:age", "Age")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {patient.age ? t("profile:ageYears", { count: patient.age }) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:sex", "Sex")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {sexDisplay(patient.sex)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:villageUnion", "Village / Union")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {patient.village || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:registrationDate", "Registration Date")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {fmtDate(patient.created_at)}
              </dd>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:assignedClinicFacility", "Assigned Clinic / Facility")}
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {patient.clinics?.name || t("profile:primaryFacility", "Primary Healthcare Facility")}
                {patient.clinics?.zone && (
                  <span className="ml-1.5 text-xs font-normal text-slate-500">
                    ({patient.clinics.zone})
                  </span>
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("profile:patientUuidInternal", "Patient UUID (Internal ID)")}
              </dt>
              <dd className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-all select-all">
                {patient.id}
              </dd>
            </div>
          </dl>
        </section>

        {/* Right Column: Latest Health Information Summary */}
        <section
          aria-labelledby="latest-health-heading"
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 id="latest-health-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t("profile:latestHealthInfo", "Latest Health Information")}
            </h2>
            {latestVisit && (
              <span className="text-xs text-slate-400">
                {fmtDate(latestVisit.created_at)} · {fmtTime(latestVisit.created_at)}
              </span>
            )}
          </div>

          {!latestVisit ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t("profile:noVisits", "No visits recorded yet")}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {t("profile:noVisitsBody", 'No clinical encounters have been filed for this patient. Click "New Visit" above to enter vitals, chief complaints, and diagnosis.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary triage & diagnosis banner */}
              <div className="flex flex-wrap items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {t("profile:latestAssessment", "Latest Assessment / Diagnosis")}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {latestVisit.diagnosis || t("profile:noRecordedDiagnosis", "No recorded diagnosis")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("profile:presentingLabel", "Presenting")}: {latestVisit.symptoms || t("profile:noneDocumented", "None documented")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <UrgencyBadge score={latestVisit.urgency_score} size="md" />
                  <span className="text-[11px] text-slate-400">
                    {t("profile:recordedByLabel", "Recorded by")}: {latestVisit.staff?.name ?? t("profile:healthcareWorker", "Healthcare Worker")}
                  </span>
                </div>
              </div>

              {/* Latest Vitals Strip */}
              {latestVitals && Object.keys(latestVitals).length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    {t("profile:latestMeasuredVitals", "Latest Measured Vitals")}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        label: t("profile:bloodPressure", "Blood Pressure"),
                        value: latestVitals.systolic ? `${latestVitals.systolic}/${latestVitals.diastolic ?? "—"}` : null,
                        unit: "mmHg",
                        flag: (latestVitals.systolic ?? 0) >= 140,
                      },
                      {
                        label: t("profile:temperature", "Temperature"),
                        value: latestVitals.temperature ?? null,
                        unit: "°C",
                        flag: (latestVitals.temperature ?? 0) >= 38,
                      },
                      {
                        label: t("profile:pulseRate", "Pulse Rate"),
                        value: latestVitals.pulse ?? null,
                        unit: "bpm",
                        flag: (latestVitals.pulse ?? 0) > 100,
                      },
                      {
                        label: t("profile:oxygenSaturation", "Oxygen Saturation"),
                        value: latestVitals.spo2 ?? null,
                        unit: "%",
                        flag: latestVitals.spo2 !== undefined && latestVitals.spo2 < 95,
                      },
                    ].map((v) => (
                      <div
                        key={v.label}
                        className={`p-2.5 rounded-xl border ${
                          v.flag
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <p className="text-[10px] font-semibold text-slate-400">{v.label}</p>
                        <p className={`text-base font-display mt-0.5 ${v.flag ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-800 dark:text-slate-100"}`}>
                          {v.value ?? "—"}{" "}
                          <span className="text-[10px] font-normal text-slate-400">{v.value ? v.unit : ""}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">{t("profile:noVitalsLatest", "No vitals were recorded on the latest visit.")}</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Section 3: Clinical Detail Tabs (Vitals, Visits, Diagnoses) ── */}
      <div role="tablist" className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mt-2">
        {TABS.map(({ id, labelKey, defaultLabel }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id as typeof tab)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              tab === id
                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t(labelKey, defaultLabel)}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — Vitals History
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "vitals" && vitalsHistory.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("profile:noVitals", "No vitals recorded yet")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {t("profile:noVitalsBody", "Measurements such as Blood Pressure, Pulse, Temperature, and SpO₂ entered during visits will appear here with trend sparklines.")}
          </p>
        </div>
      )}

      {tab === "vitals" && vitalsHistory.length > 0 && latestVitals && (
        <div className="flex flex-col gap-5">
          {/* Sparklines grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                {
                  key: "systolic",
                  label: t("profile:systolicBP", "Systolic BP"),
                  unit: "mmHg",
                  color: "#ef4444",
                  min: 80,
                  max: 180,
                  flag: (n: number) => n >= 140,
                  flagLabel: t("profile:elevated", "Elevated"),
                },
                {
                  key: "temperature",
                  label: t("profile:temperature", "Temperature"),
                  unit: "°C",
                  color: "#f59e0b",
                  min: 35,
                  max: 40,
                  flag: (n: number) => n >= 38,
                  flagLabel: t("profile:fever", "Fever"),
                },
                {
                  key: "pulse",
                  label: t("profile:pulseRate", "Pulse Rate"),
                  unit: "bpm",
                  color: "#8b5cf6",
                  min: 40,
                  max: 140,
                  flag: (n: number) => n > 100,
                  flagLabel: t("profile:tachycardia", "Tachycardia"),
                },
                {
                  key: "spo2",
                  label: t("profile:oxygenSpo2", "Oxygen (SpO₂)"),
                  unit: "%",
                  color: "#0d9488",
                  min: 85,
                  max: 100,
                  flag: (n: number) => n < 95,
                  flagLabel: t("profile:hypoxiaRisk", "Hypoxia Risk"),
                },
              ] as const
            ).map(({ key, label, unit, color, min, max, flag, flagLabel }) => {
              const series = vitalsHistory.filter(
                (v) => typeof v.vitals?.[key] === "number",
              )
              const data = series.map((v) => v.vitals![key] as number)
              const lv = data[data.length - 1]
              const status =
                lv === undefined ? null : flag(lv) ? flagLabel : t("profile:normal", "Normal")

              return (
                <div
                  key={label}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-2 overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {label}
                    </p>
                    {status && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          status === "Normal"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl text-slate-900 dark:text-white">
                      {lv ?? "—"}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {unit}
                    </span>
                  </div>
                  <div className="h-12 -mx-1 flex items-center justify-center">
                    {data.length >= 2 ? (
                      <Sparkline
                        data={data}
                        color={color}
                        minVal={Math.min(min, ...data)}
                        maxVal={Math.max(max, ...data)}
                        height={48}
                        width={180}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {data.length === 0
                          ? t("profile:notRecorded", "Not recorded")
                          : t("profile:trendNeeds", "Trend needs 2+ readings")}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>
                      {series[0] ? fmtDate(series[0].created_at, false) : ""}
                    </span>
                    {data.length >= 2 && <span className="font-semibold">{t("profile:trend", "Trend")}</span>}
                    <span>
                      {series.length > 1
                        ? fmtDate(series[series.length - 1].created_at, false)
                        : ""}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vitals Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t("profile:allRecordedVitals", "All Recorded Vitals")} — {t("profile:visitsCount", { count: vitalsHistory.length })}
              </h3>
              <span className="text-xs text-slate-400">{t("profile:oldestNewest", "Oldest → Newest")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    {[
                      t("profile:colDate", "Date"),
                      t("profile:colSysDia", "Sys / Dia (mmHg)"),
                      t("profile:colTemp", "Temp (°C)"),
                      t("profile:colPulse", "Pulse (bpm)"),
                      t("profile:colWeight", "Weight (kg)"),
                      t("profile:colSpo2", "SpO₂ (%)"),
                      t("profile:colResp", "Resp (/min)"),
                      t("profile:colMuac", "MUAC (cm)"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vitalsHistory.map((v, i) => {
                    const isLatest = i === vitalsHistory.length - 1
                    const vt = v.vitals ?? {}
                    return (
                      <tr
                        key={v.id}
                        className={`${
                          isLatest
                            ? "bg-teal-50/50 dark:bg-teal-950/30 font-medium"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        } transition-colors`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-slate-800 dark:text-slate-200">
                            {fmtDate(v.created_at)}
                          </span>
                          {isLatest && (
                            <span className="ml-2 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-full">
                              {t("profile:latestBadge", "Latest")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              (vt.systolic ?? 0) >= 140
                                ? "text-amber-600 dark:text-amber-400 font-semibold"
                                : "text-slate-700 dark:text-slate-200"
                            }
                          >
                            {vt.systolic ?? "—"}/{vt.diastolic ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={(vt.temperature ?? 0) >= 38 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-200"}>
                            {vt.temperature ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={(vt.pulse ?? 0) > 100 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-200"}>
                            {vt.pulse ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{vt.weight ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={vt.spo2 !== undefined && vt.spo2 < 95 ? "text-red-600 dark:text-red-400 font-bold" : "text-slate-700 dark:text-slate-200"}>
                            {vt.spo2 ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{vt.respRate ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{vt.muac ?? "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — Visit History
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "visits" && visits.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("profile:noVisits", "No visits recorded yet")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {t("profile:visitsBody", 'Use “New Visit” to record an intake visit, vitals, symptoms, and clinical assessment for this patient.')}
          </p>
        </div>
      )}

      {tab === "visits" && visits.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              {t("profile:encountersCount", { count: visits.length })}
            </span>
            {visits.every((v) => v.synced_at) ? (
              <span className="text-teal-600 dark:text-teal-400 font-medium">
                {t("profile:allSynced", "✓ All synchronized with central database")}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {t("profile:pendingSyncCount", { count: visits.filter((v) => !v.synced_at).length })}
              </span>
            )}
          </div>

          {/* Timeline list */}
          <div className="relative">
            {/* Vertical timeline connector */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex flex-col gap-3">
              {visits.map((v, i) => {
                const open = visitExpanded === i
                return (
                  <div key={v.id} className="flex gap-4">
                    {/* Node marker */}
                    <div className="flex-shrink-0 flex flex-col items-center mt-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold z-10 border-2 ${
                          i === 0
                            ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/25"
                            : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        #{visits.length - i}
                      </div>
                    </div>

                    {/* Visit Card */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setVisitExpanded(open ? null : i)}
                        aria-expanded={open}
                        className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                              {fmtDate(v.created_at)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {fmtTime(v.created_at)}
                            </span>
                            <UrgencyBadge score={v.urgency_score} size="sm" />
                            {v.symptom_category && (
                              <span className="text-[10px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full">
                                {catLabel(v.symptom_category)}
                              </span>
                            )}
                            {v.synced_at ? (
                              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                {t("profile:syncedTag", "✓ Synced")}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                {t("profile:pendingSyncTag", "Pending sync")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                            {v.diagnosis ? t("profile:dxPrefix", { dx: v.diagnosis }) : ""}
                            {v.symptoms || t("profile:noChiefComplaint", "No chief complaint documented")}
                          </p>
                        </div>
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className={`w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform mt-1 ${
                            open ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                        </svg>
                      </button>

                      {open && (
                        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 grid sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              {t("profile:attendingClinician", "Attending Clinician")}
                            </p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {v.staff?.name ?? t("profile:healthcareProvider", "Healthcare Provider")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              {t("profile:symptomCategory", "Symptom Category")}
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-200">
                              {catLabel(v.symptom_category)}
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              {t("profile:presentingChief", "Presenting Symptoms / Chief Complaint")}
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                              {v.symptoms || t("profile:noneRecorded", "None recorded")}
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              {t("profile:diagnosisAssessment", "Diagnosis / Clinical Assessment")}
                            </p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                              {v.diagnosis || t("profile:noFormalDiagnosis", "No formal diagnosis documented on this visit")}
                            </p>
                          </div>
                          {v.vitals && Object.keys(v.vitals).length > 0 && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                {t("profile:measuredVitals", "Measured Vitals")}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(
                                  [
                                    ["systolic", t("profile:vBpSys", "BP Sys"), "mmHg"],
                                    ["diastolic", t("profile:vBpDia", "BP Dia"), "mmHg"],
                                    ["temperature", t("profile:vTemp", "Temp"), "°C"],
                                    ["pulse", t("profile:vPulse", "Pulse"), "bpm"],
                                    ["spo2", t("profile:vSpo2", "SpO₂"), "%"],
                                    ["respRate", t("profile:vResp", "Resp"), "/min"],
                                    ["weight", t("profile:vWeight", "Weight"), "kg"],
                                    ["muac", t("profile:vMuac", "MUAC"), "cm"],
                                  ] as const
                                )
                                  .filter(([k]) => v.vitals?.[k] !== undefined)
                                  .map(([k, lbl, unit]) => (
                                    <span
                                      key={k}
                                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200"
                                    >
                                      <span className="text-slate-400 font-medium mr-1">
                                        {lbl}
                                      </span>
                                      <span className="font-bold">
                                        {v.vitals![k]}
                                      </span>
                                      <span className="text-slate-400 ml-0.5">
                                        {unit}
                                      </span>
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — Diagnoses
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "diagnosis" && diagnosed.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("profile:noDiagnoses", "No diagnoses recorded yet")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {t("profile:diagnosesBody", "Clinical assessments and diagnoses entered during intake encounters will be summarized chronologically here.")}
          </p>
        </div>
      )}

      {tab === "diagnosis" && diagnosed.length > 0 && (
        <div className="flex flex-col gap-4">
          {diagnosed.map((v) => (
            <div
              key={v.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {fmtDate(v.created_at)}
                    </h3>
                    <UrgencyBadge score={v.urgency_score} size="sm" />
                    {v.symptom_category && (
                      <span className="text-[10px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full">
                        {catLabel(v.symptom_category)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {fmtTime(v.created_at)} · {t("profile:recordedByShort", { name: v.staff?.name ?? t("profile:attendingClinician", "Attending Clinician") })}
                  </p>
                </div>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    {t("profile:diagnosisAssessment", "Diagnosis / Clinical Assessment")}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {v.diagnosis}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    {t("profile:presentingSymptoms", "Presenting Symptoms")}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 whitespace-pre-line">
                    {v.symptoms || t("profile:noSymptoms", "No symptoms recorded")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
