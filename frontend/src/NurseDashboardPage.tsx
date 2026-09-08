import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "./AuthContext"
import { useTheme } from "./ThemeContext"
import AppNavbar from "./AppNavbar"
import { supabase } from "./lib/supabase"
import { offlineDb } from "./lib/offlineDb"
import { updatePatientUrgency } from "./lib/adminService"

export type Urgency = "Critical" | "High" | "Moderate" | "Low" | "Stable"

export function urgencyFromScore(score: number | null | undefined): Urgency {
  switch (score) {
    case 5:
      return "Critical"
    case 4:
      return "High"
    case 3:
      return "Moderate"
    case 2:
      return "Low"
    default:
      return "Stable"
  }
}

// ── Urgency Configuration ───────────────────────────────────────────────────
const URGENCY_LEVELS_MAP: Record<Urgency, { score: number; label: string; desc: string; badgeCls: string; dotCls: string }> = {
  Critical: {
    score: 5,
    label: "Critical (Level 5)",
    desc: "Immediate physician escalation required. Severe vital instability.",
    badgeCls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60",
    dotCls: "bg-red-500",
  },
  High: {
    score: 4,
    label: "High (Level 4)",
    desc: "Urgent nursing attention required within 15–30 minutes.",
    badgeCls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900/60",
    dotCls: "bg-orange-500",
  },
  Moderate: {
    score: 3,
    label: "Moderate (Level 3)",
    desc: "Prompt clinical evaluation required within 1–2 hours.",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60",
    dotCls: "bg-amber-500",
  },
  Low: {
    score: 2,
    label: "Low (Level 2)",
    desc: "Standard queue evaluation. Mild or non-acute symptoms.",
    badgeCls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900/60",
    dotCls: "bg-sky-500",
  },
  Stable: {
    score: 1,
    label: "Stable (Level 1)",
    desc: "Routine wellness, medication refill, or normal follow-up.",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60",
    dotCls: "bg-emerald-500",
  },
}

const URGENCY_RANK: Record<Urgency, number> = {
  Critical: 5,
  High: 4,
  Moderate: 3,
  Low: 2,
  Stable: 1,
}

// ── Types ───────────────────────────────────────────────────────────────────
interface PatientRow {
  id: string
  rawId: string
  name: string
  age: number
  gender: "Male" | "Female" | "Other"
  village: string
  clinicName: string
  clinicId?: string
  urgency: Urgency
  urgencyScore: number
  lastVisit: string
  lastVisitSort: number
  latestVitals?: {
    systolic?: number
    diastolic?: number
    pulse?: number
    temperature?: number
    spo2?: number
  }
}

interface VisitRecord {
  id: string
  created_at: string
  urgency_score: number | null
  symptoms: string | null
  diagnosis: string | null
  vitals: {
    systolic?: number
    diastolic?: number
    temperature?: number
    pulse?: number
    respRate?: number
    spo2?: number
    weight?: number
    height?: number
  } | null
  staff?: any
}

// ── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  ),
  alertTriangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrowLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
}

