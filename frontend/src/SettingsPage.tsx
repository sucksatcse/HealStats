import { useState } from "react"

// ── Icons ────────────────────────────────────────────────────────────────────────
const Icon = {
  facility: (
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
        d="M3 17h14M4 17V7l6-3 6 3v10M8 17v-4h4v4M7.5 8.5h.01M12.5 8.5h.01M7.5 11h.01M12.5 11h.01"
      />
    </svg>
  ),
  roles: (
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
        d="M10 11a3 3 0 100-6 3 3 0 000 6zM4 17v-1a3 3 0 013-3h6a3 3 0 013 3v1M15 4.5l1.2 1.2 2-2.4"
      />
    </svg>
  ),
  bell: (
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
        d="M14.9 15.1a20 20 0 004.1-1A7.5 7.5 0 0116 8.1V8a6 6 0 00-12 0v.1a7.5 7.5 0 01-3 6c1.3.5 2.7.8 4.1 1m5.8 0a18 18 0 01-5.8 0m5.8 0a3 3 0 11-5.8 0"
      />
    </svg>
  ),
  backup: (
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
        d="M3 6c0-1.1 3.1-2 7-2s7 .9 7 2-3.1 2-7 2-7-.9-7-2zM3 6v8c0 1.1 3.1 2 7 2s7-.9 7-2V6M3 10c0 1.1 3.1 2 7 2s7-.9 7-2"
      />
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
  download: (
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
        d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11"
      />
    </svg>
  ),
  cloud: (
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
        d="M12 10a2.5 2.5 0 000-5h-.6A4 4 0 104 9.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 8v5M6 11l2 2 2-2"
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
}

// ── Toggle switch ─────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
        on ? "bg-teal-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────────
function Card({
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
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-start gap-3 px-5 lg:px-6 py-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="px-5 lg:px-6 py-5">{children}</div>
    </div>
  )
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all"

// ── Data ───────────────────────────────────────────────────────────────────────
const ROLE_ROWS = [
  {
    role: "Clinical Officer",
    desc: "Full clinical access — diagnose, prescribe, edit records",
    perms: { records: true, prescribe: true, admin: false },
  },
  {
    role: "Nurse",
    desc: "Record vitals, view histories, add visit notes",
    perms: { records: true, prescribe: false, admin: false },
  },
  {
    role: "Community Health Worker",
    desc: "Register patients, capture vitals in the field",
    perms: { records: true, prescribe: false, admin: false },
  },
  {
    role: "District Administrator",
    desc: "Manage staff, facilities, and system configuration",
    perms: { records: true, prescribe: false, admin: true },
  },
]

const NOTIF_ROWS = [
  {
    key: "critical",
    label: "Critical patient alerts",
    desc: "Push a notification the moment AI triage flags a critical case",
    on: true,
  },
  {
    key: "sync",
    label: "Sync failures",
    desc: "Alert admins when a device fails to sync for over 24 hours",
    on: true,
  },
  {
    key: "daily",
    label: "Daily summary digest",
    desc: "Email a roll-up of visits, records, and flagged patients",
    on: false,
  },
  {
    key: "staff",
    label: "New staff sign-ins",
    desc: "Notify when a worker activates their account on a new device",
    on: false,
  },
]

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [facility, setFacility] = useState({
    name: "Kayes District Clinic",
    id: "CLINIC-0142",
    address: "Route de Bamako, Kayes, Mali",
    phone: "+223 21 52 00 14",
    email: "contact@kayes.health",
    timezone: "GMT (UTC+0)",
  })
  const [roles, setRoles] = useState(ROLE_ROWS)
  const [notifs, setNotifs] = useState(NOTIF_ROWS)
  const [autoBackup, setAutoBackup] = useState(true)
  const [wifiOnly, setWifiOnly] = useState(true)
  const [toast, setToast] = useState("")

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2600)
  }

  const setField = (k: keyof typeof facility, v: string) =>
    setFacility((f) => ({ ...f, [k]: v }))
  const togglePerm = (i: number, perm: "records" | "prescribe" | "admin") =>
    setRoles((rs) =>
      rs.map((r, ri) =>
        ri === i ? { ...r, perms: { ...r.perms, [perm]: !r.perms[perm] } } : r,
      ),
    )
  const toggleNotif = (i: number) =>
    setNotifs((ns) => ns.map((n, ni) => (ni === i ? { ...n, on: !n.on } : n)))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-teal-950">
            Facility Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure clinic details, access, alerts, and data handling
          </p>
        </div>
        <button
          onClick={() => flash("Settings saved successfully")}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:-translate-y-0.5"
        >
          {Icon.save}
          Save Changes
        </button>
      </div>

      {/* Facility Info */}
      <Card
        icon={Icon.facility}
        title="Facility Info"
        desc="Basic details for this clinic location."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Facility Name
            </label>
            <input
              value={facility.name}
              onChange={(e) => setField("name", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Address
            </label>
            <input
              value={facility.address}
              onChange={(e) => setField("address", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Contact Phone
            </label>
            <input
              value={facility.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Contact Email
            </label>
            <input
              value={facility.email}
              onChange={(e) => setField("email", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Facility ID
            </label>
            <input
              value={facility.id}
              disabled
              className={`${inputCls} !bg-slate-100 text-slate-400 cursor-not-allowed font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <select
                value={facility.timezone}
                onChange={(e) => setField("timezone", e.target.value)}
                className={`${inputCls} appearance-none pr-9 cursor-pointer`}
              >
                {[
                  "GMT (UTC+0)",
                  "West Africa (UTC+1)",
                  "East Africa (UTC+3)",
                  "Nepal (UTC+5:45)",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                {Icon.chevronDown}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* User Roles & Permissions */}
      <Card
        icon={Icon.roles}
        title="User Roles & Permissions"
        desc="Control what each role can do in the system."
      >
        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 px-1 pb-2 mb-1 border-b border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Role
          </span>
          {["Records", "Prescribe", "Admin"].map((h) => (
            <span
              key={h}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center"
            >
              {h}
            </span>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {roles.map((r, i) => (
            <div
              key={r.role}
              className="grid sm:grid-cols-[1fr_80px_80px_80px] gap-y-3 gap-x-2 items-center py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{r.role}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {r.desc}
                </p>
              </div>
              {(["records", "prescribe", "admin"] as const).map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-2 sm:justify-center"
                >
                  <span className="text-[11px] font-medium text-slate-400 capitalize sm:hidden w-16">
                    {perm}
                  </span>
                  <Toggle
                    on={r.perms[perm]}
                    onChange={() => togglePerm(i, perm)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card
        icon={Icon.bell}
        title="Notification Preferences"
        desc="Choose which alerts your team receives."
      >
        <div className="divide-y divide-slate-100">
          {notifs.map((n, i) => (
            <div
              key={n.key}
              className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">{n.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {n.desc}
                </p>
              </div>
              <Toggle on={n.on} onChange={() => toggleNotif(i)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Data Backup / Export */}
      <Card
        icon={Icon.backup}
        title="Data Backup & Export"
        desc="Manage how patient data is backed up and exported."
      >
        {/* Toggles */}
        <div className="divide-y divide-slate-100 mb-5">
          <div className="flex items-center justify-between gap-4 pb-3.5">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Automatic cloud backup
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Encrypt and push local records to central servers on a schedule
              </p>
            </div>
            <Toggle on={autoBackup} onChange={() => setAutoBackup((v) => !v)} />
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Back up over Wi-Fi only
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Avoid using mobile data for large backups in the field
              </p>
            </div>
            <Toggle on={wifiOnly} onChange={() => setWifiOnly((v) => !v)} />
          </div>
        </div>

        {/* Status banner */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
          <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            {Icon.cloud}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900">
              Last backup completed
            </p>
            <p className="text-xs text-emerald-700">
              Today at 04:00 · 12,847 records · encrypted
            </p>
          </div>
        </div>

        {/* Export actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => flash("Export started — CSV will download shortly")}
            className="flex items-center gap-2 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-2.5 rounded-xl transition-colors"
          >
            {Icon.download}
            Export as CSV
          </button>
          <button
            onClick={() => flash("Export started — PDF will download shortly")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700 px-4 py-2.5 rounded-xl transition-colors"
          >
            {Icon.download}
            Export as PDF
          </button>
          <button
            onClick={() => flash("Manual backup queued")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700 px-4 py-2.5 rounded-xl transition-colors"
          >
            {Icon.cloud}
            Back Up Now
          </button>
        </div>

        {/* Danger note */}
        <p className="text-[11px] text-slate-400 mt-5 leading-relaxed">
          Exports contain protected health information. Handle downloaded files
          according to your district data-protection policy.
        </p>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-teal-950 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            {Icon.check}
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
