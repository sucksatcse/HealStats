import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "./AuthContext"
import { useLang } from "./LanguageContext"
import AppNavbar from "./AppNavbar"
import { supabase } from "./lib/supabase"
import { offlineDb } from "./lib/offlineDb"

// ── Urgency Configuration (Read-only for Clinical Officer) ──────────────────
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

const URGENCY_LEVELS_MAP: Record<Urgency, { score: number; label: string; badgeCls: string; dotCls: string }> = {
  Critical: {
    score: 5,
    label: "Critical (Level 5)",
    badgeCls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60",
    dotCls: "bg-red-500",
  },
  High: {
    score: 4,
    label: "High (Level 4)",
    badgeCls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900/60",
    dotCls: "bg-orange-500",
  },
  Moderate: {
    score: 3,
    label: "Moderate (Level 3)",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60",
    dotCls: "bg-amber-500",
  },
  Low: {
    score: 2,
    label: "Low (Level 2)",
    badgeCls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900/60",
    dotCls: "bg-sky-500",
  },
  Stable: {
    score: 1,
    label: "Stable (Level 1)",
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

// ── Common Diagnostic Suggestions for Quick Selection ───────────────────────
const COMMON_DIAGNOSES = [
  "Acute Respiratory Infection (ARI)",
  "Acute Gastroenteritis",
  "Hypertension (Essential)",
  "Type 2 Diabetes Mellitus",
  "Malaria (Suspected/Confirmed)",
  "Urinary Tract Infection (UTI)",
  "Pneumonia (Community-Acquired)",
  "Dermatitis / Skin Infection",
  "Iron Deficiency Anemia",
  "Bronchial Asthma (Exacerbation)",
]

// ── Types ───────────────────────────────────────────────────────────────────
export interface PrescriptionItem {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  route: string
  instructions: string
}

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
    respRate?: number
    weight?: number
    height?: number
  }
}

interface ClinicalVisitRecord {
  id: string
  created_at: string
  urgency_score: number | null
  symptoms: string | null
  diagnosis: string | null
  symptom_category: string | null
  vitals: any
  staff?: any
}

// ── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  stethoscope: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v7a6 6 0 0012 0V3m-9 7a3 3 0 10-6 0v2a5 5 0 005 5h1a5 5 0 005-5v-2" />
      <circle cx="21" cy="3" r="2" />
      <circle cx="9" cy="3" r="2" />
    </svg>
  ),
  pill: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6.5a4.95 4.95 0 107 7l-6 6a4.95 4.95 0 11-7-7l6-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5l7 7" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
  plus: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12m6-6H4" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h12m-1.5 0v10a2 2 0 01-2 2h-5a2 2 0 01-2-2V6m3-3h4a1 1 0 011 1v2h-6V4a1 1 0 011-1z" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  arrowLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
}

