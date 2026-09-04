/**
 * adminService.ts
 * All Supabase data operations for the Admin Panel (Tasks 10–13).
 * Uses the real database schema — no mock data.
 */
import { supabase } from './supabase';
import {
  type StaffRole,
  type PatientRow,
  type VisitRow,
  type StaffWithClinic,
  type PatientWithLatestVisit,
  type UrgencyLevel,
  urgencyScoreRange,
} from './types';

// Re-export types that consumers import from this module
export type { StaffWithClinic, PatientWithLatestVisit } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 10 — ADMIN DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════════

export interface AdminStats {
  totalPatients: number | null;
  recordsToday: number | null;
  pendingSync: number | null;
  highRiskFlagged: number | null;
  errors: {
    totalPatients: boolean;
    recordsToday: boolean;
    pendingSync: boolean;
    highRiskFlagged: boolean;
  };
}

/**
 * Fetches all four dashboard stat cards in parallel using Promise.allSettled.
 * Individual failures do NOT crash the whole dashboard.
 *
 * @param clinicId - The admin's clinic ID. Null = no clinic filter.
 */
export async function fetchAdminStats(clinicId: string | null): Promise<AdminStats> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [patientsRes, todayRes, pendingRes, highRiskRes] = await Promise.allSettled([
    // 1. Total patients — count only, no rows returned (head: true)
    clinicId
      ? supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId)
      : supabase.from('patients').select('*', { count: 'exact', head: true }),

    // 2. Records TODAY — visits created since midnight UTC
    clinicId
      ? supabase
          .from('visits')
          .select('id, patients!inner(clinic_id)', { count: 'exact', head: true })
          .eq('patients.clinic_id', clinicId)
          .gte('created_at', todayISO)
      : supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayISO),

    // 3. Pending sync — synced_at IS NULL means record has not been synced
    clinicId
      ? supabase
          .from('visits')
          .select('id, patients!inner(clinic_id)', { count: 'exact', head: true })
          .eq('patients.clinic_id', clinicId)
          .is('synced_at', null)
      : supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .is('synced_at', null),

    // 4. High-risk flagged — visits with urgency_score >= 4 (High or Critical on 1–5 scale)
    clinicId
      ? supabase
          .from('visits')
          .select('patient_id, patients!inner(clinic_id)')
          .eq('patients.clinic_id', clinicId)
          .gte('urgency_score', 4)
      : supabase
          .from('visits')
          .select('patient_id')
          .gte('urgency_score', 4),
  ]);

  // High-risk: deduplicate patient_ids client-side (avoids N+1 or custom RPC)
  let highRiskCount: number | null = null;
  if (highRiskRes.status === 'fulfilled' && highRiskRes.value.data) {
    const unique = new Set(
      (highRiskRes.value.data as Array<{ patient_id: string }>).map((v) => v.patient_id),
    );
    highRiskCount = unique.size;
  }

  return {
    totalPatients:
      patientsRes.status === 'fulfilled' ? (patientsRes.value.count ?? null) : null,
    recordsToday:
      todayRes.status === 'fulfilled' ? (todayRes.value.count ?? null) : null,
    pendingSync:
      pendingRes.status === 'fulfilled' ? (pendingRes.value.count ?? null) : null,
    highRiskFlagged: highRiskCount,
    errors: {
      totalPatients: patientsRes.status === 'rejected',
      recordsToday:  todayRes.status  === 'rejected',
      pendingSync:   pendingRes.status === 'rejected',
      highRiskFlagged: highRiskRes.status === 'rejected',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 11 — PATIENT RECORDS (search / filter / pagination)
// ═══════════════════════════════════════════════════════════════════════════════

export interface FetchPatientsOptions {
  clinicId: string | null;
  query: string;
  urgencyFilter: UrgencyLevel | 'All';
  page: number;
  pageSize: number;
}

export interface FetchPatientsResult {
  data: PatientWithLatestVisit[];
  count: number;
  error: string | null;
}

/**
 * Fetches patients with their most-recent visit urgency data.
 *
 * Strategy:
 *  - Without urgency filter → true server-side pagination via .range()
 *  - With urgency filter → fetch all name-matched patients, filter by latest
 *    visit urgency client-side, then paginate client-side.
 *    (Avoids N+1; acceptable for MVP until a DB view/RPC is added.)
 */
export async function fetchPatients(opts: FetchPatientsOptions): Promise<FetchPatientsResult> {
  const { clinicId, query, urgencyFilter, page, pageSize } = opts;
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  try {
    if (urgencyFilter === 'All') {
      // ── True server-side pagination ─────────────────────────────────────────
      let q = supabase
        .from('patients')
        .select('*, visits(id, urgency_score, created_at, synced_at)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (clinicId) q = q.eq('clinic_id', clinicId);
      if (query.trim()) q = q.ilike('name', `%${query.trim()}%`);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        data: resolveLatestVisit(data ?? []),
        count: count ?? 0,
        error: null,
      };
    }

    // ── Urgency filter: fetch all matches, filter + paginate client-side ──────
    let q = supabase
      .from('patients')
      .select('*, visits(id, urgency_score, created_at, synced_at)')
      .order('created_at', { ascending: false });

    if (clinicId) q = q.eq('clinic_id', clinicId);
    if (query.trim()) q = q.ilike('name', `%${query.trim()}%`);

    const { data, error } = await q;
    if (error) throw error;

    const { min, max } = urgencyScoreRange(urgencyFilter);

    const all = resolveLatestVisit(data ?? []).filter((p) => {
      const score = p.latest_visit?.urgency_score ?? null;
      if (urgencyFilter === 'Stable') return score === null || score < 20;
      if (score === null) return false;
      if (max !== null) return score >= min && score < max;
      return score >= min;
    });

    return {
      data: all.slice(from, to + 1),
      count: all.length,
      error: null,
    };
  } catch (err) {
    console.error('[adminService] fetchPatients:', err);
    return { data: [], count: 0, error: 'Failed to load patient records.' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 12 — STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all staff, optionally scoped to a clinic.
 * Joins with clinics table to get clinic name/zone.
 */
export async function fetchStaff(
  clinicId: string | null,
): Promise<{ data: StaffWithClinic[]; error: string | null }> {
  try {
    let q = supabase
      .from('staff')
      .select('*, clinics(name, zone)')
      .order('name', { ascending: true });

    if (clinicId) q = q.eq('clinic_id', clinicId);

    const { data, error } = await q;
    if (error) throw error;
    return { data: (data ?? []) as StaffWithClinic[], error: null };
  } catch (err) {
    console.error('[adminService] fetchStaff:', err);
    return { data: [], error: 'Failed to load staff records.' };
  }
}

export interface CreateStaffInput {
  name: string;
  email: string;
  role: StaffRole;
  clinic_id: string | null;
}

/**
 * Insert a new staff row.
 *
 * ⚠️  SECURITY NOTE: This creates ONLY the staff table row.
 * A corresponding Supabase Auth user must be created separately via the
 * Supabase Dashboard or a server-side Edge Function (which doesn't exist yet).
 * Never call the Supabase Admin Auth API from browser code with a service-role key.
 */
export async function createStaffRecord(
  input: CreateStaffInput,
): Promise<{ data: StaffWithClinic | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .insert({
        name: input.name,
        email: input.email,
        role: input.role,
        clinic_id: input.clinic_id,
      })
      .select('*, clinics(name, zone)')
      .single();

    if (error) throw error;
    return { data: data as StaffWithClinic, error: null };
  } catch (err) {
    console.error('[adminService] createStaffRecord:', err);
    return { data: null, error: 'Failed to create staff record.' };
  }
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  role?: StaffRole;
  clinic_id?: string | null;
}

/** Update editable staff fields. */
export async function updateStaffRecord(
  id: string,
  updates: UpdateStaffInput,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('staff').update(updates).eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[adminService] updateStaffRecord:', err);
    return { error: 'Failed to update staff record.' };
  }
}

/**
 * Soft-deactivate or reactivate a staff member.
 * Requires the `is_active` column — added by migration 20260904000001.
 */
export async function setStaffActive(
  id: string,
  isActive: boolean,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[adminService] setStaffActive:', err);
    const action = isActive ? 'reactivate' : 'deactivate';
    return {
      error: `Failed to ${action} staff member. Make sure you have applied the is_active migration SQL.`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 13 — HIGH-RISK / FLAGGED PATIENTS
// ═══════════════════════════════════════════════════════════════════════════════

export interface FetchHighRiskResult {
  data: PatientWithLatestVisit[];
  error: string | null;
}

/**
 * Returns patients whose MOST RECENT visit has urgency_score >= 40 (Moderate+).
 *
 * Algorithm:
 *  1. Fetch all visits with score >= 40, ordered by urgency_score DESC, then
 *     created_at DESC.
 *  2. Deduplicate by patient_id — because visits are already sorted, the first
 *     occurrence for each patient IS their most recent high-urgency visit.
 *  3. Return unique patients sorted by urgency (highest first).
 *
 * This avoids N+1 queries and produces correct "latest visit" semantics
 * without requiring a custom DB view or RPC.
 */
export async function fetchHighRiskPatients(
  clinicId: string | null,
): Promise<FetchHighRiskResult> {
  try {
    let q = supabase
      .from('visits')
      .select(
        'id, patient_id, staff_id, vitals, symptoms, symptom_category, diagnosis, urgency_score, created_at, synced_at, patients!inner(id, name, age, sex, village, clinic_id, created_at)',
      )
      .gte('urgency_score', 3)  // Moderate (3), High (4), Critical (5) on the 1–5 scale
      .order('urgency_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (clinicId) q = q.eq('patients.clinic_id', clinicId);

    const { data, error } = await q;
    if (error) throw error;

    // Deduplicate: first occurrence per patient = their most recent high-risk visit
    const seen = new Set<string>();
    const result: PatientWithLatestVisit[] = [];

    for (const row of data ?? []) {
      const patient = row.patients as unknown as PatientRow;
      if (!patient || seen.has(patient.id)) continue;
      seen.add(patient.id);

      result.push({
        ...patient,
        latest_visit: {
          id: row.id,
          patient_id: row.patient_id,
          staff_id: row.staff_id,
          vitals: row.vitals,
          symptoms: row.symptoms,
          symptom_category: row.symptom_category,
          diagnosis: row.diagnosis,
          urgency_score: row.urgency_score,
          created_at: row.created_at,
          synced_at: row.synced_at,
        } satisfies VisitRow,
      });
    }

    return { data: result, error: null };
  } catch (err) {
    console.error('[adminService] fetchHighRiskPatients:', err);
    return { data: [], error: 'Failed to load high-risk patients.' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

type RawPatientWithVisits = PatientRow & { visits: VisitRow[] };

/** For each patient, pick the most recent visit from the embedded visits array. */
function resolveLatestVisit(rows: RawPatientWithVisits[]): PatientWithLatestVisit[] {
  return rows.map((p) => {
    const sorted = (p.visits ?? []).slice().sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return { ...p, latest_visit: sorted[0] ?? null };
  });
}
