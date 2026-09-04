import { useState } from "react"
import { supabase } from "./lib/supabase"
import { useAuth } from "./AuthContext"

// ── Types ──────────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1 — Personal
  fullName: string
  dob: string
  age: string
  sex: string
  village: string
  phone: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
  // Step 2 — Medical
  bloodType: string
  allergies: string
  medications: string
  conditions: string[]
  pregnancyStatus: string
  vaccinations: string
  // Step 3 — confirm (read-only)
}

const INITIAL: FormData = {
  fullName: "",
  dob: "",
  age: "",
  sex: "",
  village: "",
  phone: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  bloodType: "",
  allergies: "",
  medications: "",
  conditions: [],
  pregnancyStatus: "",
  vaccinations: "",
}

const STEPS = [
  { n: 1, title: "Personal Info", sub: "Identity & contact" },
  { n: 2, title: "Medical History", sub: "Background & conditions" },
  { n: 3, title: "Review & Submit", sub: "Confirm and register" },
]

const VILLAGES = [
  "Kayes Centre",
  "Dialafara",
  "Sandaré",
  "Bafoulabé",
  "Kéniéba",
  "Mahina",
  "Toukoto",
  "Diéma",
  "Yélimané",
  "Nioro du Sahel",
]
const RELATIONS = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"]
const BLOOD_TYPES = [
  "A+",
  "A−",
  "B+",
  "B−",
  "AB+",
  "AB−",
  "O+",
  "O−",
  "Unknown",
]
const CHRONIC_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "HIV/AIDS",
  "Tuberculosis",
  "Sickle Cell Disease",
  "Malaria (recurrent)",
  "Epilepsy",
  "Malnutrition",
]

