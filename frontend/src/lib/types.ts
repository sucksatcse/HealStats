// ── Shared TypeScript types derived from the actual HealStats database schema ──
// Source: supabase/migrations/20260831000000_initial_schema.sql
// Do NOT invent columns that don't exist in this schema.

// ── Role ──────────────────────────────────────────────────────────────────────
export type StaffRole = 'worker' | 'admin';

// ── Table row types ────────────────────────────────────────────────────────────
export interface ClinicRow {
  id: string;
  name: string;
  zone: string | null;
  address: string | null;
}

export interface StaffRow {
  id: string;
  name: string;
  role: StaffRole;
  clinic_id: string | null;
  auth_user_id: string | null;
  email: string | null;
  /** Added via migration 20260904000001. May be undefined if migration not applied. */
  is_active?: boolean;
  created_at?: string;
}

export interface PatientRow {
  id: string;
  name: string;
  age: number | null;
  sex: string | null;
  village: string | null;
  clinic_id: string | null;
  created_at: string;
}

export interface VisitRow {
  id: string;
  patient_id: string;
  staff_id: string | null;
  vitals: Record<string, unknown> | null;
  symptoms: string | null;
  symptom_category: string | null;
  diagnosis: string | null;
  /** Integer 1–5 (1=Stable, 2=Low, 3=Moderate, 4=High, 5=Critical). Null means no score recorded. */
  urgency_score: number | null;
  created_at: string;
  /** Null means the record has NOT been synced yet (pending). */
  synced_at: string | null;
}

/** Patient row augmented with its most recent visit (may be null if no visits). */
export interface PatientWithLatestVisit extends PatientRow {
  latest_visit: VisitRow | null;
  clinics?: Pick<ClinicRow, 'id' | 'name' | 'zone'> | null;
  staff?: Pick<StaffRow, 'id' | 'name' | 'role'> | null;
}

/** Staff row with clinic data joined. */
export interface StaffWithClinic extends StaffRow {
  clinics: Pick<ClinicRow, 'id' | 'name' | 'zone'> | null;
}

// ── Urgency helpers ────────────────────────────────────────────────────────────
export type UrgencyLevel = 'Critical' | 'High' | 'Moderate' | 'Low' | 'Stable';

/**
 * Derive a categorical urgency level from a numeric urgency_score (1–5).
 * Scale matches VitalsPage and PatientRecordsPage:
 *   5 = Critical | 4 = High | 3 = Moderate | 2 = Low | 1 (or null) = Stable
 */
export function urgencyFromScore(score: number | null | undefined): UrgencyLevel {
  if (score === null || score === undefined) return 'Stable';
  if (score >= 5) return 'Critical';
  if (score >= 4) return 'High';
  if (score >= 3) return 'Moderate';
  if (score >= 2) return 'Low';
  return 'Stable';
}

/**
 * Returns the inclusive minimum and exclusive maximum score range for a given
 * urgency level. max: null means "no upper bound" (i.e. >= min).
 */
export function urgencyScoreRange(level: UrgencyLevel): { min: number; max: number | null } {
  switch (level) {
    case 'Critical': return { min: 5, max: null };
    case 'High':     return { min: 4, max: 5 };
    case 'Moderate': return { min: 3, max: 4 };
    case 'Low':      return { min: 2, max: 3 };
    case 'Stable':   return { min: 0, max: 2 };
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
/** Shorten a UUID for display: returns the first 8 hex chars upper-cased. */
export function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** Compute initials from a full name (up to 2 letters, skips honorifics). */
export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(sr\.?|dr\.?|mr\.?|ms\.?|mrs\.?)$/i.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'NA';
}

// ── Outbreak Surveillance & Cluster Detection Types (Task 14.5) ────────────────
export interface OutbreakClusterCase {
  visitId: string;
  patientId: string;
  patientName: string;
  patientAge: number | null;
  patientSex: string | null;
  village: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  urgencyScore: number | null;
  createdAt: string;
}

export type OutbreakRiskLevel = 'critical' | 'warning' | 'monitoring';

export interface OutbreakCluster {
  id: string;
  syndromeKey: string;
  syndromeName: string;
  category: string;
  zone: string;
  clinicId: string;
  clinicName: string;
  caseCount: number;
  urgencyMax: number;
  urgencyAvg: number;
  riskLevel: OutbreakRiskLevel;
  dominantSymptoms: string[];
  affectedVillages: string[];
  cases: OutbreakClusterCase[];
  firstDetected: string;
  lastDetected: string;
  recommendedActions: string[];
}

export interface OutbreakAnalysisResult {
  clusters: OutbreakCluster[];
  categoryCounts: Record<string, number>;
  totalVisitsAnalyzed: number;
  timeframeHours: number;
  highestRiskLevel: OutbreakRiskLevel | 'normal';
}

// ── Emergency Triage Queue Types (Task 15) ───────────────────────────────────
export type TriageBand = 'red' | 'yellow' | 'green';
export type TriageLevel = 'Critical' | 'Severe' | 'Elevated';
export type TriageStatus = 'waiting' | 'in_treatment' | 'discharged';

export interface EmergencyTriagePatient {
  id: string;          // Short ID
  patientId: string;   // Full UUID
  visitId?: string;
  name: string;
  age: number | null;
  gender: string | null;
  village?: string | null;
  zone: string;
  clinicId?: string;
  clinicName?: string;
  complaint: string;
  vitalsSummary?: string;
  score: number;       // 1–5 urgency score
  urgencyScore?: number;
  level: TriageLevel;
  band: TriageBand;
  wait: string;
  initials: string;
  status: TriageStatus;
  createdAt: string;
}



