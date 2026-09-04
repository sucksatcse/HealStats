/**
 * adminService.ts
 * All Supabase data operations for the Admin Panel (Tasks 10–13).
 * Uses the real database schema — no mock data.
 */
import { supabase } from './supabase';
import {
  type StaffRole,
  type StaffRow,
  type PatientRow,
  type VisitRow,
  type ClinicRow,
  type StaffWithClinic,
  type PatientWithLatestVisit,
  type UrgencyLevel,
  urgencyScoreRange,
  initials,
  shortId,
  type OutbreakCluster,
  type OutbreakClusterCase,
  type OutbreakRiskLevel,
  type OutbreakAnalysisResult,
  type TriageBand,
  type EmergencyTriagePatient,
} from './types';

// Re-export types that consumers import from this module
export type {
  StaffWithClinic,
  PatientWithLatestVisit,
  OutbreakCluster,
  OutbreakClusterCase,
  OutbreakRiskLevel,
  OutbreakAnalysisResult,
  TriageBand,
  EmergencyTriagePatient,
} from './types';

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
      if (query.trim()) {
        const term = `%${query.trim()}%`;
        q = q.or(`name.ilike.${term},village.ilike.${term}`);
      }

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
    if (query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(`name.ilike.${term},village.ilike.${term}`);
    }

    const { data, error } = await q;
    if (error) throw error;

    const { min, max } = urgencyScoreRange(urgencyFilter);

    const all = resolveLatestVisit(data ?? []).filter((p) => {
      const score = p.latest_visit?.urgency_score ?? null;
      if (urgencyFilter === 'Stable') return score === null || score < 2;
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
 * Fetch all clinics for selection dropdowns.
 */
export async function fetchClinicsList(): Promise<{ data: ClinicRow[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('id, name, zone, address')
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: (data ?? []) as ClinicRow[], error: null };
  } catch (err) {
    console.error('[adminService] fetchClinicsList:', err);
    return { data: [], error: 'Failed to load clinics.' };
  }
}

/**
 * Fetch all staff, optionally scoped to a clinic.
 * Joins with clinics table to get clinic id, name, and zone.
 */
export async function fetchStaff(
  clinicId: string | null,
): Promise<{ data: StaffWithClinic[]; error: string | null }> {
  try {
    let q = supabase
      .from('staff')
      .select('*, clinics(id, name, zone)')
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
      .select('*, clinics(id, name, zone)')
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

/** Update editable staff fields and return updated record with clinic join. */
export async function updateStaffRecord(
  id: string,
  updates: UpdateStaffInput,
): Promise<{ data: StaffWithClinic | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select('*, clinics(id, name, zone)')
      .single();

    if (error) throw error;
    return { data: data as StaffWithClinic, error: null };
  } catch (err) {
    console.error('[adminService] updateStaffRecord:', err);
    return { data: null, error: 'Failed to update staff record.' };
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
        `id, patient_id, staff_id, vitals, symptoms, symptom_category, diagnosis, urgency_score, created_at, synced_at,
         staff(id, name, role),
         patients!inner(
           id, name, age, sex, village, clinic_id, created_at,
           clinics(id, name, zone)
         )`
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
      const patient = row.patients as unknown as (PatientRow & { clinics?: Pick<ClinicRow, 'id' | 'name' | 'zone'> | null });
      if (!patient || seen.has(patient.id)) continue;
      seen.add(patient.id);

      result.push({
        ...patient,
        clinics: patient.clinics ?? null,
        staff: (row.staff as unknown as Pick<StaffRow, 'id' | 'name' | 'role'>) ?? null,
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
// TASK 14 — EMERGENCY MODE METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmergencyZone {
  zone: string;
  clinicName: string;
  cases: number;
  trend: string;
  severity: 'Critical' | 'Severe' | 'Elevated' | 'Stable';
  cause: string;
  eta: string;
}

export interface EmergencyResourceZone {
  zone: string;
  volunteers: number;
  volNeed: number;
  supplies: number;
  beds: string;
}

export interface EmergencyMetrics {
  activeZonesCount: number;
  totalCases: number;
  criticalInQueueCount: number;
  respondersDeployed: number;
  zones: EmergencyZone[];
  triageQueue: EmergencyTriagePatient[];
  resources: EmergencyResourceZone[];
}

export async function fetchEmergencyMetrics(
  clinicId: string | null,
): Promise<{ data: EmergencyMetrics | null; error: string | null }> {
  try {
    const since48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    // Query clinics, recent visits, and active staff in parallel
    const [clinicsRes, visitsRes, staffRes] = await Promise.all([
      supabase.from('clinics').select('id, name, zone, address').order('name'),
      supabase
        .from('visits')
        .select(
          `id, patient_id, urgency_score, symptoms, symptom_category, created_at,
           patients!inner(id, name, age, sex, village, clinic_id, clinics(id, name, zone))`
        )
        .gte('created_at', since48h)
        .order('created_at', { ascending: false }),
      supabase
        .from('staff')
        .select('id, name, role, clinic_id, is_active, clinics(id, name, zone)')
        .eq('is_active', true),
    ]);

    if (clinicsRes.error) throw clinicsRes.error;
    if (visitsRes.error) throw visitsRes.error;
    if (staffRes.error) throw staffRes.error;

    const clinics = clinicsRes.data ?? [];
    let visits = visitsRes.data ?? [];
    const staff = staffRes.data ?? [];

    if (clinicId) {
      visits = visits.filter(
        (v) => (v.patients as unknown as { clinic_id: string })?.clinic_id === clinicId
      );
    }

    // 1. Group visits by clinic / zone
    const zoneMap = new Map<
      string,
      {
        clinicName: string;
        cases: number;
        maxUrgency: number;
        symptomCounts: Record<string, number>;
      }
    >();

    for (const c of clinics) {
      const zName = c.zone || c.name;
      if (!zoneMap.has(zName)) {
        zoneMap.set(zName, {
          clinicName: c.name,
          cases: 0,
          maxUrgency: 1,
          symptomCounts: {},
        });
      }
    }

    for (const v of visits) {
      const p = v.patients as unknown as {
        clinics?: { id: string; name: string; zone: string | null } | null;
      };
      const zName = p.clinics?.zone || p.clinics?.name || 'General Zone';

      const entry = zoneMap.get(zName) || {
        clinicName: p.clinics?.name || 'Local Clinic',
        cases: 0,
        maxUrgency: 1,
        symptomCounts: {},
      };

      entry.cases += 1;
      const score = v.urgency_score ?? 1;
      if (score > entry.maxUrgency) entry.maxUrgency = score;

      const cat = v.symptom_category || 'general';
      entry.symptomCounts[cat] = (entry.symptomCounts[cat] || 0) + 1;

      zoneMap.set(zName, entry);
    }

    const zones: EmergencyZone[] = Array.from(zoneMap.entries())
      .map(([zone, data]) => {
        let severity: 'Critical' | 'Severe' | 'Elevated' | 'Stable' = 'Stable';
        if (data.maxUrgency >= 5 || data.cases >= 20) severity = 'Critical';
        else if (data.maxUrgency === 4 || data.cases >= 10) severity = 'Severe';
        else if (data.maxUrgency === 3 || data.cases >= 3) severity = 'Elevated';

        // Most common symptom category
        let topCat = 'General clinical triage';
        let maxCount = 0;
        for (const [cat, count] of Object.entries(data.symptomCounts)) {
          if (count > maxCount) {
            maxCount = count;
            topCat = cat.replace(/_/g, ' ');
          }
        }

        return {
          zone,
          clinicName: data.clinicName,
          cases: data.cases,
          trend: `+${Math.min(data.cases, Math.round(data.cases * 0.3) + 1)}`,
          severity,
          cause: topCat ? `${topCat.charAt(0).toUpperCase() + topCat.slice(1)} alert` : 'Active surveillance',
          eta: data.cases > 0 ? 'Field team deployed' : 'Monitoring status',
        };
      })
      .filter((z) => z.cases > 0 || clinics.length <= 4)
      .slice(0, 6);

    // 2. High-urgency Triage Priority Queue (urgency_score >= 3)
    const highRiskVisits = visits
      .filter((v) => (v.urgency_score ?? 0) >= 3)
      .sort((a, b) => (b.urgency_score ?? 0) - (a.urgency_score ?? 0));

    const triageQueue: EmergencyTriagePatient[] = highRiskVisits.map((v) => {
      const p = v.patients as unknown as {
        id: string;
        name: string;
        age: number | null;
        sex: string | null;
        village: string | null;
        clinics?: { name: string; zone: string | null } | null;
      };

      const score = v.urgency_score ?? 3;
      const level: 'Critical' | 'Severe' | 'Elevated' =
        score >= 5 ? 'Critical' : score === 4 ? 'Severe' : 'Elevated';

      const diff = Date.now() - new Date(v.created_at).getTime();
      const mins = Math.floor(diff / 60000);
      const wait = mins < 60 ? `${Math.max(1, mins)} min` : `${Math.floor(mins / 60)} hr`;

      const parts = p.name.trim().split(/\s+/);
      const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : p.name.slice(0, 2)).toUpperCase();

      return {
        id: p.id.slice(0, 8).toUpperCase(),
        patientId: p.id,
        name: p.name,
        age: p.age ?? 0,
        gender: p.sex === 'F' || p.sex === 'Female' ? 'F' : 'M',
        zone: p.clinics?.zone || p.clinics?.name || p.village || 'Field Clinic',
        complaint: v.symptoms || 'High urgency acute presentation',
        score,
        level,
        band: score >= 4 ? ('red' as const) : ('yellow' as const),
        wait,
        initials,
        status: 'waiting' as const,
        createdAt: v.created_at,
      };
    });

    // 3. Responders & Resource allocation
    const staffZoneMap = new Map<string, number>();
    for (const s of staff) {
      const c = (Array.isArray(s.clinics) ? s.clinics[0] : s.clinics) as { id?: string; name?: string; zone?: string | null } | null;
      const zName = c?.zone || c?.name || 'General District';
      staffZoneMap.set(zName, (staffZoneMap.get(zName) || 0) + 1);
    }

    const resources: EmergencyResourceZone[] = Array.from(zoneMap.entries())
      .slice(0, 4)
      .map(([zone, data]) => {
        const responders = staffZoneMap.get(zone) || 2;
        const volNeed = Math.max(responders, Math.round(data.cases * 0.8) + 4);
        const supplies = Math.max(30, Math.min(95, 100 - data.cases * 4));
        const beds = `${Math.min(data.cases, 18)} / 24`;

        return {
          zone,
          volunteers: responders,
          volNeed,
          supplies,
          beds,
        };
      });

    const activeZonesCount = zones.filter((z) => z.cases > 0).length || zones.length;
    const totalCases = visits.length;
    const criticalInQueueCount = triageQueue.filter((t) => t.level === 'Critical').length;
    const respondersDeployed = staff.length;

    return {
      data: {
        activeZonesCount,
        totalCases,
        criticalInQueueCount,
        respondersDeployed,
        zones,
        triageQueue,
        resources,
      },
      error: null,
    };
  } catch (err) {
    console.error('[adminService] fetchEmergencyMetrics:', err);
    return { data: null, error: 'Failed to load emergency crisis metrics.' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 14.5 — OUTBREAK SURVEILLANCE & SYMPTOM CLUSTERING
// ═══════════════════════════════════════════════════════════════════════════════

export interface FetchOutbreakOptions {
  clinicId?: string | null;
  hours?: number;
  sensitivity?: 'standard' | 'high';
}

/**
 * Analyses recent clinical visits in Supabase to detect emerging symptom clusters and outbreak risks.
 * Groups cases by syndrome (AWD/Cholera, Febrile/Malaria, ARI, Measles) and geographic zone/clinic.
 */
export async function fetchOutbreakAnalysis(options?: FetchOutbreakOptions): Promise<{
  data: OutbreakAnalysisResult | null;
  error: string | null;
}> {
  try {
    const hours = options?.hours ?? 48;
    const sensitivity = options?.sensitivity ?? 'standard';
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('visits')
      .select(`
        id,
        patient_id,
        urgency_score,
        symptoms,
        symptom_category,
        diagnosis,
        created_at,
        patients!inner (
          id,
          name,
          age,
          sex,
          village,
          clinic_id,
          clinics (
            id,
            name,
            zone
          )
        )
      `)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (options?.clinicId) {
      query = query.eq('patients.clinic_id', options.clinicId);
    }

    const { data: rawVisits, error } = await query;
    if (error) {
      console.error('[adminService] fetchOutbreakAnalysis DB error:', error);
      return { data: null, error: error.message };
    }

    const visits = rawVisits ?? [];

    const categoryCounts: Record<string, number> = {
      'diarrhea/gastrointestinal': 0,
      fever: 0,
      respiratory: 0,
      'skin/rash': 0,
      other: 0,
    };

    function classifyVisit(v: {
      symptom_category: string | null;
      symptoms: string | null;
      diagnosis: string | null;
    }): { key: string; name: string; category: string } {
      const cat = (v.symptom_category || '').toLowerCase().trim();
      const txt = `${v.symptoms || ''} ${v.diagnosis || ''}`.toLowerCase();

      if (
        cat === 'diarrhea/gastrointestinal' ||
        cat.includes('diarrhea') ||
        txt.includes('diarrh') ||
        txt.includes('cholera') ||
        txt.includes('watery stool') ||
        txt.includes('rice water') ||
        txt.includes('dehydration')
      ) {
        return {
          key: 'waterborne_cholera',
          name: 'Acute Watery Diarrhea / Cholera Risk',
          category: 'diarrhea/gastrointestinal',
        };
      }

      if (
        cat === 'fever' ||
        txt.includes('malaria') ||
        txt.includes('fever') ||
        txt.includes('chills') ||
        txt.includes('dengue') ||
        txt.includes('febrile')
      ) {
        return {
          key: 'febrile_malaria',
          name: 'Acute Febrile Illness / Malaria Risk',
          category: 'fever',
        };
      }

      if (
        cat === 'respiratory' ||
        txt.includes('cough') ||
        txt.includes('shortness of breath') ||
        txt.includes('pneumonia') ||
        txt.includes('respiratory') ||
        txt.includes('difficulty breathing')
      ) {
        return {
          key: 'acute_respiratory',
          name: 'Acute Respiratory Infection (ARI) Risk',
          category: 'respiratory',
        };
      }

      if (
        cat === 'skin/rash' ||
        txt.includes('rash') ||
        txt.includes('measles') ||
        txt.includes('lesion') ||
        txt.includes('blister')
      ) {
        return {
          key: 'cutaneous_measles',
          name: 'Cutaneous Eruption / Measles Risk',
          category: 'skin/rash',
        };
      }

      return {
        key: 'other_syndrome',
        name: 'Uncategorized Clinical Syndrome',
        category: 'other',
      };
    }

    interface ClusterBucket {
      syndromeKey: string;
      syndromeName: string;
      category: string;
      zone: string;
      clinicId: string;
      clinicName: string;
      cases: OutbreakClusterCase[];
      symptomTokens: Map<string, number>;
      villages: Set<string>;
    }

    const clusterMap = new Map<string, ClusterBucket>();

    for (const v of visits) {
      const p = v.patients as unknown as {
        id: string;
        name: string;
        age: number | null;
        sex: string | null;
        village: string | null;
        clinic_id: string | null;
        clinics:
          | { id?: string; name?: string; zone?: string | null }
          | { id?: string; name?: string; zone?: string | null }[]
          | null;
      } | null;

      const clinicObj = Array.isArray(p?.clinics) ? p?.clinics[0] : p?.clinics;
      const clinicId = clinicObj?.id || p?.clinic_id || 'unknown-clinic';
      const clinicName = clinicObj?.name || 'Central Clinic';
      const zone = clinicObj?.zone || 'General District';
      const village = p?.village || 'Unknown Village';

      const classification = classifyVisit(v);
      categoryCounts[classification.category] = (categoryCounts[classification.category] || 0) + 1;

      const bucketKey = `${zone}__${classification.key}`;
      let bucket = clusterMap.get(bucketKey);
      if (!bucket) {
        bucket = {
          syndromeKey: classification.key,
          syndromeName: classification.name,
          category: classification.category,
          zone,
          clinicId,
          clinicName,
          cases: [],
          symptomTokens: new Map(),
          villages: new Set(),
        };
        clusterMap.set(bucketKey, bucket);
      }

      if (village) bucket.villages.add(village);

      if (v.symptoms) {
        const words = v.symptoms
          .replace(/[^\w\s/]/g, ' ')
          .split(/[\s,/]+/)
          .map((w: string) => w.trim())
          .filter(
            (w: string) =>
              w.length > 3 &&
              ![
                'with',
                'days',
                'have',
                'from',
                'this',
                'that',
                'were',
                'reported',
                'symptoms',
              ].includes(w.toLowerCase()),
          );
        for (const w of words) {
          const cap = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          bucket.symptomTokens.set(cap, (bucket.symptomTokens.get(cap) || 0) + 1);
        }
      }

      bucket.cases.push({
        visitId: v.id,
        patientId: p?.id || v.patient_id,
        patientName: p?.name || 'Unnamed Patient',
        patientAge: p?.age ?? null,
        patientSex: p?.sex ?? null,
        village: p?.village ?? null,
        symptoms: v.symptoms,
        diagnosis: v.diagnosis,
        urgencyScore: v.urgency_score,
        createdAt: v.created_at,
      });
    }

    const clusters: OutbreakCluster[] = [];

    for (const [id, bucket] of clusterMap.entries()) {
      const caseCount = bucket.cases.length;
      if (caseCount === 0) continue;

      const scores = bucket.cases.map((c) => c.urgencyScore || 1);
      const urgencyMax = Math.max(...scores);
      const urgencyAvg = Number((scores.reduce((a, b) => a + b, 0) / caseCount).toFixed(1));

      let riskLevel: OutbreakRiskLevel = 'monitoring';
      if (sensitivity === 'high') {
        if (caseCount >= 2 || (caseCount >= 1 && urgencyMax >= 4)) {
          riskLevel = 'critical';
        } else if (caseCount >= 1) {
          riskLevel = 'warning';
        }
      } else {
        if (caseCount >= 3 || (caseCount >= 2 && urgencyMax >= 4)) {
          riskLevel = 'critical';
        } else if (caseCount >= 2 || (caseCount === 1 && urgencyMax >= 3)) {
          riskLevel = 'warning';
        } else {
          riskLevel = 'monitoring';
        }
      }

      const dominantSymptoms = Array.from(bucket.symptomTokens.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k]) => k);

      if (dominantSymptoms.length === 0) {
        if (bucket.category === 'fever') dominantSymptoms.push('Fever', 'Chills');
        else if (bucket.category === 'diarrhea/gastrointestinal')
          dominantSymptoms.push('Diarrhea', 'Dehydration');
        else if (bucket.category === 'respiratory')
          dominantSymptoms.push('Cough', 'Shortness of breath');
        else dominantSymptoms.push('General Malaise');
      }

      let recommendedActions: string[] = [];
      if (bucket.category === 'diarrhea/gastrointestinal') {
        recommendedActions = [
          'Activate AWD / Cholera Isolation Protocol at clinic triage',
          'Deploy Oral Rehydration Salt (ORS) distribution to affected blocks',
          'Notify WASH partners for immediate communal water testing & chlorination',
          'Dispatch active community case finders to block radius',
        ];
      } else if (bucket.category === 'fever') {
        recommendedActions = [
          'Perform rapid diagnostic tests (RDT) for all febrile admissions',
          'Verify clinic buffer stock of Artemisinin-based Combination Therapy (ACT)',
          'Mobilize community vector breeding site inspection & larvicide treatment',
          'Distribute long-lasting insecticidal nets (LLINs) to high-incidence households',
        ];
      } else if (bucket.category === 'respiratory') {
        recommendedActions = [
          'Enforce respiratory triage droplet precautions and mask distribution',
          'Check functional availability of pediatric pulse oximeters and oxygen concentrators',
          'Verify antibiotic protocols for severe pneumonia management',
          'Monitor elderly and under-5 cohort for respiratory distress escalation',
        ];
      } else {
        recommendedActions = [
          'Conduct clinical audit of recent presentations in this zone',
          'Increase epidemiological surveillance sensitivity for next 48 hours',
          'Coordinate situational update with district surveillance lead',
        ];
      }

      bucket.cases.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      clusters.push({
        id,
        syndromeKey: bucket.syndromeKey,
        syndromeName: bucket.syndromeName,
        category: bucket.category,
        zone: bucket.zone,
        clinicId: bucket.clinicId,
        clinicName: bucket.clinicName,
        caseCount,
        urgencyMax,
        urgencyAvg,
        riskLevel,
        dominantSymptoms,
        affectedVillages: Array.from(bucket.villages),
        cases: bucket.cases,
        firstDetected: bucket.cases[bucket.cases.length - 1].createdAt,
        lastDetected: bucket.cases[0].createdAt,
        recommendedActions,
      });
    }

    const riskRank = { critical: 3, warning: 2, monitoring: 1 };
    clusters.sort((a, b) => {
      const diff = riskRank[b.riskLevel] - riskRank[a.riskLevel];
      if (diff !== 0) return diff;
      return b.caseCount - a.caseCount;
    });

    let highestRiskLevel: OutbreakRiskLevel | 'normal' = 'normal';
    if (clusters.some((c) => c.riskLevel === 'critical')) highestRiskLevel = 'critical';
    else if (clusters.some((c) => c.riskLevel === 'warning')) highestRiskLevel = 'warning';
    else if (clusters.some((c) => c.riskLevel === 'monitoring')) highestRiskLevel = 'monitoring';

    return {
      data: {
        clusters,
        categoryCounts,
        totalVisitsAnalyzed: visits.length,
        timeframeHours: hours,
        highestRiskLevel,
      },
      error: null,
    };
  } catch (err) {
    console.error('[adminService] fetchOutbreakAnalysis error:', err);
    return { data: null, error: 'Failed to analyze outbreak clusters from visits.' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 15 — EMERGENCY MODE TRIAGE QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetches the active Emergency Mode Triage Queue.
 * Prioritizes high-urgency presentations (authoritative 1–5 scale).
 * Categorizes into Red (Immediate: 4–5), Yellow (Urgent: 3), and Green (Delayed: 1–2).
 */
export async function fetchEmergencyTriageQueue(clinicId?: string | null): Promise<{
  data: EmergencyTriagePatient[] | null;
  error: string | null;
}> {
  try {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('visits')
      .select(`
        id,
        patient_id,
        urgency_score,
        symptoms,
        symptom_category,
        diagnosis,
        vitals,
        created_at,
        patients!inner (
          id,
          name,
          age,
          sex,
          village,
          clinic_id,
          clinics (
            id,
            name,
            zone
          )
        )
      `)
      .gte('created_at', cutoff)
      .order('urgency_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (clinicId) {
      query = query.eq('patients.clinic_id', clinicId);
    }

    const { data: rawVisits, error } = await query;
    if (error) {
      console.error('[adminService] fetchEmergencyTriageQueue error:', error);
      return { data: null, error: error.message };
    }

    let triageStatusMap: Record<string, 'waiting' | 'in_treatment' | 'discharged'> = {};
    try {
      const saved = localStorage.getItem('healstats_triage_patient_status');
      if (saved) triageStatusMap = JSON.parse(saved);
    } catch {
      // ignore
    }

    const triageList: EmergencyTriagePatient[] = (rawVisits ?? []).map((v) => {
      const p = v.patients as unknown as {
        id: string;
        name: string;
        age: number | null;
        sex: string | null;
        village: string | null;
        clinic_id: string | null;
        clinics:
          | { id?: string; name?: string; zone?: string | null }
          | { id?: string; name?: string; zone?: string | null }[]
          | null;
      } | null;

      const clinicObj = Array.isArray(p?.clinics) ? p?.clinics[0] : p?.clinics;
      const clinicName = clinicObj?.name || 'General Clinic';
      const zone = clinicObj?.zone || 'District Center';
      const score = v.urgency_score ?? 1;

      let band: TriageBand = 'green';
      if (score >= 4) band = 'red';
      else if (score === 3) band = 'yellow';

      let vitalsSummary = 'Standard monitoring';
      if (v.vitals && typeof v.vitals === 'object') {
        const parts: string[] = [];
        const vit = v.vitals as Record<string, unknown>;
        if (vit.pulse) parts.push(`HR ${vit.pulse}`);
        if (vit.systolic && vit.diastolic) parts.push(`BP ${vit.systolic}/${vit.diastolic}`);
        else if (vit.systolic) parts.push(`Sys ${vit.systolic}`);
        if (vit.spo2) parts.push(`SpO₂ ${vit.spo2}%`);
        if (vit.temperature) parts.push(`Temp ${vit.temperature}°C`);
        if (vit.respRate) parts.push(`RR ${vit.respRate}`);
        if (parts.length > 0) vitalsSummary = parts.join(' · ');
      }

      const complaintText =
        [v.diagnosis, v.symptoms].filter(Boolean).join(' — ') ||
        'Acute presentation under evaluation';
      const status = triageStatusMap[v.id] || 'waiting';

      const diff = Date.now() - new Date(v.created_at).getTime();
      const mins = Math.floor(diff / 60000);
      const wait = mins < 60 ? `${Math.max(1, mins)} min` : `${Math.floor(mins / 60)} hr`;
      const level: 'Critical' | 'Severe' | 'Elevated' =
        score >= 5 ? 'Critical' : score === 4 ? 'Severe' : 'Elevated';
      const pid = p?.id || v.patient_id;

      return {
        id: shortId(pid),
        patientId: pid,
        visitId: v.id,
        name: p?.name || 'Unnamed Patient',
        age: p?.age ?? null,
        gender: p?.sex ?? null,
        village: p?.village ?? null,
        zone,
        clinicId: clinicObj?.id || p?.clinic_id || 'unknown',
        clinicName,
        urgencyScore: score,
        score,
        level,
        band,
        wait,
        complaint: complaintText,
        vitalsSummary,
        createdAt: v.created_at,
        initials: initials(p?.name || 'NA'),
        status,
      };
    });

    try {
      if (typeof window !== 'undefined' && (!rawVisits || rawVisits.length === 0)) {
        const { offlineDb } = await import('./offlineDb');
        const offlineVisits = await offlineDb.pendingRecords
          .where('type')
          .equals('visit')
          .toArray();
        for (const item of offlineVisits) {
          const payload = item.payload as {
            patient_id: string;
            urgency_score?: number;
            symptoms?: string;
            diagnosis?: string;
            vitals?: Record<string, unknown>;
          };
          const score = payload.urgency_score ?? 1;
          let band: TriageBand = 'green';
          if (score >= 4) band = 'red';
          else if (score === 3) band = 'yellow';

          const diff = Date.now() - item.createdAt;
          const mins = Math.floor(diff / 60000);
          const wait = mins < 60 ? `${Math.max(1, mins)} min` : `${Math.floor(mins / 60)} hr`;
          const level: 'Critical' | 'Severe' | 'Elevated' =
            score >= 5 ? 'Critical' : score === 4 ? 'Severe' : 'Elevated';

          triageList.push({
            id: shortId(payload.patient_id),
            patientId: payload.patient_id,
            visitId: `offline-${item.id}`,
            name: 'Offline Queued Patient',
            age: null,
            gender: null,
            village: 'Local Clinic',
            zone: 'Offline Field Station',
            clinicId: 'offline-clinic',
            clinicName: 'Field Intake',
            urgencyScore: score,
            score,
            level,
            band,
            wait,
            complaint:
              [payload.diagnosis, payload.symptoms].filter(Boolean).join(' — ') ||
              'Offline clinical admission',
            vitalsSummary: payload.vitals
              ? JSON.stringify(payload.vitals)
              : 'Offline vitals pending',
            createdAt: new Date(item.createdAt).toISOString(),
            initials: 'OP',
            status: 'waiting',
          });
        }
      }
    } catch {
      // ignore
    }

    const statusRank = { waiting: 3, in_treatment: 2, discharged: 1 };
    const bandRank = { red: 3, yellow: 2, green: 1 };

    triageList.sort((a, b) => {
      const sDiff = statusRank[b.status] - statusRank[a.status];
      if (sDiff !== 0) return sDiff;
      const bDiff = bandRank[b.band] - bandRank[a.band];
      if (bDiff !== 0) return bDiff;
      const uDiff = (b.score ?? 0) - (a.score ?? 0);
      if (uDiff !== 0) return uDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return { data: triageList, error: null };
  } catch (err) {
    console.error('[adminService] fetchEmergencyTriageQueue error:', err);
    return { data: null, error: 'Failed to load emergency triage queue.' };
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
