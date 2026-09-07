import { motion } from "framer-motion"
import { PublicHealthStatsData, toBengaliNumerals } from "./lib/publicStatsService"

export interface PublicHealthStatsProps {
  data: PublicHealthStatsData
  lang?: "en" | "bn"
}

export default function PublicHealthStats({ data, lang = "bn" }: PublicHealthStatsProps) {
  const isBn = lang === "bn"

  // Formatted numbers
  const visitsFormatted = isBn
    ? toBengaliNumerals(data.todayVisits)
    : data.todayVisits.toLocaleString()
  const clinicsFormatted = isBn
    ? toBengaliNumerals(data.totalClinics)
    : data.totalClinics.toString()

  const staffPct = isBn
    ? `${toBengaliNumerals(data.supplies.staffPercent)}%`
    : `${data.supplies.staffPercent}%`
  const kitsPct = isBn
    ? `${toBengaliNumerals(data.supplies.kitsPercent)}%`
    : `${data.supplies.kitsPercent}%`
  const ambPct = isBn
    ? `${toBengaliNumerals(data.supplies.ambulancePercent)}%`
    : `${data.supplies.ambulancePercent}%`

  // Traffic-light status dot
  const statusColorClass =
    data.alert.level === "critical"
      ? "bg-rose-500 shadow-rose-500/50"
      : data.alert.level === "warning"
      ? "bg-amber-500 shadow-amber-500/50"
      : "bg-emerald-500 shadow-emerald-500/50"

  return (
    <section className="py-20 px-6 lg:px-10 relative z-10" id="public-stats">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-3.5 py-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 tracking-wider uppercase">
              {isBn ? "জনস্বাস্থ্য পর্যবেক্ষণ" : "Public Health Surveillance"}
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-teal-950 dark:text-white font-bold tracking-tight">
            {isBn
              ? "বাস্তব সময়ের স্বাস্থ্য পরিসংখ্যান"
              : "Real-time Community Health Statistics"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base mt-2.5">
            {isBn
              ? "মাঠপর্যায়ের ক্লিনিক নেটওয়ার্ক থেকে সংগৃহীত নির্ভরযোগ্য স্বাস্থ্য তথ্য"
              : "Simplified health metrics verified across our rural clinic network"}
          </p>
        </div>

        {/* 3 Staggered WhileInView Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* ─── Card A — Today's Visits ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.0, ease: "easeOut" }}
            whileHover={{ scale: 1.02 }}
            className="an-card-glass rounded-2xl p-7 lg:p-8 flex flex-col justify-between border shadow-sm transition-shadow hover:shadow-lg group"
            style={{
              borderColor: "var(--an-border)",
              background: "var(--an-glass-bg)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/40 px-2.5 py-1 rounded-full">
                  {isBn ? "লাইভ" : "Live"}
                </span>
              </div>

              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {isBn ? "আজকের ভিজিট" : "Today's Visits"}
              </p>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-display text-4xl lg:text-5xl font-bold text-teal-950 dark:text-white">
                  {visitsFormatted}
                </span>
                <span className="text-emerald-500 dark:text-emerald-400 text-2xl font-bold">
                  ↑
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-4 border-t border-slate-100 dark:border-slate-800">
              {isBn
                ? `আজ ${clinicsFormatted}টি ক্লিনিকে রোগী সেবা দেওয়া হয়েছে।`
                : `Patients received clinical care across ${clinicsFormatted} clinics today.`}
            </p>
          </motion.div>

          {/* ─── Card B — Health Alerts ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            whileHover={{ scale: 1.02 }}
            className="an-card-glass rounded-2xl p-7 lg:p-8 flex flex-col justify-between border shadow-sm transition-shadow hover:shadow-lg group"
            style={{
              borderColor: "var(--an-border)",
              background: "var(--an-glass-bg)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714zm0 14.286a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full shadow-sm ${statusColorClass} ${
                      data.alert.level !== "normal" ? "animate-pulse" : ""
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
                    {data.alert.level === "critical"
                      ? isBn
                        ? "জরুরি"
                        : "Critical"
                      : data.alert.level === "warning"
                      ? isBn
                        ? "সতর্কতা"
                        : "Warning"
                      : isBn
                      ? "স্বাভাবিক"
                      : "Normal"}
                  </span>
                </div>
              </div>

              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {isBn ? "স্বাস্থ্য সতর্কতা" : "Health Alerts"}
              </p>

              <div className="my-3">
                <p className="text-xl lg:text-2xl font-display font-semibold text-teal-950 dark:text-white leading-snug">
                  {isBn ? data.alert.messageBn : data.alert.messageEn}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-4 border-t border-slate-100 dark:border-slate-800">
              {isBn ? data.alert.subtextBn : data.alert.subtextEn}
            </p>
          </motion.div>

          {/* ─── Card C — Supplies ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.02 }}
            className="an-card-glass rounded-2xl p-7 lg:p-8 flex flex-col justify-between border shadow-sm transition-shadow hover:shadow-lg group"
            style={{
              borderColor: "var(--an-border)",
              background: "var(--an-glass-bg)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                  {isBn ? "পর্যাপ্ত" : "Sufficient"}
                </span>
              </div>

              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {isBn ? "সরবরাহ অবস্থা" : "Supply Status"}
              </p>

              {/* 3 Horizontal Progress Bars */}
              <div className="space-y-3.5 my-2">
                {/* Staff */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{isBn ? "স্টাফ" : "Staff"}</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300">
                      {staffPct}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all duration-700"
                      style={{ width: `${data.supplies.staffPercent}%` }}
                    />
                  </div>
                </div>

                {/* Kits */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{isBn ? "কিটস" : "Kits"}</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300">
                      {kitsPct}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{ width: `${data.supplies.kitsPercent}%` }}
                    />
                  </div>
                </div>

                {/* Ambulance */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{isBn ? "অ্যাম্বুলেন্স" : "Ambulances"}</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300">
                      {ambPct}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-700"
                      style={{ width: `${data.supplies.ambulancePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-4 border-t border-slate-100 dark:border-slate-800">
              {isBn
                ? "জরুরি সেবা ও চিকিৎসা সামগ্রী প্রস্তুত রয়েছে।"
                : "Emergency medical reserves actively provisioned."}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
