import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchOutbreakAnalysis,
  type OutbreakCluster,
  type OutbreakRiskLevel,
  type OutbreakAnalysisResult,
} from "./lib/adminService";
import { shortId } from "./lib/types";

interface OutbreakDetectionPageProps {
  clinicId?: string | null;
  onViewPatient?: (patientId: string) => void;
}

export default function OutbreakDetectionPage({
  clinicId,
  onViewPatient,
}: OutbreakDetectionPageProps) {
  const [analysis, setAnalysis] = useState<OutbreakAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [hours, setHours] = useState<number>(168); // Default 7 days to cover current database visits
  const [sensitivity, setSensitivity] = useState<"standard" | "high">("standard");
  const [selectedSyndrome, setSelectedSyndrome] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  // Protocol checkboxes state (persisted locally)
  const [checkedProtocols, setCheckedProtocols] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("healstats_outbreak_protocols");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleProtocol = (key: string) => {
    setCheckedProtocols((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("healstats_outbreak_protocols", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOutbreakAnalysis({
        clinicId,
        hours,
        sensitivity,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setAnalysis(res.data);
      }
    } catch (err) {
      console.error("[OutbreakDetectionPage] loadData error:", err);
      setError("An unexpected error occurred while analyzing outbreak data.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, hours, sensitivity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique zones from clusters
  const availableZones = useMemo(() => {
    if (!analysis?.clusters) return [];
    return Array.from(new Set(analysis.clusters.map((c) => c.zone)));
  }, [analysis]);

  // Filtered clusters
  const filteredClusters = useMemo(() => {
    if (!analysis?.clusters) return [];
    return analysis.clusters.filter((c) => {
      if (selectedSyndrome !== "all" && c.category !== selectedSyndrome) return false;
      if (selectedRisk !== "all" && c.riskLevel !== selectedRisk) return false;
      if (selectedZone !== "all" && c.zone !== selectedZone) return false;
      return true;
    });
  }, [analysis, selectedSyndrome, selectedRisk, selectedZone]);

  // Export Epidemiological Situation Report CSV
  const handleExportCSV = () => {
    if (!analysis) return;
    const now = new Date().toISOString();
    const headers = [
      "HealStats Epidemiological Outbreak Surveillance Report",
      `Generated At: ${now}`,
      `Surveillance Timeframe: ${hours} Hours`,
      `Sensitivity Mode: ${sensitivity}`,
      "",
      "Cluster ID,Syndrome,Category,Zone,Clinic,Case Count,Max Urgency,Risk Level,Affected Villages,Dominant Symptoms,First Case,Last Case",
    ];

    const rows = analysis.clusters.map((c) =>
      [
        `"${c.id}"`,
        `"${c.syndromeName}"`,
        `"${c.category}"`,
        `"${c.zone}"`,
        `"${c.clinicName}"`,
        c.caseCount,
        `${c.urgencyMax}/5`,
        `"${c.riskLevel.toUpperCase()}"`,
        `"${c.affectedVillages.join("; ")}"`,
        `"${c.dominantSymptoms.join("; ")}"`,
        `"${new Date(c.firstDetected).toLocaleString()}"`,
        `"${new Date(c.lastDetected).toLocaleString()}"`,
      ].join(",")
    );

    const linkedCasesHeader = [
      "",
      "--- LINKED CLINICAL CASES BREAKDOWN ---",
      "Cluster Syndrome,Patient Name,Short ID,Age,Sex,Village,Urgency,Recorded At,Symptoms,Diagnosis",
    ];

    const caseRows: string[] = [];
    for (const c of analysis.clusters) {
      for (const cs of c.cases) {
        caseRows.push(
          [
            `"${c.syndromeName}"`,
            `"${cs.patientName}"`,
            `"${shortId(cs.patientId)}"`,
            cs.patientAge ?? "N/A",
            cs.patientSex ?? "N/A",
            `"${cs.village ?? "N/A"}"`,
            `${cs.urgencyScore ?? 1}/5`,
            `"${new Date(cs.createdAt).toLocaleString()}"`,
            `"${(cs.symptoms ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
            `"${(cs.diagnosis ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
          ].join(",")
        );
      }
    }

    const csvContent = [...headers, ...rows, ...linkedCasesHeader, ...caseRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `healstats_outbreak_surveillance_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalClusterCases = useMemo(() => {
    if (!analysis?.clusters) return 0;
    return analysis.clusters.reduce((sum, c) => sum + c.caseCount, 0);
  }, [analysis]);

  const activeEpicentersCount = useMemo(() => {
    if (!analysis?.clusters) return 0;
    return new Set(analysis.clusters.map((c) => c.zone)).size;
  }, [analysis]);

  const dominantCategory = useMemo(() => {
    if (!analysis?.categoryCounts) return "None";
    const entries = Object.entries(analysis.categoryCounts);
    entries.sort((a, b) => b[1] - a[1]);
    if (entries[0] && entries[0][1] > 0) {
      const map: Record<string, string> = {
        fever: "Acute Febrile / Malaria",
        "diarrhea/gastrointestinal": "Waterborne / Diarrhea",
        respiratory: "Acute Respiratory (ARI)",
        "skin/rash": "Cutaneous / Measles",
        other: "Other Syndromes",
      };
      return map[entries[0][0]] || entries[0][0];
    }
    return "Surveillance Stable";
  }, [analysis]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Surveillance Status Banner ── */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-sm ${
          analysis?.highestRiskLevel === "critical"
            ? "bg-red-500/10 border-red-500/30 dark:bg-red-950/30 dark:border-red-800"
            : analysis?.highestRiskLevel === "warning"
            ? "bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/30 dark:border-amber-800"
            : "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/30 dark:border-emerald-800"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                analysis?.highestRiskLevel === "critical"
                  ? "bg-red-600 animate-pulse"
                  : analysis?.highestRiskLevel === "warning"
                  ? "bg-amber-600"
                  : "bg-emerald-600"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
                <circle cx="12" cy="12" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                    analysis?.highestRiskLevel === "critical"
                      ? "bg-red-600 text-white"
                      : analysis?.highestRiskLevel === "warning"
                      ? "bg-amber-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  {analysis?.highestRiskLevel === "critical"
                    ? "Epidemic Alert — Critical Cluster Detected"
                    : analysis?.highestRiskLevel === "warning"
                    ? "Surveillance Watch — Emerging Cluster"
                    : "Epidemic Surveillance Normal"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Analysis Window: Past {hours >= 24 ? `${hours / 24} Days` : `${hours}h`}
                </span>
              </div>
              <h1 className="font-display text-xl lg:text-2xl text-slate-900 dark:text-white mt-1">
                Outbreak Surveillance & Symptom Radar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mt-0.5">
                Automated threshold-based symptom clustering analyzing recent clinical visits in Supabase to flag potential waterborne, febrile, or respiratory epidemic trends early.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-500" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "Analyzing…" : "Refresh Radar"}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!analysis || analysis.clusters.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11" />
              </svg>
              Export Report (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* ── Key Surveillance Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active Clusters
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center text-xs font-bold">
              ⚡
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {loading ? "…" : analysis?.clusters.length ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-red-500 font-semibold">
              {analysis?.clusters.filter((c) => c.riskLevel === "critical").length ?? 0} critical
            </span>
            <span>·</span>
            <span className="text-amber-500 font-semibold">
              {analysis?.clusters.filter((c) => c.riskLevel === "warning").length ?? 0} warning
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Cluster-Linked Cases
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center text-xs font-bold">
              👥
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {loading ? "…" : totalClusterCases}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            from {analysis?.totalVisitsAnalyzed ?? 0} recent visits analyzed
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active Epicenters
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center text-xs font-bold">
              📍
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {loading ? "…" : activeEpicentersCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {availableZones.length > 0 ? availableZones.join(", ") : "District surveillance clear"}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Primary Syndrome
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center text-xs font-bold">
              🔬
            </div>
          </div>
          <p className="text-xl font-display font-bold text-slate-900 dark:text-white truncate" title={dominantCategory}>
            {loading ? "…" : dominantCategory}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Highest relative frequency
          </p>
        </div>
      </div>

      {/* ── Filters & Threshold Configuration Bar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Window Buttons */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {[
                { label: "48 Hours", val: 48 },
                { label: "7 Days", val: 168 },
                { label: "30 Days", val: 720 },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setHours(t.val)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    hours === t.val
                      ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Syndrome Category Filter */}
            <select
              value={selectedSyndrome}
              onChange={(e) => setSelectedSyndrome(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Syndromes</option>
              <option value="diarrhea/gastrointestinal">Waterborne / Diarrhea</option>
              <option value="fever">Acute Febrile / Malaria</option>
              <option value="respiratory">Respiratory (ARI)</option>
              <option value="skin/rash">Cutaneous / Measles</option>
            </select>

            {/* Risk Level Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical Outbreaks</option>
              <option value="warning">Warning Clusters</option>
              <option value="monitoring">Watch / Sentinel</option>
            </select>

            {/* Zone Filter */}
            {availableZones.length > 1 && (
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Zones</option>
                {availableZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sensitivity Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sensitivity:</span>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSensitivity("standard")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  sensitivity === "standard"
                    ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="Standard epidemic threshold (>=2 cases in zone/clinic)"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setSensitivity("high")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  sensitivity === "high"
                    ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="Early Warning high sensitivity (flags >=1 high urgency case as cluster)"
              >
                Early Warning
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content: Clusters List & Category Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detected Clusters List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Detected Outbreak Clusters</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredClusters.length}
              </span>
            </h2>
          </div>

          {error && (
            <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={loadData}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse space-y-3">
                  <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredClusters.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Surveillance Normal — No Active Clusters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                No clinical presentations in the past {hours >= 24 ? `${hours / 24} days` : `${hours} hours`} exceed outbreak clustering thresholds for the selected filters.
              </p>
              {(selectedSyndrome !== "all" || selectedRisk !== "all" || selectedZone !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSyndrome("all");
                    setSelectedRisk("all");
                    setSelectedZone("all");
                  }}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClusters.map((cluster) => {
                const isExpanded = expandedClusterId === cluster.id;
                return (
                  <div
                    key={cluster.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs ${
                      cluster.riskLevel === "critical"
                        ? "border-red-300 dark:border-red-900/60 ring-1 ring-red-500/20"
                        : cluster.riskLevel === "warning"
                        ? "border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                cluster.riskLevel === "critical"
                                  ? "bg-red-600 text-white animate-pulse"
                                  : cluster.riskLevel === "warning"
                                  ? "bg-amber-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {cluster.riskLevel === "critical"
                                ? "CRITICAL OUTBREAK"
                                : cluster.riskLevel === "warning"
                                ? "WARNING CLUSTER"
                                : "WATCH / SENTINEL"}
                            </span>

                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                              {cluster.zone}
                            </span>

                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {cluster.clinicName}
                            </span>
                          </div>

                          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                            {cluster.syndromeName}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span>Affected Villages:</span>
                            {cluster.affectedVillages.map((v) => (
                              <span
                                key={v}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Cluster Stat Pill */}
                        <div className="sm:text-right flex-shrink-0 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Case Count
                          </p>
                          <p className="text-2xl font-display font-black text-slate-900 dark:text-white leading-tight">
                            {cluster.caseCount}{" "}
                            <span className="text-xs font-medium text-slate-400">
                              cases
                            </span>
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[11px]">
                            <span className="text-slate-400">Max Urgency:</span>
                            <span
                              className={`font-bold ${
                                cluster.urgencyMax >= 4
                                  ? "text-red-500"
                                  : cluster.urgencyMax === 3
                                  ? "text-amber-500"
                                  : "text-teal-500"
                              }`}
                            >
                              {cluster.urgencyMax}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Symptoms Chips */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Primary Symptoms:
                        </span>
                        {cluster.dominantSymptoms.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                          >
                            {s}
                          </span>
                        ))}
                        <span className="text-xs text-slate-400 ml-auto">
                          First: {new Date(cluster.firstDetected).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Latest: {new Date(cluster.lastDetected).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Response Protocol Checklist */}
                      <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <span>📋 WHO / Field Protocol Action Checklist</span>
                          <span className="text-[10px] text-slate-400 font-normal lowercase">
                            (click to check off tasks)
                          </span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cluster.recommendedActions.map((action, i) => {
                            const pKey = `${cluster.id}_action_${i}`;
                            const isChecked = !!checkedProtocols[pKey];
                            return (
                              <label
                                key={i}
                                className={`flex items-start gap-2 text-xs p-2 rounded-lg cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 line-through opacity-75"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleProtocol(pKey)}
                                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                                <span>{action}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Linked Patients Toggle Button */}
                      <div className="mt-4 pt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 cursor-pointer"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
                          </svg>
                          {isExpanded
                            ? "Hide linked clinical cases"
                            : `View ${cluster.cases.length} linked patient cases`}
                        </button>

                        <span className="text-[11px] text-slate-400">
                          Cluster ID: {cluster.id}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Linked Patients Sub-Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-b-2xl">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                          Linked Case Admissions (Intake Log)
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                                <th className="pb-2">Patient</th>
                                <th className="pb-2">ID</th>
                                <th className="pb-2">Demographics</th>
                                <th className="pb-2">Village</th>
                                <th className="pb-2">Urgency</th>
                                <th className="pb-2">Symptoms & Diagnosis</th>
                                <th className="pb-2">Intake Time</th>
                                <th className="pb-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {cluster.cases.map((cs) => (
                                <tr key={cs.visitId} className="hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                                  <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                                    {cs.patientName}
                                  </td>
                                  <td className="py-2.5 font-mono text-slate-500">
                                    {shortId(cs.patientId)}
                                  </td>
                                  <td className="py-2.5 text-slate-500">
                                    {cs.patientAge ? `${cs.patientAge}y` : "—"} · {cs.patientSex ?? "—"}
                                  </td>
                                  <td className="py-2.5 text-slate-600 dark:text-slate-300">
                                    {cs.village ?? "—"}
                                  </td>
                                  <td className="py-2.5">
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        (cs.urgencyScore ?? 1) >= 4
                                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                          : (cs.urgencyScore ?? 1) === 3
                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                          : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                      }`}
                                    >
                                      {cs.urgencyScore ?? 1}/5
                                    </span>
                                  </td>
                                  <td className="py-2.5 max-w-xs truncate text-slate-600 dark:text-slate-300" title={`${cs.symptoms} — ${cs.diagnosis}`}>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {cs.diagnosis || "Under assessment"}
                                    </span>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {cs.symptoms}
                                    </p>
                                  </td>
                                  <td className="py-2.5 text-slate-400 whitespace-nowrap">
                                    {new Date(cs.createdAt).toLocaleDateString()}{" "}
                                    {new Date(cs.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    {onViewPatient && (
                                      <button
                                        type="button"
                                        onClick={() => onViewPatient(cs.patientId)}
                                        className="px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-semibold text-[11px] transition-colors cursor-pointer"
                                      >
                                        View Patient →
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Category Distribution & Epidemic SOPs */}
        <div className="space-y-6">
          {/* Symptom Category Surveillance Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Symptom Category Surveillance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of all clinical visit categories across clinics in this timeframe.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { key: "fever", label: "Acute Febrile / Malaria", color: "bg-amber-500" },
                { key: "diarrhea/gastrointestinal", label: "Waterborne / Diarrhea", color: "bg-sky-500" },
                { key: "respiratory", label: "Respiratory (ARI)", color: "bg-teal-500" },
                { key: "skin/rash", label: "Cutaneous / Measles", color: "bg-rose-500" },
                { key: "other", label: "Other / Uncategorized", color: "bg-slate-400" },
              ].map((item) => {
                const count = analysis?.categoryCounts[item.key] || 0;
                const total = analysis?.totalVisitsAnalyzed || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WHO / MSF Outbreak Response SOP Guidelines Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3.5">
            <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🛡️ Epidemic Intervention Standards</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                <p className="font-bold text-sky-900 dark:text-sky-300">Waterborne / AWD Protocol</p>
                <p className="text-[11px] text-sky-800 dark:text-sky-400 mt-0.5">
                  Threshold: ≥3 cases within 48h. Establish oral rehydration points (ORPs) within 500m of affected blocks. Request emergency water quality testing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                <p className="font-bold text-amber-900 dark:text-amber-300">Vector-Borne / Malaria Surge</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                  Threshold: 2× baseline positivity. Confirm via RDT. Initiate vector source reduction, larviciding, and distribution of LLIN bednets to affected shelters.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50">
                <p className="font-bold text-teal-900 dark:text-teal-300">Acute Respiratory Infection (ARI)</p>
                <p className="text-[11px] text-teal-800 dark:text-teal-400 mt-0.5">
                  Enforce droplet isolation triage. Prioritize pulse oximetry monitoring for children under 5 and elderly patients presenting with shortness of breath.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
