import { useState } from "react"
import { useTranslation } from "react-i18next"

// ── Icons ────────────────────────────────────────────────────────────────────────
const Icon = {
  back: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4L6 8l4 4" />
    </svg>
  ),
  person: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM4 17v-1a4 4 0 014-4h4a4 4 0 014 4v1"
      />
    </svg>
  ),
  heart: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 17s-6-3.8-6-8.2A3.3 3.3 0 0110 6a3.3 3.3 0 016 2.8C16 13.2 10 17 10 17z"
      />
    </svg>
  ),
  clipboard: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 4H5a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 005 17h10a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0015 4h-2M7 4a1 1 0 011-1h4a1 1 0 011 1v.5a1 1 0 01-1 1H8a1 1 0 01-1-1V4zM7 10h6M7 13h4"
      />
    </svg>
  ),
  notes: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="w-4.5 h-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4.5A1.5 1.5 0 015.5 3h9A1.5 1.5 0 0116 4.5v11A1.5 1.5 0 0114.5 17h-9A1.5 1.5 0 014 15.5v-11zM7 7h6M7 10h6M7 13h3"
      />
    </svg>
  ),
  chevronDown: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  ),
  save: (
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
        d="M3 3h8l2 2v8H3V3zM6 3v3h4V3M6 13v-3h4v3"
      />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      className="w-3.5 h-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l3.5 3.5L13 4"
      />
    </svg>
  ),
}

export type PatientRecord = {
  id: string
  name: string
  age: number | string
  gender: string
  village: string
  phone?: string
  height?: string
  weight?: string
  bp?: string
  temp?: string
  hr?: string
  diagnosis?: string
  treatment?: string
  urgency?: string
  notes?: string
}

const VILLAGES = ["Diamou", "Sadiola", "Kéniéba", "Yélimané", "Nioro"]
const GENDERS = ["Female", "Male", "Other"]
const URGENCIES = ["Stable", "Low", "Moderate", "High", "Critical"]
const GENDER_KEY: Record<string, string> = {
  Female: "genderFemale",
  Male: "genderMale",
  Other: "genderOther",
}

// ── Reusable field components ────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
        {label}
        {hint && (
          <span className="ml-1.5 font-medium normal-case tracking-normal text-slate-300 dark:text-slate-600">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white dark:focus:bg-slate-900 transition-all"

function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  )
}

