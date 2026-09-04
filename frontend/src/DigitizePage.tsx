import { useState, useRef, useCallback } from "react"
import Tesseract from "tesseract.js"
import { parseOcrText, OcrField } from "./lib/ocrParser"
import { supabase } from "./lib/supabase"
import { offlineDb } from "./lib/offlineDb"
import { useAuth } from "./AuthContext"

type ConfidenceTier = "high" | "medium" | "low"

function getConfidenceTier(n: number): ConfidenceTier {
  if (n >= 85) return "high"
  if (n >= 70) return "medium"
  return "low"
}

const CONFIDENCE_STYLE: Record<ConfidenceTier, {
  bar: string
  badge: string
  badgeText: string
  border: string
  bg: string
}> = {
  high: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    border: "border-slate-200",
    bg: "bg-slate-50 focus:bg-white",
  },
  medium: {
    bar: "bg-amber-400",
    badge: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
    border: "border-amber-200",
    bg: "bg-amber-50/40 focus:bg-white",
  },
  low: {
    bar: "bg-red-400",
    badge: "bg-red-50 border-red-200",
    badgeText: "text-red-600",
    border: "border-red-200",
    bg: "bg-red-50/40 focus:bg-white",
  },
}

// ── Scanning animation lines ───────────────────────────────────────────────────
function ScanOverlay() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <div
        className="absolute left-0 right-0 h-0.5 bg-teal-400/70 shadow-[0_0_12px_4px_rgba(20,184,166,0.4)]"
        style={{ animation: "scanline 2s linear infinite" }}
      />
      {/* Corner brackets */}
      {[
        ["top-3 left-3", "border-t-2 border-l-2"],
        ["top-3 right-3", "border-t-2 border-r-2"],
        ["bottom-3 left-3", "border-b-2 border-l-2"],
        ["bottom-3 right-3", "border-b-2 border-r-2"],
      ].map(([pos, brd], i) => (
        <div
          key={i}
          className={`absolute ${pos} w-5 h-5 ${brd} border-teal-400 rounded-sm`}
        />
      ))}
    </div>
  )
}