export default function NurseDashboardPage({
  onLogout,
  onNavigate,
}: {
  onLogout?: () => void
  onNavigate?: (page: string) => void
}) {
  const { profile } = useAuth()
  const { t } = useTranslation()

  // ── States ────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>("All")
  const [sortBy, setSortBy] = useState<"urgency-desc" | "recent" | "name">("urgency-desc")

  // Selected Patient & Drawer
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null)
  const [drawerTab, setDrawerTab] = useState<"triage" | "vitals" | "notes" | "history">("triage")
  const [patientVisits, setPatientVisits] = useState<VisitRecord[]>([])
  const [isLoadingVisits, setIsLoadingVisits] = useState(false)

  // Form: Urgency Assessment
  const [urgencySelection, setUrgencySelection] = useState<Urgency>("Stable")
  const [urgencyReason, setUrgencyReason] = useState("")
  const [isUpdatingUrgency, setIsUpdatingUrgency] = useState(false)

  // Form: Record Vitals
  const [vitalsForm, setVitalsForm] = useState({
    systolic: "",
    diastolic: "",
    pulse: "",
    temperature: "",
    respRate: "",
    spo2: "",
    weight: "",
    height: "",
    urgencyScore: 1,
    symptomsNote: "",
  })
  const [isSavingVitals, setIsSavingVitals] = useState(false)

  // Form: Quick Visit Note
  const [quickNoteText, setQuickNoteText] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load All Patients with Latest Visit ──────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let q = supabase
        .from("patients")
        .select(`
          id, name, age, sex, village, clinic_id, created_at,
          clinics (
            id, name, zone
          ),
          visits (
            id, created_at, urgency_score, vitals, symptoms, diagnosis
          )
        `)
        .order("created_at", { foreignTable: "visits", ascending: false })

      // If worker with clinic_id, scope to clinic
      if (profile?.role === "worker" && profile?.clinic_id) {
        q = q.eq("clinic_id", profile.clinic_id)
      }

      const { data, error: fetchErr } = await q
      if (fetchErr) throw fetchErr

      const mapped: PatientRow[] = (data || []).map((p: any) => {
        const latestVisit = p.visits && p.visits.length > 0 ? p.visits[0] : null
        let urgency: Urgency = "Stable"
        let urgencyScore = 1
        let lastVisit = t("nurseDash:noPriorVisits")
        let lastVisitSort = 999999

        if (latestVisit) {
          urgencyScore = latestVisit.urgency_score || 1
          urgency = urgencyFromScore(urgencyScore)
          const vDate = new Date(latestVisit.created_at)
          const diffDays = Math.floor(Math.abs(Date.now() - vDate.getTime()) / 86400000)
          lastVisitSort = diffDays
          if (diffDays === 0) lastVisit = t("nurseDash:today")
          else if (diffDays === 1) lastVisit = t("nurseDash:yesterday")
          else lastVisit = t("nurseDash:daysAgo", { n: diffDays })
        } else if (p.created_at) {
          const cDate = new Date(p.created_at)
          const diffDays = Math.floor(Math.abs(Date.now() - cDate.getTime()) / 86400000)
          lastVisitSort = diffDays + 10
          lastVisit = diffDays === 0 ? t("nurseDash:registeredToday") : t("nurseDash:registeredDaysAgo", { n: diffDays })
        }

        return {
          id: p.id ? p.id.split("-")[0].toUpperCase() : "UNKNOWN",
          rawId: p.id,
          name: p.name || t("nurseDash:unnamedPatient"),
          age: p.age || 0,
          gender: p.sex === "Female" || p.sex === "F" ? "Female" : p.sex === "Male" || p.sex === "M" ? "Male" : "Other",
          village: p.village || t("nurseDash:unknownVillage"),
          clinicName: p.clinics?.name || t("nurseDash:unassignedClinic"),
          clinicId: p.clinic_id,
          urgency,
          urgencyScore,
          lastVisit,
          lastVisitSort,
          latestVitals: latestVisit?.vitals || undefined,
        }
      })

      setPatients(mapped)
    } catch (err: any) {
      console.error("[NurseDashboardPage] fetchPatients error:", err)
      setError(err.message || t("nurseDash:errLoad"))
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // ── Load Patient Visit History When Selected ──────────────────────────────
  const loadPatientVisits = useCallback(async (patientRawId: string) => {
    setIsLoadingVisits(true)
    try {
      const { data, error: vErr } = await supabase
        .from("visits")
        .select(`
          id, created_at, urgency_score, symptoms, diagnosis, vitals,
          staff ( name )
        `)
        .eq("patient_id", patientRawId)
        .order("created_at", { ascending: false })

      if (vErr) throw vErr
      setPatientVisits((data as any) || [])
    } catch (err: any) {
      console.error("[NurseDashboardPage] loadPatientVisits error:", err)
      showToast(t("nurseDash:couldNotLoadHistory"), "error")
    } finally {
      setIsLoadingVisits(false)
    }
  }, [])

  const handleSelectPatient = (patient: PatientRow) => {
    setSelectedPatient(patient)
    setUrgencySelection(patient.urgency)
    setUrgencyReason("")
    setVitalsForm({
      systolic: "",
      diastolic: "",
      pulse: "",
      temperature: "",
      respRate: "",
      spo2: "",
      weight: "",
      height: "",
      urgencyScore: patient.urgencyScore,
      symptomsNote: "",
    })
    setDrawerTab("triage")
    loadPatientVisits(patient.rawId)
  }

  // ── Handle Urgency Update (Immediate DB sync & Admin visibility) ───────────
  const handleUpdateUrgency = async () => {
    if (!selectedPatient) return
    const targetScore = URGENCY_LEVELS_MAP[urgencySelection].score

    setIsUpdatingUrgency(true)
    try {
      const res = await updatePatientUrgency({
        patientId: selectedPatient.rawId,
        staffId: profile?.id || null,
        urgencyScore: targetScore,
        note: urgencyReason.trim()
          ? `[Nurse Urgency Update] ${urgencyReason.trim()}`
          : `[Nurse Urgency Update] Urgency assessed as ${urgencySelection} (Level ${targetScore})`,
      })

      if (!res.success) {
        throw new Error(res.error || "Failed to update urgency")
      }

      // Update local patient state immediately
      setSelectedPatient((prev) => (prev ? { ...prev, urgency: urgencySelection, urgencyScore: targetScore } : null))
      setPatients((prev) =>
        prev.map((p) =>
          p.rawId === selectedPatient.rawId ? { ...p, urgency: urgencySelection, urgencyScore: targetScore, lastVisit: t("nurseDash:today"), lastVisitSort: 0 } : p
        )
      )

      showToast(
        t("nurseDash:urgencyUpdated", { level: t(`urgency:${urgencySelection}`), score: targetScore }),
        "success"
      )

      setUrgencyReason("")
      loadPatientVisits(selectedPatient.rawId)
    } catch (err: any) {
      console.error("[NurseDashboardPage] updateUrgency error:", err)
      showToast(err.message || t("nurseDash:failUpdateUrgency"), "error")
    } finally {
      setIsUpdatingUrgency(false)
    }
  }

  // ── Handle Record Vitals ──────────────────────────────────────────────────
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    // Validation
    const sys = vitalsForm.systolic ? parseFloat(vitalsForm.systolic) : undefined
    const dia = vitalsForm.diastolic ? parseFloat(vitalsForm.diastolic) : undefined
    const hr = vitalsForm.pulse ? parseFloat(vitalsForm.pulse) : undefined
    const temp = vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : undefined
    const rr = vitalsForm.respRate ? parseFloat(vitalsForm.respRate) : undefined
    const spo2 = vitalsForm.spo2 ? parseFloat(vitalsForm.spo2) : undefined
    const wt = vitalsForm.weight ? parseFloat(vitalsForm.weight) : undefined
    const ht = vitalsForm.height ? parseFloat(vitalsForm.height) : undefined

    if (!sys && !dia && !hr && !temp && !spo2 && !vitalsForm.symptomsNote.trim()) {
      showToast(t("nurseDash:enterAtLeastOne"), "info")
      return
    }

    if (spo2 !== undefined && (spo2 < 50 || spo2 > 100)) {
      showToast(t("nurseDash:spo2Range"), "error")
      return
    }

    if (temp !== undefined && (temp < 30 || temp > 45)) {
      showToast(t("nurseDash:tempRange"), "error")
      return
    }

    setIsSavingVitals(true)
    const newVisitId = crypto.randomUUID()
    const vitalsObj: Record<string, number> = {}
    if (sys !== undefined) vitalsObj.systolic = sys
    if (dia !== undefined) vitalsObj.diastolic = dia
    if (hr !== undefined) vitalsObj.pulse = hr
    if (temp !== undefined) vitalsObj.temperature = temp
    if (rr !== undefined) vitalsObj.respRate = rr
    if (spo2 !== undefined) vitalsObj.spo2 = spo2
    if (wt !== undefined) vitalsObj.weight = wt
    if (ht !== undefined) vitalsObj.height = ht

    const payload = {
      id: newVisitId,
      patient_id: selectedPatient.rawId,
      staff_id: profile?.id || null,
      urgency_score: vitalsForm.urgencyScore || selectedPatient.urgencyScore || 1,
      vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : null,
      symptoms: vitalsForm.symptomsNote.trim() || null,
      symptom_category: "nursing_vitals",
      diagnosis: null,
      synced_at: new Date().toISOString(),
    }

    try {
      if (!navigator.onLine) {
        await offlineDb.pendingRecords.add({
          id: newVisitId,
          type: "visit",
          payload: { ...payload, synced_at: null },
          status: "pending",
          createdAt: Date.now(),
        })
        showToast(t("nurseDash:savedOffline"), "info")
      } else {
        const { error: insErr } = await supabase.from("visits").insert([payload])
        if (insErr) {
          if (insErr.message.includes("fetch") || insErr.message.includes("network")) {
            await offlineDb.pendingRecords.add({
              id: newVisitId,
              type: "visit",
              payload: { ...payload, synced_at: null },
              status: "pending",
              createdAt: Date.now(),
            })
            showToast(t("nurseDash:savedOfflineNetwork"), "info")
          } else {
            throw insErr
          }
        } else {
          showToast(t("nurseDash:vitalsRecorded"), "success")
        }
      }

      // Update urgency if changed
      const newUrgency = urgencyFromScore(payload.urgency_score)
      setSelectedPatient((prev) =>
        prev
          ? {
              ...prev,
              urgency: newUrgency,
              urgencyScore: payload.urgency_score,
              latestVitals: vitalsObj,
            }
          : null
      )
      setPatients((prev) =>
        prev.map((p) =>
          p.rawId === selectedPatient.rawId
            ? {
                ...p,
                urgency: newUrgency,
                urgencyScore: payload.urgency_score,
                latestVitals: vitalsObj,
                lastVisit: t("nurseDash:today"),
                lastVisitSort: 0,
              }
            : p
        )
      )

      // Reset form
      setVitalsForm({
        systolic: "",
        diastolic: "",
        pulse: "",
        temperature: "",
        respRate: "",
        spo2: "",
        weight: "",
        height: "",
        urgencyScore: payload.urgency_score,
        symptomsNote: "",
      })

      loadPatientVisits(selectedPatient.rawId)
      setDrawerTab("history")
    } catch (err: any) {
      console.error("[NurseDashboardPage] saveVitals error:", err)
      showToast(err.message || t("nurseDash:failRecordVitals"), "error")
    } finally {
      setIsSavingVitals(false)
    }
  }

  // ── Handle Add Quick Visit Note ───────────────────────────────────────────
  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !quickNoteText.trim()) return

    setIsSavingNote(true)
    const newVisitId = crypto.randomUUID()
    const payload = {
      id: newVisitId,
      patient_id: selectedPatient.rawId,
      staff_id: profile?.id || null,
      urgency_score: selectedPatient.urgencyScore || 1,
      vitals: null,
      symptoms: quickNoteText.trim(),
      symptom_category: "nursing_note",
      diagnosis: null,
      synced_at: new Date().toISOString(),
    }

    try {
      if (!navigator.onLine) {
        await offlineDb.pendingRecords.add({
          id: newVisitId,
          type: "visit",
          payload: { ...payload, synced_at: null },
          status: "pending",
          createdAt: Date.now(),
        })
        showToast(t("nurseDash:noteQueued"), "info")
      } else {
        const { error: noteErr } = await supabase.from("visits").insert([payload])
        if (noteErr) throw noteErr
        showToast(t("nurseDash:noteAdded"), "success")
      }

      setQuickNoteText("")
      loadPatientVisits(selectedPatient.rawId)
    } catch (err: any) {
      console.error("[NurseDashboardPage] addNote error:", err)
      showToast(err.message || t("nurseDash:failSaveNote"), "error")
    } finally {
      setIsSavingNote(false)
    }
  }

  // ── Filtered & Sorted Patients ────────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = patients.filter((p) => {
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.rawId.toLowerCase().includes(q) ||
        p.village.toLowerCase().includes(q) ||
        p.clinicName.toLowerCase().includes(q)

      const matchUrgency = selectedUrgencyFilter === "All" || p.urgency === selectedUrgencyFilter

      return matchQuery && matchUrgency
    })

    return list.slice().sort((a, b) => {
      if (sortBy === "urgency-desc") {
        const diff = URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency]
        if (diff !== 0) return diff
        return a.lastVisitSort - b.lastVisitSort
      }
      if (sortBy === "recent") {
        return a.lastVisitSort - b.lastVisitSort
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }, [patients, searchQuery, selectedUrgencyFilter, sortBy])

  // ── KPI Statistics ────────────────────────────────────────────────────────
  const criticalCount = useMemo(() => patients.filter((p) => p.urgency === "Critical").length, [patients])
  const highCount = useMemo(() => patients.filter((p) => p.urgency === "High").length, [patients])
  const todayEncounters = useMemo(() => patients.filter((p) => p.lastVisitSort === 0).length, [patients])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all animate-slide-up ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
              : toast.type === "error"
              ? "bg-red-600 text-white border-red-500 shadow-red-600/20"
              : "bg-slate-800 text-white border-slate-700 shadow-slate-900/30"
          }`}
        >
          {toast.type === "success" && Icons.checkCircle}
          {toast.type === "error" && Icons.alertTriangle}
          <span>{toast.message}</span>
        </div>
      )}

      {/* App Navbar */}
      <AppNavbar
        variant="app"
        userInitials={profile?.name ? profile.name.slice(0, 2).toUpperCase() : "RN"}
        userColor="teal"
        onLogout={onLogout}
        onProfile={() => onNavigate?.("dashboard")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-teal-950/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/30 text-teal-200 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
                {t("nurseDash:badge")}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
                {t("nurseDash:title")}
              </h1>
              <p className="text-sm text-teal-100/80 mt-1 max-w-2xl">
                {t("nurseDash:loggedInPre")} <strong className="text-white">{profile?.name || t("nurseDash:staffNurse")}</strong> {t("nurseDash:loggedInPost")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPatients()}
                disabled={isLoading}
                className="flex items-center gap-2 bg-teal-700/60 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-teal-500/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className={isLoading ? "animate-spin" : ""}>{Icons.refresh}</span>
                {t("nurseDash:refreshStation")}
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {Icons.arrowLeft} {t("nurseDash:backToHub")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clinical KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("nurseDash:kpiTotalQueue")}
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {patients.length}
              </span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                {t("nurseDash:kpiActivePatients")}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
                {t("nurseDash:kpiCritical")}
              </p>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">
                {criticalCount}
              </span>
              <span className="text-xs text-red-600/80 dark:text-red-400/80 font-medium">
                {t("nurseDash:kpiImmediate")}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
              {t("nurseDash:kpiHigh")}
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-orange-600 dark:text-orange-400">
                {highCount}
              </span>
              <span className="text-xs text-orange-600/80 dark:text-orange-400/80 font-medium">
                {t("nurseDash:kpiWithin30")}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("nurseDash:kpiToday")}
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {todayEncounters}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {t("nurseDash:kpiAssessedToday")}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Urgency Level Tabs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full max-w-lg">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {Icons.search}
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("nurseDash:searchPh")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {t("nurseDash:sortLabel")}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="urgency-desc">{t("nurseDash:sortUrgency")}</option>
                <option value="recent">{t("nurseDash:sortRecent")}</option>
                <option value="name">{t("nurseDash:sortName")}</option>
              </select>
            </div>
          </div>

          {/* Urgency Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase mr-1 flex-shrink-0">
              {t("nurseDash:urgencyLabel")}
            </span>
            {["All", "Critical", "High", "Moderate", "Low", "Stable"].map((level) => {
              const active = selectedUrgencyFilter === level
              const cfg = level !== "All" ? URGENCY_LEVELS_MAP[level as Urgency] : null
              return (
                <button
                  key={level}
                  onClick={() => setSelectedUrgencyFilter(level)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 cursor-pointer ${
                    active
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cfg && (
                    <span
                      className={`w-2 h-2 rounded-full ${active ? "bg-white" : cfg.dotCls}`}
                    />
                  )}
                  {level === "All" ? t("nurseDash:all") : t(`urgency:${level}`)}
                  <span className={`text-[10px] ml-0.5 opacity-80`}>
                    ({level === "All" ? patients.length : patients.filter((p) => p.urgency === level).length})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Patient Table / Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-slate-900 dark:text-white">
                {t("nurseDash:queueTitle")}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                {t("nurseDash:shown", { count: filteredPatients.length })}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t("nurseDash:clickHint")}
            </p>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="animate-spin text-teal-600 w-8 h-8 mb-3">{Icons.refresh}</div>
              <p className="text-sm font-medium">{t("nurseDash:loadingRecords")}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
              <button
                onClick={() => fetchPatients()}
                className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                {t("nurseDash:retry")}
              </button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
                {t("nurseDash:noMatch")}
              </p>
              <p className="text-xs mt-1">{t("nurseDash:noMatchHint")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6">{t("nurseDash:colPatient")}</th>
                    <th className="py-3 px-4">{t("nurseDash:colDemographics")}</th>
                    <th className="py-3 px-4">{t("nurseDash:colLocation")}</th>
                    <th className="py-3 px-4">{t("nurseDash:colVitals")}</th>
                    <th className="py-3 px-4">{t("nurseDash:colUrgency")}</th>
                    <th className="py-3 px-4">{t("nurseDash:colLastVisit")}</th>
                    <th className="py-3 px-6 text-right">{t("nurseDash:colAction")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                  {filteredPatients.map((p) => {
                    const urgencyCfg = URGENCY_LEVELS_MAP[p.urgency]
                    const isSelected = selectedPatient?.rawId === p.rawId
                    return (
                      <tr
                        key={p.rawId}
                        onClick={() => handleSelectPatient(p)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          isSelected ? "bg-teal-50/70 dark:bg-teal-950/30" : ""
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {p.name}
                                {p.urgency === "Critical" && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                )}
                              </div>
                              <span className="text-xs text-slate-400 font-mono">
                                ID: #{p.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                          {p.age > 0 ? `${p.age} ${t("nurseDash:yrs")}` : "—"} · {p.gender}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[140px]">
                            {p.village}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {p.clinicName}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          {p.latestVitals ? (
                            <div className="text-xs space-y-0.5">
                              {p.latestVitals.systolic && p.latestVitals.diastolic && (
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  BP: {p.latestVitals.systolic}/{p.latestVitals.diastolic} mmHg
                                </span>
                              )}
                              {p.latestVitals.spo2 && (
                                <span className={`block ${p.latestVitals.spo2 < 92 ? "text-red-600 dark:text-red-400 font-bold" : "text-slate-500"}`}>
                                  SpO2: {p.latestVitals.spo2}%
                                </span>
                              )}
                              {p.latestVitals.pulse && (
                                <span className="text-[11px] text-slate-400 block">
                                  HR: {p.latestVitals.pulse} bpm
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">{t("nurseDash:noVitalsLogged")}</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${urgencyCfg.badgeCls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${urgencyCfg.dotCls}`} />
                            {t(`urgency:${p.urgency}`)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {p.lastVisit}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectPatient(p)
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-all cursor-pointer"
                          >
                            {t("nurseDash:triageVitals")}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Patient Clinical Drawer / Action Panel ─────────────────────────── */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-teal-600/20">
                  {selectedPatient.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedPatient.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                        URGENCY_LEVELS_MAP[selectedPatient.urgency].badgeCls
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          URGENCY_LEVELS_MAP[selectedPatient.urgency].dotCls
                        }`}
                      />
                      {t(`urgency:${selectedPatient.urgency}`)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ID: #{selectedPatient.id} · {`${selectedPatient.age} ${t("nurseDash:yrs")}`} · {selectedPatient.gender} · {selectedPatient.village}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={t("nurseDash:close")}
              >
                {Icons.x}
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950 text-xs font-semibold">
              <button
                onClick={() => setDrawerTab("triage")}
                className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === "triage"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {Icons.alertTriangle}
                {t("nurseDash:tabUrgency")}
              </button>
              <button
                onClick={() => setDrawerTab("vitals")}
                className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === "vitals"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {Icons.heart}
                {t("nurseDash:tabVitals")}
              </button>
              <button
                onClick={() => setDrawerTab("notes")}
                className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === "notes"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {Icons.clipboard}
                {t("nurseDash:tabNotes")}
              </button>
              <button
                onClick={() => setDrawerTab("history")}
                className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === "history"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {Icons.clock}
                {t("nurseDash:tabHistory")} ({patientVisits.length})
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ── TAB 1: URGENCY ASSESSMENT & MANAGEMENT ── */}
              {drawerTab === "triage" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-teal-200 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 p-4">
                    <h3 className="text-sm font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                      {Icons.activity}
                      {t("nurseDash:directUrgency")}
                    </h3>
                    <p className="text-xs text-teal-800/80 dark:text-teal-300/80 mt-1 leading-relaxed">
                      {t("nurseDash:directUrgencyDesc1")} <strong>{t("nurseDash:directUrgencyDescStrong")}</strong> {t("nurseDash:directUrgencyDesc2")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t("nurseDash:selectUrgencyLevel")}
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {(Object.keys(URGENCY_LEVELS_MAP) as Urgency[]).map((levelKey) => {
                        const opt = URGENCY_LEVELS_MAP[levelKey]
                        const isSelected = urgencySelection === levelKey
                        return (
                          <div
                            key={levelKey}
                            onClick={() => setUrgencySelection(levelKey)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? "border-teal-600 bg-teal-50/40 dark:bg-teal-950/30 ring-2 ring-teal-500/20"
                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                            }`}
                          >
                            <input
                              type="radio"
                              name="urgencyRadio"
                              checked={isSelected}
                              onChange={() => setUrgencySelection(levelKey)}
                              className="mt-1 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${opt.dotCls}`} />
                                  {t(`nurseDash:ulabel_${levelKey}`)}
                                </span>
                                {selectedPatient.urgency === levelKey && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    {t("nurseDash:current")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {t(`nurseDash:udesc_${levelKey}`)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t("nurseDash:clinicalReason")}
                    </label>
                    <textarea
                      rows={3}
                      value={urgencyReason}
                      onChange={(e) => setUrgencyReason(e.target.value)}
                      placeholder={t("nurseDash:reasonPh")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <button
                    onClick={handleUpdateUrgency}
                    disabled={isUpdatingUrgency}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingUrgency ? (
                      <>
                        <span className="animate-spin">{Icons.refresh}</span>
                        {t("nurseDash:updatingSyncing")}
                      </>
                    ) : (
                      <>
                        {Icons.checkCircle}
                        {t("nurseDash:saveUrgencySync")}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ── TAB 2: RECORD VITALS ── */}
              {drawerTab === "vitals" && (
                <form onSubmit={handleSaveVitals} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vBpSys")}
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="260"
                        value={vitalsForm.systolic}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, systolic: e.target.value })}
                        placeholder="120"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vBpDia")}
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="160"
                        value={vitalsForm.diastolic}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic: e.target.value })}
                        placeholder="80"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vPulse")}
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="220"
                        value={vitalsForm.pulse}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                        placeholder="72"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vTemp")}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="32"
                        max="43"
                        value={vitalsForm.temperature}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                        placeholder="36.8"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vSpo2")}
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={vitalsForm.spo2}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                        placeholder="98"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 transition-all ${
                          vitalsForm.spo2 && parseFloat(vitalsForm.spo2) < 92
                            ? "border-red-400 focus:ring-red-500 text-red-600 dark:text-red-400"
                            : "border-slate-200 dark:border-slate-800 focus:ring-teal-500"
                        }`}
                      />
                      {vitalsForm.spo2 && parseFloat(vitalsForm.spo2) < 92 && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                          {t("nurseDash:hypoxemiaWarn")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vResp")}
                      </label>
                      <input
                        type="number"
                        min="8"
                        max="60"
                        value={vitalsForm.respRate}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, respRate: e.target.value })}
                        placeholder="16"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vWeight")}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={vitalsForm.weight}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                        placeholder="65"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {t("nurseDash:vHeight")}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={vitalsForm.height}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                        placeholder="165"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t("nurseDash:encounterUrgency")}
                    </label>
                    <select
                      value={vitalsForm.urgencyScore}
                      onChange={(e) =>
                        setVitalsForm({ ...vitalsForm, urgencyScore: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
                    >
                      <option value={1}>{t("nurseDash:opt_stable")}</option>
                      <option value={2}>{t("nurseDash:opt_low")}</option>
                      <option value={3}>{t("nurseDash:opt_moderate")}</option>
                      <option value={4}>{t("nurseDash:opt_high")}</option>
                      <option value={5}>{t("nurseDash:opt_critical")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t("nurseDash:clinicalNotes")}
                    </label>
                    <textarea
                      rows={3}
                      value={vitalsForm.symptomsNote}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, symptomsNote: e.target.value })}
                      placeholder={t("nurseDash:notesPh")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingVitals}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingVitals ? (
                      <>
                        <span className="animate-spin">{Icons.refresh}</span>
                        {t("nurseDash:savingVitals")}
                      </>
                    ) : (
                      <>
                        {Icons.heart}
                        {t("nurseDash:saveVitals")}
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── TAB 3: VISIT NOTES ── */}
              {drawerTab === "notes" && (
                <div className="space-y-6">
                  <form onSubmit={handleAddQuickNote} className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t("nurseDash:addVisitNote")}
                    </label>
                    <textarea
                      rows={3}
                      value={quickNoteText}
                      onChange={(e) => setQuickNoteText(e.target.value)}
                      placeholder={t("nurseDash:notePh")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        {t("nurseDash:author")} <strong className="text-slate-600 dark:text-slate-300">{profile?.name || t("nurseDash:staffNurse")}</strong>
                      </span>
                      <button
                        type="submit"
                        disabled={isSavingNote || !quickNoteText.trim()}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSavingNote && <span className="animate-spin">{Icons.refresh}</span>}
                        {t("nurseDash:postNote")}
                      </button>
                    </div>
                  </form>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {t("nurseDash:notesTimeline")}
                    </h4>

                    {isLoadingVisits ? (
                      <p className="text-xs text-slate-400">{t("nurseDash:loadingNotes")}</p>
                    ) : patientVisits.filter((v) => v.symptoms).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{t("nurseDash:noNotes")}</p>
                    ) : (
                      <div className="space-y-3">
                        {patientVisits
                          .filter((v) => v.symptoms)
                          .map((v) => (
                            <div
                              key={v.id}
                              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                <span className="font-semibold text-teal-700 dark:text-teal-300">
                                  {(Array.isArray(v.staff) ? v.staff[0]?.name : v.staff?.name) || t("nurseDash:attendingNurse")}
                                </span>
                                <span>{new Date(v.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {v.symptoms}
                              </p>
                              {v.urgency_score && (
                                <div className="pt-1">
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    {t("nurseDash:urgencyColon")} {t(`urgency:${urgencyFromScore(v.urgency_score)}`)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB 4: CLINICAL VITALS HISTORY ── */}
              {drawerTab === "history" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t("nurseDash:pastVitals")}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {t("nurseDash:recordedVisits", { count: patientVisits.length })}
                    </span>
                  </div>

                  {isLoadingVisits ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <div className="animate-spin text-teal-600 w-6 h-6 mx-auto mb-2">{Icons.refresh}</div>
                      {t("nurseDash:loadingHistory")}
                    </div>
                  ) : patientVisits.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      {t("nurseDash:noVisitsYet")}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientVisits.map((v) => {
                        const score = v.urgency_score || 1
                        const urg = urgencyFromScore(score)
                        const cfg = URGENCY_LEVELS_MAP[urg]
                        const vit = v.vitals
                        return (
                          <div
                            key={v.id}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2.5 text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {new Date(v.created_at).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                {t("nurseDash:at")}{" "}
                                {new Date(v.created_at).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-[11px] border ${cfg.badgeCls}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                                {t(`urgency:${urg}`)}
                              </span>
                            </div>

                            {vit ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                                {vit.systolic && vit.diastolic && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                                    <span className="text-[10px] text-slate-400 block uppercase">{t("nurseDash:vBloodPressure")}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {vit.systolic}/{vit.diastolic} mmHg
                                    </span>
                                  </div>
                                )}
                                {vit.pulse && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                                    <span className="text-[10px] text-slate-400 block uppercase">{t("nurseDash:vHeartRate")}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {vit.pulse} bpm
                                    </span>
                                  </div>
                                )}
                                {vit.temperature && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                                    <span className="text-[10px] text-slate-400 block uppercase">{t("nurseDash:vTemperature")}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {vit.temperature}°C
                                    </span>
                                  </div>
                                )}
                                {vit.spo2 && (
                                  <div className={`p-2 rounded-xl ${vit.spo2 < 92 ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300" : "bg-slate-50 dark:bg-slate-900"}`}>
                                    <span className="text-[10px] opacity-70 block uppercase">{t("nurseDash:vOxygen")}</span>
                                    <span className="font-semibold">
                                      {vit.spo2}%
                                    </span>
                                  </div>
                                )}
                                {vit.respRate && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                                    <span className="text-[10px] text-slate-400 block uppercase">{t("nurseDash:vRespRate")}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {vit.respRate} /min
                                    </span>
                                  </div>
                                )}
                                {vit.weight && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                                    <span className="text-[10px] text-slate-400 block uppercase">{t("nurseDash:vWeightShort")}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {vit.weight} kg
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-[11px]">{t("nurseDash:noVitalsEntry")}</p>
                            )}

                            {v.symptoms && (
                              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl">
                                <span className="text-[10px] text-slate-400 block uppercase font-semibold">{t("nurseDash:noteObservation")}</span>
                                <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">
                                  {v.symptoms}
                                </p>
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                              <span>{t("nurseDash:staffLabel")} {(Array.isArray(v.staff) ? v.staff[0]?.name : v.staff?.name) || t("nurseDash:staffNurseFallback")}</span>
                              <span>ID: #{v.id.split("-")[0]}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