// ── Shared field components ────────────────────────────────────────────────────
function Label({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function FieldInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string
  type?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
          error
            ? "border-red-300 bg-red-50 focus:ring-red-200"
            : "border-slate-200 bg-slate-50 focus:ring-teal-500 focus:border-teal-400 focus:bg-white"
        }`}
      />
      {error && <p className="text-[11px] text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  )
}

function FieldSelect({
  id,
  value,
  onChange,
  children,
  error,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all appearance-none bg-no-repeat cursor-pointer ${
          value ? "text-slate-800" : "text-slate-400"
        } ${
          error
            ? "border-red-300 bg-red-50 focus:ring-red-200"
            : "border-slate-200 bg-slate-50 focus:ring-teal-500 focus:border-teal-400 focus:bg-white"
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%2394a3b8' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 12px center",
          backgroundSize: "16px",
        }}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  )
}

// ── Step components ────────────────────────────────────────────────────────────
function Step1({
  data,
  update,
  errors,
}: {
  data: FormData
  update: (k: keyof FormData, v: string) => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-teal-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7a3 3 0 100-6 3 3 0 000 6zM2 14a6 6 0 0112 0"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Identity</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="sm:col-span-2">
            <Label required>Full Name</Label>
            <FieldInput
              id="fullName"
              placeholder="e.g. Mariama Kouyaté"
              value={data.fullName}
              onChange={(v) => update("fullName", v)}
              error={errors.fullName}
            />
          </div>
          <div>
            <Label required>Date of Birth</Label>
            <FieldInput
              id="dob"
              type="date"
              value={data.dob}
              onChange={(v) => update("dob", v)}
              error={errors.dob}
            />
          </div>
          <div>
            <Label required>Age (years)</Label>
            <FieldInput
              id="age"
              type="number"
              placeholder="e.g. 34"
              value={data.age}
              onChange={(v) => update("age", v)}
              error={errors.age}
            />
          </div>
          <div>
            <Label required>Sex</Label>
            <FieldSelect
              id="sex"
              value={data.sex}
              onChange={(v) => update("sex", v)}
              error={errors.sex}
            >
              <option value="" disabled>
                Select sex
              </option>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="O">Other / Prefer not to say</option>
            </FieldSelect>
          </div>
          <div>
            <Label required>Village / Zone</Label>
            <FieldSelect
              id="village"
              value={data.village}
              onChange={(v) => update("village", v)}
              error={errors.village}
            >
              <option value="" disabled>
                Select village or zone
              </option>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </FieldSelect>
          </div>
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-teal-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zm0 0l6 5 6-5"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Contact</h3>
          <span className="text-[10px] text-slate-400 font-medium">
            (Phone optional)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <Label>Phone Number</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +223
              </span>
              <input
                type="tel"
                placeholder="XX XX XX XX"
                value={data.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div />
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-red-50 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-red-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 2v4m0 4h.01M2.93 13.07A8 8 0 1113.07 2.93 8 8 0 012.93 13.07z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            Emergency Contact
          </h3>
          <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wide bg-red-50 px-1.5 py-0.5 rounded">
            Required
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <Label required>Contact Full Name</Label>
            <FieldInput
              id="emergencyName"
              placeholder="e.g. Amadou Kouyaté"
              value={data.emergencyName}
              onChange={(v) => update("emergencyName", v)}
              error={errors.emergencyName}
            />
          </div>
          <div>
            <Label required>Relationship</Label>
            <FieldSelect
              id="emergencyRelation"
              value={data.emergencyRelation}
              onChange={(v) => update("emergencyRelation", v)}
              error={errors.emergencyRelation}
            >
              <option value="" disabled>
                Select relationship
              </option>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </FieldSelect>
          </div>
          <div>
            <Label required>Emergency Phone</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +223
              </span>
              <input
                type="tel"
                placeholder="XX XX XX XX"
                value={data.emergencyPhone}
                onChange={(e) => update("emergencyPhone", e.target.value)}
                className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.emergencyPhone
                    ? "border-red-300 bg-red-50 focus:ring-red-200"
                    : "border-slate-200 bg-slate-50 focus:ring-teal-500 focus:border-teal-400 focus:bg-white"
                }`}
              />
            </div>
            {errors.emergencyPhone && (
              <p className="text-[11px] text-red-500 mt-1 ml-1">
                {errors.emergencyPhone}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step2({
  data,
  update,
  errors,
}: {
  data: FormData
  update: (k: keyof FormData, v: string | string[]) => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  const toggleCondition = (c: string) => {
    const cur = data.conditions
    update(
      "conditions",
      cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c],
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-teal-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 3.5v9M4.5 7h7M2 5.5A3.5 3.5 0 015.5 2h5A3.5 3.5 0 0114 5.5v5a3.5 3.5 0 01-3.5 3.5h-5A3.5 3.5 0 012 10.5v-5z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            Clinical Basics
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <Label>Blood Type</Label>
            <FieldSelect
              id="bloodType"
              value={data.bloodType}
              onChange={(v) => update("bloodType", v)}
            >
              <option value="" disabled>
                Select blood type
              </option>
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </FieldSelect>
          </div>
          <div>
            <Label>Pregnancy Status</Label>
            <FieldSelect
              id="pregnancyStatus"
              value={data.pregnancyStatus}
              onChange={(v) => update("pregnancyStatus", v)}
            >
              <option value="" disabled>
                Select if applicable
              </option>
              <option value="not-applicable">Not applicable</option>
              <option value="pregnant">Currently pregnant</option>
              <option value="postpartum">Postpartum ({"<"} 6 months)</option>
              <option value="unknown">Unknown</option>
            </FieldSelect>
          </div>
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-amber-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 2v4m0 4h.01M13.66 13.66A8 8 0 112.34 2.34a8 8 0 0111.32 11.32z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            Known Allergies
          </h3>
        </div>
        <div>
          <Label>Allergies (drugs, foods, or other)</Label>
          <textarea
            placeholder="e.g. Penicillin (rash), Sulfonamides. Leave blank if none known."
            value={data.allergies}
            onChange={(e) => update("allergies", e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all resize-none"
          />
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-teal-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 2h4l1 3H5L6 2zM3 5h10l-1 9H4L3 5z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            Current Medications
          </h3>
        </div>
        <div>
          <Label>Medications (name + dose if known)</Label>
          <textarea
            placeholder="e.g. Metformin 500mg twice daily, Lisinopril 10mg once daily. Leave blank if none."
            value={data.medications}
            onChange={(e) => update("medications", e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all resize-none"
          />
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-violet-50 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-violet-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 14A6 6 0 108 2a6 6 0 000 12zM8 5v3.5l2 2"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            Chronic Conditions
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">
            (select all that apply)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHRONIC_CONDITIONS.map((c) => {
            const selected = data.conditions.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCondition(c)}
                className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
                  selected
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {selected && <span className="mr-1">✓</span>}
                {c}
              </button>
            )
          })}
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3 h-3 text-emerald-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 8l3 3 5-5"
              />
              <circle cx="8" cy="8" r="6.5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            Vaccination Notes
          </h3>
        </div>
        <div>
          <Label>Known vaccinations (if documented)</Label>
          <textarea
            placeholder="e.g. Yellow fever 2021, BCG (birth). Leave blank if no records available."
            value={data.vaccinations}
            onChange={(e) => update("vaccinations", e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all resize-none"
          />
        </div>
      </div>
    </div>
  )
}

function Step3({ data }: { data: FormData }) {
  const ReviewField = ({
    label,
    value,
    span,
  }: {
    label: string
    value: string
    span?: boolean
  }) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">
        {value || (
          <span className="text-slate-400 italic font-normal">
            Not provided
          </span>
        )}
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ID preview */}
      <div className="flex items-center gap-4 bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4">
        <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-display text-lg flex-shrink-0">
          {data.fullName
            ? data.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
            : "??"}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-0.5">
            Patient Assignment
          </p>
          <p className="font-display text-xl text-teal-950">
            To be auto-generated
          </p>
          <p className="text-xs text-teal-600 mt-0.5">
            Will be registered to your assigned clinic
          </p>
        </div>
      </div>

      {/* Section: Personal */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-4">
          Personal Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <ReviewField label="Full Name" value={data.fullName} span />
          <ReviewField label="Date of Birth" value={data.dob} />
          <ReviewField
            label="Age"
            value={data.age ? `${data.age} years` : ""}
          />
          <ReviewField
            label="Sex"
            value={
              data.sex === "F" ? "Female" : data.sex === "M" ? "Male" : data.sex
            }
          />
          <ReviewField label="Village / Zone" value={data.village} />
          <ReviewField
            label="Phone Number"
            value={data.phone ? `+223 ${data.phone}` : "Not provided"}
          />
        </div>
      </div>

      {/* Section: Emergency */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-4">
          Emergency Contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <ReviewField label="Contact Name" value={data.emergencyName} />
          <ReviewField label="Relationship" value={data.emergencyRelation} />
          <ReviewField
            label="Emergency Phone"
            value={data.emergencyPhone ? `+223 ${data.emergencyPhone}` : ""}
          />
        </div>
      </div>

      {/* Section: Medical */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-4">
          Medical History
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <ReviewField label="Blood Type" value={data.bloodType} />
          <ReviewField
            label="Pregnancy Status"
            value={data.pregnancyStatus.replace(/-/g, " ")}
          />
          <ReviewField label="Known Allergies" value={data.allergies} span />
          <ReviewField
            label="Current Medications"
            value={data.medications}
            span
          />
          <ReviewField
            label="Vaccination Notes"
            value={data.vaccinations}
            span
          />
        </div>
        {data.conditions.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Chronic Conditions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.conditions.map((c) => (
                <span
                  key={c}
                  className="text-xs bg-teal-100 text-teal-800 font-medium px-2.5 py-1 rounded-xl"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Consent note */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
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
        <p className="text-xs text-amber-800 leading-relaxed">
          By submitting, you confirm that verbal consent has been obtained from
          the patient or their guardian and that all information is accurate to
          the best of your knowledge.
        </p>
      </div>
    </div>
  )
}

// ── Validation ─────────────────────────────────────────────────────────────────
function validateStep(
  step: number,
  data: FormData,
): Partial<Record<keyof FormData, string>> {
  const e: Partial<Record<keyof FormData, string>> = {}
  if (step === 1) {
    if (!data.fullName.trim()) e.fullName = "Full name is required"
    if (!data.dob) e.dob = "Date of birth is required"
    if (!data.age || isNaN(Number(data.age)) || Number(data.age) < 0)
      e.age = "Enter a valid age"
    if (!data.sex) e.sex = "Please select a sex"
    if (!data.village) e.village = "Please select a village or zone"
    if (!data.emergencyName.trim())
      e.emergencyName = "Emergency contact name is required"
    if (!data.emergencyRelation)
      e.emergencyRelation = "Please select a relationship"
    if (!data.emergencyPhone.trim())
      e.emergencyPhone = "Emergency phone number is required"
  }
  return e
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function NewPatientPage({
  onSuccess,
}: {
  onSuccess?: (id: string) => void
}) {
  const { profile } = useAuth()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  )
  const [submitted, setSubmitted] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null)

  const update = (k: keyof FormData, v: string | string[]) => {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k])
      setErrors((e) => {
        const n = { ...e }
        delete n[k]
        return n
      })
  }

  const handleNext = async () => {
    const e = validateStep(step, data)
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setErrors({})

    if (step < 3) {
      setStep(step + 1)
    } else {
      if (!profile?.clinic_id) {
        setSubmitError(
          "No clinic ID associated with your profile. Please contact administrator.",
        )
        return
      }

      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const { data: newPatient, error } = await supabase
          .from("patients")
          .insert([
            {
              name: data.fullName,
              age: parseInt(data.age, 10),
              sex: data.sex,
              village: data.village,
              clinic_id: profile.clinic_id,
            },
          ])
          .select("id")
          .single()

        if (error) throw error

        setCreatedPatientId(newPatient.id)
        setSubmitted(true)
      } catch (err: any) {
        setSubmitError(
          err.message ||
            "Failed to register patient. Please check your connection and try again.",
        )
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setErrors({})
    }
  }

  if (submitted && createdPatientId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-600/30 animate-bounce">
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
            Patient Registered!
          </h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            <strong className="text-teal-700">{data.fullName}</strong> has been
            added to your clinic records with ID{" "}
            <span className="font-mono bg-teal-50 px-1 rounded">
              {createdPatientId}
            </span>
            . The record will sync automatically when connected.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setData(INITIAL)
              setStep(1)
              setSubmitted(false)
              setCreatedPatientId(null)
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Register Another
          </button>
          <button
            onClick={() => onSuccess?.(createdPatientId)}
            className="text-sm font-semibold text-teal-700 border border-teal-200 hover:border-teal-400 px-5 py-2.5 rounded-xl transition-colors"
          >
            View Patient Record
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-10">
      {/* ── Page header ── */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
          New Patient Registration
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Complete all required fields. Record is saved locally until synced.
        </p>
      </div>

      {/* ── Step indicator ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
        <div className="flex items-start gap-3">
          {STEPS.map(({ n, title, sub }) => {
            const done = n < step
            const active = n === step
            return (
              <div key={n} className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      done
                        ? "bg-teal-600 text-white"
                        : active
                          ? "bg-teal-600 text-white ring-4 ring-teal-100"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? (
                      <svg
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="white"
                        strokeWidth={2.5}
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2 7l3.5 3.5 6.5-7"
                        />
                      </svg>
                    ) : (
                      n
                    )}
                  </div>
                  {n < 3 && (
                    <div className="flex-1 h-px mx-1">
                      <div
                        className={`h-full transition-all duration-500 ${
                          done ? "bg-teal-500" : "bg-slate-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      active
                        ? "text-teal-700"
                        : done
                          ? "text-teal-600"
                          : "text-slate-400"
                    }`}
                  >
                    {title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                    {sub}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 text-right">
          Step {step} of 3
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-7">
        <div className="mb-6 pb-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-base">
            {STEPS[step - 1].title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{STEPS[step - 1].sub}</p>
        </div>

        {step === 1 && (
          <Step1
            data={data}
            update={update as (k: keyof FormData, v: string) => void}
            errors={errors}
          />
        )}
        {step === 2 && <Step2 data={data} update={update} errors={errors} />}
        {step === 3 && <Step3 data={data} />}

        {/* ── Submit Error Banner ── */}
        {submitError && (
          <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-red-800">{submitError}</p>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-teal-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 4L6 8l4 4"
              />
            </svg>
            Back
          </button>

          {step < 3 && (
            <p className="text-[11px] text-slate-400 hidden sm:block">
              <span className="text-red-400">*</span> Required fields
            </p>
          )}

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-sm shadow-teal-600/20 transition-all ${
              isSubmitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal-600/30"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </>
            ) : (
              <>
                {step === 3 ? "Register Patient" : "Next"}
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 4l4 4-4 4"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