function SelectField({
  value,
  onChange,
  options,
  labels,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  labels?: (o: string) => string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-9 cursor-pointer`}
      >
        {options.map((o) => (
          <option key={o} value={o}>{labels ? labels(o) : o}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
        {Icon.chevronDown}
      </span>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────────
function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6 py-7">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
interface PatientFormPageProps {
  patient?: PatientRecord | null
  onSave: (record: PatientRecord) => void
  onCancel: () => void
}

export default function PatientFormPage({
  patient,
  onSave,
  onCancel,
}: PatientFormPageProps) {
  const { t } = useTranslation()
  const isEdit = !!patient
  const [form, setForm] = useState<PatientRecord>({
    id:
      patient?.id ?? `PT-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    name: patient?.name ?? "",
    age: patient?.age ?? "",
    gender: patient?.gender ?? "Female",
    village: patient?.village ?? VILLAGES[0],
    phone: patient?.phone ?? "",
    height: patient?.height ?? "",
    weight: patient?.weight ?? "",
    bp: patient?.bp ?? "",
    temp: patient?.temp ?? "",
    hr: patient?.hr ?? "",
    diagnosis: patient?.diagnosis ?? "",
    treatment: patient?.treatment ?? "",
    urgency: patient?.urgency ?? "Stable",
    notes: patient?.notes ?? "",
  })
  const [error, setError] = useState("")
  const set = <K extends keyof PatientRecord>(k: K, v: PatientRecord[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setError("")
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!String(form.name).trim() || !String(form.age).toString().trim()) {
      setError(t("patientForm:errRequired"))
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors group mb-3"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">
            {Icon.back}
          </span>
          {t("patientForm:backToRecords")}
        </button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl text-teal-950 dark:text-white">
              {isEdit ? t("patientForm:editTitle") : t("patientForm:addTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEdit
                ? t("patientForm:updating", { name: patient?.name })
                : t("patientForm:createSubtitle")}{" "}
              · <span className="font-mono">{form.id}</span>
            </p>
          </div>
          {isEdit && (
            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-full">
              {t("patientForm:editingBadge")}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400 dark:text-red-500"
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

      {/* Form card with divided sections */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-5 lg:px-8 divide-y divide-slate-100 dark:divide-slate-800">
        {/* Personal Info */}
        <Section
          icon={Icon.person}
          title={t("patientForm:secPersonalTitle")}
          desc={t("patientForm:secPersonalDesc")}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("patientForm:fFullName")} className="sm:col-span-2">
              <TextField
                value={String(form.name)}
                onChange={(v) => set("name", v)}
                placeholder={t("patientForm:phFullName")}
              />
            </Field>
            <Field label={t("patientForm:fAge")}>
              <TextField
                type="number"
                value={String(form.age)}
                onChange={(v) => set("age", v)}
                placeholder={t("patientForm:phYears")}
              />
            </Field>
            <Field label={t("patientForm:fGender")}>
              <SelectField
                value={form.gender}
                onChange={(v) => set("gender", v)}
                options={GENDERS}
                labels={(o) => t(`patientForm:${GENDER_KEY[o]}`)}
              />
            </Field>
            <Field label={t("patientForm:fVillageZone")}>
              <SelectField
                value={form.village}
                onChange={(v) => set("village", v)}
                options={VILLAGES}
              />
            </Field>
            <Field label={t("patientForm:fPhone")} hint={t("patientForm:optional")}>
              <TextField
                type="tel"
                value={form.phone ?? ""}
                onChange={(v) => set("phone", v)}
                placeholder={t("patientForm:phPhone")}
              />
            </Field>
          </div>
        </Section>

        {/* Vitals */}
        <Section
          icon={Icon.heart}
          title={t("patientForm:secVitalsTitle")}
          desc={t("patientForm:secVitalsDesc")}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label={t("patientForm:fHeight")} hint={t("patientForm:unitCm")}>
              <TextField
                value={form.height ?? ""}
                onChange={(v) => set("height", v)}
                placeholder={t("patientForm:phHeight")}
              />
            </Field>
            <Field label={t("patientForm:fWeight")} hint={t("patientForm:unitKg")}>
              <TextField
                value={form.weight ?? ""}
                onChange={(v) => set("weight", v)}
                placeholder={t("patientForm:phWeight")}
              />
            </Field>
            <Field label={t("patientForm:fHr")} hint={t("patientForm:unitBpm")}>
              <TextField
                value={form.hr ?? ""}
                onChange={(v) => set("hr", v)}
                placeholder={t("patientForm:phHr")}
              />
            </Field>
            <Field label={t("patientForm:fBp")} hint={t("patientForm:unitMmhg")}>
              <TextField
                value={form.bp ?? ""}
                onChange={(v) => set("bp", v)}
                placeholder={t("patientForm:phBp")}
              />
            </Field>
            <Field label={t("patientForm:fTemp")} hint={t("patientForm:unitC")}>
              <TextField
                value={form.temp ?? ""}
                onChange={(v) => set("temp", v)}
                placeholder={t("patientForm:phTemp")}
              />
            </Field>
          </div>
        </Section>

        {/* Diagnosis & Treatment */}
        <Section
          icon={Icon.clipboard}
          title={t("patientForm:secDxTitle")}
          desc={t("patientForm:secDxDesc")}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("patientForm:fDiagnosis")} className="sm:col-span-2">
              <TextField
                value={form.diagnosis ?? ""}
                onChange={(v) => set("diagnosis", v)}
                placeholder={t("patientForm:phDiagnosis")}
              />
            </Field>
            <Field label={t("patientForm:fUrgency")}>
              <SelectField
                value={form.urgency ?? "Stable"}
                onChange={(v) => set("urgency", v)}
                options={URGENCIES}
                labels={(o) => t(`urgency:${o}`)}
              />
            </Field>
            <div className="hidden sm:block" />
            <Field label={t("patientForm:fTreatment")} className="sm:col-span-2">
              <textarea
                value={form.treatment ?? ""}
                onChange={(e) => set("treatment", e.target.value)}
                rows={3}
                placeholder={t("patientForm:phTreatment")}
                className={`${inputCls} resize-y`}
              />
            </Field>
          </div>
        </Section>

        {/* Visit Notes */}
        <Section
          icon={Icon.notes}
          title={t("patientForm:secNotesTitle")}
          desc={t("patientForm:secNotesDesc")}
        >
          <Field label={t("patientForm:fNotes")}>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              placeholder={t("patientForm:phNotes")}
              className={`${inputCls} resize-y`}
            />
          </Field>
        </Section>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t("patientForm:syncNote")}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-5 py-2.5 rounded-xl transition-colors"
          >
            {t("patientForm:cancel")}
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5"
          >
            {Icon.save}
            {isEdit ? t("patientForm:saveChanges") : t("patientForm:createRecord")}
          </button>
        </div>
      </div>
    </form>
  )
}