export default function ClinicalOfficerPage({
  onLogout,
  onNavigate,
}: {
  onLogout?: () => void
  onNavigate?: (page: string) => void
}) {
  const { profile } = useAuth()
  const { lang } = useLang()

  // ── States ────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>("All")
  const [sortBy, setSortBy] = useState<"urgency-desc" | "recent" | "name">("urgency-desc")

  // Selected Patient & Drawer
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null)
  const [drawerTab, setDrawerTab] = useState<"vitals" | "diagnose" | "prescribe" | "history">("vitals")
  const [patientVisits, setPatientVisits] = useState<ClinicalVisitRecord[]>([])
  const [isLoadingVisits, setIsLoadingVisits] = useState(false)

  // ── Form: Diagnose Patient ────────────────────────────────────────────────
  const [diagnosisForm, setDiagnosisForm] = useState({
    primaryDiagnosis: "",
    secondaryDiagnosis: "",
    clinicalFindings: "",
    treatmentPlan: "",
  })
  const [isSavingDiagnosis, setIsSavingDiagnosis] = useState(false)

  // ── Form: Multi-Medication Prescribing ─────────────────────────────────────
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([
    {
      id: crypto.randomUUID(),
      medication: "",
      dosage: "",
      frequency: "Twice daily",
      duration: "5 days",
      route: "Oral",
      instructions: "Take after meals with water",
    },
  ])
  const [prescriptionDiagnosisRef, setPrescriptionDiagnosisRef] = useState("")
  const [pharmacyNotes, setPharmacyNotes] = useState("")
  const [isSavingPrescription, setIsSavingPrescription] = useState(false)

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch Patients from Supabase ──────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let q = supabase
        .from("patients")
        .select(`
          id, name, age, sex, village, clinic_id, created_at,
          clinics ( id, name, zone ),
          visits (
            id, created_at, urgency_score, vitals, symptoms, diagnosis, symptom_category
          )
        `)
        .order("created_at", { foreignTable: "visits", ascending: false })

      if (profile?.role === "worker" && profile?.clinic_id) {
        q = q.eq("clinic_id", profile.clinic_id)
      }

      const { data, error: fetchErr } = await q
      if (fetchErr) throw fetchErr

      const mapped: PatientRow[] = (data || []).map((p: any) => {
        const latestVisit = p.visits && p.visits.length > 0 ? p.visits[0] : null
        let urgency: Urgency = "Stable"
        let urgencyScore = 1
        let lastVisit = "No visits logged"
        let lastVisitSort = 999999

        if (latestVisit) {
          urgencyScore = latestVisit.urgency_score || 1
          urgency = urgencyFromScore(urgencyScore)
          const vDate = new Date(latestVisit.created_at)
          const diffDays = Math.floor(Math.abs(Date.now() - vDate.getTime()) / 86400000)
          lastVisitSort = diffDays
          if (diffDays === 0) lastVisit = "Today"
          else if (diffDays === 1) lastVisit = "Yesterday"
          else lastVisit = `${diffDays}d ago`
        } else if (p.created_at) {
          const cDate = new Date(p.created_at)
          const diffDays = Math.floor(Math.abs(Date.now() - cDate.getTime()) / 86400000)
          lastVisitSort = diffDays + 10
          lastVisit = diffDays === 0 ? "Registered Today" : `Registered ${diffDays}d ago`
        }

        return {
          id: p.id ? p.id.split("-")[0].toUpperCase() : "UNKNOWN",
          rawId: p.id,
          name: p.name || "Unnamed Patient",
          age: p.age || 0,
          gender: p.sex === "Female" || p.sex === "F" ? "Female" : p.sex === "Male" || p.sex === "M" ? "Male" : "Other",
          village: p.village || "Unknown Village",
          clinicName: p.clinics?.name || "Unassigned Clinic",
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
      console.error("[ClinicalOfficerPage] fetchPatients error:", err)
      setError(err.message || "Failed to load clinical patient queue.")
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // ── Load Patient Visit & Clinical History ─────────────────────────────────
  const loadPatientVisits = useCallback(async (patientRawId: string) => {
    setIsLoadingVisits(true)
    try {
      const { data, error: vErr } = await supabase
        .from("visits")
        .select(`
          id, created_at, urgency_score, symptoms, diagnosis, symptom_category, vitals,
          staff ( name )
        `)
        .eq("patient_id", patientRawId)
        .order("created_at", { ascending: false })

      if (vErr) throw vErr
      setPatientVisits((data as any[]) || [])
    } catch (err: any) {
      console.error("[ClinicalOfficerPage] loadPatientVisits error:", err)
      showToast("Could not load complete patient history", "error")
    } finally {
      setIsLoadingVisits(false)
    }
  }, [])

  const handleSelectPatient = (patient: PatientRow) => {
    setSelectedPatient(patient)
    setDiagnosisForm({
      primaryDiagnosis: "",
      secondaryDiagnosis: "",
      clinicalFindings: "",
      treatmentPlan: "",
    })
    setPrescriptionItems([
      {
        id: crypto.randomUUID(),
        medication: "",
        dosage: "",
        frequency: "Twice daily",
        duration: "5 days",
        route: "Oral",
        instructions: "Take after meals with water",
      },
    ])
    setPrescriptionDiagnosisRef("")
    setPharmacyNotes("")
    setDrawerTab("vitals")
    loadPatientVisits(patient.rawId)
  }

  // ── Handle Save Diagnosis & Clinical Visit ────────────────────────────────
  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    if (!diagnosisForm.primaryDiagnosis.trim()) {
      showToast("Please enter a primary diagnosis", "error")
      return
    }

    setIsSavingDiagnosis(true)
    const newVisitId = crypto.randomUUID()
    const nowISO = new Date().toISOString()

    // Human-readable findings and plan formatted for symptoms field
    const symptomsContent = [
      diagnosisForm.clinicalFindings.trim() ? `Findings: ${diagnosisForm.clinicalFindings.trim()}` : null,
      diagnosisForm.secondaryDiagnosis.trim() ? `Differential: ${diagnosisForm.secondaryDiagnosis.trim()}` : null,
      diagnosisForm.treatmentPlan.trim() ? `Plan: ${diagnosisForm.treatmentPlan.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n\n")

    const payload = {
      id: newVisitId,
      patient_id: selectedPatient.rawId,
      staff_id: profile?.id || null,
      urgency_score: selectedPatient.urgencyScore || 1, // preserves current nurse urgency score
      diagnosis: diagnosisForm.primaryDiagnosis.trim(),
      symptoms: symptomsContent || `Clinical visit recorded by ${profile?.name || "Clinical Officer"}`,
      symptom_category: "clinical_visit",
      vitals: {
        treatment_plan: diagnosisForm.treatmentPlan.trim() || null,
        clinical_findings: diagnosisForm.clinicalFindings.trim() || null,
        secondary_diagnosis: diagnosisForm.secondaryDiagnosis.trim() || null,
      },
      created_at: nowISO,
      synced_at: nowISO,
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
        showToast("Diagnosis saved locally (Pending Sync).", "info")
      } else {
        const { error: insErr } = await supabase.from("visits").insert([payload])
        if (insErr) throw insErr
        showToast("Diagnosis and clinical encounter permanently saved!", "success")
      }

      setPrescriptionDiagnosisRef(diagnosisForm.primaryDiagnosis.trim())
      setDiagnosisForm({
        primaryDiagnosis: "",
        secondaryDiagnosis: "",
        clinicalFindings: "",
        treatmentPlan: "",
      })

      loadPatientVisits(selectedPatient.rawId)
      setDrawerTab("prescribe")
    } catch (err: any) {
      console.error("[ClinicalOfficerPage] saveDiagnosis error:", err)
      showToast(err.message || "Failed to record diagnosis", "error")
    } finally {
      setIsSavingDiagnosis(false)
    }
  }

  // ── Multi-Medication Prescribing Handlers ─────────────────────────────────
  const handleAddMedicationRow = () => {
    setPrescriptionItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        medication: "",
        dosage: "",
        frequency: "Twice daily",
        duration: "5 days",
        route: "Oral",
        instructions: "Take after meals",
      },
    ])
  }

  const handleRemoveMedicationRow = (id: string) => {
    if (prescriptionItems.length === 1) {
      showToast("A prescription must have at least one medication", "info")
      return
    }
    setPrescriptionItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleMedicationChange = (id: string, field: keyof PrescriptionItem, val: string) => {
    setPrescriptionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    )
  }

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    // Validation
    const cleanItems = prescriptionItems.filter((i) => i.medication.trim())
    if (cleanItems.length === 0) {
      showToast("Please enter at least one valid medication name", "error")
      return
    }

    for (const item of cleanItems) {
      if (!item.dosage.trim()) {
        showToast(`Dosage is required for ${item.medication}`, "error")
        return
      }
      if (!item.duration.trim()) {
        showToast(`Duration is required for ${item.medication}`, "error")
        return
      }
    }

    setIsSavingPrescription(true)
    const newVisitId = crypto.randomUUID()
    const nowISO = new Date().toISOString()

    // Readable prescription summary for symptoms column
    const summaryText = cleanItems
      .map(
        (m, idx) =>
          `Rx #${idx + 1}: ${m.medication.trim()} — ${m.dosage.trim()}, ${m.frequency}, for ${m.duration} (${m.route}). Instructions: ${m.instructions}`
      )
      .join("\n")

    const fullSymptoms = pharmacyNotes.trim()
      ? `${summaryText}\n\nClinical Instructions: ${pharmacyNotes.trim()}`
      : summaryText

    const payload = {
      id: newVisitId,
      patient_id: selectedPatient.rawId,
      staff_id: profile?.id || null,
      urgency_score: selectedPatient.urgencyScore || 1,
      diagnosis: prescriptionDiagnosisRef.trim() || `Prescription Issued (${cleanItems.length} med${cleanItems.length > 1 ? "s" : ""})`,
      symptoms: fullSymptoms,
      symptom_category: "prescription",
      vitals: {
        prescriptions: cleanItems,
        pharmacy_notes: pharmacyNotes.trim() || null,
        prescribed_by: profile?.name || "Clinical Officer",
      },
      created_at: nowISO,
      synced_at: nowISO,
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
        showToast("Prescription queued locally for sync.", "info")
      } else {
        const { error: insErr } = await supabase.from("visits").insert([payload])
        if (insErr) throw insErr
        showToast(`Prescription with ${cleanItems.length} medication(s) saved!`, "success")
      }

      // Reset form
      setPrescriptionItems([
        {
          id: crypto.randomUUID(),
          medication: "",
          dosage: "",
          frequency: "Twice daily",
          duration: "5 days",
          route: "Oral",
          instructions: "Take after meals with water",
        },
      ])
      setPharmacyNotes("")

      loadPatientVisits(selectedPatient.rawId)
      setDrawerTab("history")
    } catch (err: any) {
      console.error("[ClinicalOfficerPage] savePrescription error:", err)
      showToast(err.message || "Failed to save prescription", "error")
    } finally {
      setIsSavingPrescription(false)
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

  // ── Live KPI Statistics Derived from Real Central DB ──────────────────────
  const urgentReviewCount = useMemo(
    () => patients.filter((p) => p.urgency === "Critical" || p.urgency === "High").length,
    [patients]
  )

  const diagnosedCount = useMemo(() => {
    return patients.filter((p) => p.lastVisit !== "No visits logged").length
  }, [patients])

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
        userInitials={profile?.name ? profile.name.slice(0, 2).toUpperCase() : "CO"}
        userColor="teal"
        onLogout={onLogout}
        onProfile={() => onNavigate?.("dashboard")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-teal-950/15 relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-500/30 text-teal-200 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
                <span>Clinical Officer & Medical Officer Station</span>
                <span className="opacity-50">•</span>
                <span className="text-white font-bold">{profile?.clinic_name || "General Clinic"}</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
                Clinical Diagnoses, Prescriptions & Visit Management
              </h1>
              <p className="text-sm text-teal-100/80 mt-1 max-w-2xl">
                Logged in as <strong className="text-white">{profile?.name || "Clinical Officer"}</strong> at{" "}
                <strong className="text-white underline decoration-teal-400/50">{profile?.clinic_name || "Assigned Clinic"}</strong>. Diagnose patients, prescribe treatments, and review nurse-captured vitals from the central database.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPatients()}
                disabled={isLoading}
                className="flex items-center gap-2 bg-teal-700/60 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-teal-500/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className={isLoading ? "animate-spin" : ""}>{Icons.refresh}</span>
                Refresh Station
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {Icons.arrowLeft} Back to Hub
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clinical KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Patients in Care
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {patients.length}
              </span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                Active Patients
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
                Urgent Clinical Review
              </p>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">
                {urgentReviewCount}
              </span>
              <span className="text-xs text-red-600/80 dark:text-red-400/80 font-medium">
                Critical / High
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Diagnosed Patients
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {diagnosedCount}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Clinical Encounters
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Queue Activity
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {patients.filter((p) => p.lastVisit === "Today").length}
              </span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                Seen Today
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Urgency Level Pills */}
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
                placeholder="Search patient name, ID, village, or clinic..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="urgency-desc">Highest Urgency (Critical first)</option>
                <option value="recent">Most Recent Visit</option>
                <option value="name">Patient Name (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Urgency Filter Pills (Read-only clinical guide) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase mr-1 flex-shrink-0">
              Urgency:
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
                  {level}
                  <span className="text-[10px] ml-0.5 opacity-80">
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
                Clinical Review Queue
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                {filteredPatients.length} shown
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Select any patient to review nurse vitals, diagnose, and issue prescriptions
            </p>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="animate-spin text-teal-600 w-8 h-8 mb-3">{Icons.refresh}</div>
              <p className="text-sm font-medium">Loading clinical patient records...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
              <button
                onClick={() => fetchPatients()}
                className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
                No patients match the selected filter.
              </p>
              <p className="text-xs mt-1">Try adjusting your urgency filter or search keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Patient</th>
                    <th className="py-3 px-4">Demographics</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Latest Nurse Vitals</th>
                    <th className="py-3 px-4">Triage Urgency</th>
                    <th className="py-3 px-4">Last Visit</th>
                    <th className="py-3 px-6 text-right">Action</th>
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
                          {p.age > 0 ? `${p.age} yrs` : "—"} · {p.gender}
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
                                <span
                                  className={`block ${
                                    p.latestVitals.spo2 < 92
                                      ? "text-red-600 dark:text-red-400 font-bold"
                                      : "text-slate-500"
                                  }`}
                                >
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
                            <span className="text-xs text-slate-400 italic">No vitals logged</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${urgencyCfg.badgeCls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${urgencyCfg.dotCls}`} />
                            {p.urgency}
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
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
                          >
                            Diagnose & Prescribe
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

      {/* ── Patient Clinical Chart & Drawer ─────────────────────────────────── */}
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
                      {selectedPatient.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ID: #{selectedPatient.id} · {selectedPatient.age} yrs · {selectedPatient.gender} · {selectedPatient.village}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                {Icons.x}
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950 text-xs font-semibold">
              <button
                onClick={() => setDrawerTab("vitals")}
                className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === "vitals"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {Icons.heart}
                Overview & Vitals
              </button>
              <button
                onClick={() => setDrawerTab("diagnose")}
                className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === "diagnose"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {Icons.stethoscope}
                Diagnose
              </button>
              <button
                onClick={() => setDrawerTab("prescribe")}
                className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === "prescribe"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {Icons.pill}
                Prescribe
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
                Clinical History ({patientVisits.length})
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ── TAB 1: OVERVIEW & NURSE VITALS CONTEXT ── */}
              {drawerTab === "vitals" && (
                <div className="space-y-6">
                  {/* Read-Only Urgency Notice */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Current Urgency Classification
                      </span>
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
                        {selectedPatient.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Assessed during intake by triage nursing staff. Clinical Officers review this status to prioritize care.
                    </p>
                  </div>

                  {/* Latest Vitals Card */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      {Icons.heart}
                      Latest Nurse Vitals Assessment
                    </h3>

                    {selectedPatient.latestVitals ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Blood Pressure</span>
                          <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                            {selectedPatient.latestVitals.systolic && selectedPatient.latestVitals.diastolic
                              ? `${selectedPatient.latestVitals.systolic} / ${selectedPatient.latestVitals.diastolic} mmHg`
                              : "—"}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Heart Rate</span>
                          <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                            {selectedPatient.latestVitals.pulse ? `${selectedPatient.latestVitals.pulse} bpm` : "—"}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Temperature</span>
                          <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                            {selectedPatient.latestVitals.temperature ? `${selectedPatient.latestVitals.temperature}°C` : "—"}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Oxygen Saturation</span>
                          <span
                            className={`text-base font-bold mt-1 block ${
                              selectedPatient.latestVitals.spo2 && selectedPatient.latestVitals.spo2 < 92
                                ? "text-red-600 dark:text-red-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {selectedPatient.latestVitals.spo2 ? `${selectedPatient.latestVitals.spo2}%` : "—"}
                          </span>
                          {selectedPatient.latestVitals.spo2 && selectedPatient.latestVitals.spo2 < 92 && (
                            <span className="text-[10px] text-red-500 font-semibold block">Hypoxemia Alert</span>
                          )}
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Resp Rate</span>
                          <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                            {selectedPatient.latestVitals.respRate ? `${selectedPatient.latestVitals.respRate} /min` : "—"}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Weight / Height</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white mt-1 block">
                            {selectedPatient.latestVitals.weight ? `${selectedPatient.latestVitals.weight} kg` : "—"} ·{" "}
                            {selectedPatient.latestVitals.height ? `${selectedPatient.latestVitals.height} cm` : "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No vitals currently logged for this patient.</p>
                    )}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => setDrawerTab("diagnose")}
                      className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {Icons.stethoscope}
                      Start Patient Diagnosis
                    </button>
                    <button
                      onClick={() => setDrawerTab("prescribe")}
                      className="flex-1 py-3 px-4 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {Icons.pill}
                      Prescribe Medications
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB 2: DIAGNOSE PATIENT ── */}
              {drawerTab === "diagnose" && (
                <form onSubmit={handleSaveDiagnosis} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Primary Diagnosis *
                    </label>
                    <input
                      type="text"
                      required
                      value={diagnosisForm.primaryDiagnosis}
                      onChange={(e) =>
                        setDiagnosisForm({ ...diagnosisForm, primaryDiagnosis: e.target.value })
                      }
                      placeholder="e.g. Acute Bacterial Bronchitis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-900 dark:text-white"
                    />

                    {/* Common Diagnosis Quick Chips */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-medium">Quick options:</span>
                      {COMMON_DIAGNOSES.map((diag) => (
                        <button
                          key={diag}
                          type="button"
                          onClick={() =>
                            setDiagnosisForm({ ...diagnosisForm, primaryDiagnosis: diag })
                          }
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          {diag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Secondary / Differential Diagnosis (Optional)
                    </label>
                    <input
                      type="text"
                      value={diagnosisForm.secondaryDiagnosis}
                      onChange={(e) =>
                        setDiagnosisForm({ ...diagnosisForm, secondaryDiagnosis: e.target.value })
                      }
                      placeholder="e.g. Viral Pharyngitis or Bronchial Asthma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Clinical Findings & Physical Examination
                    </label>
                    <textarea
                      rows={3}
                      value={diagnosisForm.clinicalFindings}
                      onChange={(e) =>
                        setDiagnosisForm({ ...diagnosisForm, clinicalFindings: e.target.value })
                      }
                      placeholder="e.g. Patient presents with productive cough for 4 days. Auscultation reveals bilateral coarse crackles. Throat congested, no stridor."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Treatment Plan & Clinical Advice
                    </label>
                    <textarea
                      rows={3}
                      value={diagnosisForm.treatmentPlan}
                      onChange={(e) =>
                        setDiagnosisForm({ ...diagnosisForm, treatmentPlan: e.target.value })
                      }
                      placeholder="e.g. Oral antibiotic therapy, hydration, paracetamol for fever. Return in 3 days if dyspnea or high fever persists."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingDiagnosis}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingDiagnosis ? (
                      <>
                        <span className="animate-spin">{Icons.refresh}</span>
                        Saving Clinical Record...
                      </>
                    ) : (
                      <>
                        {Icons.checkCircle}
                        Save Diagnosis & Proceed to Prescription
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── TAB 3: PRESCRIBE MEDICATION (MULTI-MEDICATION) ── */}
              {drawerTab === "prescribe" && (
                <form onSubmit={handleSavePrescription} className="space-y-6">
                  {/* Diagnosis Reference */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Target Diagnosis / Indication
                    </label>
                    <input
                      type="text"
                      value={prescriptionDiagnosisRef}
                      onChange={(e) => setPrescriptionDiagnosisRef(e.target.value)}
                      placeholder="e.g. Acute Bacterial Bronchitis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>

                  {/* Multi-Medication Rows */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Prescription Items ({prescriptionItems.length})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMedicationRow}
                        className="flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 p-1 cursor-pointer"
                      >
                        {Icons.plus} Add Medication
                      </button>
                    </div>

                    {prescriptionItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                            Medication #{index + 1}
                          </span>
                          {prescriptionItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicationRow(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 transition-colors cursor-pointer"
                              title="Remove medication"
                            >
                              {Icons.trash}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Medication Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.medication}
                              onChange={(e) =>
                                handleMedicationChange(item.id, "medication", e.target.value)
                              }
                              placeholder="e.g. Amoxicillin"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Dosage *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.dosage}
                              onChange={(e) =>
                                handleMedicationChange(item.id, "dosage", e.target.value)
                              }
                              placeholder="e.g. 500 mg"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Frequency *
                            </label>
                            <select
                              value={item.frequency}
                              onChange={(e) =>
                                handleMedicationChange(item.id, "frequency", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                            >
                              <option value="Once daily">Once daily (OD)</option>
                              <option value="Twice daily">Twice daily (BD)</option>
                              <option value="Three times daily">Three times daily (TDS)</option>
                              <option value="Four times daily">Four times daily (QDS)</option>
                              <option value="Every 8 hours">Every 8 hours</option>
                              <option value="As needed (PRN)">As needed (PRN)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Duration *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.duration}
                              onChange={(e) =>
                                handleMedicationChange(item.id, "duration", e.target.value)
                              }
                              placeholder="e.g. 7 days"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Route
                            </label>
                            <select
                              value={item.route}
                              onChange={(e) =>
                                handleMedicationChange(item.id, "route", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                            >
                              <option value="Oral">Oral</option>
                              <option value="Intravenous (IV)">Intravenous (IV)</option>
                              <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                              <option value="Topical">Topical</option>
                              <option value="Inhalation">Inhalation</option>
                              <option value="Sublingual">Sublingual</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Instructions
                            </label>
                            <input
                              type="text"
                              value={item.instructions}
                              onChange={(e) =>
                                handleMedicationChange(item.id, "instructions", e.target.value)
                              }
                              placeholder="e.g. Take after meals with full glass of water"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Pharmacy & Patient Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={pharmacyNotes}
                      onChange={(e) => setPharmacyNotes(e.target.value)}
                      placeholder="e.g. Complete the full 7-day course even if feeling better. Avoid dairy within 2 hours of dosage."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPrescription}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPrescription ? (
                      <>
                        <span className="animate-spin">{Icons.refresh}</span>
                        Issuing Prescription...
                      </>
                    ) : (
                      <>
                        {Icons.pill}
                        Save & Issue Prescription
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── TAB 4: COMPLETE CLINICAL HISTORY ── */}
              {drawerTab === "history" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Encounter History & Prescriptions
                    </h4>
                    <span className="text-xs text-slate-400">
                      {patientVisits.length} recorded events
                    </span>
                  </div>

                  {isLoadingVisits ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <div className="animate-spin text-teal-600 w-6 h-6 mx-auto mb-2">{Icons.refresh}</div>
                      Loading history...
                    </div>
                  ) : patientVisits.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      No clinical visits or prescriptions recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientVisits.map((v) => {
                        const score = v.urgency_score || 1
                        const urg = urgencyFromScore(score)
                        const cfg = URGENCY_LEVELS_MAP[urg]
                        const prescriptions: PrescriptionItem[] = v.vitals?.prescriptions || []
                        const clinicianName = (Array.isArray(v.staff) ? v.staff[0]?.name : v.staff?.name) || "Attending Clinician"

                        return (
                          <div
                            key={v.id}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {new Date(v.created_at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}{" "}
                                  at{" "}
                                  {new Date(v.created_at).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium block">
                                  {v.symptom_category === "prescription"
                                    ? "Prescription Order"
                                    : v.symptom_category === "clinical_visit"
                                    ? "Clinical Diagnostic Visit"
                                    : "Nurse Triage & Vitals"}
                                </span>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-[11px] border ${cfg.badgeCls}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                                {urg}
                              </span>
                            </div>

                            {/* Diagnosis Section */}
                            {v.diagnosis && (
                              <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-100 dark:border-teal-900/50">
                                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold uppercase tracking-wider block">
                                  Diagnosis
                                </span>
                                <p className="text-slate-900 dark:text-white font-semibold text-sm mt-0.5">
                                  {v.diagnosis}
                                </p>
                              </div>
                            )}

                            {/* Prescriptions Section */}
                            {prescriptions.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                  Prescribed Medications ({prescriptions.length})
                                </span>
                                <div className="space-y-1.5">
                                  {prescriptions.map((p, pIdx) => (
                                    <div
                                      key={p.id || pIdx}
                                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                                          {p.medication}
                                        </span>
                                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                                          {p.dosage}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                                        {p.frequency} · Duration: {p.duration} · Route: {p.route}
                                      </p>
                                      {p.instructions && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                                          Note: {p.instructions}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Clinical Findings / Symptoms Note */}
                            {v.symptoms && (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                  Encounter Documentation
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5 whitespace-pre-wrap leading-relaxed">
                                  {v.symptoms}
                                </p>
                              </div>
                            )}

                            {/* Nurse Vitals on this record if present */}
                            {v.vitals && (v.vitals.systolic || v.vitals.pulse || v.vitals.spo2) && (
                              <div className="grid grid-cols-3 gap-2 pt-1">
                                {v.vitals.systolic && v.vitals.diastolic && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
                                    <span className="text-[9px] text-slate-400 block uppercase">BP</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {v.vitals.systolic}/{v.vitals.diastolic}
                                    </span>
                                  </div>
                                )}
                                {v.vitals.pulse && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
                                    <span className="text-[9px] text-slate-400 block uppercase">Pulse</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {v.vitals.pulse} bpm
                                    </span>
                                  </div>
                                )}
                                {v.vitals.spo2 && (
                                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
                                    <span className="text-[9px] text-slate-400 block uppercase">SpO2</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {v.vitals.spo2}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
                              <span>Attending: <strong>{clinicianName}</strong></span>
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