// ── Field row component ────────────────────────────────────────────────────────
function ExtractedField({
  field,
  value,
  onChange,
  confirmed,
  onToggle,
}: {
  field: OcrField
  value: string
  onChange: (v: string) => void
  confirmed: boolean
  onToggle: () => void
}) {
  const tier = getConfidenceTier(field.confidence)
  const s = CONFIDENCE_STYLE[tier]

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${s.border} ${s.bg}`

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        confirmed
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-white border-slate-200"
      }`}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {field.label}
        </label>
        <div className="flex items-center gap-2">
          {/* Confidence chip */}
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badge} ${s.badgeText}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.bar}`} />
            {field.confidence}% confidence
          </div>
          {/* Confirm toggle */}
          <button
            onClick={onToggle}
            title={confirmed ? "Mark as unreviewed" : "Confirm this field"}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              confirmed
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-slate-300 hover:border-teal-400 bg-white"
            }`}
          >
            {confirmed && (
              <svg
                viewBox="0 0 10 10"
                fill="none"
                stroke="white"
                strokeWidth={2}
                className="w-3 h-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 5l2 2 4-4"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="h-0.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${s.bar}`}
          style={{ width: `${field.confidence}%` }}
        />
      </div>

      {/* Input */}
      {field.type === "textarea" ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={confirmed}
          className={`${inputCls} resize-none`}
        />
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={confirmed}
          className={inputCls}
        />
      )}

      {tier === "low" && !confirmed && (
        <p className="text-[10px] text-red-500 font-medium mt-1.5 flex items-center gap-1">
          <svg
            viewBox="0 0 12 12"
            fill="currentColor"
            className="w-3 h-3 flex-shrink-0"
          >
            <path
              d="M6 1L1 11h10L6 1zm0 3v3m0 2v1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Low confidence — please verify manually
        </p>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DigitizePage() {
  const { profile } = useAuth()
  const [stage, setStage] = useState<"upload" | "scanning" | "review" | "saved">("upload")
  const [dragging, setDragging] = useState(false)
  const [imageURL, setImageURL] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  
  const [ocrFields, setOcrFields] = useState<OcrField[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  
  const [ocrFailed, setOcrFailed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)
  
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalFields = ocrFields.length
  const confirmedCount = Object.values(confirmed).filter(Boolean).length
  const allConfirmed = totalFields > 0 && confirmedCount === totalFields
  const lowConfidenceCount = ocrFields.filter(
    (f) => getConfidenceTier(f.confidence) === "low",
  ).length

  const beginScan = async (url: string) => {
    setImageURL(url)
    setStage("scanning")
    setScanProgress(0)
    setOcrFailed(false)
    
    try {
      const worker = await Tesseract.createWorker("eng", 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.floor(m.progress * 100))
          }
        }
      });
      const { data: { text } } = await worker.recognize(url);
      await worker.terminate();
      
      const parsedFields = parseOcrText(text);
      const hasData = parsedFields.some(f => f.value.trim() !== "");
      
      if (!hasData) {
        setOcrFailed(true);
        setStage("upload");
      } else {
        setOcrFields(parsedFields);
        const vals: Record<string, string> = {}
        parsedFields.forEach(f => { vals[f.key] = f.value })
        setFieldValues(vals)
        setConfirmed({})
        setStage("review")
      }
    } catch (err) {
      console.error(err)
      setOcrFailed(true)
      setStage("upload")
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    beginScan(url)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }
  const onDragLeave = () => setDragging(false)

  const handleConfirmAll = () => {
    const all: Record<string, boolean> = {}
    ocrFields.forEach((f) => {
      all[f.key] = true
    })
    setConfirmed(all)
  }

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    
    try {
      const newPatientId = crypto.randomUUID()
      const patientPayload = {
        id: newPatientId,
        name: fieldValues["patientName"] || "Unknown Patient",
        age: parseInt(fieldValues["age"], 10) || null,
        clinic_id: profile.clinic_id,
        // Optional fields left null: sex, phone, address, village
      }
      
      let visitPayload: any = null;
      let newVisitId: string | null = null;
      if (fieldValues["diagnosis"] && fieldValues["diagnosis"].trim()) {
        newVisitId = crypto.randomUUID()
        visitPayload = {
          id: newVisitId,
          patient_id: newPatientId,
          staff_id: profile.id,
          diagnosis: fieldValues["diagnosis"].trim(),
          synced_at: navigator.onLine ? new Date().toISOString() : null
        }
      }

      let isOffline = !navigator.onLine;

      if (!isOffline) {
        const { error: patientErr } = await supabase.from("patients").insert([patientPayload])
        
        if (patientErr && (patientErr.message === "Failed to fetch" || patientErr.message.includes("fetch"))) {
          isOffline = true;
        } else if (patientErr) {
          throw patientErr
        } else {
          if (visitPayload && newVisitId) {
            const { error: visitErr } = await supabase.from("visits").insert([visitPayload])
            if (visitErr && (visitErr.message === "Failed to fetch" || visitErr.message.includes("fetch"))) {
              isOffline = true;
            } else if (visitErr) {
              throw visitErr
            }
          }
        }
      }

      if (isOffline) {
        await offlineDb.pendingRecords.add({
          id: newPatientId,
          type: "patient",
          payload: patientPayload,
          status: "pending",
          createdAt: Date.now()
        })
        if (visitPayload && newVisitId) {
          await offlineDb.pendingRecords.add({
            id: newVisitId,
            type: "visit",
            payload: { ...visitPayload, synced_at: null },
            status: "pending",
            createdAt: Date.now()
          })
        }
        setSavedOffline(true)
      }

      setStage("saved")
      setToast(isOffline ? "Record saved locally — will sync when connected" : "Record synced successfully")
      setTimeout(() => setToast(null), 3500)
    } catch (err) {
      console.error(err)
      setToast("Failed to save record.")
      setTimeout(() => setToast(null), 3500)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (imageURL) URL.revokeObjectURL(imageURL)
    setImageURL(null)
    setOcrFields([])
    setFieldValues({})
    setConfirmed({})
    setScanProgress(0)
    setStage("upload")
    setOcrFailed(false)
  }

  // ── Saved state ──────────────────────────────────────────────────────────────
  if (stage === "saved") {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center text-center py-20 gap-6">
        <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-600/30">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2.5}
            className="w-10 h-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-3xl text-teal-950 mb-2">
            Record Digitized!
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            <strong className="text-teal-700">
              {fieldValues["patientName"] || "The patient"}
            </strong>
            's paper record has been digitized and saved. {savedOffline ? "It will sync to the central server automatically." : "It has been synced successfully."}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 text-left w-full max-w-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Extracted Summary
          </p>
          {[
            ["Patient", fieldValues["patientName"]],
            ["Diagnosis", fieldValues["diagnosis"]],
          ].map(([k, v]) => {
            if (!v) return null;
            return (
            <div
              key={k}
              className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0"
            >
              <span className="text-slate-400">{k}</span>
              <span className="font-medium text-slate-700">{v}</span>
            </div>
          )})}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Digitize Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5 pb-10 w-full">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-teal-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl animate-slide-up">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            className="w-4 h-4 text-teal-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 8l4 4 8-8"
            />
          </svg>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
            Digitize Paper Record
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Upload a photo or scan — AI will extract the fields for you to
            review.
          </p>
        </div>
        {stage !== "upload" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3l10 10M13 3L3 13"
              />
            </svg>
            Start over
          </button>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div
        className={`grid gap-5 ${
          stage === "review"
            ? "lg:grid-cols-[1fr_1.1fr]"
            : "grid-cols-1 max-w-2xl mx-auto w-full"
        }`}
      >
        {/* ── LEFT: upload / preview ── */}
        <div className="flex flex-col gap-4">
          
          {ocrFailed && stage === "upload" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-red-800 mb-2">OCR could not identify useful information.</p>
              <p className="text-sm text-red-600 mb-3">Please enter the patient details manually.</p>
            </div>
          )}

          {/* Upload zone */}
          {stage === "upload" && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-5 py-16 px-8 text-center ${
                dragging
                  ? "border-teal-400 bg-teal-50 scale-[1.01]"
                  : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/40"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />

              {/* Icon */}
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${
                  dragging ? "bg-teal-100" : "bg-slate-100"
                }`}
              >
                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                  <rect
                    x="5"
                    y="8"
                    width="30"
                    height="26"
                    rx="3"
                    stroke={dragging ? "#0d9488" : "#94a3b8"}
                    strokeWidth="2"
                  />
                  <path
                    d="M13 20l4 4 10-10"
                    stroke={dragging ? "#0d9488" : "#94a3b8"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 5v10M17 8l3-3 3 3"
                    stroke={dragging ? "#0d9488" : "#cbd5e1"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <p
                  className={`font-semibold text-base mb-1 transition-colors ${
                    dragging ? "text-teal-700" : "text-slate-700"
                  }`}
                >
                  {dragging ? "Drop to scan" : "Drop your photo or scan here"}
                </p>
                <p className="text-sm text-slate-400">
                  or{" "}
                  <span className="text-teal-600 font-semibold underline underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Supports JPG, PNG, HEIC, PDF · Max 20 MB
                </p>
              </div>

              {/* Supported formats */}
              <div className="flex items-center gap-3">
                {[
                  "📄 Printed forms",
                  "📷 Photos of paper",
                  "🔍 Scanned docs",
                ].map((t) => (
                  <span
                    key={t}
                    className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scanning state */}
          {stage === "scanning" && imageURL && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="relative">
                <img
                  src={imageURL}
                  alt="Uploaded record"
                  className="w-full object-contain max-h-72 bg-slate-100"
                  style={{ filter: "grayscale(0.3) contrast(1.05)" }}
                />
                <ScanOverlay />
                <div className="absolute inset-0 bg-teal-900/10" />
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Scanning document…
                  </p>
                  <span className="text-sm font-bold text-teal-600">
                    {scanProgress}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "Loading OCR Engine",
                    "Detecting text regions",
                    "Extracting fields",
                    "Validating output",
                  ].map((step, i) => {
                    const done = scanProgress > (i + 1) * 25
                    const active = scanProgress > i * 25 && !done
                    return (
                      <span
                        key={step}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 ${
                          done
                            ? "bg-teal-100 text-teal-700"
                            : active
                              ? "bg-violet-100 text-violet-700 animate-pulse"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? "✓" : active ? "⟳" : "○"} {step}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Image preview (review stage) */}
          {stage === "review" && imageURL && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Source document
                </p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
                >
                  Replace
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFile(e.target.files[0])
                  }
                />
              </div>
              <img
                src={imageURL}
                alt="Uploaded record"
                className="w-full object-contain max-h-80 bg-slate-100"
                style={{ filter: "grayscale(0.15) contrast(1.1)" }}
              />

              {/* OCR summary strip */}
              <div className="px-4 py-3 bg-teal-50 border-t border-teal-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-3.5 h-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2 7l3 3 7-7"
                    />
                  </svg>
                  {totalFields} fields extracted
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {
                    ocrFields.filter(
                      (f) => getConfidenceTier(f.confidence) === "high",
                    ).length
                  }{" "}
                  high confidence
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {
                    ocrFields.filter(
                      (f) => getConfidenceTier(f.confidence) === "medium",
                    ).length
                  }{" "}
                  medium
                </div>
                {lowConfidenceCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    {lowConfidenceCount} low — review carefully
                  </div>
                )}
                <span className="ml-auto text-[10px] text-teal-600 font-medium">
                  Avg{" "}
                  {Math.round(
                    ocrFields.reduce((s, f) => s + f.confidence, 0) /
                      Math.max(1, totalFields),
                  )}
                  % confidence
                </span>
              </div>
            </div>
          )}

          {/* Tips card (upload stage only) */}
          {stage === "upload" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Tips for best results
              </p>
              <ul className="space-y-2">
                {[
                  "Place document flat on a dark surface",
                  "Ensure all text is in frame and in focus",
                  "Use good lighting — avoid shadows across text",
                  "Works with handwritten and printed records",
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-500"
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 text-[10px]">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── RIGHT: extracted fields ── */}
        {stage === "review" && (
          <div className="flex flex-col gap-4 min-h-0">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-0.5">
                  Review Extracted Fields
                </h2>
                <p className="text-xs text-slate-400">
                  Correct any errors, then confirm each field before saving.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <p className="text-xs font-semibold text-slate-600">
                  {confirmedCount}/{totalFields} confirmed
                </p>
                <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{
                      width: `${(confirmedCount / Math.max(1, totalFields)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Fields list */}
            <div
              className="flex flex-col gap-2.5 overflow-y-auto flex-1"
              style={{ maxHeight: "calc(100vh - 340px)" }}
            >
              {ocrFields.map((field) => (
                <ExtractedField
                  key={field.key}
                  field={field}
                  value={fieldValues[field.key] ?? ""}
                  onChange={(v) =>
                    setFieldValues((prev) => ({ ...prev, [field.key]: v }))
                  }
                  confirmed={!!confirmed[field.key]}
                  onToggle={() =>
                    setConfirmed((prev) => ({
                      ...prev,
                      [field.key]: !prev[field.key],
                    }))
                  }
                />
              ))}
            </div>

            {/* Action bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleConfirmAll}
                disabled={allConfirmed}
                className="text-sm font-semibold text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 disabled:opacity-40 disabled:pointer-events-none px-4 py-2.5 rounded-xl transition-all"
              >
                Confirm all fields
              </button>
              <button
                onClick={handleSave}
                disabled={!allConfirmed || isSaving}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ml-auto ${
                  allConfirmed
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 hover:-translate-y-0.5"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Saving..." : (
                  <>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 11v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2M8 2v8m-3-3l3 3 3-3"
                      />
                    </svg>
                    {allConfirmed
                      ? "Save Record"
                      : `Confirm ${totalFields - confirmedCount} more to save`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scanline CSS */}
      <style>{`
        @keyframes scanline {
          0%   { top: 8px;  opacity: 1; }
          80%  { opacity: 1; }
          95%  { top: calc(100% - 8px); opacity: 0.4; }
          100% { top: 8px;  opacity: 0; }
        }
      `}</style>
    </div>
  )
}
